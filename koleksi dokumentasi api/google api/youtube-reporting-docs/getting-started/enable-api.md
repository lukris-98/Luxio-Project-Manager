# Mengaktifkan YouTube Reporting API

Panduan menyiapkan project Google Cloud, mengaktifkan API, dan membuat kredensial OAuth 2.0 untuk YouTube Reporting API v1.

- Nama API di Cloud Console: **YouTube Reporting API**
- Nama service: `youtubereporting.googleapis.com`
- Base URL: `https://youtubereporting.googleapis.com/v1`

---

## 1. Ringkasan Langkah

| # | Langkah | Lokasi |
|---|---|---|
| 1 | Buat atau pilih project | Google Cloud Console |
| 2 | Aktifkan YouTube Reporting API | APIs & Services → Library |
| 3 | Konfigurasi OAuth consent screen | APIs & Services → OAuth consent screen |
| 4 | Tambahkan scope yang dibutuhkan | OAuth consent screen → Scopes |
| 5 | Buat OAuth client ID | APIs & Services → Credentials |
| 6 | Simpan `client_id` + `client_secret` | Backend Anda (bukan repo, bukan frontend) |
| 7 | Jalankan consent sekali, simpan `refresh_token` | Aplikasi Anda |

---

## 2. Buat / Pilih Project

1. Buka https://console.cloud.google.com/
2. Pilih project di dropdown atas, atau **New Project**.
3. Catat **Project ID** — dipakai untuk melihat kuota nanti.

> Prinsip: pakai project terpisah untuk pipeline data. Kuota, log, dan pencabutan kredensial jadi lebih mudah diaudit.

---

## 3. Aktifkan API

Lewat Console:

1. **APIs & Services → Library**
2. Cari `YouTube Reporting API`
3. Klik **Enable**

Lewat `gcloud`:

```bash
# Pastikan project aktif sudah benar sebelum enable.
gcloud config set project PROJECT_ID

# Nama service persis: youtubereporting.googleapis.com
gcloud services enable youtubereporting.googleapis.com

# Verifikasi: service harus muncul di daftar enabled.
gcloud services list --enabled --filter="config.name:youtubereporting.googleapis.com"
```

> Catatan: kalau aplikasi juga akan mengambil judul video/channel, aktifkan pula **YouTube Data API v3** (`youtube.googleapis.com`). Reporting API hanya mengembalikan ID, bukan metadata.

---

## 4. Konfigurasi OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. Pilih **User type**:

| User type | Kapan dipakai |
|---|---|
| Internal | Semua pengguna berada dalam satu Google Workspace organization |
| External | Ada pengguna di luar organisasi (termasuk akun Google pribadi Anda sendiri) |

3. Isi App name, support email, dan developer contact.
4. Pada tahap **Scopes**, tambahkan scope yang dipakai:

| Scope | Tambahkan bila |
|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | Selalu |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | Aplikasi memproses laporan estimasi pendapatan atau performa iklan |

5. Kalau user type = External dan aplikasi belum diverifikasi, tambahkan akun Anda sebagai **Test user**.

> Prinsip: minta scope sekecil mungkin. Aplikasi publik yang memakai scope akses data pengguna harus melalui proses verifikasi Google; peringatan **unverified app** hilang hanya setelah verifikasi disetujui.

---

## 5. Buat OAuth Client ID

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

| Application type | Cocok untuk | Catatan |
|---|---|---|
| Web application | Backend web yang menerima redirect | Daftarkan **Authorized redirect URI** persis sama dengan yang dipakai kode |
| Desktop app | Skrip/CLI lokal, setup awal refresh token | Redirect `http://localhost` mudah dipakai untuk consent sekali jalan |
| TVs and Limited Input devices | **Tidak berlaku** | Device flow tidak didukung Reporting API |

Yang **tidak** bisa dipakai:

| Tipe kredensial | Alasan |
|---|---|
| Service account | Tidak ada cara menautkan service account ke akun YouTube; percobaan otorisasi menghasilkan error |
| API key saja | Semua request Reporting API harus diotorisasi OAuth 2.0 |

Setelah dibuat, simpan `client_id` dan `client_secret`.

```bash
# Simpan sebagai environment variable / secret manager, JANGAN di dalam repo.
# .env (di-gitignore) atau secret manager backend.
YT_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
YT_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
YT_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxx     # diisi setelah langkah 6
```

---

## 6. Consent Sekali untuk Mendapat Refresh Token

Bangun URL consent:

```bash
# access_type=offline  → wajib, agar Google mengembalikan refresh_token
# prompt=consent       → memaksa refresh_token dikirim ulang meski user pernah menyetujui
# scope                → dipisah spasi (URL-encoded %20)
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &access_type=offline
  &prompt=consent
  &scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics.readonly
```

Tukar `code` menjadi token:

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=AUTH_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=REDIRECT_URI" \
  -d "grant_type=authorization_code"
# → { "access_token": "ya29...", "expires_in": 3599,
#     "refresh_token": "1//...", "scope": "...", "token_type": "Bearer" }
```

Simpan `refresh_token`. Detail lengkap alur token: [authentication.md](authentication.md).

---

## 7. Verifikasi Instalasi

```bash
# Kalau ini mengembalikan 200 dan daftar reportTypes, setup sudah benar.
curl -i "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

| Hasil | Arti | Tindakan |
|---|---|---|
| `200` + `{"reportTypes":[...]}` | Setup benar | Lanjut ke [quickstart.md](quickstart.md) |
| `200` + `{}` | Token valid, tapi akun tidak berhak atas tipe laporan apa pun | Cek akun yang dipakai saat consent benar-benar pemilik channel/content owner |
| `401` | Token tidak ada, salah, atau kedaluwarsa | Refresh token, atau consent ulang |
| `403` dengan `PERMISSION_DENIED` | API belum aktif, atau scope tidak disetujui | Ulangi langkah 3 dan 4 |
| `403` `accessNotConfigured` | YouTube Reporting API belum di-enable pada project | Ulangi langkah 3 |

Daftar error selengkapnya: [errors.md](errors.md).

---

## 8. Yang Perlu Diaktifkan untuk Content Owner

Laporan `content_owner_*` dan seluruh laporan system-managed hanya bisa diambil oleh akun **content owner** (CMS partner).

| Kebutuhan | Keterangan |
|---|---|
| Akun Google yang tertaut ke content owner | Consent OAuth harus dilakukan dengan akun ini |
| `CONTENT_OWNER_ID` | External ID content owner, dipakai pada parameter `onBehalfOfContentOwner` |
| Akses ke menu Reports di Creator Studio | Prasyarat agar YouTube membuatkan job system-managed |

```bash
# Semua endpoint menerima onBehalfOfContentOwner.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?onBehalfOfContentOwner=CONTENT_OWNER_ID&includeSystemManaged=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Detail: [../guides/system-managed-reports.md](../guides/system-managed-reports.md).
