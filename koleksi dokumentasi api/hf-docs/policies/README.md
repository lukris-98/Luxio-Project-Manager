# Hugging Face Policies — Kebijakan Platform & Kepatuhan

Folder ini merangkum **4 kebijakan resmi Hugging Face** yang mengikat setiap pengguna platform. Semua ringkasan disusun dari halaman resmi (link di tiap file) dengan poin-poin todolist yang wajib dipatuhi.

> Dokumen kebijakan ini **menyatu & mengikat**: ToS + Privacy + Content Policy + Code of Conduct. Menggunakan layanan HF = menyetujui semuanya. Perubahan policy berlaku **10 hari** setelah dipublikasikan di website.

---

## Daftar File

| File | Sumber resmi | Effective Date | Isi ringkasan |
|---|---|---|---|
| [terms-of-service.md](terms-of-service.md) | https://huggingface.co/terms-of-service | Sep 15, 2022 | Kontrak layanan: akun, konten & lisensi, pembayaran, terminasi, liability, hukum New York |
| [privacy.md](privacy.md) | https://huggingface.co/privacy | Mar 28, 2023 | Data yang dikumpulkan, penggunaan, hak akses/erasure, lokasi pemrosesan (AS), subprocessors |
| [content-policy.md](content-policy.md) | https://huggingface.co/content-policy | Apr 10, 2025 | Konten terlarang (5 kategori), moderasi, pelaporan, DMCA, kewajiban owner repo |
| [code-of-conduct.md](code-of-conduct.md) | https://huggingface.co/code-of-conduct | Jun 10, 2025 | Perilaku wajib & terlarang, hak owner repositori, pelaporan |
| [compliance-checklist.md](compliance-checklist.md) | gabungan 4 dokumen | — | **Todolist kepatuhan lengkap** — baca ini sebelum upload/rilis |

---

## Todolist Kepatuhan — Ringkas (baca checklist lengkap di [compliance-checklist.md](compliance-checklist.md))

### Konten yang diunggah
- [ ] Punya hak/legalitas atas semua yang diunggah + cantumkan lisensi.
- [ ] Tidak ada: ilegal, fraud, hate speech/harassment, konten seksual tanpa consent, CSAM (nol toleransi), teroris, malware, PII orang lain.
- [ ] Tidak spam / manipulasi metrik / **cryptomining** / bypass via TOR-proxy-tunnel.
- [ ] Konten sensitif → tag NFAA dan/atau gate repositori.

### Perilaku
- [ ] Hormati semua orang; tidak trolling/harassment/serangan personal.
- [ ] Feedback konstruktif; asumsikan niat baik.

### Akun & Hukum
- [ ] Usia ≥ 13 tahun; password kuat & rahasia; laporkan pembobolan akun.
- [ ] Repo publik = lisensi perpetual untuk semua user — jangan unggah data rahasia.
- [ ] Layanan "as is" tanpa jaminan; fee non-refundable; patuh sanctions AS; klaim maks 1 tahun.

### Prosedur & Kontak

| Situasi | Kontak |
|---|---|
| Lapor konten melanggar | safety@huggingface.co / tombol Report |
| DMCA / IP | dmca@huggingface.co |
| Keberatan moderasi | safety@huggingface.co |
| Privasi / erasure data | privacy@huggingface.co |
| Otoritas EU (DSA) | legal@huggingface.co |
| Australia online safety | aus-online-safety@huggingface.co |

---

## Relasi dengan Dokumentasi Lain

| Topik teknis | File |
|---|---|
| Gate repositori (moderasi mandiri) | [../models/models-gated.md](../models/models-gated.md) · [../datasets/datasets-gated.md](../datasets/datasets-gated.md) |
| Model card (transparansi konten) | [../models/model-cards.md](../models/model-cards.md) |
| Dataset card (provenance data) | [../datasets/datasets-cards.md](../datasets/datasets-cards.md) |
| Moderasi platform | [../other/moderation.md](../other/moderation.md) |
| Lisensi repositori | [../repositories/repositories-licenses.md](../repositories/repositories-licenses.md) |
