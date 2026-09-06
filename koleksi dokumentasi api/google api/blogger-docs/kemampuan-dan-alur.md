# Kemampuan & Alur — Peta Lengkap

File ini merangkum **semua hal yang bisa dilakukan** dengan Blogger API v3 beserta **alurnya**, dan menjelaskan kode mana yang melakukan apa. Untuk detail teknis per topik, ikuti tautan ke file lain.

---

## 1. Daftar Lengkap Kemampuan

### A. Membaca Konten (API Key atau OAuth)

| Kemampuan | Endpoint | Kode inti |
|---|---|---|
| Lihat info blog (nama, URL, jumlah post) | `GET /blogs/{blogId}` | ① |
| Cari blog dari URL website | `GET /blogs/getByUrl?url=...` | ① |
| Daftar semua blog milik user | `GET /users/self/blogs` | ② |
| Daftar post terbaru / per label / per tanggal | `GET /blogs/{blogId}/posts` | ③ |
| Satu post by ID atau by path URL | `GET .../posts/{postId}`, `GET .../posts/bypath` | ③ |
| Pencarian teks di judul + konten | `GET .../posts/search?q=...` | ③ |
| Daftar halaman statis | `GET /blogs/{blogId}/pages` | — |
| Daftar komentar | `GET .../comments` | — |

```bash
# ① Info blog: {blogId} di path menentukan blog mana yang dibaca;
#    ?key= menyertakan API key agar request dihitung ke kuota project Anda.
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"

# ② users/self = user yang token-nya dipakai; response berisi SEMUA blog miliknya.
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# ③ List post: maxResults = jumlah per halaman; orderBy=published = urut terbaru;
#    labels= filter kategori; fetchBodies=false = tidak kirim konten HTML (hemat kuota bandwidth).
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=10&orderBy=published&fetchBodies=false"
```

Penjelasan alur: request masuk → Google cek kredensial (`key` atau `Bearer`) → cek kuota → data blog diambil → response JSON dikembalikan. Detail: [getting-started/overview.md](getting-started/overview.md).

### B. Menulis & Mengelola Post/Page (wajib OAuth)

| Kemampuan | Endpoint | Catatan |
|---|---|---|
| Buat post langsung live | `POST /blogs/{blogId}/posts/` | body berisi `title` + `content` HTML |
| Buat draft | `POST .../posts/?isDraft=true` | tidak tampil publik |
| Jadwalkan terbit | isi `published` di masa depan, atau `POST .../publish?publishDate=...` | status → `scheduled` |
| Edit sebagian field | `PATCH .../posts/{postId}` | aman untuk edit konten/judul |
| Ganti seluruh field | `PUT .../posts/{postId}` | field tak dikirim akan kosong |
| Unpublish (live → draft) | `POST .../posts/{postId}/revert` | data tidak hilang |
| Buang ke trash | `DELETE ...?useTrash=true` | masih bisa dipulihkan |
| Hapus permanen | `DELETE .../posts/{postId}` | tanpa `useTrash` |
| Halaman statis | `POST/PUT/PATCH/DELETE .../pages/...` | pola sama dengan post |

```bash
# -X POST       = aksi membuat resource baru (bukan sekadar membaca)
# -H Authorization = token OAuth pembuktian bahwa ini user berhak menulis
# -H Content-Type  = body yang dikirim berformat JSON
# -d '...'      = isi post: title (judul), content (HTML), labels (kategori)
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Judul", "content": "<p>Isi HTML.</p>", "labels": ["api"] }'
```

Alur lengkap draft → publish → revert → trash: [guides/publish-and-manage-posts.md](guides/publish-and-manage-posts.md).

### C. Moderasi Komentar (wajib OAuth)

| Kemampuan | Endpoint |
|---|---|
| Antrian komentar menunggu moderasi (seluruh blog) | `GET /blogs/{blogId}/comments?status=pending` |
| Setujui komentar | `POST .../comments/{commentId}/approve` |
| Tandai spam | `POST .../comments/{commentId}/markAsSpam` |
| Hapus isi saja (sisakan jejak) | `POST .../comments/{commentId}/removecontent` |
| Hapus permanen | `DELETE .../comments/{commentId}` |

Alur moderasi otomatis + penjelasan kode pipeline: [guides/moderation-comments.md](guides/moderation-comments.md).

### D. Analitik & Profil (wajib OAuth)

| Kemampuan | Endpoint |
|---|---|
| Jumlah kunjungan blog (7D / 30D / all) | `GET /blogs/{blogId}/pageviews` |
| Profil user (nama, foto, bio) | `GET /users/self` |
| Peran user di sebuah blog (ADMIN/AUTHOR) | `GET /users/self/blogs/{blogId}` → `blog_user_info.role` |
| Akses draft per post | `GET /users/self/blogs/{blogId}/posts` → `post_user_info.hasDraftAccess` |

Kegunaan: kontrol UI (tampilkan tombol "Edit" hanya untuk ADMIN), dashboard statistik, editor draft.

### E. Kendali Kuota & Ketahanan

| Kemampuan | Sumber |
|---|---|
| Menghemat request (cache, `fields`, `maxResults` besar) | [getting-started/rate-limits.md](getting-started/rate-limits.md) |
| Retry otomatis saat 429/500 dengan backoff | [guides/error-handling.md](guides/error-handling.md) |
| Interpretasi semua kode error | [getting-started/errors.md](getting-started/errors.md) |

---

## 2. Alur Besar Integrasi

```
[Tahap 1: Setup sekali]           [Tahap 2: Runtime aplikasi]
aktifkan API  ─► buat API key     token kedaluwarsa? ──ya──► refresh token ─┐
      │              │                     ▲ tidak                          │
      └─ buat OAuth client ─► OAuth flow ──┴── request + Bearer token ◄──────┘
                                        │
                    pilih operasi:      │
                    ┌───────────────────┼─────────────────────┐
                    ▼                   ▼                     ▼
              READ (key/ok)       WRITE (OAuth)         MODERASI (OAuth)
                    │                   │                     │
                    └─────── error? ────┴─────────────────────┘
                                │
                    429/500 → backoff & retry; 401 → refresh; 400/404 → perbaiki kode
```

- **Tahap 1** dijelaskan kode per kode di [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md).
- **Tahap 2** dijelaskan per endpoint di [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md).

---

## 3. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File referensi |
|---|---|
| Memahami struktur data (field JSON artinya apa) | [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) |
| Menjalankan request pertama | [getting-started/quickstart.md](getting-started/quickstart.md) |
| Publish / draft / jadwal post | [reference-api/posts.md](reference-api/posts.md) + [guides/publish-and-manage-posts.md](guides/publish-and-manage-posts.md) |
| Moderasi komentar otomatis | [guides/moderation-comments.md](guides/moderation-comments.md) |
| Mengambil ribuan post tanpa kehabisan | [guides/pagination.md](guides/pagination.md) |
| Aplikasi tidak crash saat kuota habis | [guides/error-handling.md](guides/error-handling.md) |
| Kode siap pakai (curl/Node.js/Python) | [examples/](examples/) + [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) |

---

## 4. Alur Contoh End-to-End: "Post Terjadwal Otomatis"

```bash
# LANGKAH 1 — dapatkan blogId (sekali saja, simpan hasilnya)
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → baca items[0].id dari response JSON

# LANGKAH 2 — buat post dengan jadwal terbit
#   field "published" diisi tanggal MASA DEPAN → Blogger otomatis
#   menjadwalkan (status scheduled) tanpa perlu endpoint publish
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Rilis Senin", "content": "<p>...</p>",
        "published": "2026-09-14T09:00:00+07:00" }'
# → simpan response.id untuk keperluan edit/cek nanti

# LANGKAH 3 — verifikasi post masuk daftar scheduled
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?status=scheduled&fetchBodies=false" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# LANGKAH 4 — (opsional) batalkan jadwal: revert → jadi draft
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/revert" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Penjelasan:

1. **Langkah 1** wajib OAuth karena `self` hanya valid dengan token; API key tidak cukup.
2. **Langkah 2**: `-X POST` = aksi tulis; body JSON `published` dengan offset zona `+07:00` memastikan jam terbet sesuai WIB. Tanpa `isDraft=true`, post tidak jadi draft — tapi karena tanggalnya masa depan, Blogger menahannya sebagai `scheduled`, bukan live.
3. **Langkah 3**: parameter `status=scheduled` diperlukan karena tanpa parameter status, list hanya mengembalikan post `live`.
4. **Langkah 4**: `revert` memindahkan scheduled/draft kembali ke draft; ini juga cara mem-batalkan publikasi post yang sudah live.

Implementasi siap pakai dari alur ini ada di [examples/nodejs.md](examples/nodejs.md) (fungsi `insertPost`) dan [examples/python.md](examples/python.md).
