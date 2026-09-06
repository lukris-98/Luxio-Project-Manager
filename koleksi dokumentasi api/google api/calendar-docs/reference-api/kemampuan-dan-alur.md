# Reference API: Kemampuan dan Alur

Bagian ini adalah indeks referensi endpoint Calendar API v3. Base URL semua endpoint:

```text
https://www.googleapis.com/calendar/v3/
```

Untuk pemetaan konsep (resource ↔ endpoint ↔ use case), baca [kemampuan-dan-alur.md di root folder](../kemampuan-dan-alur.md). Untuk gaya pemakaian menyeluruh, baca folder [guides/](../guides/kemampuan-dan-alur.md).

---

## Peta Endpoint

| Endpoint | Fungsi utama | File referensi |
|---|---|---|
| `events.*` | CRUD event, recurrence, attendee, reminder | [events.md](events.md) |
| `calendars.*` | CRUD metadata kalender (nama, zona waktu) | [calendars.md](calendars.md) |
| `calendarList.*` | Kelola daftar langganan kalender di UI pengguna | [calendar-list.md](calendar-list.md) |
| `acl.*` | Kelola aturan berbagi kalender | [acl.md](acl.md) |
| `settings.*` | Baca preferensi pengguna | [settings.md](settings.md) |
| `freeBusy` | Query blok sibuk banyak kalender sekaligus | [freebusy.md](freebusy.md) |
| `colors` | Palet warna untuk `colorId` | [colors.md](colors.md) |
| `channels.*` | Push notification (watch) perubahan resource | [channels.md](channels.md) |

## Alur Kerja Tipikal

1. **OAuth** — dapatkan `ACCESS_TOKEN` dengan scope sesuai kebutuhan (lihat tabel scope di bawah).
2. **Pilih kalender** — `calendarList.list` untuk melihat kalender yang dilanggani, atau langsung pakai `CALENDAR_ID`.
3. **Query/CRUD event** — `events.list` dengan `timeMin`/`timeMax`/`q`, lalu `events.insert`/`update`/`patch`.
4. **Sinkronisasi** — simpan `nextSyncToken` untuk list inkremental, atau daftarkan `channels.watch`.
5. **Penjadwalan lintas orang** — `freeBusy` untuk cek kekosongan, lalu tulis event dengan attendee.

## Scope OAuth

| Scope | Hak |
|---|---|
| `https://www.googleapis.com/auth/calendar` | Baca + tulis penuh |
| `https://www.googleapis.com/auth/calendar.events` | Baca + tulis event saja |
| `https://www.googleapis.com/auth/calendar.events.owned` | Event pada kalender milik sendiri |
| `https://www.googleapis.com/auth/calendar.readonly` | Baca semua |
| `https://www.googleapis.com/auth/calendar.settings.readonly` | Baca setting saja |

```bash
# (1) scope minimal yang menutupi CRUD event + calendarList + freebusy
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

## Konvensi Umum Semua Endpoint

| Konvensi | Penjelasan |
|---|---|
| `CALENDAR_ID` | Email kalender; `primary` = kalender utama akun |
| `ETAG` | Kirim `If-Match` saat update untuk hindari race condition |
| Pagination | `pageToken` + `maxResults` (lihat [guides/pagination.md](../guides/pagination.md)) |
| Sync | `syncToken` untuk inkremental (lihat [guides/sync-tokens.md](../guides/sync-tokens.md)) |
| Error | Format Google API standard; panduan di [guides/error-handling.md](../guides/error-handling.md) |
| Ekuivalen UI | Resource mengikuti model UI Calendar: Calendar ≈ kalender, Event ≈ acara, ACL ≈ aturan berbagi |

> Prinsip: satu `CALENDAR_ID` + satu scope yang benar adalah dua keputusan paling penting sebelum menyentuh endpoint mana pun.
