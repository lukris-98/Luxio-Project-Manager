# Kemampuan Facebook Pages API & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** Pages API (Facebook) dan **kode mana yang melakukan apa**.

- Base URL: `https://graph.facebook.com/v25.0`
- Upload video: `https://rupload.facebook.com` (resumable)
- Dokumentasi resmi: https://developers.facebook.com/documentation/pages-api

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| daftar Page + Page token milik user | `GET /{user-id}/accounts` | sumber Page ID & Page Access Token |
| Publish post teks/link | `POST /{page-id}/feed` | `message`, `link`, `published`, `scheduled_publish_time` |
| Jadwal post | `POST /{page-id}/feed` | `published=false` + `scheduled_publish_time` (5 mnt–75 hari) |
| Tautkan foto ke post | `POST /{page-id}/feed` | `attached_media=[{"media_fbid":...}]` |
| Upload foto | `POST /{page-id}/photos` | `url` (publik) atau `source` (multipart) |
| Upload & publish video | `/{APP_ID}/uploads` (session) → `POST /{page-id}/videos` | handle dari resumable upload — `posting/video-publishing.md` |
| Insight video / crossposting video | Video API | `reference/video-api/`, `posting/video-crossposting.md` |
| Baca post Page | `GET /{page-id}/posts` atau `/feed` | termasuk post yang dibuat aplikasi |
| Baca komentar post | `GET /{post-id}/comments` | `pages_manage_engagement` |
| Balas/like/hapus komentar | `POST .../comments`, `POST .../likes`, `DELETE` | moderasi sebagai Page |
| Insight Page | `GET /{page-id}/insights` | `page_impressions`, `page_views_total`, … |
| Detail & edit Page | `GET/PATCH /{page-id}` | nama, bio, kategorisasi |
| Cari Page | `GET /search?type=page&q=...` | `manage/search-pages.md` |
| Webhook halaman | topic `feed` (post/komentar/reaksi baru) | `webhooks/webhooks-for-pages.md` |

**Permission kunci:** `pages_show_list`, `pages_manage_posts` (posting), `pages_read_engagement` (baca), `pages_manage_engagement` (balas/hapus komentar), `publish_video` (video), `pages_manage_metadata` (webhook/settings). Semua butuh Facebook Login + Page token.

## 2. Alur Token (berbeda dari Threads/IG)

```
Facebook Login ──► User token ──► GET /{user-id}/accounts ──► [Page ID + Page Access Token]
                                            │
                                            ▼
                                  POST /{page-id}/feed  (semua aksi Page pakai Page token)
```

- Page token = token page-area; long-lived via `GET /oauth/access_token?grant_type=fb_exchange_token` (lihat `getting-started/overview.md`).

## 3. Penjelasan Kode

### 3.1 Ambil Page & token (getting-started/quickstart.md)

```bash
curl "https://graph.facebook.com/v25.0/me/accounts?access_token=<USER_TOKEN>"
# → data: [{ "id": "<PAGE_ID>", "access_token": "<PAGE_TOKEN>", "name": "..." }]
```

### 3.2 Publish post teks/link

```bash
curl -X POST "https://graph.facebook.com/v25.0/<PAGE_ID>/feed" \
  -d "message=Teks post" \
  -d "link=https://contoh.com/artikel" \
  -d "access_token=<PAGE_TOKEN>"
# → { "id": "PAGEID_POSTID" }
```

- Link saja (tanpa `message`) = link post dengan preview otomatis.
- `published=false` + `scheduled_publish_time=<unix>` → post terjadwal (belum tayang; status=`scheduled_queue`).
- Foto sudah diupload: `attached_media=[{"media_fbid":"<PHOTO_ID>"}]` + `allow_backdating` opsional.

### 3.3 Upload foto (posting/posts.md)

```bash
POST /<PAGE_ID>/photos  source=@foto.jpg        # atau url=https://...
POST /<PAGE_ID>/feed    message=... published=false attached_media=[{"media_fbid":"<id>"}]
```

- `published=false` pada photos = upload "tidak terlihat" dulu, baru dilampirkan ke post (polanya sama dengan container Threads/IG).

### 3.4 Video 2 langkah (posting/video-publishing.md)

```
1) POST /<APP_ID>/uploads?upload_phase=start → upload_session_id + start_offset
2) POST /<APP_ID>/uploads (chunk, header X-CONTENT-RANGE) → selesai → file_handle
3) POST /<PAGE_ID>/videos  fbupload_video_file_chunk=<file_handle> + description + title → video_id
```

### 3.5 Insight (analytics/page-insights.md)

```bash
curl "https://graph.facebook.com/v25.0/<PAGE_ID>/insights?metric=page_impressions,page_views_total,page_follows&access_token=<PAGE_TOKEN>"
curl "https://graph.facebook.com/v25.0/<POST_ID>/insights?metric=post_impressions&access_token=<PAGE_TOKEN>"
```

### 3.6 Webhook feed (webhooks/webhooks-for-pages.md)

```
GET  callback?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...  → echo challenge
app.subscribe(subscribed_fields=feed, object=page)  di App Dashboard
→ POST event: entry[].changes[] dengan item="comment" | "post" | "like" | "share"
```

### 3.7 Error (getting-started/errors.md)

Kode 190=token kedaluwarsa; 200=permission kurang; 100=param invalid — tangani dengan refresh token & cek scope.
