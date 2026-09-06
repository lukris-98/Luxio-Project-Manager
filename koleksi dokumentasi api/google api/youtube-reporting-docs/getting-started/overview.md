# Overview — YouTube Reporting API v1

YouTube Reporting API memungkinkan aplikasi **menjadwalkan reporting job** lalu **mengunduh bulk report** berisi data YouTube Analytics untuk satu channel atau content owner. Setiap laporan adalah file `.csv` berversi yang memuat data satu periode 24 jam.

- Base URL: `https://youtubereporting.googleapis.com/v1`
- Deskripsi resmi API: *"Schedules reporting jobs containing your YouTube Analytics data and downloads the resulting bulk data reports in the form of CSV files."*
- Dirancang untuk aplikasi bervolume tinggi yang butuh dataset besar dan ekspor skala besar.

---

## 1. Model Kerja Asinkron

Reporting API tidak punya endpoint yang mengembalikan angka metrik. Alurnya selalu tiga fase:

```
FASE 1 — DEKLARASI            FASE 2 — PRODUKSI (oleh YouTube)      FASE 3 — KONSUMSI
jobs.create                   YouTube membuat 1 CSV per hari        jobs.reports.list
(sekali per tipe laporan)      secara otomatis, tanpa request        + GET downloadUrl
                               dari Anda                             (rutin, oleh scheduler)
```

Konsekuensi desain yang harus diterima:

| Konsekuensi | Penjelasan |
|---|---|
| YouTube tidak membuat laporan sebelum ada job | Laporan hanya dibuat untuk channel/content owner yang benar-benar ingin mengambilnya |
| Ada jeda antara aksi dan data | Job dibuat hari ini, file pertama muncul beberapa hari kemudian |
| Aplikasi wajib punya storage | API hanya menyimpan laporan 60 hari (30 hari untuk data historis) |
| Aplikasi wajib punya scheduler | Tidak ada webhook/push; Anda harus polling `jobs.reports.list` |
| Tidak cocok dipanggil dari browser | File besar, butuh token server-side, butuh eksekusi terjadwal |

> Prinsip: Reporting API adalah pipeline ETL, bukan API pembacaan real-time. Kalau UI Anda butuh angka saat itu juga, pakai YouTube Analytics API ([../README.md](../README.md) berisi tabel perbandingannya).

---

## 2. Empat Resource

| Resource | Peran | Operasi | Detail |
|---|---|---|---|
| `reportType` | Katalog tipe laporan yang boleh diambil akun ini | `list` | [../resources/report-type.md](../resources/report-type.md) |
| `job` | Jadwal: "buatkan laporan tipe X setiap hari" | `create`, `list`, `get`, `delete` | [../resources/job.md](../resources/job.md) |
| `report` | Metadata satu file CSV (1 periode 24 jam) | `list`, `get` | [../resources/report.md](../resources/report.md) |
| `media` | Isi file CSV | `download` | [../resources/media.md](../resources/media.md) |

Tidak ada operasi `update` pada `job`. Perubahan tipe laporan = hapus job lama, buat job baru.

---

## 3. Dimensi vs Metrik

Setiap laporan berisi dua jenis kolom:

| Jenis | Definisi | Contoh nama kolom |
|---|---|---|
| **Dimensi** | Kriteria umum untuk mengagregasi data. Kombinasi nilai dimensi pada satu baris berfungsi sebagai primary key baris tersebut | `date`, `channel_id`, `video_id`, `country_code`, `device_type` |
| **Metrik** | Pengukuran individual aktivitas pengguna, performa iklan, atau estimasi pendapatan | `views`, `likes`, `dislikes`, `watch_time_minutes`, `subscribers_gained` |

Nama kolom Reporting API memakai **huruf kecil dengan underscore** (`ad_type`), berbeda dengan Analytics API yang memakai camelCase (`adType`). Beberapa nama berbeda lebih dari sekadar konversi gaya: dimensi `video` di Analytics API bernama `video_id` di Reporting API.

Daftar lengkap kolom yang terverifikasi: [../guides/report-dimensions-metrics.md](../guides/report-dimensions-metrics.md).

---

## 4. Dua Kategori Laporan

### 4.1 Laporan dari job buatan sendiri

| Ciri | Nilai |
|---|---|
| Siapa yang membuat job | Aplikasi Anda, lewat `jobs.create` |
| `reportType.systemManaged` | `false` |
| `job.systemManaged` | `false` |
| Periode per file | 1 hari (24 jam) |
| Tersedia untuk | Channel owner **dan** content owner |
| Bisa dihapus | Ya, lewat `jobs.delete` |
| Contoh `reportTypeId` | `channel_basic_a3`, `channel_traffic_source_a3`, `content_owner_basic_a4` |

### 4.2 Laporan yang dikelola sistem (system-managed)

| Ciri | Nilai |
|---|---|
| Siapa yang membuat job | YouTube, otomatis |
| `reportType.systemManaged` | `true` — **tidak bisa** dipakai di `jobs.create` |
| `job.systemManaged` | `true` — tidak bisa diubah atau dihapus content owner |
| Periode per file | Semua laporan system-managed yang tersedia saat ini adalah laporan **bulanan** |
| Tersedia untuk | **Hanya content owner** yang punya akses ke laporan padanannya di menu Reports YouTube Creator Studio |
| Isi khas | Pendapatan **aktual** (ads, subscription, Shorts, pajak), metadata video/asset, klaim, referensi, Primetime |
| Retensi laporan finansial | Dihapus setelah dua bulan sesuai kebijakan retensi data |
| Cara menemukan job-nya | `jobs.list?includeSystemManaged=true` (bukan `jobs.create`) |

Perbedaan operasional terpenting: untuk laporan system-managed Anda **melewati langkah `jobs.create`**. Alurnya menjadi `jobs.list?includeSystemManaged=true` → `jobs.reports.list` → unduh.

> Catatan: API menyediakan kumpulan laporan yang **berbeda** dari Creator Studio meskipun datanya mirip. Nama dan susunan field bisa berbeda, dan tidak semua laporan Creator Studio tersedia lewat API.

Detail: [../guides/system-managed-reports.md](../guides/system-managed-reports.md).

---

## 5. Syarat Akses

| Syarat | Keterangan |
|---|---|
| Project Google Cloud dengan YouTube Reporting API aktif | [enable-api.md](enable-api.md) |
| OAuth 2.0 dari akun yang **memiliki** data yang diminta | Semua request harus diotorisasi oleh channel atau content owner pemilik data |
| Scope `yt-analytics.readonly` | Untuk metrik aktivitas pengguna |
| Scope `yt-analytics-monetary.readonly` | Wajib untuk laporan estimasi pendapatan dan performa iklan |
| Akun content owner (CMS) | Wajib untuk semua laporan `content_owner_*`, laporan asset, dan seluruh laporan system-managed |
| Akses ke laporan padanan di Creator Studio | Prasyarat agar YouTube membuatkan laporan system-managed |
| Bukan service account | Service account tidak bisa ditautkan ke akun YouTube; otorisasi akan gagal |

---

## 6. Karakteristik Laporan

| Karakteristik | Nilai |
|---|---|
| Format | `.csv` berversi (comma-separated values) |
| Periode | 1 periode 24 jam, 12:00 AM–11:59 PM Pacific Standard Time (UTC-8) |
| Nilai kolom `date` | Selalu sama dalam satu file |
| Frekuensi pembaruan | Harian |
| Hari tanpa data | File tetap dibuat, hanya berisi header row |
| Retensi | 60 hari sejak dibuat; 30 hari untuk laporan berisi data historis |
| Filter | Tidak ada — dataset lengkap |
| Sorting | Tidak ada — data tidak terurut |
| Baris tanpa metrik | Dihilangkan. Contoh: video tanpa view di Albania pada hari itu tidak memunculkan baris Albania |
| Baris ringkasan/total | Tidak ada. Total dihitung sendiri sebagai jumlah baris, tapi jumlah itu bisa tidak mencakup video terhapus |
| Resource terhapus | Laporan tidak memuat referensi ke resource YouTube yang dihapus ≥30 hari sebelum laporan dibuat |
| Enumerasi | Laporan memuat **integer** yang harus dipetakan ke nilai teks |

---

## 7. Latensi Data

| Peristiwa | Waktu |
|---|---|
| Job dibuat | T |
| Referensi REST: laporan tersedia | dalam 24 jam sejak job dibuat |
| Panduan bulk report: mulai bisa mengambil laporan | dalam 48 jam sejak job dibuat |
| Contoh resmi Google | Job dijadwalkan 1 September → laporan 1 September siap 3 September; laporan 2 September siap 4 September |
| Data historis 30 hari ke belakang | Diposting begitu tersedia; biasanya lengkap dalam beberapa hari |
| Data direvisi (backfill) | Muncul sebagai laporan **baru** dengan `id` baru, `startTime`/`endTime` sama seperti laporan sebelumnya |

> Catatan: dokumentasi resmi menyebut dua angka berbeda (24 jam pada referensi REST, 48 jam pada panduan bulk report). Rancang pipeline dengan asumsi **48 jam** agar tidak menganggap job gagal padahal masih dalam jendela normal.

Detail penjadwalan dan backfill: [../guides/scheduling-and-backfill.md](../guides/scheduling-and-backfill.md).

---

## 8. Anonimisasi Data

Sebagian nilai dimensi hanya dikembalikan bila metrik pada baris yang sama memenuhi ambang tertentu. Nilai yang tidak memenuhi ambang diagregasi ke satu baris dengan dimensi teranonimkan.

| Metrik | Dimensi pengagregasi | Dimensi yang dianonimkan | Nilai anonim |
|---|---|---|---|
| `subscribersGained` | `channel` | `country` | `ZZ` |
| `subscribersGained` | `channel` | `province` | `US-ZZ` |
| `subscribersLost` | `channel` | `country` | `ZZ` |
| `subscribersLost` | `channel` | `province` | `US-ZZ` |
| `comments` | `video` | `country` | `ZZ` |
| `comments` | `video` | `province` | `US-ZZ` |
| `likes` | `video` | `country` | `ZZ` |
| `likes` | `video` | `province` | `US-ZZ` |
| `dislikes` | `video` | `country` | `ZZ` |
| `dislikes` | `video` | `province` | `US-ZZ` |
| `views` | `video` | `ageGroup` | `NULL` |
| `views` | `video` | `gender` | `NULL` |
| `views` | `video` dan `trafficSourceDetail` | `trafficSourceDetail` | `NULL` |
| Jumlah subscriber channel | `channel` | `subscribedStatus` | `NULL` |

Nama dimensi/metrik pada tabel di atas ditulis sesuai dokumentasi sumber (bentuk camelCase). Di file CSV, nama kolomnya mengikuti konvensi `snake_case`, mis. `country_code`, `province_code`, `age_group`, `traffic_source_detail`.

Ambang aktual tidak dipublikasikan dan dapat berubah. Implikasi praktis: **jangan** menganggap baris `NULL`/`ZZ` sebagai data rusak — itu agregat sah yang harus tetap diimpor agar total tetap benar.

---

## 9. Batasan yang Perlu Diketahui Sejak Awal

| Batasan | Dampak |
|---|---|
| Tidak ada filter/sort server-side | Aplikasi wajib punya database untuk query |
| Tidak ada agregasi mingguan/bulanan pada laporan harian | Rollup dihitung sendiri |
| Tidak ada nama video/channel di laporan | Ambil metadata dari YouTube Data API; wajib refresh atau hapus setelah 30 hari (YouTube API Services Developer Policies III.E.4.b–III.E.4.d) |
| Retensi 60 hari | Kehilangan data permanen kalau pipeline mati lebih lama |
| Job bisa kedaluwarsa | `job.expireTime` terisi bila tipe laporan di-deprecate atau laporan tidak diunduh dalam waktu lama |
| Tidak ada push notification | Polling adalah satu-satunya cara |
| Service account & device flow tidak didukung | Butuh consent user sungguhan sekali, lalu simpan refresh token |

Langkah berikutnya: [enable-api.md](enable-api.md) → [authentication.md](authentication.md) → [quickstart.md](quickstart.md).
