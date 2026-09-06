# Pagination

Semua method `list` di YouTube Data API memakai pola token: `maxResults` menentukan ukuran halaman, `nextPageToken`/`prevPageToken` menentukan halaman berikut/sebelumnya.

- Dokumentasi resmi: https://developers.google.com/youtube/v3/guides/implementation/pagination

---

## 1. Pola Dasar

```
Request 1:  ?part=snippet&maxResults=50
              │
              ▼
Response 1: { items: [...50 item...], nextPageToken: "CDIQAA", pageInfo: {...} }
              │
              ▼
Request 2:  ?part=snippet&maxResults=50&pageToken=CDIQAA
              │
              ▼
Response 2: { items: [...50 item...], nextPageToken: "CGQQAA", prevPageToken: "CDIQAQ" }
              │
              ▼
            ... ulangi sampai nextPageToken tidak ada di response
```

| Field response | Arti |
|---|---|
| `items[]` | Isi halaman ini |
| `nextPageToken` | Token untuk halaman berikutnya. **Tidak ada** = halaman terakhir |
| `prevPageToken` | Token untuk halaman sebelumnya |
| `pageInfo.totalResults` | Perkiraan total hasil |
| `pageInfo.resultsPerPage` | Jumlah item yang benar-benar dikembalikan |

> Prinsip: **berhenti kalau `nextPageToken` tidak ada.** Jangan pakai `pageInfo.totalResults` untuk menghitung jumlah halaman — nilainya perkiraan dan bisa salah.

---

## 2. `maxResults`

| Endpoint | Rentang `maxResults` | Default |
|---|---|---|
| `search.list` | `0`–`50` | `5` |
| Sebagian besar `list` lain (`videos`, `playlists`, `playlistItems`, `subscriptions`, `commentThreads`, `comments`, `activities`, `channelSections`, ...) | umumnya `0`/`1`–`50` | bervariasi per method |

Nilai persisnya per method ada di halaman referensi masing-masing; cek [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

> Catatan: API **boleh** mengembalikan item lebih sedikit dari `maxResults` walaupun masih ada hasil lain, karena penyortiran/pemfilteran internal. Jangan menyimpulkan "halaman tidak penuh berarti sudah habis" — patokannya tetap ada/tidaknya `nextPageToken`.

Pilih `maxResults=50` hampir selalu:

```
Mengambil 200 video dari playlist:
  maxResults=5   → 40 request → 40 unit
  maxResults=50  → 4 request  → 4 unit
```

---

## 3. Contoh curl Berurutan

```bash
# HALAMAN 1 — tanpa pageToken.
curl "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLAYLIST_ID&maxResults=50&key=API_KEY"
# → { "items": [...], "nextPageToken": "EAAaBlBUOkNESQ" }

# HALAMAN 2 — pageToken diambil dari nextPageToken response sebelumnya.
curl "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLAYLIST_ID&maxResults=50&pageToken=EAAaBlBUOkNESQ&key=API_KEY"
```

```bash
# search.list ikut pola yang sama.
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=skateboarding+dog&type=video&order=viewCount&maxResults=10&key=API_KEY"
# → nextPageToken

curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=skateboarding+dog&type=video&order=viewCount&maxResults=10&pageToken=CAoQAA&key=API_KEY"
```

---

## 4. Batas Hasil pada `search.list`

Ini bagian yang paling sering salah dipahami.

| Fakta | Detail |
|---|---|
| Batas 500 video | Hasil `search.list` dibatasi maksimum **500 video** kalau request menyebut `channelId` **dan** `type=video`, **tanpa** menyertakan salah satu filter `forContentOwner`, `forDeveloper`, atau `forMine` |
| `pageInfo.totalResults` | Nilainya perkiraan, dan nilai maksimumnya 1.000.000. Jangan dipakai membangun link paginasi |
| Bucket kuota terpisah | `search.list` punya bucket sendiri: 100 panggilan per hari. Setiap halaman = 1 panggilan |

Konsekuensi praktis: 500 hasil dengan `maxResults=50` = 10 panggilan = 10% bucket search harian kamu, untuk satu channel saja.

### Alternatif yang benar untuk "semua video satu channel"

Jangan pakai `search.list`. Pakai playlist `uploads` milik channel:

```bash
# 1 unit — ambil ID playlist uploads.
curl "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=CHANNEL_ID&key=API_KEY"
# → items[0].contentDetails.relatedPlaylists.uploads = "UU..." 

# 1 unit per halaman — tidak menyentuh bucket search.list, tidak terkena batas 500.
curl "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=UPLOADS_PLAYLIST_ID&maxResults=50&key=API_KEY"
```

Dokumentasi resmi `search.list` juga menyarankan hal yang sama untuk mengambil video terbaru sebuah channel: `order=date` bergantung pada indeks pencarian sehingga bisa tertunda atau tidak lengkap; `playlistItems.list` atas playlist `uploads` lebih andal.

---

## 5. Iterator yang Bisa Dipakai Ulang

```js
// Generator async: yield item satu per satu, transparan terhadap paginasi.
// hardLimit mencegah loop tak terbatas kalau API terus mengembalikan token.
async function* paginate(listFn, params, { hardLimit = 20 } = {}) {
  let pageToken;
  let pages = 0;

  do {
    const { data } = await listFn({ ...params, pageToken, maxResults: 50 });
    for (const item of data.items ?? []) yield item;

    pageToken = data.nextPageToken; // undefined = halaman terakhir
    pages += 1;
    if (pages >= hardLimit) break; // sabuk keselamatan kuota
  } while (pageToken);
}

// Pemakaian:
for await (const item of paginate(youtube.playlistItems.list.bind(youtube.playlistItems), {
  part: ['snippet', 'contentDetails'],
  playlistId: 'PLAYLIST_ID',
})) {
  console.log(item.contentDetails.videoId, item.snippet.title);
}
```

```python
def paginate(list_method, hard_limit=20, **params):
    """Yield semua item dari method list, menangani pageToken otomatis."""
    page_token = None
    pages = 0

    while True:
        params["maxResults"] = 50
        params["pageToken"] = page_token
        response = list_method(**params).execute()

        for item in response.get("items", []):
            yield item

        page_token = response.get("nextPageToken")
        pages += 1
        # Berhenti kalau token habis atau batas halaman tercapai.
        if not page_token or pages >= hard_limit:
            break


# Pemakaian:
for item in paginate(
    youtube.playlistItems().list,
    part="snippet,contentDetails",
    playlistId="PLAYLIST_ID",
):
    print(item["contentDetails"]["videoId"], item["snippet"]["title"])
```

---

## 6. Pola Batch: Kumpulkan ID Dulu, Baru Ambil Detail

```js
// SALAH — 1 request videos.list per video: 50 request = 50 unit.
for (const item of playlistItems) {
  await youtube.videos.list({ part: ['statistics'], id: item.contentDetails.videoId });
}

// BENAR — satu request untuk 50 ID sekaligus: 1 unit.
const ids = playlistItems.map((i) => i.contentDetails.videoId);
const { data } = await youtube.videos.list({
  part: ['snippet', 'statistics'],
  id: ids.slice(0, 50).join(','), // batas praktis: 50 ID per request
});
```

Detail perhitungan kuota: [quota-cost.md](quota-cost.md).

---

## 7. Error Terkait Paginasi

| HTTP | reason | Penyebab |
|---|---|---|
| 400 | `invalidPageToken` | Token tidak valid atau sudah kadaluarsa. Jangan simpan token lama untuk dipakai besok — mulai ulang dari halaman 1 |
| 400 | `invalidMode` | Khusus `members.list`: `pageToken` diambil dengan `mode` berbeda dari yang dipakai sekarang |
| 400 | `incompatibleParameters` | `pageToken` dikombinasi dengan parameter yang tidak boleh berbarengan |

> Prinsip: `pageToken` adalah kursor jangka pendek, bukan bookmark permanen. Untuk sinkronisasi berulang, simpan **ID resource** yang sudah kamu proses, bukan token halaman.
