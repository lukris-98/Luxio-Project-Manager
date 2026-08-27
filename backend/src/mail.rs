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
//      SMTP_FROM       "Master Luxio" <noreply@luxio.diarsipin.web.id>
//
// 2) Resend API (HTTP) — untuk platform yang memblokir port SMTP
//    (mis. Hugging Face Spaces hanya mengizinkan outbound 80/443):
//      MAIL_PROVIDER   = "resend"
//      RESEND_API_KEY  = re_xxxxxxxxxxxx (dari https://resend.com)
//      SMTP_FROM       "Master Luxio" <noreply@luxio.diarsipin.web.id>
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

// =====================================================================
// HTML EMAIL TEMPLATE ENGINE
// =====================================================================

/// Bangun HTML email dengan template Luxio yang elegan.
/// `title` = judul email (subject), `body_html` = konten utama (boleh HTML),
/// `cta` = opsional tombol CTA { url, label }.
fn html_template(title: &str, body_html: &str, cta: Option<(&str, &str)>) -> String {
    let app_url = crate::mail::app_url();
    let banner_url = "https://raw.githubusercontent.com/lukris-98/Luxio-Project-Manager/master/app/public/luxio-banner.png";
    let logo_url = "https://raw.githubusercontent.com/lukris-98/Luxio-Project-Manager/master/app/public/luxio.png";
    let cta_html = match cta {
        Some((url, label)) => format!(
            r#"<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px auto;">
              <tr>
                <td align="center" style="border-radius:8px;background:linear-gradient(135deg,#6C63FF,#A855F7);padding:14px 36px;">
                  <a href="{url}" target="_blank" style="color:#fff;font-size:16px;font-weight:700;text-decoration:none;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                    {label} →
                  </a>
                </td>
              </tr>
            </table>"#
        ),
        None => String::new(),
    };

    format!(
        r##"<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0C0C0E;-webkit-font-smoothing:antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color:#0C0C0E;">
    <tr>
      <td align="center" style="padding:32px 16px 8px;">
        <a href="{app_url}" target="_blank" style="text-decoration:none;">
          <img src="{banner_url}" alt="Luxio" width="320" height="auto" style="display:block;border:0;outline:none;border-radius:12px;" />
        </a>
        <img src="{logo_url}" alt="Luxio" width="96" height="auto" style="display:block;border:0;outline:none;margin:16px auto 0;" />
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 40px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%%;background:#1C1C1E;border-radius:16px;border:1px solid #2C2C2E;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:22px;font-weight:700;color:#F1F1F3;letter-spacing:-0.3px;">
                {title}
              </h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#A1A1A6;">
                {body_html}
              </div>
              {cta_html}
              <hr style="border:none;border-top:1px solid #2C2C2E;margin:24px 0 16px;" />
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#636366;line-height:1.5;">
                Jika kamu tidak merasa melakukan tindakan ini, abaikan email ini.<br />
                &copy; 2026 Luxio Project Manager. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"##
    )
}

fn body_html_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\n', "<br />")
}

// =====================================================================
// KIRIM EMAIL
// =====================================================================

/// Kirim email via Resend HTTP API (port 443 — aman di HF Spaces).
async fn send_via_resend(to: &str, subject: &str, html_body: &str, text_body: &str) -> Result<(), String> {
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
        "html": html_body,
        "text": text_body,
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
            match send_via_resend(to, subject, body, body).await {
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

// =====================================================================
// EMAIL TYPES
// =====================================================================

/// Kirim plain text langsung (fallback) atau HTML via Resend.
async fn send_html(to: &str, subject: &str, html: &str, text: &str) -> Result<bool, String> {
    if std::env::var("MAIL_PROVIDER").unwrap_or_default() == "resend" {
        let api_key = std::env::var("RESEND_API_KEY").unwrap_or_default();
        if !api_key.is_empty() {
            match send_via_resend(to, subject, html, text).await {
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
    send(to, subject, text).await
}

/// Email sambutan untuk anggota baru berisi kredensial login.
pub async fn send_welcome(to: &str, name: &str, email: &str, password: &str) -> Result<bool, String> {
    let subject = "Selamat bergabung dengan Luxio!";
    let text = format!(
        "Halo {name},\n\n\
         Akun Luxio kamu sudah dibuat oleh admin.\n\n\
         Email login: {email}\n\
         Password: {password}\n\n\
         Silakan login di aplikasi Luxio. Segera ganti password kamu setelah login pertama.\n\n\
         Tim Luxio"
    );
    let html = html_template(
        subject,
        &format!(
            "<p>Halo <strong>{name}</strong>,</p>\
             <p>Akun Luxio kamu sudah dibuat oleh admin. Berikut kredensial login kamu:</p>\
             <table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#2C2C2E;border-radius:8px;padding:16px;margin:16px 0;\">\
             <tr><td style=\"font-size:13px;color:#A1A1A6;padding:4px 0;\">Email</td></tr>\
             <tr><td style=\"font-size:15px;font-weight:600;color:#F1F1F3;padding:0 0 8px;\">{email}</td></tr>\
             <tr><td style=\"font-size:13px;color:#A1A1A6;padding:4px 0;\">Password</td></tr>\
             <tr><td style=\"font-size:15px;font-weight:600;color:#F1F1F3;padding:0 0 8px;\">{password}</td></tr>\
             </table>\
             <p style=\"font-size:13px;color:#A1A1A6;\">Segera ganti password kamu setelah login pertama.</p>",
            name = body_html_escape(name),
            email = body_html_escape(email),
            password = body_html_escape(password),
        ),
        Some((&format!("{}/", crate::mail::app_url()), "Login ke Luxio")),
    );
    send_html(to, subject, &html, &text).await
}

/// Email notifikasi umum dari admin.
pub async fn send_notification(to: &str, subject: &str, body: &str) -> Result<bool, String> {
    let text = format!("[Luxio] {subject}\n\n{body}\n\n— Tim Luxio");
    let html = html_template(
        subject,
        &format!("<p>{}</p>", body_html_escape(body)),
        None,
    );
    send_html(to, subject, &html, &text).await
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
    let link = format!("{}/?token={}", crate::mail::app_url(), token);
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
    let text = format!(
        "Halo {name},\n\n\
         Terima kasih sudah mendaftar di Luxio.{cred_line}\n\n\
         Untuk mengaktifkan akun kamu, klik tautan berikut:\n\
         {link}\n\n\
         Tautan berlaku 24 jam. Jika kamu tidak merasa mendaftar, abaikan email ini.\n\n\
         Tim Luxio"
    );
    let cred_html = match credentials {
        Some((email, password)) => format!(
            "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#2C2C2E;border-radius:8px;padding:16px;margin:16px 0;\">\
             <tr><td style=\"font-size:13px;color:#A1A1A6;padding:4px 0;\">Email</td></tr>\
             <tr><td style=\"font-size:15px;font-weight:600;color:#F1F1F3;padding:0 0 8px;\">{email}</td></tr>\
             <tr><td style=\"font-size:13px;color:#A1A1A6;padding:4px 0;\">Password</td></tr>\
             <tr><td style=\"font-size:15px;font-weight:600;color:#F1F1F3;padding:0 0 8px;\">{password}</td></tr>\
             </table>\
             <p style=\"font-size:13px;color:#A1A1A6;\">Segera ganti password setelah login pertama.</p>",
            email = body_html_escape(email),
            password = body_html_escape(password),
        ),
        None => String::new(),
    };
    let html = html_template(
        subject,
        &format!(
            "<p>Halo <strong>{name}</strong>,</p>\
             <p>Terima kasih sudah mendaftar di Luxio. Klik tombol di bawah untuk mengaktifkan akun kamu:</p>\
             {cred_html}\
             <p style=\"font-size:13px;color:#A1A1A6;\">Tautan berlaku 24 jam. Jika kamu tidak merasa mendaftar, abaikan email ini.</p>",
            name = body_html_escape(name),
        ),
        Some((&link, "Konfirmasi Akun")),
    );
    send_html(to, subject, &html, &text).await
}

/// Email berisi kode 2FA untuk login.
pub async fn send_login_otp(to: &str, name: &str, code: &str) -> Result<bool, String> {
    let subject = "Kode Masuk Luxio (2FA)";
    let text = format!(
        "Halo {name},\n\n\
         Kode verifikasi kamu adalah:\n\n\
         {code}\n\n\
         Masukkan kode tersebut di aplikasi Luxio untuk melanjutkan login.\n\
         Kode berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.\n\n\
         Tim Luxio"
    );
    let html = html_template(
        subject,
        &format!(
            "<p>Halo <strong>{name}</strong>,</p>\
             <p>Gunakan kode berikut untuk melanjutkan login ke akun Luxio kamu:</p>\
             <div style=\"text-align:center;margin:24px 0;\">\
               <span style=\"display:inline-block;background:#2C2C2E;border:1px solid #3C3C3E;border-radius:12px;padding:16px 32px;font-size:32px;font-weight:800;letter-spacing:8px;color:#F1F1F3;font-family:monospace;\">{code}</span>\
             </div>\
             <p>Kode berlaku <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>\
             <p style=\"font-size:13px;color:#A1A1A6;\">Tidak merasa login? Abaikan email ini.</p>",
            name = body_html_escape(name),
            code = code,
        ),
        None,
    );
    send_html(to, subject, &html, &text).await
}