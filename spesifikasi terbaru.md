# SPESIFIKASI TERBARU — LUXIO PROJECT & TARGET MANAGER

> Dokumen spesifikasi lengkap: arsitektur, stack, alur pengembangan, fitur, alur berpikir,
> bahasa pemrograman, penilaian aplikasi PWA, keuntungan & kekurangan, serta rekomendasi
> pengembangan selanjutnya.

**Versi dokumen:** 1.0
**Tanggal:** 27 Agustus 2026
**Repositori:** https://github.com/lukris-98/Luxio-Project-Manager
**Live frontend:** https://luxio.edgeone.cool
**Backend (API):** https://lukris-98-luxio-backend.hf.space

---

## 1. RINGKASAN

Luxio adalah **Project & Target Manager** berbasis **PWA (Progressive Web App)** yang
membantu individu maupun tim mengelola target, project, task, kanban, todo-list, catatan
pribadi, brankas kredensial, kalender, absensi, chat, dan penilaian kinerja — dalam satu
aplikasi yang bisa di-install di PC/laptop maupun HP.

Aplikasi berjalan **hybrid**:
- Data personal (catatan, brankas, alarm, riset, gamifikasi) disimpan **lokal** (localStorage via Zustand persist) dan dipisah per mode akun.
- Data akun/backend (auth, profil, notifikasi, chat, AI agent, owner) disinkronkan ke **PostgreSQL (Neon)** lewat REST API Rust (Axum).

---

## 2. ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────────────────┐
│                         KLIEN (PWA)                              │
│  React 18 + Vite 7  →  SPA  →  di-install di PC / HP / tablet   │
│                                                                 │
│  • Zustand (state global + persist localStorage)                 │
│  • Service Worker (PWA, notifikasi native)                       │
│  • UI: framer-motion, lucide-react, CSS custom properties        │
└───────────────┬─────────────────────────────────────────────────┘
                │  HTTPS
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TENANT EDGEONE (CDN)                        │
│  Hosting frontend statis (dist/) + edge caching                  │
│  URL: luxio.edgeone.cool                                         │
└───────────────┬─────────────────────────────────────────────────┘
                │  REST API (JSON)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│               BACKEND API — RUST (AXUM)                          │
│  Hosting: HuggingFace Space (Docker)                             │
│  • Auth: email/password, 2FA, PIN, konfirmasi email              │
│  • Notifikasi server, chat, AI agent, owner                      │
└───────────────┬─────────────────────────────────────────────────┘
                │  sqlx (async)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│               POSTGRESQL — NEON (serverless)                     │
│  Tabel: users, companies, divisions, members, notifications,     │
│         conversations, messages, attendance, dll.                │
└─────────────────────────────────────────────────────────────────┘
```

**Alur data:**
1. Akses utama melalui PWA (React SPA).
2. Data personal per-user/per-mode → localStorage (Zustand persist).
3. Data yang butuh backend (akun, notif server, chat, AI) → API REST Rust.
4. Deployment frontend via `edgeone makers deploy app/dist`.
5. Deployment backend via HuggingFace Space yang men-clone repo dari GitHub.

---

## 3. STACK TEKNOLOGI

### 3.1 Frontend (`app/`)
| Teknologi | Versi | Fungsi |
|---|---|---|
| React | 18.3 | Library UI (SPA) |
| Vite | 7.3 | Bundler + dev server |
| Zustand | 5.0 | State global + persist localStorage |
| React Router | (belum dipakai) | Migrasi routing manual → react-router (roadmap) |
| framer-motion | 13.1 | Animasi UI |
| lucide-react | 0.460 | Ikon |
| DOMPurify | 3.4 | Sanitasi HTML (anti-XSS) |
| vite-plugin-pwa | 1.3 | PWA + Service Worker + manifest |
| jspdf | 4.2 | Ekspor laporan PDF |
| html2canvas | — | Tangkapan layar untuk ekspor |

### 3.2 Backend (`backend/`)
| Teknologi | Versi | Fungsi |
|---|---|---|
| Rust | 1.88 | Bahasa backend |
| Axum | 0.7 | Web framework |
| Tokio | 1 | Runtime async |
| SQLx | 0.8 | ORM/query async PostgreSQL |
| chrono | 0.4 | Waktu & tanggal |
| uuid | 1 | ID unik |
| argon2 | 0.5 | Hash password |
| sha2 | 0.10 | Hash tambahan (2FA/token) |
| lettre | 0.11 | Kirim email (SMTP) |
| reqwest | 0.12 | HTTP client (AI provider, dll) |
| tower / tower-http | 0.4/0.5 | Middleware (CORS, limit, trace) |

### 3.3 Infrastruktur
| Komponen | Penyedia |
|---|---|
| Frontend hosting | Tencent EdgeOne (`luxio.edgeone.cool`) |
| Backend hosting | HuggingFace Space (Docker) |
| Database | Neon (PostgreSQL serverless) |
| Penyimpanan objek (foto profil/absensi) | Backblaze B2 |
| Analytics | Umami |

### 3.4 Versi State (migrasi persist)
- `version: 5` — migrasi berjenjang untuk menjaga data lama saat struktur state berubah
  (v1 → v2 → v3 → v4 → v5), termasuk pemisahan data per mode akun owner.

---

## 4. STRUKTUR PROYEK

```
Luxio Project Manager/
├── app/                      # Frontend React (PWA)
│   ├── public/               # Aset statis (logo, ikon PWA, favicon)
│   ├── src/
│   │   ├── components/       # Layout, Logo, Modal, ReminderWatcher, dll
│   │   ├── pages/            # Dashboard, Projects, Kanban, Todo, PrivateNote,
│   │   │                     # Vault, Calendar, Team, Settings, Chat, Agent,
│   │   │                     # Games, AlarmTimer, Research, Performance, dll
│   │   ├── store/useStore.js # Zustand: state + actions + migrasi persist
│   │   ├── services/api.js   # Klien REST API backend
│   │   ├── utils/            # notify, modalFocus, useAutoHideNav, dll
│   │   ├── hooks/            # useInstallPrompt, dll
│   │   ├── App.jsx           # Router manual (switch halaman)
│   │   └── index.css         # Design system (CSS variables tema)
│   ├── vite.config.js        # Build + PWA manifest
│   └── index.html
├── backend/                  # Backend Rust (Axum)
│   ├── src/                  # main, lib, handlers, models, db, mail,
│   │                         # owner, tools, ai_providers
│   ├── Cargo.toml
│   └── .env.example
├── luxio-hf-3file/           # Konfigurasi HF Space backend (3 file)
├── .edgeone/                 # Konfigurasi CLI deploy EdgeOne
├── rekomendasi_fitur.md      # Rekomendasi fitur gratis vs berbayar
└── spesifikasi terbaru.md    # Dokumen ini
```

---

## 5. FITUR-FITUR

### 5.1 Halaman Publik
- **Landing** — hero, fitur, harga, FAQ, footer; tema terang/gelap; tombol login & CTA di dalam menu titik tiga di HP.
- **Pricing / FAQ / Checkout** — paket Personal, Profesional, Grup, Organisasi.
- **Auth / Setup** — login, register, 2FA, konfirmasi email, setup perusahaan/divisi.

### 5.2 Area Aplikasi (setelah login)
| Fitur | Halaman | Detail |
|---|---|---|
| Dashboard | `dashboard` | Ringkasan statistik |
| Target / Project | `projects` | CRUD target (visi), viewType todo/kanban |
| Kanban | `kanban` | Board kolom + drag task, kolaborator |
| Todo | `todo-list` | Task list + label/theme |
| Catatan Pribadi | `private-note` | Rich text + PIN per catatan |
| Brankas | `vault` | Kredensial (sosmed, wifi, dll) + PIN utama & per-entri |
| Kalender | `calendar` | Lihat task per tanggal |
| Task Saya | `my-tasks` | Task pribadi |
| Divisi / Tim | `team` | Kelola anggota & divisi |
| Chat | `chat` | Chat antar anggota + grup otomatis |
| AI Agent | `agent` | Asisten AI (owner/super_admin) |
| Absen | `attendance` | Check-in GPS + selfie |
| Dashboard Absen | `attendance-admin` | Rekap absensi (admin ke atas) |
| Kirim Notifikasi | `send-notification` | Notif ke bawahan |
| Kelola Akun | `admin-users` | Manajemen user (owner) |
| Pemantauan | `owner-dashboard` | Analytics, database, log (owner) |
| Riset Konten | `research` | Manajemen topik & ide konten |
| Alarm & Timer | `alarm-timer` | Alarm, countdown timer, stopwatch |
| Game Mode | `games` | Level, XP, badge, quest |
| Penilaian Kinerja | `performance` | Rating 1–5 anggota (admin/super_admin/owner) |

### 5.3 Fitur Lintas
- **Tema terang/gelap** (dark/light) untuk seluruh aplikasi.
- **Notifikasi** — panel (in-app), toast (klik → pindah halaman), & sistem (klik → pindah halaman).
- **PWA installable** di PC & HP.
- **PIN** — PIN akun, PIN catatan, PIN brankas (utama & per-entri).
- **Gamifikasi** — XP otomatis dari aktivitas (task, target, catatan) + badge.
- **Mode 4 akun owner** — data personal dipisah per role (owner/super_admin/admin/user).

---

## 6. ALUR PENGEMBANGAN

### 6.1 Alur lokal
1. `npm install` di `app/`
2. `npm run dev` → dev server Vite
3. Ubah kode → hot reload
4. `npm run build` → hasil di `app/dist/`

### 6.2 Alur deploy frontend (EdgeOne)
```
npm run build
edgeone makers deploy app/dist        # upload dist → Production
```

### 6.3 Alur deploy backend (HuggingFace)
1. Push kode backend ke GitHub (branch `master`).
2. HF Space men-clone otomatis (lewat `luxio-hf-3file/Dockerfile`).
3. Naikkan `ARG CACHE_BUST` bila ingin memaksa clone ulang (bukan cache).
4. Set environment variables di HF Space: `DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `ALLOWED_ORIGIN`, `APP_URL`, SMTP, dll.

### 6.4 Siklus rilis
- Fitur → implementasi halaman + store → build → verifikasi → deploy → verifikasi live.

---

## 7. ALUR BERPIKIR / DESAIN LOGIKA

### 7.1 Routing (tanpa react-router)
- `App.jsx` membaca `appState` + `currentPage` dari Zustand lalu merender halaman via `switch`.
- `appState`: `landing | pricing | faq | checkout | auth | setup | app`.
- `currentPage`: nama halaman dalam area aplikasi.

### 7.2 State global (Zustand persist)
- Semua state disimpan di `useStore.js` dan dipersist ke localStorage.
- Setiap aksi memakai `set()` / `get()`; helper `modeUid()` untuk kunci data per mode akun.
- Migrasi berjenjang menjaga kompatibilitas data lama.

### 7.3 Pemisahan data per mode akun owner
- `dataKeyFor(user, activeRole)` menghasilkan kunci `id:role` untuk owner.
- Data personal (`privateNotes`, `vault`, `alarms`, `researchTopics`, `gamification`, `vaultSettings`) dipisah per kunci → tidak saling campur antar mode.

### 7.4 Notifikasi terarah (Facebook-like)
- Setiap notifikasi menyimpan `page` + `params`.
- Panel: klik item → `handleNotifClickItem` → navigasi sesuai `page` (project-detail/kanban/chat/dll).
- Toast: seluruh kartu dapat diklik → navigasi yang sama.
- Notifikasi sistem: klik → event `luxio:notif-click` → navigasi.

### 7.5 Modal & fokus
- Utilitas `modalFocus` (MutationObserver) otomatis mem-fokus elemen interaktif pertama di modal saat muncul.
- Navbar auto-hide saat scroll ke bawah, muncul saat scroll ke atas (hook `useAutoHideNav`).

### 7.6 Keamanan
- Sanitasi HTML (DOMPurify) untuk konten user-generated.
- PIN (argon2 di backend) untuk catatan/brankas.
- 2FA, konfirmasi email.
- PIN verifikasi penghapusan (opsional).

---

## 8. BAHASA PEMROGRAMAN

| Bahasa | Pemakaian |
|---|---|
| **JavaScript (ES2022+)** | Frontend React (SPA), logika UI |
| **JSX** | Markup komponen React |
| **CSS (custom properties)** | Styling + tema (dark/light) |
| **Rust** | Backend API (Axum), performa tinggi & aman |
| **SQL** | Query PostgreSQL (via SQLx) |
| **JSON** | Pertukaran data API & persist |
| **HTML** | Shell aplikasi (`index.html`) |

---

## 9. PENILAIAN APLIKASI PWA (LUXIO)

### 9.1 Kriteria PWA
| Kriteria | Status | Catatan |
|---|---|---|
| HTTPS | ✅ | EdgeOne, sertifikat aktif |
| Manifest | ✅ | `manifest.webmanifest` (nama, ikon, warna) |
| Service Worker | ✅ | `vite-plugin-pwa` (autoUpdate) |
| Installable | ✅ | Di PC (Edge/Chrome) & HP (Android) |
| Offline mode | ⚠️ | SW menyimpan shell, data sebagian lokal |
| Notifikasi push | ⚠️ | Notifikasi native via Notification API (perangkat aktif) |
| Responsive | ✅ | Breakpoint 1024/768/640 px |

### 9.2 Skor (1–5)
| Aspek | Skor | Keterangan |
|---|---|---|
| UI/UX | 4 | Konsisten, tema gelap/terang, animasi halus |
| Fungsionalitas | 4 | Banyak fitur (target, kanban, absen, chat, dll) |
| Performa | 4 | Vite bundle, React ringan |
| Keamanan | 4 | Argon2, sanitasi, PIN, 2FA |
| PWA Compliance | 4 | Instalable + SW; push belum penuh |
| Skalabilitas | 3 | Data lokal bisa jadi bottleneck; perlu migrasi penuh ke backend |

---

## 10. KEUNTUNGAN

1. **Multi-platform** — satu kode untuk PC, HP, tablet (PWA).
2. **Tidak perlu install via App Store** — install langsung dari browser.
3. **Offline-friendly** — data personal di localStorage tetap bisa diakses.
4. **Keamanan kuat** — Argon2, PIN, 2FA, sanitasi HTML.
5. **Backend berperforma tinggi** — Rust/Axum (rendah latensi, hemat resource).
6. **Hosting murah/efisien** — EdgeOne (CDN) + Neon (serverless) + HF Space.
7. **Fitur lengkap & berkembang** — target, kanban, todo, catatan, brankas, kalender, absen, chat, AI, riset, alarm, game, penilaian kinerja.
8. **Gamifikasi** — meningkatkan keterlibatan pengguna.
9. **Pemisahan data per mode owner** — tidak campur antar role.
10. **Auto-update** — Service Worker `autoUpdate` menampilkan versi terbaru.

---

## 11. KEKURANGAN

1. **Data ganda (lokal vs backend)** — risiko inkonsistensi antara localStorage dan PostgreSQL.
2. **Tidak ada push notification** — notifikasi hanya saat perangkat aktif (Notification API), belum push server.
3. **Routing manual** — belum memakai react-router (sulit deep-link/URL share).
4. **Skalabilitas data lokal** — localStorage terbatas (~5–10 MB) untuk data besar.
5. **Tidak ada test otomatis** — belum ada unit/integration/E2E test.
6. **Migrasi state rapuh** — setiap perubahan struktur butuh versi migrasi manual.
7. **Backend belum mencakup semua fitur** — sebagian fitur masih mock/lokal.
8. **Tidak ada code-splitting optimal** — bundle utama besar (~1.1 MB, peringatan chunk).
9. **Bahasa dokumentasi campur** — komentar/UI campur Indonesia–Inggris.
10. **Dependensi pada GitHub untuk deploy HF** — bila repo private/berubah, deploy rentan.

---

## 12. REKOMENDASI PENGEMBANGAN SELANJUTNYA

### Jangka pendek (prioritas tinggi)
1. **Migrasi react-router** — URL shareable, deep-link notifikasi, back/forward.
2. **Push notification (Web Push)** — kirim notif walau aplikasi tertutup (VAPID + SW).
3. **Uji otomatis** — Vitest (unit) + Playwright (E2E) untuk halaman inti.
4. **Pindahkan data personal ke backend** — sinkronisasi 2 arah; simpan key/data terenkripsi.
5. **Perkecil bundle** — `import()` dinamis per halaman + manualChunks.

### Jangka menengah
6. **Backend lengkap untuk semua fitur** — target, kanban, todo, catatan, brankas, absen penuh via API.
7. **Role & permission lebih granular** — audit log, user provisioning (SCIM).
8. **Dashboard analytics lanjutan** — Umami + metrik internal.
9. **Penyimpanan objek penuh** — Backblaze B2 untuk lampiran & media.
10. **Internasionalisasi (i18n)** — en/id + dukungan zona waktu.

### Jangka panjang
11. **Integrasi eksternal** — Google Calendar, Slack/WhatsApp, webhook, API publik.
12. **AI lebih dalam** — otomatisasi task, ringkasan, rekomendasi prioritas.
13. **Multi-tenant SaaS** — isolasi data perusahaan, billing otomatis.
14. **Mobile native (opsional)** — Capactior/Tauri bila perlu akses fitur perangkat penuh.
15. **Audit & observability** — tracing, logging terpusat, monitoring uptime.

---

## 13. GLOSARIUM

| Istilah | Arti |
|---|---|
| **2FA** | Two-Factor Authentication — verifikasi dua langkah (password + kode OTP) |
| **API** | Application Programming Interface — antarmuka komunikasi antar aplikasi |
| **Argon2** | Algoritma hashing password yang aman & tahan serangan GPU |
| **Axum** | Web framework Rust (async) untuk membangun REST API |
| **Bearer Token** | Token autentikasi yang dikirim di header HTTP `Authorization` |
| **CDN** | Content Delivery Network — jaringan server global untuk mempercepat akses |
| **CRUD** | Create, Read, Update, Delete — operasi dasar data |
| **DOMPurify** | Library sanitasi HTML untuk mencegah serangan XSS |
| **EdgeOne** | Platform CDN & edge computing dari Tencent Cloud |
| **GitHub Release** | Fitur GitHub untuk merilis versi perangkat lunak + lampiran berkas |
| **Git Tag** | Penanda (label) komit tertentu di Git, biasanya untuk versi rilis |
| **HuggingFace Space** | Platform hosting untuk demo & aplikasi AI/ML (Docker) |
| **iframe** | Elemen HTML untuk menanamkan halaman web lain di dalam halaman |
| **localStorage** | Penyimpanan data di browser (persisten, tidak kedaluwarsa) |
| **MutationObserver** | API browser untuk memantau perubahan DOM secara real-time |
| **Neon** | Platform PostgreSQL serverless dengan fitur branching |
| **OAuth** | Protokol otorisasi untuk memberikan akses tanpa membagikan password |
| **OpenAPI** | Spesifikasi standar untuk mendokumentasikan REST API |
| **Persist** | Mekanisme Zustand untuk menyimpan state ke localStorage |
| **PostgreSQL** | Database relasional open-source canggih |
| **PWA** | Progressive Web App — aplikasi web yang bisa di-install seperti native |
| **REST** | Representational State Transfer — arsitektur API stateless berbasis HTTP |
| **Rust** | Bahasa pemrograman sistem yang aman, cepat, & konkuren |
| **SCIM** | System for Cross-domain Identity Management — provisi pengguna otomatis |
| **Semver** | Semantic Versioning — skema versi `MAJOR.MINOR.PATCH` |
| **Service Worker** | Script browser yang berjalan di latar belakang (cache, push, notifikasi) |
| **SPA** | Single Page Application — aplikasi web satu halaman tanpa reload |
| **SQLx** | Pustaka Rust untuk akses database async dengan kompilasi query |
| **SQL** | Structured Query Language — bahasa query database relasional |
| **Umami** | Platform analytics web yang ringan & menghormati privasi |
| **Vite** | Build tool modern untuk frontend (cepat, HMR) |
| **XSS** | Cross-Site Scripting — serangan injeksi kode jahat ke halaman web |
| **Zustand** | Pustaka state management untuk React (ringan, berbasis hook) |

---

## 14. VERSI & RIWAYAT PERUBAHAN

Proyek ini mengikuti **Semantic Versioning (Semver)**: `MAJOR.MINOR.PATCH`.

| Versi | Tanggal | Keterangan |
|---|---|---|
| **1.0.0** | — | Rilis awal: fitur dasar (target, kanban, todo, catatan, brankas, kalender, chat, absen, AI agent, pemantauan owner) |
| **1.0.1** | 2026-08-27 | Glosarium, sistem versi, GitHub release, deploy otomatis; perbaikan notifikasi klik, navbar auto-hide, profil area, hero teks |

*Riwayat diperbarui setiap rilis.*

---

*Dokumen ini hidup dan diperbarui seiring pengembangan aplikasi.*
