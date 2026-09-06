# Posts API

Kumpulan endpoint resource `Post`. Semua operasi tulis wajib OAuth scope `https://www.googleapis.com/auth/blogger`.

> API Reference / Posts

---

## GET /blogs/{blogId}/posts

List post sebuah blog.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=10&orderBy=published"
```

### Parameters

- `blogId` (long, path, wajib).
- `endDate` (datetime, query, optional) — batas atas tanggal publikasi.
- `fetchBodies` (boolean, query, optional) — sertakan konten HTML. Default `true`.
- `fetchImages` (boolean, query, optional) — sertakan daftar URL gambar.
- `labels` (string, query, optional) — filter label. Untuk banyak label pakai pemisah koma (logika AND: post harus punya semua label).
- `limit` (unsigned integer, query, optional) — alternatif `maxResults` untuk `postUserInfos.list`.
- `maxResults` (unsigned integer, query, optional) — jumlah item per halaman. Maksimum 500.
- `orderBy` (string, query, optional) — `published` (default) atau `updated`. Wajib `startDate`/`endDate` konsisten dengan urutan ini.
- `pageToken` (string, query, optional) — token halaman berikutnya.
- `startDate` (datetime, query, optional) — batas bawah tanggal.
- `status` (string, query, optional, dapat diulang) — `draft`, `live`, `scheduled`. Tanpa parameter ini hanya `live` yang dikembalikan.
- `view` (string, query, optional) — `READER` / `AUTHOR` / `ADMIN`.

### Response

```json
{
  "kind": "blogger#postList",
  "nextPageToken": "CgkI...",
  "items": [ { "kind": "blogger#post", "...": "..." } ]
}
```

---

## GET /blogs/{blogId}/posts/{postId}

Satu post.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID?key=API_KEY"
```

### Parameters

- `blogId`, `postId` (path, wajib).
- `fetchBody` (boolean, query, optional) — default `true`.
- `fetchImages` (boolean, query, optional).
- `maxComments` (unsigned integer, query, optional) — jumlah komentar awal disertakan.
- `view` (string, query, optional).

### Response

Objek `Post`.

### Errors

- `404 postNotFound`.

---

## GET /blogs/{blogId}/posts/bypath

Satu post berdasarkan path URL-nya.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/bypath?path=/2026/08/post-pertama.html&key=API_KEY"
```

### Parameters

- `path` (string, query, wajib) — path post tanpa domain, misal `/2026/08/post-pertama.html`.
- `maxComments` (unsigned integer, query, optional).
- `view` (string, query, optional).

### Errors

- `404 postNotFound` — path salah.

---

## POST /blogs/{blogId}/posts/

Membuat post baru.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "blogger#post",
    "title": "Judul Post",
    "content": "<p>Isi HTML.</p>",
    "labels": ["api"],
    "published": "2026-09-10T09:00:00+07:00"
  }'
```

### Parameters

- `isDraft` (boolean, query, optional) — true → simpan sebagai draft. Default `false` (langsung live kecuali `published` berupa tanggal masa depan → menjadi scheduled).
- `fetchBody` / `fetchImages` / `maxComments` (query, optional) — kontrol isi response.

### Body

Objek `Post` minimal dengan `title` dan/atau `content`. Field opsional: `labels`, `published`, `customMetaData`.

### Response

`201 Created` — objek `Post` lengkap.

---

## PUT /blogs/{blogId}/posts/{postId}

Mengganti post sepenuhnya (field yang tidak dikirim akan direset).

```bash
curl -X PUT "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Judul Baru",
    "content": "<p>Konten baru lengkap.</p>",
    "labels": ["api", "update"]
  }'
```

### Parameters

- `publish` (boolean, query, optional) — true → publikasikan bila sebelumnya draft.
- `revert` (boolean, query, optional) — true → ubah live post menjadi draft.
- `fetchBody` / `fetchImages` / `maxComments` (query, optional).

### Response

Objek `Post` setelah update.

---

## PATCH /blogs/{blogId}/posts/{postId}

Mengubah sebagian field (rekomendasi untuk edit konten/judul saja).

```bash
curl -X PATCH "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "<p>Hanya konten yang diubah.</p>" }'
```

Parameter sama dengan `PUT` (termasuk `publish` dan `revert`).

---

## DELETE /blogs/{blogId}/posts/{postId}

Menghapus post.

```bash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID?useTrash=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `useTrash` (boolean, query, optional) — true → pindahkan ke trash (recoverable via dashboard). Default `false` = hapus permanen.

### Response

`200 OK` dengan body kosong.

---

## POST /blogs/{blogId}/posts/{postId}/publish

Publikasikan post draft/scheduled.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `publishDate` (datetime, query, optional) — jadwalkan publikasi pada waktu tertentu.

### Errors

- `409` — post sudah live.
- `404 postNotFound`.

---

## POST /blogs/{blogId}/posts/{postId}/revert

Ubah post live kembali menjadi draft.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/revert" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

Objek `Post` dengan status draft.

---

## GET /blogs/{blogId}/posts/search

Cari post berdasarkan kata kunci.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/search?q=blogger+api&key=API_KEY&fetchBodies=false"
```

### Parameters

- `q` (string, query, wajib) — kata kunci pencarian.
- `fetchBodies` (boolean, query, optional) — default `true`; set `false` agar cepat.
- `orderBy` (string, query, optional) — `published` (default) atau `updated`.

### Response

Objek `PostList` yang cocok dengan query (pencarian pada judul + konten).

---

## Lihat Juga

- Model data: [../resources/post.md](../resources/post.md)
- Alur publish: [../guides/publish-and-manage-posts.md](../guides/publish-and-manage-posts.md)
- Pagination: [../guides/pagination.md](../guides/pagination.md)
