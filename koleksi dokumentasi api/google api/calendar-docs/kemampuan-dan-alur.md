# Kemampuan & Alur — Peta Lengkap Google Calendar API

File ini merangkum **semua hal yang bisa dilakukan** dengan Google Calendar API v3 beserta **alurnya**, dan menjelaskan kode mana yang melakukan apa.

- Base URL: `https://www.googleapis.com/calendar/v3`
- Wajib **OAuth 2.0** untuk data pribadi. API key hanya berguna untuk kalender publik.
- `CALENDAR_ID` dapat berupa alamat email kalender atau kata kunci khusus `primary`.
- Semua timestamp memakai **RFC 3339**; pengulangan memakai **RFC 5545** (RRULE); zona waktu memakai nama **IANA Time Zone Database**.

---

## 1. Daftar Lengkap Kemampuan

### A. Baca kalender & acara

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar kalender yang di-subscribe user | `GET /users/me/calendarList` | `calendar.calendarlist.readonly` |
| Metadata satu kalender (judul, timezone) | `GET /calendars/{CALENDAR_ID}` | `calendar.calendars.readonly` |
| Daftar acara pada rentang waktu | `GET /calendars/{CALENDAR_ID}/events` | `calendar.events.readonly` |
| Satu acara | `GET /calendars/{CALENDAR_ID}/events/{EVENT_ID}` | `calendar.events.readonly` |
| Cari acara berdasar teks bebas | `GET .../events?q=...` | `calendar.events.readonly` |
| Cari acara berdasar properti kustom | `GET .../events?privateExtendedProperty=k%3Dv` | `calendar.events.readonly` |
| Palet warna global | `GET /colors` | `calendar.readonly` |
| Preferensi user (timezone, locale) | `GET /users/me/settings` | `calendar.settings.readonly` |

```bash
# ① Daftar kalender: id dari sini dipakai sebagai CALENDAR_ID di endpoint lain.
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { items: [{ id, summary, accessRole, primary, timeZone }], nextSyncToken }

# ② Acara minggu ini pada kalender utama.
#    singleEvents=true  → seri berulang di-expand menjadi instance tunggal
#    orderBy=startTime  → hanya sah bila singleEvents=true
#    timeMin/timeMax    → WAJIB menyertakan offset zona waktu atau Z
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "timeMin=2026-09-07T00:00:00+07:00" \
  --data-urlencode "timeMax=2026-09-14T00:00:00+07:00" \
  --data-urlencode "singleEvents=true" \
  --data-urlencode "orderBy=startTime" \
  --data-urlencode "maxResults=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { items: [...], nextPageToken? , nextSyncToken? }

# ③ Detail satu acara berdasarkan id-nya.
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Alur baca: `calendarList.list` → dapat `id` kalender → `events.list` dengan `timeMin`/`timeMax` → `items[]` → tampilkan. Detail field: [resources/event.md](resources/event.md).

### B. Buat / ubah / hapus acara

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat acara | `POST /calendars/{CALENDAR_ID}/events` | `calendar.events` |
| Buat acara dari teks bebas | `POST /calendars/{CALENDAR_ID}/events/quickAdd?text=...` | `calendar.events` |
| Ganti seluruh acara | `PUT /calendars/{CALENDAR_ID}/events/{EVENT_ID}` | `calendar.events` |
| Ubah sebagian field | `PATCH /calendars/{CALENDAR_ID}/events/{EVENT_ID}` | `calendar.events` |
| Hapus acara | `DELETE /calendars/{CALENDAR_ID}/events/{EVENT_ID}` | `calendar.events` |
| Impor salinan privat acara luar | `POST /calendars/{CALENDAR_ID}/events/import` | `calendar.events` |
| Pindahkan acara ke kalender lain | `POST .../events/{EVENT_ID}/move?destination=...` | `calendar.events` |
| Hapus semua acara di kalender utama | `POST /calendars/{CALENDAR_ID}/clear` | `calendar` |

```bash
# Buat acara berwaktu. start/end WAJIB ada. dateTime + timeZone = acara berjadwal.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "summary": "Review sprint",
    "location": "Ruang 3A",
    "start": { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end":   { "dateTime": "2026-09-07T11:00:00+07:00", "timeZone": "Asia/Jakarta" }
  }'
# → 200 dengan Event resource lengkap; simpan field id dan htmlLink.

# PATCH hanya mengirim field yang berubah — aman untuk field milik organizer saja.
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/primary/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "location": "Ruang 5B" }'
```

> Prinsip: pakai `PATCH` untuk perubahan kecil. `PUT` (update) mengganti **seluruh** resource, jadi field yang tidak dikirim akan kembali ke nilai default. Detail: [guides/create-and-update-events.md](guides/create-and-update-events.md).

### C. Acara berulang

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat seri berulang | `POST /calendars/{CALENDAR_ID}/events` + `recurrence[]` | `calendar.events` |
| Daftar semua instance dari satu seri | `GET .../events/{EVENT_ID}/instances` | `calendar.events.readonly` |
| Ubah satu instance (exception) | `PUT /calendars/{CALENDAR_ID}/events/{INSTANCE_ID}` | `calendar.events` |
| Batalkan satu instance | `PUT .../events/{INSTANCE_ID}` dengan `status: "cancelled"` | `calendar.events` |
| Ubah "ini dan seterusnya" | `PUT` seri lama (potong `UNTIL`) + `POST` seri baru | `calendar.events` |
| Hapus seluruh seri | `DELETE /calendars/{CALENDAR_ID}/events/{EVENT_ID}` | `calendar.events` |

```bash
# recurrence[] berisi baris RRULE/EXRULE/RDATE/EXDATE sesuai RFC 5545.
# DTSTART/DTEND TIDAK boleh ada di sini — waktu awal diambil dari start/end.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "summary": "Rapat tim mingguan",
    "start": { "dateTime": "2026-09-07T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end":   { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "recurrence": [
      "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12",
      "EXDATE;TZID=Asia/Jakarta:20261026T090000"
    ]
  }'
# EXDATE di atas melewatkan satu tanggal (26 Okt) tanpa membuat exception terpisah.

# Instance: setiap instance punya id sendiri, recurringEventId (id seri), dan originalStartTime.
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events/EVENT_ID/instances" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

> Catatan: `timeZone` pada `start`/`end` **wajib** untuk acara berulang — ia menentukan zona waktu tempat pengulangan di-expand. Detail: [guides/recurring-events.md](guides/recurring-events.md).

### D. Undangan & peserta

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Undang peserta | `POST`/`PUT`/`PATCH` acara + `attendees[]` | `calendar.events` |
| Kirim email undangan | query `sendUpdates=all` / `externalOnly` / `none` | `calendar.events` |
| Balas undangan (RSVP) | `PATCH` acara, ubah `attendees[].responseStatus` | `calendar.events` |
| Peserta opsional | `attendees[].optional: true` | `calendar.events` |
| Undang ruangan/resource | `attendees[].resource: true` | `calendar.events` |
| Izin tamu | `guestsCanModify`, `guestsCanInviteOthers`, `guestsCanSeeOtherGuests` | `calendar.events` |
| Ganti organizer | `POST .../events/{EVENT_ID}/move?destination=...` | `calendar.events` |

```bash
# sendUpdates=all → semua tamu dapat email. Tanpa parameter ini defaultnya tidak mengirim.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "summary": "Rapat tim mingguan",
    "start": { "dateTime": "2026-09-07T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end":   { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "attendees": [
      { "email": "budi@example.com" },
      { "email": "sari@example.com", "optional": true }
    ],
    "guestsCanModify": false
  }'
```

> Catatan: untuk acara baru gunakan `responseStatus: "needsAction"` (default). Mengisi `accepted`/`declined`/`tentative` dari sisi organizer bisa direset oleh setelan mailbox peserta. Detail: [guides/attendees-and-invitations.md](guides/attendees-and-invitations.md).

### E. Pengingat & notifikasi

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Pakai pengingat default kalender | field `reminders.useDefault: true` | `calendar.events` |
| Pengingat khusus per acara | field `reminders.overrides[]` (maks 5) | `calendar.events` |
| Ubah pengingat default kalender | `PATCH /users/me/calendarList/{CALENDAR_ID}` + `defaultReminders[]` | `calendar.calendarlist` |
| Notifikasi email per kalender | `PATCH /users/me/calendarList/{CALENDAR_ID}` + `notificationSettings` | `calendar.calendarlist` |

```json
{
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },
      { "method": "popup", "minutes": 10 }
    ]
  }
}
```

`minutes` valid antara 0 dan 40320 (4 minggu). Metode hanya `email` atau `popup`. Detail: [guides/reminders-and-notifications.md](guides/reminders-and-notifications.md).

### F. Ketersediaan / free-busy

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Cek blok sibuk beberapa kalender | `POST /freeBusy` | `calendar.freebusy` |
| Ekspansi grup ke daftar kalender | `POST /freeBusy` dengan id grup | `calendar.freebusy` |
| Tandai acara tidak memblok waktu | field `transparency: "transparent"` | `calendar.events` |

```bash
# calendarExpansionMax maksimum 50; groupExpansionMax maksimum 100.
curl -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-07T00:00:00+07:00",
    "timeMax": "2026-09-08T00:00:00+07:00",
    "timeZone": "Asia/Jakarta",
    "items": [ { "id": "primary" }, { "id": "budi@example.com" } ]
  }'
# → calendars: { "budi@example.com": { busy: [ { start, end } ] } }
#   busy[].start inklusif, busy[].end eksklusif → dipakai untuk deteksi bentrok.
```

Detail + algoritma cari slot kosong: [guides/freebusy-and-scheduling.md](guides/freebusy-and-scheduling.md).

### G. Kelola daftar kalender

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat kalender baru (sekunder) | `POST /calendars` | `calendar.calendars` |
| Ubah judul/deskripsi/timezone kalender | `PATCH /calendars/{CALENDAR_ID}` | `calendar.calendars` |
| Hapus kalender sekunder | `DELETE /calendars/{CALENDAR_ID}` | `calendar.calendars` |
| Kosongkan kalender utama | `POST /calendars/{CALENDAR_ID}/clear` | `calendar` |
| Subscribe kalender ke daftar user | `POST /users/me/calendarList` | `calendar.calendarlist` |
| Warna & override judul di daftar | `PATCH /users/me/calendarList/{CALENDAR_ID}` | `calendar.calendarlist` |
| Sembunyikan / tampilkan di UI | field `hidden`, `selected` | `calendar.calendarlist` |
| Unsubscribe dari daftar | `DELETE /users/me/calendarList/{CALENDAR_ID}` | `calendar.calendarlist` |

```bash
# Membuat kalender sekunder: hanya summary yang wajib.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "summary": "Luxio — Deadline Task", "timeZone": "Asia/Jakarta" }'
# → { id: "abc...@group.calendar.google.com" } — simpan sebagai CALENDAR_ID aplikasi.

# Subscribe + beri warna: colorRgbFormat=true diperlukan untuk backgroundColor/foregroundColor.
curl -X POST "https://www.googleapis.com/calendar/v3/users/me/calendarList?colorRgbFormat=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": "CALENDAR_ID", "backgroundColor": "#0088aa", "foregroundColor": "#ffffff" }'
```

> Prinsip: `Calendars` = kalender itu sendiri (global, dibagi semua user). `CalendarList` = pandangan **satu user** atas kalender itu (warna, pengingat default, hidden/selected). Detail: [getting-started/overview.md](getting-started/overview.md).

### H. ACL / berbagi kalender

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar aturan akses | `GET /calendars/{CALENDAR_ID}/acl` | `calendar.acls.readonly` |
| Bagikan ke user/grup/domain | `POST /calendars/{CALENDAR_ID}/acl` | `calendar.acls` |
| Ubah level akses | `PUT`/`PATCH /calendars/{CALENDAR_ID}/acl/{RULE_ID}` | `calendar.acls` |
| Cabut akses | `DELETE /calendars/{CALENDAR_ID}/acl/{RULE_ID}` | `calendar.acls` |
| Pantau perubahan ACL | `POST /calendars/{CALENDAR_ID}/acl/watch` | `calendar.acls.readonly` |

```bash
# role: none | freeBusyReader | reader | writerWithoutPrivateAccess | writer | owner
# scope.type: default (publik) | user | group | domain
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "role": "writer", "scope": { "type": "user", "value": "budi@example.com" } }'
# sendNotifications default true → penerima dapat email. Tambahkan ?sendNotifications=false untuk diam.
```

> Catatan: `scope.type: "default"` berarti **publik** — izinnya berlaku untuk siapa pun, terautentikasi maupun tidak. Detail: [resources/acl-rule.md](resources/acl-rule.md).

### I. Sinkronisasi & push

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Full sync awal | `GET .../events` (tanpa `syncToken`) | `calendar.events.readonly` |
| Incremental sync | `GET .../events?syncToken=...` | `calendar.events.readonly` |
| Sync daftar kalender | `GET /users/me/calendarList?syncToken=...` | `calendar.calendarlist.readonly` |
| Sync setting | `GET /users/me/settings?syncToken=...` | `calendar.settings.readonly` |
| Pantau acara realtime | `POST /calendars/{CALENDAR_ID}/events/watch` | `calendar.events.readonly` |
| Pantau daftar kalender | `POST /users/me/calendarList/watch` | `calendar.calendarlist.readonly` |
| Pantau ACL | `POST /calendars/{CALENDAR_ID}/acl/watch` | `calendar.acls.readonly` |
| Pantau setting | `POST /users/me/settings/watch` | `calendar.settings.readonly` |
| Matikan channel | `POST /channels/stop` | scope channel |

```bash
# Full sync: simpan nextSyncToken dari HALAMAN TERAKHIR saja.
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "timeMin=2025-09-06T00:00:00Z" \
  --data-urlencode "singleEvents=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Incremental sync: syncToken tidak boleh dikombinasikan dengan timeMin/timeMax/q/orderBy/updatedMin.
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "syncToken=CPDAlvWDx70CEPDAlvWDx70CGAU=" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → item dengan status "cancelled" SELALU disertakan; hapus salinan lokalnya.
# → HTTP 410 fullSyncRequired: token kedaluwarsa; bersihkan store lalu full sync ulang.
```

Detail: [guides/sync-tokens.md](guides/sync-tokens.md) dan [guides/push-notifications.md](guides/push-notifications.md).

---

## 2. Alur Besar Integrasi

```
[Setup sekali]                                  [Runtime]
Cloud Console ─► enable Calendar API ─► OAuth consent + scope ─► token (±1 jam) ─► refresh
                                                                        │
   ┌────────────────────────────────────────────────────────────────────┤
   ▼                    ▼                    ▼                ▼         ▼
BACA               TULIS               JADWALKAN         SHARE      SINKRON
(events.readonly)  (events)            (freebusy)        (acls)     (events.readonly)
calendarList.list  events.insert       freeBusy.query    acl.insert  full sync
      │            events.patch              │            acl.list   → nextSyncToken
      ▼            events.delete             ▼               │             │
 events.list       + sendUpdates=all   cari slot kosong      ▼             ▼
      │                  │                   │          role/scope   incremental sync
      ▼                  ▼                   ▼                        (syncToken)
 render kalender   email undangan      events.insert                       │
                                                                          ▼
                                                              410 → wipe + full sync
                                                                          │
                                                              watch → webhook X-Goog-*
```

```
[Model resource]
Calendars  ──1:N──►  Events  ──1:N──►  Instances (khusus acara berulang)
    │                   │
    │                   └── attendees[] · reminders · conferenceData · extendedProperties
    │
    ├── Acl (siapa boleh apa atas kalender ini)
    └── CalendarList (pandangan tiap user: warna, hidden, defaultReminders)
```

---

## 3. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Memahami perbedaan Calendar / CalendarList / Event | [getting-started/overview.md](getting-started/overview.md) |
| Aktifkan API & buat kredensial OAuth | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Memilih scope yang tepat | [getting-started/authentication.md](getting-started/authentication.md) |
| Request pertama dalam 5 menit | [getting-started/quickstart.md](getting-started/quickstart.md) |
| Tahu arti setiap field JSON acara | [resources/event.md](resources/event.md) |
| Buat/ubah acara tanpa duplikat | [guides/create-and-update-events.md](guides/create-and-update-events.md) |
| Bikin jadwal berulang & ubah satu instance | [guides/recurring-events.md](guides/recurring-events.md) |
| Undang peserta & kirim email undangan | [guides/attendees-and-invitations.md](guides/attendees-and-invitations.md) |
| Atur pengingat 10 menit sebelum acara | [guides/reminders-and-notifications.md](guides/reminders-and-notifications.md) |
| Menangani zona waktu & acara sehari penuh | [guides/timezones.md](guides/timezones.md) |
| Cari slot rapat yang kosong | [guides/freebusy-and-scheduling.md](guides/freebusy-and-scheduling.md) |
| Sinkronisasi hemat kuota | [guides/sync-tokens.md](guides/sync-tokens.md) |
| Notifikasi realtime saat kalender berubah | [guides/push-notifications.md](guides/push-notifications.md) |
| Membuat link Google Meet otomatis | [guides/conference-and-meet.md](guides/conference-and-meet.md) |
| Ambil ribuan acara | [guides/pagination.md](guides/pagination.md) |
| Aplikasi tangguh saat kena limit | [guides/error-handling.md](guides/error-handling.md) |
| Semua endpoint beranotasi | [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) |
| Kode siap tempel | [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md) |

---

## 4. Alur Contoh End-to-End

"Buat rapat tim berulang tiap Senin + undang peserta + cek bentrok lewat freeBusy"

```bash
# LANGKAH 1 — cek ketersediaan semua peserta pada slot yang diinginkan.
#   Kirim satu query untuk seluruh peserta agar hemat kuota (1 request, bukan N).
curl -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-07T09:00:00+07:00",
    "timeMax": "2026-09-07T10:00:00+07:00",
    "timeZone": "Asia/Jakarta",
    "items": [ { "id": "primary" }, { "id": "budi@example.com" }, { "id": "sari@example.com" } ]
  }'
# → { calendars: { "budi@example.com": { busy: [] }, "sari@example.com": { busy: [ ... ] } } }
# busy[] kosong = bebas. Jika ada isinya, slot bentrok → geser jam lalu ulangi langkah 1.

# LANGKAH 2 — buat seri berulang sekaligus undang peserta.
#   id dibuat sendiri agar operasi idempoten: retry tidak menghasilkan duplikat.
#   id hanya boleh a-v dan 0-9, panjang 5–1024 karakter (base32hex).
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "id": "luxio7rapattim2026q3aa",
    "summary": "Rapat tim mingguan",
    "description": "Agenda: progres sprint, blocker, rencana minggu depan.",
    "start": { "dateTime": "2026-09-07T09:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end":   { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "recurrence": [ "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12" ],
    "attendees": [
      { "email": "budi@example.com" },
      { "email": "sari@example.com" }
    ],
    "reminders": {
      "useDefault": false,
      "overrides": [ { "method": "popup", "minutes": 10 } ]
    },
    "conferenceData": {
      "createRequest": { "requestId": "luxio-rapat-2026-09-07", "conferenceSolutionKey": { "type": "hangoutsMeet" } }
    },
    "extendedProperties": { "private": { "luxioId": "meeting_weekly_01" } }
  }'
# → 200 dengan Event; conferenceData.createRequest.status.statusCode awalnya "pending".

# LANGKAH 3 — ambil link Meet setelah konferensi selesai dibuat.
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events/luxio7rapattim2026q3aa" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → conferenceData.entryPoints[] berisi uri video (meet.google.com/...) dan nomor telepon.

# LANGKAH 4 — verifikasi instance yang terbentuk (12 minggu ke depan).
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events/luxio7rapattim2026q3aa/instances" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → tiap item punya id sendiri + recurringEventId + originalStartTime.

# LANGKAH 5 — libur nasional: batalkan satu instance saja, bukan seluruh seri.
curl -X PUT "https://www.googleapis.com/calendar/v3/calendars/primary/events/INSTANCE_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "status": "cancelled", "recurringEventId": "luxio7rapattim2026q3aa", "originalStartTime": { "dateTime": "2026-10-26T09:00:00+07:00", "timeZone": "Asia/Jakarta" }, "start": { "dateTime": "2026-10-26T09:00:00+07:00", "timeZone": "Asia/Jakarta" }, "end": { "dateTime": "2026-10-26T10:00:00+07:00", "timeZone": "Asia/Jakarta" } }'
```

Penjelasan tiap langkah:

1. **Langkah 1** butuh `calendar.freebusy` (atau `calendar`/`calendar.readonly`). Kalender yang tidak memberi izin free/busy akan muncul di `calendars.{id}.errors[]` dengan `reason: "notFound"` — tangani sebagai "tidak diketahui", bukan sebagai "bebas".
2. **Langkah 2** butuh `calendar.events`. `sendUpdates=all` mengirim email ke semua tamu; `conferenceDataVersion=1` wajib agar `conferenceData` tidak diabaikan. Jika `id` yang sama dipakai dua kali, respons kedua adalah `409 duplicate` — itu justru bukti idempotensi berjalan.
3. **Langkah 3** perlu dilakukan karena pembuatan konferensi bersifat asinkron; `statusCode` berubah dari `pending` ke `success` (atau `failure`).
4. **Langkah 4** memakai `events.instances`, bukan `events.list`, agar hanya instance seri ini yang dikembalikan.
5. **Langkah 5** memakai `PUT` pada **id instance**, bukan id seri. `originalStartTime` mengidentifikasi instance mana yang dibatalkan. Alternatif tanpa membuat exception: tambahkan baris `EXDATE` pada `recurrence` seri.

> Prinsip: jangan mengubah instance satu per satu bila yang dimaksud adalah seluruh seri — itu membuat banyak exception yang memperlambat akses dan membanjiri user dengan notifikasi perubahan.

Kode siap pakai: [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md).
