# 🚀 Hugging Face Space Deployment Guide

## Overview

Luxio Backend di-deploy di Hugging Face Spaces menggunakan Docker SDK dengan **auto-pull dari GitHub**.

- **HF Space**: https://huggingface.co/spaces/lukris-98/luxio-backend
- **GitHub Repo**: https://github.com/lukris-98/Luxio-Project-Manager
- **Frontend**: https://luxio.edgeone.cool

## 📁 File Structure HF Space

HF Space **HANYA** berisi 3 file:
```
luxio-backend/ (HF Space root)
├── Dockerfile       # Auto-pull & build dari GitHub
├── README.md        # Space documentation
└── .gitignore       # Git ignore file
```

Source code **TIDAK** ada di HF Space — di-clone otomatis dari GitHub saat build!

## 🔄 Auto-Deploy Workflow

### Architecture
```
GitHub Repo (master)
    ↓
    | Push code
    ↓
GitHub: lukris-98/Luxio-Project-Manager/backend/
    ↓
    | HF Dockerfile: git clone
    ↓
HF Space Build Container
    ↓
    | cargo build --release
    ↓
HF Space Runtime (Port 7860)
```

### Deployment Process

#### 1️⃣ Push Code ke GitHub
```bash
cd /path/to/Luxio-Project-Manager

# Make your changes in backend/
git add backend/
git commit -m "feat: your feature description"
git push origin master
```

#### 2️⃣ Trigger HF Space Rebuild

**Opsi A: Update CACHE_BUST (Recommended)**
```bash
# Clone HF Space
git clone https://huggingface.co/spaces/lukris-98/luxio-backend
cd luxio-backend

# Edit Dockerfile - increment CACHE_BUST
# ARG CACHE_BUST=26  →  ARG CACHE_BUST=27

git add Dockerfile
git commit -m "chore: trigger rebuild for latest GitHub code"
git push
```

**Opsi B: Factory Reboot**
1. Go to https://huggingface.co/spaces/lukris-98/luxio-backend/settings
2. Scroll to bottom → **Factory Reboot**
3. Wait 10-15 minutes for rebuild

**Opsi C: Via HF CLI**
```bash
huggingface-cli space restart lukris-98/luxio-backend
```

## 🔐 Environment Variables Setup

### Via HF Web Interface

1. Go to Space **Settings**
2. Click **Variables and Secrets**
3. Add variables (berikut yang WAJIB):

```env
DATABASE_URL=postgres://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require

NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205

OWNER_EMAIL=master@luxio.web.id
OWNER_PASSWORD=@Lukris1998

ALLOWED_ORIGIN=https://luxio.edgeone.cool,https://lukris-98-luxio-backend.hf.space
APP_URL=https://luxio.edgeone.cool

SMTP_FROM=Luxio <noreply@luxio.web.id>
GOOGLE_CLIENT_ID=11562744719-5kv4tq3ig22gbo32l96a9r4iq7n4pk2n.apps.googleusercontent.com
FIREBASE_WEB_API_KEY=AIzaSyAtVPfadMgHbm0_CKTGwINUiYJJLl4RjBw
```

### Via HF CLI (Alternative)

```bash
huggingface-cli space set-env lukris-98/luxio-backend \
  DATABASE_URL="postgres://..." \
  NEON_API_KEY="napi_..." \
  NEON_ORG_ID="org-curly-bonus-71722205"
```

## 📋 Pre-Deployment Checklist

- [ ] Code tested locally
- [ ] Backend builds successfully (`cargo build --release`)
- [ ] Database migrations applied (if any)
- [ ] Environment variables documented
- [ ] `.env.example` updated with new vars
- [ ] Commit messages descriptive
- [ ] Pushed to GitHub master branch

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://lukris-98-luxio-backend.hf.space/health

# Expected: {"status":"ok","version":"1.x.x"}
```

### 2. Database Connection
```bash
curl https://lukris-98-luxio-backend.hf.space/api/version

# Expected: {"version":"1.x.x","db_connected":true}
```

### 3. Neon API Integration
Login ke frontend → Penyimpanan → Database → Storage Org
- Should display organization storage data
- No error "Gagal memuat data storage"

### 4. Frontend Integration
Open https://luxio.edgeone.cool
- Login works
- API calls successful (check Network tab)
- No CORS errors

## 🔧 Troubleshooting

### Build Failed

**Symptom**: HF Space shows build error
**Check**:
1. View build logs in HF Space
2. Verify GitHub repo accessible
3. Check Dockerfile syntax
4. Verify Rust dependencies in `Cargo.toml`

**Solution**:
```bash
# Test build locally
cd backend
cargo build --release

# If succeeds locally but fails on HF, try Factory Reboot
```

### Runtime Error: Database

**Symptom**: Backend starts but API returns 500 errors
**Check**:
1. `DATABASE_URL` in HF Space secrets
2. Neon database not suspended
3. Connection string has `sslmode=require`

**Solution**:
- Test connection string locally
- Check Neon Console for database status
- Verify pooler endpoint (not direct)

### Runtime Error: Neon Storage

**Symptom**: Storage tab shows "Gagal memuat data storage organisasi"
**Check**:
1. `NEON_API_KEY` is Organization API Key (not Personal)
2. `NEON_ORG_ID` correct
3. API key has org-level permissions

**Solution**:
- Create new Organization API Key at console.neon.tech
- Update `NEON_API_KEY` in HF Space secrets
- Restart Space

### CORS Error

**Symptom**: Frontend shows CORS error in console
**Check**:
1. `ALLOWED_ORIGIN` includes frontend URL
2. No trailing slash in origins
3. Protocol matches (https://)

**Solution**:
```bash
# Update ALLOWED_ORIGIN in HF Space
ALLOWED_ORIGIN=https://luxio.edgeone.cool,https://lukris-98-luxio-backend.hf.space
```

### Space Stuck/Frozen

**Solution**:
1. Go to Settings → Factory Reboot
2. Wait 15 minutes for fresh build
3. If still stuck, contact HF support

## 📊 Monitoring

### View Logs
```bash
# Via HF CLI
huggingface-cli space logs lukris-98/luxio-backend

# Via Web
https://huggingface.co/spaces/lukris-98/luxio-backend/logs
```

### Check Status
```bash
# Via HF API
curl https://huggingface.co/api/spaces/lukris-98/luxio-backend
```

### Metrics
- View CPU/Memory usage in HF Space dashboard
- Backend should use ~100-500MB RAM
- Build time: ~10-15 minutes

## 🔄 Rollback

### To Previous Commit

```bash
# Clone HF Space
git clone https://huggingface.co/spaces/lukris-98/luxio-backend
cd luxio-backend

# Edit Dockerfile - revert CACHE_BUST to previous value
# Or change branch: --branch v1.0.5

git add Dockerfile
git commit -m "rollback: revert to stable version"
git push
```

### To Tagged Release

Edit `Dockerfile`:
```dockerfile
# Change from:
RUN git clone --depth 1 --branch master https://github.com/...

# To:
RUN git clone --depth 1 --branch v1.0.5 https://github.com/...
```

## 🎯 Best Practices

### 1. Semantic Versioning
Tag releases in GitHub:
```bash
git tag -a v1.1.0 -m "Neon organization storage feature"
git push origin v1.1.0
```

### 2. Incremental CACHE_BUST
Update systematically:
- Major feature: +10 (26 → 36)
- Minor feature: +1 (26 → 27)
- Bug fix: +1 (26 → 27)

### 3. Test Locally First
Always test before deploying:
```bash
cd backend
cargo test
cargo build --release
./target/release/luxio-server
```

### 4. Document Changes
Update:
- `CHANGELOG.md` in repo
- `README.md` in HF Space
- Commit messages descriptive

### 5. Monitor After Deploy
Wait 5-10 minutes after deployment:
- Check health endpoint
- Test critical features
- Monitor error logs

## 📚 Reference Files

### In Project Repo
- `backend/Cargo.toml` - Rust dependencies
- `backend/src/main.rs` - Entry point
- `backend/.env.example` - Environment variables template
- `NEON_ORG_STORAGE_IMPLEMENTATION.md` - Neon storage docs

### In HF Space
- `Dockerfile` - Build configuration
- `README.md` - Space documentation
- `.gitignore` - Git ignore rules

### In This Folder
- `luxio-hf-3file/` - Template files untuk HF Space
  - `Dockerfile` - Latest build config
  - `README.md` - Latest documentation

## 🔗 Quick Links

- **HF Space**: https://huggingface.co/spaces/lukris-98/luxio-backend
- **HF Settings**: https://huggingface.co/spaces/lukris-98/luxio-backend/settings
- **GitHub Repo**: https://github.com/lukris-98/Luxio-Project-Manager
- **Frontend**: https://luxio.edgeone.cool
- **Neon Console**: https://console.neon.tech

---

**Last Updated**: 2026-09-10  
**Current Version**: CACHE_BUST=26  
**Latest Feature**: Neon Organization Storage Consumption
