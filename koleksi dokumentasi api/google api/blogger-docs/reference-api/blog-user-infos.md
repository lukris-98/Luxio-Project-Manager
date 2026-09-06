# BlogUserInfos API

Endpoint resource `BlogUserInfo` — blog + peran user pada blog tersebut.

> API Reference / BlogUserInfos

---

## GET /users/{userId}/blogs/{blogId}

Mengambil satu blog beserta info peran user pada blog itu.

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs/BLOG_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `userId` (string, path, wajib) — `self` untuk user terautentikasi.
- `blogId` (long, path, wajib).
- `maxPosts` (unsigned integer, query, optional) — jumlah maksimum post awal disertakan.
- `view` (string, query, optional) — `USER` / `READER` / `ADMIN`.

### Response

Objek `BlogUserInfo`:

```json
{
  "kind": "blogger#blogUserInfo",
  "blog": { "kind": "blogger#blog", "id": "BLOG_ID", "...": "..." },
  "blog_user_info": {
    "kind": "blogger#blogPerUserInfo",
    "userId": "g101...",
    "blogId": "BLOG_ID",
    "role": "ADMIN",
    "hasAdminRole": true,
    "photosTotalItems": 512
  }
}
```

### Errors

- `403` — user tidak punya akses ke blog.
- `404 blogNotFound`.

---

## Lihat Juga

- Model data: [../resources/blog-user-info.md](../resources/blog-user-info.md)
- Nilai role: `ADMIN`, `AUTHOR` — dipakai untuk kontrol UI aplikasi.
