# Kemampuan Roles & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan role Postgres di Neon dan **kode mana yang melakukan apa**, berdasarkan [roles.md](roles.md) dan [../reference-api/branches/](../reference-api/branches/) (endpoint roles).

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint / SQL | Keterangan |
|---|---|---|
| Buat role | `POST .../branches/{id}/roles` | Otomatis dapat `neon_superuser` |
| List role | `GET .../roles` | Termasuk role hasil duplikasi dari parent branch |
| Detail role | `GET .../roles/{name}` | Atribut + privileges |
| Hapus role | `DELETE .../roles/{name}` | Role owner database tidak bisa dihapus asal-asalan |
| Lihat password role | `GET .../roles/{name}/reveal_password` | Hanya role yang dibuat tanpa `password` custom |
| Reset password | `POST .../roles/{name}/reset_password` | Response memuat password baru — update aplikasi |
| Role berbatas akses | SQL `CREATE ROLE` + `GRANT` | Tidak dapat neon_superuser — pola least privilege |

Limit: **500 role per branch**. Role milik branch: duplikasi ke branch anak mengikuti aturan parent.

## 2. Dua Jalur Membuat Role

```
Console / CLI / API  ──►  role + neon_superuser
   (admin/power user: bisa buat db, role, baca-tulis semua)

SQL (psql/SQL Editor) ──►  role polos
   (app user/readonly: hak harus diberikan eksplisit per objek)
```

Alasan keamanan: `neon_superuser` setara CREATEDB + CREATEROLE + BYPASSRLS + REPLICATION + baca-tulis semua data — jangan pakai untuk koneksi aplikasi biasa.

## 3. Penjelasan Kode

### 3.1 Buat role via API

```bash
curl -X POST ".../projects/PROJECT_ID/branches/BRANCH_ID/roles" \
  -H 'Authorization: Bearer $NEON_API_KEY' -H 'Content-Type: application/json' \
  -d '{ "role": { "name": "ci_deployer" } }'
```

- `name` = nama role Postgres; tanpa `password` → Neon mengenerate password (bisa dilihat lewat reveal_password).
- Role ini langsung member of `neon_superuser` — cocok untuk tool admin, bukan untuk app runtime.

### 3.2 Lihat / reset password

```bash
# Lihat password yang digenerate Neon
curl ".../roles/ci_deployer/reveal_password" -H 'Authorization: Bearer $NEON_API_KEY'

# Reset: role kehilangan password lama
curl -X POST ".../roles/ci_deployer/reset_password" -H 'Authorization: Bearer $NEON_API_KEY'
```

- `reveal_password` dipakai saat kehilangan catatan password (belum dirotasi).
- `reset_password` = jalur rotasi berkala; response memuat password baru → update env var aplikasi sebelum request lama dicabut.

### 3.3 Role berbatas akses via SQL

```sql
CREATE USER app_runtime WITH PASSWORD 'secret';          -- user aplikasi
GRANT CONNECT ON DATABASE neondb TO app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
```

Alur lengkap + penjelasan per baris: [../databases/kemampuan-dan-alur.md](../databases/kemampuan-dan-alur.md).

## 4. Alur Rotasi Password Role

```
reset_password (API) ──► dapat password baru ──► update secret store / env
        ──► deploy/restart aplikasi ──► verifikasi koneksi ──► selesai
```

Karena Neon tak bisa akses OS/superuser, `neondb_owner` + role admin via API adalah tingkat tertinggi yang tersedia — kendalikan seperti root credentials.
