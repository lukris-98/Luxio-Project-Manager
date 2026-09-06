# Overview — YouTube Data API v3

Pengenalan konsep inti YouTube Data API v3: model resource, parameter `part` & `fields`, kuota, dan batasan yang paling sering menabrak developer.

- Base URL: `https://www.googleapis.com/youtube/v3`
- Dokumentasi resmi: https://developers.google.com/youtube/v3/getting-started
- Format data: JSON
- Autentikasi: API key (baca publik) atau OAuth 2.0 (tulis + data privat)

---

## 1. Yang Kamu Butuhkan Sebelum Mulai

| Langkah | Keterangan |
|---|---|
| Google Account | Untuk masuk ke Google Cloud / API Console |
| Project di Google Cloud Console | Wadah kredensial + kuota |
| Aktifkan **YouTube Data API v3** | Status harus `ON` di halaman Enabled APIs |
| Kredensial | API key untuk data publik, OAuth 2.0 client untuk data user |
| Client library (opsional) | `googleapis` (Node), `google-api-python-client` (Python), dll |

Detail langkah: [enable-api.md](enable-api.md), [authentication.md](authentication.md).

---

## 2. Model Resource

Resource = satu entitas data dengan ID unik. Semua resource direpresentasikan sebagai objek JSON.

| Resource | Isi |
|---|---|
| `activity` | Aksi yang dilakukan channel/user (upload, rating, dsb) |
| `channel` | Satu channel YouTube |
| `channelBanner` | URL sementara untuk gambar banner yang baru diunggah |
| `channelSection` | Kumpulan video yang di-feature di halaman channel |
| `guideCategory` | Kategori yang YouTube kaitkan dengan channel |
| `i18nLanguage` | Bahasa UI yang didukung situs YouTube |
| `i18nRegion` | Region konten yang didukung situs YouTube |
| `playlist` | Satu playlist |
| `playlistItem` | Satu item (biasanya video) di dalam playlist |
| `search result` | Hasil pencarian — tidak punya data persisten sendiri |
| `subscription` | Langganan user ke satu channel |
| `thumbnail` | Kumpulan ukuran gambar thumbnail milik resource lain |
| `video` | Satu video |
| `videoCategory` | Kategori yang bisa dipasang ke video yang diunggah |
| `watermark` | Gambar branding yang muncul saat video channel diputar |
| `caption` | Satu track caption/subtitle milik satu video |
| `comment` / `commentThread` | Komentar tunggal / thread komentar + balasan |
| `member` / `membershipsLevel` | Member berbayar channel & tingkatan harganya |
| `videoAbuseReportReason` | Alasan pelaporan video |

> Prinsip: resource saling merujuk lewat ID, bukan lewat objek bersarang. Contoh: `playlistItem.snippet.resourceId.videoId` menunjuk ke resource `video`; hasil `search` hanya berisi `id.videoId` / `id.channelId` / `id.playlistId`, jadi kamu perlu satu request lanjutan untuk mendapatkan detail lengkap.

Peta relasi antar resource: [../resources/kemampuan-dan-alur.md](../resources/kemampuan-dan-alur.md).

---

## 3. Operasi Standar

| Operasi | HTTP | Arti |
|---|---|---|
| `list` | `GET` | Ambil nol atau lebih resource |
| `insert` | `POST` | Buat resource baru |
| `update` | `PUT` | Ubah resource yang ada |
| `delete` | `DELETE` | Hapus resource |

Selain empat itu ada method khusus per resource: `videos.rate`, `videos.getRating`, `videos.reportAbuse`, `thumbnails.set`, `comments.setModerationStatus`, `captions.download`, `watermarks.set`/`unset`, `channelBanners.insert`.

> Catatan: `insert`, `update`, dan `delete` **selalu** butuh OAuth. `list` bisa tanpa OAuth (pakai API key) selama hanya membaca data publik.

---

## 4. Parameter `part` — Wajib

Setiap request yang mengembalikan resource **wajib** menyertakan `part`. Isinya adalah daftar properti top-level (bukan bersarang) yang ingin kamu terima.

Contoh part yang dimiliki resource `video`:

```
snippet, contentDetails, fileDetails, player, processingDetails,
recordingDetails, statistics, status, suggestions, topicDetails
```

```bash
# Minta hanya snippet → response kecil, latency rendah.
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=VIDEO_ID&key=API_KEY"

# Minta beberapa part sekaligus — dipisah koma, tanpa spasi.
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=VIDEO_ID&key=API_KEY"
```

Alasan `part` diwajibkan:

1. Menurunkan latency — server tidak mengambil metadata yang tidak kamu pakai.
2. Menurunkan bandwidth — response lebih kecil.
3. Tahan perubahan — part baru yang ditambahkan Google tidak otomatis membebani aplikasimu.

---

## 5. Parameter `fields` — Filter Lanjutan

`part` tidak bisa memfilter properti bersarang. Untuk itu ada `fields`.

| Sintaks | Arti |
|---|---|
| `fields=a,b` | Ambil beberapa field |
| `fields=*` | Wildcard, semua field |
| `fields=a(b,c)` | Grup properti bersarang |
| `fields=a/b` | Properti bersarang lewat slash |

Tiga bentuk berikut menghasilkan response yang sama:

```
fields=items/id,playlistItems/snippet/title,playlistItems/snippet/position
fields=items(id,snippet/title,snippet/position)
fields=items(id,snippet(title,position))
```

```bash
# part memilih blok; fields membuang kind/etag dan properti snippet yang tidak dipakai.
curl "https://www.googleapis.com/youtube/v3/videos?id=VIDEO_ID&key=API_KEY&part=snippet,statistics&fields=items(id,snippet(channelId,title,categoryId),statistics)"
```

Response-nya menjadi:

```json
{
  "videos": [
    {
      "id": "7lCDEYXw3mM",
      "snippet": {
        "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
        "title": "Google I/O 101: Q&A On Using Google APIs",
        "categoryId": "28"
      },
      "statistics": {
        "viewCount": "3057",
        "likeCount": "25",
        "dislikeCount": "0",
        "favoriteCount": "17",
        "commentCount": "12"
      }
    }
  ]
}
```

> Catatan: nilai `fields` harus URL-encoded seperti query parameter lain. Contoh di dokumentasi ini tidak di-encode supaya mudah dibaca.

`fields` **tidak** menurunkan biaya kuota — biaya kuota ditentukan per method, bukan per ukuran response. Yang dihemat adalah bandwidth dan waktu parsing. Detail: [rate-limits.md](rate-limits.md).

---

## 6. Kuota

| Bucket | Alokasi default per hari |
|---|---|
| `search.list` | 100 panggilan |
| `videos.insert` | 100 panggilan |
| Semua endpoint lain (gabungan) | 10.000 unit |

- Semua request — **termasuk request yang gagal/invalid** — memakan minimal 1 unit.
- Kuota harian reset tengah malam Pacific Time (PT).
- Pemakaian kuota terlihat di halaman Quotas di Google API Console.

Perkiraan biaya kasar: baca (`list`) 1 unit, tulis (`insert`/`update`/`delete`) 50 unit, `search.list` 1 unit (bucket sendiri), `videos.insert` 1 unit (bucket sendiri). Tabel lengkap per method: [rate-limits.md](rate-limits.md).

---

## 7. Optimasi Performa

### ETag

Setiap resource punya `etag`. Kegunaannya:

| Kasus | Cara | Hasil |
|---|---|---|
| Cache + conditional GET | Kirim `If-None-Match: ETAG` | `304 Not Modified` kalau tidak berubah |
| Cegah overwrite | Kirim `If-Match: ETAG` saat update/delete | Request gagal kalau resource sudah berubah |

Dukungan ETag berbeda antar client library. Google APIs Client Library for JavaScript mendukung header `If-Match` dan `If-None-Match`.

### gzip

```bash
# Dua-duanya wajib: header Accept-Encoding DAN string "gzip" di User-Agent.
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=VIDEO_ID&key=API_KEY" \
  -H "Accept-Encoding: gzip" \
  -A "luxio-project-manager (gzip)" \
  --compressed
```

---

## 8. Batasan Penting yang Sering Menggigit

| Batasan | Detail |
|---|---|
| Service account tidak didukung | Autentikasi pakai service account menghasilkan error `youtubeSignupRequired` / `NoLinkedYouTubeAccount`. Wajib OAuth user. |
| Upload dari project belum diaudit | Semua video yang diunggah lewat `videos.insert` dari API project **belum terverifikasi** yang dibuat setelah 28 Juli 2020 dipaksa `private`. Butuh audit compliance untuk melepas batasan itu. |
| `search.list` maksimum 500 hasil | Paginasi search terbatas; lihat [../guides/pagination.md](../guides/pagination.md). |
| `statistics.dislikeCount` privat | Sejak 13 Desember 2021 hanya dikembalikan kalau request diautentikasi oleh pemilik video. |
| `statistics.favoriteCount` deprecated | Nilainya selalu `0` sejak 28 Agustus 2015. |
| `topicDetails.topicIds[]` deprecated | Tidak diisi lagi sejak 10 November 2016. |
| Upload harian channel | `videos.insert` bisa gagal dengan `uploadLimitExceeded` — ini batas platform YouTube, terpisah total dari kuota API. |
| Perubahan `viewCount` | Mulai 24 Agustus 2026, `statistics.viewCount` menghitung view begitu video mulai diputar (termasuk autoplay dan hover) untuk semua format. |

Rincian error dan penanganannya: [errors.md](errors.md).
