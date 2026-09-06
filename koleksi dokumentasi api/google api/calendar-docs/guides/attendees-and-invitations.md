# Guide: Attendees and Invitations

Peserta (`attendees`) adalah cara Calendar API mengirim undangan: tambah peserta + `sendUpdates=all` = email undangan. Status balasan (`responseStatus`) mengalir balik ke resource.

Referensi method: [reference-api/events.md](../reference-api/events.md).

---

## Struktur Peserta

| Field | Arti |
|---|---|
| `email` | Kunci peserta — satu-satunya field wajib |
| `displayName` | Nama tampilan |
| `responseStatus` | `needsAction`, `accepted`, `tentative`, `declined` |
| `organizer` | `true` pada pemilik event (biasanya kalender tempat event dibuat) |
| `self` | `true` bila peserta = akun pemilik token |
| `optional` | `true` = kehadiran opsional; default wajib |
| `resource` | `true` untuk ruang rapat/peralatan |
| `comment` | Catatan balasan peserta |

```json
{
  "attendees": [
    { "email": "budi@example.com", "displayName": "Budi" },
    { "email": "citra@example.com", "optional": true },
    { "email": "ruang-a@example.com", "resource": true }
  ],
  "guestsCanInviteOthers": false,
  "guestsCanSeeGuests": true,
  "guestsCanModify": false
}
```

## Mengirim dan Mengelola Undangan

```bash
# (1) insert + sendUpdates=all = undangan email terkirim ke semua peserta
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Kickoff proyek",
    "start": { "dateTime": "2026-09-09T13:00:00+07:00" },
    "end":   { "dateTime": "2026-09-09T14:00:00+07:00" },
    "attendees": [
      { "email": "budi@example.com" },
      { "email": "tamam@gmail.com" }
    ]
  }'

# Tambah peserta ke event yang sudah ada (PATCH attendees lengkap)
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "attendees": [
        { "email": "budi@example.com" },
        { "email": "tamam@gmail.com" },
        { "email": "dedi@example.com" }
      ] }'
```

## Pilihan `sendUpdates`

| Nilai | Efek |
|---|---|
| `all` | Email ke semua peserta yang terdampak perubahan |
| `externalOnly` | Hanya peserta non-Google (di luar domain/di luar Google) |
| `none` | Tanpa email — perubahan senyap |

## Status Balasan (RSVP)

```bash
# Lihat status balasan
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```js
const ev = await res.json();
const ringkasan = ev.attendees.map(a =>
  `${a.email}: ${a.responseStatus}`                 // (1) needsAction -> belum membalas
);
// Perubahan RSVP oleh peserta tercermin di sini setelah mereka membalas lewat email/UI
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| PATCH = daftar utuh | Field `attendees` selalu diganti seluruhnya — kirim daftar lengkap, bukan tambahan |
| `maxAttendees` | Batasi jumlah peserta di response; indeks peserta di luar batas dihilangkan |
| Peserta non-Google | Email di luar Google tetap valid; butuh `externalOnly` bila tidak mau notifikasi Google |
| Kepemilikan | `organizer` ditentukan server — tidak bisa di-set arbitrer saat insert |
| `guestsCanModify` | `true` = peserta bisa mengubah event (jam, agenda) |
| `attendeesOmitted` | `true` = daftar peserta dipotong oleh `maxAttendees` |
| Duplikat undangan | Retry insert tanpa `iCalUID` tetap bisa membuat event ganda — kirim `iCalUID` stabil |

> Prinsip: undangan = data + `sendUpdates`; pisahkan keduanya saat debugging — "peserta tidak menerima email" hampir selalu karena `sendUpdates` tidak diset.
