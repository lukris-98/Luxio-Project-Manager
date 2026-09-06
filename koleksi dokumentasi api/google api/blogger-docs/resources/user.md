# Resource: User

Objek `User` merepresentasikan user Blogger (pemilik blog / penulis).

---

## Representasi JSON

```json
{
  "kind": "blogger#user",
  "id": "g101234567890123456789",
  "created": "2015-06-01T10:00:00+07:00",
  "url": "https://www.blogger.com/profile/101234567890123456789",
  "selfLink": "https://www.googleapis.com/blogger/v3/users/g101234567890123456789",
  "blogs": {
    "selfLink": "https://www.googleapis.com/blogger/v3/users/g101234567890123456789/blogs"
  },
  "displayName": "Nama Tampilan",
  "about": "Bio singkat user",
  "image": {
    "url": "https://lh3.googleusercontent.com/a-/AA...=s512"
  },
  "etag": "\"etag-value\""
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `blogger#user` |
| `id` | string | ID user (prefiks `g` untuk Google+ profile ID) |
| `created` | datetime | Waktu akhir user bergabung |
| `url` | string | URL profil publik |
| `selfLink` | string | Link API resource ini |
| `blogs.selfLink` | string | Link koleksi blog milik user |
| `displayName` | string | Nama tampilan user |
| `about` | string | Bio user |
| `image.url` | string | URL foto profil (tambahkan query `?sz=` untuk resize, misal `=s64`) |
| `etag` | string | ETag |

## userId Spesial: `self`

`self` adalah alias untuk user yang sedang terautentikasi:

```bash
curl "https://www.googleapis.com/blogger/v3/users/self" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

`GET /users/{userId}` untuk user lain mengharuskan OAuth dan umumnya hanya berguna pada konteks user sendiri.

## Endpoint Terkait

| Method | Path | Doc |
|---|---|---|
| GET | `/users/{userId}` | [../reference-api/users.md](../reference-api/users.md) |
| GET | `/users/{userId}/blogs` | [../reference-api/blogs.md](../reference-api/blogs.md) |
