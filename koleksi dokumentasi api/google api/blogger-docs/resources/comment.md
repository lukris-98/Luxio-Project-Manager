# Resource: Comment

Objek `Comment` merepresentasikan komentar pada sebuah post.

---

## Representasi JSON

```json
{
  "kind": "blogger#comment",
  "id": "9988776655443322110",
  "post": { "id": "7149347677654321001" },
  "blog": { "id": "1234567890123456789" },
  "published": "2026-08-15T19:22:10+07:00",
  "updated": "2026-08-15T19:22:10+07:00",
  "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/posts/7149347677654321001/comments/9988776655443322110",
  "content": "Artikelnya sangat membantu, terima kasih!",
  "author": {
    "id": "g98765432109876543210",
    "displayName": "Pembaca Satu",
    "url": "https://www.blogger.com/profile/98765432109876543210",
    "image": { "url": "https://lh3.googleusercontent.com/..." }
  },
  "inReplyTo": {
    "id": "9988776655443322100",
    "author": { "displayName": "Pembaca Lain" },
    "content": "Komentar sebelumnya",
    "url": "https://bloganda.blogspot.com/2026/08/post-pertama.html#c9988776655443322100"
  },
  "etag": "\"etag-value\""
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#comment` |
| `id` | long | ID unik komentar |
| `post.id` | long | ID post yang dikomentari |
| `blog.id` | long | ID blog |
| `published` | datetime | Waktu komentar dibuat |
| `updated` | datetime | Waktu terakhir dimutakhirkan |
| `content` | string | Isi komentar (plain text / HTML sederhana) |
| `author` | object | Komentator (`id`, `displayName`, `url`, `image.url`) |
| `inReplyTo` | object | Ada bila komentar adalah balasan thread |
| `etag` | string | ETag |

> `content` hanya dikembalikan bila `fetchBodies=true` pada request list. Objek `inReplyTo` hanya muncul bila `view` mendukung atau komentar benar-benar balasan.

## Status Komentar

Status tersedia pada filter list (`comments.list` / `comments.listByBlog`):

| Status | Arti |
|---|---|
| `live` | Ditampilkan publik |
| `pending` | Menunggu moderasi |
| `spam` | Ditandai spam |
| `emptied` | Isi sudah dihapus permanen oleh admin (`removeContent`) |

## Aksi Moderasi

| Aksi | Endpoint | Efek |
|---|---|---|
| Approve | `POST .../comments/{id}/approve` | `pending`/`spam` → `live` |
| Mark as spam | `POST .../comments/{id}/markAsSpam` | → `spam` |
| Hapus isi saja | `POST .../comments/{id}/removecontent` | → `emptied` (author & metadata tetap) |
| Hapus permanen | `DELETE .../comments/{id}` | Komentar hilang |

Detail: [../reference-api/comments.md](../reference-api/comments.md) dan panduan [../guides/moderation-comments.md](../guides/moderation-comments.md).

## Endpoint Terkait

| Method | Path |
|---|---|
| GET | `/blogs/{blogId}/posts/{postId}/comments` |
| GET | `/blogs/{blogId}/posts/{postId}/comments/{commentId}` |
| GET | `/blogs/{blogId}/comments` |
| POST | `/blogs/{blogId}/posts/{postId}/comments/{commentId}/approve` |
| POST | `/blogs/{blogId}/posts/{postId}/comments/{commentId}/markAsSpam` |
| POST | `/blogs/{blogId}/posts/{postId}/comments/{commentId}/removecontent` |
| DELETE | `/blogs/{blogId}/posts/{postId}/comments/{commentId}` |
