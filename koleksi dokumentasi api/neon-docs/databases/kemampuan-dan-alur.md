# Kemampuan Database & Akses — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan database Neon dan **kode mana yang melakukan apa**, berdasarkan [databases.md](databases.md) dan [database-access.md](database-access.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Metode | Keterangan |
|---|---|---|
| Buat/hapus database per branch | `POST/DELETE .../branches/{id}/databases` | Maks 500 database per branch |
| Ganti owner database | `PATCH .../databases/{name}` | Field `owner_name` |
| Buat role berbatas akses (least privilege) | SQL `CREATE ROLE` | Role via SQL TIDAK dapat neon_superuser |
| Beri akses read-only / read-write | SQL `GRANT` | Model role → user |
| Batasi akses public schema | SQL `REVOKE CREATE ON SCHEMA public` | Beda perilaku Postgres 14 vs 15+ |
| Query data | SQL Editor / psql / driver apa pun | Semua via compute branch |

## 2. Alur Akses Least-Privilege

```
neondb_owner (admin)
   │ CREATE ROLE readonly / readwrite      ← role "grup" hak akses
   │ GRANT SELECT ... TO readonly
   │ GRANT SELECT,INSERT,UPDATE,DELETE ... TO readwrite
   │
   ├── CREATE USER readonly_user1 ──► GRANT readonly TO readonly_user1
   └── CREATE USER readwrite_user1 ─► GRANT readwrite TO readwrite_user1
```

Prinsip: beri hak ke **role (grup)**, lalu jadikan user anggota role — perubahan hak cukup satu tempat.

## 3. Penjelasan Kode

### 3.1 Buat role + user (database-access.md)

```sql
CREATE ROLE readonly;              -- (1) role grup: bukan login, hanya wadah hak
CREATE USER readonly_user1         -- (2) user nyata yang bisa login
  WITH PASSWORD 'password-anda';
GRANT readonly TO readonly_user1;  -- (3) user mewarisi semua hak role readonly
```

- `CREATE ROLE` tanpa `LOGIN` = grup; `CREATE USER` = role dengan `LOGIN`.
- `(3)` adalah anggota-kan: `readonly_user1` sekarang punya apa pun yang diberikan ke `readonly`.

### 3.2 Grant hak per level

```sql
GRANT CONNECT ON DATABASE neondb TO readonly;                  -- (1) level database
GRANT USAGE ON SCHEMA public TO readonly;                      -- (2) level schema (masuk + lihat definisi)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;       -- (3) baca semua tabel yang ADA
ALTER DEFAULT PRIVILEGES IN SCHEMA public                      -- (4) tabel MASA DEPAN juga otomatis
  GRANT SELECT ON TABLES TO readonly;
```

| Baris | Melakukan apa |
|---|---|
| (1) | Izin membuka koneksi ke database |
| (2) | Izin mengakses isi schema |
| (3) | Hak SELECT pada tabel yang sudah ada |
| (4) | Kunci penting: tabel baru hasil migrasi otomatis ter-GRANT — tanpa ini user baru kehilangan akses tabel baru |

Versi read-write: sama, tetapi `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES` + `USAGE` pada sequences.

### 3.3 Read-write role (pola lengkap)

```sql
CREATE ROLE readwrite;
CREATE USER readwrite_user1 WITH PASSWORD 'password-anda';
GRANT readwrite TO readwrite_user1;
GRANT CONNECT ON DATABASE neondb TO readwrite;
GRANT USAGE ON SCHEMA public TO readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO readwrite;  -- untuk serial/auto-increment
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;
```

- `ALL SEQUENCES` wajib untuk tabel dengan kolom auto-increment (`INSERT` membaca nextval).

### 3.4 Batasi public schema

```sql
-- Postgres 15+: REVOKE CREATE dari PUBLIC agar user biasa tidak bisa buat objek
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

Postgres 14 memerlukan langkah lebih lanjut (REVOKE ALL + re-GRANT USAGE) — detail versi ada di [database-access.md](database-access.md).

## 4. Kapan Console/API vs SQL

| Kebutuhan | Cara |
|---|---|
| Role berhak penuh (admin/dev) | Console / API / CLI → otomatis `neon_superuser` (lihat [../roles/kemampuan-dan-alur.md](../roles/kemampuan-dan-alur.md)) |
| Role berbatas akses (app user, readonly) | **SQL** seperti di atas |
| Buat database baru | `POST .../branches/{id}/databases` (API) atau Console |
| Owner database | `neondb_owner` atau role kustom yang dipilih saat `PATCH` |
