# Kemampuan & Alur — Peta Lengkap Google Drive API

File ini merangkum **semua hal yang bisa dilakukan** dengan Google Drive API v3 beserta **alurnya**, dan menjelaskan kode mana yang melakukan apa.

- Base URL: `https://www.googleapis.com/drive/v3`
- Base URL upload: `https://www.googleapis.com/upload/drive/v3`
- Wajib **OAuth 2.0** (API key hanya bisa untuk file publik, tidak untuk data privat user).
- Default response Drive v3 sangat minim → parameter `fields` hampir selalu diperlukan.

---

## 1. Daftar Lengkap Kemampuan

### A. Cari & Baca File

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar file + pencarian `q` | `GET files?q=...` | `drive.file` / `drive.metadata.readonly` |
| Metadata satu file | `GET files/{fileId}` | `drive.file` / `drive.metadata.readonly` |
| Cek kapabilitas user pada file | `GET files/{fileId}?fields=capabilities` | `drive.file` / `drive.metadata.readonly` |
| Info akun & kuota penyimpanan | `GET about?fields=storageQuota,user` | `drive.file` / `drive.metadata.readonly` |
| ID pra-generate untuk upload idempoten | `GET files/generateIds` | `drive.file` |

```bash
# ① List: fields WAJIB kalau butuh lebih dari kind,id,name,mimeType,resourceKey.
curl "https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&pageSize=20&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime)" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { files: [{ id, name, mimeType, size, modifiedTime }], nextPageToken }

# ② Detail satu file: tanpa fields, hanya id,name,mimeType,kind yang kembali.
curl "https://www.googleapis.com/drive/v3/files/FILE_ID?fields=id,name,mimeType,size,parents,webViewLink,md5Checksum" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# ③ Kuota penyimpanan: about.get WAJIB pakai fields (tidak ada default).
curl "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress),storageQuota" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Alur baca: `files.list` (dengan `q` + `fields`) → dapat `id` → `files.get` untuk metadata detail → `files.get?alt=media` untuk isi biner. Detail: [guides/search-query.md](guides/search-query.md).

### B. Unggah & Unduh

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat file metadata saja (mis. folder) | `POST files` | `drive.file` |
| Unggah kecil tanpa metadata | `POST /upload/drive/v3/files?uploadType=media` | `drive.file` |
| Unggah kecil + metadata sekaligus | `POST /upload/drive/v3/files?uploadType=multipart` | `drive.file` |
| Unggah besar / rawan putus | `POST /upload/drive/v3/files?uploadType=resumable` | `drive.file` |
| Ganti isi file yang sudah ada | `PATCH /upload/drive/v3/files/{fileId}?uploadType=...` | `drive.file` |
| Unduh isi biner | `GET files/{fileId}?alt=media` | `drive.file` / `drive.readonly` |
| Unduh sebagian (byte range) | header `Range: bytes=500-999` | sama |
| Ekspor Google Docs/Sheets/Slides | `GET files/{fileId}/export?mimeType=...` | `drive.file` / `drive.readonly` |
| Unduh via long-running operation | `POST files/{fileId}/download` | `drive.file` / `drive.readonly` |
| Salin file | `POST files/{fileId}/copy` | `drive.file` |

```bash
# ④ Multipart: metadata (JSON) + media dalam satu request. Boundary wajib konsisten.
curl -X POST "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: multipart/related; boundary=luxio_boundary" \
  --data-binary @- <<'EOF'
--luxio_boundary
Content-Type: application/json; charset=UTF-8

{ "name": "laporan.pdf", "parents": ["FOLDER_ID"] }
--luxio_boundary
Content-Type: application/pdf

<isi biner PDF di sini>
--luxio_boundary--
EOF

# ⑤ Unduh biner: -L wajib (ada redirect), --output menulis ke file.
curl -L "https://www.googleapis.com/drive/v3/files/FILE_ID?alt=media" \
  -H "Authorization: Bearer ACCESS_TOKEN" --output "laporan.pdf"

# ⑥ Ekspor Google Docs → PDF (files.get?alt=media TIDAK bisa untuk Docs Editors).
curl -L "https://www.googleapis.com/drive/v3/files/FILE_ID/export?mimeType=application/pdf" \
  -H "Authorization: Bearer ACCESS_TOKEN" --output "dokumen.pdf"
```

Alur unggah: pilih tipe upload berdasar ukuran → `< 5 MB` cukup `multipart`; `> 5 MB` atau jaringan tidak stabil pakai `resumable`. Detail: [guides/upload-and-download.md](guides/upload-and-download.md), [guides/resumable-upload.md](guides/resumable-upload.md).

### C. Folder & Organisasi

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Buat folder | `POST files` dengan `mimeType=application/vnd.google-apps.folder` | `drive.file` |
| Taruh file di folder | field `parents: ["FOLDER_ID"]` saat create | `drive.file` |
| Pindah file antar folder | `PATCH files/{fileId}?addParents=...&removeParents=...` | `drive.file` |
| Ganti nama / deskripsi | `PATCH files/{fileId}` body `{ "name": "..." }` | `drive.file` |
| Buat shortcut | `POST files` dengan `mimeType=...shortcut` + `shortcutDetails.targetId` | `drive.file` |
| Properti kustom publik | field `properties` | `drive.file` |
| Properti kustom privat aplikasi | field `appProperties` | `drive.file` |
| Buang ke trash / kembalikan | `PATCH files/{fileId}` body `{ "trashed": true|false }` | `drive.file` |
| Hapus permanen | `DELETE files/{fileId}` | `drive.file` |
| Kosongkan trash | `DELETE files/trash` | `drive` |

```bash
# ⑦ Buat folder: folder = file bermimeType khusus, tanpa isi biner.
curl -X POST "https://www.googleapis.com/drive/v3/files?fields=id,name" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "name": "Luxio Project", "mimeType": "application/vnd.google-apps.folder" }'
# → { "id": "FOLDER_ID", "name": "Luxio Project" }

# ⑧ Pindah file: addParents/removeParents adalah QUERY parameter, bukan body.
curl -X PATCH "https://www.googleapis.com/drive/v3/files/FILE_ID?addParents=FOLDER_ID&removeParents=root&fields=id,parents" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Length: 0"
```

Detail: [guides/folders-and-shortcuts.md](guides/folders-and-shortcuts.md).

### D. Berbagi & Izin

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar izin sebuah file | `GET files/{fileId}/permissions` | `drive.file` / `drive.metadata.readonly` |
| Bagikan ke user/grup | `POST files/{fileId}/permissions` (`type=user|group`) | `drive.file` |
| Bagikan ke seluruh domain | `POST .../permissions` (`type=domain` + `domain`) | `drive.file` |
| Link sharing publik | `POST .../permissions` (`type=anyone`) | `drive.file` |
| Ubah role izin | `PATCH .../permissions/{permissionId}` | `drive.file` |
| Beri masa berlaku izin | field `expirationTime` (user/group saja) | `drive.file` |
| Cabut izin | `DELETE .../permissions/{permissionId}` | `drive.file` |
| Transfer ownership | `PATCH .../permissions/{id}` + `transferOwnership=true` | `drive.file` |

```bash
# ⑨ Bagikan sebagai pembaca. sendNotificationEmail default true untuk user/group.
curl -X POST "https://www.googleapis.com/drive/v3/files/FILE_ID/permissions?sendNotificationEmail=true&fields=id,type,role,emailAddress" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "type": "user", "role": "reader", "emailAddress": "anggota@example.com" }'
# → { "id": "PERMISSION_ID", "type": "user", "role": "reader", ... }
```

Detail: [guides/permissions-and-sharing.md](guides/permissions-and-sharing.md).

### E. Revisi & Riwayat

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar revisi file | `GET files/{fileId}/revisions` | `drive.file` / `drive.metadata.readonly` |
| Metadata satu revisi | `GET files/{fileId}/revisions/{revisionId}` | sama |
| Unduh isi revisi lama | `GET .../revisions/{revisionId}?alt=media` | `drive.file` / `drive.readonly` |
| Kunci revisi agar tidak dihapus otomatis | `PATCH .../revisions/{id}` body `{ "keepForever": true }` | `drive.file` |
| Publikasikan revisi Docs | `PATCH .../revisions/{id}` body `{ "published": true }` | `drive.file` |
| Hapus revisi | `DELETE .../revisions/{revisionId}` | `drive.file` |

Alias `head` bisa dipakai sebagai `revisionId` untuk revisi terbaru pada anchor komentar. Detail: [resources/revision.md](resources/revision.md), [reference-api/revisions.md](reference-api/revisions.md).

### F. Komentar & Balasan

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar komentar | `GET files/{fileId}/comments?fields=...` | `drive.file` / `drive.readonly` |
| Buat komentar | `POST files/{fileId}/comments?fields=...` | `drive.file` |
| Ubah komentar | `PATCH .../comments/{commentId}` | `drive.file` |
| Hapus komentar | `DELETE .../comments/{commentId}` | `drive.file` |
| Daftar balasan | `GET .../comments/{commentId}/replies?fields=...` | `drive.file` / `drive.readonly` |
| Balas + resolve/reopen | `POST .../replies` body `{ "action": "resolve" }` | `drive.file` |

> Catatan: seluruh method `comments` dan `replies` (kecuali `delete`) **wajib** menyertakan `fields`. Tanpa itu request gagal.

### G. Sinkronisasi Perubahan

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Ambil token awal change log | `GET changes/startPageToken` | `drive.file` / `drive.metadata.readonly` |
| Ambil perubahan sejak token | `GET changes?pageToken=...` | sama |
| Daftar notifikasi push perubahan | `POST changes/watch` | sama |
| Pantau satu file saja | `POST files/{fileId}/watch` | sama |
| Matikan kanal notifikasi | `POST channels/stop` | sama |

```bash
# ⑩ Ambil checkpoint awal — simpan startPageToken di database.
curl "https://www.googleapis.com/drive/v3/changes/startPageToken" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "kind": "drive#startPageToken", "startPageToken": "98765" }

# ⑪ Ambil delta. newStartPageToken muncul di halaman TERAKHIR → simpan sebagai checkpoint baru.
curl "https://www.googleapis.com/drive/v3/changes?pageToken=98765&fields=newStartPageToken,nextPageToken,changes(fileId,removed,time,file(name,mimeType))" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Detail: [guides/changes-and-watch.md](guides/changes-and-watch.md).

### H. Shared Drive

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Daftar shared drive | `GET drives` | `drive.readonly` / `drive` |
| Cari shared drive | `GET drives?q=name contains '...'` | `drive.readonly` / `drive` |
| Buat shared drive | `POST drives?requestId=UUID` | `drive` |
| Ubah nama/tema/restriksi | `PATCH drives/{driveId}` | `drive` |
| Sembunyikan / tampilkan | `POST drives/{driveId}/hide` \| `unhide` | `drive` |
| Hapus shared drive | `DELETE drives/{driveId}` | `drive` |
| Akses file shared drive | tambahkan `supportsAllDrives=true` pada semua request `files.*` | sesuai method |
| Cari lintas My Drive + shared drive | `GET files?includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=allDrives` | sesuai method |

Detail: [guides/shared-drives.md](guides/shared-drives.md).

### I. Folder appData

| Kemampuan | Endpoint | Scope |
|---|---|---|
| Simpan file konfigurasi tersembunyi | `POST files` dengan `parents: ["appDataFolder"]` | `drive.appdata` |
| List isi folder appData | `GET files?spaces=appDataFolder` | `drive.appdata` |
| Cari di appData via `q` | `q='appDataFolder' in parents` | `drive.appdata` |
| ID pra-generate untuk appData | `GET files/generateIds?space=appDataFolder` | `drive.appdata` |

Batasan: file di `appDataFolder` **tidak bisa** dibagikan, dipindah antar space, atau di-trash (error `notSupportedForAppDataFolderFiles`). Detail: [guides/app-data-folder.md](guides/app-data-folder.md).

---

## 2. Alur Besar Integrasi

```
[Setup sekali]                                  [Runtime]
Cloud Console ─► enable Drive API ─► OAuth consent + scope ─► access token (±1 jam)
                                                                    │
      ┌──────────────┬──────────────┬────────────────┬──────────────┴────────────┐
      ▼              ▼              ▼                ▼                           ▼
   SEARCH          UPLOAD        DOWNLOAD          SHARE                       SYNC
 files.list      /upload/...   files.get          permissions.create      changes.getStartPageToken
 + q + fields    uploadType=   ?alt=media         (type/role)                     │
      │          resumable     files.export             │              changes.list?pageToken
      │               │              │                  │                         │
      └──────────► fileId ◄──────────┴──────────────────┴──── changes.watch (webhook)
```

## 3. Alur `fields` — Yang Paling Sering Menjebak

```
Request tanpa fields
      │
      ├─ files.list   ──► hanya kind, id, name, mimeType, resourceKey
      ├─ files.get    ──► set default terbatas (tanpa size, parents, permissions, dst.)
      ├─ revisions.list ► hanya id, mimeType, kind, modifiedTime
      └─ about / comments / replies ──► ERROR: fields wajib
                                        │
                          tambahkan fields=... ──► field yang diminta muncul
```

Aturan penulisan: `a/b` untuk nested, `a(b,c)` untuk sub-selector array, `*` untuk semua sub-field. Detail: [guides/fields-and-partial-response.md](guides/fields-and-partial-response.md).

## 4. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Memahami struktur data (field JSON artinya apa) | [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) |
| Aktifkan API & buat kredensial | [getting-started/enable-api.md](getting-started/enable-api.md) |
| Memilih scope (`drive.file` vs `drive`) | [getting-started/authentication.md](getting-started/authentication.md) |
| Menyusun query pencarian `q` | [guides/search-query.md](guides/search-query.md) |
| Mengunggah file kecil / besar | [guides/upload-and-download.md](guides/upload-and-download.md) · [guides/resumable-upload.md](guides/resumable-upload.md) |
| Mengekspor Google Docs jadi PDF/DOCX | [guides/export-google-docs.md](guides/export-google-docs.md) |
| Membuat folder & memindahkan file | [guides/folders-and-shortcuts.md](guides/folders-and-shortcuts.md) |
| Membagikan file & mengatur role | [guides/permissions-and-sharing.md](guides/permissions-and-sharing.md) |
| Mendukung Shared Drive | [guides/shared-drives.md](guides/shared-drives.md) |
| Sinkronisasi realtime / webhook | [guides/changes-and-watch.md](guides/changes-and-watch.md) |
| Menyimpan config aplikasi tersembunyi | [guides/app-data-folder.md](guides/app-data-folder.md) |
| Response kosong / field hilang | [guides/fields-and-partial-response.md](guides/fields-and-partial-response.md) |
| Mengambil ribuan file | [guides/pagination.md](guides/pagination.md) |
| Aplikasi tangguh saat limit | [guides/error-handling.md](guides/error-handling.md) |
| Semua endpoint beranotasi | [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) |

---

## 5. Alur Contoh End-to-End: "Unggah Lampiran Project ke Folder Khusus lalu Bagikan ke Anggota Tim dengan Izin Baca"

Skenario: aplikasi Luxio menyimpan lampiran project ke folder `Luxio Project Files`, kemudian membagikannya ke satu anggota tim sebagai `reader`.

```bash
# LANGKAH 1 — cari folder tujuan; kalau belum ada, buat.
curl "https://www.googleapis.com/drive/v3/files?q=name%3D'Luxio%20Project%20Files'%20and%20mimeType%3D'application/vnd.google-apps.folder'%20and%20trashed%3Dfalse&fields=files(id,name)" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "files": [] }  ⇒ folder belum ada

# LANGKAH 2 — buat folder. mimeType folder = application/vnd.google-apps.folder.
curl -X POST "https://www.googleapis.com/drive/v3/files?fields=id,name" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "name": "Luxio Project Files", "mimeType": "application/vnd.google-apps.folder" }'
# → { "id": "FOLDER_ID", "name": "Luxio Project Files" }

# LANGKAH 3 — mulai sesi resumable upload. Body = metadata; header X-Upload-* = info media.
curl -i -X POST "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json; charset=UTF-8" \
  -H "X-Upload-Content-Type: application/pdf" \
  -H "X-Upload-Content-Length: 4718592" \
  -d '{ "name": "spesifikasi-project.pdf", "parents": ["FOLDER_ID"] }'
# → HTTP/1.1 200 OK
#   Location: https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=SESSION_ID
#   (body kosong — resource File belum dikembalikan)

# LANGKAH 4 — kirim isi file ke session URI dengan PUT.
curl -X PUT "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=SESSION_ID" \
  -H "Content-Length: 4718592" \
  --data-binary @spesifikasi-project.pdf
# → 200 OK + resource File: { "id": "FILE_ID", "name": "spesifikasi-project.pdf", ... }

# LANGKAH 5 — bagikan ke anggota tim sebagai pembaca.
curl -X POST "https://www.googleapis.com/drive/v3/files/FILE_ID/permissions?sendNotificationEmail=true&fields=id,type,role,emailAddress" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "type": "user", "role": "reader", "emailAddress": "anggota@example.com", "expirationTime": "2026-12-31T23:59:59Z" }'
# → { "id": "PERMISSION_ID", "type": "user", "role": "reader", "emailAddress": "anggota@example.com" }

# LANGKAH 6 — ambil link yang bisa dibuka anggota tim.
curl "https://www.googleapis.com/drive/v3/files/FILE_ID?fields=id,name,webViewLink,webContentLink" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# → { "webViewLink": "https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk", "webContentLink": "..." }
```

Penjelasan:

1. **Langkah 1** memakai `q` dengan tiga term (`name`, `mimeType`, `trashed`) digabung `and`; tanpa `trashed=false` folder di trash juga ikut terambil.
2. **Langkah 2** membuat folder — folder adalah file metadata-only, jadi memakai endpoint `files` biasa (bukan `/upload/...`).
3. **Langkah 3** hanya membuka sesi. Respons **tidak** berisi resource `File`; yang penting adalah header `Location`. Session URI berlaku satu minggu.
4. **Langkah 4** memakai `PUT` (bukan `POST`) ke session URI. File 4,5 MB masih aman satu request; untuk file besar bagi menjadi chunk kelipatan 256 KB — lihat [guides/resumable-upload.md](guides/resumable-upload.md).
5. **Langkah 5** menambahkan izin baru; `expirationTime` opsional dan hanya berlaku untuk `type=user`/`group`, maksimum satu tahun ke depan.
6. **Langkah 6** `webViewLink` untuk dibuka di browser, `webContentLink` untuk unduh langsung (hanya ada pada file biner).

Semua langkah di atas cukup dengan scope `https://www.googleapis.com/auth/drive.file` karena file dan folder dibuat oleh aplikasi itu sendiri.

Kode siap pakai: [examples/nodejs.md](examples/nodejs.md), [examples/python.md](examples/python.md), [examples/curl.md](examples/curl.md).
