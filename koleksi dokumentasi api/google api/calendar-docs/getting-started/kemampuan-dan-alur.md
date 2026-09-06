# Kemampuan & Alur — Getting Started

Fokus file ini: **apa saja yang harus disiapkan sebelum request pertama**, dan penjelasan kode kredensial baris per baris.

- Base URL: `https://www.googleapis.com/calendar/v3`
- Urutan wajib: aktifkan API → buat kredensial → minta scope → dapat token → request.

---

## 1. Kemampuan Setup

| Kemampuan | Di mana | File detail |
|---|---|---|
| Aktifkan Calendar API pada project | Google Cloud Console → Enabled APIs | [enable-api.md](enable-api.md) |
| Buat OAuth Client ID (Web / Desktop) | Cloud Console → Credentials | [enable-api.md](enable-api.md) |
| Konfigurasi OAuth consent screen + scope | Cloud Console → OAuth consent screen | [authentication.md](authentication.md) |
| Tukar kode/izin menjadi access token | Endpoint OAuth Google | [authentication.md](authentication.md) |
| Request pertama (`calendarList.list`) | REST | [quickstart.md](quickstart.md) |
| Pahami batas kuota | Dokumen resmi quota | [rate-limits.md](rate-limits.md) |
| Tangani error umum | Dokumen resmi errors | [errors.md](errors.md) |

---

## 2. Alur Kredensial

```
                        ┌──────────────────────────────┐
                        │ Cloud Console (sekali saja)   │
                        │ 1. Enable Google Calendar API │
                        │ 2. OAuth consent + scope      │
                        │ 3. Create OAuth Client ID     │
                        └───────────────┬──────────────┘
                                        │ client_id (+ client_secret utk server)
        ┌───────────────────────────────┴────────────────────────────────┐
        ▼                                                               ▼
[Frontend / SPA]                                            [Server / CLI / worker]
Google Identity Services                                    Authorization code flow
implicit token flow                                         + refresh token
        │                                                               │
        │ access_token (±1 jam, TANPA refresh)                          │ access_token + refresh_token
        ▼                                                               ▼
   Authorization: Bearer ACCESS_TOKEN  ───────────────────────►  https://www.googleapis.com/calendar/v3/...
                                                                        │
                                                            401 authError → refresh / minta ulang
```

Pilih flow berdasar kebutuhan:

| Kebutuhan | Flow | Alasan |
|---|---|---|
| User klik tombol lalu lihat kalendernya | Implicit (GIS token client) | Tidak butuh client secret, cukup di browser |
| Sinkronisasi latar belakang / `watch` webhook | Authorization code + refresh token | Token harus hidup lebih lama dari sesi browser |
| Akses kalender seluruh domain Workspace | Service account + domain-wide delegation | Tidak ada user yang login interaktif |

---

## 3. Kode Kredensial Baris per Baris

### A. Browser — Google Identity Services (implicit)

```html
<!-- Muat library GIS. Wajib sebelum google.accounts.oauth2 dipakai. -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```js
// SCOPES sebagai konstanta: kunci cache token adalah SET scope.
// Meminta set berbeda = popup consent baru, jadi jangan diubah-ubah per pemanggilan.
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events'   // cukup untuk kelola acara
]

// initTokenClient hanya MENDAFTARKAN client; belum ada popup yang muncul.
const tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  scope: CALENDAR_SCOPES.join(' '),                   // dipisah spasi, bukan koma
  callback: (resp) => {
    if (resp.error) throw new Error(resp.error)
    // resp.access_token berumur resp.expires_in detik (umumnya 3599).
    // Tidak ada refresh_token pada implicit flow — simpan di memori, bukan localStorage.
    sessionAccessToken = resp.access_token
  }
})

// requestAccessToken MEMICU popup. prompt:'' = pakai izin yang sudah ada bila memungkinkan.
tokenClient.requestAccessToken({ prompt: '' })
```

```js
// Semua request memakai header Authorization. Tidak ada API key di sini.
const res = await fetch(
  'https://www.googleapis.com/calendar/v3/users/me/calendarList',
  { headers: { Authorization: `Bearer ${sessionAccessToken}` } }
)
if (res.status === 401) {
  // Token kedaluwarsa atau dicabut → minta token baru, lalu ulangi request.
  tokenClient.requestAccessToken({ prompt: '' })
}
```

### B. Node.js — authorization code + refresh token

```js
import { google } from 'googleapis'

// OAuth2 client menyimpan client_id/secret dan tahu cara refresh sendiri.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'    // harus sama persis dengan yang didaftarkan
)

// access_type:'offline' → Google mengembalikan refresh_token pada penukaran kode pertama.
// prompt:'consent' memaksa consent ulang; perlu bila refresh_token hilang.
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar.events']
})

// Setelah user kembali ke redirect URI dengan ?code=...
const { tokens } = await oauth2Client.getToken(code)
oauth2Client.setCredentials(tokens)          // { access_token, refresh_token, expiry_date }

// Simpan tokens.refresh_token secara aman. Ia yang membuat worker bisa jalan tanpa user.
// Library akan otomatis memperbarui access_token saat expiry_date lewat.
const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
```

### C. Python — file token lokal

```python
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os

SCOPES = ['https://www.googleapis.com/auth/calendar.events']

creds = None
# token.json menyimpan access_token + refresh_token dari sesi sebelumnya.
if os.path.exists('token.json'):
    creds = Credentials.from_authorized_user_file('token.json', SCOPES)

if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())              # perpanjang tanpa mengganggu user
    else:
        # credentials.json = OAuth Client ID tipe Desktop yang diunduh dari Cloud Console.
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0) # membuka browser sekali
    with open('token.json', 'w') as f:
        f.write(creds.to_json())

service = build('calendar', 'v3', credentials=creds)
```

> Prinsip: jangan pernah menaruh `client_secret` di kode frontend. Frontend memakai implicit flow tanpa secret; backend memakai authorization code flow dengan secret di environment variable.

---

## 4. Konsep yang Harus Dipahami Sebelum Coding

| Konsep | Ringkas | Detail |
|---|---|---|
| `Calendar` vs `CalendarList` | Kalender itu sendiri vs pandangan satu user atas kalender itu | [overview.md](overview.md) |
| `primary` | Kata kunci `calendarId` yang menunjuk kalender utama user login | [overview.md](overview.md) |
| `date` vs `dateTime` | All-day pakai `date` (`end` eksklusif); berjadwal pakai `dateTime` + `timeZone` | [overview.md](overview.md) |
| RFC 3339 | `timeMin`/`timeMax` wajib menyertakan offset atau `Z` | [overview.md](overview.md) |
| `syncToken` | Token incremental sync; kedaluwarsa → 410 `fullSyncRequired` | [../guides/sync-tokens.md](../guides/sync-tokens.md) |
| Kuota | 10.000 req/menit per project, 600 req/menit per user per project | [rate-limits.md](rate-limits.md) |
| Error yang harus di-retry | 403 `rateLimitExceeded`, 429, 500 | [errors.md](errors.md) |
| Error yang tidak boleh di-retry | 400, 409 `duplicate`, 412 | [errors.md](errors.md) |
