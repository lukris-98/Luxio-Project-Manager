# Kemampuan Setup & Alur Kredensial — Penjelasan Kode

File ini menjelaskan **apa yang bisa dilakukan pada tahap setup** dan **kode mana yang melakukan apa** di folder [getting-started/](.).

---

## 1. Kemampuan pada Tahap Setup

| Kemampuan | Alat/Kode | Hasil |
|---|---|---|
| Mengaktifkan Drive API | `gcloud services enable drive.googleapis.com` | API bisa dipanggil dari project |
| Menyiapkan OAuth consent | Cloud Console → Google Auth platform | User bisa memberi izin app |
| Menambahkan scope Drive | Consent screen → Data Access | Menentukan batas akses token |
| Membuat OAuth Client ID | Clients → Create Client | `client_id` (+ `client_secret` untuk tipe non-browser) |
| Mendapatkan access token (server) | Tukar authorization code | Header `Authorization: Bearer ...` valid ±1 jam |
| Mendapatkan access token (browser) | Google Identity Services token client | Token di memori, tanpa refresh token |
| Memperbarui token (server) | Refresh token | Aplikasi jalan tanpa login ulang |
| Membatasi akses ke file pilihan user | Scope `drive.file` + Google Picker | Verifikasi OAuth ringan |
| Akses banyak akun (Workspace) | Service account + domain-wide delegation | Backend mempersonifikasi user domain |
| Memeriksa kuota penyimpanan user | `GET about?fields=storageQuota` | Tahu sisa ruang sebelum upload |

## 2. Alur Setup

```
Enable API ─► consent screen + scope ─► OAuth client ─► token ─► operasi Drive
     │              │                        │            │
  wajib         menentukan               identitas    Bearer di semua
  sebelum       batas akses              aplikasi     request API
  request       token                                 (+ fields!)
```

## 3. Penjelasan Kode Baris per Baris

### 3.1 Enable API ([enable-api.md](enable-api.md))

```bash
gcloud services enable drive.googleapis.com --project=PROJECT_ID
```

- `services enable` = menyalakan layanan pada project.
- `drive.googleapis.com` = ID resmi layanan Google Drive API.
- Tanpa langkah ini, request menghasilkan error "Google Drive API has not been used in project ... before or it is disabled".

### 3.2 URL Consent — server-side flow ([authentication.md](authentication.md))

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=https://app.example.com/oauth/callback
  &response_type=code
  &scope=https%3A//www.googleapis.com/auth/drive.file
  &access_type=offline
  &prompt=consent
```

- `scope` = daftar izin; `%20` memisahkan beberapa scope, `%3A//` adalah `://` yang di-encode.
- `access_type=offline` + `prompt=consent` = dapat **refresh token** (dipakai berulang).
- `redirect_uri` harus identik dengan yang terdaftar di OAuth client.
- `response_type=code` = authorization code flow (untuk backend). Browser murni memakai token client GIS, lihat 3.5.

### 3.3 Tukar Code → Token ([authentication.md](authentication.md))

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "code=AUTHORIZATION_CODE" \
  -d "grant_type=authorization_code" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=https://app.example.com/oauth/callback"
```

- `code` = kode sekali-pakai dari consent (umur singkat).
- `grant_type=authorization_code` = jenis pertukaran pertama.
- Response berisi `access_token`, `refresh_token`, `expires_in: 3599`, `scope`.

### 3.4 Pakai & Refresh Token

```bash
# Pakai: header Bearer pada setiap request Drive + fields agar response tidak kosong.
curl "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress),storageQuota" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Refresh: minta access_token baru tanpa login ulang.
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "grant_type=refresh_token" -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" -d "client_secret=CLIENT_SECRET"
```

**Alur runtime**: request → 401? → refresh → simpan token baru → ulangi request.

> Prinsip: simpan refresh token di penyimpanan aman jangka panjang dan pakai selama masih valid. Jangan minta consent ulang di setiap sesi.

### 3.5 Token Client Browser (pola yang dipakai Luxio)

```js
// Implicit flow Google Identity Services: tidak ada client_secret & tidak ada refresh token.
const client = window.google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: 'https://www.googleapis.com/auth/drive.file', // satu scope = satu popup consent
  callback: (resp) => {
    // resp.access_token berlaku resp.expires_in detik (±3600). Simpan di memori/sessionStorage.
  },
});
client.requestAccessToken();
```

- Kunci cache token adalah **set scope**. Meminta set scope berbeda = popup consent baru.
- Tidak ada refresh token pada implicit flow → saat 401, minta token baru lewat `requestAccessToken()` lagi.
- Di repo Luxio pola ini ada di `app/src/services/googleAuth.js` (konstanta `GOOGLE_SCOPES.DRIVE`).

### 3.6 Verifikasi Scope pada Token

```bash
# Cek scope apa saja yang benar-benar diberikan user pada token ini.
curl "https://oauth2.googleapis.com/tokeninfo?access_token=ACCESS_TOKEN"
# → { "scope": "https://www.googleapis.com/auth/drive.file", "expires_in": 3421, ... }
```

Berguna saat mendapat `403 insufficientFilePermissions` atau `401 authError` — sering ternyata scope yang diminta bukan yang diperlukan endpoint.

## 4. Alur Runtime Token

```
Request Drive API (Bearer token + fields)
      │
   200? ──ya──► selesai
      │ tidak
   401 authError? ──ya──► refresh token / requestAccessToken() ──► ulangi request
      │ tidak
   403 userRateLimitExceeded / rateLimitExceeded ──► backoff + jitter, retry
      │ tidak
   403 storageQuotaExceeded ──► JANGAN retry, beri tahu user ruang penuh
      │ tidak
   429 / 5xx ──► exponential backoff (lihat guides/error-handling.md)
```

## 5. Kemana Setelah Ini

- Model resource & jenis file Drive: [overview.md](overview.md)
- Pemilihan scope + rekomendasi Luxio: [authentication.md](authentication.md)
- Request pertama & unggah file pertama: [quickstart.md](quickstart.md)
- Quota units & batas unggah: [rate-limits.md](rate-limits.md)
- Arti setiap error dan `reason`: [errors.md](errors.md)
