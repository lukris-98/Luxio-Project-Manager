# Guide: Conference and Meet

`conferenceData` menempelkan ruang konferensi (Google Meet atau pihak ketiga) ke event. Menulis field ini butuh parameter `conferenceDataVersion=1` pada insert/patch/update.

Referensi endpoint: [reference-api/events.md](../reference-api/events.md); properti kalender terkait: [reference-api/calendars.md](../reference-api/calendars.md).

---

## Struktur `conferenceData`

| Field | Arti |
|---|---|
| `createRequest.conferenceSolutionKey.type` | Tipe yang diminta: `eventHangout`, `eventNamedHangout`, `hangoutsMeet` |
| `createRequest.requestId` | ID unik buatan aplikasi — idempotensi pembuatan ruang |
| `createRequest.status.statusCode` | `success` setelah server membuat ruang |
| `entryPoints[]` | Daftar cara masuk: `video`, `phone`, `more`, `sip` |
| `entryPoints[].uri` | URL/nomor masuk |
| `conferenceSolution` | Solusi terpilih + nama tampilan |
| `parameters.addOnParameters.parameters` | Parameter add-on opsional |

## Membuat Event dengan Meet

```bash
# (1) conferenceDataVersion=1 WAJIB — tanpa ini conferenceData diabaikan
# (2) requestId acak-stabil: retry dengan requestId sama tidak membuat ruang ganda
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?conferenceDataVersion=1&sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Rapat mingguan",
    "start": { "dateTime": "2026-09-09T10:00:00+07:00" },
    "end":   { "dateTime": "2026-09-09T11:00:00+07:00" },
    "attendees": [ { "email": "budi@example.com" } ],
    "conferenceData": {
      "createRequest": {
        "conferenceSolutionKey": { "type": "hangoutsMeet" },
        "requestId": "LUXIO-2026-09-09-001"
      }
    }
  }'
```

Response `conferenceData` yang sudah jadi:

```json
{
  "conferenceData": {
    "createRequest": { "status": { "statusCode": "success" } },
    "conferenceSolution": {
      "key": { "type": "hangoutsMeet" },
      "name": "Google Meet"
    },
    "entryPoints": [
      { "entryPointType": "video", "uri": "https://meet.google.com/abc-defg-hij", "label": "meet.google.com/abc-defg-hij" }
    ]
  }
}
```

## Menambah Meet ke Event yang Sudah Ada

```bash
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?conferenceDataVersion=1&sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conferenceData": {
      "createRequest": {
        "conferenceSolutionKey": { "type": "hangoutsMeet" },
        "requestId": "LUXIO-EVENT-ADD-002"
      }
    }
  }'
```

## Menyalin conferenceData Antar Event

Tidak perlu `createRequest` — salin langsung `conferenceData` yang sudah jadi dari event sumber:

```js
const src = await fetch(
  `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${EVENT_ID}`,
  { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
).then(r => r.json());

// (1) menyalin entryPoints + solution ke event baru; tanpa createRequest
const copy = {
  summary: 'Clone rapat',
  start: src.start,
  end:   src.end,
  conferenceData: src.conferenceData
};
```

## Ketersediaan Tipe Konferensi

`conferenceProperties.allowedConferenceSolutionTypes` di metadata kalender menentukan tipe yang boleh dibuat:

| Tipe | Keterangan |
|---|---|
| `hangoutsMeet` | Google Meet — tersedia untuk akun Google |
| `eventNamedHangout` | Hangout klasik (deprecated pada banyak akun) |
| `eventHangout` | Hangout spontan (deprecated pada banyak akun) |

```bash
# Cek tipe yang diizinkan
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `conferenceDataVersion` | `1` untuk menulis; tanpa parameter, field conferenceData diabaikan saat tulis |
| `statusCode` | Bisa `pending` lalu `success` — polling `events.get` bila belum sukses |
| `requestId` wajib unik | Pakai format deterministik dari data aplikasi |
| Menghapus Meet | Kirim `conferenceData: null` via patch dengan version=1 |
| Add-on pihak ketiga | Tipe lain butuh add-on terpasang di domain; cek `allowedConferenceSolutionTypes` |
| Invite otomatis | Peserta Google menerima link Meet dalam undangan yang sama |

> Prinsip: jangan pernah menulis link Meet secara manual ke field `location` — biarkan `conferenceData` mengelola ruang, lalu tampilkan `entryPoints` dari response.
