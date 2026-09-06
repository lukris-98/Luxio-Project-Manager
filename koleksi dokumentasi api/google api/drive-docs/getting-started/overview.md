# Overview — Google Drive API v3

Drive API adalah REST API untuk memakai penyimpanan Google Drive dari dalam aplikasi: mengunggah, mengunduh, mencari, membagikan, dan melacak perubahan file.

- Base URL: `https://www.googleapis.com/drive/v3`
- Base URL upload media: `https://www.googleapis.com/upload/drive/v3`
- Base URL batch: `https://www.googleapis.com/batch/drive/v3`
- Format: JSON. Autentikasi: OAuth 2.0 (`Authorization: Bearer ACCESS_TOKEN`).

---

## Istilah Kunci

| Istilah | Arti |
|---|---|
| **My Drive** | Ruang penyimpanan milik satu user. File di dalamnya punya `owners`. |
| **Shared drive** | Ruang penyimpanan yang dimiliki tim/organisasi, bukan individu. File di dalamnya punya `driveId`, bukan `owners`. |
| **Blob file** | File biner biasa (gambar, video, PDF, zip). Bisa diunduh dengan `alt=media`. |
| **Google Workspace / Docs Editors file** | Docs, Sheets, Slides, Drawings, Forms, dsb. Tidak punya isi biner → harus di-**export**. |
| **Folder** | File dengan `mimeType` `application/vnd.google-apps.folder`, tanpa isi biner. |
| **Shortcut** | File dengan `mimeType` `application/vnd.google-apps.shortcut` yang menunjuk file lain. |
| **Space** | Lokasi penyimpanan logis: `drive`, `appDataFolder`, `photos`. |
| **Corpora** | Kumpulan item yang dicari: `user`, `domain`, `drive`, `allDrives`. |

## Model Resource

| Resource | Isi | Endpoint utama | Dokumen |
|---|---|---|---|
| `files` | Metadata file/folder/shortcut + isi biner | `files.*` | [../resources/file.md](../resources/file.md) |
| `drives` | Shared drive | `drives.*` | [../resources/drive.md](../resources/drive.md) |
| `permissions` | ACL per file/folder/shared drive | `permissions.*` | [../resources/permission.md](../resources/permission.md) |
| `revisions` | Versi historis file | `revisions.*` | [../resources/revision.md](../resources/revision.md) |
| `comments` | Komentar pada file | `comments.*` | [../resources/comment.md](../resources/comment.md) |
| `replies` | Balasan pada komentar | `replies.*` | [../resources/reply.md](../resources/reply.md) |
| `changes` | Change log user & shared drive | `changes.*` | [../resources/change.md](../resources/change.md) |
| `about` | Info user, kuota, format ekspor/impor | `about.get` | [../resources/about.md](../resources/about.md) |
| `channels` | Kanal notifikasi push | `channels.stop` | [../reference-api/channels.md](../reference-api/channels.md) |

Resource tambahan yang tersedia di v3 tetapi di luar cakupan dokumen ini: `apps`, `accessproposals`, `approvals`, `operations`, `teamdrives` (deprecated, gantinya `drives`).

## Hierarki & Alias ID

| Nilai `fileId` | Arti |
|---|---|
| ID biasa | ID file/folder, mis. `1AbCdEfGhIjKlMnOpQrStUvWxYz` |
| `root` | Folder root My Drive user |
| `appDataFolder` | Folder data aplikasi (butuh scope `drive.appdata`) |
| ID shared drive | Sama dengan ID folder teratas shared drive tersebut |

Aturan penting: **satu file hanya boleh punya satu parent**. Field `parents` berbentuk array demi kompatibilitas, tetapi multi-parent tidak didukung lagi. Kalau butuh file muncul di beberapa lokasi, pakai shortcut.

## MIME Type Google Workspace

| MIME Type | Jenis |
|---|---|
| `application/vnd.google-apps.document` | Google Docs |
| `application/vnd.google-apps.spreadsheet` | Google Sheets |
| `application/vnd.google-apps.presentation` | Google Slides |
| `application/vnd.google-apps.drawing` | Google Drawings |
| `application/vnd.google-apps.form` | Google Forms |
| `application/vnd.google-apps.script` | Google Apps Script |
| `application/vnd.google-apps.site` | Google Sites |
| `application/vnd.google-apps.vid` | Google Vids |
| `application/vnd.google-apps.jam` | Google Jamboard |
| `application/vnd.google-apps.map` | Google My Maps |
| `application/vnd.google-apps.folder` | Folder Drive |
| `application/vnd.google-apps.shortcut` | Shortcut Drive |
| `application/vnd.google-apps.drive-sdk` | Shortcut pihak ketiga |
| `application/vnd.google-apps.photo` | Google Photos |
| `application/vnd.google-apps.audio` | Audio Drive |
| `application/vnd.google-apps.video` | Video Drive |
| `application/vnd.google-apps.file` | File Drive generik |
| `application/vnd.google-apps.unknown` | Tidak dikenali |
| `application/vnd.google-apps.mail-layout` | Email layout |
| `application/vnd.google-apps.fusiontable` | Google Fusion Tables |
| `application/vnd.google-apps.pic` | Google Pics |
| `application/vnd.google-gemini.conversation` | Gemini Conversation |
| `application/vnd.google-gemini.gem` | Gemini Gem |

## Partial Response Wajib Dipahami

Drive v3 mengembalikan **subset field** secara default:

| Method | Default field |
|---|---|
| `files.list` | `kind`, `id`, `name`, `mimeType`, `resourceKey` (per file) |
| `files.get` | Set default terbatas (tidak termasuk `size`, `parents`, `permissions`, `capabilities`, dsb.) |
| `permissions.*` | `kind`, `id`, `type`, `role` selalu ada; sisanya harus diminta |
| `revisions.list` | `id`, `mimeType`, `kind`, `modifiedTime` |
| `about.get`, `comments.*`, `replies.*`, `approvals.*` | **Tidak ada default** — `fields` wajib, kalau tidak request gagal |

> Prinsip: selalu tulis `fields` secara eksplisit. Ini bukan optimasi opsional — untuk beberapa resource ini syarat agar request berhasil sama sekali. Detail: [../guides/fields-and-partial-response.md](../guides/fields-and-partial-response.md).

## Batasan Utama

| Batas | Nilai |
|---|---|
| Ukuran file maksimum yang bisa diunggah | 5 TB |
| Ukuran maksimum media pada `files.create`/`files.update` | 5.497.558.138.880 byte (5 TiB) |
| Unggah per user per hari (My Drive + semua shared drive) | 750 GB |
| Ukuran maksimum file yang bisa dicopy | 750 GB |
| Item per folder (My Drive & shared drive) | 500.000 |
| Kedalaman folder bersarang | 100 level |
| Item yang dibuat per akun | 500 juta |
| Hasil ekspor Google Workspace document | maksimum 10 MB |
| Revisi `keepForever` per file | 200 |
| Properti kustom per file | 100 total, 30 publik, 30 privat per aplikasi, 124 byte per properti |
| Panggilan per batch request | 100 |
| `pageSize` `files.list` | maksimum 1000 (default 100) |
| `pageSize` `changes.list` | maksimum 1000 (default 100) |
| `pageSize` `revisions.list` | maksimum 1000 (default 200) |
| `pageSize` `comments.list` / `replies.list` | maksimum 100 (default 20) |
| `pageSize` `drives.list` | maksimum 100 (default 10) |
| Masa berlaku session URI resumable upload | 1 minggu |
| Masa berlaku `expirationTime` permission | maksimum 1 tahun ke depan |

Kuota per menit dan quota units per method: [rate-limits.md](rate-limits.md).

## Apa yang Bisa & Tidak Bisa

Bisa:

- Mengunggah dan mengunduh file biner apa pun.
- Mengonversi upload menjadi Google Docs/Sheets/Slides (`importFormats`).
- Mengekspor Docs Editors ke PDF/DOCX/XLSX/PPTX/MD dan format lain (`exportFormats`).
- Mencari dengan query gabungan pada nama, isi (`fullText`), tanggal, pemilik, properti kustom, label.
- Mengelola ACL: user, grup, domain, `anyone` (link sharing), termasuk masa berlaku.
- Melacak perubahan lewat change log dan webhook push.
- Menyimpan data konfigurasi tersembunyi di `appDataFolder`.

Tidak bisa:

- Batch request untuk upload/download/export media.
- Multi-parent (satu file, banyak folder) — pakai shortcut.
- Memindahkan folder dari My Drive ke shared drive melalui API (`teamDrivesFolderMoveInNotSupported`).
- Membagikan atau men-trash file di dalam `appDataFolder`.
- Mengekspor Google Vids lewat `files.export` (pakai `files.download`).
- Mengunduh revisi blob yang tidak ditandai `keepForever`.

## Lanjut

- Aktifkan API: [enable-api.md](enable-api.md)
- Pilih scope: [authentication.md](authentication.md)
- Request pertama: [quickstart.md](quickstart.md)
