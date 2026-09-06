# Autentikasi

Blogger API v3 mendukung dua mekanisme autentikasi. Pilih sesuai kebutuhan:

| Mekanisme | Dipakai untuk | Wajib untuk |
|---|---|---|
| **API Key** | Membaca data publik (blog, post, page, comment live) | Tidak cukup untuk operasi tulis |
| **OAuth 2.0** | Akses atas nama user: `self`, draft, publish, moderasi, pageviews | Semua operasi tulis |

---

## OAuth 2.0 Scopes

| Scope | Cakupan |
|---|---|
| `https://www.googleapis.com/auth/blogger` | Baca + tulis (full access) |
| `https://www.googleapis.com/auth/blogger.readonly` | Baca saja |

Aturan praktis:

- Endpoint yang menyentuh `/users/self` (user terautentikasi) → **OAuth**.
- Insert/update/delete/publish/revert/approve/markAsSpam/removeContent → **OAuth scope `blogger`** (bukan readonly).
- Read data publik milik blog tertentu → API key atau OAuth.

---

## Alur OAuth 2.0 (Server-side / Web App)

### 1. Redirect user ke consent screen

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &scope=https://www.googleapis.com/auth/blogger
  &access_type=offline
  &prompt=consent
```

- `access_type=offline` → minta refresh token agar bisa update token otomatis.
- `prompt=consent` → paksa tampilkan consent (berguna saat re-issue refresh token).

### 2. Tukar authorization code dengan token

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

Response:

```json
{
  "access_token": "ya29.a0Af...",
  "refresh_token": "1//0g...",
  "expires_in": 3599,
  "scope": "https://www.googleapis.com/auth/blogger",
  "token_type": "Bearer"
}
```

### 3. Pakai token pada setiap request

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Refresh token

Access token kedaluwarsa dalam ±1 jam:

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

---

## API Key (Read-only publik)

Cukup tambahkan `?key=API_KEY` di query string:

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=5"
```

Bila gabungan dengan OAuth, API key opsional; cukup header `Authorization`.

---

## Validasi Token

```bash
curl "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=ACCESS_TOKEN"
```

Response berisi `scope`, `exp`, dan `email` — cocok untuk verifikasi cepat.

---

## Praktik Keamanan

1. **Jangan** menaruh client secret atau API key di kode sumber / repo; pakai environment variable atau secret manager.
2. Batasi API key: API restrictions → hanya **Blogger API v3**; application restrictions → domain/IP Anda.
3. Simpan refresh token terenkripsi (misal kolom database terenkripsi atau secret store).
4. Minta scope seminimal mungkin — pakai `blogger.readonly` jika aplikasi hanya membaca.
5. Rotasi kredensial bila terindikasi bocor, lewat **Credentials → Delete/Regenerate**.
