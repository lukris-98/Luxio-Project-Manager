# Facebook Pages API Documentation

Dokumentasi **Facebook Pages API + Video API** (Meta) — publish post/foto/video sebagai Halaman, jadwal, komentar, insights, dan webhooks.

- Base URL: `https://graph.facebook.com/v25.0`
- Upload video: `https://rupload.facebook.com` (resumable)
- Dokumentasi resmi: https://developers.facebook.com/documentation/pages-api , https://developers.facebook.com/documentation/video-api
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur token & publish + penjelasan kode |
| [getting-started/overview.md](getting-started/overview.md) | Gambaran Pages API, permission (`pages_manage_posts` dll.), Page role |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Steps: Page ID + Page token → post pertama |
| [getting-started/errors.md](getting-started/errors.md) | Kode error Pages API |
| [getting-started/video-api-quickstart.md](getting-started/video-api-quickstart.md) | Quickstart Video API |

### Posting

| File | Isi |
|---|---|
| [posting/posts.md](posting/posts.md) | Text/link/photo post, jadwal, targeting, edit/hapus |
| [posting/video-publishing.md](posting/video-publishing.md) | Upload session → chunk → publish video |
| [posting/video-crossposting.md](posting/video-crossposting.md) | Crosspost video ke Page/akun lain |

### Management

| File | Isi |
|---|---|
| [manage/manage-pages.md](manage/manage-pages.md) | Detail Page, settings, category, tasks per token |
| [manage/search-pages.md](manage/search-pages.md) | `GET /search?type=page` |

### Analytics

| File | Isi |
|---|---|
| [analytics/page-insights.md](analytics/page-insights.md) | Metric Page & post |
| [analytics/video-insights.md](analytics/video-insights.md) | Metric video |

### Webhooks

| File | Isi |
|---|---|
| [webhooks/webhooks-for-pages.md](webhooks/webhooks-for-pages.md) | Topic `feed` (post/komentar/reaksi), verifikasi callback |

### Reference

| File | Isi |
|---|---|
| [reference/changelog.md](reference/changelog.md) | Riwayat perubahan Graph API |
| [reference/upcoming-changes.md](reference/upcoming-changes.md) | Perubahan yang akan datang |
| [reference/video-api-overview.md](reference/video-api-overview.md) | Navigasi Video API |
| [reference/video-api/overview.md](reference/video-api/overview.md) | Overview object Video |
| [reference/video-api/reference.md](reference/video-api/reference.md) | Reference endpoint Video |
