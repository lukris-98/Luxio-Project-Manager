# Kemampuan per Resource & Aliran Data — Penjelasan Field

File ini menjelaskan **apa yang bisa dilakukan dengan setiap resource**, **field mana untuk apa**, dan **aliran data** antar resource.

---

## 1. Peta Resource & Kemampuannya

| Resource | Bisa dipakai untuk | Field kunci |
|---|---|---|
| `Message` | Baca/kirim/hapus email | `id`, `threadId`, `labelIds`, `payload` |
| `Thread` | Kelola percakapan, reply | `id`, `messages[]` |
| `Draft` | Tulis dulu, kirim belakangan | `id`, `message.raw` |
| `Label` | Kategorisasi & filter | `id`, `name`, `type` |
| `History` | Sinkronisasi incremental | `id`, `messagesAdded[]` |
| `Attachment` | Unduh lampiran | `attachmentId`, `data` |
| `Settings` | SendAs, vacation, forward | `sendAsEmail`, `enableAutoReply` |

## 2. Aliran Data

```
OAuth token (scope sesuai aksi)
        │
 messages.list ──► messages.get ──► payload.parts[].body.data (base64url)
        │                                   │
        │                                   └── attachments.get (bila ada attachmentId)
        │
 messages.send / drafts ──► email keluar (response labelIds: ["SENT"])
        │
 watch (push) ──► history.list(startHistoryId) ──► delta mailbox
```

## 3. Field Mana untuk Apa — Message (paling sering dipakai)

```json
{
  "id": "18c9f0a1b2c3d4e5",
  "threadId": "18c9f0a1b2c3d4e5",
  "labelIds": ["INBOX", "UNREAD"],
  "snippet": "Ringkasan...",
  "historyId": "4258457",
  "payload": { "headers": [...], "parts": [...] }
}
```

| Field | Dipakai untuk (kode mana memakainya) |
|---|---|
| `id` | `messages.get`, `modify`, `trash`, `attachments.get` — simpan setelah list |
| `threadId` | Reply: sertakan di body `send` agar email masuk percakapan sama; `threads.get` |
| `labelIds` | Filter list (`?labelIds=INBOX`), cek `UNREAD`, ubah via `modify` |
| `snippet` | Preview cepat **tanpa** dekode payload |
| `historyId` | Checkpoint `history.list` — simpan selalu |
| `payload.headers` | Cari `Subject` / `From` / `Message-ID` (untuk reply header) |
| `payload.parts[].body.data` | Isi email — dekode base64url |
| `payload.parts[].body.attachmentId` | Kunci `attachments.get` |

## 4. Field untuk Resource Lain

### Thread
| Field | Dipakai untuk |
|---|---|
| `id` | `threads.get` (semua email percakapan sekaligus), `threads.modify` (ubah label semua email) |
| `messages[]` | Menampilkan UI percakapan berurutan |

### Draft
| Field | Dipakai untuk |
|---|---|
| `id` | `drafts.update` (simpan ulang), `drafts.send` (kirim), `drafts.delete` |
| `message.raw` | Isi email — disusun ulang setiap update |

### Label
| Field | Dipakai untuk |
|---|---|
| `id` | Filter `messages.list?labelIds=`, `messages.modify` add/removeLabelIds |
| `type` | Bedyakan sistem vs kustom sebelum delete |
| `messagesUnread` | Badge "3 belum dibaca" tanpa hitung manual |

### History
| Field | Dipakai untuk |
|---|---|
| `messagesAdded[]` | Deteksi email baru → proses otomatis (auto-reply, notifikasi) |
| `labelsAdded/Removed[]` | Deteksi email ditandai/diarsipkan |
| `messagesDeleted[]` | Bersihkan cache lokal |

## 5. Alur Praktis per Kebutuhan (dengan kode)

### "Tampilkan 5 email terbaru dengan badge unread"

```js
// (1) list dengan query unread — hanya dapat id, hemat kuota
const { messages } = await fetch(
  "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=5",
  { headers: { Authorization: `Bearer ${TOKEN}` } }
).then(r => r.json());

// (2) metadata per id: header + snippet saja
for (const { id } of messages ?? []) {
  const m = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  ).then(r => r.json());
  // (3) m.snippet + header Subject/From → kartu email di UI
}
```

### "Tandai email sebagai dibaca"

```js
// modify dengan removeLabelIds: ["UNREAD"] — scope gmail.modify
await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
});
```

### "Notifikasi saat email baru masuk"

```
watch(topicName) → Pub/Sub push → terima notification { emailAddress, historyId }
→ history.list(startHistoryId=historyId) → proses messagesAdded
```

Detail: [../guides/push-notifications.md](../guides/push-notifications.md).

## 6. Rangkuman Alur Field → Endpoint

```
Ingin operasi X pada email
        │
   punya message.id?
   │ tidak                      │ ya
   ▼                           ▼
messages.list (q/labelIds)   messages.get / modify / trash
(atau threads.list)          attachments.get (bila lampiran)
```

Detail endpoint lengkap: [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).
