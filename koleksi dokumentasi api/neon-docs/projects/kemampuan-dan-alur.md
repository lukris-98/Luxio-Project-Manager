# Kemampuan Projects & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan project Neon dan **kode mana yang melakukan apa**, berdasarkan [projects.md](projects.md) dan [../reference-api/projects/](../reference-api/projects/).

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint | Keterangan |
|---|---|---|
| Buat project (region + pg_version) | `POST /projects` | Otomatis: branch main + neondb + neondb_owner + compute |
| List project (cursor, search, limit) | `GET /projects` | Maks limit 400 per halaman |
| Detail / update / hapus project | `GET/PATCH/DELETE /projects/{id}` | `PATCH` = ubah nama, settings, allowed IPs |
| Pulihkan project terhapus | `POST /projects/{id}/recover` | Ada recovery window |
| Shared projects | `GET /projects/shared` | Project yang di-share ke Anda |
| Connection URI | `GET .../connection_uri` | String koneksi siap pakai (dapat `pooled=true`) |
| Izin akses project (permissions) | `GET/POST .../permissions`, `DELETE .../permissions/{pid}` | Share project ke user lain |
| Kelola member & role project | `GET .../members`, `PUT/DELETE .../members/{mid}/role` | Untuk organisasi |
| Transfer project | `POST .../transfer_requests`, `PUT .../transfer_requests/{rid}` | Antar akun/org |
| VPC endpoint restriction | `GET/POST/DELETE .../vpc_endpoints` | Batasi akses ke jaringan tertentu |
| Preload libraries | `GET .../available_preload_libraries` | Daftar ekstensi yang bisa diaktifkan |
| JWKS URLs | `GET/POST/DELETE .../jwks` | Kunci untuk verifikasi JWT (RLS) |

## 2. Alur Siklus Hidup Project

```
POST /projects ──► provisioning async ──► operations "finished"
      │                                      │
      │  response memuat:                    ▼
      │  project.id ──────────────► connection_uri ──► aplikasi koneksi
      │  branch.id, endpoint.host
      │  connection_uris[]
      │
      ├── PATCH (rename, settings, allowed_ips)
      ├── transfer ke org (transfer_requests)
      └── DELETE ──► recover window ──► POST /recover atau hilang permanen
```

## 3. Penjelasan Kode

### 3.1 Buat project (create-project.md)

```bash
curl -X POST 'https://console.neon.tech/api/v2/projects' \
  -H 'Authorization: Bearer $NEON_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{ "project": {
    "name": "myapp-prod",              // (1) label bebas (bukan ID unik)
    "region_id": "aws-ap-southeast-1", // (2) lokasi data — pilih terdekat user
    "pg_version": 17                   // (3) versi Postgres — TIDAK bisa diubah belakangan
  } }'
```

| Field | Melakukan apa |
|---|---|
| `name` | Label tampilan; ID project dibuat otomatis (mis. `silent-forest-303030`) |
| `region_id` | Region AWS/Azure tempat compute & data berada; latency aplikasi bergantung ini. Daftar: `GET /regions` |
| `pg_version` | 14–17; tidak bisa diganti setelah dibuat (perlu project baru + migrasi) |

**Response penting** (struktur di [list-projects.md](list-projects.md)): `project.id`, `project.branch_id` (main), `project.connection_uris[]`, `project.owner_id`/`org_id`.

### 3.2 Connection URI (get-connection-uri.md)

```bash
curl ".../projects/PROJECT_ID/connection_uri?branch_id=br-xxx&role_name=app_rw&database_name=neondb&pooled=true"
```

- `branch_id` → koneksi mengarah ke compute branch itu (default: default branch).
- `role_name` + `database_name` → komponen user/db pada string koneksi.
- `pooled=true` → memakai **connection pooling** Neon (host `...pooler...`) — wajib untuk serverless/high-concurrency karena Postgres dibatasi ~10.000 koneksi.

### 3.3 Transfer & recover

```bash
# Transfer ke org lain: sumber membuat request
curl -X POST ".../projects/PROJECT_ID/transfer_requests" -d '{ "org_id": "org-target" }'
# Target menerima request
curl -X PUT ".../projects/PROJECT_ID/transfer_requests/{request_id}"
```

```bash
# Pulihkan project yang terhapus (masih dalam window recovery)
curl -X POST ".../projects/PROJECT_ID/recover"
```

- Transfer dua langkah (request → accept) mencegah pencurian project.
- `recover` hanya bekerja selama recovery window; setelah itu permanen.

## 4. Parameter `list` yang Penting

| Parameter | Dipakai untuk |
|---|---|
| `limit` (maks 400) + `cursor` | Pagination automasi (pola sama seperti `nextPageToken` Blogger: ambil `cursor` dari response sebelumnya) |
| `search` | Cari project by nama/ID parsial |
| `org_id` | Wajib saat memakai personal API key di context organisasi |
| `timeout` | Batasi delay response; project yang belum terfetch masuk atribut `unavailable` |
| `recoverable` | Tampilkan project terhapus yang masih bisa dipulihkan |
