# Security Best Practices --- Vue + Rust + Neon + Cloudflare

## Tujuan

Dokumen ini menjadi checklist ringkas penerapan security untuk aplikasi
berbasis **Vue + Rust + Neon PostgreSQL + Cloudflare**, dengan target
aplikasi SaaS/Notion-like.

Prinsip utama:

> **Jangan percaya input dari browser. Semua security boundary harus
> ditegakkan di backend Rust.**

------------------------------------------------------------------------

## 1. Cloudflare sebagai perimeter

Gunakan Cloudflare untuk:

-   DNS
-   HTTPS/TLS
-   DDoS protection
-   WAF
-   Rate limiting
-   Security Rules
-   Bot protection bila diperlukan

**Catatan:** Cloudflare adalah lapisan perlindungan, bukan pengganti
security aplikasi.

------------------------------------------------------------------------

## 2. HTTPS wajib

Semua komunikasi production harus menggunakan HTTPS.

Alur:

`Browser → Cloudflare → Rust API`

Hindari API production melalui HTTP biasa.

Aktifkan HSTS setelah konfigurasi HTTPS benar.

------------------------------------------------------------------------

## 3. Authentication

Tentukan mekanisme login yang jelas, misalnya:

-   Google OAuth
-   Email + password
-   Session-based authentication

Untuk aplikasi web, session sensitif sebaiknya menggunakan cookie:

-   `HttpOnly`
-   `Secure`
-   `SameSite=Lax` atau `Strict` sesuai kebutuhan

Jangan menjadikan frontend sebagai sumber kebenaran identitas.

------------------------------------------------------------------------

## 4. Password security

Jika menggunakan password:

-   Hash dengan **Argon2id**
-   Jangan simpan plaintext password
-   Jangan menggunakan hash cepat seperti SHA-256 sebagai password
    hashing
-   Terapkan password reset yang aman
-   Jangan masukkan password ke log

------------------------------------------------------------------------

## 5. Authorization / RBAC

Authentication menjawab:

> Siapa user ini?

Authorization menjawab:

> Apa yang boleh dilakukan user ini?

Backend Rust wajib memeriksa:

-   user ID
-   workspace
-   role
-   permission
-   ownership resource

Contoh:

`User A tidak boleh membaca atau menghapus project User B hanya dengan mengganti ID di URL.`

------------------------------------------------------------------------

## 6. Validasi input

Validasi dilakukan minimal di dua tempat:

`Vue → Rust`

Vue melakukan validation untuk UX.

Rust melakukan validation untuk security.

Validasi meliputi:

-   tipe data
-   panjang input
-   format
-   enum
-   range
-   required fields
-   business rules

Jangan pernah menganggap validasi frontend cukup.

------------------------------------------------------------------------

## 7. SQL Injection protection

Gunakan:

-   parameterized query
-   query builder
-   ORM/query library yang mendukung binding

Hindari membangun SQL menggunakan concatenation dari input user.

------------------------------------------------------------------------

## 8. Rate limiting

Lindungi endpoint yang mudah disalahgunakan, terutama:

-   `/login`
-   `/register`
-   `/forgot-password`
-   upload
-   AI endpoint
-   endpoint bulk operation

Gunakan kombinasi:

`Cloudflare rate limiting + Rust/API rate limiting`

------------------------------------------------------------------------

## 9. Secrets management

Jangan commit secret ke Git.

Contoh secret:

-   `DATABASE_URL`
-   API key AI
-   OAuth client secret
-   session secret
-   Cloudflare secret
-   encryption key

Gunakan environment variables atau secret manager pada production.

Tambahkan file secret ke `.gitignore`.

------------------------------------------------------------------------

## 10. Database security

Arsitektur:

`Vue → Rust → Neon PostgreSQL`

Jangan expose credential Neon ke browser.

Praktik:

-   gunakan credential database dengan permission minimum
-   pisahkan development dan production
-   gunakan migration terkontrol
-   aktifkan backup/recovery sesuai kebutuhan
-   jangan memakai database superuser untuk operasi aplikasi normal

------------------------------------------------------------------------

## 11. File upload security

Jika aplikasi mendukung upload:

-   batasi ukuran file
-   validasi MIME type
-   validasi extension
-   validasi isi file
-   gunakan nama file yang aman
-   jangan percaya filename dari user
-   pertimbangkan antivirus/content scanning untuk kebutuhan berisiko
    tinggi

Untuk file besar, pertimbangkan object storage seperti Cloudflare R2.

Database menyimpan metadata, bukan seluruh file.

------------------------------------------------------------------------

## 12. XSS protection

Untuk konten user seperti:

-   notes
-   artikel
-   komentar
-   HTML/Markdown

jangan merender HTML mentah tanpa sanitasi.

Perhatikan penggunaan Vue `v-html`.

Gunakan sanitization untuk user-generated HTML dan terapkan Content
Security Policy bila sesuai.

------------------------------------------------------------------------

## 13. CSRF protection

Jika authentication menggunakan cookie, pertimbangkan CSRF protection.

Gunakan konfigurasi cookie yang tepat:

-   `HttpOnly`
-   `Secure`
-   `SameSite`

Untuk operasi sensitif, gunakan mekanisme CSRF token sesuai arsitektur
aplikasi.

------------------------------------------------------------------------

## 14. API key protection

API key provider AI/cloud harus berada di backend.

Aman:

`Vue → Rust → AI Provider`

Tidak aman jika secret API key provider ditanam di JavaScript frontend.

Rust menjadi gateway untuk operasi yang membutuhkan secret.

------------------------------------------------------------------------

## 15. Logging & audit

Buat logging untuk event penting:

-   login berhasil
-   login gagal
-   password berubah
-   permission berubah
-   project dibuat/dihapus
-   target dibuat/dihapus
-   API key dibuat
-   aktivitas agent

Jangan mencatat:

-   password
-   access token
-   API key
-   secret
-   data sensitif yang tidak diperlukan

Untuk aplikasi serius, sediakan audit log yang dapat ditelusuri.

------------------------------------------------------------------------

## 16. Dependency security

Pantau dependency Vue/Node dan Rust.

Contoh:

-   `npm audit`
-   `cargo audit`

Praktik:

-   update dependency secara berkala
-   hapus dependency tidak terpakai
-   review package sebelum memasangnya
-   jangan asal menerima rekomendasi dependency dari AI coding

------------------------------------------------------------------------

## 17. Security testing

Sebelum production, uji minimal:

-   SQL injection
-   XSS
-   CSRF
-   broken authorization
-   IDOR
-   brute-force login
-   rate limiting
-   file upload abuse
-   session expiration
-   CORS
-   API abuse
-   privilege escalation

Prioritaskan pengujian authorization karena bug permission dapat
membocorkan data user lain.

------------------------------------------------------------------------

## 18. Prinsip khusus untuk Vibe Coding

AI boleh membantu menulis kode, tetapi developer harus menentukan
security boundary.

Jangan menyerahkan mentah-mentah kepada AI:

1.  Authentication
2.  Authorization/RBAC
3.  Database permission
4.  Secret management
5.  File upload
6.  User-generated content
7.  Business-critical actions

Setiap kode hasil AI tetap harus direview dan dites.

------------------------------------------------------------------------

# Security baseline

Target minimum:

`Cloudflare` → `HTTPS` → `Vue` → `Rust API` → `Authentication` →
`Authorization` → `Validation` → `Rate limiting` → `Neon PostgreSQL`

Tambahkan:

`Secrets management + logging/audit + dependency scanning + security testing`

Dengan struktur ini, security tidak bergantung pada satu produk saja,
tetapi berlapis.
