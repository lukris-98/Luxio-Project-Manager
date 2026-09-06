# Blogger API v3 Documentation

Dokumentasi lengkap **Blogger API v3** untuk integrasi dengan Google Blogger: kelola blog, post, page, comment, dan user secara programatis.

- Base URL: `https://www.googleapis.com/blogger/v3`
- Dokumentasi resmi: https://developers.google.com/blogger/docs/3.0/reference

---

## Struktur Dokumentasi

### Getting Started

| File | Isi |
|---|---|
| [getting-started/kemampuan-dan-alur.md](getting-started/kemampuan-dan-alur.md) | Kemampuan setup + penjelasan baris per baris kode kredensial |
| [getting-started/overview.md](getting-started/overview.md) | Pengenalan Blogger API v3, arsitektur resource, dan kasus penggunaan |
| [getting-started/enable-api.md](getting-started/enable-api.md) | Cara mengaktifkan Blogger API di Google Cloud Console |
| [getting-started/authentication.md](getting-started/authentication.md) | OAuth 2.0, API Key, scopes, dan access token |
| [getting-started/quickstart.md](getting-started/quickstart.md) | Contoh request pertama (curl) sampai publish post pertama |
| [getting-started/rate-limits.md](getting-started/rate-limits.md) | Kuota, rate limit, dan strategi retry |
| [getting-started/errors.md](getting-started/errors.md) | Daftar kode error dan penanganannya |

### Resources (Model Data)

| File | Isi |
|---|---|
| [resources/kemampuan-dan-alur.md](resources/kemampuan-dan-alur.md) | Field mana untuk apa + aliran data antar resource |
| [resources/blog.md](resources/blog.md) | Resource `Blog` — properti blog |
| [resources/post.md](resources/post.md) | Resource `Post` — properti entri/postingan |
| [resources/page.md](resources/page.md) | Resource `Page` — properti halaman statis |
| [resources/comment.md](resources/comment.md) | Resource `Comment` — properti komentar |
| [resources/user.md](resources/user.md) | Resource `User` — properti user Blogger |
| [resources/blog-user-info.md](resources/blog-user-info.md) | Resource `BlogUserInfo` — per-user blog info |
| [resources/page-views.md](resources/page-views.md) | Resource `PageViews` — statistik jumlah kunjungan |
| [resources/post-user-info.md](resources/post-user-info.md) | Resource `PostUserInfo` — per-user post info |

### API Reference (Endpoint)

| File | Endpoint yang dicakup |
|---|---|
| [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) | Anatomi request + penjelasan kode per operasi |
| [reference-api/blogs.md](reference-api/blogs.md) | `blogs.get`, `blogs.getByUrl`, `blogs.listByUser` |
| [reference-api/posts.md](reference-api/posts.md) | `posts.list`, `get`, `getByPath`, `insert`, `update`, `patch`, `delete`, `publish`, `revert`, `search` |
| [reference-api/pages.md](reference-api/pages.md) | `pages.list`, `get`, `insert`, `update`, `patch`, `delete`, `publish`, `revert` |
| [reference-api/comments.md](reference-api/comments.md) | `comments.list`, `listByBlog`, `get`, `approve`, `markAsSpam`, `removeContent`, `delete` |
| [reference-api/users.md](reference-api/users.md) | `users.get` |
| [reference-api/blog-user-infos.md](reference-api/blog-user-infos.md) | `blogUserInfos.get` |
| [reference-api/post-user-infos.md](reference-api/post-user-infos.md) | `postUserInfos.get`, `postUserInfos.list` |
| [reference-api/page-views.md](reference-api/page-views.md) | `pageViews.get` |

### Guides

| File | Isi |
|---|---|
| [guides/kemampuan-dan-alur.md](guides/kemampuan-dan-alur.md) | Walkthrough kode setiap guide (yang mana melakukan apa) |
| [guides/publish-and-manage-posts.md](guides/publish-and-manage-posts.md) | Alur kerja draft → publish → update → trash |
| [guides/moderation-comments.md](guides/moderation-comments.md) | Moderasi komentar: approve, spam, hapus |
| [guides/labels-and-search.md](guides/labels-and-search.md) | Filter berdasarkan label dan pencarian post |
| [guides/pagination.md](guides/pagination.md) | Token pagination untuk list besar |
| [guides/error-handling.md](guides/error-handling.md) | Pola penanganan error dan retry eksponensial |

### Examples

| File | Isi |
|---|---|
| [examples/kemampuan-dan-alur.md](examples/kemampuan-dan-alur.md) | Fungsi demi fungsi: kode mana di examples melakukan apa |
| [examples/curl.md](examples/curl.md) | Contoh curl untuk endpoint utama |
| [examples/nodejs.md](examples/nodejs.md) | Integrasi Node.js dengan `googleapis` |
| [examples/python.md](examples/python.md) | Integrasi Python dengan `google-api-python-client` |

---

## Ringkasan Endpoint

| Method | Path | Auth |
|---|---|---|
| GET | `/blogs/{blogId}` | API Key / OAuth |
| GET | `/blogs/getByUrl` | API Key / OAuth |
| GET | `/users/{userId}/blogs` | API Key / OAuth |
| GET | `/blogs/{blogId}/posts` | API Key / OAuth |
| GET | `/blogs/{blogId}/posts/{postId}` | API Key / OAuth |
| GET | `/blogs/{blogId}/posts/bypath` | API Key / OAuth |
| GET | `/blogs/{blogId}/posts/search` | API Key / OAuth |
| POST | `/blogs/{blogId}/posts/` | OAuth (write) |
| PUT | `/blogs/{blogId}/posts/{postId}` | OAuth (write) |
| PATCH | `/blogs/{blogId}/posts/{postId}` | OAuth (write) |
| DELETE | `/blogs/{blogId}/posts/{postId}` | OAuth (write) |
| POST | `/blogs/{blogId}/posts/{postId}/publish` | OAuth (write) |
| POST | `/blogs/{blogId}/posts/{postId}/revert` | OAuth (write) |
| GET | `/blogs/{blogId}/pages` | API Key / OAuth |
| GET | `/blogs/{blogId}/pages/{pageId}` | API Key / OAuth |
| POST | `/blogs/{blogId}/pages/` | OAuth (write) |
| PUT | `/blogs/{blogId}/pages/{pageId}` | OAuth (write) |
| PATCH | `/blogs/{blogId}/pages/{pageId}` | OAuth (write) |
| DELETE | `/blogs/{blogId}/pages/{pageId}` | OAuth (write) |
| POST | `/blogs/{blogId}/pages/{pageId}/publish` | OAuth (write) |
| POST | `/blogs/{blogId}/pages/{pageId}/revert` | OAuth (write) |
| GET | `/blogs/{blogId}/posts/{postId}/comments` | API Key / OAuth |
| GET | `/blogs/{blogId}/posts/{postId}/comments/{commentId}` | API Key / OAuth |
| GET | `/blogs/{blogId}/comments` | API Key / OAuth |
| POST | `.../comments/{commentId}/approve` | OAuth (write) |
| POST | `.../comments/{commentId}/markAsSpam` | OAuth (write) |
| POST | `.../comments/{commentId}/removecontent` | OAuth (write) |
| DELETE | `.../comments/{commentId}` | OAuth (write) |
| GET | `/users/{userId}` | OAuth |
| GET | `/users/{userId}/blogs/{blogId}` | OAuth |
| GET | `/users/{userId}/blogs/{blogId}/posts` | OAuth |
| GET | `/users/{userId}/blogs/{blogId}/posts/{postId}` | OAuth |
| GET | `/blogs/{blogId}/pageviews` | OAuth |

---

## Scopes OAuth

| Scope | Akses |
|---|---|
| `https://www.googleapis.com/auth/blogger` | Full: baca + tulis |
| `https://www.googleapis.com/auth/blogger.readonly` | Baca saja |
