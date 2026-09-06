# History API

Endpoint `history.list` — delta perubahan mailbox sejak checkpoint.

> API Reference / History

---

## GET /gmail/v1/users/me/history

Ambil semua perubahan sejak `startHistoryId`. Scope: `gmail.history` (atau `gmail.readonly` untuk subset).

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=4258457&maxResults=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `startHistoryId` (string, wajib) — checkpoint sebelumnya.
- `maxResults` (integer, optional) — default 100, maks 500.
- `pageToken` (string, optional).
- `labelId` (string, optional) — batasi ke perubahan label tertentu.
- `historyTypes` (string, query, optional, dapat diulang) — `messageAdded`, `messageDeleted`, `labelAdded`, `labelRemoved`.

### Response

```json
{
  "history": [
    {
      "id": "4258458",
      "messagesAdded": [ { "message": { "id": "18ca...", "threadId": "18ca...", "labelIds": ["INBOX", "UNREAD"] } } ]
    }
  ],
  "historyId": "4258999",
  "nextPageToken": "..."
}
```

**Penting**: simpan `historyId` dari response sebagai checkpoint baru — bukan id history terakhir dalam array.

### Errors

- `400` `startHistoryId` terlalu tua (sudah dipangkas) → lakukan **full re-sync** (`messages.list` ulang) lalu simpan checkpoint baru.

---

## Pola Sinkronisasi Incremental

```
simpan checkpoint historyId ──► (event: push / poll berkala)
        │
        ▼
history.list(startHistoryId=checkpoint)
        │
   ada nextPageToken? ──ya──► lanjut halaman berikutnya
        │ tidak
        ▼
proses delta: messagesAdded → aksi; labelsRemoved → update UI; dst.
        │
        ▼
simpan response.historyId sebagai checkpoint baru
```

Batas kecepatan: 250 units/detik — poll berkala (per 1 menit cukup 1 unit per call).

---

## Lihat Juga

- Model data: [../resources/history.md](../resources/history.md)
- Push notification (pemicu sync): [watch-push.md](watch-push.md) + [../guides/push-notifications.md](../guides/push-notifications.md)
