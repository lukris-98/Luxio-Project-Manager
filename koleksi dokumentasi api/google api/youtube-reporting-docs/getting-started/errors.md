# Errors — Struktur & Penanganan

> Catatan verifikasi: YouTube Reporting API **tidak memiliki halaman referensi error tersendiri** di dokumentasi resmi Google (`developers.google.com/youtube/reporting/v1/errors` mengembalikan 404). Yang terdokumentasi secara eksplisit di referensi resmi hanyalah satu kasus: `jobs.reports.list` mengembalikan `NOT_FOUND` bila job tidak ada. Sisanya mengikuti **model error standar Google API** yang berlaku untuk semua API bergaya Cloud/gRPC-transcoded seperti `youtubereporting`. Tabel di bawah dibedakan dengan jelas antara yang terverifikasi dan yang merupakan model umum.

---

## 1. Struktur Response Error

Format v2 (default untuk API bergaya Cloud):

```json
{
  "error": {
    "code": 403,
    "message": "The caller does not have permission",
    "status": "PERMISSION_DENIED"
  }
}
```

Sebagian error Google juga menyertakan array `errors[]` bergaya lama dengan `reason` dan `domain`:

```json
{
  "error": {
    "code": 403,
    "message": "YouTube Reporting API has not been used in project 123456789 before or it is disabled.",
    "status": "PERMISSION_DENIED",
    "errors": [
      {
        "message": "YouTube Reporting API has not been used in project 123456789 before or it is disabled.",
        "domain": "usageLimits",
        "reason": "accessNotConfigured"
      }
    ]
  }
}
```

| Field | Selalu ada | Fungsi |
|---|---|---|
| `error.code` | Ya | HTTP status code |
| `error.message` | Ya | Deskripsi manusia. **Jangan** dipakai untuk logika program — teksnya bisa berubah |
| `error.status` | Ya (format v2) | Status kanonik, mis. `PERMISSION_DENIED`. Ini yang dipakai untuk logika |
| `error.errors[].reason` | Tidak selalu | Kode reason bergaya lama. Berguna untuk diagnosis, bukan sebagai kontrak |
| `error.errors[].domain` | Tidak selalu | Mis. `usageLimits`, `global` |
| `error.details[]` | Tidak selalu | Detail terstruktur bergaya `google.rpc.*` |

Memilih format error:

```bash
# $.xgafv=2 → format error v2 (error.status tersedia). Ini default pada API ini.
curl "https://youtubereporting.googleapis.com/v1/jobs?\$.xgafv=2" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 2. Status Kanonik yang Relevan

| HTTP | `error.status` | Penyebab khas pada Reporting API | Retry? |
|---|---|---|---|
| 400 | `INVALID_ARGUMENT` | `reportTypeId` tidak valid, timestamp `createdAfter` bukan RFC3339, `pageToken` rusak | **Tidak** |
| 401 | `UNAUTHENTICATED` | Header `Authorization` tidak ada, token kedaluwarsa/dicabut | Tidak — segarkan token lalu ulangi sekali |
| 403 | `PERMISSION_DENIED` | API belum di-enable, scope tidak disetujui, akun bukan pemilik data, `onBehalfOfContentOwner` tidak berhak | **Tidak** |
| 404 | `NOT_FOUND` | `JOB_ID` atau `REPORT_ID` tidak ada, konteks `onBehalfOfContentOwner` tidak cocok, laporan sudah lewat retensi | **Tidak** |
| 409 | `ALREADY_EXISTS` | Konflik resource | Tidak |
| 429 | `RESOURCE_EXHAUSTED` | Batas request terlampaui | **Ya**, dengan backoff |
| 500 | `INTERNAL` | Kesalahan sisi server | **Ya**, dengan backoff |
| 503 | `UNAVAILABLE` | Layanan sementara tidak tersedia | **Ya**, dengan backoff |
| 504 | `DEADLINE_EXCEEDED` | Timeout | **Ya**, dengan backoff |

Yang **terverifikasi eksplisit** dari referensi resmi: `jobs.reports.list` → `NOT_FOUND` bila job tidak ada. Sisanya adalah pemetaan standar `google.rpc.Code` yang berlaku umum untuk API Google bergaya ini.

---

## 3. Error per Endpoint

### `reportTypes.list`

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| `200` + body `{}` | Akun tidak berhak atas tipe laporan apa pun | Consent ulang dengan akun pemilik channel/content owner |
| `403 PERMISSION_DENIED` + `reason: accessNotConfigured` | YouTube Reporting API belum di-enable pada project | Enable di Cloud Console ([enable-api.md](enable-api.md)) |
| `403 PERMISSION_DENIED` | Scope belum disetujui user | Consent ulang dengan scope yang benar |
| Tipe system-managed tidak muncul | `includeSystemManaged` tidak diset | Tambahkan `?includeSystemManaged=true` |

### `jobs.create`

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| `400 INVALID_ARGUMENT` | `reportTypeId` salah tulis atau tidak tersedia untuk akun | Ambil `id` persis dari `reportTypes.list` |
| `400 INVALID_ARGUMENT` | Mencoba membuat job untuk tipe `systemManaged: true` | Tidak diizinkan. Job system-managed dibuat otomatis oleh YouTube |
| `403 PERMISSION_DENIED` | Akun bukan content owner tapi meminta laporan `content_owner_*` | Pakai akun content owner + `onBehalfOfContentOwner` |
| Job duplikat, bukan error | `jobs.create` dipanggil berulang | Cek `jobs.list` sebelum create |

### `jobs.list` / `jobs.get` / `jobs.delete`

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| Job yang baru dibuat tidak muncul | Job dibuat dengan `onBehalfOfContentOwner`, list dipanggil tanpa parameter itu | Gunakan parameter konteks yang konsisten |
| `404 NOT_FOUND` pada `jobs.get` | `JOB_ID` salah, sudah dihapus, atau konteks berbeda | Verifikasi lewat `jobs.list` |
| `jobs.delete` gagal | Job `systemManaged: true` | Job system-managed tidak dapat dihapus content owner |

### `jobs.reports.list` / `jobs.reports.get`

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| `404 NOT_FOUND` | Job tidak ada (terdokumentasi resmi) | Verifikasi `JOB_ID` lewat `jobs.list` |
| `200` + `{}` beberapa jam setelah `jobs.create` | Belum masuk jendela 24–48 jam | Tunggu. Bukan error |
| `200` + `{}` terus-menerus > 3 hari | Job kedaluwarsa, atau tipe laporan di-deprecate | Cek `job.expireTime` dan `reportType.deprecateTime` |
| `400 INVALID_ARGUMENT` pada `createdAfter` | Format timestamp salah | Gunakan RFC3339 UTC, mis. `2026-09-08T11:04:22Z`, dan URL-encode `:` menjadi `%3A` |
| Laporan lama hilang dari daftar | Sudah melewati retensi (60 hari, atau 30 hari untuk data historis) | Tidak bisa dipulihkan lewat API |

### Unduhan (`downloadUrl` / `media.download`)

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| `401 UNAUTHENTICATED` | Header `Authorization` tidak dikirim ke `downloadUrl` | `downloadUrl` bukan URL publik; kirim `Bearer` token |
| `401` di tengah unduhan panjang | Access token kedaluwarsa saat stream berjalan | Segarkan token sebelum unduhan besar; beri margin ≥5 menit |
| `404 NOT_FOUND` | Laporan sudah kedaluwarsa | Ambil ulang daftar via `jobs.reports.list` untuk memperoleh URL terbaru |
| File terpotong / CSV rusak | Koneksi terputus, tidak ada verifikasi kelengkapan | Unduh ke `.part` lalu rename atomik; ulangi bila gagal |
| Byte tidak terbaca (biner) | Response gzip tidak didekompresi | Gunakan `--compressed` (curl) atau dekompresi eksplisit di klien |

---

## 4. Reason Codes Umum Google API

Kolom `error.errors[].reason` bukan bagian kontrak yang dijamin, tetapi nilai berikut sering terlihat pada API Google dan berguna untuk diagnosis:

| `reason` | HTTP | Arti |
|---|---|---|
| `accessNotConfigured` | 403 | API belum di-enable pada project |
| `forbidden` | 403 | Akun tidak berhak atas resource |
| `authError` | 401 | Kredensial tidak valid |
| `insufficientPermissions` | 403 | Scope OAuth kurang |
| `rateLimitExceeded` | 429 | Batas request terlampaui |
| `userRateLimitExceeded` | 429 | Batas per-user terlampaui |
| `quotaExceeded` | 403 | Kuota project habis |
| `backendError` | 500 | Kesalahan internal |
| `notFound` | 404 | Resource tidak ditemukan |
| `invalid` / `badRequest` | 400 | Parameter tidak valid |

> Prinsip: cabang logika program pada `error.code` dan `error.status`. Pakai `reason` dan `message` hanya untuk log dan pesan operator.

---

## 5. Error OAuth (Bukan dari Reporting API)

Error saat menukar/menyegarkan token datang dari `oauth2.googleapis.com`, dengan format berbeda:

```json
{
  "error": "invalid_grant",
  "error_description": "Token has been expired or revoked."
}
```

| `error` | Arti | Retry? |
|---|---|---|
| `invalid_grant` | Refresh token dicabut/kedaluwarsa, atau authorization code sudah dipakai | **Tidak** — perlu consent ulang |
| `invalid_client` | `client_id`/`client_secret` salah | Tidak |
| `invalid_request` | Parameter form kurang | Tidak |
| `unauthorized_client` | Client tidak diizinkan memakai grant type ini | Tidak |
| `access_denied` | User menolak, atau aplikasi belum diverifikasi | Tidak |

---

## 6. Pola Penanganan Error

```js
// Klasifikasi error menjadi tiga kategori: FATAL, RETRY, dan AUTH.
// Hanya RETRY yang boleh diulang otomatis.
function classify(status, body) {
  const canonical = body?.error?.status;

  if (status === 401) return 'AUTH';                       // segarkan token, ulangi sekali
  if (status === 429) return 'RETRY';
  if (status >= 500) return 'RETRY';
  if (status === 403 && canonical === 'PERMISSION_DENIED') return 'FATAL';
  if (status === 404) return 'FATAL';
  if (status === 400) return 'FATAL';
  return status >= 400 ? 'FATAL' : 'OK';
}

async function callApi(path, token, attempt = 0) {
  const res = await fetch(`https://youtubereporting.googleapis.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) return res.json();

  const body = await res.json().catch(() => ({}));
  const kind = classify(res.status, body);

  if (kind === 'AUTH' && attempt === 0) {
    // Satu kali saja: token baru, lalu ulangi. Kalau tetap 401, itu masalah izin.
    const fresh = await refreshAccessToken();
    return callApi(path, fresh, attempt + 1);
  }

  if (kind === 'RETRY' && attempt < 5) {
    // Exponential backoff + jitter: 1s, 2s, 4s, 8s, 16s (±30%).
    const base = 1000 * 2 ** attempt;
    const wait = base * (0.7 + Math.random() * 0.6);
    await new Promise(r => setTimeout(r, wait));
    return callApi(path, token, attempt + 1);
  }

  // FATAL: log konteks lengkap agar operator bisa memperbaiki konfigurasi.
  throw new Error(
    `Reporting API ${res.status} ${body?.error?.status ?? ''}: ${body?.error?.message ?? '(tanpa pesan)'} @ ${path}`
  );
}
```

Strategi retry lengkap, termasuk penanganan laporan hilang dan kedaluwarsa: [../guides/error-handling.md](../guides/error-handling.md).

---

## 7. Kesalahan Konseptual yang Sering Terjadi

| Anggapan salah | Kenyataan |
|---|---|
| "`jobs.reports.list` kosong = job gagal" | Normal selama 24–48 jam pertama, dan setiap hari sebelum laporan baru terbit |
| "CSV hanya berisi header = error" | YouTube memang membuat laporan untuk hari tanpa data |
| "`downloadUrl` bisa dibuka di browser" | Butuh header `Authorization`; tanpa itu `401` |
| "Job harus dibuat setiap hari" | Job bersifat permanen sampai dihapus atau kedaluwarsa |
| "`403` selalu berarti kuota habis" | Pada API Google, `403` juga berarti API belum aktif atau scope kurang |
| "Retry akan memperbaiki `400`" | `INVALID_ARGUMENT` deterministik; retry hanya membuang request |
| "Laporan yang hilang bisa diminta ulang" | Setelah melewati retensi, data tidak dapat dipulihkan lewat API |
| "Nilai `NULL`/`ZZ` di CSV adalah data rusak" | Itu hasil anonimisasi privasi dan harus tetap diimpor |
