# Guides: Kemampuan dan Alur

Indeks panduan praktis Calendar API v3. Setiap file membahas satu alur kerja end-to-end dengan contoh bash/js/python yang bisa langsung disesuaikan.

Referensi endpoint per resource: [reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md) · Definisi resource: folder [resources/](../resources/event.md)

---

## Peta Panduan

| Panduan | Topik | Kapan dipakai |
|---|---|---|
| [create-and-update-events.md](create-and-update-events.md) | CRUD event, `patch` vs `update`, `sendUpdates` | Basis semua integrasi |
| [recurring-events.md](recurring-events.md) | Aturan RRULE, ekspansi instance, edit satu kemunculan | Jadwal rutin |
| [attendees-and-invitations.md](attendees-and-invitations.md) | Peserta, RSVP, `sendUpdates` | Rapat lintas akun |
| [reminders-and-notifications.md](reminders-and-notifications.md) | `reminders` vs notification, default per kalender | Alarm & pemberitahuan |
| [timezones.md](timezones.md) | `dateTime` vs `date`, offset vs `timeZone` | Sumber bug nomor satu |
| [freebusy-and-scheduling.md](freebusy-and-scheduling.md) | Cari slot kosong antar banyak orang | Penjadwalan otomatis |
| [sync-tokens.md](sync-tokens.md) | Sinkronisasi inkremental `nextSyncToken` | Mirror data efisien |
| [push-notifications.md](push-notifications.md) | Channel web_hook + reaksi sync token | Update real-time |
| [conference-and-meet.md](conference-and-meet.md) | `conferenceData`, Google Meet | Rapat daring |
| [pagination.md](pagination.md) | `pageToken`, `maxResults` | List besar |
| [error-handling.md](error-handling.md) | Kode error umum, retry, backoff | Produksi |

## Alur Membaca yang Disarankan

1. **Pemula** — [create-and-update-events.md](create-and-update-events.md) → [timezones.md](timezones.md) → [error-handling.md](error-handling.md).
2. **Integrasi sinkronisasi** — [sync-tokens.md](sync-tokens.md) → [push-notifications.md](push-notifications.md) → [pagination.md](pagination.md).
3. **Aplikasi penjadwalan** — [freebusy-and-scheduling.md](freebusy-and-scheduling.md) → [attendees-and-invitations.md](attendees-and-invitations.md) → [conference-and-meet.md](conference-and-meet.md).

## Alur Kerja End-to-End Tipikal

```text
OAuth (dapat ACCESS_TOKEN)
   |
   v
calendarList.list  -> pilih CALENDAR_ID
   |
   +--> events.list (syncToken pertama) -> simpan nextSyncToken
   |         ^
   |         | (saat ada notifikasi / polling)
   +--> events.list (syncToken) -> delta perubahan
   |
   +--> freeBusy.query -> slot kosong
   |         |
   |         v
   |     events.insert (dengan attendees + conferenceData, sendUpdates=all)
   |
   +--> channels.watch -> push notification
```

## Kerangka Autentikasi

```bash
# (1) semua contoh di folder guides mengasumsikan token sudah didapat lewat OAuth 2.0
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Basis URL | `https://www.googleapis.com/calendar/v3/` untuk semua panduan |
| Placeholder | `ACCESS_TOKEN`, `CALENDAR_ID`, `EVENT_ID` — ganti dengan nilai asli |
| Scope minimal | Pilih scope selempit yang menutupi kebutuhan; lihat tabel scope di [reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md) |
| Idempotensi | Simpan `etag`/`iCalUID` untuk hindari duplikat saat retry |

> Prinsip: baca panduan sesuai alur kerja, bukan berurutan abjad — setiap file saling bertaut ke endpoint yang ia pakai.
