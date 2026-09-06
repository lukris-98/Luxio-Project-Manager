# Reference: CalendarList Endpoints

`calendarList` adalah **daftar langganan kalender milik satu pengguna** — apa yang muncul di sidebar UI Google Calendar. Resource detail: [resources/calendar-list-entry.md](../resources/calendar-list-entry.md); metadata kalender sesungguhnya: [reference-api/calendars.md](calendars.md).

---

## Daftar Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `list` | `GET /users/me/calendarList` | Semua langganan pengguna |
| `insert` | `POST /users/me/calendarList` | Langgani kalender yang sudah ada |
| `get` | `GET /users/me/calendarList/CALENDAR_ID` | Satu entri langganan |
| `update` | `PUT /users/me/calendarList/CALENDAR_ID` | Ganti seluruh entri |
| `patch` | `PATCH /users/me/calendarList/CALENDAR_ID` | Ubah sebagian entri |
| `delete` | `DELETE /users/me/calendarList/CALENDAR_ID` | Berhenti langganan (kalender tidak terhapus) |
| `watch` | `POST /users/me/calendarList/watch` | Push notification — [reference-api/channels.md](channels.md) |

## Field Entri yang Sering Dipakai

| Field | Arti |
|---|---|
| `id` | `CALENDAR_ID` kalender yang dilanggani |
| `summary` / `summaryOverride` | Nama kalender / nama tampilan pribadi |
| `backgroundColor` / `foregroundColor` | Warna tampilan lokal pengguna |
| `selected` | Ditampilkan/dihilangkan dari UI (kalender tetap ter-query) |
| `accessRole` | `freeBusyReader`, `reader`, `writer`, `owner` |
| `timeZone` | Zona waktu kalender |
| `defaultReminders` | Reminder bawaan bila event tidak menentukan sendiri |
| `notificationSettings` | Notifikasi email per tipe perubahan |
| `primary` | `true` untuk kalender utama akun |
| `deleted` | Entri dihapus (perlu `showDeleted=true` di list) |

## Contoh

```bash
# (1) langgani kalender tim yang sudah dibuat orang lain
curl -X POST "https://www.googleapis.com/calendar/v3/users/me/calendarList" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CALENDAR_ID",
    "selected": true,
    "colorRgbFormat": false,
    "summaryOverride": "Kalender Tim A"
  }'

# Daftar semua langganan
curl "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Sembunyikan dari UI tanpa berhenti langganan
curl -X PATCH "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "selected": false }'

# Berhenti langganan — kalender sendiri tidak terhapus, hanya entri di daftar ini
curl -X DELETE "https://www.googleapis.com/calendar/v3/users/me/calendarList/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Per-path berbeda | Selalu `/users/me/calendarList`, bukan `/calendars` — sering tertukar |
| `insert` idempotensi | Melanggani dua kali pada kalender yang sama mengembalikan 409 |
| `delete` lokal | Menghapus entri langganan; tidak menyentuh data kalender |
| `accessRole` read-only | Hak akses ditentukan ACL pemilik — diatur lewat [reference-api/acl.md](acl.md) |
| `colorRgbFormat` | `true` = kirim `backgroundColor`/`foregroundColor` hex; `false` = pakai `colorId` |
| Sync token | `list` mendukung `syncToken` untuk inkremental |

> Prinsip: `calendarList` adalah tampilan per pengguna — dua pengguna melihat kalender yang sama dengan nama, warna, dan status `selected` berbeda.
