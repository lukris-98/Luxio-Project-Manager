# Upload Video

Cara mengunggah video ke YouTube lewat `videos.insert`, mengatur metadata, status privasi, dan memantau prosesing.

- Endpoint: `POST https://www.googleapis.com/upload/youtube/v3/videos`
- Biaya kuota: bucket **Video Uploads** — 100 panggilan per hari, 1 unit per panggilan
- Batas file: **256 GB**
- MIME diterima: `video/*` atau `application/octet-stream`

Scope yang diterima (minimal satu):

| Scope | Catatan |
|---|---|
| `https://www.googleapis.com/auth/youtube.upload` | Paling sempit — hanya upload. Pilih ini. |
| `https://www.googleapis.com/auth/youtube` | Kelola akun YouTube secara umum |
| `https://www.googleapis.com/auth/youtube.force-ssl` | Sama seperti `youtube` + wajib HTTPS |
| `https://www.googleapis.com/auth/youtubepartner` | Untuk content partner |

> Prinsip: pakai `youtube.upload` kalau aplikasimu hanya mengunggah. Scope sempit = consent screen lebih mudah disetujui user dan verifikasi Google lebih ringan.

---

## 1. Batasan Wajib Diketahui Sebelum Menulis Kode

| Batasan | Detail |
|---|---|
| Project belum diaudit | Semua video yang diunggah lewat `videos.insert` dari API project **belum terverifikasi** yang dibuat setelah 28 Juli 2020 dipaksa jadi **private**, tidak peduli `status.privacyStatus` yang kamu kirim. Lepasnya lewat audit compliance. |
| Batas upload harian channel | Error `uploadLimitExceeded` = batas platform YouTube per channel, **bukan** kuota API. Tidak bisa dinaikkan lewat form kuota. |
| `snippet` butuh dua field | Kalau kamu mengirim `part=snippet`, `snippet.title` **dan** `snippet.categoryId` wajib diisi, kalau tidak → `invalidVideoMetadata`. |
| API key tidak cukup | Upload adalah operasi tulis. Wajib OAuth. Lihat [oauth-vs-apikey.md](oauth-vs-apikey.md). |

---

## 2. Properti yang Boleh Kamu Set

Hanya properti berikut yang bisa ditulis di `videos.insert`:

| Properti | Tipe | Arti |
|---|---|---|
| `snippet.title` | string | Judul. Maks 100 karakter, tidak boleh berisi `<` atau `>` |
| `snippet.description` | string | Deskripsi. Maks 5000 byte, tidak boleh berisi `<` atau `>` |
| `snippet.tags[]` | list | Tag. Total maks 500 karakter (koma antar item ikut dihitung; tag ber-spasi dihitung seolah diberi tanda kutip) |
| `snippet.categoryId` | string | ID kategori, ambil dari `videoCategories.list` |
| `snippet.defaultLanguage` | string | Bahasa `title`/`description` |
| `localizations.(key)` | object | Judul/deskripsi terjemahan; kuncinya kode bahasa |
| `localizations.(key).title` | string | Judul versi bahasa tersebut |
| `localizations.(key).description` | string | Deskripsi versi bahasa tersebut |
| `status.privacyStatus` | string | `private`, `public`, atau `unlisted` |
| `status.publishAt` | datetime | Jadwal publikasi. Hanya berlaku kalau `privacyStatus` = `private` dan video belum pernah dipublikasikan |
| `status.license` | string | `youtube` atau `creativeCommon` |
| `status.embeddable` | boolean | Boleh di-embed di situs lain |
| `status.publicStatsViewable` | boolean | Statistik lanjutan di watch page terlihat publik |
| `status.selfDeclaredMadeForKids` | boolean | Deklarasi konten untuk anak |
| `status.containsSyntheticMedia` | boolean | Deklarasi konten Altered/Synthetic (A/S) |
| `recordingDetails.recordingDate` | datetime | Tanggal perekaman |

> Catatan: `statistics`, `contentDetails.duration`, `player`, `processingDetails` dihitung YouTube dan **tidak bisa** kamu set. Kalau kamu menyebutnya di `part`, part itu tetap dikembalikan di response, hanya saja isinya tidak bisa kamu tulis.

Nilai `part` yang bisa dipakai di `videos.insert`:

```
brandPartner, contentDetails, fileDetails, id, liveStreamingDetails,
localizations, paidProductPlacementDetails, player, processingDetails,
recordingDetails, snippet, statistics, status, suggestions, topicDetails
```

Parameter query opsional:

| Parameter | Default | Arti |
|---|---|---|
| `notifySubscribers` | `true` | Kirim notifikasi ke subscriber. Set `false` kalau kamu mengunggah banyak video sekaligus |
| `onBehalfOfContentOwner` | — | Khusus YouTube content partner (CMS) |
| `onBehalfOfContentOwnerChannel` | — | Wajib jika `onBehalfOfContentOwner` dipakai |

---

## 3. Multipart Upload

Untuk file kecil dan koneksi stabil. Metadata + biner dikirim dalam satu request.

```bash
# uploadType=multipart. Body punya dua bagian: JSON metadata lalu biner video.
# --form membuat multipart/related dari dua bagian yang tipenya berbeda.
curl -X POST \
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -F "metadata=@meta.json;type=application/json" \
  -F "video=@video.mp4;type=video/*"
```

`meta.json`:

```json
{
  "snippet": {
    "title": "Judul video dari Luxio",
    "description": "Deskripsi video.\nBaris kedua.",
    "tags": ["luxio", "demo", "api"],
    "categoryId": "22",
    "defaultLanguage": "id"
  },
  "status": {
    "privacyStatus": "private",
    "selfDeclaredMadeForKids": false,
    "embeddable": true,
    "license": "youtube"
  }
}
```

Response `200`/`201` berisi resource `video` lengkap:

```json
{
  "kind": "youtube#video",
  "etag": "ETAG_VALUE",
  "id": "VIDEO_ID",
  "snippet": {
    "publishedAt": "2026-09-06T02:15:00Z",
    "channelId": "CHANNEL_ID",
    "title": "Judul video dari Luxio",
    "description": "Deskripsi video.\nBaris kedua.",
    "categoryId": "22",
    "liveBroadcastContent": "none"
  },
  "status": {
    "uploadStatus": "uploaded",
    "privacyStatus": "private",
    "license": "youtube",
    "embeddable": true,
    "publicStatsViewable": true,
    "madeForKids": false,
    "selfDeclaredMadeForKids": false
  }
}
```

> Catatan: `uploadStatus: "uploaded"` bukan berarti video sudah bisa ditonton. YouTube masih memproses. Lihat bagian 6.

---

## 4. Resumable Upload

Untuk file besar atau koneksi tidak stabil. Protokol lengkap ada di [resumable-upload.md](resumable-upload.md). Ringkasnya:

```bash
# LANGKAH 1 — buka sesi. Body hanya metadata JSON, tanpa byte video.
curl -i -X POST \
  "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -H "X-Upload-Content-Length: 104857600" \
  -H "X-Upload-Content-Type: video/mp4" \
  -d @meta.json
# → 200 OK, header Location: <SESSION_URI>

# LANGKAH 2 — kirim byte video ke SESSION_URI.
curl -i -X PUT "SESSION_URI" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Length: 104857600" \
  -H "Content-Type: video/mp4" \
  --data-binary "@video.mp4"
# → 201 Created + video resource
```

---

## 5. Status Privasi & Penjadwalan

| `privacyStatus` | Siapa yang bisa lihat |
|---|---|
| `private` | Hanya pemilik dan akun yang diberi akses |
| `unlisted` | Siapa pun yang punya link; tidak muncul di pencarian/daftar channel |
| `public` | Semua orang |

Menjadwalkan publikasi:

```json
{
  "status": {
    "privacyStatus": "private",
    "publishAt": "2026-09-10T09:00:00Z"
  }
}
```

Aturan `status.publishAt`:

1. Hanya bisa diset kalau `privacyStatus` = `private`.
2. Hanya bisa diset kalau video **belum pernah** dipublikasikan.
3. Kalau kamu men-set `publishAt` lewat `videos.update`, kamu **wajib** ikut mengirim `status.privacyStatus: "private"` walaupun videonya sudah private.
4. Menjadwalkan ke waktu di masa lalu = video langsung terbit, efeknya sama dengan mengubah `private` → `public`.

Alur aman untuk "unggah private dulu, publikasikan setelah verifikasi":

```bash
# 1. Unggah sebagai private.
# 2. Tunggu processingDetails.processingStatus = succeeded.
# 3. Baru ubah ke public.
curl -X PUT "https://www.googleapis.com/youtube/v3/videos?part=status" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": "VIDEO_ID", "status": { "privacyStatus": "public" } }'
```

> Prinsip: `videos.update` bersifat **replace per part**, bukan merge per field. Kalau kamu mengirim `part=status` dengan hanya `privacyStatus`, properti `status` lain bisa kembali ke default. Ambil dulu nilai sekarang dengan `videos.list?part=status`, ubah field yang perlu, lalu kirim objek `status` yang lengkap.

---

## 6. Memantau Prosesing

```bash
# processingDetails dan fileDetails hanya bisa diambil oleh pemilik video (butuh OAuth).
curl "https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=VIDEO_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

```json
{
  "items": [
    {
      "id": "VIDEO_ID",
      "status": { "uploadStatus": "uploaded", "privacyStatus": "private" },
      "processingDetails": {
        "processingStatus": "processing",
        "processingProgress": {
          "partsTotal": "1000",
          "partsProcessed": "420",
          "timeLeftMs": "48000"
        },
        "thumbnailsAvailability": "available",
        "fileDetailsAvailability": "available"
      }
    }
  ]
}
```

`status.uploadStatus`:

| Nilai | Arti |
|---|---|
| `uploaded` | File sudah diterima YouTube |
| `processed` | Sudah selesai diproses |
| `failed` | Gagal — cek `status.failureReason` |
| `rejected` | Ditolak — cek `status.rejectionReason` |
| `deleted` | Sudah dihapus |

`status.failureReason`: `codec`, `conversion`, `emptyFile`, `invalidFile`, `tooSmall`, `uploadAborted`.

`status.rejectionReason`: `claim`, `copyright`, `duplicate`, `inappropriate`, `legal`, `length`, `termsOfUse`, `trademark`, `uploaderAccountClosed`, `uploaderAccountSuspended`.

`processingDetails.processingStatus`:

| Nilai | Arti |
|---|---|
| `processing` | Masih diproses — lihat `processingProgress` |
| `succeeded` | Selesai |
| `failed` | Gagal — cek `processingFailureReason` (`other`, `streamingFailed`, `transcodeFailed`, `uploadFailed`) |
| `terminated` | Informasi prosesing sudah tidak tersedia |

Estimasi persentase:

```js
// partsTotal bisa NAIK saat YouTube memperbaiki estimasinya,
// jadi persentase yang dihitung bisa turun sesaat. Itu normal.
const percent = Math.floor(
  (100 * Number(processingProgress.partsProcessed)) / Number(processingProgress.partsTotal),
);
```

Pola polling yang hemat kuota:

```js
// videos.list = 1 unit. Interval 10s selama 10 menit = 60 unit. Aman.
// Jangan polling per detik: 600 unit untuk satu video itu pemborosan.
async function waitUntilProcessed(youtube, videoId, { intervalMs = 10_000, timeoutMs = 900_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await youtube.videos.list({ part: 'status,processingDetails', id: videoId });
    const item = data.items?.[0];
    const st = item?.processingDetails?.processingStatus;
    if (st === 'succeeded') return item;
    if (st === 'failed' || item?.status?.uploadStatus === 'rejected') {
      throw new Error(
        `Prosesing gagal: ${item?.processingDetails?.processingFailureReason ?? item?.status?.rejectionReason}`,
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout menunggu prosesing');
}
```

---

## 7. Setelah Upload: Thumbnail & Playlist

```bash
# thumbnails.set = 50 unit. Butuh scope youtube.upload / youtube / youtube.force-ssl.
curl -X POST "https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=VIDEO_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@thumb.jpg"

# playlistItems.insert = 50 unit. resourceId.kind wajib "youtube#video".
curl -X POST "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
        "snippet": {
          "playlistId": "PLAYLIST_ID",
          "resourceId": { "kind": "youtube#video", "videoId": "VIDEO_ID" }
        }
      }'
```

Detail: [../reference-api/thumbnails.md](../reference-api/thumbnails.md), [playlist-management.md](playlist-management.md).

---

## 8. Contoh Lengkap Node.js

```js
import fs from 'node:fs';
import { google } from 'googleapis';

// oauth2Client sudah punya credentials dengan scope youtube.upload.
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

const res = await youtube.videos.insert(
  {
    // part di sini juga menentukan properti apa yang dikembalikan.
    part: ['snippet', 'status'],
    notifySubscribers: false, // hindari spam notifikasi saat batch upload
    requestBody: {
      snippet: {
        title: 'Judul dari Luxio',
        description: 'Diunggah lewat YouTube Data API v3.',
        tags: ['luxio', 'automation'],
        categoryId: '22', // "People & Blogs" — verifikasi lewat videoCategories.list
        defaultLanguage: 'id',
      },
      status: {
        privacyStatus: 'private', // aman: publikasikan manual setelah dicek
        selfDeclaredMadeForKids: false,
      },
    },
    // media.body berupa stream → googleapis otomatis memakai resumable upload.
    media: { body: fs.createReadStream('./video.mp4') },
  },
  {
    // Callback progres byte terkirim.
    onUploadProgress: (evt) => {
      const total = fs.statSync('./video.mp4').size;
      process.stdout.write(`\r${Math.round((evt.bytesRead / total) * 100)}%`);
    },
  },
);

console.log('\nVideo ID:', res.data.id);
```

Versi Python: [../examples/python.md](../examples/python.md). Versi curl semua endpoint: [../examples/curl.md](../examples/curl.md).
