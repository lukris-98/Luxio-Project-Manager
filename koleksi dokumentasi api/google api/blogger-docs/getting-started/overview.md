# Overview

Blogger API v3 adalah API REST dari Google yang memungkinkan aplikasi mengelola konten Blogger secara programatis: membaca blog, membuat/mengubah/menghapus post dan page, serta memoderasi komentar.

- Base URL: `https://www.googleapis.com/blogger/v3`
- Semua response dikembalikan dalam format **JSON**.
- Dokumentasi resmi: https://developers.google.com/blogger/docs/3.0/reference

---

## Model Resource

```
User
 └── Blog (satu user punya satu atau lebih blog)
      ├── Post (entri blog)
      │    └── Comment (komentar pada post)
      ├── Page (halaman statis, misal "About")
      ├── PageViews (statistik kunjungan)
      └── UserInfo / PostUserInfo (info relatif terhadap user)
```

| Resource | Kunci | Deskripsi |
|---|---|---|
| `Blog` | `id` | Blog: nama, deskripsi, URL, locale, status |
| `Post` | `id`, `blog.id` | Entri: judul, konten HTML, label, status (`live`, `draft`, `scheduled`) |
| `Page` | `id`, `blog.id` | Halaman statis: judul, konten HTML, status |
| `Comment` | `id`, `blog.id`, `post.id` | Komentar: isi, author, status (`live`, `pending`, `spam`, `emptied`) |
| `User` | `id` | Profil user Blogger (`self` untuk user terautentikasi) |
| `PageViews` | — | Jumlah kunjungan per rentang waktu (`30D`, `7D`, `all`) |
| `BlogUserInfo` | `blog_user_info` | Gabungan blog + peran user di blog tersebut |
| `PostUserInfo` | `post_user_info` | Gabungan post + status draft/komposisi milik user |

---

## Kasus Penggunaan Umum

1. **Auto-publish konten** — publish post dari CMS pihak ketiga, AI writer, atau job scheduler.
2. **Sinkronisasi konten** — backup post/pages ke database lokal, atau mirror antar blog.
3. **Moderasi komentar otomatis** — approve, tandai spam, atau hapus komentar terprogram.
4. **Statistik pembaca** — ambil pageviews per blog untuk dashboard analitik.
5. **Manajemen multi-blog** — kelola beberapa blog milik satu user dari satu aplikasi.

---

## Prinsip Dasar Request

Semua endpoint diakses via HTTPS dengan pola:

```
https://www.googleapis.com/blogger/v3/{resource}/{id}?{params}
```

Autentikasi ditempel pada query parameter `key` (API key untuk akses publik read-only) atau header `Authorization: Bearer {access_token}` (OAuth untuk akses pribadi/tulis).

Karena data blog bersifat publik, endpoint read bisa memakai API key saja. Semua operasi tulis (insert/update/delete/publish/approve) **wajib OAuth 2.0** dengan scope yang sesuai. Lihat [authentication.md](authentication.md).

---

## Konvensi Endpoint

| Konvensi | Arti |
|---|---|
| `GET` | Membaca resource |
| `POST` | Membuat resource atau aksi khusus (`publish`, `revert`, `approve`, `markAsSpam`) |
| `PUT` | Mengganti resource sepenuhnya |
| `PATCH` | Mengubah sebagian field resource |
| `DELETE` | Menghapus resource |
| `?maxResults=N` | Batasi jumlah item list (biasanya maksimal 500, kecuali dinyatakan lain) |
| `?pageToken=T` | Ambil halaman berikutnya dari hasil list |
| `?view=READER` / `AUTHOR` / `ADMIN` | Level detail: `ADMIN` menampilkan metrik tambahan (mis. `pageviews`) |

---

## Batasan Penting

- PageViews API hanya tersedia untuk blog tertentu dan bisa mengembalikan error `403` jika diaktifkan untuk user yang tidak berhak.
- Konten post memakai **HTML** di field `content`; Blogger menyimpan HTML apa adanya.
- Post bersifat draft dikirim dengan query `isDraft=true` saat insert, atau dipublikasikan belakangan lewat `posts.publish`.
- Kuota default berada di sekitar 10.000 queries/hari; pantau di Google Cloud Console. Lihat [rate-limits.md](rate-limits.md).
