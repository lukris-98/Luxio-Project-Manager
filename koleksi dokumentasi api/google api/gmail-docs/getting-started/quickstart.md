# Quickstart

Dari nol sampai **kirim email pertama**. Prasyarat: API enabled + OAuth client ([enable-api.md](enable-api.md)).

---

## 1. Cek Profil Mailbox

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Response:

```json
{
  "emailAddress": "anda@gmail.com",
  "messagesTotal": 12345,
  "threadsTotal": 9876,
  "historyId": "4258457"
}
```

Cara mendapat `ACCESS_TOKEN`: OAuth playground https://developers.google.com/oauthplayground (pilih scope Gmail → authorize → exchange) atau alur di [authentication.md](authentication.md).

## 2. Baca Email Terbaru

```bash
# (1) list: dapatkan id
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "messages": [{ "id": "18c...", "threadId": "18c..." }, ...] }

# (2) get: isi email
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/18c123?format=full" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Di response `get`, subjek & pengirim ada di `payload.headers` (cari name `Subject` / `From`), isi di `payload.parts[].body.data` (base64url).

## 3. Kirim Email Pertama

### 3a. Susun email RFC 2822

```
To: penerima@example.com
Subject: Halo dari Gmail API

Ini isi email yang dikirim lewat Gmail API.
```

### 3b. Encode base64url

```bash
python3 -c "import base64; print(base64.urlsafe_b64encode(open('msg.txt','rb').read()).decode())"
# → Vb86... (tanpa tanda = padding boleh dihilangkan)
```

- `urlsafe_b64encode` = base64 versi URL-safe: `+`→`-`, `/`→`_`.
- Baris kosong memisahkan header dari body — wajib (`\r\n\r\n` idealnya).

### 3c. Kirim

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "raw": "VG86cGVuZXJpbWE..." }'
```

Response `200`:

```json
{ "id": "18cabc...", "threadId": "18cabc...", "labelIds": ["SENT"] }
```

> Penerima mungkin melihat email di tab Promosi/spam — untuk produksi pertimbangkan SPF/DKIM domain (lihat [../guides/send-and-compose.md](../guides/send-and-compose.md)).

## 4. Reply ke Thread

Tambahkan `threadId` pada body send, dan `In-Reply-To`/`References` header berisi `Message-ID` email sebelumnya:

```json
{
  "raw": "To:...\r\nSubject: Re: Halo\r\nIn-Reply-To: <msg-id@mail.gmail.com>\r\nReferences: <msg-id@mail.gmail.com>\r\n\r\nIsi balasan",
  "threadId": "18cabc..."
}
```

## 5. Draft + Kirim

```bash
# Buat draft
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/drafts" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "message": { "raw": "..." } }'
# → { "id": "d123...", "message": {...} }

# Kirim draft
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/drafts/d123/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{}'
```

## Ringkasan Alur

1. `profile` → pastikan token & mailbox benar.
2. `messages.list?q=` → dapatkan id.
3. `messages.get?format=full` → baca isi (dekode base64url).
4. Susun RFC 2822 → `urlsafe_b64encode` → `messages.send`.
5. Reply = send + `threadId` + header `In-Reply-To`.
