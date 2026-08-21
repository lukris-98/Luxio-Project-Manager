# ARCHITECTURE.md — Arsitektur Luxio

Ringkasan arsitektur untuk developer/karyawan baru. Detail lengkap ada di
[`README.md`](./README.md), [`SPEC.md`](./SPEC.md), dan
[`WIREFRAME.md`](./WIREFRAME.md).

## Gambaran umum

```
Browser
   │  (React SPA, PWA)
   ▼
app/src/services/api.js   ← satu-satunya pintu fetch ke backend
   │  Authorization: Bearer <token>
   ▼
backend (Rust + Axum)     ← REST API, semua security boundary di sini
   │  sqlx (parameterized query)
   ▼
Neon PostgreSQL
```

## Lapisan & tanggung jawab

### Frontend (`app/`)

| Layer | Lokasi | Tanggung jawab |
|-------|--------|----------------|
| Entry point | `src/main.jsx` | Render `<App />` ke `#root` |
| Routing | `src/App.jsx` | Pilih halaman berdasarkan `appState`/`currentPage` di store (manual, belum react-router) |
| State global | `src/store/useStore.js` | Zustand + persist; semua state aplikasi lewat sini |
| API client | `src/services/api.js` | `fetch` terpusat + header token |
| Komponen | `src/components/` | Komponen UI reusable (Layout, form, kanban, dll) |
| Halaman | `src/pages/` | Satu folder per halaman (Landing, Dashboard, …) |

### Backend (`backend/`)

| Layer | Lokasi | Tanggung jawab |
|-------|--------|----------------|
| Binary | `src/main.rs` | Panggil `luxio_backend::run()` |
| Root/router | `src/lib.rs` | Rakit router, CORS, security headers, body limit, jalankan server |
| Models | `src/models.rs` | Tipe database + request/response |
| Database | `src/db.rs` | Pool koneksi + migrasi tabel (users, companies, divisions, members, projects, stages, checklist_items, sessions, audit_logs, idempotency_keys) |
| Handlers | `src/handlers.rs` | Implementasi endpoint, hashing Argon2id, session token, validasi, rate limit, authorization |
| Tools | `src/tools.rs` | **Action layer**: registri tool + schema, risk level, validasi, ownership, audit log, idempotency |

## Lapisan Action / Tools (AI Agent)

UI manusia dan AI Agent memakai **business logic backend yang sama**
melalui tool resmi (lihat `ai-agent-security-architecture.md`):

```
UI / Agent
    ↓
POST /api/tools/execute  { tool, args, confirm?, idempotency_key?, actor_type? }
    ↓
Auth (token) → Risk check (medium/high wajib confirm)
    ↓
Validasi → Authorization (ownership) → Business logic
    ↓
Audit log (audit_logs) → Idempotency (opsional) → Neon DB
```

- Daftar tool + schema: `GET /api/tools` (kontrak untuk agent).
- Agent **tidak** punya akses SQL langsung; hanya bisa menjalankan tool
  yang terdaftar di `tools.rs`.
- Tool berisiko medium/high (contoh `delete_target`) menolak eksekusi
  tanpa `confirm: true`.
- Setiap aksi dicatat ke `audit_logs` (actor_type, user_id, tool,
  target_resource, result, timestamp).
- `idempotency_key` mencegah eksekusi ganda pada request yang sama.

## Alur autentikasi (session token)

1. `POST /api/auth/login` (atau `/register`) → backend memverifikasi kredensial.
2. Backend membuat token acak (UUID v4), menyimpan **SHA-256 hash** token
   di tabel `sessions`, mengembalikan token mentah ke client.
3. Client menyimpan token di `localStorage` (`luxio-token`) dan mengirimnya
   pada header `Authorization: Bearer <token>` di setiap request.
4. Setiap endpoint memvalidasi token (hash-nya dicari di `sessions`),
   lalu menggunakan `user_id` dari sesi — **bukan** dari body/query —
   sebagai identitas. Sesi kedaluwarsa 7 hari.
5. `POST /api/auth/logout` menghapus sesi.

Alasan desain: memutus pola lama yang memakai `user_id` dari body/query
yang bisa dipalsukan siapa pun (IDOR). Token mentah tidak pernah disimpan
di database, sehingga kebocoran DB tidak mem-bypass autentikasi.

## Alur data setup

1. Login/register → user diarahkan ke wizard Setup (`Setup.jsx`).
2. Wizard menyimpan `companyInfo`, `divisions`, `members` di store.
3. `completeSetup` (store) menyinkronkan ke backend via `api.createCompany`
   → `createDivision` → `createMember` (identitas dari token).
4. Selesai → dashboard. Bila backend offline, aplikasi tetap berjalan
   dalam demo mode (data lokal) agar pengembangan tidak terblokir.

## Konvensi

- Frontend: React + JSX + Zustand; halaman di `src/pages/`; style `.css` per halaman.
- Backend: Rust + Axum; tiap domain satu handler di `handlers.rs`; tipe di `models.rs`.
- Komponen **tidak** boleh `fetch` langsung — tambahkan method di `api.js`, panggil lewat store.
- Komentar header untuk file/modul; jangan komentar per-baris yang sudah jelas.
- Bahasa komentar: Indonesia.
- Keamanan: lihat [`SECURITY.md`](./SECURITY.md).
