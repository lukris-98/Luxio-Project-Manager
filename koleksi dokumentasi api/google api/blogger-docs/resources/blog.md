# Resource: Blog

Objek `Blog` merepresentasikan satu blog Blogger.

---

## Representasi JSON

```json
{
  "kind": "blogger#blog",
  "id": "1234567890123456789",
  "name": "Blog Saya",
  "description": "Blog tentang teknologi",
  "published": "2019-03-14T08:00:00+07:00",
  "updated": "2026-08-30T10:15:22+07:00",
  "url": "https://bloganda.blogspot.com/",
  "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789",
  "posts": {
    "totalItems": 128,
    "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/posts"
  },
  "pages": {
    "totalItems": 5,
    "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/pages"
  },
  "locale": { "language": "id", "country": "ID", "variant": "" },
  "etag": "\"etag-value\"",
  "customMetaData": ""
}
```

Dengan `view=ADMIN`, tersedia tambahan:

```json
{
  "status": "live",
  "canonicalUrl": "https://www.domaincustom.com/",
  "defaultForwardingDomain": "...",
  "pageViews": { "total": 152304 },
  "error": ""
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#blog` |
| `id` | long | ID unik blog — dipakai di hampir semua endpoint lain |
| `name` | string | Judul blog |
| `description` | string | Deskripsi blog |
| `published` | datetime | Waktu blog dibuat |
| `updated` | datetime | Waktu terakhir blog dimutakhirkan |
| `url` | string | URL blog (blogspot atau domain kustom) |
| `selfLink` | string | URL API untuk resource ini |
| `posts.totalItems` | long | Jumlah post di blog |
| `posts.selfLink` | string | Link ke koleksi post blog |
| `pages.totalItems` | long | Jumlah page (halaman statis) |
| `pages.selfLink` | string | Link ke koleksi page |
| `locale` | object | Bahasa/negara/variant blog |
| `customMetaData` | string | Meta tag custom dari pengaturan blog |
| `status` | string | `live` atau `deleted` (hanya `view=ADMIN`) |
| `pageViews.total` | long | Total kunjungan (hanya `view=ADMIN`) |
| `etag` | string | ETag untuk caching |

## Endpoint Terkait

| Method | Path | Doc |
|---|---|---|
| GET | `/blogs/{blogId}` | [../reference-api/blogs.md](../reference-api/blogs.md) |
| GET | `/blogs/getByUrl` | [../reference-api/blogs.md](../reference-api/blogs.md) |
| GET | `/users/{userId}/blogs` | [../reference-api/blogs.md](../reference-api/blogs.md) |

## Cara Mendapatkan blogId

1. **Dari dashboard Blogger** — URL `https://www.blogger.com/blog/posts/1234567890` → angka panjang di akhir adalah blogId.
2. **Via `blogs.getByUrl`**:

   ```bash
   curl "https://www.googleapis.com/blogger/v3/blogs/getByUrl?url=https://bloganda.blogspot.com/&key=API_KEY"
   ```

3. **Via `blogs.listByUser` (OAuth)**: `GET /users/self/blogs` mengembalikan semua blog milik user.
