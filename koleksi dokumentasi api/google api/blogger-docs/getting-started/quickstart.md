# Quickstart

Contoh tercepat dari nol sampai publish post pertama. Prasyarat: API sudah diaktifkan dan kredensial siap ([enable-api.md](enable-api.md)).

---

## 1. Ambil Blog dengan API Key

Ganti `BLOG_ID` (lihat ID blog di URL dashboard Blogger, misal `https://www.blogger.com/blog/posts/1234567890` → ID-nya `1234567890`).

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"
```

Response ringkas:

```json
{
  "kind": "blogger#blog",
  "id": "BLOG_ID",
  "name": "Blog Saya",
  "description": "Deskripsi blog",
  "url": "https://bloganda.blogspot.com/",
  "posts": { "totalItems": 42, "selfLink": "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts" },
  "pages": { "totalItems": 3, "selfLink": "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages" }
}
```

## 2. List Post Terbaru (API Key)

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=5"
```

Response berisi array `items` dengan masing-masing objek `Post` (lihat [../resources/post.md](../resources/post.md)).

## 3. Ambil User + Blog Milik User (OAuth)

```bash
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Cara mendapatkan `ACCESS_TOKEN`: lihat [authentication.md](authentication.md). Untuk eksperimen cepat tanpa kode, gunakan **OAuth 2.0 Playground**: https://developers.google.com/oauthplayground — pilih scope `https://www.googleapis.com/auth/blogger`, authorize, lalu **Exchange authorization code for tokens**.

## 4. Publish Post Pertama (OAuth)

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "blogger#post",
    "title": "Post Pertama via API",
    "content": "<p>Halo dunia! Post ini dibuat lewat <b>Blogger API v3</b>.</p>",
    "labels": ["api", "tutorial"]
  }'
```

Response `201 Created` berisi objek `Post` lengkap dengan `id`, `url`, dan `published` timestamp.

Tips tambahan:

- Draft: tambahkan `?isDraft=true` pada URL.
- Jadwal terbit: isi field `"published": "2026-09-10T09:00:00+07:00"` pada body, atau publish manual belakangan lewat `posts.publish`.

## 5. Update Konten Post

```bash
curl -X PATCH "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "<p>Konten sudah diperbarui.</p>" }'
```

## 6. Hapus Post

```bash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Response sukses: **200 OK** dengan body kosong.

---

## Ringkasan Alur

1. `GET /users/self/blogs` → dapatkan daftar `blogId`.
2. `GET /blogs/{blogId}/posts` → baca konten yang ada.
3. `POST /blogs/{blogId}/posts/` → buat post baru.
4. `PATCH` / `DELETE` pada `/posts/{postId}` → kelola post.
5. `POST /posts/{postId}/publish` atau `/revert` → kontrol status terbit.

Lanjut ke [../guides/publish-and-manage-posts.md](../guides/publish-and-manage-posts.md) untuk alur kerja lengkap.
