# Kemampuan Threads API & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** Threads API dan **kode mana yang melakukan apa**, berdasarkan halaman-halaman di folder ini.

- Base URL: `https://graph.threads.net/v1.0` (alternatif: `graph.threads.com`)
- Dokumentasi resmi: https://developers.facebook.com/documentation/threads

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Autorisasi user (OAuth) | Browser → `threads_content_publish` dll. | Menghasilkan code → short-lived token |
| Tukar code → token | `POST /oauth/access_token` | Short-lived user token |
| Token long-lived (60 hari) | `GET /access_token?grant_type=th_exchange_token` | Untuk server-side |
| Debug token (validitas/scope) | `GET /debug_token` | `input_token` + app token |
| Buat container media | `POST /{user-id}/threads` | `media_type`: TEXT/IMAGE/VIDEO/CAROUSEL |
| Publish container | `POST /{user-id}/threads_publish` | Butuh `creation_id` |
| Cek status container | `GET /{container-id}?fields=status` | `IN_PROGRESS` / `FINISHED` / `FAILED` |
| Reply otomatis ke post sendiri | `reply_to_id` pada publish | Langkah 1 thread → langkah 2 reply |
| Repost post | `POST /{media-id}/repost` | Quote = kirim `media_id` sebagai body |
| Hapus post | `DELETE /{media-id}` | Ghost post bisa dihapus saat siap |
| Ambil daftar post user sendiri | `GET /{user-id}/threads` | Butuh `threads_content_publish`; privat milik user |
| Ambil post profil publik | `GET /profile_posts?username=...` | Profil publik saja |
| Detail 1 media | `GET /{media-id}` | Fields: `permalink`, `media_url`, dll. |
| Profil user | `GET /me?fields=id,username,...` | `threads_basic` |
| Cari profil by username | `GET /profile_lookup?username=...` | User ID publik |
| Insight per post | `GET /{media-id}/insights` | `views`, `likes`, `replies`, `reposts`, `quotes`, `follows` |
| Insight per akun (rentang) | `GET /{user-id}/threads_insights` | `overall_impressions`, dsb. — `threads_manage_insights` |
| Keyword / topic search | `GET /keyword_search?keyword=...` | Public posts (app review + region) |
| Mentions ke user | `GET /{user-id}/mentions` | `threads_read_replies` |
| Lihat replies / conversation | `GET /{media-id}/replies`, `/conversation` | `threads_read_replies` |
| Sembunyikan / pulihkan reply | `POST /{reply-id}/manage_reply` (`hide`/`unhide`) | `threads_manage_replies` |
| Daftar pending replies | `GET /{media-id}/pending_replies` | Post dengan `enable_reply_approvals` |
| Webhook (create/delete/update) | Topic `threads`, `reply` | Notifikasi real-time |
| Tag lokasi + cari lokasi | `location_id`, `GET /location_search`, `GET /{location-id}` | Fitur lokasi |
| oEmbed | `GET /oembed?url=...` | HTML embed siap tempel |
| Web intents (tanpa token) | `https://threads.net/intent?op=post...` | Composer / follow via URL |
| Debug tool | `GET /debug_token` | Inspeksi expiry/scope token |

## 2. Alur Autentikasi

```
User login ──► Consent screen (scope threads_*) ──► redirect ?code=ABC123
                                                          │
                                     POST /oauth/access_token
                                                          │
                                            short-lived token ──► GET /access_token
                                                          │             (grant_type=th_exchange_token)
                                                          ▼
                                            long-lived token (≈60 hari) ──► semua endpoint graph.threads.net
```

## 3. Alur Publishing (2 langkah)

```
POST /{user-id}/threads                POST /{container-id}?fields=status        POST /{user-id}/threads_publish
  media_type=IMAGE|VIDEO|TEXT   ──►      polling sampai FINISHED            ──►    creation_id=<id>
  (jadi CONTAINER, dapat id)                                                    (post live, dapat media_id)

Carousel: buat tiap item dengan is_carousel_item=true → kumpulkan id →
          container CAROUSEL dengan children=[id1,id2,...] → publish.
Thread multi-post: publish post-1 → ambil media_id → post-2 reply_to_id=<id1>.
```

## 4. Penjelasan Kode

### 4.1 Consent URL (getting-started/authentication.md)

```
https://threads.net/oauth/authorize
  ?client_id=<APP_ID>          // aplikasi terdaftar di Meta for Developers
  &redirect_uri=<URI>          // harus cocok persis dengan App Settings
  &response_type=code          // flow authorization-code
  &scope=threads_basic,threads_content_publish
```

- Tanpa `threads_content_publish` → tidak bisa posting.
- Tanpa `threads_manage_insights` → endpoint insights ditolak.

### 4.2 Tukar code (getting-started/authentication.md)

```bash
curl -X POST "https://graph.threads.net/oauth/access_token" \
  -d "client_id=<APP_ID>&client_secret=<APP_SECRET>" \
  -d "code=<KODE>&redirect_uri=<URI>&grant_type=authorization_code"
```

→ `{ "access_token": "...", "expires_in": 86400 }` (24 jam).

### 4.3 Long-lived (getting-started/long-lived-tokens.md)

```bash
curl -X GET "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<APP_SECRET>&access_token=<SHORT>"
```

- `grant_type=th_exchange_token` = mekanisme khusus Threads (mirip Facebook `fb_exchange_token`).
- Berlaku ≈60 hari; refresh ulang sebelum expiry dengan request yang sama.

### 4.4 Create → publish (reference/publishing.md)

```bash
# 1) Container gambar + caption
curl -X POST "https://graph.threads.net/v1.0/<USER_ID>/threads" \
  -d "media_type=IMAGE" -d "image_url=https://...jpg" \
  -d "text=Halo dunia" -d "access_token=<TOKEN>"
# → {"id":"container-178...","status":"IN_PROGRESS"}

# 2) Tunggu status FINISHED
curl "https://graph.threads.net/v1.0/container-178...?fields=status&access_token=<TOKEN>"

# 3) Publish
curl -X POST "https://graph.threads.net/v1.0/<USER_ID>/threads_publish" \
  -d "creation_id=container-178..." -d "access_token=<TOKEN>"
# → {"id":"post-media-id"}
```

- **TEXT-only auto-publish:** kirim `auto_publish_text=true` → langkah 2–3 dilompati.
- `reply_to_id` saat publish = jadikan post ini balasan (untuk thread/utasan).
- `poll_attachment` = { "title": "Pertanyaan", "options": [{...}] } — post poll.
- `is_ghost_post=true` = post tidak langsung tampil; publish via webhook/trigger nanti.
- `crossreshare_to_ig=true` = ikut share ke Story Instagram yang tertaut.

### 4.5 Insight (reference/insights.md)

```bash
curl "https://graph.threads.net/v1.0/<MEDIA_ID>/insights?metric=views,likes,replies,reposts,repost_by_others,quotes,follows&access_token=<TOKEN>"
```

- Granularitas rentang akun (`/threads_insights`): metric bisa per hari/7 hari — lihat `analytics/insights.md`.

### 4.6 Keyword search (posts/keyword-search.md)

```bash
curl "https://graph.threads.net/v1.0/keyword_search?keyword=crypto&search_type=text&access_token=<APP_TOKEN>"
```

- Hasil = post publik yang mengandung kata kunci; fitur sensitif → butuh review + tersedia per region.

### 4.7 Rate limit (getting-started/overview.md)

```
calls/24 jam           = 4800 × number_of_impressions
total CPU time         = 720 000 × impressions
```

- Impression = tayangan konten akun user di 24 jam terakhir → akun baru dibatasi ketat.
