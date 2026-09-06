# Daftar Error & Penanganannya

Google Calendar API mengembalikan dua lapis informasi error: kode HTTP di header, dan objek JSON di body dengan detail tambahan.

- Dokumentasi resmi: https://developers.google.com/workspace/calendar/api/guides/errors

---

## 1. Bentuk Body Error

```json
{
  "error": {
    "errors": [
      {
        "domain": "calendar",
        "reason": "timeRangeEmpty",
        "message": "The specified time range is empty.",
        "locationType": "parameter",
        "location": "timeMax"
      }
    ],
    "code": 400,
    "message": "The specified time range is empty."
  }
}
```

| Field | Arti |
|---|---|
| `error.code` | Kode HTTP |
| `error.errors[0].domain` | Kategori: `global`, `calendar`, `usageLimits` |
| `error.errors[0].reason` | **Kunci utama** untuk memutuskan tindakan |
| `error.errors[0].location` / `locationType` | Parameter/header/field yang bermasalah |

> Prinsip: jangan mengambil keputusan hanya dari kode HTTP. `403` bisa berarti kuota habis (retry) atau izin kurang (jangan retry). Selalu baca `reason`.

---

## 2. Tabel Ringkas

| Kode | `reason` | Arti | Retry? | Tindakan |
|---|---|---|---|---|
| 400 | `timeRangeEmpty` | `timeMin`/`timeMax` tidak membentuk rentang valid | Tidak | Perbaiki parameter |
| 400 | (berbagai) | Field wajib hilang, nilai tidak valid, kombinasi field terlarang | Tidak | Baca `message`, perbaiki request |
| 400 | (pada sync) | Parameter query terlarang dikirim bersama `syncToken` | Tidak | Hapus `q`/`orderBy`/`timeMin`/`timeMax`/`updatedMin` dst. |
| 401 | `authError` | Access token kedaluwarsa atau tidak valid | Setelah refresh | Refresh token, lalu ulangi sekali |
| 403 | `userRateLimitExceeded` | Batas per user terlampaui | Ya | Backoff; pertimbangkan `quotaUser` |
| 403 | `rateLimitExceeded` | Batas laju per kalender / per user terlampaui | Ya | Backoff (identik dengan `429`) |
| 403 | `quotaExceeded` | Batas penggunaan Calendar (anti-abuse) terlampaui | Tidak segera | Kurangi laju tulis; lihat kebijakan Workspace |
| 403 | `forbiddenForNonOrganizer` | Mencoba set properti bersama pada salinan non-organizer | Tidak | Pakai `patch`, atau ubah di kalender organizer |
| 403 | `insufficientPermissions` | Scope token tidak mencukupi | Tidak | Minta token dengan scope yang benar |
| 404 | `notFound` | Resource tidak ada, atau tidak bisa diakses user ini | Kondisional | Verifikasi `calendarId`/`eventId`; backoff bila dicurigai transien |
| 409 | `duplicate` | `id` yang diminta sudah ada | Tidak | Ini normal untuk operasi idempoten; treat sebagai sukses atau `update` |
| 409 | `conflict` | Item dalam batch bentrok dengan item lain | Ya (item sisa) | Buang item selesai/gagal, retry sisanya |
| 410 | `fullSyncRequired` | `syncToken` tidak valid lagi | Tidak (dengan token itu) | Bersihkan store lokal, full sync ulang |
| 410 | `updatedMinTooLongAgo` | `updatedMin` terlalu jauh di masa lalu | Tidak | Full sync ulang |
| 410 | `deleted` | Resource sudah dihapus | Tidak | Abaikan (untuk delete: sudah tercapai) |
| 412 | `conditionNotMet` | ETag di `If-Match` tidak cocok lagi | Ya | Ambil ulang resource, terapkan perubahan, kirim lagi |
| 429 | `rateLimitExceeded` | Terlalu banyak request dalam waktu singkat | Ya | Backoff |
| 500 | `backendError` | Error internal Google | Ya | Backoff |

---

## 3. Error yang Paling Sering Muncul

### 403 `rateLimitExceeded`

```json
{
  "error": {
    "errors": [ { "domain": "usageLimits", "reason": "rateLimitExceeded", "message": "Rate Limit Exceeded" } ],
    "code": 403,
    "message": "Rate Limit Exceeded"
  }
}
```

`rateLimitExceeded` bisa muncul sebagai `403` **atau** `429` — keduanya fungsinya sama dan harus ditangani identik dengan truncated exponential backoff.

```js
// Salah: menganggap semua 403 permanen → kehilangan data saat kuota sesaat penuh.
if (status === 403) throw err

// Benar: pisahkan berdasar reason.
const RETRYABLE_403 = new Set(['rateLimitExceeded', 'userRateLimitExceeded'])
if (status === 403 && !RETRYABLE_403.has(reason)) throw err   // permanen
// selain itu → backoff lalu retry
```

### 404 `notFound`

Muncul pada beberapa kondisi berbeda:

| Situasi | Ciri |
|---|---|
| `eventId` salah tulis | Terjadi konsisten setiap request |
| Kalender tidak dibagikan ke user ini | `calendarList.list` tidak memuat id tersebut |
| Acara di kalender lain (bukan `primary`) | Ganti `calendarId` yang benar |
| Replikasi belum merata setelah insert | Hilang sendiri setelah backoff singkat |

Dokumentasi resmi menyarankan exponential backoff untuk `404` karena penyebabnya bisa transien. Batasi jumlah retry-nya agar tidak menutupi bug `calendarId` yang salah.

### 409 `duplicate`

```json
{
  "error": {
    "errors": [ { "domain": "global", "reason": "duplicate", "message": "The requested identifier already exists." } ],
    "code": 409,
    "message": "The requested identifier already exists."
  }
}
```

Terjadi saat `events.insert` memakai `id` yang sudah dipakai di kalender itu. Ini justru **mekanisme idempotensi** yang diinginkan.

```js
// Pola upsert yang benar: insert dulu, fallback ke update saat 409.
async function upsertEvent(calendar, calendarId, event) {
  try {
    const { data } = await calendar.events.insert({ calendarId, requestBody: event })
    return data
  } catch (err) {
    const reason = err?.errors?.[0]?.reason
    if (err?.code !== 409 || reason !== 'duplicate') throw err
    // id sudah ada → perbarui resource yang ada, bukan membuat duplikat.
    const { data } = await calendar.events.update({ calendarId, eventId: event.id, requestBody: event })
    return data
  }
}
```

> Catatan: karena sistem Google terdistribusi global, deteksi tabrakan `id` tidak dijamin terjadi tepat saat pembuatan. Pakai algoritma UUID (mis. RFC 4122) yang dipetakan ke charset `id` yang diizinkan untuk meminimalkan risiko.

### 410 `fullSyncRequired`

```json
{
  "error": {
    "errors": [
      {
        "domain": "calendar",
        "reason": "fullSyncRequired",
        "message": "Sync token is no longer valid, a full sync is required.",
        "locationType": "parameter",
        "location": "syncToken"
      }
    ],
    "code": 410,
    "message": "Sync token is no longer valid, a full sync is required."
  }
}
```

Server dapat membatalkan `syncToken` karena kedaluwarsa atau karena perubahan ACL terkait.

```js
async function syncEvents(calendar, calendarId, store) {
  let syncToken = store.getSyncToken(calendarId)
  let pageToken

  do {
    let res
    try {
      res = await calendar.events.list({
        calendarId,
        // Saat full sync boleh memakai filter; saat incremental sync TIDAK.
        ...(syncToken ? { syncToken } : { timeMin: store.horizonIso(), singleEvents: true }),
        pageToken,
        showDeleted: true            // wajib true saat incremental sync
      })
    } catch (err) {
      if (err?.code === 410) {
        // Token mati → buang seluruh cache kalender ini dan mulai dari nol.
        store.clearEvents(calendarId)
        store.setSyncToken(calendarId, null)
        syncToken = undefined
        pageToken = undefined
        continue
      }
      throw err
    }

    for (const ev of res.data.items ?? []) {
      // status 'cancelled' pada incremental sync = hapus salinan lokal.
      if (ev.status === 'cancelled') store.remove(calendarId, ev.id)
      else store.upsert(calendarId, ev)
    }

    pageToken = res.data.nextPageToken
    // nextSyncToken hanya ada di halaman TERAKHIR.
    if (res.data.nextSyncToken) store.setSyncToken(calendarId, res.data.nextSyncToken)
  } while (pageToken)
}
```

Detail: [../guides/sync-tokens.md](../guides/sync-tokens.md).

### 403 `forbiddenForNonOrganizer`

Muncul saat request `events.update`/`events.insert`/`events.import` mencoba menetapkan properti bersama (`guestsCanInviteOthers`, `guestsCanModify`, `guestsCanSeeOtherGuests`) pada salinan acara yang bukan milik organizer.

```js
// Masalah: PUT tanpa field bersama = sama dengan mencoba mereset ke nilai default → 403.
await calendar.events.update({ calendarId: 'primary', eventId, requestBody: { summary: 'Baru', start, end } })

// Solusi: PATCH hanya mengirim field yang benar-benar diubah.
await calendar.events.patch({ calendarId: 'primary', eventId, requestBody: { summary: 'Baru' } })
```

### 412 `conditionNotMet`

Terjadi saat memakai optimistic concurrency lewat header `If-Match: <etag>` dan resource sudah berubah.

```bash
# Ambil dulu, catat etag-nya.
curl -i ".../calendar/v3/calendars/primary/events/EVENT_ID" -H "Authorization: Bearer ACCESS_TOKEN"
# → ETag: "p32abc..."

# Update hanya jika belum ada yang mengubahnya.
curl -X PUT ".../calendar/v3/calendars/primary/events/EVENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H 'If-Match: "p32abc..."' \
  -d '{ ... }'
# → 412 conditionNotMet berarti ada perubahan lain; ambil ulang, terapkan lagi, kirim ulang.
```

---

## 4. Matriks Keputusan Retry

```
                  ┌── status 400 / 409 duplicate / 412 ──► JANGAN retry apa adanya
                  │                                        (perbaiki request / refetch dulu)
                  │
Terima error ─────┼── status 401 ──► refresh token ──► retry SEKALI
                  │
                  ├── status 403 ──► lihat reason
                  │                    ├── rateLimitExceeded / userRateLimitExceeded ──► backoff + retry
                  │                    ├── quotaExceeded ──► kurangi laju, retry jauh lebih lambat
                  │                    └── lainnya ──► JANGAN retry (izin/scope/organizer)
                  │
                  ├── status 404 ──► backoff + retry TERBATAS (maks 2–3×), lalu laporkan
                  │
                  ├── status 410 ──► reset state lokal, full sync (jangan retry token lama)
                  │
                  └── status 429 / 5xx ──► backoff + retry
```

Implementasi backoff lengkap: [rate-limits.md](rate-limits.md) dan [../guides/error-handling.md](../guides/error-handling.md).

---

## 5. Kesalahan Klien yang Menghasilkan 400

| Penyebab | Contoh salah | Perbaikan |
|---|---|---|
| `timeMin`/`timeMax` tanpa offset zona waktu | `timeMin=2026-09-07T00:00:00` | `timeMin=2026-09-07T00:00:00+07:00` |
| `timeMin` lebih besar dari `timeMax` | rentang terbalik | Tukar nilainya |
| `orderBy=startTime` tanpa `singleEvents=true` | — | Tambahkan `singleEvents=true` |
| Mencampur `date` dan `dateTime` | `start.date` + `end.dateTime` | Pakai jenis yang sama untuk `start` dan `end` |
| `DTSTART`/`DTEND` di dalam `recurrence[]` | `"DTSTART:2026..."` | Waktu awal hanya lewat `start`/`end` |
| `reminders.overrides` lebih dari 5 | 7 pengingat | Maksimum 5 |
| `minutes` di luar 0–40320 | `minutes: 100000` | Maksimum 40320 |
| `syncToken` dikombinasikan parameter terlarang | `syncToken` + `q` | Hapus `q`, `orderBy`, `timeMin`, `timeMax`, `updatedMin`, `iCalUID`, `privateExtendedProperty`, `sharedExtendedProperty` |
| `id` acara tidak sesuai base32hex | `id: "Event-2026!"` | Hanya `a`–`v` dan `0`–`9`, panjang 5–1024 |
| `conferenceData` dikirim tanpa `conferenceDataVersion=1` | — | Bukan 400, tetapi data konferensi **diabaikan** tanpa peringatan |
