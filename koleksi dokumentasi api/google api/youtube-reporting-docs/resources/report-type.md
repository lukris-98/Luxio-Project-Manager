# Resource: `reportType`

Resource `reportType` mewakili **satu tipe laporan** yang bisa dihasilkan YouTube. Ini adalah katalog read-only: Anda memilih salah satu `id` dari sini, lalu memakainya sebagai `reportTypeId` saat membuat job.

- Endpoint: `GET /v1/reportTypes` ([../reference-api/report-types.md](../reference-api/report-types.md))
- Method yang didukung: `list` saja
- Deskripsi resmi: *"A report type."*

---

## 1. Representasi JSON

```json
{
  "id": string,
  "name": string,
  "deprecateTime": timestamp,
  "systemManaged": boolean
}
```

---

## 2. Properti

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | `string` | ID tipe laporan, maks. **100 karakter**. Nilai inilah yang dipakai sebagai `reportTypeId` pada `jobs.create`. Contoh: `channel_basic_a3` |
| `name` | `string` | Nama tipe laporan, maks. **100 karakter**. Label deskriptif, mis. `User activity`. Tidak unik dan tidak boleh dipakai sebagai identitas |
| `deprecateTime` | `timestamp` | Tanggal/waktu ketika tipe laporan ini di-deprecate atau akan di-deprecate. Format RFC3339 UTC "Zulu" |
| `systemManaged` | `boolean` | `true` bila tipe laporan dikelola sistem. Job untuk tipe ini dibuat otomatis, sehingga **tidak bisa dipakai** pada method `jobs.create` |

Field opsional bisa hilang dari JSON bila nilainya default:

| Field tidak ada | Perlakukan sebagai |
|---|---|
| `deprecateTime` | Tipe laporan tidak dijadwalkan di-deprecate |
| `systemManaged` | `false` — tipe laporan biasa yang bisa dipakai di `jobs.create` |

---

## 3. Contoh Response

```json
{
  "reportTypes": [
    {
      "id": "channel_basic_a3",
      "name": "User activity"
    },
    {
      "id": "channel_traffic_source_a3",
      "name": "Traffic sources"
    },
    {
      "id": "content_owner_ad_revenue_summary_a1",
      "name": "Aggregate ad revenue per video",
      "systemManaged": true
    }
  ],
  "nextPageToken": "CigKJmNoYW5uZWxfY2FyZHNfYTE"
}
```

Baris ketiga memiliki `systemManaged: true` → hanya muncul bila request menyertakan `includeSystemManaged=true`, dan **tidak boleh** dipakai di `jobs.create`.

---

## 4. Membaca `id` dengan Benar

Konvensi penamaan `id` (pola yang teramati pada katalog resmi, bukan kontrak API):

```
channel_basic_a3
│       │     └── versi laporan: a3 = versi ketiga
│       └──────── isi laporan: basic / traffic_source / device_os / demographics
└──────────────── cakupan: channel / playlist / content_owner / music_content_owner / publisher_content_owner
```

| Prefiks | Cakupan | Butuh content owner |
|---|---|---|
| `channel_` | Laporan channel | Tidak |
| `playlist_` | Laporan playlist channel | Tidak |
| `content_owner_` | Laporan content owner (video, playlist, asset, revenue) | Ya |
| `music_content_owner_` | Laporan khusus label musik | Ya |
| `publisher_content_owner_` | Laporan khusus penerbit musik | Ya |
| `demographic_` / `geographic_` | Laporan Primetime | Ya |

| Sufiks versi | Arti |
|---|---|
| `_a1`, `_a2`, `_a3`, `_a4` | Versi laporan. Versi lebih tinggi biasanya menambah metrik baru |

> Prinsip: **jangan** menyusun `id` sendiri dari pola ini. Selalu ambil nilai persis dari `reportTypes.list`. Versi bisa naik dan versi lama bisa di-deprecate.

---

## 5. Menangani `deprecateTime`

Ketika `deprecateTime` terisi, YouTube akan berhenti menghasilkan laporan tipe itu setelah tanggal tersebut.

| Langkah | Tindakan |
|---|---|
| 1 | Deteksi `deprecateTime` saat sinkronisasi katalog berkala |
| 2 | Cari versi pengganti pada `reportTypes.list` (biasanya `id` sama dengan sufiks versi lebih tinggi) |
| 3 | Buat job baru untuk tipe pengganti — jangan hapus job lama dulu |
| 4 | Jalankan keduanya paralel sampai job baru menghasilkan data lengkap |
| 5 | Hapus job lama lewat `jobs.delete` |

```bash
# Sinkronkan katalog secara berkala dan catat perubahan deprecateTime.
# Jangan tunggu sampai pipeline berhenti menghasilkan data.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```js
// Deteksi tipe laporan yang akan berhenti dalam 60 hari ke depan.
function findDeprecating(reportTypes) {
  const horizon = Date.now() + 60 * 24 * 3600 * 1000;
  return reportTypes
    .filter(rt => rt.deprecateTime)                       // hanya yang punya jadwal deprecate
    .map(rt => ({ id: rt.id, at: Date.parse(rt.deprecateTime) }))
    .filter(x => x.at < horizon)                          // yang jatuh dalam 60 hari
    .sort((a, b) => a.at - b.at);
}
```

Perhatikan juga `job.expireTime`: field itu terisi bila tipe laporan yang dipakai job sudah di-deprecate. Lihat [job.md](job.md).

---

## 6. Menangani `systemManaged`

| Nilai | Arti | Cara memakai |
|---|---|---|
| tidak ada / `false` | Tipe laporan biasa | `jobs.create` dengan `reportTypeId` ini |
| `true` | Dikelola sistem | Jangan `jobs.create`. Temukan job-nya lewat `jobs.list?includeSystemManaged=true` |

```bash
# Default: HANYA tipe yang bisa dipakai untuk membuat job baru.
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# includeSystemManaged=true: tambahkan juga tipe yang dikelola sistem.
# Berguna untuk katalog/inventaris, bukan untuk jobs.create.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?includeSystemManaged=true&onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Deskripsi resmi parameter (dari discovery document): *"If set to true, also system-managed report types will be returned; otherwise only the report types that can be used to create new reporting jobs will be returned."*

Detail: [../guides/system-managed-reports.md](../guides/system-managed-reports.md).

---

## 7. Daftar `id` yang Tersedia

Katalog `reportTypeId` yang terverifikasi dari dokumentasi resmi ada di [../guides/report-types-catalog.md](../guides/report-types-catalog.md), termasuk:

| Kelompok | Jumlah tipe terverifikasi |
|---|---|
| Channel — video & reach | 14 |
| Channel — playlist | 6 |
| Content owner — video & reach | 13 |
| Content owner — playlist | 5 |
| Content owner — estimated revenue | 2 |
| Content owner — asset | 10 |
| System-managed | banyak (finansial, video, asset, reference, claim, Primetime) |

> Catatan: daftar apa pun di dokumen ini adalah snapshot dokumentasi. Sumber kebenaran untuk akun Anda tetap `reportTypes.list`.

---

## 8. Menyimpan Katalog Secara Lokal

```sql
-- Snapshot katalog untuk deteksi perubahan dan audit.
CREATE TABLE yt_report_types (
  id              TEXT PRIMARY KEY,        -- reportType.id, maks. 100 karakter
  name            TEXT NOT NULL,           -- reportType.name, label deskriptif
  deprecate_time  TIMESTAMPTZ,             -- NULL = tidak dijadwalkan deprecate
  system_managed  BOOLEAN NOT NULL DEFAULT FALSE,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upsert saat sinkronisasi katalog: last_seen_at menandai tipe yang hilang dari katalog.
INSERT INTO yt_report_types (id, name, deprecate_time, system_managed)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE
  SET name           = EXCLUDED.name,
      deprecate_time = EXCLUDED.deprecate_time,
      system_managed = EXCLUDED.system_managed,
      last_seen_at   = now();
```

Tipe yang `last_seen_at`-nya tertinggal jauh berarti sudah hilang dari katalog akun — tanda bahwa job terkait perlu ditinjau.
