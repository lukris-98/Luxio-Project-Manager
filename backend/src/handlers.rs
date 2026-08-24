use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{Row, PgPool};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;
use uuid::Uuid;

use crate::models::*;
use crate::AppState;

// =====================================================================
// HANDLERS / API ENDPOINTS
// =====================================================================
// Satu fungsi per endpoint REST. Semua fungsi menerima `State` (pool DB)
// dan body JSON, lalu mengembalikan JSON (atau StatusCode bila error).
// Route dari fungsi-fungsi ini di daftarkan di lib.rs.
// =====================================================================

// ---------- RATE LIMITING (in-memory) ----------

/// Rate limiter sederhana berbasis fixed-window per key (mis. email/IP).
/// Untuk produksi skala besar ganti dengan rate limiting Cloudflare atau
/// store terdistribusi (Redis). Ini adalah lapisan kedua, bukan pengganti.
static RATE_LIMITS: Mutex<Option<HashMap<String, (chrono::DateTime<Utc>, u32)>>> = Mutex::new(None);

/// Cek apakah `key` sudah melebihi `max` request dalam `window_secs` detik.
/// Mengembalikan `true` bila rate limit tercapai (harus ditolak).
fn rate_limited(key: &str, max: u32, window_secs: i64) -> bool {
    let now = Utc::now();
    let mut guard = RATE_LIMITS.lock().unwrap_or_else(|e| e.into_inner());
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    let map = guard.as_mut().unwrap();

    match map.get_mut(key) {
        Some((window_start, count)) => {
            if *window_start + Duration::seconds(window_secs) < now {
                *window_start = now;
                *count = 1;
                false
            } else {
                *count += 1;
                *count > max
            }
        }
        None => {
            map.insert(key.to_string(), (now, 1));
            false
        }
    }
}

// ---------- VALIDASI INPUT ----------

/// Validasi dasar email (format sederhana) + panjang.
fn validate_email(email: &str) -> Result<(), StatusCode> {
    let trimmed = email.trim();
    if trimmed.is_empty() || trimmed.len() > 254 {
        return Err(StatusCode::BAD_REQUEST);
    }
    let has_at = trimmed.contains('@');
    let has_dot = trimmed.split('@').nth(1).map(|d| d.contains('.')).unwrap_or(false);
    if !has_at || !has_dot {
        return Err(StatusCode::BAD_REQUEST);
    }
    Ok(())
}

/// Validasi password: minimal 8 karakter, maksimal 128.
fn validate_password(password: &str) -> Result<(), StatusCode> {
    if password.len() < 8 || password.len() > 128 {
        return Err(StatusCode::BAD_REQUEST);
    }
    Ok(())
}

/// Validasi panjang field teks biasa.
fn validate_len(field: &str, _label: &str, max: usize) -> Result<(), StatusCode> {
    let trimmed = field.trim();
    if trimmed.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if trimmed.len() > max {
        return Err(StatusCode::BAD_REQUEST);
    }
    Ok(())
}

// ---------- HASHING ----------

/// Hash password dengan Argon2id (standar industri untuk password).
/// Hasilnya ber-prefix `$argon2id$...` sehingga bisa dibedakan dari hash lama.
fn hash_password(password: &str) -> Result<String, StatusCode> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Verifikasi password terhadap hash. Mendukung dua format:
///   - Argon2id (`$argon2id$...`) — format baru.
///   - Hash lama (DefaultHasher) — format demo lama; bila cocok, hash
///     langsung di-upgrade ke Argon2id pada login berikutnya.
fn verify_password(password: &str, hash: &str) -> bool {
    if hash.starts_with("$argon2") {
        match PasswordHash::new(hash) {
            Ok(parsed) => Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok(),
            Err(_) => false,
        }
    } else {
        // Legacy: hash DefaultHasher tanpa salt dari build demo lama.
        simple_hash(password) == hash
    }
}

/// Hash cepat (DefaultHasher) untuk demo lama.
/// CATATAN: hanya untuk kompatibilitas hash lama, JANGAN dipakai untuk
/// hashing password baru (pakai `hash_password`/Argon2id).
fn simple_hash(password: &str) -> String {
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// True bila hash yang tersimpan masih berformat lama (perlu upgrade).
fn is_legacy_hash(hash: &str) -> bool {
    !hash.starts_with("$argon2")
}

// ---------- SESSION / TOKEN ----------

/// Generate token sesi acak (128-bit via UUID v4) dan simpan hash-nya
/// di tabel `sessions`. Token mentah dikirim ke client; yang tersimpan
/// di database hanya SHA-256-nya (jadi bocornya DB tidak membocorkan token).
async fn create_session(db: &PgPool, user_id: &str) -> Result<String, StatusCode> {
    let token = Uuid::new_v4().to_string();
    let token_hash = sha256(&token);
    let expires_at = Utc::now() + Duration::days(7);

    sqlx::query(
        "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(user_id)
    .bind(&token_hash)
    .bind(Utc::now())
    .bind(expires_at)
    .execute(db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(token)
}

/// Ambil `user_id` dari header `Authorization: Bearer <token>`.
/// Mengembalikan `None` bila header tidak ada, token tidak dikenal,
/// atau sesi sudah kedaluwarsa.
async fn user_from_headers(db: &PgPool, headers: &HeaderMap) -> Result<Option<String>, StatusCode> {
    let token = match headers.get(axum::http::header::AUTHORIZATION) {
        Some(v) => v.to_str().ok().map(|s| s.to_string()),
        None => None,
    };

    let token = match token {
        Some(t) => t.strip_prefix("Bearer ").map(|t| t.to_string()),
        None => None,
    };

    let token = match token {
        Some(t) => t,
        None => return Ok(None),
    };

    let token_hash = sha256(&token);
    let row = sqlx::query(
        "SELECT user_id, expires_at FROM sessions WHERE token_hash = $1",
    )
    .bind(&token_hash)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match row {
        Some(r) => {
            let expires_at: chrono::DateTime<Utc> = r.get("expires_at");
            if expires_at < Utc::now() {
                // Sesi kedaluwarsa: hapus barisnya sekalian.
                let _ = sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
                    .bind(&token_hash)
                    .execute(db)
                    .await;
                return Ok(None);
            }
            Ok(Some(r.get::<String, _>("user_id")))
        }
        None => Ok(None),
    }
}

fn sha256(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Extractor untuk memaksa autentikasi. Gagal dengan 401 bila tidak ada
/// sesi valid pada header Authorization.
pub async fn require_auth(state: &AppState, headers: &HeaderMap) -> Result<String, StatusCode> {
    match user_from_headers(&state.db, headers).await? {
        Some(user_id) => Ok(user_id),
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

// ---------- AUTH ----------

/// POST /api/auth/register — daftar akun baru. Role pertama selalu 'member'
/// (auto-role mengikuti paket). Akun BELUM aktif sampai mengklik link
/// konfirmasi di email. Setelah verifikasi, baru bisa login.
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Rate limit per email: maksimal 5 percobaan registrasi / 10 menit.
    if rate_limited(&format!("register:{}", payload.email.trim().to_lowercase()), 5, 600) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    validate_email(&payload.email)?;
    validate_password(&payload.password)?;
    validate_len(&payload.name, "name", 100)?;

    // Cegah email ganda.
    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(payload.email.trim())
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if existing.is_some() {
        return Ok(Json(AuthResponse {
            success: false,
            message: "Email sudah terdaftar".to_string(),
            user: None,
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
        }));
    }

    let user_id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&payload.password)?;
    let verification_token = Uuid::new_v4().to_string();
    let now = Utc::now();
    let token_expires = now + Duration::hours(24);

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, created_at, email_verified, verification_token, verification_expires)
         VALUES ($1, $2, $3, $4, $5, 'personal', $6, FALSE, $7, $8)",
    )
    .bind(&user_id)
    .bind(payload.email.trim())
    .bind(&password_hash)
    .bind(payload.name.trim())
    .bind(role_for_plan("personal"))
    .bind(&now)
    .bind(&verification_token)
    .bind(token_expires)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Kirim email konfirmasi (best-effort).
    if !crate::mail::is_configured() {
        let link = format!("{}/?token={}", crate::mail::app_url(), verification_token);
        tracing::warn!(event = "verify_dev_mode", email = %payload.email.trim(), link = %link, "SMTP belum dikonfigurasi — link aktivasi untuk testing: {}", link);
    }
    tokio::spawn({
        let to = payload.email.trim().to_string();
        let name = payload.name.trim().to_string();
        let token = verification_token.clone();
        async move {
            match crate::mail::send_confirmation(&to, &name, &token, None).await {
                Ok(true) => tracing::info!(event = "confirmation_email_sent", to = %to),
                _ => tracing::warn!(event = "confirmation_email_skipped", to = %to),
            }
        }
    });

    tracing::info!(event = "register", user_id = %user_id, "user registered (pending confirmation)");

    Ok(Json(AuthResponse {
        success: true,
        message: "Registrasi berhasil. Cek email kamu untuk konfirmasi akun.".to_string(),
        user: None,
        token: None,
        requires_confirmation: Some(true),
        requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
    }))
}

/// POST /api/auth/verify — aktivasi akun memakai token dari email.
/// Berhasil => akun aktif + langsung mendapat session token (masuk dashboard).
pub async fn verify_email(
    State(state): State<AppState>,
    Json(payload): Json<VerifyEmailRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let token = payload.token.trim().to_string();
    if token.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let row = sqlx::query(
        "SELECT id, email, name, company_id, role, plan FROM users
         WHERE verification_token = $1 AND email_verified = FALSE",
    )
    .bind(&token)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err(StatusCode::BAD_REQUEST); // token tidak valid / sudah dipakai
        }
    };

    let expires: Option<chrono::DateTime<Utc>> = sqlx::query("SELECT verification_expires FROM users WHERE id = $1")
        .bind(row.get::<String, _>("id"))
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("verification_expires");

    if let Some(exp) = expires {
        if exp < Utc::now() {
            return Err(StatusCode::GONE); // token kedaluwarsa
        }
    }

    // Aktivasi akun + bersihkan token.
    sqlx::query(
        "UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = $1",
    )
    .bind(row.get::<String, _>("id"))
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Buat session agar langsung masuk dashboard.
    let user_id: String = row.get("id");
    let token_session = create_session(&state.db, &user_id).await?;

    tracing::info!(event = "email_verified", user_id = %user_id, "account activated");

    Ok(Json(AuthResponse {
        success: true,
        message: "Akun berhasil diaktifkan. Selamat datang!".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: row.get("email"),
            name: row.get("name"),
            company_id: row.get("company_id"),
            role: row.get("role"),
            plan: row.get("plan"),
            email_verified: Some(true),
            ai_provider: None,
            ai_base_url: None,
            ai_model: None,
            ai_enabled: None,
        }),
        token: Some(token_session),
        requires_confirmation: None,
        requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
    }))
}

/// POST /api/auth/login — tahap 1: verifikasi email & password.
/// Kalau akun aktif => kirim kode 2FA ke email, kembalikan `requires_2fa=true`.
/// Kalau belum aktif => `requires_confirmation=true`.
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Rate limit per email: maksimal 10 percobaan login / 10 menit (anti brute-force).
    if rate_limited(&format!("login:{}", payload.email.trim().to_lowercase()), 10, 600) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    let row = sqlx::query(
        "SELECT id, email, password_hash, name, company_id, role, plan, email_verified, pin_hash FROM users WHERE email = $1",
    )
    .bind(payload.email.trim())
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let row = match row {
        Some(r) => r,
        None => {
            tracing::warn!(event = "login_failed", reason = "user_not_found", "login failed");
            return Ok(Json(AuthResponse {
                success: false,
                message: "Email atau password salah".to_string(),
                user: None,
                token: None,
                requires_confirmation: None,
                requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
            }));
        }
    };

    let password_hash: String = row.get("password_hash");
    if !verify_password(&payload.password, &password_hash) {
        tracing::warn!(event = "login_failed", reason = "wrong_password", "login failed");
        return Ok(Json(AuthResponse {
            success: false,
            message: "Email atau password salah".to_string(),
            user: None,
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
        }));
    }

    let user_id: String = row.get("id");
    let email_verified: bool = row.get("email_verified");

    // Akun belum dikonfirmasi lewat email.
    if !email_verified {
        return Ok(Json(AuthResponse {
            success: false,
            message: "Akun belum aktif. Silakan klik link konfirmasi di email kamu.".to_string(),
            user: None,
            token: None,
            requires_confirmation: Some(true),
            requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
        }));
    }

    // Upgrade hash lama (DefaultHasher) ke Argon2id bila perlu.
    if is_legacy_hash(&password_hash) {
        if let Ok(new_hash) = hash_password(&payload.password) {
            let _ = sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
                .bind(&new_hash)
                .bind(&user_id)
                .execute(&state.db)
                .await;
        }
    }

    // Owner: skip 2FA email, pakai PIN (khusus owner).
    let owner_role: String = row.get("role");
    if owner_role == "owner" {
        let pin_hash: String = row.get("pin_hash");
        let has_pin = !pin_hash.is_empty();
        let company_id: Option<String> = row.get("company_id");
        return Ok(Json(AuthResponse {
            success: true,
            message: if has_pin { "Masukkan PIN akun".to_string() } else { "Atur PIN akun terlebih dahulu".to_string() },
            user: Some(UserResponse {
                id: user_id,
                email: row.get("email"),
                name: row.get("name"),
                company_id,
                role: owner_role,
                plan: row.get("plan"),
                email_verified: Some(true),
                ai_provider: None,
                ai_base_url: None,
                ai_model: None,
                ai_enabled: None,
            }),
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: Some(has_pin),
            requires_pin_setup: Some(!has_pin),
        }));
    }

    // Tahap 2: kirim kode 2FA (untuk non-owner).
    let code = generate_otp();
    let code_hash = sha256(&code);
    let expires_at = Utc::now() + Duration::minutes(5);

    sqlx::query(
        "INSERT INTO login_otps (id, user_id, otp_hash, expires_at, used, created_at)
         VALUES ($1, $2, $3, $4, FALSE, $5)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&code_hash)
    .bind(expires_at)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Kirim kode via email (best-effort).
    let to_email: String = row.get("email");
    let to_name: String = row.get("name");
    let smtp_configured = crate::mail::is_configured();
    if !smtp_configured {
        // Dev-mode: tanpa SMTP, kode 2FA dicetak ke console server agar
        // alur bisa diuji sebelum konfigurasi email (Gmail dll).
        tracing::warn!(event = "otp_dev_mode", email = %to_email, code = %code, "SMTP belum dikonfigurasi — kode 2FA untuk testing: {}", code);
    }
    tokio::spawn({
        let to = to_email.clone();
        let name = to_name.clone();
        let code = code.clone();
        async move {
            match crate::mail::send_login_otp(&to, &name, &code).await {
                Ok(true) => tracing::info!(event = "otp_email_sent", to = %to),
                _ => tracing::warn!(event = "otp_email_skipped", to = %to),
            }
        }
    });

    let company_id: Option<String> = row.get("company_id");
    tracing::info!(event = "login_step1", user_id = %user_id, "login step 1 passed, otp sent");

    Ok(Json(AuthResponse {
        success: true,
        message: "Kode verifikasi sudah dikirim ke email kamu.".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: to_email,
            name: to_name,
            company_id,
            role: row.get("role"),
            plan: row.get("plan"),
            email_verified: Some(true),
            ai_provider: None,
            ai_base_url: None,
            ai_model: None,
            ai_enabled: None,
        }),
        token: None,
        requires_confirmation: None,
        requires_2fa: Some(true),
            requires_pin: None,
            requires_pin_setup: None,
    }))
}

/// POST /api/auth/verify-pin — verifikasi PIN owner setelah login.
/// Bila PIN belum ada (owner baru), PIN disimpan & login langsung diterima.
pub async fn verify_pin(
    State(state): State<AppState>,
    Json(payload): Json<VerifyPinRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    if rate_limited(&format!("pin:{}", payload.email.trim().to_lowercase()), 5, 10) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    let pin = payload.pin.trim();
    // PIN 4-6 digit
    if pin.len() < 4 || pin.len() > 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Ok(Json(AuthResponse {
            success: false,
            message: "PIN harus 4-6 digit angka".to_string(),
            user: None,
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
        }));
    }

    let row = sqlx::query(
        "SELECT id, email, name, company_id, role, plan, pin_hash FROM users WHERE email = $1",
    )
    .bind(payload.email.trim())
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let row = match row {
        Some(r) => r,
        None => {
            return Ok(Json(AuthResponse {
                success: false,
                message: "Akun tidak ditemukan".to_string(),
                user: None,
                token: None,
                requires_confirmation: None,
                requires_2fa: None,
                requires_pin: None,
                requires_pin_setup: None,
            }))
        }
    };

    let user_id: String = row.get("id");
    let role: String = row.get("role");
    if role != "owner" {
        return Err(StatusCode::FORBIDDEN); // PIN hanya untuk owner
    }

    let pin_hash: String = row.get("pin_hash");
    let pin_hash_now = sha256(pin);

    if pin_hash.is_empty() {
        // Owner baru: simpan PIN, langsung login.
        sqlx::query("UPDATE users SET pin_hash = $1 WHERE id = $2")
            .bind(&pin_hash_now)
            .bind(&user_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    } else if pin_hash != pin_hash_now {
        tracing::warn!(event = "pin_failed", user_id = %user_id, "pin salah");
        return Ok(Json(AuthResponse {
            success: false,
            message: "PIN salah".to_string(),
            user: None,
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: Some(true),
            requires_pin_setup: None,
        }));
    }

    let token = create_session(&state.db, &user_id).await?;
    tracing::info!(event = "login_owner_pin", user_id = %user_id, "owner login via PIN");

    Ok(Json(AuthResponse {
        success: true,
        message: "Login berhasil".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: row.get("email"),
            name: row.get("name"),
            company_id: row.get("company_id"),
            role: role.clone(),
            plan: row.get("plan"),
            email_verified: Some(true),
            ai_provider: None,
            ai_base_url: None,
            ai_model: None,
            ai_enabled: None,
        }),
        token: Some(token),
        requires_confirmation: None,
        requires_2fa: None,
        requires_pin: None,
        requires_pin_setup: None,
    }))
}

/// PUT /api/profile/pin — ganti PIN (butuh token sesi). Hanya owner.
pub async fn set_pin(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<SetPinRequest>,
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
    if role != "owner" {
        return Err(StatusCode::FORBIDDEN);
    }

    let pin = payload.pin.trim();
    if pin.len() < 4 || pin.len() > 6 || !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let pin_hash = sha256(pin);
    sqlx::query("UPDATE users SET pin_hash = $1 WHERE id = $2")
        .bind(&pin_hash)
        .bind(&user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(json!({ "ok": true })))
}

/// POST /api/auth/2fa/verify — tahap 2: cek kode 2FA lalu keluarkan session token.
pub async fn verify_2fa(
    State(state): State<AppState>,
    Json(payload): Json<Verify2FARequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    if rate_limited(&format!("2fa:{}", payload.email.trim().to_lowercase()), 5, 10) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    let code = payload.code.trim();
    if code.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let row = sqlx::query("SELECT id, name FROM users WHERE email = $1")
        .bind(payload.email.trim())
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let user_id = match row {
        Some(r) => r.get::<String, _>("id"),
        None => {
            return Ok(Json(AuthResponse {
                success: false,
                message: "Kode salah atau kedaluwarsa".to_string(),
                user: None,
                token: None,
                requires_confirmation: None,
                requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
            }))
        }
    };

    let code_hash = sha256(code);

    // Cari OTP yang belum dipakai, belum kedaluwarsa, cocok hash-nya.
    let otp = sqlx::query(
        "SELECT id, expires_at FROM login_otps
         WHERE user_id = $1 AND otp_hash = $2 AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(&user_id)
    .bind(&code_hash)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match otp {
        Some(otp_row) => {
            let otp_id: String = otp_row.get("id");
            let _ = sqlx::query("UPDATE login_otps SET used = TRUE WHERE id = $1")
                .bind(&otp_id)
                .execute(&state.db)
                .await;

            let session_token = create_session(&state.db, &user_id).await?;

            let user = sqlx::query(
                "SELECT id, email, name, company_id, role, plan FROM users WHERE id = $1",
            )
            .bind(&user_id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

            tracing::info!(event = "login_step2", user_id = %user_id, "login success (2fa passed)");

            Ok(Json(AuthResponse {
                success: true,
                message: "Login berhasil".to_string(),
                user: Some(UserResponse {
                    id: user_id,
                    email: user.get("email"),
                    name: user.get("name"),
                    company_id: user.get("company_id"),
                    role: user.get("role"),
                    plan: user.get("plan"),
                    email_verified: Some(true),
                    ai_provider: None,
                    ai_base_url: None,
                    ai_model: None,
                    ai_enabled: None,
                }),
                token: Some(session_token),
                requires_confirmation: None,
                requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
            }))
        }
        None => Ok(Json(AuthResponse {
            success: false,
            message: "Kode salah atau kedaluwarsa".to_string(),
            user: None,
            token: None,
            requires_confirmation: None,
            requires_2fa: None,
            requires_pin: None,
            requires_pin_setup: None,
        })),
    }
}

fn generate_otp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.subsec_nanos()).unwrap_or(0);
    let rnd = (nanos as u32).wrapping_mul(2654435761).wrapping_add(0x9E3779B9);
    format!("{:06}", (rnd % 1_000_000) as u32)
}

/// POST /api/auth/logout — hapus sesi aktif (token di header).
pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, StatusCode> {
    if let Some(token) = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
    {
        let token_hash = sha256(token);
        let _ = sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
            .bind(&token_hash)
            .execute(&state.db)
            .await;
    }
    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/auth/me — ambil data user berdasarkan sesi token.
/// Endpoint ini memakai header `Authorization: Bearer <token>` (tidak lagi
/// mengandalkan body user_id yang bisa dipalsukan).
pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<UserResponse>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let row = sqlx::query("SELECT id, email, name, company_id, role, plan, email_verified, ai_provider, ai_base_url, ai_model, ai_enabled FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match row {
        Some(row) => Ok(Json(UserResponse {
            id: row.get("id"),
            email: row.get("email"),
            name: row.get("name"),
            company_id: row.get("company_id"),
            role: row.get("role"),
            plan: row.get("plan"),
            email_verified: Some(row.get("email_verified")),
            ai_provider: Some(row.get("ai_provider")),
            ai_base_url: Some(row.get("ai_base_url")),
            ai_model: Some(row.get("ai_model")),
            ai_enabled: Some(row.get("ai_enabled")),
        })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

// ---------- COMPANIES ----------

/// POST /api/companies — buat perusahaan baru dan tautkan ke user terautentikasi.
pub async fn create_company(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCompany>,
) -> Result<Json<Company>, StatusCode> {
    let owner_id = require_auth(&state, &headers).await?;
    validate_len(&payload.name, "name", 150)?;
    validate_len(&payload.industry, "industry", 100)?;
    validate_len(&payload.size, "size", 50)?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO companies (id, name, industry, size, owner_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(payload.name.trim())
    .bind(payload.industry.trim())
    .bind(payload.size.trim())
    .bind(&owner_id)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Tautkan user ke perusahaan yang baru dibuat.
    sqlx::query("UPDATE users SET company_id = $1 WHERE id = $2")
        .bind(&id)
        .bind(&owner_id)
        .execute(&state.db)
        .await
        .ok();

    Ok(Json(Company {
        id,
        name: payload.name.trim().to_string(),
        industry: payload.industry.trim().to_string(),
        size: payload.size.trim().to_string(),
        owner_id,
        created_at: now,
    }))
}

/// GET /api/companies — daftar perusahaan milik user yang terautentikasi.
/// `user_id` di query param DIABAIKAN (dipakai dari sesi token) untuk mencegah
/// akses data perusahaan orang lain (IDOR).
pub async fn get_companies(
    State(state): State<AppState>,
    headers: HeaderMap,
    _query: Option<Query<ActorQuery>>,
) -> Result<Json<Vec<Company>>, StatusCode> {
    let owner_id = require_auth(&state, &headers).await?;
    let rows = sqlx::query(
        "SELECT id, name, industry, size, owner_id, created_at FROM companies WHERE owner_id = $1",
    )
    .bind(&owner_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let companies: Vec<Company> = rows
        .iter()
        .map(|row| Company {
            id: row.get("id"),
            name: row.get("name"),
            industry: row.get("industry"),
            size: row.get("size"),
            owner_id: row.get("owner_id"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(companies))
}

// ---------- DIVISIONS ----------

/// POST /api/divisions — buat divisi baru dalam sebuah perusahaan.
pub async fn create_division(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateDivision>,
) -> Result<Json<Division>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    validate_len(&payload.name, "name", 120)?;
    check_company_access(&state, &user_id, &payload.company_id).await?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO divisions (id, company_id, name, head_id, member_count, created_at) VALUES ($1, $2, $3, $4, 0, $5)",
    )
    .bind(&id)
    .bind(&payload.company_id)
    .bind(payload.name.trim())
    .bind(&payload.head_id)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(Division {
        id,
        company_id: payload.company_id,
        name: payload.name.trim().to_string(),
        head_id: payload.head_id,
        member_count: 0,
        created_at: now,
    }))
}

/// GET /api/divisions — daftar divisi milik sebuah perusahaan.
pub async fn get_divisions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(payload): Query<CompanyQuery>,
) -> Result<Json<Vec<Division>>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    check_company_access(&state, &user_id, &payload.company_id).await?;

    let rows = sqlx::query(
        "SELECT id, company_id, name, head_id, member_count, created_at FROM divisions WHERE company_id = $1",
    )
    .bind(&payload.company_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let divisions: Vec<Division> = rows
        .iter()
        .map(|row| Division {
            id: row.get("id"),
            company_id: row.get("company_id"),
            name: row.get("name"),
            head_id: row.get("head_id"),
            member_count: row.get("member_count"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(divisions))
}

// ---------- MEMBERS ----------

/// POST /api/members — tambah anggota ke divisi dan naikkan member_count.
pub async fn create_member(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateMember>,
) -> Result<Json<Member>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    validate_len(&payload.name, "name", 100)?;
    validate_email(&payload.email)?;
    validate_len(&payload.role, "role", 30)?;
    check_company_access(&state, &user_id, &payload.company_id).await?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO members (id, company_id, division_id, name, email, role, authority, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
    )
    .bind(&id)
    .bind(&payload.company_id)
    .bind(&payload.division_id)
    .bind(payload.name.trim())
    .bind(payload.email.trim())
    .bind(payload.role.trim())
    .bind(payload.authority.as_deref().unwrap_or("member").trim())
    .bind(payload.position.as_deref().unwrap_or("").trim())
    .bind(payload.phone.as_deref().unwrap_or("").trim())
    .bind(payload.gender.as_deref().unwrap_or("").trim())
    .bind(payload.birth_date.as_deref().unwrap_or("").trim())
    .bind(payload.address.as_deref().unwrap_or("").trim())
    .bind(payload.employment_status.as_deref().unwrap_or("").trim())
    .bind(payload.join_date.as_deref().unwrap_or("").trim())
    .bind(payload.salary.as_deref().unwrap_or("").trim())
    .bind(payload.skills.as_deref().unwrap_or("").trim())
    .bind(payload.education.as_deref().unwrap_or("").trim())
    .bind(payload.notes.as_deref().unwrap_or("").trim())
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query("UPDATE divisions SET member_count = member_count + 1 WHERE id = $1")
        .bind(&payload.division_id)
        .execute(&state.db)
        .await
        .ok();

    Ok(Json(Member {
        id,
        company_id: payload.company_id,
        division_id: payload.division_id,
        name: payload.name.trim().to_string(),
        email: payload.email.trim().to_string(),
        role: payload.role.trim().to_string(),
        authority: payload.authority.as_deref().unwrap_or("member").trim().to_string(),
        position: payload.position.as_deref().unwrap_or("").trim().to_string(),
        phone: payload.phone.as_deref().unwrap_or("").trim().to_string(),
        gender: payload.gender.as_deref().unwrap_or("").trim().to_string(),
        birth_date: payload.birth_date.as_deref().unwrap_or("").trim().to_string(),
        address: payload.address.as_deref().unwrap_or("").trim().to_string(),
        employment_status: payload.employment_status.as_deref().unwrap_or("").trim().to_string(),
        join_date: payload.join_date.as_deref().unwrap_or("").trim().to_string(),
        salary: payload.salary.as_deref().unwrap_or("").trim().to_string(),
        skills: payload.skills.as_deref().unwrap_or("").trim().to_string(),
        education: payload.education.as_deref().unwrap_or("").trim().to_string(),
        notes: payload.notes.as_deref().unwrap_or("").trim().to_string(),
        created_at: now,
    }))
}

/// GET /api/members — daftar anggota sebuah perusahaan.
pub async fn get_members(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(payload): Query<CompanyQuery>,
) -> Result<Json<Vec<Member>>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    check_company_access(&state, &user_id, &payload.company_id).await?;

    let rows = sqlx::query(
        "SELECT id, company_id, division_id, name, email, role, authority, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at
         FROM members WHERE company_id = $1",
    )
    .bind(&payload.company_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let members: Vec<Member> = rows
        .iter()
        .map(|row| Member {
            id: row.get("id"),
            company_id: row.get("company_id"),
            division_id: row.get("division_id"),
            name: row.get("name"),
            email: row.get("email"),
            role: row.get("role"),
            authority: row.get("authority"),
            position: row.get("position"),
            phone: row.get("phone"),
            gender: row.get("gender"),
            birth_date: row.get("birth_date"),
            address: row.get("address"),
            employment_status: row.get("employment_status"),
            join_date: row.get("join_date"),
            salary: row.get("salary"),
            skills: row.get("skills"),
            education: row.get("education"),
            notes: row.get("notes"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(members))
}

// ---------- PROJECTS ----------

/// GET /api/projects — daftar project aktif sebuah perusahaan.
pub async fn get_projects(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(payload): Query<CompanyQuery>,
) -> Result<Json<Vec<Project>>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    check_company_access(&state, &user_id, &payload.company_id).await?;

    let rows = sqlx::query(
        "SELECT id, company_id, division_id, name, project_type, progress, status, created_at, due_date FROM projects WHERE company_id = $1 AND status != 'archived'",
    )
    .bind(&payload.company_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let projects: Vec<Project> = rows
        .iter()
        .map(|row| Project {
            id: row.get("id"),
            company_id: row.get("company_id"),
            division_id: row.get("division_id"),
            name: row.get("name"),
            project_type: row.get("project_type"),
            progress: row.get("progress"),
            status: row.get("status"),
            created_at: row.get("created_at"),
            due_date: row.get("due_date"),
        })
        .collect();

    Ok(Json(projects))
}

// ---------- AUTHORIZATION HELPERS ----------

/// Pastikan `user_id` punya akses ke `company_id`:
///   - pemilik perusahaan (owner_id), atau
///   - user terdaftar di perusahaan itu (company_id user == company_id) dengan
///     peran yang memiliki akses (admin/super_admin/manager).
/// Tolak dengan 403 bila bukan miliknya.
async fn check_company_access(
    state: &AppState,
    user_id: &str,
    company_id: &str,
) -> Result<(), StatusCode> {
    let row = sqlx::query("SELECT owner_id FROM companies WHERE id = $1")
        .bind(company_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let (owner_id, company_exists) = match row {
        Some(r) => (r.get::<String, _>("owner_id"), true),
        None => (String::new(), false),
    };
    if !company_exists {
        return Err(StatusCode::NOT_FOUND);
    }
    if owner_id == user_id {
        return Ok(());
    }

    // Cek keanggotaan: user punya company_id yang sama + peran yang diizinkan.
    let member = sqlx::query(
        "SELECT role, company_id FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match member {
        Some(m) => {
            let role: String = m.get("role");
            let user_company: Option<String> = m.get("company_id");
            let allowed = role == "admin" || role == "super_admin" || role == "manager";
            if allowed && user_company.as_deref() == Some(company_id) {
                Ok(())
            } else {
                Err(StatusCode::FORBIDDEN)
            }
        }
        None => Err(StatusCode::FORBIDDEN),
    }
}

// ---------- PROFIL (Item 2: Settings lengkap + kuota edit) ----------

/// Ambil profil lengkap user berikut kuota edit bulanan. Dipakai halaman
/// Settings untuk menampilkan semua data pribadi & login.
/// Query opsional `user_id` (oleh admin/super_admin/owner) untuk melihat
/// profil user lain.
pub async fn get_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    query: Option<Query<ProfileQuery>>,
) -> Result<Json<ProfileResponse>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;

    let target = match query.and_then(|q| q.0.user_id).filter(|u| !u.is_empty()) {
        Some(uid) if uid != actor_id => {
            // Aksi admin: cek peran.
            let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
                .bind(&actor_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?
                .ok_or(StatusCode::UNAUTHORIZED)?
                .get("role");
            let allowed = role == "owner" || role == "super_admin" || role == "admin";
            if !allowed {
                return Err(StatusCode::FORBIDDEN);
            }
            uid
        }
        Some(uid) => uid,
        None => actor_id.clone(),
    };

    profile_for_user(&state, &target, target != actor_id).await
}

/// Bangun `ProfileResponse` untuk satu user. Bila `is_admin_action` true
/// (admin mengedit data user lain), kuota memakai counter admin (10x/bulan);
/// selain itu memakai kuota pribadi (3x/bulan).
async fn profile_for_user(
    state: &AppState,
    user_id: &str,
    is_admin_action: bool,
) -> Result<Json<ProfileResponse>, StatusCode> {
    let row = sqlx::query(
        "SELECT id, email, name, company_id, role, plan, email_verified, user_code,
                phone, gender, address, position, join_date, employment_status,
                birth_date, education, salary,
                edit_count, edit_count_month, admin_edit_count, admin_edit_month,
                ai_provider, ai_base_url, ai_key, ai_model, ai_enabled
         FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let row = row.ok_or(StatusCode::NOT_FOUND)?;

    let limit = if is_admin_action { 10 } else { 3 };
    let count: i32 = if is_admin_action {
        row.get("admin_edit_count")
    } else {
        row.get("edit_count")
    };
    let month: String = if is_admin_action {
        row.get("admin_edit_month")
    } else {
        row.get("edit_count_month")
    };

    Ok(Json(ProfileResponse {
        id: row.get("id"),
        email: row.get("email"),
        name: row.get("name"),
        company_id: row.get("company_id"),
        role: row.get("role"),
        plan: row.get("plan"),
        email_verified: Some(row.get("email_verified")),
        user_code: row.get("user_code"),
        phone: row.get("phone"),
        gender: row.get("gender"),
        address: row.get("address"),
        position: row.get("position"),
        join_date: row.get("join_date"),
        employment_status: row.get("employment_status"),
        birth_date: row.get("birth_date"),
        education: row.get("education"),
        salary: row.get("salary"),
        edit_count: count,
        edit_limit: limit,
        edit_count_month: month,
        has_pin: false,
        ai_provider: row.get("ai_provider"),
        ai_base_url: row.get("ai_base_url"),
        ai_key: row.get("ai_key"),
        ai_model: row.get("ai_model"),
        ai_enabled: row.get("ai_enabled"),
    }))
}

/// Cek & reset counter edit bulanan. `month` berformat 'YYYY-MM'. Bila
/// bulan tersimpan berbeda dari bulan sekarang, counter direset ke 0.
fn check_and_reset_month(current: &str, now: chrono::DateTime<Utc>) -> String {
    let this_month = now.format("%Y-%m").to_string();
    if current != this_month {
        this_month
    } else {
        current.to_string()
    }
}

/// PUT /api/profile — perbarui profil user. Tanpa `user_id`: ubah profil
/// sendiri (kuota 3x/bulan). Dengan `user_id` (oleh admin/super_admin/owner):
/// ubah data user lain (kuota 10x/bulan per admin).
pub async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<ProfileResponse>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;

    // Tentukan target & apakah ini aksi admin (mengubah user lain).
    let is_admin_action = if let Some(target) = &payload.user_id {
        if target == &actor_id {
            false
        } else {
            let actor_role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
                .bind(&actor_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?
                .ok_or(StatusCode::UNAUTHORIZED)?
                .get("role");
            let allowed = actor_role == "owner" || actor_role == "super_admin" || actor_role == "admin";
            if !allowed {
                return Err(StatusCode::FORBIDDEN);
            }
            true
        }
    } else {
        false
    };

    let target_id = payload.user_id.clone().unwrap_or_else(|| actor_id.clone());

    let now = Utc::now();

    // Ambil nilai lama (untuk mempertahankan field yang tidak dikirim).
    let old = sqlx::query(
        "SELECT name, email, edit_count, edit_count_month, admin_edit_count, admin_edit_month, role
         FROM users WHERE id = $1",
    )
    .bind(&target_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Siapa yang kuotanya dipakai: untuk aksi admin, counter admin pada
    // AKTOR (orang yang mengedit); untuk self-edit, counter pada target.
    let counter_owner_id = if is_admin_action { actor_id.clone() } else { target_id.clone() };
    let counter_row = sqlx::query(
        "SELECT edit_count, edit_count_month, admin_edit_count, admin_edit_month FROM users WHERE id = $1",
    )
    .bind(&counter_owner_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let (col_count, col_month) = if is_admin_action {
        ("admin_edit_count", "admin_edit_month")
    } else {
        ("edit_count", "edit_count_month")
    };
    let cur_count: i32 = counter_row.get(col_count);
    let cur_month: String = counter_row.get(col_month);
    let this_month = check_and_reset_month(&cur_month, now);
    let limit = if is_admin_action { 10 } else { 3 };

    // Blokir bila kuota bulan ini habis.
    if this_month == cur_month && cur_count >= limit {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    // Hitung nilai field baru (hanya yang dikirim; lainnya dipertahankan).
    let name = payload.name.clone().unwrap_or(old.get("name"));
    let mut email = payload.email.clone().unwrap_or(old.get("email"));

    // Email unik bila berubah.
    if email != old.get::<String, _>("email") {
        validate_email(&email)?;
        let dup = sqlx::query("SELECT id FROM users WHERE email = $1 AND id != $2")
            .bind(&email)
            .bind(&target_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        if dup.is_some() {
            return Err(StatusCode::CONFLICT);
        }
    } else {
        email = old.get("email");
    }

    let fields = [
        ("name", payload.name.as_deref().unwrap_or(name.as_str())),
        ("email", email.as_str()),
        ("phone", payload.phone.as_deref().unwrap_or("")),
        ("gender", payload.gender.as_deref().unwrap_or("")),
        ("address", payload.address.as_deref().unwrap_or("")),
        ("position", payload.position.as_deref().unwrap_or("")),
        ("join_date", payload.join_date.as_deref().unwrap_or("")),
        ("employment_status", payload.employment_status.as_deref().unwrap_or("")),
        ("birth_date", payload.birth_date.as_deref().unwrap_or("")),
        ("education", payload.education.as_deref().unwrap_or("")),
        ("salary", payload.salary.as_deref().unwrap_or("")),
    ];

    // Pertahankan field lama yang TIDAK dikirim (jangan timpa dengan '').
    let mut set_clauses: Vec<String> = Vec::new();
    let mut binds: Vec<String> = Vec::new();
    for (col, val) in &fields {
        let has_some = match *col {
            "name" => payload.name.is_some(),
            "email" => payload.email.is_some(),
            "phone" => payload.phone.is_some(),
            "gender" => payload.gender.is_some(),
            "address" => payload.address.is_some(),
            "position" => payload.position.is_some(),
            "join_date" => payload.join_date.is_some(),
            "employment_status" => payload.employment_status.is_some(),
            "birth_date" => payload.birth_date.is_some(),
            "education" => payload.education.is_some(),
            "salary" => payload.salary.is_some(),
            _ => false,
        };
        if has_some || *col == "name" || *col == "email" {
            set_clauses.push(format!("{col} = ${}", binds.len() + 1));
            binds.push(val.to_string());
        }
    }

    let next_count = cur_count + 1;
    set_clauses.push(format!("{col_count} = ${}", binds.len() + 1));
    binds.push(next_count.to_string());
    set_clauses.push(format!("{col_month} = ${}", binds.len() + 1));
    binds.push(this_month.clone());

    let sql = format!(
        "UPDATE users SET {} WHERE id = ${}",
        set_clauses.join(", "),
        binds.len() + 1
    );
    let mut q = sqlx::query(&sql);
    for b in &binds {
        q = q.bind(b);
    }
    q = q.bind(&target_id);
    q.execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!(
        event = "profile_updated",
        actor = %actor_id,
        target = %target_id,
        is_admin = is_admin_action,
        "profil diperbarui"
    );

    profile_for_user(&state, &target_id, is_admin_action).await
}

/// GET /api/company/users — daftar user dalam satu perusahaan (untuk
/// admin/super_admin mengedit data user lain). Dipakai Settings (Item 2).
pub async fn company_users(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;

    // Hanya owner/super_admin/admin.
    let actor = sqlx::query("SELECT role, company_id FROM users WHERE id = $1")
        .bind(&actor_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?;
    let role: String = actor.get("role");
    let allowed = role == "owner" || role == "super_admin" || role == "admin";
    if !allowed {
        return Err(StatusCode::FORBIDDEN);
    }
    let company_id: Option<String> = actor.get("company_id");
    let company_id = match company_id {
        Some(c) => c,
        None => return Err(StatusCode::BAD_REQUEST),
    };

    let rows = sqlx::query(
        "SELECT id, email, name, role, plan, position, phone FROM users
         WHERE company_id = $1 ORDER BY name",
    )
    .bind(&company_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let users: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "email": r.get::<String, _>("email"),
                "name": r.get::<String, _>("name"),
                "role": r.get::<String, _>("role"),
                "plan": r.get::<String, _>("plan"),
                "position": r.get::<String, _>("position"),
                "phone": r.get::<String, _>("phone"),
            })
        })
        .collect();

    Ok(Json(json!({ "users": users })))
}

// ---------- UPGRADE AKUN (Item 4) ----------

/// POST /api/upgrade — akun self-register (role 'user') meng-upgrade ke plan
/// berbayar: role berubah ke admin (grup) / super_admin (organisasi) dan data
/// perusahaan disimpan (buat company bila belum punya).
pub async fn upgrade_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpgradeRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let plan = payload.plan.trim();
    if plan != "grup" && plan != "organisasi" {
        return Err(StatusCode::BAD_REQUEST);
    }
    validate_len(&payload.org_type, "org_type", 50)?;

    let role = role_for_plan(plan);
    let now = Utc::now();

    // Update role & plan user.
    sqlx::query(
        "UPDATE users SET plan = $1, role = $2, org_type = $3, upgraded_at = $4 WHERE id = $5",
    )
    .bind(plan)
    .bind(role)
    .bind(&payload.org_type)
    .bind(now)
    .bind(&user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Data perusahaan: update bila sudah punya, buat bila belum.
    let company_id: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("company_id");

    let org_name = payload.name.clone().unwrap_or_default();
    let org_industry = payload.industry.clone().unwrap_or_else(|| {
        match payload.org_type.as_str() {
            "sekolah" => "Pendidikan".to_string(),
            "yayasan" => "Yayasan".to_string(),
            "komunitas" => "Komunitas".to_string(),
            _ => "Organisasi".to_string(),
        }
    });
    let org_size = payload.size.clone().unwrap_or_else(|| "1-10".to_string());

    match company_id {
        Some(cid) => {
            if !org_name.is_empty() {
                sqlx::query("UPDATE companies SET name = $1, industry = $2, size = $3 WHERE id = $4")
                    .bind(&org_name)
                    .bind(&org_industry)
                    .bind(&org_size)
                    .bind(&cid)
                    .execute(&state.db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
            }
        }
        None => {
            if !org_name.is_empty() {
                let new_id = Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT INTO companies (id, name, industry, size, owner_id, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6)",
                )
                .bind(&new_id)
                .bind(&org_name)
                .bind(&org_industry)
                .bind(&org_size)
                .bind(&user_id)
                .bind(now)
                .execute(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                sqlx::query("UPDATE users SET company_id = $1 WHERE id = $2")
                    .bind(&new_id)
                    .bind(&user_id)
                    .execute(&state.db)
                    .await
                    .ok();
            }
        }
    }

    tracing::info!(event = "account_upgraded", user_id = %user_id, plan = plan, org_type = %payload.org_type);

    Ok(Json(json!({
        "ok": true,
        "plan": plan,
        "role": role,
        "org_type": payload.org_type,
        "message": format!("Akun berhasil di-upgrade ke paket {} (role: {})", plan, role),
    })))
}

// ---------- CHAT (Item 5) ----------

/// Pastikan grup chat perusahaan + per divisi sudah dibuat (auto-create).
/// Dipanggil setiap kali daftar percakapan dimuat dan saat divisi dibuat.
async fn ensure_chat_groups(state: &AppState, user_id: &str, company_id: Option<&str>) -> Result<(), StatusCode> {
    let cid = match company_id {
        Some(c) => c.to_string(),
        None => {
            let row = sqlx::query("SELECT company_id FROM users WHERE id = $1")
                .bind(user_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            match row {
                Some(r) => match r.get::<Option<String>, _>("company_id") {
                    Some(c) => c,
                    None => return Ok(()),
                },
                None => return Ok(()),
            }
        }
    };

    // Grup perusahaan (company-wide).
    let group = sqlx::query(
        "SELECT id FROM chat_groups WHERE company_id = $1 AND kind = 'company' LIMIT 1",
    )
    .bind(&cid)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    if group.is_none() {
        let gid = Uuid::new_v4().to_string();
        let company_name: String = sqlx::query("SELECT name FROM companies WHERE id = $1")
            .bind(&cid)
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .get("name");
        sqlx::query(
            "INSERT INTO chat_groups (id, company_id, name, kind, owner_id, ref_id, created_at)
             VALUES ($1, $2, $3, 'company', $4, $5, $6)",
        )
        .bind(&gid)
        .bind(&cid)
        .bind(format!("{company_name} — Semua Anggota"))
        .bind(user_id)
        .bind(&cid)
        .bind(Utc::now())
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    }

    // Grup per divisi.
    let divisions = sqlx::query("SELECT id, name FROM divisions WHERE company_id = $1")
        .bind(&cid)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    for div in &divisions {
        let div_id: String = div.get("id");
        let existing = sqlx::query(
            "SELECT id FROM chat_groups WHERE company_id = $1 AND kind = 'division' AND ref_id = $2 LIMIT 1",
        )
        .bind(&cid)
        .bind(&div_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        if existing.is_none() {
            let gid = Uuid::new_v4().to_string();
            let div_name: String = div.get("name");
            sqlx::query(
                "INSERT INTO chat_groups (id, company_id, name, kind, owner_id, ref_id, created_at)
                 VALUES ($1, $2, $3, 'division', $4, $5, $6)",
            )
            .bind(&gid)
            .bind(&cid)
            .bind(format!("Divisi {div_name}"))
            .bind(user_id)
            .bind(&div_id)
            .bind(Utc::now())
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        }
    }

    Ok(())
}

/// Cari / buat percakapan DM antara dua user. Dipakai helper `chat_send`.
async fn ensure_dm_conversation(
    state: &AppState,
    user_a: &str,
    user_b: &str,
) -> Result<String, StatusCode> {
    let (a, b) = if user_a < user_b {
        (user_a.to_string(), user_b.to_string())
    } else {
        (user_b.to_string(), user_a.to_string())
    };

    let row = sqlx::query(
        "SELECT id FROM conversations WHERE kind = 'dm' AND user_a = $1 AND user_b = $2",
    )
    .bind(&a)
    .bind(&b)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if let Some(r) = row {
        return Ok(r.get("id"));
    }

    let cid = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO conversations (id, kind, user_a, user_b, created_at) VALUES ($1, 'dm', $2, $3, $4)",
    )
    .bind(&cid)
    .bind(&a)
    .bind(&b)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    Ok(cid)
}

/// POST /api/chat/send — kirim pesan DM, ke grup, atau balas percakapan.
pub async fn chat_send(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ChatSendRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let body = payload.body.trim().to_string();
    if body.is_empty() || body.len() > 4000 {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Tentukan conversation_id.
    let conv_id: String = if let Some(conv) = &payload.conversation_id {
        conv.clone()
    } else if let Some(to) = &payload.to_user_id {
        if to == &user_id {
            return Err(StatusCode::BAD_REQUEST);
        }
        // Cek target ada.
        let exists = sqlx::query("SELECT id FROM users WHERE id = $1")
            .bind(to)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        if exists.is_none() {
            return Err(StatusCode::NOT_FOUND);
        }
        ensure_dm_conversation(&state, &user_id, to).await?
    } else if let Some(gid) = &payload.group_id {
        // Cek grup ada; untuk grup custom cek keanggotaan.
        let g = sqlx::query("SELECT id, kind FROM chat_groups WHERE id = $1")
            .bind(gid)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        match g {
            Some(r) => {
                let kind: String = r.get("kind");
                if kind == "custom" {
                    let is_member = sqlx::query(
                        "SELECT id FROM chat_group_members WHERE group_id = $1 AND user_id = $2",
                    )
                    .bind(gid)
                    .bind(&user_id)
                    .fetch_optional(&state.db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
                    if is_member.is_none() {
                        return Err(StatusCode::FORBIDDEN);
                    }
                }
            }
            None => return Err(StatusCode::NOT_FOUND),
        }
        let conv = sqlx::query("SELECT id FROM conversations WHERE group_id = $1 LIMIT 1")
            .bind(gid)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        match conv {
            Some(c) => c.get("id"),
            None => {
                let cid = Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT INTO conversations (id, kind, group_id, created_at) VALUES ($1, 'group', $2, $3)",
                )
                .bind(&cid)
                .bind(gid)
                .bind(Utc::now())
                .execute(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
                cid
            }
        }
    } else {
        return Err(StatusCode::BAD_REQUEST);
    };

    // Hak akses: pemilik percakapan atau anggota company yang sama.
    let conv_info = sqlx::query(
        "SELECT c.kind, c.group_id, c.user_a, c.user_b, g.company_id
         FROM conversations c LEFT JOIN chat_groups g ON g.id = c.group_id
         WHERE c.id = $1",
    )
    .bind(&conv_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    let kind: String = conv_info.get("kind");
    let ok = if kind == "dm" {
        let ua: String = conv_info.get("user_a");
        let ub: String = conv_info.get("user_b");
        ua == user_id || ub == user_id
    } else {
        // Grup perusahaan/divisi: semua anggota company bisa kirim.
        let company_id: Option<String> = conv_info.get("company_id");
        match company_id {
            Some(cid) => {
                let user_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
                    .bind(&user_id)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?
                    .get("company_id");
                user_company.as_deref() == Some(cid.as_str())
            }
            None => false,
        }
    };
    if !ok {
        return Err(StatusCode::FORBIDDEN);
    }

    let mid = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO messages (id, conversation_id, sender_id, body, is_system, created_at)
         VALUES ($1, $2, $3, $4, FALSE, $5)",
    )
    .bind(&mid)
    .bind(&conv_id)
    .bind(&user_id)
    .bind(&body)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({
        "ok": true,
        "message_id": mid,
        "conversation_id": conv_id,
        "body": body,
        "sender_id": user_id,
        "created_at": Utc::now(),
    })))
}

/// GET /api/chat/messages?conversation_id=... — daftar pesan satu percakapan.
pub async fn chat_messages(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(payload): Query<ChatMessagesQuery>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let conv_info = sqlx::query(
        "SELECT c.kind, c.group_id, c.user_a, c.user_b, g.company_id
         FROM conversations c LEFT JOIN chat_groups g ON g.id = c.group_id
         WHERE c.id = $1",
    )
    .bind(&payload.conversation_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    let kind: String = conv_info.get("kind");
    let ok = if kind == "dm" {
        let ua: String = conv_info.get("user_a");
        let ub: String = conv_info.get("user_b");
        ua == user_id || ub == user_id
    } else {
        let company_id: Option<String> = conv_info.get("company_id");
        match company_id {
            Some(cid) => {
                // Admin company bisa melihat semua pesan company-nya.
                let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
                    .bind(&user_id)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?
                    .get("role");
                let user_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
                    .bind(&user_id)
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?
                    .get("company_id");
                let is_admin = role == "owner" || role == "super_admin" || role == "admin";
                is_admin || user_company.as_deref() == Some(cid.as_str())
            }
            None => false,
        }
    };
    if !ok {
        return Err(StatusCode::FORBIDDEN);
    }

    let rows = sqlx::query(
        "SELECT m.id, m.conversation_id, m.sender_id, m.body, m.is_system, m.created_at,
                u.name AS sender_name, u.email AS sender_email
         FROM messages m LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1 ORDER BY m.created_at ASC",
    )
    .bind(&payload.conversation_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let messages: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "conversation_id": r.get::<String, _>("conversation_id"),
                "sender_id": r.get::<String, _>("sender_id"),
                "sender_name": r.get::<String, _>("sender_name"),
                "sender_email": r.get::<String, _>("sender_email"),
                "body": r.get::<String, _>("body"),
                "is_system": r.get::<bool, _>("is_system"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "conversation_id": payload.conversation_id, "messages": messages })))
}

/// GET /api/chat/conversations — daftar percakapan user (DM + grup company).
pub async fn chat_conversations(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    // Pastikan grup perusahaan & divisi sudah dibuat (auto-create).
    ensure_chat_groups(&state, &user_id, None).await?;

    let user_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .get("company_id");

    // DM milik user.
    let dms = sqlx::query(
        "SELECT c.id, c.kind, c.group_id, c.user_a, c.user_b, c.created_at,
                COALESCE(ua.name, '') AS user_a_name, COALESCE(ub.name, '') AS user_b_name
         FROM conversations c
         LEFT JOIN users ua ON ua.id = c.user_a
         LEFT JOIN users ub ON ub.id = c.user_b
         WHERE (c.user_a = $1 OR c.user_b = $1) AND c.kind = 'dm'
         ORDER BY c.created_at DESC",
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut list: Vec<Value> = Vec::new();
    for d in &dms {
        let ua: String = d.get("user_a");
        let ub: String = d.get("user_b");
        let other_name: String = if ua == user_id {
            d.get("user_b_name")
        } else {
            d.get("user_a_name")
        };
        let other_id: String = if ua == user_id { ub } else { ua };
        list.push(json!({
            "id": d.get::<String, _>("id"),
            "kind": "dm",
            "name": other_name,
            "other_user_id": other_id,
            "avatar_seed": other_name,
            "created_at": d.get::<chrono::DateTime<Utc>, _>("created_at"),
        }));
    }

    // Grup milik company user.
    if let Some(cid) = &user_company {
        let groups = sqlx::query(
            "SELECT g.id, g.name, g.kind FROM chat_groups g WHERE g.company_id = $1 ORDER BY g.created_at",
        )
        .bind(cid)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        for g in &groups {
            let gid: String = g.get("id");
            let conv = sqlx::query("SELECT id FROM conversations WHERE group_id = $1 LIMIT 1")
                .bind(&gid)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            list.push(json!({
                "id": match conv { Some(c) => c.get::<String,_>("id"), None => gid.clone() },
                "kind": "group",
                "group_id": gid,
                "name": g.get::<String, _>("name"),
                "group_kind": g.get::<String, _>("kind"),
                "avatar_seed": g.get::<String, _>("name"),
                "created_at": Utc::now(),
            }));
        }
    }

    Ok(Json(json!({ "conversations": list })))
}

/// POST /api/chat/group/create — buat grup chat custom dengan anggota.
pub async fn chat_group_create(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ChatGroupCreateRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    validate_len(&payload.name, "name", 120)?;

    let company_id = match &payload.company_id {
        Some(cid) => {
            check_company_access(&state, &user_id, cid).await?;
            cid.clone()
        }
        None => {
            let row = sqlx::query("SELECT company_id FROM users WHERE id = $1")
                .bind(&user_id)
                .fetch_one(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            match row.get::<Option<String>, _>("company_id") {
                Some(c) => c,
                None => return Err(StatusCode::BAD_REQUEST),
            }
        }
    };

    let gid = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO chat_groups (id, company_id, name, kind, owner_id, created_at)
         VALUES ($1, $2, $3, 'custom', $4, $5)",
    )
    .bind(&gid)
    .bind(&company_id)
    .bind(payload.name.trim())
    .bind(&user_id)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Owner otomatis jadi member.
    sqlx::query(
        "INSERT INTO chat_group_members (id, group_id, user_id, created_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&gid)
    .bind(&user_id)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .ok();

    for uid in &payload.member_ids {
        if uid == &user_id {
            continue;
        }
        sqlx::query(
            "INSERT INTO chat_group_members (id, group_id, user_id, created_at) VALUES ($1, $2, $3, $4)",
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&gid)
        .bind(uid)
        .bind(Utc::now())
        .execute(&state.db)
        .await
        .ok();
    }

    Ok(Json(json!({ "ok": true, "group_id": gid, "name": payload.name.trim() })))
}

/// GET /api/users/search?q=... — cari user global (lintas perusahaan) untuk
/// ditambah sebagai kontak / dilihat profilnya. Hanya data publik ringkas.
pub async fn search_users(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<UserSearchQuery>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let q = query.q.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Json(json!({ "results": [] })));
    }

    let pattern = format!("%{}%", q);
    let rows = sqlx::query(
        "SELECT u.id, u.name, u.email, u.user_code, u.position,
                c.name AS company_name, u.role
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id
         WHERE u.id != $1
           AND (LOWER(u.name) LIKE $2 OR LOWER(u.email) LIKE $2 OR u.user_code ILIKE $2)
         ORDER BY u.name
         LIMIT 20",
    )
    .bind(&user_id)
    .bind(&pattern)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let results: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "name": r.get::<String, _>("name"),
                "email": r.get::<String, _>("email"),
                "user_code": r.get::<Option<String>, _>("user_code"),
                "position": r.get::<String, _>("position"),
                "company_name": r.get::<Option<String>, _>("company_name"),
                "role": r.get::<String, _>("role"),
            })
        })
        .collect();

    Ok(Json(json!({ "results": results })))
}

/// GET /api/users/:id — profil publik user lain (lintas perusahaan).
/// Hanya data yang aman dibagikan; email hanya tampil untuk sesama perusahaan.
pub async fn get_public_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;

    let row = sqlx::query(
        "SELECT u.id, u.name, u.email, u.user_code, u.position, u.role, u.plan,
                c.name AS company_name, c.industry AS company_industry
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id
         WHERE u.id = $1",
    )
    .bind(&user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let row = row.ok_or(StatusCode::NOT_FOUND)?;

    let same_company: bool = {
        let my_company: Option<String> = sqlx::query("SELECT company_id FROM users WHERE id = $1")
            .bind(&actor_id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .get("company_id");
        let target_company: Option<String> = row.get("company_id");
        my_company.is_some() && my_company == target_company
    };

    let email: String = row.get("email");
    Ok(Json(json!({
        "id": row.get::<String, _>("id"),
        "name": row.get::<String, _>("name"),
        "user_code": row.get::<Option<String>, _>("user_code"),
        "position": row.get::<String, _>("position"),
        "role": row.get::<String, _>("role"),
        "plan": row.get::<String, _>("plan"),
        "company_name": row.get::<Option<String>, _>("company_name"),
        "company_industry": row.get::<Option<String>, _>("company_industry"),
        "email_visible": same_company,
        "email": if same_company { email } else { String::new() },
    })))
}

/// GET /api/chat/contacts — daftar kontak pertemanan user.
pub async fn chat_contacts(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let rows = sqlx::query(
        "SELECT u.id, u.name, u.email, u.user_code, u.phone, u.position
         FROM contacts c JOIN users u ON u.id = c.contact_user_id
         WHERE c.user_id = $1 ORDER BY u.name",
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let contacts: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "name": r.get::<String, _>("name"),
                "email": r.get::<String, _>("email"),
                "user_code": r.get::<Option<String>, _>("user_code"),
                "phone": r.get::<String, _>("phone"),
                "position": r.get::<String, _>("position"),
            })
        })
        .collect();

    Ok(Json(json!({ "contacts": contacts })))
}

/// POST /api/chat/contacts — tambah kontak via user code.
pub async fn chat_add_contact(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ContactAddRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;
    let code = payload.user_code.trim().to_string();
    if code.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let target = sqlx::query("SELECT id, name, email, user_code FROM users WHERE user_code = $1")
        .bind(&code)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let target = match target {
        Some(r) => r,
        None => return Err(StatusCode::NOT_FOUND),
    };
    let target_id: String = target.get("id");
    if target_id == user_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    sqlx::query(
        "INSERT INTO contacts (id, user_id, contact_user_id, created_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user_id)
    .bind(&target_id)
    .bind(Utc::now())
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({
        "ok": true,
        "contact": {
            "id": target_id,
            "name": target.get::<String, _>("name"),
            "email": target.get::<String, _>("email"),
            "user_code": target.get::<Option<String>, _>("user_code"),
        }
    })))
}

// ---------- AI AGENT CONFIG (Item 8) ----------

/// PUT /api/agent/config — simpan penyedia AI & API key (khusus owner/super_admin).
pub async fn agent_config(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AgentConfigRequest>,
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
    if role != "owner" && role != "super_admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    if payload.provider_name.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Konfigurasi AI disimpan di akun OWNER (bukan akun super_admin biasa),
    // sehingga ada satu sumber konfigurasi global untuk agent.
    let target_id = if role == "owner" {
        user_id
    } else {
        // super_admin: simpan ke akun owner (pemilik website).
        let owner_row = sqlx::query("SELECT id FROM users WHERE role = 'owner' LIMIT 1")
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        match owner_row {
            Some(r) => r.get::<String, _>("id"),
            None => return Err(StatusCode::NOT_FOUND),
        }
    };

    let enabled = if payload.api_key.trim().is_empty() { false } else { payload.enabled };

    sqlx::query(
        "UPDATE users SET ai_provider = $1, ai_key = $2, ai_base_url = $3, ai_model = $4, ai_enabled = $5 WHERE id = $6",
    )
    .bind(payload.provider_name.trim())
    .bind(payload.api_key.trim())
    .bind(payload.base_url.trim())
    .bind(payload.model.trim())
    .bind(enabled)
    .bind(&target_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(json!({
        "ok": true,
        "provider_name": payload.provider_name.trim(),
        "base_url": payload.base_url.trim(),
        "model": payload.model.trim(),
        "api_key_set": !payload.api_key.trim().is_empty(),
        "enabled": enabled,
    })))
}

// ---------- OWNER / ADMIN ----------

// Kredensial akun pemilik website (OWNER) diambil dari environment,
// JANGAN di-hardcode di source. Akun ini dibuat otomatis saat server start
// dan berhak mengelola seluruh akun di sistem.
const OWNER_EMAIL_DEFAULT: &str = "master@diarsipin.web.id";
const OWNER_NAME_DEFAULT: &str = "Master Owner";
const OWNER_ROLE: &str = "owner";
const OWNER_PLAN: &str = "organisasi";

fn owner_email() -> String {
    std::env::var("OWNER_EMAIL").unwrap_or_else(|_| OWNER_EMAIL_DEFAULT.to_string())
}

fn owner_password() -> String {
    std::env::var("OWNER_PASSWORD").unwrap_or_default()
}

fn owner_name() -> String {
    std::env::var("OWNER_NAME").unwrap_or_else(|_| OWNER_NAME_DEFAULT.to_string())
}

/// Role otomatis dari paket/plan akun. Aturannya:
///   Personal & Profesional => user (akun self-register), Grup => admin,
///   Organisasi => super_admin. Role tidak bisa dipindah tangankan secara
///   manual (hanya mengikuti paket) — lihat Item 4 (upgrade akun).
fn role_for_plan(plan: &str) -> &str {
    match plan {
        "grup" => "admin",
        "organisasi" => "super_admin",
        _ => "user",
    }
}

/// Selaraskan role seluruh akun (selain OWNER) dengan paketnya. Dipanggil
/// sekali saat server start agar aturan auto-role selalu berlaku.
pub async fn normalize_user_roles(db: &PgPool) {
    sqlx::query(
        "UPDATE users SET role = CASE plan
            WHEN 'grup' THEN 'admin'
            WHEN 'organisasi' THEN 'super_admin'
            ELSE 'user'
        END
        WHERE role != 'owner'",
    )
    .execute(db)
    .await
    .ok();
    tracing::info!(event = "roles_synced", "user roles auto-synced to plan");
}

/// Buat akun OWNER bila belum ada. Dipanggil dari `lib.rs::run()` setelah migrate.
/// Wajib mengatur `OWNER_PASSWORD` di environment untuk produksi; bila kosong
/// (mode dev), akun owner tetap dibuat tapi hanya untuk pengembangan lokal.
pub async fn seed_owner(db: &PgPool) {
    let email = owner_email();
    let password = owner_password();

    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&email)
        .fetch_optional(db)
        .await;

    match existing {
        Ok(Some(_)) => {
            sqlx::query("UPDATE users SET role = $1, plan = $2, email_verified = TRUE WHERE email = $3")
                .bind(OWNER_ROLE)
                .bind(OWNER_PLAN)
                .bind(&email)
                .execute(db)
                .await
                .ok();
            tracing::info!(event = "owner_ready", email = %email, "owner account ready");
        }
        Ok(None) => {
            if password.is_empty() {
                tracing::warn!(
                    event = "owner_skipped",
                    "OWNER_PASSWORD kosong — akun owner tidak dibuat (set env OWNER_PASSWORD di produksi)"
                );
                return;
            }
            let id = Uuid::new_v4().to_string();
            let password_hash = match hash_password(&password) {
                Ok(h) => h,
                Err(_) => {
                    eprintln!("[ERROR] Gagal hash password owner");
                    return;
                }
            };
            let now = Utc::now();

            let res = sqlx::query(
                "INSERT INTO users (id, email, password_hash, name, role, plan, created_at, email_verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)",
            )
            .bind(&id)
            .bind(&email)
            .bind(&password_hash)
            .bind(owner_name())
            .bind(OWNER_ROLE)
            .bind(OWNER_PLAN)
            .bind(&now)
            .execute(db)
            .await;

            match res {
                Ok(_) => tracing::info!(event = "owner_created", email = %email, "owner account created"),
                Err(e) => eprintln!("[DB ERROR] Gagal membuat owner account: {}", e),
            }
        }
        Err(e) => eprintln!("[DB ERROR] Gagal cek owner account: {}", e),
    }
}

/// Cek apakah `user_id` adalah akun OWNER (pemilik website).
async fn is_owner(db: &PgPool, user_id: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(db)
        .await?;
    Ok(match row {
        Some(r) => r.get::<String, _>("role") == OWNER_ROLE,
        None => false,
    })
}

/// GET /api/admin/users — daftar SEMUA akun di sistem (khusus OWNER).
/// `actor_id` di body/query DIABAIKAN — identitas diambil dari sesi token
/// agar tidak bisa dipalsukan oleh user biasa.
pub async fn admin_list_users(
    State(state): State<AppState>,
    headers: HeaderMap,
    _query: Option<Query<AdminActorQuery>>,
) -> Result<Json<Vec<UserResponse>>, StatusCode> {
    if rate_limited("admin:list", 60, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    let actor_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    let rows = sqlx::query(
        "SELECT id, email, name, company_id, role, plan, email_verified FROM users ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let users: Vec<UserResponse> = rows
        .iter()
        .map(|row| UserResponse {
            id: row.get("id"),
            email: row.get("email"),
            name: row.get("name"),
            company_id: row.get("company_id"),
            role: row.get("role"),
            plan: row.get("plan"),
            email_verified: Some(row.get("email_verified")),
            ai_provider: None,
            ai_base_url: None,
            ai_model: None,
            ai_enabled: None,
        })
        .collect();

    Ok(Json(users))
}

/// POST /api/admin/users — buat akun baru (khusus OWNER).
pub async fn admin_create_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AdminCreateUser>,
) -> Result<Json<UserResponse>, StatusCode> {
    if rate_limited("admin:create", 30, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    let actor_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    validate_email(&payload.email)?;
    validate_password(&payload.password)?;
    validate_len(&payload.name, "name", 100)?;

    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(payload.email.trim())
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    if existing.is_some() {
        return Err(StatusCode::CONFLICT);
    }

    let id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&payload.password)?;
    let now = Utc::now();
    let plan = payload.plan.clone().unwrap_or_else(|| "personal".to_string());
    let role = role_for_plan(&plan);

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(&id)
    .bind(payload.email.trim())
    .bind(&password_hash)
    .bind(payload.name.trim())
    .bind(role)
    .bind(&plan)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(UserResponse {
        id,
        email: payload.email.trim().to_string(),
        name: payload.name.trim().to_string(),
        company_id: None,
        role: role.to_string(),
        plan,
        email_verified: Some(false),
        ai_provider: None,
        ai_base_url: None,
        ai_model: None,
        ai_enabled: None,
    }))
}

/// PUT /api/admin/users — ubah akun (nama/email/role/plan/password).
/// Dipakai juga untuk upgrade/downgrade akun lewat field `role` & `plan`.
pub async fn admin_update_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AdminUpdateUser>,
) -> Result<Json<UserResponse>, StatusCode> {
    if rate_limited("admin:update", 30, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    let actor_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    if let Some(email) = &payload.email {
        validate_email(email)?;
    }
    if let Some(p) = &payload.password {
        validate_password(p)?;
    }

    let row = sqlx::query("SELECT id, email, name, company_id, role, plan, email_verified FROM users WHERE id = $1")
        .bind(&payload.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let row = match row {
        Some(r) => r,
        None => return Err(StatusCode::NOT_FOUND),
    };

    let target_role: String = row.get("role");
    let target_email: String = row.get("email");
    let company_id: Option<String> = row.get("company_id");

    // Akun OWNER tidak boleh di-demote/diubah role-nya oleh siapa pun,
    // termasuk oleh dirinya sendiri (menjaga agar pemilik selalu ada).
    let is_target_owner = target_role == OWNER_ROLE;
    if is_target_owner {
        if let Some(new_role) = &payload.role {
            if new_role != OWNER_ROLE {
                return Err(StatusCode::FORBIDDEN);
            }
        }
    }

    let name = payload.name.clone().unwrap_or(row.get("name"));
    let email = payload.email.clone().unwrap_or(target_email.clone());
    let plan = payload.plan.clone().unwrap_or(row.get("plan"));
    let role = if is_target_owner {
        OWNER_ROLE.to_string()
    } else {
        role_for_plan(&plan).to_string()
    };

    // Email unik: tolak bila dipakai akun lain.
    if email != target_email {
        let dup = sqlx::query("SELECT id FROM users WHERE email = $1 AND id != $2")
            .bind(&email)
            .bind(&payload.user_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        if dup.is_some() {
            return Err(StatusCode::CONFLICT);
        }
    }

    match &payload.password {
        Some(p) => {
            let hash = hash_password(p)?;
            sqlx::query(
                "UPDATE users SET name = $1, email = $2, role = $3, plan = $4, password_hash = $5 WHERE id = $6",
            )
            .bind(&name)
            .bind(&email)
            .bind(&role)
            .bind(&plan)
            .bind(&hash)
            .bind(&payload.user_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        }
        None => {
            sqlx::query("UPDATE users SET name = $1, email = $2, role = $3, plan = $4 WHERE id = $5")
                .bind(&name)
                .bind(&email)
                .bind(&role)
                .bind(&plan)
                .bind(&payload.user_id)
                .execute(&state.db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
        }
    }

    Ok(Json(UserResponse {
        id: payload.user_id,
        email,
        name,
        company_id,
        role,
        plan,
        email_verified: Some(row.get("email_verified")),
        ai_provider: None,
        ai_base_url: None,
        ai_model: None,
        ai_enabled: None,
    }))
}

/// DELETE /api/admin/users — hapus akun beserta data perusahaannya (khusus OWNER).
pub async fn admin_delete_user(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AdminDeleteUser>,
) -> Result<StatusCode, StatusCode> {
    if rate_limited("admin:delete", 30, 60) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }
    let actor_id = require_auth(&state, &headers).await?;
    if !is_owner(&state.db, &actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    // Tidak boleh hapus akun sendiri atau akun OWNER lain.
    if actor_id == payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }
    let target = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&payload.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    match target {
        Some(row) => {
            let role: String = row.get("role");
            if role == OWNER_ROLE {
                return Err(StatusCode::FORBIDDEN);
            }
        }
        None => return Err(StatusCode::NOT_FOUND),
    }

    // Hapus data turunan milik user: checklist -> stages -> projects ->
    // members -> divisions -> companies -> sessions -> user.
    sqlx::query(
        "DELETE FROM checklist_items WHERE stage_id IN (
            SELECT id FROM stages WHERE project_id IN (
                SELECT id FROM projects WHERE company_id IN (
                    SELECT id FROM companies WHERE owner_id = $1
                )
            )
        )",
    )
    .bind(&payload.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query(
        "DELETE FROM stages WHERE project_id IN (
            SELECT id FROM projects WHERE company_id IN (
                SELECT id FROM companies WHERE owner_id = $1
            )
        )",
    )
    .bind(&payload.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query(
        "DELETE FROM projects WHERE company_id IN (
            SELECT id FROM companies WHERE owner_id = $1
        )",
    )
    .bind(&payload.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query(
        "DELETE FROM members WHERE company_id IN (
            SELECT id FROM companies WHERE owner_id = $1
        )",
    )
    .bind(&payload.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query(
        "DELETE FROM divisions WHERE company_id IN (
            SELECT id FROM companies WHERE owner_id = $1
        )",
    )
    .bind(&payload.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query("DELETE FROM companies WHERE owner_id = $1")
        .bind(&payload.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(&payload.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(&payload.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!(event = "admin_delete_user", actor = %actor_id, target = %payload.user_id, "user deleted by owner");
    Ok(StatusCode::NO_CONTENT)
}

// ---------- UTILITAS LAIN ----------

/// POST /api/members/register — daftarkan anggota baru dengan akun login.
/// Membuat user (email + password) + member, lalu kirim email sambutan.
pub async fn register_member(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<RegisterMember>,
) -> Result<Json<Member>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    validate_len(&payload.name, "name", 100)?;
    validate_email(&payload.email)?;
    validate_password(&payload.password)?;
    check_company_access(&state, &actor_id, &payload.company_id).await?;

    // Cek email belum dipakai di users.
    let dup = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(payload.email.trim())
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
    if dup.is_some() {
        return Err(StatusCode::CONFLICT);
    }

    // 1. Buat user account (belum aktif — wajib konfirmasi email dulu)
    let user_id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&payload.password)?;
    let verification_token = Uuid::new_v4().to_string();
    let now = Utc::now();
    let role = payload.role.clone().unwrap_or_else(|| "member".to_string());

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, company_id, created_at, email_verified, verification_token, verification_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, $10)",
    )
    .bind(&user_id)
    .bind(payload.email.trim())
    .bind(&password_hash)
    .bind(payload.name.trim())
    .bind(&role)
    .bind("personal")
    .bind(&payload.company_id)
    .bind(&now)
    .bind(&verification_token)
    .bind(now + Duration::hours(24))
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Kirim email konfirmasi aktivasi + kredensial (best-effort).
    if !crate::mail::is_configured() {
        let link = format!("{}/?token={}", crate::mail::app_url(), verification_token);
        tracing::warn!(event = "verify_dev_mode", email = %payload.email.trim(), link = %link, credentials = %payload.password, "SMTP belum dikonfigurasi — link aktivasi + password untuk testing: {} | pass: {}", link, payload.password);
    }
    tokio::spawn({
        let to = payload.email.trim().to_string();
        let name = payload.name.trim().to_string();
        let token = verification_token.clone();
        let cred_email = payload.email.trim().to_string();
        let cred_password = payload.password.clone();
        async move {
            match crate::mail::send_confirmation(&to, &name, &token, Some((&cred_email, &cred_password))).await {
                Ok(true) => tracing::info!(event = "confirmation_email_sent", to = %to),
                _ => tracing::warn!(event = "confirmation_email_skipped", to = %to),
            }
        }
    });

    // 2. Buat member
    let member_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO members (id, company_id, division_id, name, email, role, authority, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
    )
    .bind(&member_id)
    .bind(&payload.company_id)
    .bind(&payload.division_id)
    .bind(payload.name.trim())
    .bind(payload.email.trim())
    .bind(&role)
    .bind(payload.authority.as_deref().unwrap_or("member").trim())
    .bind(payload.position.as_deref().unwrap_or("").trim())
    .bind(payload.phone.as_deref().unwrap_or("").trim())
    .bind(payload.gender.as_deref().unwrap_or("").trim())
    .bind(payload.birth_date.as_deref().unwrap_or("").trim())
    .bind(payload.address.as_deref().unwrap_or("").trim())
    .bind(payload.employment_status.as_deref().unwrap_or("").trim())
    .bind(payload.join_date.as_deref().unwrap_or("").trim())
    .bind(payload.salary.as_deref().unwrap_or("").trim())
    .bind(payload.skills.as_deref().unwrap_or("").trim())
    .bind(payload.education.as_deref().unwrap_or("").trim())
    .bind(payload.notes.as_deref().unwrap_or("").trim())
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    sqlx::query("UPDATE divisions SET member_count = member_count + 1 WHERE id = $1")
        .bind(&payload.division_id)
        .execute(&state.db)
        .await
        .ok();

    tracing::info!(event = "member_registered", user_id = %user_id, member_id = %member_id, email = %payload.email.trim());

    Ok(Json(Member {
        id: member_id,
        company_id: payload.company_id,
        division_id: payload.division_id,
        name: payload.name.trim().to_string(),
        email: payload.email.trim().to_string(),
        role: role.to_string(),
        authority: payload.authority.as_deref().unwrap_or("member").trim().to_string(),
        position: payload.position.as_deref().unwrap_or("").trim().to_string(),
        phone: payload.phone.as_deref().unwrap_or("").trim().to_string(),
        gender: payload.gender.as_deref().unwrap_or("").trim().to_string(),
        birth_date: payload.birth_date.as_deref().unwrap_or("").trim().to_string(),
        address: payload.address.as_deref().unwrap_or("").trim().to_string(),
        employment_status: payload.employment_status.as_deref().unwrap_or("").trim().to_string(),
        join_date: payload.join_date.as_deref().unwrap_or("").trim().to_string(),
        salary: payload.salary.as_deref().unwrap_or("").trim().to_string(),
        skills: payload.skills.as_deref().unwrap_or("").trim().to_string(),
        education: payload.education.as_deref().unwrap_or("").trim().to_string(),
        notes: payload.notes.as_deref().unwrap_or("").trim().to_string(),
        created_at: now,
    }))
}

/// POST /api/members/notify — kirim email notifikasi ke anggota (admin/super admin).
pub async fn notify_member(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<NotifyMember>,
) -> Result<Json<Value>, StatusCode> {
    let actor_id = require_auth(&state, &headers).await?;
    // Hanya owner, super_admin, admin yang boleh kirim notif.
    let role: String = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(&actor_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?
        .get("role");
    let allowed = role == "owner" || role == "super_admin" || role == "admin";
    if !allowed {
        return Err(StatusCode::FORBIDDEN);
    }

    let subject = if payload.subject.is_empty() {
        "Notifikasi Luxio".to_string()
    } else {
        payload.subject
    };

    // Kirim email (best-effort)
    tokio::spawn({
        let to = payload.email.to_string();
        let subj = subject.clone();
        let body = payload.body.to_string();
        async move {
            match crate::mail::send_notification(&to, &subj, &body).await {
                Ok(true) => tracing::info!(event = "notify_email_sent", to = %to, subject = %subj),
                _ => tracing::warn!(event = "notify_email_skipped", to = %to),
            }
        }
    });

    Ok(Json(json!({ "ok": true, "message": "Email notifikasi sedang dikirim" })))
}

// ---------- NOTIFIKASI IN-APP ----------

/// Urutan role untuk menentukan "bawahan" (subordinate). Semakin besar
/// angkanya, semakin tinggi jabatannya. Pengirim hanya boleh menjangkau
/// role dengan angka lebih kecil dari miliknya.
fn role_rank(role: &str) -> i32 {
    match role {
        "owner" => 4,
        "super_admin" => 3,
        "admin" => 2,
        "member" => 1,
        "user" => 1,
        _ => 1,
    }
}

/// Resolve daftar user_id penerima sesuai `targets` dan peran pengirim.
/// Aturan:
///   - mode 'all'   => hanya OWNER (seluruh akun di sistem).
///   - mode 'role'  => role yang dipilih harus di bawah peran pengirim.
///   - mode 'users' => hanya user dalam satu perusahaan dengan pengirim,
///     dan jabatannya di bawah pengirim (kecuali pengirim = owner).
async fn resolve_notify_recipients(
    db: &PgPool,
    _sender_id: &str,
    sender_role: &str,
    sender_company: Option<&str>,
    targets: &NotifyTargets,
) -> Result<Vec<String>, StatusCode> {
    match targets.mode.as_str() {
        "all" => {
            if sender_role != "owner" {
                return Err(StatusCode::FORBIDDEN);
            }
            let rows = sqlx::query("SELECT id FROM users")
                .fetch_all(db)
                .await
                .map_err(|e| {
                    eprintln!("[DB ERROR] {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            Ok(rows.iter().map(|r| r.get::<String, _>("id")).collect())
        }
        "role" => {
            let sender_rank = role_rank(sender_role);
            let mut users = Vec::new();
            for role in &targets.roles {
                let role_rank_v = role_rank(role);
                // Owner boleh menjangkau role apa pun; selain owner hanya
                // role yang lebih rendah darinya.
                if sender_role != "owner" && role_rank_v >= sender_rank {
                    return Err(StatusCode::FORBIDDEN);
                }
                let rows = if sender_role == "owner" {
                    sqlx::query("SELECT id FROM users WHERE role = $1")
                        .bind(role)
                        .fetch_all(db)
                        .await
                        .map_err(|e| {
                            eprintln!("[DB ERROR] {}", e);
                            StatusCode::INTERNAL_SERVER_ERROR
                        })?
                } else {
                    sqlx::query("SELECT id FROM users WHERE role = $1 AND company_id = $2")
                        .bind(role)
                        .bind(sender_company.unwrap_or_default())
                        .fetch_all(db)
                        .await
                        .map_err(|e| {
                            eprintln!("[DB ERROR] {}", e);
                            StatusCode::INTERNAL_SERVER_ERROR
                        })?
                };
                for row in rows {
                    users.push(row.get::<String, _>("id"));
                }
            }
            Ok(users)
        }
        "users" => {
            if sender_role == "owner" {
                return Ok(targets.user_ids.clone());
            }
            // Non-owner: hanya bisa menyasar user dalam perusahaan sendiri
            // yang jabatannya lebih rendah.
            let company = sender_company.unwrap_or_default();
            let mut users = Vec::new();
            for uid in &targets.user_ids {
                let row = sqlx::query("SELECT role, company_id FROM users WHERE id = $1")
                    .bind(uid)
                    .fetch_optional(db)
                    .await
                    .map_err(|e| {
                        eprintln!("[DB ERROR] {}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?
                    .ok_or(StatusCode::BAD_REQUEST)?;
                let target_role: String = row.get("role");
                let target_company: Option<String> = row.get("company_id");
                if target_company.as_deref() != Some(company) {
                    return Err(StatusCode::FORBIDDEN);
                }
                if role_rank(&target_role) >= role_rank(sender_role) {
                    return Err(StatusCode::FORBIDDEN);
                }
                users.push(uid.clone());
            }
            Ok(users)
        }
        _ => Err(StatusCode::BAD_REQUEST),
    }
}

/// GET /api/notifications — daftar notifikasi untuk user yang login
/// (belum dibaca diurutkan lebih dulu).
pub async fn list_notifications(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    let rows = sqlx::query(
        "SELECT n.id, n.sender_id, u.name AS sender_name, n.title, n.body, n.kind, n.read, n.created_at
         FROM notifications n
         JOIN users u ON u.id = n.sender_id
         WHERE n.recipient_id = $1
         ORDER BY n.read ASC, n.created_at DESC
         LIMIT 100",
    )
    .bind(&user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let items: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id": r.get::<String, _>("id"),
                "sender_id": r.get::<String, _>("sender_id"),
                "sender_name": r.get::<String, _>("sender_name"),
                "title": r.get::<String, _>("title"),
                "body": r.get::<String, _>("body"),
                "kind": r.get::<String, _>("kind"),
                "read": r.get::<bool, _>("read"),
                "created_at": r.get::<chrono::DateTime<Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "notifications": items })))
}

/// POST /api/notifications/read — tandai satu/beberapa/semua notifikasi dibaca.
pub async fn read_notifications(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ReadNotificationsRequest>,
) -> Result<Json<Value>, StatusCode> {
    let user_id = require_auth(&state, &headers).await?;

    if payload.all {
        sqlx::query("UPDATE notifications SET read = TRUE WHERE recipient_id = $1")
            .bind(&user_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    } else if !payload.ids.is_empty() {
        for id in &payload.ids {
            sqlx::query(
                "UPDATE notifications SET read = TRUE WHERE id = $1 AND recipient_id = $2",
            )
            .bind(id)
            .bind(&user_id)
            .execute(&state.db)
            .await
            .map_err(|e| {
                eprintln!("[DB ERROR] {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
        }
    }

    Ok(Json(json!({ "ok": true })))
}

/// POST /api/notifications/send — kirim notifikasi in-app ke sasaran.
/// Hak akses: OWNER → semua user/role; super_admin/admin → bawahan
/// (role lebih rendah dalam satu perusahaan).
pub async fn send_notification(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<SendNotificationRequest>,
) -> Result<Json<Value>, StatusCode> {
    let sender_id = require_auth(&state, &headers).await?;

    let sender = sqlx::query("SELECT role, company_id FROM users WHERE id = $1")
        .bind(&sender_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::UNAUTHORIZED)?;
    let sender_role: String = sender.get("role");
    let sender_company: Option<String> = sender.get("company_id");

    let allowed = sender_role == "owner"
        || sender_role == "super_admin"
        || sender_role == "admin";
    if !allowed {
        return Err(StatusCode::FORBIDDEN);
    }

    let title = payload.title.trim().to_string();
    if title.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    let body = payload.body.trim().to_string();
    let kind = if payload.kind.is_empty() {
        "info".to_string()
    } else {
        payload.kind
    };

    let recipients = resolve_notify_recipients(
        &state.db,
        &sender_id,
        &sender_role,
        sender_company.as_deref(),
        &payload.targets,
    )
    .await?;

    if recipients.is_empty() {
        return Ok(Json(json!({ "ok": true, "sent": 0 })));
    }

    let mut sent = 0u32;
    for recipient_id in &recipients {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        sqlx::query(
            "INSERT INTO notifications (id, sender_id, recipient_id, title, body, kind, read, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7)",
        )
        .bind(&id)
        .bind(&sender_id)
        .bind(recipient_id)
        .bind(&title)
        .bind(&body)
        .bind(&kind)
        .bind(&now)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        sent += 1;
    }

    tracing::info!(event = "notification_sent", sender_id = %sender_id, recipients = sent);

    Ok(Json(json!({ "ok": true, "sent": sent })))
}

/// GET /health — pengecekan server hidup atau tidak.
pub async fn health_check() -> &'static str {
    "OK"
}