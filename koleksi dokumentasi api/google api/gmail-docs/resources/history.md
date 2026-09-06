# Resource: History

Objek `History` merepresentasikan satu blok **perubahan mailbox** — dasar sinkronisasi incremental tanpa re-list seluruh mailbox.

---

## Representasi JSON

```json
{
  "id": "4258457",
  "messages": [
    { "id": "18ca...", "threadId": "18ca...", "labelIds": ["INBOX"] }
  ],
  "messagesDeleted": [ { "message": { "id": "...", "labelIds": ["TRASH"] } } ],
  "messagesAdded":   [ { "message": { "id": "...", "labelIds": ["INBOX", "UNREAD"] } } ],
  "labelsAdded":     [ { "message": { "id": "..." }, "labelIds": ["UNREAD"] } ],
  "labelsRemoved":   [ { "message": { "id": "..." }, "labelIds": ["UNREAD"] } ]
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `id` | string | ID history (monoton naik) |
| `messages` | list[Message] | Message yang berubah (ringkas) |
| `messagesAdded[]` | list | Email baru masuk mailbox |
| `messagesDeleted[]` | list | Email dihapus (ke trash atau permanen) |
| `labelsAdded[]` | list | Label ditambahkan ke message |
| `labelsRemoved[]` | list | Label dilepas dari message |

## Konsep historyId

1. Setiap response GET mengandung `historyId` terbaru.
2. Simpan `historyId` itu sebagai checkpoint.
3. Nanti: `GET .../history?startHistoryId=CHECKPOINT` → semua perubahan setelah checkpoint.
4. Simpan `historyId` terbaru dari response untuk checkpoint berikutnya.

## Batasan

- Riwayat hanya tersedia **selama rentang waktu tertentu** — `startHistoryId` yang terlalu tua → `400 expired` → lakukan **full re-sync** (list ulang mailbox).
- `history.list` butuh scope `gmail.history` atau `gmail.readonly` (perubahan labelsAdded/Removed butuh modify-equivalent scope bila memakai `historyTypes=labelAdded`).

## Endpoint

- `GET /gmail/v1/users/me/history` — lihat [../reference-api/history.md](../reference-api/history.md)
- Dipakai bersama push notification: [../guides/push-notifications.md](../guides/push-notifications.md)
