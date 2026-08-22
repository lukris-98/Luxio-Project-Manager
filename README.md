# Luxio — Project & Target Manager 🚀

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-Axum-orange?logo=rust&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa&logoColor=white)

Aplikasi manajemen **project & target** untuk tim — dari perencanaan, kolaborasi,
absensi, hingga kalkulasi gaji bulanan — dalam satu platform. Frontend dibangun
dengan **React + Vite + PWA**, backend dengan **Rust (Axum)**, dan database
**PostgreSQL** (siap untuk Neon Serverless).

---

## 📸 Screenshot

> _Tambahkan tangkapan layar aplikasi di sini._
>
> ```
> app/public/screenshots/
> ├── dashboard.png
> ├── absensi.png
> └── owner-dashboard.png
> ```

---

## ✨ Fitur

| Kategori | Fitur |
|----------|-------|
| 🗂️ Manajemen | Project & target, task, kanban board, kalender, catatan pribadi + PIN |
| 👥 Tim | Divisi, tim, kewenangan per anggota, chat antar anggota + grup otomatis |
| 🔐 Keamanan | Autentikasi Argon2id, 2FA, PIN, verifikasi email, audit log aktivitas |
| 🤖 AI | AI Agent via tool layer, eksekusi terotentikasi + idempotency |
| 📸 Absensi | Absen masuk/pulang dengan kamera live & GPS, peta lokasi, rekap admin |
| 💰 Gaji | Kalkulasi gaji bulanan (kehadiran + insentif), preview rincian, cetak PDF |
| 👑 Owner | Analytics (Umami), monitoring Neon, storage Backblaze B2, log sistem |

---

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | React 18, Vite, Zustand, Framer Motion, PWA (vite-plugin-pwa) |
| Backend | Rust, Axum, SQLx |
| Database | PostgreSQL (Neon Serverless ready) |
| Integrasi | Umami Analytics, Neon, Backblaze B2 |

---

## 🚀 Quick Start

```bash
# 1. Backend (Rust + Axum)
cd backend
cp .env.example .env   # isi DATABASE_URL
cargo run              # http://localhost:3000

# 2. Frontend (React + Vite)
cd app
npm install
npm run dev            # http://localhost:5173

# Build produksi (PWA)
npm run build
```

---

## 📚 Dokumentasi Lengkap

| Dokumen | Isi |
|---------|-----|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arsitektur sistem & alur data |
| [SECURITY.md](./SECURITY.md) | Kebijakan & praktik keamanan |
| [SPEC.md](./SPEC.md) | Spesifikasi fitur & API |
| [WIREFRAME.md](./WIREFRAME.md) | Wireframe antarmuka |
| [saran_pricing.md](./saran_pricing.md) | Strategi & saran pricing |

---

## 📄 Lisensi

Proprietary — © 2026 Luxio. Hak cipta dilindungi undang-undang.
