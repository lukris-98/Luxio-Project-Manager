# Contoh cURL

Kumpulan perintah curl untuk endpoint Blogger API utama. Ganti placeholder:

- `API_KEY` — API key Google Cloud
- `ACCESS_TOKEN` — OAuth access token
- `BLOG_ID`, `POST_ID`, `PAGE_ID`, `COMMENT_ID` — ID resource

---

## Read (API Key)

```bash
# Blog by ID
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID?key=API_KEY"

# Blog by URL
curl "https://www.googleapis.com/blogger/v3/blogs/getByUrl?url=https%3A%2F%2Fbloganda.blogspot.com%2F&key=API_KEY"

# List post (tanpa konten, hemat payload)
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?key=API_KEY&maxResults=20&fetchBodies=false"

# Post by ID
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID?key=API_KEY"

# Post by path URL
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/bypath?path=%2F2026%2F08%2Fpost-pertama.html&key=API_KEY"

# Cari post
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/search?q=blogger+api&key=API_KEY&fetchBodies=false"

# List page
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages?key=API_KEY"

# List komentar live pada satu post
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments?key=API_KEY&fetchBodies=true"
```

## Read (OAuth)

```bash
# User sendiri
curl "https://www.googleapis.com/blogger/v3/users/self" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Semua blog milik user
curl "https://www.googleapis.com/blogger/v3/users/self/blogs" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Blog + peran user
curl "https://www.googleapis.com/blogger/v3/users/self/blogs/BLOG_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Draft post milik user
curl "https://www.googleapis.com/blogger/v3/users/self/blogs/BLOG_ID/posts?status=draft" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Antrian komentar pending (seluruh blog)
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/comments?status=pending&fetchBodies=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Statistik pageviews 30 hari
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pageviews?range=30D" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Write (OAuth)

```bash
# Buat post langsung live
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Judul Artikel",
    "content": "<p>Isi HTML artikel.</p>",
    "labels": ["api", "tutorial"]
  }'

# Buat draft
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/?isDraft=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Draft", "content": "<p>...</p>" }'

# Update sebagian (PATCH)
curl -X PATCH "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "content": "<p>Konten revisi.</p>" }'

# Publish draft
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Publish terjadwal
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/publish?publishDate=2026-09-15T09:00:00%2B07:00" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Revert ke draft
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/revert" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Hapus ke trash
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID?useTrash=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Buat page
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/pages/" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Tentang", "content": "<p>Isi page.</p>" }'

# Approve komentar
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/approve" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Tandai spam
curl -X POST "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID/markAsSpam" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Hapus komentar permanen
curl -X DELETE "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts/POST_ID/comments/COMMENT_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Refresh Token

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

> Di PowerShell, pakai `curl.exe` agar sesuai contoh di atas (`curl` bawaan adalah alias `Invoke-WebRequest`).
