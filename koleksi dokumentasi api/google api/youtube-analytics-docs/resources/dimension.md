# Dimensi — Daftar Lengkap

Dimensi adalah kriteria pengelompokan data. Setiap baris hasil memiliki kombinasi nilai dimensi yang unik; kombinasi itu adalah primary key baris tersebut.

- Dipakai di parameter `dimensions` (mengelompokkan) dan/atau `filters` (membatasi).
- Beberapa dimensi **hanya** boleh dipakai sebagai filter.
- Beberapa dimensi **hanya** tersedia pada laporan pemilik konten.

Sumber: https://developers.google.com/youtube/analytics/dimensions

---

## 0. Ringkasan Kelompok

| Kelompok | Dimensi | Boleh di `dimensions`? |
|---|---|---|
| Resource | `video`, `playlist`, `channel`, `group` | `group` **hanya** filter |
| Geografi | `country`, `province`, `dma`, `city`, `continent`, `subContinent` | `continent`, `subContinent` **hanya** filter |
| Waktu | `day`, `month` | Ya, maksimum satu |
| Lokasi pemutaran | `insightPlaybackLocationType`, `insightPlaybackLocationDetail` | Ya |
| Detail pemutaran | `creatorContentType`, `liveOrOnDemand`, `subscribedStatus`, `youtubeProduct` | Ya |
| Sumber trafik | `insightTrafficSourceType`, `insightTrafficSourceDetail` | Ya |
| Perangkat & OS | `deviceType`, `operatingSystem` | Ya |
| Demografi | `ageGroup`, `gender` | Ya |
| Berbagi | `sharingService` | Ya |
| Audience retention | `elapsedVideoTimeRatio`, `audienceType` | `audienceType` **hanya** filter |
| Live streaming | `livestreamPosition` | Ya |
| Membership | `membershipsCancellationSurveyReason` | Ya |
| Performa iklan | `adType` | Ya |
| Pemilik konten | `claimedStatus`, `uploaderType` | Dipakai sebagai filter wajib |

### Dimensi inti

Hanya dimensi berikut yang tunduk pada Deprecation Policy dalam Terms of Service:

`ageGroup`, `channel`, `country`, `day`, `gender`, `month`, `sharingService`, `uploaderType`, `video`

Dimensi lain adalah non-inti dan dapat diubah atau dihapus tanpa masa transisi.

---

## 1. Resource

| Dimensi | Inti | Nilai | Keterangan |
|---|---|---|---|
| `video` | Ya | ID video YouTube | Sama dengan properti `id` pada resource `video` di YouTube Data API |
| `playlist` | Tidak | ID playlist YouTube | Sama dengan properti `id` pada resource `playlist` |
| `channel` | Ya | ID channel YouTube | **Hanya laporan pemilik konten.** Sering dipakai karena laporan pemilik konten mengagregasi banyak channel |
| `group` | Tidak | ID grup Analytics | **Filter saja.** Diperoleh dari `groups.list`. Respons memuat data seluruh video/playlist/channel dalam grup |

Ketika dipakai sebagai **filter**, `video`, `playlist`, dan `channel` menerima beberapa nilai sekaligus:

```bash
# Sampai 500 ID, dipisah koma.
--data-urlencode "filters=video==ID_A,ID_B,ID_C"

# Menambahkan filter yang sama ke dimensions → hasil dipecah per ID.
--data-urlencode "dimensions=insightTrafficSourceType,video"
--data-urlencode "filters=video==ID_A,ID_B,ID_C"
```

> Prinsip: `video`/`playlist`/`channel` boleh masuk `dimensions` selama filter yang sama menyebut beberapa nilai — bahkan bila laporan itu resminya tidak mencantumkan dimensi tersebut.

---

## 2. Geografi

| Dimensi | Inti | Format nilai | Aturan |
|---|---|---|---|
| `country` | Ya | Kode negara ISO-3166-1 dua huruf: `US`, `ID`, `CN`, `FR`. Nilai `ZZ` = negara tidak teridentifikasi | — |
| `province` | Tidak | Kode ISO 3166-2 negara bagian AS / District of Columbia: `US-MI`, `US-TX`. Nilai `US-ZZ` = tidak teridentifikasi | Bila `province` ada di `dimensions`, request **wajib** menyertakan `filters=country==US`. Tidak mendukung wilayah luar AS maupun subdivisi negara lain |
| `dma` | Tidak | Pengenal 3 digit Designated Market Area versi Nielsen | Laporan DMA wajib memfilter `country==US` atau memfilter ke `province` tertentu |
| `city` | Tidak | Perkiraan kota | Data tersedia sejak **1 Januari 2022**. Laporan kota membatasi `maxResults` ≤ 250 dan mewajibkan `sort` |
| `continent` | Tidak | Kode wilayah statistik PBB | **Filter saja** |
| `subContinent` | Tidak | Kode sub-wilayah statistik PBB | **Filter saja** |

### Nilai `continent`

| Kode | Wilayah |
|---|---|
| `002` | Afrika |
| `019` | Amerika (Amerika Utara, Amerika Latin, Amerika Selatan, Karibia) |
| `142` | Asia |
| `150` | Eropa |
| `009` | Oseania |

Pemakaian: `filters=continent==150`.

### Nilai `subContinent`

| Kode | Wilayah | Sub-wilayah |
|---|---|---|
| `014` | Afrika | Afrika Timur |
| `017` | Afrika | Afrika Tengah |
| `015` | Afrika | Afrika Utara |
| `018` | Afrika | Afrika Selatan |
| `011` | Afrika | Afrika Barat |
| `029` | Amerika | Karibia |
| `013` | Amerika | Amerika Tengah |
| `021` | Amerika | Amerika Utara |
| `005` | Amerika | Amerika Selatan |
| `143` | Asia | Asia Tengah |
| `030` | Asia | Asia Timur |
| `034` | Asia | Asia Selatan |
| `035` | Asia | Asia Tenggara |
| `145` | Asia | Asia Barat |
| `151` | Eropa | Eropa Timur |
| `154` | Eropa | Eropa Utara |
| `039` | Eropa | Eropa Selatan |
| `155` | Eropa | Eropa Barat |
| `053` | Oseania | Australia dan Selandia Baru |
| `054` | Oseania | Melanesia |
| `057` | Oseania | Mikronesia |
| `061` | Oseania | Polinesia |

Pemakaian: `filters=subContinent==035` (Asia Tenggara).

---

## 3. Waktu

| Dimensi | Inti | Format nilai | Aturan |
|---|---|---|---|
| `day` | Ya | `YYYY-MM-DD` | Satu baris per hari. Baris untuk hari-hari terbaru tidak muncul |
| `month` | Ya | `YYYY-MM` | `startDate` **dan** `endDate` keduanya harus tanggal 1 bulan bersangkutan |

Aturan lintas dimensi: **maksimum satu** dimensi waktu per request. `dimensions=day,month` selalu ilegal.

> Catatan zona waktu: semua tanggal merujuk periode 00:00–23:59 **Pacific Time** (UTC-7 atau UTC-8). Hari saat jam disesuaikan maju untuk DST berdurasi 23 jam; saat mundur berdurasi 25 jam. Dimensi `month` merujuk periode yang dimulai 00:00 Pacific Time pada hari pertama bulan tersebut.

Detail: [../guides/time-based-reports.md](../guides/time-based-reports.md).

---

## 4. Lokasi Pemutaran

| Dimensi | Keterangan |
|---|---|
| `insightPlaybackLocationType` | Jenis halaman atau aplikasi tempat pemutaran terjadi |
| `insightPlaybackLocationDetail` | Halaman tempat player berada. **Hanya** didukung untuk view di embedded player; mengidentifikasi embedded player yang menghasilkan paling banyak view. Wajib disertai `filters=insightPlaybackLocationType==EMBEDDED`, `maxResults` ≤ 25, dan `sort` |

### Nilai `insightPlaybackLocationType`

| Nilai | Arti |
|---|---|
| `BROWSE` | View pada halaman/layar beranda YouTube, feed langganan, atau fitur penjelajahan lain |
| `CHANNEL` | View pada halaman channel |
| `EMBEDDED` | View pada situs/aplikasi lain melalui embed `<iframe>` atau `<object>` |
| `EXTERNAL_APP` | View di aplikasi pihak ketiga dengan metode selain embed `<iframe>`/`<object>`, mis. YouTube Android Player API |
| `MOBILE` | Data lama. Sejak 10 September 2013 pemutaran tidak lagi dikategorikan `MOBILE`; nilai ini tetap ada untuk data historis. Setelah tanggal itu, pemutaran mobile masuk `WATCH`, `EMBEDDED`, atau `EXTERNAL_APP` |
| `SEARCH` | View langsung pada halaman hasil pencarian YouTube |
| `WATCH` | View pada halaman watch YouTube atau aplikasi resmi YouTube |
| `YT_OTHER` | View yang tidak terklasifikasi |

---

## 5. Detail Pemutaran

| Dimensi | Keterangan |
|---|---|
| `creatorContentType` | Jenis konten yang ditonton. Data tersedia sejak **1 Januari 2019** |
| `liveOrOnDemand` | Apakah view terjadi selama siaran langsung. Data tersedia sejak **1 April 2014** |
| `subscribedStatus` | Apakah penonton berlangganan channel pemilik video/playlist |
| `youtubeProduct` | Layanan YouTube tempat aktivitas terjadi. Data tersedia sejak **18 Juli 2015** |

### Nilai `creatorContentType`

| Nilai | Arti |
|---|---|
| `LIVE_STREAM` | Konten adalah livestream YouTube |
| `SHORTS` | Konten adalah YouTube Short |
| `STORY` | Konten adalah YouTube Story |
| `VIDEO_ON_DEMAND` | Video YouTube yang tidak masuk kategori lain |
| `UNSPECIFIED` | Jenis konten tidak diketahui |

### Nilai `liveOrOnDemand`

| Nilai | Arti |
|---|---|
| `LIVE` | Aktivitas terjadi selama siaran langsung |
| `ON_DEMAND` | Aktivitas tidak terjadi selama siaran langsung |

> Prinsip: `liveOrOnDemand` — baik sebagai dimensi maupun filter — **tidak bisa** digabung dengan metrik `averageViewPercentage`. Karena itu banyak laporan hadir dalam dua varian: satu mendukung `liveOrOnDemand`, satu mendukung `averageViewPercentage`.

### Nilai `subscribedStatus`

| Nilai | Arti |
|---|---|
| `SUBSCRIBED` | Penonton berlangganan saat aktivitas terjadi |
| `UNSUBSCRIBED` | Penonton tidak berlangganan saat aktivitas terjadi |

Nilai ini akurat **pada saat aktivitas terjadi**. Bila seseorang menonton satu video sebelum berlangganan lalu menonton video lain setelah berlangganan pada hari yang sama, laporan mencatat satu view `UNSUBSCRIBED` dan satu view `SUBSCRIBED`.

### Nilai `youtubeProduct`

| Nilai | Arti |
|---|---|
| `CORE` | Aktivitas di luar aplikasi khusus (Gaming, Kids, Music). Pengecualian: aktivitas di YouTube Music sebelum 1 Maret 2021 masuk `CORE` |
| `GAMING` | Aktivitas di YouTube Gaming |
| `KIDS` | Aktivitas di YouTube Kids |
| `MUSIC` | Aktivitas di YouTube Music pada atau setelah 1 Maret 2021. Data real-time tidak dicatat |
| `UNKNOWN` | Aktivitas sebelum 18 Juli 2015 |

---

## 6. Sumber Trafik

| Dimensi | Keterangan |
|---|---|
| `insightTrafficSourceType` | Jenis referrer — bagaimana penonton mencapai video |
| `insightTrafficSourceDetail` | Referrer spesifik yang menghasilkan paling banyak view untuk satu tipe sumber trafik. Wajib disertai filter `insightTrafficSourceType`, `maxResults` ≤ 25, dan `sort` |

### Nilai `insightTrafficSourceType`

| Nilai | Arti |
|---|---|
| `ADVERTISING` | Penonton dirujuk oleh iklan. Dengan filter ini, `insightTrafficSourceDetail` berisi jenis iklan |
| `ANNOTATION` | Penonton mengeklik anotasi di video lain |
| `CAMPAIGN_CARD` | View berasal dari video ter-klaim milik pengguna yang dipakai pemilik konten untuk mempromosikan konten. **Hanya laporan pemilik konten** |
| `END_SCREEN` | View dirujuk dari end screen video lain |
| `EXT_URL` | View dirujuk dari tautan di situs lain. Termasuk rujukan dari hasil Google Search. `insightTrafficSourceDetail` berisi halaman web |
| `HASHTAGS` | View berasal dari halaman hashtag VOD atau halaman pivot hashtag Shorts |
| `LIVE_REDIRECT` | View dirujuk dari Live Redirect |
| `NO_LINK_EMBEDDED` | Video ter-embed di situs lain saat ditonton |
| `NO_LINK_OTHER` | YouTube tidak mengidentifikasi referrer. Mencakup trafik langsung dan trafik aplikasi mobile |
| `NOTIFICATION` | View dirujuk dari email atau notifikasi YouTube |
| `PLAYLIST` | View terjadi saat video diputar sebagai bagian playlist, termasuk trafik dari halaman playlist |
| `PRODUCT_PAGE` | View dirujuk dari halaman produk |
| `PROMOTED` | View dirujuk dari promosi YouTube tak berbayar, mis. halaman "Spotlight Videos" |
| `RELATED_VIDEO` | View dirujuk dari daftar video terkait di halaman watch video lain. `insightTrafficSourceDetail` berisi ID video tersebut |
| `SHORTS` | Penonton dirujuk melalui geser vertikal dari video sebelumnya di pengalaman Shorts |
| `SOUND_PAGE` | View berasal dari halaman pivot sound Shorts |
| `SUBSCRIBER` | View dirujuk dari feed beranda YouTube atau fitur langganan. `insightTrafficSourceDetail` berisi item feed beranda atau halaman perujuk |
| `VIDEO_REMIXES` | View dirujuk dari tautan video yang di-remix di player Shorts. `insightTrafficSourceDetail` berisi video perujuk |
| `WATCH_WITH` | View dirujuk dari stream Creator Commentary / "Watch With". `insightTrafficSourceDetail` berisi video perujuk |
| `YT_CHANNEL` | View terjadi di halaman channel. `insightTrafficSourceDetail` berisi ID channel |
| `YT_OTHER_PAGE` | View dirujuk dari tautan pada halaman YouTube selain hasil pencarian atau video terkait |
| `YT_SEARCH` | View dirujuk dari hasil pencarian YouTube. `insightTrafficSourceDetail` berisi kata kunci pencarian |

### Isi `insightTrafficSourceDetail` per tipe sumber

Laporan detail hanya tersedia untuk sebagian tipe sumber trafik.

| Tipe sumber | Isi `insightTrafficSourceDetail` |
|---|---|
| `ADVERTISING` | Jenis iklan yang menghasilkan view (daftar di bawah) |
| `CAMPAIGN_CARD` | Video ter-klaim yang mengarahkan penonton |
| `END_SCREEN` | Video yang mengarahkan penonton |
| `EXT_URL` | Situs perujuk |
| `HASHTAGS` | Hashtag yang menghasilkan view |
| `NOTIFICATION` | Email atau notifikasi perujuk |
| `RELATED_VIDEO` | Video terkait yang mengarahkan penonton |
| `SOUND_PAGE` | Video yang menghasilkan view |
| `SUBSCRIBER` | Item feed beranda atau fitur langganan (daftar nilai di bawah) |
| `VIDEO_REMIXES` | Video yang menghasilkan view |
| `WATCH_WITH` | Video yang menghasilkan view |
| `YT_CHANNEL` | Halaman channel tempat video ditonton |
| `YT_OTHER_PAGE` | Halaman YouTube perujuk |
| `YT_SEARCH` | Kata kunci pencarian |

Nilai `insightTrafficSourceDetail` untuk `ADVERTISING`:

`Click-to-play engagement ad`, `Engagement ad`, `Google Search ads`, `Homepage video ad`, `Reserved skippable in-stream`, `TrueView in-search and in-display`, `TrueView in-stream`, `Uncategorized YouTube advertising`, `Video wall`

Nilai `insightTrafficSourceDetail` untuk `SUBSCRIBER`:

| Nilai | Arti |
|---|---|
| `activity` | View dari item feed langganan beranda akibat aktivitas channel non-upload dan non-sosial (like, favorit, posting buletin, penambahan playlist) |
| `blogged` | View dari item feed langganan beranda akibat tautan dari blog teratas |
| `mychannel` | View dari feed lain di beranda seperti "Likes", "Watch History", "Watch Later" |
| `podcasts` | View dari item di halaman tujuan Podcasts |
| `sdig` | View dari email pembaruan langganan |
| `uploaded` | View dari item `uploaded` di feed langganan beranda |
| `/` | View lain yang berasal dari beranda YouTube |
| `/my_subscriptions` | View dari halaman *My subscriptions* pengguna |

> Catatan: laporan `insightTrafficSourceDetail` **tidak** didukung untuk semua tipe sumber. Yang secara eksplisit disebut tidak didukung antara lain `VIDEO_REMIXES`, `NOTIFICATION`, `END_SCREEN`, `CAMPAIGN_CARD`, dan `NO_LINK_EMBEDDED`. Daftar tipe yang didukung dan daftar isi detail di dokumentasi resmi saling tumpang tindih sebagian; verifikasi dengan request nyata sebelum mengandalkannya.

---

## 7. Perangkat & Sistem Operasi

| Dimensi | Keterangan |
|---|---|
| `deviceType` | Bentuk fisik perangkat tempat view terjadi. Bisa juga dipakai sebagai filter untuk membatasi laporan OS ke satu jenis perangkat |
| `operatingSystem` | Sistem perangkat lunak perangkat. Bisa juga dipakai sebagai filter untuk membatasi laporan perangkat ke satu OS |

### Nilai `deviceType`

`DESKTOP`, `GAME_CONSOLE`, `MOBILE`, `TABLET`, `TV`, `AUTOMOTIVE`, `WEARABLE`, `UNKNOWN_PLATFORM`

### Nilai `operatingSystem`

`ANDROID`, `BADA`, `BLACKBERRY`, `CHROMECAST`, `DOCOMO`, `FIREFOX`, `HIPTOP`, `IOS`, `KAIOS`, `LINUX`, `MACINTOSH`, `MEEGO`, `NINTENDO_3DS`, `OTHER`, `PLAYSTATION`, `PLAYSTATION_VITA`, `REALMEDIA`, `SMART_TV`, `SYMBIAN`, `TIZEN`, `VIDAA`, `WEBOS`, `WII`, `WINDOWS`, `WINDOWS_MOBILE`, `XBOX`

Ketiga varian laporan yang tersedia: `deviceType` saja, `operatingSystem` saja, atau keduanya bersamaan.

---

## 8. Demografi

| Dimensi | Inti | Nilai |
|---|---|---|
| `ageGroup` | Ya | `age13-17`, `age18-24`, `age25-34`, `age35-44`, `age45-54`, `age55-64`, `age65-` |
| `gender` | Ya | `female`, `male`, `user_specified` |

Keduanya mengidentifikasi atribut **pengguna yang sedang login**. `ageGroup` mencakup pengguna yang diperkirakan YouTube berusia di bawah 18 tahun.

Laporan demografi hanya menerima satu metrik: `viewerPercentage`.

> Catatan: nilai `viewerPercentage` **tidak dinormalisasi** untuk berbagai nilai dimensi detail pemutaran. Laporan yang memakai `subscribedStatus` mengembalikan `viewerPercentage` yang berjumlah 100% untuk view berlangganan *dan* 100% untuk view non-langganan — total seluruh field menjadi 200%. Pakai filter agar laporan hanya memuat satu nilai dimensi detail pemutaran.

---

## 9. Berbagi

| Dimensi | Inti | Keterangan |
|---|---|---|
| `sharingService` | Ya | Layanan yang dipakai untuk membagikan video melalui tombol "Share" |

Laporan ini hanya menerima metrik `shares`.

Nilai `sharingService` (nilai API, bukan label tampilan):

`ALLO`, `AMEBA`, `ANDROID_EMAIL`, `ANDROID_MESSENGER`, `ANDROID_MMS`, `ANDROID_SYSTEM_SHARE_DIALOG`, `BBM`, `BLIND_REACT`, `BLOGGER`, `COPY_PASTE`, `CYWORLD`, `DIGG`, `DIRECT_SYSTEM_ACTIVITY_DIALOG`, `DISCORD`, `DISPLAYED_QR_CODE`, `DROPBOX`, `EMBED`, `MAIL`, `FACEBOOK`, `FACEBOOK_LITE`, `FACEBOOK_MESSENGER`, `FACEBOOK_PAGES`, `FACEBOOK_SHARE_TO_GROUP`, `FACEBOOK_STORIES`, `FOTKA`, `GMAIL`, `GOO`, `GOOGLE_APP`, `GOOGLE_CHAT`, `GOOGLE_CHROME`, `INBOX`, `GOOGLE_KEEP`, `GOOGLEPLUS`, `GO_SMS`, `GROUPME`, `HANGOUTS`, `HI5`, `HTC_MMS`, `IMO`, `INSTAGRAM`, `INSTAGRAM_STORIES`, `INVITE_LINK_ANDROID`, `INVITE_LINK_IOS`, `INVITE_PLAYLIST_COLLABORATORS`, `IOS_SYSTEM_ACTIVITY_DIALOG`, `KAKAO_STORY`, `KAKAO`, `KAIOS_MESSAGES`, `KIK`, `LGE_EMAIL`, `LINE`, `LINKEDIN`, `LIVEJOURNAL`, `MAPS_COPY_PASTE`, `MEET_LIVE_SHARING`, `MENEAME`, `MIXI`, `MOTOROLA_MESSAGING`, `MYSPACE`, `NAVER`, `NEARBY_SHARE`, `NUJIJ`, `ODNOKLASSNIKI`, `OTHER`, `PINTEREST`, `QUICK_SHARE`, `QUICK_SHARE_SAMSUNG`, `RAKUTEN`, `REDDIT`, `REMIX`, `SAMSUNG_MESSAGES`, `SAMSUNG_NOTES`, `SAVE_TO_DEVICE_PHOTOS`, `SHARE_AD_FREE`, `SHARE_TO_SNAPCHAT_CAMERA`, `SHARE_WITH_KIDS`, `SKYPE`, `SKYBLOG`, `SNAPCHAT`, `SONY_CONVERSATIONS`, `STUMBLEUPON`, `TELEGRAM`, `TEXT_MESSAGE`, `TUENTI`, `TUMBLR`, `TWITTER`, `UNKNOWN`, `VERIZON_MMS`, `VIBER`, `VKONTAKTE`, `WEB_SYSTEM_ACTIVITY_DIALOG`, `WECHAT`, `WEIBO`, `WHATS_APP`, `WHATS_APP_BUSINESS`, `WYKOP`, `YAHOO`, `YOUTUBE_COMMUNITY_POST`, `YOUTUBE_COMMUNITY_REPOST`, `YOUTUBE_GAMING`, `YOUTUBE_KIDS`, `YOUTUBE_MANGO`, `YOUTUBE_MUSIC`, `YTM_SHARE_TO_SNAPCHAT_PREVIEW`, `YOUTUBE_SHORTS_GREEN_SCREEN`, `YOUTUBE_TV`, `YOUTUBE_WATCH_WITH_FRIENDS`

---

## 10. Audience Retention

| Dimensi | Keterangan |
|---|---|
| `elapsedVideoTimeRatio` | Rasio bagian video yang sudah berjalan terhadap durasi total video. Nilai `0.4` berarti data menunjukkan retensi setelah 40% video berjalan. API mengembalikan **100 titik data** per video dengan rasio `0.01` sampai `1.0`. Interval antar titik seragam untuk setiap video: video 2 menit → 1,2 detik per titik; video 2 jam → 72 detik per titik. Nilai dimensi menandai **akhir eksklusif** interval |
| `audienceType` | **Filter saja.** Jenis trafik yang terkait data. Nilai: `ORGANIC`, `AD_INSTREAM`, `AD_INDISPLAY`. Data tersedia sejak **25 September 2013**; kueri tanpa filter ini berfungsi untuk tanggal setelah 1 Juli 2008 |

> Prinsip: laporan audience retention **wajib** memakai filter `video` dengan **satu ID saja**. Daftar ID dipisah koma tidak didukung pada laporan ini.

---

## 11. Live Streaming

| Dimensi | Keterangan |
|---|---|
| `livestreamPosition` | Menit tertentu selama stream video langsung. Metrik menunjukkan berapa banyak pengguna menonton pada saat itu |

Laporan concurrent viewers memakai dimensi ini (opsional, 0 atau 1) dan **wajib** memfilter `video`.

---

## 12. Pembatalan Membership

| Dimensi | Keterangan |
|---|---|
| `membershipsCancellationSurveyReason` | Alasan pengguna membatalkan membership channel selama periode laporan |

| Nilai | Arti |
|---|---|
| `UNKNOWN` | Pengguna tidak menyelesaikan survei |
| `DISLIKE_PERKS` | Pengguna tidak menyukai benefit membership |
| `PERKS_NOT_DELIVERED` | Benefit yang dijanjikan tidak diberikan |
| `CANNOT_ACCESS_PERKS` | Pengguna tidak bisa mengakses benefit |
| `NO_LONGER_INTERESTED` | Pengguna tidak lagi tertarik pada membership channel |
| `FEEL_UNAPPRECIATED` | Pengguna merasa tidak diapresiasi sebagai anggota |
| `FINANCIAL_REASONS` | Pembatalan karena alasan finansial |
| `JOIN_LIMITED_TIME` | Pengguna hanya berniat bergabung untuk waktu terbatas |
| `OTHER` | Alasan lain |

Metrik pasangannya: `membershipsCancellationSurveyResponses`.

---

## 13. Performa Iklan

| Dimensi | Keterangan |
|---|---|
| `adType` | Mengelompokkan metrik berdasarkan jenis iklan yang tayang selama pemutaran video |

| Nilai | Arti |
|---|---|
| `auctionBumperInstream` | Iklan video non-skippable hingga 6 detik, dibeli lewat lelang, wajib ditonton sebelum video |
| `auctionDisplay` | Iklan rich media/gambar sebagai overlay di bawah player, unit 300x250 di halaman watch, atau kombinasi keduanya. Overlay tertutup otomatis setelah beberapa saat dan bisa ditutup pengguna. Bila overlay dan banner tampil bersamaan, masing-masing dihitung sebagai impresi terpisah |
| `auctionInstream` | Iklan video non-skippable sebelum, selama, atau setelah video utama |
| `auctionTrueviewInslate` | Penonton memilih satu dari beberapa iklan video yang ditampilkan sebelum video |
| `auctionTrueviewInstream` | Iklan video skippable sebelum atau selama video utama |
| `auctionUnknown` | Iklan yang dibeli lewat lelang AdWords tetapi belum terklasifikasi |
| `reservedBumperInstream` | Iklan video non-skippable hingga 6 detik, dijual secara reserved |
| `reservedClickToPlay` | Iklan video yang harus diklik untuk mulai diputar. Impresi dicatat setiap unit click-to-play tampil, terlepas apakah pengguna memulai pemutaran. Dijual reserved |
| `reservedDisplay` | Iklan rich media/gambar (overlay atau 300x250), dijual reserved |
| `reservedInstream` | Iklan video non-skippable yang disisipkan sebelum, selama, atau setelah video utama |
| `reservedInstreamSelect` | — |
| `reservedMasthead` | Iklan besar di beranda, dapat memuat elemen video dan grafis |
| `reservedUnknown` | Iklan reserved yang belum terklasifikasi |
| `unknown` | YouTube tidak dapat mengklasifikasi jenis iklan ini |

Laporan performa iklan membutuhkan scope `yt-analytics-monetary.readonly` dan menerima metrik `grossRevenue`, `adImpressions`, `cpm`.

---

## 14. Dimensi Khusus Pemilik Konten

| Dimensi | Inti | Nilai | Keterangan |
|---|---|---|---|
| `claimedStatus` | Tidak | `claimed` (satu-satunya nilai valid) | Membatasi respons ke konten yang diklaim |
| `uploaderType` | Ya | `self`, `thirdParty` | Menentukan apakah respons memuat konten yang diunggah pemilik konten dan/atau pihak ketiga |

### Kombinasi `claimedStatus` × `uploaderType` yang didukung

| `claimedStatus` | `uploaderType` | Data yang diambil |
|---|---|---|
| *(tidak diset)* | `self` | Konten yang diunggah pemilik konten, baik yang diklaim maupun tidak |
| `claimed` | *(tidak diset)* | Konten yang diklaim, diunggah pemilik konten maupun pihak ketiga |
| `claimed` | `self` | Konten yang diklaim dan diunggah pemilik konten |
| `claimed` | `thirdParty` | Konten yang diklaim dan diunggah pihak ketiga |

Dalam parameter `filters`, kombinasi dituliskan dengan pemisah `;`:

```bash
--data-urlencode "filters=claimedStatus==claimed;uploaderType==self"
```

> Prinsip: **setiap** request laporan pemilik konten wajib memfilter data memakai `video`, `channel`, `group`, atau salah satu kombinasi di atas. Tanpa filter entitas, request ditolak.

Detail: [../guides/content-owner-reports.md](../guides/content-owner-reports.md).

---

## Selanjutnya

- Daftar metrik: [metric.md](metric.md)
- Kombinasi legal per laporan: [../guides/channel-reports.md](../guides/channel-reports.md)
- Aturan yang tidak boleh dilanggar: [../guides/dimensions-and-metrics.md](../guides/dimensions-and-metrics.md)
