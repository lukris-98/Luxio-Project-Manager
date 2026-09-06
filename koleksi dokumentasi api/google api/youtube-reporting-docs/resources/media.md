# Resource: `media` — Mekanisme Unduh

Isi laporan tidak dikembalikan lewat JSON. Data mentah diambil sebagai file `.csv` melalui mekanisme media download.

- Method: `media.download`
- Path: `GET /v1/media/{+resourceName}?alt=media`
- ID method (discovery): `youtubereporting.media.download`
- Deskripsi resmi: *"Method for media download. Download is supported on the URI `/v1/media/{+name}?alt=media`."*

---

## 1. Dua Cara Mengunduh

| Cara | Kapan dipakai |
|---|---|
| **GET langsung ke `report.downloadUrl`** | Cara utama dan yang direkomendasikan dokumentasi bulk report. `downloadUrl` sudah lengkap; cukup tambahkan header |
| **`media.download` dengan `resourceName`** | Dipakai client library resmi. Berguna bila Anda membangun request lewat generated client |

Keduanya menuju layanan media yang sama. Dokumentasi resmi langkah 6 (Download the report) menyebut: *"Send an HTTP GET request to the `downloadUrl` obtained in step 5 to retrieve the report."*

---

## 2. Parameter `media.download`

| Parameter | Lokasi | Tipe | Wajib | Keterangan |
|---|---|---|---|---|
| `resourceName` | path | `string` | Ya | Nama media yang diunduh. Pola: `^.*$` (bebas, termasuk garis miring) |
| `alt` | query | `media` | Ya untuk unduh | Tanpa `alt=media`, response berupa metadata JSON, bukan file |

Properti method (dari discovery document):

| Properti | Nilai |
|---|---|
| `httpMethod` | `GET` |
| `supportsMediaDownload` | `true` |
| `useMediaDownloadService` | `true` |
| `scopes` | `yt-analytics.readonly`, `yt-analytics-monetary.readonly` |
| `response` | `GdataMedia` (metadata media internal, bukan isi laporan) |

Karena `resourceName` memakai pola `{+resourceName}` (path segment yang boleh memuat `/`), nilainya **tidak** boleh Anda susun manual. Ambil `downloadUrl` dari resource `report` dan pakai apa adanya.

---

## 3. Request Unduh yang Benar

```bash
# -L         : ikuti redirect ke layanan media
# -H Auth    : WAJIB. downloadUrl bukan URL bertanda tangan publik
# -H Accept-Encoding: gzip + --compressed : hemat bandwidth, curl mendekompresi otomatis
# -o FILE    : tulis ke disk, jangan ke stdout — file bisa besar
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" \
  --compressed \
  -o "channel_basic_a3_2026-09-04.csv"
```

Bentuk eksplisit dengan `media.download`:

```bash
# Hanya bila Anda memang punya resourceName dari client library.
# alt=media WAJIB; tanpanya Anda mendapat JSON metadata.
curl -L "https://youtubereporting.googleapis.com/v1/media/RESOURCE_NAME?alt=media" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o report.csv
```

---

## 4. Header `Authorization`

| Aspek | Detail |
|---|---|
| Wajib | Ya, untuk setiap unduhan |
| Format | `Authorization: Bearer ACCESS_TOKEN` |
| Tanpa header | `401 UNAUTHENTICATED` |
| Token kedaluwarsa di tengah unduhan | Bisa menyebabkan kegagalan pada koneksi yang panjang |
| Scope yang diterima | `yt-analytics.readonly` atau `yt-analytics-monetary.readonly` |

> Prinsip: segarkan access token **sebelum** memulai batch unduhan besar, bukan setelah menerima `401`. Berikan margin minimal 5 menit dari `expires_in`.

Kesalahan yang sering terjadi: menyalin `downloadUrl` ke browser atau ke `wget` tanpa header. Hasilnya `401`, dan URL itu terlihat "rusak" padahal valid.

---

## 5. Kompresi gzip

Rekomendasi resmi: *"You can reduce the bandwidth needed to download reports by enabling gzip compression on download requests. While your application will need additional CPU time to uncompress API responses, the benefit of consuming fewer network resources usually outweighs that cost."*

```
Accept-Encoding: gzip
```

| Klien | Cara mengaktifkan |
|---|---|
| curl | `-H "Accept-Encoding: gzip" --compressed` |
| Node.js `fetch` (undici) | Dekompresi otomatis untuk `gzip`/`br` bila server mengirim `Content-Encoding` |
| Python `requests` | Otomatis mengirim `Accept-Encoding` dan mendekompresi |
| `googleapis` (Node.js) | Client library menangani encoding |
| `google-api-python-client` | Client library menangani encoding |

Jangan mengirim `Accept-Encoding: gzip` **tanpa** mendekompresi hasilnya — file CSV akan tampak sebagai byte biner yang tidak bisa diparse.

---

## 6. File Berukuran Besar

Ukuran laporan tidak dipublikasikan dan bergantung pada volume channel atau content owner. Untuk content owner besar, satu laporan harian bisa memuat jutaan baris.

| Risiko | Mitigasi |
|---|---|
| Buffer seluruh file ke memori | Streaming ke disk, lalu proses baris per baris |
| Parse CSV dengan `split('\n')` | Pakai parser CSV streaming yang menangani quoting |
| Token kedaluwarsa saat stream | Segarkan token sebelum mulai; batasi durasi per unduhan |
| Koneksi terputus, file terpotong | Unduh ke `.part`, rename atomik setelah tuntas |
| Disk penuh | Cek ruang bebas sebelum batch; hapus file setelah impor sukses |
| Impor sebagian lalu gagal | Impor dalam satu transaksi, atau tandai selesai hanya setelah commit |

Pola unduhan streaming yang aman (Node.js):

```js
import { createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Unduh ke .part lalu rename: file final hanya ada jika unduhan tuntas.
// Ini membuat "apakah laporan ini sudah terunduh?" bisa dijawab dari filesystem.
async function downloadReport(downloadUrl, accessToken, destPath) {
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept-Encoding': 'gzip',      // undici mendekompresi otomatis
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    // Baca body error sebagai teks: response error berupa JSON, bukan CSV.
    throw new Error(`unduh gagal ${res.status}: ${await res.text()}`);
  }

  const tmp = `${destPath}.part`;
  // Stream langsung ke disk — tidak pernah menahan seluruh file di memori.
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  await rename(tmp, destPath);        // atomik pada filesystem yang sama
  return destPath;
}
```

Pola streaming (Python):

```python
import requests, os

def download_report(download_url: str, access_token: str, dest_path: str) -> str:
    headers = {"Authorization": f"Bearer {access_token}"}
    # stream=True: jangan muat seluruh body ke memori.
    with requests.get(download_url, headers=headers, stream=True, timeout=(10, 300)) as r:
        r.raise_for_status()
        tmp = dest_path + ".part"
        with open(tmp, "wb") as f:
            # chunk 1 MiB: kompromi antar syscall dan penggunaan memori.
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
        os.replace(tmp, dest_path)   # atomik
    return dest_path
```

---

## 7. Bentuk File yang Diterima

| Karakteristik | Nilai |
|---|---|
| Format | `.csv` berversi, comma-separated |
| Baris pertama | Header row berisi nama kolom |
| Baris berikutnya | Data; jumlahnya bisa 0 |
| Urutan kolom | **Tidak dijamin.** Tentukan indeks kolom dari header row |
| Kolom baru | Bisa muncul sewaktu-waktu sebagai metrik tambahan di header |
| Urutan baris | Tidak terurut |
| Baris tanpa metrik | Dihilangkan dari file |
| Baris total/ringkasan | Tidak ada |
| Enumerasi | Berupa **integer** yang harus dipetakan ke nilai teks |
| Hari tanpa data | File hanya berisi header row |

Praktik wajib menurut dokumentasi resmi:

> *"To determine the ordering of the report's columns, use the report's header row."*
> *"To future-proof your report processing, your application should expect the addition of new metrics to any report, and it should be prepared to process and incorporate these new columns as they appear."*

```python
import csv

# Petakan nama kolom → indeks dari header. Jangan pakai indeks hardcoded.
with open("report.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)                        # baris pertama = nama kolom
    idx = {name: i for i, name in enumerate(header)}

    # Kolom yang belum dikenal tetap tersimpan; jangan menolak file karena ada kolom baru.
    known = {"date", "channel_id", "video_id", "views", "watch_time_minutes"}
    unknown = [c for c in header if c not in known]
    if unknown:
        print(f"kolom baru terdeteksi: {unknown}")   # log, bukan error

    for row in reader:
        tanggal = row[idx["date"]]
        views = int(row[idx["views"]] or 0)          # sel kosong mungkin terjadi
```

---

## 8. Verifikasi Kelengkapan Unduhan

API tidak menyediakan checksum untuk isi laporan. Verifikasi yang praktis:

| Cek | Cara |
|---|---|
| File tidak kosong | Ukuran > 0 dan ada baris header |
| Header valid | Baris pertama memuat kolom yang diharapkan untuk `reportTypeId` tersebut |
| CSV terbentuk lengkap | Parser tidak melempar error di akhir file |
| `Content-Length` cocok (bila ada) | Bandingkan dengan ukuran file setelah dekompresi tidak berlaku — hanya valid untuk transfer tanpa gzip |
| Rename atomik | File final hanya ada bila unduhan tuntas |

```bash
# Cek minimal sebelum impor.
test -s report.csv || { echo "file kosong"; exit 1; }
head -1 report.csv | grep -q '^date,' || { echo "header tidak dikenali"; exit 1; }
```

---

## 9. Kesalahan Umum

| Gejala | Penyebab | Perbaikan |
|---|---|---|
| `401` saat mengunduh | Header `Authorization` tidak dikirim | Kirim `Bearer` token |
| `401` di tengah unduhan panjang | Token kedaluwarsa | Segarkan sebelum batch; beri margin |
| File berisi byte biner | Response gzip tidak didekompresi | Tambahkan `--compressed` atau dekompresi eksplisit |
| Response berupa JSON, bukan CSV | `alt=media` tidak diset pada `media.download` | Tambahkan `?alt=media` |
| Proses habis memori | Seluruh file dibaca ke memori | Streaming ke disk |
| CSV rusak di baris tertentu | Parsing dengan `split(',')` | Pakai parser CSV yang menangani quoting |
| `404` saat mengunduh | Laporan sudah lewat retensi | Ambil daftar terbaru via `jobs.reports.list` |
| Data ganda di database | Laporan revisi diimpor tanpa menghapus data lama | Terapkan replace-per-periode |

Detail parsing dan impor ke database: [../guides/download-and-parse.md](../guides/download-and-parse.md). Referensi endpoint: [../reference-api/media-download.md](../reference-api/media-download.md).
