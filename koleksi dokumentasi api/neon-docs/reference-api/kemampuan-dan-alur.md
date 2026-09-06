# Kemampuan Endpoint & Alur API — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** lewat Neon REST API v2 dan **kode mana yang melakukan apa**. Indeks lengkap semua endpoint: [api.md](api.md).

- Base URL: `https://console.neon.tech/api/v2`
- Auth: `Authorization: Bearer $NEON_API_KEY` (lihat [../permissions/kemampuan-dan-alur.md](../permissions/kemampuan-dan-alur.md))

---

## 1. Anatomi Request

```
https://console.neon.tech/api/v2/projects/PROJECT_ID/branches/BRANCH_ID/roles
└───────────────┬───────────────┘└───┬──┘└───┬────┘└─────┬─────┘└────┬─────┘└──┬──┘
          base + API v2        resource  ID        resource    ID     sub-resource
```

- Path selalu **di-scope berjenjang**: untuk mengelola role, Anda menyebut project → branch → roles. Ini mencerminkan hierarki objek Neon.
- Semua aksi tulis mengirim body JSON (`-d '{...}'`); semua call butuh Bearer key.

## 2. Peta Kemampuan per Grup Endpoint

| Grup | Kemampuan utama | Dipakai saat |
|---|---|---|
| [projects](projects/projects.md) | CRUD project, connection URI, recover, transfer, permissions, VPC, JWKS | Provisioning & manajemen aplikasi |
| [branches](branches/branches.md) | CRUD branch, restore point-in-time, schema compare, anonymize, set default, roles/databases per branch | Dev per fitur, CI/CD, PITR |
| [endpoints](endpoints/endpoints.md) | CRUD compute, start/suspend/restart | Kontrol ukuran & biaya |
| [operations](operations/operations.md) | Status operasi async | Polling setelah aksi tulis |
| [snapshots](snapshots/snapshots.md) | Snapshot manual/jadwal, restore | Backup terkelola |
| [consumption](consumption/consumption.md) | Metrik pemakaian per project/branch | Dashboard billing |
| [api-keys](api-keys/api-keys.md) | Buat/list/revoke key | Setup automasi |
| [users](users/users.md) | `GET /users/me`, org user, transfer personal→org | Identitas & migrasi akun |
| [organizations](organizations/organizations.md) | Member, invitations, spending limit, org keys, VPC | Manajemen tim |
| [regions](regions/regions.md) | Daftar region tersedia | Pilih lokasi project |
| [dataapi](dataapi/dataapi.md) | Konfigurasi Neon Data API + advisor keamanan | Akses data via API terautorisasi |
| [buckets](buckets/buckets.md) | Object storage per branch (list/create/presign/delete) | Penyimpanan file |
| [storage](storage/storage.md) | State object storage branch | Cek kuota storage |
| [functions](functions/functions.md) | Deploy/list/update/delete functions per branch | Compute kode di dekat DB |
| [logs](logs/logs.md) | Query log branch, daftar field | Observability/debugging |
| [credentials](credentials/credentials.md) | Credential scoped per branch | Akses terbatas sementara |
| [ai-gateway](ai-gateway/ai-gateway.md) | Endpoint AI Gateway branch | Integrasi AI |
| [auth](auth/auth.md) | Kelola Neon Auth (users, OAuth providers, plugins, webhooks) | Autentikasi aplikasi |

## 3. Penjelasan Kode per Pola Penting

### 3.1 Provisioning lengkap (project → branch → URI)

```bash
# (1) project: region_id & pg_version permanen setelah dibuat
curl -X POST 'https://console.neon.tech/api/v2/projects' \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{ "project": { "name": "app", "region_id": "aws-ap-southeast-1", "pg_version": 17 } }'

# (2) branch anak + compute (endpoints WAJIB agar bisa dikonek)
curl -X POST ".../projects/PROJECT_ID/branches" \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{ "branch": { "parent_id": "br-main", "name": "dev" },
        "endpoints": [ { "type": "read_write" } ] }'

# (3) connection string aplikasi (pooled=true → pooler utk serverless)
curl ".../projects/PROJECT_ID/connection_uri?branch_id=br-xxx&pooled=true" \
  -H 'Authorization: Bearer $NEON_API_KEY'
```

### 3.2 Pola async: aksi → poll operations

Aksi tulis (buat/ubah compute, restore) bersifat **asynchronous**:

```bash
# (1) aksi mengembalikan operation id(s)
curl -X PATCH ".../endpoints/ep-xxx" -d '{...}' -H 'Authorization: Bearer $KEY'
# response: { "operations": [ { "id": "op-123", "status": "running" } ] }

# (2) poll sampai finished sebelum melanjutkan (mis. sebelum test koneksi)
curl ".../projects/PROJECT_ID/operations?limit=10" -H 'Authorization: Bearer $KEY'
#   filter opsional: ?branch_id=...&status=finished
```

- `status` operasi: `running` → `finished` (atau `failed`).
- Tanpa polling, aplikasi bisa "menang balapan" — koneksi dites saat compute masih provisioning.

### 3.3 Pagination cursor

```bash
curl ".../projects?limit=100&cursor=CURSOR_SEBELUMNYA" -H 'Authorization: Bearer $KEY'
```

- `limit` maks 400; response berisi `pagination.cursor` bila masih ada data.
- Pola identik pageToken Blogger: loop selama cursor ada.

### 3.4 Monitoring konsumsi

```bash
curl ".../consumption_history/v2/projects?from=2026-08-01&to=2026-09-01" -H 'Authorization: Bearer $KEY'
```

- `from`/`to` membatasi periode; hasil per project: `active_time_seconds`, `cpu_used_sec`, `synthetic_storage_size` — bahan dashboard biaya internal.

### 3.5 Observability log

```bash
# (1) cek field log yang tersedia
curl ".../branches/BRANCH_ID/logs/fields" -H 'Authorization: Bearer $KEY'
# (2) query log dengan filter
curl -X POST ".../branches/BRANCH_ID/logs/query" -d '{ "filter": { "level": "error" } }'
```

## 4. Alur Standar Aplikasi Menggunakan API

```
auth: buat API key (permissions/) 
   → GET /users/me (validasi key)
   → POST /projects (provision)
   → poll operations
   → GET connection_uri → simpan ke env aplikasi
   → PATCH endpoints (tuning autoscaling)
   → GET consumption_history (monitoring berkala)
   → DELETE (deprovision saat selesai)
```

## 5. Antarmuka Lain yang Setara

| Antarmuka | Kapan |
|---|---|
| CLI `neon ...` | Operasi cepat di terminal; sama dengan API |
| SDK (`@neondatabase/toolbox` / client codegen dari [OpenAPI spec](https://neon.com/api_spec/release/v2.json)) | Aplikasi produksi |
| MCP | Orkestrasi oleh agent AI |
| Console | Manajemen manual & audit visual |

Setiap file endpoint (mis. [projects/list-projects.md](projects/list-projects.md)) memuat parameter lengkap + contoh response JSON — pakai sebagai spesifikasi saat integrasi.
