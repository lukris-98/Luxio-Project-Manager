# Label & Pencarian

Cara memfilter post berdasarkan label dan melakukan pencarian teks.

---

## Filter Berdasarkan Label

`GET /blogs/{blogId}/posts?labels=LABEL`:

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?labels=api&key=API_KEY&maxResults=20"
```

Beberapa label sekaligus (post harus punya **semua** label — logika AND):

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?labels=api,tutorial&key=API_KEY"
```

Label dengan spasi → URL-encode: `labels=Software%20Engineering`.

## Pencarian Teks

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/search?q=rate+limit&key=API_KEY&fetchBodies=false"
```

- Mencocokkan judul dan konten post.
- `fetchBodies=false` disarankan untuk response ringan (hanya metadata + snippet URL).
- Hasil mendukung `pageToken` untuk pagination.

## Men-set Label Saat Insert

```json
{
  "title": "Artikel Baru",
  "content": "<p>...</p>",
  "labels": ["api", "tutorial"]
}
```

Batas: maksimal **20 label per post**.

## Mengubah Label Post

PATCH/PUT dengan field `labels` baru. Contoh menambah label via PUT (harus sertakan semua label final):

```bash
curl -X PUT "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Artikel Baru",
    "content": "<p>...</p>",
    "labels": ["api", "tutorial", "update-2026"]
  }'
```

## Kombinasi Filter Praktis

| Kebutuhan | Parameter |
|---|---|
| Post bulan tertentu | `startDate=2026-08-01T00:00:00Z&endDate=2026-09-01T00:00:00Z` |
| Post terbaru 10 | `orderBy=published&maxResults=10` |
| Post terakhir diedit | `orderBy=updated&maxResults=10` |
| Draft saja (OAuth) | `status=draft&view=AUTHOR` |
| Scheduled saja (OAuth) | `status=scheduled` |
| Label + rentang waktu | `labels=x&startDate=...&endDate=...` |

## Gotchas

1. **Label case-sensitive**: `API` dan `api` adalah label berbeda.
2. `labels` pada `posts.list` memakai AND; tidak ada filter OR — untuk OR, lakukan beberapa request lalu gabungkan hasilnya di aplikasi.
3. `search` tidak bisa digabung dengan `labels`; filter tambahan lakukan di sisi aplikasi.
4. `startDate`/`endDate` mengikuti `orderBy`: dengan `orderBy=updated`, rentang mengacu pada tanggal update.
