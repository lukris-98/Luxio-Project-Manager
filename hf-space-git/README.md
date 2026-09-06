---
title: Luxio Backend
emoji: 🤖
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
---

# Luxio Backend

Backend API Rust (Axum) untuk aplikasi **Luxio - Project and Target Manager**.

- Source: di-clone otomatis dari `https://github.com/lukris-98/Luxio-Project-Manager` (folder `backend/`)
- Port: 7860 (default HF Docker)
- Frontend: `https://luxio.web.id` (Firebase Hosting)

## Alur Deploy — GitHub untuk Versioning, Dockerfile untuk Rebuild

1. **Push ke GitHub** — commit perubahan backend ke repo
   `lukris-98/Luxio-Project-Manager`, lalu buat tag versi:

   ```bash
   git tag v1.0.6
   git push origin master v1.0.6
   ```

   Setiap tag bisa diunduh dari **GitHub → Releases/Tags** (arsip zip/tar.gz),
   jadi ada jejak versi untuk rollback kapan pun.

2. **Edit Dockerfile di Space HF** — ubah baris pin versi:

   ```dockerfile
   ARG RELEASE=v1.0.6
   ```

   Menyimpan file ini otomatis memicu **rebuild** di HF Spaces: source di-clone
   dari tag yang dipin, di-build ulang, dan Space restart dengan binary baru.
   Biarkan `RELEASE=master` bila ingin selalu mengambil commit terbaru.

3. **Rollback** = kembalikan `ARG RELEASE=` ke tag lama (mis. `v1.0.5`) → rebuild.

## Environment Variables & Secrets

Set di **Settings -> Variables and Secrets** pada HF Space:

| Key | Wajib | Contoh |
|---|---|---|
| `DATABASE_URL` | Ya | `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `OWNER_EMAIL` | Ya | `master@luxio.web.id` |
| `OWNER_PASSWORD` | Ya | `password-kuat` |
| `ALLOWED_ORIGIN` | Ya | `https://luxio.web.id,https://luxio-id.web.app` |
| `APP_URL` | Ya | `https://luxio.web.id` |
| `PORT` | Tidak | default 7860 (sudah di-set di Dockerfile) |
| `RUST_LOG` | Tidak | `info` |
| `SMTP_HOST` | Tidak | `smtp.gmail.com` |
| `SMTP_PORT` | Tidak | `587` |
| `SMTP_USERNAME` | Tidak | `email@gmail.com` |
| `SMTP_PASSWORD` | Tidak | `app-password` |
| `SMTP_FROM` | Tidak | `"Master Luxio" <noreply@luxio.web.id>` |

> Ganti `ALLOWED_ORIGIN`/`APP_URL` setelah edit → jalankan **Manual restart**
> atau edit ulang Dockerfile agar Space membaca nilai baru.

## Verifikasi Setelah Rebuild

```bash
curl https://<space-anda>.hf.space/health   # → OK
```
