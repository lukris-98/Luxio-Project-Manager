# Kemampuan Lanjutan & Alur Kerja — Walkthrough Kode

File ini merangkum **kemampuan lanjutan** dari setiap guide dan **menjelaskan kode di dalamnya** — kode mana yang melakukan apa.

---

## 1. Peta Guide → Kemampuan → Alur

| Guide | Kemampuan | Alur inti |
|---|---|---|
| [send-and-compose.md](send-and-compose.md) | Kirim/reply/HTML/multipart | RFC 2822 → base64url → send |
| [attachments-and-mime.md](attachments-and-mime.md) | Lampiran baca & tulis | find part → attachments.get → decode |
| [labels-and-search.md](labels-and-search.md) | Filter & arsip otomatis | q/labelIds → batchModify |
| [pagination.md](pagination.md) | Dataset besar | loop pageToken |
| [push-notifications.md](push-notifications.md) | Realtime | watch → Pub/Sub → history |
| [error-handling.md](error-handling.md) | Ketahanan | backoff + idempotensi |

---

## 2. Walkthrough Kirim Email (send-and-compose.md)

```js
const email = ['To: a@b.com', 'Subject: Halo', 'Content-Type: text/plain; charset="UTF-8"', '', 'Isi.'].join('\r\n');
// (1) header → baris kosong (\r\n) → body — format RFC 2822 wajib

const raw = btoa(unescape(encodeURIComponent(email)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// (2) UTF-8 aman → base64 → base64url (+→-, /→_, buang padding)

const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ raw }),
});
// (3) scope gmail.send; response = Message dengan labelIds ["SENT"]
```

Reply: tambah `threadId` di body JSON + header `In-Reply-To`/`References` berisi `Message-ID` email sebelumnya (dari `payload.headers`).

---

## 3. Walkthrough Attachment (attachments-and-mime.md)

```js
function findAttachments(part, out = []) {
  if (part.filename && part.body?.attachmentId) {          // (1) part = lampiran
    out.push({ filename: part.filename, attachmentId: part.body.attachmentId });
  }
  (part.parts || []).forEach((p) => findAttachments(p, out)); // (2) nested multipart
  return out;
}
// (3) unduh: GET .../messages/{id}/attachments/{attId} → data base64url
// (4) dekode: replace -→+, _→/ → Buffer.from(b64, 'base64')
```

Menyisipkan lampiran = **bukan endpoint**, melainkan multipart MIME di `raw`:

```
multipart/mixed; boundary="XYZ"
  ├─ text/plain        (isi)
  └─ application/pdf   (Content-Disposition: attachment; base64 file)
```

Batas: total 35 MB; base64 +33% ukuran.

---

## 4. Walkthrough Moderasi (labels-and-search.md)

```bash
# (1) cari inbox belum dibaca
curl ".../messages?q=is%3Aunread%20in%3Ainbox" ...

# (2) tandai + arsipkan massal (batch 1000 id)
curl -X POST ".../messages/batchModify" \
  -d '{ "ids": [...], "addLabelIds": ["Label_Diproses"], "removeLabelIds": ["UNREAD","INBOX"] }'
```

- `removeLabelIds: ["INBOX"]` = arsip (email tetap ada di All Mail).
- `batchModify` → HTTP 204 (body kosong) — verifikasi via status code.
- Id label kustom dari `labels.list`, bukan namanya.

---

## 5. Walkthrough Pagination (pagination.md)

```js
do {
  url.searchParams.set('maxResults', '500');              // (1) maksimum per halaman
  if (pageToken) url.searchParams.set('pageToken', pageToken); // (2) posisi
  ...
  pageToken = data.nextPageToken;                         // (3) undefined = selesai
} while (pageToken);
```

- Token hanya valid untuk kombinasi query sama — jangan ubah `q` di tengah loop.
- Dedup `id` — email baru bisa masuk antar halaman.

---

## 6. Walkthrough Push (push-notifications.md)

```
watch(topicName, labelIds=[INBOX]) ──► simpan historyId + expiration (±7 hari)
        │
Pub/Sub push ──► webhook: decode base64 { emailAddress, historyId }
        │           └─ res 200 cepat, sync diantrekan
        ▼
history.list(startHistoryId) ──► messagesAdded → proses ──► simpan response.historyId
```

- Re-watch harian (`stop` → `watch`) — expiration wajib diperbarui.
- Event at-least-once → proses harus idempotent.

---

## 7. Walkthrough Error Handling (error-handling.md)

```js
for (attempt = 0..5) {
  res = fetch(...);
  if (res.ok) return;                          // (1) sukses
  if (401) refresh token → continue;           // (2) auth dipulihkan
  if (403 dailyLimitExceeded) throw;           // (3) no-retry
  if (429/500/503) backoff 2^attempt + jitter; // (4) tunggu lalu ulang
  else throw;                                  // (5) 400/404/403 → gagal cepat
}
```

Idempotensi: modify/trash/batchModify aman; **send & drafts.create tidak** — kirim ganda mungkin. Mitigasi: header `Message-ID` deterministik + cek `rfc822msgid:` sebelum retry.

---

## 8. Alur Kerja Aplikasi Produksi

```
watch aktif (cron re-watch harian)
   │
   ▼
Pub/Sub push ──► queue sync ──► history.list ──► proses delta
   │                                              │
   │                                    tergantung jenis:
   │                                    email baru ──► auto-reply (send)
   │                                    invoice ──► parse attachment
   │                                    unread ──► dashboard
   ▼
checkpoint historyId tersimpan ──► loop
```

Implementasi siap pakai: [../examples/kemampuan-dan-alur.md](../examples/kemampuan-dan-alur.md).
