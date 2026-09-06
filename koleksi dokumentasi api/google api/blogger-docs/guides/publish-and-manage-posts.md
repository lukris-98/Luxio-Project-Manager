# Publish & Manage Posts

Alur kerja lengkap mengelola post: draft → publish → update → revert → trash.

---

## 1. Buat Draft

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/?isDraft=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Draft Artikel Baru",
    "content": "<p>Paragraf pembuka...</p>",
    "labels": ["produk"]
  }'
```

Simpan `id` dari response — dipakai untuk semua operasi lanjutan.

## 2. Publish Draft

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Dengan jadwal tertentu:

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish?publishDate=2026-09-15T09:00:00%2B07:00" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 3. Publish Langsung (tanpa draft)

POST tanpa `isDraft=true` → post langsung live. Jika `published` di-set ke masa depan → Blogger menjadwalkannya otomatis (status `scheduled`).

## 4. Update Post Live

Gunakan **PATCH** agar field lain tidak terreset:

```bash
curl -X PATCH "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "<p>Konten revisi.</p>" }'
```

`PUT` dipakai bila memang ingin mengganti seluruh field.

## 5. Revert ke Draft

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/revert" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Post hilang dari tampilan publik tapi tidak hilang datanya.

## 6. Hapus

```bash
# ke trash (recoverable di dashboard Blogger)
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID?useTrash=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# permanen
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Perbandingan Metode

| Kebutuhan | Metode |
|---|---|
| Tulis dulu, cek ulang, terbitkan | `POST ?isDraft=true` → `POST /publish` |
| Terbitkan langsung | `POST` tanpa `isDraft` |
| Jadwalkan terbit | `POST` dengan `published` masa depan, atau `POST /publish?publishDate=...` |
| Edit sebagian konten | `PATCH` |
| Ganti konten + label sekaligus | `PUT` |
| Unpublish sementara | `POST /revert` |
| Buang | `DELETE ?useTrash=true` (aman) atau `DELETE` (permanen) |

## Status Transition

```
            insert(isDraft=true)              publish
   (none) ────────────────────► draft ────────────────────► live
                                   ▲    ◄────────────────── │
                                   │        revert          │
                                   │                        │ DELETE(useTrash)
                                   └──── scheduled ─────────┘
                                       (published di masa depan)
```

## Gotchas

1. **PATCH dengan `labels` kosong** tidak menghapus label — gunakan `PUT` atau sertakan label final yang diinginkan.
2. **`published` di masa depan** saat insert membuat post `scheduled`, bukan live meski tanpa `isDraft`.
3. **`useTrash` default false** — `DELETE` tanpa parameter menghapus permanen; selalu pakai `useTrash=true` untuk keamanan.
4. **`publish` pada post scheduled** memindahkan terbit ke saat itu juga.
5. Bila blog punya banyak penulis, operasi tulis memerlukan token milik **admin atau penulis blog** tersebut.
