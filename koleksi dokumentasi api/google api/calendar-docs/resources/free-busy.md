# Resource: Free/Busy

Free/Busy bukan resource yang bisa di-CRUD — ia adalah **hasil query satu arah**: `POST /freeBusy` menerima daftar kalender + rentang waktu, lalu mengembalikan blok-blok `busy` per kalender. Tidak ada endpoint get/list per baris; tidak ada perubahan yang bisa ditulis.

Referensi endpoint: [reference-api/freebusy.md](../reference-api/freebusy.md) · Panduan lengkap: [guides/freebusy-and-scheduling.md](../guides/freebusy-and-scheduling.md)

---

## Bentuk Response

```json
{
  "timeMin": "2026-09-06T00:00:00Z",
  "timeMax": "2026-09-13T00:00:00Z",
  "calendars": {
    "budi@example.com": {
      "busy": [
        { "start": "2026-09-07T09:00:00+07:00", "end": "2026-09-07T10:00:00+07:00" },
        { "start": "2026-09-07T13:30:00+07:00", "end": "2026-09-07T15:00:00+07:00" }
      ]
    },
    "kalender-tidak-ada@example.com": {
      "busy": [],
      "errors": [ { "domain": "calendar", "reason": "notFound" } ]
    }
  }
}
```

Cara membaca:

| Bagian | Arti |
|---|---|
| `timeMin` / `timeMax` | Rentang yang benar-benar dipakai server (echo dari request) |
| `calendars[CALENDAR_ID].busy` | Interval sibuk, berurutan, tanpa detail event |
| `busy[i].start/end` | RFC3339, offset sesuai zona masing-masing event |
| `errors[].reason` | `notFound` bila kalender tidak ada/tak punya izin; kalender lain tetap diproses |

## Contoh Request

```bash
# (1) satu request bisa menampung banyak kalender sekaligus
curl -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-07T00:00:00+07:00",
    "timeMax": "2026-09-08T00:00:00+07:00",
    "items": [
      { "id": "CALENDAR_ID" },
      { "id": "budi@example.com" }
    ]
  }'
```

## Batasan Ekspansi

| Parameter | Batas | Arti |
|---|---|---|
| `items` (jumlah) | sampai `calendarExpansionMax` | Banyaknya kalender per query |
| `calendarExpansionMax` | maks 50 | Kalender yang diperluas per query |
| `groupExpansionMax` | maks 100 | Anggota group yang diperluas bila `items` berisi group |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Granularitas | Hanya interval `busy` — tidak ada judul, peserta, atau status event |
| Event private | Event dengan visibility private tetap ikut mengisi `busy` selama akses cukup |
| Role minimum | `freeBusyReader` pada kalender bersama sudah cukup |
| Event berulang | Sudah diekspansi menjadi interval per kemunculan |
| Jangan dipakai untuk detail | Untuk data event lengkap gunakan `events.list` — lihat [resources/event.md](event.md) |

> Prinsip: free/busy adalah bahasa pergantian jadwal antar orang — yang dibagikan hanya "kapan sibuk", bukan "apa isinya".
