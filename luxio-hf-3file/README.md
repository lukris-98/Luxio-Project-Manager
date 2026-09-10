---
title: Luxio Backend
emoji: 🤖
colorFrom: blue
colorTo: yellow
sdk: docker
pinned: false
---

# Luxio Backend

Backend API Rust (Axum) untuk aplikasi **Luxio - Project and Target Manager**.

- **Source**: Auto-clone dari `https://github.com/lukris-98/Luxio-Project-Manager` (folder `backend/`)
- **Port**: 7860 (default HF Docker Space)
- **Frontend**: `https://luxio.edgeone.cool`
- **Build**: Auto-rebuild setiap kali Dockerfile berubah

## 🚀 Auto-Deploy dari GitHub

Space ini dikonfigurasi untuk **auto-pull** dari GitHub:
1. Push kode ke GitHub repository
2. Update `CACHE_BUST` value di Dockerfile (increment angka)
3. Commit & push Dockerfile ke Space ini
4. HF auto-rebuild → pull latest code → build backend baru

**Latest Update**: 2026-09-10 - Neon Organization Storage Feature (CACHE_BUST=26)

## 🔐 Environment Variables & Secrets

Set di **Settings → Variables and Secrets** pada HF Space:

### ✅ Required Variables

| Key | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | `postgres://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NEON_API_KEY` | **Organization API Key** (bukan Personal) | `napi_v528...` |
| `NEON_ORG_ID` | Organization ID di Neon | `org-curly-bonus-71722205` |
| `OWNER_EMAIL` | Email owner/super admin | `master@luxio.web.id` |
| `OWNER_PASSWORD` | Password owner | `strong-password-20+chars` |
| `ALLOWED_ORIGIN` | CORS allowed origins (comma separated) | `https://luxio.edgeone.cool,https://lukris-98-luxio-backend.hf.space` |
| `APP_URL` | Frontend URL (untuk email links) | `https://luxio.edgeone.cool` |

### 📧 Email Configuration (Optional)

| Key | Description | Example |
|---|---|---|
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username | `email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password (Gmail App Password) | `16-char-app-password` |
| `SMTP_FROM` | From email address | `"Luxio" <noreply@luxio.web.id>` |

### 🔑 OAuth & Integrations (Optional)

| Key | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (backend token validation) |
| `FIREBASE_WEB_API_KEY` | Firebase Web API Key |
| `HF_TOKEN` | Hugging Face API token (for HF features) |

### ⚙️ Advanced (Optional)

| Key | Default | Description |
|---|---|---|
| `PORT` | `7860` | Server port (already set in Dockerfile) |
| `RUST_LOG` | `info` | Log level (debug/info/warn/error) |

## 📝 Update Deployment

### Cara 1: Via Dockerfile (Recommended)
1. Push code ke GitHub
2. Edit `Dockerfile` di Space ini
3. Increment `ARG CACHE_BUST=26` → `27`
4. Commit changes di HF Space
5. Space akan auto-rebuild

### Cara 2: Via Factory Reset
1. Push code ke GitHub
2. Go to Space **Settings**
3. Click **Factory Reboot**
4. Wait for rebuild (~10-15 minutes)

## 🧪 Testing Backend

After deployment:
```bash
# Health check
curl https://lukris-98-luxio-backend.hf.space/health

# API version
curl https://lukris-98-luxio-backend.hf.space/api/version
```

## 🔧 Troubleshooting

### Build Failed
- Check Dockerfile syntax
- Verify GitHub repo is accessible (public)
- Check HF Space logs for Rust build errors

### Runtime Error: Database Connection
- Verify `DATABASE_URL` in Space secrets
- Check Neon database is not suspended
- Test connection string locally

### Runtime Error: Organization Storage
- Verify using **Organization API Key** (not Personal)
- Check `NEON_API_KEY` and `NEON_ORG_ID` are set
- Organization API Key must have org-level permissions

### CORS Error
- Verify `ALLOWED_ORIGIN` includes frontend URL
- Check no trailing slash in origins

## 📚 Documentation

- **Full Docs**: See repo `/backend/README.md`
- **API Endpoints**: See repo `/backend/src/routes/`
- **Neon Storage Feature**: See repo `/NEON_ORG_STORAGE_IMPLEMENTATION.md`

## 🔗 Links

- **GitHub**: https://github.com/lukris-98/Luxio-Project-Manager
- **Frontend**: https://luxio.edgeone.cool
- **Backend API**: https://lukris-98-luxio-backend.hf.space
