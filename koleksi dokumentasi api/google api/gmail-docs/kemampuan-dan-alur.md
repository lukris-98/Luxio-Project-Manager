# Kemampuan & Alur — Peta Lengkap Gmail API

File ini merangkum **semua hal yang bisa dilakukan** dengan Gmail API v1 beserta **alurnya**, dan menjelaskan kode mana yang melakukan apa.

- Base URL: `https://gmail.googleapis.com`
- Semua endpoint berada di bawah `gmail/v1/users/{userId}/...` — `{userId}` hampir selalu `me`.
- Wajib **OAuth 2.0** (API key tidak bisa dipakai untuk Gmail API).

---

## 1. Daftar Lengkap Kemampuan

### A. Membaca Email

| Kemampuan | Endpoint | Kode inti |
|---|---|---|
| Profil mailbox (jumlah email/thread, historyId) | `GET users/me/profile` | ① |
| Daftar email + pencarian | `GET users/me/messages?q=...` | ② |
| Satu email lengkap | `GET users/me/messages/{id}` | ③ |
| Satu email versi header saja | `?format=metadata` | ③ |
| Percakapan (thread) | `GET users/me/threads/{id}` | — |
| Lampiran | `GET .../messages/{id}/attachments/{attId}` | ③ |

```bash
# ① Profil: emailAddres, messagesTotal, threadsTotal, historyId terbaru.
curl "https://gmail.googleapis.com/gmail/v1/users/me/profile" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# ② List: q = query pencarian gaya Gmail; maxResults maksimum 500 per halaman.
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=10" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → response { messages: [{ id, threadId }], nextPageToken } — id dipakai untuk GET detail.

# ③ Detail: format=full menyertakan payload MIME (isi + lampiran).
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID?format=full" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Alur baca: `messages.list` → dapat `id` → `messages.get` → isi email ada di `payload.parts[].body.data` (base64url) → dekode.

### B. Mengirim & Menulis

| Kemampuan | Endpoint |
|---|---|
| Kirim email langsung | `POST users/me/messages/send` |
| Kirim reply dalam thread | `send` dengan `threadId` |
| Buat draft | `POST users/me/drafts` |
| Update draft | `PUT users/me/drafts/{id}` |
| Kirim draft | `POST users/me/drafts/{id}/send` |
| Sisipkan email tanpa mengirim | `POST users/me/messages/insert` |

```bash
# -d 'raw' = email RFC 2822 yang di-encode base64url — WAJIB untuk send/draft.
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "VG86IGFuZGEAY29udG9oLmNvbQ0KU3ViamVjdDogSGFsbyANClR1bGFzIGRvbmUu" }'
```

Alur kirim: susun teks RFC 2822 (`To:`/`Subject:` + baris kosong + body) → encode base64url → POST `send`. Detail: [../guides/send-and-compose.md](../guides/send-and-compose.md).

### C. Mengelola Mailbox

| Kemampuan | Endpoint |
|---|---|
| Label buatan sendiri (CRUD) | `GET/POST/PUT/DELETE users/me/labels...` |
| Tambah/hapus label pada email | `POST users/me/messages/{id}/modify` |
| Masukkin ke trash & kembalikan | `POST .../{id}/trash` / `untrash` |
| Hapus permanen | `DELETE .../{id}` (scope full) |
| Batch hingga 1000 email sekaligus | `POST users/me/messages/batchModify` |
| Ubah setting (sendAs, vacation, IMAP) | `PUT users/me/settings/...` |

### D. Realtime & Sinkronisasi

| Kemampuan | Endpoint |
|---|---|
| Notifikasi push tiap ada email baru | `POST users/me/watch` + Cloud Pub/Sub |
| Matikan notifikasi | `POST users/me/stop` |
| Ambil perubahan sejak titik tertentu | `GET users/me/history?startHistoryId=...` |

Alur sinkron: simpan `historyId` dari response terakhir → `history.list` → proses `messagesAdded` / `labelsAdded` / dst. Detail: [../guides/push-notifications.md](../guides/push-notifications.md).

---

## 2. Alur Besar Integrasi

```
[Setup sekali]                    [Runtime]
Cloud Console ─► enable Gmail API ─► OAuth consent + scope ─► token (±1 jam) ─► refresh
                                                                          │
      ┌───────────────────────────────────────────────────────────────────┤
      ▼                          ▼                      ▼                 ▼
 READ (readonly)            SEND (send)          MODERATE (modify)   SYNC (readonly)
 list → get → decode        raw → send           modify/trash/label   watch + history
```

## 3. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Memahami struktur data (field JSON artinya apa) | [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) |
| Aktifkan API & buat kredensial | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Mengirim email / reply / HTML | [guides/send-and-compose.md](guides/send-and-compose.md) |
| Lampiran & struktur MIME | [guides/attachments-and-mime.md](guides/attachments-and-mime.md) |
| Pencarian & filter label | [guides/labels-and-search.md](guides/labels-and-search.md) |
| Notifikasi email baru realtime | [guides/push-notifications.md](guides/push-notifications.md) |
| Ambil ribuan email | [guides/pagination.md](guides/pagination.md) |
| Aplikasi tangguh saat limit | [guides/error-handling.md](guides/error-handling.md) |
| Semua endpoint beranotasi | [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) |

---

## 4. Alur Contoh End-to-End: "Kirim Ringkasan Email Unread"

```bash
# LANGKAH 1 — cari email belum dibaca
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=5" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → simpan array id

# LANGKAH 2 — ambil metadata tiap email (header saja: cepat & hemat)
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages/MSG_ID?format=metadata&metadataHeaders=Subject&metadataHeaders=From" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# LANGKAH 3 — susun ringkasan sebagai email RFC 2822 → base64url → kirim
# (encoding raw dilakukan di aplikasi; contoh nilai sudah hasil encode)
curl -X POST "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "raw": "VG86Ym9zc0Bjb21wYW55LmNvbQ0KU3ViamVjdDogUmluZ2t1cGFuIGVtYWlsIHVuJiMzOTtyZWFkDQoNCkRhaGFyIGVtYWlsIHVuJiMzOTtyZWFkOiAuLi4=" }'
# → response { id, threadId, labelIds: ["SENT"] }
```

Penjelasan:

1. **Langkah 1** hanya butuh scope `gmail.readonly`; parameter `q` memakai operator pencarian Gmail.
2. **Langkah 2** `format=metadata` + `metadataHeaders` = tidak mengunduh isi email — cepat dan hemat kuota.
3. **Langkah 3** butuh scope `gmail.send`; jika gagal dengan `invalid_grant`/scope error, token perlu di-request ulang dengan scope yang benar.

Kode siap pakai: [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md).
