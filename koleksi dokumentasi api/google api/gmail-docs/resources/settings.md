# Resource: Settings

Resource `Settings` mengatur preferensi mailbox: alamat kirim (sendAs), auto-forwarding, vacation responder, IMAP/POP, dan bahasa.

---

## SendAs (kirim atas nama alamat lain)

```json
{
  "sendAsEmail": "nama@domaincustom.com",
  "displayName": "Nama Tampilan",
  "replyToAddress": "reply@domaincustom.com",
  "signature": "<p>Salaman, Nama</p>",
  "isPrimary": false,
  "isDefault": false,
  "verificationStatus": "accepted"
}
```

| Properti | Keterangan |
|---|---|
| `sendAsEmail` | Alamat pengirim alternatif |
| `isPrimary` | true = alamat utama mailbox |
| `verificationStatus` | `accepted` setelah verifikasi email |
| `signature` | Signature HTML |

SendAs baru wajib diverifikasi: `POST .../settings/sendAs/{email}/verify` → Google mengirim email konfirmasi.

## AutoForwarding

```json
{ "enabled": true, "emailAddress": "arsip@domain.com", "disposition": "archive" }
```

`disposition`: `leaveInInbox` / `archive` / `trash` / `markRead`.

## Vacation (auto-reply)

```json
{
  "enableAutoReply": true,
  "responseSubject": "Sedang cuti",
  "responseBodyHtml": "<p>Saya balas setelah kembali.</p>",
  "restrictToContacts": true,
  "restrictToDomain": false,
  "startTime": "1725500400000",
  "endTime": "1728178800000"
}
```

`startTime`/`endTime` epoch ms (string). Bila hanya `startTime` diisi → aktif tanpa akhir.

## IMAP / POP

```json
{ "enabled": true, "autoExpunge": true, "maxFolderSize": 0 }
```

## Language

```json
{ "displayLanguage": "id" }
```

## Endpoint Terkait

Semua endpoint settings: [../reference-api/settings.md](../reference-api/settings.md) — butuh scope `gmail.settings.basic` (sendAs delegasi butuh `gmail.settings.sharing`).
