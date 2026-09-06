# Google Calendar API v3 Documentation

Dokumentasi lengkap **Google Calendar API v3** (Google) untuk membaca, membuat, dan mengelola kalender serta acara secara programatis — mengikuti gaya dokumentasi `gmail-docs`, `neon-docs`, & `blogger-docs` di repo ini.

- Penyedia: Google (resmi, bukan pihak ketiga)
- Base URL: `https://www.googleapis.com/calendar/v3`
- Dokumentasi resmi: https://developers.google.com/workspace/calendar/api/guides/overview
- Referensi REST: https://developers.google.com/workspace/calendar/api/v3/reference
- Pemilihan scope: https://developers.google.com/workspace/calendar/api/auth
- Batas kuota: https://developers.google.com/workspace/calendar/api/guides/quota

> Prinsip: semua path di dokumen ini relatif terhadap base URL. Contoh `GET /calendars/{calendarId}/events` berarti `GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`.

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | **Kemampuan setup + penjelasan kode kredensial baris per baris** |
| [getting-started/overview.md](getting-started/overview.md) | Model resource (Calendar vs CalendarList vs Event), `primary`, format waktu |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Mengaktifkan Calendar API di Google Cloud Console |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, daftar scope, dan token |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Request pertama sampai membuat acara pertama |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Kuota per menit per project & per user, ambang harian |
| [getting-started/errors.md](getting-started/errors.md) | 400/401/403/404/409/410/412/429/500 dan penanganannya |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | **Field mana untuk apa + aliran data antar resource** |
| [resources/event.md](resources/event.md) | Resource `Event` — acara, peserta, pengulangan, konferensi |
| [resources/calendar.md](resources/calendar.md) | Resource `Calendar` — metadata kalender global |
| [resources/calendar-list-entry.md](resources/calendar-list-entry.md) | Resource `CalendarListEntry` — kalender di daftar milik user |
| [resources/acl-rule.md](resources/acl-rule.md) | Resource `AclRule` — aturan berbagi kalender |
| [resources/setting.md](resources/setting.md) | Resource `Setting` — preferensi user (timezone, locale, dll.) |
| [resources/free-busy.md](resources/free-busy.md) | Struktur request/response `freeBusy` |
| [resources/color.md](resources/color.md) | Resource `Colors` — palet warna kalender & acara |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | **Anatomi request + penjelasan kode per operasi** |
| [reference-api/events.md](reference-api/events.md) | list, get, insert, update, patch, delete, quickAdd, move, import, instances, watch |
| [reference-api/calendars.md](reference-api/calendars.md) | get, insert, update, patch, delete, clear, transferOwnership |
| [reference-api/calendar-list.md](reference-api/calendar-list.md) | list, get, insert, update, patch, delete, watch |
| [reference-api/acl.md](reference-api/acl.md) | list, get, insert, update, patch, delete, watch |
| [reference-api/settings.md](reference-api/settings.md) | list, get, watch |
| [reference-api/freebusy.md](reference-api/freebusy.md) | query |
| [reference-api/colors.md](reference-api/colors.md) | get |
| [reference-api/channels.md](reference-api/channels.md) | stop |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | **Walkthrough kode setiap guide** |
| [guides/create-and-update-events.md](guides/create-and-update-events.md) | insert vs update vs patch, idempotensi lewat `id`, `sendUpdates` |
| [guides/recurring-events.md](guides/recurring-events.md) | RRULE (RFC 5545), `instances`, satu instance vs seluruh seri, `EXDATE` |
| [guides/attendees-and-invitations.md](guides/attendees-and-invitations.md) | `responseStatus`, `sendUpdates`, izin tamu |
| [guides/reminders-and-notifications.md](guides/reminders-and-notifications.md) | `useDefault`, `overrides`, metode `popup`/`email` |
| [guides/timezones.md](guides/timezones.md) | IANA time zone, all-day event, konsistensi `timeZone` |
| [guides/freebusy-and-scheduling.md](guides/freebusy-and-scheduling.md) | `freeBusy.query`, deteksi bentrok, algoritma cari slot kosong |
| [guides/sync-tokens.md](guides/sync-tokens.md) | `syncToken`, `nextSyncToken`, 410 `fullSyncRequired`, `showDeleted` |
| [guides/push-notifications.md](guides/push-notifications.md) | `watch` + webhook, header `X-Goog-*`, perpanjangan channel |
| [guides/conference-and-meet.md](guides/conference-and-meet.md) | `conferenceData`, `conferenceDataVersion=1`, link Google Meet |
| [guides/pagination.md](guides/pagination.md) | Pola `pageToken` untuk koleksi besar |
| [guides/error-handling.md](guides/error-handling.md) | Retry, exponential backoff + jitter, 403/410 |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | **Fungsi demi fungsi: kode mana melakukan apa** |
| [examples/curl.md](examples/curl.md) | Contoh curl endpoint utama |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js (`googleapis`) |
| [examples/python.md](examples/python.md) | Integrasi Python (`google-api-python-client`) |

---

## Ringkasan Endpoint Utama

Path relatif terhadap `https://www.googleapis.com/calendar/v3`.

| Method | Path | Scope minimum |
|---|---|---|
| GET | `/calendars/{calendarId}/events` | `calendar.events.readonly` |
| GET | `/calendars/{calendarId}/events/{eventId}` | `calendar.events.readonly` |
| POST | `/calendars/{calendarId}/events` | `calendar.events` |
| PUT | `/calendars/{calendarId}/events/{eventId}` | `calendar.events` |
| PATCH | `/calendars/{calendarId}/events/{eventId}` | `calendar.events` |
| DELETE | `/calendars/{calendarId}/events/{eventId}` | `calendar.events` |
| POST | `/calendars/{calendarId}/events/quickAdd?text=...` | `calendar.events` |
| POST | `/calendars/{calendarId}/events/import` | `calendar.events` |
| POST | `/calendars/{calendarId}/events/{eventId}/move?destination=...` | `calendar.events` |
| GET | `/calendars/{calendarId}/events/{eventId}/instances` | `calendar.events.readonly` |
| POST | `/calendars/{calendarId}/events/watch` | `calendar.events.readonly` |
| GET | `/calendars/{calendarId}` | `calendar.calendars.readonly` |
| POST | `/calendars` | `calendar.calendars` |
| PUT / PATCH | `/calendars/{calendarId}` | `calendar.calendars` |
| DELETE | `/calendars/{calendarId}` | `calendar.calendars` |
| POST | `/calendars/{calendarId}/clear` | `calendar` |
| POST | `/calendars/{calendarId}/transferOwnership` | `calendar` / `calendar.calendars` |
| GET | `/users/me/calendarList` | `calendar.calendarlist.readonly` |
| GET | `/users/me/calendarList/{calendarId}` | `calendar.calendarlist.readonly` |
| POST | `/users/me/calendarList` | `calendar.calendarlist` |
| PUT / PATCH | `/users/me/calendarList/{calendarId}` | `calendar.calendarlist` |
| DELETE | `/users/me/calendarList/{calendarId}` | `calendar.calendarlist` |
| POST | `/users/me/calendarList/watch` | `calendar.calendarlist.readonly` |
| GET | `/calendars/{calendarId}/acl` | `calendar.acls.readonly` |
| GET | `/calendars/{calendarId}/acl/{ruleId}` | `calendar.acls.readonly` |
| POST | `/calendars/{calendarId}/acl` | `calendar.acls` |
| PUT / PATCH | `/calendars/{calendarId}/acl/{ruleId}` | `calendar.acls` |
| DELETE | `/calendars/{calendarId}/acl/{ruleId}` | `calendar.acls` |
| POST | `/calendars/{calendarId}/acl/watch` | `calendar.acls.readonly` |
| GET | `/users/me/settings` | `calendar.settings.readonly` |
| GET | `/users/me/settings/{setting}` | `calendar.settings.readonly` |
| POST | `/users/me/settings/watch` | `calendar.settings.readonly` |
| POST | `/freeBusy` | `calendar.freebusy` |
| GET | `/colors` | `calendar.readonly` |
| POST | `/channels/stop` | scope channel yang dibuat |

`{calendarId}` = alamat email kalender, atau kata kunci khusus `primary` untuk kalender utama user yang terautentikasi.

> Catatan: setiap method biasanya menerima **beberapa** scope alternatif. Scope `calendar` (full) selalu diterima. Tabel di atas mencantumkan scope tersempit yang lazim; daftar lengkap per method ada di file [reference-api/](reference-api/kemampuan-dan-alur.md).

---

## Scopes OAuth

Semua nilai di bawah diawali `https://www.googleapis.com/auth/`.

| Scope | Akses | Sensitif |
|---|---|---|
| `calendar` | Lihat, ubah, bagikan, dan hapus permanen **semua** kalender yang bisa diakses | Ya (paling luas) |
| `calendar.readonly` | Lihat & unduh kalender apa pun yang bisa diakses | Ya |
| `calendar.events` | Lihat & ubah acara di semua kalender | Ya |
| `calendar.events.readonly` | Lihat acara di semua kalender | Ya |
| `calendar.events.owned` | Lihat, buat, ubah, hapus acara di kalender yang dimiliki user | Ya |
| `calendar.events.owned.readonly` | Lihat acara di kalender yang dimiliki user | Ya |
| `calendar.events.public.readonly` | Lihat acara di kalender publik | Tidak |
| `calendar.events.freebusy` | Lihat ketersediaan di kalender yang bisa diakses | Tidak |
| `calendar.freebusy` | Lihat ketersediaan di kalender milik user | Tidak |
| `calendar.calendars` | Lihat & ubah properti kalender, dan buat kalender sekunder | Ya |
| `calendar.calendars.readonly` | Lihat judul, deskripsi, timezone default, dan properti kalender lain | Ya |
| `calendar.calendarlist` | Lihat, tambah, dan hapus kalender yang di-subscribe | Ya |
| `calendar.calendarlist.readonly` | Lihat daftar kalender yang di-subscribe | Ya |
| `calendar.acls` | Lihat & ubah izin berbagi kalender milik user | Ya |
| `calendar.acls.readonly` | Lihat izin berbagi kalender milik user | Ya |
| `calendar.app.created` | Buat kalender sekunder, lalu lihat/buat/ubah/hapus acara **di kalender itu saja** | Tidak (paling sempit untuk tulis) |
| `calendar.settings.readonly` | Lihat setting Calendar user | Tidak |
| `calendar.addons.execute` | Berjalan sebagai Calendar add-on | Tidak |
| `calendar.addons.current.event.read` | Lihat acara yang sedang dibuka user di Google Calendar | Tidak |
| `calendar.addons.current.event.write` | Ubah acara yang sedang dibuka user di Google Calendar | Tidak |

> Prinsip: minta scope **sekecil mungkin**. Verifikasi OAuth Google lebih ketat untuk scope luas seperti `calendar` dan `calendar.readonly`. Jika aplikasi hanya butuh mengelola acara, cukup `calendar.events`. Jika aplikasi hanya perlu kalender yang dibuatnya sendiri, `calendar.app.created` adalah pilihan paling aman.

> Catatan penamaan: scope ACL yang benar adalah `calendar.acls` / `calendar.acls.readonly` (**dengan `s`**), bukan `calendar.acl`. Scope daftar kalender adalah `calendar.calendarlist` (huruf kecil semua), bukan `calendar.calendarList`.

Detail lengkap: [getting-started/authentication.md](getting-started/authentication.md).

---

## Catatan Integrasi Proyek Luxio

Aplikasi ini (React di `app/`, backend Rust di `backend/`) sudah punya halaman Kalender internal dan fitur deadline task. Pola sinkronisasi dua arah yang direkomendasikan:

| Arah | Mekanisme |
|---|---|
| Luxio → Google | `events.insert` dengan `id` deterministik hasil UUID lokal, plus `extendedProperties.private.luxioId` = id internal |
| Google → Luxio | `events.list` dengan `syncToken` (incremental sync) + `showDeleted=true`, cocokkan lewat `extendedProperties.private.luxioId` |
| Cari ulang acara milik Luxio | `events.list?privateExtendedProperty=luxioId%3D<ID_INTERNAL>` |

```js
// Menandai acara sebagai milik Luxio: private = tidak terlihat oleh peserta lain.
const body = {
  summary: 'Deadline: Rilis v2',
  start: { date: '2026-09-14' },              // all-day → pakai date, bukan dateTime
  end:   { date: '2026-09-15' },              // end eksklusif → +1 hari
  extendedProperties: {
    private: {
      luxioId: 'task_9f2c41',                 // id internal Luxio, dipakai untuk dedupe
      luxioKind: 'task-deadline'              // penanda jenis entitas agar sync tidak salah tebak
    }
  }
}
```

OAuth frontend memakai Google Identity Services implicit flow di `app/src/services/googleAuth.js`. Konstanta `GOOGLE_SCOPES.CALENDAR` di sana saat ini meminta `calendar.readonly` + `calendar.events`. Jika halaman Kalender hanya perlu mengelola acara (bukan membaca metadata kalender lain), `calendar.events` saja sudah cukup dan mengurangi beban verifikasi OAuth.

> Catatan: implicit flow menghasilkan access token berumur ±1 jam **tanpa refresh token**. Untuk sinkronisasi latar belakang yang berjalan terus (mis. `watch` + webhook), token harus dipegang backend Rust lewat authorization code flow — bukan lewat frontend.

Peta kemampuan lengkap: [kemampuan-dan-alur.md](kemampuan-dan-alur.md).
