# Google Drive API v3 Documentation

Dokumentasi lengkap **Google Drive API v3** (Google) untuk mencari, mengunggah, mengunduh, membagikan, dan menyinkronkan file Google Drive secara programatis — mengikuti gaya dokumentasi `gmail-docs`, `neon-docs`, & `blogger-docs` di repo ini.

- Penyedia: Google (resmi, bukan pihak ketiga)
- Base URL: `https://www.googleapis.com/drive/v3`
- Base URL upload media: `https://www.googleapis.com/upload/drive/v3`
- Base URL batch: `https://www.googleapis.com/batch/drive/v3`
- Dokumentasi resmi: https://developers.google.com/workspace/drive
- Referensi REST: https://developers.google.com/workspace/drive/api/reference/rest/v3
- Discovery document (sumber field & scope akurat): https://www.googleapis.com/discovery/v1/apis/drive/v3/rest

> Prinsip: Drive v3 **tidak** mengembalikan semua field secara default. Hampir setiap request perlu parameter `fields`. Baca [guides/fields-and-partial-response.md](guides/fields-and-partial-response.md) sebelum menulis kode apa pun.

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | **Kemampuan setup + penjelasan kode kredensial baris per baris** |
| [getting-started/overview.md](getting-started/overview.md) | Pengenalan Drive API, model resource, jenis file, dan batasan |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Mengaktifkan Drive API di Google Cloud Console |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, pilihan scope, rekomendasi untuk Luxio |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Request pertama sampai unggah file pertama |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Quota units, kuota per menit, batas unggah harian |
| [getting-started/errors.md](getting-started/errors.md) | Daftar kode error + `reason` dan penanganannya |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | **Field mana untuk apa + aliran data antar resource** |
| [resources/file.md](resources/file.md) | Resource `File` — metadata inti Drive (paling lengkap) |
| [resources/drive.md](resources/drive.md) | Resource `Drive` — Shared Drive |
| [resources/permission.md](resources/permission.md) | Resource `Permission` — ACL, role, type |
| [resources/revision.md](resources/revision.md) | Resource `Revision` — versi file |
| [resources/comment.md](resources/comment.md) | Resource `Comment` — komentar (anchored/unanchored) |
| [resources/reply.md](resources/reply.md) | Resource `Reply` — balasan komentar |
| [resources/change.md](resources/change.md) | Resource `Change` — entri change log |
| [resources/about.md](resources/about.md) | Resource `About` — kuota penyimpanan & kapabilitas sistem |
| [resources/label.md](resources/label.md) | Resource `Label` + `LabelField` pada file |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | **Anatomi request + penjelasan kode per operasi** |
| [reference-api/files.md](reference-api/files.md) | list, get, create, update, copy, delete, emptyTrash, export, download, generateIds, watch, listLabels, modifyLabels |
| [reference-api/drives.md](reference-api/drives.md) | create, get, list, update, delete, hide, unhide |
| [reference-api/permissions.md](reference-api/permissions.md) | list, get, create, update, delete |
| [reference-api/revisions.md](reference-api/revisions.md) | list, get, update, delete |
| [reference-api/comments.md](reference-api/comments.md) | list, get, create, update, delete |
| [reference-api/replies.md](reference-api/replies.md) | list, get, create, update, delete |
| [reference-api/changes.md](reference-api/changes.md) | getStartPageToken, list, watch |
| [reference-api/about.md](reference-api/about.md) | get (kuota, exportFormats, importFormats) |
| [reference-api/channels.md](reference-api/channels.md) | stop (menutup kanal notifikasi) |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | **Walkthrough kode setiap guide** |
| [guides/search-query.md](guides/search-query.md) | Sintaks lengkap parameter `q`, operator, escaping |
| [guides/upload-and-download.md](guides/upload-and-download.md) | Simple, multipart, media; unduh binary vs export |
| [guides/resumable-upload.md](guides/resumable-upload.md) | Protokol resumable lengkap + resume setelah gagal |
| [guides/export-google-docs.md](guides/export-google-docs.md) | Tabel mimeType ekspor Docs/Sheets/Slides/Drawings |
| [guides/folders-and-shortcuts.md](guides/folders-and-shortcuts.md) | Folder, `parents`, pindah file, shortcut |
| [guides/permissions-and-sharing.md](guides/permissions-and-sharing.md) | Role, type, link sharing, transfer ownership |
| [guides/shared-drives.md](guides/shared-drives.md) | `supportsAllDrives`, `includeItemsFromAllDrives`, `corpora` |
| [guides/changes-and-watch.md](guides/changes-and-watch.md) | startPageToken, polling, push notification webhook |
| [guides/app-data-folder.md](guides/app-data-folder.md) | Folder `appDataFolder` tersembunyi milik aplikasi |
| [guides/fields-and-partial-response.md](guides/fields-and-partial-response.md) | Menyusun `fields` bersarang, hemat kuota & bandwidth |
| [guides/pagination.md](guides/pagination.md) | Pola `pageToken` untuk list besar |
| [guides/error-handling.md](guides/error-handling.md) | Retry, exponential backoff + jitter, 403 vs 429 |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | **Fungsi demi fungsi: kode mana melakukan apa** |
| [examples/curl.md](examples/curl.md) | Contoh curl semua endpoint utama |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js (`googleapis`) |
| [examples/python.md](examples/python.md) | Integrasi Python (`google-api-python-client`) |

---

## Ringkasan Endpoint Utama

Semua path relatif terhadap `https://www.googleapis.com/drive/v3`.

| Method | Path | Scope minimum |
|---|---|---|
| GET | `files` | `drive.metadata.readonly` / `drive.file` |
| GET | `files/{fileId}` | `drive.metadata.readonly` / `drive.file` |
| GET | `files/{fileId}?alt=media` | `drive.readonly` / `drive.file` |
| POST | `files` (metadata saja) | `drive.file` |
| POST | `/upload/drive/v3/files?uploadType=...` | `drive.file` |
| PATCH | `files/{fileId}` | `drive.file` |
| POST | `files/{fileId}/copy` | `drive.file` |
| DELETE | `files/{fileId}` | `drive.file` |
| DELETE | `files/trash` (emptyTrash) | `drive` |
| GET | `files/{fileId}/export?mimeType=...` | `drive.readonly` / `drive.file` |
| POST | `files/{fileId}/download` | `drive.readonly` / `drive.file` |
| GET | `files/generateIds` | `drive.file` |
| POST | `files/{fileId}/watch` | `drive.metadata.readonly` / `drive.file` |
| GET | `files/{fileId}/listLabels` | `drive.metadata.readonly` / `drive.file` |
| POST | `files/{fileId}/modifyLabels` | `drive.metadata` / `drive.file` |
| GET | `files/{fileId}/permissions` | `drive.metadata.readonly` / `drive.file` |
| POST | `files/{fileId}/permissions` | `drive.file` |
| PATCH/DELETE | `files/{fileId}/permissions/{permissionId}` | `drive.file` |
| GET | `files/{fileId}/revisions` | `drive.metadata.readonly` / `drive.file` |
| PATCH/DELETE | `files/{fileId}/revisions/{revisionId}` | `drive.file` |
| GET/POST | `files/{fileId}/comments` | `drive.readonly` (baca) / `drive.file` (tulis) |
| GET/POST | `files/{fileId}/comments/{commentId}/replies` | `drive.readonly` / `drive.file` |
| GET | `changes/startPageToken` | `drive.metadata.readonly` / `drive.file` |
| GET | `changes?pageToken=...` | `drive.metadata.readonly` / `drive.file` |
| POST | `changes/watch` | `drive.metadata.readonly` / `drive.file` |
| POST | `channels/stop` | `drive.metadata.readonly` / `drive.file` |
| GET | `about?fields=...` | `drive.metadata.readonly` / `drive.file` |
| GET/POST | `drives` | `drive.readonly` (baca) / `drive` (buat) |
| PATCH/DELETE | `drives/{driveId}` | `drive` |
| POST | `drives/{driveId}/hide` \| `unhide` | `drive` |

`{fileId}` menerima alias `root` (My Drive root) dan `appDataFolder` (folder data aplikasi).

Daftar scope lengkap per method: [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md).

---

## Scopes OAuth

### Non-sensitive — verifikasi OAuth paling ringan

| Scope | Akses |
|---|---|
| `https://www.googleapis.com/auth/drive.file` | Buat file baru, dan baca/ubah **hanya** file yang dibuat oleh aplikasi ini atau yang dipilih user lewat Google Picker / file picker aplikasi |
| `https://www.googleapis.com/auth/drive.appdata` | Kelola data konfigurasi milik aplikasi sendiri di folder `appDataFolder` (alias: `drive.appfolder`) |
| `https://www.googleapis.com/auth/drive.install` | Aplikasi muncul sebagai opsi di menu "Open with" / "New" pada Drive UI |

### Sensitive — butuh verifikasi OAuth tambahan

| Scope | Akses |
|---|---|
| `https://www.googleapis.com/auth/drive.apps.readonly` | Lihat daftar aplikasi yang diizinkan mengakses Drive user |

### Restricted — butuh verifikasi restricted scope + security assessment

| Scope | Akses |
|---|---|
| `https://www.googleapis.com/auth/drive` | Lihat, ubah, buat, hapus **semua** file Drive user |
| `https://www.googleapis.com/auth/drive.readonly` | Lihat dan unduh **semua** file Drive user |
| `https://www.googleapis.com/auth/drive.metadata` | Lihat dan ubah metadata semua file Drive |
| `https://www.googleapis.com/auth/drive.metadata.readonly` | Lihat metadata semua file Drive (tanpa isi) |
| `https://www.googleapis.com/auth/drive.scripts` | Ubah perilaku skrip Google Apps Script |
| `https://www.googleapis.com/auth/drive.meet.readonly` | Lihat/unduh file Drive yang dibuat atau diedit Google Meet |
| `https://www.googleapis.com/auth/drive.activity` | Lihat dan tambah catatan aktivitas file (Drive **Activity** API) |
| `https://www.googleapis.com/auth/drive.activity.readonly` | Lihat catatan aktivitas file (Drive **Activity** API) |

### Scope legacy

| Scope | Akses | Catatan |
|---|---|---|
| `https://www.googleapis.com/auth/drive.photos.readonly` | Lihat foto, video, dan album di Google Photos | Masih terdaftar pada discovery document Drive v3 dan diterima beberapa method (`files.get`, `files.list`, `files.copy`, `files.watch`, `permissions.get/list`, `revisions.get/list`, `changes.*`, `about.get`) tetapi **tidak** lagi dicantumkan di tabel scope resmi "Choose Google Drive API scopes". Jangan pakai untuk fitur baru. |

### Aturan verifikasi

| Kelas | Konsekuensi |
|---|---|
| Non-sensitive | Hanya perlu OAuth App Verification dasar |
| Sensitive | Perlu OAuth App Verification tambahan |
| Restricted | Perlu restricted-scope verification. Jika data restricted scope **disimpan atau ditransmisikan di server**, wajib lulus **security assessment** |

Selain itu, restricted scope Drive hanya boleh dipakai aplikasi kategori: (1) *backup and sync*, (2) *productivity and education*, (3) *reporting and security*.

> Prinsip: minta scope **sekecil mungkin**. Untuk aplikasi seperti Luxio (frontend React + implicit flow GIS), pakai `drive.file` saja — lihat rekomendasi tegas di [getting-started/authentication.md](getting-started/authentication.md).

---

## Mulai dari Mana

| Saya mau... | File |
|---|---|
| Melihat peta seluruh kemampuan Drive API | [kemampuan-dan-alur.md](kemampuan-dan-alur.md) |
| Mengaktifkan API & membuat kredensial | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Memilih scope yang benar | [getting-started/authentication.md](getting-started/authentication.md) |
| Mengunggah file besar tanpa takut koneksi putus | [guides/resumable-upload.md](guides/resumable-upload.md) |
| Mencari file dengan filter kompleks | [guides/search-query.md](guides/search-query.md) |
| Membagikan file ke anggota tim | [guides/permissions-and-sharing.md](guides/permissions-and-sharing.md) |
| Response API kosong / field tidak muncul | [guides/fields-and-partial-response.md](guides/fields-and-partial-response.md) |
| Aplikasi tangguh saat kena limit | [guides/error-handling.md](guides/error-handling.md) |
