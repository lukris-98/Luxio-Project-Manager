# Overview

Gmail API v1 adalah API REST resmi Google untuk mengakses **mailbox Gmail** (akun @gmail.com dan Google Workspace). Berbeda dengan IMAP/SMTP, API ini berbasis JSON + OAuth 2.0 dan menyediakan model data terstruktur.

- Base URL: `https://gmail.googleapis.com`
- Dokumentasi: https://developers.google.com/gmail/api
- `{userId}` di semua endpoint = `me` (user terautentikasi) atau alamat email user tersebut.

---

## Model Resource

```
User (me)
 ├── Profile          — ringkasan mailbox
 ├── Messages         — email (satu per satu)
 │    └── Attachments — lampiran
 ├── Threads          — percakapan (kumpulan message ber-reply-an)
 ├── Drafts           — draf yang belum dikirim
 ├── Labels           — label sistem (INBOX, SENT...) + label buatan user
 ├── History          — log perubahan mailbox sejak historyId tertentu
 └── Settings         — sendAs, autoForwarding, vacation, IMAP, POP, language
```

## Kasus Penggunaan Umum

1. **Kirim email otomatis** — notifikasi transaksi, laporan harian, email transaksional aplikasi.
2. **Baca & proses email masuk** — parse invoice, ekstrak data dari notifikasi, auto-reply.
3. **Dashboard email** — statistik unread, email per label, search custom.
4. **Sinkronisasi realtime** — `watch` + Pub/Sub untuk event email baru tanpa polling.
5. **Manajemen mailbox** — arsip massal via `batchModify`, label otomatis, trash/untrash.

---

## Prinsip Dasar Request

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- Wajib header `Authorization: Bearer {token}` — Gmail API **tidak bisa** pakai API key.
- Isi email dalam `payload.body.data` berformat **base64url** (bukan base64 biasa) — ganti `-`→`+`, `_`→`/`, tambahkan padding sebelum dekode.
- Endpoint tindakan memakai POST dengan kata kerja di akhir path: `/send`, `/modify`, `/trash`, `/untrash`, `/verify`.

## Format `messages.get`

| `format` | Isi yang dikembalikan | Kegunaan |
|---|---|---|
| `full` (default) | Payload MIME lengkap | Baca isi email |
| `metadata` | Header (To/From/Subject/...) + label + snippet | List cepat, dashboard |
| `minimal` | id + labelIds saja | Inventory |
| `raw` | Email RFC 2822 utuh dalam base64url | Parsing sendiri |

---

## Batasan Penting

- **Scope minimal**: minta scope sekecil mungkin; scope `https://mail.google.com/` (full) butuh verifikasi app Google yang ketat.
- **Batas kirim harian**: ~500 email/hari (akun gratis), ~2000/hari (Google Workspace paid).
- **Kuota API**: 250 quota units/user/detik (lihat [rate-limits.md](rate-limits.md)).
- **Gmail API hanya untuk Gmail** — tidak bisa dipakai untuk server email pihak ketiga (Yahoo, Outlook, dsb).
- **Draft & label kustom** tidak bisa diakses via `gmail.readonly` — perlu `gmail.compose`/`gmail.labels`.
- **Delete permanen** (`DELETE messages/{id}`, `batchDelete`) hanya dengan scope full dan tetap terbatas.
