# Guide: Recurring Events

Event berulang memakai aturan **RRULE** standar iCalendar (RFC 5545) pada field `recurrence`. Satu event master menyimpan aturan; kemunculannya diekspansi saat dibaca atau diakses lewat `instances`.

Referensi method: [reference-api/events.md](../reference-api/events.md).

---

## Membuat Event Berulang

```bash
# (1) recurrence adalah ARRAY of string: RRULE, EXDATE, atau RDATE
# (2) BYDAY=MO,WE,FR -> Senin/Rabu/Jumat; COUNT membatasi jumlah kemunculan
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Standup harian",
    "start": { "dateTime": "2026-09-07T09:00:00+07:00" },
    "end":   { "dateTime": "2026-09-07T09:15:00+07:00" },
    "recurrence": [
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12"
    ]
  }'
```

## Contoh RRULE Umum

| Kebutuhan | RRULE |
|---|---|
| Tiap hari | `RRULE:FREQ=DAILY` |
| Senin–Jumat kerja | `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| Tiap 2 minggu hari Senin | `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO` |
| Tanggal 1 tiap bulan | `RRULE:FREQ=MONTHLY;BYMONTHDAY=1` |
| Senin pertama tiap bulan | `RRULE:FREQ=MONTHLY;BYDAY=1MO` |
| Tiap tahun 17 Agustus | `RRULE:FREQ=YEARLY;BYMONTHDAY=17;BYMONTH=8` |
| Sampai tanggal tertentu | `RRULE:FREQ=DAILY;UNTIL=20261231T235959Z` |
| Kecuali tanggal tertentu | `"EXDATE;TZID=Asia/Jakarta:20260914T090000"` |

## Membaca: Master vs Instance

```bash
# Daftar instance saja dalam rentang (singleEvents=true mengekspansi RRULE)
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?timeMin=2026-09-01T00:00:00+07:00&timeMax=2026-09-30T23:59:59+07:00&singleEvents=true&orderBy=startTime" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Karakteristik hasil:

| Bentuk | `id` | `recurringEventId` |
|---|---|---|
| Master | `EVENT_ID` | tidak ada |
| Instance hasil ekspansi | `EVENT_ID_waktuMulaiZ` | `EVENT_ID` master |

```bash
# Ekspansi eksplisit satu master
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID/instances?timeMin=2026-09-01T00:00:00+07:00&timeMax=2026-09-30T00:00:00+07:00" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Mengubah Satu Kemunculan

```bash
# (1) PATCH instance (id instance hasil singleEvents) -> server otomatis membuat EXCEPTION
# (2) instance menjadi "pencabutan" dari pola: punya start/end sendiri
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID_instanceStartTimeZ" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "summary": "Standup - diganti design review" }'
```

Membatalkan satu kemunculan tanpa menggesernya — set status `cancelled` pada instance:

```bash
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID_instanceStartTimeZ" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "cancelled" }'
```

## Mengubah Seluruh Deret

```bash
# PATCH master -> berlaku untuk semua kemunculan yang tidak menjadi exception
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "location": "Ruang B" }'
```

```python
# Python: daftar instance dari satu master
import requests

params = {"timeMin": "2026-09-01T00:00:00+07:00", "timeMax": "2026-10-01T00:00:00+07:00"}
r = requests.get(
    f"https://www.googleapis.com/calendar/v3/calendars/{CALENDAR_ID}/events/{EVENT_ID}/instances",
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    params=params,
)
r.raise_for_status()
for inst in r.json()["items"]:
    print(inst["id"], inst["start"]["dateTime"])   # (1) id instance dipakai untuk PATCH per kemunculan
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `UNTIL` selalu UTC | Format `20261231T235959Z`, bukan offset lokal |
| `EXDATE` harus persis | Waktu harus sama dengan kemunculan asli (termasuk `TZID`) |
| Exception disimpan | Server membuat instance `cancelled` di master untuk tanggal yang dimodifikasi/dibatalkan |
| `singleEvents` & sync | Hasil ekspansi tidak bisa dipakai dengan `syncToken` — lihat [sync-tokens.md](sync-tokens.md) |
| Mengubah pola | Mengganti `recurrence` di master membangun ulang deret; exception lama bisa hilang |
| Peserta | `sendUpdates=all` pada master mengirim perubahan untuk seluruh deret |

> Prinsip: simpan RRULE sebagai string apa adanya — jangan coba memecah aturan berulang jadi banyak event terpisah, kecuali polanya benar-benar tidak beraturan.
