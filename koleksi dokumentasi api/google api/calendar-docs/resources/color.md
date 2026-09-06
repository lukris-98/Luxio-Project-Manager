# Resource: Color

Resource `colors` adalah **palet warna global** Calendar API: satu endpoint read-only (`GET /colors`) yang mengembalikan definisi warna untuk dua keluarga — warna kalender dan warna event. `colorId` di `events` dan di entri `calendarList` tidak pernah berisi kode warna; ia hanya **kunci yang merujuk ke sini**.

Referensi endpoint: [reference-api/colors.md](../reference-api/colors.md)

---

## Struktur Response

```json
{
  "kind": "calendar#colors",
  "updated": "2026-01-01T00:00:00.000Z",
  "calendar": {
    "1":  { "background": "#ac725e", "foreground": "#1d1d1d" },
    "2":  { "background": "#d06b64", "foreground": "#1d1d1d" }
  },
  "event": {
    "1":  { "background": "#a4bdfc", "foreground": "#1d1d1d" },
    "2":  { "background": "#7ae7bf", "foreground": "#1d1d1d" }
  }
}
```

| Field | Arti |
|---|---|
| `calendar` | Palet untuk metadata kalender (entri `calendarList`) — berpuluh kunci |
| `event` | Palet untuk event — sekitar belasan kunci |
| `background` | Kode warna hex untuk latar |
| `foreground` | Kode warna hex untuk teks di atas latar |
| `updated` | Waktu palet terakhir berubah — cache palet bila cocok |

## Cara Pemakaian

| Lokasi `colorId` | Palet yang dirujuk | Endpoint tulis |
|---|---|---|
| `events.colorId` | `event` | `events.insert/patch` — lihat [resources/event.md](event.md) |
| `calendarList.colorId` | `calendar` | `calendarList.patch` — lihat [reference-api/calendar-list.md](../reference-api/calendar-list.md) |

```bash
# Ambil palet lalu validasi colorId sebelum dipakai menulis
curl "https://www.googleapis.com/calendar/v3/colors" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```js
// (1) jangan pernah hardcode hex — minta palet, petakan kuncinya
const colors = await fetch('https://www.googleapis.com/calendar/v3/colors', {
  headers: { Authorization: `Bearer ACCESS_TOKEN` }
}).then(r => r.json());

const validEventColor = Object.keys(colors.event).includes('5');   // (2) cek kunci event
const validCalColor  = Object.keys(colors.calendar).includes('7'); // (3) cek kunci kalender
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `colorId` tidak selalu ada | Event/kalender tanpa `colorId` memakai warna default kalendernya |
| Palet bisa berubah | Server dapat memperbarui hex; simpan `updated` dan muat ulang bila berubah |
| Tidak ada endpoint tulis | Warna ditentukan lewat `colorId` di resource lain, bukan lewat resource ini |
| UI konsisten | Pakai pasangan `background` + `foreground` agar teks selalu terbaca |

> Prinsip: `colorId` hanyalah kunci; warna sesungguhnya selalu diambil dari `/colors` — jangan pernah menyalin hex ke data aplikasi.
