# Resource: Message

Objek `Message` merepresentasikan satu email di mailbox.

---

## Representasi JSON

```json
{
  "id": "18c9f0a1b2c3d4e5",
  "threadId": "18c9f0a1b2c3d4e5",
  "labelIds": ["INBOX", "UNREAD", "CATEGORY_PERSONAL"],
  "snippet": "Ringkasan singkat isi email...",
  "historyId": "4258457",
  "internalDate": "1719878400000",
  "payload": {
    "mimeType": "multipart/alternative",
    "filename": "",
    "headers": [
      { "name": "From", "value": "Pengirim <pengirim@gmail.com>" },
      { "name": "To", "value": "anda@gmail.com" },
      { "name": "Subject", "value": "Subjek email" },
      { "name": "Date", "value": "Sat, 5 Jul 2026 10:00:00 +0700" },
      { "name": "Message-ID", "value": "<abc@mail.gmail.com>" }
    ],
    "body": { "size": 0 },
    "parts": [
      {
        "partId": "0",
        "mimeType": "text/plain",
        "body": { "size": 123, "data": "SXNpIGVtYWlsIHBsYWluIHRleHQuLi4=" }
      },
      {
        "partId": "1",
        "mimeType": "text/html",
        "body": { "size": 456, "data": "PGI+SXNpIGVtYWlsIEhUTUw8L2I+..." }
      }
    ]
  },
  "sizeEstimate": 2345
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `id` | string | ID unik email — dipakai di semua endpoint message |
| `threadId` | string | ID percakapan — email reply berada di thread yang sama |
| `labelIds` | list[string] | Label saat ini (INBOX, SENT, UNREAD, STARRED, label kustom...) |
| `snippet` | string | Potongan isi email (untuk preview tanpa decode) |
| `historyId` | string | Titik riwayat terakhir email ini berubah |
| `internalDate` | string | Timestamp penerimaan (epoch ms, string) |
| `payload` | object | Struktur MIME: `headers`, `body`, `parts` |
| `sizeEstimate` | integer | Perkiraan ukuran (bytes) |

## Struktur MIME (payload)

| Field | Keterangan |
|---|---|
| `mimeType` | `text/plain`, `text/html`, `multipart/alternative`, `multipart/mixed` |
| `headers` | Array `{ name, value }` — Subject, From, To, Message-ID, dll. |
| `body.data` | Isi part dalam **base64url** |
| `body.attachmentId` | Ada bila part = lampiran → ambil via attachments.get |
| `parts[]` | Sub-part (multipart); isi sebenarnya ada di leaf parts |

## Label Sistem

| Label | Arti |
|---|---|
| `INBOX`, `SENT`, `DRAFT`, `SPAM`, `TRASH` | Folder utama |
| `UNREAD`, `STARRED`, `IMPORTANT` | Status |
| `CATEGORY_PERSONAL/SOCIAL/PROMOTIONS/UPDATES/FORUMS` | Tab kategori |

## Endpoint Terkait

Semua operasi message: [../reference-api/messages.md](../reference-api/messages.md) · lampiran: [attachment.md](attachment.md) · thread: [thread.md](thread.md)
