---
title: Luxio Backend
emoji: robot
colorFrom: blue
colorTo: cyan
sdk: docker
pinned: false
---

# Luxio Backend

Backend API Rust (Axum) untuk aplikasi **Luxio - Project and Target Manager**.

Dipakai bersama frontend yang di-hosting di EdgeOne Makers:
**`https://luxio.edgeone.cool`**

## Environment Variables (set di Settings -> Variables and Secrets)

| Key | Wajib | Contoh |
|---|---|---|
| `DATABASE_URL` | Ya | `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `OWNER_EMAIL` | Ya | `master@diarsipin.web.id` |
| `OWNER_PASSWORD` | Ya | `password-kuat` |
| `ALLOWED_ORIGIN` | Ya | `https://luxio.edgeone.cool,https://lukris-98-luxio.hf.space` |
| `APP_URL` | Ya | `https://luxio.edgeone.cool` |
| `PORT` | Tidak | default 7860 (sudah di-set di Dockerfile) |
| `SMTP_HOST` | Tidak | `smtp.gmail.com` |
| `SMTP_PORT` | Tidak | `587` |
| `SMTP_USERNAME` | Tidak | `email@gmail.com` |
| `SMTP_PASSWORD` | Tidak | `app-password` |
| `SMTP_FROM` | Tidak | `email@gmail.com` |
| `RUST_LOG` | Tidak | `info` |
