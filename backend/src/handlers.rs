use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use sqlx::Row;
use sqlx::PgPool;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
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

// ---------- UTILITAS ----------

/// Hash sederhana (DefaultHasher) untuk demo.
/// CATATAN KEAMANAN: jangan dipakai di produksi. Ganti dengan `bcrypt`
/// atau `argon2` (lihat .env.example / README bagian keamanan).
fn simple_hash(password: &str) -> String {
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Verifikasi password terhadap hash hasil `simple_hash`.
fn verify_password(password: &str, hash: &str) -> bool {
    simple_hash(password) == hash
}

// ---------- AUTH ----------

/// POST /api/auth/register — daftar akun baru. Role pertama selalu 'admin'.
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Cegah email ganda.
    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&payload.email)
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
        }));
    }

    let user_id = Uuid::new_v4().to_string();
    let password_hash = simple_hash(&payload.password);
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, 'personal', $6)",
    )
    .bind(&user_id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.name)
    // Akun baru selalu paket Personal => role member (auto-role mengikuti paket).
    .bind(role_for_plan("personal"))
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(AuthResponse {
        success: true,
        message: "Registrasi berhasil".to_string(),
        user: Some(UserResponse {
            id: user_id,
            email: payload.email,
            name: payload.name,
            company_id: None,
            role: role_for_plan("personal").to_string(),
            plan: "personal".to_string(),
        }),
    }))
}

/// POST /api/auth/login — verifikasi email & password.
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let row = sqlx::query(
        "SELECT id, email, password_hash, name, company_id, role, plan FROM users WHERE email = $1",
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match row {
        Some(row) => {
            let password_hash: String = row.get("password_hash");
            if verify_password(&payload.password, &password_hash) {
                let company_id: Option<String> = row.get("company_id");
                Ok(Json(AuthResponse {
                    success: true,
                    message: "Login berhasil".to_string(),
                    user: Some(UserResponse {
                        id: row.get("id"),
                        email: row.get("email"),
                        name: row.get("name"),
                        company_id,
                        role: row.get("role"),
                        plan: row.get("plan"),
                    }),
                }))
            } else {
                Ok(Json(AuthResponse {
                    success: false,
                    message: "Password salah".to_string(),
                    user: None,
                }))
            }
        }
        None => Ok(Json(AuthResponse {
            success: false,
            message: "Email tidak ditemukan".to_string(),
            user: None,
        })),
    }
}

/// POST /api/auth/me — ambil data pengguna berdasarkan id.
pub async fn get_me(
    State(state): State<AppState>,
    Json(user_id): Json<String>,
) -> Result<Json<UserResponse>, StatusCode> {
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

/// POST /api/companies — buat perusahaan baru dan tautkan ke owner (user).
pub async fn create_company(
    State(state): State<AppState>,
    Json(payload): Json<CreateCompany>,
) -> Result<Json<Company>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO companies (id, name, industry, size, owner_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.industry)
    .bind(&payload.size)
    .bind(&payload.user_id)
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
        .bind(&payload.user_id)
        .execute(&state.db)
        .await
        .ok();

    Ok(Json(Company {
        id,
        name: payload.name,
        industry: payload.industry,
        size: payload.size,
        owner_id: payload.user_id,
        created_at: now,
    }))
}

/// GET /api/companies — daftar perusahaan milik seorang user.
pub async fn get_companies(
    State(state): State<AppState>,
    Json(user_id): Json<String>,
) -> Result<Json<Vec<Company>>, StatusCode> {
    let rows = sqlx::query(
        "SELECT id, name, industry, size, owner_id, created_at FROM companies WHERE owner_id = $1",
    )
    .bind(&user_id)
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
    Json(payload): Json<CreateDivision>,
) -> Result<Json<Division>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO divisions (id, company_id, name, head_id, member_count, created_at) VALUES ($1, $2, $3, $4, 0, $5)",
    )
    .bind(&id)
    .bind(&payload.company_id)
    .bind(&payload.name)
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
        name: payload.name,
        head_id: payload.head_id,
        member_count: 0,
        created_at: now,
    }))
}

/// GET /api/divisions — daftar divisi milik sebuah perusahaan.
pub async fn get_divisions(
    State(state): State<AppState>,
    Json(company_id): Json<String>,
) -> Result<Json<Vec<Division>>, StatusCode> {
    let rows = sqlx::query(
        "SELECT id, company_id, name, head_id, member_count, created_at FROM divisions WHERE company_id = $1",
    )
    .bind(&company_id)
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
    Json(payload): Json<CreateMember>,
) -> Result<Json<Member>, StatusCode> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO members (id, company_id, division_id, name, email, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(&id)
    .bind(&payload.company_id)
    .bind(&payload.division_id)
    .bind(&payload.name)
    .bind(&payload.email)
    .bind(&payload.role)
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
        name: payload.name,
        email: payload.email,
        role: payload.role,
        created_at: now,
    }))
}

/// GET /api/members — daftar anggota sebuah perusahaan.
pub async fn get_members(
    State(state): State<AppState>,
    Json(company_id): Json<String>,
) -> Result<Json<Vec<Member>>, StatusCode> {
    let rows = sqlx::query(
        "SELECT id, company_id, division_id, name, email, role, created_at FROM members WHERE company_id = $1",
    )
    .bind(&company_id)
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
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(Json(members))
}

// ---------- PROJECTS ----------

/// GET /api/projects — daftar project aktif sebuah perusahaan.
pub async fn get_projects(
    State(state): State<AppState>,
    Json(company_id): Json<String>,
) -> Result<Json<Vec<Project>>, StatusCode> {
    let rows = sqlx::query(
        "SELECT id, company_id, division_id, name, project_type, progress, status, created_at, due_date FROM projects WHERE company_id = $1 AND status != 'archived'",
    )
    .bind(&company_id)
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

// ---------- OWNER / ADMIN ----------

// Kredensial akun pemilik website (OWNER). Akun ini dibuat otomatis saat
// server start (seed_owner) dan berhak mengelola seluruh akun di sistem.
const OWNER_EMAIL: &str = "master@luxio.web.id";
const OWNER_PASSWORD: &str = "@Lukris1998";
const OWNER_NAME: &str = "Master Owner";
const OWNER_ROLE: &str = "owner";
const OWNER_PLAN: &str = "organisasi";

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
    println!("✅ User roles auto-synced to plan");
}

/// Buat akun OWNER bila belum ada. Dipanggil dari `lib.rs::run()` setelah migrate.
pub async fn seed_owner(db: &PgPool) {
    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(OWNER_EMAIL)
        .fetch_optional(db)
        .await;

    match existing {
        Ok(Some(_)) => {
            // Akun sudah ada: pastikan role & plan tetap benar.
            sqlx::query("UPDATE users SET role = $1, plan = $2 WHERE email = $3")
                .bind(OWNER_ROLE)
                .bind(OWNER_PLAN)
                .bind(OWNER_EMAIL)
                .execute(db)
                .await
                .ok();
            println!("✅ Owner account ready ({})", OWNER_EMAIL);
        }
        Ok(None) => {
            let id = Uuid::new_v4().to_string();
            let password_hash = simple_hash(OWNER_PASSWORD);
            let now = Utc::now();

            let res = sqlx::query(
                "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            )
            .bind(&id)
            .bind(OWNER_EMAIL)
            .bind(&password_hash)
            .bind(OWNER_NAME)
            .bind(OWNER_ROLE)
            .bind(OWNER_PLAN)
            .bind(&now)
            .execute(db)
            .await;

            match res {
                Ok(_) => println!("✅ Owner account created ({})", OWNER_EMAIL),
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
/// Pemanggil dikirim lewat query `?actor_id=...` (konsisten dengan pola GET
/// proyek lain seperti companies/divisions/members).
pub async fn admin_list_users(
    State(state): State<AppState>,
    Query(payload): Query<AdminActorQuery>,
) -> Result<Json<Vec<UserResponse>>, StatusCode> {
    if !is_owner(&state.db, &payload.actor_id)
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
    Json(payload): Json<AdminCreateUser>,
) -> Result<Json<UserResponse>, StatusCode> {
    if !is_owner(&state.db, &payload.actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&payload.email)
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
    let password_hash = simple_hash(&payload.password);
    let now = Utc::now();
    let plan = payload.plan.clone().unwrap_or_else(|| "personal".to_string());
    // Role otomatis mengikuti paket — role manual diabaikan.
    let role = role_for_plan(&plan);

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, name, role, plan, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.name)
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
        email: payload.email,
        name: payload.name,
        company_id: None,
        role: role.to_string(),
        plan,
    }))
}

/// PUT /api/admin/users — ubah akun (nama/email/role/plan/password).
/// Dipakai juga untuk upgrade/downgrade akun lewat field `role` & `plan`.
pub async fn admin_update_user(
    State(state): State<AppState>,
    Json(payload): Json<AdminUpdateUser>,
) -> Result<Json<UserResponse>, StatusCode> {
    if !is_owner(&state.db, &payload.actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
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
    // Role otomatis mengikuti paket (tidak bisa dipindah tangankan).
    // Akun OWNER selalu ber-role owner.
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
            let hash = simple_hash(p);
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
    Json(payload): Json<AdminDeleteUser>,
) -> Result<StatusCode, StatusCode> {
    if !is_owner(&state.db, &payload.actor_id)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
    {
        return Err(StatusCode::FORBIDDEN);
    }

    // Tidak boleh hapus akun sendiri atau akun OWNER lain.
    if payload.actor_id == payload.user_id {
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
    // members -> divisions -> companies -> user.
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

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(&payload.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            eprintln!("[DB ERROR] {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------- UTILITAS LAIN ----------

/// GET /health — pengecekan server hidup atau tidak.
pub async fn health_check() -> &'static str {
    "OK"
}
