# Saran Harga & Paket Luxio

Dokumen ini berisi riset harga kompetitor (terutama Notion) serta rekomendasi harga untuk aplikasi Luxio Project Manager. Tujuannya: menentukan nilai jual yang kompetitif tanpa mengorbankan profitabilitas.

---

## 1. Riset Harga Notion

Notion menerapkan model **per-seat (per-user) per bulan**, dengan pembayaran tahunan mendapat diskon. Berikut ringkasan paketnya:

| Paket | Harga | Fitur Utama |
| --- | --- | --- |
| **Free** | $0 | Individual, 7 hari riwayat halaman (page history), upload file maks 5MB, hingga 10 tamu (guests) |
| **Plus** | $10 / seat / bulan | Blocks tak terbatas, riwayat 30 hari, upload file tak terbatas, publikasi ke situs kustom (custom sites) |
| **Business** | $20 / seat / bulan | SAML SSO, private teamspaces, izin granular (granular permissions), uji coba AI |
| **Enterprise** | Custom (kustom) | Audit log, SCIM, keamanan lanjutan (advanced security), customer success manager |

Poin penting dari model Notion:

- **Fitur di-Free dibuat "cukup menggoda"** — cukup untuk 1 individu, tapi langsung terasa sempit saat kolaborasi (batas 10 tamu, riwayat 7 hari, upload 5MB).
- **Pendapatan utama Notion dari paket Plus & Business** yang dibayar per user, bukan dari biaya sekali bayar.
- **Enterprise ditawarkan "custom"** — harga fleksibel per perusahaan besar, biasanya di atas $20/seat/bulan.
- Perbedaan antar paket lebih banyak ke **keamanan & kolaborasi skala besar** (SSO, SCIM, audit log) daripada fitur inti.

---

## 2. Rekomendasi Harga Luxio

Berbeda dari Notion yang per-seat, Luxio sebaiknya **flat per-workspace/bulan** (lebih simpel untuk UMKM & grup kecil di Indonesia). Basisnya fitur yang sudah ada di aplikasi sekarang.

| Paket | Harga | Target Pengguna | Fitur |
| --- | --- | --- | --- |
| **Free** | Rp 0 | Individu / mencoba | 1 user, maks 3 target, fitur dasar: target (todo + kanban), catatan pribadi + PIN, kalender & pengingat |
| **Personal** | Rp 49.000 / bulan | Individu profesional | Target tak terbatas, PIN pribadi, 2FA, kuota edit profil lebih besar |
| **Grup** | Rp 149.000 / bulan | Tim kecil (1–15 orang) | Hingga 15 anggota, 5 divisi, chat tim + grup otomatis, **absensi masuk/pulang + GPS & selfie**, manajemen role & kewenangan |
| **Organisasi** | Rp 399.000 / bulan | Perusahaan | Anggota & divisi tak terbatas, **AI Agent**, **dashboard owner** (analytics Umami, monitoring Neon, storage Backblaze), semua fitur di atas |

### Alasan penetapan harga

1. **Free = magnet akuisisi.** 1 user + 3 target cukup untuk merasakan produk, tapi langsung mendorong upgrade ke Personal saat mau serius.
2. **Personal meniru psikologi Notion Plus** — fitur inti lengkap untuk 1 orang dengan harga terjangkau (di bawah harga jajan bulanan).
3. **Grup adalah paket laris** — target utama UMKM. Rp 149rb/bulan (≈ Rp 10rb/anggota untuk 15 orang) jauh di bawah gaji 1 hari kerja, sangat masuk akal untuk menggantikan aplikasi chat + spreadsheet.
4. **Organisasi adalah paket margin.** Semua fitur mahal (AI Agent, dashboard owner, storage Backblaze, monitoring Neon) dikumpulkan di sini — biaya infrastruktur per-workspace rata-rata kecil, jadi margin tinggi.
5. Semua paket memakai **mata uang lokal (Rp)** — psikologis lebih murah daripada harga dolar seperti Notion.

---

## 3. Tabel Perbandingan Fitur Gratis vs Berbayar

Perbandingan dengan kompetitor yang dipakai UMKM: **Notion**, **Odoo**, **ERPNext**, dan **Bitrix24**.

| Fitur / Aplikasi | Notion | Odoo | ERPNext | Bitrix24 | **Luxio (saran)** |
| --- | --- | --- | --- | --- | --- |
| Aplikasi gratis | Ada (terbatas) | Ada (aplikasi dasar, 1 user) | Open source (self-host gratis) | Ada (free plan) | **Ada (1 user, 3 target)** |
| Harga mulai (berbayar) | $10/seat/bln | ~$7–$26/user/bln | Komunitas gratis, hosting berbayar | ~$61/5 user/bln | **Rp 49rb/bln (Personal)** |
| Manajemen target/proyek | Gratis | Gratis (dasar) | Gratis | Gratis | **Gratis (dasar) / tak terbatas (berbayar)** |
| Kanban / task board | Gratis | Gratis | Gratis | Gratis | **Gratis** |
| Catatan & dokumentasi | Gratis | Gratis | Gratis | Gratis | **Gratis + PIN** |
| Chat tim | Terbatas (komentar) | Gratis | Gratis (komentar) | Gratis (unlimited chat) | **Berbayar (Grup+)** |
| Absensi (clock-in/out) | — (via integrasi) | Berbayar (modul HR) | Berbayar (modul HR) | Berbayar (plan Tingkat Lanjut) | **Berbayar (Grup+)** |
| Manajemen role & izin | Berbayar (Business+) | Berbayar | Berbayar | Gratis (dasar) | **Berbayar (Grup+)** |
| Analytics / dashboard | Berbayar (AI/analytics) | Berbayar | Berbayar | Gratis (dasar) | **Berbayar (Organisasi)** |
| AI assistant / agent | Trial di Business | Berbayar | — | — | **Berbayar (Organisasi)** |
| SSO / keamanan enterprise | Berbayar (Business+) | Berbayar | Gratis (self-host) | Berbayar | **Roadmap** |
| Storage file besar | Berbayar (Plus+) | Berbayar | Gratis (self-host) | Gratis (5GB, lalu bayar) | **Berbayar (Organisasi, via B2)** |

### Kesimpulan perbandingan

- **Notion & Bitrix24** memakai "free plan menarik" untuk menjaring pengguna, lalu monetisasi lewat kolaborasi & keamanan — Luxio mengikuti pola yang sama.
- **Odoo & ERPNext** memakai modul HR/absensi **berbayar** — jadi menjadikan absensi sebagai fitur berbayar adalah keputusan yang selaras dengan pasar.
- Fitur **gratis di semua kompetitor** (target/kanban, catatan) tetap Luxio berikan gratis — jangan paywall hal yang sudah menjadi ekspektasi pasar.

### Yang harus Luxio kenakan biaya (perbedaan utama dari kompetitor)

1. **Absensi masuk/pulang + GPS & selfie** — kompetitor memungut biaya untuk modul HR; ini pembeda Luxio untuk UMKM.
2. **AI Agent** — belum ada kompetitor budget yang menyediakan; premium value.
3. **Dashboard owner** (analytics, monitoring DB, storage) — fitur operasional untuk pemilik bisnis, masuk akal di paket tertinggi.
4. **Chat tim + grup otomatis** — di Notion tidak ada chat native; layak jadi fitur berbayar.
5. **Kuota (target tak terbatas, anggota tak terbatas)** — batas kuota adalah pendorong upgrade paling sederhana dan efektif.

---

## 4. Rekomendasi Trial

> **Semua paket berbayar (Personal, Grup, Organisasi) disarankan memberikan masa uji coba 1 bulan gratis (free trial).**

Alasan:

- **Menurunkan hambatan coba** — user yang mencoba fitur berbayar (mis. absensi grup) 2–3x lebih mungkin berkonversi daripada yang tidak pernah mencoba.
- **Selaras dengan kompetitor** — Notion memberi trial 2 minggu untuk Business; Odoo memberi trial 15 hari; ERPNext memberi trial hosting. Trial 1 bulan Luxio **lebih lama & lebih murah**, jadi unggul kompetitif.
- **Model psikologis "investasi data"** — setelah 1 bulan mengisi data (target, tim, absensi), user cenderung membayar daripada memulai dari nol di aplikasi lain.
- **Praktis untuk penerapan** — cukup simpan field `trial_until` di profil/company; saat lewat, kunci fitur premium dan tampilkan tombol upgrade.

### Implementasi teknis yang disarankan

1. Tambahkan kolom `trial_until` (timestamp) pada tabel user/company.
2. Saat upgrade dimulai, set `trial_until = now + 30 hari` dan role sesuai paket (grup → admin, organisasi → super_admin).
3. Saat `trial_until` lewat tanpa pembayaran, turunkan akses ke paket Free + tampilkan banner upgrade.
4. Log aktivitas upgrade/downgrade lewat dashboard owner (sudah tersedia).

---

## 5. Ringkasan Eksekutif

- Model harga Notion (per-seat, free menggoda, enterprise custom) dipakai sebagai acuan, tapi disesuaikan ke **flat per-workspace** untuk pasar UMKM Indonesia.
- **4 paket: Free → Personal (Rp 49rb) → Grup (Rp 149rb) → Organisasi (Rp 399rb)**, dengan absensi, chat, AI Agent, dan dashboard owner sebagai pembeda berbayar.
- Fitur dasar (target, kanban, catatan, kalender) tetap gratis — mengikuti ekspektasi pasar.
- **Trial 1 bulan untuk semua paket** untuk memaksimalkan konversi, dengan implementasi teknis sederhana lewat field `trial_until`.
