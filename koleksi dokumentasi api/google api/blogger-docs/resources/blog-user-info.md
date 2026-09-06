# Resource: BlogUserInfo

`BlogUserInfo` adalah gabungan resource `Blog` dan peran user pada blog tersebut. Dikembalikan oleh endpoint `blogUserInfos.get`.

---

## Representasi JSON

```json
{
  "kind": "blogger#blogUserInfo",
  "blog": { "...objek Blog lengkap...": "" },
  "blog_user_info": {
    "kind": "blogger#blogPerUserInfo",
    "userId": "g101234567890123456789",
    "blogId": "1234567890123456789",
    "photosTotalItems": 512,
    "hasAdminRole": true,
    "role": "ADMIN"
  }
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | string | `blogger#blogUserInfo` |
| `blog` | object | Objek `Blog` lengkap (lihat [blog.md](blog.md)) |
| `blog_user_info.kind` | string | `blogger#blogPerUserInfo` |
| `blog_user_info.userId` | string | ID user |
| `blog_user_info.blogId` | long | ID blog |
| `blog_user_info.role` | string | Peran: `ADMIN`, `AUTHOR`, atau lainnya |
| `blog_user_info.hasAdminRole` | boolean | true bila user adalah admin |
| `blog_user_info.photosTotalItems` | long | Jumlah foto di storage foto blog |

## Nilai Role

| Role | Arti |
|---|---|
| `ADMIN` | Kontrol penuh: pengaturan, template, kelola penulis |
| `AUTHOR` | Dapat membuat/mengedit post |
| `NONE` / tidak ada | User bukan anggota blog |

## Kegunaan

- Memeriksa hak akses user terhadap sebuah blog sebelum menampilkan tombol aksi tulis di UI.
- Menampilkan statistik foto/storage milik user pada blog.

## Endpoint

- `GET /users/{userId}/blogs/{blogId}` — lihat [../reference-api/blog-user-infos.md](../reference-api/blog-user-infos.md)
