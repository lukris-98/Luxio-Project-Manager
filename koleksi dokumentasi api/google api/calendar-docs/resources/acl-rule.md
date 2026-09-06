# Resource: ACL Rule

`acl$rule` adalah satu aturan pada kalender yang menjawab pertanyaan: **siapa boleh melihat/mengubah kalender ini, dan sejauh mana**. Semua aturan terikat pada satu kalender (`CALENDAR_ID`), dan daftarnya diatur lewat koleksi `acl`.

Referensi endpoint: [reference-api/acl.md](../reference-api/acl.md) · Panduan: [guides/sync-tokens.md](../guides/sync-tokens.md)

---

## Struktur Resource

| Field | Tipe | Arti |
|---|---|---|
| `kind` | string | Selalu `calendar#aclRule` |
| `id` | string | ID aturan (mis. `user:userEmail@gmail.com` atau `default`) |
| `etag` | string | Versi resource |
| `scope.type` | string | `default`, `user`, `group`, atau `domain` |
| `scope.value` | string | Email/group/domain — **wajib** kecuali `type: default` |
| `role` | string | Tingkat akses, lihat tabel di bawah |

## Role yang Tersedia

| Role | Hak |
|---|---|
| `none` | Tidak ada akses (pemblokir) |
| `freeBusyReader` | Lihat kekosongan/jadwal, tanpa detail event |
| `reader` | Baca semua detail event |
| `writer` | Baca + tulis event (tanpa mengubah ACL) |
| `owner` | Penuh: kelola event, ACL, dan metadata kalender |

## Scope: Siapa yang Dituju

| Type | `value` | Makna |
|---|---|---|
| `default` | tidak ada | Berlaku untuk semua orang (kalender publik) |
| `user` | email | Satu akun Google |
| `group` | email grup | Semua anggota Google Group |
| `domain` | domain.com | Semua akun dalam satu Workspace domain |

## Contoh JSON

```json
{
  "kind": "calendar#aclRule",
  "id": "user:budi@example.com",
  "scope": { "type": "user", "value": "budi@example.com" },
  "role": "writer"
}
```

## Contoh: Tambah Penulis ke Kalender

```bash
# (1) role menentukan hak, scope menentukan target
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl?sendNotifications=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope": {"type": "user", "value": "budi@example.com"}, "role": "writer"}'
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| ACL vs CalendarList | ACL mengatur siapa boleh akses; CalendarList hanya daftar langganan UI pengguna |
| `default` + `none` | Kombinasi "kalender publik tapi diblokir semua" untuk menutup akses umum |
| Notifikasi | `sendNotifications=true` mengirim email undangan berbagi ke scope |
| Visibility | Id aturan `user:...` bisa dipakai langsung sebagai `RULE_ID` untuk get/update/delete |
| Sync | `acl.list` mendukung `syncToken` untuk sinkronisasi inkremental |

> Prinsip: berikan role seminimal mungkin — `freeBusyReader` untuk penjadwalan, `reader` untuk transparansi, `writer` hanya untuk yang benar-benar mengubah.
