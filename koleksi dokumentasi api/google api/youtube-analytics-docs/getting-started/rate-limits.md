# Kuota & Batas

Tiga jenis batas yang berbeda dan sering tertukar: **kuota request**, **batas jumlah baris hasil**, dan **batas kombinasi/ketersediaan data**.

---

## 1. Kuota Request

| Aspek | Keterangan |
|---|---|
| Satuan | Dokumentasi resmi menyatakan setiap request API dihitung sebagai satu unit pemakaian kuota |
| Tempat melihat batas | Panel Quotas Cloud Console: https://console.developers.google.com/iam-admin/quotas?service=youtubeanalytics.googleapis.com |
| Sifat | Terikat ke **project Cloud**, bukan ke channel |
| Perilaku saat habis | Request gagal dengan status `429` dan reason bertipe rate limit |

> Catatan: nilai numerik batas harian tidak dipublikasikan dalam dokumentasi API; angka yang berlaku untuk sebuah project hanya terlihat di panel Quotas. Halaman *Introduction* resmi juga menyebut bahwa server API mengevaluasi setiap kueri untuk menentukan biaya kuotanya, sehingga kueri berat sebaiknya tidak dianggap gratis.

### Strategi hemat kuota

| Pola | Efek |
|---|---|
| Cache respons per (`ids`, rentang tanggal, `metrics`, `dimensions`, `filters`) | Data historis tidak berubah; hanya beberapa hari terakhir yang perlu di-refresh |
| Minta beberapa metrik dalam satu request | `metrics=views,likes,comments,shares` = satu request, bukan empat |
| Hindari dimensi yang tidak dipakai UI | Dimensi tambahan memperbanyak baris tanpa menambah informasi bila tidak ditampilkan |
| Pakai grup untuk sekumpulan video | Satu request `filters=group==GROUP_ID` menggantikan banyak request per video |
| Ambil rentang panjang sekali, agregasi di klien | Lebih murah daripada request per hari |

---

## 2. Batas Jumlah Baris Hasil

Beberapa laporan punya batas keras pada `maxResults` dan **mewajibkan** parameter `sort`.

| Laporan | Batas `maxResults` | `sort` wajib | Opsi `sort` yang diterima |
|---|---|---|---|
| Top videos (channel & pemilik konten) | ≤ **200** | Ya | `-views`, `-redViews`, `-estimatedMinutesWatched`, `-estimatedRedMinutesWatched`, `-subscribersGained`, `-subscribersLost`, `-estimatedRevenue`, `-estimatedRedPartnerRevenue` (tergantung varian laporan) |
| Top playlists | ≤ **200** | Ya | `-playlistViews`, `-playlistEstimatedMinutesWatched`, `-playlistStarts` |
| User activity by city | ≤ **250** | Ya | `-views`, `-estimatedMinutesWatched` |
| User activity by DMA | — | Ya | `-views`, `-estimatedMinutesWatched` |
| Playback location detail | ≤ **25** | Ya | `-views`, `-estimatedMinutesWatched` |
| Traffic source detail | ≤ **25** | Ya | `-views`, `-estimatedMinutesWatched` |
| Playback location detail (playlist) | ≤ **25** | Ya | `-playlistViews`, `-playlistEstimatedMinutesWatched`, `-playlistStarts` |
| Traffic source detail (playlist) | ≤ **25** | Ya | `-playlistViews`, `-playlistEstimatedMinutesWatched`, `-playlistStarts` |

Batas lain:

| Batas | Nilai |
|---|---|
| Jumlah ID dalam satu filter `video`/`playlist`/`channel` | maksimum **500** |
| Jumlah item dalam satu grup | maksimum **500** |
| Laporan traffic source | Error bila (**jumlah video yang dikueri** × **jumlah hari dalam rentang**) melebihi **50.000** |
| Top videos sebelum 1 Januari 2013 | Hanya tersedia untuk 10 video teratas |

> Prinsip: bila laporan traffic source menabrak batas 50.000, pecah kueri menjadi beberapa request dengan lebih sedikit video atau rentang tanggal lebih pendek. Contoh: 500 ID video maksimum 100 hari.

Paginasi memakai `startIndex` (1-based) dan `maxResults`. Detail: [../guides/filters-and-sorting.md](../guides/filters-and-sorting.md).

---

## 3. Batas Rentang Tanggal & Ketersediaan Data

### Data terbaru

Dokumentasi resmi:

- Respons memuat data sampai **hari terakhir di mana semua metrik dalam kueri tersedia** pada saat kueri dijalankan. Jika `endDate` diminta 5 Juli 2017 tetapi nilai untuk semua metrik yang diminta baru tersedia sampai 3 Juli 2017, maka 3 Juli 2017 adalah tanggal terakhir dalam respons — meski sebagian metrik sudah ada untuk 4 Juli.
- Respons kueri berdimensi `day` **tidak memuat baris untuk hari-hari terbaru**.

> Catatan: dokumentasi resmi tidak menyebut angka latensi tetap. Dalam praktik, keterlambatan 1–2 hari umum diamati, tetapi angka ini **bukan** jaminan API. Jangan menghitung `endDate` dari tanggal hari ini; hitung dari tanggal terakhir yang benar-benar muncul di `rows`.

### Awal ketersediaan data per dimensi/metrik

| Dimensi / metrik | Data tersedia sejak |
|---|---|
| `city` | 1 Januari 2022 |
| `creatorContentType` | 1 Januari 2019 |
| `liveOrOnDemand` | 1 April 2014 |
| `youtubeProduct` | 18 Juli 2015 (nilai `UNKNOWN` untuk aktivitas sebelum tanggal ini) |
| `youtubeProduct==MUSIC` | 1 Maret 2021 (sebelumnya masuk `CORE`) |
| Filter `audienceType` | 25 September 2013. Kueri **tanpa** filter ini berfungsi untuk tanggal setelah 1 Juli 2008 |
| `videosAddedToPlaylists`, `videosRemovedFromPlaylists` | 1 Oktober 2014 |
| `annotationClickThroughRate`, `annotationCloseRate` | 10 Juni 2012 |
| Metrik anotasi lainnya | 16 Juli 2013 |

### Aturan format tanggal

| Aturan | Detail |
|---|---|
| Format | `YYYY-MM-DD` untuk `startDate` dan `endDate` |
| Dimensi `month` | `startDate` **dan** `endDate` keduanya harus tanggal 1 bulan bersangkutan |
| Zona waktu | Semua tanggal = 00:00–23:59 **Pacific Time** (UTC-7/UTC-8) |
| Hari peralihan DST | Berdurasi 23 jam (maju) atau 25 jam (mundur) |

Detail: [../guides/time-based-reports.md](../guides/time-based-reports.md).

---

## 4. Anonimisasi Data (Ambang Batas)

Data disembunyikan bila tidak memenuhi ambang batas tertentu. Ambangnya **tidak dipublikasikan** dan dapat berubah.

| Jenis data | Bisa disembunyikan? |
|---|---|
| Demografi (`ageGroup`, `gender`) | Ya |
| Geografi (`country`, `province`, `city`, `dma`) | Ya — kecuali metrik pendapatan yang tidak dikenai ambang geografi |
| Detail sumber trafik (`insightTrafficSourceDetail`: kata kunci pencarian, URL eksternal) | Ya |

Akibatnya total di laporan agregat bisa **lebih besar** daripada penjumlahan laporan tersegmentasi. Contoh resmi: video ditonton 1.000 kali (500 AS, 498 Kanada, 2 Prancis); laporan per-negara hanya menampilkan AS 500 dan Kanada 498 — baris Prancis tidak muncul, dan tidak ada indikasi bahwa 2 view lain terjadi.

> Prinsip: jangan menampilkan "sisa" hasil pengurangan total minus jumlah segmen sebagai kategori "Lainnya" tanpa penjelasan. Angka itu bisa berasal dari anonimisasi maupun dari item yang sudah dihapus.

---

## 5. Item Terhapus

| Jenis laporan | Perilaku |
|---|---|
| Agregat (mis. `dimensions=day` tanpa `video`) | **Termasuk** kontribusi video yang sudah dihapus |
| Per-item (mis. `dimensions=video`) | **Tidak memuat** video yang sudah dihapus |

Konsekuensi: total harian pada laporan agregat bisa lebih besar daripada jumlah view per-video pada periode yang sama.

---

## 6. Kewajiban Kebijakan atas Metadata

Analytics API hanya mengembalikan ID resource. Metadata (judul, thumbnail) diambil dari YouTube Data API v3. Menurut YouTube API Services Developer Policies bagian III.E.4.b–III.E.4.d, klien API wajib **menghapus atau memperbarui** metadata resource yang disimpan dari API tersebut setelah **30 hari**.

> Prinsip: beri TTL 30 hari pada cache judul/thumbnail. Cache angka analitik sendiri tidak terkena aturan ini.

---

## Selanjutnya

- Penanganan error dan backoff: [errors.md](errors.md), [../guides/error-handling.md](../guides/error-handling.md)
- Ringkasan batas dalam satu tabel: [../guides/quota-and-limits.md](../guides/quota-and-limits.md)
