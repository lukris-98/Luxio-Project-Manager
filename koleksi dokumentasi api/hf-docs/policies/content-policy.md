# Content Policy — Ringkasan & Poin Wajib Dipatuhi

Sumber resmi: https://huggingface.co/content-policy (Effective Date: April 10, 2025)

Content Policy mengatur **konten apa yang diizinkan** di platform Hugging Face (Hub, repositori, komunitas). Policy ini **menyatu dengan Terms of Service** — menggunakannya berarti menyetujui semuanya. Perubahan policy berlaku **10 hari** setelah dipublikasikan.

---

## 1. Definisi Kunci

| Istilah | Arti |
|---|---|
| **Content** | Segala material di platform: kode, data, teks, gambar, username, aplikasi |
| **ML Artifacts** | Isi repositori: Models, Datasets, Spaces |
| **Community Content** | Diskusi, komentar, username, README, model card, PR |
| **Repository Public/Private/Gated/Disabled** | Tingkat akses repositori (gated = akses artifact butuh persetujuan) |

## 2. Restricted Content — DILARANG KERAS

### 2.1 Konten Ilegal
- [ ] Jangan unggah konten yang melanggar hukum/regulasi negara mana pun.
- [ ] Jangan promosikan aktivitas ilegal berisiko tinggi: pengembangan senjata, zat terlarang, scam, judi, pseudo-pharmaceuticals, plagiarisme.

### 2.2 Fraud & Malicious
- [ ] Jangan unggah konten menipu/defamasi/disinformasi (phishing, scam, inauthentic behavior).
- [ ] Jangan promosikan mata uang/investasi/transaksi fraud.
- [ ] Jangan tawarkan praktik profesional ilegal/tanpa lisensi (medis, hukum, finansial).

### 2.3 Harmful & Abusive
- [ ] Jangan konten yang melukai individu/kelompok.
- [ ] Jangan diskriminasi / hate speech.
- [ ] Jangan harassment, bullying, perilaku merendahkan.
- [ ] Jangan konten seksual untuk harassment / tanpa persetujuan (consent).
- [ ] **Keraskan larangan**: nudity anak di bawah umur / konten seksual melibatkan minor.
- [ ] Jangan konten teroris atau mengagungkan kekerasan/penderitaan.

### 2.4 Privacy & IP
- [ ] Jangan publikasikan data pribadi orang lain (alamat fisik/email) tanpa izin eksplisit.
- [ ] Jangan melanggar hak kekayaan intelektual pihak ketiga (gunakan model/dataset sesuai lisensinya).

### 2.5 Platform Abuse, Security & Spam — khusus pengguna teknis (Spaces/Jobs/API)
- [ ] Jangan buat konten yang merusak/membobol sistem perangkat.
- [ ] Jangan sebarkan malware/trojan/virus.
- [ ] Jangan pakai bot API unauthorized / remote management tools.
- [ ] Jangan hosting data berlebihan/tak relevan di repositori.
- [ ] **Jangan** pakai Cloudflare Tunnel, TOR, proxies, VNC, Chrome Remote Server untuk mem-bypass batasan.
- [ ] Jangan manipulasi metrik Hub (tukar reward untuk likes).
- [ ] **Jangan cryptomining** di Spaces/Jobs.
- [ ] Jangan spam (iklan, bulk activity berlebihan).

> Catatan penting: HF juga berhak memoderasi konten lain yang belum terdaftar bila tantangan ML baru muncul; nilai **consent** dipegang sebagai inti.

## 3. Melaporkan Konten Pelanggaran

- [ ] Laporkan lewat tombol **Report** (dropdown ⋮) pada repositori/post/komentar, atau email **safety@huggingface.co**.
- [ ] Laporan juga dianggap Community Content — **jangan** gunakan fitur report untuk spam/harassment.
- [ ] Pelanggaran IP/DMCA → Takedown notice ke **dmca@huggingface.co** (format resmi US Copyright Office 512).
- [ ] Uploader yang dilaporkan berhak mengajukan **counter-notification**; claimant punya 14 hari kerja AS untuk menuntut sebelum konten dipulihkan.

## 4. Cara HF Memoderasi (yang bisa kena Anda)

Aksi yang mungkin diambil terhadap konten pelanggaran:
- Minta kolaborasi/revisi konten
- **Unranking** (hilang dari trending/search)
- Tag **NFAA** (Not For All Audiences)
- Remove / **Disable** repositori
- Restrict interactions (lock diskusi)
- **Suspend / terminate akun**

## 5. Kewajiban Owner Repositori (alat moderasi yang HARUS dipakai bila perlu)

- [ ] Edit/hide komentar komunitas, judul diskusi & PR.
- [ ] Tag konten **NFAA** bila berisi materi sensitif.
- [ ] **Gate** repositori (approve/reject manual) bila model/dataset sensitif — lihat `../models/models-gated.md`.
- [ ] Close/lock/delete diskusi yang bermasalah.

## 6. Kontestasi Keputusan Moderasi

- [ ] Kirim keberatan lengkap dengan bukti ke **safety@huggingface.co**.
- [ ] Warga EU: berhak mengajukan ke badan penyelesaian sengketa out-of-court (DSA) — HF ikut serta dengan itikad baik.

## 7. Kontak Resmi

| Kebutuhan | Email |
|---|---|
| Lapor pelanggaran konten | safety@huggingface.co |
| DMCA / takedown | dmca@huggingface.co |
| Otoritas EU (DSA) | legal@huggingface.co |
| Warga Australia (online safety) | aus-online-safety@huggingface.co |

## 8. Kewajiban Khusus Australia (DIS Standard 13(3)(a))

- [ ] Sebelum unggah ML Artifacts: ambil langkah yang wajar untuk **meminimalkan risiko** konten dipakai menghasilkan CSAM atau materi pro-teror.
- [ ] Lapor konten ilegal (warga Australia): aus-online-safety@huggingface.co.

## 9. Feeds Tanpa Personalisasi

- Konten publik sama untuk semua user (tanpa rekomendasi personal); Trending dipengaruhi likes beberapa hari terakhir; Posts tampil kronologis — jangan berharap manipulasi reach.
