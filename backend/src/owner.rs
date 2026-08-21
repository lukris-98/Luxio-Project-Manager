use axum::{
    extract::{Query, State},
    http::HeaderMap,
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::AppState;
use crate::handlers::require_auth;
use crate::models::{AttendanceRequest, AttendanceQuery, OwnerConfigRequest};

// =====================================================================
// OWNER DASHBOARD — analytics (Umami), database (Neon), storage
// (Backblaze B2), log aktivitas, profil views, absensi.
// =====================================================================
// Konfigurasi (share URL Umami, API key Neon, kredensial B2) disimpan di
// tabel `owner_config` dengan kunci JSON. Kredensial TIDAK pernah
// dikembalikan utuh ke client — hanya status "terkonfigurasi".

async fn is_owner(db: &PgPool, user_id: &str) -> Result<bool, StatusCode> {
    let row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    match row {
        Some(r) => Ok(r.get::<String, _>("role") == "owner"),
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

async fn cfg_get_async(db: &PgPool, key: &str) -> Option<Value> {
    let row = sqlx::query("SELECT value FROM owner_config WHERE key = $1")
        .bind(key)
        .fetch_optional(db)
        .await
        .ok()?;
    row.map(|r| {
        let v: sqlx::types::Json<Value> = r.get("value");
        v.0
    })
}

async fn cfg_put(db: &PgPool, key: &str, value: Value) -> Result<(), StatusCode> {
    let val = sqlx::types::Json(value);
    sqlx::query(
        "INSERT INTO owner_config (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3",
    )
    .bind(key)
    .bind(val)
    .bind(Utc::now())
    .execute(db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    Ok(())
}

/// PUT /api/owner/config — simpan konfigurasi owner (umami, neon, backblaze).
pub async fn owner_config(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<OwnerConfigRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    // Kunci yang diizinkan — tidak menerima sembarang key.
    let allowed = ["umami", "neon", "backblaze"];
    if !allowed.contains(&payload.key.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    cfg_put(&state.db, &payload.key, payload.value).await?;
    Ok(Json(json!({ "ok": true, "key": payload.key })))
}

/// GET /api/owner/config — baca konfigurasi owner (tanpa rahasia utuh).
pub async fn owner_get_config(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let umami = cfg_get_async(&state.db, "umami").await.unwrap_or_else(|| json!({}));
    let neon = cfg_get_async(&state.db, "neon").await.unwrap_or_else(|| json!({}));
    let backblaze = cfg_get_async(&state.db, "backblaze").await.unwrap_or_else(|| json!({}));

    Ok(Json(json!({
        "umami": {
            "share_url": umami.get("share_url").and_then(|v| v.as_str()).unwrap_or(""),
            "website_id": umami.get("website_id").and_then(|v| v.as_str()).unwrap_or(""),
        },
        "neon": {
            "api_key_set": !neon.get("api_key").and_then(|v| v.as_str()).unwrap_or("").is_empty(),
            "projects": neon.get("projects").cloned().unwrap_or_else(|| json!([])),
        },
        "backblaze": {
            "key_id_set": !backblaze.get("key_id").and_then(|v| v.as_str()).unwrap_or("").is_empty(),
            "bucket_name": backblaze.get("bucket_name").and_then(|v| v.as_str()).unwrap_or(""),
            "endpoint": backblaze.get("endpoint").and_then(|v| v.as_str()).unwrap_or(""),
        },
    })))
}

/// GET /api/owner/logs — log aktivitas seluruh sistem (khusus owner).
pub async fn owner_logs(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let rows = sqlx::query(
        "SELECT l.id, l.actor_type, l.user_id, u.name AS user_name, u.email AS user_email,
                l.tool_name, l.action, l.target_resource, l.result, l.detail, l.created_at
         FROM audit_logs l
         LEFT JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC
         LIMIT 200",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let logs: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "actor_type": r.get::<String, _>("actor_type"),
                "user_id": r.get::<String, _>("user_id"),
                "user_name": r.get::<Option<String>, _>("user_name"),
                "user_email": r.get::<Option<String>, _>("user_email"),
                "tool_name": r.get::<Option<String>, _>("tool_name"),
                "action": r.get::<Option<String>, _>("action"),
                "target_resource": r.get::<Option<String>, _>("target_resource"),
                "result": r.get::<String, _>("result"),
                "detail": r.get::<Option<String>, _>("detail"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "logs": logs })))
}

/// GET /api/owner/neon/status — cek kuota/pemakaian database Neon via API.
pub async fn neon_status(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let neon = cfg_get_async(&state.db, "neon").await.unwrap_or_else(|| json!({}));
    let api_key = neon.get("api_key").and_then(|v| v.as_str()).unwrap_or("").to_string();
    if api_key.is_empty() {
        return Ok(Json(json!({ "configured": false, "message": "API key Neon belum diatur." })));
    }

    // Panggil Neon API: daftar project + konsumsi.
    let client = reqwest::Client::new();
    let base = "https://console.neon.tech/api/v2";

    let projects = client
        .get(format!("{base}/projects"))
        .header("Authorization", format!("Bearer {api_key}"))
        .send()
        .await
        .map_err(|e| StatusCode::BAD_GATEWAY) // infra error, biarkan client retry
        .and_then(|r| r.error_for_status().map_err(|_| StatusCode::BAD_GATEWAY))
        .map_err(|_| StatusCode::BAD_GATEWAY)?;
    let projects = projects
        .json::<Value>()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    // Konsumsi per project (v2).
    let consumption_resp = client
        .get(format!("{base}/consumption_history/v2/projects"))
        .header("Authorization", format!("Bearer {api_key}"))
        .send()
        .await;
    let consumption = match consumption_resp {
        Ok(r) => match r.error_for_status() {
            Ok(r2) => r2.json::<Value>().await.ok(),
            Err(_) => None,
        },
        Err(_) => None,
    };

    Ok(Json(json!({
        "configured": true,
        "projects": projects.get("projects").cloned().unwrap_or_else(|| json!([])),
        "consumption": consumption,
    })))
}

/// GET /api/owner/b2/status — cek akun Backblaze B2 via API.
pub async fn b2_status(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let b2 = cfg_get_async(&state.db, "backblaze").await.unwrap_or_else(|| json!({}));
    let key_id = b2.get("key_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let app_key = b2.get("application_key").and_then(|v| v.as_str()).unwrap_or("").to_string();
    if key_id.is_empty() || app_key.is_empty() {
        return Ok(Json(json!({ "configured": false, "message": "Kredensial B2 belum diatur." })));
    }

    // b2_authorize_account
    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.backblazeb2.com/b2api/v3/b2_authorize_account")
        .basic_auth(&key_id, Some(&app_key))
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|_| StatusCode::BAD_GATEWAY)?;
    let auth = resp.json::<Value>().await.map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok(Json(json!({
        "configured": true,
        "account_id": auth.get("accountId").cloned().unwrap_or_default(),
        "api_url": auth.get("apiUrl").cloned().unwrap_or_default(),
        "download_url": auth.get("downloadUrl").cloned().unwrap_or_default(),
        "allowed": auth.get("allowed").cloned().unwrap_or_default(),
    })))
}

/// POST /api/profile/:id/view — catat tampilan profil user.
pub async fn record_profile_view(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(profile_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let viewer_id = require_auth(&state, &headers).await?;
    if viewer_id == profile_id {
        return Ok(Json(json!({ "ok": true, "self": true })));
    }

    // Pastikan target ada.
    let exists = sqlx::query("SELECT id FROM users WHERE id = $1")
        .bind(&profile_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    if exists.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    let _ = sqlx::query(
        "INSERT INTO profile_views (id, profile_user_id, viewer_user_id, created_at)
         VALUES ($1, $2, $3, $4)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&profile_id)
    .bind(&viewer_id)
    .bind(Utc::now())
    .execute(&state.db)
    .await;

    Ok(Json(json!({ "ok": true })))
}

/// GET /api/profile/:id/views — jumlah & siapa yang melihat profil.
pub async fn profile_views(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(profile_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;

    // Hanya pemilik profil & owner yang boleh melihat detail pengunjung.
    let actor_row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&actor_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?;
    let actor_role: String = actor_row.get("role");
    let can_see_viewers = actor_id == profile_id || actor_role == "owner";

    let total: i64 = sqlx::query("SELECT COUNT(*) FROM profile_views WHERE profile_user_id = $1")
        .bind(&profile_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get(0);

    let mut viewers: Vec<Value> = Vec::new();
    if can_see_viewers {
        let rows = sqlx::query(
            "SELECT v.viewer_user_id, u.name AS viewer_name, u.email AS viewer_email,
                    u.position, c.name AS company_name, v.created_at
             FROM profile_views v
             JOIN users u ON u.id = v.viewer_user_id
             LEFT JOIN companies c ON c.id = u.company_id
             WHERE v.profile_user_id = $1
             ORDER BY v.created_at DESC
             LIMIT 50",
        )
        .bind(&profile_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

        viewers = rows
            .iter()
            .map(|r| {
                json!({
                    "viewer_id": r.get::<String, _>("viewer_user_id"),
                    "name": r.get::<String, _>("viewer_name"),
                    "email": r.get::<String, _>("viewer_email"),
                    "position": r.get::<String, _>("position"),
                    "company_name": r.get::<Option<String>, _>("company_name"),
                    "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
                })
            })
            .collect();
    }

    Ok(Json(json!({
        "total_views": total,
        "can_see_viewers": can_see_viewers,
        "viewers": viewers,
    })))
}

/// POST /api/attendance — catat absen masuk (selfie + GPS).
pub async fn create_attendance(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AttendanceRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let company_id: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("company_id");

    // Tentukan status berdasarkan jarak (admin/owner mengatur radio kantor
    // lewat owner_config; default 200m).
    let geo = cfg_get_async(&state.db, "office_geo").await.unwrap_or_else(|| json!({}));
    let office_lat = geo.get("latitude").and_then(|v| v.as_f64());
    let office_lng = geo.get("longitude").and_then(|v| v.as_f64());
    let radius = geo.get("radius_m").and_then(|v| v.as_f64()).unwrap_or(200.0);

    let mut status = payload.status.clone();
    if status.is_empty() {
        status = "present".to_string();
    }
    if let (Some(olat), Some(olng)) = (office_lat, office_lng) {
        let dist = haversine_m(olat, olng, payload.latitude, payload.longitude);
        // Jarak terkirim dipakai kalau ada (dihitung client), else pakai hitungan server.
        let distance = if payload.distance_m > 0.0 { payload.distance_m } else { dist };
        status = if distance <= radius { "present".to_string() } else { "outside".to_string() };
    }

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO attendance (id, user_id, company_id, type, photo_url, latitude, longitude, distance_m, status, note, created_at)
         VALUES ($1, $2, $3, 'checkin', $4, $5, $6, $7, $8, $9, $10)",
    )
    .bind(&id)
    .bind(&user_id)
    .bind(&company_id)
    .bind(&payload.photo_url)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(payload.distance_m)
    .bind(&status)
    .bind(&payload.note)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Audit log.
    let _ = sqlx::query(
        "INSERT INTO audit_logs (id, actor_type, user_id, tool_name, action, target_resource, result, detail, created_at)
         VALUES ($1, 'user', $2, 'attendance', 'checkin', $3, $4, $5, $6)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&id)
    .bind(&status)
    .bind(Some(&payload.note))
    .bind(Utc::now())
    .execute(&state.db)
    .await;

    Ok(Json(json!({ "ok": true, "id": id, "status": status, "photo_url": payload.photo_url })))
}

/// GET /api/attendance — daftar absensi (diri sendiri / company utk admin).
pub async fn list_attendance(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AttendanceQuery>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let _my_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("company_id");

    let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("role");
    let is_admin = role == "owner" || role == "super_admin" || role == "admin";

    let company_filter = query.company_id.clone().filter(|c| !c.is_empty());
    let show_all = is_admin && company_filter.is_some();

    let rows = if show_all {
        sqlx::query(
            "SELECT a.id, a.user_id, u.name AS user_name, a.company_id, a.photo_url,
                    a.latitude, a.longitude, a.distance_m, a.status, a.note, a.created_at
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE a.company_id = $1
             ORDER BY a.created_at DESC
             LIMIT 200",
        )
        .bind(company_filter.as_deref())
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query(
            "SELECT a.id, a.user_id, u.name AS user_name, a.company_id, a.photo_url,
                    a.latitude, a.longitude, a.distance_m, a.status, a.note, a.created_at
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE a.user_id = $1
             ORDER BY a.created_at DESC
             LIMIT 100",
        )
        .bind(&user_id)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let list: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "user_id": r.get::<String, _>("user_id"),
                "user_name": r.get::<String, _>("user_name"),
                "company_id": r.get::<Option<String>, _>("company_id"),
                "photo_url": r.get::<String, _>("photo_url"),
                "latitude": r.get::<f64, _>("latitude"),
                "longitude": r.get::<f64, _>("longitude"),
                "distance_m": r.get::<f64, _>("distance_m"),
                "status": r.get::<String, _>("status"),
                "note": r.get::<String, _>("note"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "attendance": list })))
}

/// Jarak haversine dalam meter.
fn haversine_m(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371000.0;
    let dlat = (lat2 - lat1).to_radians();
    let dlon = (lon2 - lon1).to_radians();
    let a = (dlat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (dlon / 2.0).sin().powi(2);
    2.0 * r * a.sqrt().asin()
}
