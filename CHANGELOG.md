# Changelog — Luxio Project & Target Manager

Semua perubahan penting dicatat di sini, mengikuti **Semantic Versioning (Semver)**:
`MAJOR.MINOR.PATCH`

- **PATCH** (mis. 1.0.1) → perbaikan kecil / deploy kecil.
- **MINOR** (mis. 1.0.5, 1.1.0) → penambahan fitur yang cukup banyak.
- **MAJOR** (mis. 2.0.0) → perubahan besar / tidak kompatibel.

Alur: `1.0.0 → 1.0.1 → ... → 1.0.9 → 1.1.0 → ... → 1.9.9 → 2.0.0`

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
