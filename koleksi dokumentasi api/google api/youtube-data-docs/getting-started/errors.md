# Errors — YouTube Data API v3

Struktur error, daftar `reason` yang paling sering muncul, dan cara menanganinya.

- Error spesifik YouTube: https://developers.google.com/youtube/v3/docs/errors
- Error domain global Google API: https://developers.google.com/youtube/v3/docs/core_errors

---

## 1. Struktur Error JSON

```json
{
  "error": {
    "errors": [
      {
        "domain": "global",
        "reason": "invalidParameter",
        "message": "Invalid string value: 'asdf'. Allowed values: [mostpopular]",
        "locationType": "parameter",
        "location": "chart"
      }
    ],
    "code": 400,
    "message": "Invalid string value: 'asdf'. Allowed values: [mostpopular]"
  }
}
```

| Field | Arti |
|---|---|
| `error.code` | Status HTTP |
| `error.message` | Pesan ringkas untuk manusia |
| `error.errors[].domain` | `global` untuk error umum Google API, atau domain khusus seperti `youtube.parameter`, `youtube.quota` |
| `error.errors[].reason` | **Kode yang harus kamu cabang di kode**, bukan `message` |
| `error.errors[].location` | Nama parameter/properti yang bermasalah |
| `error.errors[].locationType` | `parameter`, `header`, atau `other` |

> Prinsip: percabangan logika selalu berdasarkan `reason`, jangan pernah string-matching `message`. `message` bisa berubah kapan saja; `reason` stabil.

---

## 2. Error Inti (Berlaku di Semua Method)

| HTTP | reason | Arti | Penanganan |
|---|---|---|---|
| 403 | `forbidden` | Akses ditolak, request mungkin tidak terautentikasi dengan benar | Cek token & scope |
| 403 | `quotaExceeded` | Kuota harian project habis | **Jangan retry.** Tunggu reset tengah malam PT |

---

## 3. Error Request Umum

| HTTP | reason | Arti |
|---|---|---|
| 400 | `incompatibleParameters` | Dua parameter atau lebih tidak boleh dipakai bersamaan |
| 400 | `invalidFilters` | Parameter filter tidak valid |
| 400 | `invalidPageToken` | `pageToken` tidak valid atau kadaluarsa |
| 400 | `missingRequiredParameter` | Parameter wajib tidak ada (paling sering: `part`) |
| 400 | `unexpectedParameter` | Parameter tidak dikenali untuk method ini |
| 403 | `accountDelegationForbidden` | User terautentikasi tidak boleh bertindak atas nama akun Google tersebut |
| 403 | `authenticatedUserAccountClosed` | Akun YouTube user sudah ditutup |
| 403 | `authenticatedUserAccountSuspended` | Akun YouTube user disuspend |
| 403 | `authenticatedUserNotChannel` | User terautentikasi tidak punya channel |
| 403 | `channelClosed` | Channel di request sudah ditutup |
| 403 | `channelNotFound` | Channel di request tidak ditemukan |
| 403 | `channelSuspended` | Channel di request disuspend |
| 403 | `cmsUserAccountNotFound` | CMS user tidak boleh bertindak atas nama content owner tersebut |
| 403 | `insufficientCapabilities` | CMS user tidak punya kapabilitas cukup |
| 403 | `insufficientPermissions` | **Token OAuth tidak punya scope yang cukup** |
| 404 | `contentOwnerAccountNotFound` | Akun content owner tidak ditemukan |

---

## 4. Error Konteks Request

| HTTP | reason | Arti |
|---|---|---|
| 400 | `invalidLanguage` | Nilai `hl` bukan kode bahasa valid |
| 400 | `unsupportedLanguageCode` | Kode bahasa valid tapi tidak didukung |
| 400 | `invalidRegionCode` | Nilai `regionCode` tidak valid |
| 400 | `unsupportedRegionCode` | Kode region tidak didukung |
| 400 | `invalidMine` | Pemakaian parameter `mine` tidak didukung untuk konteks ini |
| 400 | `invalidPart` | `part` menyebut part yang tidak bisa ditulis bersamaan |
| 400 | `unexpectedPart` | `part` menyebut nilai tak terduga |
| 400 | `unknownPart` | `part` menyebut nilai yang tidak dikenal |
| 401 | `authorizationRequired` | Request memakai `mine` tapi tidak terautentikasi |
| 401 | `youtubeSignupRequired` | Akun Google belum punya channel YouTube. **Juga error yang muncul kalau kamu memakai OAuth Service Account** — YouTube tidak mendukung service account |

---

## 5. Error per Grup Endpoint

### videos

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `list` | 400 | `videoChartNotFound` | Chart yang diminta tidak didukung/tidak tersedia |
| `list` | 403 | `forbidden` | `fileDetails`, `processingDetails`, `suggestions` hanya untuk pemilik video |
| `list` | 403 | `forbidden` | Tidak boleh memakai `myRating` tanpa otorisasi |
| `list` | 404 | `videoNotFound` | Video di `id` tidak ditemukan |
| `insert` | 400 | `mediaBodyRequired` | Body request tidak berisi konten video |
| `insert` | 400 | `invalidVideoMetadata` | `snippet` dikirim tapi `snippet.title` atau `snippet.categoryId` tidak diisi |
| `insert` | 400 | `invalidCategoryId` | `snippet.categoryId` tidak valid — ambil dari `videoCategories.list` |
| `insert` | 400 | `invalidTitle` | Judul kosong atau tidak valid |
| `insert` | 400 | `invalidDescription` | Deskripsi tidak valid |
| `insert` | 400 | `invalidTags` | Tag tidak valid |
| `insert` | 400 | `invalidPublishAt` | `status.publishAt` tidak valid |
| `insert` | 400 | `invalidRecordingDetails` | Objek `recordingDetails` tidak valid |
| `insert` | 400 | `invalidFilename` | Nama file di header `Slug` tidak valid |
| `insert` | 400 | `defaultLanguageNotSet` | Menambah `localizations` tanpa `snippet.defaultLanguage` |
| `insert` | 400 | `uploadLimitExceeded` | Batas upload harian **channel** tercapai — batas platform YouTube, terpisah dari kuota API |
| `insert` | 403 | `forbiddenPrivacySetting` | Privacy status yang diminta tidak diizinkan |
| `insert` | 403 | `forbiddenLicenseSetting` | Lisensi yang diminta tidak diizinkan |
| `update` | 404 | `videoNotFound` | Video di body `id` tidak ditemukan |
| `update` | 403 | `forbiddenEmbedSetting` | Setting embed tidak diizinkan untuk channel ini |
| `update` | 400 | `invalidDefaultBroadcastPrivacySetting` | Privacy default broadcast tidak valid |
| `delete` | 403 | `forbidden` | Video tidak bisa dihapus / request tidak terautentikasi |
| `delete` | 404 | `videoNotFound` | Video tidak ditemukan |
| `rate` | 400 | `invalidRating` | Nilai `rating` tak terduga (valid: `like`, `dislike`, `none`) |
| `rate` | 400 | `emailNotVerified` | User harus verifikasi email sebelum bisa memberi rating |
| `rate` | 400 | `videoPurchaseRequired` | Video rental hanya bisa dinilai oleh yang menyewanya |
| `rate` | 403 | `videoRatingDisabled` | Pemilik video mematikan rating |
| `reportAbuse` | 400 | `invalidAbuseReason` | `reasonId` / kombinasi `reasonId` + `secondaryReasonId` tidak valid |
| `reportAbuse` | 400 | `rateLimitExceeded` | Terlalu banyak laporan dalam rentang waktu tertentu |
| `reportAbuse` | 404 | `videoNotFound` | Video yang dilaporkan tidak ditemukan |

### search

| HTTP | reason | Arti |
|---|---|---|
| 400 | `invalidChannelId` | `channelId` tidak valid |
| 400 | `invalidLocation` | Format `location` dan/atau `locationRadius` salah |
| 400 | `invalidRelevanceLanguage` | Format `relevanceLanguage` salah |
| 400 | `invalidSearchFilter` | Kombinasi filter tidak valid. `type=video` **wajib** kalau kamu memakai `eventType`, `videoCaption`, `videoCategoryId`, `videoDefinition`, `videoDimension`, `videoDuration`, `videoEmbeddable`, `videoLicense`, `videoSyndicated`, atau `videoType` |

### playlistItems

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `insert` | 409 | `videoAlreadyInPlaylist` | Video sudah ada di playlist |
| `insert` | 403 | `playlistContainsMaximumNumberOfVideos` | Playlist sudah penuh |
| `insert` | 403 | `playlistItemsNotAccessible` | Tidak berhak menambah item ke playlist ini |
| `insert` | 400 | `invalidContentDetails` | `contentDetails` tidak valid — misalnya `contentDetails.note` lebih dari 280 karakter |
| `delete` | 400 | `playlistOperationUnsupported` | Playlist tidak mendukung hapus item (contoh: playlist `uploads`) |
| `delete` | 404 | `playlistItemNotFound` | Item tidak ditemukan |
| `delete` | 403 | `playlistItemsNotAccessible` | Tidak berhak menghapus item |

### comments & commentThreads

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `commentThreads.list` | 403 | `commentsDisabled` | Komentar dimatikan di video tersebut |
| `commentThreads.list` | 404 | `commentThreadNotFound` | Thread di `id` tidak ditemukan |
| `commentThreads.insert` | 400 | `channelOrVideoIdMissing` | `snippet.channelId` dan `snippet.videoId` harus diisi |
| `commentThreads.insert` | 400 | `commentTextRequired` | `snippet.topLevelComment.snippet.textOriginal` kosong |
| `commentThreads.insert` | 400 | `commentTextTooLong` | Teks komentar melewati batas karakter |
| `commentThreads.insert` | 403 | `ineligibleAccount` | Akun YouTube belum digabungkan dengan akun Google |
| `comments.insert` | 400 | `parentIdMissing` | `snippet.parentId` wajib untuk balasan |
| `comments.insert` | 400 | `parentCommentIsPrivate` | Tidak bisa membalas komentar privat |
| `comments.insert` | 400 | `operationNotSupported` | Thread tidak menerima balasan — cek `commentThread.snippet.canReply` |
| `comments.insert` | 404 | `parentCommentNotFound` | Komentar induk tidak ditemukan |
| `comments.setModerationStatus` | 400 | `banWithoutReject` | `banAuthor=true` hanya boleh kalau `moderationStatus=rejected` |
| `comments.setModerationStatus` | 404 | `commentNotFound` | Komentar di `id` tidak ditemukan |
| `comments.delete` / `update` | 404 | `commentNotFound` | Komentar tidak ditemukan |

### captions

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `insert` | 400 | `contentRequired` | Body tidak berisi isi file caption |
| `insert` | 400 | `invalidMetadata` | `snippet.language`, `snippet.name`, atau `snippet.videoId` tidak valid |
| `insert` | 400 | `nameTooLong` | `snippet.name` lebih dari 150 karakter |
| `insert` | 409 | `captionExists` | Sudah ada track dengan `language` + `name` yang sama |
| `insert` | 404 | `videoNotFound` | Video di `videoId` tidak ditemukan |
| `update` | 400 | `contentRequired` | Isi track wajib kalau `sync=true` |
| `download` | 400 | `couldNotConvert` | Tidak bisa dikonversi ke `tfmt`/`tlang` yang diminta, atau `snippet.status` = `failed` |
| `list` / `delete` / `download` / `update` | 404 | `captionNotFound` | Track caption tidak ditemukan |
| semua | 403 | `forbidden` | Izin tidak cukup — `captions.*` butuh scope `youtube.force-ssl` |

### thumbnails

| HTTP | reason | Arti |
|---|---|---|
| 400 | `invalidImage` | Isi gambar tidak valid |
| 400 | `mediaBodyRequired` | Body tidak berisi gambar |
| 403 | `forbidden` | Tidak berhak / channel belum boleh memakai thumbnail kustom |
| 404 | `videoNotFound` | Video di `videoId` tidak ditemukan |
| 429 | `uploadRateLimitExceeded` | Channel mengunggah terlalu banyak thumbnail belakangan ini |

### subscriptions

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `insert` | 400 | `subscriptionDuplicate` | Sudah berlangganan channel itu |
| `insert` | 400 | `subscriptionForbidden` | Batas jumlah langganan tercapai / terlalu banyak langganan baru / tidak bisa subscribe channel sendiri |
| `insert` | 400 | `publisherRequired` | `snippet.resourceId` wajib menunjuk channel target |
| `insert` | 404 | `publisherNotFound` | Channel target tidak ditemukan |
| `list` | 403 | `accountClosed` / `accountSuspended` | Akun subscriber ditutup/disuspend |
| `delete` | 404 | `subscriptionNotFound` | Langganan tidak ditemukan |

### channels & channelSections

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `channels.list` | 400 | `invalidCriteria` | Maksimum **satu** filter: `id`, `mine`, `forHandle`, `forUsername`, `managedByMe`, `mySubscribers`, `categoryId` |
| `channels.update` | 400 | `channelTitleUpdateForbidden` | Saat update `brandingSettings`, `brandingSettings.channel.title` harus sama dengan judul sekarang atau dihilangkan |
| `channels.update` | 400 | `brandingValidationError` | Nilai di `brandingSettings` gagal validasi |
| `channelSections.insert` | 400 | `styleRequired` / `typeRequired` | `snippet.style` / `snippet.type` wajib |
| `channelSections.insert` | 400 | `maxChannelSectionExceeded` | Channel sudah punya jumlah section maksimum |
| `channelSections.insert` | 400 | `onePlaylistNeeded` | `type=singlePlaylist` wajib tepat satu playlist |
| `channelSections.*` | 400 | `notEditable` | Section ini tidak bisa dibuat/diubah/dihapus |

### watermarks

| Method | HTTP | reason | Arti |
|---|---|---|---|
| `set` | 400 | `imageFormatUnsupported` | Format gambar tidak didukung |
| `set` | 400 | `imageTooTall` / `imageTooWide` | Dimensi gambar salah |
| `set` | 400 | `mediaBodyRequired` | Body tidak berisi gambar |
| `set` / `unset` | 403 | `forbidden` | Tidak berhak, atau `channelId` salah |

---

## 6. Error Domain Global (Dipakai Semua Google API)

| HTTP | reason | Arti | Retry? |
|---|---|---|---|
| 304 | `notModified` | `If-None-Match` cocok — pakai cache | — |
| 400 | `badRequest` | Request tidak bisa dipahami server | Tidak |
| 400 | `invalidParameter` | Parameter/nilai parameter tidak valid | Tidak |
| 400 | `keyInvalid` | API key tidak valid | Tidak |
| 400 | `keyExpired` | API key kadaluarsa | Tidak |
| 400 | `parseError` | Body request tidak bisa diparse | Tidak |
| 400 | `required` | Informasi wajib tidak ada | Tidak |
| 400 | `notUpload` | Request non-upload dikirim ke URI `/upload/*` | Tidak |
| 400 | `wrongUrlForUpload` | Request upload tidak dikirim ke URI `/upload/*` | Tidak |
| 401 | `authError` | Kredensial di header `Authorization` tidak valid | Tidak — refresh token dulu |
| 401 | `expired` | Sesi kadaluarsa | Tidak — refresh token dulu |
| 401 | `required` | Harus login untuk request ini | Tidak |
| 403 | `accessNotConfigured` | Project belum mengaktifkan YouTube Data API v3 | Tidak |
| 403 | `dailyLimitExceeded` | Batas kuota harian API tercapai | Tidak |
| 403 | `rateLimitExceeded` | Terlalu banyak request dalam rentang waktu | **Ya**, backoff |
| 403 | `userRateLimitExceeded` | Batas per-user tercapai | **Ya**, backoff |
| 403 | `servingLimitExceeded` | Batas rate keseluruhan API tercapai | **Ya**, backoff |
| 403 | `sslRequired` | Wajib HTTPS | Tidak |
| 403 | `insufficientPermissions` | Scope tidak cukup | Tidak — minta scope lain |
| 404 | `notFound` | Resource tidak ditemukan | Tidak |
| 409 | `conflict` / `duplicate` | Resource sudah ada | Tidak |
| 410 | `deleted` | Resource sudah dihapus | Tidak |
| 412 | `conditionNotMet` | `If-Match`/`If-None-Match` gagal | Tidak — ambil ulang resource |
| 413 | `uploadTooLarge` | Data yang dikirim terlalu besar | Tidak |
| 416 | `requestedRangeNotSatisfiable` | Range yang diminta tidak valid (relevan untuk resumable upload) | Tidak |
| 428 | `preconditionRequired` | Butuh header `If-Match`/`If-None-Match` | Tidak |
| 429 | `rateLimitExceeded` | Terlalu banyak request | **Ya**, backoff |
| 500 | `internalError` | Error internal server | **Ya**, backoff |
| 501 | `notImplemented` | Operasi belum diimplementasikan | Tidak |
| 503 | `backendError` | Error backend | **Ya**, backoff |
| 503 | `notReady` | Server belum siap menerima request | **Ya**, backoff |

---

## 7. Pola Penanganan

```js
// Cabang berdasarkan reason, bukan message.
const RETRYABLE = new Set([
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'servingLimitExceeded',
  'internalError',
  'backendError',
  'notReady',
]);

async function handleYouTubeError(res) {
  const body = await res.json();
  const err = body.error?.errors?.[0] ?? {};

  if (err.reason === 'quotaExceeded' || err.reason === 'dailyLimitExceeded') {
    // Bukan transien. Berhenti sampai reset tengah malam PT.
    throw new QuotaExhaustedError(err.message);
  }

  if (err.reason === 'insufficientPermissions' || res.status === 401) {
    // Token salah scope atau kadaluarsa → minta ulang token.
    throw new NeedsReauthError(err.reason);
  }

  if (RETRYABLE.has(err.reason) || res.status >= 500 || res.status === 429) {
    // Layak retry dengan exponential backoff + jitter.
    throw new TransientError(err.reason);
  }

  // Sisanya = bug di request kita. Perbaiki request, jangan retry.
  throw new PermanentError(`${res.status} ${err.reason}: ${err.message}`);
}
```

Strategi retry, backoff, dan idempotensi lengkap: [../guides/error-handling.md](../guides/error-handling.md).
