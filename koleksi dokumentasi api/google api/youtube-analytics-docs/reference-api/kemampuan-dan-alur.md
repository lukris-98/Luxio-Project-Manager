# Kemampuan & Alur — Anatomi Request per Operasi

API ini punya **8 operasi** saja.

| Operasi | Method & path | File |
|---|---|---|
| `reports.query` | `GET /v2/reports` | [reports-query.md](reports-query.md) |
| `groups.list` | `GET /v2/groups` | [groups.md](groups.md) |
| `groups.insert` | `POST /v2/groups` | [groups.md](groups.md) |
| `groups.update` | `PUT /v2/groups` | [groups.md](groups.md) |
| `groups.delete` | `DELETE /v2/groups` | [groups.md](groups.md) |
| `groupItems.list` | `GET /v2/groupItems` | [group-items.md](group-items.md) |
| `groupItems.insert` | `POST /v2/groupItems` | [group-items.md](group-items.md) |
| `groupItems.delete` | `DELETE /v2/groupItems` | [group-items.md](group-items.md) |

Base URL: `https://youtubeanalytics.googleapis.com/v2`

---

## 1. Anatomi Request Umum

```
GET https://youtubeanalytics.googleapis.com/v2/reports?<query>
    │                                          │      │
    │                                          │      └─ semua parameter di query string
    │                                          └──────── nama resource
    └─────────────────────────────────────────────────── base URL + versi

Header wajib:
  Authorization: Bearer ACCESS_TOKEN

Header untuk POST/PUT:
  Content-Type: application/json
```

Aturan yang berlaku untuk semua operasi:

| Aturan | Detail |
|---|---|
| Tidak ada path parameter | Semua identifikasi lewat query string (`id`, `groupId`, `ids`) — tidak ada `/groups/{id}` |
| Body hanya untuk POST/PUT | `GET` dan `DELETE` tidak boleh membawa body |
| Respons | JSON. `DELETE` mengembalikan `204 No Content` tanpa body |
| Format v2 | Hanya JSON. `alt=csv`, `quotaUser`, dan `userIp` dari v1 tidak didukung |

---

## 2. Parameter Standar Google API

| Parameter | Status di v2 | Keterangan |
|---|---|---|
| `access_token` | Didukung | Alternatif header `Authorization`. Hindari di produksi — token bocor ke log |
| `alt` | **Tidak didukung** | v2 hanya JSON |
| `callback` | Didukung | Nama fungsi callback JavaScript untuk request JSON-P |
| `prettyPrint` | Didukung | Default `true`. Set `false` untuk memperkecil payload |
| `quotaUser` | **Tidak didukung** | Hanya ada di v1 yang sudah usang |
| `userIp` | **Tidak didukung** | Hanya ada di v1 yang sudah usang |

---

## 3. Perbedaan Nama Parameter v1 → v2

| v1 | v2 |
|---|---|
| `start-date` | `startDate` |
| `end-date` | `endDate` |
| `max-results` | `maxResults` |
| `start-index` | `startIndex` |
| `include-historical-channel-data` | `includeHistoricalChannelData` |

> Catatan: kode lama yang memakai nama bertanda hubung akan gagal di v2.

---

## 4. Alur Antar Operasi

```
                      ┌──────────────────────┐
                      │ groups.insert        │  buat wadah segmen
                      │ POST /v2/groups      │  body: snippet.title
                      │                      │        contentDetails.itemType
                      └──────────┬───────────┘
                                 │ → group.id
                                 ▼
                      ┌──────────────────────┐
                      │ groupItems.insert    │  isi segmen (maks 500)
                      │ POST /v2/groupItems  │  body: groupId
                      │                      │        resource.id
                      └──────────┬───────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
   ┌──────────────────────┐            ┌──────────────────────────────┐
   │ groupItems.list      │            │ reports.query                │
   │ GET /v2/groupItems   │            │ GET /v2/reports              │
   │ ?groupId=...         │            │ ?filters=group==GROUP_ID      │
   └──────────────────────┘            └──────────────┬───────────────┘
                                                      │
                                                      ▼
                                    youtubeAnalytics#resultTable
                                    columnHeaders[] + rows[][]
```

---

## 5. Ringkasan Parameter per Operasi

| Operasi | Parameter wajib | Parameter opsional | Body |
|---|---|---|---|
| `reports.query` | `ids`, `startDate`, `endDate`, `metrics` | `dimensions`, `filters`, `sort`, `maxResults`, `startIndex`, `currency`, `includeHistoricalChannelData` | — |
| `groups.list` | `id` **atau** `mine` | `onBehalfOfContentOwner`, `pageToken` | — |
| `groups.insert` | — | `onBehalfOfContentOwner` | `snippet.title`, `contentDetails.itemType` |
| `groups.update` | — | `onBehalfOfContentOwner` | `id`, `snippet.title` |
| `groups.delete` | `id` | `onBehalfOfContentOwner` | — |
| `groupItems.list` | `groupId` | `onBehalfOfContentOwner` | — |
| `groupItems.insert` | — | `onBehalfOfContentOwner` | `groupId`, `resource.id` |
| `groupItems.delete` | `id` | `onBehalfOfContentOwner` | — |

---

## 6. Ringkasan Kode Balasan

| Operasi | Sukses | Balasan |
|---|---|---|
| `reports.query` | `200` | `youtubeAnalytics#resultTable` |
| `groups.list` | `200` | `youtube#groupListResponse` |
| `groups.insert` | `200` | resource `group` |
| `groups.update` | `200` | resource `group` |
| `groups.delete` | `204` | Tanpa body |
| `groupItems.list` | `200` | `youtube#groupItemListResponse` |
| `groupItems.insert` | `200` atau `204` | Resource `groupItem`; `204` bila item sudah ada di grup |
| `groupItems.delete` | `204` | Tanpa body |

---

## 7. Contoh Pembungkus Klien

```js
/**
 * Pembungkus tunggal untuk semua operasi YouTube Analytics API v2.
 * Menangani: query string, header, 204 tanpa body, dan envelope error.
 */
const BASE = 'https://youtubeanalytics.googleapis.com/v2'

export async function ytAnalytics(path, { token, method = 'GET', params = {}, body } = {}) {
  // Buang parameter bernilai undefined/null agar tidak terkirim sebagai "undefined".
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const qs = new URLSearchParams(clean).toString()
  const url = `${BASE}/${path}${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  // DELETE dan insert-duplikat mengembalikan 204 tanpa body.
  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.error?.errors?.[0] ?? {}
    throw Object.assign(new Error(detail.message ?? `HTTP ${res.status}`), {
      status: res.status,
      reason: detail.reason,
    })
  }
  return data
}

// Pemakaian:
// const report = await ytAnalytics('reports', { token, params: {
//   ids: 'channel==MINE', startDate: '2026-02-01', endDate: '2026-02-28',
//   metrics: 'views,estimatedMinutesWatched', dimensions: 'day', sort: 'day',
// }})
// const groups = await ytAnalytics('groups', { token, params: { mine: 'true' } })
// await ytAnalytics('groupItems', { token, method: 'DELETE', params: { id: ITEM_ID } })
```

---

## Selanjutnya

- Parameter `reports.query` lengkap: [reports-query.md](reports-query.md)
- CRUD grup: [groups.md](groups.md)
- Kelola item grup: [group-items.md](group-items.md)
