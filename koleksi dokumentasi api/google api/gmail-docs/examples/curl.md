# Contoh cURL

Perintah curl untuk endpoint Gmail API utama. Ganti placeholder:

- `ACCESS_TOKEN` — OAuth access token (scope sesuai aksi)
- `MSG_ID`, `THREAD_ID`, `DRAFT_ID`, `ATT_ID`, `LABEL_ID` — id resource

> Semua memakai header `Authorization: Bearer` — Gmail API tidak menerima API key.

---

## Read

```bash
# Profil mailbox
curl "https://gmail.googleapis.com/gmail/v1/users/me/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# List email belum dibaca (operator encode: : → %3A)
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=20" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Filter label (id bisa dari labels.list)
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&labelIds=UNREAD" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Detail email (isi MIME lengkap)
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID?format=full" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Metadata saja (header Subject & From)
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID?format=metadata&metadataHeaders=Subject&metadataHeaders=From" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Thread (semua email percakapan)
curl "https://gmail.googleapis.com/gmail/v1/users/me/threads/THREAD_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Unduh lampiran
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID/attachments/ATT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Halaman berikutnya
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&pageToken=TOKEN" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Send

```bash
# Kirim (raw = RFC 2822 base64url; encode di aplikasi)
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "VG86dHVqdWFuQGV4YW1wbGUuY29tDQpTdWJqZWN0OiBQdXMNCg0KSGFsby4=" }'

# Kirim reply (dengan threadId)
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "Li4u", "threadId": "THREAD_ID" }'
```

## Modify / Moderasi

```bash
# Tandai dibaca + bintang pada satu email
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID/modify" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "addLabelIds": ["STARRED"], "removeLabelIds": ["UNREAD"] }'

# Arsipkan hingga 1000 email sekaligus (204 No Content)
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "ids": ["id1", "id2"], "removeLabelIds": ["INBOX"] }'

# Trash / kembalikan
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID/trash" \
  -H "Authorization: Bearer ACCESS_TOKEN"
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID/untrash" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Drafts

```bash
# Buat draft
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/drafts" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "message": { "raw": "Li4u" } }'

# Kirim draft
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/drafts/DRAFT_ID/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" -d '{}'

# Hapus draft
curl -X DELETE "https://gmail.googleapis.com/gmail/v1/users/me/drafts/DRAFT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Labels

```bash
# List semua label
curl "https://gmail.googleapis.com/gmail/v1/users/me/labels" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Buat label
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/labels" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "name": "Invoice", "labelListVisibility": "labelShow", "messageListVisibility": "show" }'
```

## Sync & Push

```bash
# Delta perubahan sejak checkpoint
curl "https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=4258457" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Aktifkan push (topic Pub/Sub harus ada + sudah diberi akses Gmail)
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "topicName": "projects/PROJECT_ID/topics/gmail-push", "labelIds": ["INBOX"] }'

# Matikan push
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/stop" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Settings & Token

```bash
# Vacation responder
curl -X PUT "https://gmail.googleapis.com/gmail/v1/users/me/settings/vacation" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "enableAutoReply": true, "responseSubject": "Cuti", "responseBodyHtml": "<p>Kembali Senin.</p>" }'

# Refresh access token
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" -d "client_secret=CLIENT_SECRET"
```

> Di PowerShell gunakan `curl.exe` agar contoh berjalan apa adanya (`curl` bawaan = alias `Invoke-WebRequest`).
