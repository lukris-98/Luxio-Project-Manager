# DEPLOYMENT.md — Panduan Deploy Luxio

Luxio di-deploy ke dua platform:

| Bagian | Platform | Alat |
|--------|----------|------|
| **Frontend** (React SPA/PWA) | **EdgeOne Makers** (Tencent Cloud) | Console / Git integration |
| **Backend** (Rust API) | **Render** | `render` CLI / `render.yaml` |

---

## 1. Persiapan Local

### CLI yang sudah diinstall

```bash
# EdgeOne CLI (npm global) — untuk purge cache setelah deploy frontend
edgeone-cli --version        # v1.1.1

# Render CLI (Windows) — untuk deploy/kelola backend
render --help               # v2.24.0
```

Render CLI diinstall di `%LOCALAPPDATA%\Programs\render\render.exe` dan
sudah ditambahkan ke PATH user. Buka **terminal baru** setelah instalasi agar
PATH ter-refresh.

### Verifikasi build

```bash
# Frontend
cd app && npm run build        # hasil di app/dist/

# Backend
cd backend && cargo build --release   # hasil di backend/target/release/
```

---

## 2. Deploy Frontend → EdgeOne Makers

EdgeOne Makers adalah platform hosting frontend di atas infrastruktur
EdgeOne (global edge network). Ada 3 cara membuat project:

### Cara A — Import Git Repository (disarankan)

1. Login ke [EdgeOne Console](https://console.tencentcloud.com/edgeone).
2. Pilih **Makers** → **Create Project** → **Import Git Repository**.
3. Klik **Github** → **Authorize EO Makers** → pilih repo `Luxio-Project-Manager`.
4. Konfigurasi build:
   - **Root Directory**: `app`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Klik **Start Deployment**.
6. Setiap push ke `main` → EdgeOne otomatis build & deploy ulang.

### Cara B — Upload Langsung (tanpa Git)

1. Build dulu: `cd app && npm run build`.
2. Di console, buat project → **Upload directly**.
3. Drag & drop isi folder `app/dist/` (harus ada `index.html` di root).
4. Klik **Start Deployment**.

### Setelah deploy: purge cache (opsional)

```bash
# Inisialisasi config EdgeOne dulu (isi secretId/secretKey dari console)
edgeone-cli config init

# Bersihkan cache domain
edgeone-cli purge -a
```

> **Catatan**: `edgeone-cli` adalah tool manajemen cache EdgeOne. Pembuatan
> project Makers dilakukan lewat console (Git integration / upload), bukan CLI.

### Custom domain

Setelah preview benar, tambahkan custom domain di **Domain Management**.
Jika region Indonesia dipilih, mungkin diperlukan **ICP filing** untuk domain
kustom — pastikan `ALLOWED_ORIGIN` di backend berisi domain tersebut.

---

## 3. Deploy Backend → Render

Render mendukung deploy Rust secara native. Ada dua cara:

### Cara A — Render Blueprint (`render.yaml`) — disarankan

File `render.yaml` sudah disiapkan di root repo:

```yaml
services:
  - type: web
    name: luxio-backend
    runtime: rust
    repo: https://github.com/lukris-98/Luxio-Project-Manager
    buildCommand: cargo build --release
    startCommand: ./target/release/luxio-server
    healthCheckPath: /health
    envVars: { ... }
```

1. Di [Render Dashboard](https://dashboard.render.com), pilih **New** → **Blueprint**.
2. Hubungkan repo GitHub.
3. Render membaca `render.yaml`, buat service, lalu build.
4. Isi env vars yang `sync: false` (dipertanyakan saat setup):
   - `DATABASE_URL` — koneksi Neon PostgreSQL
   - `OWNER_EMAIL` & `OWNER_PASSWORD` — akun owner
   - `ALLOWED_ORIGIN` — URL frontend (EdgeOne Makers), contoh `https://xxx.edgeone.app`
   - `APP_URL` — URL frontend untuk link konfirmasi email
   - `SMTP_*` — konfigurasi email (kosongkan bila tidak pakai)
5. Deploy otomatis saat push ke `main`.

### Cara B — Manual dengan Render CLI

```bash
# 1. Login (buka browser untuk authorize)
render login

# 2. Pilih workspace
render workspace set

# 3. Buat service web dari repo
render services create web --repo https://github.com/lukris-98/Luxio-Project-Manager \
  --envPath / --buildCommand "cargo build --release" \
  --startCommand "./target/release/luxio-server" \
  --healthCheckPath /health

# 4. Trigger deploy ulang
render deploys create <SERVICE_ID> --wait
```

### Environment Variables (backend)

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | ✅ | Koneksi Postgres (Neon) |
| `PORT` | ❌ | Default 3000 |
| `OWNER_EMAIL` | ✅ | Email akun owner |
| `OWNER_PASSWORD` | ✅ | Password akun owner (kuat!) |
| `ALLOWED_ORIGIN` | ✅ | Origin frontend (koma untuk banyak) |
| `APP_URL` | ✅ | URL frontend untuk link email |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM` | ❌ | Email (welcome, 2FA, konfirmasi) |
| `RUST_LOG` | ❌ | Level log (default `info`) |

---

## 4. Setelah Deploy — Checklist

- [ ] `GET https://<backend>.onrender.com/health` → `OK`
- [ ] Frontend bisa login/register (backend terhubung)
- [ ] CORS: `ALLOWED_ORIGIN` berisi domain frontend
- [ ] Email terkirim (2FA & konfirmasi) bila SMTP diisi
- [ ] Akun OWNER dibuat otomatis saat server start
- [ ] Cloudflare / HTTPS aktif di depan (opsional, disarankan)

---

## 5. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Frontend 404 setelah upload | Pastikan ada `index.html` di root folder yang di-upload |
| Backend build gagal | Cek `cargo build --release` lokal dulu; pastikan versi Rust ≥ 1.70 |
| Login 401 terus | Token sesi valid 7 hari; pastikan `DATABASE_URL` sama dgn yang dipakai |
| Email tidak terkirim | Cek `SMTP_*`; untuk Gmail pakai **App Password**, bukan password biasa |
| CORS error di browser | Tambahkan domain frontend ke `ALLOWED_ORIGIN` di Render env |
