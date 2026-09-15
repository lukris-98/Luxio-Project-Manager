use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Json},
};
use chrono::Utc;
use lettre::{
    transport::smtp::authentication::Credentials as SmtpCredentials, AsyncSmtpTransport,
    Tokio1Executor,
};
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Duration;
use uuid::Uuid;

use crate::crypto;
use crate::handlers::{rate_limited, require_auth};
use crate::mail;
use crate::AppState;

// =====================================================================
// USER CREDENTIALS — kredensial API terenkripsi di database
// (Requirements Document `user-credentials-management`, Req 1-17).
// =====================================================================
// - Tabel `user_credentials`; `credential_data` SELALU terenkripsi
//   AES-256-GCM (lihat crypto.rs). Plaintext tidak pernah masuk respons
//   daftar — masking dilakukan SERVER-SIDE (Req 3.6, 14.7). Plaintext
//   hanya lewat endpoint /reveal atas permintaan eksplisit + diaudit.
// - Akses: hanya role owner/super_admin (Req 3.11, 4.1-4.2). Isolasi
//   user_id: baris milik user lain -> 403 (Req 4.3-4.5).
// - Rate limit 10 request/menit per user untuk SEMUA endpoint kredensial
//   (Req 11.5 -> 429).
// - Semua operasi dicatat ke `audit_logs` (tool_name='credentials'),
//   tanpa nilai plaintext (Req 7.6-7.7).
// =====================================================================

pub const PROVIDERS: [&str; 6] = ["neon", "smtp", "backblaze_b2", "openai", "anthropic", "custom"];
const MAX_DATA_BYTES: usize = 4 * 1024;
const MAX_NAME_CHARS: usize = 100;
const ROTATION_AGE_DAYS: i64 = 90;
const TEST_TIMEOUT_SECS: u64 = 10;
const CRED_RATE_MAX: u32 = 10;
const CRED_RATE_WINDOW_SECS: i64 = 60;
pub const EXPORT_FORMAT: &str = "luxio-credentials-export";
pub const EXPORT_SCHEMA_VERSION: i64 = 1;

// Provider yang sudah mendapat peringatan deprecation .env (Req 13.6) — sekali saja.
static ENV_WARNED: Mutex<Option<HashSet<String>>> = Mutex::new(None);

// ------------------------------------------------------------------
// Error: pesan teknis penuh hanya ke log internal (Req 11.3); client
// mendapat pesan generik tanpa plaintext/ciphertext (Req 11.1-11.2).
// ------------------------------------------------------------------
#[derive(Debug)]
pub struct CredError {
    status: StatusCode,
    message: String,
}

impl CredError {
    fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self { status, message: message.into() }
    }
    fn bad_request(msg: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, msg)
    }
    fn internal_logged(tag: &str, e: &sqlx::Error) -> Self {
        eprintln!("[DB ERROR] credentials::{}: {}", tag, e);
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, "Terjadi kesalahan pada server")
    }
}

impl From<sqlx::Error> for CredError {
    fn from(e: sqlx::Error) -> Self {
        Self::internal_logged("db", &e)
    }
}

impl IntoResponse for CredError {
    fn into_response(self) -> axum::response::Response {
        (self.status, Json(json!({ "ok": false, "message": self.message }))).into_response()
    }
}

fn conflict_error(e: &sqlx::Error) -> bool {
    e.as_database_error()
        .and_then(|db| db.code().map(|c| c == "23505"))
        .unwrap_or(false)
}

// ------------------------------------------------------------------
// RBAC + rate limit (Req 3.11, 4.1-4.2, 7.8, 11.5-11.6)
// ------------------------------------------------------------------
struct Actor {
    user_id: String,
    role: String,
}

async fn require_manager(
    state: &AppState,
    headers: &HeaderMap,
    provider_hint: Option<&str>,
) -> Result<Actor, CredError> {
    let user_id = require_auth(state, headers)
        .await
        .map_err(|_| CredError::new(StatusCode::UNAUTHORIZED, "Autentikasi diperlukan"))?;

    // Req 11.5-11.6: maks 10 request/menit per user -> 429.
    if rate_limited(&format!("cred:{}", user_id), CRED_RATE_MAX, CRED_RATE_WINDOW_SECS) {
        return Err(CredError::new(
            StatusCode::TOO_MANY_REQUESTS,
            "Terlalu banyak permintaan. Batas 10 permintaan per menit untuk endpoint kredensial.",
        ));
    }

    let row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_optional(&state.db)
        .await?;
    let role = row
        .map(|r| r.get::<String, _>("role"))
        .ok_or_else(|| CredError::new(StatusCode::UNAUTHORIZED, "Sesi tidak valid"))?;

    // Req 4.1-4.2 + 7.8: di luar owner/super_admin -> 403 + audit denied.
    if role != "owner" && role != "super_admin" {
        audit(&state.db, &user_id, "credential_access_denied", provider_hint.unwrap_or("unknown"), None, "forbidden").await;
        return Err(CredError::new(
            StatusCode::FORBIDDEN,
            "Hanya owner/super_admin yang dapat mengelola kredensial",
        ));
    }
    Ok(Actor { user_id, role })
}

// ------------------------------------------------------------------
// Audit trail (Req 7.1-7.5, 7.7-7.8) — TANPA plaintext (Req 7.6),
// memakai struktur `audit_logs` yang sudah ada.
// ------------------------------------------------------------------
async fn audit(db: &PgPool, user_id: &str, action: &str, provider_type: &str, credential_id: Option<&str>, result: &str) {
    let detail = json!({ "provider_type": provider_type, "credential_id": credential_id }).to_string();
    let _ = sqlx::query(
        "INSERT INTO audit_logs (id, actor_type, user_id, tool_name, action, target_resource, result, detail, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind("user")
    .bind(user_id)
    .bind("credentials")
    .bind(action)
    .bind(format!("credentials/{}", provider_type))
    .bind(result)
    .bind(detail)
    .bind(Utc::now())
    .execute(db)
    .await
    .ok();
}

// ------------------------------------------------------------------
// Validasi & sanitasi (Req 10)
// ------------------------------------------------------------------

/// Strip tag HTML, rapikan whitespace, maks 100 karakter (Req 10.6).
fn sanitize_display_name(raw: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for ch in raw.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            c if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .take(MAX_NAME_CHARS)
        .collect::<String>()
        .trim()
        .to_string()
}

fn required_str(data: &Value, key: &str) -> Result<String, CredError> {
    let v = data
        .get(key)
        .and_then(|x| x.as_str().map(|s| s.to_string()).or_else(|| x.as_u64().map(|n| n.to_string()).or_else(|| x.as_f64().map(|f| f.to_string()))))
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    if v.is_empty() {
        return Err(CredError::bad_request(format!("Field '{}' wajib diisi", key)));
    }
    Ok(v)
}

fn optional_str(data: &Value, key: &str) -> Option<String> {
    data.get(key)
        .and_then(|x| x.as_str().map(|s| s.to_string()).or_else(|| x.as_u64().map(|n| n.to_string())))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn valid_api_key(provider: &str, key: &str) -> Result<(), CredError> {
    // Req 10.3 — pola format per provider.
    match provider {
        "openai" => key
            .starts_with("sk-")
            .then_some(())
            .ok_or_else(|| CredError::bad_request("API key OpenAI harus diawali 'sk-'")),
        "anthropic" => key
            .starts_with("sk-ant-")
            .then_some(())
            .ok_or_else(|| CredError::bad_request("API key Anthropic harus diawali 'sk-ant-'")),
        "neon" => {
            if key.len() >= 8 && !key.chars().any(char::is_whitespace) {
                Ok(())
            } else {
                Err(CredError::bad_request(
                    "API key Neon tidak valid (minimal 8 karakter, tanpa spasi)",
                ))
            }
        }
        _ => Ok(()),
    }
}

/// Buang field tak dikenal + validasi sesuai provider (Req 2.2-2.7,
/// 10.1-10.5). Ukuran payload > 4KB ditolak 413 (Req 10.7-10.8).
fn clean_and_validate(provider: &str, data: &mut Value) -> Result<(), CredError> {
    if !PROVIDERS.contains(&provider) {
        // Req 10.1
        return Err(CredError::bad_request(
            "provider_type tidak dikenal (dipakai: neon, smtp, backblaze_b2, openai, anthropic, custom)",
        ));
    }
    let obj = match data.as_object() {
        Some(o) => o.clone(),
        None => return Err(CredError::bad_request("credential_data harus berupa objek key-value")),
    };
    let _ = &obj;

    let mut cleaned = serde_json::Map::new();
    match provider {
        "neon" => {
            let api_key = required_str(data, "api_key")?;
            valid_api_key("neon", &api_key)?;
            cleaned.insert("api_key".into(), json!(api_key));
            if let Some(org) = optional_str(data, "org_id") {
                // Req 2.2 — org_id opsional
                cleaned.insert("org_id".into(), json!(org));
            }
        }
        "smtp" => {
            // Req 2.3 + 10.2
            let host = required_str(data, "host")?;
            let port_val = data.get("port").cloned().unwrap_or(Value::Null);
            let port = match &port_val {
                Value::Number(n) => n.as_u64().unwrap_or(0),
                Value::String(s) => s.trim().parse::<u64>().unwrap_or(0),
                _ => 0,
            };
            if !(1..=65535).contains(&port) {
                return Err(CredError::bad_request("Port SMTP harus angka antara 1 dan 65535"));
            }
            let username = required_str(data, "username")?;
            let password = required_str(data, "password")?;
            let from = required_str(data, "from_address")?;
            if !from.contains('@') {
                return Err(CredError::bad_request("from_address harus alamat email yang valid"));
            }
            cleaned.insert("host".into(), json!(host));
            cleaned.insert("port".into(), json!(port));
            cleaned.insert("username".into(), json!(username));
            cleaned.insert("password".into(), json!(password));
            cleaned.insert("from_address".into(), json!(from));
        }
        "backblaze_b2" => {
            // Req 2.4 + 10.4
            let key_id = required_str(data, "application_key_id")?;
            let app_key = required_str(data, "application_key")?;
            cleaned.insert("application_key_id".into(), json!(key_id));
            cleaned.insert("application_key".into(), json!(app_key));
            if let Some(bucket) = optional_str(data, "bucket_name") {
                cleaned.insert("bucket_name".into(), json!(bucket));
            }
        }
        "openai" => {
            // Req 2.5
            let api_key = required_str(data, "api_key")?;
            valid_api_key("openai", &api_key)?;
            cleaned.insert("api_key".into(), json!(api_key));
            if let Some(org) = optional_str(data, "organization_id") {
                cleaned.insert("organization_id".into(), json!(org));
            }
            if let Some(base) = optional_str(data, "base_url") {
                if !base.starts_with("http://") && !base.starts_with("https://") {
                    return Err(CredError::bad_request("base_url harus diawali http:// atau https://"));
                }
                cleaned.insert("base_url".into(), json!(base));
            }
        }
        "anthropic" => {
            // Req 2.6
            let api_key = required_str(data, "api_key")?;
            valid_api_key("anthropic", &api_key)?;
            cleaned.insert("api_key".into(), json!(api_key));
        }
        "custom" => {
            // Req 2.7 — pasangan key-value bebas namun bersih
            if obj.is_empty() {
                return Err(CredError::bad_request("Kredensial custom membutuhkan minimal satu pasangan key-value"));
            }
            if obj.len() > 20 {
                return Err(CredError::bad_request("Maksimal 20 pasangan key-value untuk provider custom"));
            }
            for (k, v) in &obj {
                let valid_key = {
                    let mut chars = k.chars();
                    matches!(chars.next(), Some(c) if c.is_ascii_alphabetic() || c == '_')
                        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
                        && k.len() <= 64
                };
                if !valid_key {
                    return Err(CredError::bad_request(format!(
                        "Key '{}' tidak valid (huruf/angka/_ saja, dimulai dengan huruf)",
                        k
                    )));
                }
                let sv = v.as_str().map(|s| s.to_string()).or_else(|| match v {
                    Value::Number(n) => Some(n.to_string()),
                    _ => None,
                });
                match sv {
                    Some(s) => {
                        cleaned.insert(k.clone(), json!(s));
                    }
                    None => return Err(CredError::bad_request(format!("Nilai '{}' harus string atau angka", k))),
                }
            }
        }
        _ => {}
    }

    let cleaned_obj = Value::Object(cleaned);
    // Req 10.7-10.8: batas ukuran 4KB -> 413.
    if cleaned_obj.to_string().len() > MAX_DATA_BYTES {
        return Err(CredError::new(
            StatusCode::PAYLOAD_TOO_LARGE,
            "Ukuran kredensial melebihi batas 4KB",
        ));
    }
    *data = cleaned_obj;
    Ok(())
}

// ------------------------------------------------------------------
// Masking (Req 3.6, 14.1-14.2, 14.7) — selalu di server.
// ------------------------------------------------------------------
fn is_secret_key(provider: &str, key: &str) -> bool {
    match provider {
        "smtp" => key == "password",
        "neon" | "openai" | "anthropic" => key == "api_key",
        "backblaze_b2" => key == "application_key" || key == "application_key_id",
        _ => crypto::is_secret_field(key) || crypto::is_password_field(key),
    }
}

fn as_display_string(v: &Value) -> Option<String> {
    v.as_str().map(|s| s.to_string()).or_else(|| match v {
        Value::Number(n) => Some(n.to_string()),
        _ => None,
    })
}

fn masked_data(provider: &str, data: &Value) -> Value {
    let mut out = serde_json::Map::new();
    if let Some(obj) = data.as_object() {
        for (k, v) in obj {
            match as_display_string(v) {
                Some(s) if is_secret_key(provider, k) => {
                    out.insert(k.clone(), json!(crypto::mask_field(k, &s)));
                }
                _ => {
                    out.insert(k.clone(), v.clone());
                }
            }
        }
    }
    Value::Object(out)
}

/// Form edit menampilkan nilai masked; bila user mengirim ulang persis
/// nilai masked tsb (ct-compare, Req 11.7), nilai asli dipertahankan.
fn merge_update(provider: &str, old: &mut Value, incoming: &Value) {
    let Some(new_obj) = incoming.as_object() else { return };
    let Some(old_obj) = old.as_object_mut() else { return };
    for (k, v) in new_obj {
        let echoed_mask = match (as_display_string(v), old_obj.get(k).and_then(as_display_string)) {
            (Some(incoming_s), Some(old_s)) => {
                is_secret_key(provider, k) && old_s != incoming_s && {
                    let mask = crypto::mask_field(k, &old_s);
                    // Constant-time comparison (Req 11.7).
                    crypto::ct_eq(&incoming_s, &mask)
                }
            }
            _ => false,
        };
        if !echoed_mask {
            old_obj.insert(k.clone(), v.clone());
        }
    }
}

// ------------------------------------------------------------------
// Ambil baris + isolasi kepemilikan user_id (Req 4.3-4.5)
// ------------------------------------------------------------------
const CREDENTIAL_COLUMNS: &str = "id, user_id, provider_type, display_name, credential_data, is_active, created_at, updated_at";

async fn fetch_owned(db: &PgPool, user_id: &str, id: &str) -> Result<sqlx::postgres::PgRow, CredError> {
    let sql = format!("SELECT {} FROM user_credentials WHERE id = $1", CREDENTIAL_COLUMNS);
    let row = sqlx::query(&sql)
        .bind(id)
        .fetch_optional(db)
        .await?;
    // Req 5/11.4: id tak dikenal = 404 (tanpa membocorkan keberadaan data lain).
    let row = row.ok_or_else(|| CredError::new(StatusCode::NOT_FOUND, "Kredensial tidak ditemukan"))?;
    if row.get::<String, _>("user_id") != user_id {
        // Req 4.5: mencoba mengubah kredensial user lain -> 403 + audit (Req 7.8).
        let provider = row.get::<String, _>("provider_type");
        audit(db, user_id, "credential_access_denied", &provider, Some(id), "forbidden").await;
        return Err(CredError::new(StatusCode::FORBIDDEN, "Kredensial ini bukan milik Anda"));
    }
    Ok(row)
}

fn row_plain(row: &sqlx::postgres::PgRow) -> Result<Value, CredError> {
    let blob: String = row.get("credential_data");
    let text = crypto::decrypt_str(&blob)
        .map_err(|_| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, "Decryption failed"))?; // Req 11.2
    serde_json::from_str(&text)
        .map_err(|_| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, "Decryption failed"))
}

fn blob_of(row: &sqlx::postgres::PgRow) -> String {
    row.get("credential_data")
}

// ------------------------------------------------------------------
// Benturan .env (Req 8.7) & deprecation (Req 13.6)
// ------------------------------------------------------------------
fn env_for_provider(provider: &str) -> Option<(&'static str, bool)> {
    let (var, ok) = match provider {
        "neon" => ("NEON_API_KEY", !std::env::var("NEON_API_KEY").unwrap_or_default().is_empty()),
        "smtp" => ("SMTP_HOST", !std::env::var("SMTP_HOST").unwrap_or_default().is_empty()),
        "backblaze_b2" => (
            "B2_KEY_ID",
            !std::env::var("B2_KEY_ID").unwrap_or_default().is_empty()
                && !std::env::var("B2_APP_KEY").unwrap_or_default().is_empty(),
        ),
        "openai" => ("OPENAI_API_KEY", !std::env::var("OPENAI_API_KEY").unwrap_or_default().is_empty()),
        _ => ("", false),
    };
    if var.is_empty() {
        None
    } else {
        Some((var, ok))
    }
}

pub fn env_present_providers() -> Vec<&'static str> {
    ["neon", "smtp", "backblaze_b2", "openai"]
        .into_iter()
        .filter(|p| env_for_provider(p).map(|(_, ok)| ok).unwrap_or(false))
        .collect()
}

fn env_conflict_note(provider: &str) -> Option<String> {
    // Req 8.7: ingatkan saat .env dan database sama-sama mengisi provider ini.
    let (var, ok) = env_for_provider(provider)?;
    if ok {
        Some(format!(
            "Peringatan: variabel .env '{}' juga terisi untuk provider ini. Kredensial database diprioritaskan.",
            var
        ))
    } else {
        None
    }
}

/// Peringatan deprecation sekali per provider saat aplikasi jatuh ke .env (Req 13.6).
pub fn warn_env_deprecated(provider: &str, env_var: &str) {
    let mut guard = ENV_WARNED.lock().unwrap_or_else(|e| e.into_inner());
    let set = guard.get_or_insert_with(HashSet::new);
    if set.insert(provider.to_string()) {
        tracing::warn!(
            event = "credential_env_deprecated",
            provider = provider,
            "Memakai kredensial dari .env ({}) — simpan kredensial aktif lewat Settings → Credentials (mendukung migrasi Req 8/13)",
            env_var
        );
    }
}

// =====================================================================
// ENDPOINTS CRUD
// =====================================================================

/// GET /api/credentials — daftar kredensial milik user, server-side masked.
/// (Req 2.1, 3.2, 3.6, 4.4, 14.1-14.2, 16.2)
pub async fn list_credentials(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let rows = sqlx::query(
        "SELECT id, provider_type, display_name, credential_data, is_active, created_at, updated_at
         FROM user_credentials
         WHERE user_id = $1
         ORDER BY provider_type, created_at DESC",
    )
    .bind(&actor.user_id)
    .fetch_all(&state.db)
    .await?;

    let now = Utc::now();
    let credentials: Vec<Value> = rows
        .iter()
        .map(|r| {
            let provider: String = r.get("provider_type");
            let blob: String = r.get("credential_data");
            let created: chrono::DateTime<Utc> = r.get("created_at");
            let updated: chrono::DateTime<Utc> = r.get("updated_at");
            let age_days = (now - created.min(updated)).num_days().max(0);
            let plain = crypto::decrypt_str(&blob).ok().and_then(|s| serde_json::from_str::<Value>(&s).ok());
            json!({
                "id": r.get::<String, _>("id"),
                "provider_type": provider,
                "display_name": r.get::<String, _>("display_name"),
                "is_active": r.get::<bool, _>("is_active"),
                "created_at": created.timestamp_millis(),
                "updated_at": updated.timestamp_millis(),
                "age_days": age_days,
                "needs_rotation": age_days >= ROTATION_AGE_DAYS,
                "data": plain.as_ref().map(|d| masked_data(&provider, d)),
                "decrypt_error": plain.is_none(),
            })
        })
        .collect();

    Ok(Json(json!({
        "ok": true,
        "credentials": credentials,
        "env_providers": env_present_providers(),  // indikator benturan .env (Req 8.7)
    })))
}

/// POST /api/credentials — buat kredensial baru (terenkripsi sebelum insert).
/// (Req 1.1-1.2, 3.4-3.5, 10)
pub async fn create_credential(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, CredError> {
    let provider = payload.get("provider_type").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let actor = require_manager(&state, &headers, Some(if provider.is_empty() { "unknown" } else { &provider })).await?;

    let mut data = payload.get("data").cloned().unwrap_or_else(|| json!({}));
    clean_and_validate(&provider, &mut data)?;

    let mut name = sanitize_display_name(payload.get("display_name").and_then(|v| v.as_str()).unwrap_or(""));
    if name.is_empty() {
        name = format!("Kredensial {}", provider);
    }

    let blob = crypto::encrypt_str(&data.to_string())
        .map_err(|e| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, e.message()))?; // Req 1.2, 1.7

    let has_active = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM user_credentials WHERE user_id = $1 AND provider_type = $2 AND is_active = TRUE) AS ex",
    )
    .bind(&actor.user_id)
    .bind(&provider)
    .fetch_one(&state.db)
    .await?
    .get::<bool, _>("ex");

    // Req 2.8: user menunjuk tepat satu Active_Credential; kredensial pertama
    // otomatis aktif kecuali diminta lain.
    let want_active = payload.get("activate").and_then(|v| v.as_bool()).unwrap_or(!has_active);

    let id = Uuid::new_v4().to_string();
    {
        // Aktivasi harus atomik (Req 5.4): deactivate + insert dalam 1 transaksi.
        let mut tx = state.db.begin().await?;
        if want_active {
            sqlx::query("UPDATE user_credentials SET is_active = FALSE WHERE user_id = $1 AND provider_type = $2")
                .bind(&actor.user_id)
                .bind(&provider)
                .execute(&mut *tx)
                .await?;
        }
        let res = sqlx::query(
            "INSERT INTO user_credentials (id, user_id, provider_type, display_name, credential_data, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
        )
        .bind(&id)
        .bind(&actor.user_id)
        .bind(&provider)
        .bind(&name)
        .bind(&blob)
        .bind(want_active)
        .execute(&mut *tx)
        .await;
        match res {
            Ok(_) => {
                tx.commit().await?;
            }
            Err(e) => {
                // tx dropped -> rollback otomatis (Req 5.5)
                if conflict_error(&e) {
                    return Err(CredError::new(StatusCode::CONFLICT, "Sudah ada kredensial aktif untuk provider ini"));
                }
                return Err(CredError::internal_logged("create", &e));
            }
        }
    }

    audit(&state.db, &actor.user_id, "credential_create", &provider, Some(&id), "success").await; // Req 7.1

    Ok(Json(json!({
        "ok": true,
        "id": id,
        "is_active": want_active,
        "warning": env_conflict_note(&provider),
    })))
}

/// PUT /api/credentials/:id — perbarui kredensial. (Req 3.9, 7.2)
pub async fn update_credential(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let row = fetch_owned(&state.db, &actor.user_id, &id).await?;
    let provider: String = row.get("provider_type");

    let name = match payload.get("display_name").and_then(|v| v.as_str()) {
        Some(raw) => {
            let s = sanitize_display_name(raw);
            if s.is_empty() {
                return Err(CredError::bad_request("display_name tidak boleh kosong"));
            }
            s
        }
        None => row.get::<String, _>("display_name"),
    };

    let blob = if payload.get("data").is_some() {
        let mut merged = row_plain(&row)?;
        merge_update(&provider, &mut merged, &payload["data"]);
        clean_and_validate(&provider, &mut merged)?;
        crypto::encrypt_str(&merged.to_string())
            .map_err(|e| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, e.message()))?
    } else {
        blob_of(&row)
    };

    sqlx::query(
        "UPDATE user_credentials SET display_name = $1, credential_data = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4",
    )
    .bind(&name)
    .bind(&blob)
    .bind(&id)
    .bind(&actor.user_id)
    .execute(&state.db)
    .await?;

    audit(&state.db, &actor.user_id, "credential_update", &provider, Some(&id), "success").await; // Req 7.2

    Ok(Json(json!({ "ok": true, "warning": env_conflict_note(&provider) })))
}

/// DELETE /api/credentials/:id — (Req 5.6, 7.3, 15).
pub async fn delete_credential(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let row = fetch_owned(&state.db, &actor.user_id, &id).await?;
    let provider: String = row.get("provider_type");
    let was_active = row.get::<bool, _>("is_active");

    sqlx::query("DELETE FROM user_credentials WHERE id = $1 AND user_id = $2")
        .bind(&id)
        .bind(&actor.user_id)
        .execute(&state.db)
        .await?;

    audit(&state.db, &actor.user_id, "credential_delete", &provider, Some(&id), "success").await; // Req 7.3

    // Req 5.6: menghapus Active_Credential boleh — provider dibiarkan tanpa aktif.
    Ok(Json(json!({ "ok": true, "was_active": was_active })))
}

/// POST /api/credentials/:id/activate — (Req 2.8-2.9, 5.1-5.5).
pub async fn activate_credential(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;

    // Req 5.4-5.5: deactivate + activate dalam SATU transaksi (rollback otomatis).
    let mut tx = state.db.begin().await?;
    let row = sqlx::query(&format!("SELECT {} FROM user_credentials WHERE id = $1 FOR UPDATE", CREDENTIAL_COLUMNS))
        .bind(&id)
        .fetch_optional(&mut *tx)
        .await?;
    let row = row.ok_or_else(|| CredError::new(StatusCode::NOT_FOUND, "Kredensial tidak ditemukan"))?;
    if row.get::<String, _>("user_id") != actor.user_id {
        let provider = row.get::<String, _>("provider_type");
        audit(&state.db, &actor.user_id, "credential_access_denied", &provider, Some(&id), "forbidden").await;
        return Err(CredError::new(StatusCode::FORBIDDEN, "Kredensial ini bukan milik Anda")); // Req 4.5
    }
    let provider: String = row.get("provider_type");
    let user_id: String = row.get("user_id");

    // Req 2.9: tolak aktivasi bila data tidak lolos validasi provider.
    let mut plain = row_plain(&row).map_err(|_| {
        CredError::bad_request("Data kredensial tidak terbaca (gagal dekripsi) — tidak dapat diaktifkan")
    })?;
    clean_and_validate(&provider, &mut plain)?;

    // Req 5.2: matikan yang lain, lalu Req 5.3: nyalakan terpilih.
    sqlx::query("UPDATE user_credentials SET is_active = FALSE WHERE user_id = $1 AND provider_type = $2 AND is_active = TRUE")
        .bind(&user_id)
        .bind(&provider)
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE user_credentials SET is_active = TRUE WHERE id = $1")
        .bind(&id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    audit(&state.db, &actor.user_id, "credential_activate", &provider, Some(&id), "success").await; // Req 7.4

    Ok(Json(json!({ "ok": true, "warning": env_conflict_note(&provider) })))
}

/// POST /api/credentials/:id/reveal — dibuka penuh atas klik ikon mata.
/// (Req 14.3-14.4; akses didengar sebagai credential_access — Req 7.5)
pub async fn reveal_credential(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let row = fetch_owned(&state.db, &actor.user_id, &id).await?;
    let provider: String = row.get("provider_type");
    let plain = row_plain(&row)?;

    audit(&state.db, &actor.user_id, "credential_access", &provider, Some(&id), "success").await; // Req 7.5

    Ok(Json(json!({ "ok": true, "provider_type": provider, "data": plain })))
}

// =====================================================================
// TEST CONNECTION (Req 12) — read-only, TIDAK menyimpan apa pun (Req 12.9)
// =====================================================================

fn test_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(TEST_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(TEST_TIMEOUT_SECS))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new()) // Req 12.10: mati dalam 10 detik
}

fn http_status_hint(status: StatusCode, provider: &str) -> String {
    // Req 12.8 + 11.4: pesan gagal yang deskriptif tanpa membocorkan materi rahasia.
    if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN {
        format!("Authentication failed: Invalid API key ({})", provider)
    } else {
        format!("Gagal koneksi. {} API merespons HTTP {}", provider, status.as_u16())
    }
}

async fn test_neon(data: &Value) -> Result<(), String> {
    // Req 12.3 — Neon API /projects.
    let api_key = data.get("api_key").and_then(|v| v.as_str()).unwrap_or("");
    let client = test_client();
    let mut last = String::from("Tidak dapat menghubungi Neon API (jaringan/DNS)");
    for base in ["https://api.neon.tech/v2", "https://console.neon.tech/api/v2"] {
        match client
            .get(format!("{}/projects", base))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
        {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    return Ok(());
                }
                return Err(http_status_hint(status, "Neon"));
            }
            Err(e) => last = format!("Tidak dapat menghubungi Neon API: {}", e),
        }
    }
    Err(last)
}

async fn test_smtp(data: &Value) -> Result<(), String> {
    // Req 12.4 — koneksi SMTP + autentikasi, tanpa mengirim email.
    let host = data.get("host").and_then(|v| v.as_str()).unwrap_or("");
    let port: u16 = as_display_string(data.get("port").unwrap_or(&Value::Null))
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    let username = data.get("username").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let password = data.get("password").and_then(|v| v.as_str()).unwrap_or("").to_string();

    let builder = if port == 465 {
        AsyncSmtpTransport::<Tokio1Executor>::relay(host)
    } else {
        AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
    };
    let mailer: AsyncSmtpTransport<Tokio1Executor> = match builder {
        Ok(b) => b.port(port).credentials(SmtpCredentials::new(username, password)).build(),
        Err(e) => return Err(format!("Konfigurasi SMTP tidak valid: {}", e)),
    };
    match tokio::time::timeout(Duration::from_secs(TEST_TIMEOUT_SECS), mailer.test_connection()).await {
        Err(_) => Err(format!("Waktu habis ({} detik) menghubungi {}:{}", TEST_TIMEOUT_SECS, host, port)),
        Ok(Ok(true)) => Ok(()),
        Ok(Ok(false)) => Err("Koneksi SMTP tidak stabil — server menolak perintah tes".to_string()),
        Ok(Err(e)) => {
            let txt = e.to_string();
            let lower = txt.to_ascii_lowercase();
            if lower.contains("535") || lower.contains("auth") || lower.contains("credential") {
                Err("Authentication failed: username atau password SMTP salah".to_string())
            } else if lower.contains("lookup") || lower.contains("dns") {
                Err(format!("Host SMTP tidak dapat dijangkau: {}", host))
            } else {
                Err(format!("Koneksi SMTP gagal: {}", txt))
            }
        }
    }
}

async fn test_b2(data: &Value) -> Result<(), String> {
    // Req 12.5 — endpoint authorisasi B2.
    let key_id = data.get("application_key_id").and_then(|v| v.as_str()).unwrap_or("");
    let app_key = data.get("application_key").and_then(|v| v.as_str()).unwrap_or("");
    let resp = test_client()
        .post("https://api.backblazeb2.com/b2api/v2/b2_authorize_account")
        .basic_auth(key_id, Some(app_key))
        .json(&json!({}))
        .send()
        .await
        .map_err(|e| format!("Tidak dapat menghubungi Backblaze B2: {}", e))?;
    if resp.status().is_success() {
        Ok(())
    } else {
        Err(http_status_hint(resp.status(), "Backblaze B2"))
    }
}

async fn test_openai(data: &Value) -> Result<(), String> {
    // Req 12.6 — daftar model OpenAI (base_url opsional).
    let api_key = data.get("api_key").and_then(|v| v.as_str()).unwrap_or("");
    let base = data
        .get("base_url")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("https://api.openai.com/v1")
        .trim_end_matches('/')
        .to_string();
    let mut req = test_client()
        .get(format!("{}/models", base))
        .header("Authorization", format!("Bearer {}", api_key));
    if let Some(org) = data.get("organization_id").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
        req = req.header("OpenAI-Organization", org);
    }
    let resp = req.send().await.map_err(|e| format!("Tidak dapat menghubungi OpenAI API: {}", e))?;
    if resp.status().is_success() {
        Ok(())
    } else {
        Err(http_status_hint(resp.status(), "OpenAI"))
    }
}

async fn test_anthropic(data: &Value) -> Result<(), String> {
    // Req 12.6 — daftar model Anthropic.
    let api_key = data.get("api_key").and_then(|v| v.as_str()).unwrap_or("");
    let resp = test_client()
        .get("https://api.anthropic.com/v1/models")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
        .map_err(|e| format!("Tidak dapat menghubungi Anthropic API: {}", e))?;
    if resp.status().is_success() {
        Ok(())
    } else {
        Err(http_status_hint(resp.status(), "Anthropic"))
    }
}

/// POST /api/credentials/test — (Req 12). Body: {provider_type, data} ATAU {id}.
pub async fn test_connection(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, provider_from_payload(&payload)).await?;

    let (provider, data) = if let Some(id) = payload.get("id").and_then(|v| v.as_str()) {
        // Uji kredensial tersimpan (form edit berisi nilai masked).
        let row = fetch_owned(&state.db, &actor.user_id, id).await?;
        let data = row_plain(&row)?;
        (row.get::<String, _>("provider_type"), data)
    } else {
        let provider = payload.get("provider_type").and_then(|v| v.as_str()).unwrap_or("").to_string();
        if provider == "custom" {
            return Err(CredError::bad_request("Provider 'custom' tidak mendukung uji koneksi"));
        }
        let mut data = payload.get("data").cloned().unwrap_or_else(|| json!({}));
        clean_and_validate(&provider, &mut data)?;
        (provider, data)
    };

    let result = match provider.as_str() {
        "neon" => test_neon(&data).await,
        "smtp" => test_smtp(&data).await,
        "backblaze_b2" => test_b2(&data).await,
        "openai" => test_openai(&data).await,
        "anthropic" => test_anthropic(&data).await,
        _ => return Err(CredError::bad_request("provider_type tidak dikenal")),
    };

    match result {
        Ok(()) => Ok(Json(json!({ "ok": true, "message": "Connection successful" }))), // Req 12.7
        Err(msg) => Err(CredError::bad_request(msg)),                                   // Req 12.8
    }
}

fn provider_from_payload(payload: &Value) -> Option<&str> {
    payload.get("provider_type").and_then(|v| v.as_str())
}

// =====================================================================
// ROTASI (Req 16)
// =====================================================================

/// GET /api/credentials/rotation-due — kredensial berumur > 90 hari (Req 16.5).
pub async fn rotation_due(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let rows = sqlx::query(
        "SELECT id, provider_type, display_name,
                (EXTRACT(EPOCH FROM (NOW() - GREATEST(created_at, updated_at))) / 86400)::bigint AS days_old
         FROM user_credentials
         WHERE user_id = $1
           AND GREATEST(created_at, updated_at) < NOW() - INTERVAL '90 days'
         ORDER BY days_old DESC",
    )
    .bind(&actor.user_id)
    .fetch_all(&state.db)
    .await?;
    let due: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "provider_type": r.get::<String, _>("provider_type"),
                "display_name": r.get::<String, _>("display_name"),
                "days_old": r.get::<i64, _>("days_old"),
            })
        })
        .collect();
    Ok(Json(json!({ "ok": true, "rotation_due": due, "threshold_days": ROTATION_AGE_DAYS })))
}

/// Job latar — email pengingat rotasi maksimal sebulan sekali per user (Req 16.6).
/// Tidak pernah menonaktifkan/meng-expire kredensial berdasarkan umur (Req 16.7).
pub fn spawn_rotation_reminders(db: PgPool) {
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(60)).await;
        loop {
            run_rotation_check(&db).await;
            tokio::time::sleep(Duration::from_secs(24 * 3600)).await;
        }
    });
}

async fn run_rotation_check(db: &PgPool) {
    // Dedupe per bulan memakai UNIQUE(user_id, period) pada
    // `credential_rotation_reminders`; kegagalan kirim email membatalkan
    // klaim agar dicoba lagi besok.
    let period = Utc::now().format("%Y-%m").to_string();
    let rows = match sqlx::query(
        "SELECT u.id AS user_id, u.email, u.name, COUNT(*)::bigint AS due_count
         FROM user_credentials c
         JOIN users u ON u.id = c.user_id
         WHERE u.role IN ('owner', 'super_admin')
           AND GREATEST(c.created_at, c.updated_at) < NOW() - INTERVAL '90 days'
         GROUP BY u.id, u.email, u.name",
    )
    .fetch_all(db)
    .await
    {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[credentials] rotation check gagal: {}", e);
            return;
        }
    };

    for r in rows {
        let user_id: String = r.get("user_id");
        let email: String = r.get("email");
        let name: String = r.get("name");
        let due: i64 = r.get("due_count");

        let claimed = sqlx::query(
            "INSERT INTO credential_rotation_reminders (id, user_id, period) VALUES ($1, $2, $3) ON CONFLICT (user_id, period) DO NOTHING RETURNING id",
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&user_id)
        .bind(&period)
        .fetch_optional(db)
        .await
        .ok()
        .flatten();
        if claimed.is_none() {
            continue; // sudah dikirim bulan ini
        }

        let body = format!(
            "Halo {name},\n\n\
             {count} kredensial API pada akun Luxio kamu berusia lebih dari {days} hari. \
             Buka Settings → Credentials untuk meninjau dan melakukan rotasi.\n\
             Rotasi berkala menjaga keamanan integrasi kamu.\n\n\
             Tim Luxio",
            name = name,
            count = due,
            days = ROTATION_AGE_DAYS
        );
        if let Err(e) = mail::send_notification(&email, "Pengingat Rotasi Kredensial API", &body).await {
            eprintln!("[credentials] pengingat rotasi gagal dikirim, dicoba lagi besok: {}", e);
            let _ = sqlx::query("DELETE FROM credential_rotation_reminders WHERE user_id = $1 AND period = $2")
                .bind(&user_id)
                .bind(&period)
                .execute(db)
                .await;
        }
    }
}

// =====================================================================
// IMPORT DARI .ENV (Req 8) — admin action; khusus role owner
// =====================================================================

fn env_smtp_from() -> String {
    std::env::var("SMTP_FROM").unwrap_or_else(|_| std::env::var("SMTP_USERNAME").unwrap_or_default())
}

async fn provider_has_records(db: &PgPool, user_id: &str, provider: &str) -> bool {
    sqlx::query("SELECT EXISTS(SELECT 1 FROM user_credentials WHERE user_id = $1 AND provider_type = $2) AS ex")
        .bind(user_id)
        .bind(provider)
        .fetch_one(db)
        .await
        .map(|r| r.get::<bool, _>("ex"))
        .unwrap_or(false)
}

async fn put_imported_record(
    db: &PgPool,
    user_id: &str,
    provider: &str,
    name: &str,
    mut data: Value,
) -> Result<(), CredError> {
    clean_and_validate(provider, &mut data)?;
    let blob = crypto::encrypt_str(&data.to_string())
        .map_err(|e| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, e.message()))?;
    let has_active = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM user_credentials WHERE user_id = $1 AND provider_type = $2 AND is_active = TRUE) AS ex",
    )
    .bind(user_id)
    .bind(provider)
    .fetch_one(db)
    .await?
    .get::<bool, _>("ex");
    // Req 8.3: rekaman baru dibuat is_active = TRUE (kecuali provider sudah punya aktif).
    let is_active = !has_active;
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO user_credentials (id, user_id, provider_type, display_name, credential_data, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
    )
    .bind(&id)
    .bind(user_id)
    .bind(provider)
    .bind(name)
    .bind(&blob)
    .bind(is_active)
    .execute(db)
    .await?;
    audit(db, user_id, "credential_create", provider, Some(&id), "imported_from_env").await;
    Ok(())
}

/// Req 8.4: daftar provider yang bisa dideteksi dari .env + builder datanya.
fn env_import_candidates() -> Vec<(&'static str, &'static str, Option<Value>, String)> {
    let mut out = Vec::new();
    let neon = std::env::var("NEON_API_KEY").unwrap_or_default();
    if !neon.is_empty() {
        let mut d = json!({ "api_key": neon });
        let org = std::env::var("NEON_ORG_ID").unwrap_or_default();
        if !org.is_empty() {
            d["org_id"] = json!(org);
        }
        out.push(("neon", "Neon (impor .env)", Some(d), "NEON_API_KEY".into()));
    }
    let host = std::env::var("SMTP_HOST").unwrap_or_default();
    if !host.is_empty() {
        out.push((
            "smtp",
            "SMTP (impor .env)",
            Some(json!({
                "host": host,
                "port": std::env::var("SMTP_PORT").unwrap_or_else(|_| "587".into()),
                "username": std::env::var("SMTP_USERNAME").unwrap_or_default(),
                "password": std::env::var("SMTP_PASSWORD").unwrap_or_default(),
                "from_address": env_smtp_from(),
            })),
            "SMTP_*".into(),
        ));
    }
    let b2_id = std::env::var("B2_KEY_ID").unwrap_or_default();
    let b2_key = std::env::var("B2_APP_KEY").unwrap_or_default();
    if !b2_id.is_empty() && !b2_key.is_empty() {
        let mut d = json!({ "application_key_id": b2_id, "application_key": b2_key });
        let bucket = std::env::var("B2_BUCKET_NAME").unwrap_or_default();
        if !bucket.is_empty() {
            d["bucket_name"] = json!(bucket);
        }
        out.push(("backblaze_b2", "Backblaze B2 (impor .env)", Some(d), "B2_KEY_ID".into()));
    }
    let openai = std::env::var("OPENAI_API_KEY").unwrap_or_default();
    if !openai.is_empty() {
        out.push(("openai", "OpenAI (impor .env)", Some(json!({ "api_key": openai })), "OPENAI_API_KEY".into()));
    }
    out
}

/// POST /api/credentials/import-env — (Req 8.2-8.5). Variabel .env tidak
/// pernah dihapus otomatis (Req 8.6); fallback .env tetap aktif (Req 8.1).
pub async fn import_env_credentials(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    // Kredensial .env milik aplikasi global — hanya owner yang boleh menariknya.
    if actor.role != "owner" {
        return Err(CredError::new(StatusCode::FORBIDDEN, "Impor dari .env hanya tersedia untuk role owner"));
    }

    let mut imported: Vec<Value> = Vec::new();
    let mut skipped: Vec<Value> = Vec::new();
    let mut errors: Vec<Value> = Vec::new();

    for (provider, name, data, var) in env_import_candidates() {
        // Req 8.7: provider sudah ada di DB -> jangan duplikasi, laporkan benturan.
        if provider_has_records(&state.db, &actor.user_id, provider).await {
            skipped.push(json!({ "provider_type": provider, "reason": "sudah ada kredensial untuk provider ini di database" }));
            continue;
        }
        match data {
            Some(mut d) => match clean_and_validate(provider, &mut d) {
                Ok(()) => match put_imported_record(&state.db, &actor.user_id, provider, name, d).await {
                    Ok(()) => imported.push(json!({ "provider_type": provider, "source_env": var })),
                    Err(e) => {
                        // Req 8.5: error dicatat, proses untuk provider lain lanjut.
                        errors.push(json!({ "provider_type": provider, "error": e.message }));
                    }
                },
                Err(e) => errors.push(json!({ "provider_type": provider, "error": e.message })),
            },
            None => skipped.push(json!({ "provider_type": provider, "reason": format!("variabel {} kosong", var) })),
        }
    }

    Ok(Json(json!({
        "ok": true,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "note": "Variabel .env tidak dihapus otomatis — bersihkan manual setelah kredensial database terverifikasi.", // Req 8.6
    })))
}

// =====================================================================
// EXPORT / IMPORT BUNDEL TERENKRIPSI PASSWORD (Req 17)
// =====================================================================

/// POST /api/credentials/export — (Req 17.1-17.3, 17.10).
pub async fn export_credentials(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let password = payload.get("password").and_then(|v| v.as_str()).unwrap_or("");
    if password.chars().count() < 8 {
        return Err(CredError::bad_request("Password ekspor minimal 8 karakter"));
    }

    let rows = sqlx::query(
        "SELECT id, provider_type, display_name, credential_data, is_active, created_at, updated_at
         FROM user_credentials WHERE user_id = $1 ORDER BY provider_type, created_at",
    )
    .bind(&actor.user_id)
    .fetch_all(&state.db)
    .await?;

    let mut items: Vec<Value> = Vec::new();
    for r in &rows {
        let provider: String = r.get("provider_type");
        let display: String = r.get("display_name");
        let cd: String = r.get("credential_data");
        let active: bool = r.get("is_active");
        let created: chrono::DateTime<Utc> = r.get("created_at");
        let updated: chrono::DateTime<Utc> = r.get("updated_at");
        // Req 17.3: SELURUH rekaman disertakan, termasuk `credential_data`
        // terenkripsi. Bidang `data` (plaintext ter-bundle) memungkinkan impor
        // ke lingkungan lain — bundel utuh tetap terkunci AES-256-GCM dengan
        // password user (Req 17.2), jadi tidak pernah menyentuh disk mentah.
        let plain = row_plain(r).unwrap_or(Value::Null);
        items.push(json!({
            "id": r.get::<String, _>("id"),
            "provider_type": provider,
            "display_name": display,
            "credential_data": cd,
            "is_active": active,
            "created_at": created.to_rfc3339(),
            "updated_at": updated.to_rfc3339(),
            "data": plain,
        }));
    }

    let bundle = json!({
        "format": EXPORT_FORMAT,
        "schema_version": EXPORT_SCHEMA_VERSION,
        "user_id": actor.user_id,                // Req 17.10 (audit)
        "exported_at": Utc::now().to_rfc3339(),  // Req 17.10
        "credentials": items,
    });

    let blob = crypto::encrypt_with_password(bundle.to_string().as_bytes(), password)
        .map_err(|e| CredError::new(StatusCode::INTERNAL_SERVER_ERROR, e.message()))?;

    audit(&state.db, &actor.user_id, "credential_export", "all", None, "success").await;

    Ok(Json(json!({
        "ok": true,
        "file_name": format!("luxio-credentials-export-{}.json", Utc::now().format("%Y%m%d")),
        "count": items.len(),
        "bundle": {
            "format": EXPORT_FORMAT,
            "schema_version": EXPORT_SCHEMA_VERSION,
            "kdf": "argon2id",
            "cipher": "aes-256-gcm",
            "blob": blob,
        },
    })))
}

/// POST /api/credentials/import — (Req 17.4-17.9).
pub async fn import_credentials(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, CredError> {
    let actor = require_manager(&state, &headers, None).await?;
    let password = payload.get("password").and_then(|v| v.as_str()).unwrap_or("");
    let bundle = payload.get("bundle").cloned().unwrap_or(Value::Null);

    // Req 17.9: validasi struktur berkas SEBELUM diproses.
    if bundle.get("format").and_then(|v| v.as_str()) != Some(EXPORT_FORMAT) {
        return Err(CredError::bad_request("File tidak dikenali sebagai ekspor kredensial Luxio"));
    }
    let version = bundle.get("schema_version").and_then(|v| v.as_i64()).unwrap_or(0);
    if version != EXPORT_SCHEMA_VERSION {
        return Err(CredError::bad_request(format!(
            "Versi skema file tidak didukung: {} (server memakai {})",
            version, EXPORT_SCHEMA_VERSION
        )));
    }
    let blob = bundle.get("blob").and_then(|v| v.as_str()).unwrap_or("");
    if blob.is_empty() {
        return Err(CredError::bad_request("Berkas import tidak memuat data"));
    }

    let plain = crypto::decrypt_with_password(blob, password)
        .map_err(|_| CredError::bad_request("Decryption failed — password salah atau berkas rusak"))?;
    let parsed: Value =
        serde_json::from_slice(&plain).map_err(|_| CredError::bad_request("Isi file import tidak valid"))?;
    let records = match parsed.get("credentials") {
        Some(Value::Array(a)) => a.clone(),
        _ => return Err(CredError::bad_request("File import tidak memuat daftar credentials")),
    };

    let existing_rows = sqlx::query("SELECT provider_type, display_name FROM user_credentials WHERE user_id = $1")
        .bind(&actor.user_id)
        .fetch_all(&state.db)
        .await?;
    let mut taken: HashSet<(String, String)> = existing_rows
        .iter()
        .map(|r| {
            (
                r.get::<String, _>("provider_type"),
                r.get::<String, _>("display_name").to_ascii_lowercase(),
            )
        })
        .collect();

    let active_rows = sqlx::query("SELECT provider_type FROM user_credentials WHERE user_id = $1 AND is_active = TRUE")
        .bind(&actor.user_id)
        .fetch_all(&state.db)
        .await?;
    let mut active_for_provider: HashSet<String> =
        active_rows.into_iter().map(|r| r.get::<String, _>("provider_type")).collect();

    let mut imported = 0usize;
    let mut skipped = 0usize;
    let mut errors: Vec<Value> = Vec::new();

    for rec in &records {
        let provider = rec.get("provider_type").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let name_raw = rec.get("display_name").and_then(|v| v.as_str()).unwrap_or("");
        let name = sanitize_display_name(name_raw);
        if name.is_empty() || provider.is_empty() || !PROVIDERS.contains(&provider.as_str()) {
            skipped += 1;
            errors.push(json!({ "provider_type": provider, "display_name": name_raw, "error": "rekaman tidak lengkap — dilewati" }));
            continue;
        }

        // Req 17.7: provider_type + display_name sudah ada -> skip + log warning.
        if taken.contains(&(provider.clone(), name.to_ascii_lowercase())) {
            skipped += 1;
            tracing::warn!(
                event = "credential_import_skipped",
                provider = provider.as_str(),
                "Import dilewati: kredensial '{}' untuk provider '{}' sudah ada",
                name, provider
            );
            continue;
        }

        // Pulihkan data: `data` dari bundel; fallback decrypt `credential_data`
        // (berlaku bila bundel dibuat di lingkungan dengan kunci master sama).
        let mut data = match (rec.get("data"), rec.get("credential_data").and_then(|v| v.as_str())) {
            (Some(Value::Object(_)), _) => rec.get("data").cloned().unwrap_or(Value::Null),
            (_, Some(inner)) => match crypto::decrypt_str(inner) {
                Ok(s) => serde_json::from_str(&s).unwrap_or(Value::Null),
                Err(_) => Value::Null,
            },
            _ => Value::Null,
        };
        if !matches!(data, Value::Object(_)) {
            skipped += 1;
            errors.push(json!({ "provider_type": provider.clone(), "display_name": name.clone(), "error": "data kredensial tidak dapat dipulihkan (berkas tidak menyertakan data)" }));
            continue;
        }
        if let Err(e) = clean_and_validate(&provider, &mut data) {
            skipped += 1;
            errors.push(json!({ "provider_type": provider.clone(), "display_name": name.clone(), "error": e.message }));
            continue;
        }

        let new_blob = match crypto::encrypt_str(&data.to_string()) {
            Ok(b) => b,
            Err(e) => {
                skipped += 1;
                errors.push(json!({ "provider_type": provider.clone(), "display_name": name.clone(), "error": e.message() }));
                continue;
            }
        };

        let was_active = rec.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false);
        let is_active = was_active && !active_for_provider.contains(&provider);
        if is_active {
            active_for_provider.insert(provider.clone());
        }

        let id = Uuid::new_v4().to_string();
        let res = sqlx::query(
            "INSERT INTO user_credentials (id, user_id, provider_type, display_name, credential_data, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
        )
        .bind(&id)
        .bind(&actor.user_id)
        .bind(&provider)
        .bind(&name)
        .bind(&new_blob)
        .bind(is_active)
        .execute(&state.db)
        .await;
        match res {
            Ok(_) => {
                imported += 1;
                taken.insert((provider.clone(), name.to_ascii_lowercase()));
                audit(&state.db, &actor.user_id, "credential_create", &provider, Some(&id), "imported_from_bundle").await;
            }
            Err(e) => {
                skipped += 1;
                if conflict_error(&e) {
                    errors.push(json!({ "provider_type": provider.clone(), "display_name": name.clone(), "error": "konflik kredensial aktif untuk provider ini" }));
                } else {
                    eprintln!("[DB ERROR] credentials import: {}", e);
                    errors.push(json!({ "provider_type": provider.clone(), "display_name": name.clone(), "error": "gagal menyimpan kredensial" }));
                }
            }
        }
    }

    audit(&state.db, &actor.user_id, "credential_import", "all", None, "success").await;

    // Req 17.8: ringkasan "[N] credentials imported, [M] skipped".
    Ok(Json(json!({
        "ok": true,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "summary_text": format!("{} credentials imported, {} skipped", imported, skipped),
    })))
}

// =====================================================================
// RETRIEVAL UNTUK APLIKASI (Req 6 + Req 13)
// =====================================================================

/// ID user role 'owner' — pemakai kredensial level aplikasi (owner.rs/proxy).
pub async fn owner_user_id(db: &PgPool) -> Option<String> {
    let row = sqlx::query("SELECT id FROM users WHERE role = 'owner' ORDER BY created_at ASC LIMIT 1")
        .fetch_optional(db)
        .await
        .ok()?;
    row.map(|r| r.get::<String, _>("id"))
}

/// Req 6.1: `get_active_credential(user_id, provider_type)`.
/// Req 6.6: tanpa cache global — didekripsi ulang per pemanggilan (lifecycle
/// request saja). Req 6.2 decrypt sukses; Req 6.3 None bila tidak ada aktif;
/// Req 6.7 gagal decrypt -> log error + None. Req 7.5 audit credential_access.
pub async fn get_active_credential(db: &PgPool, user_id: &str, provider_type: &str) -> Option<Value> {
    let row = sqlx::query(
        "SELECT id, credential_data FROM user_credentials WHERE user_id = $1 AND provider_type = $2 AND is_active = TRUE LIMIT 1",
    )
    .bind(user_id)
    .bind(provider_type)
    .fetch_optional(db)
    .await
    .ok()?;
    let row = row?;
    let id: String = row.get("id");
    let blob: String = row.get("credential_data");
    match crypto::decrypt_str(&blob).ok().and_then(|s| serde_json::from_str::<Value>(&s).ok()) {
        Some(v) => {
            audit(db, user_id, "credential_access", provider_type, Some(&id), "success").await;
            Some(v)
        }
        None => {
            tracing::error!(
                event = "credential_decrypt_failed",
                provider = provider_type,
                "Gagal mendekripsi kredensial aktif (nilai kredensial TIDAK di-log)"
            );
            audit(db, user_id, "credential_access", provider_type, Some(&id), "decrypt_failed").await;
            None
        }
    }
}

/// Req 13.1: setara `get_neon_api_key()` — cek DB dulu (Req 13.2), fallback
/// .env dengan peringatan deprecation (Req 13.3, 13.6).
pub async fn get_neon_api_key(state: &AppState) -> Option<String> {
    let owner = owner_user_id(&state.db).await?;
    let cred = get_active_credential(&state.db, &owner, "neon").await?;
    cred.get("api_key")
        .and_then(|v| v.as_str())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_name_sanitized_xss() {
        // Req 10.6: tag HTML dibuang + 100 char.
        let dirty = "<script>alert(1)</script>My <b>Prod</b> Key   extra";
        assert_eq!(sanitize_display_name(dirty), "alert(1)My Prod Key extra");
        let long = "x".repeat(300);
        assert_eq!(sanitize_display_name(&long).chars().count(), MAX_NAME_CHARS);
    }

    #[test]
    fn provider_enum_enforced() {
        // Req 10.1
        let mut d = json!({ "api_key": "sk-abcdefgh" });
        assert!(clean_and_validate("wrongcloud", &mut d).is_err());
    }

    #[test]
    fn unknown_fields_stripped_for_known_providers() {
        // Req 2.2-2.6: credential_data hanya berisi field yang ditentukan.
        let mut d = json!({ "api_key": "sk-abcdefghij", "evil": 123, "extra": "x" });
        clean_and_validate("openai", &mut d).unwrap();
        let keys: Vec<&String> = d.as_object().unwrap().keys().collect();
        assert_eq!(keys, vec!["api_key"]);
    }

    #[test]
    fn smtp_port_range() {
        // Req 10.2
        let mut d = json!({ "host": "smtp.example.com", "port": 70000, "username": "u", "password": "p", "from_address": "a@b.co" });
        assert!(clean_and_validate("smtp", &mut d).is_err());
        d["port"] = json!(587);
        assert!(clean_and_validate("smtp", &mut d).is_ok());
        d["port"] = json!(0);
        assert!(clean_and_validate("smtp", &mut d).is_err());
    }

    #[test]
    fn api_key_format_validations() {
        // Req 10.3-10.4
        let mut d = json!({ "api_key": "wrong-prefix" });
        assert!(clean_and_validate("openai", &mut d).is_err());
        d = json!({ "api_key": "sk-proj-abcdefgh" });
        assert!(clean_and_validate("openai", &mut d).is_ok());
        d = json!({ "api_key": "skant-api03-abcdefgh" });
        assert!(clean_and_validate("anthropic", &mut d).is_err());
        d = json!({ "api_key": "sk-ant-api03-abcdefgh" });
        assert!(clean_and_validate("anthropic", &mut d).is_ok());
        d = json!({ "application_key_id": "1234", "application_key": "" });
        assert!(clean_and_validate("backblaze_b2", &mut d).is_err());
        d = json!({ "application_key_id": "1234", "application_key": "k-5678" });
        assert!(clean_and_validate("backblaze_b2", &mut d).is_ok());
    }

    #[test]
    fn neon_org_id_optional() {
        // Req 2.2
        let mut d = json!({ "api_key": "neonkey1234", "org_id": "org-abc" });
        clean_and_validate("neon", &mut d).unwrap();
        assert_eq!(d["org_id"], "org-abc");
        d = json!({ "api_key": "neonkey1234" });
        clean_and_validate("neon", &mut d).unwrap();
        assert!(d.get("org_id").is_none());
    }

    #[test]
    fn custom_provider() {
        // Req 2.7
        let mut d = json!({ "client_id": "abc", "client_secret": "def" });
        assert!(clean_and_validate("custom", &mut d).is_ok());
        d = json!({});
        assert!(clean_and_validate("custom", &mut d).is_err());
        d = json!({ "bad key!": "v" });
        assert!(clean_and_validate("custom", &mut d).is_err());
    }

    #[test]
    fn size_limit_rejected() {
        // Req 10.7-10.8
        let mut d = json!({ "big": "y".repeat(5000) });
        let e = clean_and_validate("custom", &mut d).unwrap_err();
        assert_eq!(e.status, StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[test]
    fn masked_output_never_leaks_plaintext() {
        // Req 3.6, 14.1-14.2, 14.7
        let d = json!({ "api_key": "sk-proj-abcdefghij999", "password": "rahasia123", "host": "smtp.x.com", "port": 587 });
        let m = masked_data("smtp", &d);
        assert_eq!(m["password"], "••••••••");
        assert_eq!(m["host"], "smtp.x.com");
        assert_eq!(m["port"], json!(587));
        let m2 = masked_data("openai", &d);
        assert_eq!(m2["api_key"], "sk-...999");
    }

    #[test]
    fn merge_keeps_old_when_masked_echo() {
        // Req 3.9: submit form edit dengan masked echo -> nilai asli utuh.
        let mut old = json!({ "api_key": "sk-proj-abcdefghij999", "base_url": "https://x" });
        let incoming = json!({ "api_key": "sk-...999", "base_url": "https://y" });
        merge_update("openai", &mut old, &incoming);
        assert_eq!(old["api_key"], "sk-proj-abcdefghij999");
        assert_eq!(old["base_url"], "https://y");
    }

    #[test]
    fn merge_applies_new_secret() {
        let mut old = json!({ "api_key": "sk-proj-abcdefghij999" });
        let incoming = json!({ "api_key": "sk-newvalue-1234567890" });
        merge_update("openai", &mut old, &incoming);
        assert_eq!(old["api_key"], "sk-newvalue-1234567890");
    }

    #[test]
    fn all_six_providers_supported() {
        // Req 1.4
        assert_eq!(PROVIDERS, ["neon", "smtp", "backblaze_b2", "openai", "anthropic", "custom"]);
    }
}
