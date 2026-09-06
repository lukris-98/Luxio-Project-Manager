# Guide: Pagination

Semua endpoint list Calendar API (`events.list`, `calendarList.list`, `settings.list`, `acl.list`, `event.instances`) memakai pola **pageToken**.

---

## Pola Dasar

1. Request pertama tanpa `pageToken`, dengan `maxResults`.
2. Response memuat `nextPageToken` **bila masih ada data**.
3. Request berikutnya `pageToken=<nextPageToken>`.
4. Berhenti bila token habis.

```bash
# Halaman 1
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?maxResults=2500" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Halaman 2
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?maxResults=2500&pageToken=TOKEN_DARI_HALAMAN1" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Contoh Loop Lengkap (Node.js)

```js
async function listAllEvents(token, calendarId, params = {}) {
  const all = [];
  let pageToken;
  do {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`);
    url.searchParams.set('maxResults', '2500');           // (1) halaman terbesar = paling hemat
    url.searchParams.set('timeMin', params.timeMin);      // (2) filter WAJIB konsisten antar halaman
    url.searchParams.set('timeMax', params.timeMax);
    if (params.q) url.searchParams.set('q', params.q);
    if (pageToken) url.searchParams.set('pageToken', pageToken); // (3) posisi halaman

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Calendar API ${res.status}`);
    const data = await res.json();

    all.push(...(data.items ?? []));                      // (4) tumpuk item
    pageToken = data.nextPageToken;                       // (5) undefined = habis
  } while (pageToken);
  return all;
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `maxResults` maksimum | 2500 untuk `events.list`; default 250 |
| Token valid | Hanya untuk kombinasi query yang sama — ubah `q`/`timeMin` → mulai dari awal |
| Konsumsi token | Saat sinkron awal, habiskan SEMUA halaman sebelum memakai `nextSyncToken` — lihat [sync-tokens.md](sync-tokens.md) |
| Urutan stabil | Untuk hasil terurut pakai `singleEvents=true&orderBy=startTime`; tanpa itu urutan bawaan tidak dijamin stabil antar halaman |
| Hasil berubah saat iterasi | Event baru bisa masuk antar halaman; dedup by `id` bila perlu |
| `calendarList.list` | `maxResults` default 100, maks 250 — jumlah kalender lazimnya cukup satu halaman |
| `items` kosong | Bukan error; bisa jadi semua item di halaman itu adalah event `cancelled` yang difilter |

## Pemotongan Field: `maxAttendees`

Berbeda dari pagination — `maxAttendees` membatasi peserta **per event**:

```bash
# (1) bukan batas jumlah item, tapi batas attendees dalam tiap item
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?maxAttendees=1" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Response `items[].attendeesOmitted: true` menandakan peserta dipotong — ambil `events.get` per event bila butuh daftar penuh.

## Pola Dedup (Python)

```python
seen = set()
params = {"maxResults": 2500, "singleEvents": True, "orderBy": "startTime",
          "timeMin": "2026-09-01T00:00:00+07:00", "timeMax": "2026-10-01T00:00:00+07:00"}
while True:
    data = requests.get(url, headers=auth, params=params).json()
    for ev in data.get("items", []):
        if ev["id"] not in seen:              # (1) guard anti duplikat lintas halaman
            seen.add(ev["id"])
            process(ev)
    if "nextPageToken" not in data:
        break
    params["pageToken"] = data["nextPageToken"]
```

> Prinsip: halaman terbesar + filter yang tidak berubah + dedup by `id` — tiga kebiasaan yang membuat loop pagination aman dan hemat.
