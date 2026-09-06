# Kemampuan Endpoint & Alur Request — Penjelasan Kode

File ini menjelaskan **anatomi request**, **kemampuan tiap grup endpoint**, dan **kode mana yang melakukan apa** di folder [reference-api/](.).

---

## 1. Anatomi Satu Request

```
https://gmail.googleapis.com/gmail/v1/users/me/messages/send
└────────────┬───────────────┘└┬─┘└─┬─┘ └─┬─┘└───┬──┘└─┬──┘
       base URL + versi       API  versi scope  resource aksi
                            "gmail" "v1" user "messages" /send
```

| Bagian | Arti |
|---|---|
| `users/me` | Mailbox user terautentikasi (bisa juga alamat email eksplisit) |
| `messages` | Sub-resource mailbox |
| Kata kerja akhir | `/send`, `/modify`, `/trash`, `/untrash`, `/watch`, `/stop`, `/verify` |

Metode HTTP: **GET** baca, **POST** aksi/buat, **PUT/PATCH** ubah, **DELETE** hapus.

## 2. Kemampuan per Grup Endpoint

| Grup | Kemampuan utama | Dipakai saat |
|---|---|---|
| [messages](messages.md) | List+search, baca, kirim, modify label, trash, hapus, lampiran | Semua operasi email dasar |
| [threads](threads.md) | Percakapan utuh: baca, modify massal, trash | UI inbox berbasis percakapan |
| [drafts](drafts.md) | Draft: buat, simpan ulang, kirim | Tulis dulu kirim belakangan |
| [labels](labels.md) | CRUD label kustom | Kategorisasi otomatis |
| [history](history.md) | Delta perubahan sejak checkpoint | Sinkronisasi efisien |
| [watch-push](watch-push.md) | Push realtime via Pub/Sub | Event email baru instan |
| [settings](settings.md) | SendAs, forward, vacation, IMAP/POP | Administrasi akun |

## 3. Kode Anotasi per Operasi Penting

### 3.1 List + Baca Email

```bash
# HALAMAN 1 — cari email inbox
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in%3Ainbox&maxResults=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
#   q=in%3Ainbox      = operator "in:inbox" (encode ":" menjadi %3A)
#   maxResults=50     = id per halaman (maks 500)

# DETAIL — isi email
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID?format=full" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- Response list hanya `{id, threadId}` — **wajib** get per email untuk isi (pola 2 langkah).
- `format=metadata` + `metadataHeaders=Subject` = dashboard ringan tanpa isi.

### 3.2 Kirim Email

```bash
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "raw": "VG86YWRkcmVzcy4uLg==" }'
```

| Bagian | Melakukan apa |
|---|---|
| `-X POST .../send` | Aksi kirim (100 unit kuota) |
| `raw` | Email RFC 2822 **base64url** — header `To:`/`Subject:`, baris kosong, lalu body |
| `threadId` (opsional di body) | Bila ada → email jadi reply dalam thread |

Alur aplikasi: `buildRFC2822()` → `btoa` versi urlsafe → `send`.

### 3.3 Modify / Batch

```bash
# SATU email: tandai dibaca + bintang
curl -X POST ".../messages/MSG_ID/modify" -d '{ "addLabelIds": ["STARRED"], "removeLabelIds": ["UNREAD"] }' ...

# RIBUAN email sekaligus: arsipkan
curl -X POST ".../messages/batchModify" \
  -d '{ "ids": ["a","b","...maks1000"], "removeLabelIds": ["INBOX"] }' ...
```

- `modify` = satu-satunya cara mengubah label — tidak ada PUT biasa untuk field labelIds.
- `batchModify` mengembalikan `204` — cek HTTP status, bukan body.

### 3.4 Watch (realtime)

```bash
curl -X POST ".../users/me/watch" \
  -d '{ "topicName": "projects/PROJ/topics/gmail-push", "labelIds": ["INBOX"] }'
```

- `labelIds: ["INBOX"]` = hanya email masuk yang memicu push.
- `expiration` ±7 hari → **wajib** re-watch berkala.
- Push hanya bilang "ada perubahan + historyId" → aplikasi panggil `history.list`.

## 4. Alur Sequence Umum

```
KIRIM:
build raw (RFC 2822) → urlsafe base64 → POST send → simpan message.id

BACA + PROSES:
messages.list(q) → messages.get(full) → decode payload → proses
                                              └► attachments.get (bila ada)

SINKRON REALTIME:
watch(topic) → Pub/Sub push → history.list(startHistoryId) → delta → checkpoint baru

MODERASI:
messages.list(labelIds=UNREAD) → batchModify(removeLabelIds=[UNREAD], addLabelIds=[Label_x])
```

## 5. Parameter yang Sering Salah Dipakai

| Parameter | Kesalahan umum | Benar |
|---|---|---|
| `raw` | base64 biasa (mengandung `+`/`/`) | **base64url** (`-`/`_`), padding opsional |
| `q` | `:` tanpa encode → HTTP 400 | Encode `:` jadi `%3A` |
| `maxResults` | Anggap isi email ikut | List hanya id — get terpisah |
| `watch` | Lupa re-watch | Cron harian: stop → watch |
| `history.list` | Simpan id history terakhir sebagai checkpoint | Simpan `response.historyId` (field atas) |
| `modify` | Kirim label sistem terlarang | Hanya label yang boleh diubah (UNREAD, STARRED, INBOX, label kustom) |

Detail per grup: [messages.md](messages.md), [threads.md](threads.md), [drafts.md](drafts.md), [labels.md](labels.md), [history.md](history.md), [watch-push.md](watch-push.md), [settings.md](settings.md).
