# Guide: Reminders and Notifications

Dua mekanisme berbeda yang sering tertukar:

- **Reminder** — alarm di perangkat pengguna (`popup`/`email`) milik event atau default kalender.
- **Notification** — email otomatis dari server saat event berubah (undangan, update, pembatalan), dikendalikan `sendUpdates` dan `notificationSettings`.

Referensi resource: [resources/event.md](../resources/event.md), [resources/calendar-list-entry.md](../resources/calendar-list-entry.md).

---

## Reminder pada Event

| Field | Arti |
|---|---|
| `reminders.useDefault` | `true` = pakai reminder default kalender, `overrides` diabaikan |
| `reminders.overrides[]` | Daftar reminder eksplisit |
| `overrides[].method` | `popup` atau `email` |
| `overrides[].minutes` | Menit sebelum `start` (0–40320 = 4 pekan) |

```bash
# (1) useDefault=false wajib supaya overrides dipakai
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Deadline submission",
    "start": { "dateTime": "2026-09-10T09:00:00+07:00" },
    "end":   { "dateTime": "2026-09-10T09:30:00+07:00" },
    "reminders": {
      "useDefault": false,
      "overrides": [
        { "method": "email",  "minutes": 1440 },
        { "method": "popup",  "minutes": 15 }
      ]
    }
  }'
```

## Reminder Default Kalender

Reminder default adalah properti **entri calendarList** pengguna — bukan properti kalender global. Lihat [reference-api/calendar-list.md](../reference-api/calendar-list.md).

```bash
# Ubah default reminder satu langganan kalender
curl -X PATCH "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultReminders": [
      { "method": "popup", "minutes": 10 }
    ]
  }'
```

Event tanpa `reminders` eksplisit mewarisi `defaultReminders` ini — dan `defaultReminders` yang dikembalikan `events.list` mencerminkan penerapannya.

## Notification Email Saat Event Berubah

```bash
# (1) setiap perubahan berikutnya otomatis men-trigger email ke peserta
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "location": "Ruang B" }'
```

## Notifikasi Tingkat Kalender (Langganan)

`notificationSettings` pada calendarList mengatur email per tipe perubahan pada kalender yang dilanggani:

```bash
curl -X PATCH "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationSettings": {
      "notifications": [
        { "type": "eventCreation",  "method": "email" },
        { "type": "eventChange",    "method": "email" },
        { "type": "eventCancellation", "method": "email" },
        { "type": "eventResponse",  "method": "email" }
      ]
    }
  }'
```

| `type` | Trigger |
|---|---|
| `eventCreation` | Event baru dibuat di kalender |
| `eventChange` | Event diubah |
| `eventCancellation` | Event dibatalkan |
| `eventResponse` | Peserta membalas undangan |
| `agenda` | Email agenda harian |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Reminder vs notification | Reminder = alarm lokal pengguna; notification = email server |
| Reminder event ≠ reminder kalender | `overrides` per event; `defaultReminders` per langganan kalender |
| Bukan API pengirim | Reminder dieksekusi klien Calendar (web/mobile), bukan oleh server API — aplikasi pihak ketiga tidak menerima trigger reminder |
| Butuh notifikasi programatik | Bangun sendiri: `events.list` mendatang + scheduler aplikasi |
| Popup hanya klien Google | `method: popup` tampil di Calendar web/aplikasi resmi |
| `minutes: 0` | Valid — alarm tepat pada jam mulai |

> Prinsip: reminder adalah preferensi tampilan klien, bukan webhook — jangan mengandalkan reminder API sebagai mekanisme pemicu logika aplikasi.
