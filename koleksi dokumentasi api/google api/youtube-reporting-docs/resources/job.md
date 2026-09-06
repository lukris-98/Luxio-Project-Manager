# Resource: `job`

Resource `job` mewakili **satu reporting job terjadwal**. Job mengidentifikasi laporan tertentu yang YouTube hasilkan setiap hari untuk satu channel atau content owner.

- Endpoint: `/v1/jobs` ([../reference-api/jobs.md](../reference-api/jobs.md))
- Method: `create`, `list`, `get`, `delete` — **tidak ada `update`**
- Deskripsi resmi: *"A job creating reports of a specific type."*

---

## 1. Representasi JSON

```json
{
  "id": string,
  "reportTypeId": string,
  "name": string,
  "createTime": timestamp,
  "expireTime": timestamp,
  "systemManaged": boolean
}
```

---

## 2. Properti

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | `string` | ID yang YouTube pakai untuk mengidentifikasi job secara unik. Maks. **40 karakter**. Dibuat server — jangan diisi saat `create`. Ini `JOB_ID` yang dipakai pada `jobs.get`, `jobs.delete`, dan `jobs.reports.list` |
| `reportTypeId` | `string` | Tipe laporan yang dihasilkan job. Nilainya sama dengan `id` sebuah `reportType` dari `reportTypes.list` |
| `name` | `string` | Nama yang mendeskripsikan job. Maks. **100 karakter**. Untuk job buatan sendiri, ini nilai yang Anda kirim; untuk job system-managed, YouTube yang mengisinya |
| `createTime` | `timestamp` | Tanggal/waktu job dibuat. RFC3339 UTC "Zulu", akurat sampai mikrodetik. Contoh: `2015-10-02T15:01:23.045678Z` |
| `expireTime` | `timestamp` | Tanggal/waktu job kedaluwarsa atau akan kedaluwarsa. Setelah job kedaluwarsa, **tidak ada laporan baru** yang dihasilkan |
| `systemManaged` | `boolean` | `true` bila job menghasilkan laporan yang dikelola sistem. Content owner **tidak bisa** mengubah atau menghapus job semacam ini |

---

## 3. Field yang Diisi Saat `create`

Hanya dua field yang relevan pada request body:

```json
{
  "reportTypeId": "channel_basic_a3",
  "name": "luxio-channel-basic-harian"
}
```

| Field | Kirim saat create? | Alasan |
|---|---|---|
| `reportTypeId` | **Ya** | Menentukan laporan yang diproduksi |
| `name` | Ya | Label operasional Anda |
| `id` | Tidak | Dibuat server |
| `createTime` | Tidak | Diisi server |
| `expireTime` | Tidak | Diisi server bila relevan |
| `systemManaged` | Tidak | Diisi server |

```bash
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "reportTypeId": "channel_basic_a3",
        "name": "luxio-channel-basic-harian"
      }'
# → response adalah resource Job lengkap, termasuk id yang dibuat server.
```

> Prinsip: isi `name` dengan sesuatu yang bisa dilacak balik ke pipeline pemakainya, mis. `<produk>-<reportType>-<lingkungan>`. Ketika ada 30 job, `name` adalah satu-satunya cara manusia membedakannya di `jobs.list`.

---

## 4. Arti `expireTime`

`expireTime` terisi dalam dua kondisi (kutipan referensi resmi):

| Kondisi | Penjelasan |
|---|---|
| Tipe laporan yang dipakai job sudah **di-deprecate** | Lihat `reportType.deprecateTime` di [report-type.md](report-type.md) |
| Laporan yang dihasilkan job **tidak diunduh dalam waktu lama** | YouTube berhenti memproduksi laporan yang tidak pernah dipakai |

Nilainya menandai tanggal setelah mana YouTube tidak lagi menghasilkan laporan baru untuk job tersebut.

Instruksi resmi: *"If you have a job that identifies an expiration date, you should update your systems to stop requesting the report by that date. In some cases, a replacement report may be available."*

| Tindakan | Kapan |
|---|---|
| Alert operator | Segera setelah `expireTime` terdeteksi |
| Cari tipe pengganti di `reportTypes.list` | Sebelum `expireTime` |
| Buat job baru untuk tipe pengganti | Segera, agar backfill 30 hari mulai berjalan |
| Hentikan request ke job lama | Pada/ sebelum `expireTime` |
| Hapus job lama | Setelah job baru terbukti menghasilkan data |

```js
// Monitoring expireTime: jalankan bersamaan dengan sinkronisasi harian.
// Penyebab paling sering di lingkungan nyata: job dibuat lalu tidak pernah diunduh.
function auditJobs(jobs) {
  const soon = Date.now() + 30 * 24 * 3600 * 1000;
  return jobs
    .filter(j => j.expireTime)                        // hanya job yang dijadwalkan berhenti
    .map(j => ({
      id: j.id,
      reportTypeId: j.reportTypeId,
      name: j.name,
      expiresAt: j.expireTime,
      urgent: Date.parse(j.expireTime) < soon,        // < 30 hari lagi
      systemManaged: j.systemManaged === true,        // job sistem tidak bisa Anda perbaiki
    }));
}
```

> Prinsip: cara paling efektif mencegah `expireTime` muncul adalah **benar-benar mengunduh** laporan yang Anda jadwalkan. Job yang dibuat "untuk nanti" lalu diabaikan akan dimatikan YouTube.

---

## 5. Arti `systemManaged`

| Nilai | Siapa yang membuat | Bisa `delete`? | Cara menemukan |
|---|---|---|---|
| tidak ada / `false` | Aplikasi Anda lewat `jobs.create` | Ya | `jobs.list` (default) |
| `true` | YouTube, otomatis | **Tidak** | `jobs.list?includeSystemManaged=true` |

YouTube membuat job system-managed secara otomatis untuk content owner yang memiliki akses ke laporan padanannya di YouTube Creator Studio.

```bash
# Default: hanya job buatan user.
curl "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# includeSystemManaged=true: sertakan job yang dikelola sistem.
# Ini SATU-SATUNYA cara mendapatkan JOB_ID laporan pendapatan aktual.
curl "https://youtubereporting.googleapis.com/v1/jobs?includeSystemManaged=true&onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Deskripsi resmi parameter: *"If set to true, also system-managed jobs will be returned; otherwise only user-created jobs will be returned. System-managed jobs can neither be modified nor deleted."*

Detail: [../guides/system-managed-reports.md](../guides/system-managed-reports.md).

---

## 6. Siklus Hidup Job

```
jobs.create
    │  reportTypeId + name
    ▼
[AKTIF]  ──── YouTube memproduksi 1 laporan/hari ────►  jobs.reports.list
    │        + backfill 30 hari ke belakang (sekali, di awal)
    │
    ├── tipe laporan di-deprecate ──────────┐
    ├── laporan tidak diunduh lama ─────────┤
    │                                        ▼
    │                              [expireTime terisi]
    │                                        │
    │                          setelah expireTime: tidak ada laporan baru
    │                                        │
    └── jobs.delete ───────────────────────► [DIHAPUS]
```

Catatan penting tentang `jobs.delete`:

| Aspek | Perilaku |
|---|---|
| Response | Resource `Empty` — objek JSON kosong `{}` |
| Efek pada produksi laporan | Berhenti |
| Efek pada laporan yang sudah ada | Tidak didokumentasikan sebagai tetap tersedia. Unduh dulu apa yang dibutuhkan sebelum menghapus |
| Job system-managed | Tidak dapat dihapus |
| Membuat ulang job dengan `reportTypeId` sama | Menghasilkan `id` baru dan siklus backfill 30 hari baru |

```bash
# Hapus job. Tidak ada konfirmasi dan tidak ada undo.
curl -X DELETE "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → {} (HTTP 200)
```

---

## 7. Contoh Response `jobs.list`

```json
{
  "jobs": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "reportTypeId": "channel_basic_a3",
      "name": "luxio-channel-basic-harian",
      "createTime": "2026-08-10T04:11:07.812000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "reportTypeId": "channel_traffic_source_a3",
      "name": "luxio-traffic-source-harian",
      "createTime": "2026-08-10T04:11:09.204000Z",
      "expireTime": "2026-12-01T00:00:00.000000Z"
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "reportTypeId": "content_owner_ad_revenue_summary_a1",
      "name": "Aggregate ad revenue per video",
      "createTime": "2025-01-02T00:00:00.000000Z",
      "systemManaged": true
    }
  ],
  "nextPageToken": "CiQKImIyYzNkNGU1"
}
```

| Baris | Interpretasi |
|---|---|
| 1 | Job normal, aktif, tanpa jadwal berhenti |
| 2 | `expireTime` terisi → butuh tindakan sebelum 1 Desember 2026 |
| 3 | Job system-managed → hanya muncul dengan `includeSystemManaged=true`; read-only |

---

## 8. Menyimpan Job di Database

```sql
CREATE TABLE yt_reporting_jobs (
  id                 TEXT PRIMARY KEY,       -- job.id, maks. 40 karakter
  report_type_id     TEXT NOT NULL,          -- menentukan skema kolom CSV
  name               TEXT NOT NULL,          -- label operasional
  content_owner_id   TEXT,                   -- NULL = konteks channel pribadi
  create_time        TIMESTAMPTZ NOT NULL,   -- job.createTime
  expire_time        TIMESTAMPTZ,            -- job.expireTime, NULL = aktif
  system_managed     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Kursor idempotensi: createTime tertinggi dari laporan yang SUDAH sukses diimpor.
  -- Dipakai sebagai nilai createdAfter pada jobs.reports.list.
  checkpoint         TIMESTAMPTZ,

  synced_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cegah job duplikat untuk kombinasi tipe laporan + konteks yang sama.
CREATE UNIQUE INDEX yt_reporting_jobs_unique
  ON yt_reporting_jobs (report_type_id, COALESCE(content_owner_id, ''));
```

`content_owner_id` wajib disimpan: semua pemanggilan berikutnya untuk job itu harus memakai `onBehalfOfContentOwner` yang sama, jika tidak job tersebut tidak akan ditemukan.

Alur produksi lengkap yang memakai tabel ini: [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md).
