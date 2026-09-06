# Resource: Thread

Objek `Thread` merepresentasikan satu **percakapan** — kumpulan message yang saling ber-reply.

---

## Representasi JSON

```json
{
  "id": "18c9f0a1b2c3d4e5",
  "historyId": "4258457",
  "messages": [
    { "id": "18c9f0a1b2c3d4e5", "threadId": "18c9f0a1b2c3d4e5", "labelIds": ["INBOX"], "snippet": "Email pertama..." },
    { "id": "18ca1b2c3d4e5f6", "threadId": "18c9f0a1b2c3d4e5", "labelIds": ["SENT"], "snippet": "Balasan..." }
  ],
  "snippet": "Ringkasan thread"
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `id` | string | ID thread (sama dengan threadId message pertamanya) |
| `historyId` | string | Titik riwayat terakhir thread berubah |
| `messages[]` | list[Message] | Semua email dalam percakapan (detail tergantung format) |
| `snippet` | string | Potongan email terbaru |

## Kegunaan

- **Reply** — kirim message baru dengan `threadId` ini agar masuk percakapan yang sama.
- **Tampilan inbox** — UI email umum menampilkan thread (1 baris = 1 percakapan).
- **Modify massal** — `threads.modify` mengubah label **semua** message dalam thread sekaligus.

## Endpoint Terkait

Semua operasi thread: [../reference-api/threads.md](../reference-api/threads.md)
