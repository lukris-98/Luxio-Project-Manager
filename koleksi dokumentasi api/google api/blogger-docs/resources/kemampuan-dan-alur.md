# Kemampuan per Resource & Aliran Data — Penjelasan Field

File ini menjelaskan **apa yang bisa dilakukan dengan setiap resource** (model data), **field mana yang dipakai untuk apa**, dan **aliran data** antar resource.

---

## 1. Peta Resource & Kemampuannya

| Resource | Bisa dipakai untuk | Field kunci yang menentukan perilaku |
|---|---|---|
| `Blog` | Identifikasi blog, hitung konten, cek domain | `id` (dipakai di semua endpoint lain), `url`, `posts.totalItems` |
| `Post` | CRUD artikel, jadwal terbit, kategori | `published` (jadwal), `labels` (filter), `content` (HTML), `status` |
| `Page` | CRUD halaman statis (About, Kontak) | `content`, `status` (`live`/`draft`/`imported`) |
| `Comment` | Moderasi, tampilan thread | `inReplyTo` (balasan), `author` (komentator), `content` |
| `User` | Profil, identitas penulis | `id` (prefiks `g`), `image.url`, `displayName` |
| `BlogUserInfo` | Kontrol hak akses per user | `blog_user_info.role`, `hasAdminRole` |
| `PostUserInfo` | Deteksi akses draft per post | `post_user_info.hasDraftAccess` |
| `PageViews` | Grafik statistik kunjungan | `counts[].timeRange`, `counts[].count` |

## 2. Aliran Data Antar Resource

```
User (users/self)
  │  punya
  ▼
Blog (blogId) ──────────────► PageViews (statistik blog)
  │ punya
  ├──► Post (postId)
  │       │ punya
  │       └──► Comment (commentId)
  └──► Page (pageId)

Relasi per-user:
User + Blog  = BlogUserInfo (peran ADMIN/AUTHOR)
User + Post  = PostUserInfo (akses draft)
```

Alur kerja umum: `users/self/blogs` → dapatkan `blogId` → `posts.list` untuk konten → simpan `postId` → operasi lanjutan (patch/publish/moderasi) selalu menyertakan `blogId` (+`postId`/`commentId`).

---

## 3. Field Mana untuk Apa — Post (paling sering dipakai)

```json
{
  "kind": "blogger#post",
  "id": "7149347677654321001",
  "blog": { "id": "1234567890123456789" },
  "published": "2026-09-14T09:00:00+07:00",
  "updated": "2026-08-30T14:05:11+07:00",
  "url": "https://bloganda.blogspot.com/2026/09/post-pertama.html",
  "title": "Post Pertama",
  "content": "<p>Isi HTML.</p>",
  "labels": ["api", "tutorial"],
  "replies": { "totalItems": 3 },
  "author": { "displayName": "Nama", "image": { "url": "https://..." } },
  "etag": "\"etag-value\""
}
```

| Field | Dipakai untuk (kode mana memakainya) |
|---|---|
| `id` | Semua operasi tulis: `PATCH /posts/{id}`, `publish`, `revert`, `delete`. Simpan setelah insert |
| `blog.id` | Menyusun path endpoint (setiap endpoint post memerlukan `blogId` + `postId`) |
| `published` | **Menjadwalkan terbit**: POST insert dengan nilai masa depan → status `scheduled`. Juga filter `startDate`/`endDate` |
| `updated` | Sinkronisasi incremental: request `orderBy=updated&startDate=SYNC_TERAKHIR` hanya mengambil yang berubah |
| `url` | Menautkan post di aplikasi Anda tanpa membentuk URL manual |
| `title`, `content` | Isi artikel. `content` = HTML; dikirim saat insert/patch |
| `labels` | Kategori. Dipakai `posts.list?labels=` (AND). Maksimal 20, case-sensitive |
| `replies.totalItems` | Badge "3 komentar" di UI tanpa memanggil endpoint komentar |
| `author` | Menampilkan penulis + avatar |
| `etag` | Caching: kirim header `If-None-Match` → 304 = tidak ada perubahan, hemat kuota |

## 4. Field Mana untuk Apa — Resource Lain

### Blog

| Field | Dipakai untuk |
|---|---|
| `id` | Kunci utama: `GET /blogs/{id}/posts`, semua operasi tulis |
| `url` | Pencocokan domain (misal user memasukkan URL → pakai `blogs.getByUrl` untuk dapat `id`) |
| `posts.totalItems` | Indikator jumlah data sebelum pagination |
| `status` (`view=ADMIN`) | Deteksi blog `deleted` sebelum operasi tulis |
| `pageViews.total` (`view=ADMIN`) | Angka kunjungan total sekali panggil (tanpa endpoint pageviews) |

### Comment

| Field | Dipakai untuk |
|---|---|
| `id` + `post.id` | Endpoint moderasi wajib keduanya: `/blogs/{blogId}/posts/{post.id}/comments/{id}/approve` |
| `content` | Input klasifikasi spam/penilaian (lihat pipeline di [../guides/moderation-comments.md](../guides/moderation-comments.md)) |
| `inReplyTo.id` | Membangun tampilan thread (komentar membalas komentar mana) |
| `author.displayName` | Tampilan "ditulis oleh" |

### PageViews

| Field | Dipakai untuk |
|---|---|
| `counts[].timeRange` | Label periode di grafik (`7D`, `30D`, `all`) |
| `counts[].count` | Nilai kunjungan; tipe **string** → konversi `parseInt` sebelum dihitung |

### BlogUserInfo

| Field | Dipakai untuk |
|---|---|
| `blog_user_info.role` | `ADMIN` → tampilkan menu pengaturan; `AUTHOR` → hanya tulis post |
| `blog_user_info.photosTotalItems` | Info pemakaian storage foto |

## 5. Alur Praktis per Kebutuhan (dengan kode)

### "Tampilkan 5 artikel terbaru di website"

```js
// (1) list post, tanpa konten (fetchBodies=false) supaya payload kecil
const res = await fetch(
  `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts` +
  `?key=${API_KEY}&maxResults=5&orderBy=published&fetchBodies=false`
);
// (2) items = array Post; cukup pakai title, url, published untuk kartu artikel
const { items } = await res.json();
```

- `orderBy=published` → urut dari terbit terbaru.
- Tanpa `status` → otomatis hanya `live` (aman untuk publik).

### "Tombol Edit hanya muncul untuk admin blog"

```js
// (1) cek peran user pada blog ini (OAuth)
const info = await fetch(
  `https://www.googleapis.com/blogger/v3/users/self/blogs/${BLOG_ID}`,
  { headers: { Authorization: `Bearer ${TOKEN}` } }
).then((r) => r.json());
// (2) role dari blog_user_info menentukan tampilan UI
const isAdmin = info.blog_user_info?.role === "ADMIN";
```

### "Dashboard kunjungan 30 hari"

```js
// (1) endpoint pageviews wajib OAuth (API key ditolak 403)
const pv = await fetch(
  `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/pageviews?range=30D`,
  { headers: { Authorization: `Bearer ${TOKEN}` } }
).then((r) => r.json());
// (2) counts[0].count = string → konversi angka untuk grafik
const views = parseInt(pv.counts.find((c) => c.timeRange === "30D").count, 10);
```

### "Draft yang bisa diedit penulis"

```js
// postUserInfos.list + status=draft → hanya draft milik user terautentikasi,
// post_user_info.hasDraftAccess memastikan izin edit
const drafts = await fetch(
  `https://www.googleapis.com/blogger/v3/users/self/blogs/${BLOG_ID}/posts?status=draft`,
  { headers: { Authorization: `Bearer ${TOKEN}` } }
).then((r) => r.json());
```

## 6. Rangkuman Alur Field → Endpoint

```
Ingin operasi X pada post
        │
   punya post.id?
   │ tidak                     │ ya
   ▼                           ▼
posts.list / posts.getByPath  PATCH/PUT/DELETE/publish/revert
(posts.getByPath dipakai      (semua pakai /blogs/{blogId}/posts/{id})
 saat hanya tahu URL artikel)
```

Detail endpoint lengkap: [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).
