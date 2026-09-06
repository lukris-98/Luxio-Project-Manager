# Pagination

Semua endpoint list (`messages.list`, `threads.list`, `drafts.list`, `history.list`) memakai pola **pageToken**.

---

## Pola Dasar

1. Request pertama tanpa `pageToken`, dengan `maxResults` (maks 500).
2. Response memuat `nextPageToken` **bila masih ada data**.
3. Request berikutnya `pageToken=<nextPageToken>`.
4. Berhenti bila token habis.

```bash
# Halaman 1
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Halaman 2
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&pageToken=TOKEN_DARI_HALAMAN1" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Contoh Loop Lengkap (Node.js)

```js
async function listAllMessages(token, q) {
  const all = [];
  let pageToken;
  do {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', '500');          // (1) halaman terbesar = paling hemat
    if (q) url.searchParams.set('q', q);                // (2) filter konsisten antar halaman
    if (pageToken) url.searchParams.set('pageToken', pageToken); // (3) posisi halaman

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Gmail API ${res.status}`);
    const data = await res.json();

    all.push(...(data.messages ?? []));                 // (4) tumpuk id
    pageToken = data.nextPageToken;                     // (5) undefined = habis
  } while (pageToken);
  return all;
}
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| `maxResults` maksimum | 500 untuk semua endpoint list Gmail |
| Token valid | Hanya untuk kombinasi query yang sama — ubah `q`/`labelIds` → mulai dari awal |
| Kuota | List = 5 unit; loop 100 halaman = 500 unit — masih di bawah 250/s jika bertahap |
| Hasil berubah saat iterasi | Email baru bisa masuk antar halaman; dedup by `id` |
| Alternatif besar | `history.list` incremental jauh lebih hemat daripada full list berulang |

## Alternatif: Date-based Sync

Untuk backlog besar, filter tanggal mengurangi halaman:

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:2026/08/01&maxResults=500" ...
```

Cocok untuk sinkronisasi incremental tanpa history: simpan tanggal sync terakhir → `after:TANGGAL_TERAKHIR`.
