# Reference: FreeBusy Endpoint

Satu endpoint, satu method: `POST /freeBusy`. Menerima banyak kalender sekaligus, mengembalikan blok `busy` per kalender. Struktur response dijelaskan di [resources/free-busy.md](../resources/free-busy.md); strategi penjadwalan di [guides/freebusy-and-scheduling.md](../guides/freebusy-and-scheduling.md).

---

## Signature

| Sifat | Nilai |
|---|---|
| HTTP | `POST https://www.googleapis.com/calendar/v3/freeBusy` |
| Method name | `freebusy.query` |
| Scope | scope Calendar apa pun dengan hak baca |

## Request Body

| Field | Tipe | Arti |
|---|---|---|
| `timeMin` | RFC3339 | Batas awal query (inklusif) |
| `timeMax` | RFC3339 | Batas akhir query (eksklusif) |
| `items[].id` | string | `CALENDAR_ID` atau email/group yang mau dicek |
| `calendarExpansionMax` | integer | Maks kalender diperluas (maks 50) |
| `groupExpansionMax` | integer | Maks anggota group diperluas (maks 100) |

```bash
# (1) dua kalender + satu group dalam satu panggilan
curl -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-07T00:00:00+07:00",
    "timeMax": "2026-09-07T23:59:59+07:00",
    "calendarExpansionMax": 50,
    "groupExpansionMax": 100,
    "items": [
      { "id": "CALENDAR_ID" },
      { "id": "budi@example.com" },
      { "id": "tim-luxio@groups.example.com" }
    ]
  }'
```

## Response

```json
{
  "kind": "calendar#freeBusy",
  "timeMin": "2026-09-07T00:00:00+07:00",
  "timeMax": "2026-09-07T23:59:59+07:00",
  "groups": {
    "tim-luxio@groups.example.com": {
      "errors": [],
      "calendars": [ "budi@example.com", "citra@example.com" ]
    },
    "budi@example.com": {
      "errors": [],
      "calendars": []
    }
  },
  "calendars": {
    "budi@example.com": {
      "busy": [
        { "start": "2026-09-07T09:00:00+07:00", "end": "2026-09-07T10:30:00+07:00" }
      ],
      "errors": []
    },
    "citra@example.com": {
      "busy": [],
      "errors": [ { "domain": "calendar", "reason": "notFound" } ]
    }
  }
}
```

Cara baca:

| Bagian | Arti |
|---|---|
| `groups` | Ekspansi group → daftar anggota kalendernya |
| `calendars[id].busy` | Interval sibuk terurut; tidak ada detail event |
| `calendars[id].errors[].reason` | `notFound` / `calendarNotFound` — kalender lain tetap diproses |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Bukan resource | Tidak ada get/list/patch; hanya query satu arah |
| Error per kalender | Kegagalan satu kalender tidak menggagalkan keseluruhan response |
| Event berulang | Sudah diekspansi per kemunculan di rentang query |
| Batas ekspansi | Lewat `calendarExpansionMax`/`groupExpansionMax` → hasil boleh dipotong, cek `errors` |
| Alternatif | `events.list` dengan role `freeBusyReader` tidak akan memberi detail; freeBusy memang yang tepat |

> Prinsip: perlakukan `errors` per kalender sebagai data, bukan exception — laporan ketersediaan tetap valid untuk kalender yang berhasil.
