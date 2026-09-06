# Error & Penanganannya

---

## 1. Struktur Error

YouTube Analytics API memakai envelope error standar Google API. Body error selalu JSON, bahkan ketika request sukses akan mengembalikan CSV pada v1 (v2 hanya JSON).

```json
{
  "error": {
    "code": 403,
    "message": "The request is not properly authorized.",
    "errors": [
      {
        "domain": "youtube.analytics",
        "reason": "insufficientPermissions",
        "message": "The request is not properly authorized."
      }
    ],
    "status": "PERMISSION_DENIED"
  }
}
```

| Field | Arti |
|---|---|
| `error.code` | Kode status HTTP |
| `error.message` | Pesan ringkas untuk manusia; **jangan** dijadikan dasar logika program |
| `error.errors[]` | Detail per-kesalahan |
| `error.errors[].reason` | Pengenal mesin. **Ini yang dipakai untuk bercabang logika** |
| `error.errors[].domain` | Domain error, mis. `global` atau `youtube.analytics` |
| `error.status` | Kode status kanonik Google (mis. `INVALID_ARGUMENT`, `PERMISSION_DENIED`, `RESOURCE_EXHAUSTED`) |

> Prinsip: bercabang berdasarkan `error.errors[0].reason`, bukan berdasarkan `error.message`. Teks pesan berubah tanpa pemberitahuan.

---

## 2. Kode HTTP

| Kode | Arti | Boleh di-retry? |
|---|---|---|
| `400 Bad Request` | Parameter salah/ejaan salah/kombinasi dimensi-metrik ilegal | Tidak — perbaiki request |
| `401 Unauthorized` | Token tidak ada, salah format, atau kedaluwarsa | Ya, setelah memperbarui token |
| `403 Forbidden` | Scope kurang, akun bukan pemilik, API belum di-enable, atau kuota terlampaui | Tergantung `reason` |
| `404 Not Found` | Resource (grup/item grup) tidak ditemukan | Tidak |
| `429 Too Many Requests` | Rate limit terlampaui | Ya, dengan exponential backoff |
| `500` / `503` | Kesalahan atau ketidaktersediaan sementara di sisi server | Ya, dengan exponential backoff |

---

## 3. Reason yang Umum Muncul

Tabel berikut memuat `reason` standar Google API yang paling sering muncul pada pemakaian YouTube Analytics API.

| Kode | `reason` | Penyebab | Perbaikan |
|---|---|---|---|
| 400 | `badRequest` | Request tidak valid secara umum: format tanggal salah, nama dimensi/metrik salah tulis, kombinasi dimensi-metrik tidak didukung laporan mana pun | Cek ejaan di [../resources/dimension.md](../resources/dimension.md) dan [../resources/metric.md](../resources/metric.md); cek kombinasi legal di [../guides/channel-reports.md](../guides/channel-reports.md) |
| 400 | `invalidParameters` | Nilai parameter tidak valid untuk laporan yang diminta, mis. `dimensions=day,month` (dua dimensi waktu), `province` tanpa filter `country==US`, `sort` memakai kolom yang tidak diminta | Sesuaikan dengan aturan di [../guides/dimensions-and-metrics.md](../guides/dimensions-and-metrics.md) |
| 400 | `invalidValue` | Nilai di luar rentang yang diterima, mis. `maxResults=500` pada laporan yang membatasi 200 | Turunkan nilai sesuai batas di [rate-limits.md](rate-limits.md) |
| 401 | `authError` / `invalidCredentials` | Access token kedaluwarsa atau tidak valid | Minta token baru |
| 403 | `forbidden` | Akun terautentikasi bukan pemilik channel yang diminta, atau bukan pemilik konten yang sah | Login dengan akun pemilik; untuk laporan pemilik konten, pastikan akun tertaut ke content owner tersebut |
| 403 | `insufficientPermissions` | Token tidak memuat scope yang dibutuhkan. Paling sering: `youtube.readonly` yang lupa disertakan pada `reports.query`, atau meminta metrik pendapatan tanpa `yt-analytics-monetary.readonly` | Tambah scope, minta consent ulang — lihat [authentication.md](authentication.md) |
| 403 | `accessNotConfigured` | YouTube Analytics API belum di-enable di project pemilik kredensial | Enable API — lihat [enable-api.md](enable-api.md) |
| 403 | `quotaExceeded` / `dailyLimitExceeded` | Kuota project habis | Tunggu reset, cache lebih agresif, atau ajukan kenaikan kuota |
| 403 | `rateLimitExceeded` / `userRateLimitExceeded` | Terlalu banyak request dalam waktu singkat | Exponential backoff + jitter |
| 429 | `rateLimitExceeded` | Idem, dilaporkan sebagai 429 | Exponential backoff + jitter |
| 500 | `backendError` / `internalError` | Kesalahan sementara di server | Retry dengan backoff |
| 503 | `backendError` | Layanan tidak tersedia sementara | Retry dengan backoff |

> Catatan akurasi: halaman referensi error khusus YouTube Analytics API (`/youtube/analytics/reference/errors`) saat penulisan mengalihkan ke halaman *Introduction*, sehingga tabel di atas menggunakan `reason` standar Google API yang dirujuk oleh halaman-halaman metode (`groups.*`, `groupItems.*`). Selalu baca nilai `reason` aktual dari respons dan tangani `reason` tidak dikenal sebagai kegagalan generik.

---

## 4. Error Spesifik yang Terdokumentasi Resmi

Hanya dua error yang secara eksplisit didokumentasikan sebagai unik untuk metode tertentu:

| Metode | Kode | `reason` | Arti |
|---|---|---|---|
| `groupItems.insert` | `403` | `groupContainsMaximumNumberOfItems` | Grup sudah memuat jumlah item maksimum (500) |
| `groupItems.delete` | `404` | `groupItemNotFound` | Item grup dengan `id` tersebut tidak ditemukan |

Metode lain (`reports.query`, `groups.list`, `groups.insert`, `groups.update`, `groups.delete`, `groupItems.list`) tidak mendefinisikan error khusus dan hanya mengembalikan error umum.

---

## 5. Kondisi "Bukan Error" yang Sering Disalahartikan

| Kondisi | Respons | Cara menangani |
|---|---|---|
| Tidak ada data untuk kueri | `200 OK` **tanpa** field `rows` | Tampilkan status kosong, bukan angka nol |
| Data hari-hari terbaru belum siap | `200 OK`, `rows` berakhir lebih awal dari `endDate` | Hitung tanggal terakhir dari `rows`, bukan dari `endDate` |
| Data di bawah ambang anonimisasi | `200 OK`, baris tertentu tidak muncul | Jangan tampilkan selisih sebagai "Lainnya" tanpa keterangan |
| Item sudah dihapus | Tidak muncul di laporan per-item, tetap terhitung di agregat | Beri catatan bila total agregat > jumlah per-item |
| `groupItems.insert` untuk item yang sudah ada | `204 No Content` (bukan error) | Perlakukan sebagai sukses idempoten |
| `groups.delete`, `groupItems.delete` sukses | `204 No Content`, body kosong | Jangan `JSON.parse()` body kosong |

```js
// Salah: body 204 kosong → JSON.parse gagal.
const data = await res.json()

// Benar: cek status dulu.
if (res.status === 204) return { ok: true }
const data = await res.json()
```

---

## 6. Pola Penanganan

```js
// Klasifikasi error → tentukan apakah boleh retry.
const RETRYABLE_REASONS = new Set([
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'backendError',
  'internalError',
])

async function callAnalytics(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

  if (res.ok) {
    const data = await res.json()
    // 'rows' DIHILANGKAN bila tidak ada data — bukan error.
    return { rows: data.rows ?? [], columnHeaders: data.columnHeaders }
  }

  const body = await res.json().catch(() => ({}))
  const detail = body?.error?.errors?.[0] ?? {}
  const reason = detail.reason ?? 'unknown'

  // 401: token mati → perbarui token lalu ulangi sekali.
  if (res.status === 401) throw Object.assign(new Error('TOKEN_EXPIRED'), { reason })

  // 429 / 5xx / reason retryable → boleh backoff.
  const retryable = res.status === 429 || res.status >= 500 || RETRYABLE_REASONS.has(reason)
  throw Object.assign(new Error(detail.message ?? `HTTP ${res.status}`), {
    status: res.status,
    reason,
    retryable,
  })
}
```

Strategi retry dan exponential backoff lengkap: [../guides/error-handling.md](../guides/error-handling.md).

---

## 7. Daftar Periksa Saat Debug

1. Apakah `startDate`/`endDate` berformat `YYYY-MM-DD`?
2. Bila memakai `dimensions=month`, apakah kedua tanggal jatuh pada tanggal 1?
3. Apakah setiap nama dimensi/metrik ada di [../resources/dimension.md](../resources/dimension.md) / [../resources/metric.md](../resources/metric.md)?
4. Apakah kombinasi dimensi+metrik cocok dengan **satu** tipe laporan yang didukung?
5. Apakah `dimensions` memuat lebih dari satu dimensi waktu (`day` dan `month` bersamaan)?
6. Apakah `province` dipakai tanpa filter `country==US`?
7. Apakah `liveOrOnDemand` dipakai bersama `averageViewPercentage`? Kombinasi itu ilegal.
8. Untuk laporan pemilik konten: apakah ada filter `video`, `channel`, `group`, atau kombinasi `claimedStatus`/`uploaderType`?
9. Untuk laporan playlist: apakah ada tepat satu filter `playlist` atau `group`?
10. Untuk laporan top videos/playlists/detail: apakah `sort` disertakan dan `maxResults` di bawah batas?
11. Apakah token memuat `youtube.readonly`?
12. Apakah metrik pendapatan diminta tanpa scope `yt-analytics-monetary.readonly`?
