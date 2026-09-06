# Quickstart

Dari nol sampai membuat acara pertama. Prasyarat: Calendar API sudah aktif dan `ACCESS_TOKEN` sudah ada ([enable-api.md](enable-api.md), [authentication.md](authentication.md)).

- Base URL: `https://www.googleapis.com/calendar/v3`
- Quickstart resmi: https://developers.google.com/workspace/calendar/api/quickstart/js

---

## 1. Request Pertama — Daftar Kalender

```bash
# Endpoint termurah untuk memastikan token & scope benar.
# Butuh: calendar.calendarlist.readonly (atau calendar.readonly / calendar).
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "kind": "calendar#calendarList",
  "etag": "\"p33...\"",
  "nextSyncToken": "CPDAlvWDx70CEPDAlvWDx70CGAU=",
  "items": [
    {
      "kind": "calendar#calendarListEntry",
      "id": "saya@example.com",
      "summary": "saya@example.com",
      "timeZone": "Asia/Jakarta",
      "accessRole": "owner",
      "primary": true,
      "defaultReminders": [ { "method": "popup", "minutes": 30 } ]
    }
  ]
}
```

Yang perlu diambil dari respons ini:

| Field | Dipakai untuk |
|---|---|
| `items[].id` | Nilai `CALENDAR_ID` di endpoint lain |
| `items[].accessRole` | Menentukan apakah user boleh menulis (`writer`/`owner`) |
| `items[].timeZone` | Default zona waktu saat membuat acara di kalender itu |
| `nextSyncToken` | Titik awal incremental sync daftar kalender |

---

## 2. Membaca Acara Minggu Ini

```bash
# -G + --data-urlencode agar offset zona waktu (+07:00) ter-encode dengan benar.
# singleEvents=true → seri berulang di-expand jadi instance tunggal (yang dibutuhkan UI kalender).
# orderBy=startTime → hanya sah bila singleEvents=true.
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "timeMin=2026-09-07T00:00:00+07:00" \
  --data-urlencode "timeMax=2026-09-14T00:00:00+07:00" \
  --data-urlencode "singleEvents=true" \
  --data-urlencode "orderBy=startTime" \
  --data-urlencode "maxResults=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "kind": "calendar#events",
  "summary": "saya@example.com",
  "timeZone": "Asia/Jakarta",
  "accessRole": "owner",
  "defaultReminders": [ { "method": "popup", "minutes": 30 } ],
  "nextSyncToken": "CPDAlvWDx70CEPDAlvWDx70CGAU=",
  "items": [
    {
      "kind": "calendar#event",
      "id": "1a2b3c4d5e6f7g8h9i0j",
      "status": "confirmed",
      "htmlLink": "https://www.google.com/calendar/event?eid=...",
      "created": "2026-08-20T04:11:02.000Z",
      "updated": "2026-08-20T04:11:02.612Z",
      "summary": "Review sprint",
      "location": "Ruang 3A",
      "creator": { "email": "saya@example.com", "self": true },
      "organizer": { "email": "saya@example.com", "self": true },
      "start": { "dateTime": "2026-09-07T10:00:00+07:00", "timeZone": "Asia/Jakarta" },
      "end":   { "dateTime": "2026-09-07T11:00:00+07:00", "timeZone": "Asia/Jakarta" },
      "iCalUID": "1a2b3c4d5e6f7g8h9i0j@google.com",
      "sequence": 0,
      "reminders": { "useDefault": true },
      "eventType": "default"
    }
  ]
}
```

---

## 3. Membuat Acara Pertama

```bash
# start dan end adalah SATU-SATUNYA field wajib.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Acara pertama dari API",
    "description": "Dibuat lewat Calendar API v3.",
    "location": "Jakarta",
    "start": { "dateTime": "2026-09-10T14:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "end":   { "dateTime": "2026-09-10T15:00:00+07:00", "timeZone": "Asia/Jakarta" },
    "reminders": {
      "useDefault": false,
      "overrides": [ { "method": "popup", "minutes": 15 } ]
    }
  }'
# → 200 dengan Event resource. Simpan items.id dan htmlLink.
```

Variasi yang sering dibutuhkan:

```bash
# Acara sehari penuh: pakai date, dan end.date = tanggal berikutnya (eksklusif).
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "summary": "Deadline rilis v2", "start": { "date": "2026-09-14" }, "end": { "date": "2026-09-15" } }'

# quickAdd: parsing bahasa alami oleh Google, tanpa perlu menyusun body JSON.
#   text harus di-URL-encode; hasilnya tetap Event resource lengkap.
curl -X POST -G "https://www.googleapis.com/calendar/v3/calendars/primary/events/quickAdd" \
  --data-urlencode "text=Kopi dengan Budi besok 15.00" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 4. Mengubah dan Menghapus

```bash
# PATCH: hanya field yang dikirim yang berubah. Aman dan disarankan.
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/primary/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "location": "Ruang 5B", "description": "Lokasi dipindah." }'

# DELETE: tidak ada body, respons sukses tanpa isi (204).
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/primary/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# Menghapus acara yang sudah terhapus → 410 "Resource has been deleted" (bisa diabaikan).
```

---

## 5. Versi Node.js

```bash
npm install googleapis
```

```js
import { google } from 'googleapis'

// oauth2Client sudah punya credentials (lihat authentication.md).
const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

// 1. Daftar kalender.
const { data: list } = await calendar.calendarList.list()
console.log(list.items.map((c) => `${c.id} (${c.accessRole})`))

// 2. Acara 7 hari ke depan. timeMin/timeMax perlu string RFC 3339 lengkap.
const now = new Date()
const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
const { data: events } = await calendar.events.list({
  calendarId: 'primary',
  timeMin: now.toISOString(),           // toISOString() menghasilkan ...Z → sah
  timeMax: weekLater.toISOString(),
  singleEvents: true,                   // expand seri berulang
  orderBy: 'startTime',                 // butuh singleEvents: true
  maxResults: 50
})
events.items.forEach((e) => {
  // Acara all-day tidak punya start.dateTime — selalu cek keduanya.
  const start = e.start.dateTime ?? e.start.date
  console.log(`${start}  ${e.summary}`)
})

// 3. Buat acara.
const { data: created } = await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: 'Acara pertama dari API',
    start: { dateTime: '2026-09-10T14:00:00+07:00', timeZone: 'Asia/Jakarta' },
    end:   { dateTime: '2026-09-10T15:00:00+07:00', timeZone: 'Asia/Jakarta' }
  }
})
console.log(created.id, created.htmlLink)
```

---

## 6. Versi Python

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

```python
from datetime import datetime, timedelta, timezone
from googleapiclient.discovery import build

# creds sudah tersedia (lihat authentication.md).
service = build('calendar', 'v3', credentials=creds)

# 1. Daftar kalender.
for cal in service.calendarList().list().execute().get('items', []):
    print(cal['id'], cal['accessRole'])

# 2. Acara 7 hari ke depan. isoformat() pada objek aware menghasilkan offset yang sah.
now = datetime.now(timezone.utc)
events = service.events().list(
    calendarId='primary',
    timeMin=now.isoformat(),
    timeMax=(now + timedelta(days=7)).isoformat(),
    singleEvents=True,      # expand seri berulang
    orderBy='startTime',    # butuh singleEvents=True
    maxResults=50,
).execute()

for e in events.get('items', []):
    start = e['start'].get('dateTime', e['start'].get('date'))  # all-day → 'date'
    print(start, e.get('summary', '(tanpa judul)'))

# 3. Buat acara.
created = service.events().insert(calendarId='primary', body={
    'summary': 'Acara pertama dari API',
    'start': {'dateTime': '2026-09-10T14:00:00+07:00', 'timeZone': 'Asia/Jakarta'},
    'end':   {'dateTime': '2026-09-10T15:00:00+07:00', 'timeZone': 'Asia/Jakarta'},
}).execute()
print(created['id'], created['htmlLink'])
```

---

## 7. Checklist Setelah Quickstart

| Langkah selanjutnya | File |
|---|---|
| Pahami setiap field `Event` | [../resources/event.md](../resources/event.md) |
| Buat acara idempoten (tanpa duplikat) | [../guides/create-and-update-events.md](../guides/create-and-update-events.md) |
| Buat jadwal berulang | [../guides/recurring-events.md](../guides/recurring-events.md) |
| Undang peserta | [../guides/attendees-and-invitations.md](../guides/attendees-and-invitations.md) |
| Ambil lebih dari 250 acara | [../guides/pagination.md](../guides/pagination.md) |
| Sinkronisasi hemat kuota | [../guides/sync-tokens.md](../guides/sync-tokens.md) |
| Tangani kegagalan dengan benar | [../guides/error-handling.md](../guides/error-handling.md) |
