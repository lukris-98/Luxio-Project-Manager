# Examples: cURL

Kumpulan panggilan Calendar API v3 dalam bash murni. Ganti `ACCESS_TOKEN`, `CALENDAR_ID`, `EVENT_ID` dengan nilai asli. Acuan endpoint: [reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

---

## Autentikasi

```bash
# (1) tukar refresh token -> access token (simpan access_token dari response)
curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

## CalendarList

```bash
# Daftar langganan kalender
curl -s "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Metadata satu kalender
curl -s "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Events: List

```bash
# (1) rentang + singleEvents + orderBy = pola baca paling umum
curl -s "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?timeMin=2026-09-01T00:00:00+07:00&timeMax=2026-10-01T00:00:00+07:00&singleEvents=true&orderBy=startTime&maxResults=2500" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Pencarian teks
curl -s "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?q=sprint" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Events: Insert / Patch / Delete

```bash
# (2) iCalUID stabil membuat retry insert aman dari duplikat
curl -s -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Demo curl",
    "start": { "dateTime": "2026-09-08T10:00:00+07:00" },
    "end":   { "dateTime": "2026-09-08T11:00:00+07:00" },
    "attendees": [ { "email": "budi@example.com" } ],
    "reminders": { "useDefault": false, "overrides": [ { "method": "popup", "minutes": 10 } ] },
    "iCalUID": "luxio-demo-20260908-1000@luxio.local"
  }'
# simpan "id" dari response sebagai EVENT_ID

# Patch lokasi saja
curl -s -X PATCH "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "location": "Ruang B" }'

# Batalkan
curl -s -X DELETE "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/EVENT_ID?sendUpdates=all" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Events: QuickAdd

```bash
curl -s -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/quickAdd?text=Lunch%20with%20Budi%20besok%2012:30" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## FreeBusy

```bash
# (3) banyak kalender dalam satu panggilan
curl -s -X POST "https://www.googleapis.com/calendar/v3/freeBusy" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeMin": "2026-09-08T00:00:00+07:00",
    "timeMax": "2026-09-09T00:00:00+07:00",
    "items": [ { "id": "CALENDAR_ID" }, { "id": "budi@example.com" } ]
  }'
```

## Berbagi (ACL)

```bash
curl -s -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/acl?sendNotifications=true" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "scope": { "type": "user", "value": "budi@example.com" }, "role": "writer" }'
```

## Sync Token

```bash
# Full sync -> simpan nextSyncToken
curl -s "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?maxResults=2500" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Delta sync
curl -s "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?syncToken=TOKEN" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Watch (Push)

```bash
curl -s -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CHANNEL_ID_UNIK",
    "type": "web_hook",
    "address": "https://aplikasiku.example.com/calendar/push",
    "token": "TOKEN_RAHASIA_APLIKASI"
  }'
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `-s` | Sembunyikan progress bar; tambah `-i` bila butuh header response |
| JSON panjang | Simpan body ke file dan pakai `--data @body.json` untuk readability |
| Error code | Response error tetap HTTP code — cek dengan `-w "%{http_code}"` bila butuh |
| `sendUpdates` | Selalu eksplisit; tanpa parameter berarti tanpa email |

> Prinsip: cURL adalah cara tercepat memverifikasi asumsi endpoint sebelum menulis kode — mulai dari sini, lalu terjemahkan ke [nodejs.md](nodejs.md) atau [python.md](python.md).
