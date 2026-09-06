# Resource `group` — `youtube#group`

Sebuah **group** adalah koleksi kustom berisi maksimum **500** channel, video, playlist, atau aset. Semua item dalam satu grup harus bertipe sama — tidak boleh mencampur 100 video dan 100 playlist dalam satu grup.

Grup hanya boleh memuat resource yang Anda unggah, klaim, atau yang tertaut ke channel yang Anda kelola:

| Peran | Jenis grup yang bisa dibuat |
|---|---|
| Pemilik channel | Grup video, grup playlist |
| Pemilik konten | Grup video, playlist, channel, atau aset |

---

## 1. Representasi JSON

```json
{
  "kind": "youtube#group",
  "etag": "etag",
  "id": "string",
  "snippet": {
    "publishedAt": "datetime",
    "title": "string"
  },
  "contentDetails": {
    "itemCount": "unsigned long",
    "itemType": "string"
  }
}
```

| Properti | Tipe | Keterangan |
|---|---|---|
| `kind` | `string` | Selalu `youtube#group` |
| `etag` | `etag` | Etag resource |
| `id` | `string` | ID grup. Dipakai sebagai nilai `filters=group==<id>` dan sebagai `groupId` pada `groupItems` |
| `snippet` | `object` | Informasi dasar grup |
| `snippet.publishedAt` | `datetime` | Waktu pembuatan, format ISO 8601 (`YYYY-MM-DDThh:mm:ss.sZ`) |
| `snippet.title` | `string` | Nama grup. Harus string tidak kosong. **Satu-satunya properti yang bisa di-update** |
| `contentDetails` | `object` | Informasi tambahan tentang isi grup |
| `contentDetails.itemCount` | `unsigned long` | Jumlah item dalam grup |
| `contentDetails.itemType` | `string` | Jenis resource yang dimuat grup |

### Nilai `contentDetails.itemType`

| Nilai | Isi grup |
|---|---|
| `youtube#channel` | Channel (pemilik konten saja) |
| `youtube#playlist` | Playlist |
| `youtube#video` | Video |
| `youtubePartner#asset` | Aset (pemilik konten saja) |

---

## 2. Contoh Respons

```json
{
  "kind": "youtube#group",
  "etag": "\"m2yskBQFythfE4irbTIeOgYYfBU/Kkm0O9YOG5NF1BIAvnMEeNRvBSs\"",
  "id": "aBcDeFgHiJkLmNoP",
  "snippet": {
    "publishedAt": "2026-02-14T08:12:37.000Z",
    "title": "Serial Tutorial Luxio"
  },
  "contentDetails": {
    "itemCount": "23",
    "itemType": "youtube#video"
  }
}
```

> Catatan: `itemCount` bertipe *unsigned long* dan dikirim sebagai **string** dalam JSON. Konversi ke angka sebelum dibandingkan dengan 500.

---

## 3. Operasi

| Operasi | Method & path | Wajib | Balasan |
|---|---|---|---|
| `groups.list` | `GET /v2/groups` | `id` atau `mine=true` | `youtube#groupListResponse` |
| `groups.insert` | `POST /v2/groups` | body: `snippet.title`, `contentDetails.itemType` | resource `group` |
| `groups.update` | `PUT /v2/groups` | body: `id`, `snippet.title` | resource `group` |
| `groups.delete` | `DELETE /v2/groups?id=GROUP_ID` | `id` | `204 No Content` |

Semua operasi menerima parameter opsional `onBehalfOfContentOwner`.

Detail parameter: [../reference-api/groups.md](../reference-api/groups.md).

---

## 4. Contoh CRUD

```bash
# ① Daftar semua grup milik pengguna terautentikasi.
curl -G "https://youtubeanalytics.googleapis.com/v2/groups" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "mine=true"
# → { kind: "youtube#groupListResponse", items: [ {group}, ... ], nextPageToken }

# ② Buat grup video. itemType menentukan jenis item yang boleh masuk nanti.
curl -X POST "https://youtubeanalytics.googleapis.com/v2/groups" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "snippet":        { "title": "Serial Tutorial Luxio" },
        "contentDetails": { "itemType": "youtube#video" }
      }'
# → resource group dengan id baru; simpan id-nya.

# ③ Ganti nama grup. Wajib mengirim id DAN snippet.title.
curl -X PUT "https://youtubeanalytics.googleapis.com/v2/groups" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "id":      "GROUP_ID",
        "snippet": { "title": "Serial Tutorial Luxio 2026" }
      }'
# → contentDetails.itemType TIDAK bisa diubah setelah grup dibuat.

# ④ Hapus grup. Balasan 204 tanpa body.
curl -X DELETE -G "https://youtubeanalytics.googleapis.com/v2/groups" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "id=GROUP_ID"
```

---

## 5. Memakai Grup dalam Laporan

`group` adalah dimensi **filter-only**: hanya boleh muncul di `filters`, tidak pernah di `dimensions`. Saat dipakai, respons memuat data untuk **semua** video, playlist, atau channel dalam grup tersebut, digabung.

```bash
# Tren harian untuk seluruh video dalam satu grup, sebagai satu segmen.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-02-01" \
  --data-urlencode "endDate=2026-02-28" \
  --data-urlencode "metrics=views,estimatedMinutesWatched,averageViewDuration" \
  --data-urlencode "dimensions=day" \
  --data-urlencode "filters=group==GROUP_ID" \
  --data-urlencode "sort=day"
# → satu baris per hari, angka sudah dijumlahkan untuk seluruh anggota grup.
```

Pada banyak laporan, `group` berada dalam kelompok filter yang sama dengan `video` atau `playlist` ("gunakan 0 atau 1"), sehingga **tidak bisa dipakai bersamaan** dengan filter `video`/`playlist` di laporan yang sama.

Untuk laporan playlist, `group` adalah salah satu dari dua pilihan filter wajib: `playlist` **atau** `group`.

Detail pola pemakaian: [../guides/groups-and-custom-segments.md](../guides/groups-and-custom-segments.md).

---

## 6. Batasan

| Batasan | Nilai |
|---|---|
| Maksimum item per grup | 500 |
| Tipe item dalam satu grup | Harus seragam |
| Properti yang bisa di-update | Hanya `snippet.title` |
| Isi grup | Hanya resource yang diunggah, diklaim, atau tertaut ke channel yang dikelola |
| Grup video/playlist | Pemilik channel dan pemilik konten |
| Grup channel/aset | Pemilik konten saja |
| Error saat penuh | `groupItems.insert` → `403 groupContainsMaximumNumberOfItems` |

---

## Selanjutnya

- Anggota grup: [group-item.md](group-item.md)
- Endpoint lengkap: [../reference-api/groups.md](../reference-api/groups.md)
- Pola segmentasi: [../guides/groups-and-custom-segments.md](../guides/groups-and-custom-segments.md)
