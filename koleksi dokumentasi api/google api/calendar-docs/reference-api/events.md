# Reference: Events Endpoints

Semua method pada koleksi `events` bekerja pada satu kalender tertentu (`CALENDAR_ID`). Resource lengkap dijelaskan di [resources/event.md](../resources/event.md); pola tulis lanjutan di [guides/create-and-update-events.md](../guides/create-and-update-events.md).

---

## Daftar Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `list` | `GET /calendars/CALENDAR_ID/events` | Daftar event dengan filter waktu/teks |
| `get` | `GET /calendars/CALENDAR_ID/events/EVENT_ID` | Satu event |
| `insert` | `POST /calendars/CALENDAR_ID/events` | Buat event |
| `update` | `PUT /calendars/CALENDAR_ID/events/EVENT_ID` | Ganti seluruh event |
| `patch` | `PATCH /calendars/CALENDAR_ID/events/EVENT_ID` | Ubah sebagian field |
| `delete` | `DELETE /calendars/CALENDAR_ID/events/EVENT_ID` | Batalkan event |
| `quickAdd` | `POST /calendars/CALENDAR_ID/events/quickAdd?text=...` | Buat event dari teks natural |
| `import` | `POST /calendars/CALENDAR_ID/events/import` | Impor event dengan `iCalUID` eksplisit |
| `move` | `POST /calendars/CALENDAR_ID/events/EVENT_ID/move?destination=...` | Pindahkan antar kalender |
| `instances` | `GET /calendars/CALENDAR_ID/events/EVENT_ID/instances` | Ekspansi event berulang |
| `watch` | `POST /calendars/CALENDAR_ID/events/watch` | Push notification — [channels.md](channels.md) |

## Parameter `list` yang Penting

| Parameter | Arti |
|---|---|
| `timeMin` / `timeMax` | Rentang RFC3339; wajib dipasangkan untuk hasil yang stabil |
| `q` | Pencarian teks bebas (judul, deskripsi, lokasi, peserta) |
| `singleEvents` | `true` = ekspansi event berulang menjadi instance |
| `orderBy` | `startTime` (wajib `singleEvents=true`) atau `updated` |
| `showDeleted` | Sertakan event berstatus `cancelled` |
| `updatedMin` | Hanya event berubah setelah waktu ini |
| `syncToken` | Sinkronisasi inkremental — [guides/sync-tokens.md](../guides/sync-tokens.md) |
| `maxResults` | Maks 2500 per halaman (lihat [guides/pagination.md](../guides/pagination.md)) |
| `iCalUID` | Cari berdasarkan ID kalender standar iCalendar |
| `eventTypes` | Filter: `default`, `focusTime`, `outOfOffice`, `workingLocation`, `birthday`, `fromGmail` |
| `timeZone` | Zona untuk format `start/end` di response |

## Parameter Tulis yang Penting

| Parameter | Berlaku di | Arti |
|---|---|---|
| `sendUpdates` | insert/update/patch/delete | `all` (kirim email ke semua peserta), `externalOnly` (hanya non-Google), `none` |
| `conferenceDataVersion` | insert/update/patch | `1` = izinkan tulis `conferenceData` |
| `maxAttendees` | semua method | Batasi jumlah peserta yang dikembalikan |
| `destination` | move | `CALENDAR_ID` tujuan |

## Contoh Utama

```bash
# List rentang waktu, tanpa ekspansi berulang
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?timeMin=2026-09-01T00:00:00+07:00&timeMax=2026-10-01T00:00:00+07:00&singleEvents=true&orderBy=startTime" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Buat event dengan peserta dan reminder
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Rapat sprint",
    "start": { "dateTime": "2026-09-08T10:00:00+07:00" },
    "end":   { "dateTime": "2026-09-08T11:00:00+07:00" },
    "attendees": [ { "email": "budi@example.com" } ],
    "reminders": { "useDefault": false, "overrides": [ { "method": "popup", "minutes": 10 } ] }
  }'

# Patch satu field
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "location": "Ruang A" }'

# Batalkan (cancel, bukan hapus fisik)
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `delete` ≠ hapus fisik | Event berubah status `cancelled`; muncul kembali via `showDeleted=true` |
| `quickAdd` | Butuh `text` param; hasil parsing tercepat dalam bahasa Inggris |
| `import` | Untuk data dari sistem lain; harus menyertakan `iCalUID` |
| Rentang maksimum | `singleEvents=true` membatasi jarak `timeMin`–`timeMax`; gunakan pagination bila perlu |
| `sendUpdates` default | Tanpa parameter, tidak ada email undangan yang dikirim |

> Prinsip: pakai `patch` untuk perubahan sebagian dan selalu sengaja memilih `sendUpdates` — "tanpa parameter" berarti peserta tidak diberi tahu.
