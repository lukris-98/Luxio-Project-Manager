# Kemampuan Setup & Alur Kredensial — Penjelasan Kode

File ini menjelaskan **apa saja yang bisa dilakukan pada tahap setup** dan **kode mana yang melakukan apa** di folder [getting-started/](.).

---

## 1. Kemampuan pada Tahap Setup

| Kemampuan | Alat/Kode | Hasil |
|---|---|---|
| Mengaktifkan Blogger API pada project | `gcloud services enable` | API bisa dipanggil dari project |
| Membuat kunci akses publik (read-only) | Cloud Console → API key | Bisa `GET` data publik tanpa login |
| Membatasi key agar aman | API restrictions / app restrictions | Key hanya berlaku untuk Blogger + domain/IP Anda |
| Mendaftarkan aplikasi OAuth | OAuth consent screen + Client ID | User bisa login & memberi izin aplikasi |
| Mendapatkan access token | Tukar authorization code | Header `Authorization: Bearer ...` valid ±1 jam |
| Memperbarui token otomatis | Refresh token | Aplikasi jalan terus tanpa login ulang |
| Memeriksa validitas token | endpoint `tokeninfo` | Debug scope/kedaluwarsa |

## 2. Alur Setup

```
Aktifkan API ─► API key (read publik) ─► OAuth consent ─► Client ID ─► token
     │                │                        │                │           │
     ▼                ▼                        ▼                ▼           ▼
 wajib untuk    untuk GET publik        user "mengizinkan"   identitas   aksi tulis
 semua request  tanpa login             aplikasi Anda        aplikasi    via Bearer
```

## 3. Penjelasan Kode Baris per Baris

### 3.1 Mengaktifkan API (enable-api.md)

```bash
gcloud services enable blogger.googleapis.com --project=PROJECT_ID
```

- `gcloud services` = modul pengelolaan layanan Google Cloud.
- `enable` = nyalakan layanan; tanpa ini semua request ke Blogger API ditolak dengan error akses.
- `blogger.googleapis.com` = ID resmi layanan Blogger API v3.
- `--project=PROJECT_ID` = kuota dan billing dihitung ke project ini (bukan project lain yang sedang aktif).

```bash
gcloud services list --enabled --project=PROJECT_ID | findstr blogger
```

- `list --enabled` = tampilkan layanan yang sudah aktif; `findstr blogger` = filter baris yang mengandung "blogger" (Windows). Muncul barisnya = aktivasi berhasil.

### 3.2 Uji API Key (enable-api.md)

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"
```

- URL = base endpoint + resource `blogs` + ID blog.
- `?key=API_KEY` = identitas project pemanggil. Tanpa `key` maupun token, request gagal 403.
- Tidak ada `-X` → default `GET` (baca). Response = JSON objek `Blog`.

### 3.3 URL Consent OAuth (authentication.md)

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &scope=https://www.googleapis.com/auth/blogger
  &access_type=offline
  &prompt=consent
```

Peran tiap parameter:

| Parameter | Melakukan apa |
|---|---|
| `client_id` | Menyatakan aplikasi mana yang minta izin (dari OAuth Client ID) |
| `redirect_uri` | Ke mana Google mengirim user + kode setelah izin diberikan; harus sama persis dengan yang terdaftar |
| `response_type=code` | Alur authorization code: yang diterima aplikasi adalah kode sementara, bukan token langsung |
| `scope` | Izin yang diminta. `auth/blogger` = baca+tulis. Ganti ke `auth/blogger.readonly` bila hanya membaca |
| `access_type=offline` | Minta **refresh token** agar token bisa diperbarui tanpa login ulang |
| `prompt=consent` | Paksa layar persetujuan tampil lagi (diperlukan untuk mendapat refresh token berikutnya) |

### 3.4 Tukar Kode → Token (authentication.md)

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

- `-X POST` = endpoint token hanya menerima POST.
- `code=...` = kode satu pakai dari consent (kedaluwarsa beberapa menit).
- `client_id` + `client_secret` + `redirect_uri` = pembuktian identitas aplikasi; `redirect_uri` harus identik dengan langkah 3.3.
- `grant_type=authorization_code` = memberi tahu Google jenis pertukaran ini.
- **Response**: `access_token` (pakai sekarang), `refresh_token` (simpan untuk nanti), `expires_in: 3599` (umur token detik).

### 3.5 Pakai Token (authentication.md)

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- `-H "Authorization: Bearer ..."` = mengirim token pada header. Bagian `Bearer` adalah skema standar OAuth; `ACCESS_TOKEN` hasil dari 3.4.
- Karena ada token, `users/self` bermakna "user pemilik token ini".

### 3.6 Refresh Token (authentication.md)

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

- Sama dengan 3.4, tetapi `grant_type=refresh_token` + `refresh_token` = "beri saya access token baru tanpa login ulang".
- `REFRESH_TOKEN` = nilai `refresh_token` dari 3.4 (dipakai berulang, tidak kedaluwarsa kecuali dicabut).
- **Alur runtime**: request → 401? → panggil refresh → simpan `access_token` baru → ulangi request.

### 3.7 Validasi Token (authentication.md)

```bash
curl "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=ACCESS_TOKEN"
```

- Query `access_token=...` = token yang ingin diperiksa.
- Response berisi `scope` (izin apa yang token ini punya), `exp` (kapan kedaluwarsa), `email` — berguna untuk debug "kenapa 403 padahal sudah pakai token".

## 4. Alur Autentikasi Runtime (ringkas)

```
Aplikasi butuh aksi tulis
        │
        ada access_token valid?
        │ ya                        │ tidak
        ▼                           ▼
  kirim request             POST /token (refresh_token)
  dengan Bearer                     │
        │                    dapat access_token baru
        ▼                           │
   200 OK? ──tidak──► 401? ──► refresh ──► ulangi request
        │
       ya → selesai
```

## 5. Kemana Setelah Ini

- Contoh request pertama sampai publish post: [quickstart.md](quickstart.md)
- Batas kuota dan cara hemat: [rate-limits.md](rate-limits.md)
- Arti setiap error: [errors.md](errors.md)
