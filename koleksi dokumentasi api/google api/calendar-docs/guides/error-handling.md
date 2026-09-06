# Guide: Error Handling

Semua error Calendar API mengikuti format error Google API standar: objek `error` berisi `code`, `message`, `errors[].reason`. Penanganan yang benar membedakan **retryable** (saat ini) dari **non-retryable** (perlu perbaikan kode/data).

Referensi endpoint: [reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

---

## Format Error

```json
{
  "error": {
    "code": 403,
    "message": "Rate limit exceeded...",
    "errors": [
      { "domain": "calendar", "reason": "quotaExceeded", "message": "Rate limit exceeded..." }
    ]
  }
}
```

## Kode yang Umum di Calendar API

| Kode | `reason` umum | Penyebab | Perlakuan |
|---|---|---|---|
| 400 | `invalid`, `required` | Field salah format (`dateTime` tanpa offset), parameter ilegal | Perbaiki request — jangan retry |
| 400 | `invalid_grant` | Refresh token mati | OAuth re-authorization |
| 401 | `authError` | Token kadaluarsa/salah scope | Refresh `ACCESS_TOKEN` lalu ulang |
| 403 | `quotaExceeded` | Melewati batas kuota | Backoff + retry sesudah jeda; kurangi frekuensi |
| 403 | `rateLimitExceeded`, `userRateLimitExceeded` | Terlalu cepat dari satu pengguna | Exponential backoff per pengguna |
| 403 | `calendarUsageLimitsExceeded` | Batas pemakaian kalender | Kurangi pola akses; hubungi dukungan bila wajar |
| 403 | `forbidden` | Tidak punya role pada kalender | Cek ACL — [reference-api/acl.md](../reference-api/acl.md) |
| 404 | `notFound` | `CALENDAR_ID`/`EVENT_ID` salah atau event dihapus | Sinkron ulang; jangan retry blind |
| 409 | `duplicate` | ACL/calendarList sudah ada, atau slot bentrok | Abaikan atau ambil resource yang ada |
| 410 | `gone` | `syncToken` kedaluwarsa | Full resync — [sync-tokens.md](sync-tokens.md) |
| 412 | `conditionNotMet` | Etag mismatch (`If-Match`) | Ambil ulang resource, gabungkan perubahan, tulis lagi |
| 429 | — | Terlalu banyak request | Backoff dengan jitter |
| 500/503 | `backendError`, `internalError` | Gangguan sisi Google | Retry dengan backoff — sering membaik sendiri |

## Pola Retry (Node.js)

```js
async function withRetry(fn, { maxAttempts = 5, baseMs = 500 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status;
      const retryable = [429, 500, 502, 503].includes(status);          // (1) kelas retryable
      attempt++;
      if (!retryable || attempt >= maxAttempts) throw err;
      const jitter = Math.random() * baseMs;
      const delay = baseMs * 2 ** (attempt - 1) + jitter;               // (2) exponential backoff
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Pemakaian
const ev = await withRetry(() =>
  fetch(url, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }).then(async r => {
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      const e = new Error(body?.error?.message ?? r.statusText);
      e.status = r.status;                    // (3) bawa reason untuk keputusan retry
      e.reason = body?.error?.errors?.[0]?.reason;
      throw e;
    }
    return r.json();
  })
);
```

## Keputusan Berdasarkan `reason`

```python
def handle_error(r):
    body = r.json().get("error", {})
    reason = (body.get("errors") or [{}])[0].get("reason", "")
    if r.status_code == 403 and reason == "quotaExceeded":
        schedule_retry_backoff()          # (1) tunggu menit berikutnya, kurangi throughput
    elif r.status_code == 410:
        run_full_resync()                 # (2) token sync mati
    elif r.status_code == 412:
        refetch_and_merge()               # (3) etag usang
    elif r.status_code in (400, 404):
        log_and_skip(body)                # (4) bug data/kode — retry tidak berguna
    else:
        raise RuntimeError(body)
```

## Praktik Pencegahan

| Praktik | Mengurangi |
|---|---|
| `syncToken` + push notification | Full list berulang (kuota) |
| `batch` permintaan kecil | Latensi, jumlah call |
| `maxResults` maksimum | Jumlah halaman |
| `PATCH` bukan `PUT` | Konflik etag, payload |
| Simpan `iCalUID` | Duplikat event saat retry insert |
| Backoff dengan jitter | Thundering herd saat pemulihan |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Jangan retry semua | 400/401/403 `forbidden`/404 tidak akan membaik dengan diulang |
| Kuota | Angka spesifik bergantung proyek — pantau di Console, jangan hardcode |
| Error bersifat per request | Satu call gagal tidak menggagalkan batch lain yang terpisah |
| `412` normal | Tanda konkurensi sehat; jangan perlakukan sebagai fatal |
| Log `reason` | `reason` lebih stabil untuk logika daripada `message` |

> Prinsip: retry hanya yang membaik sendiri, resync saat token mati, perbaiki kode saat 4xx — dan selalu log `reason`, bukan cuma status.
