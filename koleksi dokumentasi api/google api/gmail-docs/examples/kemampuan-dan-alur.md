# Kemampuan Contoh Kode & Alur Implementasi — Penjelasan Kode

File ini menjelaskan **kode mana di [examples/](.) yang melakukan apa**, fungsi demi fungsi.

---

## 1. Peta Contoh per Bahasa

| File | Bahasa | Library | Dipakai saat |
|---|---|---|---|
| [curl.md](curl.md) | shell | curl | Uji cepat endpoint, debug, cron sederhana |
| [nodejs.md](nodejs.md) | Node.js | `googleapis` | Backend JS/TS; refresh token otomatis |
| [python.md](python.md) | Python | `google-api-python-client` | Script/worker Python, parsing email |

> Di PowerShell pakai `curl.exe` (bukan alias `Invoke-WebRequest`).

## 2. Alur Implementasi Rekomendasi

```
1. Setup OAuth (scope minimal sesuai kebutuhan)
2. users.getProfile          ← verifikasi token & mailbox
3. messages.list + get       ← baca (wrap dengan pagination)
4. messages.send / drafts    ← tulis (wrap dengan retry + antrian)
5. watch + history           ← realtime sync
6. Pantau kuota & error rate
```

---

## 3. Walkthrough examples/nodejs.md

### 3.1 Setup auth

```js
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,      // (1) identitas app
  process.env.GMAIL_CLIENT_SECRET,  // (2) rahasia app
  process.env.GMAIL_REDIRECT_URI    // (3) callback OAuth
);
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN }); // (4)
const gmail = google.gmail({ version: 'v1', auth: oauth2Client }); // (5) klien API; refresh otomatis
```

### 3.2 makeRaw — jantung pengiriman email

```js
const makeRaw = (to, subject, body) => Buffer.from(
  `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`
).toString('base64url');
// (1) header To/Subject + Content-Type
// (2) \r\n\r\n = pemisah header/body — WAJIB di RFC 2822
// (3) base64url (bukan base64 biasa) — format yang diminta field raw
```

### 3.3 Operasi

```js
await gmail.users.messages.list({ userId: 'me', q: 'is:unread', maxResults: 10 });
// (1) list hanya memberi { id, threadId } — isi diambil per email

await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
// (2) full → payload.headers (Subject/From) + payload.parts (isi & lampiran)

await gmail.users.messages.send({ userId: 'me', requestBody: { raw: makeRaw(...) } });
// (3) 100 unit kuota per panggilan

await gmail.users.messages.modify({
  userId: 'me', id: msgId,
  requestBody: { removeLabelIds: ['UNREAD', 'INBOX'], addLabelIds: ['Label_123'] },
});
// (4) removeLabelIds INBOX = arsip; tambah label kustom = kategorisasi

await gmail.users.messages.batchModify({ userId: 'me', requestBody: { ids: [...], removeLabelIds: ['INBOX'] } });
// (5) hingga 1000 email — 1 panggilan menghemat kuota vs loop

const draft = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw } } });
await gmail.users.drafts.send({ userId: 'me', id: draft.data.id, requestBody: {} });
// (6) create → send; draft hilang setelah terkirim
```

### 3.4 Attachment decode

```js
const buf = Buffer.from(att.data.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
// (1) base64url → base64 biasa → binary
fs.writeFileSync('file.pdf', buf);
```

### 3.5 Watch + History

```js
await gmail.users.watch({ userId: 'me',
  requestBody: { topicName: `projects/${PROJECT_ID}/topics/gmail-push`, labelIds: ['INBOX'] } });
// (1) simpan w.data.historyId = checkpoint; expiration ±7 hari → cron ulang

const res = await gmail.users.history.list({ userId: 'me', startHistoryId });
for (const h of res.data.history ?? []) {
  for (const added of h.messagesAdded ?? []) { /* email baru */ }
}
return res.data.historyId; // (2) checkpoint BARU dari field atas response
```

---

## 4. Walkthrough examples/python.md

### 4.1 make_raw dengan MIMEText

```python
msg = MIMEText(body, "plain", "utf-8")  # (1) header Content-Type otomatis benar
msg["To"] = to; msg["Subject"] = subject
raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
# (2) urlsafe_b64encode = base64url persis seperti makeRaw versi Node
```

### 4.2 Pola pemanggilan

```python
service.users().messages().list(userId="me", q="is:unread").execute()
# pola: service.users().<resource>().<method>(...).execute()
# execute() = kirim request nyata (habiskan kuota)

service.users().messages().modify(
    userId="me", id=msg_id,
    body={"removeLabelIds": ["UNREAD", "INBOX"]},
).execute()
# body= = payload JSON (padanan requestBody di Node)
```

### 4.3 retryable wrapper

```python
def retryable(fn, retries=5):
    for attempt in range(retries):                 # (1) maks 5 percobaan
        try:
            return fn()                            # (2) eksekusi
        except HttpError as e:                     # (3) semua error API = HttpError
            reason = e.error_details[0]["reason"]  # (4) reason resmi
            if e.resp.status == 403 and reason == "dailyLimitExceeded":
                raise                              # (5) kuota harian → no-retry
            if e.resp.status in (429, 500, 503) or "rateLimit" in reason:
                delay = min(2 ** attempt, 32)      # (6) backoff + jitter
                time.sleep(delay + random.uniform(0, delay * 0.3))
                continue
            raise                                  # (7) 400/404/403 → gagal cepat
```

---

## 5. Walkthrough examples/curl.md

| Blok | Kode melakukan apa |
|---|---|
| Read | GET dengan `q=`/`labelIds=` (operator encode `%3A`), `format=metadata` untuk dashboard ringan |
| Send | POST body `{ raw }` — raw hasil encode aplikasi (python3/Node), bukan teks biasa |
| Modify | `/modify` satu email, `batchModify` hingga 1000 (response 204) |
| Drafts | create (message.raw) → send (id) → delete |
| Sync & Push | `history.list?startHistoryId=` delta; `watch` dengan topicName Pub/Sub |
| Settings & Token | PUT vacation; refresh token via endpoint oauth2 |

Pola membaca perintah curl:

```
curl -X POST "URL" -H "Authorization: Bearer TOKEN" -d '{ "raw": "..." }'
      │        │             │                          └── payload JSON
      │        │             └── kredensial WAJIB (API key tak berlaku)
      │        └── endpoint gmail.googleapis.com/gmail/v1/users/me/...
      └── metode; tanpa -X = GET
```

---

## 6. Checklist Adaptasi ke Aplikasi Anda

1. [ ] Scope minimal: readonly/send dulu, modify bila perlu ubah label.
2. [ ] Kredensial via env var / secret store.
3. [ ] `makeRaw`/`make_raw` satu helper terpusat (encoding base64url konsisten).
4. [ ] Send massal → antrian + jeda + retry idempotent (Message-ID deterministik).
5. [ ] List besar → pagination + `format=metadata` dulu.
6. [ ] Realtime → watch + cron re-watch harian + history checkpoint.
7. [ ] Log `status` + `reason` tiap error untuk pantau kuota.
