# Comments API

Kumpulan endpoint resource `Comment`. Operasi moderasi wajib OAuth scope `https://www.googleapis.com/auth/blogger`.

> API Reference / Comments

---

## GET /blogs/{blogId}/posts/{postId}/comments

List komentar pada satu post.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments?key=API_KEY&fetchBodies=true&maxResults=50"
```

### Parameters

- `blogId`, `postId` (path, wajib).
- `endDate` (datetime, query, optional) — batas atas tanggal komentar.
- `fetchBodies` (boolean, query, optional) — sertakan `content` komentar. Default `true`.
- `maxResults` (unsigned integer, query, optional) — maksimum 500.
- `pageToken` (string, query, optional).
- `startDate` (datetime, query, optional).
- `status` (string, query, optional, dapat diulang) — `emptied`, `live`, `pending`, `spam`. Default `live`.
- `view` (string, query, optional).

### Response

```json
{
  "kind": "blogger#commentList",
  "nextPageToken": "CgkI...",
  "items": [ { "kind": "blogger#comment", "...": "..." } ]
}
```

---

## GET /blogs/{blogId}/posts/{postId}/comments/{commentId}

Satu komentar.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID?key=API_KEY"
```

### Parameters

- `view` (string, query, optional).

### Errors

- `404 commentNotFound`.

---

## GET /blogs/{blogId}/comments

List komentar dari **seluruh post** blog (untuk antrian moderasi).

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/comments?key=API_KEY&status=pending"
```

### Parameters

- `blogId` (path, wajib).
- `endDate` / `startDate` (datetime, query, optional).
- `fetchBodies` (boolean, query, optional).
- `maxResults` (unsigned integer, query, optional) — maksimum 500.
- `pageToken` (string, query, optional).
- `status` (string, query, optional, dapat diulang) — `emptied`, `live`, `pending`, `spam`. Default `live`.

### Response

Objek `CommentList`.

---

## POST .../comments/{commentId}/approve

Setujui komentar (status → `live`).

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/approve" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

Objek `Comment` setelah di-approve.

### Errors

- `403` — user bukan admin/komentar bukan `pending`.
- `404 commentNotFound`.

---

## POST .../comments/{commentId}/markAsSpam

Tandai komentar sebagai spam (status → `spam`).

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/markAsSpam" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

Objek `Comment`.

---

## POST .../comments/{commentId}/removecontent

Hapus **isi** komentar saja (status → `emptied`); author & metadata tetap.

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/removecontent" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

> Nama endpoint resmi memakai `removecontent` (huruf kecil semua). `removeContent` juga diterima, tapi `removecontent` adalah path kanonik.

---

## DELETE .../comments/{commentId}

Hapus komentar permanen.

```bash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

`200 OK` dengan body kosong.

---

## Lihat Juga

- Model data & status komentar: [../resources/comment.md](../resources/comment.md)
- Panduan moderasi: [../guides/moderation-comments.md](../guides/moderation-comments.md)
