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
- Frontend: `https://luxio.edgeone.cool`

## Environment Variables & Secrets

Set di **Settings -> Variables and Secrets** pada HF Space:

| Key | Wajib | Contoh |
|---|---|---|
| `DATABASE_URL` | Ya | `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `OWNER_EMAIL` | Ya | `master@diarsipin.web.id` |
| `OWNER_PASSWORD` | Ya | `password-kuat` |
| `ALLOWED_ORIGIN` | Ya | `https://luxio.edgeone.cool,https://lukris-98-luxio-backend.hf.space` |
| `APP_URL` | Ya | `https://luxio.edgeone.cool` |
| `PORT` | Tidak | default 7860 (sudah di-set di Dockerfile) |
| `RUST_LOG` | Tidak | `info` |
| `SMTP_HOST` | Tidak | `smtp.gmail.com` |
| `SMTP_PORT` | Tidak | `587` |
| `SMTP_USERNAME` | Tidak | `email@gmail.com` |
| `SMTP_PASSWORD` | Tidak | `app-password` |
| `SMTP_FROM` | Tidak | `email@gmail.com` |
