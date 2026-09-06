# Rate Limits & Kuota

Gmail API memakai dua jenis batasan: **kuota API** (quota units) dan **batas pengiriman email**.

---

## 1. Quota Units API

Setiap request menghabiskan unit kuota per user:

| Metode | Biaya (unit) |
|---|---|
| `messages.get` (format minimal/metadata) | 5 |
| `messages.get` (format full/raw) | 5 |
| `messages.list` / `threads.list` | 5 |
| `labels.*`, `history.list` | 5 |
| `drafts.create` / `drafts.update` | 25 |
| `messages.insert` / `threads.insert` | 100 |
| `messages.send` / `drafts.send` | **100** |
| `messages.attachments.get` | 5 |

**Batas**: 250 quota units per user per detik. Lonjakan di atas itu → error `403 rateLimitExceeded` atau `429`.

Contoh perhitungan: loop kirim 10 email + list antar waktu — 10 × 100 = 1000 unit. Semua dalam 1 detik akan kena limit; beri jeda atau proses bertahap.

## 2. Batas Kirim Email Harian

| Jenis akun | Batas kirim /hari |
|---|---|
| Gmail gratis (@gmail.com) | ~500 email |
| Google Workspace (berbayar) | ~2000 email |
| Email ke penerima luar + besar (>25MB agregat) | Lebih kecil lagi |

Melebihi → email ditolak dengan pesan "Gmail daily sending limit" (bukan error API 429). Pantau di sisi aplikasi: simpan counter kirim per hari.

## 3. Batas Lain

| Hal | Batas |
|---|---|
| Ukuran email total | 35 MB (termasuk setelah encoding) |
| Attachment per email | Sama batas 35 MB total |
| Label per message | 100 |
| `batchModify` / `batchDelete` | 1000 id per request |
| Message per mailbox | Tidak relevan (kuota storage Gmail) |
| Rate `history.list` | Ikut 250 units/s |

## 4. Cara Pantau

1. **Cloud Console → APIs & Services → Gmail API → Quotas** — grafik traffic & error.
2. **Response header** `X-RateLimit-Remaining` bila tersedia.
3. Error spesifik: lihat [errors.md](errors.md).

## 5. Strategi Aman

1. **`format=metadata` untuk list** — payload besar tidak diunduh kecuali perlu.
2. **`metadataHeaders` filter** — hanya header tertentu (Subject/From) yang dikembalikan.
3. **Paging dengan `maxResults=500`** — sedikit request, banyak data.
4. **Antrian kirim** — kumpulkan email di queue, proses dengan jeda ≥ 250ms per send (400 unit/detik > 250 limit jika 3 send/detik).
5. **Exponential backoff saat 429/403** — pola identik Blogger/Neon: tunggu `2^attempt` + jitter (lihat [../guides/error-handling.md](../guides/error-handling.md)).
6. **`history.list` untuk sinkronisasi** — jauh lebih hemat daripada re-list seluruh mailbox.
