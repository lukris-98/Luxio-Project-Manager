# Moderasi Komentar

Panduan memoderasi komentar lewat API: membangun antrian moderasi, approve, spam, dan penghapusan.

---

## 1. Ambil Antrian Komentar Pending

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/comments?status=pending&fetchBodies=true&maxResults=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Atau gabungkan beberapa status:

```
?status=pending&status=spam
```

## 2. Approve Komentar

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/approve" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Berlaku untuk komentar `pending` maupun `spam`.

## 3. Tandai Spam

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/markAsSpam" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 4. Hapus Isi Saja (soft moderation)

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/removecontent" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Status menjadi `emptied`: konten hilang dari publik, tapi jejak author tetap — berguna untuk audit.

## 5. Hapus Permanen

```bash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Pipeline Moderasi Otomatis (contoh logika)

```js
async function moderateComments(blogId, token, detector) {
  const pending = await listComments(blogId, { status: "pending", token });
  for (const c of pending.items ?? []) {
    const verdict = detector(c.content); // misal keyword/spam-score/AI
    if (verdict === "approve")   await approveComment(blogId, c, token);
    if (verdict === "spam")      await markAsSpam(blogId, c, token);
    if (verdict === "offensive") await removeContent(blogId, c, token);
  }
}
```

Rekomendasi urutan keputusan:

1. Spam jelas (link massal, keyword pattern) → `markAsSpam`.
2. Konten berbahaya/ilegal → `removecontent` (hapus isi, sisakan jejak).
3. Komentar bagus → `approve`.

## Status Lifecycle

```
   komentar baru ──► pending ──approve──► live
                        │                    │
                        │ markAsSpam         │ markAsSpam
                        ▼                    ▼
                      spam ◄─────────────────┘
                        │
              removecontent / DELETE
                        ▼
                    emptied / (terhapus)
```

## Gotchas

1. **Endpoint memerlukan `postId` + `commentId`** — saat memakai hasil `GET /blogs/{blogId}/comments` (antrian seluruh blog), ambil `post.id` dari tiap item untuk menyusun URL aksi.
2. **Approve pada komentar `live`** dapat mengembalikan error — idempotensi: cek status dulu atau tangani 403 sebagai no-op.
3. **`removecontent` vs `DELETE`** — `removecontent` masih bisa dilihat di dashboard untuk audit; `DELETE` hilang selamanya.
4. Komentar `spam` tidak tampil di blog; `emptied` tampil sebagai komentar kosong bila template menampilkannya.
