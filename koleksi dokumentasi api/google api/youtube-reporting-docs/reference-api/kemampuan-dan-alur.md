# Kemampuan & Alur — API Reference

File ini menjelaskan **anatomi request** YouTube Reporting API dan membedah kode per operasi. Semua path relatif terhadap `https://youtubereporting.googleapis.com`.

---

## 1. Anatomi Request

```
GET https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-08T11%3A04%3A22Z&pageSize=50
    └──────────── host ────────────────────┘└─ ver ┘└─── resource path ───┘└─────────── query ────────────┘

Header:
  Authorization: Bearer ACCESS_TOKEN          ← wajib pada semua endpoint
  Accept-Encoding: gzip                        ← disarankan untuk unduhan
  Content-Type: application/json               ← hanya untuk POST /v1/jobs
```

| Komponen | Aturan |
|---|---|
| Host | `youtubereporting.googleapis.com` (mTLS: `youtubereporting.mtls.googleapis.com`) |
| Versi | Selalu `/v1` |
| Path parameter | `{jobId}`, `{reportId}` — string opaque, jangan dibentuk sendiri |
| Query parameter | Timestamp harus RFC3339 dan URL-encoded (`:` → `%3A`) |
| Body | Hanya `jobs.create` yang punya request body |

---

## 2. Tabel Lengkap Operasi

| Operasi | HTTP | Path | Request body | Response | File |
|---|---|---|---|---|---|
| `reportTypes.list` | GET | `/v1/reportTypes` | — | `ListReportTypesResponse` | [report-types.md](report-types.md) |
| `jobs.create` | POST | `/v1/jobs` | `Job` | `Job` | [jobs.md](jobs.md) |
| `jobs.list` | GET | `/v1/jobs` | — | `ListJobsResponse` | [jobs.md](jobs.md) |
| `jobs.get` | GET | `/v1/jobs/{jobId}` | — | `Job` | [jobs.md](jobs.md) |
| `jobs.delete` | DELETE | `/v1/jobs/{jobId}` | — | `Empty` | [jobs.md](jobs.md) |
| `jobs.reports.list` | GET | `/v1/jobs/{jobId}/reports` | — | `ListReportsResponse` | [reports.md](reports.md) |
| `jobs.reports.get` | GET | `/v1/jobs/{jobId}/reports/{reportId}` | — | `Report` | [reports.md](reports.md) |
| `media.download` | GET | `/v1/media/{+resourceName}?alt=media` | — | file `.csv` | [media-download.md](media-download.md) |

Setiap operasi menerima **kedua** scope: `yt-analytics.readonly` dan `yt-analytics-monetary.readonly`.

---

## 3. Matriks Parameter

| Parameter | `reportTypes.list` | `jobs.create` | `jobs.list` | `jobs.get` | `jobs.delete` | `jobs.reports.list` | `jobs.reports.get` |
|---|---|---|---|---|---|---|---|
| `jobId` (path) | — | — | — | wajib | wajib | wajib | wajib |
| `reportId` (path) | — | — | — | — | — | — | wajib |
| `onBehalfOfContentOwner` | ya | ya | ya | ya | ya | ya | ya |
| `pageSize` | ya | — | ya | — | — | ya | — |
| `pageToken` | ya | — | ya | — | — | ya | — |
| `includeSystemManaged` | ya | — | ya | — | — | — | — |
| `createdAfter` | — | — | — | — | — | ya | — |
| `startTimeAtOrAfter` | — | — | — | — | — | ya | — |
| `startTimeBefore` | — | — | — | — | — | ya | — |

Parameter standar Google API (`alt`, `fields`, `prettyPrint`, `quotaUser`, `key`, `access_token`, `oauth_token`, `callback`, `$.xgafv`, `uploadType`, `upload_protocol`) berlaku pada semua operasi.

---

## 4. Kode per Operasi

### 4.1 Katalog tipe laporan

```bash
# Menemukan reportTypeId yang valid. Panggil ini sebelum jobs.create — selalu.
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Apa yang dikerjakan: mengembalikan `reportTypes[]` berisi `{ id, name }`, plus `deprecateTime` dan `systemManaged` bila relevan. Daftar disaring berdasarkan hak akses akun.

### 4.2 Membuat job

```bash
# Satu-satunya operasi dengan request body. Content-Type WAJIB application/json.
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reportTypeId": "channel_basic_a3", "name": "luxio-channel-basic-harian" }'
```

Apa yang dikerjakan: menginstruksikan YouTube memproduksi laporan tipe tersebut setiap hari. Response memuat `id` yang dibuat server.

### 4.3 Memulihkan `JOB_ID`

```bash
# Dipakai kalau job.id tidak tersimpan, atau untuk mengaudit job yang ada.
curl "https://youtubereporting.googleapis.com/v1/jobs?pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Sertakan job yang dikelola sistem — satu-satunya cara mendapatkan JOB_ID laporan pendapatan.
curl "https://youtubereporting.googleapis.com/v1/jobs?includeSystemManaged=true&onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Apa yang dikerjakan: mencocokkan `reportTypeId` dari response dengan tipe yang dibutuhkan pipeline, lalu mengambil `id`-nya.

### 4.4 Mendaftar laporan yang belum diproses

```bash
# createdAfter = kursor idempotensi. Nilainya createTime tertinggi yang SUDAH sukses diimpor.
# Timestamp harus URL-encoded: ":" → "%3A".
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-08T11%3A04%3A22Z&pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Apa yang dikerjakan: mengembalikan hanya laporan yang dibuat setelah checkpoint — termasuk laporan revisi (backfill), karena laporan revisi punya `createTime` baru.

### 4.5 Mengunduh isi laporan

```bash
# downloadUrl dari langkah 4.4. Header Authorization WAJIB.
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o "REPORT_ID.csv"
```

Apa yang dikerjakan: mengambil file CSV. Baris pertama adalah header kolom.

### 4.6 Menghentikan produksi laporan

```bash
# Tidak ada undo. Unduh dulu laporan yang masih dibutuhkan.
curl -X DELETE "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → {} dengan HTTP 200
```

Apa yang dikerjakan: menghapus job. Job `systemManaged: true` tidak dapat dihapus.

---

## 5. Paginasi

Ketiga endpoint `list` memakai pola yang sama:

```bash
# Halaman pertama.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "reports": [...], "nextPageToken": "CgsIhYDCyAcQgIDIBw" }

# Halaman berikutnya: pertahankan SEMUA parameter filter, tambahkan pageToken.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?pageSize=100&createdAfter=2026-09-08T11%3A04%3A22Z&pageToken=CgsIhYDCyAcQgIDIBw" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

| Aturan | Penjelasan |
|---|---|
| `nextPageToken` tidak ada | Halaman terakhir |
| Array bisa hilang, bukan kosong | Beri fallback `?? []` |
| `pageSize` tidak dijamin dipenuhi | *"Server may return fewer ... than requested"* |
| `pageSize` tidak diisi | Server memilih default yang wajar |
| Parameter filter harus konsisten antar halaman | Mengubah `createdAfter` di tengah paginasi membuat `pageToken` tidak konsisten |

---

## 6. Timestamp

Semua parameter waktu bertipe `google-datetime` (RFC3339).

| Parameter | Menyaring berdasarkan | Contoh nilai | Bentuk URL-encoded |
|---|---|---|---|
| `createdAfter` | `report.createTime` | `2026-09-08T11:04:22Z` | `2026-09-08T11%3A04%3A22Z` |
| `startTimeAtOrAfter` | `report.startTime` (>=) | `2026-09-01T00:00:00Z` | `2026-09-01T00%3A00%3A00Z` |
| `startTimeBefore` | `report.startTime` (<) | `2026-10-01T00:00:00Z` | `2026-10-01T00%3A00%3A00Z` |

```js
// Bentuk query dengan URLSearchParams: encoding ditangani otomatis.
// Kesalahan klasik: menempelkan timestamp mentah ke string URL → ":" tidak ter-encode.
const url = new URL('https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports');
url.searchParams.set('createdAfter', new Date(checkpointMs).toISOString()); // ...Z
url.searchParams.set('pageSize', '100');
```

---

## 7. Perbedaan `createdAfter` vs `startTime*`

| Skenario | Parameter yang benar |
|---|---|
| "Ambil laporan yang belum pernah saya proses" | `createdAfter` |
| "Ambil ulang data September apa pun kondisinya" | `startTimeAtOrAfter` + `startTimeBefore` |
| "Tangkap laporan revisi untuk hari yang sudah saya impor" | `createdAfter` |
| "Backfill manual satu bulan spesifik" | `startTimeAtOrAfter` + `startTimeBefore` |
| "Pipeline harian rutin" | `createdAfter` |

> Prinsip: `createdAfter` adalah kursor pipeline; `startTimeAtOrAfter`/`startTimeBefore` adalah alat operator untuk perbaikan manual. Jangan memakai `startTime*` sebagai kursor — laporan revisi punya `startTime` lama dan akan terlewat.

---

## 8. Peta File Reference

| File | Isi |
|---|---|
| [report-types.md](report-types.md) | `reportTypes.list` — semua parameter dan pola pemakaian |
| [jobs.md](jobs.md) | `jobs.create`, `list`, `get`, `delete` |
| [reports.md](reports.md) | `jobs.reports.list`, `jobs.reports.get` dan tiga parameter filter waktunya |
| [media-download.md](media-download.md) | `media.download`, `alt=media`, gzip, streaming |

Model data lengkap: [../resources/kemampuan-dan-alur.md](../resources/kemampuan-dan-alur.md). Alur produksi: [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md).
