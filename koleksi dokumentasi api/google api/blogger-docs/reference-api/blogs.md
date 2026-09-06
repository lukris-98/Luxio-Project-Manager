# Blogs API

Kumpulan endpoint resource `Blog`.

> API Reference / Blogs

---

## GET /blogs/{blogId}

Mengambil satu blog berdasarkan ID.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"
```

### Parameters

- `blogId` (long, path, wajib) — ID blog.
- `maxPosts` (unsigned integer, query, optional) — Jumlah maksimum post yang disertakan sebagai daftar awal (`posts.items`) dalam response. Default 0.
- `view` (string, query, optional) — `READER` (default), `AUTHOR`, `ADMIN`. `ADMIN` menambahkan field seperti `status` dan `pageViews`.
- `key` (string, query) — API key bila tanpa OAuth.

### Response

Objek `Blog` — lihat [../resources/blog.md](../resources/blog.md).

### Errors

- `404 blogNotFound` — blogId salah.
- `403` — blog dihapus atau tidak terlihat.

---

## GET /blogs/getByUrl

Mengambil blog berdasarkan URL.

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/getByUrl?url=https%3A%2F%2Fbloganda.blogspot.com%2F&key=API_KEY"
```

### Parameters

- `url` (string, query, wajib) — URL blog (harus di-URL-encode).

### Response

Objek `Blog`.

### Errors

- `400 invalid` — URL tidak valid.
- `404 blogNotFound` — URL tidak dikenal.

---

## GET /users/{userId}/blogs

Mengambil daftar blog milik sebuah user.

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `userId` (string, path, wajib) — `self` untuk user terautentikasi.
- `fetchUserInfo` (boolean, query, optional) — true → response berisi `BlogUserInfo` (peran user per blog) alih-alih `Blog`.
- `maxPosts` (unsigned integer, query, optional) — maksimum post awal per blog.
- `role` (string, query, optional, dapat diulang) — filter peran: `reader`, `author`, `admin`. Default semua.
- `status` (string, query, optional) — filter status blog: `live`, `deleted`, `regained`, `revoked`.
- `view` (string, query, optional) — `USER` / `READER` / `ADMIN`.

### Response

```json
{
  "kind": "blogger#blogList",
  "items": [
    { "kind": "blogger#blog", "id": "...", "name": "...", "...": "..." }
  ]
}
```

Bila `fetchUserInfo=true`, `items` berisi objek `BlogUserInfo`.

### Errors

- `401 unauthorized` — token hilang/kedaluwarsa.
- `403` — scope tidak memadai (gunakan `blogger` atau `blogger.readonly`).
