# Resource: Label

Objek `Label` merepresentasikan label Gmail — baik label **sistem** (INBOX, SENT...) maupun label buatan user.

---

## Representasi JSON

```json
{
  "id": "Label_1234567890",
  "name": "Pekerjaan",
  "type": "user",
  "messageListVisibility": "show",
  "labelListVisibility": "labelShow",
  "messagesTotal": 42,
  "messagesUnread": 3,
  "threadsTotal": 40,
  "threadsUnread": 3,
  "color": { "textColor": "#ffffff", "backgroundColor": "#4986e0" }
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `id` | string | ID label — dipakai di `messages.list?labelIds=` dan `modify` |
| `name` | string | Nama tampilan (label kustom mendukung nested `Parent/Anak`) |
| `type` | string | `user` atau `system` |
| `messageListVisibility` | string | `show` / `hide` — tampilkan di daftar email |
| `labelListVisibility` | string | `labelShow` / `labelShowIfUnread` / `labelHide` |
| `messagesTotal` / `messagesUnread` | integer | Statistik (read-only) |
| `color` | object | Warna label kustom (opsional) |

## Label Sistem (id = nama)

`INBOX`, `SENT`, `DRAFT`, `SPAM`, `TRASH`, `UNREAD`, `STARRED`, `IMPORTANT`, `CATEGORY_PERSONAL`, `CATEGORY_SOCIAL`, `CATEGORY_PROMOTIONS`, `CATEGORY_UPDATES`, `CATEGORY_FORUMS`

Aturan: label sistem **tidak bisa dibuat/dihapus**, sebagian tidak bisa di-rename; `modify` email dengan label sistem tertentu boleh (mis. menambah/menghapus `UNREAD`, `INBOX`, `STARRED`).

## Endpoint Terkait

CRUD label: [../reference-api/labels.md](../reference-api/labels.md) · pakai label di pencarian: [../guides/labels-and-search.md](../guides/labels-and-search.md)
