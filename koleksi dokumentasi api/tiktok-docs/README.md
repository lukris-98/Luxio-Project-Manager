# TikTok for Developers API Documentation

Dokumentasi **TikTok Developer Docs** (v2) untuk Login Kit, Content Posting API, Display API, dan Webhooks.

- Base URL: `https://open.tiktok.com`
- Dokumentasi resmi: https://developers.tiktok.com/docs/en/
- Ringkasan kemampuan & alur kode: [kemampuan-dan-alur.md](kemampuan-dan-alur.md)
- Catatan: halaman docs TikTok dimuat via JavaScript; file di sini adalah hasil render markdown dari URL resmi (Sumber tercantum di header tiap file).

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [kemampuan-dan-alur.md](kemampuan-dan-alur.md) | Daftar kemampuan + alur OAuth & publish + penjelasan kode |
| [getting-started/create-an-app.md](getting-started/create-an-app.md) | Membuat app, credential, product activation |
| [getting-started/scopes-overview.md](getting-started/scopes-overview.md) | Daftar scope & pengelolaannya |
| [getting-started/user-access-token-management.md](getting-started/user-access-token-management.md) | Token: tukar code, refresh, revoke |
| [getting-started/login-kit-overview.md](getting-started/login-kit-overview.md) | Login Kit — semua platform |
| [getting-started/login-kit-web.md](getting-started/login-kit-web.md) | Login Kit web app |
| [getting-started/quickstart-direct-post.md](getting-started/quickstart-direct-post.md) | Quickstart Direct Post |
| [getting-started/quickstart-upload-content.md](getting-started/quickstart-upload-content.md) | Quickstart Upload Content (draft ke inbox) |

### Posting

| File | Isi |
|---|---|
| [posting/media-transfer-guide.md](posting/media-transfer-guide.md) | Chunked upload + Pull from URL + verifikasi domain |
| [posting/content-sharing-guidelines.md](posting/content-sharing-guidelines.md) | Kebijakan konten sebelum publish |

### API Reference

| File | Endpoint yang dicakup |
|---|---|
| [reference/direct-post.md](reference/direct-post.md) | Init direct post & kirim video ke server |
| [reference/photo-post.md](reference/photo-post.md) | Photo post (`/v2/post/publish/content/init/`) |
| [reference/upload-video.md](reference/upload-video.md) | Init upload video + PUT chunk |
| [reference/get-video-status.md](reference/get-video-status.md) | `POST /v2/post/publish/status/fetch/` |
| [reference/query-creator-info.md](reference/query-creator-info.md) | `GET /v2/post/publish/creator_info/query/` |

### Analytics / Display API

| File | Endpoint yang dicakup |
|---|---|
| [analytics/display-api-get-started.md](analytics/display-api-get-started.md) | Tampil profil & video user di web/app Anda |
| [analytics/get-user-info.md](analytics/get-user-info.md) | `GET /v2/user/` |

### Webhooks

| File | Isi |
|---|---|
| [webhooks/webhooks-overview.md](webhooks/webhooks-overview.md) | Mekanisme webhook, retry 72 jam, idempotensi |

---

## Halaman yang Tidak Dapat Diambil (SPA-only)

Beberapa halaman tidak bisa dirender otomatis dan perlu dibuka manual di browser:

- `api-rate-limit-guide` — https://developers.tiktok.com/docs/en/api-rate-limit-guide
- `webhooks-integrate` — https://developers.tiktok.com/docs/en/webhooks-integrate
- `display-api-reference-video-query` — https://developers.tiktok.com/docs/en/display-api-reference-video-query
- `display-api-reference-user-info` — https://developers.tiktok.com/docs/en/display-api-reference-user-info
- `content-posting-api-request-access` — https://developers.tiktok.com/docs/en/content-posting-api-request-access
