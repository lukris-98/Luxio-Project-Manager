# Quickstart — Request `reports.query` Pertama

Target: satu respons `youtubeAnalytics#resultTable` yang berisi views harian channel Anda.

Prasyarat: API sudah aktif dan access token sudah ada. Lihat [enable-api.md](enable-api.md) dan [authentication.md](authentication.md).

---

## 1. Request Paling Minimal

Empat parameter wajib: `ids`, `startDate`, `endDate`, `metrics`.

```bash
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views"
```

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "views", "columnType": "METRIC", "dataType": "INTEGER" }
  ],
  "rows": [[48213]]
}
```

Satu baris karena tidak ada `dimensions`: nilai adalah total untuk seluruh rentang tanggal.

> Catatan: `--data-urlencode` dipakai karena nilai `ids` memuat `==` dan nilai `filters` memuat `;`. Tanpa encoding, shell dan server bisa salah membaca query string.

---

## 2. Tambah Dimensi Waktu

```bash
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched,averageViewDuration" \
  --data-urlencode "dimensions=day" \
  --data-urlencode "sort=day"
```

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    { "name": "day",                    "columnType": "DIMENSION", "dataType": "STRING"  },
    { "name": "views",                  "columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "estimatedMinutesWatched","columnType": "METRIC",    "dataType": "INTEGER" },
    { "name": "averageViewDuration",    "columnType": "METRIC",    "dataType": "INTEGER" }
  ],
  "rows": [
    ["2026-02-08", 1512, 4103, 162],
    ["2026-02-09", 1688, 4590, 163]
  ]
}
```

> Catatan: baris untuk 1–2 hari terbaru mungkin belum ada. Dokumentasi resmi menyatakan respons hanya memuat data sampai hari terakhir di mana **semua** metrik dalam kueri sudah tersedia, dan laporan berdimensi `day` tidak memuat baris untuk hari-hari terbaru.

---

## 3. Memetakan Kolom ke Nilai

Jangan hardcode indeks. Bangun peta dari `columnHeaders`.

```js
// Ubah { columnHeaders, rows } menjadi array objek yang enak dipakai UI.
function toObjects(result) {
  if (!result.rows) return []                        // rows DIHILANGKAN bila tidak ada data
  const names = result.columnHeaders.map((h) => h.name)
  return result.rows.map((row) =>
    Object.fromEntries(names.map((name, i) => [name, row[i]]))
  )
}

// → [{ day: '2026-02-08', views: 1512, estimatedMinutesWatched: 4103, ... }, ...]
```

```python
# Versi Python untuk hasil yang sama.
def to_dicts(result):
    rows = result.get('rows')            # None bila tidak ada data
    if not rows:
        return []
    names = [h['name'] for h in result['columnHeaders']]
    return [dict(zip(names, row)) for row in rows]
```

---

## 4. Contoh JavaScript (Google API Client Library)

```html
<script src="https://apis.google.com/js/api.js"></script>
<script>
  // 1) Minta izin. reports.query mewajibkan akses youtube.readonly.
  function authenticate() {
    return gapi.auth2.getAuthInstance()
      .signIn({
        scope: 'https://www.googleapis.com/auth/yt-analytics.readonly ' +
               'https://www.googleapis.com/auth/youtube.readonly'
      })
      .then(() => console.log('Sign-in berhasil'),
            (err) => console.error('Gagal sign-in', err))
  }

  // 2) Muat definisi API v2 lewat discovery document.
  function loadClient() {
    return gapi.client
      .load('https://youtubeanalytics.googleapis.com/$discovery/rest?version=v2')
      .then(() => console.log('GAPI client siap'),
            (err) => console.error('Gagal memuat client', err))
  }

  // 3) Jalankan kueri. Parameter sama persis dengan versi REST.
  function execute() {
    return gapi.client.youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
      dimensions: 'day',
      sort: 'day',
    }).then((response) => {
      // response.result berisi body JSON yang sudah diparse.
      console.log(response.result.columnHeaders, response.result.rows)
    }, (err) => console.error('Error eksekusi', err))
  }

  gapi.load('client:auth2', () => {
    gapi.auth2.init({ client_id: 'YOUR_CLIENT_ID' })
  })
</script>
<button onclick="authenticate().then(loadClient)">authorize and load</button>
<button onclick="execute()">execute</button>
```

---

## 5. Contoh Python (Installed App)

```python
# pip install --upgrade google-api-python-client
# pip install --upgrade google-auth google-auth-oauthlib google-auth-httplib2
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.readonly',
]
API_SERVICE_NAME = 'youtubeAnalytics'
API_VERSION = 'v2'
CLIENT_SECRETS_FILE = 'client_secret.json'   # hasil unduhan dari Cloud Console


def get_service():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    credentials = flow.run_local_server(port=0)
    return build(API_SERVICE_NAME, API_VERSION, credentials=credentials)


if __name__ == '__main__':
    # HANYA untuk uji lokal. Jangan aktifkan di produksi.
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    youtube_analytics = get_service()
    response = youtube_analytics.reports().query(
        ids='channel==MINE',
        startDate='2026-01-01',
        endDate='2026-01-31',
        metrics='estimatedMinutesWatched,views,likes,subscribersGained',
        dimensions='day',
        sort='day',
    ).execute()

    print(response)
```

---

## 6. Tiga Variasi Berguna Berikutnya

```bash
# A. Top 10 video. dimensions=video + sort WAJIB; maxResults <= 200.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=video" \
  --data-urlencode "sort=-views" \
  --data-urlencode "maxResults=10"

# B. Distribusi negara. 'country' sebagai dimensi → satu baris per negara.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=country" \
  --data-urlencode "sort=-views"

# C. Sumber trafik di Indonesia saja. Filter membatasi, tidak menambah kolom.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-08" \
  --data-urlencode "endDate=2026-03-07" \
  --data-urlencode "metrics=views,estimatedMinutesWatched" \
  --data-urlencode "dimensions=insightTrafficSourceType" \
  --data-urlencode "filters=country==ID" \
  --data-urlencode "sort=-views"
```

---

## 7. Kalau Gagal

| Kode | Langkah pemeriksaan |
|---|---|
| `400` | Format tanggal harus `YYYY-MM-DD`; cek ejaan setiap nama dimensi/metrik; cek kombinasi legal di [../guides/channel-reports.md](../guides/channel-reports.md) |
| `401` | Token kedaluwarsa; minta token baru |
| `403` | Scope kurang (`youtube.readonly` sering terlupa), atau akun bukan pemilik channel, atau API belum di-enable di project |
| `429` | Kuota terlampaui; terapkan exponential backoff — lihat [../guides/error-handling.md](../guides/error-handling.md) |

---

## Selanjutnya

- Semua parameter `reports.query`: [../reference-api/reports-query.md](../reference-api/reports-query.md)
- Daftar dimensi & metrik: [../resources/dimension.md](../resources/dimension.md), [../resources/metric.md](../resources/metric.md)
- Kombinasi legal per laporan: [../guides/channel-reports.md](../guides/channel-reports.md)
