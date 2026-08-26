use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::Json,
};
use serde_json::{json, Value};
use sqlx::Row;
use uuid::Uuid;

use crate::handlers::require_auth;
use crate::AppState;

// =====================================================================
// AI PROVIDERS — Multi-provider (OpenAI, Anthropic, dll) per user.
// =====================================================================
// Setiap user (owner/super_admin) bisa menambah banyak penyedia AI.
// Hanya satu provider yang bisa menjadi "active" (is_active = true).
// =====================================================================

/// Daftar semua provider milik user.
pub async fn list_providers(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let rows = sqlx::query(
        "SELECT id, provider_id, display_name, api_type, base_url, api_key, model, enabled, is_active, created_at, updated_at
         FROM ai_providers WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let providers: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "provider_id": r.get::<String, _>("provider_id"),
                "display_name": r.get::<String, _>("display_name"),
                "api_type": r.get::<String, _>("api_type"),
                "base_url": r.get::<String, _>("base_url"),
                "api_key": mask_key(r.get::<String, _>("api_key")),
                "model": r.get::<String, _>("model"),
                "enabled": r.get::<bool, _>("enabled"),
                "is_active": r.get::<bool, _>("is_active"),
                "created_at": r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
                "updated_at": r.get::<chrono::DateTime<chrono::Utc>, _>("updated_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "providers": providers })))
}

/// Tambah provider baru.
#[derive(serde::Deserialize)]
pub struct CreateProviderRequest {
    pub provider_id: String,
    pub display_name: String,
    #[serde(default = "default_api_type")]
    pub api_type: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub is_active: bool,
}

fn default_api_type() -> String { "openai-compatible".to_string() }
fn default_true() -> bool { true }

pub async fn create_provider(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateProviderRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let id = Uuid::new_v4().to_string();

    // Jika is_active = true, nonaktifkan yang lain dulu.
    if payload.is_active {
        sqlx::query("UPDATE ai_providers SET is_active = FALSE WHERE user_id = $1")
            .bind(&user_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    }

    sqlx::query(
        "INSERT INTO ai_providers (id, user_id, provider_id, display_name, api_type, base_url, api_key, model, enabled, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())",
    )
    .bind(&id)
    .bind(&user_id)
    .bind(payload.provider_id.trim())
    .bind(payload.display_name.trim())
    .bind(payload.api_type.trim())
    .bind(payload.base_url.trim())
    .bind(payload.api_key.trim())
    .bind(payload.model.trim())
    .bind(payload.enabled)
    .bind(payload.is_active)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({ "ok": true, "id": id })))
}

/// Update provider.
#[derive(serde::Deserialize)]
pub struct UpdateProviderRequest {
    #[serde(default)]
    pub provider_id: Option<String>,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub api_type: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub api_key: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub enabled: Option<bool>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

pub async fn update_provider(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(provider_id): Path<String>,
    Json(payload): Json<UpdateProviderRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    // Verifikasi milik user.
    let existing = sqlx::query("SELECT id FROM ai_providers WHERE id = $1 AND user_id = $2")
        .bind(&provider_id)
        .bind(&user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    if existing.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Jika is_active = true, nonaktifkan yang lain.
    if payload.is_active == Some(true) {
        sqlx::query("UPDATE ai_providers SET is_active = FALSE WHERE user_id = $1 AND id != $2")
            .bind(&user_id)
            .bind(&provider_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    }

    let mut sets = Vec::new();
    let mut binds: Vec<String> = Vec::new();
    let mut idx = 1;

    if let Some(v) = &payload.provider_id { sets.push(format!("provider_id = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.display_name { sets.push(format!("display_name = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.api_type { sets.push(format!("api_type = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.base_url { sets.push(format!("base_url = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.api_key { sets.push(format!("api_key = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.model { sets.push(format!("model = ${idx}")); binds.push(v.trim().to_string()); idx += 1; }
    if let Some(v) = &payload.enabled { sets.push(format!("enabled = ${idx}")); binds.push(v.to_string()); idx += 1; }
    if let Some(v) = &payload.is_active { sets.push(format!("is_active = ${idx}")); binds.push(v.to_string()); idx += 1; }

    if sets.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    sets.push(format!("updated_at = NOW()"));

    let sql = format!("UPDATE ai_providers SET {} WHERE id = ${idx} AND user_id = ${}", sets.join(", "), idx + 1);
    let mut q = sqlx::query(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    q = q.bind(&provider_id).bind(&user_id);
    q.execute(&state.db).await.map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({ "ok": true })))
}

/// Hapus provider.
pub async fn delete_provider(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(provider_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    sqlx::query("DELETE FROM ai_providers WHERE id = $1 AND user_id = $2")
        .bind(&provider_id)
        .bind(&user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    Ok(Json(json!({ "ok": true })))
}

/// Fetch models dari provider API.
#[derive(serde::Deserialize)]
pub struct FetchModelsRequest {
    pub api_type: String,
    pub base_url: String,
    pub api_key: String,
}

pub async fn fetch_models_route(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<FetchModelsRequest>,
) -> Result<Json<Value>, StatusCode> {
    let _user_id = require_auth(&state, &headers).await?;
    let models = fetch_models(&payload.api_type, &payload.base_url, &payload.api_key).await;
    Ok(Json(json!({ "models": models })))
}

/// Fetch models dari provider API.
async fn fetch_models(api_type: &str, base_url: &str, api_key: &str) -> Vec<String> {
    let client = reqwest::Client::new();

    let url = match api_type {
        "anthropic-messages" => format!("{}/v1/models", base_url.trim_end_matches('/')),
        _ => format!("{}/models", base_url.trim_end_matches('/')),
    };

    let req = client
        .get(&url)
        .header("Content-Type", "application/json");

    let req = match api_type {
        "anthropic-messages" => req.header("x-api-key", api_key.trim()),
        _ => req.header("Authorization", format!("Bearer {}", api_key.trim())),
    };

    match req.send().await {
        Ok(resp) if resp.status().is_success() => {
            match resp.json::<Value>().await {
                Ok(body) => {
                    // OpenAI / Anthropic format: { data: [ { id: "model-name" }, ... ] }
                    if let Some(data) = body.get("data").and_then(|d| d.as_array()) {
                        return data
                            .iter()
                            .filter_map(|v| v.get("id").and_then(|id| id.as_str().map(|s| s.to_string())))
                            .collect();
                    }
                    // Fallback: cari array tanpa key "data"
                    if let Some(arr) = body.as_array() {
                        return arr
                            .iter()
                            .filter_map(|v| {
                                v.get("id")
                                    .or_else(|| v.get("name"))
                                    .and_then(|id| id.as_str().map(|s| s.to_string()))
                            })
                            .collect();
                    }
                    tracing::warn!(event = "fetch_models_unexpected", body = %body, "unexpected response format");
                    vec![]
                }
                Err(e) => {
                    tracing::warn!(event = "fetch_models_parse_error", error = %e, "failed to parse model list");
                    vec![]
                }
            }
        }
        Ok(resp) => {
            tracing::warn!(event = "fetch_models_http_error", status = %resp.status(), "non-200 response");
            vec![]
        }
        Err(e) => {
            tracing::warn!(event = "fetch_models_network_error", error = %e, "network error");
            vec![]
        }
    }
}

/// Mask API key untuk tampilan: tampilkan 4 karakter pertama, sisanya ***.
fn mask_key(key: String) -> String {
    if key.len() > 8 {
        format!("{}***", &key[..4])
    } else {
        String::from("***")
    }
}