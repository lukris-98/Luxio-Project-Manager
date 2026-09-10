# Cara Restart Backend Server

## ✅ API Key Organization Sudah Diupdate!

Organization API Key baru sudah disimpan di `backend/.env`:
```
NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205
```

## 🔄 Langkah Restart Backend

### Opsi 1: Manual Restart (Development)

#### Jika backend berjalan di terminal lokal:
1. **Stop backend** yang sedang berjalan:
   - Tekan `Ctrl+C` di terminal backend
   
2. **Start ulang backend**:
   ```bash
   cd backend
   cargo run --release
   ```

#### Jika menggunakan PM2:
```bash
pm2 restart luxio-backend
# atau
pm2 restart all
```

### Opsi 2: Restart via Hugging Face Space (Production)

Jika backend deployed di Hugging Face Spaces:

#### Via HF Web UI:
1. Buka https://huggingface.co/spaces/YOUR_USERNAME/luxio-backend
2. Klik **Settings** tab
3. Scroll ke bawah, klik **Factory Reboot** atau **Restart Space**

#### Via HF CLI (jika sudah install):
```bash
huggingface-cli space restart YOUR_USERNAME/luxio-backend
```

#### Via Git Push (Auto-restart):
Karena `.env` tidak di-commit ke git, kamu perlu update environment variables di HF:

1. Buka Space Settings di Hugging Face
2. Pilih tab **Variables and Secrets**
3. Update environment variables:
   - `NEON_API_KEY` = `napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr`
   - `NEON_ORG_ID` = `org-curly-bonus-71722205`
4. Space akan auto-restart setelah save

### Opsi 3: Restart via Deploy Script (Windows)

Jika kamu punya deploy script:
```bash
deploy/Deploy-Luxio.bat
```

## ✅ Verifikasi Backend Berhasil Restart

### 1. Cek backend logs:
```bash
# PM2
pm2 logs luxio-backend

# Manual
# Lihat terminal output backend
```

### 2. Test endpoint storage:
Buka browser atau curl:
```bash
# Health check
curl http://localhost:3000/health

# Test Neon API (via browser - login dulu)
# Buka: http://localhost:5173 → Penyimpanan → Database → Storage Org
```

### 3. Yang harus terlihat di logs:
```
✓ Connected to database
✓ Neon API Key loaded
✓ Server running on 0.0.0.0:3000
```

## 🧪 Testing Storage Tab

Setelah backend restart:

1. **Buka aplikasi** di browser: http://localhost:5173
2. **Login** sebagai owner
3. **Buka halaman Penyimpanan** (sidebar → Penyimpanan)
4. **Klik tab "Storage Org"** (di samping Projects dan API Keys)
5. **Verify data muncul:**
   - Summary card menampilkan total periods & latest storage
   - Tabel detail per periode terisi
   - Tidak ada error "Gagal memuat data storage organisasi"

## ❌ Troubleshooting

### Error: "Organization ID tidak ditemukan"
- Pastikan `NEON_ORG_ID` ada di `backend/.env`
- Restart backend

### Error: "Gagal memuat data storage organisasi"
- Pastikan `NEON_API_KEY` adalah **Organization API Key** (bukan Personal)
- Verifikasi API key valid di Neon Console
- Restart backend

### Backend tidak mau start:
- Cek port 3000 sudah dipakai proses lain:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  
  # Kill process
  taskkill /PID <PID> /F
  ```

### Database connection error:
- Verifikasi `DATABASE_URL` di `.env` masih valid
- Cek Neon project belum di-suspend

## 📝 Environment Variables Lengkap

Pastikan `backend/.env` punya minimal:
```env
DATABASE_URL=postgres://...
NEON_API_KEY=napi_v528cgtxwm2y3m335ge6su11zqb2aq7d4rkxmagm8xfdnjd7r5gcuc05kmcla0gr
NEON_ORG_ID=org-curly-bonus-71722205
PORT=3000
ALLOWED_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
APP_URL=http://localhost:5173
OWNER_EMAIL=master@luxio.web.id
OWNER_PASSWORD=@Lukris1998
```

## 🚀 Next Steps

Setelah backend restart dan storage tab berfungsi:
1. ✅ Test load data storage 30 hari terakhir
2. ✅ Verify summary cards akurat
3. ✅ Cek tabel detail per periode
4. 📊 (Optional) Screenshot untuk dokumentasi
5. 🎉 Enjoy organization-level storage insights!

---

**Update:** September 10, 2026  
**API Key Type:** Organization API Key ✅  
**Organization ID:** org-curly-bonus-71722205
