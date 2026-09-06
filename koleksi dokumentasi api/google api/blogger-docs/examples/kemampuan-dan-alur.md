# Kemampuan Contoh Kode & Alur Implementasi — Penjelasan Kode

File ini menjelaskan **kode mana di [examples/](.) yang melakukan apa**, fungsi demi fungsi, agar mudah diadaptasi ke aplikasi Anda.

---

## 1. Peta Contoh per Bahasa

| File | Bahasa | Library | Dipakai saat |
|---|---|---|---|
| [curl.md](curl.md) | shell | curl | Uji cepat endpoint, debug, script cron sederhana |
| [nodejs.md](nodejs.md) | Node.js | `googleapis` | Backend JS/TS; token refresh otomatis |
| [python.md](python.md) | Python | `google-api-python-client` | Script/worker Python, pipeline data |

> Catatan Windows: di PowerShell pakai `curl.exe` (bukan alias `Invoke-WebRequest`) agar contoh curl.md berjalan apa adanya.

## 2. Alur Implementasi Rekomendasi

```
1. Setup kredensial (auth object / Credentials)
2. Dapatkan blogId  (users/self/blogs)          ← sekali, simpan konfigurasi
3. Baca data     (posts.list, pageviews)        ← bungkus dengan cache
4. Tulis data    (insert/patch/publish)         ← bungkus dengan retry/backoff
5. Moderasi      (comments.listByBlog → approve)← jalankan periodik
6. Pantau        (log status, reason, kuota)
```

---

## 3. Walkthrough examples/nodejs.md

### 3.1 Setup auth

```js
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,      // (1) identitas aplikasi dari Cloud Console
  process.env.GOOGLE_CLIENT_SECRET,  // (2) rahasia aplikasi — dari env, bukan kode
  process.env.GOOGLE_REDIRECT_URI    // (3) callback setelah user setuju; harus terdaftar
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN, // (4) token panjang-umur dari setup awal
});

const blogger = google.blogger({ version: "v3", auth: oauth2Client });
// (5) objek layanan: blogger.posts.list(...) dst. — token di-refresh OTOMATIS oleh library
```

**Kode ini melakukan**: menyiapkan klien OAuth yang memperbarui access token sendiri saat kedaluwarsa — Anda tidak perlu menulis logika refresh manual (beda dengan contoh `fetch` di 3.4).

### 3.2 Mendapat refresh token (sekali saja)

```js
const url = oauth2Client.generateAuthUrl({
  access_type: "offline",   // (1) minta refresh_token
  scope: ["https://www.googleapis.com/auth/blogger"], // (2) izin baca+tulis
  prompt: "consent",        // (3) layar izin tampil lagi (perlu utk dapat refresh token)
});
const { tokens } = await oauth2Client.getToken(req.query.code); // (4) tukar kode → token
console.log(tokens.refresh_token); // (5) simpan AMAN (database/secret store)
```

### 3.3 Operasi umum

```js
const blog = await blogger.blogs.get({ blogId: BLOG_ID });
// → GET /blogs/{blogId}; data = objek Blog (nama, url, jumlah post)

const posts = await blogger.posts.list({ blogId: BLOG_ID, maxResults: 10, fetchBodies: false });
// → GET /blogs/{blogId}/posts; data.items = array Post ringkas

const created = await blogger.posts.insert({
  blogId: BLOG_ID,            // (1) blog tujuan
  requestBody: {              // (2) body = resource Post (title, content, labels)
    title: "Post dari Node.js",
    content: "<p>...</p>",
    labels: ["api"],
  },
});
// (3) created.data.id + created.data.url → simpan

await blogger.posts.insert({ blogId: BLOG_ID, isDraft: true, requestBody: {...} });
// (4) isDraft: true → query ?isDraft=true → post jadi DRAFT

await blogger.posts.publish({ blogId: BLOG_ID, postId: created.data.id });
// (5) POST .../publish → draft/scheduled menjadi live

await blogger.posts.patch({ blogId: BLOG_ID, postId: ..., requestBody: {...} });
// (6) PATCH = ubah sebagian field (aman untuk edit konten)

await blogger.posts.delete({ blogId: BLOG_ID, postId: ..., useTrash: true });
// (7) useTrash: true → query ?useTrash=true → pindah ke TRASH, bukan permanen
```

### 3.4 Moderasi + pagination

```js
const pending = await blogger.comments.listByBlog({ blogId: BLOG_ID, status: ["pending"] });
// (1) antrian pending seluruh blog; array status karena bisa multi-status

for (const c of pending.data.items ?? []) {
  await blogger.comments.approve({
    blogId: BLOG_ID,
    postId: c.post.id,      // (2) WAJIB dari item — antrian lintas post
    commentId: c.id,
  });
}
```

```js
do {                                       // (3) loop pagination
  const res = await blogger.posts.list({ blogId, maxResults: 500, fetchBodies: false, pageToken });
  all.push(...(res.data.items ?? []));     // (4) tumpuk hasil
  pageToken = res.data.nextPageToken;      // (5) undefined → loop berhenti
} while (pageToken);
```

### 3.5 Versi fetch bawaan (tanpa library)

```js
const url = new URL(`${BASE}/blogs/${blogId}/posts`);
url.searchParams.set("maxResults", String(maxResults)); // (1) query builder aman (auto-encode)
if (pageToken) url.searchParams.set("pageToken", pageToken);

const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // (2) token manual
if (!res.ok) { /* (3) tanpa library, error handling ditulis sendiri */ }
return res.json();
```

**Kapan memilih versi ini**: runtime edge/serverless tanpa dependency, atau kontrol penuh atas request. Konsekuensi: refresh token & backoff harus dibuat sendiri (pola ada di [../guides/error-handling.md](../guides/error-handling.md)).

---

## 4. Walkthrough examples/python.md

### 4.1 Setup auth

```python
creds = Credentials(
    token=None,                                      # (1) belum ada access token
    refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],# (2) dipakai utk minta token baru
    client_id=os.environ["GOOGLE_CLIENT_ID"],        # (3) identitas aplikasi
    client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    token_uri="https://oauth2.googleapis.com/token", # (4) endpoint pertukaran token
    scopes=SCOPES,                                   # (5) izin yang dimiliki token
)
service = build("blogger", "v3", credentials=creds)
# (6) service = proxy API; library menangani refresh otomatis seperti googleapis
```

### 4.2 Operasi

```python
blog = service.blogs().get(blogId=BLOG_ID).execute()
# pola umum: service.<resource>().<method>(<params>).execute()
#   .get(...)      = menyusun request;  .execute() = benar-benar mengirim (1 kuota query)

created = service.posts().insert(blogId=BLOG_ID, body={...}).execute()
# body= = resource Post (padanan requestBody di Node)

service.posts().insert(blogId=BLOG_ID, isDraft=True, body={...}).execute()
# isDraft=True → query ?isDraft=true → draft

service.posts().delete(blogId=BLOG_ID, postId=..., useTrash=True).execute()
# useTrash=True → hapus ke trash

pv = service.pageViews().get(blogId=BLOG_ID, range=["30D"]).execute()
# range= berupa LIST karena parameter ini bisa diulang (7D + 30D + all)
```

### 4.3 Wrapper retry

```python
def retryable(fn, retries=5):
    for attempt in range(retries):                    # (1) maksimal 5 percobaan
        try:
            return fn()                               # (2) eksekusi request
        except HttpError as e:                        # (3) semua error API = HttpError
            reason = ""
            try:
                reason = e.error_details[0]["reason"] # (4) ambil reason resmi Google
            except Exception:
                pass
            if e.resp.status == 403 and reason == "dailyLimitExceeded":
                raise                                 # (5) kuota harian → JANGAN retry
            if e.resp.status in (429, 500, 503) or "RateLimit" in reason:
                delay = min(2 ** attempt, 32)         # (6) backoff 1,2,4,8,...32 detik
                time.sleep(delay + random.uniform(0, delay * 0.3))  # (7) + jitter
                continue                              # (8) ulangi
            raise                                     # (9) 400/404/403 → gagal cepat
    raise RuntimeError("gagal setelah retry")
```

Pemakaian: `retryable(lambda: service.posts().list(blogId=BLOG_ID, ...).execute())`.

---

## 5. Walkthrough examples/curl.md

| Blok di curl.md | Kode melakukan apa |
|---|---|
| Bagian "Read (API Key)" | Semua `-H`-less GET dengan `?key=` — membaca konten publik tanpa login; cocok untuk smoke test |
| Bagian "Read (OAuth)" | GET dengan header `Authorization: Bearer` — membuka data pribadi: `users/self`, draft, antrian moderasi, pageviews |
| Bagian "Write (OAuth)" | `-X POST/PUT/PATCH/DELETE` + `-d '{...}'` — seluruh operasi tulis; setiap perintah sudah memakai query yang benar (`isDraft`, `useTrash`, `publishDate` ter-encode `%2B`) |
| Bagian "Refresh Token" | POST ke `oauth2.googleapis.com/token` dengan `grant_type=refresh_token` — regenerasi access token saat 401 |

Pola membaca perintah curl:

```
curl -X POST "URL" -H "Header: nilai" -d '{ "json": "body" }'
      │        │          │                └── payload tulis (POST/PUT/PATCH saja)
      │        │          └── Authorization: Bearer TOKEN (identitas user)
      │        └── endpoint (path + query param)
      └── metode HTTP; tanpa -X = GET
```

---

## 6. Checklist Adaptasi ke Aplikasi Anda

1. [ ] Kredensial dari environment variable / secret store (tidak ada di kode).
2. [ ] `BLOG_ID` dikonfigurasi (hasil `users/self/blogs`), tidak hardcode di banyak tempat.
3. [ ] Semua request tulis dibungkus retry/backoff (Node §3.5+guide, Python §4.3).
4. [ ] List besar memakai pagination + `fetchBodies=false`.
5. [ ] Cache read (TTL 1–5 menit) untuk endpoint yang sering dipanggil.
6. [ ] `useTrash=true` untuk semua DELETE kecuali kebutuhan permanen eksplisit.
7. [ ] Log `status` + `reason` setiap kegagalan untuk pantau kuota.
