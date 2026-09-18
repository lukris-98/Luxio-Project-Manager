# Kemampuan Instagram Platform & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** Instagram Platform API dan **kode mana yang melakukan apa**.

- Host: `graph.instagram.com` (Instagram Login) atau `graph.facebook.com` (Facebook Login) — versi contoh: `v25.0`
- Dokumentasi resmi: https://developers.facebook.com/documentation/instagram-platform
- Instagram **harus akun Business/Creator** untuk API posting/insights.

---

## 1. Dua Jalur Login

| | Instagram API with Facebook Login | Instagram API with Instagram Login |
|---|---|---|
| Login | Akun Facebook (Page tertaut IG) | Langsung akun Instagram |
| Host | `graph.facebook.com` | `graph.instagram.com` |
| Permission | `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights` (+ `pages_*`) | `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_comments`, `instagram_business_manage_insights` |
| Upload video | `rupload.facebook.com` (resumable) | via URL publik |
| Cocok untuk | Page Bisnis terverifikasi / manajemen multi-akun via Business Manager | SaaS yang onboarding user IG langsung |

**Access level:** Standar = data terbatas; Advanced (lewat App Review) = wajib untuk webhook `comments`, insight penuh, dan akun orang lain.

## 2. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Buat container media | `POST /{IG_ID}/media` | `media_type`: IMAGE/VIDEO/REELS/STORIES/CAROUSEL |
| Cek kelayakan publish | `GET /{CONTAINER_ID}?fields=status_code` | `IN_PROGRESS`/`FINISHED`/`FAILED`/`EXPIRED` |
| Publish | `POST /{IG_ID}/media_publish` | `creation_id=<container>` |
| Carousel | item `is_carousel_item=true` → container `media_type=CAROUSEL` + `children` | maks 10 item |
| Reels upload langsung | `POST` ke `rupload.facebook.com` (resumable session) | hanya jalur FB Login |
| Share IG → FB simultaneously | parameter `share_to_feed=true` | IG post ke Feed Facebook |
| Ambil post | `GET /{IG_ID}/media`, `get /{media-id}` | `ig-user-media.md` |
| Caption / update media | `POST /{media-id}` | 1x dalam 1 jam |
| Hapus media | `DELETE /{media-id}` | |
| Insight per media | `GET /{media-id}/insights` | `likes`, `comments`, `plays`, `engagement`, `saved`, dll. |
| Insight akun | `GET /{IG_ID}/insights` | `profile_views`, `reach`, `impressions`, `views` |
| Komentar (baca) | `GET /{media-id}/comments` | IG & FB comments |
| Balas / hapus komentar | `POST /{comment-id}/comments`, `DELETE /{comment-id}` | `..._manage_comments`; untuk komentar FB dari post IG gunakan `instagram_resolve_comment` dsb. — lihat `interactions/comment-moderation.md` |
| Hide komentar | `POST /{media-id}?hide_comments=true` | moderasi |
| Hashtag search | `GET /ig_hashtag_search?user_id=..&q=..` → `GET /{hashtag-id}/recent_media` / `top_media` | Advanced Access |
| Mentions | `GET /{IG_ID}/mentions` | post yang mention app user |
| Business discovery | `GET /{IG_USER_ID}?fields=username,media_count,...` | profil publik akun IG bisnis |
| Webhooks | topic `comments`, `live_comments`, `mentions`, `story_insights` | verifikasi `hub.challenge` |
| Share via app (mobile SDK) | Sharing to Feed / Stories (Android & iOS) | bukan REST — tombol share dari aplikasi native |
| Error code | `reference/error-codes.md` | 100=invalid token, 9007=limit publish, dll. |

## 3. Alur Publish (sama seperti Threads, 2 langkah)

```
POST /{IG_ID}/media                    GET /{CONTAINER_ID}?fields=status_code        POST /{IG_ID}/media_publish
  media_type=IMAGE|REELS|STORIES  ─►     polling FINISHED                       ─►     creation_id=<container>
  image_url / video_url / caption                                            (dapat media_id publik)
```

## 4. Penjelasan Kode

### 4.1 Create container gambar (posting/content-publishing.md)

```bash
curl -X POST "https://graph.instagram.com/v25.0/<IG_ID>/media" \
  -d "image_url=https://contoh.com/foto.jpg" \
  -d "caption=Teks post (maks 2200 karakter)" \
  -d "media_type=IMAGE" \
  -d "access_token=<TOKEN>"
# → { "id": "1789..." }   <- ini CONTAINER ID (bukan media id akhir)
```

- `image_url`/`video_url` **harus** bisa diakses publik (server Anda).
- Video/Reels di jalur Instagram Login juga butuh URL publik; di jalur FB Login bisa upload biner via `rupload.facebook.com` (Resumable Upload Session — lihat bagian *Resumable Upload* di file yang sama).

### 4.2 Publish (posting/content-publishing.md)

```bash
curl -X POST "https://graph.instagram.com/v25.0/<IG_ID>/media_publish" \
  -d "creation_id=<CONTAINER_ID>" \
  -d "access_token=<TOKEN>"
# → { "id": "media_id" }
```

- Panggil **hanya setelah** `status_code=FINISHED` — publish lebih awal = error 2200200.
- **Kuota publish: 100 post API / 24 jam / akun** (carousel dihitung 1).

### 4.3 Carousel

```bash
# item 1..N
POST /{IG_ID}/media  media_type=IMAGE   & image_url=... & is_carousel_item=true
# container carousel
POST /{IG_ID}/media  media_type=CAROUSEL & children=<id1>,<id2>,... & caption=...
```

### 4.4 Insight (analytics/insights.md)

```bash
curl "https://graph.instagram.com/v25.0/<IG_ID>/insights?metric=profile_views,reach&access_token=<TOKEN>"
curl "https://graph.facebook.com/v25.0/<MEDIA_ID>/insights?metric=likes,comments&access_token=<TOKEN>"
```

- Metric akun & media berbeda daftar — cek `reference/instagram-media-insights.md`.

### 4.5 Webhook verify (webhooks/webhooks.md)

```
GET /your-callback?hub.mode=subscribe&hub.challenge=<angka>&hub.verify_token=<sesuai dashboard>
→ balas plain 200 + isikan hub.challenge
```

- Subscribe topik: `subscribed_fields=comments,mentions` di App Dashboard (Webhooks → Instagram).
- `comments`/`live_comments` butuh Advanced Access.

### 4.6 Hashtag search (facebook-login/hashtag-search.md)

```bash
curl "https://graph.facebook.com/v25.0/ig_hashtag_search?user_id=<IG_ID>&q=futsal&access_token=<TOKEN>"
curl "https://graph.facebook.com/v25.0/<HASHTAG_ID>/recent_media?user_id=<IG_ID>&access_token=<TOKEN>"
```
