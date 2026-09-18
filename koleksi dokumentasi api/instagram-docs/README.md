# Instagram Platform API Documentation

Dokumentasi lengkap **Instagram Platform API** (Meta) — dua jalur login (Facebook Login & Instagram Login), publishing (Feed/Reels/Stories/Carousel), insights, komentar, hashtag, dan webhooks.

- Base URL: `https://graph.instagram.com` (Instagram Login) / `https://graph.facebook.com` (Facebook Login)
- Dokumentasi resmi: https://developers.facebook.com/documentation/instagram-platform
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur publish + penjelasan kode |
| [getting-started/overview.md](getting-started/overview.md) | Gambaran platform, access level, App Review, permission |
| [facebook-login/overview.md](facebook-login/overview.md) | Instagram API with Facebook Login (via Page/Business Manager) |
| [instagram-login/overview.md](instagram-login/overview.md) | Instagram API with Instagram Login (graph.instagram.com) |

### Posting

| File | Isi |
|---|---|
| [posting/content-publishing.md](posting/content-publishing.md) | Create container → cek `status_code` → `media_publish`; carousel; Reels; resumable upload; `share_to_feed` |

### Analytics

| File | Isi |
|---|---|
| [analytics/insights.md](analytics/insights.md) | Insight akun & media, metric yang tersedia |

### Interactions

| File | Isi |
|---|---|
| [interactions/comment-moderation.md](interactions/comment-moderation.md) | Baca/balas/hapus/sembunyikan komentar (IG & komentar Facebook) |

### Webhooks

| File | Isi |
|---|---|
| [webhooks/webhooks.md](webhooks/webhooks.md) | Setup subscription + topik `comments`, `mentions`, `story_insights`, verifikasi `hub.challenge` |

### Discovery & Search (Facebook Login)

| File | Isi |
|---|---|
| [facebook-login/hashtag-search.md](facebook-login/hashtag-search.md) | `ig_hashtag_search`, `recent_media`, `top_media` |
| [facebook-login/mentions.md](facebook-login/mentions.md) | Endpoint mentions |
| [facebook-login/business-discovery.md](facebook-login/business-discovery.md) | Data publik akun bisnis lain |

### API Reference (Object)

| File | Isi |
|---|---|
| [reference/instagram-media.md](reference/instagram-media.md) | Object `IG Media` — create/read/update/delete |
| [reference/ig-container.md](reference/ig-container.md) | Object `Instagram Container` (status publish) |
| [reference/ig-user-media.md](reference/ig-user-media.md) | Edge `/{ig-user}/media` |
| [reference/instagram-media-insights.md](reference/instagram-media-insights.md) | Edge insights media |
| [reference/error-codes.md](reference/error-codes.md) | Kode error Instagram Platform |

### Sharing dari Aplikasi (Mobile SDK)

| File | Isi |
|---|---|
| [sharing/sharing-to-feed.md](sharing/sharing-to-feed.md) | Share ke Feed via Android/iOS SDK |
| [sharing/sharing-to-stories.md](sharing/sharing-to-stories.md) | Share ke Stories via SDK (termasuk FB Stories) |
