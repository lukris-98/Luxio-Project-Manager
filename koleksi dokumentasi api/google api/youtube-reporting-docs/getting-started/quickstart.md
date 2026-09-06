# Quickstart — Dari Nol sampai CSV Pertama

Target: satu file `.csv` berisi aktivitas harian channel tersimpan di disk. Prasyarat: API sudah aktif dan `ACCESS_TOKEN` sudah ada ([enable-api.md](enable-api.md), [authentication.md](authentication.md)).

- Base URL: `https://youtubereporting.googleapis.com/v1`
- Waktu tunggu realistis: **1–2 hari** antara langkah 2 dan langkah 3

---

## 0. Peringatan Waktu

Reporting API bukan API sinkron. Setelah `jobs.create`, tidak ada laporan yang bisa diunduh saat itu juga.

| Langkah | Bisa dijalankan | Hasil |
|---|---|---|
| 1. `reportTypes.list` | Langsung | Daftar `reportTypeId` |
| 2. `jobs.create` | Langsung | `JOB_ID` |
| 3. `jobs.reports.list` | Setelah 24–48 jam | Daftar laporan + `downloadUrl` |
| 4. Unduh `downloadUrl` | Setelah langkah 3 mengembalikan data | File `.csv` |

Kalau langkah 3 mengembalikan `{}` pada hari yang sama dengan langkah 2, itu **normal**, bukan error.

---

## 1. Cari Tipe Laporan yang Tersedia

```bash
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "reportTypes": [
    { "id": "channel_basic_a3",           "name": "User activity" },
    { "id": "channel_province_a3",        "name": "User activity by province" },
    { "id": "channel_playback_location_a3", "name": "Playback locations" },
    { "id": "channel_traffic_source_a3",  "name": "Traffic sources" },
    { "id": "channel_device_os_a3",       "name": "Device type and OS" }
  ],
  "nextPageToken": "..."
}
```

| Yang harus dilakukan | Alasan |
|---|---|
| Ambil `id`, bukan `name` | `name` adalah label deskriptif; `jobs.create` memerlukan `id` |
| Periksa `deprecateTime` bila ada | Tipe laporan yang di-deprecate akan berhenti menghasilkan laporan |
| Jangan hardcode `id` tanpa verifikasi | Daftar yang dikembalikan tergantung hak akses akun |

Kalau response kosong (`{}`), akun tidak berhak atas satu pun tipe laporan. Cek bahwa consent OAuth dilakukan dengan akun pemilik channel.

Paginasi bila daftarnya panjang:

```bash
# pageSize dan pageToken bekerja seperti pada semua API Google.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?pageSize=50&pageToken=NEXT_PAGE_TOKEN" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 2. Buat Reporting Job

```bash
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "reportTypeId": "channel_basic_a3",
        "name": "luxio-quickstart-channel-basic"
      }'
```

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reportTypeId": "channel_basic_a3",
  "name": "luxio-quickstart-channel-basic",
  "createTime": "2026-09-06T02:20:31.412000Z"
}
```

| Field request | Wajib | Keterangan |
|---|---|---|
| `reportTypeId` | Ya | Dari langkah 1 |
| `name` | Ya (praktisnya) | Label bebas, maks. 100 karakter. Pakai nama yang menjelaskan pipeline pemakainya |

| Field response | Simpan? | Keterangan |
|---|---|---|
| `id` | **Ya** | `JOB_ID`. Maks. 40 karakter. Dibutuhkan untuk semua langkah berikutnya |
| `createTime` | Berguna | Titik awal jendela backfill 30 hari |
| `expireTime` | Pantau | Kalau terisi, job akan berhenti menghasilkan laporan |
| `systemManaged` | Info | `false` untuk job buatan sendiri |

> Prinsip: `jobs.create` bersifat **sekali per tipe laporan**. Memanggilnya berulang membuat job duplikat yang menghasilkan laporan duplikat. Selalu cek `jobs.list` dulu.

Cek idempotensi sebelum membuat:

```bash
# Kalau reportTypeId yang dituju sudah ada di daftar, JANGAN buat job baru.
curl "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 3. Tunggu, lalu Daftar Laporan

Tunggu minimal 24 jam (rancang untuk 48 jam), lalu:

```bash
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "reports": [
    {
      "id": "9876543210",
      "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "startTime": "2026-09-06T07:00:00Z",
      "endTime": "2026-09-07T07:00:00Z",
      "createTime": "2026-09-08T11:04:22.318000Z",
      "downloadUrl": "DOWNLOAD_URL"
    }
  ],
  "nextPageToken": "..."
}
```

| Field | Arti |
|---|---|
| `id` | `REPORT_ID`. Kunci idempotensi utama |
| `startTime` | Awal periode data, **inklusif** |
| `endTime` | Akhir periode data, **eksklusif** |
| `createTime` | Kapan file dibuat. Dipakai sebagai checkpoint `createdAfter` |
| `downloadUrl` | URL unduhan, maks. 1000 karakter, opaque |
| `jobExpireTime` | Ada bila job akan/sudah kedaluwarsa |

Pada pemanggilan pertama, daftar ini akan memuat **banyak** laporan sekaligus: laporan hari berjalan plus data historis 30 hari ke belakang.

Filter agar hanya laporan baru yang terambil:

```bash
# createdAfter menyaring berdasarkan createTime (kapan file dibuat),
# bukan berdasarkan tanggal data. Inilah alasan laporan revisi ikut terambil.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-08T00%3A00%3A00Z" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# startTimeAtOrAfter / startTimeBefore menyaring berdasarkan tanggal DATA.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?startTimeAtOrAfter=2026-09-01T00%3A00%3A00Z&startTimeBefore=2026-09-08T00%3A00%3A00Z" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 4. Unduh File CSV

```bash
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" \
  --compressed \
  -o "channel_basic_a3_2026-09-06.csv"
```

| Opsi | Kenapa perlu |
|---|---|
| `-H "Authorization: Bearer ..."` | `downloadUrl` bukan URL publik; tanpa ini hasilnya `401` |
| `-H "Accept-Encoding: gzip"` | Menghemat bandwidth. Direkomendasikan resmi oleh Google |
| `--compressed` | Meminta curl mendekompresi otomatis |
| `-L` | Mengikuti redirect ke layanan media |
| `-o FILE` | Tulis ke file, jangan ke stdout — file bisa berukuran besar |

Periksa hasilnya:

```bash
# Baris pertama = header. Urutan kolom TIDAK dijamin stabil antar rilis.
head -1 channel_basic_a3_2026-09-06.csv
# → date,channel_id,video_id,live_or_on_demand,subscribed_status,country_code,engaged_views,views,comments,likes,...

# Jumlah baris data (tanpa header).
tail -n +2 channel_basic_a3_2026-09-06.csv | wc -l
# → 0 berarti tidak ada data pada hari itu. File header-only adalah hasil yang sah.
```

---

## 5. Skrip Quickstart Lengkap (Bash)

```bash
#!/usr/bin/env bash
set -euo pipefail

TOKEN="ACCESS_TOKEN"
BASE="https://youtubereporting.googleapis.com/v1"
JOB_ID="JOB_ID"
OUT_DIR="./reports"

mkdir -p "$OUT_DIR"

# 1) Ambil daftar laporan yang belum diproses.
#    Ganti CHECKPOINT dengan createTime tertinggi yang sudah sukses diimpor,
#    atau hilangkan parameter createdAfter pada eksekusi pertama.
LIST=$(curl -sS "$BASE/jobs/$JOB_ID/reports?createdAfter=2026-09-01T00%3A00%3A00Z" \
  -H "Authorization: Bearer $TOKEN")

# 2) Iterasi: satu baris = "id<TAB>startTime<TAB>downloadUrl".
echo "$LIST" | jq -r '.reports[]? | [.id, .startTime, .downloadUrl] | @tsv' |
while IFS=$'\t' read -r report_id start_time url; do
  # Nama file memuat tanggal data agar mudah diaudit; report_id menjamin keunikan.
  day="${start_time%%T*}"
  dest="$OUT_DIR/${day}_${report_id}.csv"

  # Lewati kalau sudah pernah diunduh — penanda paling sederhana untuk idempotensi.
  [ -f "$dest" ] && { echo "SKIP $dest"; continue; }

  echo "GET  $day  ($report_id)"
  curl -sS -L "$url" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept-Encoding: gzip" --compressed \
    -o "$dest.part"

  # Rename atomik: file final hanya muncul kalau unduhan tuntas.
  mv "$dest.part" "$dest"
done

echo "Selesai. File di $OUT_DIR"
```

---

## 6. Troubleshooting Quickstart

| Gejala | Penyebab paling mungkin | Perbaikan |
|---|---|---|
| `reportTypes.list` → `{}` | Akun consent bukan pemilik channel/content owner | Consent ulang dengan akun yang benar |
| `jobs.create` → `400 INVALID_ARGUMENT` | `reportTypeId` salah tulis atau `systemManaged: true` | Ambil `id` persis dari `reportTypes.list`; tipe system-managed tidak bisa dipakai di `jobs.create` |
| `jobs.reports.list` → `404 NOT_FOUND` | `JOB_ID` salah, atau `onBehalfOfContentOwner` tidak konsisten | Cek `jobs.list` dengan parameter konteks yang sama |
| `jobs.reports.list` → `{}` setelah beberapa jam | Belum masuk jendela 24–48 jam | Tunggu; ini bukan error |
| `jobs.list` tidak menampilkan job yang baru dibuat | Job dibuat dengan `onBehalfOfContentOwner`, list dipanggil tanpa parameter itu | Tambahkan parameter yang sama |
| Unduh `downloadUrl` → `401` | Header `Authorization` tidak dikirim, atau token kedaluwarsa | Kirim header; segarkan token |
| CSV hanya berisi header | Tidak ada data pada hari itu | Perilaku normal; impor sebagai "0 baris" |
| Job system-managed tidak muncul | `includeSystemManaged` tidak diset | `jobs.list?includeSystemManaged=true` |

Daftar error lengkap: [errors.md](errors.md). Alur produksi: [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md).
