<div align="center">

# 🚀 Luxio — Project & Target Manager

**Satu platform untuk mengelola project, tim, absensi, hingga gaji karyawan.**

[![Release](https://img.shields.io/github/v/release/lukris-98/Luxio-Project-Manager?style=for-the-badge&logo=github&color=2ea44f)](https://github.com/lukris-98/Luxio-Project-Manager/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/lukris-98/Luxio-Project-Manager/ci.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI&color=4C8EDA)](https://github.com/lukris-98/Luxio-Project-Manager/actions)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

---

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](#)
[![Zustand](https://img.shields.io/badge/Zustand-State-433E38?logo=react)](#)
[![Rust](https://img.shields.io/badge/Rust-Axum-orange?logo=rust&logoColor=white)](#)
[![SQLx](https://img.shields.io/badge/SQLx-ORM-336791?logo=rust&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](#)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa&logoColor=white)](#)
[![SMTP](https://img.shields.io/badge/Email-SMTP-1DA1F2?logo=gmail&logoColor=white)](#)

</div>

---

## 📖 Tentang

**Luxio** adalah aplikasi manajemen **project & target** untuk tim — dari perencanaan,
kolaborasi, absensi dengan GPS & selfie, hingga **kalkulasi gaji bulanan** — dalam
satu platform. Cocok untuk perusahaan, sekolah, yayasan, maupun komunitas.

| | |
|---|---|
| 🎨 **Frontend** | React 18 + Vite 7 + Zustand + Framer Motion + PWA |
| ⚙️ **Backend** | Rust + Axum + SQLx (query terparameterisasi, Argon2id) |
| 🗄️ **Database** | PostgreSQL (siap Neon Serverless) |
| 📊 **Integrasi** | Umami Analytics, Neon, Backblaze B2, SMTP |

---

## ✨ Fitur Utama

| Kategori | Fitur |
|----------|-------|
| 🗂️ **Manajemen** | Project & target, task, kanban board, kalender, catatan pribadi + PIN |
| 👥 **Tim** | Divisi, tim, kewenangan per anggota (6 level), chat antar anggota + grup otomatis per divisi/perusahaan |
| 🔐 **Keamanan** | Autentikasi Argon2id, **2FA via email**, verifikasi email aktivasi, PIN, audit log |
| 🤖 **AI** | AI Agent via **tool/action layer** (tanpa akses DB langsung, terotentikasi + idempotency) |
| 📸 **Absensi** | Absen masuk/pulang dengan **kamera live & upload**, **GPS + peta interaktif**, rekap admin per tim |
| 💰 **Gaji** | Kalkulasi gaji bulanan (kehadiran + **insentif**), preview rincian, **cetak PDF** |
| 👑 **Owner** | Analytics (Umami), monitoring Neon, storage Backblaze B2, log aktivitas seluruh sistem |
| 💬 **Chat** | Chat gaya BBM (kode user, pertemanan), monitoring admin untuk keamanan data |

---

## 🚀 Quick Start

### 1. Backend (Rust + Axum)

```bash
cd backend
cp .env.example .env        # isi DATABASE_URL (Postgres / Neon)
cargo run                   # http://localhost:3000
```

Cek hidup: `GET http://localhost:3000/health` → `OK`

### 2. Frontend (React + Vite)

```bash
cd app
npm install
npm run dev                 # http://localhost:5173
```

> Jalankan **backend dulu**, lalu frontend, agar login/register berfungsi.

---

## 📸 Screenshot

> Tambahkan tangkapan layar di folder `app/public/screenshots/` lalu masukkan di sini.
>
> ```
> app/public/screenshots/
> ├── dashboard.png
> ├── absensi.png
> └── owner-dashboard.png
> ```

---

## 📚 Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [CHANGELOG.md](./CHANGELOG.md) | Riwayat versi & rilis |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem & alur data |
| [SECURITY.md](./SECURITY.md) | Kebijakan & praktik keamanan |
| [SPEC.md](./SPEC.md) | Spesifikasi fitur & API |
| [WIREFRAME.md](./WIREFRAME.md) | Wireframe antarmuka |
| [saran_pricing.md](./saran_pricing.md) | Strategi & saran pricing |

---

## 🏷️ Versi & Rilis

Proyek ini menggunakan **Git tag + GitHub Releases** untuk menjaga riwayat versi.
Setiap rilis baru tetap menyimpan versi sebelumnya — Anda bisa mengunduh dan
menjelajah semua versi lama di halaman **Releases**.

| Versi | Rilis |
|-------|-------|
| **v1.0.0** — Rilis pertama | [Lihat rilis](https://github.com/lukris-98/Luxio-Project-Manager/releases/tag/v1.0.0) |

> Semua tag: [`git tag`](https://github.com/lukris-98/Luxio-Project-Manager/tags) ·
> Daftar rilis: [Releases](https://github.com/lukris-98/Luxio-Project-Manager/releases)

---

## 🧱 Struktur Project

```
Luxio Project Manager/
├── app/          # Frontend (React + Vite + Zustand) — PWA
│   └── src/
│       ├── components/   # Komponen UI reusable
│       ├── pages/        # Halaman (Dashboard, Tim, Chat, Absensi, ...)
│       ├── services/     # API client (api.js)
│       ├── store/        # Zustand global store
│       └── utils/        # Utilitas (permission, analytics)
├── backend/      # Backend (Rust + Axum + PostgreSQL)
│   └── src/
│       ├── handlers.rs   # Endpoint REST
│       ├── tools.rs      # Tool/action layer (AI Agent)
│       ├── owner.rs      # Dashboard owner (analytics, db, storage, gaji)
│       ├── mail.rs       # Pengiriman email (SMTP)
│       ├── db.rs         # Koneksi & migrasi tabel
│       └── models.rs     # Tipe data
└── *.md          # Dokumentasi (README, ARCHITECTURE, SECURITY, ...)
```

---

## 📜 Lisensi

**Proprietary** — © 2026 Luxio. Hak cipta dilindungi undang-undang.
Dilarang menggandakan atau mendistribusikan tanpa izin tertulis.
