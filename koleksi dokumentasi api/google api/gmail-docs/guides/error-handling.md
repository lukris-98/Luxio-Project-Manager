# Error Handling

Pola penanganan error dan retry untuk integrasi Gmail API yang tangguh.

---

## Klasifikasi Error

| Kelas | Kode | Aksi |
|---|---|---|
| Kesalahan klien | 400, 404 | **Jangan retry** — perbaiki payload/id |
| Auth | 401 | Refresh token, lalu ulangi sekali |
| Permission | 403 `forbidden` | Jangan retry — scope/hak tidak cukup |
| Rate limit | 403 `rateLimitExceeded`, 429 | Retry dengan exponential backoff |
| Kuota harian | 403 `dailyLimitExceeded` | Jangan retry — tunggu reset PT |
| Server | 500, 503 `backendError` | Retry dengan backoff |

Detail daftar reason: [../getting-started/errors.md](../getting-started/errors.md).

## Exponential Backoff + Jitter

```js
const RETRYABLE = new Set([429, 500, 503]);

async function gmailFetch(url, options = {}, maxRetries = 5) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {     // (1) maks 5 percobaan
    const res = await fetch(url, options);
    if (res.ok) return res;                                     // (2) sukses

    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason;            // (3) reason resmi Google

    if (res.status === 401) {                                   // (4) token mati → refresh → ulang
      options.headers = { ...options.headers, Authorization: `Bearer ${await refreshToken()}` };
      lastErr = new Error('401 — token di-refresh');
      continue;
    }
    if (res.status === 403 && reason === 'dailyLimitExceeded') {
      throw new Error('Kuota harian habis — jangan retry otomatis'); // (5) no-retry
    }
    if (!RETRYABLE.has(res.status) && !reason?.includes('rateLimit')) {
      throw new Error(`Gmail API ${res.status}: ${body?.error?.message}`); // (6) 400/404/403 → gagal cepat
    }

    lastErr = new Error(`Gmail API ${res.status}: ${body?.error?.message}`);
    const base = Math.min(1000 * 2 ** attempt, 32000);          // (7) 1s,2s,4s,... maks 32s
    const jitter = Math.random() * base * 0.3;                  // (8) anti-tabrakan worker
    await new Promise((r) => setTimeout(r, base + jitter));
  }
  throw lastErr;                                                // (9) habis retry → gagal permanen
}
```

## Idempotensi Operasi Tulis

| Operasi | Retry aman? | Catatan |
|---|---|---|
| `messages.send` | ⚠️ Tidak idempotent | Retry bisa mengirim ganda — simpan `Message-ID` header sebelum kirim; cek duplikat via search `rfc822msgid:` bila ragu |
| `messages.modify` | ✅ Aman | Efek sama bila diulang |
| `trash` / `untrash` | ✅ Aman | Idempotent |
| `drafts.create` | ⚠️ Tidak | Retry membuat draft ganda — cek sebelum insert |
| `batchModify` | ✅ Aman | 204 walau sebagian id sudah tidak ada |
| `watch` | ✅ Aman | Menimpa watch lama |

## Logging & Observability

1. Log `status`, `reason`, endpoint (tanpa token) untuk tiap error.
2. Alarm saat `dailyLimitExceeded` — indikasi perlu kanal kirim lain (SMTP relay) atau kenaikan kuota.
3. Track unit kuota: hitung send=100, get=5, list=5 dalam counter rolling 1 detik; throttle sebelum 250.

## Circuit Breaker Sederhana

```
error rate > 50% dalam 1 menit ──► hentikan request 2 menit ──► coba 1 request probe ──► pulih / ulangi
```

Mencegah ratusan request gagal saat insiden Google sebelah.
