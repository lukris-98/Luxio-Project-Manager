# Resource: Attachment

Objek `Attachment` merepresentasikan lampiran email (satu part MIME dengan `attachmentId`).

---

## Representasi JSON

```json
{
  "attachmentId": "ANGjdJ_abc123",
  "filename": "laporan.pdf",
  "size": 102400,
  "data": "JVBERi0xLjcKJeLjz9tCjg0LjAgCi4uLg=="
}
```

## Properti

| Properti | Tipe | Keterangan |
|---|---|---|
| `attachmentId` | string | ID lampiran — dari `payload.parts[].body.attachmentId` |
| `filename` | string | Nama file asli |
| `size` | integer | Ukuran bytes |
| `data` | string | Isi file **base64url** |

## Cara Mendapatkan

1. `messages.get?format=full` → telusuri `payload.parts[]` (rekursif untuk multipart) → part dengan `filename` + `body.attachmentId`.
2. `GET .../messages/{msgId}/attachments/{attachmentId}` → dapatkan `data`.
3. Dekode base64url (`-`→`+`, `_`→`/`, tambah padding `=`) → tulis ke file binary.

## Menambahkan Lampiran Saat Kirim

Bukan lewat endpoint attachment — lampiran disusun sebagai **multipart MIME** di `raw`:

```
--boundary
Content-Type: text/plain; charset="UTF-8"

Isi email
--boundary
Content-Type: application/pdf; name="laporan.pdf"
Content-Disposition: attachment; filename="laporan.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjcK...
--boundary--
```

Detail lengkap + kode: [../guides/attachments-and-mime.md](../guides/attachments-and-mime.md).

## Batasan

- Total ukuran email (semua attachment) maksimum **35 MB** setelah encoding.
- Data base64 menambah ~33% ukuran — hitung sebelum kirim.
- `attachments.get` menghabiskan 5 unit kuota per panggilan (per attachment).
