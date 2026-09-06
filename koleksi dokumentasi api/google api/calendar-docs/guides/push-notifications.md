# Guide: Push Notifications

Push notification memberi tahu aplikasi "ada perubahan" **tanpa polling**. Mekanismenya: daftarkan channel `web_hook` lewat method `watch`, aplikasi menerima HTTP POST ke URL-mu, lalu kamu bereaksi dengan sync token.

Referensi endpoint: [reference-api/channels.md](../reference-api/channels.md).

---

## Alur Lengkap

```text
APLIKASI                          GOOGLE                        APLIKASI (endpoint publik)
   |  watch (channel)               |                                   |
   |------------------------------->|  simpan resourceId+token          |
   |<-------- response channel -----|                                   |
   |<================== POST X-Goog-Resource-State: sync =============|
   |  events.list(syncToken)  ------|  delta data                       |
   |<-------------------------------|                                   |
   |  (perubahan terjadi)           |                                   |
   |<================== POST X-Goog-Resource-State: exists ===========|
   |  events.list(syncToken)  ------|  delta berikutnya                 |
   |<-------------------------------|                                   |
```

## Mendaftarkan Channel

```bash
# (1) address WAJIB https publik dan telah diverifikasi kepemilikannya di Search Console
curl -X POST "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events/watch" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CHANNEL_ID_UNIK",
    "type": "web_hook",
    "address": "https://aplikasiku.example.com/calendar/push",
    "token": "TOKEN_RAHASIA_APLIKASI",
    "params": { "ttl": "604800" }
  }'
```

Simpan `id`, `resourceId`, dan `token` dari response — ketiganya dibutuhkan untuk `stop` dan verifikasi.

## Menerima Notifikasi

```text
POST /calendar/push
X-Goog-Channel-ID: CHANNEL_ID_UNIK
X-Goog-Channel-Token: TOKEN_RAHASIA_APLIKASI
X-Goog-Resource-ID: RESOURCE_ID
X-Goog-Resource-State: exists
X-Goog-Message-Number: 7
```

| Langkah | Keterangan |
|---|---|
| 1. Verifikasi token | `X-Goog-Channel-Token` harus sama dengan yang kamu daftarkan |
| 2. Balas 200 cepat | Jangan proses berat di dalam handler |
| 3. Proses async | Ambil delta dengan sync token milik channel ini |
| 4. Deduplikasi | `X-Goog-Message-Number` bisa berulang saat retry — idempotensi wajib |

## Handler Contoh (Node.js)

```js
app.post('/calendar/push', (req, res) => {
  const channelId = req.header('X-Goog-Channel-ID');
  const token     = req.header('X-Goog-Channel-Token');
  const state     = req.header('X-Goog-Resource-State');

  if (token !== TOKEN_RAHASIA) return res.sendStatus(403);   // (1) tolak notifikasi tak dikenal

  res.sendStatus(200);                                        // (2) ack cepat, proses async
  if (state === 'sync') return;                               // (3) handshake awal, tanpa data

  queue.enqueue(async () => {
    await syncDelta(channelId);                               // (4) events.list dengan syncToken
  });
});
```

`syncDelta` adalah loop dari [sync-tokens.md](sync-tokens.md) — notifikasi hanya pemicu, data tetap dari `events.list`.

## Memelihara Channel

| Kondisi | Aksi |
|---|---|
| `expiration` mendekat | Daftarkan channel baru dengan `id` sama sebelum lewat |
| `stop` channel | `POST /channels/stop` dengan `id` + `resourceId` |
| Token sync mati (410) | Notifikasi tetap datang; jalankan full resync lalu simpan token baru |
| Endpoint berubah | `stop` lalu `watch` ulang dengan address baru |
| Notifikasi hilang | Channel bisa mati senyap — jadwalkan polling berkala sebagai jaring pengaman |

```bash
# Hentikan channel
curl -X POST "https://www.googleapis.com/calendar/v3/channels/stop" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "id": "CHANNEL_ID_UNIK", "resourceId": "RESOURCE_ID" }'
```

## Resource yang Bisa Diamati

| Method | Resource |
|---|---|
| `calendars/CALENDAR_ID/events/watch` | Perubahan event |
| `users/me/calendarList/watch` | Daftar langganan |
| `calendars/CALENDAR_ID/acl/watch` | Aturan berbagi |
| `users/me/settings/watch` | Setting pengguna |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Isi notifikasi kosong | Tidak ada detail event di POST — kebenaran data tetap lewat list |
| TTL parameter | `ttl` detik; server membatasi maksimum (sekitar sepekan) |
| Skala | Satu channel per (user, kalender, address) — banyak pengguna = banyak channel |
| Keandalan | Google mencoba ulang beberapa kali bila endpoint tidak 200 |
| Keamanan | Endpoint harus https; token rahasia + verifikasi domain mencegah notifikasi palsu |

> Prinsip: push notification dan sync token adalah pasangan — channel memberi "kapan", sync token memberi "apa". Jangan pernah mencatat perubahan dari notifikasi itu sendiri.
