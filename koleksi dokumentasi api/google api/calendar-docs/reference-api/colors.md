# Reference: Colors Endpoint

Satu endpoint read-only: `GET /colors`. Mengembalikan palet warna global yang menjadi sumber kebenaran semua `colorId`. Penjelasan resource: [resources/color.md](../resources/color.md).

---

## Signature

| Sifat | Nilai |
|---|---|
| HTTP | `GET https://www.googleapis.com/calendar/v3/colors` |
| Method name | `colors.get` |
| Parameter | Tidak ada |
| Scope | Scope Calendar apa pun |

## Contoh

```bash
curl "https://www.googleapis.com/calendar/v3/colors" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "kind": "calendar#colors",
  "updated": "2026-01-01T00:00:00.000Z",
  "calendar": {
    "1":  { "background": "#ac725e", "foreground": "#1d1d1d" },
    "19": { "background": "#4986e7", "foreground": "#1d1d1d" }
  },
  "event": {
    "1":  { "background": "#a4bdfc", "foreground": "#1d1d1d" },
    "5":  { "background": "#fbd75b", "foreground": "#1d1d1d" },
    "11": { "background": "#dc2127", "foreground": "#1d1d1d" }
  }
}
```

## Pemakaian Lintas Resource

| Target | Field | Palet | Contoh tulis |
|---|---|---|---|
| Event | `events.colorId` | `event` | `PATCH` events dengan `{ "colorId": "5" }` |
| Entri calendarList | `colorId` | `calendar` | `PATCH` calendarList dengan `{ "colorId": "7" }` |

```js
// (1) validasi sebelum menulis: colorId tidak dikenal bisa ditolak atau diabaikan server
async function assertColorId(token, kind, colorId) {
  const colors = await fetch('https://www.googleapis.com/calendar/v3/colors', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  if (!(colorId in colors[kind])) {
    throw new Error(`colorId "${colorId}" tidak ada di palet "${kind}"`);
  }
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Cache palet | Simpan respons + `updated`; muat ulang hanya bila `updated` berubah |
| Jumlah kunci | Palet `event` sekitar belasan kunci, `calendar` lebih banyak — jangan asumsikan sama |
| Tidak ada tulis | Warna diatur lewat `colorId` di resource lain, bukan endpoint ini |
| Fallback | Event tanpa `colorId` mengikuti warna kalendernya |

> Prinsip: panggil `/colors` sekali saat startup, validasi setiap `colorId` sebelum dipakai menulis.
