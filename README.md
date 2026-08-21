# Luxio Project Manager

Aplikasi manajemen project & target untuk tim, dengan **frontend React** dan **backend Rust (Axum)**.

Dokumen ini adalah **panduan onboarding** — baca untuk memahami arsitektur, cara menjalankan, dan fungsi tiap bagian sebelum mengubah kode.

---

## 1. Arsitektur Singkat

```
Luxio Project Manager/
├── app/        # Frontend (React + Vite + Zustand) — UI pengguna
└── backend/    # Backend (Rust + Axum + PostgreSQL) — REST API
```

Alur data: **Browser → `app` (React) → `app/src/services/api.js` → HTTP → `backend` (Axum) → PostgreSQL**

Frontend menyimpan state global di Zustand (`app/src/store/useStore.js`). Komponen halaman tinggal membaca/memanggil action dari store — tidak menyentuh API langsung.

> ⚠️ **Status integrasi**: Auth (login/register) sudah terhubung ke backend. Fitur project/task/kanban **masih mock** (data di memori, hilang saat reload). Lihat [Roadmap](#7-roadmap) untuk langkah berikutnya.

---

## 2. Prasyarat

| Tools | Untuk | Versi disarankan |
|-------|-------|------------------|
| [Node.js](https://nodejs.org) | Frontend (Vite/React) | ≥ 18 |
| [Rust](https://rustup.rs) | Backend (Cargo) | ≥ 1.70 |
| PostgreSQL / [Neon](https://neon.tech) | Database backend | — |
| MSVC Build Tools | Compile Rust di Windows (`link.exe`) | — |

---

## 3. Cara Menjalankan

### 3.1 Backend (`backend`)

```bash
cd backend

# 1. Siapkan env (salin dulu dari contoh)
cp .env.example .env
#   lalu isi DATABASE_URL dengan koneksi Postgres kamu

# 2. Jalankan server (akan konek DB + buat tabel otomatis)
cargo run
```

Server berjalan di `http://localhost:3000`. Cek hidup: `GET http://localhost:3000/health` → `OK`.

### 3.2 Frontend (`app`)

```bash
cd app
npm install

# (opsional) set URL backend, default sudah ke localhost:3000
echo "VITE_API_URL=http://localhost:3000" > .env

# Mode pengembangan (hot reload)
npm run dev

# Build produksi (PWA)
npm run build
npm run preview
```

Frontend berjalan di `http://localhost:5173` saat `npm run dev`.

> Jalankan **backend dulu**, lalu frontend, agar login/register berfungsi.

---

## 4. Struktur Folder — Fungsi per Bagian

### 4.1 `app/` — Frontend

| Path | Fungsi |
|------|--------|
| `src/main.jsx` | Entry point. Merender `<App />` ke `#root`. |
| `src/App.jsx` | Router manual. Pilih halaman berdasarkan `appState` & `currentPage` di store. |
| `src/store/useStore.js` | State global (Zustand): auth, setup, project, task, kanban. Sumber utama state. |
| `src/services/api.js` | Klien API terpusat. Semua `fetch` ke backend lewat file ini. |
| `src/components/Layout.jsx` | Layout area 'app': sidebar, topbar, theme, logout. |
| `src/pages/` | Satu folder per halaman. Lihat tabel di bawah. |
| `src/pages/*.css` | Styling per halaman (diimpor oleh JSX terkait). |
| `vite.config.js` | Konfigurasi Vite + PWA manifest. |
| `index.html` | HTML host + load font & `main.jsx`. |

**Halaman (`src/pages/`):**

| File | Fungsi |
|------|--------|
| `Landing.jsx` | Landing page (publik). |
| `Pricing.jsx` / `FAQ.jsx` / `Checkout.jsx` | Halaman info & pembelian (publik). |
| `Auth.jsx` | Login & Register (terhubung backend). |
| `Setup.jsx` | Onboarding wizard: pilih tipe (Individual/Grup/Perusahaan/Sekolah) → alur data berbeda per tipe. |
| `Dashboard.jsx` | Ringkasan statistik & aksi cepat. |
| `Projects.jsx` / `ProjectDetail.jsx` | Kelola project/target. |
| `Kanban.jsx` | Board kanban kustom (mock). |
| `TodoList.jsx` / `MyTasks.jsx` / `Calendar.jsx` | Task & kalender (mock). |
| `Team.jsx` | Kelola anggota tim. |
| `Settings.jsx` | Pengaturan. |

### 4.2 `backend/` — Backend (Rust)

| Path | Fungsi |
|------|--------|
| `src/main.rs` | Binary `luxio-server`. Hanya memanggil `luxio_backend::run()`. |
| `src/lib.rs` | Root lib: deklarasi modul + `AppState` + fungsi `run()` (merangkai router & start server). |
| `src/models.rs` | Tipe data: model database & request/response API. |
| `src/db.rs` | Koneksi pool Postgres + migrasi pembuatan tabel. |
| `src/handlers.rs` | Implementasi semua endpoint REST + logika hash. |
| `Cargo.toml` | Dependensi & target (lib + bin). |
| `.env` / `.env.example` | Konfigurasi `DATABASE_URL` & `PORT`. |

---

## 5. Dokumentasi API

Semua endpoint mengembalikan JSON. Base URL: `http://localhost:3000`.

| Method | Path | Fungsi | Body / Query |
|--------|------|--------|--------------|
| GET | `/health` | Cek server hidup | — |
| POST | `/api/auth/register` | Daftar akun | `{ email, password, name }` |
| POST | `/api/auth/login` | Login | `{ email, password }` |
| POST | `/api/auth/me` | Data user by id | body: `"user_id"` (raw string) |
| POST | `/api/companies` | Buat perusahaan | `{ name, industry, size, user_id }` |
| GET | `/api/companies` | Daftar company by user | query: `user_id` |
| POST | `/api/divisions` | Buat divisi | `{ company_id, name, head_id? }` |
| GET | `/api/divisions` | Daftar divisi | query: `company_id` |
| POST | `/api/members` | Tambah member | `{ company_id, division_id, name, email, role }` |
| GET | `/api/members` | Daftar member | query: `company_id` |
| GET | `/api/projects` | Daftar project aktif | query: `company_id` |

> Catatan: endpoint `POST /api/auth/me`, `GET /api/companies`, dsb. memakai **body/query** untuk mengirim parameter. Ini desain awal yang bisa di-refactor ke path param (`/api/auth/me/:id`) atau header auth token di masa depan.

---

## 6. Konvensi & Standar Kode

- **Frontend**: React + JSX + Zustand. Halaman ada di `src/pages/`, style terpisah per halaman (`.css`).
- **Backend**: Rust + Axum. Tiap domain = satu fungsi handler di `handlers.rs`; tipe data di `models.rs`.
- **Pola panggilan API**: komponen **jangan** langsung `fetch`. Tambahkan method ke `api.js`, lalu panggil lewat store.
- **Komentar**: gunakan komentar header untuk menjelaskan fungsi file/modul & fungsi utama. Jangan komentar per-baris yang sudah jelas.
- **Bahasa komentar**: Bahasa Indonesia (disesuaikan tim).
- **State**: semua state aplikasi lewat `useStore` (Zustand), bukan `useState` global terpisah.

---

## 7. Roadmap

- [ ] Migrasi routing manual (`App.jsx`) → `react-router-dom` (sudah ada di dependency).
- [ ] Hubungkan project/task/kanban ke backend (saat ini mock).
- [ ] Ganti `simple_hash` (DefaultHasher) dengan **bcrypt/argon2** — keamanan produksi.
- [ ] Pindahkan pembuatan tabel dari `db.rs` ke tool migrasi (`sqlx-cli` / `refinery`).
- [ ] Tambah unit test backend (`cargo test`) & frontend (vitest).
- [ ] Token/session auth (`/api/auth/me/:id` + header token) alih-alih body user_id.

---

## 8. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `cargo check/build` gagal `could not exec the linker link.exe` | Install **MSVC Build Tools** (Visual Studio Build Tools), karena Rust perlu `link.exe`. Ini masalah lingkungan, bukan kode. |
| `DATABASE_URL must be set` | Pastikan `.env` di `backend/` ada dan berisi `DATABASE_URL`. |
| Login gagal saat dev | Pastikan backend sudah jalan (port 3000) sebelum frontend. |
| Data project hilang setelah reload | Normal — fitur project masih mock, lihat [Roadmap](#7-roadmap). |
