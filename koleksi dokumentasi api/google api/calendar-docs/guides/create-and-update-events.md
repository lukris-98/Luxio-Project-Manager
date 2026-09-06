# Guide: Create and Update Events

Alur dasar membuat, mengubah, dan membatalkan event. Referensi method: [reference-api/events.md](../reference-api/events.md); resource field: [resources/event.md](../resources/event.md).

---

## Membuat Event

```bash
# (1) sendUpdates=all -> semua peserta menerima undangan email
# (2) dateTime + offset zona eksplisit menghindari salah tafsir server
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Rapat perencanaan",
    "location": "Ruang A / https://meet.google.com/xxx-xxxx-xxx",
    "description": "Agenda: penentuan milestone",
    "start": { "dateTime": "2026-09-08T10:00:00+07:00" },
    "end":   { "dateTime": "2026-09-08T11:30:00+07:00" },
    "attendees": [
      { "email": "budi@example.com" },
      { "email": "citra@example.com" }
    ],
    "reminders": {
      "useDefault": false,
      "overrides": [ { "method": "email", "minutes": 60 } ]
    }
  }'
```

Response menyimpan tiga hal penting: `id` (`EVENT_ID`), `iCalUID`, dan `etag`.

## Varian Pembuatan

| Cara | Kapan dipakai |
|---|---|
| `insert` + JSON | Kendali penuh atas field — jalur utama |
| `quickAdd` | Input bebas pengguna: `text=Review desain besok 14:00` |
| `import` | Migrasi dari sistem lain; wajib bawa `iCalUID` sendiri |

```bash
# quickAdd: parsing bahasa natural
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/quickAdd?text=Review%20desain%20besok%2014:00" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Mengubah Event

| Metode | Perilaku |
|---|---|
| `PATCH` | Kirim hanya field yang berubah — pilihan default |
| `PUT` | Kirim resource utuh; field yang tidak dikirim bisa ter-reset |

```bash
# patch satu field + beri tahu peserta
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "start": { "dateTime": "2026-09-08T14:00:00+07:00" },
        "end":   { "dateTime": "2026-09-08T15:30:00+07:00" } }'
```

```js
// (1) update time berarti wajib kirim start DAN end berpasangan
await fetch(
  `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${EVENT_ID}?sendUpdates=all`,
  {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start: { dateTime: '2026-09-08T14:00:00+07:00' },
      end:   { dateTime: '2026-09-08T15:30:00+07:00' }
    })
  }
);
```

## Membatalkan Event

```bash
# delete = set status "cancelled" + kirim pemberitahuan pembatalan
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `sendUpdates` | `all`, `externalOnly` (hanya peserta non-Google), `none` — default `none` |
| Durasi konsisten | Ubah `start` tanpa `end` bisa menghasilkan durasi tidak sengaja berubah |
| `sequence` | Naik otomatis tiap perubahan; jangan set manual |
| Retry aman | Kirim `iCalUID` stabil saat insert ulang agar duplikat terdekteksi |
| 412 | Terjadi bila `If-Match: ETAG` kedaluwarsa — ambil ulang, lalu patch |
| Event berulang | Mengubah master ≠ mengubah instance — lihat [recurring-events.md](recurring-events.md) |

> Prinsip: `PATCH` + `sendUpdates` eksplisit + pasangan `start`/`end` selalu dikirim bersama — tiga kebiasaan yang mencegah mayoritas bug tulis event.
