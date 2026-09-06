# Label & Pencarian

Cara memfilter email lewat operator query Gmail dan parameter labelIds.

---

## 1. Operator Query `q`

Parameter `q` memakai bahasa pencarian Gmail yang sama dengan kotak search web:

| Operator | Contoh | Arti |
|---|---|---|
| `from:` | `from:budi@corp.com` | Dari pengirim tertentu |
| `to:` | `to:me` | Kepada saya |
| `subject:` | `subject:invoice` | Subjek mengandung kata |
| `is:` | `is:unread` / `is:starred` / `is:important` | Status |
| `in:` | `in:inbox` / `in:spam` / `in:trash` | Lokasi |
| `label:` | `label:pekerjaan` | Label kustom |
| `has:` | `has:attachment` | Ada lampiran |
| `filename:` | `filename:pdf` | Nama file lampiran |
| `after:` / `before:` | `after:2026/08/01` | Rentang tanggal |
| `older_than:` / `newer_than:` | `newer_than:7d` | Relatif waktu |
| `-` | `-in:spam` | Kecualikan |

Kombinasi: `q=is:unread from:budi@corp.com has:attachment newer_than:30d` — default operator = AND.

Encode URL: `:` → `%3A`, spasi → `%20`:

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread%20has%3Aattachment" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 2. Filter labelIds

Tanpa `q`, pakai parameter `labelIds` (lebih cepat di server):

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&labelIds=UNREAD" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- Banyak `labelIds` = email harus punya **semua** label (AND).
- Tanpa `includeSpamTrash=true`, SPAM/TRASH otomatis dikecualikan.

## 3. Kapan q vs labelIds

| Kebutuhan | Pakai |
|---|---|
| Filter label murni | `labelIds` (cepat) |
| Pencarian teks/tanggal/pengirim | `q` |
| Campuran | `q=label:pekerjaan is:unread` (label di dalam q juga boleh) |

## 4. Label Otomatis (workflow)

Pola arsip otomatis dengan label kustom:

```bash
# (1) buat label sekali
curl -X POST ".../labels" -d '{ "name": "Diproses" }' ...

# (2) cari email masuk baru
curl ".../messages?q=is:unread%20in:inbox" ...

# (3) proses lalu tandai + arsipkan sekaligus (batch hingga 1000)
curl -X POST ".../messages/batchModify" \
  -d '{ "ids": ["a","b"], "addLabelIds": ["Label_Diproses"], "removeLabelIds": ["UNREAD","INBOX"] }' ...
```

- `removeLabelIds: ["INBOX"]` = arsipkan (hilang dari inbox, tetap di All Mail).
- Id label kustom bukan nama — ambil dari `labels.list` (`id: "Label_123"`).

## 5. Gotchas

1. `label:` di query `q` memakai **nama** label, `labelIds` parameter memakai **id**.
2. Operator date memakai format `YYYY/MM/DD` (bukan ISO penuh).
3. `is:read` artinya bukan-unread (Gmail tidak punya label READ).
4. Query `q` di `threads.list` bekerja pada thread — thread muncul bila salah satu emailnya cocok.
