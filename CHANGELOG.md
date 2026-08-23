# Changelog

Semua perubahan penting pada proyek **Luxio** dicatat di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [v1.0.0] — 2026-08-23

### 🎉 Rilis Pertama

Rilis awal Luxio — platform manajemen project, tim, absensi, dan gaji.

### ✨ Fitur Baru

#### Manajemen & Produktivitas
- Project & target management (proyek, target, progress, status)
- Kanban board & to-do list dengan tahapan berurutan (locked/unlocked)
- Kalender, task saya, catatan pribadi dengan **PIN**
- Wizard setup organisasi (perusahaan/sekolah/yayasan/komunitas)

#### Tim & Kolaborasi
- Divisi, tim, dan **6 level kewenangan** (owner → viewer)
- Form pendaftaran anggota lengkap (data pribadi + pekerjaan, ala lamaran kerja)
- **Chat antar akun** gaya BBM: kode user, pertemanan, DM
- Grup chat otomatis per divisi & per perusahaan
- Monitoring chat oleh admin/super_admin/owner (anti kebocoran data)

#### Keamanan
- Autentikasi **Argon2id** (password hashing kriptografis)
- **2FA** via kode email saat login
- **Verifikasi email** untuk aktivasi akun (link konfirmasi)
- **Rate limiting** (login/register/admin), CORS whitelist, body limit
- Session token (hanya hash disimpan), audit log, idempotency keys
- Input validation di backend; sanitasi XSS (DOMPurify) di frontend

#### AI Agent
- Halaman chat AI Agent (terminal-style)
- **Tool/action layer** (`tools.rs`) — agent tidak punya akses DB langsung
- 15+ tool resmi dengan schema, risk level, konfirmasi destruktif
- Konfigurasi provider AI (nama, base URL, API key, model) untuk owner

#### Absensi & Gaji
- Absen **masuk & pulang** dengan **kamera live / upload selfie**
- **GPS** + peta interaktif (Google Maps embed) — deteksi area kantor
- Dashboard absensi admin: rekap per tim, tandai BELUM CHECKIN/CHECKOUT
- **Kalkulasi gaji bulanan** (kehadiran + gaji pokok)
- **Insentif** per user + rincian gaji **cetak PDF**

#### Owner Dashboard
- Analytics (**Umami**) via share URL
- Monitoring database **Neon** (cek kuota via API)
- Storage **Backblaze B2** (status akun)
- Log aktivitas seluruh sistem (login/upload/logout)
- Info koneksi Neon aktif (dari `.env`)

#### Lainnya
- Pricing page dengan **trial 1 bulan** semua paket
- Profil views ala TikTok (jumlah & siapa yang melihat)
- Pencarian user global + profil publik lintas perusahaan
- PWA (installable, offline cache), responsive mobile/tablet
- `npm audit` = 0 vulnerabilities; `cargo check` bersih

### 🔒 Keamanan (dari `security-best-practices-vue-rust-neon.md`)

- Cloudflare sebagai perimeter (perlu setup infra)
- HTTPS/HSTS (perlu setup proxy)
- Argon2id, session token, RBAC, validasi input, parameterized SQL
- Rate limiting, secrets via env (tidak hardcode), dependency scanning

### 📄 Dokumentasi

- `ARCHITECTURE.md` — arsitektur sistem
- `SECURITY.md` — kebijakan keamanan
- `saran_pricing.md` — strategi pricing (research Notion/ERP)
- `ai-agent-security-architecture.md` — arsitektur tool/action AI Agent
- `rekomendasi_fitur.md` — rekomendasi fitur gratis vs berbayar

---

## Format

Perubahan dikelompokkan dengan format:

- **`[vX.Y.Z]`** — tanggal rilis
- **`Added`** — fitur baru
- **`Changed`** — perubahan/perubahan perilaku
- **`Deprecated`** — fitur yang mulai usang
- **`Removed`** — fitur yang dihapus
- **`Fixed`** — perbaikan bug
- **`Security`** — perbaikan kerentanan
