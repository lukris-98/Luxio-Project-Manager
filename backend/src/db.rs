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

    // Kolom verifikasi email (aktivasi akun). `email_verified=false` artinya
    // akun belum aktif dan harus konfirmasi lewat email.
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE",
    )
    .execute(db)
    .await?;
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT",
    )
    .execute(db)
    .await?;
    sqlx::query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ",
    )
    .execute(db)
    .await?;
    // Migrasi data lama: akun yang dibuat sebelum fitur verifikasi email
    // (tanpa verification_token) dianggap sudah terverifikasi, agar tidak
    // terkunci. Akun baru selalu punya token sampai klik konfirmasi.
    sqlx::query(
        "UPDATE users SET email_verified = TRUE WHERE verification_token IS NULL AND email_verified = FALSE",
    )
    .execute(db)
    .await?;

    // Kolom profil lengkap user (Item 2: Settings profil). Ditambah bertahap
    // agar tabel lama tetap kompatibel.
    for (column, sql_type) in [
        ("phone", "TEXT NOT NULL DEFAULT ''"),
        ("gender", "TEXT NOT NULL DEFAULT ''"),
        ("address", "TEXT NOT NULL DEFAULT ''"),
        ("position", "TEXT NOT NULL DEFAULT ''"),
        ("join_date", "TEXT NOT NULL DEFAULT ''"),
        ("employment_status", "TEXT NOT NULL DEFAULT ''"),
        ("birth_date", "TEXT NOT NULL DEFAULT ''"),
        ("education", "TEXT NOT NULL DEFAULT ''"),
        ("salary", "TEXT NOT NULL DEFAULT ''"),
        // Counter edit profil bulanan (Item 2): 3x/user & 10x/admin per bulan.
        ("edit_count", "INTEGER NOT NULL DEFAULT 0"),
        ("edit_count_month", "TEXT NOT NULL DEFAULT ''"),
        ("admin_edit_count", "INTEGER NOT NULL DEFAULT 0"),
        ("admin_edit_month", "TEXT NOT NULL DEFAULT ''"),
        // Kode pertemanan (Item 5: friend system via user code).
        ("user_code", "TEXT"),
        // username unik (pengganti kode LUX sebagai identitas publik).
        ("username", "TEXT"),
        // AI Agent (Item 8): penyedia & API key milik owner.
        ("ai_provider", "TEXT NOT NULL DEFAULT ''"),
        ("ai_key", "TEXT NOT NULL DEFAULT ''"),
        ("ai_base_url", "TEXT NOT NULL DEFAULT ''"),
        ("ai_model", "TEXT NOT NULL DEFAULT ''"),
        ("ai_enabled", "BOOLEAN NOT NULL DEFAULT FALSE"),
        // Status upgrade (Item 4): tipe organisasi saat upgrade.
        ("org_type", "TEXT NOT NULL DEFAULT ''"),
        ("upgraded_at", "TIMESTAMPTZ"),
        // PIN akun (khusus owner): hash SHA256, dipakai login owner tanpa 2FA.
        ("pin_hash", "TEXT NOT NULL DEFAULT ''"),
        // Google ID untuk OAuth login (Google Sign-In).
        ("google_id", "TEXT"),
    ] {
        sqlx::query(&format!("ALTER TABLE users ADD COLUMN IF NOT EXISTS {column} {sql_type}"))
            .execute(db)
            .await?;
    }

    // Isi user_code unik (kode pertemanan) untuk akun yang belum punya.
    sqlx::query(
        "UPDATE users SET user_code = 'LUX' || id WHERE user_code IS NULL",
    )
    .execute(db)
    .await?;

    // Isi username unik untuk akun yang belum punya (backfill dari user_code
    // agar tidak ada NULL). Username dipakai sebagai identitas publik pengganti
    // kode LUX di pencarian anggota/user.
    sqlx::query(
        "UPDATE users SET username = user_code WHERE username IS NULL AND user_code IS NOT NULL",
    )
    .execute(db)
    .await?;

    // Pastikan username unik: ada kemungkinan user_code lama duplikat secara
    // teori, maka cukup tambahkan suffix angka bagi yang bentrok.
    sqlx::query(
        "UPDATE users u
         SET username = username || '-' || SUBSTRING(id FROM 1 FOR 6)
         WHERE username IN (
             SELECT username
             FROM users
             WHERE id != u.id
               AND username IS NOT NULL
             GROUP BY username
             HAVING COUNT(*) > 1
         )",
    )
    .execute(db)
    .await?;

    sqlx::query(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username)",
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

    // Penyedia AI multi (per user): OpenAI-compatible, OpenAI Responses,
    // Anthropic Messages. Setiap user (owner/super_admin) bisa punya banyak.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS ai_providers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider_id TEXT NOT NULL DEFAULT '',
            display_name TEXT NOT NULL DEFAULT '',
            api_type TEXT NOT NULL DEFAULT 'openai-compatible',
            base_url TEXT NOT NULL DEFAULT '',
            api_key TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL DEFAULT '',
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            is_active BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Hanya satu provider aktif per user.
    sqlx::query(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_providers_one_active ON ai_providers(user_id) WHERE is_active = TRUE",
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

    // Kolom tambahan anggota (form pendaftaran lengkap ala lamaran kerja).
    // Ditambah bertahap agar tabel lama tetap kompatibel.
    for (column, sql_type) in [
        ("position", "TEXT NOT NULL DEFAULT ''"),
        ("phone", "TEXT NOT NULL DEFAULT ''"),
        ("gender", "TEXT NOT NULL DEFAULT ''"),
        ("birth_date", "TEXT NOT NULL DEFAULT ''"),
        ("address", "TEXT NOT NULL DEFAULT ''"),
        ("employment_status", "TEXT NOT NULL DEFAULT ''"),
        ("join_date", "TEXT NOT NULL DEFAULT ''"),
        ("salary", "TEXT NOT NULL DEFAULT ''"),
        ("skills", "TEXT NOT NULL DEFAULT ''"),
        ("education", "TEXT NOT NULL DEFAULT ''"),
        ("notes", "TEXT NOT NULL DEFAULT ''"),
        ("authority", "TEXT NOT NULL DEFAULT 'member'"),
    ] {
        sqlx::query(&format!("ALTER TABLE members ADD COLUMN IF NOT EXISTS {column} {sql_type}"))
            .execute(db)
            .await?;
    }

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

    // Tabel sesi login. Hanya hash token (SHA-256) yang disimpan — token
    // mentah tidak pernah masuk database (lihat handlers::create_session).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
        )",
    )
    .execute(db)
    .await?;

    // Audit log untuk aksi penting (user maupun AI Agent). Mencatat siapa
    // pelaku, tool/aksi apa, resource target, dan hasilnya. Lihat
    // ai-agent-security-architecture.md S16.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            actor_type TEXT NOT NULL DEFAULT 'user',
            user_id TEXT NOT NULL REFERENCES users(id),
            tool_name TEXT,
            action TEXT,
            target_resource TEXT,
            result TEXT NOT NULL,
            detail TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Kunci idempotensi untuk aksi yang bisa terulang (S17). Mencegah
    // duplikasi saat request yang sama dikirim dua kali (mis. agent retry).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS idempotency_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            idempotency_key TEXT NOT NULL,
            tool_name TEXT NOT NULL,
            response JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, idempotency_key)
        )",
    )
    .execute(db)
    .await?;

    // Kode 2FA (one-time password) untuk login. Hanya hash-nya yang
    // disimpan; kode mentah dikirim via email.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS login_otps (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            otp_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // =====================================================================
    // CHAT SYSTEM (Item 5 — gaya BBM/WhatsApp)
    // =====================================================================

    // Grup chat: divisi/tim otomatis + grup perusahaan. `kind`: 'company' |
    // 'division' | 'team' | 'custom'.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chat_groups (
            id TEXT PRIMARY KEY,
            company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'custom',
            owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
            ref_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Percakapan 1-1 antar pengguna (DM). `user_a < user_b` agar unik.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL DEFAULT 'dm',
            group_id TEXT REFERENCES chat_groups(id) ON DELETE CASCADE,
            user_a TEXT REFERENCES users(id) ON DELETE CASCADE,
            user_b TEXT REFERENCES users(id) ON DELETE CASCADE,
            company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (kind, group_id),
            UNIQUE (kind, user_a, user_b)
        )",
    )
    .execute(db)
    .await?;

    // Pesan dalam sebuah percakapan.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            body TEXT NOT NULL,
            is_system BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Pembaca pesan (read receipts).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS message_reads (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (message_id, user_id)
        )",
    )
    .execute(db)
    .await?;

    // Kontak pertemanan (friend system via user code).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            contact_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, contact_user_id)
        )",
    )
    .execute(db)
    .await?;

    // Keanggotaan grup chat (untuk grup custom/division).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chat_group_members (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (group_id, user_id)
        )",
    )
    .execute(db)
    .await?;

    // Konfigurasi owner: Umami analytics, Neon DB monitoring, Backblaze B2.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS owner_config (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Riwayat tampilan profil (TikTok-style: jumlah & siapa yang melihat).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS profile_views (
            id TEXT PRIMARY KEY,
            profile_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            viewer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (profile_user_id, viewer_user_id, created_at)
        )",
    )
    .execute(db)
    .await?;

    // Absensi masuk kerja (selfie + GPS + lokasi kantor).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
            type TEXT NOT NULL DEFAULT 'checkin',
            photo_url TEXT NOT NULL DEFAULT '',
            latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
            longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
            distance_m DOUBLE PRECISION NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'present',
            note TEXT NOT NULL DEFAULT '',
            team_id TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Insentif/bonus bulanan per user (dipakai kalkulasi gaji di dashboard absensi).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS salary_incentives (
            id TEXT PRIMARY KEY,
            company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            month TEXT NOT NULL DEFAULT '',
            amount DOUBLE PRECISION NOT NULL DEFAULT 0,
            reason TEXT NOT NULL DEFAULT '',
            created_by TEXT REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Notifikasi in-app antar pengguna. Satu baris per penerima agar bisa
    // ditandai dibaca per-user. `sender_id` = pengirim; `recipient_id` =
    // penerima. `kind` = 'deadline' | 'create' | 'info' (untuk ikon bell).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            body TEXT NOT NULL DEFAULT '',
            kind TEXT NOT NULL DEFAULT 'info',
            read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Subskripsi Web Push (notifikasi walau aplikasi tertutup).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL DEFAULT '',
            auth TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Blob data pribadi terenkripsi untuk sinkronisasi lintas perangkat.
    // `blob_key` mis. 'private-notes', 'vault', 'sync-all'. Isi sudah
    // dienkripsi AES-GCM di sisi klien, server hanya menyimpan string.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS user_data_blobs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            blob_key TEXT NOT NULL,
            payload TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, blob_key)
        )",
    )
    .execute(db)
    .await?;

    // =====================================================================
    // PROFIL SOSIAL (TikTok-style): unggah foto profil, like, komentar, share.
    // =====================================================================

    // Postingan foto di profil user. `image_url` = URL gambar (bisa URL
    // gambar di internet / data URI); server hanya menyimpan URL.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS profile_posts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            caption TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Like pada sebuah post. Satu user hanya bisa like satu kali per post.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS profile_post_likes (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(post_id, user_id)
        )",
    )
    .execute(db)
    .await?;

    // Komentar pada sebuah post.
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS profile_post_comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            body TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    // Share pada sebuah post (dari akun ke akun lain).
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS profile_post_shares (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES profile_posts(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )",
    )
    .execute(db)
    .await?;

    Ok(())
}
