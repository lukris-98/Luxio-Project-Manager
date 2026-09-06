# Kemampuan Setup & Alur Kredensial — Penjelasan Kode

File ini menjelaskan **apa yang bisa dilakukan pada tahap setup** dan **kode mana yang melakukan apa** di folder [getting-started/](.).

---

## 1. Kemampuan pada Tahap Setup

| Kemampuan | Alat/Kode | Hasil |
|---|---|---|
| Mengaktifkan Gmail API | `gcloud services enable gmail.googleapis.com` | API bisa dipanggil dari project |
| Menyiapkan OAuth consent | Cloud Console | User bisa memberi izin app |
| Menambahkan scope Gmail | Consent screen → scopes | Menentukan batas akses token |
| Membuat OAuth Client ID | Credentials → OAuth client | client_id + client_secret |
| Mendapatkan access token | Tukar authorization code | Header `Authorization: Bearer ...` valid ±1 jam |
| Memperbarui token | Refresh token | Aplikasi berjalan tanpa login ulang |
| Akses banyak mailbox (Workspace) | Service account + domain-wide delegation | Backend mempersonifikasi user domain |

## 2. Alur Setup

```
Enable API ─► consent screen + scope ─► OAuth client ─► token ─► operasi Gmail
     │              │                        │               │
  wajib         menentukan               identitas       Bearer di semua
  sebelum       batas akses              aplikasi        request API
  request       token
```

## 3. Penjelasan Kode Baris per Baris

### 3.1 Enable API (enable-api.md)

```bash
gcloud services enable gmail.googleapis.com --project=PROJECT_ID
```

- `services enable` = menyalakan layanan pada project.
- `gmail.googleapis.com` = ID resmi layanan Gmail API.
- Tanpa langkah ini, request menghasilkan error "API not enabled".

### 3.2 URL Consent (authentication.md)

```
.../auth?client_id=...&redirect_uri=...&response_type=code
  &scope=gmail.readonly%20gmail.send&access_type=offline&prompt=consent
```

- `scope` = daftar izin yang diminta; `%20` = spasi pemisah banyak scope.
- `access_type=offline` + `prompt=consent` = dapat **refresh token** (dipakai berulang).
- `redirect_uri` harus identik dengan yang terdaftar di OAuth client.

### 3.3 Tukar Code → Token (authentication.md)

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "code=AUTHORIZATION_CODE" -d "grant_type=authorization_code" \
  -d "client_id=..." -d "client_secret=..." -d "redirect_uri=..."
```

- `code` = kode sekali-pakai dari consent (umur singkat).
- `grant_type=authorization_code` = jenis pertukaran pertama.
- Response berisi `access_token`, `refresh_token`, `expires_in: 3599`.

### 3.4 Pakai & Refresh Token

```bash
# Pakai: header Bearer pada setiap request Gmail
curl "https://gmail.googleapis.com/gmail/v1/users/me/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Refresh: minta access_token baru tanpa login ulang
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "grant_type=refresh_token" -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=..." -d "client_secret=..."
```

**Alur runtime**: request → 401? → refresh → simpan token baru → ulangi request.

### 3.5 Domain-Wide Delegation (authentication.md, Workspace saja)

- Service account dibuat + key JSON; admin mendaftarkan Client ID di **Domain-wide Delegation** dengan scope Gmail.
- JWT yang dikirim ke token endpoint memuat claim `sub: email-user@domain.com` → token berhak mengakses mailbox user itu.
- `@gmail.com` gratis **tidak** didukung — harus Workspace.

## 4. Alur Runtime Token

```
Request Gmail API (Bearer token)
      │
   200? ──ya──► selesai
      │ tidak
   401? ──ya──► POST /token (grant_type=refresh_token) ──► token baru ──► ulangi request
      │ tidak
   403 rateLimit / 429 ──► backoff & retry (lihat guides/error-handling.md)
```

## 5. Kemana Setelah Ini

- Request pertama & kirim email: [quickstart.md](quickstart.md)
- Kuota & batas kirim: [rate-limits.md](rate-limits.md)
- Arti setiap error: [errors.md](errors.md)
