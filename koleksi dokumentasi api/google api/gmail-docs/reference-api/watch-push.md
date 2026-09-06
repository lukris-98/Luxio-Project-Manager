# Watch & Push (Realtime)

Endpoint `watch`/`stop` + Google Cloud Pub/Sub untuk notifikasi realtime perubahan mailbox.

> API Reference / Watch

---

## POST /gmail/v1/users/me/watch

Aktifkan push notification. Scope: `gmail.readonly` (paling umum).

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "topicName": "projects/PROJECT_ID/topics/gmail-push" }'
```

### Parameters (body)

- `topicName` (string, wajib) — Pub/Sub topic milik project yang sama.
- `labelIds` (list, optional) — hanya notifikasi untuk label tertentu (mis. `["INBOX"]` = hanya email masuk).
- `labelFilterAction` (string, optional) — `include` / `exclude` terhadap `labelIds`.

### Response

```json
{ "historyId": "4259000", "expiration": "1728150000000" }
```

- `historyId` = checkpoint awal untuk `history.list`.
- `expiration` = epoch ms — **maksimal ±7 hari**; harus `watch` ulang sebelum kedaluwarsa (jadwalkan cron harian).

## Syarat Pub/Sub (sekali setup)

1. Buat topic: `gcloud pubsub topics create gmail-push --project=PROJECT_ID`.
2. **Beri akses Gmail**: `gcloud pubsub topics add-iam-policy-binding gmail-push --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" --role="roles/pubsub.publisher"` — tanpa ini `watch` gagal `403`.
3. Buat **push subscription** ke endpoint webhook Anda (atau pull subscription):
   `gcloud pubsub subscriptions create gmail-sub --topic=gmail-push --push-endpoint=https://app.example.com/webhook/gmail`

## Payload Push ke Webhook

```json
{
  "message": {
    "data": "eyJlbWFpbEFkZHJlc3MiOiJhbmRhQGdtYWlsLmNvbSIsImhpc3RvcnlJZCI6IjQyNTkwMDAifQ==",
    "messageId": "123...",
    "publishTime": "2026-09-05T04:00:00Z"
  },
  "subscription": "projects/.../subscriptions/gmail-sub"
}
```

- `data` = base64 (biasa) dari `{"emailAddress": "...", "historyId": "..."}`.
- Webhook cukup **menjadwalkan sync** (`history.list`) — payload tidak berisi isi email.

## POST /gmail/v1/users/me/stop

Matikan semua push notification untuk mailbox. Response `204`.

> `stop` juga menghentikan watch yang kedaluwarsa sebelum mengaktifkan ulang.

---

## Lihat Juga

- Alur lengkap: [../guides/push-notifications.md](../guides/push-notifications.md)
- Sinkronisasi delta: [history.md](history.md)
