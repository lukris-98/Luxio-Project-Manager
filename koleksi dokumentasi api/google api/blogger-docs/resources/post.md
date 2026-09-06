# Resource: Post

Objek `Post` merepresentasikan satu entri/postingan blog.

---

## Representasi JSON

```json
{
  "kind": "blogger#post",
  "id": "7149347677654321001",
  "blog": { "id": "1234567890123456789" },
  "published": "2026-08-01T09:30:00+07:00",
  "updated": "2026-08-02T14:05:11+07:00",
  "url": "https://bloganda.blogspot.com/2026/08/post-pertama.html",
  "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/posts/7149347677654321001",
  "title": "Post Pertama",
  "content": "<p>Isi konten HTML post...</p>",
  "author": {
    "id": "g101234567890123456789",
    "displayName": "Nama Penulis",
    "url": "https://www.blogger.com/profile/101234567890123456789",
    "image": { "url": "https://lh3.googleusercontent.com/..." }
  },
  "replies": {
    "totalItems": 3,
    "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/posts/7149347677654321001/comments"
  },
  "labels": ["api", "tutorial"],
  "etag": "\"etag-value\""
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#post` |
| `id` | long | ID unik post |
| `blog.id` | long | ID blog pemilik post |
| `published` | datetime | Waktu terbit. Boleh di-set untuk menjadwalkan publikasi |
| `updated` | datetime | Waktu terakhir dimutakhirkan |
| `url` | string | URL publik post |
| `title` | string | Judul post |
| `content` | string | Konten **HTML** post |
| `customMetaData` | string | Meta data custom post |
| `author` | object | Penulis: `id`, `displayName`, `url`, `image.url` |
| `labels` | list[string] | Label/kategori post (maksimal 20 per post) |
| `replies.totalItems` | long | Jumlah komentar pada post |
| `replies.selfLink` | string | Link ke koleksi komentar |
| `etag` | string | ETag untuk caching |

## Status Post

Field `status` terlihat saat memfilter lewat parameter `status` atau di resource `PostUserInfo`:

| Status | Arti |
|---|---|
| `live` | Terbit dan tampil di blog |
| `draft` | Masih draft, tidak tampil |
| `scheduled` | Terjadwal — akan terbit pada waktu `published` |
| `soft_trashed` | Masuk trash (bila dihapus dengan `useTrash=true`) |

## Field tambahan saat query khusus

- `?view=AUTHOR` atau `view=ADMIN` → field komposisi seperti `readerComments` (moderasi) dan versi draft.
- `?fetchImages=true` → objek `images` berisi URL gambar utama.
- `?fetchBody=false` → hilangkan `content` (hemat payload untuk list besar).

## Batasan Konten

- `content` menerima HTML; tag `<script>` disaring oleh Blogger.
- Label maksimal 20 per post; nama label dipertahankan apa adanya (case-sensitive).
- Timestamp format ISO 8601 dengan offset zona waktu, misal `2026-09-10T09:00:00+07:00`.

## Endpoint Terkait

Semua operasi post: [../reference-api/posts.md](../reference-api/posts.md)
