# Threads API Documentation

Dokumentasi lengkap **Threads API** (Meta) untuk integrasi posting, baca-post, balas, insight, dan webhook.

- Base URL: `https://graph.threads.net/v1.0` (alternatif: `graph.threads.com`)
- Dokumentasi resmi: https://developers.facebook.com/documentation/threads
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur OAuth/publish + penjelasan kode |
| [getting-started/overview.md](getting-started/overview.md) | Pengenalan Threads API, rate limiting, kebijakan |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Tutorial posting pertama (create → status → publish) |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth: consent, scopes `threads_*`, tukar code → token |
| [getting-started/long-lived-tokens.md](getting-started/long-lived-tokens.md) | Short-lived → long-lived (~60 hari) |
| [getting-started/errors.md](getting-started/errors.md) | Troubleshooting error umum |

### Posting

| File | Isi |
|---|---|
| [posts/posts.md](posts/posts.md) | Jenis post: text, image, video, carousel, poll, ghost, thread |
| [posts/retrieve-posts.md](posts/retrieve-posts.md) | Ambil daftar post sendiri & profil publik |
| [posts/keyword-search.md](posts/keyword-search.md) | Keyword & topic tag search |
| [posts/mentions.md](posts/mentions.md) | Ambil mention ke akun user |

### Interactions

| File | Isi |
|---|---|
| [interactions/reply-management.md](interactions/reply-management.md) | Hide/unhide reply, kontrol siapa bisa balas, reply approvals |

### Analytics

| File | Isi |
|---|---|
| [analytics/insights.md](analytics/insights.md) | Metric insight per post & per akun |

### Webhooks

| File | Isi |
|---|---|
| [webhooks/webhooks.md](webhooks/webhooks.md) | Topic `threads`/`reply`, setup endpoint, moderate topic |

### API Reference (per area)

| File | Endpoint yang dicakup |
|---|---|
| [reference/reference-overview.md](reference/reference-overview.md) | Peta seluruh reference |
| [reference/publishing.md](reference/publishing.md) | `POST /{user}/threads`, `threads_publish`, `?fields=status`, `repost`, `DELETE` |
| [reference/user.md](reference/user.md) | `GET /{user}/threads`, profil, `profile_lookup`, `profile_posts` |
| [reference/threads-profiles.md](reference/threads-profiles.md) | Field profil user |
| [reference/insights.md](reference/insights.md) | `GET /{media}/insights`, `GET /{user}/threads_insights` |
| [reference/media-retrieval.md](reference/media-retrieval.md) | `GET /{media-id}`, `GET /keyword_search` |
| [reference/reply-management.md](reference/reply-management.md) | `replies`, `conversation`, `manage_reply`, `pending_replies` |
| [reference/locations.md](reference/locations.md) | `GET /{location-id}` |
| [reference/location-search.md](reference/location-search.md) | `GET /location_search` |
| [reference/oembed.md](reference/oembed.md) | `GET /oembed` |
| [reference/debug.md](reference/debug.md) | `GET /debug_token` |

### Tools

| File | Isi |
|---|---|
| [tools/web-intents.md](tools/web-intents.md) | Post intent & follow intent via URL |
| [tools/embed-post.md](tools/embed-post.md) | Embed post Threads ke web |
| [tools/postman-collection.md](tools/postman-collection.md) | Koleksi Postman resmi |
