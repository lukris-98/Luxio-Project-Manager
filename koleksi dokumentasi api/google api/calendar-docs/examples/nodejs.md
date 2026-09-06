# Examples: Node.js (fetch)

Alur integrasi Calendar API v3 lengkap dengan Node 18+ (`fetch` bawaan, tanpa library). Prinsip yang sama berlaku bila berpindah ke `googleapis`. Referensi endpoint: [reference-api/events.md](../reference-api/events.md), [reference-api/freebusy.md](../reference-api/freebusy.md).

---

## Setup: Helper HTTP

```js
const BASE = 'https://www.googleapis.com/calendar/v3';

class CalendarError extends Error {
  constructor(status, reason, message) {
    super(`${status} ${reason}: ${message}`);           // (1) reason dipisah agar logis untuk retry
    this.status = status;
    this.reason = reason;
  }
}

async function call(path, { method = 'GET', body, query = {} } = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new CalendarError(res.status, err.errors?.[0]?.reason ?? 'unknown', err.message ?? res.statusText);
  }
  return data;
}
```

## 1. Pilih Kalender

```js
const list = await call('/users/me/calendarList', { query: { maxResults: 250 } });
const cal = list.items.find(c => c.summary === 'Proyek Luxio');
const CALENDAR_ID = cal?.id ?? 'primary';             // (2) fallback ke primary bila tak ketemu
```

## 2. Full Sync dan Delta Sync

```js
let syncToken = null;                                  // (3) persist ke DB di aplikasi nyata

async function fullSync() {
  const all = [];
  let pageToken;
  do {
    const page = await call(`/calendars/${CALENDAR_ID}/events`, {
      query: { maxResults: '2500', showDeleted: 'true', ...(pageToken ? { pageToken } : {}) }
    });
    all.push(...page.items);
    pageToken = page.nextPageToken;
    if (!pageToken) syncToken = page.nextSyncToken;    // (4) token TERAKHIR setelah halaman habis
  } while (pageToken);
  return all;
}

async function deltaSync() {
  try {
    const all = [];
    let pageToken;
    do {
      const page = await call(`/calendars/${CALENDAR_ID}/events`, {
        query: { maxResults: '2500', syncToken: syncToken, ...(pageToken ? { pageToken } : {}) }
      });
      all.push(...page.items);
      pageToken = page.nextPageToken;
      if (!pageToken) syncToken = page.nextSyncToken;
    } while (pageToken);

    for (const ev of all) {
      if (ev.status === 'cancelled') await removeLocal(ev.id);
      else await upsertLocal(ev);
    }
  } catch (e) {
    if (e.status === 410) {                            // (5) token mati -> full resync
      await fullSync();
    } else throw e;
  }
}
```

## 3. Cari Slot dengan FreeBusy

```js
async function findFreeSlot(attendeeIds, dayISO, durationMin) {
  const fb = await call('/freeBusy', {
    method: 'POST',
    body: {
      timeMin: `${dayISO}T00:00:00+07:00`,
      timeMax: `${dayISO}T23:59:59+07:00`,
      items: attendeeIds.map(id => ({ id }))
    }
  });

  // (6) merge interval sibuk semua orang
  const busy = Object.values(fb.calendars)
    .flatMap(c => c.busy)
    .map(b => ({ s: new Date(b.start).getTime(), e: new Date(b.end).getTime() }))
    .sort((a, b) => a.s - b.s);

  const merged = [];
  for (const iv of busy) {
    if (merged.length && iv.s <= merged.at(-1).e) merged.at(-1).e = Math.max(merged.at(-1).e, iv.e);
    else merged.push({ ...iv });
  }

  const dayStart = new Date(`${dayISO}T09:00:00+07:00`).getTime();   // (7) jam kerja 09:00
  const step = 15 * 60000;                                            // (8) grid 15 menit
  for (let t = dayStart; t + durationMin * 60000 <= new Date(`${dayISO}T17:00:00+07:00`).getTime(); t += step) {
    const ok = !merged.some(iv => t < iv.e && t + durationMin * 60000 > iv.s);
    if (ok) return new Date(t);
  }
  return null;
}
```

## 4. Buat Event dengan Peserta

```js
async function createEvent(calendarId, opts) {
  return call(`/calendars/${calendarId}/events`, {
    method: 'POST',
    query: { sendUpdates: 'all' },                     // (9) undangan email terkirim
    body: {
      summary: opts.summary,
      start: { dateTime: '2026-09-08T13:00:00+07:00' },
      end:   { dateTime: '2026-09-08T14:00:00+07:00' },
      attendees: opts.attendees.map(email => ({ email })),
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 10 }] },
      ...(opts.withMeet ? {
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: { type: 'hangoutsMeet' },
            requestId: `luxio-${Date.now()}`           // (10) requestId unik = idempoten
          }
        }
      } : {})
    }
  });
}
```

## 5. Update dan Delete

```js
const EVENT_ID = 'abc123';

await call(`/calendars/${CALENDAR_ID}/events/${EVENT_ID}`, {
  method: 'PATCH',
  query: { sendUpdates: 'all', conferenceDataVersion: '1' },
  body: { location: 'Ruang B' }
});

await call(`/calendars/${CALENDAR_ID}/events/${EVENT_ID}`, {
  method: 'DELETE',
  query: { sendUpdates: 'all' }
});
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Penyimpanan token | `syncToken` harus persisten per (akun, kalender) — lihat [sync-tokens.md](../guides/sync-tokens.md) |
| Refresh token | `ACCESS_TOKEN` kadaluarsa ~1 jam; sisipkan pembaruan di helper `call` |
| Retry | Bungkus `call` dengan backoff untuk 429/5xx — pola di [error-handling.md](../guides/error-handling.md) |
| Zona waktu | Offset `+07:00` pada contoh — format RFC3339 di [timezones.md](../guides/timezones.md) |
| Ekspansi berulang | Tambah `singleEvents=true&orderBy=startTime` pada query baca |

> Prinsip: satu helper `call` dengan error beranotasi `status`+`reason` membuat seluruh alur — sync, slot, CRUD — mudah dites dan diretry.
