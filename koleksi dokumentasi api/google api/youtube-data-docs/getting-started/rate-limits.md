# Rate Limits & Kuota — YouTube Data API v3

YouTube Data API tidak membatasi request per detik secara publik; yang membatasi adalah **kuota harian dalam unit**. Semua request, termasuk request invalid, memakan minimal 1 unit.

- Dokumentasi resmi: https://developers.google.com/youtube/v3/determine_quota_cost
- Halaman kuota project: https://console.cloud.google.com/iam-admin/quotas

---

## 1. Alokasi Default

| Bucket kuota | Alokasi default per hari |
|---|---|
| `search.list` | 100 panggilan |
| `videos.insert` | 100 panggilan |
| Semua endpoint lain (digabung) | 10.000 unit |

Poin penting:

- `search.list` dan `videos.insert` punya **bucket kuota sendiri**. Masing-masing 100 panggilan per hari, dan biaya per panggilan adalah 1 unit.
- Kuota reset tengah malam **Pacific Time (PT)**, bukan waktu lokalmu.
- Alokasi default bisa berubah — Google menyatakan angka default "subject to change".
- Method **YouTube Live Streaming API** secara teknis bagian dari YouTube Data API dan ikut memakan kuota yang sama.
- Kalau satu method mengembalikan beberapa halaman, **setiap** request halaman berikutnya kena biaya kuota lagi.

> Catatan: `part` dan `fields` menghemat bandwidth dan latency, **bukan** kuota. Biaya kuota ditentukan per method.

---

## 2. Tabel Biaya Kuota per Method

| Resource | Method | Biaya |
|---|---|---|
| `activities` | `list` | 1 |
| `captions` | `list` | 50 |
| `captions` | `insert` | 400 |
| `captions` | `update` | 450 |
| `captions` | `delete` | 50 |
| `channelBanners` | `insert` | 50 |
| `channels` | `list` | 1 |
| `channels` | `update` | 50 |
| `channelSections` | `list` | 1 |
| `channelSections` | `insert` | 50 |
| `channelSections` | `update` | 50 |
| `channelSections` | `delete` | 50 |
| `comments` | `list` | 1 |
| `comments` | `insert` | 50 |
| `comments` | `update` | 50 |
| `comments` | `setModerationStatus` | 50 |
| `comments` | `delete` | 50 |
| `commentThreads` | `list` | 1 |
| `commentThreads` | `insert` | 50 |
| `commentThreads` | `update` | 50 |
| `guideCategories` | `list` | 1 |
| `i18nLanguages` | `list` | 1 |
| `i18nRegions` | `list` | 1 |
| `members` | `list` | 1 |
| `membershipsLevels` | `list` | 1 |
| `playlistItems` | `list` | 1 |
| `playlistItems` | `insert` | 50 |
| `playlistItems` | `update` | 50 |
| `playlistItems` | `delete` | 50 |
| `playlists` | `list` | 1 |
| `playlists` | `insert` | 50 |
| `playlists` | `update` | 50 |
| `playlists` | `delete` | 50 |
| `search` | `list` | Bucket sendiri: 100 panggilan/hari, 1 unit per panggilan |
| `subscriptions` | `list` | 1 |
| `subscriptions` | `insert` | 50 |
| `subscriptions` | `delete` | 50 |
| `thumbnails` | `set` | 50 |
| `videoAbuseReportReasons` | `list` | 1 |
| `videoCategories` | `list` | 1 |
| `videos` | `list` | 1 |
| `videos` | `insert` | Bucket sendiri: 100 panggilan/hari, 1 unit per panggilan |
| `videos` | `update` | 50 |
| `videos` | `rate` | 50 |
| `videos` | `getRating` | 1 |
| `videos` | `reportAbuse` | 50 |
| `videos` | `delete` | 50 |
| `watermarks` | `set` | 50 |
| `watermarks` | `unset` | 50 |

Perhatikan tiga hal yang sering salah dikira:

1. `captions.insert` (400) dan `captions.update` (450) adalah operasi **termahal** di API ini. Bukan `videos.insert`.
2. `captions.list` biayanya 50, bukan 1 — beda dari `list` resource lain.
3. `search.list` biayanya rendah per panggilan, tapi jumlah panggilannya dibatasi ketat (100/hari).

---

## 3. Cara Menghitung Kuota

Jumlahkan biaya semua method yang dipanggil dalam satu hari, per bucket.

Contoh: aplikasi dashboard channel yang menyegarkan data 20 kali sehari.

```
Per refresh:
  channels.list           1 unit   (ambil uploadsPlaylistId + statistik)
  playlistItems.list      1 unit   (50 video terbaru, 1 halaman)
  videos.list             1 unit   (statistik 50 video sekaligus, id dipisah koma)
  --------------------------------
  Total per refresh       3 unit

20 refresh/hari         = 60 unit  → jauh di bawah 10.000
```

Contoh yang boros:

```
Salah:
  search.list dipanggil 1x per video untuk 50 video = 50 panggilan
  → bucket search.list (100/hari) habis setengahnya untuk satu operasi

Benar:
  videos.list?id=ID1,ID2,...,ID50 = 1 panggilan = 1 unit
```

Contoh upload harian:

```
1 video + thumbnail + masuk playlist:
  videos.insert           bucket videos.insert, 1 panggilan
  thumbnails.set          50 unit
  playlistItems.insert    50 unit
  --------------------------------
  100 unit dari bucket 10.000 + 1 dari bucket videos.insert

→ Praktisnya bucket videos.insert (100/hari) yang lebih dulu jadi batas nyata.
```

Contoh caption:

```
Unggah caption untuk 20 video:
  captions.insert × 20 = 20 × 400 = 8.000 unit
  → 80% kuota harian habis hanya untuk caption
```

---

## 4. Minta Penambahan Kuota

Kalau kuota default tidak cukup, isi **Quota extension request form** untuk YouTube API Services:

https://support.google.com/youtube/contact/yt_api_form

Formulir yang sama juga dipakai untuk **audit compliance** — audit inilah yang melepas batasan "semua video hasil upload dipaksa private" untuk API project yang dibuat setelah 28 Juli 2020.

Siapkan sebelum mengajukan:

| Yang diminta | Kenapa |
|---|---|
| Nomor project Google Cloud | Identifikasi kuota |
| Deskripsi fungsi aplikasi | Verifikasi kepatuhan Terms of Service |
| Estimasi pemakaian per method | Justifikasi angka yang diminta |
| Demo / screenshot alur aplikasi | Bukti API dipakai sesuai kebijakan |

---

## 5. Strategi Hemat Kuota

| Strategi | Efek |
|---|---|
| Batch ID dalam satu request | `videos.list?id=A,B,C` = 1 unit untuk banyak video, bukan 1 unit per video |
| Hindari `search.list` untuk hal yang bisa dilakukan `playlistItems.list` | Video terbaru satu channel lebih baik diambil dari playlist `uploads` (1 unit, tanpa memakan bucket search) |
| Cache hasil + simpan `etag` | `If-None-Match` → `304`, hemat bandwidth (biaya kuota method tetap dihitung) |
| Cache di sisi aplikasi dengan TTL | Menekan **jumlah** panggilan, ini yang benar-benar menghemat kuota |
| `part` seminimal mungkin | Hemat latency & bandwidth |
| `fields` untuk memotong properti bersarang | Hemat bandwidth & parsing |
| `maxResults=50` | Kurangi jumlah halaman → kurangi jumlah panggilan berbiaya |
| Jangan retry membabi buta | Request gagal tetap memakan kuota minimal 1 unit |
| Simpan ID hasil pencarian | Satu `search.list` lalu simpan ID-nya, jangan ulangi pencarian yang sama |

Ambil `uploads` playlist sekali, lalu pakai `playlistItems.list`:

```bash
# 1 unit — dapat contentDetails.relatedPlaylists.uploads
curl "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=CHANNEL_ID&key=API_KEY"

# 1 unit — 50 video terbaru tanpa menyentuh bucket search.list
curl "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=UPLOADS_PLAYLIST_ID&maxResults=50&key=API_KEY"
```

Contoh perhitungan lengkap dengan skenario nyata: [../guides/quota-cost.md](../guides/quota-cost.md).

---

## 6. Ketika Kuota Habis

Response:

```json
{
  "error": {
    "code": 403,
    "message": "The request cannot be completed because you have exceeded your <a href=\"/youtube/v3/getting-started#quota\">quota</a>.",
    "errors": [
      {
        "domain": "youtube.quota",
        "reason": "quotaExceeded",
        "message": "The request cannot be completed because you have exceeded your quota."
      }
    ]
  }
}
```

`quotaExceeded` **bukan** error transien. Retry dengan backoff tidak akan menolong sampai kuota reset tengah malam PT. Penanganan yang benar: hentikan polling, tandai state aplikasi, tampilkan pesan ke user, lanjutkan besok. Lihat [../guides/error-handling.md](../guides/error-handling.md).

Bedakan dari `rateLimitExceeded` / `userRateLimitExceeded` (429 atau 403) yang **transien** — itu memang layak di-retry dengan exponential backoff.
