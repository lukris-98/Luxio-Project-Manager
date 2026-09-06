# Kemampuan & Alur — Peta Lengkap Neon

File ini merangkum **semua hal yang bisa dilakukan** dengan platform Neon (serverless Postgres) dan **alurnya**, lengkap dengan penjelasan kode mana yang melakukan apa. Basis: hierarki objek Neon — `Organisasi → Project → Branch → (Compute, Role, Database)`.

- Base URL API: `https://console.neon.tech/api/v2`
- Autentikasi API: header `Authorization: Bearer $NEON_API_KEY`

---

## 1. Daftar Lengkap Kemampuan

### A. Akun & Akses

| Kemampuan | Sumber | Kode/Alat |
|---|---|---|
| Kelola profil, email, password, 2FA, passkey | [accounts/accounts.md](accounts/accounts.md) | Console → Account settings |
| Pulihkan akun terhapus (window 30 hari) | [accounts/account-recovery.md](accounts/account-recovery.md) | Email + link verifikasi |
| Buat/list/revoke API key (personal, org, project-scoped) | [permissions/api-keys.md](permissions/api-keys.md), [reference-api/](reference-api/) | `POST /api_keys` atau Console |
| Kelola peran user org (Admin/Editor/Viewer) | [permissions/user-permissions.md](permissions/user-permissions.md) | Console / API |

### B. Struktur Data (Provisioning)

| Kemampuan | Sumber | Kode/Alat |
|---|---|---|
| Buat project (region + versi Postgres terpilih) | [projects/projects.md](projects/projects.md), [reference-api/projects/create-project.md](reference-api/projects/create-project.md) | `POST /projects` |
| Buat branch (current / past data / schema-only / anonymized) | [branches/branches.md](branches/branches.md), [reference-api/branches/create-project-branch.md](reference-api/branches/create-project-branch.md) | `POST /projects/{id}/branches` |
| Kelola compute (resize, autoscaling, scale-to-zero, start/suspend/restart, read replica) | [computes/computes.md](computes/computes.md), [reference-api/endpoints/](reference-api/endpoints/) | `POST .../endpoints/{ep}/start` dll. |
| Kelola role Postgres (500/branch, neon_superuser otomatis) | [roles/roles.md](roles/roles.md) | `POST .../roles` atau SQL |
| Kelola database per branch (maks 500/branch) | [databases/databases.md](databases/databases.md) | `POST .../databases` |
| Ambil connection URI siap pakai | [reference-api/projects/get-connection-uri.md](reference-api/projects/get-connection-uri.md) | `GET .../connection_uri` |

### C. Operasi Lanjutan

| Kemampuan | Sumber |
|---|---|
| Backup manual `pg_dump` + automasi cron + S3 | [backups/](backups/) |
| Snapshot + jadwal backup terkelola + restore point-in-time | [reference-api/snapshots/](reference-api/snapshots/) |
| Restore branch ke kondisi historis | [reference-api/branches/restore-project-branch.md](reference-api/branches/restore-project-branch.md) |
| Monitor operasi async (polling status) | [reference-api/operations/](reference-api/operations/) |
| Pantau konsumsi/pemakaian (CU, storage) | [reference-api/consumption/](reference-api/consumption/) |
| Multitenancy database-per-user | [related/multitenancy.md](related/multitenancy.md) |
| Integrasi pihak ketiga (Vercel, GitHub, dll.) | [integrations/integrations.md](integrations/integrations.md) |

---

## 2. Alur Besar Penggunaan Neon

```
[Tahap Setup]                    [Tahap Operasional]              [Tahap Dev/CI]
API key ──► buat project ──► koneksi app ──► monitor konsumsi     branch per PR ──► tes ──► hapus branch
  │             │               │                    │
  │             │               │                    └── snapshot terjadwal ──► backup S3
  │             └── default branch (main) + neondb + neondb_owner + compute
  └── org invite member ──► set role ──► project permissions
```

## 3. Alur End-to-End Beranotasi: "Provision Database Baru via API"

```bash
# LANGKAH 1 — buat project; region & pg_version menentukan lokasi + versi Postgres
curl -X POST 'https://console.neon.tech/api/v2/projects' \
  -H 'Authorization: Bearer $NEON_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{ "project": { "name": "luxio-prod", "region_id": "aws-ap-southeast-1",
                     "pg_version": 17 } }'
# → simpan response.project.id  dan  connection_uris[0].connection_uri
#   (project baru otomatis punya: branch main + neondb + neondb_owner + compute R/W)

# LANGKAH 2 — ambil connection string kapan pun (untuk .env aplikasi)
curl "https://console.neon.tech/api/v2/projects/PROJECT_ID/connection_uri" \
  -H 'Authorization: Bearer $NEON_API_KEY'
# → postgresql://neondb_owner:PASSWORD@ep-xxx.aws.neon.tech/neondb

# LANGKAH 3 — buat branch development (copy-on-write: isolasi penuh dari main)
curl -X POST "https://console.neon.tech/api/v2/projects/PROJECT_ID/branches" \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{ "branch": { "parent_id": "br-main-id", "name": "dev-fitur-x" },
        "endpoints": [ { "type": "read_write" } ] }'
#   "branch.parent_id"  → sumber schema+data branch baru
#   "endpoints"         → compute WAJIB dibuat bersamaan agar branch bisa dikonek

# LANGKAH 4 — verifikasi operasi selesai (banyak aksi bersifat async)
curl "https://console.neon.tech/api/v2/projects/PROJECT_ID/operations" \
  -H 'Authorization: Bearer $NEON_API_KEY'
# → poll sampai operasi status "finished" sebelum lanjut (mis. sebelum koneksi)
```

Penjelasan per langkah ada di file detail; indeks seluruh endpoint: [reference-api/api.md](reference-api/api.md).

---

## 4. Peta "Saya Mau Melakukan X → Buka File Y"

| Saya mau... | File |
|---|---|
| Memahami hierarki objek & batasan plan | [overview/kemampuan-dan-alur.md](overview/kemampuan-dan-alur.md) |
| Membuat / mengelola project | [projects/kemampuan-dan-alur.md](projects/kemampuan-dan-alur.md) |
| Branching (dev per fitur, CI/CD, PITR) | [branches/kemampuan-dan-alur.md](branches/kemampuan-dan-alur.md) |
| Mengatur ukuran & biaya compute | [computes/kemampuan-dan-alur.md](computes/kemampuan-dan-alur.md) |
| Membuat role & atur akses least-privilege | [roles/kemampuan-dan-alur.md](roles/roles.md) + [roles/kemampuan-dan-alur.md](roles/kemampuan-dan-alur.md) |
| Membuat database & GRANT akses | [databases/kemampuan-dan-alur.md](databases/kemampuan-dan-alur.md) |
| Backup & restore | [backups/kemampuan-dan-alur.md](backups/kemampuan-dan-alur.md) |
| Manajemen tim & organisasi | [organizations/kemampuan-dan-alur.md](organizations/kemampuan-dan-alur.md) |
| API key & hak akses | [permissions/kemampuan-dan-alur.md](permissions/kemampuan-dan-alur.md) |
| Semua endpoint API beranotasi | [reference-api/kemampuan-dan-alur.md](reference-api/kemampuan-dan-alur.md) |
| Arsitektur SaaS multitenant | [related/kemampuan-dan-alur.md](related/kemampuan-dan-alur.md) |
| Jadwal maintenance & dampaknya | [maintenance/kemampuan-dan-alur.md](maintenance/kemampuan-dan-alur.md) |
| Integrasi pihak ketiga | [integrations/kemampuan-dan-alur.md](integrations/kemampuan-dan-alur.md) |
| Akun, 2FA, recovery | [accounts/kemampuan-dan-alur.md](accounts/kemampuan-dan-alur.md) |
| Ringkasan platform | [overview/kemampuan-dan-alur.md](overview/kemampuan-dan-alur.md) |

---

## 5. Konvensi Kode di Seluruh Dokumentasi Neon

Tiga antarmuka dipakai bergantian di semua file — ini cara membacanya:

```bash
# CLI — paling cepat untuk operasi harian
neon branches create --name dev-fitur-x
#   sub-command `branches create` = buat branch; --name = nama kustom

# API — untuk automasi/program
curl -X POST 'https://console.neon.tech/api/v2/projects/PROJECT_ID/branches' \
  -H "Authorization: Bearer $NEON_API_KEY"    # kunci akses — wajib di semua call
  -d '{ "branch": {...} }'                    # body JSON sesuai resource

# SQL — kontrol akses halus di dalam Postgres
CREATE ROLE readonly;                          # role dibuat via SQL TIDAK dapat neon_superuser
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

Pola penting: aksi via Console/CLI/API menghasilkan role berhak `neon_superuser`; aksi via SQL mengikuti prinsip least-privilege (lihat [databases/database-access.md](databases/database-access.md)).
