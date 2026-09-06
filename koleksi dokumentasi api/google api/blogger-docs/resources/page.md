# Resource: Page

Objek `Page` merepresentasikan halaman statis blog (misal "Tentang", "Kontak") — berbeda dari post yang berupa entri kronologis.

---

## Representasi JSON

```json
{
  "kind": "blogger#page",
  "id": "5587654321098765432",
  "blog": { "id": "1234567890123456789" },
  "published": "2020-01-15T10:00:00+07:00",
  "updated": "2026-06-20T08:30:45+07:00",
  "url": "https://bloganda.blogspot.com/p/tentang.html",
  "selfLink": "https://www.googleapis.com/blogger/v3/blogs/1234567890123456789/pages/5587654321098765432",
  "title": "Tentang",
  "content": "<p>Halaman tentang blog ini...</p>",
  "author": {
    "id": "g101234567890123456789",
    "displayName": "Nama Penulis",
    "url": "https://www.blogger.com/profile/101234567890123456789",
    "image": { "url": "https://lh3.googleusercontent.com/..." }
  },
  "etag": "\"etag-value\""
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#page` |
| `id` | long | ID unik page |
| `blog.id` | long | ID blog pemilik |
| `published` | datetime | Waktu page dibuat |
| `updated` | datetime | Waktu terakhir dimutakhirkan |
| `url` | string | URL publik page (pola `/p/nama-page.html`) |
| `title` | string | Judul page |
| `content` | string | Konten **HTML** page |
| `author` | object | Penulis page |
| `etag` | string | ETag |

## Status Page

| Status | Arti |
|---|---|
| `live` | Tampil di blog |
| `draft` | Draft, tidak tampil |
| `imported` | Diimpor dari platform lain (legacy) |

Filter via `?status=draft` dll. pada `pages.list`.

## Perbedaan Page vs Post

| Aspek | Post | Page |
|---|---|---|
| Muncul di feed arsip | Ya | Tidak |
| Label/kategori | Ya | Tidak |
| Komentar | Ya | Tidak |
| URL | `/YYYY/MM/slug.html` | `/p/slug.html` |
| Publish/revert | Ya | Ya |
| Use case | Artikel blog | Konten statis (About, Kontak, Kebijakan) |

## Endpoint Terkait

Semua operasi page: [../reference-api/pages.md](../reference-api/pages.md)
