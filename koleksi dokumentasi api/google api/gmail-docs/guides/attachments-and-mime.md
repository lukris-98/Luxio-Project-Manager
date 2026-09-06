# Attachments & MIME

Panduan membaca dan menyisipkan lampiran.

---

## 1. Struktur MIME Email dengan Lampiran

```
multipart/mixed
 ├── multipart/alternative          ← isi email
 │    ├── text/plain
 │    └── text/html
 └── application/pdf (attachment)   ← lampiran: filename + attachmentId
```

## 2. Membaca Lampiran

### 2.1 Temukan part lampiran

```js
// messages.get?format=full → payload.parts[] (rekursif utk nested multipart)
function findAttachments(part, out = []) {
  if (part.filename && part.body?.attachmentId) {
    out.push({ filename: part.filename, attachmentId: part.body.attachmentId, mimeType: part.mimeType, size: part.body.size });
  }
  (part.parts || []).forEach((p) => findAttachments(p, out));
  return out;
}
```

- Part lampiran punya `filename` + `body.attachmentId`.
- Rekursif penting — lampiran sering berada dalam nested `multipart/mixed`.

### 2.2 Unduh isinya

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID/attachments/ATT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 2.3 Dekode base64url ke file

```js
function decodeBase64Url(data) {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64'); // Node.js
}
```

- `-`→`+`, `_`→`/` lalu dekode base64 biasa — pola yang sama untuk isi email.

## 3. Menyisipkan Lampiran Saat Kirim

Lampiran **tidak lewat endpoint** — bagian dari `raw` multipart:

```
To: tujuan@example.com
Subject: Dengan lampiran
Content-Type: multipart/mixed; boundary="XYZ"

--XYZ
Content-Type: text/plain; charset="UTF-8"

Isi email.
--XYZ
Content-Type: application/pdf; name="laporan.pdf"
Content-Disposition: attachment; filename="laporan.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjcK...
--XYZ--
```

Encode:

```js
const b64File = fs.readFileSync('laporan.pdf').toString('base64');
const raw = [
  'To: tujuan@example.com', 'Subject: Dengan lampiran',
  'Content-Type: multipart/mixed; boundary="XYZ"', '', '--XYZ',
  'Content-Type: text/plain; charset="UTF-8"', '', 'Isi email.', '--XYZ',
  'Content-Type: application/pdf; name="laporan.pdf"',
  'Content-Disposition: attachment; filename="laporan.pdf"',
  'Content-Transfer-Encoding: base64', '', b64File, '--XYZ--',
].join('\r\n');
// → urlsafe encode → POST send
```

## 4. Lampiran Besar (> 3–5 MB)

Total email maksimum **35 MB**; base64 menambah ~33%. Untuk file besar:

1. Pakai **resumable upload**: `POST /upload/gmail/v1/users/me/messages/send?uploadType=resumable` — endpoint khusus `/upload/...` dengan header `Content-Type: message/rfc822`.
2. Atau unggah file ke storage lain (Drive/S3) dan kirim tautannya.

## 5. Gotchas

1. `messages.get` full TIDAK memuat isi attachment — hanya `attachmentId`; unduh terpisah.
2. Attachment di Draft ikut tersimpan — draft besar memakai kuota storage.
3. Untuk banyak attachment, jangan loop `attachments.get` paralel tanpa jeda — kuota 250 units/s.
