# Resource `report` — `youtubeAnalytics#resultTable`

`reports.query` tidak mengembalikan resource yang tersimpan; ia mengembalikan **tabel hasil** yang dihitung saat itu. Tabel ini tidak punya ID, tidak bisa diambil ulang, dan tidak bisa dimodifikasi.

---

## 1. Struktur

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    {
      "name": "string",
      "dataType": "string",
      "columnType": "string"
    }
  ],
  "rows": [
    [ "nilai kolom 1", 123, 45.6 ]
  ]
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `kind` | `string` | Selalu `youtubeAnalytics#resultTable` untuk metode `query` |
| `columnHeaders[]` | `list` | Deskripsi setiap kolom di `rows`. **Dimensi dulu** (urutan sesuai parameter `dimensions`), **lalu metrik** (urutan sesuai parameter `metrics`) |
| `columnHeaders[].name` | `string` | Nama dimensi atau metrik, mis. `day`, `views` |
| `columnHeaders[].columnType` | `string` | `DIMENSION` atau `METRIC` |
| `columnHeaders[].dataType` | `string` | Tipe data isi kolom: `STRING`, `INTEGER`, `FLOAT`, dan lainnya |
| `rows[]` | `list of list` | Setiap elemen adalah satu baris; urutan nilai persis mengikuti `columnHeaders`. **Field ini dihilangkan** bila tidak ada data |

> Prinsip: gunakan `columnHeaders` untuk menentukan posisi kolom. Jangan mengasumsikan `views` selalu kolom pertama hanya karena ia disebut pertama dalam deskripsi laporan.

Contoh urutan yang dijamin: request `dimensions=ageGroup,gender&metrics=viewerPercentage` menghasilkan kolom `ageGroup`, `gender`, `viewerPercentage` — dalam urutan itu.

---

## 2. Contoh Nyata

### A. Tanpa dimensi — satu baris total

```bash
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-01" \
  --data-urlencode "endDate=2026-02-28" \
  --data-urlencode "metrics=views,likes,comments,shares"
```

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "views",    "columnType": "METRIC", "dataType": "INTEGER" },
    { "name": "likes",    "columnType": "METRIC", "dataType": "INTEGER" },
    { "name": "comments", "columnType": "METRIC", "dataType": "INTEGER" },
    { "name": "shares",   "columnType": "METRIC", "dataType": "INTEGER" }
  ],
  "rows": [[48213, 3120, 214, 587]]
}
```

### B. Dimensi waktu — satu baris per hari

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "day",                     "columnType": "DIMENSION", "dataType": "STRING"  },
    { "name": "views",                   "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "estimatedMinutesWatched", "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "averageViewPercentage",   "columnType": "METRIC",    "dataType": "FLOAT"   }
  ],
  "rows": [
    ["2026-02-01", 1512, 4103, 41.2],
    ["2026-02-02", 1688, 4590, 39.8]
  ]
}
```

Nilai dimensi `day` berformat `YYYY-MM-DD`. Untuk dimensi `month`, formatnya `YYYY-MM`.

### C. Dua dimensi — produk kartesius baris

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "ageGroup",          "columnType": "DIMENSION", "dataType": "STRING" },
    { "name": "gender",            "columnType": "DIMENSION", "dataType": "STRING" },
    { "name": "viewerPercentage",  "columnType": "METRIC",    "dataType": "FLOAT"  }
  ],
  "rows": [
    ["age18-24", "female", 7.31],
    ["age18-24", "male",  11.84],
    ["age25-34", "female", 9.02],
    ["age25-34", "male",  18.47]
  ]
}
```

### D. Tidak ada data — `rows` hilang

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "country", "columnType": "DIMENSION", "dataType": "STRING"  },
    { "name": "views",   "columnType": "METRIC",    "dataType": "INTEGER" }
  ]
}
```

> Catatan: field `rows` **tidak ada sama sekali**, bukan array kosong. Kode `result.rows.length` akan melempar `TypeError`.

---

## 3. Memetakan Kolom ke Nilai

### JavaScript

```js
/**
 * Ubah tabel hasil menjadi array objek.
 * Aman terhadap: rows hilang, urutan kolom berubah, kolom tambahan.
 */
export function rowsToObjects(result) {
  if (!result?.rows) return []
  const names = result.columnHeaders.map((h) => h.name)
  return result.rows.map((row) => {
    const obj = {}
    for (let i = 0; i < names.length; i++) obj[names[i]] = row[i]
    return obj
  })
}

// Varian: ambil satu nilai skalar dari laporan tanpa dimensi.
export function scalar(result, metricName) {
  if (!result?.rows?.length) return null
  const idx = result.columnHeaders.findIndex((h) => h.name === metricName)
  return idx === -1 ? null : result.rows[0][idx]
}

// Varian: siapkan data untuk grafik garis (label + seri).
export function toSeries(result, dimensionName, metricNames) {
  const objs = rowsToObjects(result)
  return {
    labels: objs.map((o) => o[dimensionName]),
    series: metricNames.map((m) => ({ name: m, data: objs.map((o) => o[m]) })),
  }
}
```

### Python

```python
def rows_to_dicts(result):
    """Ubah resultTable menjadi list of dict. Aman bila 'rows' tidak ada."""
    rows = result.get('rows')
    if not rows:
        return []
    names = [h['name'] for h in result['columnHeaders']]
    return [dict(zip(names, row)) for row in rows]


def scalar(result, metric_name):
    """Ambil satu nilai dari laporan tanpa dimensi."""
    rows = result.get('rows')
    if not rows:
        return None
    names = [h['name'] for h in result['columnHeaders']]
    if metric_name not in names:
        return None
    return rows[0][names.index(metric_name)]
```

---

## 4. Tipe Data & Format Nilai

| `dataType` | Contoh nilai | Catatan format |
|---|---|---|
| `STRING` | `"2026-02-01"`, `"ID"`, `"ANDROID"`, `"age25-34"` | Nilai dimensi. Enumerasi memakai huruf besar, kecuali `ageGroup`/`gender` |
| `INTEGER` | `48213`, `4103`, `165` | `views`, `estimatedMinutesWatched` (menit), `averageViewDuration` (**detik**) |
| `FLOAT` | `41.2`, `0.87`, `1.34` | Persentase (`averageViewPercentage`, `viewerPercentage`), rasio (`audienceWatchRatio`), nilai uang, `cpm` |

Satuan yang mudah tertukar:

| Metrik | Satuan |
|---|---|
| `estimatedMinutesWatched`, `playlistEstimatedMinutesWatched`, `averageTimeInPlaylist` | Menit |
| `averageViewDuration`, `playlistAverageViewDuration` | Detik |
| `averageViewPercentage`, `viewerPercentage` | Persen (0–100) |
| `audienceWatchRatio` | Rasio absolut; bisa **lebih dari 1** bila segmen ditonton berulang |
| `relativeRetentionPerformance` | Rasio 0–1; 0,5 = median |
| `annotationClickThroughRate`, `annotationCloseRate`, `cardClickRate`, `cardTeaserClickRate` | Rasio |
| `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `cpm`, `playbackBasedCpm` | Mata uang sesuai parameter `currency` (default `USD`) |
| `grossRevenue` | **USD** |

---

## 5. Format CSV (v1 saja)

Dokumentasi resmi mencantumkan bentuk respons CSV, tetapi parameter `alt` **tidak didukung di v2** — v2 hanya JSON.

```
day, views, likes, ...
"2012-01-01", 12.0, 3, ...
"2012-01-02", 16.0, 2, ...
```

> Catatan: bila aplikasi membutuhkan CSV, konversi dilakukan di sisi klien dari `columnHeaders` + `rows`.

---

## 6. Praktik Terbaik Resmi

Dua praktik yang dinyatakan wajib pada dokumentasi model data:

1. **Gunakan header row respons untuk menentukan urutan kolom.** Jangan berasumsi berdasarkan urutan pada deskripsi laporan.
2. **Gunakan YouTube Data API untuk metadata resource** yang teridentifikasi dalam respons Analytics API. Sesuai YouTube API Services Developer Policies bagian III.E.4.b–III.E.4.d, metadata yang disimpan wajib dihapus atau diperbarui setelah 30 hari.

---

## Selanjutnya

- Parameter yang membentuk tabel ini: [../reference-api/reports-query.md](../reference-api/reports-query.md)
- Nama kolom yang mungkin muncul: [dimension.md](dimension.md), [metric.md](metric.md)
- Kombinasi legal per tipe laporan: [../guides/channel-reports.md](../guides/channel-reports.md)
