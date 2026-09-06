# Examples: Python (requests)

Alur integrasi Calendar API v3 lengkap dengan `requests` (tanpa library Google). Sesuaikan placeholder `ACCESS_TOKEN`, `CALENDAR_ID`, `EVENT_ID`. Referensi endpoint: [reference-api/events.md](../reference-api/events.md), [reference-api/freebusy.md](../reference-api/freebusy.md).

---

## Setup: Helper HTTP

```python
import requests
from requests.adapters import HTTPAdapter, Retry

BASE = "https://www.googleapis.com/calendar/v3"

session = requests.Session()
session.mount("https://", HTTPAdapter(max_retries=Retry(
    total=3,                                   # (1) retry transport otomatis untuk 429/5xx
    status_forcelist=[429, 500, 502, 503],
    backoff_factor=1,
)))

class CalendarError(Exception):
    def __init__(self, status, reason, message):
        super().__init__(f"{status} {reason}: {message}")
        self.status = status
        self.reason = reason

def call(path, method="GET", body=None, **query):
    params = {k: v for k, v in query.items() if v is not None}
    r = session.request(
        method,
        BASE + path,
        params=params,
        json=body,
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )
    if not r.ok:
        err = r.json().get("error", {})
        reasons = (err.get("errors") or [{}])[0].get("reason", "unknown")
        raise CalendarError(r.status_code, reasons, err.get("message", r.reason))
    return r.json()
```

## 1. Pilih Kalender

```python
listing = call("/users/me/calendarList", maxResults=250)
target = next((c for c in listing["items"] if c["summary"] == "Proyek Luxio"), None)
CALENDAR_ID = target["id"] if target else "primary"    # (2) fallback primary
```

## 2. Full Sync dan Delta Sync

```python
sync_token = None                                      # (3) persist ke DB di aplikasi nyata

def full_sync():
    global sync_token
    items, page_token = [], None
    while True:
        page = call(
            f"/calendars/{CALENDAR_ID}/events",
            maxResults=2500, showDeleted=True, pageToken=page_token,
        )
        items += page.get("items", [])
        page_token = page.get("nextPageToken")
        if not page_token:
            sync_token = page["nextSyncToken"]         # (4) token TERAKHIR setelah halaman habis
            break
    return items

def delta_sync():
    global sync_token
    try:
        items, page_token = [], None
        while True:
            page = call(
                f"/calendars/{CALENDAR_ID}/events",
                maxResults=2500, syncToken=sync_token, pageToken=page_token,
            )
            items += page.get("items", [])
            page_token = page.get("nextPageToken")
            if not page_token:
                sync_token = page["nextSyncToken"]
                break
        for ev in items:
            if ev.get("status") == "cancelled":
                remove_local(ev["id"])
            else:
                upsert_local(ev)
    except CalendarError as e:
        if e.status == 410:                            # (5) token mati -> full resync
            full_sync()
        else:
            raise
```

## 3. Cari Slot dengan FreeBusy

```python
from datetime import datetime, timedelta, timezone

WIB = timezone(timedelta(hours=7))

def find_free_slot(attendee_ids, day, duration_min, work_start=9, work_end=17):
    fb = call(
        "/freeBusy", method="POST",
        body={
            "timeMin": f"{day}T00:00:00+07:00",
            "timeMax": f"{day}T23:59:59+07:00",
            "items": [{"id": i} for i in attendee_ids],
        },
    )

    # (6) merge interval sibuk semua orang
    busy = sorted(
        (b for cal in fb["calendars"].values() for b in cal.get("busy", [])),
        key=lambda b: datetime.fromisoformat(b["start"]),
    )
    merged = []
    for b in busy:
        s, e = datetime.fromisoformat(b["start"]), datetime.fromisoformat(b["end"])
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))

    # (7) grid 15 menit dalam jam kerja
    cursor = datetime.fromisoformat(f"{day}T{work_start:02d}:00:00").replace(tzinfo=WIB)
    limit = datetime.fromisoformat(f"{day}T{work_end:02d}:00:00").replace(tzinfo=WIB)
    dur = timedelta(minutes=duration_min)
    while cursor + dur <= limit:
        if not any(cursor < e and cursor + dur > s for s, e in merged):
            return cursor
        cursor += timedelta(minutes=15)
    return None
```

## 4. Buat Event dengan Peserta

```python
def create_event(calendar_id, summary, start, end, attendees, with_meet=False):
    body = {
        "summary": summary,
        "start": {"dateTime": start.isoformat()},      # (8) isoformat RFC3339 dengan offset
        "end": {"dateTime": end.isoformat()},
        "attendees": [{"email": a} for a in attendees],
        "reminders": {"useDefault": False,
                      "overrides": [{"method": "popup", "minutes": 10}]},
    }
    if with_meet:
        body["conferenceData"] = {"createRequest": {
            "conferenceSolutionKey": {"type": "hangoutsMeet"},
            "requestId": f"luxio-{datetime.now().timestamp()}",   # (9) requestId unik = idempoten
        }}
    return call(
        f"/calendars/{calendar_id}/events", method="POST",
        body=body, sendUpdates="all", conferenceDataVersion=1,
    )

slot = find_free_slot(["budi@example.com", "citra@example.com"], "2026-09-08", 60)
event = create_event(CALENDAR_ID, "Penjadwalan otomatis",
                     slot, slot + timedelta(hours=1),
                     ["budi@example.com", "citra@example.com"], with_meet=True)
EVENT_ID = event["id"]
```

## 5. Update dan Delete

```python
call(f"/calendars/{CALENDAR_ID}/events/{EVENT_ID}", method="PATCH",
     body={"location": "Ruang B"}, sendUpdates="all")

call(f"/calendars/{CALENDAR_ID}/events/{EVENT_ID}", method="DELETE",
     sendUpdates="all")
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `datetime` naive vs aware | Selalu `aware` (ber-offset) — naive menghasilkan RFC3339 tanpa offset → error 400 |
| `isoformat()` | Menghasilkan `2026-09-08T13:00:00+07:00` — persis format yang diminta |
| Retry berlapis | `Retry` transport menangani 429/5xx; 410 tetap harus ditangani manual |
| Penyimpanan token | `sync_token` persisten per (akun, kalender) — lihat [sync-tokens.md](../guides/sync-tokens.md) |
| Type hints | Tambahkan `TypedDict`/pydantic untuk model event bila proyek besar |

> Prinsip: aware datetime + helper `call` beranotasi error membuat alur Python ini drop-in untuk produksi — sisanya hanya penyimpanan token dan scheduler.
