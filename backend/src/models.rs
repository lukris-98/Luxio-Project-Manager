use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
    /// Level kewenangan anggota dalam tim (Item 6):
    /// owner, super_admin, admin, manager, member, viewer.
    pub authority: String,
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
    #[serde(default)]
    pub username: Option<String>,
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

/// Body request untuk endpoint POST /api/auth/forgot-password — lupa password.
#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

/// Body request untuk endpoint POST /api/auth/reset-password — atur ulang
/// password memakai token dari email lupa password.
#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub password: String,
}

/// Body request untuk endpoint POST /api/auth/2fa/verify — verifikasi kode
/// 2FA setelah login (email + kode).
#[derive(Debug, Deserialize)]
pub struct Verify2FARequest {
    pub email: String,
    pub code: String,
}

/// Body request untuk endpoint POST /api/auth/verify-pin — verifikasi PIN
/// owner setelah login. Bila PIN belum ada, PIN akan disimpan & login langsung.
#[derive(Debug, Deserialize)]
pub struct VerifyPinRequest {
    pub email: String,
    pub pin: String,
}

/// Body request untuk PUT /api/profile/pin — ganti PIN (butuh auth token).
#[derive(Debug, Deserialize)]
pub struct SetPinRequest {
    pub pin: String,
}

/// Body request untuk POST /api/auth/google — login/daftar via Google.
/// `token` bisa berupa access_token atau id_token dari Google Identity
/// Services; backend memvalidasinya ke endpoint tokeninfo Google.
#[derive(Debug, Deserialize)]
pub struct GoogleAuthRequest {
    pub token: String,
}

/// Respons JSON dari https://oauth2.googleapis.com/tokeninfo (subset field).
#[derive(Debug, Deserialize)]
pub struct GoogleTokenInfo {
    pub aud: String,
    #[serde(default)]
    pub sub: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub email_verified: bool,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub picture: String,
    #[serde(default)]
    pub error: String,
    #[serde(default)]
    pub error_description: String,
}

/// Response standar untuk endpoint auth. `success=false` menandakan gagal.
/// `token` berisi session token (Bearer) yang wajib dikirim client pada
/// header `Authorization` untuk request berikutnya.
/// `requires_confirmation=true` => akun belum aktif (harus klik email).
/// `requires_2fa=true` => kode 2FA sudah dikirim, lanjut ke /2fa/verify.
/// `requires_pin=true` => (khusus owner) PIN sudah terdaftar, lanjut ke verify-pin.
/// `requires_pin_setup=true` => (khusus owner) PIN belum ada, set PIN dulu.
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requires_pin: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requires_pin_setup: Option<bool>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_base_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_enabled: Option<bool>,
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
    /// Level kewenangan (Item 6). Default 'member' bila tidak dikirim.
    #[serde(default)]
    pub authority: Option<String>,
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
    /// Level kewenangan (Item 6).
    #[serde(default)]
    pub authority: Option<String>,
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

// ---------- PROFIL (Item 2: Settings) ----------

/// Body request untuk endpoint PUT /api/profile — perbarui profil.
/// Bila `user_id` diisi oleh admin/super_admin/owner, targetnya user lain;
/// tanpa `user_id` (atau sama dengan diri sendiri) maka mengubah profil sendiri.
#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
    #[serde(default)]
    pub position: Option<String>,
    #[serde(default)]
    pub join_date: Option<String>,
    #[serde(default)]
    pub employment_status: Option<String>,
    #[serde(default)]
    pub birth_date: Option<String>,
    #[serde(default)]
    pub education: Option<String>,
    #[serde(default)]
    pub salary: Option<String>,
}

/// Profil lengkap user (dengan field profil + kuota edit bulanan).
#[derive(Debug, Serialize)]
pub struct ProfileResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub company_id: Option<String>,
    pub role: String,
    pub plan: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email_verified: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default)]
    pub phone: String,
    #[serde(default)]
    pub gender: String,
    #[serde(default)]
    pub address: String,
    #[serde(default)]
    pub position: String,
    #[serde(default)]
    pub join_date: String,
    #[serde(default)]
    pub employment_status: String,
    #[serde(default)]
    pub birth_date: String,
    #[serde(default)]
    pub education: String,
    #[serde(default)]
    pub salary: String,
    #[serde(default)]
    pub edit_count: i32,
    #[serde(default)]
    pub edit_limit: i32,
    #[serde(default)]
    pub edit_count_month: String,
    #[serde(default)]
    pub has_pin: bool,
    #[serde(default)]
    pub ai_provider: String,
    #[serde(default)]
    pub ai_base_url: String,
    #[serde(default)]
    pub ai_key: String,
    #[serde(default)]
    pub ai_model: String,
    #[serde(default)]
    pub ai_enabled: bool,
    #[serde(default)]
    pub avatar_url: String,
}

/// Query param opsional untuk GET /api/profile — `?user_id=...` (admin).
#[derive(Debug, Deserialize)]
pub struct ProfileQuery {
    pub user_id: Option<String>,
}

/// Body request untuk PUT /api/profile/avatar — ganti foto profil (data URL).
#[derive(Debug, Deserialize)]
pub struct UpdateAvatarRequest {
    #[serde(default)]
    pub avatar_url: String,
}

/// Query param untuk GET /api/users/search — `?q=...`.
#[derive(Debug, Deserialize)]
pub struct UserSearchQuery {
    pub q: String,
}

// ---------- UPGRADE AKUN (Item 4) ----------

/// Body request untuk endpoint POST /api/upgrade — upgrade akun dari role
/// 'user' ke admin/super_admin sesuai plan, sekaligus menyimpan data
/// organisasi/company.
#[derive(Debug, Deserialize)]
pub struct UpgradeRequest {
    pub plan: String,
    pub org_type: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub industry: Option<String>,
    #[serde(default)]
    pub size: Option<String>,
    #[serde(default)]
    pub legal_number: Option<String>,
    #[serde(default)]
    pub address: Option<String>,
}

// ---------- CHAT (Item 5) ----------

/// Body request POST /api/chat/send.
#[derive(Debug, Deserialize)]
pub struct ChatSendRequest {
    #[serde(default)]
    pub conversation_id: Option<String>,
    #[serde(default)]
    pub to_user_id: Option<String>,
    #[serde(default)]
    pub group_id: Option<String>,
    pub body: String,
}

/// Body request POST /api/chat/group/create.
#[derive(Debug, Deserialize)]
pub struct ChatGroupCreateRequest {
    pub name: String,
    #[serde(default)]
    pub company_id: Option<String>,
    #[serde(default)]
    pub member_ids: Vec<String>,
}

/// Body request POST /api/chat/contacts — tambah kontak via username unik.
#[derive(Debug, Deserialize)]
pub struct ContactAddRequest {
    pub username: String,
}

/// Body request GET /api/chat/messages — query param percakapan.
#[derive(Debug, Deserialize)]
pub struct ChatMessagesQuery {
    pub conversation_id: String,
}

/// Body request GET /api/chat/conversations — query param company (opsional).
#[derive(Debug, Deserialize)]
pub struct ChatConversationsQuery {
    pub company_id: Option<String>,
}

// ---------- AI AGENT (Item 8) ----------

/// Body request POST /api/agent/chat — kirim pesan ke agent.
#[derive(Debug, Deserialize)]
pub struct AgentChatRequest {
    pub message: String,
    #[serde(default)]
    pub conversation_id: Option<String>,
}

/// Body request POST /api/owner/mail/test — tes kirim email (owner).
#[derive(Debug, Deserialize)]
pub struct MailTestRequest {
    pub email: String,
}

/// Body request PUT /api/agent/config — simpan penyedia AI (owner/super_admin).
#[derive(Debug, Deserialize)]
pub struct AgentConfigRequest {
    /// Nama penyedia, mis. "OpenAI", "Anthropic", "Groq", "Ollama", "Kilo Code"
    pub provider_name: String,
    /// Base URL API, mis. https://api.openai.com/v1
    pub base_url: String,
    /// API key penyedia
    pub api_key: String,
    /// Nama model, mis. gpt-4o, claude-sonnet-4, llama-3.3-70b
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub enabled: bool,
}

// ---------- OWNER DASHBOARD (analytics, db, storage, logs) ----------

/// Body request PUT /api/owner/config — simpan konfigurasi owner.
#[derive(Debug, Deserialize)]
pub struct OwnerConfigRequest {
    pub key: String,
    pub value: Value,
}

/// Body request POST /api/attendance — absen masuk (checkin) / pulang (checkout).
#[derive(Debug, Deserialize)]
pub struct AttendanceRequest {
    /// 'checkin' (masuk) atau 'checkout' (pulang).
    #[serde(default, rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub photo_url: String,
    pub latitude: f64,
    pub longitude: f64,
    #[serde(default)]
    pub distance_m: f64,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub note: String,
    /// ID tim (dari frontend, filter dashboard admin).
    #[serde(default)]
    pub team_id: String,
}

/// Query param GET /api/attendance — `?company_id=...` opsional.
#[derive(Debug, Deserialize)]
pub struct AttendanceQuery {
    pub company_id: Option<String>,
}

/// Query param GET /api/attendance/admin — dashboard admin.
#[derive(Debug, Deserialize)]
pub struct AttendanceAdminQuery {
    pub company_id: String,
    #[serde(default)]
    pub team_id: String,
}

/// Query param GET /api/salary/monthly — `?company_id=&month=YYYY-MM&team_id=`.
#[derive(Debug, Deserialize)]
pub struct SalaryQuery {
    pub company_id: String,
    pub month: String,
    #[serde(default)]
    pub team_id: String,
}

/// Body request POST /api/salary/incentive — tambah/hapus insentif bulanan.
#[derive(Debug, Deserialize)]
pub struct IncentiveRequest {
    pub user_id: String,
    pub month: String,
    pub amount: f64,
    #[serde(default)]
    pub reason: String,
}

// ---------- NOTIFIKASI IN-APP ----------

/// Sasaran pengiriman notifikasi. `mode`:
///   'all'  => semua user di seluruh sistem (hanya OWNER).
///   'role' => semua user dengan role tertentu (`roles`).
///   'users'=> daftar user spesifik (`user_ids`).
#[derive(Debug, Deserialize)]
pub struct NotifyTargets {
    pub mode: String,
    #[serde(default)]
    pub roles: Vec<String>,
    #[serde(default)]
    pub user_ids: Vec<String>,
}

/// Body request POST /api/notifications/send — kirim notifikasi in-app.
#[derive(Debug, Deserialize)]
pub struct SendNotificationRequest {
    pub title: String,
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub kind: String,
    pub targets: NotifyTargets,
}

/// Body request POST /api/notifications/read — tandai notifikasi dibaca.
#[derive(Debug, Deserialize)]
pub struct ReadNotificationsRequest {
    /// Bila kosong dan `all` true, tandai semua sebagai dibaca.
    #[serde(default)]
    pub ids: Vec<String>,
    #[serde(default)]
    pub all: bool,
}
