# Resource: `CalendarListEntry`

Sebuah kalender **sebagaimana terlihat oleh satu user**: warna, override judul, pengingat default, dan status tampil/sembunyi.

- `kind`: `calendar#calendarListEntry`
- Endpoint: `/users/me/calendarList`
- Referensi resmi: https://developers.google.com/workspace/calendar/api/v3/reference/calendarList

---

## 1. Tabel Field

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `kind` | string | Selalu `"calendar#calendarListEntry"` | read-only |
| `etag` | etag | ETag resource | read-only |
| `id` | string | Identifier kalender (sama dengan `Calendar.id`). **Wajib** saat `calendarList.insert` | read-only (wajib di body insert) |
| `summary` | string | Judul kalender | read-only |
| `summaryOverride` | string | Judul yang ditetapkan user ini untuk kalender tersebut | writable |
| `description` | string | Deskripsi kalender | read-only |
| `location` | string | Lokasi geografis kalender sebagai teks bebas | read-only |
| `timeZone` | string | Zona waktu kalender | read-only |
| `dataOwner` | string | Email pemilik data kalender. Hanya diisi untuk kalender sekunder | read-only |
| `colorId` | string | Id warna kalender, merujuk bagian `calendar` pada `/colors`. Digantikan oleh `backgroundColor`/`foregroundColor` dan bisa diabaikan bila keduanya dipakai | writable |
| `backgroundColor` | string | Warna utama kalender dalam heksadesimal `"#0088aa"`. Menggantikan `colorId`. Untuk mengubahnya, kirim `colorRgbFormat=true` pada `insert`/`update`/`patch` | writable |
| `foregroundColor` | string | Warna teks kalender dalam heksadesimal `"#ffffff"`. Menggantikan `colorId`. Butuh `colorRgbFormat=true` | writable |
| `hidden` | boolean | Kalender disembunyikan dari daftar. Field hanya dikembalikan bila kalender memang disembunyikan (nilainya `true`) | writable |
| `selected` | boolean | Isi kalender ditampilkan di UI Calendar. Default `false` | writable |
| `accessRole` | string | Peran akses efektif user terautentikasi atas kalender ini: `freeBusyReader`, `reader`, `writerWithoutPrivateAccess`, `writer`, `owner` | read-only |
| `primary` | boolean | `true` bila ini kalender utama user terautentikasi. Default `false` | read-only |
| `deleted` | boolean | `true` bila entri sudah dihapus dari daftar kalender. Default `false` | read-only |
| `defaultReminders[]` | list&lt;object&gt; | Pengingat default user ini untuk kalender ini | writable |
| `defaultReminders[].method` | string | `email` atau `popup`. Wajib saat menambah pengingat | writable |
| `defaultReminders[].minutes` | integer | Menit sebelum mulai. Valid 0–40320 (4 minggu). Wajib | writable |
| `notificationSettings` | object | Notifikasi yang diterima user ini untuk kalender ini | writable |
| `notificationSettings.notifications[]` | list&lt;object&gt; | Daftar notifikasi | writable |
| `notificationSettings.notifications[].type` | string | `eventCreation`, `eventChange`, `eventCancellation`, `eventResponse`, `agenda`. Wajib | writable |
| `notificationSettings.notifications[].method` | string | Hanya `email`. Wajib | writable |
| `conferenceProperties` | object | Properti konferensi kalender ini | read-only |
| `conferenceProperties.allowedConferenceSolutionTypes[]` | list&lt;string&gt; | `eventHangout`, `eventNamedHangout`, `hangoutsMeet` | read-only |
| `autoAcceptInvitations` | boolean | Apakah kalender otomatis menerima undangan. Hanya berlaku untuk kalender resource | read-only |

---

## 2. Arti `accessRole`

| Nilai | Boleh baca acara | Boleh lihat detail acara privat | Boleh tulis | Boleh kelola ACL |
|---|---|---|---|---|
| `freeBusyReader` | Hanya free/busy | Tidak | Tidak | Tidak |
| `reader` | Ya | Tidak (detail disembunyikan) | Tidak | Tidak |
| `writerWithoutPrivateAccess` | Ya | Tidak (detail disembunyikan) | Ya | Tidak |
| `writer` | Ya | Ya | Ya | Baca ACL saja |
| `owner` | Ya | Ya | Ya | Ya (baca + ubah) |

> Catatan: peran `owner` **berbeda** dari pemilik data kalender (`dataOwner`). Satu kalender punya satu pemilik data, tetapi bisa punya banyak user dengan peran `owner`.

Gunakan `accessRole` untuk menentukan apakah UI menampilkan tombol edit:

```js
const canWrite = ['writer', 'writerWithoutPrivateAccess', 'owner'].includes(entry.accessRole)
```

---

## 3. Arti `notificationSettings.notifications[].type`

| Nilai | Notifikasi dikirim saat |
|---|---|
| `eventCreation` | Acara baru ditambahkan ke kalender |
| `eventChange` | Acara diubah |
| `eventCancellation` | Acara dibatalkan |
| `eventResponse` | Tamu membalas undangan acara |
| `agenda` | Ringkasan agenda hari ini (dikirim pagi) |

---

## 4. Contoh JSON

```json
{
  "kind": "calendar#calendarList",
  "etag": "\"p33...\"",
  "nextSyncToken": "CPDAlvWDx70CEPDAlvWDx70CGAU=",
  "items": [
    {
      "kind": "calendar#calendarListEntry",
      "etag": "\"1620000000000000\"",
      "id": "saya@example.com",
      "summary": "saya@example.com",
      "timeZone": "Asia/Jakarta",
      "colorId": "14",
      "backgroundColor": "#9fe1e7",
      "foregroundColor": "#000000",
      "selected": true,
      "accessRole": "owner",
      "primary": true,
      "defaultReminders": [ { "method": "popup", "minutes": 30 } ],
      "notificationSettings": {
        "notifications": [
          { "type": "eventCreation",     "method": "email" },
          { "type": "eventChange",       "method": "email" },
          { "type": "eventCancellation", "method": "email" },
          { "type": "eventResponse",     "method": "email" }
        ]
      },
      "conferenceProperties": { "allowedConferenceSolutionTypes": [ "hangoutsMeet" ] }
    },
    {
      "kind": "calendar#calendarListEntry",
      "etag": "\"1620000000001000\"",
      "id": "c_1a2b3c4d5e@group.calendar.google.com",
      "summary": "Luxio — Deadline Task",
      "summaryOverride": "Deadline",
      "description": "Kalender khusus deadline task dari aplikasi Luxio.",
      "timeZone": "Asia/Jakarta",
      "dataOwner": "saya@example.com",
      "colorId": "11",
      "backgroundColor": "#dc2127",
      "foregroundColor": "#000000",
      "selected": true,
      "accessRole": "writer",
      "defaultReminders": [ { "method": "email", "minutes": 1440 } ],
      "conferenceProperties": { "allowedConferenceSolutionTypes": [ "hangoutsMeet" ] }
    },
    {
      "kind": "calendar#calendarListEntry",
      "id": "id.indonesian#holiday@group.v.calendar.google.com",
      "summary": "Hari Libur di Indonesia",
      "timeZone": "Asia/Jakarta",
      "colorId": "8",
      "hidden": true,
      "accessRole": "reader",
      "defaultReminders": []
    }
  ]
}
```

---

## 5. Field Read-Only vs Writable

| Writable | Read-only |
|---|---|
| `summaryOverride`, `colorId`, `backgroundColor`, `foregroundColor`, `hidden`, `selected`, `defaultReminders[]`, `notificationSettings` | `kind`, `etag`, `id`, `summary`, `description`, `location`, `timeZone`, `dataOwner`, `accessRole`, `primary`, `deleted`, `conferenceProperties`, `autoAcceptInvitations` |

> Prinsip: bila ingin mengubah judul/deskripsi/timezone kalender untuk semua orang, itu bukan di sini — gunakan `PATCH /calendars/{calendarId}`. Lihat [calendar.md](calendar.md).

---

## 6. Operasi Umum

```bash
# Daftar kalender user. showHidden=true agar kalender tersembunyi juga muncul.
curl -G "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  --data-urlencode "showHidden=true" \
  --data-urlencode "minAccessRole=writer" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# minAccessRole=writer → hanya kalender yang bisa ditulis user (berguna untuk dropdown "simpan ke").

# Subscribe kalender ke daftar user + set warna RGB.
#   colorRgbFormat=true WAJIB agar backgroundColor/foregroundColor tidak diabaikan.
curl -X POST "https://www.googleapis.com/calendar/v3/users/me/calendarList?colorRgbFormat=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "id": "c_1a2b3c4d5e@group.calendar.google.com",
    "backgroundColor": "#0088aa",
    "foregroundColor": "#ffffff",
    "selected": true
  }'

# Override judul + pengingat default hanya untuk user ini.
curl -X PATCH "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "summaryOverride": "Deadline",
    "defaultReminders": [ { "method": "popup", "minutes": 60 } ]
  }'

# Sembunyikan kalender dari UI (tetap di daftar).
curl -X PATCH "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "hidden": true, "selected": false }'

# Unsubscribe: kalender tetap ada, hanya hilang dari daftar user ini.
curl -X DELETE "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 7. Interaksi dengan `defaultReminders`

`defaultReminders` di sini berlaku untuk acara di kalender itu yang punya `reminders.useDefault: true`.

```
CalendarListEntry.defaultReminders = [ { popup, 30 } ]
        │
        ├── Event A: reminders.useDefault = true          ──► popup 30 menit sebelum
        ├── Event B: reminders.useDefault = false,
        │            overrides = [ { popup, 10 } ]         ──► popup 10 menit sebelum
        └── Event C: reminders.useDefault = false,
                     overrides = []                        ──► TIDAK ADA pengingat
```

Nilai `defaultReminders` juga muncul di tingkat atas respons `events.list` sebagai referensi cepat, tanpa perlu memanggil `calendarList.get`.

Detail: [../guides/reminders-and-notifications.md](../guides/reminders-and-notifications.md).

Endpoint & parameter: [../reference-api/calendar-list.md](../reference-api/calendar-list.md).
