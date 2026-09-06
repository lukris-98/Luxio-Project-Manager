# Error Handling

Pola penanganan error dan retry untuk integrasi Blogger API yang tangguh.

---

## Klasifikasi Error

| Kelas | Kode | Aksi |
|---|---|---|
| Kesalahan klien | 400, 404 | **Jangan retry** — perbaiki parameter/ID |
| Auth | 401 | Refresh access token, lalu ulangi sekali |
| Permission | 403 `forbidden` | Jangan retry — cek hak akses user |
| Rate limit | 403 `*RateLimit*`/`quota*`, 429 | Retry dengan exponential backoff |
| Server | 500, 503 | Retry dengan exponential backoff |

Detail daftar reason: [../getting-started/errors.md](../getting-started/errors.md).

## Exponential Backoff + Jitter

```js
const RETRYABLE = new Set([429, 500, 503]);
const RATE_LIMIT_REASONS = new Set([
  "userRateLimitExceeded", "rateLimitExceeded",
  "quotaExceeded", "dailyLimitExceeded",
]);

async function bloggerFetch(url, options = {}, maxRetries = 5) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);

    if (res.ok) return res;

    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason;

    if (reason === "dailyLimitExceeded") {
      throw new Error("Kuota harian habis — jangan retry otomatis");
    }
    if (reason === "unauthorized" || res.status === 401) {
      options.headers = { ...options.headers, Authorization: `Bearer ${await refreshAccessToken()}` };
      lastErr = new Error("401 — token di-refresh, coba ulangi");
      continue;
    }
    if (!RETRYABLE.has(res.status) && !RATE_LIMIT_REASONS.has(reason)) {
      throw new Error(`Blogger API ${res.status}: ${body?.error?.message ?? reason}`);
    }

    lastErr = new Error(`Blogger API ${res.status}: ${body?.error?.message}`);
    const base = Math.min(1000 * 2 ** attempt, 32000);
    const jitter = Math.random() * base * 0.3;
    await new Promise((r) => setTimeout(r, base + jitter));
  }
  throw lastErr;
}
```

Aturan:

- Base delay 1s, dobel tiap attempt, maksimum 32s, plus jitter acak agar banyak worker tidak menabrak bersamaan.
- `dailyLimitExceeded` → **jangan retry**; kuota harian hanya reset tengah malam PT.
- Maksimal 5 retry; setelah itu gagalkan job dan tandai untuk diproses ulang nanti.

## Idempotensi Operasi Tulis

| Operasi | Retry aman? | Catatan |
|---|---|---|
| `posts.insert` | ⚠️ Tidak idempotent | Retry bisa membuat post ganda — simpan idempotency key di aplikasi (misal cek judul+label sebelum insert) |
| `posts.patch` / `update` | ✅ Aman | Efek sama bila diulang |
| `posts.publish` | ✅ Aman | 409 "sudah live" bisa dianggap sukses |
| `posts.delete` | ✅ Aman | 404 bisa dianggap sukses |
| `comments.approve` | ✅ Aman | 403 "bukan pending" bisa dianggap sukses |

Pola: definisikan callback `isAlreadyDone(statusCode, reason)` per operasi agar retry tetap aman.

## Logging & Observability

1. Log `status`, `reason`, `url` (tanpa token), dan `blogId` untuk setiap error.
2. Alarm saat `quotaExceeded` terjadi — indikasi kebutuhan kenaikan kuota atau bug loop.
3. Ukur rasio error per endpoint; lonjakan 500 dari sisi Google → turunkan laju request sementara (circuit breaker sederhana).
