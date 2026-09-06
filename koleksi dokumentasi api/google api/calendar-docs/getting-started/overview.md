# Overview — Google Calendar API v3

Google Calendar API adalah REST API yang mengekspos hampir seluruh fitur yang tersedia di antarmuka web Google Calendar. Aksesnya lewat HTTP langsung atau lewat client library Google.

- Base URL: `https://www.googleapis.com/calendar/v3`
- Format request/response: JSON
- Autentikasi: OAuth 2.0 (Bearer token). API key hanya berguna untuk kalender publik.
- Dokumentasi resmi: https://developers.google.com/workspace/calendar/api/guides/overview

---

## 1. Model Resource

| Resource | Arti | Koleksi | Analogi |
|---|---|---|---|
| `Calendar` | Kalender itu sendiri: judul, deskripsi, timezone default, lokasi | `/calendars` | Tabel master |
| `CalendarListEntry` | Pandangan **satu user** atas sebuah kalender: warna, pengingat default, hidden/selected, override judul | `/users/me/calendarList` | Baris preferensi per user |
| `Event` | Satu acara: judul, waktu mulai/selesai, peserta, pengulangan | `/calendars/{calendarId}/events` | Baris data |
| `AclRule` | Aturan akses: siapa (`scope`) boleh apa (`role`) atas sebuah kalender | `/calendars/{calendarId}/acl` | Baris izin |
| `Setting` | Preferensi user dari UI Calendar (timezone, locale, format jam) | `/users/me/settings` | Konfigurasi user |
| `Colors` | Palet warna global untuk kalender dan acara | `/colors` | Tabel referensi (read-only) |
| `FreeBusy` | Hasil komputasi blok sibuk beberapa kalender — bukan resource tersimpan | `/freeBusy` | View/query |
| `Channel` | Kanal notifikasi push yang dibuat oleh `watch` | `/channels/stop` | Subscription |

### Calendar vs CalendarList — perbedaan yang paling sering salah

```
Calendar  "abc123@group.calendar.google.com"
  summary: "Deadline Task"          ← sama untuk semua orang
  timeZone: "Asia/Jakarta"          ← default kalender
  description, location

CalendarList entry milik user A     CalendarList entry milik user B
  summaryOverride: "Deadline"         summaryOverride: (tidak diisi)
  backgroundColor: "#0088aa"          backgroundColor: "#d50000"
  defaultReminders: [popup 30m]       defaultReminders: [email 1d]
  selected: true                      hidden: true
  accessRole: "owner"                 accessRole: "reader"
```

Aturan praktis:

| Mau mengubah... | Endpoint yang benar |
|---|---|
| Judul kalender untuk semua orang | `PATCH /calendars/{calendarId}` |
| Judul kalender hanya di tampilan saya | `PATCH /users/me/calendarList/{calendarId}` (`summaryOverride`) |
| Timezone default kalender | `PATCH /calendars/{calendarId}` (`timeZone`) |
| Warna kalender di UI saya | `PATCH /users/me/calendarList/{calendarId}` (`colorId` atau `backgroundColor`) |
| Pengingat default untuk acara di kalender itu (untuk saya) | `PATCH /users/me/calendarList/{calendarId}` (`defaultReminders`) |
| Berhenti melihat kalender di daftar saya | `DELETE /users/me/calendarList/{calendarId}` |
| Menghapus kalender beserta seluruh acaranya | `DELETE /calendars/{calendarId}` (hanya kalender sekunder) |

> Prinsip: `DELETE /users/me/calendarList/{id}` = unsubscribe (kalender tetap ada). `DELETE /calendars/{id}` = benar-benar menghapus kalender sekunder. Kalender **utama** tidak bisa dihapus — gunakan `POST /calendars/{id}/clear` untuk mengosongkan acaranya.

---

## 2. `calendarId` dan Kata Kunci `primary`

| Nilai `calendarId` | Arti |
|---|---|
| `primary` | Kalender utama user yang sedang terautentikasi |
| `user@example.com` | Kalender utama user tersebut (butuh izin akses) |
| `abc123@group.calendar.google.com` | Kalender sekunder / kalender bersama |
| `xyz@resource.calendar.google.com` | Kalender ruangan / resource Workspace |

```bash
# Kedua request ini identik untuk user yang sedang login:
curl ".../calendar/v3/calendars/primary/events" -H "Authorization: Bearer ACCESS_TOKEN"
curl ".../calendar/v3/calendars/saya%40example.com/events" -H "Authorization: Bearer ACCESS_TOKEN"
# CATATAN: '@' pada calendarId harus di-encode menjadi %40 di dalam URL path.
```

Cara menemukan `calendarId` yang tersedia:

```bash
# accessRole memberi tahu apakah kita boleh menulis: reader tidak boleh, writer/owner boleh.
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "kind": "calendar#calendarList",
  "items": [
    { "id": "saya@example.com", "summary": "saya@example.com", "primary": true, "accessRole": "owner", "timeZone": "Asia/Jakarta" },
    { "id": "abc123@group.calendar.google.com", "summary": "Deadline Task", "accessRole": "writer", "timeZone": "Asia/Jakarta" }
  ]
}
```

`accessRole` yang mungkin: `none`, `freeBusyReader`, `reader`, `writerWithoutPrivateAccess`, `writer`, `owner`.

---

## 3. Format Waktu

### RFC 3339 untuk `dateTime`, `timeMin`, `timeMax`

```
2026-09-07T10:00:00+07:00     ← offset eksplisit (disarankan)
2026-09-07T03:00:00Z          ← UTC
2026-09-07T10:00:00           ← TIDAK sah untuk timeMin/timeMax (offset wajib)
```

- `timeMin` dan `timeMax` **wajib** menyertakan offset zona waktu atau `Z`. Milidetik boleh ada tetapi diabaikan.
- Untuk `start.dateTime`/`end.dateTime`, offset boleh dihilangkan **hanya jika** `timeZone` diisi eksplisit.

### `date` (all-day) vs `dateTime` (berjadwal)

| Jenis acara | Field yang dipakai | Contoh |
|---|---|---|
| Sehari penuh | `start.date` + `end.date` | `start.date: "2026-09-14"`, `end.date: "2026-09-15"` |
| Berjadwal | `start.dateTime` + `end.dateTime` (+ `timeZone`) | `"2026-09-07T10:00:00+07:00"` |

```json
// All-day satu hari (14 September). end.date EKSKLUSIF → harus 15 September.
{ "summary": "Deadline rilis", "start": { "date": "2026-09-14" }, "end": { "date": "2026-09-15" } }

// All-day tiga hari (14–16 September). end.date = 17 September.
{ "summary": "Workshop", "start": { "date": "2026-09-14" }, "end": { "date": "2026-09-17" } }

// Berjadwal 10:00–11:00 WIB.
{
  "summary": "Review sprint",
  "start": { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
  "end":   { "dateTime": "2026-09-07T11:00:00+07:00", "timeZone": "Asia/Jakarta" }
}
```

> Catatan: jangan mencampur `date` dan `dateTime` dalam satu acara. `start` dan `end` harus memakai jenis yang sama. Field `end` selalu eksklusif — baik untuk `date` maupun `dateTime`.

### `timeZone`

- Format: nama IANA Time Zone Database, mis. `Asia/Jakarta`, `Asia/Makassar`, `Europe/Zurich`, `UTC`.
- Untuk **acara berulang**, `timeZone` pada `start`/`end` **wajib** — ia menentukan zona tempat pengulangan di-expand (penting saat ada perubahan DST).
- Untuk acara tunggal, `timeZone` opsional dan berarti "zona waktu khusus acara ini".
- Parameter query `timeZone` pada `events.list`/`events.instances`/`freeBusy` mengatur zona waktu **response**; defaultnya zona kalender (atau UTC untuk `freeBusy`).

Detail lengkap: [../guides/timezones.md](../guides/timezones.md).

---

## 4. Anatomi Response Koleksi

Semua endpoint `list` mengembalikan bentuk yang serupa:

```json
{
  "kind": "calendar#events",
  "etag": "\"p32...\"",
  "summary": "saya@example.com",
  "timeZone": "Asia/Jakarta",
  "accessRole": "owner",
  "defaultReminders": [ { "method": "popup", "minutes": 30 } ],
  "nextPageToken": "CiAKGjBpNDd2Nmp2Zml2cXRwYjBpOXA",
  "nextSyncToken": "CPDAlvWDx70CEPDAlvWDx70CGAU=",
  "items": [ /* Event resource */ ]
}
```

| Field | Kapan muncul |
|---|---|
| `nextPageToken` | Masih ada halaman berikutnya. Saat ini muncul, `nextSyncToken` **tidak** muncul. |
| `nextSyncToken` | Ini halaman terakhir. Simpan nilainya untuk incremental sync berikutnya. |
| `defaultReminders[]` | Pengingat default kalender bagi user terautentikasi — berlaku untuk acara dengan `reminders.useDefault: true`. |
| `accessRole` | Peran user atas kalender ini; tentukan apakah UI boleh menampilkan tombol edit. |

> Prinsip: `nextPageToken` dan `nextSyncToken` saling eksklusif. Jangan menyimpan `nextSyncToken` di tengah paginasi. Detail: [../guides/pagination.md](../guides/pagination.md).

---

## 5. Batasan Utama

| Batasan | Nilai |
|---|---|
| `maxResults` events.list / events.instances | Default 250, maksimum 2500 |
| `maxResults` calendarList.list / settings.list | Default 100, maksimum 250 |
| `reminders.overrides[]` | Maksimum 5 per acara |
| `reminders` `minutes` | 0 – 40320 (4 minggu) |
| `attachments[]` | Maksimum 25 per acara |
| Panjang `event.id` | 5 – 1024 karakter, hanya `a`–`v` dan `0`–`9` (base32hex) |
| Kunci `extendedProperties` | Maksimum 44 karakter (lebih panjang dibuang tanpa peringatan) |
| Nilai `extendedProperties` | Maksimum 1024 karakter (lebih panjang dipotong) |
| Total `extendedProperties` | 300 properti, total 32 KB per acara (private + shared, semua salinan) |
| `freeBusy.calendarExpansionMax` | Maksimum 50 |
| `freeBusy.groupExpansionMax` | Maksimum 100 |
| Label acara per kalender | Maksimum 200 |
| TTL channel push default | 604800 detik (7 hari) |
| Kuota per project | 10.000 request/menit |
| Kuota per user per project | 600 request/menit |

Detail kuota: [rate-limits.md](rate-limits.md).

---

## 6. Apa yang TIDAK Bisa Dilakukan API Ini

| Tidak bisa | Alternatif |
|---|---|
| Mengubah `Setting` user (timezone, locale) | Hanya tersedia `get`, `list`, `watch` — tidak ada method tulis |
| Mengubah `Colors` (palet global) | Read-only; untuk warna kustom pakai `backgroundColor` pada CalendarList atau `labelProperties.eventLabels` pada Calendar |
| Menghapus kalender utama | Gunakan `POST /calendars/{calendarId}/clear` |
| Memindahkan acara non-`default` (`birthday`, `focusTime`, `fromGmail`, `outOfOffice`, `workingLocation`) | Hanya `eventType: "default"` yang bisa di-`move` |
| Membuat acara `eventType: "fromGmail"` | Dibuat otomatis oleh Gmail saja |
| Mengubah `eventType` setelah acara dibuat | Immutable — buat acara baru |
| Mengubah `organizer` lewat update biasa | Gunakan `POST .../events/{eventId}/move` |
| Menerima detail perubahan di payload webhook | Payload push kosong; harus panggil `events.list` dengan `syncToken` |
