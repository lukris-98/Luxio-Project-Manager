# Kirim & Compose Email

Panduan menyusun dan mengirim email lewat Gmail API: teks polos, HTML, reply, dan BCC/CC.

---

## 1. Format Raw (RFC 2822)

Semua kirim/draft memakai field `raw` — teks email standar yang di-encode base64url:

```
To: penerima@example.com
Cc: teman@example.com
Bcc: rahasia@example.com
Subject: Subjek email
Content-Type: text/plain; charset="UTF-8"

Isi email di sini.
```

Aturan:

1. Header di atas, **baris kosong**, lalu body.
2. EOL idealnya `\r\n` (CRLF).
3. Encode: base64 **urlsafe** (`+`→`-`, `/`→`_`).

```js
// (1) susun email
const email = [
  'To: penerima@example.com',
  'Subject: Halo dari API',
  'Content-Type: text/plain; charset="UTF-8"',
  '',
  'Isi email.',
].join('\r\n');

// (2) encode base64url: ganti +→-, /→_, buang padding =
const raw = btoa(unescape(encodeURIComponent(email)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
```

- `encodeURIComponent`/`unescape` dulu agar karakter non-ASCII (Indonesia) aman.

## 2. Kirim

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "VG86Li4u" }'
```

- Scope: `gmail.send` (atau `gmail.compose`).
- Response: objek `Message` (`labelIds: ["SENT"]`).
- Kuota: 100 unit — jangan kirim > 2 email/detik per user.

## 3. Body HTML

Ganti Content-Type menjadi HTML:

```
To: penerima@example.com
Subject: Newsletter
Content-Type: text/html; charset="UTF-8"

<html><body><h1>Halo</h1><p style="color:#333">Isi HTML.</p></body></html>
```

## 4. Multipart Alternatif (plain + HTML sekaligus)

```
To: penerima@example.com
Subject: Newsletter
Content-Type: multipart/alternative; boundary="sep"

--sep
Content-Type: text/plain; charset="UTF-8"

Versi teks
--sep
Content-Type: text/html; charset="UTF-8"

<html><body><b>Versi HTML</b></body></html>
--sep--
```

## 5. Reply ke Thread

```json
{
  "raw": "<RFC2822 berisi In-Reply-To & References>",
  "threadId": "18c9f0a1b2c3d4e5"
}
```

Headers reply (ambil `Message-ID` dari email sebelumnya di thread):

```
To: pengirim-asli@example.com
Subject: Re: Subjek asli
In-Reply-To: <abc@mail.gmail.com>
References: <abc@mail.gmail.com>

Isi balasan
```

- `threadId` = perekat utama; `In-Reply-To`/`References` membantu client lain mengelompokkan.

## 6. Via Draft (tulis → review → kirim)

```
POST /drafts  (message.raw)      → simpan
PUT   /drafts/{id}               → revisi
POST  /drafts/{id}/send          → kirim
```

## 7. Deliverability

1. Kirim dari alamat domain dengan **SPF + DKIM** aktif (bukan dari @gmail.com untuk email transaksional bisnis).
2. Gunakan alamat kirim kustom via **sendAs** (lihat [../reference-api/settings.md](../reference-api/settings.md)).
3. Sertakan `List-Unsubscribe` header untuk massal.
4. Batas harian tetap berlaku: 500/hari (gratis), 2000/hari (Workspace).
