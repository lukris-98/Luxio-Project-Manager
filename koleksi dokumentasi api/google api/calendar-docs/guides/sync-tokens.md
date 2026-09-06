# Guide: Sync Tokens

Sinkronisasi inkremental menggantikan "list semua event berulang-ulang" dengan "kirim hanya yang berubah". Token dipakai di `events.list`, `calendarList.list`, dan `acl.list`.

---

## Alur Dua Fase

```text
SINKRON AWAL                    SINKRON INKREMENtal (berulang)
events.list (tanpa syncToken)   events.list (syncToken=T)
        |                              |
  simpan nextSyncToken          items + nextPageToken terkumpul
        |                              |
  simpan state lokal            simpan nextSyncToken BARU
                                 410 Gone -> ulang sinkron awal
```

## Sinkron Awal

```bash
# (1) tanpa syncToken = full sync; showDeleted untuk ambil tombstone
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?maxResults=2500&showDeleted=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Simpan **`nextSyncToken`** dari response terakhir (setelah semua halaman diikutkan — lihat [pagination.md](pagination.md)).

```json
{
  "kind": "calendar#events",
  "items": [ ... ],
  "nextPageToken": "...",
  "nextSyncToken": "SIMPAN_TOKEN_INI"
}
```

## Sinkron Inkremental

```bash
# (2) hanya event yang berubah sejak token — termasuk yang dihapus (status cancelled)
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?syncToken=SIMPAN_TOKEN_INI&maxResults=2500" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Perlakuan item hasil delta:

| `status` | Aksi aplikasi |
|---|---|
| `confirmed` / `tentative` | Upsert ke penyimpanan lokal |
| `cancelled` | Hapus dari penyimpanan lokal |
| `recurrence` berubah pada master | Pertimbangkan invalidasi cache instance |

Setiap response delta juga membawa `nextSyncToken` **baru** — selalu ganti token lama.

## Token Kedaluwarsa (410 Gone)

```bash
# Token kadaluarsa -> 410
curl "https://www.googleapis.com/calendar/v3/calendars/CALENDAR_ID/events?syncToken=TOKEN_LAMA" \
  -H "Authorization: Bearer ACCESS_TOKEN"
# {"error": {"code": 410, "reason": "gone", "message": "Sync token is no longer up-to-date..."}}
```

Reaksi wajib: **ulangi sinkron awal dari nol**, lalu simpan token baru. Token bisa mati karena usia penyimpanan atau perubahan server-side; desain aplikasi agar full resync selalu aman dijalankan.

## Aturan Pemakaian

| Aturan | Penjelasan |
|---|---|
| Dilarang digabung | `syncToken` tidak boleh bersama `timeMin`, `timeMax`, `q`, `updatedMin`, `iCalUID`, `singleEvents`, dst. |
| `showDeleted` | Implisit aktif — item terhapus muncul sebagai `cancelled` |
| Ekspansi berulang | Token tidak bisa dengan `singleEvents=true`; delta master diproses sendiri |
| Satu token per skema | Token terikat kombinasi parameter; parameter berbeda = token baru |
| Penyimpanan | Simpan per (akun, `CALENDAR_ID`) dengan aman — kehilangan token = full resync |
| Kalender baru | `calendarList.list` delta lebih dulu menandai kalender baru sebelum sync event-nya |

```python
# Python: pola upsert delta
items = []
while True:
    params = {"maxResults": 2500}
    if sync_token:
        params["syncToken"] = sync_token
    r = requests.get(url, headers=auth, params=params).json()
    items += r.get("items", [])
    if "nextPageToken" in r:
        params["pageToken"] = r["nextPageToken"]      # (1) habiskan halaman dulu
        continue
    sync_token = r["nextSyncToken"]                   # (2) token TERAKHIR yang valid
    break
```

## Catatan Penting

| Topik | Penjelasan |
|---|---|
| Efisiensi | Delta biasanya jauh lebih kecil dari full list; pasangkan dengan [push-notifications.md](push-notifications.md) untuk pemicu real-time |
| `etag` per item | Gunakan untuk melewati item yang benar-benar tak berubah |
| Event berulang | Delta mengembalikan master + instance exception, bukan seluruh ekspansi |
| 404 kalender | Kalender sudah tidak ada — bersihkan state lokal |

> Prinsip: token adalah kursor waktu, bukan sesi — simpan terakhir yang valid, selalu siap menjalankan full resync tanpa drama.
