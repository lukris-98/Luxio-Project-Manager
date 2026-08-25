use lettre::{
    message::Mailbox,
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

// =====================================================================
// MAIL MODULE — Kirim email (welcome, notifikasi, 2FA).
// =====================================================================
// Dua mode pengiriman:
//
// 1) SMTP (default) — konfigurasi lewat environment (lihat .env.example):
//      SMTP_HOST       contoh: smtp.gmail.com
//      SMTP_PORT       contoh: 587 (STARTTLS) atau 465 (TLS langsung)
//      SMTP_USERNAME   akun pengirim (untuk Gmail: email lengkap)
//      SMTP_PASSWORD   app password (Gmail: App Password 16 karakter)
//      SMTP_FROM       alamat pengirim yang tampil di email
//
// 2) Resend API (HTTP) — untuk platform yang memblokir port SMTP
//    (mis. Hugging Face Spaces hanya mengizinkan outbound 80/443):
//      MAIL_PROVIDER   = "resend"
//      RESEND_API_KEY  = re_xxxxxxxxxxxx (dari https://resend.com)
//      SMTP_FROM       alamat pengirim (terverifikasi di Resend)
//
// Prioritas: bila MAIL_PROVIDER=resend & RESEND_API_KEY terisi → pakai
// Resend; jika tidak → fallback SMTP. Bila keduanya kosong, pengiriman
// dilewati (log warning) — aplikasi tetap berjalan.
// =====================================================================

struct MailConfig {
    host: String,
    port: u16,
    username: String,
    password: String,
    from: String,
}

/// True bila email dikonfigurasi (Resend API atau SMTP).
pub fn is_configured() -> bool {
    let resend_key = std::env::var("RESEND_API_KEY").unwrap_or_default();
    if std::env::var("MAIL_PROVIDER").unwrap_or_default() == "resend" && !resend_key.is_empty() {
        return true;
    }
    let host = std::env::var("SMTP_HOST").unwrap_or_default();
    !host.is_empty()
}

/// URL depan aplikasi (untuk link konfirmasi email). Dapat dari `APP_URL`,
/// fallback ke localhost dev.
pub fn app_url() -> String {
    std::env::var("APP_URL").unwrap_or_else(|_| "http://localhost:5173".to_string())
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

/// Kirim email via Resend HTTP API (port 443 — aman di HF Spaces).
async fn send_via_resend(to: &str, subject: &str, body: &str) -> Result<(), String> {
    let api_key = std::env::var("RESEND_API_KEY").unwrap_or_default();
    let from = std::env::var("SMTP_FROM").unwrap_or_default();
    if api_key.is_empty() || from.is_empty() {
        return Err("RESEND_API_KEY atau SMTP_FROM kosong".to_string());
    }

    let client = reqwest::Client::new();
    let payload = serde_json::json!({
        "from": from,
        "to": [to],
        "subject": subject,
        "text": body,
    });

    let resp = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Resend request gagal: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .unwrap_or_else(|_| "no body".to_string());

    if status.is_success() {
        Ok(())
    } else {
        Err(format!("Resend HTTP {status}: {text}"))
    }
}

/// Kirim email sederhana. Mengembalikan `Ok(false)` bila email tidak
/// dikonfigurasi (bukan error — aplikasi tetap jalan). `Ok(true)` sukses.
pub async fn send(to: &str, subject: &str, body: &str) -> Result<bool, String> {
    // Mode Resend (HTTP) — prioritas.
    if std::env::var("MAIL_PROVIDER").unwrap_or_default() == "resend" {
        let api_key = std::env::var("RESEND_API_KEY").unwrap_or_default();
        if !api_key.is_empty() {
            match send_via_resend(to, subject, body).await {
                Ok(()) => {
                    tracing::info!(event = "mail_sent", to = %to, subject = %subject, "email terkirim via Resend");
                    return Ok(true);
                }
                Err(e) => {
                    tracing::error!(event = "mail_send_error", to = %to, error = %e, "Resend gagal: {}", e);
                    return Err(e);
                }
            }
        }
    }

    // Mode SMTP.
    let cfg = match config() {
        Some(c) => c,
        None => {
            tracing::warn!(event = "mail_skipped", to = %to, "Email tidak dikonfigurasi, tidak dikirim");
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

    mailer.send(email).await.map_err(|e| {
        tracing::error!(event = "mail_send_error", to = %to, error = %e, "Gagal mengirim email: {}", e);
        format!("Gagal mengirim email: {e}")
    })?;
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

/// Email konfirmasi aktivasi akun. Wajib diklik sebelum akun bisa login.
/// `credentials` opsional: `(email_login, password)` — dipakai saat akun
/// dibuat oleh admin (pendaftar perlu tahu kredensialnya).
pub async fn send_confirmation(
    to: &str,
    name: &str,
    token: &str,
    credentials: Option<(&str, &str)>,
) -> Result<bool, String> {
    let link = format!("{}/?token={}", app_url(), token);
    let subject = "Konfirmasi Akun Luxio";
    let cred_line = match credentials {
        Some((email, password)) => format!(
            "\n\nKredensial login kamu:\n\
             Email: {email}\n\
             Password: {password}\n\
             Segera ganti password setelah login pertama."
        ),
        None => String::new(),
    };
    let body = format!(
        "Halo {name},\n\n\
         Terima kasih sudah mendaftar di Luxio.{cred_line}\n\n\
         Untuk mengaktifkan akun kamu, klik tautan berikut:\n\
         {link}\n\n\
         Tautan berlaku 24 jam. Jika kamu tidak merasa mendaftar, abaikan email ini.\n\n\
         Tim Luxio"
    );
    send(to, subject, &body).await
}

/// Email berisi kode 2FA untuk login.
pub async fn send_login_otp(to: &str, name: &str, code: &str) -> Result<bool, String> {
    let subject = "Kode Masuk Luxio (2FA)";
    let body = format!(
        "Halo {name},\n\n\
         Kode verifikasi kamu adalah:\n\n\
         {code}\n\n\
         Masukkan kode tersebut di aplikasi Luxio untuk melanjutkan login.\n\
         Kode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.\n\n\
         Tim Luxio"
    );
    send(to, subject, &body).await
}
