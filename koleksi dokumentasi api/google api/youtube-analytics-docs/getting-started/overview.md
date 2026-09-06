# Overview — Model Laporan YouTube Analytics API v2

YouTube Analytics API v2 menghasilkan **laporan kustom** secara real-time. Berbeda dengan Reporting API yang mengunduh dataset besar terjadwal, di sini setiap request menghasilkan tepat satu tabel hasil.

- Base URL: `https://youtubeanalytics.googleapis.com/v2`
- Endpoint laporan: `GET /reports` (metode `reports.query`)
- Format respons: **JSON saja** (v2 tidak mendukung `alt=csv`)
- Autentikasi: OAuth 2.0 wajib; service account tidak didukung

---

## 1. Rumus Laporan

```
laporan = metrics × dimensions × filters × [startDate .. endDate]
```

| Elemen | Parameter | Wajib | Fungsi |
|---|---|---|---|
| Entitas | `ids` | Ya | Channel atau pemilik konten yang datanya diambil |
| Rentang tanggal | `startDate`, `endDate` | Ya | Periode data, format `YYYY-MM-DD` |
| Metrik | `metrics` | Ya | Angka yang diukur (`views`, `likes`, `estimatedMinutesWatched`) |
| Dimensi | `dimensions` | Tidak | Cara pengelompokan (`day`, `country`, `deviceType`) |
| Filter | `filters` | Tidak | Membatasi data (`country==ID`, `video==VIDEO_ID`) |
| Urutan | `sort` | Tidak (wajib pada beberapa laporan) | Kolom pengurut; awalan `-` = turun |
| Paginasi | `maxResults`, `startIndex` | Tidak | Jumlah baris dan offset 1-based |

### Dimensi menentukan jumlah baris

Setiap baris hasil punya **kombinasi nilai dimensi yang unik** — kombinasi itu berfungsi sebagai primary key baris tersebut.

| `dimensions` | Jumlah baris | Arti |
|---|---|---|
| *(kosong)* | 1 | Total untuk seluruh rentang tanggal |
| `day` | ≤ jumlah hari | Satu baris per hari |
| `country` | jumlah negara dengan data | Satu baris per negara |
| `day,country` | hari × negara | Satu baris per kombinasi |
| `ageGroup,gender` | 7 × 3 (maksimum) | Satu baris per kombinasi umur & gender |

### Filter tidak mengubah jumlah kolom

`filters=country==ID` **membatasi** data ke Indonesia, tetapi tidak menambah kolom `country` ke hasil. Untuk mendapat kolom `country`, dimensi `country` harus masuk ke `dimensions`.

Pengecualian penting: bila `filters` menyebut **beberapa nilai** untuk `video`, `playlist`, atau `channel`, filter tersebut boleh ditambahkan juga ke `dimensions` — bahkan bila laporan itu resminya tidak mencantumkan dimensi tersebut. Efeknya hasil dipecah per video/playlist/channel.

```bash
# Tanpa 'video' di dimensions → statistik 3 video DIGABUNG jadi satu baris per sumber trafik.
--data-urlencode "dimensions=insightTrafficSourceType" \
--data-urlencode "filters=video==ID_A,ID_B,ID_C"

# Dengan 'video' di dimensions → statistik DIPISAH per video per sumber trafik.
--data-urlencode "dimensions=insightTrafficSourceType,video" \
--data-urlencode "filters=video==ID_A,ID_B,ID_C"
```

---

## 2. Struktur Respons

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "day",   "columnType": "DIMENSION", "dataType": "STRING"  },
    { "name": "views", "columnType": "METRIC",    "dataType": "INTEGER" }
  ],
  "rows": [
    ["2026-01-01", 1234],
    ["2026-01-02", 1455]
  ]
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `kind` | string | Selalu `youtubeAnalytics#resultTable` untuk `reports.query` |
| `columnHeaders[]` | list | Urutan: dimensi dulu (sesuai `dimensions`), lalu metrik (sesuai `metrics`) |
| `columnHeaders[].name` | string | Nama dimensi atau metrik |
| `columnHeaders[].columnType` | string | `DIMENSION` atau `METRIC` |
| `columnHeaders[].dataType` | string | `STRING`, `INTEGER`, `FLOAT`, dan lain-lain |
| `rows[]` | list of list | Nilai per baris, urutannya sama dengan `columnHeaders` |

> Prinsip: `rows` **dihilangkan sama sekali** bila tidak ada data. Kode harus menangani `rows === undefined`, bukan hanya `rows.length === 0`.

Detail pemetaan kolom: [../resources/report.md](../resources/report.md).

---

## 3. Dimensi Inti vs Non-Inti

API tunduk pada Deprecation Policy dalam Terms of Service, tetapi **hanya untuk dimensi dan metrik inti**. Dimensi/metrik non-inti dapat diubah atau dihapus tanpa masa transisi.

| Dimensi inti | Metrik inti |
|---|---|
| `ageGroup`, `channel`, `country`, `day`, `gender`, `month`, `sharingService`, `uploaderType`, `video` | `annotationClickThroughRate`, `annotationCloseRate`, `averageViewDuration`, `comments`, `dislikes`, `engagedViews`, `estimatedMinutesWatched`, `estimatedRevenue`, `likes`, `shares`, `subscribersGained`, `subscribersLost`, `viewerPercentage`, `views` |

> Catatan: `averageViewPercentage`, `redViews`, `deviceType`, `insightTrafficSourceType`, dan seluruh metrik kartu/anotasi selain dua rasio di atas adalah **non-inti**. Jangan jadikan pondasi fitur jangka panjang tanpa rencana cadangan.

---

## 4. Tiga Keluarga Laporan

| Keluarga | `ids` | Isi | File |
|---|---|---|---|
| Laporan video (channel) | `channel==MINE` / `channel==CHANNEL_ID` | Aktivitas pengguna atas video channel | [../guides/channel-reports.md](../guides/channel-reports.md) |
| Laporan playlist | idem, + filter `playlist`/`group` wajib | View yang terjadi dalam konteks playlist | [../guides/channel-reports.md](../guides/channel-reports.md) |
| Laporan pemilik konten | `contentOwner==CONTENT_OWNER_ID` | Agregat semua channel tertaut, termasuk pendapatan | [../guides/content-owner-reports.md](../guides/content-owner-reports.md) |

---

## 5. Batasan Data yang Harus Diketahui Sejak Awal

| Batasan | Detail |
|---|---|
| Zona waktu | Semua tanggal = 00:00–23:59 **Pacific Time** (UTC-7/UTC-8). Hari peralihan DST berdurasi 23 atau 25 jam. |
| Data terbaru | Respons berisi data sampai hari terakhir di mana **semua metrik dalam kueri** sudah tersedia. Laporan berdimensi `day` tidak memuat baris untuk hari-hari terbaru. |
| Item terhapus | Laporan per-item (mis. per video) tidak memuat item yang sudah dihapus; laporan agregat tetap memuat kontribusinya. Akibatnya total agregat bisa lebih besar daripada jumlah baris per-item. |
| Anonimisasi | Data demografi, geografi, dan detail sumber trafik disembunyikan bila di bawah ambang batas yang tidak dipublikasikan. Metrik pendapatan tidak dikenai ambang geografi. |
| Metadata | Analytics API hanya mengembalikan ID. Judul/thumbnail harus diambil dari YouTube Data API v3 dan wajib dihapus atau diperbarui maksimum setiap 30 hari. |

Detail lengkap: [rate-limits.md](rate-limits.md).

---

## 6. Endpoint Grup

Selain `/reports`, API menyediakan pengelolaan **grup**: koleksi kustom berisi maksimum 500 video, playlist, channel, atau aset yang bertipe sama. Grup dipakai sebagai filter (`filters=group==GROUP_ID`) sehingga satu laporan bisa merangkum sekelompok resource sekaligus.

| Endpoint | Operasi |
|---|---|
| `GET /groups` | Daftar grup |
| `POST /groups` | Buat grup |
| `PUT /groups` | Ubah nama grup |
| `DELETE /groups` | Hapus grup |
| `GET /groupItems` | Daftar isi grup |
| `POST /groupItems` | Tambah item |
| `DELETE /groupItems` | Hapus item |

Detail: [../reference-api/groups.md](../reference-api/groups.md), [../reference-api/group-items.md](../reference-api/group-items.md), [../guides/groups-and-custom-segments.md](../guides/groups-and-custom-segments.md).

---

## Selanjutnya

- Aktifkan API: [enable-api.md](enable-api.md)
- Siapkan OAuth: [authentication.md](authentication.md)
- Request pertama: [quickstart.md](quickstart.md)
