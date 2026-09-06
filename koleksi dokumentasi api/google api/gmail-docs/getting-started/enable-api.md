# Mengaktifkan Gmail API

Prasyarat sama dengan API Google lain (pola identik dengan Blogger API): aktifkan API → OAuth consent → Client ID.

---

## 1. Aktifkan Gmail API

1. Buka https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Pilih project → klik **Enable**.

Via CLI:

```bash
gcloud services enable gmail.googleapis.com --project=PROJECT_ID
```

- `gcloud services enable` = menyalakan layanan pada project; tanpa ini semua request ditolak.
- `--project=PROJECT_ID` = kuota dihitung ke project ini.

## 2. OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**.
2. User type: External (atau Internal untuk Workspace).
3. Tambahkan **scopes** yang akan dipakai, misal:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
4. Tambahkan **test users** selama app masih mode Testing.

> **Penting**: app yang meminta scope sensitif Gmail (readonly/modify/full) harus lolos **verifikasi OAuth** sebelum bisa dipakai user di luar test users. Untuk penggunaan internal/1 akun milik sendiri, mode Testing + test user sudah cukup.

## 3. OAuth Client ID

1. **Credentials → Create Credentials → OAuth client ID**.
2. Tipe: **Web application** (backend) atau **Desktop app** (CLI/tool).
3. Web application: isi **Authorized redirect URIs** (mis. `http://localhost:3000/oauth2/callback`).
4. Simpan **Client ID** + **Client secret**.

## 4. Test User & Mode Publikasi

| Status | Siapa yang bisa login |
|---|---|
| Testing | Hanya test users (token kedaluwarsa 7 hari — refresh token harus di-refresh berkala) |
| In production (verified) | Semua user |

Alasan token Testing cepat mati: Google menghapus refresh token akun test setiap 7 hari — re-authorize bila tiba-tiba 401.

## 5. Checklist

- [ ] Gmail API **Enabled** di project
- [ ] Consent screen + scope terisi
- [ ] Test user ditambahkan (mode Testing)
- [ ] OAuth Client ID + secret tersimpan aman
- [ ] Test request `GET /gmail/v1/users/me/profile` sukses (lihat [quickstart.md](quickstart.md))
