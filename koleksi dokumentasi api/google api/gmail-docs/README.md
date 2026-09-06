# Gmail API v1 Documentation

Dokumentasi lengkap **Gmail API v1** (Google) untuk membaca, mengirim, dan mengelola email Gmail secara programatis — mengikuti gaya dokumentasi `neon-docs` & `blogger-docs` di repo ini.

- Penyedia: Google (resmi, bukan pihak ketiga)
- Base URL: `https://gmail.googleapis.com`
- Dokumentasi resmi: https://developers.google.com/gmail/api
- Referensi REST: https://developers.google.com/gmail/api/reference/rest

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | **Kemampuan setup + penjelasan kode kredensial baris per baris** |
| [getting-started/overview.md](getting-started/overview.md) | Pengenalan Gmail API, model resource, dan batasan |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Mengaktifkan Gmail API di Google Cloud Console |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, scopes, dan token |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Request pertama sampai kirim email pertama |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Kuota, quota units, dan batas kirim harian |
| [getting-started/errors.md](getting-started/errors.md) | Daftar kode error dan penanganannya |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | **Field mana untuk apa + aliran data antar resource** |
| [resources/message.md](resources/message.md) | Resource `Message` — email + MIME payload |
| [resources/thread.md](resources/thread.md) | Resource `Thread` — percakapan |
| [resources/draft.md](resources/draft.md) | Resource `Draft` — draf email |
| [resources/label.md](resources/label.md) | Resource `Label` — label sistem & kustom |
| [resources/history.md](resources/history.md) | Resource `History` — perubahan mailbox |
| [resources/attachment.md](resources/attachment.md) | Resource `Attachment` — lampiran |
| [resources/settings.md](resources/settings.md) | Resource `Settings` — sendAs, vacation, IMAP/POP |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | **Anatomi request + penjelasan kode per operasi** |
| [reference-api/messages.md](reference-api/messages.md) | list, get, send, insert, modify, trash/untrash, delete, batch |
| [reference-api/threads.md](reference-api/threads.md) | list, get, modify, trash/untrash, delete |
| [reference-api/drafts.md](reference-api/drafts.md) | list, get, create, update, send, delete |
| [reference-api/labels.md](reference-api/labels.md) | CRUD label |
| [reference-api/history.md](reference-api/history.md) | list perubahan mailbox sejak historyId |
| [reference-api/watch-push.md](reference-api/watch-push.md) | watch, stop + Google Cloud Pub/Sub |
| [reference-api/settings.md](reference-api/settings.md) | sendAs, autoForwarding, imap, pop, vacation, language |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | **Walkthrough kode setiap guide** |
| [guides/send-and-compose.md](guides/send-and-compose.md) | Kirim email, reply ke thread, HTML body |
| [guides/attachments-and-mime.md](guides/attachments-and-mime.md) | MIME structure & lampiran |
| [guides/labels-and-search.md](guides/labels-and-search.md) | Operator pencarian Gmail & filter label |
| [guides/pagination.md](guides/pagination.md) | Pola pageToken untuk list besar |
| [guides/push-notifications.md](guides/push-notifications.md) | Realtime update via watch + Pub/Sub |
| [guides/error-handling.md](guides/error-handling.md) | Retry, backoff, dan idempotensi |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | **Fungsi demi fungsi: kode mana melakukan apa** |
| [examples/curl.md](examples/curl.md) | Contoh curl endpoint utama |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js (`googleapis`) |
| [examples/python.md](examples/python.md) | Integrasi Python (`google-api-python-client`) |

---

## Ringkasan Endpoint Utama

| Method | Path (users/{userId}/...) | Scope minimum |
|---|---|---|
| GET | `profile` | `gmail.metadata` / `gmail.readonly` |
| GET | `messages` | `gmail.readonly` / `gmail.metadata` |
| GET | `messages/{id}` | `gmail.readonly` / `gmail.metadata` |
| POST | `messages/send` | `gmail.send` |
| POST | `messages/{id}/modify` | `gmail.modify` |
| POST | `messages/{id}/trash` / `untrash` | `gmail.modify` |
| DELETE | `messages/{id}` | `https://mail.google.com/` |
| GET | `messages/{id}/attachments/{attId}` | `gmail.readonly` |
| GET | `threads` / `threads/{id}` | `gmail.readonly` |
| GET | `drafts` / `drafts/{id}` | `gmail.readonly` / `gmail.compose` |
| POST | `drafts` | `gmail.compose` |
| POST | `drafts/{id}/send` | `gmail.compose` / `gmail.send` |
| GET | `labels` / `labels/{id}` | `gmail.readonly` / `gmail.labels` |
| POST/PUT/DELETE | `labels...` | `gmail.labels` |
| GET | `history` | `gmail.history` / `gmail.readonly` |
| POST | `watch` / `stop` | `gmail.readonly` |
| GET/PUT | `settings/*` | `gmail.settings.basic` (+sharing untuk delegasi) |

`{userId}` = `me` (user terautentikasi) atau alamat email.

---

## Scopes OAuth

| Scope | Akses |
|---|---|
| `gmail.readonly` | Baca semua message/thread/label (kecuali isi draft/kirim) |
| `gmail.send` | Kirim email saja |
| `gmail.compose` | Buat/kirim draft & send |
| `gmail.insert` | Sisipkan email ke mailbox |
| `gmail.labels` | Kelola label |
| `gmail.metadata` | Header/snipet saja tanpa isi |
| `gmail.modify` | Semua kecuali hapus permanen & setting |
| `gmail.settings.basic` | Baca/ubah setting dasar |
| `https://mail.google.com/` | Full (termasuk delete permanen) |

> Prinsip: minta scope **sekecil mungkin** — verifikasi OAuth Google lebih ketat untuk scope luas seperti `mail.google.com/`.
