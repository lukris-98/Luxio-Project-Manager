# Labels API

CRUD label Gmail. Scope: `gmail.labels` untuk tulis; `gmail.readonly` untuk baca.

> API Reference / Labels

---

## GET /gmail/v1/users/me/labels

List **semua** label (sistem + kustom) sekaligus.

```bash
curl "https://gmail.googleapis.com/gmail/v1/users/me/labels" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Response

```json
{ "labels": [ { "id": "INBOX", "name": "INBOX", "type": "system", "messagesUnread": 2 }, { "id": "Label_1", "name": "Pekerjaan", "type": "user" } ] }
```

---

## GET .../labels/{id}

Satu label (dengan statistik `messagesTotal`/`messagesUnread`).

---

## POST .../labels

Buat label kustom. Scope: `gmail.labels`.

```bash
curl -X POST ".../labels" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "name": "Invoice",
    "labelListVisibility": "labelShow",
    "messageListVisibility": "show",
    "color": { "textColor": "#ffffff", "backgroundColor": "#fb4c2f" }
  }'
```

- Nama nested: `Pekerjaan/Klien A` — dibuat bertingkat otomatis.
- Label sistem **tidak** bisa dibuat ulang (nama tabrakan → `400`).

---

## PATCH / PUT .../labels/{id}

Ubah label (nama, visibility, warna). Scope: `gmail.labels`.

> Banyak properti hanya bisa via PATCH penuh — kirim ulang seluruh objek label yang sudah ada.

---

## DELETE .../labels/{id}

Hapus label kustom (email tidak ikut terhapus; hanya labelnya). Scope: `gmail.labels`.

### Errors

- `400` — label sistem.

---

## Lihat Juga

- Model data: [../resources/label.md](../resources/label.md)
- Pemakaian label di filter/pencarian: [../guides/labels-and-search.md](../guides/labels-and-search.md)
