# Examples: Kemampuan dan Alur

Indeks contoh kode siap adaptasi. Semua contoh memakai placeholder:

| Placeholder | Ganti dengan |
|---|---|
| `ACCESS_TOKEN` | OAuth access token dengan scope yang sesuai |
| `CALENDAR_ID` | Email kalender, mis. `abc123@group.calendar.google.com` atau `primary` |
| `EVENT_ID` | ID event dari `events.insert` / `events.list` |
| `CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` | Kredensial OAuth untuk pertukaran token |

---

## Peta Contoh

| File | Bahasa | Fokus |
|---|---|---|
| [curl.md](curl.md) | bash | Sinar mentah semua endpoint inti — untuk uji cepat |
| [nodejs.md](nodejs.md) | Node 18+ `fetch` | Loop pagination, sync token, freebusy, tulis event |
| [python.md](python.md) | `requests` | Alur yang sama dalam Python + penanganan error |

## Alur di Setiap Contoh

Ketiga bahasa mengikuti alur kerja yang identik:

1. Pertukar/verifikasi token OAuth.
2. Baca `calendarList` untuk memilih `CALENDAR_ID`.
3. Full sync `events.list` → simpan `nextSyncToken`.
4. Delta sync dengan `syncToken`.
5. Query `freeBusy` untuk slot kosong.
6. `events.insert` dengan peserta + reminder, `sendUpdates=all`.
7. `events.patch` lalu `events.delete` untuk pembersihan.

```text
token -> calendarList -> events.list (full) -> syncToken
                 |                 ^
                 v                 |
            freeBusy          delta sync
                 |
           events.insert (attendees + reminders)
                 |
           events.patch / events.delete
```

## Prasyarat OAuth

```bash
# (1) tukar refresh token menjadi access token sebelum tiap sesi contoh
curl -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

| Kebutuhan contoh | Scope minimal |
|---|---|
| CRUD event + calendarList + freebusy | `https://www.googleapis.com/auth/calendar` |
| Hanya baca event | `https://www.googleapis.com/auth/calendar.readonly` |
| Kelola berbagi kalender | `https://www.googleapis.com/auth/calendar` |

Pemilihan scope dan batasan kuota dijelaskan di [reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

## Konvensi Contoh

| Konvensi | Keterangan |
|---|---|
| Zona waktu | Contoh memakai `+07:00` (WIB) — sesuaikan dengan data asli |
| Error | Contoh Python/Node menampilkan pola retry minimal; panduan lengkap di [guides/error-handling.md](../guides/error-handling.md) |
| Idempotensi | Insert memakai `iCalUID`/`requestId` stabil bila berulang |
| Tidak ada library Google | Semua contoh memakai HTTP polos agar pola request terlihat jelas |

> Prinsip: contoh disengaja minim library — begitu pola HTTP-nya jelas, migrasi ke library resmi (googleapis / google-api-python-client) menjadi langsung.
