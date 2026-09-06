# Search & Filter

`search.list` adalah satu-satunya endpoint pencarian di YouTube Data API v3. Endpoint ini paling fleksibel sekaligus paling ketat dibatasi.

- Endpoint: `GET https://www.googleapis.com/youtube/v3/search`
- Biaya kuota: bucket **Search Queries** — 100 panggilan per hari, 1 unit per panggilan
- Autentikasi: **API key cukup** untuk pencarian publik. OAuth hanya diperlukan untuk filter `forMine`, `forDeveloper`, `forContentOwner`
- `part` satu-satunya nilai valid: `snippet`

Referensi parameter lengkap: [../reference-api/search.md](../reference-api/search.md).

---

## 1. Request Paling Sederhana

```bash
# part=snippet wajib. type default-nya "video,channel,playlist".
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=belajar+react&key=API_KEY"
```

```bash
# Batasi ke video saja + 25 hasil per halaman.
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=belajar+react&type=video&maxResults=25&key=API_KEY"
```

---

## 2. Operator di Parameter `q`

| Operator | Contoh | Arti |
|---|---|---|
| Spasi | `q=belajar react` | Kedua kata dicari |
| `-` (NOT) | `q=boating -fishing` | Kecualikan "fishing" |
| `|` (OR) | `q=boating\|sailing` | Salah satu dari dua kata |
| Kombinasi | `q=boating\|sailing -fishing` | ("boating" atau "sailing") tanpa "fishing" |

> Catatan: karakter pipa harus di-URL-escape menjadi `%7C`.

```bash
# boating ATAU sailing, TANPA fishing.
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=boating%7Csailing+-fishing&type=video&key=API_KEY"
```

---

## 3. Filter — Pilih Nol atau Satu

Tiga parameter ini saling eksklusif dan semuanya butuh request terautentikasi:

| Filter | Arti | Syarat |
|---|---|---|
| `forMine=true` | Hanya video milik user terautentikasi | `type=video` wajib |
| `forDeveloper=true` | Hanya video yang diunggah lewat aplikasi developer ini | Server mengidentifikasi developer dari kredensial request |
| `forContentOwner=true` | Hanya video milik content owner tertentu | `onBehalfOfContentOwner` wajib, `type=video` wajib, akun harus terhubung ke content owner |

Kalau salah satu filter di atas dipakai, parameter berikut **tidak boleh** diset: `videoDefinition`, `videoDimension`, `videoDuration`, `videoEmbeddable`, `videoLicense`, `videoPaidProductPlacement`, `videoSyndicated`, `videoType`.

```bash
# Video milik sendiri. Butuh OAuth (bukan API key).
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```bash
# Hanya video yang diunggah lewat aplikasi ini. Berguna untuk audit unggahan aplikasimu sendiri.
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&forDeveloper=true&type=video&maxResults=50" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 4. Parameter Opsional per Kategori

### Cakupan & tipe

| Parameter | Nilai | Catatan |
|---|---|---|
| `type` | `video`, `channel`, `playlist` (koma untuk gabungan) | Default `video,channel,playlist` |
| `channelId` | ID channel | Hanya resource buatan channel tersebut |
| `channelType` | `any`, `show` | — |

### Waktu

| Parameter | Format |
|---|---|
| `publishedAfter` | RFC 3339, mis. `2026-01-01T00:00:00Z` |
| `publishedBefore` | RFC 3339 |

### Lokasi & bahasa

| Parameter | Nilai | Catatan |
|---|---|---|
| `location` | `lat,long` mis. `37.42307,-122.08427` | Wajib berpasangan dengan `locationRadius`, dan `type=video` |
| `locationRadius` | Angka + unit: `m`, `km`, `ft`, `mi` — mis. `5km` | Maksimum 1000 km |
| `regionCode` | ISO 3166-1 alpha-2, mis. `ID` | Hasil yang bisa ditonton di negara tersebut |
| `relevanceLanguage` | ISO 639-1, mis. `id`. Pakai `zh-Hans`/`zh-Hant` untuk Mandarin | Hasil bahasa lain tetap bisa muncul kalau sangat relevan |

### Filter khusus video

Semua parameter di bawah ini **wajib** disertai `type=video`. Kalau tidak → `400 invalidSearchFilter`.

| Parameter | Nilai |
|---|---|
| `eventType` | `completed`, `live`, `upcoming` |
| `videoCaption` | `any`, `closedCaption`, `none` |
| `videoCategoryId` | ID kategori dari `videoCategories.list` |
| `videoDefinition` | `any`, `high` (HD, minimal 720p), `standard` |
| `videoDimension` | `2d`, `3d`, `any` (default `any`) |
| `videoDuration` | `any`, `short` (<4 menit), `medium` (4–20 menit), `long` (>20 menit) |
| `videoEmbeddable` | `any`, `true` |
| `videoLicense` | `any`, `creativeCommon`, `youtube` |
| `videoPaidProductPlacement` | `any`, `true` |
| `videoSyndicated` | `any`, `true` |
| `videoType` | `any`, `episode`, `movie` |
| `topicId` | ID topik kurasi YouTube, mis. `/m/04rlf` (Music) |

### Konten sensitif

| Parameter | Nilai | Catatan |
|---|---|---|
| `safeSearch` | `moderate` (default), `none`, `strict` | `moderate` memfilter konten yang dibatasi di locale-mu |

---

## 5. Parameter `order`

| Nilai | Arti |
|---|---|
| `relevance` | **Default.** Relevansi terhadap `q` |
| `date` | Terbaru dulu |
| `rating` | Rating tertinggi dulu |
| `title` | Alfabetis judul |
| `videoCount` | Untuk channel: jumlah video terbanyak dulu |
| `viewCount` | View terbanyak dulu. Untuk siaran langsung: jumlah penonton bersamaan |

Tiga peringatan resmi soal `order`:

1. `order=date` bergantung pada indeks pencarian, jadi konten baru bisa **tertunda** atau hasilnya **tidak lengkap**. Untuk mengambil video terbaru satu channel secara andal, jangan pakai `search.list` — pakai `playlistItems.list` atas playlist `uploads`.
2. `order=rating` dihitung dari skor algoritmik internal, **bukan** urutan jumlah like.
3. Memakai `order` selain `relevance` bisa menghasilkan hasil yang lebih sedikit/tidak lengkap, terutama kalau dikombinasikan dengan `publishedAfter`/`publishedBefore`. Pemfilteran ketat `type` juga bisa terpengaruh sehingga tipe resource tak terduga muncul di response.

```bash
# Untuk "video terbaru channel X" — cara yang salah:
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=CHANNEL_ID&type=video&order=date&key=API_KEY"

# Cara yang benar: 2 request, 2 unit, tidak menyentuh bucket search, tidak terkena batas 500.
curl "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=CHANNEL_ID&key=API_KEY"
curl "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=UPLOADS_PLAYLIST_ID&maxResults=50&key=API_KEY"
```

---

## 6. Bentuk Response

```json
{
  "kind": "youtube#searchListResponse",
  "etag": "ETAG_VALUE",
  "nextPageToken": "CAUQAA",
  "regionCode": "ID",
  "pageInfo": {
    "totalResults": 1000000,
    "resultsPerPage": 5
  },
  "items": [
    {
      "kind": "youtube#searchResult",
      "etag": "ETAG_VALUE",
      "id": {
        "kind": "youtube#video",
        "videoId": "VIDEO_ID"
      },
      "snippet": {
        "publishedAt": "2026-03-01T08:00:00Z",
        "channelId": "CHANNEL_ID",
        "title": "Judul video",
        "description": "Potongan deskripsi...",
        "thumbnails": {
          "default": { "url": "https://i.ytimg.com/vi/VIDEO_ID/default.jpg", "width": 120, "height": 90 },
          "medium": { "url": "https://i.ytimg.com/vi/VIDEO_ID/mqdefault.jpg", "width": 320, "height": 180 },
          "high": { "url": "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg", "width": 480, "height": 360 }
        },
        "channelTitle": "Nama Channel",
        "liveBroadcastContent": "none"
      }
    }
  ]
}
```

`id` adalah objek, bukan string. Cabangkan berdasarkan `id.kind`:

```js
// Satu response search bisa berisi campuran tiga tipe resource.
for (const item of data.items) {
  switch (item.id.kind) {
    case 'youtube#video':
      videos.push(item.id.videoId);
      break;
    case 'youtube#channel':
      channels.push(item.id.channelId);
      break;
    case 'youtube#playlist':
      playlists.push(item.id.playlistId);
      break;
  }
}
```

---

## 7. Keterbatasan yang Harus Kamu Rencanakan

| Keterbatasan | Detail | Solusi |
|---|---|---|
| Bucket kuota terpisah | 100 panggilan `search.list` per hari. Setiap halaman = 1 panggilan | Cache hasil, simpan ID, jangan ulangi query sama |
| Batas 500 video | Berlaku kalau `channelId` + `type=video` tanpa `forContentOwner`/`forDeveloper`/`forMine` | Pakai `playlistItems.list` atas playlist `uploads` |
| `totalResults` perkiraan | Nilai maksimum 1.000.000, tidak akurat | Jangan bangun UI paginasi dari angka ini |
| Hasil per halaman bisa < `maxResults` | Karena penyortiran/pemfilteran internal | Andalkan `nextPageToken`, bukan jumlah item |
| `snippet` saja | Tidak ada statistik, durasi, atau contentDetails di hasil search | Ambil ID lalu satu `videos.list?id=A,B,C` (1 unit untuk sampai 50 video) |
| `order=date` tidak andal | Indeks pencarian bisa tertunda | `playlistItems.list` atas `uploads` |
| Filter video butuh `type=video` | Kalau tidak → `invalidSearchFilter` | Selalu set `type=video` saat memakai filter `video*` |

Pola dua tahap yang hemat:

```bash
# TAHAP 1 — search.list (1 panggilan bucket search) hanya untuk mendapatkan ID.
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=react+tutorial&type=video&maxResults=50&fields=items(id/videoId)&key=API_KEY"

# TAHAP 2 — videos.list (1 unit) untuk semua detail 50 video sekaligus.
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=ID1,ID2,ID3&key=API_KEY"
```

---

## 8. Error `search.list`

| HTTP | reason | Penyebab |
|---|---|---|
| 400 | `invalidChannelId` | `channelId` tidak valid |
| 400 | `invalidLocation` | Format `location`/`locationRadius` salah, atau `locationRadius` tidak diisi |
| 400 | `invalidRelevanceLanguage` | Format `relevanceLanguage` salah |
| 400 | `invalidSearchFilter` | Kombinasi filter tidak valid — hampir selalu karena `type=video` tidak diset |
| 403 | `quotaExceeded` | Bucket 100 panggilan `search.list` sudah habis hari ini |

Detail penanganan: [../getting-started/errors.md](../getting-started/errors.md), [error-handling.md](error-handling.md).
