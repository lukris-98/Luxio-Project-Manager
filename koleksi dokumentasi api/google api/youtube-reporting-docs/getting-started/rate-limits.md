# Rate Limits & Kuota

Model kuota YouTube Reporting API berbeda mendasar dari YouTube Analytics API dan YouTube Data API.

---

## 1. Model Kuota Reporting API

Pernyataan resmi Google pada tabel perbandingan Reporting API vs Analytics API:

| API | Model kuota |
|---|---|
| YouTube Analytics API | Server mengevaluasi setiap query untuk menentukan biaya kuotanya |
| **YouTube Reporting API** | **"Quota usage is not an issue because data is retrieved once and then filtered, sorted, and queried within the application."** |

Artinya: tidak ada model biaya per-unit seperti Data API (di mana `list` = 1 unit, `search` = 100 unit). Reporting API tidak mengenakan biaya kuota berdasarkan volume data yang diunduh, karena data diambil sekali lalu diolah di aplikasi.

> Catatan: dokumentasi YouTube Reporting API **tidak** mempublikasikan angka batas request per hari, per menit, atau per user. Angka riil untuk project Anda hanya bisa dilihat di Google Cloud Console → **APIs & Services → YouTube Reporting API → Quotas**. Setiap angka spesifik di luar sumber itu tidak dapat diverifikasi dan tidak dicantumkan di dokumen ini.

---

## 2. Kenapa Kuota Bukan Kendala Utama

Beban request Reporting API secara struktural rendah:

| Operasi | Frekuensi wajar per job | Alasan |
|---|---|---|
| `reportTypes.list` | Sekali saat setup, lalu berkala | Katalog jarang berubah |
| `jobs.create` | Sekali per tipe laporan, permanen | Job tidak perlu dibuat ulang |
| `jobs.list` | Sekali per eksekusi pipeline | Untuk memulihkan `JOB_ID` bila tidak tersimpan |
| `jobs.reports.list` | **1–2× per hari per job** | Laporan baru muncul harian |
| Unduh `downloadUrl` | 1× per laporan baru | Idempotensi mencegah unduh ulang |

Satu job dengan 1 laporan baru per hari hanya membutuhkan sekitar 2 request per hari. Sepuluh job = sekitar 20 request per hari. Ini jauh di bawah batas API Google mana pun.

---

## 3. Yang Sesungguhnya Menjadi Batas

| Batas riil | Nilai | Dampak |
|---|---|---|
| **Retensi laporan** | 60 hari (30 hari untuk laporan berisi data historis) | Pipeline yang mati lebih lama kehilangan data permanen |
| **Retensi laporan finansial system-managed** | 2 bulan | Rekonsiliasi keuangan harus dijalankan rutin |
| **Latensi produksi** | 24–48 jam | Polling lebih sering tidak mempercepat apa pun |
| **Ukuran file** | Tidak dipublikasikan; bisa besar untuk channel/content owner besar | Butuh unduhan streaming, bukan buffer penuh di memori |
| **Umur access token** | ±1 jam | Unduhan sangat panjang perlu token disegarkan lebih awal |
| **`downloadUrl`** | Maks. 1000 karakter | Jangan menyimpannya di kolom pendek |
| **Retensi metadata YouTube Data API** | 30 hari | Judul/nama channel yang di-cache wajib direfresh atau dihapus (Developer Policies III.E.4.b–III.E.4.d) |

> Prinsip: batas nyata Reporting API adalah **waktu**, bukan kuota. Rancang untuk tidak pernah melewatkan jendela 60 hari.

---

## 4. Frekuensi Polling yang Disarankan

| Skenario | Frekuensi `jobs.reports.list` | Alasan |
|---|---|---|
| Laporan harian standar | 1× per hari | Laporan baru muncul harian |
| Ingin menangkap backfill lebih cepat | 2–4× per hari | Laporan revisi bisa muncul kapan saja |
| Setelah job baru dibuat | 1× per hari selama 3 hari pertama | Backfill 30 hari terposting bertahap |
| Laporan system-managed (bulanan) | 1× per hari tetap wajar | `createdAfter` membuat request kosong sangat murah |
| Setelah error `5xx`/`429` | Exponential backoff | Lihat [../guides/error-handling.md](../guides/error-handling.md) |

Polling per menit tidak memberi keuntungan: YouTube memproduksi laporan sekali sehari.

---

## 5. Teknik Mengurangi Beban

### 5.1 `createdAfter` sebagai kursor

```bash
# Tanpa createdAfter: seluruh laporan dalam jendela retensi dikembalikan setiap kali.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Dengan createdAfter: hanya laporan yang belum pernah dilihat.
# Response biasanya {} — request paling murah yang bisa Anda buat.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?createdAfter=2026-09-08T11%3A04%3A22Z" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 5.2 `fields` untuk partial response

```bash
# Hanya minta field yang dipakai pipeline. Mengurangi payload, bukan jumlah request.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?fields=reports(id,startTime,endTime,createTime,downloadUrl),nextPageToken" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 5.3 `Accept-Encoding: gzip` pada unduhan

```bash
# Google secara eksplisit merekomendasikan gzip untuk unduhan laporan.
# Trade-off: CPU untuk dekompresi vs bandwidth — hampir selalu menguntungkan.
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o report.csv
```

### 5.4 `pageSize` yang wajar

```bash
# pageSize besar = lebih sedikit request. Server boleh mengembalikan lebih sedikit
# dari yang diminta; selalu ikuti nextPageToken sampai tidak ada lagi.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?pageSize=100" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Nilai maksimum `pageSize` tidak dipublikasikan. Discovery document hanya menyatakan: *"Server may return fewer report types than requested. If unspecified, server will pick an appropriate default."*

### 5.5 `quotaUser`

```bash
# Untuk aplikasi server-side yang melayani banyak akun YouTube dari satu project:
# quotaUser memisahkan atribusi kuota per pengguna. Maks. 40 karakter.
curl "https://youtubereporting.googleapis.com/v1/jobs?quotaUser=tenant-42" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 6. Perilaku Saat Dibatasi

| Status | Status kanonik | Arti | Tindakan |
|---|---|---|---|
| `429` | `RESOURCE_EXHAUSTED` | Batas request terlampaui | Exponential backoff + jitter |
| `403` | `PERMISSION_DENIED` | Bisa berarti API belum aktif atau scope kurang — **bukan** rate limit | Jangan retry; perbaiki konfigurasi |
| `500` / `503` | `INTERNAL` / `UNAVAILABLE` | Gangguan sisi server | Retry dengan backoff |

Perbedaan penting: `403` pada API Google bisa berarti kuota harian habis **atau** masalah izin. Periksa `error.status` dan `error.message` sebelum memutuskan retry. Detail: [errors.md](errors.md) dan [../guides/error-handling.md](../guides/error-handling.md).

---

## 7. Checklist Efisiensi Pipeline

| # | Praktik | Sudah? |
|---|---|---|
| 1 | `createdAfter` selalu diisi dari checkpoint tersimpan | |
| 2 | `report.id` dicek di database sebelum mengunduh | |
| 3 | `Accept-Encoding: gzip` aktif pada semua unduhan | |
| 4 | Unduhan memakai streaming ke disk, bukan buffer memori | |
| 5 | `fields` dipakai pada endpoint `list` | |
| 6 | Access token di-cache dan disegarkan dengan margin | |
| 7 | Scheduler harian, bukan polling ketat | |
| 8 | Retry hanya untuk `429` dan `5xx` | |
| 9 | Checkpoint hanya maju setelah impor sukses | |
| 10 | Alerting bila tidak ada laporan baru >3 hari | |
