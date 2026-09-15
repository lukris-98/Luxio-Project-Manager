# Changelog — Luxio Project & Target Manager

Semua perubahan penting dicatat di sini, mengikuti **Semantic Versioning (Semver)**:
`MAJOR.MINOR.PATCH`

- **PATCH** (mis. 1.0.1) → perbaikan kecil / deploy kecil.
- **MINOR** (mis. 1.0.5, 1.1.0) → penambahan fitur yang cukup banyak.
- **MAJOR** (mis. 2.0.0) → perubahan besar / tidak kompatibel.

Alur: `1.0.0 → 1.0.1 → ... → 1.0.9 → 1.1.0 → ... → 1.9.9 → 2.0.0`

---

## [Unreleased] — User Credentials Management

### Ditambahkan (implementasi `.kiro/specs/user-credentials-management`)
- **Credential_Store** — tabel `user_credentials` (id, user_id, provider_type,
  display_name, credential_data terenkripsi, is_active, created_at, updated_at) +
  unique index parsial satu kredensial aktif per (user, provider).
- **Encryption_Service** (AES-256-GCM) — `backend/src/crypto.rs`; nonce unik per
  operasi, blob `v1:base64(nonce||ct||tag)`, kunci master dari env
  `CREDENTIAL_ENCRYPTION_KEY` (acak + warning bila belum diset). 19 unit test
  lolos (round-trip Req 1.5, tamper Req 9.6, KDF password Req 17.2).
- **API `/api/credentials/*`** — list/create/update/delete (RBAC owner/super_admin,
  isolasi user_id, rate limit 10/menit → 429), `/:id/activate` (transaksi atomik),
  `/:id/reveal` (plaintext on-demand + audit), `/test` koneksi per provider
  (timeout 10 dtk, read-only), `/rotation-due`, `/import-env`, `/export` &
  `/import` bundel terenkripsi password (Argon2id + AES-256-GCM).
- **Audit trail** — create/update/delete/activate/access/access_denied ke
  `audit_logs` (tool_name 'credentials'), tanpa nilai plaintext.
- **UI Settings → Credentials Management** (setelah bagian Neon Organization):
  form per provider, masked values server-side, ikon mata (auto re-mask 30 dtk),
  badge rotasi >90 hari + tooltip, modal hapus dengan konfirmasi ketik-nama untuk
  kredensial aktif, tombol Export/Import, banner benturan .env dari Req 8.7,
  job email pengingat rotasi bulanan (tabel `credential_rotation_reminders`).
- **Backward compatibility Req 6/13** — `neon_api_key()` & `b2_credentials()`
  kini memprioritaskan kredensial aktif database, fallback ke `.env` dengan
  peringatan deprecation sekali; `.env` lama tetap berfungsi.

---

## [1.0.5] - 2026-08-27

### Ditambahkan (roadmap jangka pendek)
- **Migrasi react-router** — URL shareable (`/#/app/kanban`), deep-link
  notifikasi & halaman, dukungan back/forward (HashRouter + UrlSync).
- **Perkecil bundle** — halaman di-load lazy (React.lazy + Suspense) +
  manualChunks vendor. Index utama turun dari ~1.1 MB → ~57 kB.
- **Web Push** — notifikasi walau aplikasi tertutup (VAPID + Service Worker),
  subscription ke backend (`/api/push/subscribe`, `/api/push/send`).
- **Uji otomatis** — Vitest (22 unit test) + Playwright (E2E smoke).
- **Sinkronisasi data terenkripsi** — util AES-GCM (Web Crypto, PBKDF2) +
  blob storage backend (`/api/sync/blob/{key}`).

### Diperbaiki
- Bug "Muat Info Koneksi" blank page (maskConn scope) — dari v1.0.2.

---

## [1.0.2] - 2026-08-27

### Diperbaiki
- Bug "Muat Info Koneksi" di halaman Pemantauan → blank page. Penyebab: fungsi
  `maskConn` dipanggil di `NeonTab` tapi tidak didefinisikan di scope-nya
  (ReferenceError). Dipindahkan ke dalam `NeonTab` agar error tidak muncul.

---

## [1.0.1] - 2026-08-27

### Ditambahkan
- Glosarium & riwayat versi di `spesifikasi terbaru.md`.
- Sistem versi deploy: file `VERSION`, `CHANGELOG.md`, versi di sidebar & `package.json`.
- GitHub Releases per versi (source zip + dist zip dapat diunduh).
- Neon Explorer lengkap di halaman Pemantauan (login API key, project, branch,
  database, role, endpoint, konsumsi, API key, playground raw).
- Halaman baru: Aplikasi (App Hub) & Connect (integrasi Gmail/Telegram/WhatsApp/dll).
- Notifikasi bisa diklik (toast + panel + notifikasi sistem) → navigasi ke halaman terkait.
- Navbar auto-hide saat scroll (PC & HP).
- Area profil terpisah (Profil / Pengaturan / Payment) tanpa border/background.
- Teks hero landing diperbesar & diperbaiki.
- Logo baru (luxio.png) di navbar, favicon, ikon PWA.

---

## [1.0.0] - Rilis Awal

- Fitur dasar: Dashboard, Target, Kanban, Todo, Catatan Pribadi + PIN, Brankas,
  Kalender, Task Saya, Divisi/Tim, Chat, AI Agent, Absen (GPS + selfie),
  Kirim Notifikasi, Kelola Akun, Pemantauan Owner (Umami, Neon, Backblaze, Log).
- Keamanan: 2FA, PIN, konfirmasi email.
- PWA installable, tema gelap/terang.
