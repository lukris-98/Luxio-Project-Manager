# Users API

Endpoint resource `User`.

> API Reference / Users

---

## GET /users/{userId}

Mengambil data user Blogger.

```bash
curl "https://www.googleapis.com/blogger/v3/users/self" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `userId` (string, path, wajib) — ID user. `self` = user terautentikasi.

### Response

Objek `User` — lihat [../resources/user.md](../resources/user.md).

```json
{
  "kind": "blogger#user",
  "id": "g101234567890123456789",
  "displayName": "Nama Tampilan",
  "url": "https://www.blogger.com/profile/101234567890123456789",
  "image": { "url": "https://lh3.googleusercontent.com/...=s512" },
  "blogs": { "selfLink": "https://www.googleapis.com/blogger/v3/users/g101.../blogs" }
}
```

### Errors

- `401 unauthorized` — token hilang/kedaluwarsa.
- `403` — scope tidak memadai.
- `404` — userId tidak dikenal.

---

## Lihat Juga

- List blog milik user: `GET /users/{userId}/blogs` → [blogs.md](blogs.md)
