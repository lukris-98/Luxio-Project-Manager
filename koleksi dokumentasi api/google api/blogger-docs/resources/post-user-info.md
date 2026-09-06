# Resource: PostUserInfo

`PostUserInfo` adalah gabungan resource `Post` dengan informasi khusus user (misal status draft/komposisi yang hanya terlihat oleh penulisnya). Dikembalikan oleh `postUserInfos.get` dan `postUserInfos.list`.

---

## Representasi JSON

```json
{
  "kind": "blogger#postUserInfo",
  "post": { "...objek Post lengkap...": "" },
  "post_user_info": {
    "kind": "blogger#postPerUserInfo",
    "userId": "g101234567890123456789",
    "blogId": "1234567890123456789",
    "postId": "7149347677654321001",
    "hasDraftAccess": true
  }
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | `blogger#postUserInfo` |
| `post` | object | Objek `Post` lengkap (lihat [post.md](post.md)) |
| `post_user_info.kind` | string | `blogger#postPerUserInfo` |
| `post_user_info.userId` | string | ID user |
| `post_user_info.blogId` | long | ID blog |
| `post_user_info.postId` | long | ID post |
| `post_user_info.hasDraftAccess` | boolean | true bila user bisa melihat versi draft post |

## Kegunaan

- Membangun daftar "semua post termasuk draft saya" untuk editor UI (kombinasikan `view=AUTHOR`).
- Memverifikasi apakah user punya akses draft sebelum menampilkan aksi edit.

## Endpoint

- `GET /users/{userId}/blogs/{blogId}/posts` — `postUserInfos.list`
- `GET /users/{userId}/blogs/{blogId}/posts/{postId}` — `postUserInfos.get`

Lihat [../reference-api/post-user-infos.md](../reference-api/post-user-infos.md).
