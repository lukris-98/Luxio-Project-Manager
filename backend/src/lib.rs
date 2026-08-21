pub mod db;
pub mod handlers;
pub mod models;

use axum::{routing::{delete, get, post, put}, Router};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use std::sync::Arc;

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

    // -- 1. Konfigurasi dari environment --
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // -- 2. Konek ke database --
    let db = db::connect(&database_url).await?;
    println!("✅ Connected to Neon database");

    // -- 3. Pastikan tabel tersedia --
    db::migrate(&db).await?;
    println!("✅ Database tables ready");

    // -- 3b. Siapkan akun OWNER (pemilik website) --
    handlers::seed_owner(&db).await;

    // -- 3c. Selaraskan role semua akun dengan paketnya (auto-role) --
    handlers::normalize_user_roles(&db).await;

    // -- 4. Rakit state & router --
    let state = Arc::new(AppStateInner { db });

    let app = Router::new()
        .route("/health", get(handlers::health_check))
        // Auth
        .route("/api/auth/register", post(handlers::register))
        .route("/api/auth/login", post(handlers::login))
        .route("/api/auth/me", post(handlers::get_me))
        // Companies
        .route("/api/companies", post(handlers::create_company))
        .route("/api/companies", get(handlers::get_companies))
        // Divisions
        .route("/api/divisions", post(handlers::create_division))
        .route("/api/divisions", get(handlers::get_divisions))
        // Members
        .route("/api/members", post(handlers::create_member))
        .route("/api/members", get(handlers::get_members))
        // Projects
        .route("/api/projects", get(handlers::get_projects))
        // Admin (khusus OWNER)
        .route("/api/admin/users", get(handlers::admin_list_users))
        .route("/api/admin/users", post(handlers::admin_create_user))
        .route("/api/admin/users", put(handlers::admin_update_user))
        .route("/api/admin/users", delete(handlers::admin_delete_user))
        .layer(
            // Izinkan request lintas-origin (dev frontend :5173 -> backend :3000).
            // CATATAN: untuk produksi, ganti `permissive()` dengan daftar origin
            // spesifik, contoh: CorsLayer::new().allow_origin(["https://app.luxio.id"]).
            CorsLayer::permissive(),
        )
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
