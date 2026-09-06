# Kemampuan Branching & Alur — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan Neon branching dan **kode mana yang melakukan apa**, berdasarkan [branches.md](branches.md) dan indeks endpoint [../reference-api/branches/branches.md](../reference-api/branches/branches.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Endpoint / Perintah | Keterangan |
|---|---|---|
| Buat branch (copy-on-write) | `POST /projects/{id}/branches` | Isolasi penuh: perubahan tak memengaruhi parent |
| Branch dari data masa lalu | `parent_lsn` / `timestamp` di body | Dasar point-in-time restore; butuh history window |
| Branch schema-only | `POST .../branch_anonymized` atau opsi Console | Schema tanpa data — untuk tes migrasi |
| Branch data ter-anonimasi | `POST .../branches/{id}/anonymize` + masking rules | Data PII dimasking — untuk staging |
| Set branch default | `POST .../branches/{id}/set_as_default` | Default = tujuan `connection_uri` tanpa branch_id |
| Restore branch historis | `POST .../branches/{id}/restore` | Kembalikan branch ke titik waktu |
| Ganti nama / protect / expire | `PATCH .../branches/{id}` | `name`, `protected`, `expires_at` |
| Hapus branch | `DELETE .../branches/{id}` | Root branch tidak bisa dihapus |
| Bandingkan schema dua branch | `GET .../branches/{id}/compare_schema` | Cek perbedaan schema sebelum merge |
| Ambil schema SQL | `GET .../branches/{id}/schema` | Export schema branch |
| Hitung jumlah branch | `GET .../branches/count` | Cek limit plan sebelum automasi |

## 2. Alur Kerja Branching

```
main (production)
  │
  ├── buat branch per fitur ──► dev-fitur-x ──► tes di compute sendiri ──► hapus
  │
  ├── branch point-in-time ────► bencana? ──► restore data ke main
  │
  └── branch schema-only ──────► uji migrasi ──► apply ke main
```

Alur CI/CD khas: buat branch saat PR dibuka → jalankan tes/integrasi dengan connection string branch → hapus branch saat PR merge (hemat storage — branch tua mengunci data dan menaikkan biaya).

## 3. Penjelasan Kode

### 3.1 Buat branch + compute (branches.md)

```bash
curl 'https://console.neon.tech/api/v2/projects/dry-heart-13671059/branches' \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
  "endpoints": [
    { "type": "read_write" }          // (3) compute utk branch baru
  ],
  "branch": {
    "parent_id": "br-wispy-dew-591433",  // (1) sumber schema + data
    "name": "development"                // (2) nama opsional (unik per project)
  }
}'
```

| Bagian | Melakukan apa |
|---|---|
| `branch.parent_id` | Menentukan branch induk — schema & data disalin dari sini (copy-on-write, bukan duplikasi fisik) |
| `branch.name` | Nama kustom; tanpa ini nama = ID branch (`br-...`) |
| `endpoints[].type: read_write` | Membuat compute bersamaan; **tanpa ini branch ada tapi tidak bisa dikonek** |
| `-H Authorization: Bearer` | Kredensial wajib untuk SEMUA call Neon API |
| Response | `branch.id`, `endpoints[0].id` + `connection_uris` → simpan untuk koneksi aplikasi |

### 3.2 CLI equivalent

```bash
neon branches create --name mybranch
#   sub-command `branches create` → POST /projects/{id}/branches
#   default parent = default branch; --name = branch.name
```

### 3.3 Restore point-in-time (restore-project-branch.md)

```bash
curl -X POST ".../branches/{branch_id}/restore" -d '{ "source_branch_id": "...", "timestamp": "..." }'
```

- `source_branch_id` = branch sumber data historis.
- `timestamp` = titik waktu tujuan; harus di dalam history window project.
- Hasil: branch kembali ke kondisi tsb — ini juga cara "undo" migrasi gagal.

### 3.4 Schema compare

```bash
curl ".../branches/{branch_id}/compare_schema?source_branch_id=br-xxx"
```

- Membandingkan schema branch target vs source — dipakai sebelum merge/migrasi untuk memastikan tidak ada drift.

## 4. Gotchas (dari branches.md)

1. **Branch tua menambah biaya** — data terkunci melampaui history window; hapus branch yang tak terpakai (`DELETE`) atau set `expires_at`.
2. **Roles parent terduplikasi** ke child, termasuk password-nya; buat branch baru berpassword berbeda → gunakan branch protection.
3. **Nama branch unik per project**, maks 256 karakter (API) / 128 (Console).
4. **Point-in-time butuh history** — data yang lebih tua dari history window tidak bisa disalin.
5. Default auto-delete 1 hari hanya berlaku di Console; branch dari **API/CLI tidak expired otomatis** — atur `expires_at` eksplisit untuk CI/CD.
