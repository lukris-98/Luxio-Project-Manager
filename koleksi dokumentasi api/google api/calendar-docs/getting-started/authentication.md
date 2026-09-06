# Autentikasi & Scopes

Google Calendar API memakai **OAuth 2.0**. Setiap request menyertakan header `Authorization: Bearer ACCESS_TOKEN`.

- Panduan resmi scope: https://developers.google.com/workspace/calendar/api/auth
- Panduan resmi consent: https://developers.google.com/workspace/guides/configure-oauth-consent

---

## 1. Daftar Scope Lengkap

Semua nilai diawali `https://www.googleapis.com/auth/`.

### Scope luas

| Scope | Akses | Sensitif |
|---|---|---|
| `calendar` | Lihat, ubah, bagikan, dan hapus permanen semua kalender yang bisa diakses | Ya |
| `calendar.readonly` | Lihat & unduh kalender apa pun yang bisa diakses | Ya |

### Scope acara

| Scope | Akses | Sensitif |
|---|---|---|
| `calendar.events` | Lihat & ubah acara di semua kalender | Ya |
| `calendar.events.readonly` | Lihat acara di semua kalender | Ya |
| `calendar.events.owned` | Lihat, buat, ubah, hapus acara di kalender **yang dimiliki** user | Ya |
| `calendar.events.owned.readonly` | Lihat acara di kalender yang dimiliki user | Ya |
| `calendar.events.public.readonly` | Lihat acara di kalender publik | Tidak |
| `calendar.events.freebusy` | Lihat ketersediaan di kalender yang bisa diakses | Tidak |

### Scope kalender & daftar kalender

| Scope | Akses | Sensitif |
|---|---|---|
| `calendar.calendars` | Lihat & ubah properti kalender, dan buat kalender sekunder | Ya |
| `calendar.calendars.readonly` | Lihat judul, deskripsi, timezone default, dan properti kalender lain | Ya |
| `calendar.calendarlist` | Lihat, tambah, dan hapus kalender yang di-subscribe | Ya |
| `calendar.calendarlist.readonly` | Lihat daftar kalender yang di-subscribe | Ya |
| `calendar.app.created` | Buat kalender sekunder, lalu lihat/buat/ubah/hapus acara **di kalender itu saja** | Tidak |

### Scope berbagi, ketersediaan, setting, add-on

| Scope | Akses | Sensitif |
|---|---|---|
| `calendar.acls` | Lihat & ubah izin berbagi kalender milik user | Ya |
| `calendar.acls.readonly` | Lihat izin berbagi kalender milik user | Ya |
| `calendar.freebusy` | Lihat ketersediaan di kalender milik user | Tidak |
| `calendar.settings.readonly` | Lihat setting Calendar user | Tidak |
| `calendar.addons.execute` | Berjalan sebagai Calendar add-on | Tidak |
| `calendar.addons.current.event.read` | Lihat acara yang sedang dibuka user di Google Calendar | Tidak |
| `calendar.addons.current.event.write` | Ubah acara yang sedang dibuka user di Google Calendar | Tidak |

> Catatan penamaan: yang benar adalah `calendar.acls` (dengan `s`) dan `calendar.calendarlist` (huruf kecil semua). Bentuk `calendar.acl` dan `calendar.calendarList` **tidak ada** dan akan ditolak saat consent.

---

## 3. Memilih Scope Berdasarkan Kebutuhan

| Aplikasi saya perlu... | Scope minimum |
|---|---|
| Menampilkan agenda user (read-only) | `calendar.events.readonly` |
| Membuat, mengubah, menghapus acara | `calendar.events` |
| Membuat kalender terpisah untuk aplikasi lalu mengelolanya | `calendar.app.created` |
| Menampilkan daftar kalender yang dimiliki user | `calendar.calendarlist.readonly` |
| Mengganti warna kalender di UI user | `calendar.calendarlist` |
| Membuat kalender sekunder & mengubah timezone-nya | `calendar.calendars` |
| Mencari slot rapat kosong | `calendar.freebusy` (atau `calendar.events.freebusy`) |
| Membagikan kalender ke rekan kerja | `calendar.acls` |
| Membaca timezone preferensi user | `calendar.settings.readonly` |
| Menghapus permanen kalender orang lain / semuanya | `calendar` |

> Prinsip: minta scope **sekecil mungkin**. Google menampilkan teks consent per scope; user lebih mudah menyetujui izin yang sempit dan jelas.

Untuk proyek Luxio: halaman Kalender internal cukup dengan `calendar.events` bila hanya mengelola acara. Konstanta `GOOGLE_SCOPES.CALENDAR` di `app/src/services/googleAuth.js` saat ini juga meminta `calendar.readonly`; itu hanya perlu bila UI harus menampilkan metadata kalender lain.

---

## 4. Scope per Endpoint (yang diverifikasi dari dokumentasi resmi)

| Endpoint | Scope yang diterima |
|---|---|
| `events.list` / `events.get` / `events.instances` / `events.watch` | `calendar.readonly`, `calendar`, `calendar.events.readonly`, `calendar.events`, `calendar.app.created`, `calendar.events.freebusy`, `calendar.events.owned`, `calendar.events.owned.readonly`, `calendar.events.public.readonly` |
| `events.insert` | `calendar`, `calendar.events`, `calendar.app.created`, `calendar.events.owned` |
| `calendarList.list` | `calendar.readonly`, `calendar`, `calendar.calendarlist`, `calendar.calendarlist.readonly` |
| `calendars.insert` | `calendar`, `calendar.app.created`, `calendar.calendars` |
| `calendars.transferOwnership` | `calendar`, `calendar.calendars` (+ hak admin Manage Calendars, `useAdminAccess=true`) |
| `acl.insert` | `calendar`, `calendar.acls` |
| `settings.list` | `calendar.readonly`, `calendar`, `calendar.settings.readonly` |
| `freebusy.query` | `calendar.readonly`, `calendar`, `calendar.events.freebusy`, `calendar.freebusy` |

> Catatan: daftar di atas adalah yang terverifikasi langsung dari halaman referensi masing-masing method. Method tulis lain (`update`, `patch`, `delete`, `import`, `move`, `quickAdd`) mengikuti pola yang sama dengan `insert` pada resource-nya; periksa halaman resminya bila butuh daftar persis.

---

## 5. Alur Token

### A. Google Identity Services (browser, implicit)

```js
// Satu konstanta scope per halaman. Kunci cache token = SET scope,
// jadi menambah/mengurangi satu scope memicu popup consent baru.
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

const tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  scope: CALENDAR_SCOPES.join(' '),           // dipisah SPASI
  callback: (resp) => {
    if (resp.error) return handleError(resp.error)
    // resp.access_token: string; resp.expires_in: detik (umumnya 3599); resp.scope: scope yang benar-benar diberikan.
    // Verifikasi bahwa scope yang diminta benar-benar diberikan — user bisa menolak sebagian.
    if (!resp.scope.includes('calendar.events')) return handleError('scope ditolak')
    setToken(resp.access_token, Date.now() + resp.expires_in * 1000)
  }
})

// prompt: '' → pakai izin yang sudah ada bila memungkinkan (tanpa layar consent).
// prompt: 'consent' → paksa layar consent (untuk mengganti akun / menambah scope).
tokenClient.requestAccessToken({ prompt: '' })
```

Sifat implicit flow:

| Sifat | Konsekuensi |
|---|---|
| Tidak ada `refresh_token` | Token mati ±1 jam; harus minta lagi dari UI |
| Tidak ada `client_secret` | Aman dipakai di browser |
| Butuh interaksi user | Tidak cocok untuk sinkronisasi latar belakang |

### B. Authorization code + refresh token (server)

```bash
# LANGKAH 1 — arahkan user ke halaman consent.
#   access_type=offline → dapat refresh_token
#   prompt=consent      → paksa consent (perlu bila refresh_token hilang)
#   include_granted_scopes=true → gabungkan dengan izin yang sudah ada
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback
  &response_type=code
  &scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events
  &access_type=offline
  &prompt=consent
```

```bash
# LANGKAH 2 — tukar authorization code menjadi token.
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000/oauth2callback" \
  -d "grant_type=authorization_code"
# → { access_token, expires_in: 3599, refresh_token, scope, token_type: "Bearer" }
# refresh_token HANYA dikirim sekali; simpan permanen dan aman.
```

```bash
# LANGKAH 3 — perpanjang access token kapan pun perlu (tanpa user).
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=refresh_token"
# → { access_token, expires_in, scope, token_type } — tanpa refresh_token baru.
```

### C. Service account + domain-wide delegation

Dipakai untuk mengakses kalender seluruh domain Google Workspace tanpa user login. Administrator domain harus memberi izin scope Calendar kepada client ID service account di Admin console.

> Catatan kuota penting: saat memakai domain-wide delegation, kuota "per minute per user per project" dibebankan ke **service account**, bukan ke user yang diimpersonasi. Tambahkan parameter `quotaUser` (atau header `x-goog-quota-user`) berisi identitas user agar kuota terdistribusi. Lihat [rate-limits.md](rate-limits.md).

---

## 6. Menggunakan Token

```bash
# Header Authorization berlaku untuk semua endpoint Calendar.
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Untuk request dengan body JSON, Content-Type wajib.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "summary": "Uji", "start": { "date": "2026-09-14" }, "end": { "date": "2026-09-15" } }'
```

Memeriksa scope yang benar-benar dimiliki token:

```bash
# tokeninfo berguna saat debug 403 insufficientPermissions.
curl "https://oauth2.googleapis.com/tokeninfo?access_token=ACCESS_TOKEN"
# → { scope: "https://www.googleapis.com/auth/calendar.events", expires_in: 3210, ... }
```

Mencabut token:

```bash
curl -X POST "https://oauth2.googleapis.com/revoke?token=ACCESS_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

---

## 7. Kesalahan Autentikasi & Perbaikannya

| Respons | `reason` | Penyebab | Perbaikan |
|---|---|---|---|
| `401` | `authError` | Access token kedaluwarsa/dicabut | Refresh token, atau minta token baru dari UI |
| `403` | `insufficientPermissions` | Scope kurang untuk operasi ini | Minta ulang token dengan scope yang benar; periksa lewat `tokeninfo` |
| `403` | `forbiddenForNonOrganizer` | Mencoba mengubah properti bersama pada salinan non-organizer | Pakai `PATCH` alih-alih `PUT`, atau ubah di kalender organizer |
| `403` | (pesan "API has not been used") | Calendar API belum aktif di project | Enable API; lihat [enable-api.md](enable-api.md) |
| `404` | `notFound` | Kalender/acara tidak ada, atau tidak boleh diakses | Verifikasi `calendarId` lewat `calendarList.list` |
| `400` | `invalid_grant` (pada endpoint token) | Refresh token dicabut/kedaluwarsa | Jalankan ulang consent flow |

> Prinsip: `403` karena scope tidak akan sembuh dengan retry. Bedakan `403 insufficientPermissions` (permanen) dari `403 rateLimitExceeded` (sementara, harus di-backoff). Detail: [errors.md](errors.md).
