# PageViews API

Endpoint resource `PageViews`.

> API Reference / PageViews

---

## GET /blogs/{blogId}/pageviews

Statistik jumlah kunjungan blog per rentang waktu.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pageviews?range=30D" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `blogId` (long, path, wajib).
- `range` (string, query, optional, dapat diulang) — `30D`, `7D`, `all`. Tanpa parameter: ketiganya.

### Response

```json
{
  "kind": "blogger#pageViews",
  "counts": [
    { "timeRange": "30D", "count": "45231" }
  ],
  "blogUrl": "https://bloganda.blogspot.com/"
}
```

### Errors

- `403 bloggerPageviewsForbidden` — user tidak berhak melihat statistik blog.
- `401` — tanpa OAuth token (API key tidak cukup).

---

## Lihat Juga

- Model data & batasan: [../resources/page-views.md](../resources/page-views.md)
