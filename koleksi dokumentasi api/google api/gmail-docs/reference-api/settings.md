# Settings API

Endpoint pengaturan mailbox. Scope: `gmail.settings.basic`; delegasi sendAs: `gmail.settings.sharing`.

> API Reference / Settings

---

## SendAs

| Method | Path | Keterangan |
|---|---|---|
| GET | `settings/sendAs` | List semua alamat kirim |
| GET | `settings/sendAs/{sendAsEmail}` | Satu alamat |
| POST | `settings/sendAs` | Buat (butuh verifikasi) |
| PATCH | `settings/sendAs/{sendAsEmail}` | Ubah signature/displayName/replyTo |
| PUT | `settings/sendAs/{sendAsEmail}` | Ganti penuh |
| DELETE | `settings/sendAs/{sendAsEmail}` | Hapus (bukan primary) |
| POST | `settings/sendAs/{sendAsEmail}/verify` | Kirim email verifikasi |
| POST | `settings/sendAs/{sendAsEmail}/smimeInfo` | Kelola S/MIME (Workspace) |

Contoh buat:

```bash
curl -X POST ".../settings/sendAs" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "sendAsEmail": "nama@domain.com", "displayName": "Nama", "signature": "<p>Regards</p>" }'
```

`verificationStatus` mulai `pending` hingga email verifikasi diklik.

## AutoForwarding

| Method | Path |
|---|---|
| GET | `settings/autoForwarding` |
| PUT | `settings/autoForwarding` |

Body: `{ "enabled": true, "emailAddress": "arsip@domain.com", "disposition": "archive" }` — hanya satu alamat forward aktif (harus terdaftar sebagai sendAs terverifikasi bila di luar domain).

## IMAP / POP

| Method | Path |
|---|---|
| GET / PUT | `settings/imap` |
| GET / PUT | `settings/pop` |

```json
{ "enabled": true, "autoExpunge": true, "maxFolderSize": 0 }
```

## Vacation (auto-reply)

| Method | Path |
|---|---|
| GET | `settings/vacation` |
| PUT | `settings/vacation` |

```json
{ "enableAutoReply": true, "responseSubject": "Cuti", "responseBodyHtml": "<p>...</p>", "startTime": "1725500400000" }
```

## Language

| Method | Path |
|---|---|
| GET | `settings/language` |
| PUT | `settings/language` — body `{ "displayLanguage": "id" }` |

---

## Lihat Juga

- Model data: [../resources/settings.md](../resources/settings.md)
