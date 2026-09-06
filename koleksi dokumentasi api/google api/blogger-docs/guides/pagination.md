# Pagination

Semua endpoint list (`posts.list`, `pages.list`, `comments.list`, `comments.listByBlog`, `posts.search`) memakai pola **page token**.

---

## Pola Dasar

1. Request pertama tanpa `pageToken`, dengan `maxResults` (maksimum umumnya 500).
2. Response mengandung `nextPageToken` **bila masih ada data**.
3. Request berikutnya memakai `pageToken` dari response sebelumnya.
4. Berhenti bila `nextPageToken` tidak ada.

```bash
# Halaman 1
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?maxResults=100&key=API_KEY"

# Halaman 2 (pakai nextPageToken dari halaman 1)
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?maxResults=100&pageToken=CgkI...&key=API_KEY"
```

## Contoh Loop Lengkap (Node.js)

```js
async function listAllPosts(blogId, apiKey) {
  const items = [];
  let pageToken;
  do {
    const url = new URL(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("maxResults", "500");
    url.searchParams.set("fetchBodies", "false");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Blogger API ${res.status}`);
    const data = await res.json();

    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `maxResults` maksimum | 500 untuk `posts.list`/`pages.list`/`comments.*`; `postUserInfos.list` maksimum 25 |
| Urutan token | Token hanya valid untuk kombinasi query yang sama; ubah `orderBy`/`status` → mulai dari awal |
| Konsistensi | Post yang dibuat saat iterasi bisa terlewat/muncul ganda; pakai `updated` timestamp untuk dedup |
| Rate limit | Loop pagination besar → beri jeda kecil antar halaman agar tidak kena `userRateLimitExceeded` |
| Tanpa `pageToken` | Sistem otomatis memakai `cursor` internal — jangan asumsikan halaman ke-N = offset N*maxResults |

## Alternatif: Filter Tanggal

Untuk dataset besar, filter `startDate`/`endDate` mengurangi jumlah halaman:

```bash
curl "https://www.googleapis.com/blogger/v3/blogs/BLOG_ID/posts?startDate=2026-08-01T00:00:00Z&endDate=2026-09-01T00:00:00Z&maxResults=500&key=API_KEY"
```

Cocok untuk sinkronisasi incremental: simpan timestamp sync terakhir, lalu request `startDate=TIMESTERAKHIR&orderBy=updated`.
