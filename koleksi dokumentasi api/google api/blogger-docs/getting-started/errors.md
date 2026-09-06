# Error Codes

Blogger API v3 mengembalikan error dalam format JSON standar Google:

```json
{
  "error": {
    "code": 403,
    "message": "Daily Limit Exceeded",
    "errors": [
      {
        "domain": "usageLimits",
        "reason": "dailyLimitExceeded",
        "message": "Daily Limit Exceeded"
      }
    ]
  }
}
```

---

## Daftar Error Umum

| HTTP | `reason` | Penyebab | Solusi |
|---|---|---|---|
| 400 | `invalid` / `invalidParameter` / `invalidQuery` | Parameter salah format (misal `maxResults=abc`), body JSON rusak | Periksa parameter & body |
| 400 | `required` | Parameter wajib hilang (misal `blogId` kosong) | Lengkapi parameter |
| 401 | `unauthorized` | Access token hilang/kedaluwarsa/tak valid | Refresh token atau login ulang |
| 403 | `forbidden` | Token tidak punya izin untuk blog/resource tsb | Pastikan user adalah admin/penulis blog |
| 403 | `dailyLimitExceeded` | Kuota harian habis | Tunggu reset (tengah malam PT) atau ajukan kenaikan kuota |
| 403 | `userRateLimitExceeded` | Terlalu banyak request per user | Backoff + jeda antar request |
| 403 | `rateLimitExceeded` | Terlalu banyak request dari project | Backoff + optimasi jumlah request |
| 403 | `quotaExceeded` | Kuota umum habis | Sama dengan di atas |
| 404 | `notFound` | `blogId` / `postId` / `pageId` / `commentId` salah atau dihapus | Validasi ID sebelum operasi |
| 404 | `blogNotFound` | Blog tidak ada / tidak terlihat oleh token | Cek `blogId` dan hak akses |
| 409 | `conflict` | Update bertabrakan (versi/etag) | Ambil ulang resource lalu update lagi |
| 429 | `resourceExhausted` | Rate limit keras tercapai | Exponential backoff |
| 500 | `backendError` / `internalError` | Gangguan di sisi Google | Retry dengan backoff; jarang, biasanya sementara |
| 503 | `backendError` | Layanan sedang tidak tersedia | Retry dengan backoff |

---

## Error Spesifik Operasi

| Operasi | Error umum |
|---|---|
| `posts.insert` | `403` jika token tanpa scope `blogger` (pakai readonly) |
| `posts.publish` | `400 postNotFound`, `409` bila post sudah `live` |
| `posts.revert` | `409` bila post sudah `draft` |
| `comments.approve` | `403` bila komentar bukan status `pending` |
| `comments.delete` | `404` bila komentar sudah dihapus permanen |
| `pageViews.get` | `403 bloggerPageviewsForbidden` bila user tidak berhak melihat statistik blog |

---

## Pola Cek Error (pseudocode)

```js
async function callBloggerAPI(fetchFn) {
  try {
    const res = await fetchFn();
    if (!res.ok) {
      const body = await res.json();
      const reason = body?.error?.errors?.[0]?.reason;
      if (reason === "userRateLimitExceeded" || res.status === 429) {
        // tunggu lalu retry — lihat guides/error-handling.md
      }
      if (res.status === 401) {
        // refresh token
      }
      throw new Error(`Blogger API ${res.status}: ${body?.error?.message}`);
    }
    return await res.json();
  } catch (err) {
    throw err;
  }
}
```

Panduan lengkap retry: [../guides/error-handling.md](../guides/error-handling.md).
