# Error Codes

Error Gmail API berformat JSON standar Google:

```json
{
  "error": {
    "code": 403,
    "message": "Rate limit exceeded...",
    "errors": [{ "domain": "usageLimits", "reason": "rateLimitExceeded", "message": "..." }]
  }
}
```

---

## Daftar Error Umum

| HTTP | `reason` | Penyebab | Solusi |
|---|---|---|---|
| 400 | `invalidArgument` / `invalid` | Body/parameter salah (raw bukan base64url valid, threadId salah) | Perbaiki payload; cek encoding base64url |
| 400 | `failedPrecondition` | Operasi tidak valid pada kondisi mailbox | Cek status resource |
| 401 | `unauthorized` / token invalid | Token kedaluwarsa/hilang/scope salah | Refresh token; cek scope |
| 401 | `invalid_grant` | Refresh token dicabut/expired (mode Testing 7 hari) | Re-authorize |
| 403 | `forbidden` | Scope tidak cukup untuk endpoint ini | Tambah scope & re-auth |
| 403 | `rateLimitExceeded` / `userRateLimitExceeded` | >250 units/s | Backoff eksponensial |
| 403 | `dailyLimitExceeded` | Kuota project habis | Tunggu reset (tengah malam PT) |
| 404 | `notFound` | messageId / draftId / labelId salah atau sudah dihapus | Validasi id |
| 404 | `mailboxNotFound` | userId bukan user valid | Pakai `me` |
| 429 | `tooManyRequests` | Rate limit keras | Backoff |
| 500/503 | `backendError` | Gangguan sisi Google | Retry dengan backoff |

## Error Spesifik Operasi

| Operasi | Error khas |
|---|---|
| `messages.send` | 400 bila `raw` tidak bisa didekode; `403` bila melewati daily sending limit (pesan khusus di body) |
| `messages.modify` | 400 bila labelIds mengandung label sistem yang tidak boleh diubah (INBOX boleh, tapi beberapa internal tidak) |
| `labels.delete` | 400 bila label sistem (INBOX, SENT...) |
| `drafts.send` | 404 bila draft sudah terkirim/dihapus |
| `history.list` | 400 `historyId` terlalu tua (sudah dipangkas) → full re-sync |
| `watch` | 403 bila Pub/Sub topic belum memberi akses ke `gmail-api-push@system.gserviceaccount.com` |

## Pola Cek Error (pseudocode)

```js
async function callGmailAPI(fetchFn) {
  const res = await fetchFn();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason;
    if (res.status === 401) { /* refresh token lalu retry sekali */ }
    if (res.status === 429 || reason?.includes('rateLimit')) { /* backoff */ }
    if (res.status === 403 && reason === 'dailyLimitExceeded') { /* jangan retry */ }
    throw new Error(`Gmail API ${res.status}: ${body?.error?.message}`);
  }
  return res.json();
}
```

Panduan retry lengkap: [../guides/error-handling.md](../guides/error-handling.md).
