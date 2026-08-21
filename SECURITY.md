# SECURITY.md — Kebijakan & Baseline Keamanan Luxio

Dokumen ini adalah ringkasan implementasi keamanan aplikasi **Luxio**
(Vue/React + Rust + Neon PostgreSQL + Cloudflare). Referensi lengkap ada di
[`security-best-practices-vue-rust-neon.md`](./security-best-practices-vue-rust-neon.md).

## Prinsip

> **Jangan percaya input dari browser. Semua security boundary ditegakkan di backend Rust.**

## Baseline yang sudah diterapkan

| Lapisan | Status | Keterangan |
|---------|--------|------------|
| HTTPS/TLS | Produksi | Diperkuat Cloudflare (DNS + TLS + DDoS + WAF + rate limit) |
| HSTS | Produksi | Aktifkan di Cloudflare/proxy (`Strict-Transport-Security`) |
| Password hashing | ✅ | **Argon2id** (kriptografis, salted). Hash lama `DefaultHasher` di-upgrade otomatis saat login |
| Session auth | ✅ | Token acak 128-bit (UUID v4), hanya **SHA-256 hash** yang disimpan di DB (`sessions`), kedaluwarsa 7 hari |
| Authorization | ✅ | Identitas dari token (`Authorization: Bearer`), **bukan** dari body/query user_id (cegah IDOR). Akses resource diperiksa kepemilikan (`check_company_access`) |
| Validasi input | ✅ | Email, panjang password (8–128), panjang nama; backend wajib (frontend hanya untuk UX) |
| SQL injection | ✅ | Semua query memakai parameter binding (`$1`, `$2`, …) |
| Rate limiting | ✅ | In-memory per-key: login (10/10 menit), register (5/10 menit), admin (30–60/menit) + layer Cloudflare |
| CORS | ✅ | `ALLOWED_ORIGIN` di env (whitelist), bukan `permissive()` |
| Secrets management | ✅ | `.env` di `.gitignore`; kredensial OWNER via `OWNER_EMAIL`/`OWNER_PASSWORD` env (tidak hardcode) |
| Body size limit | ✅ | 2 MB (`RequestBodyLimitLayer`) |
| Security headers | ✅ | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` di semua response |
| XSS | ✅ | Konten user (catatan) disanitasi dengan **DOMPurify** sebelum dirender |
| CSRF | N/A | Auth via Bearer token (bukan cookie), sehingga tidak rentan CSRF klasik |
| File upload | N/A | Belum ada fitur upload |
| Dependency scanning | Terjadwal | `npm audit` (frontend) & `cargo audit` (backend) |
| Logging/audit | Sebagian | `tracing` untuk login/register/delete user; jangan log password/token/API key |

## Aturan untuk developer

1. **Jangan hardcode secret** (password, API key, `DATABASE_URL`, token).
   Semua lewat environment variable.
2. **Jangan percaya `user_id`/`actor_id` dari client** — identitas selalu
   berasal dari session token backend.
3. **Hash password wajib Argon2id** via `handlers::hash_password`.
   Jangan pernah menambah hash baru dengan `DefaultHasher`.
4. **Jangan render HTML user tanpa sanitasi** — pakai DOMPurify
   (`sanitizeHtml` di `PrivateNote.jsx`).
5. Endpoint yang menyentuh data user wajib ada pengecekan kepemilikan
   (contoh: `check_company_access`).
6. Sebelum produksi, uji: SQL injection, XSS, CSRF, broken authorization,
   IDOR, brute-force login, rate limiting, session expiration, CORS.
   Prioritaskan uji **authorization** — bug permission bisa membocorkan
   data user lain.

## Env variables backend

```bash
DATABASE_URL=           # wajib
ALLOWED_ORIGIN=         # daftar origin dipisah koma
OWNER_EMAIL=            # wajib untuk produksi
OWNER_PASSWORD=         # wajib untuk produksi (min. 16 karakter kuat)
OWNER_NAME=
PORT=                   # default 3000
```

## Pelaporan kerentanan

Hubungi pemilik project (lihat README) — jangan pamerkan kerentanan
di issue publik sebelum diperbaiki.
