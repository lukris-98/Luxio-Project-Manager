# Contoh Node.js

Integrasi Blogger API dengan package `googleapis` dan dengan `fetch` polos.

## Instalasi

```bash
npm install googleapis
```

## 1. Setup Auth

```js
const { google } = require("googleapis");

// Dari environment variable — jangan hardcode
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Simpan refresh token di database/secret store
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Token access di-refresh otomatis oleh googleapis
const blogger = google.blogger({ version: "v3", auth: oauth2Client });
```

Mendapatkan refresh token sekali saja:

```js
const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/blogger"],
  prompt: "consent",
});
// Buka `url` di browser, tukar kode di callback:
const { tokens } = await oauth2Client.getToken(req.query.code);
console.log(tokens.refresh_token); // simpan aman
```

## 2. Operasi Umum

```js
const BLOG_ID = process.env.BLOG_ID;

// Blog info
const blog = await blogger.blogs.get({ blogId: BLOG_ID });
console.log(blog.data.name, blog.data.url);

// List post
const posts = await blogger.posts.list({
  blogId: BLOG_ID,
  maxResults: 10,
  fetchBodies: false,
});
posts.data.items?.forEach((p) => console.log(p.id, p.title));

// Buat post
const created = await blogger.posts.insert({
  blogId: BLOG_ID,
  requestBody: {
    title: "Post dari Node.js",
    content: "<p>Dibuat via <b>googleapis</b>.</p>",
    labels: ["api"],
  },
});
console.log("Post URL:", created.data.url);

// Draft
await blogger.posts.insert({
  blogId: BLOG_ID,
  isDraft: true,
  requestBody: { title: "Draft baru", content: "<p>...</p>" },
});

// Publish draft
await blogger.posts.publish({ blogId: BLOG_ID, postId: created.data.id });

// Update sebagian
await blogger.posts.patch({
  blogId: BLOG_ID,
  postId: created.data.id,
  requestBody: { content: "<p>Konten revisi.</p>" },
});

// Hapus ke trash
await blogger.posts.delete({ blogId: BLOG_ID, postId: created.data.id, useTrash: true });

// Moderasi komentar
const pending = await blogger.comments.listByBlog({
  blogId: BLOG_ID,
  status: ["pending"],
  fetchBodies: true,
});
for (const c of pending.data.items ?? []) {
  await blogger.comments.approve({
    blogId: BLOG_ID,
    postId: c.post.id,
    commentId: c.id,
  });
}

// Pageviews
const pv = await blogger.pageViews.get({ blogId: BLOG_ID, range: ["30D"] });
console.log(pv.data.counts);
```

## 3. Pagination

```js
async function listAllPosts(blogId) {
  const all = [];
  let pageToken;
  do {
    const res = await blogger.posts.list({
      blogId,
      maxResults: 500,
      fetchBodies: false,
      pageToken,
    });
    all.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return all;
}
```

## 4. Tanpa Library (fetch bawaan, Node 18+)

```js
const BASE = "https://www.googleapis.com/blogger/v3";
const token = await getAccessToken(); // fungsi refresh token Anda

async function listPosts(blogId, { maxResults = 20, pageToken } = {}) {
  const url = new URL(`${BASE}/blogs/${blogId}/posts`);
  url.searchParams.set("maxResults", String(maxResults));
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Blogger API ${res.status}: ${body?.error?.message}`);
  }
  return res.json(); // { items, nextPageToken, ... }
}

async function insertPost(blogId, { title, content, labels = [] }) {
  const res = await fetch(`${BASE}/blogs/${blogId}/posts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content, labels }),
  });
  if (!res.ok) throw new Error(`Blogger API ${res.status}`);
  return res.json();
}
```

## Praktik

- Kredensial via `process.env` atau secret manager — tidak pernah di-commit.
- Operasi tulis massal → antrian + jeda antar request (rate limit), lihat [../guides/error-handling.md](../guides/error-handling.md).
- Caching read hasil list di memory/Redis dengan TTL singkat.
