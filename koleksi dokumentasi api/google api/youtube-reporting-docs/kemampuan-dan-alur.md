# Kemampuan & Alur — Peta Lengkap YouTube Reporting API

File ini merangkum **semua hal yang bisa dilakukan** dengan YouTube Reporting API v1 beserta **alurnya**, dan menjelaskan bagian kode mana yang melakukan apa.

- Base URL: `https://youtubereporting.googleapis.com/v1`
- Wajib **OAuth 2.0**. API key saja tidak cukup, dan **service account tidak didukung**.
- API ini tidak mengembalikan metrik dalam response JSON. Yang dikembalikan adalah **metadata laporan**; datanya ada di file `.csv` yang diunduh terpisah.

---

## 1. Daftar Lengkap Kemampuan

### A. Menemukan Laporan yang Bisa Dibuat

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar tipe laporan yang tersedia untuk channel/content owner | `GET /v1/reportTypes` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| Ikut sertakan tipe laporan yang dikelola sistem | `GET /v1/reportTypes?includeSystemManaged=true` | sama |
| Bertindak atas nama content owner | tambahkan `?onBehalfOfContentOwner=CONTENT_OWNER_ID` | sama |

```bash
# ① reportTypes.list — sumber kebenaran untuk reportTypeId yang valid bagi akun ini.
#    Jangan hardcode reportTypeId tanpa memverifikasi lewat endpoint ini.
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "reportTypes": [ { "id": "channel_basic_a3", "name": "User activity" }, ... ],
#     "nextPageToken": "..." }
```

### B. Menjadwalkan & Mengelola Job

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat reporting job (mulai memproduksi laporan harian) | `POST /v1/jobs` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| Daftar job yang sudah dijadwalkan | `GET /v1/jobs` | sama |
| Daftar job termasuk yang dikelola sistem | `GET /v1/jobs?includeSystemManaged=true` | sama |
| Detail satu job | `GET /v1/jobs/JOB_ID` | sama |
| Hentikan produksi laporan (hapus job) | `DELETE /v1/jobs/JOB_ID` | sama |

```bash
# ② jobs.create — hanya butuh 2 field: reportTypeId (dari langkah ①) dan name (label bebas Anda).
#    YouTube TIDAK menghasilkan laporan apa pun sebelum job dibuat.
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "reportTypeId": "channel_basic_a3",
        "name": "luxio-channel-basic-harian"
      }'
# → { "id": "JOB_ID", "reportTypeId": "channel_basic_a3",
#     "name": "luxio-channel-basic-harian", "createTime": "2026-09-06T02:17:18.000000Z" }
# SIMPAN id ini di database. Kalau hilang, ambil ulang lewat jobs.list.
```

### C. Menemukan Instance Laporan (CSV) yang Sudah Jadi

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar semua laporan sebuah job | `GET /v1/jobs/JOB_ID/reports` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| Hanya laporan yang dibuat setelah waktu tertentu | `?createdAfter=RFC3339` | sama |
| Hanya laporan yang datanya mulai pada/setelah tanggal tertentu | `?startTimeAtOrAfter=RFC3339` | sama |
| Hanya laporan yang datanya mulai sebelum tanggal tertentu | `?startTimeBefore=RFC3339` | sama |
| Metadata satu laporan | `GET /v1/jobs/JOB_ID/reports/REPORT_ID` | sama |

```bash
# ③ jobs.reports.list — createdAfter adalah kunci idempotensi.
#    Isi dengan createTime tertinggi dari laporan yang SUDAH berhasil Anda proses.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-01T00%3A00%3A00Z" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "reports": [ {
#       "id": "REPORT_ID",
#       "jobId": "JOB_ID",
#       "startTime": "2026-09-01T07:00:00Z",   # inklusif  — awal hari data (Pasifik)
#       "endTime":   "2026-09-02T07:00:00Z",   # eksklusif — akhir hari data
#       "createTime":"2026-09-03T09:12:44.000000Z",
#       "downloadUrl": "DOWNLOAD_URL"
#     } ], "nextPageToken": "..." }
```

### D. Mengunduh File CSV

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Unduh laporan | `GET` ke `report.downloadUrl` | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |
| Unduh via method eksplisit | `GET /v1/media/{+resourceName}?alt=media` (`media.download`) | sama |
| Hemat bandwidth | tambahkan header `Accept-Encoding: gzip` | sama |

```bash
# ④ media.download — downloadUrl WAJIB dipanggil dengan header Authorization.
#    URL ini bukan link publik; tanpa token hasilnya 401.
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" \
  --compressed \
  -o "channel_basic_a3_2026-09-01.csv"
# → file CSV: baris pertama = header kolom, baris berikutnya = data.
```

### E. Yang TIDAK Bisa Dilakukan API Ini

| Bukan kemampuan | Alternatif |
|---|---|
| Filter baris berdasarkan nilai dimensi | Unduh penuh, filter di database Anda |
| Sorting hasil | Urutkan sendiri setelah impor |
| Meminta rentang tanggal arbitrer dalam satu file | Setiap file = 1 hari; gabungkan sendiri |
| Agregasi mingguan/bulanan (laporan non-system-managed) | Hitung sendiri, atau pakai Analytics API |
| Membaca judul video / nama channel | Ambil metadata via YouTube Data API (wajib refresh/hapus setelah 30 hari sesuai Developer Policies) |
| Mengubah atau menghapus job system-managed | Tidak diizinkan — job tersebut dibuat otomatis oleh YouTube |
| Mendapatkan total agregat yang menyertakan video terhapus | Pakai Analytics API |

---

## 2. Alur Wajib (Tidak Bisa Dilewati)

```
LANGKAH 1                LANGKAH 2              LANGKAH 3 (TUNGGU)
reportTypes.list   ──►    jobs.create     ──►   YouTube menghasilkan CSV
(pilih reportTypeId)      (simpan job.id)        - laporan hari H siap H+2
                                                 - data historis 30 hari
                                                   ke belakang menyusul
                                                   dalam beberapa hari
                                                        │
        ┌───────────────────────────────────────────────┘
        ▼
LANGKAH 4                        LANGKAH 5                 LANGKAH 6
jobs.reports.list          ──►   GET downloadUrl     ──►   parse CSV
?createdAfter=<checkpoint>       + Authorization           - header row = urutan kolom
→ daftar Report + downloadUrl    + Accept-Encoding: gzip   - upsert ke database
                                                           - simpan report.id + createTime
        ▲                                                        │
        └──── simpan createTime tertinggi sebagai checkpoint ◄────┘
```

Diagram peran resource:

```
reportType ──(id)──► job ──(id)──► report ──(downloadUrl)──► file .csv
  katalog            jadwal        instance harian            data mentah
  (read-only)        (CRUD-)       (read-only)                (unduhan)
```

`job` hanya mendukung create / read / delete — tidak ada update. Untuk mengganti tipe laporan, hapus job lama dan buat job baru.

---

## 3. Aturan Waktu yang Wajib Dipahami

| Aturan | Nilai (dari dokumentasi resmi) |
|---|---|
| Satu laporan mencakup | 1 periode 24 jam, 12:00 AM–11:59 PM Pacific Standard Time (UTC-8) |
| Kolom `date` dalam satu file | selalu sama (satu hari saja) |
| Frekuensi pembaruan | harian |
| Kapan laporan pertama tersedia | Referensi REST menyebut "tersedia dalam 24 jam sejak job dibuat"; panduan bulk report menyebut "Anda bisa mulai mengambil laporan dalam 48 jam sejak job dibuat" |
| Contoh resmi | Job dijadwalkan 1 September → laporan untuk 1 September siap 3 September; laporan 2 September diposting 4 September |
| Data historis (backfill awal) | Saat job baru dibuat, YouTube juga menghasilkan laporan untuk **periode 30 hari sebelum** job dibuat. Biasanya semua data historis terposting dalam beberapa hari |
| Retensi laporan biasa | **60 hari** sejak laporan dibuat; setelah itu tidak bisa diakses |
| Retensi laporan berisi data historis | **30 hari** sejak laporan dibuat |
| Laporan finansial system-managed | dihapus setelah **dua bulan** untuk mematuhi kebijakan retensi data |
| Hari tanpa data | tetap dibuat sebagai file dengan header row saja, tanpa baris data |
| Resource terhapus | laporan tidak memuat referensi ke resource YouTube yang dihapus ≥30 hari sebelum laporan dibuat |

> Prinsip: karena retensi 60 hari (30 hari untuk historis), pipeline Anda **harus** berjalan rutin. Berhenti sebulan berarti data hilang permanen dari API.

---

## 4. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Paham model asinkron & batasan API sebelum coding | [getting-started/overview.md](getting-started/overview.md) |
| Aktifkan API & buat kredensial OAuth | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Susun alur token, refresh token, `onBehalfOfContentOwner` | [getting-started/authentication.md](getting-started/authentication.md) |
| Jalankan request pertama sampai CSV terunduh | [getting-started/quickstart.md](getting-started/quickstart.md) |
| Tahu arti setiap field JSON | [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) |
| Tahu `reportTypeId` apa saja yang ada | [guides/report-types-catalog.md](guides/report-types-catalog.md) |
| Tahu kolom CSV apa yang akan saya terima | [guides/report-dimensions-metrics.md](guides/report-dimensions-metrics.md) |
| Bangun pipeline produksi yang idempoten | [guides/bulk-reports-flow.md](guides/bulk-reports-flow.md) |
| Paham kapan job mulai berbuah & apa itu backfill | [guides/scheduling-and-backfill.md](guides/scheduling-and-backfill.md) |
| Mengunduh file besar & parse ke database | [guides/download-and-parse.md](guides/download-and-parse.md) |
| Ambil laporan pendapatan aktual (content owner) | [guides/system-managed-reports.md](guides/system-managed-reports.md) |
| Bikin pipeline tahan gagal (retry/backoff) | [guides/error-handling.md](guides/error-handling.md) |
| Lihat semua parameter endpoint | [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) |
| Kode siap pakai | [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md) |

---

## 5. Alur Contoh End-to-End: "Simpan View Harian per Video ke Database"

Tujuan: laporan `channel_basic_a3` (aktivitas pengguna per hari, per video, per negara) masuk ke tabel database, tanpa duplikasi, dan tahan dijalankan ulang.

```bash
# ══════════════════════════════════════════════════════════════════════════
# SETUP SEKALI — jalankan manual, simpan hasilnya
# ══════════════════════════════════════════════════════════════════════════

# LANGKAH 1 — cari reportTypeId yang valid untuk akun ini
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → cari objek dengan id "channel_basic_a3".
#   Kalau tidak ada, akun ini tidak berhak atas laporan itu — jangan paksa jobs.create.

# LANGKAH 2 — jadwalkan job SEKALI SAJA (job bersifat permanen sampai dihapus)
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reportTypeId": "channel_basic_a3", "name": "luxio-channel-basic-harian" }'
# → simpan { id: JOB_ID } ke tabel yt_reporting_jobs.
#   Membuat job kedua dengan reportTypeId yang sama = duplikasi kerja, bukan error yang berguna.

# ══════════════════════════════════════════════════════════════════════════
# LOOP HARIAN — dijalankan scheduler backend, bukan browser
# ══════════════════════════════════════════════════════════════════════════

# LANGKAH 3 — ambil hanya laporan yang belum pernah diproses.
#   checkpoint = MAX(create_time) dari laporan yang sudah sukses diimpor.
#   Pada eksekusi PERTAMA, hilangkan createdAfter agar seluruh backfill 30 hari terambil.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-03T09%3A12%3A44Z" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → untuk setiap item: cek report.id belum ada di tabel yt_reporting_reports.
#   Kalau ada dua laporan dengan startTime/endTime sama, ambil yang createTime-nya LEBIH BARU
#   (itu laporan revisi/backfill) dan buang data lama untuk periode tersebut.

# LANGKAH 4 — unduh CSV-nya
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o "/tmp/REPORT_ID.csv"

# LANGKAH 5 — verifikasi header, lalu impor
head -1 "/tmp/REPORT_ID.csv"
# → date,channel_id,video_id,live_or_on_demand,subscribed_status,country_code,views,...
#   JANGAN asumsikan urutan kolom. Petakan nama kolom → indeks dari baris header ini.

# LANGKAH 6 — setelah impor sukses, majukan checkpoint
#   UPDATE yt_reporting_jobs SET checkpoint = <createTime tertinggi> WHERE id = 'JOB_ID';
```

Penjelasan setiap langkah:

1. **Langkah 1** wajib dijalankan minimal sekali. `reportTypes.list` menyaring berdasarkan hak akses akun, sehingga menjadi validasi gratis sebelum `jobs.create`.
2. **Langkah 2** hanya sekali per tipe laporan. Job tidak punya method `update`; kalau salah `reportTypeId`, hapus dan buat ulang. Laporan tidak akan muncul untuk hari-hari sebelum job dibuat kecuali lewat backfill 30 hari otomatis.
3. **Langkah 3** memakai `createdAfter` sebagai kursor. Parameter ini menyaring berdasarkan **kapan laporan dibuat**, bukan tanggal datanya — inilah yang membuat laporan revisi (backfill) ikut terambil, karena laporan revisi punya `createTime` baru.
4. **Langkah 4** memerlukan header `Authorization`. `downloadUrl` bukan URL bertanda tangan publik; menyalinnya ke browser tanpa token menghasilkan 401.
5. **Langkah 5** membaca header row. Google secara eksplisit meminta aplikasi tidak mengasumsikan urutan kolom, dan bersiap menerima kolom metrik baru yang muncul sewaktu-waktu.
6. **Langkah 6** menutup siklus idempotensi: checkpoint hanya maju setelah transaksi impor sukses. Kalau impor gagal di tengah, checkpoint tidak berubah dan eksekusi berikutnya mengulang laporan yang sama tanpa kehilangan data.

Kode siap pakai untuk keenam langkah: [examples/nodejs.md](examples/nodejs.md) dan [examples/python.md](examples/python.md). Desain tabel dan penanda laporan terproses: [guides/bulk-reports-flow.md](guides/bulk-reports-flow.md).
