# Mengaktifkan YouTube Analytics API

Sebelum request pertama, API harus diaktifkan di sebuah project Google Cloud dan kredensial OAuth 2.0 harus dibuat.

---

## 1. Buat atau Pilih Project

1. Buka https://console.cloud.google.com/
2. Pilih project yang ada, atau **New Project**.
3. Catat nama project — kuota dan kredensial terikat ke project ini.

---

## 2. Aktifkan API

| API | Kapan perlu | Halaman aktivasi |
|---|---|---|
| **YouTube Analytics API** | Selalu | https://console.developers.google.com/apis/library/youtubeanalytics.googleapis.com |
| **YouTube Data API v3** | Bila butuh judul, thumbnail, atau daftar video/playlist | https://console.cloud.google.com/apis/library/youtube.googleapis.com |
| **YouTube Reporting API** | Bila butuh ekspor massal terjadwal | https://console.cloud.google.com/apis/library/youtubereporting.googleapis.com |

Klik **Enable** pada masing-masing.

> Catatan: mengaktifkan YouTube Analytics API tidak otomatis mengaktifkan YouTube Data API v3. Keduanya API terpisah dengan kuota terpisah.

---

## 3. Konfigurasi OAuth Consent Screen

`APIs & Services` → `OAuth consent screen`.

| Field | Isi |
|---|---|
| User type | `External` untuk aplikasi publik; `Internal` hanya bila seluruh pengguna berada dalam satu Workspace |
| App name | Nama yang dilihat pengguna di dialog izin |
| User support email | Wajib |
| App domain / Privacy policy URL / Terms of service URL | Wajib untuk aplikasi publik yang butuh verifikasi |
| Developer contact information | Wajib |
| Scopes | Tambahkan scope yang benar-benar dipakai (lihat tabel di bawah) |
| Test users | Selama status masih `Testing`, hanya akun yang terdaftar di sini bisa login |

Scope yang biasanya ditambahkan:

| Scope | Alasan |
|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | Membaca laporan non-moneter |
| `https://www.googleapis.com/auth/youtube.readonly` | **Wajib** untuk `reports.query` |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | Hanya bila menampilkan angka pendapatan |
| `https://www.googleapis.com/auth/youtube` | Hanya bila aplikasi membuat/mengubah grup Analytics |
| `https://www.googleapis.com/auth/youtubepartner` | Hanya untuk pemilik konten yang mengelola grup/aset |

> Prinsip: scope Analytics termasuk scope sensitif. Menambahkan scope yang tidak dipakai memperlambat proses verifikasi tanpa manfaat. Detail: [authentication.md](authentication.md).

---

## 4. Buat OAuth Client ID

`APIs & Services` → `Credentials` → `Create credentials` → `OAuth client ID`.

### A. Web application (SPA / dashboard browser)

| Field | Isi |
|---|---|
| Application type | `Web application` |
| Authorized JavaScript origins | Origin tempat kode dijalankan, mis. `http://localhost:5173`, `https://luxio.web.id` |
| Authorized redirect URIs | Boleh dikosongkan bila memakai token flow Google Identity Services |

Setelah dibuat, salin **Client ID**. Untuk aplikasi browser, client secret tidak dipakai dan tidak boleh dikirim ke browser.

### B. Desktop / installed app (script Python, CLI)

| Field | Isi |
|---|---|
| Application type | `Desktop app` |
| Name | Bebas, mis. `YouTube Analytics Quickstart` |

Unduh berkas JSON (`client_secret_xxx.json`) dan simpan di direktori kerja. Berkas ini berisi kredensial — jangan di-commit ke repositori.

### C. Server-side web app

| Field | Isi |
|---|---|
| Application type | `Web application` |
| Authorized redirect URIs | Endpoint callback server, mis. `https://api.example.com/oauth2/callback` |

Server-side flow adalah satu-satunya yang memperoleh **refresh token**, sehingga token dapat diperbarui tanpa interaksi pengguna.

---

## 5. Verifikasi Aktivasi

```bash
# Bila API belum di-enable pada project pemilik kredensial, respons berupa
# 403 dengan reason accessNotConfigured beserta tautan untuk mengaktifkannya.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "metrics=views"
```

---

## 6. Kuota

Kuota terlihat di panel Quotas Cloud Console:

https://console.developers.google.com/iam-admin/quotas?service=youtubeanalytics.googleapis.com

Dokumentasi resmi menyatakan setiap request API dihitung sebagai satu unit pemakaian kuota. Detail dan strategi hemat kuota: [rate-limits.md](rate-limits.md) dan [../guides/quota-and-limits.md](../guides/quota-and-limits.md).

---

## Selanjutnya

- [authentication.md](authentication.md) — jalankan flow OAuth dan pilih scope
- [quickstart.md](quickstart.md) — request pertama
