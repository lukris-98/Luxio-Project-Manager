# Resumable Upload — Protokol Lengkap

Protokol resumable upload Google API untuk `videos.insert`. Wajib dipakai kalau file besar, koneksi tidak stabil, atau kamu butuh indikator progres.

- Dokumentasi resmi: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
- Endpoint upload: `https://www.googleapis.com/upload/youtube/v3/videos`
- Batas file: 256 GB. MIME diterima: `video/*` atau `application/octet-stream`.

Kapan resumable lebih baik daripada multipart:

| Kondisi | Pakai |
|---|---|
| File kecil, koneksi stabil, tidak butuh progres | Multipart ([upload-video.md](upload-video.md)) |
| File besar | Resumable |
| Koneksi mobile / tidak stabil | Resumable |
| Butuh progress bar | Resumable |
| Perlu resume setelah gagal | Resumable |

---

## 1. Alur Empat Langkah

```
LANGKAH 1  POST  /upload/youtube/v3/videos?uploadType=resumable&part=...
           body = video resource (metadata JSON)
           header X-Upload-Content-Length + X-Upload-Content-Type
                     │
                     ▼
LANGKAH 2  200 OK + header  Location: <SESSION_URI>   ← SIMPAN URI INI
                     │
                     ▼
LANGKAH 3  PUT  <SESSION_URI>
           body = data biner file video
                     │
        ┌────────────┼──────────────────────────────┐
        ▼            ▼                              ▼
   201 Created   koneksi putus / 5xx           4xx atau 5xx lain
   video resource      │                        GAGAL PERMANEN
                       ▼
LANGKAH 4  PUT <SESSION_URI> dengan Content-Range: bytes */TOTAL
           → 308 Resume Incomplete + Range: bytes=0-N
           → lanjut PUT dari byte N+1
```

---

## 2. Langkah 1 — Mulai Sesi Resumable

```bash
# uploadType=resumable WAJIB; tanpa itu server memperlakukan request sebagai upload biasa.
# part menentukan properti yang kamu SET sekaligus properti yang dikembalikan di response.
curl -i -X POST \
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -H "X-Upload-Content-Length: 3000000" \
  -H "X-Upload-Content-Type: video/*" \
  -d '{
        "snippet": {
          "title": "My video title",
          "description": "This is a description of my video",
          "tags": ["cool", "video", "more keywords"],
          "categoryId": "22"
        },
        "status": {
          "privacyStatus": "public",
          "embeddable": true,
          "license": "youtube"
        }
      }'
```

Header yang wajib/perlu di langkah 1:

| Header | Nilai | Catatan |
|---|---|---|
| `Authorization` | `Bearer ACCESS_TOKEN` | Wajib. Scope: `youtube.upload` (atau `youtube` / `youtube.force-ssl` / `youtubepartner`) |
| `Content-Length` | Panjang body JSON | Tidak perlu kalau memakai chunked transfer encoding |
| `Content-Type` | `application/json; charset=UTF-8` | Ini tipe **metadata**, bukan tipe video |
| `X-Upload-Content-Length` | Ukuran file video dalam byte | Ukuran file yang akan dikirim di langkah 3 |
| `X-Upload-Content-Type` | `video/*` atau MIME spesifik | Harus konsisten dengan `Content-Type` di langkah 3 |

> Catatan: body langkah 1 hanya metadata JSON. Tidak ada byte video sama sekali di sini.

---

## 3. Langkah 2 — Simpan Session URI

```http
HTTP/1.1 200 OK
Location: https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=xa298sd_f&part=snippet,status,contentDetails
Content-Length: 0
```

`Location` adalah **session URI**. Semua request selanjutnya diarahkan ke URI ini.

> Prinsip: session URI punya masa hidup terbatas dan akhirnya kadaluarsa. Mulai upload segera setelah dapat URI, dan resume secepatnya setelah gangguan. Kalau URI sudah kadaluarsa, server membalas `404 Not Found` dan kamu harus mulai sesi baru dari langkah 1.

Kalau aplikasimu menyimpan session URI ke disk/database supaya bisa resume setelah restart, simpan juga: path file, ukuran total, dan waktu URI dibuat.

---

## 4. Langkah 3 — Kirim File Video

```bash
# Content-Length di sini = ukuran FILE, sama dengan X-Upload-Content-Length di langkah 1.
# Content-Type di sini = tipe FILE, sama dengan X-Upload-Content-Type di langkah 1.
curl -i -X PUT "SESSION_URI" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Length: 3000000" \
  -H "Content-Type: video/*" \
  --data-binary "@/path/ke/video.mp4"
```

| Hasil | Arti | Tindakan |
|---|---|---|
| `201 Created` + video resource | Sukses | Ambil `id` video dari body |
| Koneksi putus, tanpa response | Bisa di-resume | Lanjut ke langkah 4 |
| `500`, `502`, `503`, `504` | Bisa di-resume | Exponential backoff lalu langkah 4 |
| `404 Not Found` | Session URI kadaluarsa | Mulai ulang dari langkah 1 |
| `4xx` lain, atau `5xx` selain di atas | Gagal permanen | Baca `error.errors[].reason`, perbaiki request |

---

## 5. Langkah 4 — Resume Setelah Gagal

### 4.1 Cek status upload

```bash
# PUT KOSONG. Content-Length: 0 dan Content-Range dengan tanda bintang.
# */TOTAL artinya "aku tidak mengirim byte apa pun, beri tahu posisi terakhir".
curl -i -X PUT "SESSION_URI" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Length: 0" \
  -H "Content-Range: bytes */3000000"
```

### 4.2 Baca response

```http
308 Resume Incomplete
Content-Length: 0
Range: bytes=0-999999
```

| Response | Arti |
|---|---|
| `308 Resume Incomplete` + `Range: bytes=0-999999` | 1.000.000 byte pertama sudah terkirim (indeks berbasis 0) |
| `308` **tanpa** header `Range` | Belum ada byte yang terkirim sama sekali — mulai dari byte 0 |
| Response akhir yang sama seperti sebelumnya | Upload sebenarnya sudah selesai (sukses atau gagal). Jangan kirim ulang |

Kalau response menyertakan header `Retry-After`, pakai nilainya untuk menentukan kapan mencoba lagi.

### 4.3 Lanjutkan upload

```bash
# Range terakhir = 0-999999, jadi FIRST_BYTE = 1000000.
# LAST_BYTE = 2999999 (byte terakhir dari file 3.000.000 byte).
# Content-Length = 3000000 - 1000000 = 2000000.
curl -i -X PUT "SESSION_URI" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Length: 2000000" \
  -H "Content-Range: bytes 1000000-2999999/3000000" \
  --data-binary "@/path/ke/potongan-sisa.bin"
```

Rumus tiga nilai di `Content-Range: bytes FIRST-LAST/TOTAL`:

| Nilai | Cara hitung |
|---|---|
| `FIRST_BYTE` | Angka kedua di header `Range` + 1 |
| `LAST_BYTE` | Biasanya `TOTAL - 1` |
| `TOTAL_CONTENT_LENGTH` | Ukuran file penuh, sama seperti `X-Upload-Content-Length` di langkah 1 |

> Prinsip: **blok byte harus kontinu.** Kalau `Range` terakhir berakhir di 999999, byte pertama request berikutnya wajib 1000000. Kirim dari 999999 (tumpang tindih) atau 1000001 (melompat) → **tidak ada byte sama sekali yang tersimpan**.

---

## 6. Upload per Chunk

Alih-alih mengirim seluruh file dalam satu `PUT`, kamu bisa memotongnya jadi beberapa chunk.

> Catatan: pendekatan ini jarang diperlukan dan **secara resmi tidak dianjurkan** karena menambah jumlah request dan menurunkan performa. Alasan sah memakainya: menampilkan progress indicator pada jaringan yang sangat tidak stabil.

Aturan ukuran chunk:

| Aturan | Detail |
|---|---|
| Kelipatan 256 KB | Wajib, kecuali chunk terakhir |
| Ukuran seragam | Semua chunk harus sama besar, kecuali chunk terakhir |
| Lebih besar = lebih efisien | Chunk kecil = banyak request = lambat |

```bash
# Chunk pertama: 524.288 byte (256 KB x 2) dari file 2.000.000 byte.
curl -i -X PUT "SESSION_URI" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Length: 524288" \
  -H "Content-Type: video/*" \
  -H "Content-Range: bytes 0-524287/2000000" \
  --data-binary "@chunk-000.bin"
# → 308 Resume Incomplete, Range: bytes=0-524287
```

Setiap chunk selain yang terakhir dibalas `308`. Pakai angka atas dari header `Range` untuk menentukan awal chunk berikutnya. Chunk terakhir dibalas `201 Created` beserta resource `video`.

Kalau ada chunk yang terputus atau kena `5xx`: **jangan asumsikan** server menerima semua atau tidak menerima apa pun dari chunk itu. Selalu cek status (langkah 4.1) untuk tahu posisi sebenarnya, lalu lanjut dari sana.

> Catatan: kamu boleh meminta status upload di antara chunk kapan saja, tidak harus setelah terjadi gangguan.

---

## 7. Implementasi Node.js Tanpa Client Library

```js
import fs from 'node:fs';

const TOTAL = fs.statSync(FILE_PATH).size;

// LANGKAH 1 + 2 — buka sesi, ambil session URI dari header Location.
async function startSession(accessToken, metadata) {
  const res = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(TOTAL),
        'X-Upload-Content-Type': 'video/*',
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!res.ok) throw new Error(`Gagal membuka sesi: ${res.status}`);
  return res.headers.get('location'); // ← session URI
}

// LANGKAH 4.1 — tanya server sudah sampai byte berapa.
async function getOffset(sessionUri, accessToken) {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Length': '0',
      'Content-Range': `bytes */${TOTAL}`,
    },
  });

  if (res.status === 201 || res.status === 200) return { done: true, body: await res.json() };
  if (res.status === 404) throw new Error('Session URI kadaluarsa, mulai ulang langkah 1');
  if (res.status !== 308) throw new Error(`Status tak terduga: ${res.status}`);

  const range = res.headers.get('range'); // contoh: "bytes=0-999999"
  // Tanpa header Range = belum ada byte yang tersimpan.
  const offset = range ? Number(range.split('-')[1]) + 1 : 0;
  return { done: false, offset };
}

// LANGKAH 3 / 4.3 — kirim sisa file mulai dari offset.
async function uploadFrom(sessionUri, accessToken, offset) {
  const res = await fetch(sessionUri, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Length': String(TOTAL - offset),
      'Content-Type': 'video/*',
      // Byte pertama harus tepat offset — kontinu, tanpa tumpang tindih atau lompatan.
      'Content-Range': `bytes ${offset}-${TOTAL - 1}/${TOTAL}`,
    },
    body: fs.createReadStream(FILE_PATH, { start: offset }),
    duplex: 'half', // diperlukan Node fetch saat body berupa stream
  });
  return res;
}

// Orkestrasi dengan exponential backoff untuk 5xx dan koneksi putus.
async function uploadWithResume(accessToken, metadata) {
  const sessionUri = await startSession(accessToken, metadata);
  let offset = 0;
  let attempt = 0;

  while (attempt < 6) {
    try {
      const res = await uploadFrom(sessionUri, accessToken, offset);
      if (res.status === 201) return res.json(); // sukses
      if (![500, 502, 503, 504].includes(res.status)) {
        throw new Error(`Gagal permanen: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      if (attempt === 5) throw e; // koneksi putus terus-menerus
    }

    // Backoff: 1s, 2s, 4s, 8s, 16s + jitter.
    await new Promise((r) => setTimeout(r, 2 ** attempt * 1000 + Math.random() * 1000));
    attempt += 1;

    const status = await getOffset(sessionUri, accessToken);
    if (status.done) return status.body;
    offset = status.offset; // resume dari posisi nyata di server, bukan dari asumsi
  }
  throw new Error('Upload gagal setelah beberapa percobaan');
}
```

---

## 8. Implementasi Python dengan Client Library

`google-api-python-client` menangani protokol ini untuk kamu lewat `MediaFileUpload(resumable=True)` dan `next_chunk()`.

```python
import random
import time

import httplib2
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

RETRIABLE_STATUS_CODES = [500, 502, 503, 504]
MAX_RETRIES = 10


def resumable_upload(youtube, file_path, body):
    # chunksize=-1 → kirim file dalam satu request, biarkan library yang resume.
    # Pakai kelipatan 256*1024 (mis. 1024*1024*4) kalau kamu butuh progres per chunk.
    media = MediaFileUpload(file_path, chunksize=-1, resumable=True, mimetype="video/*")
    request = youtube.videos().insert(part=",".join(body.keys()), body=body, media_body=media)

    response = None
    error = None
    retry = 0

    while response is None:
        try:
            # next_chunk() mengembalikan (status, response).
            # status.progress() = 0.0..1.0 → pakai untuk progress bar.
            status, response = request.next_chunk()
            if status:
                print(f"Progres: {int(status.progress() * 100)}%")
            if response is not None and "id" not in response:
                raise RuntimeError(f"Upload gagal, response tak terduga: {response}")
        except HttpError as e:
            if e.resp.status in RETRIABLE_STATUS_CODES:
                error = f"HTTP {e.resp.status} sementara: {e.content}"
            else:
                raise  # 4xx = bug di request kita, jangan retry
        except (OSError, httplib2.HttpLib2Error) as e:
            error = f"Gangguan koneksi: {e}"  # bisa di-resume

        if error is not None:
            retry += 1
            if retry > MAX_RETRIES:
                raise RuntimeError("Menyerah setelah batas retry")
            # Exponential backoff dengan jitter acak.
            sleep_seconds = random.random() * (2 ** retry)
            print(f"{error} — tunggu {sleep_seconds:.1f}s lalu coba lagi")
            time.sleep(sleep_seconds)
            error = None

    return response  # video resource lengkap, termasuk id
```

---

## 9. Checklist Debug

| Gejala | Kemungkinan penyebab |
|---|---|
| `404` saat `PUT` ke session URI | URI kadaluarsa — mulai ulang langkah 1 |
| `400 wrongUrlForUpload` | Request dikirim ke `www.googleapis.com/youtube/v3/videos`, bukan ke prefix `/upload/` |
| `400 notUpload` | Request non-upload dikirim ke URI `/upload/*` |
| `400 mediaBodyRequired` | Body langkah 3 kosong |
| Tidak ada byte tersimpan padahal `200`/`308` | `Content-Range` tidak kontinu (tumpang tindih atau melompat) |
| `416 requestedRangeNotSatisfiable` | Range yang diminta tidak valid untuk sesi ini |
| `400 invalidVideoMetadata` | `part=snippet` dikirim tanpa `snippet.title` **dan** `snippet.categoryId` |
| Video jadi `private` padahal diminta `public` | API project belum diaudit — lihat [../getting-started/rate-limits.md](../getting-started/rate-limits.md) |

Lanjutan: [upload-video.md](upload-video.md) untuk metadata dan status prosesing, [error-handling.md](error-handling.md) untuk pola retry umum.
