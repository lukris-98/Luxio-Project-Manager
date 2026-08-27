// =====================================================================
// push.rs — Web Push (notifikasi walau aplikasi tertutup) + blok data
// pribadi terenkripsi (sinkronisasi lintas perangkat).
// =====================================================================
// Dependencies: web_push crate untuk enkripsi aes128gcm + VAPID.
// Environment backend:
//   VAPID_SUBJECT (mis. mailto:hello@luxio.id)
//   VAPID_PUBLIC_KEY  (base64url, pasangan dari public key di frontend)
//   VAPID_PRIVATE_KEY (base64url)
// =====================================================================

use axum::{extract::State, http::StatusCode, response::Json};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::collections::HashMap;

use crate::handlers::require_auth;
use crate::owner::is_owner;

#[derive(Deserialize)]
pub struct SubscribePayload {
    pub endpoint: String,
    #[serde(default)]
    pub p256dh: String,
    #[serde(default)]
    pub auth: String,
}

#[derive(Deserialize)]
pub struct SendPayload {
    #[serde(default)]
    pub user_id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub url: String,
}

/// POST /api/push/subscribe — simpan subscription push user.
pub async fn push_subscribe(
    State(state): State<crate::AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SubscribePayload>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if payload.endpoint.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    // Hapus endpoint lama lalu simpan yang baru (atau upsert).
    sqlx::query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2")
        .bind(&user_id)
        .bind(&payload.endpoint)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    sqlx::query(
        "INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&payload.endpoint)
    .bind(&payload.p256dh)
    .bind(&payload.auth)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!({ "ok": true })))
}

/// POST /api/push/unsubscribe — hapus subscription push.
pub async fn push_unsubscribe(
    State(state): State<crate::AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SubscribePayload>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    sqlx::query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2")
        .bind(&user_id)
        .bind(&payload.endpoint)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!({ "ok": true })))
}

/// POST /api/push/send — kirim push ke user (user_id kosong => semua user
/// dalam workspace/akun). Khusus owner/super_admin/admin.
pub async fn push_send(
    State(state): State<crate::AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<SendPayload>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &actor_id).await? {
        // Izinkan super_admin/admin juga.
        let role: String = sqlx::query_scalar("SELECT role FROM users WHERE id = $1")
            .bind(&actor_id)
            .fetch_one(&state.db)
            .await
            .map_err(|_| StatusCode::FORBIDDEN)?;
        if role != "super_admin" && role != "admin" {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    let mut q = "SELECT endpoint, p256dh, auth FROM push_subscriptions".to_string();
    let mut params: Vec<String> = Vec::new();
    if !payload.user_id.is_empty() {
        q += " WHERE user_id = $1";
        params.push(payload.user_id.clone());
    }

    let rows: Vec<(String, String, String)> = sqlx::query_as(&q)
        .bind(&params)
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if rows.is_empty() {
        return Ok(Json(json!({ "sent": 0, "message": "Tidak ada subscription push." })));
    }

    let vapid_subject = std::env::var("VAPID_SUBJECT").unwrap_or_default();
    let vapid_public = std::env::var("VAPID_PUBLIC_KEY").unwrap_or_default();
    let vapid_private = std::env::var("VAPID_PRIVATE_KEY").unwrap_or_default();
    if vapid_subject.is_empty() || vapid_public.is_empty() || vapid_private.is_empty() {
        return Ok(Json(json!({
            "sent": 0,
            "message": "VAPID keys belum dikonfigurasi di backend (VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)."
        })));
    }

    let signature = VapidSignature::new(vapid_subject, &vapid_public, &vapid_private)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let mut client = WebPushClient::new(&signature, reqwest::Client::new())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let message = json!({
        "title": payload.title,
        "body": payload.body,
        "url": payload.url,
    });
    let mut sent = 0usize;
    let mut failed = 0usize;

    for (endpoint, p256dh, auth) in rows {
        let sub = match SubscriptionInfo::new(endpoint, p256dh, auth) {
            Ok(s) => s,
            Err(_) => { failed += 1; continue; }
        };
        let mut builder = match WebPushMessageBuilder::new(&sub) {
            Ok(b) => b,
            Err(_) => { failed += 1; continue; }
        };
        if builder.set_payload(ContentEncoding::Aes128Gcm, message.to_string()).is_err() {
            failed += 1;
            continue;
        }
        let msg = match builder.build() {
            Ok(m) => m,
            Err(_) => { failed += 1; continue; }
        };
        match client.send(msg).await {
            Ok(_) => sent += 1,
            Err(_) => failed += 1,
        }
    }

    Ok(Json(json!({ "sent": sent, "failed": failed })))
}

/// GET /api/sync/blob/{key} — ambil blob terenkripsi user (mis. 'sync-all').
pub async fn blob_get(
    State(state): State<crate::AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(key): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let payload: Option<String> = sqlx::query_scalar(
        "SELECT payload FROM user_data_blobs WHERE user_id = $1 AND blob_key = $2",
    )
    .bind(&user_id)
    .bind(&key)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!({ "key": key, "payload": payload.unwrap_or_default() })))
}

/// PUT /api/sync/blob/{key} — simpan blob terenkripsi user.
pub async fn blob_put(
    State(state): State<crate::AppState>,
    headers: axum::http::HeaderMap,
    axum::extract::Path(key): axum::extract::Path<String>,
    payload: axum::extract::Json<BlobPutPayload>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    sqlx::query(
        "INSERT INTO user_data_blobs (id, user_id, blob_key, payload, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, blob_key)
         DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
    )
    .bind(uuid::Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&key)
    .bind(&payload.payload)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!({ "ok": true, "key": key })))
}

#[derive(Deserialize)]
pub struct BlobPutPayload {
    pub payload: String,
}

// Type alias agar handler singkat; web_push crate menyediakan tipe di bawah.
use web_push::{
    ContentEncoding, SubscriptionInfo, VapidSignature, WebPushClient, WebPushMessageBuilder,
};

#[allow(dead_code)]
fn _map_endpoints(rows: Vec<(String, String, String)>) -> HashMap<String, (String, String)> {
    // helper (tidak dipakai langsung; listrik typing untuk referensi)
    let _ = rows;
    HashMap::new()
}
