# Reference: Channels Endpoints

Push notification Calendar API memakai **channel**: satu resource "pengamat" yang dibuat lewat method `watch` di koleksi lain. Tidak ada method CRUD pada `channels` sendiri — kecuali `stop` untuk menutup channel.

Panduan lengkap: [guides/push-notifications.md](../guides/push-notifications.md).

---

## Resource Channel

| Field | Arti |
|---|---|
| `id` | UUID unik buatan aplikasi — juga dikirim sebagai header `X-Goog-Channel-ID` |
| `resourceId` | ID resource yang diamati — wajib disimpan untuk `stop` |
| `resourceUri` | URL watch |
| `token` | String rahasia buatan aplikasi, dikirim balik sebagai `X-Goog-Channel-Token` untuk verifikasi |
| `expiration` | Timestamp milidetik — channel kedaluwarsa otomatis; maksimum sekitar sepekan |
| `type` | Selalu `web_hook` |

## Method

| Method | HTTP + Path | Fungsi |
|---|---|---|
| `stop` | `POST /channels/stop` | Hentikan channel lebih awal |
| `watch` | `POST /calendars/CALENDAR_ID/events/watch` | Amati event satu kalender |
| `watch` | `POST /users/me/calendarList/watch` | Amati daftar langganan |
| `watch` | `POST /calendars/CALENDAR_ID/acl/watch` | Amati aturan berbagi |
| `watch` | `POST /users/me/settings/watch` | Amati setting pengguna |

## Contoh: Mendaftarkan Watch

```bash
# (1) address = URL publik https milik aplikasi yang akan menerima notifikasi
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

Response:

```json
{
  "kind": "api#channel",
  "id": "CHANNEL_ID_UNIK",
  "resourceId": "RESOURCE_ID",
  "resourceUri": "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events",
  "token": "TOKEN_RAHASIA_APLIKASI",
  "expiration": 1789000000000
}
```

## Contoh: Menghentikan Channel

```bash
# (2) resourceId wajib — keduanya bersama-sama mengidentifikasi channel
curl -X POST "https://www.googleapis.com/calendar/v3/channels/stop" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "id": "CHANNEL_ID_UNIK", "resourceId": "RESOURCE_ID" }'
```

## Bentuk Notifikasi yang Diterima

Notifikasi **tidak memuat isi perubahan** — hanya pemberitahuan bahwa ada perubahan:

```text
POST https://aplikasiku.example.com/calendar/push
X-Goog-Channel-ID: CHANNEL_ID_UNIK
X-Goog-Channel-Token: TOKEN_RAHASIA_APLIKASI
X-Goog-Resource-ID: RESOURCE_ID
X-Goog-Resource-State: sync | exists | not_exists
X-Goog-Message-Number: 7
```

| Header | Arti |
|---|---|
| `X-Goog-Resource-State` | `sync` = sukses daftar; `exists` = ada perubahan; `not_exists` = resource terhapus |
| `X-Goog-Channel-Token` | Cocokkan dengan token yang kamu daftarkan — tolak bila tidak sama |
| `X-Goog-Message-Number` | Nomor urut per channel; deteksi duplikat/pengiriman ulang |

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Kedaluwarsa | Channel mati otomatis di batas maksimum; daftarkan ulang sebelum lewat |
| Reaksi benar | Saat notifikasi masuk, panggil `events.list` dengan `syncToken` — bukan baca full |
| Verifikasi wajib | Cek `X-Goog-Channel-Token` sebelum memproses |
| Response handler | Balas `200` cepat; pemrosesan berat dilakukan async |
| Satu channel per pasangan | (user, resource, address); id sama yang didaftarkan ulang akan replace |

> Prinsip: push notification hanya berita "ada yang berubah" — kebenaran data tetap diambil lewat sync token, bukan dipercaya dari notifikasi.
