# Setup Analytics Tracking

File `index.html` berisi tracking script Umami Analytics dengan website ID yang sensitif.

## Setup untuk Development

Jika Anda clone repository ini dan ingin menjalankan aplikasi:

1. **Copy template file:**
   ```bash
   cp index.html.example index.html
   ```

2. **Tambahkan tracking ID Anda sendiri** (opsional):
   
   Jika Anda memiliki Umami Analytics instance sendiri, uncomment dan edit baris berikut di `index.html`:
   
   ```html
   <!-- Umami Analytics (Optional) -->
   <script defer src="https://your-umami-instance.com/script.js" data-website-id="YOUR_WEBSITE_ID"></script>
   ```

3. **Atau biarkan tanpa tracking** untuk development lokal.

## Catatan Penting

- ✅ File `index.html` sudah ditambahkan ke `.gitignore` untuk mencegah tracking ID ter-commit ke GitHub
- ✅ File `index.html.example` adalah template tanpa tracking ID yang aman untuk di-commit
- ⚠️ **Jangan pernah commit file `index.html` ke repository publik** karena berisi website ID yang sensitif

## Struktur File

```
app/
├── index.html           # File aktual (ignored by git, berisi tracking ID)
├── index.html.example   # Template file (tracked by git, tanpa tracking ID)
└── README-TRACKING.md   # Dokumentasi ini
```

## Deploy ke Production

Saat deploy ke production (Firebase Hosting, Vercel, dll), pastikan:

1. File `index.html` dengan tracking ID yang benar sudah ada di folder `app/`
2. Build process akan menggunakan `index.html` yang ada
3. Tracking akan aktif otomatis setelah deploy

---

**Pertanyaan?** Hubungi: master@luxio.web.id
