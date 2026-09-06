# Todolist Kepatuhan Hugging Face

Checklist gabungan dari 4 kebijakan HF (ToS, Privacy, Content Policy, Code of Conduct). **Semua item di bawah wajib dipatuhi** — satu kolom sumber dokumennya. Periksa ulang tiap kali sebelum rilis/mengunggah sesuatu ke Hub atau membuat akun/organisasi baru.

Sumber: [README.md](README.md) · [content-policy.md](content-policy.md) · [terms-of-service.md](terms-of-service.md) · [privacy.md](privacy.md) · [code-of-conduct.md](code-of-conduct.md)

---

## A. Akun & Organisasi

- [ ] Pengguna akun berusia minimal 13 tahun / entitas legal terdaftar (ToS).
- [ ] Semua data registrasi akurat & valid (email, nama, username).
- [ ] Password kuat, tidak dibagikan ke siapa pun (ToS).
- [ ] Laporkan segera ke HF bila akun terindikasi bocor (ToS).
- [ ] Buat akun organisasi hanya bila berwenang mengikat organisasi (ToS).

## B. Lisensi & Hak Cipta Konten

- [ ] Punya hak/legalitas atas SETIAP model/dataset/kode yang diunggah (ToS + Content Policy).
- [ ] Cantumkan **license** pada repositori (README/model card) — jangan menghapus referensi lisensi (ToS).
- [ ] Hormati IP pihak ketiga: tidak mengunggah bobot/dataset yang lisensinya melarang redistribusi (Content Policy).
- [ ] Klaim DMCA hanya dengan data akurat & jujur (ToS).

## C. Konten yang Diunggah (Models / Datasets / Spaces)

- [ ] Tidak ada konten ilegal / promosi aktivitas ilegal (senjata, zat terlarang, scam, judi, plagiarisme).
- [ ] Tidak ada disinformasi, phishing, konten menipu.
- [ ] Tidak ada tawaran layanan profesional (medis/hukum/finansial) ilegal tanpa lisensi.
- [ ] Tidak ada hate speech, diskriminasi, harassment, bullying.
- [ ] Tidak ada konten seksual tanpa consent; **nol toleransi** konten seksual minor.
- [ ] Tidak ada konten teroris / glorifikasi kekerasan.
- [ ] Tidak mempublikasikan data pribadi orang lain tanpa izin eksplisit (PII scrub pada dataset!).
- [ ] Tidak ada malware/trojan/virus (scan model pickled sebelum upload).
- [ ] Konten sensitif diberi tag **NFAA** dan/atau di-**gate** (approve manual).

## D. Larangan Teknis Platform Abuse — KRITIS untuk Spaces/Jobs/API

- [ ] Tidak ada cryptomining di Spaces/Jobs.
- [ ] Tidak memakai Cloudflare Tunnel, TOR, proxies, VNC, Chrome Remote Server untuk bypass batasan.
- [ ] Tidak memakai bot API unauthorized / remote management tools.
- [ ] Tidak hosting data berlebihan/tak relevan.
- [ ] Tidak manipulasi metrik Hub (like-trade, bot download).
- [ ] Tidak spam (iklan, bulk berlebihan).
- [ ] Tidak ada aktivitas membobol/mengganggu sistem HF.

## E. Perilaku Komunitas (Code of Conduct)

- [ ] Berempati, hormati perbedaan pendapat, feedback konstruktif.
- [ ] Tidak trolling, menghina, serangan personal/politik.
- [ ] Tidak harassment (publik maupun privat).
- [ ] Tidak bahasa/gambar seksualisasi.
- [ ] Asumsikan niat baik; komunitas global bervariasi gaya komunikasinya.
- [ ] Sebagai owner repo: moderat komentar/PR yang bermasalah (hide/edit/close).

## F. Privasi & Data Pribadi

- [ ] Jangan bagikan password; amankan perangkat sendiri (Privacy).
- [ ] Pahami: repo publik = lisensi perpetual untuk semua user — jangan unggah data rahasia ke repo publik (ToS).
- [ ] HF dapat mengakses konten private sesuai Privacy Policy — jangan simpan secret kritis di Hub.
- [ ] Data pribadi bisa diproses di AS & negara lain (Privacy) — pastikan kebijakan internal Luxio memperhitungkannya.
- [ ] Permintaan akses/erasure data pribadi → privacy@huggingface.co.

## G. Keuangan & Hukum (bila berlangganan PRO/Enterprise/Inference)

- [ ] Fee dibayar di muka; non-refundable; pajak tanggungan sendiri (ToS).
- [ ] Layanan "as is" — tidak ada jaminan; rancang fallback untuk fitur kritis.
- [ ] Patuh export control & sanctions AS.
- [ ] Klaim hukum maksimal 1 tahun sejak kejadian (ToS).

## H. Prosedur Saat Ada Masalah

| Situasi | Aksi | Kontak |
|---|---|---|
| Lihat konten melanggar | Klik Report (dropdown ⋮) | safety@huggingface.co |
| IP Anda dilanggar | Takedown notice resmi (512) | dmca@huggingface.co |
| Akun/repo Anda kena moderasi (tidak setuju) | Keberatan + bukti lengkap | safety@huggingface.co |
| Warga EU: tidak puas | Badan out-of-court (DSA) | legal@huggingface.co |
| Warna Australia: konten ilegal | Lapor hasil investigasi | aus-online-safety@huggingface.co |
| Data pribadi: akses/hapus | Permintaan tertulis | privacy@huggingface.co |
| Akun bocor | Laporkan segera | via HF support |

## I. Daur Ulang Kebijakan (pemeliharaan dokumen ini)

- [ ] Cek ulang 4 halaman sumber **tiap 6 bulan** — perubahan berlaku 10 hari setelah posting.
- [ ] Bila ada perubahan material (mis. larangan baru), update file ringkasan ini + checklist.
- [ ] Anggota tim baru di proyek HF (Luxio) wajib membaca folder `policies/` ini.
