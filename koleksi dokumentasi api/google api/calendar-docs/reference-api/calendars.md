# Reference: Calendars Endpoints

Endpoint `calendars.*` mengelola **metadata kalender itu sendiri** — nama, deskripsi, lokasi, zona waktu. Ini berbeda dari `calendarList.*` yang mengelola daftar langganan di UI pengguna; perbedaan lengkap ada di [reference-api/calendar-list.md](calendar-list.md).

---

## Daftar Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `insert` | `POST /calendars` | Buat kalender baru |
| `get` | `GET /calendars/CALENDAR_ID` | Metadata satu kalender |
| `update` | `PUT /calendars/CALENDAR_ID` | Ganti seluruh metadata |
| `patch` | `PATCH /calendars/CALENDAR_ID` | Ubah sebagian metadata |
| `delete` | `DELETE /calendars/CALENDAR_ID` | Hapus kalender permanen |
| `clear` | `POST /calendars/CALENDAR_ID/clear` | Hapus semua event, kalender tetap ada |

## Struktur Resource

| Field | Tipe | Arti |
|---|---|---|
| `kind` | string | Selalu `calendar#calendar` |
| `id` | string | Email kalender; otomatis saat dibuat |
| `etag` | string | Versi resource |
| `summary` | string | Nama kalender |
| `description` | string | Deskripsi bebas |
| `location` | string | Lokasi bebas (teks) |
| `timeZone` | string | IANA, mis. `Asia/Jakarta` — baca [guides/timezones.md](../guides/timezones.md) |
| `conferenceProperties` | object | Tipe konferensi yang diizinkan — [guides/conference-and-meet.md](../guides/conference-and-meet.md) |

## Contoh

```bash
# (1) membuat kalender baru: waktu/lokasi server menentukan id
curl -X POST "https://www.googleapis.com/calendar/v3/calendars" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Proyek Luxio",
    "description": "Kalender milestone proyek",
    "timeZone": "Asia/Jakarta"
  }'
# Response berisi "id": "abc123...@group.calendar.google.com" -> simpan sebagai CALENDAR_ID

# Baca metadata
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Patch zona waktu saja
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "timeZone": "Asia/Singapore" }'

# Kosongkan seluruh event (kalender tetap hidup, ACL tetap utuh)
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/clear" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Hapus kalender permanen
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Scope | Butuh `calendar` atau `calendar.calendars` — scope `events` tidak cukup untuk mengubah metadata |
| `delete` permanen | Tidak ada undo; pemilik berhenti, peserta lain kehilangan akses |
| `clear` vs `delete` | `clear` hanya untuk kalender milik sendiri; mengosongkan event, bukan kalender |
| Zona waktu `timeZone` | Menjadi default untuk event tanpa offset eksplisit |
| `CALENDAR_ID` baru | Tidak otomatis muncul di UI pengguna — langgani via `calendarList.insert` |
| Field `update` | `PUT` menuntut resource lengkap; pakai `PATCH` bila hanya mengubah beberapa field |

> Prinsip: membuat kalender dan melanggannya adalah dua langkah terpisah — `calendars.insert` lalu `calendarList.insert`.
