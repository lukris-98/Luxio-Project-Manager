# Kemampuan & Alur — Peta Lengkap YouTube Analytics API v2

File ini merangkum **semua hal yang bisa dilakukan** dengan YouTube Analytics API v2 beserta **alurnya**, dan menunjukkan file mana yang membahas apa.

- Base URL: `https://youtubeanalytics.googleapis.com/v2`
- Dua keluarga endpoint saja: `/reports` (ambil laporan) dan `/groups` + `/groupItems` (kelola segmen kustom).
- Wajib **OAuth 2.0**. API key tidak berlaku. Service account juga tidak didukung (tidak ada cara menautkan service account ke akun YouTube).

---

## 1. Model Dasar: Satu Rumus untuk Semua Laporan

Setiap laporan dibentuk dari empat elemen:

```
laporan = metrics (apa yang diukur)
        × dimensions (bagaimana dikelompokkan)
        × filters (data mana yang disertakan)
        × [startDate .. endDate] (kapan)
```

```bash
# Anatomi satu request. ids + startDate + endDate + metrics = wajib.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=day" \
  --data-urlencode "sort=day"
# → { kind, columnHeaders: [{name,columnType,dataType}], rows: [[...], ...] }
```

`columnHeaders` selalu berurutan: **dimensi dulu (urutan sesuai parameter `dimensions`), lalu metrik (urutan sesuai parameter `metrics`)**. Jangan pernah mengasumsikan indeks kolom secara hardcode — baca `columnHeaders`.

---

## 2. Daftar Lengkap Kemampuan

### A. Laporan Channel (`ids=channel==MINE`)

| Kemampuan | Endpoint | Dimensi | Metrik | Scope |
|---|---|---|---|---|
| Statistik dasar channel | `GET /reports` | *(tanpa dimensi)* | `views`, `engagedViews`, `likes`, `dislikes`, `comments`, `shares`, `estimatedMinutesWatched`, `averageViewDuration`, `subscribersGained`, `subscribersLost` | `yt-analytics.readonly` |
| Tren harian / bulanan | `GET /reports` | `day` atau `month` | idem + `uniques` | `yt-analytics.readonly` |
| Per negara | `GET /reports` | `country` | idem | `yt-analytics.readonly` |
| Per negara bagian AS | `GET /reports` | `province` (+ filter `country==US`) | subset (tanpa likes/comments/subscribers) | `yt-analytics.readonly` |
| Per kota | `GET /reports` | `city` (+ opsional `country`, `province`, `day`/`month`) | `views`, `engagedViews`, `estimatedMinutesWatched`, `averageViewDuration`, `averageViewPercentage` | `yt-analytics.readonly` |
| Per DMA (Nielsen) | `GET /reports` | `dma` (+ filter `country==US` atau `province`) | `views`, `engagedViews`, `estimatedMinutesWatched`, `averageViewDuration`, `averageViewPercentage` | `yt-analytics.readonly` |
| Demografi penonton | `GET /reports` | `ageGroup`, `gender` | `viewerPercentage` | `yt-analytics.readonly` |
| Sumber trafik | `GET /reports` | `insightTrafficSourceType` (+ `day`, `liveOrOnDemand`, `subscribedStatus`, `creatorContentType`) | `views`, `engagedViews`, `estimatedMinutesWatched` | `yt-analytics.readonly` |
| Detail sumber trafik (≤25) | `GET /reports` | `insightTrafficSourceDetail` (+ filter `insightTrafficSourceType`) | `views`, `engagedViews`, `estimatedMinutesWatched` | `yt-analytics.readonly` |
| Lokasi pemutaran | `GET /reports` | `insightPlaybackLocationType` | `views`, `engagedViews`, `estimatedMinutesWatched` | `yt-analytics.readonly` |
| Detail embed (≤25) | `GET /reports` | `insightPlaybackLocationDetail` (+ filter `insightPlaybackLocationType==EMBEDDED`) | `views`, `engagedViews`, `estimatedMinutesWatched` | `yt-analytics.readonly` |
| Perangkat & OS | `GET /reports` | `deviceType`, `operatingSystem` (boleh keduanya) | `views`, `engagedViews`, `estimatedMinutesWatched` | `yt-analytics.readonly` |
| Status langganan / produk YouTube | `GET /reports` | `subscribedStatus`, `youtubeProduct`, `liveOrOnDemand` | `views`, `redViews`, `estimatedMinutesWatched`, `averageViewDuration` | `yt-analytics.readonly` |
| Berbagi per layanan | `GET /reports` | `sharingService` | `shares` | `yt-analytics.readonly` |
| Audience retention | `GET /reports` | `elapsedVideoTimeRatio` (+ filter `video` tunggal) | `audienceWatchRatio`, `relativeRetentionPerformance`, `startedWatching`, `stoppedWatching`, `totalSegmentImpressions` | `yt-analytics.readonly` |
| Concurrent viewers livestream | `GET /reports` | `livestreamPosition` (+ filter `video`) | `averageConcurrentViewers`, `peakConcurrentViewers` | `yt-analytics.readonly` |
| Top video (≤200) | `GET /reports` | `video` (+ `sort` wajib) | seluruh metrik video | `yt-analytics.readonly` |
| Alasan batal membership | `GET /reports` | `membershipsCancellationSurveyReason` | `membershipsCancellationSurveyResponses` | `yt-analytics.readonly` |
| Performa iklan per tipe iklan | `GET /reports` | `adType` (+ opsional `day`) | `grossRevenue`, `adImpressions`, `cpm` | `yt-analytics-monetary.readonly` |

### B. Laporan Playlist

| Kemampuan | Endpoint | Dimensi | Metrik | Scope |
|---|---|---|---|---|
| Statistik dasar playlist | `GET /reports` | *(tanpa dimensi)* | `playlistViews`, `playlistStarts`, `playlistSaves`, `playlistEstimatedMinutesWatched`, `playlistAverageViewDuration`, `averageTimeInPlaylist`, `viewsPerPlaylistStart`, `views`, `engagedViews`, `estimatedMinutesWatched`, `averageViewDuration` | `yt-analytics.readonly` |
| Tren playlist harian/bulanan | `GET /reports` | `day` atau `month` | idem | `yt-analytics.readonly` |
| Playlist per negara / provinsi | `GET /reports` | `country` / `province` | `views`, `engagedViews`, `estimatedMinutesWatched`, `averageViewDuration` | `yt-analytics.readonly` |
| Playlist per lokasi pemutaran | `GET /reports` | `insightPlaybackLocationType` | metrik playlist | `yt-analytics.readonly` |
| Playlist per sumber trafik | `GET /reports` | `insightTrafficSourceType` | metrik playlist | `yt-analytics.readonly` |
| Playlist per perangkat/OS | `GET /reports` | `deviceType`, `operatingSystem` | metrik playlist | `yt-analytics.readonly` |
| Demografi playlist | `GET /reports` | `ageGroup`, `gender` | `viewerPercentage` | `yt-analytics.readonly` |
| Top playlist (≤200) | `GET /reports` | `playlist` (+ `sort` wajib) | metrik in-playlist | `yt-analytics.readonly` |

Semua laporan playlist **wajib** memakai tepat satu filter: `playlist==PLAYLIST_ID` atau `group==GROUP_ID`.

### C. Laporan Pemilik Konten (`ids=contentOwner==CONTENT_OWNER_ID`)

| Kemampuan | Endpoint | Dimensi | Metrik | Scope |
|---|---|---|---|---|
| Statistik agregat semua channel tertaut | `GET /reports` | *(tanpa dimensi)* atau `day`/`month`/`country`/`province` | seluruh metrik video + metrik pendapatan\* | `yt-analytics.readonly` (+ `-monetary` untuk \*) |
| Per channel | `GET /reports` | `channel` sebagai filter/dimensi | seluruh metrik video | `yt-analytics.readonly` |
| Konten yang diklaim vs upload sendiri | `GET /reports` | filter `claimedStatus` / `uploaderType` | seluruh metrik video | `yt-analytics.readonly` |
| Estimasi pendapatan | `GET /reports` | `day`/`month`/`country`/`video` | `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `grossRevenue`, `monetizedPlaybacks`, `playbackBasedCpm`, `adImpressions`, `cpm` | `yt-analytics-monetary.readonly` |
| Performa iklan per tipe iklan | `GET /reports` | `adType` (+ opsional `day`) | `grossRevenue`, `adImpressions`, `cpm` | `yt-analytics-monetary.readonly` |
| Data historis sebelum penautan channel | `GET /reports` | — | — (parameter `includeHistoricalChannelData=true`) | `yt-analytics.readonly` |

> Prinsip: **setiap** request laporan pemilik konten wajib difilter dengan `video`, `channel`, `group`, atau kombinasi `claimedStatus`/`uploaderType` yang didukung. Tanpa itu request ditolak.

### D. Grup & Segmen Kustom

| Kemampuan | Endpoint | Catatan | Scope |
|---|---|---|---|
| Daftar grup | `GET /groups?mine=true` | atau `?id=ID1,ID2` | `yt-analytics.readonly` |
| Buat grup | `POST /groups` | body: `snippet.title` + `contentDetails.itemType` | `youtube` / `youtubepartner` |
| Ubah nama grup | `PUT /groups` | hanya `snippet.title` yang bisa diubah | `youtube` / `youtubepartner` |
| Hapus grup | `DELETE /groups?id=GROUP_ID` | balasan `204 No Content` | `youtube` / `youtubepartner` |
| Daftar isi grup | `GET /groupItems?groupId=GROUP_ID` | — | `youtube` atau (`youtube.readonly` + `yt-analytics.readonly`) |
| Tambah item ke grup | `POST /groupItems` | body: `groupId` + `resource.id`; maksimum 500 item | `youtube` / `youtubepartner` |
| Hapus item dari grup | `DELETE /groupItems?id=ITEM_ID` | `id` di sini adalah ID *keanggotaan*, bukan ID video | `youtube` / `youtubepartner` |
| Pakai grup di laporan | `GET /reports?filters=group==GROUP_ID` | laporan mencakup semua item grup | `yt-analytics.readonly` |

Jenis item grup: `youtube#video`, `youtube#playlist`, `youtube#channel`, `youtubePartner#asset`. Satu grup hanya boleh berisi satu jenis.

---

## 3. Contoh curl Beranotasi

```bash
# ① Statistik total 28 hari terakhir — paling murah, tanpa dimensi.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost"
# → rows: [[12345, 67890, 210, 34]] — satu baris karena tidak ada dimensi.

# ② Tren harian. sort=day supaya urut naik; tanpa sort urutan tidak dijamin.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=day" \
  --data-urlencode "sort=day"
# → baris untuk hari-hari terakhir bisa TIDAK ADA jika data belum lengkap.

# ③ Top 10 video. maxResults <= 200 DAN sort WAJIB untuk laporan top videos.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched,averageViewDuration" \
  --data-urlencode "dimensions=video" \
  --data-urlencode "sort=-views" \
  --data-urlencode "maxResults=10"
# → dimensi 'video' hanya berisi ID; judul harus diambil dari YouTube Data API v3.

# ④ Demografi. Satu-satunya metrik yang legal di laporan ini: viewerPercentage.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=viewerPercentage" \
  --data-urlencode "dimensions=ageGroup,gender" \
  --data-urlencode "sort=gender,ageGroup"
# → viewerPercentage hanya menghitung penonton yang LOGIN.

# ⑤ Filter multi-nilai: sampai 500 ID video, dipisah koma; antar filter pakai ';'.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=insightTrafficSourceType,video" \
  --data-urlencode "filters=video==VIDEO_ID_1,VIDEO_ID_2;country==ID"
# → karena 'video' juga ditaruh di dimensions, hasil DIPISAH per video.
#   Tanpa itu, statistik 2 video digabung jadi satu.

# ⑥ Pendapatan — butuh scope monetary; currency opsional (default USD).
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=contentOwner==CONTENT_OWNER_ID" \
  --data-urlencode "startDate=2026-02-01" \
  --data-urlencode "endDate=2026-02-28" \
  --data-urlencode "metrics=estimatedRevenue,estimatedAdRevenue,grossRevenue,cpm" \
  --data-urlencode "dimensions=day" \
  --data-urlencode "filters=claimedStatus==claimed;uploaderType==self" \
  --data-urlencode "currency=IDR"
# → filter claimedStatus/uploaderType WAJIB untuk laporan pemilik konten.
```

---

## 4. Alur Besar Integrasi

```
[Setup sekali]
Cloud Console ─► enable YouTube Analytics API ─► buat OAuth Client ID
                                                        │
                                          consent screen + scope
                                                        │
                                             (verifikasi OAuth bila publik)
                                                        ▼
[Runtime]                                     access token (±1 jam)
                                                        │
        ┌───────────────────────────────┬───────────────┴───────────────┬──────────────────────┐
        ▼                               ▼                               ▼                      ▼
  RINGKASAN                        TREN                            SEGMENTASI              SEGMEN KUSTOM
  no dimensions                    day / month                      country / ageGroup       groups + groupItems
  1 baris                          n baris                          insightTrafficSourceType lalu filters=group==ID
        │                               │                               │                      │
        └───────────────────────────────┴───────────────┬───────────────┴──────────────────────┘
                                                        ▼
                                      baca columnHeaders[] → petakan rows[][]
                                                        │
                                      ID video/playlist ─► YouTube Data API v3
                                                          (judul, thumbnail; cache maks 30 hari)
```

Alur baca laporan:
1. Tentukan tipe laporan → cek tabel legal di [guides/channel-reports.md](guides/channel-reports.md).
2. Susun `ids` + `startDate`/`endDate` + `metrics` (+ `dimensions`, `filters`, `sort`, `maxResults`).
3. Kirim `GET /reports` dengan header `Authorization: Bearer ACCESS_TOKEN`.
4. Baca `columnHeaders[]` → bangun peta `nama kolom → indeks`.
5. Iterasi `rows[][]` memakai peta itu. Bila `rows` tidak ada, artinya tidak ada data.
6. Untuk ID resource (video/playlist/channel), ambil metadata dari YouTube Data API v3.

---

## 5. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Memahami model dimensi × metrik dari nol | [getting-started/overview.md](getting-started/overview.md) |
| Aktifkan API & buat kredensial OAuth | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Tahu scope mana yang harus diminta | [getting-started/authentication.md](getting-started/authentication.md) |
| Request pertama yang langsung jalan | [getting-started/quickstart.md](getting-started/quickstart.md) |
| Tahu nama persis semua dimensi & nilai enumerasinya | [resources/dimension.md](resources/dimension.md) |
| Tahu nama persis semua metrik & satuannya | [resources/metric.md](resources/metric.md) |
| Memetakan `columnHeaders` ke `rows` | [resources/report.md](resources/report.md) |
| Daftar lengkap parameter `reports.query` | [reference-api/reports-query.md](reference-api/reports-query.md) |
| Tahu kombinasi dimensi/metrik yang legal per laporan | [guides/channel-reports.md](guides/channel-reports.md) |
| Laporan lintas banyak channel (MCN/label) | [guides/content-owner-reports.md](guides/content-owner-reports.md) |
| Tahu dimensi mana yang tidak bisa digabung | [guides/dimensions-and-metrics.md](guides/dimensions-and-metrics.md) |
| Menyusun `filters` dan `sort` yang benar | [guides/filters-and-sorting.md](guides/filters-and-sorting.md) |
| Grafik harian/bulanan & masalah zona waktu | [guides/time-based-reports.md](guides/time-based-reports.md) |
| Laporan pendapatan & mata uang lokal | [guides/revenue-reports.md](guides/revenue-reports.md) |
| Membandingkan sekelompok video sebagai satu segmen | [guides/groups-and-custom-segments.md](guides/groups-and-custom-segments.md) |
| Menangani kuota dan batas jumlah baris | [guides/quota-and-limits.md](guides/quota-and-limits.md) |
| Retry, backoff, dan data yang belum tersedia | [guides/error-handling.md](guides/error-handling.md) |
| Kode siap jalan | [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md) |

---

## 6. Alur Contoh End-to-End: "Ambil Performa 10 Video Teratas 28 Hari Terakhir + Demografi Penonton"

Skenario: satu kartu dashboard yang menampilkan tabel 10 video teratas beserta judulnya, plus grafik batang demografi penonton. Butuh **tiga** request (dua ke Analytics API, satu ke Data API).

```bash
# ── LANGKAH 1 — Top 10 video berdasarkan views (28 hari terakhir) ────────────
# Laporan "Top videos" wajib: dimensions=video, sort=<metrik>, maxResults <= 200.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==CHANNEL_ID" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,subscribersGained" \
  --data-urlencode "dimensions=video" \
  --data-urlencode "sort=-views" \
  --data-urlencode "maxResults=10"
```

```json
// Respons langkah 1 (dipangkas). Perhatikan urutan columnHeaders.
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "video",                 "columnType": "DIMENSION", "dataType": "STRING"  },
    { "name": "views",                 "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "estimatedMinutesWatched","columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "averageViewDuration",   "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "averageViewPercentage", "columnType": "METRIC",    "dataType": "FLOAT"   },
    { "name": "likes",                 "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "comments",              "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "subscribersGained",     "columnType": "METRIC",    "dataType": "INTEGER" }
  ],
  "rows": [
    ["dQw4w9WgXcQ", 48210, 132904, 165, 41.2, 3120, 214, 187],
    ["9bZkp7q19f0", 31004,  70211, 136, 33.8, 1902, 143,  96]
  ]
}
```

```bash
# ── LANGKAH 2 — Demografi penonton untuk periode yang sama ──────────────────
# Laporan demografi HANYA menerima metrik viewerPercentage.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==CHANNEL_ID" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=viewerPercentage" \
  --data-urlencode "dimensions=ageGroup,gender" \
  --data-urlencode "sort=gender,ageGroup"
# → rows: [["age18-24","female",7.3], ["age18-24","male",11.8], ...]
#   Total seluruh baris ≈ 100% HANYA jika tidak ada dimensi playback detail
#   (subscribedStatus / liveOrOnDemand / youtubeProduct) yang ditambahkan.

# ── LANGKAH 3 — Ambil judul & thumbnail dari YouTube Data API v3 ────────────
# Analytics API hanya mengembalikan ID. Gabungkan hingga 50 ID per request.
curl -G "https://www.googleapis.com/youtube/v3/videos" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "part=snippet" \
  --data-urlencode "id=dQw4w9WgXcQ,9bZkp7q19f0"
# → snippet.title, snippet.thumbnails — cache maksimum 30 hari sesuai
#   YouTube API Services Developer Policies (III.E.4.b–III.E.4.d).
```

Penjelasan tiap langkah:

1. **Langkah 1** memakai laporan *Top videos*. Tiga kewajiban khususnya: `dimensions=video`, parameter `sort` harus ada, dan `maxResults` maksimum 200. Metrik pendapatan tidak disertakan di sini karena akan menaikkan kebutuhan scope ke `yt-analytics-monetary.readonly`.
2. **Langkah 2** dipisah menjadi request sendiri karena `viewerPercentage` tidak bisa digabung dengan `views` dalam satu laporan — laporan demografi punya daftar metrik tersendiri. Menggabungkan keduanya menghasilkan error `badRequest`.
3. **Langkah 3** memakai API yang berbeda (YouTube Data API v3). Analytics API tidak pernah mengembalikan judul, deskripsi, atau thumbnail.
4. Baris untuk 1–2 hari terakhir bisa belum muncul. Bila dashboard menampilkan "28 hari terakhir", hitung `endDate` dari data yang benar-benar diterima, bukan dari tanggal hari ini.
5. Bila `rows` tidak ada dalam respons, artinya tidak ada data yang memenuhi ambang batas — tampilkan status kosong, bukan angka nol yang menyesatkan. Lihat [guides/error-handling.md](guides/error-handling.md).

Kode siap pakai untuk alur di atas: [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md).
