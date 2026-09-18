# Kemampuan TikTok Content Posting API & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** TikTok for Developers (v2) dan **kode mana yang melakukan apa**.

- Base URL: `https://open.tiktok.com` (API v2)
- Dokumentasi resmi: https://developers.tiktok.com/docs/en/
- Catatan: sebagian halaman TikTok dimuat dinamis; file-folder ini berisi hasil render yang sudah dibersihkan.

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Daftarkan app + tambah product | Developer Portal (web) | Login Kit, Content Posting API, Display API per product |
| Sandbox | Portal → App → Sandbox | Akun tester sebelum review |
| OAuth consent (web) | `https://www.tiktok.com/v2/auth/authorize/` | → `code` |
| Tukar code → token | `POST /v2/oauth/token/` | `access_token` 24 jam + `refresh_token` 365 hari |
| Refresh token | `POST /v2/oauth/token/` (`grant_type=refresh_token`) | Akses berkelanjutan |
| Revoke | `POST /v2/oauth/revoke/` | Cabut izin user |
| Info user | `GET /v2/user/` | scope `user.info.basic` |
| Daftar video user | `GET /v2/video/list/` | scope `video.list` — Display API |
| Query video by id | `GET /v2/video/query/` | Display API |
| **Direct Post** inisialisasi (langsung terbit) | `POST /v2/post/publish/content/init/` | `post_mode=DIRECT POST`; teks + `privacy_level` (`PUBLIC_TO_EVERYONE`/`MUTUAL_FOLLOW_FRIENDS`/`SELF_ONLY` dkk). |
| **Upload Post** (draft ke inbox, user konfirmasi di app TikTok) | `POST /v2/post/publish/content/init/` (atau video/init) | `post_mode=MEDIA_UPLOAD` → status `SEND_TO_USER_INBOX` |
| Init upload video | `POST /v2/post/publish/video/init/` | `FILE_UPLOAD` (dapat `upload_url` + chunk size) atau `PULL_FROM_URL` di `source_info` |
| Init dari video di inbox | `POST /v2/post/publish/inbox/video/init/` | pakai video yang ada di inbox user |
| Upload chunk video | `PUT` ke `upload_url` (header `Content-Range`) | bagian file besar — `reference/upload-video.md`, `posting/media-transfer-guide.md` |
| Photo post | `POST /v2/post/publish/content/init/` + `media_url[]` (URL publik terverifikasi) | `photo-post.md`; fitur khusus hanya aktif saat `post_mode = DIRECT POST` |
| Cek status post | `POST /v2/post/publish/status/fetch/` (`publish_id`) | `PROCESSING_UPLOAD`, `PROCESSING_DOWNLOAD`, `PROCESSING_SCREENSHOT`, `PUBLISH_COMPLETE`, `SEND_TO_USER_INBOX`, `FAILED` (+`fail_reason`) |
| Creator info (priv/licensing) | `GET /v2/post/publish/creator_info/query/` | cek sebelum posting (kuota/duration) |
| Domain/URL verification (pull from URL) | Portal → Developer tools | kepemilikan domain |
| Webhooks | product-level callback (verifikasi + JSON POST) | `webhooks/webhooks-overview.md` |
| Batas & kebijakan konten | guidelines | `posting/content-sharing-guidelines.md` |

## 2. Alur OAuth

```
Authorize URL (scopes: user.info.basic, video.publish, ...) ──► /callback?code=ABC
        │                                            │
        ▼                                            ▼
   consent user                            POST /v2/oauth/token/
                                              access_token (24 jam)  + refresh_token (365 hari)
                                              simpan per-user; refresh via grant_type=refresh_token
```

## 3. Alur Upload Post (paling umum)

```
1) POST /v2/post/publish/content/init/   (DIRECT POST atau MEDIA_UPLOAD)
   post_info.title, privacy_level, video_file_size, ...
        │  response: publish_id
        ▼
2) POST /v2/post/publish/video/init/      → upload_url (FILE_UPLOAD) atau PULL_FROM_URL di step 1
        ▼
3) PUT  <upload_url>  chunk + Content-Range   (ulang per chunk; cek progress)
        ▼
4) tunggu → POST /v2/post/publish/status/fetch/ (publish_id)
   status: PROCESSING_UPLOAD → PROCESSING_DOWNLOAD → PROCESSING_SCREENSHOT → PUBLISH_COMPLETE | MEDIA_UPLOAD→SEND_TO_USER_INBOX
```

## 4. Penjelasan Kode

### 4.1 Init direct publish (reference/direct-post.md)

```bash
curl -X POST "https://open.tiktok.com/v2/post/publish/content/init/" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -H "X-Content-Type-Options: nosniff" \
  -d '{
    "post_info": { "title": "...#tag", "privacy_level": "PUBLIC_TO_EVERYONE",
                   "disable_duet": false, ... },
    "post_mode": "DIRECT POST",
    "source_info": { "source": "PULL_FROM_URL", "video_url": "https://domain-anda.com/v.mp4" }
  }'
# → { "data": { "publish_id": "..." }, ... }
```

- `post_mode="DIRECT POST"` (pakai spasi) posting langsung tayang; `"MEDIA_UPLOAD"` = masuk inbox, user buka app TikTok untuk finalize.
- `title` maks 2200 karakter; hashtag/mention langsung ditulis di `title`.

### 4.2 FILE_UPLOAD chunked (reference/upload-video.md, posting/media-transfer-guide.md)

```bash
# 1) init → upload_url
POST /v2/post/publish/video/init/ { "post_mode":"MEDIA_UPLOAD",
     "source_info": { "source":"FILE_UPLOAD", "video_size": 1048576,
                      "chunk_size": 1048576, "total_chunk_count": 1 } }
# → data.upload_url

# 2) kirim tiap bagian
PUT <upload_url> \
  -H "Content-Range: bytes 0-1048575/1048576" \
  -H "Content-Type: video/mp4" \
  --data-binary @part1.mp4
```

- Range = byte global file asli. Chunk maks 64MB, maks 10.000 chunk.
- Upload sesi bisa dilanjutkan (`refer/upload` guide: cek progress dulu sebelum kirim ulang).
- PULL_FROM_URL domain **harus diverifikasi** di Portal; tanpa verifikasi → `PULL_FROM_URL_REJECTED`.

### 4.3 Cek status (reference/get-video-status.md)

```bash
curl -X POST "https://open.tiktok.com/v2/post/publish/status/fetch/" \
  -H "Authorization: Bearer <TOKEN>" -d '{"publish_id":"..."}'
# "status": "PUBLISH_COMPLETE" | "FAILED" (+fail_reason) | "SEND_TO_USER_INBOX"
```

### 4.4 Creator info (reference/query-creator-info.md)

```bash
GET https://open.tiktok.com/v2/post/publish/creator_info/query/
→ data: { creator_info: { privacy_level_options, max_video_post_duration_sec, ... } }
```

- Panggil sebelum init — privacy pilihan bisa berubah per akun/user.

### 4.5 Token & refresh (getting-started/user-access-token-management.md)

```bash
POST /v2/oauth/token/   client_key + client_secret + code + grant_type=authorization_code
POST /v2/oauth/token/   grant_type=refresh_token
```

- Access token 24 jam → jangan simpan permanen; refresh_token sekali pakai (rotasi).

### 4.6 Batas

- Kuota per-endpoint (rate limit) diumumkan di halaman product & App Dashboard — cek `rate_limit_exceeded` (error 40109 family) di response `error.code`.
