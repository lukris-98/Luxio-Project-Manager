# Resource: PageViews

`PageViews` berisi statistik jumlah kunjungan sebuah blog, dikelompokkan per rentang waktu.

---

## Representasi JSON

```json
{
  "kind": "blogger#pageViews",
  "counts": [
    { "timeRange": "30D", "count": "45231" },
    { "timeRange": "7D",  "count": "10344" },
    { "timeRange": "all", "count": "5123456" }
  ],
  "blogUrl": "https://bloganda.blogspot.com/"
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#pageViews` |
| `blogUrl` | string | URL blog |
| `counts[].timeRange` | string | `30D`, `7D`, atau `all` |
| `counts[].count` | string | Jumlah kunjungan (string, bukan number) |

## Rentang Waktu

| `timeRange` | Arti |
|---|---|
| `30D` | 30 hari terakhir |
| `7D` | 7 hari terakhir |
| `all` | Sejak blog dibuat |

Bila parameter `range` tidak diberikan, ketiganya dikembalikan sekaligus.

## Syarat & Batasan

- Wajib **OAuth** (tidak bisa API key) dan user harus berhak melihat statistik blog tersebut.
- Akan error `403 bloggerPageviewsForbidden` bila blog tidak memperbolehkan akses pageviews bagi user tsb.
- Blogger mengaktifkan/menonaktifkan pelacakan pageviews di dashboard (Settings → Privacy); bila nonaktif, `count` bisa bernilai 0.
- Granularitas per URL tidak tersedia lewat API ini — hanya agregat per blog.

## Endpoint

- `GET /blogs/{blogId}/pageviews` — lihat [../reference-api/page-views.md](../reference-api/page-views.md)
