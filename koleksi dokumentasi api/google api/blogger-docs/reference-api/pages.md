# Pages API

Kumpulan endpoint resource `Page` (halaman statis). Operasi tulis wajib OAuth scope `https://www.googleapis.com/auth/blogger`.

> API Reference / Pages

---

## GET /blogs/{blogId}/pages

List halaman statis blog.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages?key=API_KEY&fetchBodies=false"
```

### Parameters

- `blogId` (long, path, wajib).
- `fetchBodies` (boolean, query, optional) — sertakan konten. Default `true`.
- `maxResults` (unsigned integer, query, optional) — maksimum 500.
- `pageToken` (string, query, optional).
- `status` (string, query, optional, dapat diulang) — `draft`, `imported`, `live`. Tanpa ini hanya `live`.
- `view` (string, query, optional) — `READER` / `AUTHOR` / `ADMIN`.

### Response

```json
{
  "kind": "blogger#pageList",
  "items": [ { "kind": "blogger#page", "...": "..." } ]
}
```

---

## GET /blogs/{blogId}/pages/{pageId}

Satu page.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID?key=API_KEY"
```

### Parameters

- `view` (string, query, optional).

### Errors

- `404 pageNotFound`.

---

## POST /blogs/{blogId}/pages/

Membuat page baru.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "blogger#page",
    "title": "Tentang Kami",
    "content": "<p>Halaman tentang kami.</p>"
  }'
```

### Parameters

- `isDraft` (boolean, query, optional) — true → simpan sebagai draft. Default `false`.
- `publish` (boolean, query, optional).

### Response

`201 Created` — objek `Page`.

---

## PUT /blogs/{blogId}/pages/{pageId}

Mengganti page sepenuhnya.

```bash
curl -X PUT "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Tentang", "content": "<p>Konten baru.</p>" }'
```

### Parameters

- `publish` (boolean, query, optional) — publikasikan bila draft.
- `revert` (boolean, query, optional) — ubah jadi draft.

---

## PATCH /blogs/{blogId}/pages/{pageId}

Mengubah sebagian field.

```bash
curl -X PATCH "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "<p>Hanya konten diperbarui.</p>" }'
```

Parameter sama dengan `PUT`.

---

## DELETE /blogs/{blogId}/pages/{pageId}

Menghapus page.

```bash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## POST /blogs/{blogId}/pages/{pageId}/publish

Publikasikan page draft.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID/publish" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Errors

- `409` — page sudah live.

---

## POST /blogs/{blogId}/pages/{pageId}/revert

Ubah page live menjadi draft.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/PAGE_ID/revert" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Lihat Juga

- Model data: [../resources/page.md](../resources/page.md)
- Perbedaan page vs post: [../resources/page.md#perbedaan-page-vs-post](../resources/page.md)
