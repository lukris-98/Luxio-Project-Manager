use lettre::{
    message::Mailbox,
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

// =====================================================================
// MAIL MODULE — Kirim email (welcome, notifikasi) via SMTP.
// =====================================================================
// Konfigurasi lewat environment (lihat .env.example):
//   SMTP_HOST       contoh: smtp.gmail.com
//   SMTP_PORT       contoh: 587 (STARTTLS) atau 465 (TLS langsung)
//   SMTP_USERNAME   akun pengirim (untuk Gmail: email lengkap)
//   SMTP_PASSWORD   app password (Gmail: App Password 16 karakter)
//   SMTP_FROM       alamat pengirim yang tampil di email
//
// Bila SMTP_HOST kosong, pengiriman dilewati (log warning) — aplikasi
// tetap berjalan tanpa email (mis. saat development).
// =====================================================================

struct MailConfig {
    host: String,
    port: u16,
    username: String,
    password: String,
    from: String,
}

fn config() -> Option<MailConfig> {
    let host = std::env::var("SMTP_HOST").unwrap_or_default();
    if host.is_empty() {
        return None;
    }
    let port = std::env::var("SMTP_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(587);
    let username = std::env::var("SMTP_USERNAME").unwrap_or_default();
    let password = std::env::var("SMTP_PASSWORD").unwrap_or_default();
    let from = std::env::var("SMTP_FROM").unwrap_or_else(|_| username.clone());
    Some(MailConfig { host, port, username, password, from })
}

/// Kirim email sederhana. Mengembalikan `Ok(false)` bila SMTP tidak
/// dikonfigurasi (bukan error — aplikasi tetap jalan). `Ok(true)` sukses.
pub async fn send(to: &str, subject: &str, body: &str) -> Result<bool, String> {
    let cfg = match config() {
        Some(c) => c,
        None => {
            tracing::warn!(event = "mail_skipped", to = %to, "SMTP tidak dikonfigurasi, email tidak dikirim");
            return Ok(false);
        }
    };

    let from_mailbox: Mailbox = cfg.from.parse().map_err(|e| format!("From tidak valid: {e}"))?;
    let to_mailbox: Mailbox = to.parse().map_err(|e| format!("To tidak valid: {e}"))?;

    let email = Message::builder()
        .from(from_mailbox)
        .to(to_mailbox)
        .subject(subject)
        .body(body.to_string())
        .map_err(|e| format!("Gagal menyusun email: {e}"))?;

    let creds = Credentials::new(cfg.username.clone(), cfg.password.clone());

    // Port 465 => TLS langsung (relay); lainnya => STARTTLS.
    let mailer: AsyncSmtpTransport<Tokio1Executor> = if cfg.port == 465 {
        AsyncSmtpTransport::<Tokio1Executor>::relay(&cfg.host)
            .map_err(|e| format!("Gagal init TLS relay: {e}"))?
            .port(cfg.port)
            .credentials(creds)
            .build()
    } else {
        AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&cfg.host)
            .map_err(|e| format!("Gagal init STARTTLS relay: {e}"))?
            .port(cfg.port)
            .credentials(creds)
            .build()
    };

    mailer.send(email).await.map_err(|e| format!("Gagal mengirim email: {e}"))?;
    tracing::info!(event = "mail_sent", to = %to, subject = %subject, "email terkirim");
    Ok(true)
}

/// Email sambutan untuk anggota baru berisi kredensial login.
pub async fn send_welcome(to: &str, name: &str, email: &str, password: &str) -> Result<bool, String> {
    let subject = "Selamat bergabung dengan Luxio!";
    let body = format!(
        "Halo {name},\n\n\
         Akun Luxio kamu sudah dibuat oleh admin.\n\n\
         Email login: {email}\n\
         Password: {password}\n\n\
         Silakan login di aplikasi Luxio. Segera ganti password kamu setelah login pertama.\n\n\
         Tim Luxio"
    );
    send(to, subject, &body).await
}

/// Email notifikasi umum dari admin.
pub async fn send_notification(to: &str, subject: &str, body: &str) -> Result<bool, String> {
    send(to, subject, body).await
}
