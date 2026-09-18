# X (Twitter) API v2 Documentation

Dokumentasi **X API v2** (docs.x.com) — post tweet, media upload (gambar/video chunked), search, timelines, metrics, interactions (like/repost/follow/DM), filtered stream, dan OAuth 2.0 PKCE.

- Base URL: `https://api.x.com/2`
- Dokumentasi resmi: https://docs.x.com (index: https://docs.x.com/llms.txt; endpoint penuh: https://docs.x.com/x-api/llms.txt)
- Trik: tambahkan `.md` ke URL halaman docs.x.com → raw markdown.
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur OAuth & publish + penjelasan kode |
| [getting-started/overview.md](getting-started/overview.md) | Pengenalan X API |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Request pertama (cURL) + contoh |
| [getting-started/guidelines.md](getting-started/guidelines.md) | Kebijakan developer |
| [getting-started/authentication.md](getting-started/authentication.md) | Ikhtisar metode auth |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Tabel limit per endpoint per plan + header x-rate-limit |

### Authentication (OAuth)

| File | Isi |
|---|---|
| [authentication/oauth2-overview.md](authentication/oauth2-overview.md) | Mode OAuth 2.0 |
| [authentication/oauth2-authorization-code-pkce.md](authentication/oauth2-authorization-code-pkce.md) | PKCE step-by-step |
| [authentication/oauth2-user-access-token.md](authentication/oauth2-user-access-token.md) | Akses & refresh token user |
| [authentication/app-only.md](authentication/app-only.md) | App-only Bearer (read publik) |
| [authentication/bearer-tokens.md](authentication/bearer-tokens.md) | Konsep bearer |
| [authentication/token-api-reference.md](authentication/token-api-reference.md) | Endpoint `/2/oauth2/token`, `/2/oauth2/revoke`, dsb. |
| [authentication/oauth1-overview.md](authentication/oauth1-overview.md) | Legacy OAuth 1.0a |
| [authentication/login-with-x.md](authentication/login-with-x.md) | "Log in with X" untuk web app |

### Posting

| File | Endpoint yang dicakup |
|---|---|
| [posting/create-post.md](posting/create-post.md) | `POST /2/tweets` (text, media, poll, reply, geo) |
| [posting/edit-post.md](posting/edit-post.md) | `PUT /2/tweets/:id` |
| [posting/delete-post.md](posting/delete-post.md) | `DELETE /2/tweets/:id` |
| [posting/media-overview.md](posting/media-overview.md) | Panduan upload media |
| [posting/upload-media.md](posting/upload-media.md) | `POST /2/media/upload` (single call) |

### Media Upload (Chunked 3 langkah)

| File | Endpoint |
|---|---|
| [reference/initialize-media-upload.md](reference/initialize-media-upload.md) | `POST /2/media/upload/initialize` |
| [reference/append-media-upload.md](reference/append-media-upload.md) | `POST /2/media/upload/append` |
| [reference/finalize-media-upload.md](reference/finalize-media-upload.md) | `POST /2/media/upload/finalize` |
| [reference/get-media-upload-status.md](reference/get-media-upload-status.md) | `GET /2/media/upload/:id/status` |
| [reference/create-media-metadata.md](reference/create-media-metadata.md) | `POST /2/media/metadata` |

### Interactions

| File | Isi |
|---|---|
| [interactions/follow.md](interactions/follow.md) | Follow/unfollow |
| [interactions/followers.md](interactions/followers.md) | Lookup followers/following |
| [interactions/manage-likes.md](interactions/manage-likes.md) | Like/unlike + lookup |
| [interactions/manage-reposts.md](interactions/manage-reposts.md) | Repost/unrepost |
| [interactions/liked-posts.md](interactions/liked-posts.md) | Tweet yang di-like user |
| [interactions/hide-reply.md](interactions/hide-reply.md) | Sembunyikan balasan |
| [interactions/block-dms.md](interactions/block-dms.md) | Block DM |

### Search & Timelines

| File | Endpoint |
|---|---|
| [search/recent.md](search/recent.md) | `GET /2/tweets/search/recent` |
| [search/all.md](search/all.md) | `GET /2/tweets/search/all` |
| [search/recent-counts.md](search/recent-counts.md) | `GET /2/tweets/counts/recent` |
| [search/all-counts.md](search/all-counts.md) | `GET /2/tweets/counts/all` |
| [reference/users/posts-timeline.md](reference/users/posts-timeline.md) | `GET /2/users/:id/tweets` |
| [reference/users/mentions.md](reference/users/mentions.md) | `GET /2/users/:id/mentions` |

### Analytics

| File | Endpoint |
|---|---|
| [analytics/28h-insights.md](analytics/28h-insights.md) | `GET /2/tweets/:id/28_hour_metrics` |
| [analytics/historical-insights.md](analytics/historical-insights.md) | `GET /2/tweets/:id/historical_metrics` |
| [analytics/media-analytics.md](analytics/media-analytics.md) | `GET /2/media/analytics` |

### Users & Posts Lookup

| File | Endpoint |
|---|---|
| [reference/users/me.md](reference/users/me.md) | `GET /2/users/me` |
| [reference/users/by-id.md](reference/users/by-id.md) · [by-username.md](reference/users/by-username.md) | lookup |
| [reference/users/bulk-by-id.md](reference/users/bulk-by-id.md) · [bulk-by-username.md](reference/users/bulk-by-username.md) | bulk lookup |
| [reference/users/reposts-of-me.md](reference/users/reposts-of-me.md) | `GET /2/users/:id/reposted_tweets` |
| [reference/posts/by-ids.md](reference/posts/by-ids.md) | `GET /2/tweets` |
| [reference/posts/reposts.md](reference/posts/reposts.md) · [reposts-lookup.md](reference/posts/reposts-lookup.md) | reposts |
| [reference/data-dictionary.md](reference/data-dictionary.md) | fields, expansions, pagination |

### Realtime

| File | Isi |
|---|---|
| [streams/volume-streams.md](streams/volume-streams.md) | Volume streams (firehose dll.) |
| [webhooks/account-activity.md](webhooks/account-activity.md) | Account Activity API / webhooks |

> Index 413 halaman resmi (DM, Lists, Spaces, Community Notes, Compliance, Ads, X Chat) ada di https://docs.x.com/x-api/llms.txt — folder ini mencakup halaman esensial untuk posting & distribusi konten.
