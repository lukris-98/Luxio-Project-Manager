# Resource `groupItem` — `youtube#groupItem`

Sebuah **groupItem** mengaitkan satu resource YouTube (channel, video, playlist, atau aset) dengan satu grup Analytics.

---

## 1. Representasi JSON

```json
{
  "kind": "youtube#groupItem",
  "etag": "etag",
  "id": "string",
  "groupId": "string",
  "resource": {
    "kind": "string",
    "id": "string"
  }
}
```

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | `string` | Selalu `youtube#groupItem` |
| `etag` | `etag` | Etag resource |
| `id` | `string` | ID yang mengidentifikasi **keanggotaan** resource dalam grup tertentu. **Berbeda** dari ID channel/video/playlist/aset itu sendiri |
| `groupId` | `string` | ID grup yang memuat item ini |
| `resource` | `object` | Identitas resource yang ditambahkan |
| `resource.kind` | `string` | Jenis resource yang ditambahkan |
| `resource.id` | `string` | ID channel/video/playlist/aset sebenarnya |

### Nilai `resource.kind`

| Nilai | Resource |
|---|---|
| `youtube#channel` | Channel |
| `youtube#playlist` | Playlist |
| `youtube#video` | Video |
| `youtubePartner#asset` | Aset |

> Prinsip: `id` dipakai untuk **menghapus** item; `resource.id` dipakai untuk **mengambil metadata** dan sebagai nilai yang dikirim saat **menambah** item. Mengirim ID video sebagai parameter `id` pada `groupItems.delete` menghasilkan `404 groupItemNotFound`.

---

## 2. Contoh Respons

```json
{
  "kind": "youtube#groupItemListResponse",
  "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/nBSs0O9YOG5NF1BIAvnMEeNRvKkm\"",
  "items": [
    {
      "kind": "youtube#groupItem",
      "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/HpQz9zVvR7wSPCfC2p1t2xu6h4Q\"",
      "id": "aBcDeFgHiJkLmNoP.Q1r2S3t4U5v",
      "groupId": "aBcDeFgHiJkLmNoP",
      "resource": {
        "kind": "youtube#video",
        "id": "dQw4w9WgXcQ"
      }
    },
    {
      "kind": "youtube#groupItem",
      "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/W6x7Y8z9A0b1C2d3E4f\"",
      "id": "aBcDeFgHiJkLmNoP.F5g6H7i8J9k",
      "groupId": "aBcDeFgHiJkLmNoP",
      "resource": {
        "kind": "youtube#video",
        "id": "9bZkp7q19f0"
      }
    }
  ]
}
```

> Catatan: respons `groupItems.list` **tidak** memuat `nextPageToken`. Karena satu grup dibatasi 500 item, seluruh isi dikembalikan sekaligus.

---

## 3. Operasi

| Operasi | Method & path | Wajib | Balasan |
|---|---|---|---|
| `groupItems.list` | `GET /v2/groupItems?groupId=GROUP_ID` | `groupId` | `youtube#groupItemListResponse` |
| `groupItems.insert` | `POST /v2/groupItems` | body: `groupId`, `resource.id` | resource `groupItem`, atau `204` bila sudah ada |
| `groupItems.delete` | `DELETE /v2/groupItems?id=ITEM_ID` | `id` | `204 No Content` |

Semua operasi menerima parameter opsional `onBehalfOfContentOwner`.

`groupItems.list` punya kebutuhan scope khusus: **`youtube`** saja, **atau** kombinasi **`youtube.readonly` + `yt-analytics.readonly`**.

Detail parameter: [../reference-api/group-items.md](../reference-api/group-items.md).

---

## 4. Contoh Operasi

```bash
# ① Lihat isi grup.
curl -G "https://youtubeanalytics.googleapis.com/v2/groupItems" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "groupId=GROUP_ID"
# → items[].id  = ID keanggotaan (untuk delete)
#   items[].resource.id = ID video (untuk metadata & tampilan)

# ② Tambah video ke grup. Wajib: groupId + resource.id.
#    resource.kind boleh disertakan; jenis harus cocok dengan itemType grup.
curl -X POST "https://youtubeanalytics.googleapis.com/v2/groupItems" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "groupId":  "GROUP_ID",
        "resource": { "kind": "youtube#video", "id": "dQw4w9WgXcQ" }
      }'
# → 200 + resource groupItem bila baru
# → 204 No Content bila item SUDAH ada di grup (idempoten, bukan error)
# → 403 groupContainsMaximumNumberOfItems bila grup sudah 500 item

# ③ Hapus item. 'id' = groupItem.id, BUKAN ID video.
curl -X DELETE -G "https://youtubeanalytics.googleapis.com/v2/groupItems" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "id=aBcDeFgHiJkLmNoP.Q1r2S3t4U5v"
# → 204 No Content
# → 404 groupItemNotFound bila id salah
```

---

## 5. Pola Sinkronisasi Isi Grup

```js
/**
 * Sinkronkan isi grup agar sama dengan daftar videoIds yang diinginkan.
 * Perhatikan pemisahan antara groupItem.id (untuk delete) dan
 * groupItem.resource.id (untuk perbandingan).
 */
async function syncGroup(token, groupId, wantedVideoIds) {
  const base = 'https://youtubeanalytics.googleapis.com/v2/groupItems'
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Ambil isi grup saat ini.
  const listRes = await fetch(`${base}?groupId=${encodeURIComponent(groupId)}`, { headers })
  const current = (await listRes.json()).items ?? []

  // 2. Peta resource.id → groupItem.id untuk keperluan penghapusan.
  const byResourceId = new Map(current.map((it) => [it.resource.id, it.id]))
  const wanted = new Set(wantedVideoIds)

  // 3. Hapus yang tidak lagi diinginkan.
  for (const [resourceId, itemId] of byResourceId) {
    if (wanted.has(resourceId)) continue
    const res = await fetch(`${base}?id=${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      headers,
    })
    // 204 = sukses. 404 = sudah tidak ada, anggap sukses juga.
    if (res.status !== 204 && res.status !== 404) throw new Error(`delete gagal: ${res.status}`)
  }

  // 4. Tambah yang belum ada. Batas keras 500 item per grup.
  if (wanted.size > 500) throw new Error('Grup maksimum 500 item')
  for (const videoId of wanted) {
    if (byResourceId.has(videoId)) continue
    const res = await fetch(base, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, resource: { kind: 'youtube#video', id: videoId } }),
    })
    // 204 = item sudah ada (race condition) → aman diabaikan.
    if (res.status === 204) continue
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const reason = err?.error?.errors?.[0]?.reason
      if (reason === 'groupContainsMaximumNumberOfItems') throw new Error('Grup penuh (500 item)')
      throw new Error(`insert gagal: ${res.status} ${reason ?? ''}`)
    }
  }
}
```

---

## 6. Batasan

| Batasan | Nilai |
|---|---|
| Maksimum item per grup | 500 |
| Jenis item | Harus cocok dengan `contentDetails.itemType` grup induk |
| Kepemilikan | Hanya resource yang diunggah, diklaim, atau tertaut ke channel yang dikelola |
| Insert item duplikat | `204 No Content`, bukan error |
| Insert saat grup penuh | `403 groupContainsMaximumNumberOfItems` |
| Delete `id` tidak dikenal | `404 groupItemNotFound` |
| Paginasi | Tidak ada `nextPageToken` pada `groupItems.list` |

---

## Selanjutnya

- Grup induk: [group.md](group.md)
- Endpoint lengkap: [../reference-api/group-items.md](../reference-api/group-items.md)
- Memakai grup sebagai segmen laporan: [../guides/groups-and-custom-segments.md](../guides/groups-and-custom-segments.md)
