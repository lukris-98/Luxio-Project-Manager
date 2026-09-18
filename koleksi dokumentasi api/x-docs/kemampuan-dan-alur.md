# Kemampuan X API (Twitter) v2 & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** X API v2 dan **kode mana yang melakukan apa**.

- Base URL: `https://api.x.com` (dulu api.twitter.com — sama, path `/2`)
- Dokumentasi resmi: https://docs.x.com · index: https://docs.x.com/llms.txt · `.md` di akhir URL = raw markdown
- Ringkasan resmi lain di repo ini: folder `x-docs/`

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Post tweet (teks) | `POST /2/tweets` | body `{ "text": "..." }`; scopes `tweet.write` |
| Post + gambar/video | `POST /2/tweets` dengan `media.media_ids=[...]` | media diupload dulu (bagian 3) |
| Poll | `poll.options[]`, `poll.duration_minutes` | maks 4 pilihan |
| Balasan | `reply.in_reply_to_tweet_id` | |
| Repost/quote | repost via Likes-style endpoint `POST /2/tweets/:id/retweets`; quote = `quote_tweet_id` (Enterprise) | |
| Edit/Delete | `PUT /2/tweets/:id` (edit window), `DELETE /2/tweets/:id` | |
| Timeline user | `GET /2/users/:id/tweets`, `/mentions`, `/timelines/reverse_chronological` | |
| Cari tweet | `GET /2/tweets/search/recent` (7 hari), `/all` (arsip penuh, Pro+) | query operator standar |
| Hitung tweet | `GET /2/tweets/counts/recent`, `/all` | per jumlah |
| Insight | `GET /2/tweets/:id/28_hour_metrics`, `historical_metrics` | impressions, likes, dll. (App-only) |
| Media analytics | `GET /2/media/analytics` | per media key |
| Lookup user | `GET /2/users/me`, `/2/users/:id`, `/2/users/by/username/:u`, bulk `/by/ids` | `users.read` |
| Follow/unfollow | `POST/DELETE /2/users/:id/following` | scope `follows.write` |
| Like/unlike | `POST/DELETE /2/users/:id/likes` | scope `like.write` |
| Repost/unrepost | `POST/DELETE /2/users/:id/retweets` | scope `tweet.write` |
| Hide reply | `POST|PUT /2/tweets/:id/hidden` | |
| DM | `POST /2/dm_conversations`, `.../messages` | DM API |
| Filtered stream | `GET /2/tweets/search/stream` + `rules` | koneksi SSE realtime |
| Webhook activity | `POST /2/activity` (Account Activity) + event streaming (Enterprise) | |
| Compliance batch | jobs: upload ID tweet/user → cek status | |
| Lists / Spaces / Bookmarks / Community Notes | `/2/lists...`, `/2/spaces...` | lihat index resmi (413 halaman) |

## 2. Alur OAuth 2.0 (PKCE) — pilihan utama untuk aksi user

```
Buat app di developer.x.com → App ID + Client ID (+Secret utk confidential)
        │
        ▼
GET https://x.com/i/oauth2/authorize?response_type=code&client_id=..
    &redirect_uri=..&scope=tweet.read%20tweet.write%20users.read%20offline.access
    &state=xyz&code_challenge=..&code_challenge_method=S256
        │  user login + consent
        ▼
POST https://api.x.com/2/oauth2/token (Basic auth client_id:secret)
    grant_type=authorization_code&code=..&code_verifier=..&redirect_uri=..
        ▼
access_token (2 jam) + refresh_token (offline.access) → refresh grant_type=refresh_token
```

**Mode lain:** App-only Bearer = read publik (search, user lookup). OAuth 1.0a masih ada namun deprecated — utamakan OAuth 2.0.

## 3. Alur Media & Publish

```
Media (gambar ≤5MB / video besar → chunked):
1) POST /2/media/upload/initialize   → media_id + max_video_duration_ms + chunk_size + processing_info
2) POST /2/media/upload/append?media_id=..   (base64 chunk, urut; ulangi per bagian)
3) POST /2/media/upload/finalize     → status SUCCEEDED/PROCESSING/FAILED ← polling GET /2/media/upload/:id/status
4) POST /2/tweets {text, media:{media_ids:[id]}}
```

## 4. Penjelasan Kode

### 4.1 Post teks (posting/create-post.md)

```bash
curl -X POST "https://api.x.com/2/tweets" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "text": "Halo dari Luxio! #test",
        "reply": { "in_reply_to_tweet_id": "123..." } }'
# → { "data": { "id": "18...", "text": "..." }, "errors": [] }
```

- Token HARUS user-context dengan scope `tweet.write`; app-only → `403 Unsupported Authentication`.
- Flag AI-generated media: `media.disclose_media_experience` — cek file OpenAPI di halaman.

### 4.2 Upload gambar (posting/upload-media.md)

```bash
# satu panggilan (gambar kecil)
POST /2/media/upload?command=UPLOAD&media_data=<base64>&media_type=image/jpeg
```

- Respons = `media_id` siap masuk `media.media_ids`.

### 4.3 Video chunk (reference/initialize→append→finalize)

```
initialize: { media_type: "video/mp4", media_category: "amplify_video_1080p30", shared: true, total_size, additional_media_info { description }, max_duration_seconds }
            → { data: { media_id, chunk_size_bytes } }
append    : ?media_id=..&segment_index=N  body = base64 chunk N
finalize  : ?media_id=..&status.succeeded=true ; polling status sampai SUCCEEDED sebelum posting
```

- `media_category` menentukan resolusi yang diterima (lihat Best Practices).
- Media non-public (expired ± ) — simpan salinan sendiri bila perlu jangka panjang.

### 4.4 Read/search (search/recent.md)

```bash
curl "https://api.x.com/2/tweets/search/recent?query=luxio%20-has:retweets&max_results=25&user.fields=public_metrics&expansions=author_id&access_token=<BEARER>"
```

### 4.5 Insight & analytics (analytics/*.md)

```bash
curl "https://api.x.com/2/tweets/202609091234567890/metrics?access_token=<APP_ONLY_BEARER>"
```

- App-only + pemilik akun; metric granular per jam/7d/30d → lihat `get-historical-post-insights.md`.

### 4.6 Rate limit (getting-started/rate-limits.md)

```
Header: x-rate-limit-limit / -remaining / -reset (unix detik)
POST /2/tweets  = 10.000/24 jam per user (Basic) ; GET /2/tweets/search/recent = 450/15 mnt
429 Too Many Requests → tunggu reset, jangan retry agresif.
```
