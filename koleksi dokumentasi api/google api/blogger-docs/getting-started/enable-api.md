# Mengaktifkan Blogger API

Sebelum memakai Blogger API v3, aktifkan API-nya di project Google Cloud dan siapkan kredensial.

---

## 1. Buat / Pilih Project Google Cloud

1. Buka https://console.cloud.google.com/
2. Klik **project picker** di kiri atas → **New Project**.
3. Isi nama project (misal `luxio-blogger-integration`) → **Create**.
4. Pilih project tersebut sebagai aktif.

## 2. Aktifkan Blogger API v3

1. Buka **APIs & Services → Library**:
   https://console.cloud.google.com/apis/library
2. Cari **Blogger API v3** (atau langsung ke https://console.cloud.google.com/apis/library/blogger.googleapis.com).
3. Klik **Enable**.

Verifikasi via CLI (gcloud):

```bash
gcloud services enable blogger.googleapis.com --project=PROJECT_ID
```

Cek status:

```bash
gcloud services list --enabled --project=PROJECT_ID | findstr blogger
```

## 3. Buat API Key (untuk akses publik read-only)

1. Buka **APIs & Services → Credentials**: https://console.cloud.google.com/apis/credentials
2. **Create Credentials → API key**.
3. Salin key-nya.
4. Klik **Edit API key** untuk membatasi:
   - **API restrictions**: pilih *Restrict key* → centang **Blogger API v3**.
   - **Application restrictions**: pilih *HTTP referrers* / *IP addresses* sesuai tempat dipakai.

Uji cepat (tanpa OAuth):

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs?key=API_KEY_ANDA"
```

> `/users/self` tetap membutuhkan OAuth. API key cukup untuk endpoint publik seperti `/blogs/{blogId}` atau `/blogs/{blogId}/posts` dengan `blogId` yang diketahui.

## 4. Konfigurasi OAuth Consent Screen

Wajib untuk operasi tulis:

1. **APIs & Services → OAuth consent screen**.
2. Pilih **User Type**: *External* (atau *Internal* untuk Workspace).
3. Isi nama aplikasi, email support, dan developer contact.
4. Tambahkan **scopes**:
   - `https://www.googleapis.com/auth/blogger`
   - `https://www.googleapis.com/auth/blogger.readonly`
5. Tambahkan akun Google penguji (tab **Test users**) selama aplikasi masih di mode *Testing*.

## 5. Buat OAuth 2.0 Client ID

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Pilih tipe aplikasi:
   - **Web application** — untuk backend / web app. Tambahkan **Authorized redirect URIs** (misal `http://localhost:3000/oauth2/callback`).
   - **Desktop app** — untuk CLI/tool lokal.
3. Simpan **Client ID** dan **Client secret** (Web) atau unduh file JSON (Desktop).

## 6. Checklist Kesiapan

- [ ] Project Google Cloud aktif
- [ ] Blogger API v3 status **Enabled**
- [ ] API key dibuat dan dibatasi hanya untuk Blogger API
- [ ] OAuth consent screen terisi + scope blogger terdaftar
- [ ] OAuth client ID (tipe sesuai kebutuhan) dibuat
- [ ] Test request `GET /blogs/{blogId}?key=...` berhasil

Lanjut ke [authentication.md](authentication.md) untuk alur mendapatkan access token, dan [quickstart.md](quickstart.md) untuk contoh request pertama.
