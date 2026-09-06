# Threads API

Kumpulan endpoint resource `Thread` (percakapan).

> API Reference / Threads

---

## GET /gmail/v1/users/me/threads

List id thread (pola identik `messages.list`).

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/threads?q=in%3Ainbox&maxResults=25" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `q`, `labelIds`, `maxResults` (maks 500), `pageToken`, `includeSpamTrash` — sama dengan messages.list.

### Response

```json
{ "threads": [ { "id": "18c...", "snippet": "..." } ], "nextPageToken": "..." }
```

---

## GET /gmail/v1/users/me/threads/{id}

Satu thread + **semua email di dalamnya**.

### Parameters

- `format` (string, query, optional) — `full` / `metadata` / `minimal` (berlaku untuk semua message di dalam).

### Response

Objek `Thread` dengan array `messages[]`.

### Errors

- `404 notFound`.

---

## POST .../threads/{id}/modify

Tambah/hapus label pada **semua message** dalam thread. Scope: `gmail.modify`.

```bash
curl -X POST ".../threads/THREAD_ID/modify" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "addLabelIds": ["Label_important"], "removeLabelIds": ["UNREAD"] }'
```

---

## POST .../threads/{id}/trash & /untrash

Trash / kembalikan seluruh percakapan. Scope: `gmail.modify`.

---

## DELETE .../threads/{id}

Hapus permanen seluruh thread. Scope: `https://mail.google.com/`.

---

## Lihat Juga

- Model data: [../resources/thread.md](../resources/thread.md)
- Kirim reply ke thread: [../guides/send-and-compose.md](../guides/send-and-compose.md)
