use sqlx::{postgres::PgPoolOptions, PgPool};

// =====================================================================
// DATABASE LAYER
// =====================================================================
// Bertanggung jawab atas koneksi database (Postgres) dan skema tabel.
// Handler di handlers.rs memakai pool `PgPool` yang dihasilkan di sini.
// =====================================================================

/// Membuat pool koneksi ke database Postgres.
/// `database_url` biasanya diambil dari env `DATABASE_URL` (lihat .env.example).
pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
}

/// Migrasi sederhana: membuat semua tabel bila belum ada.
/// Catatan: ini skema awal untuk demo. Untuk produksi gunakan tool migrasi
/// seperti `sqlx-cli` / `refinery` agar perubahan skema bisa di-versi.
pub async fn migrate(db: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            company_id TEXT,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Migrasi bertahap: tambahkan kolom `plan` bila belum ada
    // (tabel lama dari build sebelumnya tidak punya kolom ini).
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'personal'",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            industry TEXT NOT NULL,
            size TEXT NOT NULL,
            owner_id TEXT NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS divisions (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL REFERENCES companies(id),
            name TEXT NOT NULL,
            head_id TEXT,
            member_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL REFERENCES companies(id),
            division_id TEXT NOT NULL REFERENCES divisions(id),
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL REFERENCES companies(id),
            division_id TEXT NOT NULL REFERENCES divisions(id),
            name TEXT NOT NULL,
            project_type TEXT NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            due_date TIMESTAMPTZ
        )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS stages (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id),
            name TEXT NOT NULL,
            order_num INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'locked',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS checklist_items (
            id TEXT PRIMARY KEY,
            stage_id TEXT NOT NULL REFERENCES stages(id),
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE
        )",
    )
    .execute(db)
    .await?;

    Ok(())
}
