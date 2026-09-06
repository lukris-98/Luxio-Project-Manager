# Metrik — Daftar Lengkap

Metrik adalah pengukuran individual atas aktivitas pengguna, performa iklan, atau estimasi pendapatan. Dipakai di parameter `metrics` (wajib, minimal satu).

Sumber: https://developers.google.com/youtube/analytics/metrics

---

## 0. Ringkasan Kelompok

| Kelompok | Metrik |
|---|---|
| View | `engagedViews`, `views`, `redViews`, `viewerPercentage`, `playlistViews` |
| Watch time | `estimatedMinutesWatched`, `estimatedRedMinutesWatched`, `averageViewDuration`, `averageViewPercentage` |
| Engagement | `comments`, `likes`, `dislikes`, `shares`, `subscribersGained`, `subscribersLost`, `videosAddedToPlaylists`, `videosRemovedFromPlaylists` |
| Playlist | `averageTimeInPlaylist`, `playlistAverageViewDuration`, `playlistEstimatedMinutesWatched`, `playlistSaves`, `playlistStarts`, `playlistViews`, `viewsPerPlaylistStart` |
| Anotasi | `annotationImpressions`, `annotationClickableImpressions`, `annotationClicks`, `annotationClickThroughRate`, `annotationClosableImpressions`, `annotationCloses`, `annotationCloseRate` |
| Kartu | `cardImpressions`, `cardClicks`, `cardClickRate`, `cardTeaserImpressions`, `cardTeaserClicks`, `cardTeaserClickRate` |
| Livestream | `averageConcurrentViewers`, `peakConcurrentViewers` |
| Audience retention | `audienceWatchRatio`, `relativeRetentionPerformance`, `startedWatching`, `stoppedWatching`, `totalSegmentImpressions` |
| Membership | `membershipsCancellationSurveyResponses` |
| Estimasi pendapatan | `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue` |
| Performa iklan | `grossRevenue`, `cpm`, `adImpressions`, `monetizedPlaybacks`, `playbackBasedCpm` |

### Metrik inti

Hanya metrik berikut yang tunduk pada Deprecation Policy dalam Terms of Service:

`annotationClickThroughRate`, `annotationCloseRate`, `averageViewDuration`, `comments`, `dislikes`, `engagedViews`, `estimatedMinutesWatched`, `estimatedRevenue`, `likes`, `shares`, `subscribersGained`, `subscribersLost`, `viewerPercentage`, `views`

---

## 1. Metrik View

| Metrik | Inti | Satuan | Keterangan |
|---|---|---|---|
| `views` | Ya | Bilangan bulat | Merepresentasikan angka yang berbeda pada jenis laporan yang berbeda |
| `engagedViews` | Ya | Bilangan bulat | Jumlah kali video channel ditonton melewati frame pertama, atau pengguna mengeklik/menekan untuk memutar |
| `redViews` | Tidak | Bilangan bulat | Jumlah kali video ditonton oleh anggota YouTube Premium (sebelumnya YouTube Red) |
| `viewerPercentage` | Ya | Persen | Persentase penonton yang **sedang login** saat menonton video atau playlist |
| `playlistViews` | Tidak | Bilangan bulat | Didefinisikan di bagian [metrik playlist](#4-metrik-playlist) |

> Catatan: dokumentasi resmi menyatakan `views` "merepresentasikan angka yang berbeda pada jenis laporan yang berbeda" tanpa merinci perbedaannya per laporan. Pada laporan playlist, `views` termasuk *aggregated video metric* — hanya menghitung video dalam playlist yang juga dimiliki channel pemilik playlist.

---

## 2. Metrik Watch Time

| Metrik | Inti | Satuan | Keterangan |
|---|---|---|---|
| `estimatedMinutesWatched` | Ya | **Menit** | Jumlah menit pengguna menonton video untuk channel, pemilik konten, video, atau playlist yang ditentukan |
| `estimatedRedMinutesWatched` | Tidak | **Menit** | Jumlah menit anggota YouTube Premium menonton video |
| `averageViewDuration` | Ya | **Detik** | Panjang rata-rata pemutaran video. Sejak 13 Desember 2021 metrik ini mengecualikan trafik *looping clips*. Pada laporan playlist, menunjukkan panjang rata-rata pemutaran yang terjadi dalam konteks playlist |
| `averageViewPercentage` | Tidak | Persen | Persentase rata-rata video yang ditonton selama satu pemutaran. Sejak 13 Desember 2021 mengecualikan trafik *looping clips* |

> Prinsip: `averageViewPercentage` **tidak bisa** digabung dengan dimensi atau filter `liveOrOnDemand`. Banyak laporan hadir dalam dua varian karena batasan ini.

---

## 3. Metrik Engagement

| Metrik | Inti | Satuan | Keterangan |
|---|---|---|---|
| `comments` | Ya | Bilangan bulat | Jumlah kali pengguna berkomentar pada video |
| `likes` | Ya | Bilangan bulat | Jumlah kali pengguna memberi rating positif |
| `dislikes` | Ya | Bilangan bulat | Jumlah kali pengguna memberi rating negatif |
| `shares` | Ya | Bilangan bulat | Jumlah kali pengguna membagikan video melalui tombol `Share` |
| `subscribersGained` | Ya | Bilangan bulat | Jumlah kali pengguna berlangganan channel |
| `subscribersLost` | Ya | Bilangan bulat | Jumlah kali pengguna berhenti berlangganan channel |
| `videosAddedToPlaylists` | Tidak | Bilangan bulat | Jumlah kali video ditambahkan ke playlist YouTube mana pun |
| `videosRemovedFromPlaylists` | Tidak | Bilangan bulat | Jumlah kali video dihapus dari playlist YouTube mana pun |

Detail penting:

| Metrik | Detail |
|---|---|
| `subscribersGained` | Channel bisa memperoleh pelanggan dari halaman watch, halaman channel, dan guide di beranda. Pada laporan channel, metrik ini mencakup semua tempat tersebut. Namun pada laporan yang memakai dimensi `video` **atau** memfilter ke satu video tertentu, metrik ini **hanya** mencakup statistik dari halaman watch video tersebut |
| `subscribersLost` | Dilaporkan dengan cara yang sama seperti `subscribersGained` |
| `videosAddedToPlaylists` | Termasuk penambahan ke playlist default seperti "Watch Later". **Tidak** menghitung playlist yang video ditambahkan secara otomatis, seperti playlist uploads channel atau riwayat tonton pengguna. Nilainya **absolut**: tambah → hapus → tambah lagi dihitung dua kali. Data tidak tersedia sebelum **1 Oktober 2014** |
| `videosRemovedFromPlaylists` | Termasuk penghapusan dari playlist default. Nilainya absolut. Data tidak tersedia sebelum **1 Oktober 2014** |

---

## 4. Metrik Playlist

Laporan playlist memuat dua jenis metrik yang berbeda maknanya.

| Jenis | Definisi | Metrik |
|---|---|---|
| **Aggregated video metrics** | Aktivitas pengguna dan impresi yang diagregasi untuk **semua video dalam playlist yang juga dimiliki channel pemilik playlist**. Video milik channel lain tidak dihitung. Akibatnya, playlist yang hanya berisi video channel lain tidak akan menghasilkan nilai untuk metrik ini | `engagedViews`, `views`, `estimatedMinutesWatched`, `averageViewDuration` |
| **In-playlist metrics** | Aktivitas dan engagement dalam konteks halaman playlist. Mencakup view semua video dalam playlist, siapa pun pemiliknya, tetapi hanya view yang terjadi dalam konteks playlist | `playlistViews`, `playlistEstimatedMinutesWatched`, `playlistAverageViewDuration`, `playlistSaves`, `playlistStarts`, `viewsPerPlaylistStart`, `averageTimeInPlaylist` |

| Metrik | Satuan | Keterangan |
|---|---|---|
| `playlistViews` | Bilangan bulat | Jumlah kali video dalam playlist ditonton **dalam konteks playlist tersebut**. Termasuk video milik channel lain |
| `playlistStarts` | Bilangan bulat | Jumlah kali penonton memulai pemutaran playlist. **Hanya** view playlist yang terjadi di web |
| `playlistSaves` | Bilangan bulat | Perubahan **neto** jumlah pengguna yang menyimpan playlist. Simpan → hapus → simpan lagi menghasilkan nilai neto satu |
| `playlistEstimatedMinutesWatched` | **Menit** | Jumlah menit pengguna menonton konten playlist sebagai bagian dari playlist. Watch time dari konteks lain tidak dihitung. Termasuk video milik channel lain |
| `playlistAverageViewDuration` | **Detik** | Panjang rata-rata yang ditonton per view playlist. Ini rata-rata panjang view video individual dalam playlist. Termasuk video milik channel lain |
| `averageTimeInPlaylist` | **Menit** | Perkiraan rata-rata waktu penonton menonton video dalam playlist setelah playlist dimulai. **Hanya** view playlist yang terjadi di web |
| `viewsPerPlaylistStart` | Angka desimal | Rata-rata jumlah view video setiap kali playlist dimulai. **Hanya** view playlist yang terjadi di web |

> Prinsip: `playlistAverageViewDuration` mengukur rata-rata panjang view video **individual** dalam playlist; `averageTimeInPlaylist` mengukur rata-rata waktu penonton menghabiskan playlist **sebagai keseluruhan**. Keduanya bukan sinonim.

`playlistSaves` bukan aggregated video metric maupun in-playlist metric — ia mengukur interaksi dengan playlist itu sendiri, bukan dengan video di dalamnya.

---

## 5. Metrik Anotasi

Anotasi sudah tidak dapat dibuat lagi di YouTube, tetapi metriknya tetap ada untuk data historis.

| Metrik | Inti | Satuan | Keterangan |
|---|---|---|---|
| `annotationImpressions` | Tidak | Bilangan bulat | Total impresi anotasi |
| `annotationClickableImpressions` | Tidak | Bilangan bulat | Jumlah anotasi yang muncul dan dapat diklik |
| `annotationClicks` | Tidak | Bilangan bulat | Jumlah anotasi yang diklik |
| `annotationClickThroughRate` | Ya | Rasio | Rasio anotasi yang diklik terhadap total impresi anotasi yang dapat diklik |
| `annotationClosableImpressions` | Tidak | Bilangan bulat | Jumlah anotasi yang muncul dan dapat ditutup |
| `annotationCloses` | Tidak | Bilangan bulat | Jumlah anotasi yang ditutup |
| `annotationCloseRate` | Ya | Rasio | Rasio anotasi yang ditutup terhadap total impresi anotasi |

Ketersediaan data:

| Metrik | Tersedia sejak |
|---|---|
| `annotationClickThroughRate`, `annotationCloseRate` | 10 Juni 2012 |
| Metrik anotasi lainnya | 16 Juli 2013 |

---

## 6. Metrik Kartu

| Metrik | Satuan | Keterangan |
|---|---|---|
| `cardImpressions` | Bilangan bulat | Jumlah kali kartu ditampilkan. Saat panel kartu dibuka, satu impresi dicatat untuk **setiap** kartu pada video |
| `cardClicks` | Bilangan bulat | Jumlah kali kartu diklik |
| `cardClickRate` | Rasio | Rasio klik kartu terhadap impresi kartu |
| `cardTeaserImpressions` | Bilangan bulat | Jumlah kali teaser kartu ditampilkan. Satu view video dapat menghasilkan beberapa impresi teaser |
| `cardTeaserClicks` | Bilangan bulat | Jumlah klik pada teaser kartu. Klik ikon kartu diatribusikan ke teaser terakhir yang ditampilkan ke pengguna |
| `cardTeaserClickRate` | Rasio | Rasio klik teaser kartu terhadap total impresi teaser kartu |

Semua metrik kartu adalah **non-inti**.

---

## 7. Metrik Livestream (Concurrent Viewers)

| Metrik | Satuan | Keterangan |
|---|---|---|
| `averageConcurrentViewers` | Angka | Rata-rata jumlah penonton bersamaan untuk satu video tertentu. Bila dimensi `livestreamPosition` disertakan, nilai ini adalah rata-rata penonton bersamaan pada segmen tertentu |
| `peakConcurrentViewers` | Angka | Puncak jumlah penonton bersamaan untuk satu video. Bila `livestreamPosition` disertakan, nilai ini adalah puncak pada segmen tertentu |

Laporan concurrent viewers wajib memfilter `video`.

---

## 8. Metrik Audience Retention

Dipakai bersama dimensi `elapsedVideoTimeRatio`. Terbagi dua kategori.

### A. Retensi audiens

| Metrik | Satuan | Keterangan |
|---|---|---|
| `audienceWatchRatio` | Rasio absolut | Rasio penonton yang menonton video pada titik tertentu. Dihitung dengan membandingkan berapa kali sebuah bagian video ditonton terhadap total view video. **Bisa lebih dari 1** bila penonton memutar ulang bagian tersebut |
| `relativeRetentionPerformance` | Rasio 0–1 | Seberapa baik video mempertahankan penonton dibanding **semua video YouTube dengan durasi serupa** pada titik tertentu. `0` = paling buruk, `1` = paling baik, median `0.5` |

Contoh perhitungan `audienceWatchRatio` dari dokumentasi resmi:

- Video 1 menit ditonton 100 kali. Setengah penonton berhenti setelah 15 detik, sisanya menonton penuh, tidak ada yang memutar ulang. Nilainya `1` untuk kuartal pertama video dan `0.50` untuk sisanya.
- Video 1 menit ditonton 100 kali. Semua penonton menonton penuh, tetapi 20 penonton menonton sampai detik ke-45, melompat kembali ke detik ke-30, lalu menonton sisanya. Nilainya `1` untuk paruh pertama dan kuartal terakhir, tetapi `1.2` untuk kuartal ketiga.

### B. Statistik tonton granular

| Metrik | Satuan | Keterangan |
|---|---|---|
| `startedWatching` | Bilangan bulat | Jumlah kali sebuah segmen video menjadi segmen **pertama** yang dilihat selama satu pemutaran |
| `stoppedWatching` | Bilangan bulat | Jumlah kali sebuah segmen video menjadi segmen **terakhir** yang dilihat selama satu pemutaran |
| `totalSegmentImpressions` | Bilangan bulat | Jumlah kali sebuah segmen video ditonton. Satu penonton bisa menonton segmen yang sama beberapa kali dalam satu pemutaran |

Contoh dari dokumentasi resmi: video X berdurasi 5 menit dibagi menjadi 100 segmen 3 detik. Penonton menonton 1 menit 10 detik pertama (segmen 1–24), lalu pada kunjungan berikutnya melanjutkan dari segmen 24 sampai 100.

| Metrik | Nilai |
|---|---|
| `startedWatching` | `1` untuk segmen 1 dan 24, `0` untuk lainnya |
| `stoppedWatching` | `1` untuk segmen 24 dan 100, `0` untuk lainnya |
| `totalSegmentImpressions` | `2` untuk segmen 24, `1` untuk lainnya |

> Prinsip: laporan audience retention wajib memakai filter `video` dengan **satu** ID; daftar ID dipisah koma tidak didukung.

---

## 9. Metrik Membership

| Metrik | Satuan | Keterangan |
|---|---|---|
| `membershipsCancellationSurveyResponses` | Bilangan bulat | Jumlah survei yang diselesaikan pengguna YouTube yang membatalkan membership channel selama periode laporan |

Dipakai bersama dimensi `membershipsCancellationSurveyReason` (opsional).

---

## 10. Metrik Estimasi Pendapatan

> Prinsip: seluruh metrik di bagian ini dan bagian [performa iklan](#11-metrik-performa-iklan) membutuhkan token dengan scope `https://www.googleapis.com/auth/yt-analytics-monetary.readonly`.

| Metrik | Inti | Satuan | Nama lama | Keterangan |
|---|---|---|---|---|
| `estimatedRevenue` | Ya | Mata uang | `earnings` | Total estimasi pendapatan **neto** dari semua sumber iklan yang dijual Google **serta** dari sumber non-iklan, untuk rentang tanggal dan wilayah yang dipilih |
| `estimatedAdRevenue` | Tidak | Mata uang | `adEarnings` | Total estimasi pendapatan neto dari semua sumber iklan yang dijual Google |
| `estimatedRedPartnerRevenue` | Tidak | Mata uang | `redPartnerRevenue` | Total estimasi pendapatan dari langganan YouTube Premium untuk dimensi laporan yang dipilih. Mencerminkan pendapatan dari konten musik maupun non-musik |

Catatan resmi yang berlaku untuk semua metrik estimasi pendapatan:

- Nilainya tunduk pada **penyesuaian akhir bulan**.
- **Tidak** mencakup iklan yang dijual maupun disajikan oleh partner (*partner-sold* dan *partner-served advertising*).
- Default mata uang adalah `USD`; parameter `currency` mengubahnya untuk `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `grossRevenue`, `cpm`, dan `playbackBasedCpm`.

---

## 11. Metrik Performa Iklan

| Metrik | Satuan | Nama lama | Keterangan |
|---|---|---|---|
| `grossRevenue` | **USD** | — | Estimasi pendapatan **bruto** dari semua iklan yang dijual Google atau partner DoubleClick, untuk rentang tanggal dan wilayah yang dipilih. Tunduk penyesuaian akhir bulan, tidak mencakup *partner-served advertising*. Berbeda dari `estimatedRevenue` yang sudah memperhitungkan porsi kepemilikan dan perjanjian bagi hasil |
| `cpm` | Mata uang | `impressionBasedCpm` | Estimasi pendapatan bruto per seribu impresi iklan |
| `adImpressions` | Bilangan bulat | `impressions` | Jumlah impresi iklan terverifikasi yang disajikan |
| `monetizedPlaybacks` | Bilangan bulat | — | Jumlah kejadian saat penonton memutar video dan diperlihatkan minimal satu impresi iklan. Satu *monetized playback* dihitung bila penonton diperlihatkan iklan preroll tetapi berhenti menonton iklan sebelum video dimulai. Perkiraan galat: ±2,0% |
| `playbackBasedCpm` | Mata uang | — | Estimasi pendapatan bruto per seribu pemutaran |

Pembagian resmi antara dua jenis metrik performa iklan:

| Kategori | Metrik | Muncul di |
|---|---|---|
| Berbasis impresi | `grossRevenue`, `adImpressions`, `cpm` | Laporan performa iklan (`dimensions=adType`) |
| Berbasis pemutaran | `playbackBasedCpm`, `monetizedPlaybacks` | Sebagian laporan video — **tidak** disertakan dalam laporan performa iklan |

> Catatan penting: halaman laporan channel resmi mencantumkan metrik pendapatan (`estimatedRevenue`, `estimatedAdRevenue`, `grossRevenue`, `estimatedRedPartnerRevenue`, `monetizedPlaybacks`, `playbackBasedCpm`, `adImpressions`, `cpm`) dalam daftar metrik beberapa laporan channel dengan tanda `*` yang berarti butuh scope monetary. Namun bagian Authorization pada halaman yang sama menyatakan bahwa metrik estimasi pendapatan dan performa iklan **saat ini tidak didukung untuk laporan channel**, sehingga scope `yt-analytics-monetary.readonly` tidak memberikan akses ke data moneter pada laporan tersebut. Kedua pernyataan itu ada di dokumentasi resmi dan saling bertentangan. Untuk data pendapatan yang pasti didukung, gunakan laporan **pemilik konten**. Lihat [../guides/revenue-reports.md](../guides/revenue-reports.md).

---

## 12. Metrik yang Disebut Dokumentasi tetapi Tidak Terdefinisi

Nama-nama berikut muncul di dokumentasi resmi, tetapi **tidak** memiliki definisi pada halaman Metrics saat ini dan/atau tidak muncul di tabel laporan yang didukung. Jangan mengandalkannya tanpa verifikasi dengan request nyata.

| Nama | Di mana disebut | Status |
|---|---|---|
| `uniques` | Tercantum dalam daftar metrik laporan channel dan pemilik konten "activity for time periods"; halaman *Introduction* menyebutnya sebagai metrik eksklusif Analytics API | Tidak ada definisi di halaman Metrics |
| `videoThumbnailImpressions`, `videoThumbnailImpressionsClickRate` | Tabel perbandingan nama Analytics API vs Reporting API | Tidak ada definisi di halaman Metrics; laporan *reach* hanya didukung Reporting API |
| `savesAdded`, `savesRemoved` | Tabel perbandingan nama | Tidak ada definisi di halaman Metrics |
| `favoritesAdded`, `favoritesRemoved` | Disebut sebagai metrik yang sudah usang | Tidak dipakai lagi |

---

## 13. Ringkasan Satuan

| Satuan | Metrik |
|---|---|
| Bilangan bulat (hitungan) | `views`, `engagedViews`, `redViews`, `likes`, `dislikes`, `comments`, `shares`, `subscribersGained`, `subscribersLost`, `videosAddedToPlaylists`, `videosRemovedFromPlaylists`, `playlistViews`, `playlistStarts`, `playlistSaves`, semua metrik anotasi & kartu berjenis hitungan, `adImpressions`, `monetizedPlaybacks`, `startedWatching`, `stoppedWatching`, `totalSegmentImpressions`, `membershipsCancellationSurveyResponses` |
| Menit | `estimatedMinutesWatched`, `estimatedRedMinutesWatched`, `playlistEstimatedMinutesWatched`, `averageTimeInPlaylist` |
| Detik | `averageViewDuration`, `playlistAverageViewDuration` |
| Persen (0–100) | `averageViewPercentage`, `viewerPercentage` |
| Rasio | `annotationClickThroughRate`, `annotationCloseRate`, `cardClickRate`, `cardTeaserClickRate`, `audienceWatchRatio` (bisa > 1), `relativeRetentionPerformance` (0–1), `viewsPerPlaylistStart` |
| Mata uang sesuai `currency` | `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `cpm`, `playbackBasedCpm` |
| USD | `grossRevenue` |

---

## Selanjutnya

- Daftar dimensi: [dimension.md](dimension.md)
- Kombinasi legal per laporan: [../guides/channel-reports.md](../guides/channel-reports.md)
- Laporan pendapatan: [../guides/revenue-reports.md](../guides/revenue-reports.md)
