# Kemampuan Lanjutan & Alur Kerja — Walkthrough Kode

File ini merangkum **kemampuan lanjutan** dari setiap guide dan **menjelaskan kode di dalamnya baris per baris** — kode mana yang melakukan apa.

---

## 1. Peta Guide → Kemampuan → Alur

| Guide | Kemampuan yang diberikan | Alur inti |
|---|---|---|
| [publish-and-manage-posts.md](publish-and-manage-posts.md) | Siklus hidup post lengkap | insert draft → publish → patch → revert → trash |
| [moderation-comments.md](moderation-comments.md) | Moderasi otomatis | list pending → klasifikasi → aksi |
| [labels-and-search.md](labels-and-search.md) | Kategori & pencarian | filter label (AND), query `q` |
| [pagination.md](pagination.md) | Ambil dataset besar | loop pageToken |
| [error-handling.md](error-handling.md) | Aplikasi tangguh | klasifikasi error → backoff → retry |

---

## 2. Walkthrough Kode Publish (publish-and-manage-posts.md)

### 2.1 Buat draft

```bash
curl -X POST ".../posts/?isDraft=true" -d '{ "title": "...", "content": "..." }'
```

- `POST` = buat resource baru; `isDraft=true` = **menahan** post agar tidak tampil publik.
- Response `id` wajib disimpan — semua langkah berikutnya (publish, patch, delete) memakai ID ini.

### 2.2 Publish

```bash
curl -X POST ".../posts/POST_ID/publish"                      # terbit sekarang
curl -X POST ".../posts/POST_ID/publish?publishDate=...%2B07:00"  # terbit terjadwal
```

- Aksi `publish` adalah POST pada sub-path, bukan field yang di-patch.
- `publishDate` dengan `%2B` = encode `+` zona waktu; salah encode → jadwal geser jam.

### 2.3 Update

```bash
curl -X PATCH ".../posts/POST_ID" -d '{ "content": "..." }'   # sebagian
curl -X PUT   ".../posts/POST_ID" -d '{ ...semua field... }'  # penuh
```

- **PATCH** tidak menyentuh field lain — pilihan aman untuk edit konten.
- **PUT** mengganti seluruh objek: field yang tidak dikirim (mis. `labels`) akan **hilang**.

### 2.4 Revert & hapus

```bash
curl -X POST ".../posts/POST_ID/revert"                # live → draft (unpublish)
curl -X DELETE ".../posts/POST_ID?useTrash=true"       # ke trash, bisa dipulihkan
curl -X DELETE ".../posts/POST_ID"                     # PERMANEN
```

- `revert` = membatalkan publikasi tanpa kehilangan data.
- **Perbedaan krusial**: ada/tidaknya `?useTrash=true`. Default `false` = hapus permanen.

### 2.5 Diagram transisi (dari guide)

```
insert(isDraft=true)        publish                revert
      (none) ─────────────► draft ──────────────────► live
                                ▲                      │
                                └──────────────────────┘
              DELETE(useTrash) ◄── scheduled/live
```

Kode menentukan transisi: `isDraft` saat insert (→draft), `publish` (→live), `revert` (→draft), `published` masa depan (→scheduled), `DELETE` (→terhapus/trash).

---

## 3. Walkthrough Kode Moderasi (moderation-comments.md)

```js
async function moderateComments(blogId, token, detector) {
  // (1) Ambil antrian: hanya komentar berstatus "pending" di SELURUH blog,
  //     fetchBodies=true agar field content ikut (dibutuhkan untuk klasifikasi)
  const pending = await listComments(blogId, { status: "pending", token });

  // (2) Iterasi tiap komentar; ?? [] mencegah error bila items tidak ada
  for (const c of pending.items ?? []) {

    // (3) Klasifikasi: fungsi Anda (keyword, skor spam, AI) menilai isi komentar
    const verdict = detector(c.content);

    // (4) Aksi sesuai hasil. PENTING: URL aksi memakai c.post.id (dari item),
    //     bukan postId statis, karena antrian lintas post
    if (verdict === "approve")   await approveComment(blogId, c, token);
    if (verdict === "spam")      await markAsSpam(blogId, c, token);
    if (verdict === "offensive") await removeContent(blogId, c, token);
  }
}
```

Urutan keputusan yang direkomendasikan guide:

1. Pola spam jelas → `markAsSpam` (status `spam`, tak tampil).
2. Konten berbahaya → `removecontent` (status `emptied`; isi hilang, jejak author tetap untuk audit).
3. Komentar bagus → `approve` (status `live`).

Lifecycle status yang dihasilkan kode:

```
baru → pending ──approve──► live ──markAsSpam──► spam
          │                                      │
          └───────────markAsSpam─────────────────┘
          removecontent → emptied;  DELETE → terhapus permanen
```

---

## 4. Walkthrough Kode Pagination (pagination.md)

```js
async function listAllPosts(blogId, apiKey) {
  const items = [];
  let pageToken;                       // (1) belum ada token → mulai halaman 1
  do {
    const url = new URL(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`);
    url.searchParams.set("key", apiKey);          // (2) identitas project
    url.searchParams.set("maxResults", "500");    // (3) halaman terbesar = paling hemat
    url.searchParams.set("fetchBodies", "false"); // (4) tanpa konten HTML = cepat
    if (pageToken) url.searchParams.set("pageToken", pageToken); // (5) posisi halaman

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Blogger API ${res.status}`);   // (6) gagal → hentikan

    const data = await res.json();
    items.push(...(data.items ?? [])); // (7) tumpuk hasil halaman ini
    pageToken = data.nextPageToken;    // (8) token utk halaman berikut (undefined = habis)
  } while (pageToken);                 // (9) ulangi selama token masih ada
  return items;
}
```

Poin penting: token **hanya valid** untuk kombinasi query yang sama — mengubah `orderBy`/`status` di tengah loop membuat token tidak sah. Untuk dataset besar, guide menyarankan filter `startDate` (sinkronisasi incremental) agar jumlah halaman berkurang.

---

## 5. Walkthrough Kode Error Handling (error-handling.md)

```js
const RETRYABLE = new Set([429, 500, 503]);            // (1) status yang boleh diulang
const RATE_LIMIT_REASONS = new Set([
  "userRateLimitExceeded", "rateLimitExceeded",
  "quotaExceeded", "dailyLimitExceeded",
]);                                                    // (2) reason 403 terkait kuota

async function bloggerFetch(url, options = {}, maxRetries = 5) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {   // (3) maksimal 5 percobaan
    const res = await fetch(url, options);
    if (res.ok) return res;                                   // (4) sukses → keluar

    const body = await res.json().catch(() => ({}));          // (5) parse error JSON, aman
    const reason = body?.error?.errors?.[0]?.reason;          // (6) ambil "reason" resmi Google

    if (reason === "dailyLimitExceeded") {                    // (7) kuota harian HABIS:
      throw new Error("Kuota harian habis — jangan retry otomatis"); // retry sia-sia
    }
    if (reason === "unauthorized" || res.status === 401) {    // (8) token kedaluwarsa:
      options.headers = { ...options.headers,
        Authorization: `Bearer ${await refreshAccessToken()}` };    // segarakan lalu...
      continue;                                               // ...ulangi request
    }
    if (!RETRYABLE.has(res.status) && !RATE_LIMIT_REASONS.has(reason)) {
      throw new Error(`Blogger API ${res.status}: ${body?.error?.message}`); // (9) 400/404/403
    }                                                         //     = salah kode, jangan retry

    lastErr = new Error(`Blogger API ${res.status}: ${body?.error?.message}`);
    const base = Math.min(1000 * 2 ** attempt, 32000);        // (10) backoff: 1s, 2s, 4s, 8s... maks 32s
    const jitter = Math.random() * base * 0.3;                // (11) jitter: hindari worker menabrak serentak
    await new Promise((r) => setTimeout(r, base + jitter));
  }
  throw lastErr;                                              // (12) habis retry → gagal permanen
}
```

Tabel keputusan singkat (dari guide):

| Kode | Kelas | Kode melakukan apa |
|---|---|---|
| 400, 404 | Salah klien | `throw` — perbaiki parameter, jangan ulang |
| 401 | Token mati | refresh token → `continue` |
| 403 `forbidden` | Tidak berhak | `throw` — cek peran user |
| 429 / 403 kuota / 5xx | Sementara | tunggu `2^attempt` + jitter → ulang |
| `dailyLimitExceeded` | Kuota harian | `throw` — reset hanya tengah malam PT |

Idempotensi (aman di-retry): patch/update, publish (409 "sudah live" = sukses), delete (404 = sukses), approve. **Tidak idempotent**: insert → retry bisa membuat post ganda; simpan penanda unik di aplikasi sebelum insert ulang.

---

## 6. Alur Kerja Aplikasi Produksi (menggabungkan semua guide)

```
Scheduler (tiap X menit)
   │
   ▼
ambil antrian (list pending / list updated sejak sync terakhir)  ← pagination + startDate
   │
   ▼
proses item (klasifikasi / transformasi)
   │
   ▼
aksi tulis (patch/publish/approve)  ← dibungkus bloggerFetch (backoff + refresh 401)
   │
   ▼
simpan checkpoint (timestamp sync, komentar terproses) → log status + reason
```

Rujukan implementasi lengkap per bahasa: [../examples/kemampuan-dan-alur.md](../examples/kemampuan-dan-alur.md).
