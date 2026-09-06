# Guide: Freebusy and Scheduling

Alur penjadwalan otomatis: kumpulkan blok sibuk semua calon peserta, gabungkan interval, cari slot kosong yang memenuhi durasi, lalu buat event. Endpoint inti: `POST /freeBusy` — referensi di [reference-api/freebusy.md](../reference-api/freebusy.md), resource di [resources/free-busy.md](../resources/free-busy.md).

---

## Langkah 1: Kumpulkan Blok Sibuk

```bash
# (1) satu panggilan untuk semua peserta — hindari loop per orang
curl -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-08T00:00:00+07:00",
    "timeMax": "2026-09-09T00:00:00+07:00",
    "items": [
      { "id": "budi@example.com" },
      { "id": "citra@example.com" },
      { "id": "dedi@example.com" }
    ]
  }'
```

## Langkah 2: Gabungkan Interval dan Cari Slot

```js
function findSlot(busyLists, dayStart, dayEnd, durationMin) {
  // (1) gabungkan semua interval sibuk semua orang
  const all = busyLists.flat()
    .map(b => ({ start: new Date(b.start), end: new Date(b.end) }))
    .sort((a, b) => a.start - b.start);

  const merged = [];
  for (const iv of all) {
    if (merged.length && iv.start <= merged.at(-1).end) {
      merged.at(-1).end = new Date(Math.max(merged.at(-1).end, iv.end)); // (2) tumpang tindih -> lebur
    } else {
      merged.push({ ...iv });
    }
  }

  // (3) celah antar interval sibuk = kandidat slot
  let cursor = dayStart;
  for (const iv of merged) {
    if (iv.start - cursor >= durationMin * 60000) return cursor;
    cursor = new Date(Math.max(cursor, iv.end));
  }
  return (dayEnd - cursor >= durationMin * 60000) ? cursor : null;
}
```

## Langkah 3: Buat Event pada Slot

```bash
# slot ditemukan 13:00-14:00 -> buat event dengan semua peserta
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Penjadwalan otomatis",
    "start": { "dateTime": "2026-09-08T13:00:00+07:00" },
    "end":   { "dateTime": "2026-09-08T14:00:00+07:00" },
    "attendees": [
      { "email": "budi@example.com" },
      { "email": "citra@example.com" },
      { "email": "dedi@example.com" }
    ]
  }'
```

## Perlakuan Khusus

| Kasus | Perlakuan |
|---|---|
| `errors` pada satu kalender | Tetap proses yang lain; catat kegagalan di laporan |
| Group di `items` | Diekspansi lewat `groups.calendars` di response — gabungkan anggotanya |
| Batas ekspansi | `calendarExpansionMax` 50 / `groupExpansionMax` 100 — pecah query bila lebih |
| Slot di luar jam kerja | Batasi pencarian ke jam kerja sebelum memilih kandidat |
| Event private | Tetap mengisi `busy` — penjadwalan tidak perlu detail isinya |

## Batas Akses

| Akses pada kalender target | Hasil |
|---|---|
| `freeBusyReader` | Cukup — blok `busy` diberikan |
| Tidak ada akses | `reason: notFound` untuk kalender itu |
| Scope baca minimal | `calendar.readonly` pada token |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| FreeBusy ≠ events.list | Tidak ada judul/peserta; untuk detail pakai `events.list` penuh |
| Race condition | Slot bisa terisi orang lain sesudah dicek — event `accepted` di kalender bersama adalah konfirmasi akhir |
| Zona waktu | `busy[i]` memakai offset masing-masing event; konversi ke satu zona sebelum menggabungkan |
| Kualitas slot | Tambahkan buffer (mis. 15 menit) antar rapat dengan mengembang interval sibuk |
| Recurrence | Sudah diekspansi otomatis dalam rentang query |

> Prinsip: free/busy menjawab "kapan semua orang bebas", bukan "apa jadwal mereka" — jangan coba merekonstruksi detail event dari blok busy.
