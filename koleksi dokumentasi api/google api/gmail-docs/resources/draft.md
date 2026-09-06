# Resource: Draft

Objek `Draft` merepresentasikan email yang ditulis tapi **belum dikirim**.

---

## Representasi JSON

```json
{
  "id": "r-1234567890",
  "message": {
    "id": "18caabbccddeeff",
    "threadId": "18caabbccddeeff",
    "labelIds": ["DRAFT"],
    "payload": {
      "mimeType": "text/plain",
      "headers": [
        { "name": "To", "value": "tujuan@example.com" },
        { "name": "Subject", "value": "Draft ku" }
      ],
      "body": { "size": 50, "data": "SXNpIGRyYWZ0IHlhbmcgYmVsdW0ga2lyaW0u" }
    },
    "sizeEstimate": 120
  }
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `id` | string | ID draft (dipakai update/send/delete) |
| `message` | object | Objek `Message` dalam draft; otomatis berlabel `DRAFT` |

## Catatan Penting

1. **Isi draft tetap RFC 2822** di-encode base64url pada `message.raw` saat create/update — sama seperti send.
2. Draft **tidak terbaca** oleh scope `gmail.readonly` isi penuh — perlu `gmail.compose`.
3. `drafts.send` mengirim draft lalu draft-nya hilang (menjadi message SENT).
4. Draft bisa milik thread — sertakan `threadId` untuk menyimpan draft reply.

## Endpoint Terkait

Semua operasi draft: [../reference-api/drafts.md](../reference-api/drafts.md) · cara menyusun raw: [../guides/send-and-compose.md](../guides/send-and-compose.md)
