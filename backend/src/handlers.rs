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
async fn require_auth(state: &AppState, headers: &HeaderMap) -> Result<String, StatusCode> {
    match user_from_headers(&state.db, headers).await? {
        Some(user_id) => Ok(user_id),
        None => Err(StatusCode::UNAUTHORIZED),
    }
}

// ---------- AUTH ----------

/// POST /api/auth/register — daftar akun baru. Role pertama selalu 'member'
/// (auto-role mengikuti paket). Mengembalikan token sesi agar langsung login.
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
        }));
    }

    let user_id = Uuid::new_v4().to_string();
    let password_hash = hash_password(&payload.password)?;
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, 'personal', $6)",
    )
    .bind(&user_id)
    .bind(payload.email.trim())
    .bind(&password_hash)
    .bind(payload.name.trim())
    .bind(role_for_plan("personal"))
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("[DB ERROR] {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let token = create_session(&state.db, &user_id).await?;

    tracing::info!(event = "register", user_id = %user_id, "user registered");

    Ok(Json(AuthResponse {
        success: true,
        message: "Registrasi berhasil".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: payload.email.trim().to_string(),
            name: payload.name.trim().to_string(),
            company_id: None,
            role: role_for_plan("personal").to_string(),
            plan: "personal".to_string(),
        }),
        token: Some(token),
    }))
}

/// POST /api/auth/login — verifikasi email & password, lalu keluarkan token sesi.
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Rate limit per email: maksimal 10 percobaan login / 10 menit (anti brute-force).
    if rate_limited(&format!("login:{}", payload.email.trim().to_lowercase()), 10, 600) {
        return Err(StatusCode::TOO_MANY_REQUESTS);
    }

    let row = sqlx::query(
        "SELECT id, email, password_hash, name, company_id, role, plan FROM users WHERE email = $1",
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
        }));
    }

    let user_id: String = row.get("id");

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

    let token = create_session(&state.db, &user_id).await?;

    let company_id: Option<String> = row.get("company_id");
    tracing::info!(event = "login", user_id = %user_id, "login success");

    Ok(Json(AuthResponse {
        success: true,
        message: "Login berhasil".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: row.get("email"),
            name: row.get("name"),
            company_id,
            role: row.get("role"),
            plan: row.get("plan"),
        }),
        token: Some(token),
    }))
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

    let row = sqlx::query("SELECT id, email, name, company_id, role, plan FROM users WHERE id = $1")
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
        "INSERT INTO members (id, company_id, division_id, name, email, role, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
    )
    .bind(&id)
    .bind(&payload.company_id)
    .bind(&payload.division_id)
    .bind(payload.name.trim())
    .bind(payload.email.trim())
    .bind(payload.role.trim())
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
        "SELECT id, company_id, division_id, name, email, role, position, phone, gender, birth_date, address, employment_status, join_date, salary, skills, education, notes, created_at
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

/// Pastikan `user_id` adalah pemilik `company_id` (atau ada sesi yang valid).
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

    match row {
        Some(r) => {
            let owner_id: String = r.get("owner_id");
            if owner_id == user_id {
                Ok(())
            } else {
                Err(StatusCode::FORBIDDEN)
            }
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

// ---------- OWNER / ADMIN ----------

// Kredensial akun pemilik website (OWNER) diambil dari environment,
// JANGAN di-hardcode di source. Akun ini dibuat otomatis saat server start
// dan berhak mengelola seluruh akun di sistem.
const OWNER_EMAIL_DEFAULT: &str = "master@luxio.web.id";
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
///   Personal & Profesional => member, Grup => admin, Organisasi => super_admin.
/// Role tidak bisa dipindah tangankan secara manual (hanya mengikuti paket).
fn role_for_plan(plan: &str) -> &str {
    match plan {
        "grup" => "admin",
        "organisasi" => "super_admin",
        _ => "member",
    }
}

/// Selaraskan role seluruh akun (selain OWNER) dengan paketnya. Dipanggil
/// sekali saat server start agar aturan auto-role selalu berlaku.
pub async fn normalize_user_roles(db: &PgPool) {
    sqlx::query(
        "UPDATE users SET role = CASE plan
            WHEN 'grup' THEN 'admin'
            WHEN 'organisasi' THEN 'super_admin'
            ELSE 'member'
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
            sqlx::query("UPDATE users SET role = $1, plan = $2 WHERE email = $3")
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
                "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
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
        "SELECT id, email, name, company_id, role, plan FROM users ORDER BY created_at DESC",
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

    let row = sqlx::query("SELECT id, email, name, company_id, role, plan FROM users WHERE id = $1")
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

/// GET /health — pengecekan server hidup atau tidak.
pub async fn health_check() -> &'static str {
    "OK"
}
