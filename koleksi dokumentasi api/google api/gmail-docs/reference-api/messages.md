# Messages API

Kumpulan endpoint resource `Message`. Semua memerlukan OAuth dengan scope sesuai aksi.

> API Reference / Messages

---

## GET /gmail/v1/users/me/messages

List id email (dengan filter pencarian).

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=20" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `q` (string, query, optional) — query pencarian gaya Gmail (`from:`, `subject:`, `has:attachment`, `after:2026/01/01`...).
- `labelIds` (string, query, optional, dapat diulang) — filter label (`INBOX`, `UNREAD`, id label kustom). Banyak label = AND.
- `maxResults` (integer, query, optional) — maksimum 500, default 100.
- `pageToken` (string, query, optional) — dari `nextPageToken` sebelumnya.
- `includeSpamTrash` (boolean, query, optional) — default false.

### Response

```json
{
  "messages": [ { "id": "18c...", "threadId": "18c..." } ],
  "resultSizeEstimate": 20,
  "nextPageToken": "..."
}
```

> Response list **tidak memuat isi** email — per `messages.get` satu per satu.

---

## GET /gmail/v1/users/me/messages/{id}

Satu email.

### Parameters

- `format` (string, query, optional) — `full` (default), `metadata`, `minimal`, `raw`.
- `metadataHeaders` (string, query, optional, dapat diulang) — dengan `format=metadata`, batasi header tertentu (mis. `Subject`, `From`).

### Response

Objek `Message` lengkap — lihat [../resources/message.md](../resources/message.md).

### Errors

- `404 notFound` — id salah / email terhapus permanen.

---

## POST /gmail/v1/users/me/messages/send

Kirim email. Scope: `gmail.send` atau `gmail.compose`.

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "<RFC2822 base64url>", "threadId": "<opsional utk reply>" }'
```

### Body

- `raw` (string, wajib) — email RFC 2822 di-encode base64url.
- `threadId` (string, optional) — reply ke thread.

### Response

Objek `Message` dengan `labelIds: ["SENT"]`.

### Errors

- `400 invalid` — raw bukan base64url / format RFC salah.
- `403` — daily sending limit tercapai (pesan khusus di body).

---

## POST /gmail/v1/users/me/messages/insert

Sisipkan email ke mailbox **tanpa mengirim** (mis. arsip mail dari sistem lain). Scope: `gmail.insert`.

Body: `raw` (base64url) + opsional `internalDateSource`.

---

## POST /gmail/v1/users/me/messages/{id}/modify

Tambah/hapus label pada satu email. Scope: `gmail.modify`.

```bash
curl -X POST ".../messages/MSG_ID/modify" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "addLabelIds": ["STARRED"], "removeLabelIds": ["UNREAD"] }'
```

Bodi dapat memuat keduanya sekaligus. Response: objek `Message` terbaru.

---

## POST /gmail/v1/users/me/messages/batchModify

Modify hingga **1000 email sekaligus** (hemat kuota vs loop).

```json
{ "ids": ["id1", "id2", "..."], "addLabelIds": ["Label_x"], "removeLabelIds": ["INBOX"] }
```

Response: `204 No Content` (periksa status HTTP).

---

## POST .../messages/{id}/trash & /untrash

Pindah ke Trash / kembalikan. Scope: `gmail.modify`. Response: objek `Message` dengan label `TRASH` (atau tanpa).

---

## DELETE .../messages/{id} & POST .../messages/batchDelete

Hapus **permanen** — tidak bisa dibatalkan. Scope: `https://mail.google.com/` (full).

- `batchDelete` maksimum 1000 id per request, body `{ "ids": [...] }`.

---

## GET .../messages/{id}/attachments/{attachmentId}

Ambil lampiran. Scope: `gmail.readonly`.

Response: objek `Attachment` (`data` = base64url) — lihat [../resources/attachment.md](../resources/attachment.md).

---

## Lihat Juga

- Anatomi request + anotasi kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)
- Model data: [../resources/message.md](../resources/message.md)
- MIME & lampiran: [../guides/attachments-and-mime.md](../guides/attachments-and-mime.md)
