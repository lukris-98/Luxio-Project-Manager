# Development Standards --- Maintainable Code, Semantic HTML, SEO & AdSense Growth

## Tujuan

Dokumen ini menjadi pedoman agar aplikasi/web dapat:

-   mudah dipahami developer/karyawan baru
-   mudah dirawat dan dikembangkan
-   menggunakan Semantic HTML
-   memiliki fondasi SEO teknis yang kuat
-   cepat dan accessible
-   siap dimonetisasi dengan Google AdSense
-   memiliki strategi mendapatkan traffic secara sehat
-   tidak mengorbankan security demi SEO atau monetisasi

> Target 1 bulan adalah membangun **fondasi dan traction**, bukan
> menjamin jumlah traffic atau pendapatan tertentu.

------------------------------------------------------------------------

# 1. Prinsip utama kode

Gunakan prinsip:

`Readable > clever`

Kode harus mudah dipahami developer berikutnya.

Hindari:

-   fungsi terlalu panjang
-   nama variabel tidak jelas
-   logic duplikat
-   magic number
-   komentar yang menjelaskan hal yang sudah jelas
-   dependency yang tidak diperlukan
-   abstraksi berlebihan

Prioritaskan kode yang sederhana dan eksplisit.

------------------------------------------------------------------------

# 2. Naming convention

Nama harus menjelaskan maksud.

Buruk:

``` text
d()
x()
data2()
handle()
```

Lebih baik:

``` text
createTarget()
updateProject()
targetDeadline()
handleTargetSubmit()
```

Nama file juga harus jelas.

Contoh:

``` text
target-form.vue
target-list.vue
project-service.rs
auth-middleware.rs
```

Gunakan convention yang konsisten di seluruh project.

------------------------------------------------------------------------

# 3. Struktur project

Pisahkan berdasarkan tanggung jawab.

Contoh:

``` text
src/
├── components/
├── pages/
├── layouts/
├── features/
│   ├── targets/
│   ├── projects/
│   ├── tasks/
│   └── notes/
├── services/
├── composables/
├── stores/
├── types/
└── utils/
```

Rust:

``` text
src/
├── routes/
├── handlers/
├── services/
├── repositories/
├── models/
├── middleware/
├── auth/
├── errors/
└── config/
```

Tujuannya agar karyawan baru cepat mengetahui:

> "Logic ini berada di mana?"

------------------------------------------------------------------------

# 4. Separation of concerns

Jangan mencampur:

-   UI
-   business logic
-   database access
-   authentication
-   AI
-   validation

Contoh:

``` text
Vue
  → UI

Rust Handler
  → HTTP/API

Rust Service
  → Business logic

Repository
  → Database

Neon
  → Persistence
```

------------------------------------------------------------------------

# 5. Dokumentasi untuk karyawan baru

Sediakan:

``` text
README.md
CONTRIBUTING.md
ARCHITECTURE.md
SECURITY.md
DATABASE.md
API.md
AI-AGENT.md
SEO.md
DEPLOYMENT.md
```

README minimal menjelaskan:

-   project ini apa
-   stack
-   cara install
-   cara menjalankan development
-   environment variables
-   cara test
-   cara build
-   cara deploy
-   struktur folder
-   kontak/owner project

------------------------------------------------------------------------

# 6. `.env.example`

Jangan membagikan secret.

Sediakan contoh:

``` text
DATABASE_URL=
AI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
```

Developer baru tinggal membuat `.env` sendiri.

------------------------------------------------------------------------

# 7. Semantic HTML

Gunakan elemen berdasarkan maknanya.

Utamakan:

``` html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
```

Untuk konten:

``` html
<h1>
<h2>
<h3>
<p>
<ul>
<ol>
<figure>
<figcaption>
```

Jangan membuat seluruh website dari:

``` html
<div>
<div>
<div>
```

jika elemen semantic yang sesuai tersedia.

------------------------------------------------------------------------

# 8. Heading hierarchy

Gunakan struktur:

``` text
H1
├── H2
│   ├── H3
│   └── H3
└── H2
```

Setiap halaman sebaiknya mempunyai satu top-level heading yang jelas.

Jangan memilih heading hanya karena tampilannya besar.

Gunakan CSS untuk ukuran visual.

------------------------------------------------------------------------

# 9. Semantic link dan button

Gunakan:

``` html
<a href="/target">Lihat Target</a>
```

untuk navigasi.

Gunakan:

``` html
<button type="button">Hapus</button>
```

untuk aksi.

Jangan membuat:

``` html
<div onclick="...">
```

sebagai pengganti button.

------------------------------------------------------------------------

# 10. Image SEO & accessibility

Gunakan:

``` html
<img
  src="..."
  alt="Rumah dua lantai di ..."
  width="..."
  height="..."
  loading="lazy"
/>
```

`alt` harus menjelaskan gambar jika gambar memiliki informasi penting.

Jangan melakukan keyword stuffing pada alt text.

------------------------------------------------------------------------

# 11. SEO dasar setiap halaman

Setiap halaman penting harus mempunyai:

-   title unik
-   meta description
-   canonical URL
-   heading yang jelas
-   URL bersih
-   internal links
-   structured data bila relevan
-   Open Graph metadata
-   sitemap inclusion jika halaman memang indexable

Contoh:

``` text
/title → spesifik
/target → bukan /page?id=123
```

------------------------------------------------------------------------

# 12. SEO jangan mengorbankan UX

Jangan membuat konten hanya untuk search engine.

Prioritas:

`User → usefulness → clarity → performance → SEO`

Bukan:

`keyword stuffing → traffic`

Konten harus benar-benar menjawab intent pengunjung.

------------------------------------------------------------------------

# 13. Internal linking

Buat hubungan antar konten.

Contoh:

``` text
Artikel A
 ↓
Tutorial B
 ↓
Template C
 ↓
Artikel D
```

Gunakan anchor text yang deskriptif.

Hindari terlalu banyak link yang tidak relevan.

------------------------------------------------------------------------

# 14. Sitemap & robots

Production harus mempunyai:

``` text
/sitemap.xml
/robots.txt
```

Sitemap hanya memasukkan URL yang memang ingin di-index.

Jangan memasukkan:

-   halaman login
-   dashboard private
-   URL sementara
-   halaman duplicate
-   endpoint API

------------------------------------------------------------------------

# 15. Structured data

Gunakan Schema.org sesuai jenis konten.

Contoh:

-   Article
-   BreadcrumbList
-   Product
-   Organization
-   WebSite
-   FAQPage jika memang memenuhi pedoman dan kontennya benar-benar FAQ

Jangan membuat structured data palsu atau menandai informasi yang tidak
terlihat/relevan di halaman.

------------------------------------------------------------------------

# 16. Performance / Core Web Vitals

Targetkan pengalaman cepat.

Perhatikan:

-   LCP
-   INP
-   CLS

Praktik:

-   compress image
-   WebP/AVIF jika cocok
-   lazy loading
-   code splitting
-   caching
-   minimalkan JavaScript
-   hindari layout shift
-   gunakan CDN
-   optimalkan font

UI bagus tetapi lambat tetap buruk untuk user dan SEO.

------------------------------------------------------------------------

# 17. Accessibility

Minimal:

-   keyboard navigation
-   visible focus
-   label form
-   contrast yang baik
-   alt text
-   semantic HTML
-   aria hanya ketika diperlukan
-   error message yang jelas

Gunakan semantic HTML terlebih dahulu sebelum menambahkan ARIA.

------------------------------------------------------------------------

# 18. URL & routing

Gunakan URL yang:

-   pendek
-   deskriptif
-   stabil
-   mudah dibaca

Contoh:

``` text
/target/renovasi-rumah
/project/omahku-properti
/blog/cara-membuat-target
```

Hindari URL yang penuh parameter jika tidak diperlukan.

Jangan sering mengubah URL yang sudah mendapatkan traffic tanpa redirect
yang benar.

------------------------------------------------------------------------

# 19. SEO untuk aplikasi Vue

Jika halaman publik membutuhkan organic search, pastikan crawler dapat
memperoleh konten penting.

Pertimbangkan:

-   SSR
-   SSG
-   prerendering

untuk halaman publik yang SEO-critical.

Dashboard private tidak perlu dipaksakan menjadi SEO page.

------------------------------------------------------------------------

# 20. Konten untuk mendapatkan traffic

Jangan hanya membuat halaman aplikasi.

Buat konten yang menjawab kebutuhan calon pengguna.

Contoh strategi:

``` text
Problem
 ↓
Artikel/tutorial
 ↓
Tool/template
 ↓
Landing page
 ↓
Registrasi
 ↓
Penggunaan aplikasi
```

Contoh:

> "Cara membuat target kerja mingguan"

↓

Template target

↓

Aplikasi untuk mengelola target

------------------------------------------------------------------------

# 21. Strategi traffic 1 bulan

## Minggu 1 --- Fondasi

Fokus:

-   technical SEO
-   sitemap
-   robots.txt
-   Search Console
-   analytics
-   performance
-   semantic HTML
-   metadata
-   canonical
-   mobile responsiveness
-   halaman About
-   Contact
-   Privacy Policy
-   Terms

Target:

> Website siap ditemukan dan dipercaya.

------------------------------------------------------------------------

## Minggu 2 --- Konten

Buat konten berdasarkan search intent.

Prioritaskan:

-   long-tail keyword
-   tutorial
-   problem-solving
-   template
-   comparison
-   FAQ
-   use case

Jangan mengejar volume artikel dengan konten tipis.

Target:

> Memiliki beberapa konten yang benar-benar berguna.

------------------------------------------------------------------------

## Minggu 3 --- Distribusi

Sebarkan konten secara natural melalui:

-   YouTube
-   TikTok/Reels
-   X
-   Facebook
-   komunitas relevan
-   newsletter
-   internal linking

Gunakan satu konten menjadi beberapa format.

Contoh:

``` text
1 artikel
→ 1 video YouTube
→ 3 short video
→ 3 posting sosial
→ 1 carousel
```

------------------------------------------------------------------------

## Minggu 4 --- Optimasi

Periksa:

-   query Search Console
-   halaman dengan impression tinggi tetapi CTR rendah
-   halaman yang mulai ranking
-   halaman dengan engagement rendah
-   Core Web Vitals
-   broken links
-   crawl/indexing issues

Update konten yang sudah mendapatkan impression.

Jangan hanya terus menerbitkan artikel baru.

------------------------------------------------------------------------

# 22. AdSense readiness

Untuk monetisasi, jangan membangun website dengan tujuan:

> "Pasang iklan sebanyak mungkin."

Prioritas:

`Content quality + user experience + original value`

Siapkan halaman:

-   About
-   Contact
-   Privacy Policy
-   Terms
-   informasi publisher/company bila relevan

Pastikan konten:

-   original
-   bermanfaat
-   tidak menipu
-   tidak melanggar kebijakan
-   tidak dibuat hanya untuk iklan
-   memiliki navigasi yang jelas

Approval dan pendapatan AdSense tidak dapat dijamin hanya dalam satu
bulan.

------------------------------------------------------------------------

# 23. Penempatan iklan

Jika sudah disetujui, jangan mengorbankan UX.

Hindari:

-   iklan menutupi konten
-   terlalu banyak iklan
-   deceptive placement
-   tombol yang terlihat seperti iklan
-   layout yang membuat user salah klik

Pantau:

-   RPM
-   CTR
-   page views
-   engagement
-   bounce/engagement metrics
-   Core Web Vitals

Optimasi berdasarkan data.

------------------------------------------------------------------------

# 24. Traffic yang sehat

Jangan membeli traffic bot atau menggunakan metode manipulatif.

Hindari:

-   klik iklan sendiri
-   meminta orang mengklik iklan
-   traffic bot
-   traffic exchange berkualitas rendah
-   spam backlink
-   cloaking
-   keyword stuffing

Traffic yang sedikit tetapi relevan lebih berharga daripada traffic
besar yang tidak berkualitas.

------------------------------------------------------------------------

# 25. Content SEO formula

Untuk setiap artikel:

``` text
Search intent
↓
Judul yang jelas
↓
Jawaban cepat
↓
Penjelasan mendalam
↓
Contoh
↓
Visual
↓
Internal links
↓
CTA relevan
```

Jangan memaksakan keyword berkali-kali.

Gunakan istilah yang memang natural dalam pembahasan.

------------------------------------------------------------------------

# 26. Programmatic SEO harus hati-hati

Jika aplikasi menghasilkan ribuan halaman otomatis, jangan langsung
mengindex semuanya.

Index hanya halaman yang:

-   memiliki nilai unik
-   memiliki konten cukup
-   bermanfaat untuk user
-   tidak duplicate
-   mempunyai search intent yang jelas

Banyak halaman tipis tidak otomatis berarti banyak traffic.

------------------------------------------------------------------------

# 27. Analytics & measurement

Pantau minimal:

-   users
-   sessions
-   page views
-   acquisition
-   search queries
-   CTR
-   conversions
-   signups
-   activation
-   retention

Buat event penting:

``` text
view_article
signup
create_project
create_target
use_ai_agent
complete_task
```

------------------------------------------------------------------------

# 28. Karyawan baru: Definition of Done

Sebuah fitur dianggap selesai jika:

-   [ ] UI responsive
-   [ ] semantic HTML
-   [ ] accessibility dasar
-   [ ] validation frontend
-   [ ] validation backend
-   [ ] authorization
-   [ ] error handling
-   [ ] loading state
-   [ ] empty state
-   [ ] security review
-   [ ] SEO metadata jika public
-   [ ] analytics event jika diperlukan
-   [ ] test
-   [ ] dokumentasi diperbarui

------------------------------------------------------------------------

# 29. Prinsip untuk AI coding

Jika menggunakan AI/vibe coding:

1.  Minta AI membaca `README.md`
2.  Minta AI membaca `ARCHITECTURE.md`
3.  Minta AI mengikuti naming convention
4.  Minta AI tidak membuat dependency baru tanpa alasan
5.  Minta AI tidak mengubah security boundary
6.  Minta AI membuat test
7.  Review diff sebelum merge

AI harus mengikuti arsitektur project, bukan menciptakan arsitektur baru
setiap kali membuat fitur.

------------------------------------------------------------------------

# 30. Standar akhir project

Target akhirnya:

``` text
Readable Code
      +
Semantic HTML
      +
Accessibility
      +
Technical SEO
      +
Fast Performance
      +
Quality Content
      +
Analytics
      +
Security
      +
Good UX
      ↓
Sustainable Growth
```

## Prinsip paling penting

**Jangan mengejar "SEO tinggi" dengan trik.**

Bangun:

> **Website yang cepat, mudah dipahami, mudah diakses, kontennya
> berguna, aman, dan benar-benar menyelesaikan masalah user.**

SEO, traffic, dan monetisasi kemudian menjadi hasil dari fondasi
tersebut, bukan pengganti fondasi.
