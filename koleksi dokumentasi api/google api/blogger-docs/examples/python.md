# Contoh Python

Integrasi Blogger API dengan `google-api-python-client`.

## Instalasi

```bash
pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2
```

## 1. Setup Auth

```python
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/blogger"]

creds = Credentials(
    token=None,
    refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
    client_id=os.environ["GOOGLE_CLIENT_ID"],
    client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    token_uri="https://oauth2.googleapis.com/token",
    scopes=SCOPES,
)

service = build("blogger", "v3", credentials=creds)
```

Alternatif alur OAuth pertama kali (script lokal):

```python
from google_auth_oauthlib.flow import InstalledAppFlow

flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", SCOPES)
creds = flow.run_local_server(port=0)
# Simpan creds.refresh_token ke penyimpanan aman
```

## 2. Operasi Umum

```python
BLOG_ID = os.environ["BLOG_ID"]

# Blog info
blog = service.blogs().get(blogId=BLOG_ID).execute()
print(blog["name"], blog["url"])

# List post
posts = service.posts().list(
    blogId=BLOG_ID, maxResults=10, fetchBodies=False
).execute()
for p in posts.get("items", []):
    print(p["id"], p["title"])

# Buat post
created = service.posts().insert(
    blogId=BLOG_ID,
    body={
        "title": "Post dari Python",
        "content": "<p>Dibuat via <b>google-api-python-client</b>.</p>",
        "labels": ["api"],
    },
).execute()
print("URL:", created["url"])

# Draft
service.posts().insert(
    blogId=BLOG_ID, isDraft=True,
    body={"title": "Draft baru", "content": "<p>...</p>"},
).execute()

# Publish draft
service.posts().publish(blogId=BLOG_ID, postId=created["id"]).execute()

# Update sebagian
service.posts().patch(
    blogId=BLOG_ID, postId=created["id"],
    body={"content": "<p>Konten revisi.</p>"},
).execute()

# Hapus ke trash
service.posts().delete(blogId=BLOG_ID, postId=created["id"], useTrash=True).execute()

# Moderasi komentar pending
pending = service.comments().listByBlog(
    blogId=BLOG_ID, status=["pending"], fetchBodies=True
).execute()
for c in pending.get("items", []):
    service.comments().approve(
        blogId=BLOG_ID, postId=c["post"]["id"], commentId=c["id"]
    ).execute()

# Pageviews
pv = service.pageViews().get(blogId=BLOG_ID, range=["30D"]).execute()
print(pv.get("counts"))
```

## 3. Pagination

```python
def list_all_posts(blog_id):
    items, page_token = [], None
    while True:
        resp = service.posts().list(
            blogId=blog_id, maxResults=500, fetchBodies=False,
            pageToken=page_token,
        ).execute()
        items.extend(resp.get("items", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            return items
```

## 4. Penanganan Error & Retry

```python
import time
from googleapiclient.errors import HttpError

def retryable(fn, retries=5):
    for attempt in range(retries):
        try:
            return fn()
        except HttpError as e:
            reason = ""
            try:
                reason = e.error_details[0]["reason"]
            except Exception:
                pass
            if e.resp.status == 403 and reason == "dailyLimitExceeded":
                raise  # jangan retry
            if e.resp.status in (429, 500, 503) or "RateLimit" in reason:
                delay = min(2 ** attempt, 32)
                time.sleep(delay + random.uniform(0, delay * 0.3))
                continue
            raise
    raise RuntimeError("gagal setelah retry")
```

## Praktik

- Simpan `refresh_token` di environment variable / secret manager, bukan di file skrip.
- `execute()` menghabiskan 1 kuota query per call; cache hasil read.
- Untuk kredensial API key (read publik), cukup `build("blogger", "v3", developerKey=API_KEY)`.
