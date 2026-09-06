# Contoh Python

Integrasi Gmail API dengan `google-api-python-client`.

## Instalasi

```bash
pip install google-api-python-client google-auth google-auth-oauthlib
```

## 1. Setup Auth

```python
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]

creds = Credentials(
    token=None,
    refresh_token=os.environ["GMAIL_REFRESH_TOKEN"],
    client_id=os.environ["GMAIL_CLIENT_ID"],
    client_secret=os.environ["GMAIL_CLIENT_SECRET"],
    token_uri="https://oauth2.googleapis.com/token",
    scopes=SCOPES,
)

service = build("gmail", "v1", credentials=creds)
# Token di-refresh otomatis oleh library
```

Alur OAuth pertama kali (script lokal):

```python
from google_auth_oauthlib.flow import InstalledAppFlow

flow = InstalledAppFlow.from_client_secrets_file("client_secret.json", SCOPES)
creds = flow.run_local_server(port=0)
# Simpan creds.refresh_token ke penyimpanan aman
```

## 2. Operasi Umum

```python
import base64
from email.mime.text import MIMEText

def make_raw(to, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["To"] = to
    msg["Subject"] = subject
    # urlsafe base64 tanpa padding — format yang diminta field raw
    return base64.urlsafe_b64encode(msg.as_bytes()).decode()

# Profil
profile = service.users().getProfile(userId="me").execute()
print(profile["emailAddress"], profile["messagesTotal"])

# List email unread
res = service.users().messages().list(userId="me", q="is:unread", maxResults=10).execute()
for m in res.get("messages", []):
    msg = service.users().messages().get(userId="me", id=m["id"], format="full").execute()
    headers = {h["name"]: h["value"] for h in msg["payload"]["headers"]}
    print(m["id"], headers.get("Subject"), "|", msg["snippet"])

# Kirim email
service.users().messages().send(
    userId="me",
    body={"raw": make_raw("tujuan@example.com", "Laporan", "Isi laporan.")},
).execute()

# Reply dalam thread
service.users().messages().send(
    userId="me",
    body={"raw": make_raw("a@b.com", "Re: Tanya", "Balasan."), "threadId": "18c9..."},
).execute()

# Tandai dibaca + arsipkan
service.users().messages().modify(
    userId="me", id=msg_id,
    body={"removeLabelIds": ["UNREAD", "INBOX"], "addLabelIds": ["Label_123"]},
).execute()

# Batch arsip (maks 1000 id)
service.users().messages().batchModify(
    userId="me", body={"ids": ["a", "b"], "removeLabelIds": ["INBOX"]},
).execute()

# Draft + kirim
draft = service.users().drafts().create(
    userId="me", body={"message": {"raw": make_raw("a@b.com", "Draft", "Isi.")}},
).execute()
service.users().drafts().send(userId="me", id=draft["id"], body={}).execute()

# Label
labels = service.users().labels().list(userId="me").execute()
service.users().labels().create(
    userId="me",
    body={"name": "Invoice", "labelListVisibility": "labelShow", "messageListVisibility": "show"},
).execute()

# Lampiran
att = service.users().messages().attachments().get(
    userId="me", messageId=msg_id, id=attachment_id).execute()
data = base64.urlsafe_b64decode(att["data"] + "=" * (-len(att["data"]) % 4))
open("file.pdf", "wb").write(data)
```

## 3. Pagination

```python
def list_all(q=None):
    items, page_token = [], None
    while True:
        resp = service.users().messages().list(
            userId="me", q=q, maxResults=500, pageToken=page_token,
        ).execute()
        items.extend(resp.get("messages", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            return items
```

## 4. Watch + History

```python
# Aktifkan watch (cron harian)
w = service.users().watch(
    userId="me",
    body={
        "topicName": f"projects/{os.environ['PROJECT_ID']}/topics/gmail-push",
        "labelIds": ["INBOX"],
    },
).execute()
checkpoint = w["historyId"]

# Sync delta
def sync_since(start_history_id):
    resp = service.users().history().list(
        userId="me", startHistoryId=start_history_id).execute()
    for h in resp.get("history", []):
        for added in h.get("messagesAdded", []):
            ...  # email baru
    return resp["historyId"]  # checkpoint baru
```

## 5. Penanganan Error & Retry

```python
import time, random
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
                raise  # kuota harian — jangan retry
            if e.resp.status in (429, 500, 503) or "rateLimit" in reason:
                delay = min(2 ** attempt, 32)
                time.sleep(delay + random.uniform(0, delay * 0.3))
                continue
            raise
    raise RuntimeError("gagal setelah retry")
```

Pemakaian: `retryable(lambda: service.users().messages().send(userId="me", body={...}).execute())`.

## Praktik

- `refresh_token` di environment variable / secret store.
- `send` menghabiskan 100 unit kuota — antrian dengan jeda untuk massal.
- `metadata` + `metadataHeaders` untuk list cepat, `full` hanya saat butuh isi.
