pub mod ai_providers;
pub mod db;
pub mod handlers;
pub mod mail;
pub mod models;
pub mod owner;
pub mod push;
pub mod tools;

use axum::{
    http::HeaderValue,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::{
    cors::CorsLayer,
    limit::RequestBodyLimitLayer,
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};

// =====================================================================
// LIB ROOT
// =====================================================================
// Titik masuk pustaka `luxio_backend`. Berisi:
//   - deklarasi modul (models, db, handlers)
//   - state bersama aplikasi (`AppState`, berisi pool database)
//   - fungsi `run()` yang merangkai router + memulai server
//
// Struktur:
//   models.rs   -> tipe data (database + request/response)
//   db.rs       -> koneksi & skema database
//   handlers.rs -> implementasi tiap endpoint
//   main.rs     -> binary yang memanggil `luxio_backend::run()`
// =====================================================================

/// State yang dibagikan ke semua handler. Cukup satu field: pool database.
pub type AppState = Arc<AppStateInner>;

/// Inner struct dari `AppState` (dibungkus `Arc` agar aman dibagi antar task).
pub struct AppStateInner {
    pub db: PgPool,
}

/// Menjalankan server Luxio:
/// 1. baca env, 2. konek DB, 3. migrasi, 4. buat router, 5. listen.
pub async fn run() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=info".into()),
        )
        .init();

    // -- 1. Konfigurasi dari environment --
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let allowed_origin = std::env::var("ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:5173,http://127.0.0.1:5173".to_string());

    // -- 2. Konek ke database --
    let db = db::connect(&database_url).await?;
    println!("✅ Connected to Neon database");

    // -- 3. Pastikan tabel tersedia --
    db::migrate(&db).await?;
    println!("✅ Database tables ready");

    // -- 3b. Siapkan akun OWNER (pemilik website) --
    handlers::seed_owner(&db).await;

    // -- 3b'. Seed akun login dummy (demo) dalam jumlah banyak --
    handlers::seed_dummy_accounts(&db).await;

    // -- 3c. Selaraskan role semua akun dengan paketnya (auto-role) --
    handlers::normalize_user_roles(&db).await;

    // -- 4. Rakit state & router --
    let state = Arc::new(AppStateInner { db });

    // CORS: hanya izinkan origin yang diizinkan (lihat `ALLOWED_ORIGIN`).
    let cors = {
        let origins: Vec<HeaderValue> = allowed_origin
            .split(',')
            .filter_map(|s| {
                let s = s.trim();
                if s.is_empty() { None } else { HeaderValue::from_str(s).ok() }
            })
            .collect();
        if origins.is_empty() {
            CorsLayer::new()
        } else {
            CorsLayer::new()
                .allow_origin(origins)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any)
        }
    };

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        // Auth
        .route("/api/auth/register", post(handlers::register))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/verify", post(handlers::verify_email))
        .route("/api/auth/2fa/verify", post(handlers::verify_2fa))
        .route("/api/auth/verify-pin", post(handlers::verify_pin))
        .route("/api/auth/google", post(handlers::google_auth))
        .route("/api/auth/logout", post(handlers::logout))
        .route("/api/auth/me", get(handlers::get_me))
        // Profil & kuota edit (Item 2)
        .route("/api/profile", get(handlers::get_profile))
        .route("/api/profile", put(handlers::update_profile))
        .route("/api/profile/pin", put(handlers::set_pin))
        .route("/api/company/users", get(handlers::company_users))
        // Upgrade akun (Item 4)
        .route("/api/upgrade", post(handlers::upgrade_account))
        // Chat (Item 5)
        .route("/api/chat/send", post(handlers::chat_send))
        .route("/api/chat/messages", get(handlers::chat_messages))
        .route("/api/chat/conversations", get(handlers::chat_conversations))
        .route("/api/chat/group/create", post(handlers::chat_group_create))
        .route("/api/chat/contacts", get(handlers::chat_contacts))
        .route("/api/chat/contacts", post(handlers::chat_add_contact))
        .route("/api/users/search", get(handlers::search_users))
        .route("/api/users/{id}", get(handlers::get_public_profile))
        // Owner dashboard (analytics, db, storage, logs)
        .route("/api/owner/config", put(owner::owner_config))
        .route("/api/owner/config", get(owner::owner_get_config))
        .route("/api/owner/logs", get(owner::owner_logs))
        .route("/api/owner/neon/status", get(owner::neon_status))
        .route("/api/owner/b2/status", get(owner::b2_status))
        // Profil views (TikTok-style)
        .route("/api/profile/{id}/view", post(owner::record_profile_view))
        .route("/api/profile/{id}/views", get(owner::profile_views))
        // Absensi
        .route("/api/attendance", post(owner::create_attendance))
        .route("/api/attendance", get(owner::list_attendance))
        .route("/api/attendance/admin", get(owner::admin_attendance_dashboard))
        // Gaji & insentif (dashboard absensi admin)
        .route("/api/salary/monthly", get(owner::salary_monthly))
        .route("/api/salary/incentive", post(owner::salary_add_incentive))
        .route("/api/salary/incentive/{id}", delete(owner::salary_delete_incentive))
        // Konfigurasi Neon aktif (owner)
        .route("/api/owner/neon/active", get(owner::neon_active_config))
        // Tes kirim email (owner)
        .route("/api/owner/mail/test", post(owner::mail_test))
        // AI Agent (Item 8)
        .route("/api/agent/config", put(handlers::agent_config))
        .route("/api/agent/chat", post(crate::tools::agent_chat))
        // AI Providers (multi-provider)
        .route("/api/agent/providers", get(ai_providers::list_providers))
        .route("/api/agent/providers", post(ai_providers::create_provider))
        .route("/api/agent/providers/fetch-models", post(ai_providers::fetch_models_route))
        .route("/api/agent/providers/{id}", put(ai_providers::update_provider))
        .route("/api/agent/providers/{id}", delete(ai_providers::delete_provider))
        // Companies
        .route("/api/companies", post(handlers::create_company))
        .route("/api/companies", get(handlers::get_companies))
        // Divisions
        .route("/api/divisions", post(handlers::create_division))
        .route("/api/divisions", get(handlers::get_divisions))
        // Members
        .route("/api/members", post(handlers::create_member))
        .route("/api/members", get(handlers::get_members))
        .route("/api/members/register", post(handlers::register_member))
        .route("/api/members/notify", post(handlers::notify_member))
        // Projects
        .route("/api/projects", get(handlers::get_projects))
        // Tools / Actions (AI Agent layer)
        .route("/api/tools", get(tools::list_tools))
        .route("/api/tools/execute", post(tools::execute_tool))
        // Web Push (notifikasi walau aplikasi tertutup)
        .route("/api/push/subscribe", post(push::push_subscribe))
        .route("/api/push/unsubscribe", post(push::push_unsubscribe))
        .route("/api/push/send", post(push::push_send))
        // Blob data pribadi terenkripsi (sinkronisasi lintas perangkat)
        .route("/api/sync/blob/{key}", get(push::blob_get))
        .route("/api/sync/blob/{key}", put(push::blob_put))
        // Admin (khusus OWNER)
        .route("/api/admin/users", get(handlers::admin_list_users))
        .route("/api/admin/users", post(handlers::admin_create_user))
        .route("/api/admin/users", put(handlers::admin_update_user))
        .route("/api/admin/users", delete(handlers::admin_delete_user))
        // Notifikasi in-app (owner/super_admin/admin kirim; semua user terima)
        .route("/api/notifications", get(handlers::list_notifications))
        .route("/api/notifications/read", post(handlers::read_notifications))
        .route("/api/notifications/send", post(handlers::send_notification))
        // Layer: batas body -> security headers -> CORS -> tracing
        .layer(RequestBodyLimitLayer::new(2 * 1024 * 1024))
        .layer(SetResponseHeaderLayer::overriding(
            axum::http::header::X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            axum::http::header::X_FRAME_OPTIONS,
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            axum::http::header::REFERRER_POLICY,
            HeaderValue::from_static("no-referrer"),
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // -- 5. Jalankan server --
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse()
        .unwrap();

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();
    println!("🚀 Luxio API running on http://localhost:{}", port);

    axum::serve(listener, app).await?;

    Ok(())
}