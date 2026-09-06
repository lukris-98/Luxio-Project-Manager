# Kemampuan & Alur — Model Data YouTube Analytics API v2

API ini punya **empat konsep data** saja. Tidak ada resource "laporan" yang tersimpan di server: laporan dihitung saat diminta.

| Konsep | Bentuk | File |
|---|---|---|
| Tabel hasil laporan | `youtubeAnalytics#resultTable` — bukan resource yang bisa di-CRUD | [report.md](report.md) |
| Grup (segmen kustom) | `youtube#group` — resource nyata, bisa CRUD | [group.md](group.md) |
| Item grup | `youtube#groupItem` — resource nyata, bisa list/insert/delete | [group-item.md](group-item.md) |
| Dimensi & metrik | Bukan resource, tetapi **kosakata** parameter | [dimension.md](dimension.md), [metric.md](metric.md) |

---

## 1. Aliran Data Antar Konsep

```
      ┌──────────────────────────────────────────────────────────────┐
      │ groups (youtube#group)                                       │
      │   id, snippet.title, contentDetails.itemCount/itemType       │
      └───────────────┬──────────────────────────────────────────────┘
                      │ 1..500
                      ▼
      ┌──────────────────────────────────────────────────────────────┐
      │ groupItems (youtube#groupItem)                               │
      │   id (ID keanggotaan), groupId, resource.kind, resource.id   │
      └───────────────┬──────────────────────────────────────────────┘
                      │ dipakai sebagai filter
                      ▼
      filters=group==GROUP_ID
                      │
                      ▼
      ┌──────────────────────────────────────────────────────────────┐
      │ GET /reports                                                 │
      │   dimensions (kosakata) × metrics (kosakata) × filters × tgl │
      └───────────────┬──────────────────────────────────────────────┘
                      ▼
      ┌──────────────────────────────────────────────────────────────┐
      │ youtubeAnalytics#resultTable                                 │
      │   columnHeaders[] → peta nama→indeks                         │
      │   rows[][]        → nilai (dihilangkan bila tidak ada data)  │
      └───────────────┬──────────────────────────────────────────────┘
                      │ nilai dimensi 'video'/'playlist'/'channel' = ID saja
                      ▼
      YouTube Data API v3 (videos.list, playlists.list, channels.list)
      → judul, deskripsi, thumbnail. Cache maksimum 30 hari.
```

---

## 2. Field Mana untuk Apa

### `youtubeAnalytics#resultTable`

| Field | Untuk apa |
|---|---|
| `kind` | Verifikasi tipe respons; selalu `youtubeAnalytics#resultTable` |
| `columnHeaders[].name` | Membangun peta nama kolom → indeks array |
| `columnHeaders[].columnType` | Memisahkan kolom label (`DIMENSION`) dari kolom angka (`METRIC`) saat merender tabel/grafik |
| `columnHeaders[].dataType` | Memilih formatter: `INTEGER` (ribuan), `FLOAT` (desimal/persen), `STRING` (label) |
| `rows[][]` | Data aktual; posisi nilai mengikuti `columnHeaders` |

### `youtube#group`

| Field | Untuk apa |
|---|---|
| `id` | Dipakai sebagai nilai `filters=group==<id>` dan sebagai `groupId` saat menambah item |
| `snippet.title` | Label yang ditampilkan di UI; satu-satunya field yang bisa di-update |
| `snippet.publishedAt` | Menampilkan tanggal pembuatan (ISO 8601) |
| `contentDetails.itemCount` | Menampilkan "x dari 500 item" dan mencegah insert saat penuh |
| `contentDetails.itemType` | Menentukan jenis item yang boleh ditambahkan |

### `youtube#groupItem`

| Field | Untuk apa |
|---|---|
| `id` | **ID keanggotaan**, dipakai untuk `groupItems.delete`. Bukan ID video. |
| `groupId` | Grup induk |
| `resource.kind` | Jenis resource: `youtube#video`, `youtube#playlist`, `youtube#channel`, `youtubePartner#asset` |
| `resource.id` | ID video/playlist/channel/aset sebenarnya — ini yang dipakai untuk mengambil metadata |

> Prinsip: `groupItem.id` ≠ `groupItem.resource.id`. Salah satu penyebab paling umum error `groupItemNotFound` saat menghapus item adalah mengirim ID video sebagai `id`.

---

## 3. Kosakata Dimensi & Metrik

Dimensi dan metrik bukan resource JSON; keduanya adalah **daftar nama** yang boleh masuk parameter `dimensions`, `metrics`, dan `filters`.

| Kategori | Jumlah kelompok | File |
|---|---|---|
| Dimensi | 13 kelompok: Video/Playlist/Channel/Group, Geografi, Waktu, Lokasi pemutaran, Detail pemutaran, Sumber trafik, Perangkat & OS, Demografi, Berbagi, Audience retention, Livestream, Membership, Iklan, plus dimensi khusus pemilik konten | [dimension.md](dimension.md) |
| Metrik | 10 kelompok: View, Watch time, Engagement, Playlist, Anotasi, Kartu, Livestream, Audience retention, Membership, Pendapatan & performa iklan | [metric.md](metric.md) |

Aturan penting yang berlaku lintas kelompok:

| Aturan | Keterangan |
|---|---|
| Dimensi filter-only | `group`, `continent`, `subContinent`, `audienceType` hanya boleh di `filters`, tidak boleh di `dimensions` |
| Dimensi khusus pemilik konten | `channel`, `claimedStatus`, `uploaderType` |
| Satu dimensi waktu | `day` dan `month` tidak boleh bersamaan |
| `province` butuh negara | Wajib disertai `filters=country==US` |
| Inti vs non-inti | Hanya dimensi/metrik inti yang tunduk pada Deprecation Policy |

---

## 4. Konversi Respons ke Struktur Aplikasi

```js
// Satu fungsi yang dipakai untuk SEMUA laporan. Tidak ada asumsi indeks kolom.
export function parseResultTable(result) {
  const headers = result.columnHeaders ?? []
  const names = headers.map((h) => h.name)
  const types = Object.fromEntries(headers.map((h) => [h.name, h.dataType]))
  const dimensionNames = headers.filter((h) => h.columnType === 'DIMENSION').map((h) => h.name)
  const metricNames = headers.filter((h) => h.columnType === 'METRIC').map((h) => h.name)

  // rows DIHILANGKAN dari respons bila tidak ada data sama sekali.
  const rows = (result.rows ?? []).map((row) =>
    Object.fromEntries(names.map((name, i) => [name, row[i]]))
  )

  return { rows, dimensionNames, metricNames, types, isEmpty: rows.length === 0 }
}
```

```python
# Padanan Python.
def parse_result_table(result):
    headers = result.get('columnHeaders', [])
    names = [h['name'] for h in headers]
    return {
        'rows': [dict(zip(names, row)) for row in result.get('rows') or []],
        'dimension_names': [h['name'] for h in headers if h['columnType'] == 'DIMENSION'],
        'metric_names': [h['name'] for h in headers if h['columnType'] == 'METRIC'],
        'types': {h['name']: h['dataType'] for h in headers},
    }
```

---

## 5. Selanjutnya

| Kebutuhan | File |
|---|---|
| Detail `columnHeaders`/`rows` dan contoh pemetaan per tipe laporan | [report.md](report.md) |
| CRUD grup | [group.md](group.md), [../reference-api/groups.md](../reference-api/groups.md) |
| Kelola isi grup | [group-item.md](group-item.md), [../reference-api/group-items.md](../reference-api/group-items.md) |
| Nama persis semua dimensi | [dimension.md](dimension.md) |
| Nama persis semua metrik | [metric.md](metric.md) |
