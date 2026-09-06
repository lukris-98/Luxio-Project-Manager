# Drafts API

Kumpulan endpoint resource `Draft`. Scope isi draft: `gmail.compose`; list/get: `gmail.readonly` juga cukup untuk metadata.

> API Reference / Drafts

---

## GET /gmail/v1/users/me/drafts

List draft.

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=25" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Parameters

- `maxResults` (maks 500, default 100), `pageToken`, `q` (query pencarian).

### Response

```json
{ "drafts": [ { "id": "r-123", "message": { "id": "18c...", "threadId": "18c..." } } ], "nextPageToken": "..." }
```

---

## GET .../drafts/{id}

Satu draft (objek `Draft` lengkap dengan `message`).

---

## POST /gmail/v1/users/me/drafts

Buat draft. Scope: `gmail.compose`.

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/drafts" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "message": { "raw": "<RFC2822 base64url>", "threadId": "<opsional>" } }'
```

### Response

`201 Created` — objek `Draft`.

### Upload draft dengan lampiran besar

`POST .../drafts` mendukung **upload URI** (multipart/related, metadata + media) untuk draft besar — pola sama dengan `send` upload. Untuk lampiran < 3 MB, cukup raw MIME multipart biasa.

---

## PUT .../drafts/{id}

Ganti isi draft (susun `raw` baru). Scope: `gmail.compose`.

---

## POST .../drafts/{id}/send

Kirim draft. Scope: `gmail.send` atau `gmail.compose`.

```bash
curl -X POST ".../drafts/r-123/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{}'
```

Response: objek `Message` terkirim (label `SENT`). Draft otomatis terhapus.

### Errors

- `404 notFound` — draft sudah terkirim/dihapus.

---

## DELETE .../drafts/{id}

Hapus draft. Scope: `gmail.compose`.

---

## Lihat Juga

- Model data: [../resources/draft.md](../resources/draft.md)
- Menyusun raw + HTML: [../guides/send-and-compose.md](../guides/send-and-compose.md)
