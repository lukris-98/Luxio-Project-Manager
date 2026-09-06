# YouTube Reporting API v1 Documentation

Dokumentasi lengkap **YouTube Reporting API v1** (Google) untuk menjadwalkan *reporting job* dan mengunduh **bulk report** YouTube Analytics dalam bentuk file CSV — mengikuti gaya dokumentasi `gmail-docs`, `blogger-docs`, dan `neon-docs` di repo ini.

- Penyedia: Google (resmi, bukan pihak ketiga)
- Base URL: `https://youtubereporting.googleapis.com/v1`
- Dokumentasi resmi: https://developers.google.com/youtube/reporting
- Referensi REST: https://developers.google.com/youtube/reporting/v1/reference/rest
- Panduan bulk report: https://developers.google.com/youtube/reporting/v1/reports
- Daftar laporan tersedia: https://developers.google.com/youtube/reporting/v1/reports/full_report_list
- Discovery document: `https://youtubereporting.googleapis.com/$discovery/rest?version=v1`

> Prinsip: Reporting API adalah API **asinkron**. Anda tidak meminta angka, Anda meminta YouTube membuatkan file CSV harian, lalu mengunduhnya. Tidak ada endpoint yang mengembalikan metrik secara langsung.

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | **Kemampuan setup + penjelasan kode kredensial baris per baris** |
| [getting-started/overview.md](getting-started/overview.md) | Model kerja asinkron, resource, retensi, latensi data |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Mengaktifkan YouTube Reporting API di Google Cloud Console |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, scopes, refresh token, `onBehalfOfContentOwner` |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Dari `reportTypes.list` sampai CSV pertama terunduh |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Model kuota Reporting API, `quotaUser`, batas praktis |
| [getting-started/errors.md](getting-started/errors.md) | Struktur error, status kanonik, dan penanganannya |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | **Field mana untuk apa + aliran data antar resource** |
| [resources/report-type.md](resources/report-type.md) | Resource `reportType` — `id`, `name`, `deprecateTime`, `systemManaged` |
| [resources/job.md](resources/job.md) | Resource `job` — `id`, `reportTypeId`, `name`, `createTime`, `expireTime`, `systemManaged` |
| [resources/report.md](resources/report.md) | Resource `report` — `id`, `jobId`, `startTime`, `endTime`, `createTime`, `jobExpireTime`, `downloadUrl` |
| [resources/media.md](resources/media.md) | Mekanisme unduh media, header `Authorization`, gzip, file besar |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | **Anatomi request + penjelasan kode per operasi** |
| [reference-api/report-types.md](reference-api/report-types.md) | `reportTypes.list` + `includeSystemManaged`, `pageSize`, `pageToken`, `onBehalfOfContentOwner` |
| [reference-api/jobs.md](reference-api/jobs.md) | `jobs.create`, `jobs.list`, `jobs.get`, `jobs.delete` |
| [reference-api/reports.md](reference-api/reports.md) | `jobs.reports.list` (`createdAfter`, `startTimeAtOrAfter`, `startTimeBefore`), `jobs.reports.get` |
| [reference-api/media-download.md](reference-api/media-download.md) | `media.download` — `GET /v1/media/{+resourceName}?alt=media` |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | **Walkthrough kode setiap guide** |
| [guides/bulk-reports-flow.md](guides/bulk-reports-flow.md) | Alur produksi lengkap + idempotensi + penanda laporan terproses |
| [guides/report-types-catalog.md](guides/report-types-catalog.md) | Katalog `reportTypeId` channel, content owner, dan system-managed |
| [guides/report-dimensions-metrics.md](guides/report-dimensions-metrics.md) | Kolom CSV, dimensi vs metrik, konvensi nama kolom |
| [guides/scheduling-and-backfill.md](guides/scheduling-and-backfill.md) | Kapan job mulai berbuah, data historis, laporan revisi |
| [guides/download-and-parse.md](guides/download-and-parse.md) | Unduh streaming, gzip, parse CSV ke database |
| [guides/system-managed-reports.md](guides/system-managed-reports.md) | Laporan yang dikelola sistem (khusus content owner) |
| [guides/error-handling.md](guides/error-handling.md) | Retry, exponential backoff, laporan hilang/kedaluwarsa |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | **Fungsi demi fungsi: kode mana melakukan apa** |
| [examples/curl.md](examples/curl.md) | Contoh curl semua endpoint |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js (`googleapis`) + unduh & parse CSV |
| [examples/python.md](examples/python.md) | Integrasi Python (`google-api-python-client`) + `csv`/`pandas` |

---

## Ringkasan Endpoint Utama

Semua path relatif terhadap `https://youtubereporting.googleapis.com`.

| Method | Path | Operasi | Scope yang diterima |
|---|---|---|---|
| GET | `/v1/reportTypes` | `reportTypes.list` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| POST | `/v1/jobs` | `jobs.create` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| GET | `/v1/jobs` | `jobs.list` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| GET | `/v1/jobs/{jobId}` | `jobs.get` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| DELETE | `/v1/jobs/{jobId}` | `jobs.delete` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| GET | `/v1/jobs/{jobId}/reports` | `jobs.reports.list` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| GET | `/v1/jobs/{jobId}/reports/{reportId}` | `jobs.reports.get` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| GET | `/v1/media/{+resourceName}?alt=media` | `media.download` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |

Catatan penting soal scope: discovery document mencantumkan **kedua** scope pada setiap method, jadi tidak ada endpoint yang secara teknis "hanya" bisa dipanggil dengan scope monetary. Yang membedakan adalah **isi laporan**: laporan yang memuat metrik pendapatan/performa iklan memerlukan `yt-analytics-monetary.readonly`.

`jobs.delete` mengembalikan body kosong (`{}`). Semua method `list` mengembalikan `nextPageToken` untuk paginasi.

---

## Scopes OAuth

| Scope | Akses |
|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | Melihat laporan YouTube Analytics untuk konten Anda. Memberi akses ke metrik aktivitas pengguna seperti jumlah view dan rating. |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | Melihat laporan monetary dan non-monetary. Memberi akses ke metrik aktivitas pengguna **plus** estimasi pendapatan dan metrik performa iklan. |

> Prinsip: minta scope **sekecil mungkin**. Kalau aplikasi tidak pernah memproses laporan pendapatan, cukup `yt-analytics.readonly` — scope monetary memicu screening OAuth yang lebih ketat.

Hal yang tidak didukung (verifikasi dari [panduan otorisasi resmi](https://developers.google.com/youtube/reporting/guides/authorization)):

| Alur OAuth | Didukung Reporting API |
|---|---|
| Server-side web app | Ya |
| JavaScript / client-side web app | Ya |
| Installed app (mobile & desktop) | Ya |
| Device flow (TV, input terbatas) | **Tidak** |
| Service account | **Tidak** — tidak ada cara menautkan service account ke akun YouTube; percobaan otorisasi menghasilkan error |

Detail: [getting-started/authentication.md](getting-started/authentication.md).

---

## Reporting API vs Analytics API — Kapan Pakai Yang Mana

| Aspek | YouTube Reporting API (dokumen ini) | YouTube Analytics API ([../youtube-analytics-docs/README.md](../youtube-analytics-docs/README.md)) |
|---|---|---|
| Model | Bulk export asinkron: jadwalkan job, YouTube membuat CSV harian, aplikasi mengunduh | Targeted query real-time: satu request → satu tabel hasil |
| Cara ambil data | `jobs.create` → tunggu → `jobs.reports.list` → unduh `downloadUrl` | `GET reports` dengan `dimensions`, `metrics`, `startDate`, `endDate` |
| Rentang tanggal | Semua laporan per-hari; agregasi periodik dikerjakan aplikasi | Request menentukan rentang; tersedia agregasi mingguan/bulanan |
| Filter | Tidak ada. Dataset lengkap diunduh, aplikasi memfilter sendiri | Ada parameter `filters`, termasuk dimensi filter-only |
| Sorting | Tidak ada. Aplikasi mengurutkan sendiri | Ada parameter `sort` |
| Enumerasi | Laporan memuat **integer** yang harus dipetakan ke teks | Response memuat teks, mis. `"ANDROID"`, `"CHANNEL"` |
| Konvensi nama kolom | `snake_case` — `ad_type`, `video_id`, `watch_time_minutes` | `camelCase` — `adType`, `video`, `estimatedMinutesWatched` |
| Kuota | Bukan isu: data diambil sekali lalu diolah lokal | Server menghitung biaya kuota per query |
| Laporan eksklusif | Aktivitas terkait subtitle, audience retention playlist, estimated revenue content owner (2 laporan), asset report content owner (11 laporan), **system-managed report** (pendapatan aktual) | Total agregat yang menyertakan resource terhapus, `uniques`, `relativeRetentionPerformance` |
| Latensi & operasional | Laporan pertama siap dalam 24–48 jam sejak job dibuat; perlu scheduler + storage | Data langsung tersedia saat request |
| Cocok untuk | Data warehouse, dashboard historis, rekonsiliasi pendapatan, volume tinggi | Widget UI, query ad-hoc, drill-down interaktif |

Aturan keputusan singkat:

| Kebutuhan | Pakai |
|---|---|
| Menampilkan grafik 28 hari terakhir di UI, on-demand | Analytics API |
| Menyimpan seluruh riwayat metrik per video per hari ke database | Reporting API |
| Rekonsiliasi pendapatan aktual per aset/klaim (content owner) | Reporting API (system-managed) |
| Filter/sort/limit dikerjakan oleh server Google | Analytics API |
| Ratusan ribu baris per hari, biaya kuota harus nol | Reporting API |
| Butuh total yang menyertakan video terhapus | Analytics API |

> Catatan: kedua API memakai scope `yt-analytics.readonly` dan `yt-analytics-monetary.readonly` yang sama, jadi satu kredensial OAuth bisa melayani keduanya.

---

## Placeholder yang Dipakai di Seluruh Dokumen

| Placeholder | Arti |
|---|---|
| `ACCESS_TOKEN` | OAuth 2.0 access token (`Authorization: Bearer ACCESS_TOKEN`) |
| `JOB_ID` | Nilai `job.id` dari `jobs.create` / `jobs.list` (maks. 40 karakter) |
| `REPORT_ID` | Nilai `report.id` dari `jobs.reports.list` |
| `REPORT_TYPE_ID` | Nilai `reportType.id`, mis. `channel_basic_a3` |
| `CONTENT_OWNER_ID` | External ID content owner untuk parameter `onBehalfOfContentOwner` |
| `DOWNLOAD_URL` | Nilai `report.downloadUrl` — URL opaque, jangan diparse atau disusun manual |
