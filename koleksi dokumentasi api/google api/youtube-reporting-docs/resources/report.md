# Resource: `report`

Resource `report` mengidentifikasi **satu instance laporan**. Resource ini menyebutkan periode waktu yang datanya dicakup laporan tersebut, serta URL untuk mengunduhnya.

- Endpoint: `/v1/jobs/{jobId}/reports` ([../reference-api/reports.md](../reference-api/reports.md))
- Method: `list`, `get` — read-only
- Deskripsi resmi: *"A report's metadata including the URL from which the report itself can be downloaded."*

---

## 1. Representasi JSON

```json
{
  "id": string,
  "jobId": string,
  "startTime": timestamp,
  "endTime": timestamp,
  "createTime": timestamp,
  "jobExpireTime": timestamp,
  "downloadUrl": string
}
```

---

## 2. Properti

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | `string` | ID yang YouTube tetapkan untuk mengidentifikasi laporan secara unik. Setiap laporan terkait satu job, tetapi satu job bisa punya banyak `report.id` |
| `jobId` | `string` | ID job yang membuat laporan ini |
| `startTime` | `timestamp` | Awal periode yang dicakup laporan. Nilainya **inklusif**. RFC3339 UTC "Zulu", akurat sampai mikrodetik |
| `endTime` | `timestamp` | Akhir periode yang dicakup laporan. Nilainya **eksklusif** |
| `createTime` | `timestamp` | Tanggal/waktu laporan dibuat |
| `jobExpireTime` | `timestamp` | Tanggal/waktu job pemilik laporan ini kedaluwarsa atau akan kedaluwarsa |
| `downloadUrl` | `string` | URL untuk mengunduh laporan. Maks. **1000 karakter** |

---

## 3. `startTime` vs `createTime` — Perbedaan Paling Penting

Dua timestamp ini sering tertukar dan menyebabkan bug idempotensi.

| Aspek | `startTime` / `endTime` | `createTime` |
|---|---|---|
| Menjawab | "Data ini tentang **hari apa**?" | "File ini **dibuat kapan**?" |
| Berubah pada backfill | **Tidak** — tetap sama seperti laporan asli | **Ya** — laporan revisi punya `createTime` baru |
| Dipakai untuk | Menentukan partisi data yang di-replace | Kursor `createdAfter`, dan memilih laporan mana yang lebih baru |
| Parameter filter | `startTimeAtOrAfter`, `startTimeBefore` | `createdAfter` |

Ilustrasi laporan revisi:

```json
{
  "reports": [
    {
      "id": "1000000001",
      "jobId": "JOB_ID",
      "startTime": "2026-09-01T07:00:00Z",
      "endTime":   "2026-09-02T07:00:00Z",
      "createTime":"2026-09-03T09:12:44.000000Z",
      "downloadUrl": "DOWNLOAD_URL"
    },
    {
      "id": "1000000042",
      "jobId": "JOB_ID",
      "startTime": "2026-09-01T07:00:00Z",
      "endTime":   "2026-09-02T07:00:00Z",
      "createTime":"2026-09-11T04:30:12.000000Z",
      "downloadUrl": "DOWNLOAD_URL"
    }
  ]
}
```

Kedua laporan mencakup hari data yang **sama** (`startTime`/`endTime` identik) tetapi `id` dan `createTime` berbeda. Aturan resmi:

> *"if two new reports have the same `startTime` and `endTime` property values, only import the report with the newer `createTime` value."*

Prosedur yang benar:

| # | Tindakan |
|---|---|
| 1 | Kelompokkan laporan berdasarkan pasangan (`startTime`, `endTime`) |
| 2 | Dalam setiap kelompok, pilih **hanya** yang `createTime`-nya terbaru |
| 3 | Hapus data lama untuk periode itu dari tabel Anda |
| 4 | Impor data dari laporan terbaru |

```js
// Deduplikasi berdasarkan periode data, memilih createTime terbaru.
// Tanpa langkah ini, backfill akan menggandakan angka di database.
function pickLatestPerPeriod(reports) {
  const byPeriod = new Map();
  for (const r of reports) {
    const key = `${r.startTime}|${r.endTime}`;        // periode data = identitas logis
    const prev = byPeriod.get(key);
    // Bandingkan createTime, bukan id — id tidak monotonik.
    if (!prev || Date.parse(r.createTime) > Date.parse(prev.createTime)) {
      byPeriod.set(key, r);
    }
  }
  return [...byPeriod.values()];
}
```

---

## 4. Membaca `startTime` / `endTime`

| Fakta | Nilai |
|---|---|
| Panjang periode (laporan harian) | 24 jam |
| Zona waktu data | 12:00 AM–11:59 PM Pacific Standard Time (UTC-8) |
| `startTime` | Inklusif |
| `endTime` | Eksklusif |
| Kolom `date` di dalam CSV | Selalu satu nilai yang sama untuk seluruh file |
| Laporan system-managed | Periode lebih panjang (semua yang tersedia saat ini adalah laporan bulanan) |

Karena periode data mengikuti waktu Pasifik, `startTime` dalam UTC akan tampak seperti `07:00:00Z` (saat PST, UTC-8) atau `08:00:00Z`. Jangan menghitung tanggal data dengan memotong string UTC secara buta.

```python
# Tentukan tanggal data secara benar: konversi ke zona waktu Pasifik dulu.
from datetime import datetime
from zoneinfo import ZoneInfo

def data_date(start_time: str) -> str:
    # start_time contoh: "2026-09-01T07:00:00Z"
    dt_utc = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
    # Konversi ke waktu Pasifik: inilah "hari" yang dimaksud laporan.
    dt_pt = dt_utc.astimezone(ZoneInfo("America/Los_Angeles"))
    return dt_pt.date().isoformat()      # → "2026-09-01"

# Alternatif paling aman: baca saja kolom `date` dari baris pertama data CSV.
# Nilainya sudah dalam format YYYY-MM-DD dan konsisten untuk seluruh file.
```

> Prinsip: sumber paling tepercaya untuk tanggal data adalah **kolom `date` di dalam CSV**, bukan hasil konversi `startTime`. Pakai `startTime` untuk penamaan file dan partisi kasar; pakai kolom `date` untuk nilai yang disimpan.

---

## 5. `downloadUrl`

| Aspek | Nilai |
|---|---|
| Panjang maksimum | 1000 karakter |
| Sifat | Opaque — jangan diparse, jangan disusun manual |
| Otorisasi | **Wajib** header `Authorization: Bearer ACCESS_TOKEN` |
| Kompresi | Dukung `Accept-Encoding: gzip` |
| Masa berlaku | Tidak dipublikasikan. Ambil ulang lewat `jobs.reports.list` bila ragu |

Instruksi resmi: *"To retrieve the report, send an HTTP GET request to this URL. In the request, set the `Authorization` HTTP Request header, using your authorization token as the header value."*

```bash
# downloadUrl BUKAN URL bertanda tangan publik. Tanpa header Authorization → 401.
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o report.csv
```

Jangan menyimpan `downloadUrl` sebagai data jangka panjang. Simpan `report.id`, lalu ambil URL segar saat akan mengunduh. Detail: [media.md](media.md).

---

## 6. `jobExpireTime`

Field ini punya nilai bila salah satu kondisi berikut terjadi (kutipan referensi resmi):

| Kondisi | Penjelasan |
|---|---|
| Tipe laporan yang dipakai job sudah di-deprecate | Lihat `reportType.deprecateTime` |
| Laporan job itu tidak diunduh dalam waktu lama | YouTube berhenti memproduksi laporan yang diabaikan |

Nilainya menandai tanggal setelah mana YouTube tidak lagi menghasilkan laporan baru untuk job tersebut. Instruksi resmi sama dengan `job.expireTime`: hentikan permintaan ke laporan itu sebelum tanggal tersebut, dan cari laporan pengganti bila ada.

`jobExpireTime` pada `report` adalah cermin dari `expireTime` pada `job` induknya — berguna karena pipeline yang hanya memanggil `jobs.reports.list` tidak perlu memanggil `jobs.get` terpisah hanya untuk mengetahui masa berlaku job.

---

## 7. Contoh Response `jobs.reports.list`

```json
{
  "reports": [
    {
      "id": "1000000101",
      "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "startTime": "2026-09-04T07:00:00Z",
      "endTime": "2026-09-05T07:00:00Z",
      "createTime": "2026-09-06T10:22:41.556000Z",
      "downloadUrl": "DOWNLOAD_URL"
    },
    {
      "id": "1000000102",
      "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "startTime": "2026-09-05T07:00:00Z",
      "endTime": "2026-09-06T07:00:00Z",
      "createTime": "2026-09-07T10:19:03.911000Z",
      "downloadUrl": "DOWNLOAD_URL"
    }
  ],
  "nextPageToken": "CgsIhYDCyAcQgIDIBw"
}
```

Perhatikan `endTime` laporan pertama sama dengan `startTime` laporan kedua — konsekuensi `endTime` yang eksklusif. Tidak ada tumpang tindih dan tidak ada celah.

---

## 8. Menyimpan Report di Database

```sql
CREATE TABLE yt_reporting_reports (
  id            TEXT PRIMARY KEY,        -- report.id: pengaman anti-duplikat utama
  job_id        TEXT NOT NULL REFERENCES yt_reporting_jobs(id),
  start_time    TIMESTAMPTZ NOT NULL,    -- inklusif
  end_time      TIMESTAMPTZ NOT NULL,    -- eksklusif
  create_time   TIMESTAMPTZ NOT NULL,    -- kapan file dibuat YouTube
  data_date     DATE NOT NULL,           -- kolom `date` dari CSV (waktu Pasifik)
  row_count     INTEGER NOT NULL,        -- 0 sah: hari tanpa data
  imported_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_by TEXT REFERENCES yt_reporting_reports(id)  -- diisi bila digantikan laporan revisi
);

-- Untuk mencari laporan terbaru per periode dengan cepat.
CREATE INDEX yt_reporting_reports_period
  ON yt_reporting_reports (job_id, start_time, end_time, create_time DESC);

-- Cek idempotensi sebelum mengunduh.
-- SELECT 1 FROM yt_reporting_reports WHERE id = 'REPORT_ID';
```

Kolom `superseded_by` membuat riwayat revisi bisa diaudit: ketika laporan backfill masuk, tandai laporan lama alih-alih menghapus barisnya.

Alur lengkap idempotensi dan replace-per-periode: [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md) dan [../guides/scheduling-and-backfill.md](../guides/scheduling-and-backfill.md).
