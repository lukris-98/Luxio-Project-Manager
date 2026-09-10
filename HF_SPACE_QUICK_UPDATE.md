# 🚀 Quick Update Guide - HF Space

## ✅ Step-by-Step untuk Deploy ke HF Space

### 📦 Yang Sudah Dilakukan:
- ✅ Code pushed ke GitHub (commit c1a9728 & 3150b10)
- ✅ Neon Organization Storage feature implemented
- ✅ Dockerfile updated dengan CACHE_BUST=26
- ✅ README.md HF Space updated

---

## 🔄 Cara Update HF Space (Pilih Salah Satu)

### **OPSI 1: Copy-Paste Files ke HF Space (Tercepat)** ⭐

1. **Buka HF Space Web Editor**:
   - Go to: https://huggingface.co/spaces/lukris-98/luxio-backend
   - Klik **Files** tab
   - Klik **Add file** → **Create a new file** atau edit existing

2. **Copy file `luxio-hf-3file/Dockerfile`**:
   ```
   Klik "Dockerfile" → Edit
   Copy-paste content dari: luxio-hf-3file/Dockerfile
   Commit changes
   ```

3. **Copy file `luxio-hf-3file/README.md`**:
   ```
   Klik "README.md" → Edit
   Copy-paste content dari: luxio-hf-3file/README.md
   Commit changes
   ```

4. **HF akan auto-rebuild** (~10-15 menit)

---

### **OPSI 2: Git Push ke HF Space**

```bash
# Clone HF Space (one-time setup)
git clone https://huggingface.co/spaces/lukris-98/luxio-backend hf-space
cd hf-space

# Copy files dari project
cp ../luxio-hf-3file/Dockerfile .
cp ../luxio-hf-3file/README.md .

# Commit & push
git add Dockerfile README.md
git commit -m "Update: Auto-pull from GitHub + Neon org storage (CACHE_BUST=26)"
git push

# HF akan auto-rebuild
```

---

### **OPSI 3: Factory Reboot (Jika Dockerfile sudah di-update)**

1. Go to: https://huggingface.co/spaces/lukris-98/luxio-backend/settings
2. Scroll to bottom
3. Click **Factory Reboot**
4. Wait 10-15 minutes

---

## 🔐 Update Environment Variables

**PENTING**: Update API Key di HF Space Settings!

1. Go to: https://huggingface.co/spaces/lukris-98/luxio-backend/settings
2. Click **Variables and Secrets**
3. **Update/Add these variables**:

```env
NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205
```

**Existing vars to keep**:
```env
DATABASE_URL=(existing value)
OWNER_EMAIL=master@luxio.web.id
OWNER_PASSWORD=@Lukris1998
ALLOWED_ORIGIN=https://luxio.edgeone.cool,https://lukris-98-luxio-backend.hf.space
APP_URL=https://luxio.edgeone.cool
SMTP_FROM=Luxio <noreply@luxio.web.id>
GOOGLE_CLIENT_ID=11562744719-5kv4tq3ig22gbo32l96a9r4iq7n4pk2n.apps.googleusercontent.com
FIREBASE_WEB_API_KEY=AIzaSyAtVPfadMgHbm0_CKTGwINUiYJJLl4RjBw
```

4. Click **Save**
5. Space will auto-restart

---

## ✅ Verification Checklist

### 1. Wait for Build Complete (~10-15 min)
Monitor: https://huggingface.co/spaces/lukris-98/luxio-backend

Build logs should show:
```
✓ Cloning from GitHub
✓ Building Rust backend
✓ Copying binary
✓ Container running on port 7860
```

### 2. Test Health Endpoint
```bash
curl https://lukris-98-luxio-backend.hf.space/health
```
Expected: `{"status":"ok","version":"1.x.x"}`

### 3. Test Frontend Connection
1. Open: https://luxio.edgeone.cool
2. Login sebagai owner
3. Go to **Penyimpanan** → **Database** tab
4. Click **Storage Org** tab
5. **Should see**: Organization storage data with summary & table

---

## 🎯 Expected Results

**✅ SUCCESS Indicators**:
- HF Space status: **Running** (green)
- Health endpoint returns 200 OK
- Storage Org tab shows data (no errors)
- Summary cards display: Total periods, Latest storage, Period range
- Table shows storage per periode

**❌ If Error "Gagal memuat data storage"**:
- Verify `NEON_API_KEY` is **Organization API Key** (not Personal)
- Check `NEON_ORG_ID` is set correctly
- Restart Space after env var update

---

## 📋 File Locations

**Source files (untuk copy-paste)**:
```
luxio-hf-3file/
├── Dockerfile       ← Copy ini ke HF Space
└── README.md        ← Copy ini ke HF Space
```

**GitHub repo** (auto-pulled by Dockerfile):
```
https://github.com/lukris-98/Luxio-Project-Manager
Latest commits:
- c1a9728: Neon organization storage feature
- 3150b10: HF Space auto-deploy docs
```

---

## 🔗 Quick Links

| Link | URL |
|------|-----|
| **HF Space** | https://huggingface.co/spaces/lukris-98/luxio-backend |
| **HF Settings** | https://huggingface.co/spaces/lukris-98/luxio-backend/settings |
| **HF Files Editor** | https://huggingface.co/spaces/lukris-98/luxio-backend/tree/main |
| **GitHub Repo** | https://github.com/lukris-98/Luxio-Project-Manager |
| **Frontend** | https://luxio.edgeone.cool |
| **Neon Console** | https://console.neon.tech |

---

## 🆘 Need Help?

**Jika build gagal**:
1. Check build logs di HF Space
2. Verify Dockerfile syntax
3. Try Factory Reboot

**Jika runtime error**:
1. Check environment variables
2. Verify database connection
3. Check HF Space logs

**Jika storage tab error**:
1. Confirm Organization API Key (bukan Personal)
2. Verify NEON_ORG_ID correct
3. Restart Space setelah update env vars

---

**Status**: Ready to Deploy ✅  
**GitHub**: Up to date ✅  
**Next Step**: Copy files ke HF Space atau Factory Reboot 🚀
