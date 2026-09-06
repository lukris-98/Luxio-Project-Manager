# Rate Limits & Kuota

## Kuota Default

Blogger API v3 memakai kuota per-project Google Cloud:

| Jenis | Batasan tipikal |
|---|---|
| Queries per day | ~10.000–50.000 (tergantung project/perpanjangan kuota) |
| Queries per 100 seconds per user | ~200 |
| Queries per 100 seconds per project | ~10.000 |

Angka persis tampil di **Google Cloud Console → APIs & Services → Blogger API v3 → Quotas**. Batas dapat diajukan peningkatan lewat form kuota API.

## Cara Pantau Kuota

1. **Cloud Console**: APIs & Services → Dashboard → pilih **Blogger API v3** → grafik *Traffic* dan *Quota*.
2. **Response header**: `X-RateLimit-Limit` / `X-RateLimit-Remaining` saat tersedia.

Error saat kuota habis: `403 dailyLimitExceeded`, `403 userRateLimitExceeded`, `429 resourceExhausted` (lihat [errors.md](errors.md)).

## Strategi Aman

1. **Cache hasil read** — daftar post/blog publik jarang berubah setiap menit; cache 1–5 menit mengurangi trafik drastis.
2. **Gunakan `fields` parameter** — request hanya field yang dibutuhkan, menghemat payload dan waktu:

   ```bash
   curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?fields=items(id,title,url,published)&key=API_KEY"
   ```

3. **Batch operasi tulis** — hindari loop cepat; beri jeda antar request tulis dan proses antrian di background.
4. **`maxResults` besar + pagination** — lebih hemat daripada banyak request kecil. `maxResults` maksimal 500 untuk list post.
5. **ETag / If-None-Match** — objek `Post`/`Blog` menyertakan `etag`; kirim `If-None-Match` dan konsumsi `304 Not Modified`.
6. **Backoff eksponensial saat 429/403 rate-limit** — lihat [../guides/error-handling.md](../guides/error-handling.md).

## Perhitungan Kasar

Contoh: sinkronisasi harian 1 blog dengan 2.000 post:

- 4 request list (`maxResults=500`) + 1 request blog info = **5 request/hari** → sangat aman.
- Moderasi komentar tiap 5 menit (`GET /blogs/{blogId}/comments`) = 12 request/jam = **288 request/hari** → masih aman.
- Update massal 500 post satu per satu tanpa jeda → berpotensi kena `userRateLimitExceeded`; beri jeda ≥ 1 detik antar update atau proses bertahap.
