# Kemampuan Endpoint & Alur Request — Penjelasan Kode

File ini menjelaskan **anatomi request**, **kemampuan setiap grup endpoint**, dan **kode mana yang melakukan apa** di folder [reference-api/](.).

---

## 1. Anatomi Satu Request

```
https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish?publishDate=...
└──────────┬──────────────────┘└──┬──┘└──┬───┘└───┬──┘└───┬──┘ └────────┬─────────┘
       base URL             resource  ID     resource   ID      aksi      parameter opsional
                             "blogs" blog  "posts"  post   /publish
```

| Bagian | Arti | Contoh |
|---|---|---|
| Base URL | Selalu tetap untuk Blogger API v3 | `https://www.googleapis.com/blogger/v3` |
| Segment resource | Jenis objek yang dioperasikan | `blogs`, `posts`, `pages`, `comments`, `users` |
| Segment ID | Objek spesifik | `BLOG_ID`, `POST_ID`, `COMMENT_ID` |
| Segment aksi | Kata kerja khusus (sub-resource) | `/publish`, `/revert`, `/approve`, `/markAsSpam`, `/removecontent` |
| Query string | Opsi perilaku | `?maxResults=500`, `?isDraft=true`, `?status=draft`, `?key=API_KEY` |

Metode HTTP menentukan aksi: **GET** baca, **POST** buat/aksi, **PUT** ganti penuh, **PATCH** ubah sebagian, **DELETE** hapus.

## 2. Kemampuan per Grup Endpoint

### blogs (blogs.md)
- `GET /blogs/{blogId}` → info satu blog. *Dipakai saat*: punya blogId, butuh nama/URL/jumlah post.
- `GET /blogs/getByUrl` → *dipakai saat* hanya tahu alamat website, butuh blogId.
- `GET /users/{userId}/blogs` → *dipakai saat* login user, tampilkan semua blognya (dropdown pilih blog).

### posts (posts.md)
- `GET .../posts` → list artikel. *Dipakai*: homepage, arsip, sinkronisasi.
- `GET .../posts/{postId}` / `posts/bypath` → *dipakai*: punya ID atau URL artikel.
- `GET .../posts/search?q=` → *dipakai*: kotak pencarian internal.
- `POST .../posts/` → *dipakai*: buat artikel (dari editor/aplikasi).
- `PATCH`/`PUT .../posts/{postId}` → *dipakai*: edit. **PATCH untuk sebagian field, PUT untuk ganti semua**.
- `DELETE ...?useTrash=true` → *dipakai*: hapus aman.
- `POST .../publish` & `/revert` → *dipakai*: kontrol terbit.

### pages (pages.md)
Sama dengan posts tanpa label/komentar — *dipakai* untuk konten statis (Tentang, Kebijakan Privasi).

### comments (comments.md)
- `GET .../comments` (per post) & `GET /blogs/{blogId}/comments` (seluruh blog) → *dipakai*: antrian moderasi.
- `POST .../approve` → setujui; `/markAsSpam` → spam; `/removecontent` → hapus isi saja; `DELETE` → permanen.

### users, blog-user-infos, post-user-infos, page-views
- `GET /users/self` → profil user login (avatar, nama).
- `GET /users/self/blogs/{blogId}` → peran user (kontrol UI admin).
- `GET /users/self/blogs/{blogId}/posts` → list post termasuk **draft milik user**.
- `GET /blogs/{blogId}/pageviews` → statistik kunjungan (grafik dashboard).

## 3. Kode Anotasi per Operasi Penting

### 3.1 List + Pagination

```bash
# HALAMAN 1
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=500&fetchBodies=false"
#                    └── resource blog ──┘  └── kunci    ─┘ └── ukuran ──┘ └── tanpa konten HTML ──┘

# HALAMAN 2 — nextPageToken dari response halaman 1 ditempel ke pageToken
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=500&pageToken=CgkI..."
```

- `maxResults=500` = nilai maksimum; makin besar makin hemat jumlah request.
- `pageToken` = penanda posisi halaman; token hanya valid untuk kombinasi query yang sama.
- Response tanpa `nextPageToken` = halaman terakhir → berhenti.

### 3.2 Insert (buat post)

```bash
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/?isDraft=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Judul", "content": "<p>HTML</p>", "labels": ["x"] }'
```

| Bagian | Melakukan apa |
|---|---|
| `-X POST` | Aksi membuat resource (GET tidak bisa membuat) |
| `/?isDraft=true` | Trailing `/` menandai koleksi posts; `isDraft=true` menyimpan sebagai **draft**, bukan live |
| `-H Authorization` | Wajib OAuth — API key tidak cukup untuk tulis |
| `-H Content-Type: application/json` | Memberi tahu server format body |
| `-d '{...}'` | Body post. Field minimal `title` dan/atau `content` |
| Response `201 Created` | Berisi `id` + `url` post — simpan untuk operasi lanjutan |

### 3.3 PATCH vs PUT

```bash
# PATCH — hanya field yang dikirim yang berubah (title & labels TIDAK tersentuh)
curl -X PATCH ".../blogs/BLOG_ID/posts/POST_ID" -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" -d '{ "content": "<p>Revisi</p>" }'

# PUT — seluruh objek diganti; field yang TIDAK dikirim (labels, customMetaData) jadi kosong
curl -X PUT ".../blogs/BLOG_ID/posts/POST_ID" -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Judul", "content": "<p>Lengkap</p>", "labels": ["a","b"] }'
```

**Kesimpulan kode**: untuk edit konten harian → **PATCH**. Untuk sinkronisasi penuh dari sumber data lain (field lengkap dikirim semua) → **PUT**.

### 3.4 Publish dengan Jadwal

```bash
curl -X POST ".../blogs/BLOG_ID/posts/POST_ID/publish?publishDate=2026-09-15T09:00:00%2B07:00" \
  -H "Authorization: Bearer TOKEN"
```

- Aksi `publish` = POST (kata kerja khusus, bukan GET/PUT).
- `publishDate` = jadwal; `%2B` adalah URL-encode untuk `+` (offset zona waktu) — jika tidak di-encode, `+` dibaca spasi dan jadwal salah.
- Alternatif tanpa endpoint publish: `POST insert` dengan field `published` masa depan → otomatis `scheduled`.

### 3.5 Moderasi Komentar

```bash
# 1) AMBIL ANTRIAN — listByBlog mencakup komentar SEMUA post
curl ".../blogs/BLOG_ID/comments?status=pending&fetchBodies=true" -H "Authorization: Bearer TOKEN"

# 2) APPROVE — perhatikan URL butuh postId + commentId
curl -X POST ".../blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/approve" -H "Authorization: Bearer TOKEN"
```

- **Poin krusial**: hasil langkah 1 berupa komentar lintas post; tiap item membawa `post.id`. Kode aplikasi harus memakai `item.post.id` untuk menyusun URL langkah 2 (bukan postId statis).
- `approve` mengubah status `pending`/`spam` → `live`; bila sudah live, response error 403 → perlakukan sebagai "sudah selesai".

## 4. Alur Sequence Umum

```
ALUR PUBLISH:
insert(isDraft=true) → [review di app] → publish → (opsional) revert → delete(useTrash)

ALUR MODERASI:
list(status=pending) → loop item → detector(content) → approve | markAsSpam | removecontent

ALUR SINKRONISASI:
users/self/blogs → posts.list(orderBy=updated, startDate=lastSync)
                 → simpan updated terbaru → next sync pakai sebagai startDate

ALUR ANALITIK:
users/self → pageviews.get(range=30D) → parse counts[] → grafik
```

## 5. Parameter yang Sering Salah Dipakai

| Parameter | Kesalahan umum | Benar |
|---|---|---|
| `status` | Lupa isi → draft tidak muncul di list | Sertakan `status=draft`/`scheduled` eksplisit |
| `useTrash` | `DELETE` langsung = permanen | Selalu `?useTrash=true` untuk penghapusan aman |
| `labels` | Angka bisa OR | Logikanya **AND** (post harus punya semua label) |
| `orderBy=updated` + `startDate` | Dianggap filter tanggal terbit | Saat `updated`, rentang mengacu tanggal update |
| `maxResults` | Mengira bisa >500 | Maksimum 500 (25 untuk postUserInfos.list) |
| `publishDate` | `+07:00` mentah di URL | Encode jadi `%2B07:00` |

Detail per endpoint: [blogs.md](blogs.md), [posts.md](posts.md), [pages.md](pages.md), [comments.md](comments.md), [users.md](users.md), [blog-user-infos.md](blog-user-infos.md), [post-user-infos.md](post-user-infos.md), [page-views.md](page-views.md).
