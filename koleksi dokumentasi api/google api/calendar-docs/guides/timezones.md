# Guide: Timezones

Zona waktu adalah sumber bug terbanyak di Calendar API. Aturan dasarnya hanya dua: **waktu bertanggal memakai `dateTime` RFC3339**, dan **event seharian penuh memakai `date`**.

---

## Tiga Bentuk Waktu pada Event

| Bentuk | Field | Contoh | Arti |
|---|---|---|---|
| Spesifik | `start.dateTime` + `timeZone` | `2026-09-08T10:00:00+07:00` | Jam tertentu di zona tertentu |
| Seharian | `start.date` | `2026-09-08` | Tanggal penuh, tanpa zona — mengikuti zona pengguna |
| Fleksibel | `dateTime` tanpa offset + `timeZone` | `dateTime: 2026-09-08T10:00:00`, `timeZone: Asia/Jakarta` | Server menafsirkan sesuai `timeZone` |

```json
{
  "summary": "Rapat",
  "start": { "dateTime": "2026-09-08T10:00:00+07:00" },
  "end":   { "dateTime": "2026-09-08T11:00:00+07:00" }
}
```

```json
{
  "summary": "Libur Nasional",
  "start": { "date": "2026-08-17" },
  "end":   { "date": "2026-08-18" }
}
```

Aturan pasangan: `start.date`/`end.date` atau `start.dateTime`/`end.dateTime` — jangan campur `date` dan `dateTime`.

## Zona Waktu Kalender

```bash
# Zona default kalender — dipakai bila event tidak menyebut zona
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

| Sumber zona | Dipakai kapan |
|---|---|
| Offset di `dateTime` (`+07:00`) | Kapan pun — paling eksplisit |
| `start.timeZone` | Bila `dateTime` tanpa offset |
| `timeZone` kalender | Fallback terakhir |
| Parameter `timeZone` di `events.list` | Hanya memformat response, bukan filter |

## Zona Waktu Pengguna

```bash
# Preferensi pengguna — baca sekali saat init
curl "https://www.googleapis.com/calendar/v3/users/me/settings/timezone" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Query Per Zona

```bash
# (1) timeMin/timeMax menerima offset apa pun; server mengonversi ke UTC internal
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?timeMin=2026-09-01T00:00:00+07:00&timeMax=2026-10-01T00:00:00+07:00&singleEvents=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```python
# Python: selalu sertakan offset saat membuat datetime
from datetime import datetime, timedelta, timezone

wib = timezone(timedelta(hours=7))
body = {
    "summary": "Rapat lintas zona",
    "start": {"dateTime": datetime(2026, 9, 8, 10, 0, tzinfo=wib).isoformat()},   # 2026-09-08T10:00:00+07:00
    "end":   {"dateTime": datetime(2026, 9, 8, 11, 0, tzinfo=wib).isoformat()},
}
```

## Nama Zona

| Hal | Keterangan |
|---|---|
| Format | IANA, mis. `Asia/Jakarta`, `America/New_York` — bukan `WIB` |
| Field `timeZone` | Di event (`start`/`end`), di metadata kalender, di setting pengguna |
| DST | Nama IANA menangani daylight saving otomatis — offset hardcode tidak |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Bandingkan via UTC | Waktu internal aplikasi simpan UTC; tampilkan di zona pengguna |
| Event seharian | `date` mengikuti zona **penampil** — "2026-08-17" bisa mulai beda jam di zona lain |
| `timeMin`/`timeMax` | RFC3339 penuh, offset wajib untuk hasil deterministik |
| Event lintas zona | Peserta di zona berbeda melihat jam masing-masing — hanya instans waktu tunggal yang tersimpan |
| UNTIL RRULE | Selalu UTC `Z`, bukan offset lokal — lihat [recurring-events.md](recurring-events.md) |
| Tidak ada "zona event" tunggal | Event hanya punya instans waktu; zona tampilan ditentukan penampil |

> Prinsip: satu event = satu instans waktu absolut. Zona hanyalah cara menampilkan — simpan UTC, kirim offset eksplisit, tampilkan pakai IANA.
