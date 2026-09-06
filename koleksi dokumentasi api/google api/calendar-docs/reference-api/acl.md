# Reference: ACL Endpoints

Koleksi `acl` mengatur **siapa berhak mengakses satu kalender dan dengan role apa**. Resource dan tabel role/scope ada di [resources/acl-rule.md](../resources/acl-rule.md). Semua path memakai `CALENDAR_ID` kalender target, bukan `users/me`.

---

## Daftar Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `list` | `GET /calendars/CALENDAR_ID/acl` | Semua aturan kalender |
| `insert` | `POST /calendars/CALENDAR_ID/acl` | Tambah aturan berbagi |
| `get` | `GET /calendars/CALENDAR_ID/acl/RULE_ID` | Satu aturan |
| `update` | `PUT /calendars/CALENDAR_ID/acl/RULE_ID` | Ganti seluruh aturan |
| `patch` | `PATCH /calendars/CALENDAR_ID/acl/RULE_ID` | Ubah role saja |
| `delete` | `DELETE /calendars/CALENDAR_ID/acl/RULE_ID` | Cabut akses |
| `watch` | `POST /calendars/CALENDAR_ID/acl/watch` | Push notification — [reference-api/channels.md](channels.md) |

## Contoh

```bash
# (1) beri role reader ke satu user; email notifikasi dikirim bila sendNotifications=true
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl?sendNotifications=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "scope": { "type": "user", "value": "budi@example.com" }, "role": "reader" }'
# Response "id": "user:budi@example.com" -> dipakai sebagai RULE_ID

# Daftar semua aturan
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Naikkan role jadi writer
curl -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl/RULE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "role": "writer" }'

# Cabut akses
curl -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl/RULE_ID?sendNotifications=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Contoh Scope Lain

```bash
# Buka ke semua orang di domain Workspace
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "scope": { "type": "domain", "value": "example.com" }, "role": "freeBusyReader" }'

# Publik penuh (type default tanpa value)
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "scope": { "type": "default" }, "role": "reader" }'
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Scope butuh role | Butuh `calendar` atau `calendar.acls` — scope `events` tidak cukup |
| `RULE_ID` format | `user:email`, `group:email`, `domain:domain`, atau `default` |
| Notifikasi | `sendNotifications` juga berlaku di delete dan update |
| Urutan penilaian | Aturan `user` mengungguli `domain`/`default` untuk orang yang sama |
| Sync token | `list` mendukung `syncToken` — cocok untuk mirror ACL di aplikasi |
| Kepemilikan | Hanya `owner` yang boleh mengubah ACL |

> Prinsip: ubah ACL itu aksi berbagi data — selalu kirim `sendNotifications` kecuali berbagi secara senyap memang disengaja.
