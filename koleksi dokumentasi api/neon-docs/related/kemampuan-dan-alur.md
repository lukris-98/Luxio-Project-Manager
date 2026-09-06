# Kemampuan Topik Terkait (Multitenancy & Tables) — Penjelasan Kode

File ini merangkum **apa yang bisa dilakukan** dengan pola arsitektur di [multitenancy.md](multitenancy.md) dan [tables.md](tables.md), serta **kode mana yang melakukan apa**.

---

## 1. Daftar Kemampuan

| Kemampuan | Sumber |
|---|---|
| Memilih arsitektur multitenant Postgres yang tepat | [multitenancy.md](multitenancy.md) |
| Provision database/project per tenant otomatis via API | [multitenancy.md](multitenancy.md) |
| Merancang catalog database (daftar tenant) | [multitenancy.md](multitenancy.md) |
| Migrasi schema lintas project terotomasi (Drizzle + GitHub Actions) | [multitenancy.md](multitenancy.md) |
| Backup tenant terjadwal ke S3 | [multitenancy.md](multitenancy.md) |
| Desain tabel Postgres yang baik | [tables.md](tables.md) |

## 2. Tiga Arsitektur Multitenant

| Arsitektur | Isolasi | Biaya | Kapan dipilih |
|---|---|---|---|
| Database-per-user (project-per-user Neon) | Maksimum (setara instance) | Tertinggi | SaaS yang butuh isolasi penuh, compliance, PITR per tenant |
| Schema-per-user | Sedang | Sedang | Tenant sedikit–menengah, schema sama |
| Shared schema | Minimal | Terendah | Banyak tenant kecil, RLS untuk pisahkan data |

Neon unggul di opsi pertama: provisioning project via API hampir instan tanpa DevOps instance-per-instance.

## 3. Alur Database-Per-User (pola inti)

```
User signup (aplikasi)
   │
   ├── (1) buat record di CATALOG database (project khusus milik aplikasi)
   │        table tenants: id, neon_project_id, status
   │
   ├── (2) POST /projects  →  project Neon baru per tenant
   │        simpan project.id + connection_uri ke catalog
   │
   ├── (3) jalankan migrasi schema ke project tsb
   │
   └── (4) aplikasi membaca connection string tenant dari catalog saat request
```

## 4. Penjelasan Kode Provisioning

```js
// (1) buat project Neon untuk tenant baru
const res = await fetch("https://console.neon.tech/api/v2/projects", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.NEON_API_KEY}`, // (2) kunci org/personal key
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    project: { name: `tenant-${userId}` },   // (3) nama = identifikasi tenant
  }),
});
const data = await res.json();

// (4) simpan ke catalog: project.id + connection string
await catalog.insert({
  userId,
  neonProjectId: data.project.id,
  connectionUri: data.project.connection_uris?.[0]?.connection_uri,
});
```

| Bagian | Melakukan apa |
|---|---|
| `POST /projects` | Provisioning instan: branch main + neondb + role + compute otomatis |
| `name: tenant-${userId}` | Pemetaan nama ↔ tenant untuk audit di Console |
| `connection_uris` dari response | Disimpan di catalog — aplikasi tidak hardcode koneksi tenant |
| Catalog database | Satu project Neon khusus aplikasi menyimpan pemetaan user → project |

Hapus tenant: `DELETE /projects/{id}` (dengan recovery window — aman bila user berubah pikiran).

## 5. Alur Migrasi Lintas Tenant (Drizzle + GitHub Actions)

```
ubah schema di repo ──► commit & push
        │
GitHub Actions: loop semua project_id di catalog
        │        ──► drizzle-kit push/migrate ke connection_uri masing-masing
        ▼
semua tenant schema sinkron ──► log hasil per tenant (gagal = alert)
```

Pola ini menggantikan "migrasi satu database" menjadi "migrasi N database" — kodenya hanya loop di atas catalog.

## 6. Tables (tables.md)

[tables.md](tables.md) melengkapi fondasi tenant mana pun: desain kolom, tipe data, primary key, index, dan pola umum tabel Postgres — dipakai sebagai referensi saat menulis migrasi schema yang dijalankan ke semua tenant.
