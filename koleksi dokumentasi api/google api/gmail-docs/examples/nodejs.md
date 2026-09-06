# Contoh Node.js

Integrasi Gmail API dengan `googleapis` dan `fetch` bawaan (Node 18+).

## Instalasi

```bash
npm install googleapis
```

## 1. Setup Auth

```js
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Refresh token dari setup awal — simpan di secret store
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
// Token di-refresh otomatis oleh library saat kedaluwarsa
```

Mendapat refresh token (sekali saja):

```js
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
  prompt: 'consent',
});
// Buka url → callback → tukar kode:
const { tokens } = await oauth2Client.getToken(req.query.code);
console.log(tokens.refresh_token); // simpan aman
```

## 2. Operasi Umum

```js
// Profil
const profile = await gmail.users.getProfile({ userId: 'me' });
console.log(profile.data.emailAddress, profile.data.messagesTotal);

// List + baca email unread
const list = await gmail.users.messages.list({
  userId: 'me',
  q: 'is:unread has:attachment',
  maxResults: 10,
});
for (const { id } of list.data.messages ?? []) {
  const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  const subject = msg.data.payload.headers.find((h) => h.name === 'Subject')?.value;
  console.log(id, subject, '| snippet:', msg.data.snippet);
}

// Helper encode raw email (RFC 2822 → base64url)
const makeRaw = (to, subject, body) => Buffer.from(
  `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`
).toString('base64url');

// Kirim email
await gmail.users.messages.send({
  userId: 'me',
  requestBody: { raw: makeRaw('tujuan@example.com', 'Laporan harian', 'Isi laporan.') },
});

// Reply dalam thread
await gmail.users.messages.send({
  userId: 'me',
  requestBody: {
    raw: makeRaw('a@b.com', 'Re: Tanya', 'Balasan.'),
    threadId: '18c9f0a1b2c3d4e5',
  },
});

// Tandai dibaca + arsipkan (modify)
await gmail.users.messages.modify({
  userId: 'me',
  id: msgId,
  requestBody: { removeLabelIds: ['UNREAD', 'INBOX'], addLabelIds: ['Label_123'] },
});

// Batch: arsipkan hingga 1000 email
await gmail.users.messages.batchModify({
  userId: 'me',
  requestBody: { ids: [/* ... */], removeLabelIds: ['INBOX'] },
});

// Draft + kirim
const draft = await gmail.users.drafts.create({
  userId: 'me',
  requestBody: { message: { raw: makeRaw('a@b.com', 'Draft', 'Isi.') } },
});
await gmail.users.drafts.send({ userId: 'me', id: draft.data.id, requestBody: {} });

// Label
const labels = await gmail.users.labels.list({ userId: 'me' });
const created = await gmail.users.labels.create({
  userId: 'me',
  requestBody: { name: 'Invoice', labelListVisibility: 'labelShow', messageListVisibility: 'show' },
});

// Lampiran: unduh
const att = await gmail.users.messages.attachments.get({ userId: 'me', messageId: msgId, id: attId });
const buf = Buffer.from(att.data.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
fs.writeFileSync('file.pdf', buf);
```

## 3. Pagination

```js
async function listAll(q) {
  const all = [];
  let pageToken;
  do {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: 500, pageToken });
    all.push(...(res.data.messages ?? []));
    pageToken = res.data.nextPageToken; // undefined = selesai
  } while (pageToken);
  return all;
}
```

## 4. Watch + History (realtime)

```js
// Aktifkan (cron harian — expiration maks ±7 hari)
const w = await gmail.users.watch({
  userId: 'me',
  requestBody: { topicName: `projects/${process.env.PROJECT_ID}/topics/gmail-push`, labelIds: ['INBOX'] },
});
console.log('checkpoint historyId:', w.data.historyId);

// Sync delta saat push masuk
async function syncSince(startHistoryId) {
  const res = await gmail.users.history.list({ userId: 'me', startHistoryId });
  for (const h of res.data.history ?? []) {
    for (const added of h.messagesAdded ?? []) {
      // email baru → proses
    }
  }
  return res.data.historyId; // checkpoint baru
}
```

## 5. Tanpa Library (fetch bawaan)

```js
const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const token = await getAccessToken(); // fungsi refresh Anda

async function listUnread() {
  const res = await fetch(`${BASE}/messages?q=is%3Aunread&maxResults=25`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Gmail API ${res.status}: ${body?.error?.message}`);
  }
  return res.json(); // { messages, nextPageToken }
}

async function sendRaw(raw, threadId) {
  const res = await fetch(`${BASE}/messages/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw, ...(threadId && { threadId }) }),
  });
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}
```

Tanpa library, refresh token & backoff ditulis sendiri — pola di [../guides/error-handling.md](../guides/error-handling.md).

## Praktik

- Kredensial via `process.env` / secret store — tidak pernah di-commit.
- Kirim massal → antrian dengan jeda (send = 100 unit kuota).
- Baca massal → `format=metadata` + `metadataHeaders` dulu, `full` hanya bila perlu.
