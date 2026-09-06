# YouTube Analytics API v2 Documentation

Dokumentasi lengkap **YouTube Analytics API v2** (Google) untuk mengambil laporan analitik YouTube secara programatis melalui *targeted query* real-time — mengikuti gaya dokumentasi `gmail-docs`, `blogger-docs`, dan `neon-docs` di repo ini.

- Penyedia: Google (resmi, bukan pihak ketiga)
- Base URL: `https://youtubeanalytics.googleapis.com/v2`
- Dokumentasi resmi: https://developers.google.com/youtube/analytics
- Model data (dimensi × metrik): https://developers.google.com/youtube/analytics/data_model
- Referensi `reports.query`: https://developers.google.com/youtube/analytics/reference/reports/query
- Daftar dimensi: https://developers.google.com/youtube/analytics/dimensions
- Daftar metrik: https://developers.google.com/youtube/analytics/metrics
- Laporan channel: https://developers.google.com/youtube/analytics/channel_reports
- Laporan pemilik konten: https://developers.google.com/youtube/analytics/content_owner_reports

> Prinsip: API ini **tidak** menerima API key. Semua request wajib memakai OAuth 2.0 milik channel/pemilik konten yang datanya diminta.

---

## Analytics API vs Reporting API

Google menyediakan dua API berbeda untuk data analitik YouTube. Keduanya bukan pengganti satu sama lain.

| Aspek | YouTube Analytics API v2 | YouTube Reporting API v1 |
|---|---|---|
| Model kerja | **Targeted query** real-time: satu request = satu laporan kustom | **Bulk report** terjadwal: buat *reporting job*, YouTube menghasilkan laporan harian, aplikasi mengunduh asinkron |
| Base URL | `https://youtubeanalytics.googleapis.com/v2` | `https://youtubereporting.googleapis.com/v1` |
| Rentang tanggal | Ditentukan per request (`startDate`/`endDate`); mendukung agregasi bulanan lewat dimensi `month` | Setiap laporan berisi data satu periode 24 jam; agregasi dilakukan aplikasi |
| Filter & sorting | Disediakan API (`filters`, `sort`) | Tidak ada; aplikasi memfilter/mengurutkan sendiri setelah unduh |
| Nilai enumerasi | Teks (`ANDROID`, `CHANNEL`) | Integer yang harus dipetakan ke teks |
| Penamaan field | camelCase (`adType`, `estimatedMinutesWatched`) | snake_case (`ad_type`, `watch_time_minutes`) |
| Batas baris | Beberapa laporan dibatasi (mis. top videos maksimum 200 baris) | Dataset lengkap |
| Cocok untuk | Dashboard, grafik interaktif, kueri ad-hoc | Data warehouse, ekspor skala besar, laporan pendapatan aktual (*system-managed*) |
| Eksklusif | Dimensi `group`, `continent`, `subContinent`, `month`; metrik `viewsPerPlaylistStart`, `averageTimeInPlaylist`, `relativeRetentionPerformance` | Laporan aset pemilik konten, audience retention playlist, data subtitle, laporan *estimated revenue*, laporan *system-managed* |

Dokumentasi Reporting API di repo ini: [../youtube-reporting-docs/README.md](../youtube-reporting-docs/README.md).

> Catatan: untuk kebutuhan dashboard Luxio (grafik views/watch time/demografi yang dipilih user), **Analytics API** adalah pilihan yang benar. Reporting API baru relevan bila perlu ekspor massal harian.

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | **Alur setup dari nol sampai request pertama berhasil** |
| [getting-started/overview.md](getting-started/overview.md) | Model laporan: dimensi × metrik × filter × rentang tanggal |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Mengaktifkan API di Google Cloud Console + kredensial OAuth |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, scope mana untuk apa, verifikasi OAuth |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Request `reports.query` pertama (curl, JS, Python) |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Kuota, batas baris, batas rentang tanggal, latensi data |
| [getting-started/errors.md](getting-started/errors.md) | Struktur error dan reason yang umum |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | **Field mana untuk apa + aliran data antar resource** |
| [resources/report.md](resources/report.md) | `youtubeAnalytics#resultTable` — `kind`, `columnHeaders[]`, `rows[][]` |
| [resources/group.md](resources/group.md) | Resource `group` — segmen kustom hingga 500 item |
| [resources/group-item.md](resources/group-item.md) | Resource `groupItem` — anggota grup |
| [resources/dimension.md](resources/dimension.md) | Semua grup dimensi beserta nilai enumerasinya |
| [resources/metric.md](resources/metric.md) | Semua grup metrik beserta satuannya |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | **Anatomi request + penjelasan parameter per operasi** |
| [reference-api/reports-query.md](reference-api/reports-query.md) | `reports.query` — seluruh parameter, aturan kombinasi, contoh |
| [reference-api/groups.md](reference-api/groups.md) | `groups.list`, `insert`, `update`, `delete` |
| [reference-api/group-items.md](reference-api/group-items.md) | `groupItems.list`, `insert`, `delete` |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | **Peta guide: masalah apa dijawab file mana** |
| [guides/channel-reports.md](guides/channel-reports.md) | Semua tipe laporan channel + kombinasi dimensi/metrik legal |
| [guides/content-owner-reports.md](guides/content-owner-reports.md) | Laporan pemilik konten + kewajiban filter entitas |
| [guides/dimensions-and-metrics.md](guides/dimensions-and-metrics.md) | Aturan kombinasi; dimensi yang tidak bisa digabung |
| [guides/filters-and-sorting.md](guides/filters-and-sorting.md) | Sintaks `filters`, multi-nilai, `sort`, paginasi |
| [guides/time-based-reports.md](guides/time-based-reports.md) | `day`, `month`, agregasi, zona waktu Pacific Time |
| [guides/revenue-reports.md](guides/revenue-reports.md) | Scope monetary, syarat YouTube Partner, `currency` |
| [guides/groups-and-custom-segments.md](guides/groups-and-custom-segments.md) | Grup kustom sebagai segmen laporan |
| [guides/quota-and-limits.md](guides/quota-and-limits.md) | Kuota, batas hasil, batas kombinasi |
| [guides/error-handling.md](guides/error-handling.md) | Retry, exponential backoff, data belum tersedia |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | **Fungsi demi fungsi: kode mana melakukan apa** |
| [examples/curl.md](examples/curl.md) | Contoh curl untuk semua endpoint |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js (`googleapis`) |
| [examples/python.md](examples/python.md) | Integrasi Python (`google-api-python-client`) |

---

## Ringkasan Endpoint

Semua path relatif terhadap `https://youtubeanalytics.googleapis.com/v2`.

| Method | Path | Operasi | Parameter wajib | Scope minimum |
|---|---|---|---|---|
| GET | `/reports` | `reports.query` | `ids`, `startDate`, `endDate`, `metrics` | `yt-analytics.readonly` + `youtube.readonly` |
| GET | `/reports` (metrik pendapatan) | `reports.query` | idem | `yt-analytics-monetary.readonly` + `youtube.readonly` |
| GET | `/groups` | `groups.list` | `id` **atau** `mine=true` | `yt-analytics.readonly` |
| POST | `/groups` | `groups.insert` | body: `snippet.title`, `contentDetails.itemType` | `youtube` (channel) / `youtubepartner` (pemilik konten) |
| PUT | `/groups` | `groups.update` | body: `id`, `snippet.title` | `youtube` / `youtubepartner` |
| DELETE | `/groups` | `groups.delete` | `id` | `youtube` / `youtubepartner` |
| GET | `/groupItems` | `groupItems.list` | `groupId` | `youtube` **atau** (`youtube.readonly` + `yt-analytics.readonly`) |
| POST | `/groupItems` | `groupItems.insert` | body: `groupId`, `resource.id` | `youtube` / `youtubepartner` |
| DELETE | `/groupItems` | `groupItems.delete` | `id` | `youtube` / `youtubepartner` |

Parameter `onBehalfOfContentOwner` tersedia (opsional) pada semua operasi `groups` dan `groupItems`, khusus mitra YouTube yang mengelola banyak channel.

> Catatan: v2 hanya mengembalikan **JSON**. Parameter `alt=csv`, `quotaUser`, dan `userIp` yang ada di v1 tidak didukung lagi.

---

## Scopes OAuth

| Scope | Akses | Dipakai untuk |
|---|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | Baca laporan YouTube Analytics non-moneter | Views, watch time, engagement, demografi, geografi, traffic source, perangkat |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | Baca laporan Analytics **plus** estimasi pendapatan & performa iklan | `estimatedRevenue`, `estimatedAdRevenue`, `grossRevenue`, `cpm`, `adImpressions`, dst. |
| `https://www.googleapis.com/auth/youtube.readonly` | Lihat akun YouTube | **Wajib** untuk `reports.query`; juga dipakai `groupItems.list` bersama `yt-analytics.readonly` |
| `https://www.googleapis.com/auth/youtube` | Kelola akun YouTube | Pemilik channel mengelola grup & item grup (`groups.*`, `groupItems.*` tulis) |
| `https://www.googleapis.com/auth/youtubepartner` | Lihat & kelola aset serta konten terkait di YouTube | Pemilik konten mengelola grup & item grup |

Aturan kombinasi yang tercatat resmi:

| Operasi | Kombinasi scope yang diterima |
|---|---|
| `reports.query` | Butuh akses `youtube.readonly`, ditambah `yt-analytics.readonly` (atau `yt-analytics-monetary.readonly` bila meminta metrik pendapatan) |
| `groupItems.list` | `youtube` **atau** (`youtube.readonly` **dan** `yt-analytics.readonly`) |

> Prinsip: minta scope **sekecil mungkin**. Untuk dashboard yang hanya membaca, `yt-analytics.readonly` + `youtube.readonly` sudah cukup dan tidak memerlukan izin tulis apa pun. Detail: [getting-started/authentication.md](getting-started/authentication.md).

---

## Mulai dari mana

1. Baca [kemampuan-dan-alur.md](kemampuan-dan-alur.md) untuk peta kemampuan lengkap.
2. Aktifkan API dan buat kredensial: [getting-started/enable-api.md](getting-started/enable-api.md).
3. Jalankan request pertama: [getting-started/quickstart.md](getting-started/quickstart.md).
4. Pilih laporan yang tepat: [guides/channel-reports.md](guides/channel-reports.md).
