# Kemampuan & Alur — Resources

File ini menjelaskan **field mana untuk apa** pada keempat resource YouTube Reporting API, dan bagaimana nilai berpindah dari satu resource ke resource berikutnya.

---

## 1. Empat Resource dan Hubungannya

```
   reportType                job                    report                 media
 ┌────────────┐        ┌──────────────┐       ┌───────────────┐      ┌──────────────┐
 │ id         │──────► │ reportTypeId │       │ jobId         │      │              │
 │ name       │        │ id           │─────► │ id            │      │  file .csv   │
 │ deprecate  │        │ name         │       │ startTime     │      │              │
 │   Time     │        │ createTime   │       │ endTime       │      │              │
 │ system     │        │ expireTime   │──┐    │ createTime    │      │              │
 │  Managed   │        │ systemManaged│  │    │ jobExpireTime │◄─┘   │              │
 └────────────┘        └──────────────┘  └───►│ downloadUrl   │─────►└──────────────┘
   read-only            create/read/delete      read-only              download
```

| Resource | File detail | Operasi |
|---|---|---|
| `reportType` | [report-type.md](report-type.md) | `list` |
| `job` | [job.md](job.md) | `create`, `list`, `get`, `delete` |
| `report` | [report.md](report.md) | `list`, `get` |
| `media` | [media.md](media.md) | `download` |

Tidak ada `update` pada resource mana pun. Semua data bersifat append-only dari sisi klien.

---

## 2. Aliran Nilai Antar Resource

| Dari | Field | Ke | Field / parameter | Fungsi |
|---|---|---|---|---|
| `reportType` | `id` | `jobs.create` | body `reportTypeId` | Menentukan laporan apa yang akan diproduksi |
| `jobs.create` | `id` | `jobs.reports.list` | path `{jobId}` | Menemukan instance laporan |
| `jobs.list` | `id` | `jobs.reports.list` | path `{jobId}` | Pemulihan `JOB_ID` bila tidak tersimpan |
| `jobs.list` | `reportTypeId` | — | — | Mengenali job mana milik pipeline mana |
| `report` | `downloadUrl` | HTTP GET | URL | Mengunduh file CSV |
| `report` | `createTime` | `jobs.reports.list` | query `createdAfter` | Kursor idempotensi antar-eksekusi |
| `report` | `id` | Database Anda | primary key | Penanda laporan sudah diproses |
| `report` | `startTime` / `endTime` | Database Anda | rentang data | Menentukan partisi yang harus di-replace saat backfill |
| `job` | `expireTime` | Monitoring | alert | Job akan berhenti berproduksi |
| `reportType` | `deprecateTime` | Monitoring | alert | Tipe laporan akan dihentikan |

---

## 3. Field yang Wajib Disimpan di Database Anda

| Field | Dari | Kenapa wajib |
|---|---|---|
| `job.id` | `jobs.create` / `jobs.list` | Tanpa ini tidak bisa memanggil `jobs.reports.list` |
| `job.reportTypeId` | sama | Mengetahui skema kolom CSV yang diharapkan |
| `report.id` | `jobs.reports.list` | Cek "sudah pernah diproses?" — pengaman utama anti-duplikat |
| `report.createTime` | sama | Nilai `createdAfter` untuk eksekusi berikutnya, dan penentu laporan mana yang lebih baru |
| `report.startTime` | sama | Menentukan tanggal data; dipakai saat menghapus data lama pada backfill |
| `report.endTime` | sama | Pelengkap `startTime` untuk mengidentifikasi periode secara unik |

Field yang **tidak** perlu disimpan permanen:

| Field | Alasan |
|---|---|
| `report.downloadUrl` | Bersifat sementara dan opaque. Ambil ulang lewat `jobs.reports.list` saat butuh |
| `reportType.name` | Label deskriptif, bukan identitas |
| `job.name` | Label Anda sendiri; boleh disimpan sebagai metadata, tapi bukan kunci |

---

## 4. Konvensi Tipe Data

| Tipe | Format | Contoh | Catatan |
|---|---|---|---|
| `string` (ID) | Opaque | `channel_basic_a3` | Jangan diparse; `job.id` maks. 40 karakter, `reportType.id` maks. 100 karakter |
| `timestamp` | RFC3339 UTC "Zulu", akurat sampai mikrodetik | `2015-10-02T15:01:23.045678Z` | Discovery document menyebutnya `google-datetime` |
| `boolean` | `true` / `false` | `"systemManaged": true` | Bisa **tidak muncul** bila `false` (perilaku proto3) |
| URL | string maks. 1000 karakter | — | `report.downloadUrl` |

> Prinsip: field boolean dan timestamp opsional dapat **hilang sama sekali** dari JSON ketika nilainya default/kosong. Perlakukan `undefined` sebagai `false` untuk `systemManaged`, dan sebagai "tidak akan kedaluwarsa" untuk `expireTime` / `deprecateTime`.

Contoh response `jobs.list` yang menunjukkan hal ini:

```json
{
  "jobs": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "reportTypeId": "channel_basic_a3",
      "name": "luxio-channel-basic-harian",
      "createTime": "2026-08-10T04:11:07.812000Z"
      // Tidak ada "expireTime"  → job masih aktif, tidak dijadwalkan berhenti.
      // Tidak ada "systemManaged" → job buatan sendiri (false).
    },
    {
      "id": "z9y8x7w6-v5u4-3210-fedc-ba0987654321",
      "reportTypeId": "content_owner_ad_revenue_summary_a1",
      "name": "Aggregate ad revenue per video",
      "createTime": "2025-01-02T00:00:00.000000Z",
      "systemManaged": true
      // systemManaged: true → dibuat otomatis YouTube; tidak bisa diubah/dihapus.
    }
  ]
}
```

---

## 5. Pemetaan Resource ke Endpoint

| Resource | Method | HTTP | Path | Detail |
|---|---|---|---|---|
| `reportType` | `list` | GET | `/v1/reportTypes` | [../reference-api/report-types.md](../reference-api/report-types.md) |
| `job` | `create` | POST | `/v1/jobs` | [../reference-api/jobs.md](../reference-api/jobs.md) |
| `job` | `list` | GET | `/v1/jobs` | sama |
| `job` | `get` | GET | `/v1/jobs/{jobId}` | sama |
| `job` | `delete` | DELETE | `/v1/jobs/{jobId}` | sama |
| `report` | `list` | GET | `/v1/jobs/{jobId}/reports` | [../reference-api/reports.md](../reference-api/reports.md) |
| `report` | `get` | GET | `/v1/jobs/{jobId}/reports/{reportId}` | sama |
| `media` | `download` | GET | `/v1/media/{+resourceName}?alt=media` | [../reference-api/media-download.md](../reference-api/media-download.md) |

---

## 6. Response Wrapper

Semua method `list` mengembalikan wrapper dengan array + token paginasi:

| Wrapper | Array | Token |
|---|---|---|
| `ListReportTypesResponse` | `reportTypes[]` | `nextPageToken` |
| `ListJobsResponse` | `jobs[]` | `nextPageToken` |
| `ListReportsResponse` | `reports[]` | `nextPageToken` |

```js
// Pola paginasi yang berlaku untuk ketiga endpoint list.
// Array bisa TIDAK ADA (bukan array kosong) ketika hasilnya nihil — selalu beri fallback.
async function listAll(path, arrayKey, token) {
  const out = [];
  let pageToken;
  do {
    const url = new URL(`https://youtubereporting.googleapis.com/v1${path}`);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const body = await res.json();
    out.push(...(body[arrayKey] ?? []));   // fallback wajib
    pageToken = body.nextPageToken;
  } while (pageToken);
  return out;
}

// listAll('/reportTypes', 'reportTypes', token)
// listAll('/jobs', 'jobs', token)
// listAll('/jobs/JOB_ID/reports', 'reports', token)
```

`jobs.delete` mengembalikan resource `Empty`, yaitu objek JSON kosong `{}`.

---

## 7. Peta "Saya Butuh Field Ini → Baca File Ini"

| Saya butuh... | File |
|---|---|
| Daftar `reportTypeId` yang valid dan artinya | [report-type.md](report-type.md) + [../guides/report-types-catalog.md](../guides/report-types-catalog.md) |
| Arti `expireTime` dan apa yang harus dilakukan | [job.md](job.md) |
| Beda `startTime` (data) vs `createTime` (file) | [report.md](report.md) |
| Cara aman mengunduh file besar | [media.md](media.md) |
| Nama-nama kolom di dalam CSV | [../guides/report-dimensions-metrics.md](../guides/report-dimensions-metrics.md) |
| Desain tabel database untuk menyimpan hasil | [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md) |
