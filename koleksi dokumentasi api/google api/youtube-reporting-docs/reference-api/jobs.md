# `jobs` — create, list, get, delete

Endpoint untuk mengelola reporting job. Membuat job berarti menginstruksikan YouTube menghasilkan laporan tertentu setiap hari.

| Operasi | HTTP | Path | Response |
|---|---|---|---|
| `jobs.create` | POST | `/v1/jobs` | `Job` |
| `jobs.list` | GET | `/v1/jobs` | `ListJobsResponse` |
| `jobs.get` | GET | `/v1/jobs/{jobId}` | `Job` |
| `jobs.delete` | DELETE | `/v1/jobs/{jobId}` | `Empty` |

Semua operasi menerima scope `yt-analytics.readonly` atau `yt-analytics-monetary.readonly`. **Tidak ada** operasi `update`.

---

## 1. `jobs.create`

| Aspek | Nilai |
|---|---|
| Method ID | `youtubereporting.jobs.create` |
| HTTP | `POST /v1/jobs` |
| Request body | Resource `Job` |
| Response | Resource `Job` (dengan `id` yang dibuat server) |

Deskripsi resmi: *"Creates a reporting job. By creating a reporting job, you are instructing YouTube to generate that report on a daily basis. The report is available within 24 hours of the time that the job is created."*

### Parameter

| Parameter | Lokasi | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| `onBehalfOfContentOwner` | query | `string` | Tidak | External ID content owner. Bila tidak diset, konteksnya channel milik user sendiri |

### Request body

```json
{
  "reportTypeId": "channel_basic_a3",
  "name": "luxio-channel-basic-harian"
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `reportTypeId` | Ya | `id` dari `reportTypes.list`. Tipe `systemManaged: true` **tidak boleh** dipakai |
| `name` | Ya secara praktis | Maks. 100 karakter. Label operasional Anda |

Field `id`, `createTime`, `expireTime`, dan `systemManaged` diisi server — jangan dikirim.

### Contoh

```bash
# Job channel biasa.
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reportTypeId": "channel_basic_a3", "name": "luxio-channel-basic-harian" }'
```

```bash
# Job content owner. onBehalfOfContentOwner WAJIB untuk laporan content_owner_*.
# Simpan CONTENT_OWNER_ID bersama job.id — semua pemanggilan berikutnya butuh parameter ini.
curl -X POST "https://youtubereporting.googleapis.com/v1/jobs?onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reportTypeId": "content_owner_basic_a4", "name": "luxio-co-basic-harian" }'
```

### Response

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reportTypeId": "channel_basic_a3",
  "name": "luxio-channel-basic-harian",
  "createTime": "2026-09-06T02:20:31.412000Z"
}
```

> Prinsip: `jobs.create` **tidak idempoten**. Memanggilnya dua kali dengan `reportTypeId` yang sama menghasilkan dua job berbeda yang memproduksi laporan duplikat. Selalu cek `jobs.list` lebih dulu.

### Guard idempotensi

```js
// Pola create-if-absent. Wajib, karena API tidak menolak job duplikat.
async function ensureJob({ accessToken, reportTypeId, name, contentOwnerId = null }) {
  const existing = await listJobs({ accessToken, contentOwnerId, includeSystemManaged: false });

  // Cocokkan berdasarkan reportTypeId, BUKAN name — name bisa berubah/berbeda.
  const found = existing.find(j => j.reportTypeId === reportTypeId);
  if (found) return { job: found, created: false };

  const url = new URL('https://youtubereporting.googleapis.com/v1/jobs');
  if (contentOwnerId) url.searchParams.set('onBehalfOfContentOwner', contentOwnerId);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',   // wajib untuk POST
    },
    body: JSON.stringify({ reportTypeId, name }),
  });
  if (!res.ok) throw new Error(`jobs.create ${res.status}: ${await res.text()}`);

  return { job: await res.json(), created: true };
}
```

---

## 2. `jobs.list`

| Aspek | Nilai |
|---|---|
| Method ID | `youtubereporting.jobs.list` |
| HTTP | `GET /v1/jobs` |
| Response | `ListJobsResponse` |

Deskripsi resmi: *"Lists reporting jobs that have been scheduled for a channel or content owner. Each resource in the response contains an `id` property, which specifies the ID that YouTube uses to uniquely identify the job. You need that ID to retrieve the list of reports that have been generated for the job or to delete the job."*

### Parameter

| Parameter | Tipe | Deskripsi resmi |
|---|---|---|
| `includeSystemManaged` | `boolean` | *"If set to true, also system-managed jobs will be returned; otherwise only user-created jobs will be returned. System-managed jobs can neither be modified nor deleted."* |
| `pageSize` | `integer` (int32) | *"Requested page size. Server may return fewer jobs than requested. If unspecified, server will pick an appropriate default."* |
| `pageToken` | `string` | Token halaman berikutnya |
| `onBehalfOfContentOwner` | `string` | External ID content owner |

### Contoh

```bash
# Job buatan sendiri saja.
curl "https://youtubereporting.googleapis.com/v1/jobs?pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Termasuk job system-managed. Ini SATU-SATUNYA cara mendapatkan JOB_ID
# untuk laporan pendapatan aktual — jobs.create tidak bisa dipakai untuk itu.
curl "https://youtubereporting.googleapis.com/v1/jobs?includeSystemManaged=true&onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Partial response untuk audit ringan.
curl "https://youtubereporting.googleapis.com/v1/jobs?fields=jobs(id,reportTypeId,expireTime,systemManaged),nextPageToken" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

```json
{
  "jobs": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "reportTypeId": "channel_basic_a3",
      "name": "luxio-channel-basic-harian",
      "createTime": "2026-08-10T04:11:07.812000Z"
    }
  ],
  "nextPageToken": "CiQKImIyYzNkNGU1"
}
```

### Kode

```python
def list_jobs(reporting, content_owner_id=None, include_system_managed=False):
    """Kembalikan semua job, menangani paginasi."""
    jobs, page_token = [], None
    while True:
        kwargs = {"pageSize": 100, "includeSystemManaged": include_system_managed}
        if content_owner_id:
            # WAJIB konsisten: job yang dibuat dengan onBehalfOfContentOwner
            # tidak akan terlihat tanpa parameter ini.
            kwargs["onBehalfOfContentOwner"] = content_owner_id
        if page_token:
            kwargs["pageToken"] = page_token

        resp = reporting.jobs().list(**kwargs).execute()
        jobs.extend(resp.get("jobs", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            return jobs
```

---

## 3. `jobs.get`

| Aspek | Nilai |
|---|---|
| Method ID | `youtubereporting.jobs.get` |
| HTTP | `GET /v1/jobs/{jobId}` |
| Response | Resource `Job` |

Deskripsi resmi: *"Retrieves information about a specific reporting job that has been scheduled for a channel or content owner."*

### Parameter

| Parameter | Lokasi | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| `jobId` | path | `string` | **Ya** | *"The ID of the job to retrieve."* |
| `onBehalfOfContentOwner` | query | `string` | Tidak | External ID content owner |

```bash
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Untuk job milik content owner, parameter konteks harus sama dengan saat job dibuat.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID?onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Kegunaan utama: memeriksa `expireTime` satu job tanpa mengambil seluruh daftar.

---

## 4. `jobs.delete`

| Aspek | Nilai |
|---|---|
| Method ID | `youtubereporting.jobs.delete` |
| HTTP | `DELETE /v1/jobs/{jobId}` |
| Response | `Empty` → `{}` |

Deskripsi resmi: *"Deletes a job."*

### Parameter

| Parameter | Lokasi | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| `jobId` | path | `string` | **Ya** | *"The ID of the job to delete."* |
| `onBehalfOfContentOwner` | query | `string` | Tidak | External ID content owner |

```bash
# Tidak ada konfirmasi, tidak ada undo.
curl -X DELETE "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → HTTP 200, body {}
```

| Sebelum menghapus, pastikan | Alasan |
|---|---|
| Semua laporan yang dibutuhkan sudah diunduh dan diimpor | Dokumentasi tidak menjamin laporan tetap dapat diakses setelah job dihapus |
| Job bukan `systemManaged: true` | Job system-managed tidak dapat dihapus content owner |
| Ada job pengganti bila ini bagian dari migrasi versi laporan | Jangan sampai ada celah data |

> Catatan: membuat ulang job dengan `reportTypeId` yang sama menghasilkan `id` baru dan memulai ulang siklus backfill 30 hari. Data lebih lama dari 30 hari sebelum job baru dibuat **tidak** akan diproduksi ulang.

---

## 5. Error

| Operasi | HTTP | `error.status` | Penyebab | Perbaikan |
|---|---|---|---|---|
| `create` | `400` | `INVALID_ARGUMENT` | `reportTypeId` salah tulis / tidak tersedia | Ambil `id` dari `reportTypes.list` |
| `create` | `400` | `INVALID_ARGUMENT` | `reportTypeId` milik tipe system-managed | Gunakan `jobs.list?includeSystemManaged=true` |
| `create` | `403` | `PERMISSION_DENIED` | Akun bukan content owner untuk laporan `content_owner_*` | Pakai akun content owner + `onBehalfOfContentOwner` |
| `list` | `200` + `{}` | — | Belum ada job, atau konteks berbeda | Cek `onBehalfOfContentOwner` |
| `get` / `delete` | `404` | `NOT_FOUND` | `JOB_ID` salah, sudah dihapus, atau konteks berbeda | Verifikasi lewat `jobs.list` |
| `delete` | — | — | Job `systemManaged: true` | Tidak dapat dihapus |
| semua | `401` | `UNAUTHENTICATED` | Token tidak ada/kedaluwarsa | Segarkan token |
| semua | `429` / `5xx` | `RESOURCE_EXHAUSTED` / `INTERNAL` / `UNAVAILABLE` | Batas atau gangguan | Retry dengan backoff |

---

## 6. Checklist Operasional Job

| # | Praktik | Alasan |
|---|---|---|
| 1 | Validasi `reportTypeId` lewat `reportTypes.list` sebelum create | Mencegah `400` dan job salah |
| 2 | Cek `jobs.list` sebelum create | Mencegah job duplikat |
| 3 | Simpan `job.id` **dan** `content_owner_id` di database | Parameter konteks harus konsisten selamanya |
| 4 | Beri `name` yang deskriptif | Satu-satunya pembeda manusiawi di `jobs.list` |
| 5 | Audit `expireTime` setiap sinkronisasi | Job berhenti berproduksi setelah tanggal itu |
| 6 | Benar-benar unduh laporan yang dijadwalkan | Job yang diabaikan akan dimatikan YouTube |
| 7 | Jangan hapus job sebelum job pengganti berproduksi | Mencegah celah data |

Detail field: [../resources/job.md](../resources/job.md). Langkah berikutnya: [reports.md](reports.md).
