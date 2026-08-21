use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// =====================================================================
// MODELS / TYPES
// =====================================================================
// Berisi definisi tipe data yang dipakai di seluruh backend:
//   1. Model database (yang disimpan di tabel Postgres, lihat db.rs)
//   2. Tipe request/response untuk API
// Handler (handlers.rs) memakai tipe-tipe ini sebagai kontrak input/output.
// =====================================================================

// ---------- DATABASE MODELS ----------
// Field harus sama dengan kolom tabel yang dibuat di db::migrate().

/// Pengguna aplikasi. `password_hash` tidak pernah dikirim balik ke client.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub name: String,
    pub company_id: Option<String>,
    pub role: String,
    pub plan: String,
    pub created_at: DateTime<Utc>,
}

/// Organisasi/perusahaan yang dimiliki seorang pengguna (owner_id).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub industry: String,
    pub size: String,
    pub owner_id: String,
    pub created_at: DateTime<Utc>,
}

/// Divisi/departemen di dalam sebuah perusahaan.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Division {
    pub id: String,
    pub company_id: String,
    pub name: String,
    pub head_id: Option<String>,
    pub member_count: i32,
    pub created_at: DateTime<Utc>,
}

/// Anggota tim yang tergabung dalam sebuah divisi.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Member {
    pub id: String,
    pub company_id: String,
    pub division_id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub position: String,
    pub phone: String,
    pub gender: String,
    pub birth_date: String,
    pub address: String,
    pub employment_status: String,
    pub join_date: String,
    pub salary: String,
    pub skills: String,
    pub education: String,
    pub notes: String,
    pub created_at: DateTime<Utc>,
}

/// Project / target yang dikerjakan sebuah divisi.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub company_id: String,
    pub division_id: String,
    pub name: String,
    pub project_type: String,
    pub progress: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub due_date: Option<DateTime<Utc>>,
}

/// Tahapan (stage) di dalam sebuah project (mis. Planning -> Execution -> Review).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stage {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub order_num: i32,
    pub status: String,
}

/// Checklist item di dalam sebuah stage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistItem {
    pub id: String,
    pub stage_id: String,
    pub text: String,
    pub completed: bool,
}

// ---------- REQUEST / RESPONSE ----------

/// Body request untuk endpoint POST /api/auth/register.
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub name: String,
}

/// Body request untuk endpoint POST /api/auth/login.
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Body request untuk endpoint POST /api/auth/verify — aktivasi akun
/// lewat token dari email konfirmasi.
#[derive(Debug, Deserialize)]
pub struct VerifyEmailRequest {
    pub token: String,
}

/// Body request untuk endpoint POST /api/auth/2fa/verify — verifikasi kode
/// 2FA setelah login (email + kode).
#[derive(Debug, Deserialize)]
pub struct Verify2FARequest {
    pub email: String,
    pub code: String,
}

/// Response standar untuk endpoint auth. `success=false` menandakan gagal.
/// `token` berisi session token (Bearer) yang wajib dikirim client pada
/// header `Authorization` untuk request berikutnya.
/// `requires_confirmation=true` => akun belum aktif (harus klik email).
/// `requires_2fa=true` => kode 2FA sudah dikirim, lanjut ke /2fa/verify.
#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub success: bool,
    pub message: String,
    pub user: Option<UserResponse>,
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requires_confirmation: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requires_2fa: Option<bool>,
}

/// Bentuk user yang aman dikirim ke client (tanpa password_hash).
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub company_id: Option<String>,
    pub role: String,
    pub plan: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email_verified: Option<bool>,
}

/// Body request untuk endpoint POST /api/companies.
#[derive(Debug, Deserialize)]
pub struct CreateCompany {
    pub name: String,
    pub industry: String,
    pub size: String,
    pub user_id: String,
}

/// Body request untuk endpoint POST /api/divisions.
#[derive(Debug, Deserialize)]
pub struct CreateDivision {
    pub company_id: String,
    pub name: String,
    pub head_id: Option<String>,
}

/// Body request untuk endpoint POST /api/members.
#[derive(Debug, Deserialize)]
pub struct CreateMember {
    pub company_id: String,
    pub division_id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    #[serde(default)]
    pub position: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(default)]
    pub birth_date: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub employment_status: Option<String>,
    #[serde(default)]
    pub join_date: Option<String>,
    #[serde(default)]
    pub salary: Option<String>,
    #[serde(default)]
    pub skills: Option<String>,
    #[serde(default)]
    pub education: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}

/// Body request untuk endpoint POST /api/members/register — mendaftarkan
/// anggota sekaligus membuat akun login (email + password) dan mengirim
/// email sambutan.
#[derive(Debug, Deserialize)]
pub struct RegisterMember {
    pub company_id: String,
    pub division_id: String,
    pub name: String,
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub position: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(default)]
    pub birth_date: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub employment_status: Option<String>,
    #[serde(default)]
    pub join_date: Option<String>,
    #[serde(default)]
    pub salary: Option<String>,
    #[serde(default)]
    pub skills: Option<String>,
    #[serde(default)]
    pub education: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
}

/// Body request untuk endpoint POST /api/members/notify — kirim email
/// notifikasi ke email anggota dari aplikasi.
#[derive(Debug, Deserialize)]
pub struct NotifyMember {
    pub email: String,
    #[serde(default)]
    pub subject: String,
    pub body: String,
}

// ---------- ADMIN (khusus role 'owner') ----------

/// Query param untuk GET /api/admin/users — `?actor_id=...`.
/// `actor_id` hanya dipertahankan untuk kompatibilitas; identitas asli
/// diambil dari header Authorization (token sesi).
#[derive(Debug, Deserialize)]
pub struct AdminActorQuery {
    pub actor_id: Option<String>,
}

/// Query param generik untuk endpoint GET yang dulu menerima `user_id`
/// di query string. Kini diabaikan (identitas dari token), hanya agar
/// request lama tetap bisa ter-parse.
#[derive(Debug, Deserialize)]
pub struct ActorQuery {
    pub user_id: Option<String>,
}

/// Query param untuk endpoint GET yang memakai `company_id` di query string.
#[derive(Debug, Deserialize)]
pub struct CompanyQuery {
    pub company_id: String,
}

/// Body request untuk endpoint POST /api/admin/users — buat akun baru.
/// `role` diabaikan (role otomatis mengikuti paket), hanya dipertahankan
/// agar request lama tetap bisa ter-parse.
#[derive(Debug, Deserialize)]
pub struct AdminCreateUser {
    pub actor_id: String,
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: Option<String>,
    pub plan: Option<String>,
}

/// Body request untuk endpoint PUT /api/admin/users — ubah akun.
#[derive(Debug, Deserialize)]
pub struct AdminUpdateUser {
    pub actor_id: String,
    pub user_id: String,
    pub name: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<String>,
    pub plan: Option<String>,
}

/// Body request untuk endpoint DELETE /api/admin/users — hapus akun.
#[derive(Debug, Deserialize)]
pub struct AdminDeleteUser {
    pub actor_id: String,
    pub user_id: String,
}
