# Push Notifications (watch + Pub/Sub)

Notifikasi realtime perubahan mailbox tanpa polling — kombinasi `users.watch` + Google Cloud Pub/Sub + `history.list`.

---

## 1. Arsitektur

```
Gmail (email baru masuk)
   │  watch aktif
   ▼
Google Pub/Sub topic "gmail-push"
   │  push (webhook) / pull
   ▼
Aplikasi Anda: terima { emailAddress, historyId }
   │
   ▼
history.list(startHistoryId) → delta → proses
```

Push **tidak memuat isi email** — hanya pemicu untuk sync via history.

## 2. Setup Sekali (Cloud)

```bash
# (1) aktifkan Pub/Sub
gcloud services enable pubsub.googleapis.com --project=PROJECT_ID

# (2) buat topic
gcloud pubsub topics create gmail-push --project=PROJECT_ID

# (3) IZINKAN Gmail publish — WAJIB, tanpa ini watch gagal 403
gcloud pubsub topics add-iam-policy-binding gmail-push \
  --member="serviceAccount:gmail-api-push@system.gserviceaccount.com" \
  --role="roles/pubsub.publisher" --project=PROJECT_ID

# (4a) push subscription (webhook HTTPS publik)
gcloud pubsub subscriptions create gmail-sub --topic=gmail-push \
  --push-endpoint="https://app.example.com/webhook/gmail" --project=PROJECT_ID

# (4b) ATAU pull subscription (worker Anda yang menarik)
gcloud pubsub subscriptions create gmail-sub-pull --topic=gmail-push --project=PROJECT_ID
```

| Langkah | Melakukan apa |
|---|---|
| (3) | Memberi service account resmi Gmail hak menerbitkan pesan ke topic Anda |
| (4a) | Google POST payload ke URL Anda setiap ada event |
| (4b) | Worker memanggil API Pub/Sub untuk menarik pesan |

## 3. Aktifkan Watch (per mailbox)

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "topicName": "projects/PROJECT_ID/topics/gmail-push", "labelIds": ["INBOX"] }'
# → { "historyId": "4259000", "expiration": "1728150000000" }
```

- `labelIds: ["INBOX"]` = hanya email masuk (kurangi noise).
- Simpan `historyId` sebagai checkpoint sync pertama.
- `expiration` maksimum ±**7 hari** → cron harian: `stop` lalu `watch` ulang.

## 4. Terima & Proses Event

```js
// Webhook (Express) — payload Pub/Sub
app.post('/webhook/gmail', (req, res) => {
  const data = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString());
  // data = { emailAddress: "...", historyId: "4259001" }
  // (1) decode base64 BIASA (bukan urlsafe)
  // (2) jangan proses berat di sini — antrekan sync
  queueSync(data.emailAddress, data.historyId);
  res.status(200).send(); // (3) 200 = pesan ack; non-200 = Pub/Sub retry
});
```

- `data` base64 biasa + padding — bukan urlsafe seperti isi email.
- Balas **200 cepat**; proses sesungguhnya via antrian (Pub/Sub retry bila gagal).

## 5. Sync Delta

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=4259000" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- Proses `messagesAdded` (email baru), `labelsAdded`/`labelsRemoved`, `messagesDeleted`.
- Simpan `response.historyId` (field atas) sebagai checkpoint baru.
- Bila 400 (checkpoint terlalu tua) → full re-sync + watch ulang.

## 6. Gotchas

1. **Watch kedaluwarsa diam-diam** — tanpa cron re-watch, notifikasi berhenti; buat alert.
2. **Duplikasi event** — Pub/Sub at-least-once; buat proses idempotent (cek message.id sudah diproses).
3. **Sandbox Pub/Sub** — webhook harus publik & HTTPS; untuk dev lokal gunakan pull subscription.
4. **Scope** — `watch` cukup `gmail.readonly`; sync isi email mengikuti scope yang diminta.
