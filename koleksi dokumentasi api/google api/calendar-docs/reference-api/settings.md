# Reference: Settings Endpoints

Endpoint `settings.*` membaca preferensi pengguna Google Calendar. Resource read-only; detail field ada di [resources/setting.md](../resources/setting.md). Seluruh koleksi hidup di bawah `users/me` — tidak ada akses setting pengguna lain.

---

## Daftar Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `list` | `GET /users/me/settings` | Semua setting pengguna |
| `get` | `GET /users/me/settings/SETTING_ID` | Satu setting (mis. `timezone`) |
| `watch` | `POST /users/me/settings/watch` | Push notification — [reference-api/channels.md](channels.md) |

## Parameter

| Parameter | Berlaku | Arti |
|---|---|---|
| `maxResults` | list | Batas per halaman |
| `pageToken` | list | Posisi halaman — [guides/pagination.md](../guides/pagination.md) |
| `syncToken` | list | Sinkronisasi inkremental |

## Contoh

```bash
# (1) satu setting yang paling sering dibutuhkan: zona waktu pengguna
curl "https://www.googleapis.com/calendar/v3/users/me/settings/timezone" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Semua setting dalam satu panggilan
curl "https://www.googleapis.com/calendar/v3/users/me/settings" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Response `list` (ringkas):

```json
{
  "kind": "calendar#settings",
  "etag": "\"etag-1\"",
  "nextPageToken": "TOKEN",
  "items": [
    { "kind": "calendar#setting", "id": "timezone", "value": "Asia/Jakarta" },
    { "kind": "calendar#setting", "id": "format24HourTime", "value": "true" }
  ]
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Read-only | Tidak ada insert/update/delete; perubahan hanya lewat UI Calendar |
| Scope | `calendar.settings.readonly` sudah cukup, atau scope `calendar` penuh |
| `SETTING_ID` | Nama setting seperti `timezone` — lihat tabel di [resources/setting.md](../resources/setting.md) |
| Nilai string | Termasuk angka/boolean (`"true"`, `"0"`) — konversi di sisi aplikasi |
| Timing | Berguna saat init aplikasi untuk format tanggal/jam sesuai preferensi pengguna |

> Prinsip: hormati preferensi pengguna — tampilkan waktu sesuai `timezone` dan `format24HourTime`, jangan hardcode.
