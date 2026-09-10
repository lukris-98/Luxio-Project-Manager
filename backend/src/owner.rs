use axum::{
    extract::{Query, State},
    http::HeaderMap,
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use std::collections::HashMap;
use uuid::Uuid;

use crate::AppState;
use crate::handlers::{require_auth, rate_limited, sha256, generate_otp};
use crate::models::{AttendanceAdminQuery, AttendanceRequest, AttendanceQuery, IncentiveRequest, MailTestRequest, OwnerConfigRequest, SalaryQuery};

// =====================================================================
// KREDENSIAL APLIKASI (env Space) — TIDAK PERNAH dikirim ke frontend.
// Set di Settings Space: NEON_API_KEY, B2_KEY_ID, B2_APP_KEY, HF_TOKEN.
// Frontend memanggil dengan placeholder "APP_NEON"/"APP_B2" pada header
// Authorization; proxy menggantinya dengan kredensial asli server-side.
// =====================================================================

fn app_neon_key() -> String {
    std::env::var("NEON_API_KEY").unwrap_or_default()
}

/// Client HTTP bersama: hanya connect-timeout ketat, TANPA total timeout
/// (upload B2 & stream log HF bisa lama; batas waktu diatur per-panggilan).
fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .user_agent("LuxioBackend/1.0 (+storage-proxy)")
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

/// Cetak rantai penyebab error reqwest (DNS/TLS/connect) agar bisa
/// didiagnosis dari log container HF.
fn log_reqwest_chain(tag: &str, e: &reqwest::Error) {
    eprintln!("[{}] request gagal: {}", tag, e);
    let mut src = std::error::Error::source(e);
    while let Some(s) = src {
        eprintln!("[{}]   caused by: {}", tag, s);
        src = s.source();
    }
}

/// Client yang memaksa IPv4 untuk host pada `url` — fallback bila
/// percobaan normal gagal (container kadang punya rute IPv6 rusak).
/// SNI/validasi sertifikat tetap memakai hostname aslinya.
async fn ipv4_client(url: &reqwest::Url) -> Option<reqwest::Client> {
    let host = url.host_str()?.to_string();
    let port = url.port_or_known_default().unwrap_or(443);
    // 1) DNS resolver biasa.
    if let Ok(addrs) = tokio::net::lookup_host((host.as_str(), port)).await {
        for a in addrs {
            if let std::net::SocketAddr::V4(v) = a {
                return build_pinned_client(&host, std::net::IpAddr::V4(*v.ip()), port).await;
            }
        }
    }
    // 2) Resolver rusak → DNS-over-HTTPS via Cloudflare (1.1.1.1).
    if let Some(ip) = doh_resolve(&host).await {
        return build_pinned_client(&host, ip, port).await;
    }
    None
}

async fn build_pinned_client(host: &str, ip: std::net::IpAddr, port: u16) -> Option<reqwest::Client> {
    reqwest::Client::builder()
        .user_agent("LuxioBackend/1.0 (+storage-proxy)")
        .connect_timeout(std::time::Duration::from_secs(10))
        .resolve(host, std::net::SocketAddr::new(ip, port))
        .build()
        .ok()
}

/// Resolve hostname via DNS-over-HTTPS (multi-provider fallback).
/// Resolver sistem di container sering gagal (EAI_NODATA); DoH tidak
/// tergantung resolver lokal (endpoint memakai IP literal).
async fn doh_resolve(host: &str) -> Option<std::net::IpAddr> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(4))
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .ok()?;
    let providers = [
        "https://1.1.1.1/dns-query",
        "https://8.8.8.8/resolve",
        "https://dns.google/resolve",
    ];
    for url in providers {
        let res = client
            .get(url)
            .query(&[("name", host), ("type", "A")])
            .header("accept", "application/dns-json")
            .send()
            .await;
        let Ok(resp) = res else { continue };
        let Ok(body) = resp.json::<Value>().await else { continue };
        if let Some(ip) = body
            .get("Answer")
            .and_then(|a| a.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|a| a.get("data").and_then(|d| d.as_str()))
                    .find_map(|s| s.parse::<std::net::IpAddr>().ok())
            })
            .flatten()
        {
            eprintln!("[DOH] {} -> {} via {}", host, ip, url);
            return Some(ip);
        }
    }
    eprintln!("[DOH] semua provider gagal untuk {}", host);
    None
}

struct AppB2Session {
    api_url: String,
    token: String,
    account_id: String,
    fetched_at: std::time::Instant,
}

static APP_B2_SESSION: std::sync::Mutex<Option<AppB2Session>> = std::sync::Mutex::new(None);

/// Authorize B2 memakai kredensial aplikasi (env), cache ~20 jam.
async fn app_b2_session() -> Result<(String, String, String), StatusCode> {
    {
        let guard = APP_B2_SESSION.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(s) = guard.as_ref() {
            if s.fetched_at.elapsed() < std::time::Duration::from_secs(20 * 3600) {
                return Ok((s.api_url.clone(), s.token.clone(), s.account_id.clone()));
            }
        }
    }
    let key_id = std::env::var("B2_KEY_ID").unwrap_or_default();
    let app_key = std::env::var("B2_APP_KEY").unwrap_or_default();
    if key_id.is_empty() || app_key.is_empty() {
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }
    // DNS di container kadang gagal untuk host tertentu → fallback DoH.
    let url: reqwest::Url = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account".parse().unwrap();
    let auth: Value = {
        let base_req = || async {
            http_client()
                .get(url.clone())
                .basic_auth(&key_id, Some(&app_key))
                .timeout(std::time::Duration::from_secs(20))
        };
        match base_req().await.send().await {
            Ok(r) => r,
            Err(e) => {
                log_reqwest_chain("B2 SESSION", &e);
                let Some(c4) = ipv4_client(&url).await else {
                    return Err(StatusCode::BAD_GATEWAY);
                };
                c4.get(url.clone())
                    .basic_auth(&key_id, Some(&app_key))
                    .timeout(std::time::Duration::from_secs(20))
                    .send()
                    .await
                    .map_err(|e2| {
                        log_reqwest_chain("B2 SESSION (doh)", &e2);
                        StatusCode::BAD_GATEWAY
                    })?
            }
        }
    }
    .json()
    .await
    .map_err(|_| StatusCode::BAD_GATEWAY)?;
    let api_url = auth.get("apiUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let token = auth.get("authorizationToken").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let account_id = auth.get("accountId").and_then(|v| v.as_str()).unwrap_or("").to_string();
    if api_url.is_empty() || token.is_empty() {
        return Err(StatusCode::BAD_GATEWAY);
    }
    {
        let mut guard = APP_B2_SESSION.lock().unwrap_or_else(|e| e.into_inner());
        *guard = Some(AppB2Session {
            api_url: api_url.clone(),
            token: token.clone(),
            account_id: account_id.clone(),
            fetched_at: std::time::Instant::now(),
        });
    }
    Ok((api_url, token, account_id))
}

/// GET /api/storage/app-session — info sesi aplikasi untuk frontend
/// (TANPA kredensial apa pun; hanya metadata yang tidak sensitif).
pub async fn storage_app_session(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let _user_id = require_auth(&state, &headers).await?;
    let neon_ok = !app_neon_key().is_empty();
    let (b2_ok, account_id, download_url) = match app_b2_session().await {
        Ok((_, _, account)) => {
            let dl = std::env::var("B2_DOWNLOAD_URL").unwrap_or_default();
            (true, account, dl)
        }
        Err(_) => (false, String::new(), String::new()),
    };
    Ok(Json(json!({
        "ok": true,
        "neon": neon_ok,
        "b2": b2_ok,
        "account": account_id,
        "downloadUrl": download_url,
    })))
}

// =====================================================================
// BANG MOTION — riwayat prompt/generasi (metadata di Neon, HTML di B2).
// =====================================================================

/// POST /api/bang-motion/prompts — simpan metadata satu generasi.
pub async fn bang_motion_save(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO bang_motion_prompts
            (id, user_id, title, prompt, style, duration, ratio, extras, provider,
             b2_file_name, b2_file_id, b2_url, size_bytes, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'done',NOW())",
    )
    .bind(&id)
    .bind(&user_id)
    .bind(payload.get("title").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("prompt").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("style").and_then(|v| v.as_str()).unwrap_or("auto"))
    .bind(payload.get("duration").and_then(|v| v.as_i64()).unwrap_or(20) as i32)
    .bind(payload.get("ratio").and_then(|v| v.as_str()).unwrap_or("16:9"))
    .bind(payload.get("extras").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("provider").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("b2_file_name").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("b2_file_id").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("b2_url").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("size_bytes").and_then(|v| v.as_i64()).unwrap_or(0))
    .execute(&state.db)
    .await
    .map_err(|e| { eprintln!("[DB ERROR] {}", e); StatusCode::INTERNAL_SERVER_ERROR })?;
    Ok(Json(json!({ "ok": true, "id": id })))
}

/// GET /api/bang-motion/prompts — daftar riwayat milik user.
pub async fn bang_motion_list(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let rows = sqlx::query(
        "SELECT id, title, prompt, style, duration, ratio, extras, provider,
                b2_file_name, b2_file_id, b2_url, size_bytes, created_at
         FROM bang_motion_prompts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 60",
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| { eprintln!("[DB ERROR] {}", e); StatusCode::INTERNAL_SERVER_ERROR })?;
    let items: Vec<Value> = rows
        .iter()
        .map(|r| json!({
            "id": r.get::<String, _>("id"),
            "title": r.get::<String, _>("title"),
            "prompt": r.get::<String, _>("prompt"),
            "style": r.get::<String, _>("style"),
            "duration": r.get::<i32, _>("duration"),
            "ratio": r.get::<String, _>("ratio"),
            "extras": r.get::<String, _>("extras"),
            "provider": r.get::<String, _>("provider"),
            "b2_file_name": r.get::<String, _>("b2_file_name"),
            "b2_file_id": r.get::<String, _>("b2_file_id"),
            "b2_url": r.get::<String, _>("b2_url"),
            "size": r.get::<i64, _>("size_bytes"),
            "createdAt": r.get::<chrono::DateTime<Utc>, _>("created_at").timestamp_millis(),
        }))
        .collect();
    Ok(Json(json!({ "items": items })))
}

/// DELETE /api/bang-motion/prompts/{id} — hapus riwayat.
pub async fn bang_motion_delete(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    sqlx::query("DELETE FROM bang_motion_prompts WHERE id = $1 AND user_id = $2")
        .bind(&id)
        .bind(&user_id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(json!({ "ok": true })))
}

// =====================================================================
// BANG MOTION — render MP4 (puppeteer + ffmpeg) dan upload ke B2.
// =====================================================================

/// POST /api/bang-motion/render
/// Body: { htmlBase64, durationSec, fps, width, height, title }
/// Proses: tulis HTML ke tmp → node render-mp4.mjs (chromium screenshot
/// per frame → ffmpeg libx264) → upload MP4 ke B2 (bucket luxio-motion).
/// Hasil: { ok, fileName, fileId, url, sizeBytes }
pub async fn bang_motion_render(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let user_id = match require_auth(&state, &headers).await {
        Ok(u) => u,
        Err(_) => return Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Unauthorized" })))),
    };
    if rate_limited(&format!("bmrender:{}", user_id), 3, 300) {
        return Err((StatusCode::TOO_MANY_REQUESTS, Json(json!({ "error": "Tunggu sebentar sebelum render lagi (maks 3 per 5 menit)." }))));
    }

    let html_b64 = payload.get("htmlBase64").and_then(|v| v.as_str()).unwrap_or("");
    if html_b64.is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": "htmlBase64 kosong" }))));
    }
    use base64::Engine as _;
    let html = base64::engine::general_purpose::STANDARD
        .decode(html_b64)
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "base64 tidak valid" }))))?;
    let duration: f64 = payload.get("durationSec").and_then(|v| v.as_f64()).unwrap_or(20.0).clamp(1.0, 120.0);
    let fps: i64 = payload.get("fps").and_then(|v| v.as_i64()).unwrap_or(24).clamp(8, 30);
    let width: i64 = payload.get("width").and_then(|v| v.as_i64()).unwrap_or(1920);
    let height: i64 = payload.get("height").and_then(|v| v.as_i64()).unwrap_or(1080);
    let title = payload.get("title").and_then(|v| v.as_str()).unwrap_or("motion").to_string();

    // -- Tulis HTML & output ke tmp --
    let tmp = std::env::temp_dir();
    let stamp = Utc::now().timestamp_millis();
    let html_path = tmp.join(format!("bm-{}.html", stamp));
    let mp4_path = tmp.join(format!("bm-{}.mp4", stamp));
    std::fs::write(&html_path, &html)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("gagal menulis tmp: {}", e) }))))?;

    // -- Jalankan renderer --
    let script_path = std::env::var("RENDER_SCRIPT")
        .unwrap_or_else(|_| "/app/scripts/render-mp4.mjs".to_string());
    let chrome = std::env::var("CHROME_PATH").unwrap_or_else(|_| "/usr/bin/chromium".to_string());
    let out = tokio::process::Command::new("node")
        .arg(&script_path)
        .arg(&html_path)
        .arg(&mp4_path)
        .arg(fps.to_string())
        .arg(duration.to_string())
        .arg(width.to_string())
        .arg(height.to_string())
        .env("CHROME_PATH", &chrome)
        .output()
        .await;
    let out = match out {
        Ok(o) if o.status.success() => o,
        Ok(o) => {
            let err = String::from_utf8_lossy(&o.stderr).chars().rev().take(500).collect::<String>().chars().rev().collect::<String>();
            eprintln!("[BM RENDER] gagal: {}", err);
            let _ = std::fs::remove_file(&html_path);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("Render gagal: {}", err) }))));
        }
        Err(e) => {
            let _ = std::fs::remove_file(&html_path);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("node tidak tersedia: {}", e) }))));
        }
    };
    let _ = out;
    let _ = std::fs::remove_file(&html_path);

    let mp4 = std::fs::read(&mp4_path)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": format!("MP4 tidak ditemukan: {}", e) }))))?;
    let _ = std::fs::remove_file(&mp4_path);
    let size = mp4.len() as i64;

    // -- Upload MP4 ke B2 via b2 API (server-to-server) --
    // Kredensial: env B2_KEY_ID/B2_APP_KEY (utama) → fallback owner config.
    let env_kid = std::env::var("B2_KEY_ID").unwrap_or_default();
    let env_akey = std::env::var("B2_APP_KEY").unwrap_or_default();
    let (key_id, app_key) = if !env_kid.is_empty() && !env_akey.is_empty() {
        (env_kid, env_akey)
    } else {
        let cfg = cfg_get_async(&state.db, "backblaze").await.unwrap_or_else(|| json!({}));
        (
            cfg.get("key_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            cfg.get("application_key").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        )
    };
    if key_id.is_empty() || app_key.is_empty() {
        return Err((StatusCode::SERVICE_UNAVAILABLE, Json(json!({ "error": "Kredensial B2 belum diatur." }))));
    }
    let client = reqwest::Client::new();
    let auth: Value = client
        .get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account")
        .basic_auth(&key_id, Some(&app_key))
        .send()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "B2 authorize gagal" }))))?
        .json()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "B2 authorize gagal" }))))?;
    let api_url = auth.get("apiUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let auth_token = auth.get("authorizationToken").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let account_id = auth.get("accountId").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let download_url = auth.get("downloadUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();

    // Pastikan bucket ada.
    let buckets: Value = client
        .post(format!("{}/b2api/v2/b2_list_buckets", api_url))
        .header("Authorization", &auth_token)
        .json(&json!({ "accountId": account_id }))
        .send()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_list_buckets gagal" }))))?
        .json()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_list_buckets gagal" }))))?;
    let bucket = buckets
        .get("buckets")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.iter().find(|b| b.get("bucketName").and_then(|n| n.as_str()) == Some("luxio-motion")))
        .cloned()
        .unwrap_or_else(|| json!({}));
    let bucket_id = if bucket.get("bucketId").is_some() {
        bucket.get("bucketId").and_then(|v| v.as_str()).unwrap_or("").to_string()
    } else {
        let created: Value = client
            .post(format!("{}/b2api/v2/b2_create_bucket", api_url))
            .header("Authorization", &auth_token)
            .json(&json!({ "accountId": account_id, "bucketName": "luxio-motion", "bucketType": "allPublic" }))
            .send()
            .await
            .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_create_bucket gagal" }))))?
            .json()
            .await
            .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_create_bucket gagal" }))))?;
        created.get("bucketId").and_then(|v| v.as_str()).unwrap_or("").to_string()
    };

    let up: Value = client
        .post(format!("{}/b2api/v2/b2_get_upload_url", api_url))
        .header("Authorization", &auth_token)
        .json(&json!({ "bucketId": bucket_id }))
        .send()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_get_upload_url gagal" }))))?
        .json()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "b2_get_upload_url gagal" }))))?;
    let upload_url = up.get("uploadUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let upload_token = up.get("authorizationToken").and_then(|v| v.as_str()).unwrap_or("").to_string();

    // SHA1 file.
    use sha1::{Sha1, Digest as _};
    let mut hasher = Sha1::new();
    hasher.update(&mp4);
    let sha1 = format!("{:x}", hasher.finalize());
    let file_name = format!("bang-motion/{}.mp4", stamp);
    let _ = &file_name;

    let uploaded: Value = client
        .post(&upload_url)
        .header("Authorization", &upload_token)
        .header("X-Bz-File-Name", reqwest::header::HeaderValue::from_str(&file_name)
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "nama file tidak valid" }))))?)
        .header("Content-Type", "video/mp4")
        .header("X-Bz-Content-Sha1", &sha1)
        .body(mp4)
        .send()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "upload MP4 gagal" }))))?
        .json()
        .await
        .map_err(|_| (StatusCode::BAD_GATEWAY, Json(json!({ "error": "upload MP4 gagal" }))))?;

    let file_id = uploaded.get("fileId").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let url = format!("{}/file/luxio-motion/{}", download_url, file_name);

    Ok(Json(json!({
        "ok": true,
        "fileName": file_name,
        "fileId": file_id,
        "url": url,
        "sizeBytes": size,
    })))
}

// =====================================================================
// STORAGE 2FA — buka halaman Penyimpanan WAJIB 2 langkah berurutan:
//   1. Kode OTP yang dikirim ke email OWNER (master@luxio.web.id).
//   2. PIN owner (hash di users.pin_hash) — hanya setelah OTP lolos,
//      dibuktikan challenge sekali-pakai dari langkah 1.
// =====================================================================

const STORAGE_2FA_SECRET: &str = "luxio-storage-2fa-v1";

/// Challenge sekali-pakai dari storage_2fa_verify (OTP lolos) yang wajib
/// disertakan di storage_pin_verify. Mencegah PIN dipakai membuka
/// storage tanpa lebih dulu verifikasi kode email.
/// Key: challenge (UUID); Value: (user_id, kedaluwarsa).
static STORAGE_PIN_CHALLENGES: std::sync::Mutex<Option<HashMap<String, (String, chrono::DateTime<Utc>)>>> =
    std::sync::Mutex::new(None);

const STORAGE_PIN_CHALLENGE_TTL_SECS: i64 = 600;

fn issue_storage_pin_challenge(user_id: &str) -> String {
    let challenge = Uuid::new_v4().to_string();
    let now = Utc::now();
    let mut guard = STORAGE_PIN_CHALLENGES
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    let map = guard.as_mut().unwrap();
    map.retain(|_, (_, exp)| *exp > now);
    map.insert(
        challenge.clone(),
        (user_id.to_string(), now + chrono::Duration::seconds(STORAGE_PIN_CHALLENGE_TTL_SECS)),
    );
    challenge
}

/// Validasi & konsumsi challenge untuk `user_id`. `false` bila tidak ada,
/// kedaluwarsa, user tidak cocok, atau sudah pernah dipakai.
fn consume_storage_pin_challenge(challenge: &str, user_id: &str) -> bool {
    let now = Utc::now();
    let mut guard = STORAGE_PIN_CHALLENGES
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    if guard.is_none() {
        return false;
    }
    let map = guard.as_mut().unwrap();
    match map.get(challenge) {
        Some((uid, exp)) if *exp > now && uid == user_id => {
            map.remove(challenge);
            true
        }
        _ => false,
    }
}

/// POST /api/storage/2fa/send — kirim kode ke email OWNER.
pub async fn storage_2fa_send(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if rate_limited(&format!("storage2fa:{}", user_id), 3, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    let row = sqlx::query("SELECT email, name FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    let email: String = row.get("email");
    let name: String = row.get("name");

    let code = generate_otp();
    let code_hash = sha256(&format!("{}{}", code, STORAGE_2FA_SECRET));
    sqlx::query(
        "INSERT INTO storage_2fa_codes (id, user_id, code_hash, expires_at, used, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&code_hash)
    .bind(Utc::now() + chrono::Duration::minutes(5))
    .execute(&state.db)
    .await
    .map_err(|e| { eprintln!("[DB ERROR] {}", e); StatusCode::INTERNAL_SERVER_ERROR })?;

    // Kode lama langsung kadaluarsa (hanya kode terbaru berlaku).
    let _ = sqlx::query(
        "UPDATE storage_2fa_codes SET used = TRUE WHERE user_id = $1 AND id != (SELECT id FROM storage_2fa_codes WHERE user_id = $1 AND used = FALSE ORDER BY created_at DESC LIMIT 1)",
    )
    .bind(&user_id)
    .execute(&state.db)
    .await;

    let sent = crate::mail::send_login_otp(&email, &name, &code).await.unwrap_or(false);
    if !crate::mail::is_configured() {
        tracing::warn!(event = "storage_2fa_dev", code = %code, "SMTP belum dikonfigurasi — kode storage 2FA: {}", code);
    }
    // Email tujuan TIDAK dikirim balik ke client (informasi sensitif).
    Ok(Json(json!({ "ok": true, "sent": sent })))
}

/// POST /api/storage/2fa/verify — langkah 1: verifikasi kode OTP email.
/// Sukses menghasilkan `pin_challenge` sekali-pakai untuk langkah 2 (PIN).
pub async fn storage_2fa_verify(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let code = payload.get("code").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    if code.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if rate_limited(&format!("storage2fav:{}", user_id), 8, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Hanya kode OTP email yang diterima di sini — PIN owner TIDAK lagi
    // bisa dipakai melompati verifikasi email (dulu jadi alternatif).
    let code_hash = sha256(&format!("{}{}", code, STORAGE_2FA_SECRET));
    let row = sqlx::query(
        "SELECT id FROM storage_2fa_codes
         WHERE user_id = $1 AND code_hash = $2 AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(&user_id)
    .bind(&code_hash)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    match row {
        Some(r) => {
            let rid: String = r.get("id");
            let _ = sqlx::query("UPDATE storage_2fa_codes SET used = TRUE WHERE id = $1")
                .bind(&rid)
                .execute(&state.db)
                .await;
            let pin_challenge = issue_storage_pin_challenge(&user_id);
            Ok(Json(json!({
                "ok": true,
                "step": "otp",
                "pin_challenge": pin_challenge,
                "pin_expires_in": STORAGE_PIN_CHALLENGE_TTL_SECS,
            })))
        }
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

/// POST /api/storage/2fa/pin — langkah 2: verifikasi PIN owner dengan
/// challenge sekali-pakai hasil langkah 1. Dua-duanya wajib lolos
/// sebelum halaman Penyimpanan terbuka.
pub async fn storage_pin_verify(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let pin = payload.get("pin").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let challenge = payload
        .get("challenge")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    if pin.len() < 4 || pin.len() > 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Ok(Json(json!({ "ok": false, "message": "PIN harus 4-6 digit angka." })));
    }
    if rate_limited(&format!("storagepin:{}", user_id), 5, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Challenge harus ada, milik user ini, dan sekali pakai (bukti OTP lolos).
    if challenge.is_empty() || !consume_storage_pin_challenge(&challenge, &user_id) {
        return Ok(Json(json!({
            "ok": false,
            "challenge_invalid": true,
            "message": "Sesi verifikasi kedaluwarsa. Kirim ulang kode email terlebih dahulu.",
        })));
    }

    let row = sqlx::query("SELECT role, pin_hash FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let row = match row {
        Some(r) => r,
        None => return Err(StatusCode::UNAUTHORIZED),
    };
    let role: String = row.get("role");
    if role != "owner" {
        return Ok(Json(json!({ "ok": false, "message": "Hanya owner yang dapat membuka halaman ini." })));
    }
    let pin_hash: String = row.get("pin_hash");

    if pin_hash.is_empty() {
        // Owner belum punya PIN (harus pernah lewati setup PIN saat login).
        // Disimpan di sini supaya tetap terkunci untuk percobaan berikutnya.
        sqlx::query("UPDATE users SET pin_hash = $1 WHERE id = $2")
            .bind(sha256(&pin))
            .bind(&user_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    } else if pin_hash != sha256(&pin) {
        tracing::warn!(event = "storage_pin_failed", user_id = %user_id, "PIN storage salah");
        return Ok(Json(json!({ "ok": false, "message": "PIN owner salah." })));
    }

    Ok(Json(json!({ "ok": true, "step": "pin" })))
}

// =====================================================================
// BACKEND HF LOGS — baca log container/build Space via API Hugging Face
// (SSE stream → dikumpulkan jadi teks terbatas).
// =====================================================================

/// GET /api/hf/logs?stream=run|build&lines=200
/// Token HF diambil dari env `HF_TOKEN` (backend). Log hanya dibaca —
/// read-only API resmi HF, bukan scraping.
pub async fn hf_logs(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Query(q): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Value>, StatusCode> {
    let _user_id = require_auth(&state, &headers).await?;
    let token = std::env::var("HF_TOKEN").unwrap_or_default();
    if token.is_empty() {
        return Ok(Json(json!({ "ok": false, "error": "HF_TOKEN belum diset di backend." })));
    }
    let stream = q.get("stream").map(|s| s.as_str()).unwrap_or("run");
    let space = std::env::var("HF_SPACE").unwrap_or_else(|_| "lukris/n8n".to_string());
    let lines: usize = q.get("lines").and_then(|l| l.parse().ok()).unwrap_or(200).min(1000);

    let client = http_client();
    let url = format!("https://huggingface.co/api/spaces/{}/logs/{}", space, stream);
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| {
            log_reqwest_chain("HF LOGS", &e);
            StatusCode::BAD_GATEWAY
        })?;
    if !resp.status().is_success() {
        return Ok(Json(json!({ "ok": false, "error": format!("HF API status {}", resp.status()) })));
    }

    // Endpoint log HF adalah SSE stream yang TIDAK PERNAH berakhir —
    // `resp.text()` akan menggantung sampai timeout. Baca chunk dengan
    // anggaran waktu (riwayat log dikirim burst di awal koneksi).
    let mut resp = resp;
    let mut raw = String::new();
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(4);
    loop {
        if raw.len() >= 512 * 1024 {
            break;
        }
        let chunk = match tokio::time::timeout_at(deadline, resp.chunk()).await {
            Err(_) => break, // anggaran waktu habis — cukup log sejauh ini
            Ok(Ok(None)) => break,
            Ok(Err(e)) => {
                eprintln!("[HF LOGS] stream terputus: {}", e);
                break;
            }
            Ok(Ok(Some(c))) => c,
        };
        raw.push_str(&String::from_utf8_lossy(&chunk));
    }

    // SSE: baris "data: ..." → tiap event berupa JSON {"data":"..."} →
    // ekstrak isinya; fallback ke teks mentah bila bukan JSON.
    let mut collected: Vec<String> = Vec::new();
    for line in raw.lines() {
        let Some(data) = line.strip_prefix("data:") else { continue };
        let data = data.trim();
        if data.is_empty() || data == "[DONE]" {
            continue;
        }
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
            if let Some(s) = v.get("data").and_then(|d| d.as_str()) {
                collected.push(s.to_string());
                continue;
            }
        }
        collected.push(data.to_string());
    }
    let out = if collected.is_empty() {
        String::new()
    } else {
        let start = collected.len().saturating_sub(lines);
        collected[start..].join("\n")
    };
    Ok(Json(json!({ "ok": true, "space": space, "stream": stream, "logs": out })))
}

// =====================================================================
// OWNER DASHBOARD — analytics (Umami), database (Neon), storage
// (Backblaze B2), log aktivitas, profil views, absensi.
// =====================================================================
// Konfigurasi (share URL Umami, API key Neon, kredensial B2) disimpan di
// tabel `owner_config` dengan kunci JSON. Kredensial TIDAK pernah
// dikembalikan utuh ke client — hanya status "terkonfigurasi".

pub async fn is_owner(db: &PgPool, user_id: &str) -> Result<bool, StatusCode> {
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

/// Ambil API key Neon: prioritaskan env `NEON_API_KEY`, fallback ke konfigurasi
/// owner (owner_config key "neon" -> api_key).
async fn neon_api_key(state: &AppState) -> String {
    if let Ok(k) = std::env::var("NEON_API_KEY") {
        if !k.is_empty() {
            return k;
        }
    }
    cfg_get_async(&state.db, "neon")
        .await
        .and_then(|v| v.get("api_key").and_then(|k| k.as_str()).map(|s| s.to_string()))
        .unwrap_or_default()
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

    let api_key = neon_api_key(&state).await;
    if api_key.is_empty() {
        return Ok(Json(json!({ "configured": false, "message": "API key Neon belum diatur (env NEON_API_KEY atau konfigurasi owner)." })));
    }

    // Panggil Neon API: daftar project + konsumsi.
    // Coba dua host: api.neon.tech (resmi) lalu console.neon.tech —
    // DNS api.neon.tech pernah kosong total (gangguan sisi Neon).
    let client = http_client();
    let bases = ["https://api.neon.tech/v2", "https://console.neon.tech/api/v2"];

    let mut last_err = String::new();
    let mut projects: Option<Value> = None;
    for base in bases {
        let resp = client
            .get(format!("{base}/projects"))
            .header("Authorization", format!("Bearer {api_key}"))
            .timeout(std::time::Duration::from_secs(15))
            .send()
            .await;
        match resp {
            Err(e) => {
                log_reqwest_chain("NEON STATUS", &e);
                last_err = format!("tidak bisa menghubungi {base}: {e}");
                continue;
            }
            Ok(r) => {
                let status = r.status();
                if !status.is_success() {
                    let body = r.text().await.unwrap_or_default();
                    last_err = format!("Neon API {base} balas {status}: {}", {
                        let b = body.trim().to_string();
                        if b.len() > 160 { b[..160].to_string() } else { b }
                    });
                    continue;
                }
                match r.json::<Value>().await {
                    Ok(v) => {
                        projects = Some(v);
                        break;
                    }
                    Err(e) => {
                        last_err = format!("respon Neon tidak valid: {e}");
                        continue;
                    }
                }
            }
        }
    }
    let Some(projects) = projects else {
        return Ok(Json(json!({
            "configured": true,
            "error": format!("Neon API tidak tersedia. {last_err}"),
            "projects": [],
            "consumption": null,
        })));
    };

    // Konsumsi per project (v2) — pakai base pertama (pola host sama).
    let consumption_resp = client
        .get(format!("{}/consumption_history/v2/projects", bases[0]))
        .header("Authorization", format!("Bearer {api_key}"))
        .timeout(std::time::Duration::from_secs(15))
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

/// GET /api/owner/neon/org-id — ambil Organization ID dari environment variable.
/// Digunakan oleh frontend untuk mengakses organization-level endpoints.
pub async fn neon_org_id(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let org_id = std::env::var("NEON_ORG_ID").unwrap_or_default();
    
    if org_id.is_empty() {
        return Ok(Json(json!({
            "ok": false,
            "org_id": null,
            "message": "NEON_ORG_ID tidak dikonfigurasi di backend environment variables"
        })));
    }

    Ok(Json(json!({
        "ok": true,
        "org_id": org_id
    })))
}

/// POST /api/owner/neon/proxy — proxy API Neon (khusus owner).
///
/// Browser tidak bisa memanggil `console.neon.tech` langsung karena API Neon
/// tidak mengirim header CORS untuk origin aplikasi. Proxy ini meneruskan
/// panggilan dari frontend ke Neon secara server-to-server memakai API key
/// yang tersimpan di backend (env `NEON_API_KEY` / owner config).
///
/// Body: { "method": "GET|POST|PATCH|PUT|DELETE", "path": "/projects", "body": {...}? }
pub async fn neon_proxy(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let api_key = neon_api_key(&state).await;
    // Frontend boleh mengirim key sendiri (NeonExplorer) — dipakai bila ada,
    // kalau tidak pakai key yang tersimpan di backend.
    if let Some(k) = payload.get("api_key").and_then(|v| v.as_str()) {
        if !k.trim().is_empty() {
            let key = k.trim().to_string();
            return neon_proxy_forward(&state, &key, payload).await;
        }
    }
    if api_key.is_empty() {
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }
    neon_proxy_forward(&state, &api_key, payload).await
}

/// Teruskan permintaan ke API Neon (server-to-server).
async fn neon_proxy_forward(
    _state: &AppState,
    api_key: &str,
    payload: Value,
) -> Result<Json<Value>, StatusCode> {
    let method = payload.get("method").and_then(|v| v.as_str()).unwrap_or("GET").to_uppercase();
    let path = payload.get("path").and_then(|v| v.as_str()).unwrap_or("").to_string();
    // Path wajib diawali "/" dan tidak boleh berisi skema lain (anti-SSRF ringan).
    if !path.starts_with('/') || path.contains("://") {
        return Err(StatusCode::BAD_REQUEST);
    }
    let body = payload.get("body").cloned();

    let client = reqwest::Client::new();
    let url = format!("https://console.neon.tech/api/v2{path}");

    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PATCH" => client.patch(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        _ => return Err(StatusCode::BAD_REQUEST),
    };
    req = req.header("Authorization", format!("Bearer {api_key}"));
    if let Some(b) = &body {
        req = req.json(b);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| {
            eprintln!("[NEON PROXY] request gagal: {}", e);
            StatusCode::BAD_GATEWAY
        })?;

    let status = resp.status().as_u16();
    let data: Value = resp.json().await.unwrap_or_else(|_| json!({}));
    // Balikkan status asli Neon + data, supaya frontend bisa bedakan sukses/gagal.
    Ok(Json(json!({ "status": status, "data": data })))
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

/// POST /api/storage/proxy — proxy API eksternal untuk halaman Penyimpanan
/// (Neon + Backblaze B2). API tersebut tidak mengirim header CORS, jadi
/// browser tidak bisa memanggilnya langsung; backend meneruskannya
/// server-to-server.
///
/// Safeguard anti penyalahgunaan (sesuai HF Content Policy — bukan proxy
/// umum untuk mem-bypass batasan):
///   1. Wajib sesi login Luxio (require_auth).
///   2. Allowlist host ketat: hanya domain API Neon & Backblaze B2.
///   3. Rate limit per user (90 request / 10 detik).
///   4. Kredensial aplikasi TIDAK dikirim dari frontend — header
///      Authorization: Bearer APP_NEON / Basic APP_B2 diganti server-side.
///
/// Body : { url, method?, headers?, bodyBase64? }
/// Hasil: { status, contentType, bodyBase64 }
pub async fn storage_proxy(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if rate_limited(&format!("storproxy:{}", user_id), 90, 10) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // -- Validasi URL + allowlist host (anti open-proxy / SSRF) --
    let url = payload
        .get("url")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim()
        .to_string();
    let parsed = reqwest::Url::parse(&url).map_err(|_| StatusCode::BAD_REQUEST)?;
    let host = parsed.host_str().unwrap_or("").to_lowercase();
    if parsed.scheme() != "https" {
        return Err(StatusCode::BAD_REQUEST);
    }
    let allowed = host == "api.neon.tech"
        || host == "console.neon.tech"
        || host == "backblazeb2.com"
        || host.ends_with(".backblazeb2.com")
        || host.ends_with(".neon.tech");
    if !allowed {
        eprintln!("[STORAGE PROXY] host ditolak: {}", host);
        return Err(StatusCode::FORBIDDEN);
    }

    let method = payload
        .get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("GET")
        .to_uppercase();
    if !matches!(method.as_str(), "GET" | "POST" | "PUT" | "PATCH" | "DELETE") {
        return Err(StatusCode::BAD_REQUEST);
    }

    // -- Khusus B2 authorize: kredensial asli ada di env (app_b2_session
    //    sudah authorize server-side) — balas SUKSES langsung tanpa
    //    meneruskan request ke B2 (endpoint authorize menolak token sesi).
    let auth_placeholder = payload
        .get("headers")
        .and_then(|v| v.as_object())
        .and_then(|o| o.get("Authorization").or_else(|| o.get("authorization")))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let is_b2_authorize = parsed.path().contains("b2_authorize_account");
    if is_b2_authorize && auth_placeholder.contains("APP_B2") {
        let (api_url, token, account_id) = app_b2_session().await?;
        let dl = std::env::var("B2_DOWNLOAD_URL").unwrap_or_default();
        let body = json!({
            "apiUrl": api_url,
            "authorizationToken": token,
            "accountId": account_id,
            "keyName": "luxio-app",
            "downloadUrl": dl,
        });
        let bytes = serde_json::to_vec(&body).unwrap_or_default();
        use base64::Engine as _;
        return Ok(Json(json!({
            "status": 200,
            "contentType": "application/json",
            "bodyBase64": base64::engine::general_purpose::STANDARD.encode(&bytes),
        })));
    }

    let client = http_client();
    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "PATCH" => client.patch(&url),
        "DELETE" => client.delete(&url),
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    // Header dari frontend (Authorization, Content-Type, X-Bz-File-Name, dst.).
    // Header hop-by-hop / sensitif diabaikan.
    if let Some(hs) = payload.get("headers").and_then(|v| v.as_object()) {
        for (k, v) in hs {
            let lk = k.to_lowercase();
            if matches!(
                lk.as_str(),
                "host" | "content-length" | "connection" | "transfer-encoding" | "cookie" | "origin" | "referer"
            ) {
                continue;
            }
            if let Some(sv) = v.as_str() {
                // Placeholder kredensial aplikasi diganti server-side:
                //   Authorization: Bearer APP_NEON → Bearer {NEON_API_KEY}
                //   Authorization: Basic APP_B2   → {token sesi B2} (raw,
                //     API B2 memakai token tanpa prefix "Bearer")
                if lk == "authorization" && sv.contains("APP_NEON") {
                    let key = neon_api_key(&state).await;
                    if key.is_empty() {
                        return Err(StatusCode::SERVICE_UNAVAILABLE);
                    }
                    req = req.header(k.as_str(), format!("Bearer {}", key));
                    continue;
                }
                if lk == "authorization" && sv.contains("APP_B2") {
                    let (_, token, _) = app_b2_session().await?;
                    req = req.header(k.as_str(), token);
                    continue;
                }
                req = req.header(k.as_str(), sv);
            }
        }
    }

    // Body biner (base64) — dipakai untuk upload file B2 & JSON body.
    if let Some(b64) = payload.get("bodyBase64").and_then(|v| v.as_str()) {
        use base64::Engine as _;
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(b64)
            .map_err(|_| StatusCode::BAD_REQUEST)?;
        req = req.body(bytes);
    }

    let parsed_url = parsed;
    let resp = match req.timeout(std::time::Duration::from_secs(90)).send().await {
        Ok(r) => r,
        Err(e) => {
            log_reqwest_chain("STORAGE PROXY", &e);
            match ipv4_client(&parsed_url).await {
                Some(c4) => {
                    // Bangun ulang request dari payload (RequestBuilder
                    // sudah terkonsumsi oleh .send()).
                    let mut req2 = match method.as_str() {
                        "GET" => c4.get(parsed_url.clone()),
                        "POST" => c4.post(parsed_url.clone()),
                        "PUT" => c4.put(parsed_url.clone()),
                        "PATCH" => c4.patch(parsed_url.clone()),
                        _ => c4.delete(parsed_url.clone()),
                    };
                    if let Some(hs) = payload.get("headers").and_then(|v| v.as_object()) {
                        for (k, v) in hs {
                            if let Some(sv) = v.as_str() {
                                if matches!(
                                    k.to_lowercase().as_str(),
                                    "host" | "content-length" | "connection" | "transfer-encoding" | "cookie" | "origin" | "referer"
                                ) {
                                    continue;
                                }
                                req2 = req2.header(k.as_str(), sv);
                            }
                        }
                    }
                    // Header kredensial asli + body untuk retry.
                    let auth_value = payload
                        .get("headers")
                        .and_then(|v| v.as_object())
                        .and_then(|o| {
                            o.get("Authorization")
                                .or_else(|| o.get("authorization"))
                        })
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    if auth_value.contains("APP_NEON") {
                        req2 = req2.header("Authorization", format!("Bearer {}", neon_api_key(&state).await));
                    } else if auth_value.contains("APP_B2") {
                        let (_, token, _) = app_b2_session().await?;
                        req2 = req2.header("Authorization", token);
                    }
                    if let Some(b64) = payload.get("bodyBase64").and_then(|v| v.as_str()) {
                        use base64::Engine as _;
                        if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(b64) {
                            req2 = req2.body(bytes);
                        }
                    }
                    match req2.timeout(std::time::Duration::from_secs(90)).send().await {
                        Ok(r) => r,
                        Err(e2) => {
                            log_reqwest_chain("STORAGE PROXY (ipv4)", &e2);
                            return Err(StatusCode::BAD_GATEWAY);
                        }
                    }
                }
                None => return Err(StatusCode::BAD_GATEWAY),
            }
        }
    };
    let status = resp.status().as_u16();
    let content_type = resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let bytes = resp
        .bytes()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;
    use base64::Engine as _;
    let body_b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);

    Ok(Json(json!({
        "status": status,
        "contentType": content_type,
        "bodyBase64": body_b64,
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

/// POST /api/attendance — catat absen masuk (checkin) / pulang (checkout).
pub async fn create_attendance(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AttendanceRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let a_type = if payload.kind == "checkout" { "checkout" } else { "checkin" };

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
        "INSERT INTO attendance (id, user_id, company_id, type, photo_url, latitude, longitude, distance_m, status, note, team_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
    )
    .bind(&id)
    .bind(&user_id)
    .bind(&company_id)
    .bind(a_type)
    .bind(&payload.photo_url)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(payload.distance_m)
    .bind(&status)
    .bind(&payload.note)
    .bind(&payload.team_id)
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
         VALUES ($1, 'user', $2, 'attendance', $3, $4, $5, $6, $7)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(a_type)
    .bind(&id)
    .bind(&status)
    .bind(Some(&payload.note))
    .bind(Utc::now())
    .execute(&state.db)
    .await;

    Ok(Json(json!({ "ok": true, "id": id, "type": a_type, "status": status, "photo_url": payload.photo_url })))
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

/// GET /api/attendance/admin — dashboard absensi untuk admin/super_admin/owner.
/// Menampilkan data per anggota per tanggal: jam masuk (checkin) + foto,
/// jam pulang (checkout) + foto. Bila salah satu belum dilakukan, ditandai.
/// Filter: `?company_id=...&team_id=...` (opsional).
pub async fn admin_attendance_dashboard(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AttendanceAdminQuery>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

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
    if !is_admin {
        return Err(StatusCode::FORBIDDEN);
    }

    // Pastikan company milik actor (atau actor owner).
    if role != "owner" {
        let my_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
            .bind(&user_id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .get("company_id");
        if my_company.as_deref() != Some(query.company_id.as_str()) {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    // Ambil semua data absensi company (opsional filter team_id).
    let rows = if query.team_id.is_empty() {
        sqlx::query(
            "SELECT a.id, a.user_id, u.name AS user_name, u.email AS user_email,
                    a.type, a.photo_url, a.latitude, a.longitude, a.distance_m,
                    a.status, a.note, a.team_id, a.created_at
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE a.company_id = $1
             ORDER BY a.created_at DESC
             LIMIT 2000",
        )
        .bind(&query.company_id)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query(
            "SELECT a.id, a.user_id, u.name AS user_name, u.email AS user_email,
                    a.type, a.photo_url, a.latitude, a.longitude, a.distance_m,
                    a.status, a.note, a.team_id, a.created_at
             FROM attendance a
             JOIN users u ON u.id = a.user_id
             WHERE a.company_id = $1 AND a.team_id = $2
             ORDER BY a.created_at DESC
             LIMIT 2000",
        )
        .bind(&query.company_id)
        .bind(&query.team_id)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Kelompokkan per user per tanggal (lokasi waktu server UTC → pakai date di Asia/Jakarta).
    use std::collections::BTreeMap;
    let mut by_key: BTreeMap<(String, String), Vec<Value>> = BTreeMap::new();

    for r in &rows {
        let user_id: String = r.get("user_id");
        let created_at: chrono::DateTime<Utc> = r.get("created_at");
        // Konversi ke WIB (UTC+7) untuk penanggalan lokal.
        let wib = created_at + chrono::Duration::hours(7);
        let date = wib.format("%Y-%m-%d").to_string();
        by_key.entry((user_id.clone(), date)).or_default().push(json!({
            "id": r.get::<String, _>("id"),
            "type": r.get::<String, _>("type"),
            "photo_url": r.get::<String, _>("photo_url"),
            "latitude": r.get::<f64, _>("latitude"),
            "longitude": r.get::<f64, _>("longitude"),
            "distance_m": r.get::<f64, _>("distance_m"),
            "status": r.get::<String, _>("status"),
            "note": r.get::<String, _>("note"),
            "team_id": r.get::<String, _>("team_id"),
            "created_at": created_at,
        }));
    }

    // Bangun hasil: per user per tanggal, cari checkin & checkout pertama/terakhir.
    let mut records: Vec<Value> = Vec::new();
    for ((uid, date), items) in by_key {
        // Ambil nama user (dari item mana pun — konsisten).
        let row0 = &rows.iter().find(|r| r.get::<String, _>("user_id") == uid && {
            let c: chrono::DateTime<Utc> = r.get("created_at");
            (c + chrono::Duration::hours(7)).format("%Y-%m-%d").to_string() == date
        });

        let name = row0.map(|r| r.get::<String, _>("user_name")).unwrap_or_default();
        let email = row0.map(|r| r.get::<String, _>("user_email")).unwrap_or_default();

        let checkin = items.iter().find(|v| v.get("type").and_then(|t| t.as_str()) == Some("checkin"));
        let checkout = items.iter().find(|v| v.get("type").and_then(|t| t.as_str()) == Some("checkout"));

        let status = checkin
            .and_then(|c| c.get("status").and_then(|s| s.as_str()))
            .unwrap_or("missing")
            .to_string();

        records.push(json!({
            "user_id": uid,
            "user_name": name,
            "user_email": email,
            "date": date,
            "team_id": checkin.and_then(|c| c.get("team_id").and_then(|t| t.as_str())).unwrap_or("").to_string(),
            "status": status,
            "checkin": checkin.cloned(),
            "checkout": checkout.cloned(),
            "checkin_missing": checkin.is_none(),
            "checkout_missing": checkout.is_none(),
        }));
    }

    // Urut: yang "bermasalah" (checkin/checkout missing) di atas, lalu tanggal terbaru.
    records.sort_by(|a, b| {
        let am = a.get("checkin_missing").and_then(|v| v.as_bool()).unwrap_or(false) as i32
            + a.get("checkout_missing").and_then(|v| v.as_bool()).unwrap_or(false) as i32;
        let bm = b.get("checkin_missing").and_then(|v| v.as_bool()).unwrap_or(false) as i32
            + b.get("checkout_missing").and_then(|v| v.as_bool()).unwrap_or(false) as i32;
        bm.cmp(&am)
            .then_with(|| b.get("date").and_then(|v| v.as_str()).unwrap_or("").cmp(a.get("date").and_then(|v| v.as_str()).unwrap_or("")))
    });

    Ok(Json(json!({ "records": records, "count": records.len() })))
}

/// GET /api/salary/monthly — kalkulasi gaji bulanan per user berdasarkan
/// absensi (kehadiran), gaji pokok (members.salary), dan insentif.
/// Hanya admin/super_admin/owner. `?company_id=&month=YYYY-MM&team_id=`.
pub async fn salary_monthly(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<SalaryQuery>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

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
    if !is_admin {
        return Err(StatusCode::FORBIDDEN);
    }

    if role != "owner" {
        let my_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
            .bind(&user_id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .get("company_id");
        if my_company.as_deref() != Some(query.company_id.as_str()) {
            return Err(StatusCode::FORBIDDEN);
        }
    }

    // Batas bulan (YYYY-MM) → rentang waktu WIB (UTC+7) di SQL.
    let month_start = format!("{}", query.month); // 'YYYY-MM'
    if !is_valid_month(&month_start) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Semua member company (opsional filter team_id — pakai members.division_id
    // sebagai pendekatan tim; bila team_id diberikan, filter via attendance.team_id).
    let members = sqlx::query(
        "SELECT m.id AS member_id, m.name, m.email, m.position, m.salary, m.division_id, u.id AS user_id
         FROM members m
         LEFT JOIN users u ON LOWER(u.email) = LOWER(m.email)
         WHERE m.company_id = $1
         ORDER BY m.name",
    )
    .bind(&query.company_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut result: Vec<Value> = Vec::new();

    for m in &members {
        let user_id_match: Option<String> = m.get("user_id");
        let salary_text: String = m.get("salary");
        let base_salary: f64 = salary_text.trim().parse().unwrap_or(0.0);

        // Hitung kehadiran di bulan tsb (dari attendance user, type=checkin,
        // status=present, dalam rentang bulan).
        let (present_days, outside_days, total_checkins): (i64, i64, i64) = match &user_id_match {
            Some(uid) => {
                let r = sqlx::query(
                    "SELECT
                        COUNT(*) FILTER (WHERE status = 'present') AS present,
                        COUNT(*) FILTER (WHERE status = 'outside') AS outside,
                        COUNT(*) AS total
                     FROM attendance
                     WHERE user_id = $1 AND type = 'checkin'
                       AND to_char(created_at AT TIME ZONE 'UTC' + INTERVAL '7 hours', 'YYYY-MM') = $2",
                )
                .bind(uid)
                .bind(&month_start)
                .fetch_one(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                (r.get("present"), r.get("outside"), r.get("total"))
            }
            None => (0, 0, 0),
        };

        // Insentif bulan tsb.
        let incentives = if let Some(uid) = &user_id_match {
            sqlx::query(
                "SELECT id, amount, reason, created_at FROM salary_incentives
                 WHERE user_id = $1 AND month = $2 ORDER BY created_at DESC",
            )
            .bind(uid)
            .bind(&month_start)
            .fetch_all(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
        } else {
            vec![]
        };

        let total_incentive: f64 = incentives.iter().map(|i| i.get::<f64, _>("amount")).sum();
        let total_gaji: f64 = base_salary + total_incentive;

        result.push(json!({
            "member_id": m.get::<String, _>("member_id"),
            "name": m.get::<String, _>("name"),
            "email": m.get::<String, _>("email"),
            "position": m.get::<String, _>("position"),
            "user_id": user_id_match,
            "base_salary": base_salary,
            "present_days": present_days,
            "outside_days": outside_days,
            "total_checkins": total_checkins,
            "incentives": incentives.iter().map(|i| json!({
                "id": i.get::<String, _>("id"),
                "amount": i.get::<f64, _>("amount"),
                "reason": i.get::<String, _>("reason"),
                "created_at": i.get::<chrono::DateTime<Utc>, _>("created_at"),
            })).collect::<Vec<_>>(),
            "total_incentive": total_incentive,
            "total_salary": total_gaji,
        }));
    }

    Ok(Json(json!({
        "month": query.month,
        "count": result.len(),
        "records": result,
    })))
}

/// POST /api/salary/incentive — tambah insentif bulanan untuk user.
pub async fn salary_add_incentive(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<IncentiveRequest>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&actor_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("role");
    if role != "owner" && role != "super_admin" && role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    if !is_valid_month(&payload.month) {
        return Err(StatusCode::BAD_REQUEST);
    }
    if payload.amount <= 0.0 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let company_id: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
        .bind(&payload.user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("company_id");

    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO salary_incentives (id, company_id, user_id, month, amount, reason, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&id)
    .bind(&company_id)
    .bind(&payload.user_id)
    .bind(&payload.month)
    .bind(payload.amount)
    .bind(&payload.reason)
    .bind(&actor_id)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({ "ok": true, "id": id })))
}

/// DELETE /api/salary/incentive/{id} — hapus insentif.
pub async fn salary_delete_incentive(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(incentive_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&actor_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("role");
    if role != "owner" && role != "super_admin" && role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query("DELETE FROM salary_incentives WHERE id = $1")
        .bind(&incentive_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(json!({ "ok": true })))
}

/// GET /api/owner/neon/active — konfigurasi koneksi Neon aktif (khusus owner).
/// Menampilkan host & nama database dari DATABASE_URL, tanpa credential asli.
pub async fn neon_active_config(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let url = std::env::var("DATABASE_URL").unwrap_or_default();
    // parse postgres://user:pass@host:port/db?...
    let host = url
        .split('@')
        .nth(1)
        .and_then(|s| s.split('/').next())
        .unwrap_or("")
        .to_string();
    let db_name = url
        .split('@')
        .nth(1)
        .and_then(|s| s.split('/').nth(1))
        .and_then(|s| s.split('?').next())
        .unwrap_or("")
        .to_string();
    // host bisa berisi port
    let host_only = host.split(':').next().unwrap_or(&host).to_string();

    Ok(Json(json!({
        "configured": !url.is_empty(),
        "host": host_only,
        "port": host.split(':').nth(1).unwrap_or("5432"),
        "database": db_name,
        "provider": "Neon PostgreSQL",
        "note": "Ini koneksi aktif dari .env (DATABASE_URL). Kredensial disembunyikan.",
    })))
}

/// POST /api/owner/mail/test — tes kirim email (khusus owner). Mengembalikan
/// status konfigurasi SMTP & hasil pengiriman.
pub async fn mail_test(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<MailTestRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &user_id).await? {
        return Err(StatusCode::FORBIDDEN);
    }

    let to = payload.email.trim().to_string();
    if to.is_empty() || !to.contains('@') {
        return Err(StatusCode::BAD_REQUEST);
    }

    if !crate::mail::is_configured() {
        return Ok(Json(json!({
            "ok": false,
            "configured": false,
            "message": "SMTP belum dikonfigurasi. Isi SMTP_HOST/USERNAME/PASSWORD/FROM di .env lalu restart."
        })));
    }

    let subject = "Tes Email Luxio 🚀";
    let body = format!(
        "Halo!\n\nIni email uji coba dari aplikasi Luxio.\nJika kamu menerima email ini, konfigurasi SMTP Gmail sudah benar.\n\n— Tim Luxio"
    );
    match crate::mail::send_notification(&to, subject, &body).await {
        Ok(true) => Ok(Json(json!({
            "ok": true,
            "configured": true,
            "message": format!("Email tes terkirim ke {to}. Periksa kotak masuk (dan spam).")
        }))),
        Ok(false) => Ok(Json(json!({
            "ok": false,
            "configured": true,
            "message": "Pengiriman email gagal (SMTP diatur tapi tidak terkirim)."
        }))),
        Err(e) => Ok(Json(json!({
            "ok": false,
            "configured": true,
            "message": format!("Gagal mengirim: {e}")
        }))),
    }
}

fn is_valid_month(month: &str) -> bool {
    let parts: Vec<&str> = month.split('-').collect();
    if parts.len() != 2 {
        return false;
    }
    let y: i32 = parts[0].parse().unwrap_or(0);
    let m: i32 = parts[1].parse().unwrap_or(0);
    (2000..=2100).contains(&y) && (1..=12).contains(&m)
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

// =====================================================================
// PROFIL SOSIAL (TikTok-style): posting foto, like, komentar, share
// =====================================================================

/// POST /api/profile/posts — buat postingan baru (foto + caption).
pub async fn create_post(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let image_url = payload.get("image_url").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    let caption = payload.get("caption").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    if image_url.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO profile_posts (id, user_id, image_url, caption, created_at) VALUES ($1, $2, $3, $4, $5)")
        .bind(&id).bind(&user_id).bind(&image_url).bind(&caption).bind(Utc::now())
        .execute(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;
    Ok(Json(json!({ "id": id, "ok": true })))
}

/// GET /api/profile/posts — daftar postingan, bisa filter ?user_id=.
pub async fn list_posts(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    let user_filter = params.get("user_id").filter(|s| !s.is_empty());
    let (where_clause, bind_val) = if let Some(uid) = user_filter {
        ("WHERE p.user_id = $1", Some(uid.clone()))
    } else {
        ("", None)
    };
    let rows = sqlx::query_as::<_, (String, String, String, String, chrono::DateTime<Utc>)>(
        &format!(
            "SELECT p.id, p.user_id, p.image_url, p.caption, p.created_at
             FROM profile_posts p {} ORDER BY p.created_at DESC LIMIT 50", where_clause
        )
    )
    .bind(bind_val.as_deref().unwrap_or(""))
    .fetch_all(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;

    let mut posts = Vec::new();
    for (id, uid, image_url, caption, created_at) in rows {
        let like_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM profile_post_likes WHERE post_id = $1")
            .bind(&id).fetch_one(&state.db).await.unwrap_or(0);
        let comment_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM profile_post_comments WHERE post_id = $1")
            .bind(&id).fetch_one(&state.db).await.unwrap_or(0);
        let share_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM profile_post_shares WHERE post_id = $1")
            .bind(&id).fetch_one(&state.db).await.unwrap_or(0);
        let liked = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM profile_post_likes WHERE post_id = $1 AND user_id = $2")
            .bind(&id).bind(&actor_id).fetch_one(&state.db).await.unwrap_or(0) > 0;
        let author: Option<(String, String)> = sqlx::query_as("SELECT name, email FROM users WHERE id = $1")
            .bind(&uid).fetch_optional(&state.db).await.ok().flatten();
        posts.push(json!({
            "id": id, "user_id": uid, "image_url": image_url, "caption": caption,
            "created_at": created_at, "like_count": like_count, "comment_count": comment_count,
            "share_count": share_count, "liked": liked,
            "author_name": author.as_ref().map(|a| a.0.as_str()),
            "author_email": author.as_ref().map(|a| a.1.as_str()),
        }));
    }
    Ok(Json(json!({ "posts": posts })))
}

/// POST /api/profile/posts/:id/like — toggle like (like/unlike).
pub async fn toggle_like(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(post_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM profile_post_likes WHERE post_id = $1 AND user_id = $2")
        .bind(&post_id).bind(&user_id).fetch_one(&state.db).await.unwrap_or(0);
    if existing > 0 {
        sqlx::query("DELETE FROM profile_post_likes WHERE post_id = $1 AND user_id = $2")
            .bind(&post_id).bind(&user_id).execute(&state.db).await.ok();
        Ok(Json(json!({ "liked": false })))
    } else {
        sqlx::query("INSERT INTO profile_post_likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4)")
            .bind(Uuid::new_v4().to_string()).bind(&post_id).bind(&user_id).bind(Utc::now())
            .execute(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;
        Ok(Json(json!({ "liked": true })))
    }
}

/// GET /api/profile/posts/:id/comments — daftar komentar.
pub async fn list_comments(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(post_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    require_auth(&state, &headers).await?;
    let rows = sqlx::query_as::<_, (String, String, String, chrono::DateTime<Utc>)>(
        "SELECT c.id, c.user_id, c.body, c.created_at FROM profile_post_comments c WHERE c.post_id = $1 ORDER BY c.created_at ASC"
    ).bind(&post_id).fetch_all(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;
    let mut comments = Vec::new();
    for (id, uid, body, created_at) in rows {
        let author: Option<(String, String)> = sqlx::query_as("SELECT name, email FROM users WHERE id = $1")
            .bind(&uid).fetch_optional(&state.db).await.ok().flatten();
        comments.push(json!({
            "id": id, "user_id": uid, "body": body, "created_at": created_at,
            "author_name": author.as_ref().map(|a| a.0.as_str()),
            "author_email": author.as_ref().map(|a| a.1.as_str()),
        }));
    }
    Ok(Json(json!({ "comments": comments })))
}

/// POST /api/profile/posts/:id/comments — tambah komentar.
pub async fn add_comment(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(post_id): axum::extract::Path<String>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let body = payload.get("body").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
    if body.is_empty() { return Err(StatusCode::BAD_REQUEST); }
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO profile_post_comments (id, post_id, user_id, body, created_at) VALUES ($1, $2, $3, $4, $5)")
        .bind(&id).bind(&post_id).bind(&user_id).bind(&body).bind(Utc::now())
        .execute(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;
    Ok(Json(json!({ "id": id, "ok": true })))
}

/// POST /api/profile/posts/:id/share — catat share.
pub async fn share_post(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(post_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    sqlx::query("INSERT INTO profile_post_shares (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4)")
        .bind(Uuid::new_v4().to_string()).bind(&post_id).bind(&user_id).bind(Utc::now())
        .execute(&state.db).await.map_err(|e| { eprintln!("[DB] {e}"); StatusCode::INTERNAL_SERVER_ERROR })?;
    Ok(Json(json!({ "ok": true })))
}
