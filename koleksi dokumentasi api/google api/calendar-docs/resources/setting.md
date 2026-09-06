# Resource: Setting

`calendar#setting` adalah satu preferensi pengguna Google Calendar (yang terlihat di halaman Setelan web). Bersifat **read-only via API** — perubahan dilakukan pengguna lewat UI Calendar. `SETTING_ID` di sini adalah nama setting, bukan ID acak.

Referensi endpoint: [reference-api/settings.md](../reference-api/settings.md)

---

## Struktur Resource

| Field | Tipe | Arti |
|---|---|---|
| `kind` | string | Selalu `calendar#setting` |
| `etag` | string | Versi resource |
| `id` | string | Kunci setting, mis. `format24HourTime` |
| `value` | string | Nilai setting, selalu berupa string |

## Setting yang Umum Dipakai

| `id` | Contoh `value` | Arti |
|---|---|---|
| `timezone` | `Asia/Jakarta` | Zona waktu utama akun |
| `locale` | `id` | Bahasa antarmuka |
| `format24HourTime` | `true` / `false` | Format jam 24 jam |
| `firstDayOfWeek` | `0`–`6` | Hari pertama minggu (0 = Minggu) |
| `dateFieldOrder` | `dmy` / `mdy` / `ymd` | Urutan tanggal |
| `defaultCalendarView` | `day` / `week` / `month` / `customDays` | Tampilan awal kalender |
| `hideInvitations` | `true` / `false` | Sembunyikan undangan yang belum dibalas |
| `remindOnRespondedEventsOnly` | `true` / `false` | Reminder hanya untuk event yang dibalas |
| `showDeclinedEvents` | `true` / `false` | Tampilkan event yang ditolak |
| `weekStart` | `0`–`6` | Mulai minggu kerja |
| `weekEnd` | `0`–`6` | Akhir minggu kerja |

## Contoh

```bash
# Ambil satu setting
curl "https://www.googleapis.com/calendar/v3/users/me/settings/timezone" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Ambil semua setting (satu koleksi, lazimnya cukup satu halaman)
curl "https://www.googleapis.com/calendar/v3/users/me/settings" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Contoh response `users/me/settings/timezone`:

```json
{
  "kind": "calendar#setting",
  "etag": "\"etag-1\"",
  "id": "timezone",
  "value": "Asia/Jakarta"
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Scope | Cukup `calendar.settings.readonly` — tidak ada scope tulis karena resource read-only |
| Path `users/me` | Hanya untuk akun sendiri; tidak ada akses setting pengguna lain |
| Nilai string | Semua nilai adalah string; konversi tipe di sisi aplikasi |
| Zona waktu | `timezone` berguna sebagai fallback saat event tidak punya `timeZone` eksplisit |

> Prinsip: setting adalah preferensi UI pengguna — gunakan untuk menyesuaikan tampilan/format aplikasi, bukan sebagai sumber kebenaran data jadwal.
