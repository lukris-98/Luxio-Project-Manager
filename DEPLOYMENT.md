# DEPLOYMENT.md — Panduan Deploy Luxio (GRATIS, tanpa GitHub)

> **Urutan: backend dulu** (dapat URL, mis. `https://luxio-backend.onrender.com`),
> lalu frontend.

| Bagian | Platform | Biaya | Koneksi Repo |
|--------|----------|-------|--------------|
| **Backend** (Rust API) | **Render** → Web Service (manual) | **$0/bulan** (Free tier: 512MB RAM, 0.1 CPU, tidur setelah 15 menit) | **Docker image** (tanpa GitHub/GitLab) |
| **Frontend** (React SPA/PWA) | **EdgeOne Makers** | **Gratis** (Free plan) | **Upload langsung** folder `dist/` (tanpa Git) |

---

# 🦀 BAGIAN 1 — Backend ke Render (GRATIS + tanpa GitHub)

## Kenapa bukan Blueprint?

Render **Blueprint** (`render.yaml`) memang butuh workspace **berbayar** (Starter $7/bulan).
Solusi gratis: buat **Web Service manual** dengan **Docker image** — gratis, tidak perlu
konek GitHub/GitLab.

## Persiapan

### 1. Akun Docker Hub (gratis)

Buat akun di **https://hub.docker.com** — gratis. Catat username Docker Hub Anda.

### 2. Install Docker Desktop

- Download: **https://www.docker.com/products/docker-desktop/**
- Install & jalankan Docker Desktop.
- Login: `docker login` → masukkan username & password Docker Hub.

### 3. Build image backend di lokal

```bash
# Dari root folder proyek (bukan dari backend/)
docker build -f Dockerfile -t <username>/luxio-backend:latest .
```

Ganti `<username>` dengan username Docker Hub Anda.
Proses build pertama ~10 menit (kompilasi Rust dalam container). Build berikutnya cepat.

### 4. Push ke Docker Hub

```bash
docker push <username>/luxio-backend:latest
```

## Deploy ke Render (Free tier)

1. Buka **https://dashboard.render.com** → daftar (bisa pakai Google/GitHub).
2. Klik **New** → **Web Service**.
3. Pilih tab **Existing Image** (bukan Git).
4. Isi **Image URL**: `<username>/luxio-backend:latest` (ganti username Anda).
5. Pengaturan:
   - **Name**: `luxio-backend`
   - **Region**: pilih yang terdekat (mis. Frankfurt atau Singapore)
   - **Instance Type**: **Free** ($0/month, otomatis tidur setelah 15 menit idle)
6. Tab **Advanced** → **Environment Variables** → tambahkan:

   | Variable | Contoh nilai | Wajib? |
   |----------|--------------|--------|
   | `DATABASE_URL` | `postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/luxio?sslmode=require` | ✅ Wajib |
   | `PORT` | `3000` | ✅ Wajib (Render memberi nilai, default sudah 3000) |
   | `OWNER_EMAIL` | `master@diarsipin.web.id` | ✅ Wajib |
   | `OWNER_PASSWORD` | `password-kuat-min-20-karakter` | ✅ Wajib |
   | `ALLOWED_ORIGIN` | `https://luxio-xxx.edgeone.app` | ⚠️ Isi setelah deploy frontend |
   | `APP_URL` | `https://luxio-xxx.edgeone.app` | ⚠️ Isi setelah deploy frontend |
   | `SMTP_HOST` | `smtp.gmail.com` | ❌ Optional |
   | `SMTP_PORT` | `587` | ❌ Optional |
   | `SMTP_USERNAME` | `email@gmail.com` | ❌ Optional |
   | `SMTP_PASSWORD` | `app-password-16-karakter` | ❌ Optional |
   | `SMTP_FROM` | `email@gmail.com` | ❌ Optional |
   | `RUST_LOG` | `info` | ❌ Optional |

7. Klik **Create Web Service**.
8. Render menarik image dari Docker Hub, lalu menjalankan container.
   Butuh ~1-2 menit. Setelah berjalan, tampil URL: **`https://luxio-backend.onrender.com`**.

### Verifikasi

```bash
# Cek health
curl https://luxio-backend.onrender.com/health
# → harusnya "OK"
```

### Update image ke versi baru

Setiap kali ada perubahan di `backend/`:

```bash
docker build -f Dockerfile -t <username>/luxio-backend:latest .
docker push <username>/luxio-backend:latest
```

Render otomatis mendeteksi image baru? **Tidak**. Anda harus ke Dashboard Render →
pilih service → **Manual Deploy** → **Pull & Deploy from Docker Registry** → pilih
image dengan tag `latest`. Atau gunakan tag unik (`:v1.0.1`) dan ubah URL image di
service settings.

---

# 🚀 BAGIAN 2 — Frontend ke EdgeOne Makers (GRATIS)

EdgeOne Makers adalah platform hosting statis dari Tencent Cloud.
**Tidak perlu GitHub** — pakai **upload langsung** folder hasil build.

## Langkah-langkah

### 1. Build frontend

```bash
cd app
npm install
npm run build
```

Hasil ada di folder **`app/dist/`**.

### 2. Buat project Makers (Upload langsung)

1. Buka **https://console.tencentcloud.com/edgeone** → pilih tab **Makers**.
2. Klik **Create Project** → pilih **Upload directly**.
3. Isi **Project Name**: mis. `luxio-frontend`.
4. Pilih **Region**: **Asia Tenggara** (Indonesia, tanpa ICP filing).
5. **Drag & drop seluruh isi folder `app/dist/`** ke area upload.
   > **Penting**: jangan drag folder `dist`-nya — drag isinya (termasuk `index.html`).
6. Klik **Start Deployment**.

Deploy selesai dalam beberapa detik. Anda dapat **preview link**,
mis. `https://luxio-xxx.edgeone.app`.

### 3. Setel `VITE_API_URL` (lingkungan build)

Agar frontend tahu alamat backend, sebelum build set:

```bash
cd app
echo "VITE_API_URL=https://luxio-backend.onrender.com" > .env.production
npm run build
```

Lalu upload ulang isi `dist/` ke Makers (drag & drop lagi — timpa yang lama).

> Atau: jika memakai template/git di Makers, set `VITE_API_URL` di **Build Env Vars**
> console Makers.

### 4. Balik ke Render — isi ALLOWED_ORIGIN & APP_URL

Di Dashboard Render → `luxio-backend` → **Environment** → edit:
- `ALLOWED_ORIGIN` = `https://luxio-xxx.edgeone.app`
- `APP_URL` = `https://luxio-xxx.edgeone.app`

Lalu **Manual Deploy** → **Pull & Deploy from Docker Registry** (terapkan perubahan env).

---

# ✅ Checklist Final

- [ ] `curl https://luxio-backend.onrender.com/health` → `OK`
- [ ] Buka URL EdgeOne Makers → halaman login muncul
- [ ] Daftar akun baru → cek email → klik konfirmasi → login
- [ ] Login → isi kode 2FA dari email → masuk dashboard
- [ ] `ALLOWED_ORIGIN` sudah berisi URL frontend → tidak error CORS
- [ ] Akun OWNER (`OWNER_EMAIL`) bisa login → menu Pemantauan muncul

---

# ⚡ Tips Hemat

| Fitur | Biaya | Alternatif |
|-------|-------|------------|
| Render Free Web Service | **$0/bulan** | 0.1 CPU, 512MB RAM, sleep 15 menit idle |
| Neon Database (serverless) | **$0/bulan** | 0.5GB storage, 190 compute jam |
| EdgeOne Makers Free | **Gratis** | 1GB storage, 50GB bandwidth |
| Docker Hub (free account) | **$0/bulan** | 1 private image, unlimited public |

> **Catatan tentang Render Free tier**: service akan **tidur** setelah 15 menit tidak
> ada request. Saat ada request masuk, service bangun kembali dalam ~10 detik.
> Cocok untuk demo/test — tidak recommended untuk production real-time.