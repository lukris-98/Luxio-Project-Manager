# Kemampuan Permissions & API Keys — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** untuk kontrol akses Neon dan **kode mana yang melakukan apa**, berdasarkan [api-keys.md](api-keys.md), [user-permissions.md](user-permissions.md), dan [project-permissions-get-started.md](project-permissions-get-started.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Metode | Endpoint |
|---|---|---|
| Buat API key personal | Console → Account settings → API keys | `POST /api_keys` |
| Buat API key organisasi | Console org → Settings → API keys | `POST /organizations/{org}/api_keys` |
| Buat API key project-scoped | Console org → Settings → API keys | Sama, dengan project target |
| Revoke key | Console / API | `DELETE /api_keys/{id}` |
| Lihat siapa boleh apa (matriks) | [user-permissions.md](user-permissions.md) | — |
| Batasi akses per project | Console / API | `POST /projects/{id}/permissions` |
| Kelola member project (org) | API | `PUT/DELETE .../members/{mid}/role` |
| Verifikasi siapa bisa akses apa | Console Project permissions | `GET .../permissions` |

## 2. Tiga Jenis API Key

| Jenis | Pembuat | Cakupan | Dipakai untuk |
|---|---|---|---|
| Personal | Siapa pun | Semua project org tempat user member | Tool pribadi, eksperimen |
| Organization | Admin org | Semua project org | CI/CD, automasi lintas project |
| Project-scoped | Admin org | Satu project | Agent/worker yang hanya boleh sentuh 1 project |

Rahasia key hanya **ditampilkan sekali** saat pembuatan — hilang = revoke + buat baru (revoke berlaku seketika).

## 3. Alur Least-Privilege Tim

```
Semua member bisa lihat semua project (default)
        │
        ▼
Tetapkan role org utk tiap orang (Admin/Editor/Viewer)
        │
        ▼
Kontraktor/agent hanya butuh 1 project?
        └──► grant project permission di project itu saja
        └──► atau beri API key project-scoped
        │
        ▼
Verifikasi: halaman Project permissions + GET .../permissions
```

Manfaat: kebocoran kredensial/kesalahan hanya berdampak satu project, bukan seluruh org.

## 4. Penjelasan Kode

### 4.1 Buat API key (create-api-key.md)

```bash
curl -X POST 'https://console.neon.tech/api/v2/api_keys' \
  -H 'Authorization: Bearer $NEON_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{ "name": "ci-deploy-key" }'
```

- `name` = label key untuk audit (mudah revoke key mana saat rotasi).
- Response memuat `key` — **simpan segera**; tidak bisa dilihat ulang.
- Key inilah yang dipakai di semua header `Authorization: Bearer $NEON_API_KEY` pada dokumentasi lain.

### 4.2 Revoke

```bash
curl -X DELETE "https://console.neon.tech/api/v2/api_keys/{key_id}" \
  -H 'Authorization: Bearer $NEON_API_KEY'
```

- `{key_id}` = ID key (bukan secret-nya). Revoke permanen & instan — semua request dengan key itu langsung 401.

### 4.3 Grant akses project (grant-permission-to-project.md)

```bash
curl -X POST ".../projects/PROJECT_ID/permissions" \
  -d '{ "email": "kontraktor@luar.com", "role": "ADMIN" }'   // (1) role di project ini saja
```

- `email` = akun Neon yang diberi akses; `role` = hak di project **hanya project ini** (tidak memperluas role org).
- Hapus akses: `DELETE .../permissions/{permission_id}`.

### 4.4 Verifikasi

```bash
curl ".../projects/PROJECT_ID/permissions" -H 'Authorization: Bearer $NEON_API_KEY'
# → daftar siapa punya akses project tsb; bandingkan dengan daftar kebutuhan tim
```

## 5. Pola Rotasi Key

```
buat key baru ──► ganti secret di CI/secret store ──► verifikasi deploy jalan
      ──► revoke key lama ──► selesai (tanpa downtime)
```

Jangan menaruh key di kode sumber/repo — pakai secret store; batasi key project-scoped untuk worker yang tidak butuh yang lain.
