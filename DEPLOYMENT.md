# DEPLOYMENT.md — Tutorial Deploy Luxio

> **Urutan yang benar:**
> 1. Deploy **backend** ke Render dulu (biar dapat URL API, mis. `https://luxio-backend.onrender.com`)
> 2. Deploy **frontend** ke EdgeOne Makers (isi `VITE_API_URL` dengan URL backend)
> 3. Tes login & integrasi

| Bagian | Platform | Cara |
|--------|----------|------|
| **Backend** (Rust API) | **Render** | Blueprint (`render.yaml`) atau manual via Dashboard |
| **Frontend** (React SPA/PWA) | **EdgeOne Makers** | Console (Git integration / upload) + `edgeone-cli` untuk purge cache |

---

# BAGIAN 1 — Deploy Backend ke Render 🦀

## Persiapan (sekali saja)

### 1.1 Buat akun & CLI login

```bash
# 1. Daftar di https://dashboard.render.com (pakai GitHub login, gratis)

# 2. Login CLI (buka browser untuk authorize)
render login
# → browser terbuka → klik "Authorize CLI" → kembali ke terminal

# 3. Pilih workspace
render workspace set
```

> Render CLI berada di `%LOCALAPPDATA%\Programs\render\render.exe`.
> Jika `render` tidak dikenali, buka **terminal baru** atau jalankan path lengkap.

### 1.2 Siapkan database Neon (sudah punya)

Catat `DATABASE_URL` dari Neon console. Contoh:
```
postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/luxio?sslmode=require
```

---

## Cara A — Deploy via Render Blueprint (disarankan)

`render.yaml` sudah tersedia di root repo (dengan `rootDir: backend`).

### Langkah 1: Hubungkan repo

1. Buka **https://dashboard.render.com**.
2. Klik tombol **New** (pojok kanan atas) → pilih **Blueprint**.
3. Klik **Connect a repository** → pilih `lukris-98/Luxio-Project-Manager`.
4. Render membaca `render.yaml` dan menampilkan preview service `luxio-backend`.

### Langkah 2: Isi environment variables

Klik service `luxio-backend` → tab **Environment**. Isi variabel yang
bertanda `sync: false` (Render akan bertanya saat Blueprint pertama dibuat,
atau isi manual di tab Environment):

| Variable | Contoh nilai | Keterangan |
|----------|--------------|------------|
| `DATABASE_URL` | `postgresql://...neon.tech/luxio?sslmode=require` | Koneksi Neon **wajib** |
| `OWNER_EMAIL` | `master@luxio.web.id` | Email akun owner |
| `OWNER_PASSWORD` | `password-kuat-20-karakter` | Password owner |
| `ALLOWED_ORIGIN` | `https://xxx.edgeone.app` | URL frontend (isi setelah deploy frontend) |
| `APP_URL` | `https://xxx.edgeone.app` | URL frontend untuk link email |
| `SMTP_HOST` | `smtp.gmail.com` | Kosongkan bila tak pakai email |
| `SMTP_PORT` | `587` | |
| `SMTP_USERNAME` | `email@gmail.com` | |
| `SMTP_PASSWORD` | `app-password-16-karakter` | |
| `SMTP_FROM` | `email@gmail.com` | |

> `PORT` sudah otomatis 3000. `RUST_LOG=info` sudah ter-set.

### Langkah 3: Deploy

1. Klik **Apply** (atau **Create Resources**).
2. Render akan build `cargo build --release` (butuh beberapa menit pertama,
   membangun semua dependensi Rust).
3. Setelah selesai, URL service tampil, mis. **`https://luxio-backend.onrender.com`**.

### Langkah 4: Verifikasi

```bash
# Cek health
curl https://luxio-backend.onrender.com/health
# → OK

# Cek di CLI
render services
```

> Deploy otomatis: setiap push ke `main` → Render build & deploy ulang.

---

## Cara B — Deploy Manual via Dashboard (tanpa render.yaml)

1. Dashboard Render → **New** → **Web Service**.
2. Hubungkan repo `Luxio-Project-Manager`.
3. Pengaturan:
   - **Name**: `luxio-backend`
   - **Runtime**: `Rust` (pilih dari dropdown — Render mendukung Rust native)
   - **Root Directory**: `backend`
   - **Build Command**: `cargo build --release`
   - **Start Command**: `./target/release/luxio-server`
   - **Health Check Path**: `/health`
4. Tab **Advanced** → tambahkan env vars seperti tabel di atas.
5. Klik **Create Web Service** → tunggu build selesai.

---

## Cara C — Deploy via Render CLI (non-interaktif)

```bash
# Login dulu (sekali saja)
render login
render workspace set

# Buat service dari blueprint
render blueprints apply "render.yaml"

# Atau trigger deploy ulang ke service tertentu
render deploys create <SERVICE_ID> --wait
```

---

# BAGIAN 2 — Deploy Frontend ke EdgeOne Makers 🚀

> **Penting**: `edgeone-cli` BUKAN untuk membuat/deploy project Makers.
> Pembuatan & deploy project dilakukan di **console EdgeOne** (via Git
> integration atau upload file). `edgeone-cli` dipakai untuk **purge cache**
> setelah deploy.

## Persiapan (sekali saja)

### 2.1 Buat akun EdgeOne & init CLI

```bash
# 1. Daftar / login di https://console.tencentcloud.com/edgeone

# 2. Dapatkan SecretId & SecretKey:
#    Console → kanan atas avatar → API Keys → Create API Key
#    (catat SecretId & SecretKey)

# 3. Init config edgeone-cli (isikan secretId, secretKey, zone)
edgeone-cli config init
```

---

## Cara A — Deploy via Git Integration (disarankan, auto-deploy)

### Langkah 1: Build frontend lokal (untuk memastikan tidak error)

```bash
cd app
npm install
npm run build        # hasil di app/dist/
```

### Langkah 2: Buat project Makers dari Git

1. Buka **https://console.tencentcloud.com/edgeone** → pilih tab **Makers**.
2. Klik **Create Project** → pilih **Import Git Repository**.
3. Klik **Github** → **Authorize EO Makers** → pilih repo `Luxio-Project-Manager` → **Install**.
4. Pengaturan build:
   - **Root Directory**: `app`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Region**: pilih sesuai target (mis. Asia Tenggara)
5. Klik **Start Deployment**.

> Setelah ini, setiap push ke `main` → EdgeOne build & deploy otomatis.

### Langkah 3: Salin URL preview

Deploy selesai → dapat **preview link**, mis. `https://luxio-xxx.edgeone.app`.
Gunakan URL ini untuk mengisi `ALLOWED_ORIGIN` & `APP_URL` di Render backend.

---

## Cara B — Deploy via Upload Langsung (tanpa Git)

1. Build dulu:
   ```bash
   cd app && npm run build
   ```
2. Console EdgeOne → Makers → **Create Project** → **Upload directly**.
3. Beri nama project & pilih region.
4. **Drag & drop seluruh isi folder `app/dist/`** ke area upload
   (harus ada `index.html` di root — jangan upload folder `dist` itu sendiri).
5. Klik **Start Deployment**.

> Catatan: project yang dibuat via upload **tidak bisa** dihubungkan ke Git
> di kemudian hari. Gunakan Git integration bila ingin auto-deploy.

---

## Setelah deploy: Purge cache dengan edgeone-cli

EdgeOne menyimpan cache edge. Setelah deploy versi baru, bersihkan cache:

```bash
# Bersihkan SEMUA cache zone
edgeone-cli purge -a

# Bersihkan cache URL tertentu
edgeone-cli purge -u https://luxio-xxx.edgeone.app

# Pre-warm (panaskan) beberapa URL
edgeone-cli prefetch https://luxio-xxx.edgeone.app/
```

Cek riwayat purge:
```bash
edgeone-cli history
```

---

# BAGIAN 3 — Integrasi Frontend + Backend

Setelah keduanya live:

1. **Backend**: catat URL, mis. `https://luxio-backend.onrender.com`
2. **Frontend**: pastikan saat build, `VITE_API_URL` menunjuk ke backend.

   Di EdgeOne, tambahkan env var build di console:
   - **VITE_API_URL**: `https://luxio-backend.onrender.com`
   - atau buat file `app/.env.production` sebelum build:
     ```env
     VITE_API_URL=https://luxio-backend.onrender.com
     ```
3. **Render**: pastikan `ALLOWED_ORIGIN` & `APP_URL` berisi URL frontend EdgeOne.
4. **Neon**: pastikan `DATABASE_URL` di Render sama dengan Neon (bisa beda database
   untuk production vs development).

---

# Checklist Final

- [ ] `GET https://luxio-backend.onrender.com/health` → `OK`
- [ ] Frontend EdgeOne bisa login/register
- [ ] `ALLOWED_ORIGIN` = URL frontend (tidak error CORS)
- [ ] Email 2FA & konfirmasi terkirim (bila SMTP diisi)
- [ ] Akun OWNER dibuat otomatis saat server start
- [ ] Chat, absensi, gaji, AI Agent berfungsi dari frontend production
