# Resource: `Calendar`

Metadata sebuah kalender itu sendiri — global, sama untuk semua user yang mengaksesnya.

- `kind`: `calendar#calendar`
- Endpoint: `/calendars`
- Referensi resmi: https://developers.google.com/workspace/calendar/api/v3/reference/calendars

Bedakan dengan [`CalendarListEntry`](calendar-list-entry.md), yang menyimpan preferensi **per user** atas kalender yang sama.

---

## 1. Tabel Field

| Field | Tipe | Arti | Akses |
|---|---|---|---|
| `kind` | string | Selalu `"calendar#calendar"` | read-only |
| `etag` | etag | ETag resource | read-only |
| `id` | string | Identifier kalender. Untuk mendapatkannya panggil `calendarList.list` | read-only |
| `summary` | string | Judul kalender. **Wajib** saat `calendars.insert` | writable |
| `description` | string | Deskripsi kalender | writable |
| `location` | string | Lokasi geografis kalender sebagai teks bebas | writable |
| `timeZone` | string | Zona waktu kalender, format nama IANA Time Zone Database (mis. `"Asia/Jakarta"`) | writable |
| `dataOwner` | string | Email pemilik data kalender. Hanya diisi untuk kalender **sekunder** | read-only |
| `conferenceProperties` | object | Properti konferensi kalender ini | read-only |
| `conferenceProperties.allowedConferenceSolutionTypes[]` | list&lt;string&gt; | Jenis solusi konferensi yang didukung: `eventHangout`, `eventNamedHangout`, `hangoutsMeet` | read-only |
| `labelProperties` | object | Definisi label acara pada kalender ini. Bila dikirim saat update, **menimpa** seluruh definisi lama; bila tidak dikirim, tetap tidak berubah | writable |
| `labelProperties.eventLabels[]` | list&lt;object&gt; | Daftar label acara. Maksimum 200 per kalender. Menambah item = membuat label baru; menghapus item = menghapus label | writable |
| `labelProperties.eventLabels[].id` | string | Id label. Opsional saat menambah (server membuat bila kosong), **wajib** saat memperbarui label yang ada. Harus unik dalam kalender dan mengikuti format UUID | writable |
| `labelProperties.eventLabels[].name` | string | Nama label, maksimum 50 karakter. Opsional | writable |
| `labelProperties.eventLabels[].backgroundColor` | string | Warna latar label dalam heksadesimal, mis. `"#039be5"`. Acara berlabel ini ditampilkan dengan warna tersebut. **Wajib** | writable |
| `autoAcceptInvitations` | boolean | Apakah kalender otomatis menerima undangan. Hanya berlaku untuk kalender resource | read-only |

---

## 2. Contoh JSON

```json
{
  "kind": "calendar#calendar",
  "etag": "\"BdCFYVdI...\"",
  "id": "c_1a2b3c4d5e@group.calendar.google.com",
  "summary": "Luxio — Deadline Task",
  "description": "Kalender khusus deadline task dari aplikasi Luxio.",
  "location": "Jakarta, Indonesia",
  "timeZone": "Asia/Jakarta",
  "dataOwner": "saya@example.com",
  "conferenceProperties": {
    "allowedConferenceSolutionTypes": [ "hangoutsMeet" ]
  },
  "labelProperties": {
    "eventLabels": [
      { "id": "3f6d2c74-1a9e-4b2f-9c31-8d4b5e6f7a80", "name": "Prioritas tinggi", "backgroundColor": "#d50000" },
      { "id": "7c1b9a52-4d8e-4f10-a3b6-2e5c7d9f1042", "name": "Riset",           "backgroundColor": "#039be5" }
    ]
  }
}
```

Kalender **utama** user terlihat seperti ini (tanpa `dataOwner`):

```json
{
  "kind": "calendar#calendar",
  "id": "saya@example.com",
  "summary": "saya@example.com",
  "timeZone": "Asia/Jakarta",
  "conferenceProperties": { "allowedConferenceSolutionTypes": [ "hangoutsMeet" ] }
}
```

---

## 3. Field Read-Only vs Writable

| Writable | Read-only |
|---|---|
| `summary` (wajib saat insert), `description`, `location`, `timeZone`, `labelProperties` | `kind`, `etag`, `id`, `dataOwner`, `conferenceProperties`, `autoAcceptInvitations` |

---

## 4. Operasi Umum

```bash
# Membaca metadata kalender. calendarId 'primary' = kalender utama user login.
curl "https://www.googleapis.com/calendar/v3/calendars/primary" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Membuat kalender sekunder. Hanya summary yang wajib; timeZone sangat disarankan.
curl -X POST "https://www.googleapis.com/calendar/v3/calendars" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "summary": "Luxio — Deadline Task", "timeZone": "Asia/Jakarta" }'
# → simpan field id sebagai CALENDAR_ID milik aplikasi.

# Mengubah judul & timezone. PATCH lebih aman daripada PUT.
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "summary": "Luxio — Deadline & Milestone", "timeZone": "Asia/Jakarta" }'

# Menghapus kalender SEKUNDER beserta seluruh acaranya.
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Mengosongkan kalender UTAMA (kalender utama tidak bisa dihapus).
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/primary/clear" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

> Catatan: `calendars.clear` menghapus **semua** acara pada kalender utama sebuah akun. Operasi ini tidak bisa dibatalkan.

---

## 5. Label Acara (`labelProperties`)

Label acara adalah pengganti berbasis-id untuk `colorId`. Alurnya dua langkah:

```bash
# LANGKAH 1 — definisikan label pada kalender.
#   labelProperties MENIMPA seluruh daftar: kirim juga label lama yang ingin dipertahankan.
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "labelProperties": {
      "eventLabels": [
        { "name": "Prioritas tinggi", "backgroundColor": "#d50000" },
        { "name": "Riset",            "backgroundColor": "#039be5" }
      ]
    }
  }'
# → respons memuat id UUID yang dibuat server untuk setiap label.

# LANGKAH 2 — pasang label ke acara. eventLabelVersion=1 WAJIB, kalau tidak eventLabelId diabaikan.
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?eventLabelVersion=1" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "eventLabelId": "3f6d2c74-1a9e-4b2f-9c31-8d4b5e6f7a80" }'
# eventLabelId string kosong atau tidak diisi = label dilepas dari acara.
```

> Prinsip: `eventLabelId` menggantikan `colorId`. Bila `eventLabelVersion=1` dikirim, `colorId` diabaikan. Jangan mencampur keduanya dalam satu aplikasi.

---

## 6. Perbedaan dengan `CalendarListEntry`

| Aspek | `Calendar` | `CalendarListEntry` |
|---|---|---|
| Cakupan | Global, satu baris per kalender | Per user, satu baris per (user, kalender) |
| Judul | `summary` (writable, berlaku untuk semua) | `summary` (read-only) + `summaryOverride` (writable, hanya untuk saya) |
| Timezone | `timeZone` writable | `timeZone` read-only (mirror dari Calendar) |
| Warna | Tidak ada | `colorId`, `backgroundColor`, `foregroundColor` |
| Pengingat default | Tidak ada | `defaultReminders[]` |
| Peran akses | Tidak ada | `accessRole` (read-only) |
| Tampil/sembunyi di UI | Tidak ada | `hidden`, `selected` |
| Menghapus | `DELETE /calendars/{id}` → kalender hilang | `DELETE /users/me/calendarList/{id}` → hanya unsubscribe |

Detail: [calendar-list-entry.md](calendar-list-entry.md) dan [../getting-started/overview.md](../getting-started/overview.md).

Endpoint & parameter: [../reference-api/calendars.md](../reference-api/calendars.md).
