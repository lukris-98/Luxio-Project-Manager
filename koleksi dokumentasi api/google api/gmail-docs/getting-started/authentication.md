# Autentikasi

Gmail API **wajib OAuth 2.0** — API key, API token statis, atau service account (kecuali Workspace domain-wide delegation) tidak bisa dipakai untuk akses mailbox.

---

## Scopes

| Scope | Cakupan |
|---|---|
| `https://www.googleapis.com/auth/gmail.readonly` | Baca message/thread/label (tanpa isi draft & kirim) |
| `https://www.googleapis.com/auth/gmail.send` | Kirim email saja |
| `https://www.googleapis.com/auth/gmail.compose` | Buat/update/kirim draft |
| `https://www.googleapis.com/auth/gmail.insert` | Sisipkan message ke mailbox |
| `https://www.googleapis.com/auth/gmail.labels` | CRUD label |
| `https://www.googleapis.com/auth/gmail.metadata` | Baca header/snipet tanpa isi |
| `https://www.googleapis.com/auth/gmail.modify` | Semua kecuali delete permanen & settings |
| `https://www.googleapis.com/auth/gmail.settings.basic` | Baca/ubah settings |
| `https://mail.google.com/` | Full termasuk delete permanen |

Prinsip: satu app boleh meminta beberapa scope sekaligus, pisahkan dengan spasi pada parameter `scope`.

---

## Alur OAuth (Web App)

### 1. Redirect ke consent

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send
  &access_type=offline
  &prompt=consent
```

| Parameter | Melakukan apa |
|---|---|
| `scope` | Izin Gmail yang diminta — banyak scope dipisah `%20` (spasi ter-encode) |
| `access_type=offline` | Minta refresh token |
| `prompt=consent` | Tampilkan layar persetujuan ulang |

### 2. Tukar code → token

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

Response: `access_token` (±1 jam), `refresh_token` (simpan aman), `scope` yang diberikan.

### 3. Pakai token

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Refresh

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

### 5. Upgrade scope tanpa re-consent penuh

Bila app sudah punya scope readonly dan kini butuh `send`, tambahkan parameter:

```
&include_granted_scopes=true
```

User hanya menyetujui scope baru yang belum dimiliki.

---

## Service Account + Domain-Wide Delegation (Google Workspace)

Khusus **Workspace admin**: service account dapat mengakses mailbox user domain via delegasi.

1. Buat Service Account + key JSON di Cloud Console.
2. Admin Console → Security → API Controls → **Domain-wide Delegation** → daftarkan Client ID service account dengan scope Gmail.
3. Request token dengan **JWT bearer**:

```bash
# grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
# JWT claim khusus: "sub": "email-user@domain.com"  ← mailbox yang diakses
```

- `sub` = email user yang dipersonifikasi; tanpa delegasi, request ditolak 403.
- Cocok untuk automasi backend multi-mailbox; tidak tersedia untuk akun @gmail.com gratis.

---

## Praktik Keamanan

1. Client secret & refresh token **tidak boleh** di kode sumber — pakai env var / secret manager.
2. Scope minimal: app yang hanya kirim cukup `gmail.send`, jangan `mail.google.com/`.
3. Token Testing mode kedaluwarsa tiap 7 hari — siapkan re-auth.
4. Cek scope aktual token: `GET https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=...`
