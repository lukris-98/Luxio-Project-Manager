# Kemampuan Overview & Alur Hierarki — Penjelasan

File ini menjelaskan **apa yang bisa dipahami dan dilakukan** dari dokumen [overview.md](overview.md) dan [platform.md](platform.md), serta **alur kerja** yang mengikuti hierarki objek Neon.

---

## 1. Kemampuan yang Dicakup

| Kemampuan | Di mana dijelaskan |
|---|---|
| Memahami struktur `Organisasi → Project → Branch → Compute/Role/Database` | [overview.md](overview.md) |
| Mengetahui objek mana yang dibuat otomatis saat project dibuat | [overview.md](overview.md) |
| Memahami batasan plan (jumlah project/branch, ukuran data, compute) | [platform.md](platform.md) |
| Menentukan scoping API key (account-scoped vs org-scoped) | [overview.md](overview.md) |

## 2. Alur Hierarki & Objek Otomatis

```
Akun Neon (identitas + personal API key)
   │ miliki / anggota dari
   ▼
Organisasi (billing + role tim)
   │ berisi
   ▼
Project (region + pg_version dipilih di sini)
   │ berisi
   ▼
Branch root "main"/"production"   ← TIDAK BISA dihapus
   │ berisi
   ├── Compute R/W (primary)      ← WAJIB untuk koneksi
   ├── Role  neondb_owner         ← owner database
   └── Database neondb            ← berisi schema public
   │
   └── Branch anak (copy-on-write) ── compute + roles + databases miliknya
```

**Apa yang terjadi otomatis saat `POST /projects`** (kode di [../reference-api/projects/create-project.md](../reference-api/projects/create-project.md)):

1. Branch root dibuat — bernama `main` (API/CLI) atau `production` (Console).
2. Database `neondb` dibuat (kecuali nama kustom diberikan).
3. Role `neondb_owner` dibuat + diberi `neon_superuser`.
4. Compute read/write primary dibuat.
5. Response memuat `connection_uris` — langsung bisa dipakai aplikasi.

## 3. Implikasi Praktis dari Hierarki

| Konsep | Konsekuensi kode |
|---|---|
| API key global per akun/org | Satu key dipakai untuk SEMUA project milik scope itu; endpoint selalu menyertakan `project_id` di path |
| Root branch tak terhapus | Endpoint `DELETE /branches/{id}` hanya untuk branch anak |
| Role milik branch | Saat membuat branch, roles parent **terduplikasi** ke branch anak (kecuali branch point-in-time sebelum role dibuat) |
| Compute milik branch | Koneksi database selalu melalui compute: `ep-xxx` di host connection string |
| Limit per level | Cek plan sebelum automasi massal (mis. loop buat 100 branch per PR akan mentok limit) |

## 4. Alur Membaca Dokumentasi Neon

```
overview.md (struktur) ──► platform.md (batasan plan)
        │
        ▼
pilih objek yang dikelola:
projects/ → branches/ → computes/ → roles/ → databases/
        │
        ▼
butuh automasi? ──► reference-api/ (endpoint) ── permissions/ (API key)
```

File per objek ada di folder induk ([../kemampuan-dan-alur.md](../kemampuan-dan-alur.md)) — setiap folder memuat `kemampuan-dan-alur.md` dengan penjelasan kode.
