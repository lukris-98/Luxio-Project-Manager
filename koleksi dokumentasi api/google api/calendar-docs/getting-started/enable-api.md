# Mengaktifkan Google Calendar API

Tanpa langkah ini setiap request mengembalikan error dengan pesan bahwa API belum diaktifkan untuk project.

- Console: https://console.cloud.google.com/
- Halaman API Workspace: https://console.cloud.google.com/workspace-api
- Panduan resmi konfigurasi consent: https://developers.google.com/workspace/guides/configure-oauth-consent

---

## 1. Urutan Langkah

| # | Langkah | Lokasi di Console |
|---|---|---|
| 1 | Buat atau pilih project | Selector project di bar atas |
| 2 | Aktifkan **Google Calendar API** | APIs & Services → Library → cari "Google Calendar API" → Enable |
| 3 | Konfigurasi OAuth consent screen | APIs & Services → OAuth consent screen |
| 4 | Tambahkan scope Calendar yang dibutuhkan | OAuth consent screen → Scopes |
| 5 | Tambahkan test users (selama status *Testing*) | OAuth consent screen → Test users |
| 6 | Buat OAuth Client ID | APIs & Services → Credentials → Create credentials |
| 7 | Catat `client_id` (dan `client_secret` bila tipe Web/Desktop) | Halaman Credentials |

---

## 2. Memilih Tipe OAuth Client

| Tipe client | Untuk apa | Butuh `client_secret`? |
|---|---|---|
| Web application | SPA React (Google Identity Services), backend web | Ya untuk authorization code flow; tidak untuk GIS token client |
| Desktop app | Script CLI, tool internal, `run_local_server` Python | Ya (disimpan di `credentials.json` lokal) |
| Service account | Worker tanpa user, akses domain Workspace via delegation | Tidak (pakai kunci JSON) |

Untuk tipe **Web application**, isi:

| Field | Contoh nilai |
|---|---|
| Authorized JavaScript origins | `http://localhost:5173`, `https://app.example.com` |
| Authorized redirect URIs | `http://localhost:3000/oauth2callback` |

> Catatan: `Authorized redirect URIs` harus **sama persis** dengan yang dikirim aplikasi, termasuk skema, port, dan trailing slash. Ketidaksesuaian menghasilkan `redirect_uri_mismatch` sebelum request Calendar apa pun terjadi.

Untuk Google Identity Services implicit flow (yang dipakai `app/src/services/googleAuth.js`), hanya `Authorized JavaScript origins` yang relevan; tidak ada redirect URI dan tidak ada `client_secret`.

---

## 3. Verifikasi Bahwa API Sudah Aktif

```bash
# Endpoint paling murah untuk uji: satu request, tidak mengubah apa pun.
curl -i "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Interpretasi hasil:

| Respons | Arti | Tindakan |
|---|---|---|
| `200` + JSON `calendar#calendarList` | API aktif, scope cukup | Lanjut |
| `401` `authError` "Invalid Credentials" | Token kedaluwarsa/salah | Ambil token baru; lihat [authentication.md](authentication.md) |
| `403` dengan pesan "has not been used in project ... or it is disabled" | Calendar API belum di-enable pada project itu | Enable API, tunggu beberapa menit |
| `403` `insufficientPermissions` / `ACCESS_TOKEN_SCOPE_INSUFFICIENT` | Token tidak punya scope yang dibutuhkan | Minta ulang token dengan scope yang benar |
| `403` `accessNotConfigured` | Project/billing belum siap | Periksa project yang dipakai token |

> Prinsip: `403` bisa berarti tiga hal berbeda (API mati, scope kurang, kuota habis). Selalu baca `error.errors[0].reason`, bukan hanya kode statusnya. Daftar lengkap: [errors.md](errors.md).

---

## 4. Status Publikasi & Verifikasi OAuth

| Status | Batasan |
|---|---|
| **Testing** | Hanya test users yang terdaftar bisa login; token refresh bisa dicabut setelah 7 hari |
| **In production** (belum diverifikasi) | Muncul layar peringatan "unverified app"; jumlah user dibatasi |
| **In production** (terverifikasi) | Tanpa peringatan; wajib melewati review untuk scope sensitif |

Scope Calendar yang tergolong sensitif dan memicu review lebih ketat:

- `calendar`
- `calendar.readonly`
- `calendar.events`
- `calendar.events.readonly`
- `calendar.calendars` / `calendar.calendars.readonly`
- `calendar.calendarlist` / `calendar.calendarlist.readonly`
- `calendar.acls` / `calendar.acls.readonly`
- `calendar.events.owned` / `calendar.events.owned.readonly`

Scope yang lebih ringan:

- `calendar.app.created` — hanya kalender yang dibuat aplikasi
- `calendar.freebusy`, `calendar.events.freebusy` — hanya ketersediaan
- `calendar.settings.readonly` — hanya preferensi
- `calendar.events.public.readonly` — hanya kalender publik

> Prinsip: kalau aplikasi cukup menulis ke kalendernya sendiri, pakai `calendar.app.created`. Aplikasi tidak akan bisa menyentuh kalender lain, dan proses verifikasi jauh lebih ringan.

---

## 5. Kesalahan Setup yang Sering Terjadi

| Gejala | Penyebab | Perbaikan |
|---|---|---|
| `403` "API has not been used in project 1234..." | Token milik project lain, atau API belum di-enable | Pastikan `client_id` berasal dari project yang API-nya aktif |
| `redirect_uri_mismatch` | Redirect URI tidak persis sama | Salin URI dari pesan error ke daftar Authorized redirect URIs |
| `idpiframe_initialization_failed` / origin ditolak | Origin belum didaftarkan | Tambahkan origin (skema + host + port) |
| Popup consent muncul terus | Set scope berubah antar pemanggilan | Pakai satu konstanta array scope per halaman |
| Refresh token hilang | `access_type` bukan `offline`, atau user sudah pernah consent | Tambahkan `access_type: 'offline'` + `prompt: 'consent'` |
| Berhasil di akun sendiri, gagal di akun lain | Status masih *Testing* | Tambahkan akun ke Test users atau publikasikan app |
