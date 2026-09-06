/* ============================================================
   DATA.JS — Semua data perbandingan (dipisah dari logika render)
   Struktur:
   - KRITERIA: daftar kriteria + penjelasan setiap kriteria
   - DATA:     isi tabel perbandingan
   - STORAGE:  tabel perbandingan penyedia storage gratis
   - GLOSARIUM: daftar istilah

   Setiap item perbandingan punya:
   {
     name:   "React",              // nama teknologi
     about:  "...",                // penjelasan: apa itu + fungsinya
     scores: [{ v: 7, why: "..."}] // v = poin 1-10, why = alasan poin
   }
   ============================================================ */

"use strict";

/* ---------- 1. KRITERIA + PENJELASAN SETIAP KRITERIA ---------- */
const KRITERIA = {
  frontend: [
    { label: "Performa runtime",      desc: "Seberapa cepat framework merender/memperbarui tampilan saat data berubah. Diukur dari kecepatan manipulasi DOM & sistem reaktivitas." },
    { label: "Ekosistem/library",     desc: "Jumlah library, komponen, dan tools siap pakai. Ekosistem besar = tidak perlu membuat semuanya dari nol." },
    { label: "Kurva belajar",         desc: "Seberapa mudah & cepat pemula bisa produktif. Semakin tinggi poin, semakin landai kurva belajarnya." },
    { label: "Pasar kerja",           desc: "Banyaknya lowongan pekerjaan & permintaan industri. Semakin tinggi, semakin mudah cari kerja." },
    { label: "Komunitas & dukungan",  desc: "Besarnya komunitas developer, forum, dan kecepatan mendapat bantuan saat mengalami masalah." },
    { label: "Type Safety (TS)",      desc: "Kemampuan mendeteksi kesalahan tipe data sejak menulis kode (dengan TypeScript). Mencegah bug runtime." },
    { label: "Kecepatan development", desc: "Seberapa cepat menulis fitur baru sampai jadi. Dipengaruhi syntax, tools, dan boilerplate." },
    { label: "Bundle size",           desc: "Ukuran file JavaScript yang dikirim ke browser. Kecil = loading lebih cepat, terutama di HP." },
    { label: "SEO-friendliness",      desc: "Kemampuan halaman terindeks Google dengan baik. SSR/SSG lebih ramah SEO daripada SPA murni." },
    { label: "Tooling & DX",          desc: "Kualitas developer experience: hot reload, debugger, error message, CLI, ekstensi editor." },
    { label: "Mobile development",    desc: "Kemampuan framework dipakai juga untuk membuat aplikasi mobile (iOS/Android)." },
    { label: "Maturitas & stabilitas",desc: "Umur teknologi, stabilitas API, dan bukti dipakai produksi skala besar dalam waktu lama." }
  ],
  backend: [
    { label: "Performa mentah",       desc: "Kecepatan eksekusi kode mentah. Dipengaruhi kompilasi vs interpretasi, dan efisiensi runtime." },
    { label: "Memory safety",         desc: "Keamanan pengelolaan memori: seberapa sulit terjadi bug seperti memory leak atau crash." },
    { label: "Concurrency",           desc: "Kemampuan menangani banyak tugas/request bersamaan. Kunci untuk server melayani ribuan user." },
    { label: "Ekosistem/library",     desc: "Banyaknya package backend: framework web, ORM, auth, queue, dan sebagainya." },
    { label: "Kurva belajar",         desc: "Seberapa cepat developer baru bisa produktif membangun backend." },
    { label: "Pasar kerja",           desc: "Banyaknya lowongan backend & permintaan industri terhadap bahasa ini." },
    { label: "Kecepatan development", desc: "Seberapa cepat menulis fitur backend: migrasi, validasi, API, dsb." },
    { label: "Type safety (built-in)",desc: "Bahasa punya tipe statis bawaan yang menangkap error sebelum runtime." },
    { label: "Deployment & DevOps",   desc: "Kemudahan membangun, mengemas, dan mendeploy ke server/cloud." },
    { label: "Web framework populer", desc: "Kematangan framework web utama di ekosistem bahasa tersebut." },
    { label: "Komunitas & dokumentasi",desc: "Kelengkapan dokumentasi resmi, contoh, dan komunitas pemberi bantuan." },
    { label: "Scaling horizontal",    desc: "Kemudahan menambah banyak server untuk menangani beban naik." }
  ],
  database: [
    { label: "Performa query kompleks", desc: "Kecepatan menangani query yang rumit: JOIN banyak tabel, agregasi, subquery." },
    { label: "Relasional/struktur",     desc: "Kemampuan menyimpan data terstruktur dengan relasi antar tabel & constraint." },
    { label: "Fleksibilitas skema",     desc: "Kemudahan mengubah struktur data tanpa migrasi besar-besaran." },
    { label: "Ekstensi & fitur lanjutan",desc: "Fitur tambahan: geospasial, vector search, full-text, JSON, dsb." },
    { label: "Kemudahan setup",         desc: "Seberapa cepat install & jalan. Semakin tinggi, semakin nol konfigurasi." },
    { label: "Performa baca",           desc: "Kecepatan operasi membaca data (SELECT). Penting untuk aplikasi banyak baca." },
    { label: "Performa tulis",          desc: "Kecepatan operasi menulis data (INSERT/UPDATE). Penting untuk aplikasi banyak input." },
    { label: "ACID compliance",         desc: "Jaminan transaksi aman: Atomic, Consistent, Isolated, Durable. Krusial untuk data keuangan." },
    { label: "Replikasi & HA",          desc: "Kemampuan membuat salinan data (replica) & high availability saat server gagal." },
    { label: "Ekosistem tools",         desc: "Tools pendukung: GUI, backup, monitoring, ORM yang kompatibel." },
    { label: "Full-text search",        desc: "Kemampuan mencari teks di dalam data (mis. pencarian artikel) tanpa layanan terpisah." },
    { label: "JSON/document support",   desc: "Kemampuan menyimpan & query data format JSON/doc langsung di database." }
  ],
  stack: [
    { label: "Performa keseluruhan",   desc: "Kecepatan & efisiensi gabungan frontend + backend + database." },
    { label: "Type safety end-to-end", desc: "Tipe data konsisten dari database, API, sampai frontend — error terdeteksi sejak awal." },
    { label: "Kecepatan build app",    desc: "Seberapa cepat dari ide jadi aplikasi jadi (time-to-market)." },
    { label: "Ekosistem & library",    desc: "Kekayaan library di seluruh lapisan stack." },
    { label: "Kurva belajar tim",      desc: "Seberapa cepat tim (bukan perorangan) bisa produktif dengan stack ini." },
    { label: "Pasar kerja",            desc: "Banyaknya developer yang menguasai stack ini (mudah rekrut/ganti orang)." },
    { label: "Deployment mudah",       desc: "Kemudahan mendeploy seluruh stack ke cloud/hosting." },
    { label: "Scalability",            desc: "Kemampuan menangani pertumbuhan user & data tanpa rombak total." },
    { label: "SEO-friendliness",       desc: "Kemampuan frontend stack terindeks baik oleh mesin pencari." },
    { label: "Komunitas & job market", desc: "Dukungan komunitas & ketersediaan tenaga kerja." },
    { label: "Mobile (React Native)",  desc: "Seberapa mudah stack menghasilkan aplikasi mobile juga." },
    { label: "Maturitas & production-ready", desc: "Bukti stack dipakai produksi skala besar secara stabil." }
  ],
  runtime: [
    { label: "Ease of use",           desc: "Kemudahan mulai pakai & mengelola platform ini." },
    { label: "Scalability",           desc: "Kemampuan menambah kapasitas otomatis saat beban naik." },
    { label: "Cost effective",        desc: "Seberapa hemat biaya, termasuk gratis-tier yang tersedia." },
    { label: "Cold start",            desc: "Kecepatan pertama kali merespons setelah idle. Rendah = lambat memulai." },
    { label: "Fleksibilitas & kontrol",desc: "Kebebasan mengatur infrastruktur & menjalankan apa pun yang diinginkan." },
    { label: "Global edge network",   desc: "Jangkauan server di banyak negara — semakin dekat ke user, semakin cepat." },
    { label: "Ekosistem & integrasi", desc: "Kemudahan terhubung dengan tools lain (CI/CD, monitoring, cloud)." },
    { label: "Dokumentasi & community",desc: "Kelengkapan dokumentasi dan komunitas pengguna." }
  ],
  dbaas: [
    { label: "Free tier",             desc: "Kemurahan paket gratis: berapa GB/kuota dan fitur apa saja yang gratis." },
    { label: "Performa",              desc: "Kecepatan query & infrastruktur yang disediakan penyedia." },
    { label: "Branching (DB versioning)", desc: "Kemampuan membuat cabang database (seperti git) untuk dev/preview/test." },
    { label: "Scale to zero",         desc: "Kemampuan database 'tidur' saat tidak dipakai agar tidak bayar — hidup otomatis saat dipakai." },
    { label: "Ekosistem tools",       desc: "Layanan pendukung: auth, storage, realtime, dashboard, backup." },
    { label: "Jenis database",        desc: "Engine database yang mendasarinya (Postgres/MySQL/Mongo/distributed)." },
    { label: "Kemudahan setup",       desc: "Seberapa cepat membuat database pertama & terhubung ke aplikasi." },
    { label: "Pricing predictability",desc: "Biaya yang mudah diprediksi tanpa kejutan tagihan." }
  ],
  storage: [
    { label: "Kuota gratis",            desc: "Jumlah penyimpanan gratis yang diberikan tanpa bayar." },
    { label: "Maks ukuran file",        desc: "Batas maksimum ukuran satu file yang bisa diupload." },
    { label: "Masa simpan file",        desc: "Berapa lama file tersimpan — permanen atau sementara (auto-hapus)." },
    { label: "API/SDK (bucket)",        desc: "Kemampuan akses programatik lewat API/SDK untuk integrasi aplikasi (true bucket)." },
    { label: "Link sharing langsung",   desc: "Kemudahan membagikan file lewat link langsung ke pengguna lain." },
    { label: "Keamanan & enkripsi",     desc: "Tingkat keamanan: enkripsi, autentikasi, kontrol akses." },
    { label: "Kecepatan upload",        desc: "Kecepatan mengunggah file, termasuk dari Indonesia." },
    { label: "Tanpa akun (anonymous)",  desc: "Kemampuan upload langsung tanpa perlu mendaftar akun." }
  ]
};

/* ---------- 2. DATA PERBANDINGAN ---------- */
const DATA = {
  /* ================= FRONTEND ================= */
  frontend: {
    title: "Perbandingan Bahasa Frontend",
    subtitle: "Library & framework untuk membangun antarmuka pengguna di browser",
    winner: "React (98 poin) — ekosistem terbesar & pasar kerja terbanyak",
    note: "Next.js (92) menang di SEO. Svelte/Solid unggul di bundle size & performa murni.",
    items: [
      {
        name: "React",
        about: "Library UI dari Meta untuk membangun antarmuka berbasis komponen. Fungsinya: web interaktif/SPA, mobile via React Native, desktop via Electron.",
        scores: [
          { v: 7,  why: "Virtual DOM cukup cepat untuk kebanyakan app, tapi bukan tercepat." },
          { v: 10, why: "npm terbesar; ribuan library, komponen, dan template siap pakai." },
          { v: 7,  why: "JSX & hooks butuh waktu, tapi materi belajarnya sangat banyak." },
          { v: 10, why: "Lowongan React paling banyak dibanding frontend lain." },
          { v: 10, why: "Komunitas terbesar di dunia, jawaban masalah selalu ada." },
          { v: 9,  why: "React + TypeScript sangat matang dan banyak dipakai produksi." },
          { v: 7,  why: "Cepat, tapi manajemen state (Redux/Zustand) menambah langkah." },
          { v: 5,  why: "React + dependency cukup besar (~150KB) sebelum di-minify." },
          { v: 4,  why: "SPA murni kurang ramah SEO tanpa bantuan SSR (Next.js)." },
          { v: 9,  why: "Vite, React DevTools, hot reload — DX kelas atas." },
          { v: 10, why: "React Native: satu bahasa untuk web + iOS + Android." },
          { v: 10, why: "10+ tahun, dipakai raksasa (Meta, Netflix, Airbnb)." }
        ]
      },
      {
        name: "Vue",
        about: "Framework progresif dari Evan You, bisa diadopsi bertahap. Fungsinya: dari widget kecil hingga SPA penuh; SSR via Nuxt.",
        scores: [
          { v: 7,  why: "Performa baik, setara React untuk kebanyakan kasus." },
          { v: 8,  why: "Ekosistem cukup besar (Vue Router, Pinia, Nuxt, Vuetify)." },
          { v: 9,  why: "Paling landai; template HTML biasa mudah dimengerti." },
          { v: 7,  why: "Banyak lowongan (Asia kuat), tapi kalah dari React global." },
          { v: 8,  why: "Komunitas solid, dokumentasi resmi terbaik di kelasnya." },
          { v: 8,  why: "TypeScript support baik lewat <script setup lang='ts'>." },
          { v: 9,  why: "Template & Composition API membuat penulisan fitur cepat." },
          { v: 6,  why: "Ukuran sedang; kompiler menghasilkan bundle lebih kecil dari React." },
          { v: 5,  why: "SPA butuh Nuxt untuk SEO penuh." },
          { v: 9,  why: "Vue DevTools & CLI/devtools sangat membantu." },
          { v: 7,  why: "NativeScript-Vue / Quasar untuk mobile, tapi kurang matang." },
          { v: 8,  why: "9+ tahun, dipakai oleh banyak perusahaan besar (GitLab, Alibaba)." }
        ]
      },
      {
        name: "Angular",
        about: "Framework lengkap dari Google, wajib TypeScript, berbasis component + module. Fungsinya: aplikasi enterprise SPA, dashboard kompleks.",
        scores: [
          { v: 7,  why: "Performa baik berkat change detection & AOT compile." },
          { v: 9,  why: "Ekosistem lengkap: Material, RxJS, banyak library enterprise." },
          { v: 4,  why: "Konsep module, DI, RxJS cukup berat untuk pemula." },
          { v: 8,  why: "Banyak lowongan di perusahaan besar/enterprise." },
          { v: 8,  why: "Didukung Google, komunitas enterprise kuat." },
          { v: 10, why: "TypeScript wajib + strict — keamanan tipe paling ketat." },
          { v: 5,  why: "Boilerplate (module, service, component) memperlambat penulisan." },
          { v: 4,  why: "Bundle besar karena framework lengkap + zone.js." },
          { v: 5,  why: "SPA murni; butuh Angular Universal untuk SEO." },
          { v: 9,  why: "CLI, Angular DevTools, struktur kaku = DX konsisten." },
          { v: 8,  why: "Ionic + Capacitor matang untuk mobile hybrid." },
          { v: 9,  why: "13+ tahun, standar enterprise dengan upgrade terjadwal (semesteran)." }
        ]
      },
      {
        name: "Svelte",
        about: "Framework yang mengompilasi kode jadi JavaScript vanilla — tanpa runtime framework di browser. Fungsinya: web cepat & kecil, sangat interaktif.",
        scores: [
          { v: 9,  why: "Tanpa Virtual DOM, hasil kompilasi sangat efisien." },
          { v: 5,  why: "Ekosistem lebih kecil; SvelteKit & library terbatas." },
          { v: 9,  why: "Syntax .svelte (HTML+JS+CSS) paling mudah dimengerti." },
          { v: 3,  why: "Lowongan masih sedikit dibanding React/Vue." },
          { v: 5,  why: "Komunitas kecil tapi antusias (Rich Harris & tim)." },
          { v: 7,  why: "TypeScript support baik, tapi DX tipe sedikit kurang ketat." },
          { v: 10, why: "Sedikit boilerplate — menulis fitur sangat cepat." },
          { v: 9,  why: "Bundle terkecil di kelasnya (bisa < 10KB)." },
          { v: 5,  why: "SSR via SvelteKit; SPA murni sama kurang ramah SEO." },
          { v: 7,  why: "Vite native; devtools cukup, belum se-kaya React." },
          { v: 4,  why: "Mobile butuh Svelte Native — masih niche." },
          { v: 6,  why: "8 tahun; stabil tapi belum sekelas React dalam jangka panjang." }
        ]
      },
      {
        name: "Solid",
        about: "Framework performa tercepat tanpa Virtual DOM, pakai signal-based reactivity. Fungsinya: dashboard real-time, animasi berat, bundle kecil.",
        scores: [
          { v: 10, why: "Juara benchmark JS framework berkat fine-grained reactivity." },
          { v: 3,  why: "Ekosistem muda & terbatas; library komunitas sedikit." },
          { v: 6,  why: "Mirip React (JSX) tapi konsep signal perlu adaptasi." },
          { v: 1,  why: "Hampir tidak ada lowongan kerja khusus Solid." },
          { v: 3,  why: "Komunitas kecil namun developer-nya aktif." },
          { v: 9,  why: "TypeScript support sangat baik." },
          { v: 8,  why: "Kode ringkas; reaktivitas otomatis mempercepat fitur." },
          { v: 9,  why: "Bundle kecil tanpa runtime overhead." },
          { v: 4,  why: "SPA murni, SEO butuh bantuan tambahan." },
          { v: 5,  why: "Tooling cukup (Vite + Solid DevTools) tapi terbatas." },
          { v: 2,  why: "Mobile belum ada jalur resmi yang matang." },
          { v: 3,  why: "Masih muda (2021); belum terbukti produksi jangka panjang." }
        ]
      },
      {
        name: "Next.js",
        about: "React framework produksi dari Vercel: SSR, SSG, ISR, API Routes, App Router. Fungsinya: web SEO-friendly, full-stack, e-commerce, marketing site.",
        scores: [
          { v: 7,  why: "Performa React + optimasi gambar & edge runtime." },
          { v: 10, why: "Mewarisi ekosistem React + banyak plugin Next.js." },
          { v: 6,  why: "Konsep App Router/Server Component butuh waktu paham." },
          { v: 9,  why: "Lowongan Next.js terus bertambah pesat." },
          { v: 9,  why: "Komunitas besar; dukungan Vercel kuat." },
          { v: 9,  why: "TypeScript first-class dari template resmi." },
          { v: 7,  why: "Cepat untuk CRUD; kompleksitas naik di fitur berat." },
          { v: 5,  why: "Bundle React besar + server runtime." },
          { v: 10, why: "SSR/SSG/ISR = SEO terbaik untuk React." },
          { v: 9,  why: "CLI, hot reload, preview deployments — DX unggul." },
          { v: 3,  why: "Mobile tetap lewat React Native terpisah." },
          { v: 8,  why: "6+ tahun, dipakai Vercel, TikTok, banyak startup." }
        ]
      }
    ]
  },

  /* ================= BACKEND ================= */
  backend: {
    title: "Perbandingan Bahasa Backend",
    subtitle: "Bahasa untuk membangun server, API, dan logika di sisi server",
    winner: "Go (101 poin) — performa tinggi, concurrency built-in, deploy mudah",
    note: "Node.js (96) unggul ekosistem & kecepatan. Rust (85) unggul performa & memory safety.",
    items: [
      {
        name: "Rust",
        about: "Bahasa sistem memory-safe tanpa garbage collector. Fungsinya: backend performa kritis (Axum), sistem, CLI tools. Dipakai Luxio.",
        scores: [
          { v: 10, why: "Kecepatan setara C/C++ berkat kompilasi LLVM." },
          { v: 10, why: "Ownership/borrow checker mencegah kebocoran memori saat kompilasi." },
          { v: 9,  why: "Async (tokio) + thread aman untuk banyak request." },
          { v: 6,  why: "Ekosistem tumbuh pesat (crates.io) tapi belum seluas JS/Python." },
          { v: 3,  why: "Kurva paling curam; borrow checker menantang pemula." },
          { v: 5,  why: "Lowongan mulai naik tapi masih niche dibanding Java/Python." },
          { v: 4,  why: "Detail ownership/lifetime memperlambat penulisan fitur." },
          { v: 10, why: "Type system + ownership = keamanan tipe & memori terkuat." },
          { v: 6,  why: "Binary statis bagus, tapi build system & cross-compile butuh usaha." },
          { v: 7,  why: "Axum/Rocket matang dan sangat performa." },
          { v: 7,  why: "Dokumentasi 'The Book' luar biasa; komunitas solid." },
          { v: 8,  why: "Mudah menjalankan banyak instance ringan." }
        ]
      },
      {
        name: "Go",
        about: "Bahasa dari Google: kompilasi, static typing, concurrency built-in (goroutine). Fungsinya: backend API, microservices, CLI, infrastructure.",
        scores: [
          { v: 9,  why: "Performa tinggi, mendekati C dengan GC efisien." },
          { v: 7,  why: "GC aman; tanpa pointer liar — jarang bocor memori." },
          { v: 10, why: "Goroutine + channel = concurrency termudah & terbaik." },
          { v: 8,  why: "Ekosistem kuat: Gin, Echo, gRPC, banyak tool cloud." },
          { v: 8,  why: "Syntax sederhana; 2-3 hari sudah produktif." },
          { v: 8,  why: "Permintaan tinggi di startup & cloud companies." },
          { v: 7,  why: "Cepat; tanpa framework wajib, kode tetap bersih." },
          { v: 8,  why: "Static typing bawaan; tak ada cast diam-diam." },
          { v: 10, why: "Kompilasi jadi 1 binary statis — deploy tinggal copy." },
          { v: 8,  why: "Gin/Echo matang; standar net/http juga cukup." },
          { v: 8,  why: "Dokumentasi resmi rapi; komunitas besar (Docker/K8s di Go)." },
          { v: 10, why: "Goroutine murah — mudah scale ke ribuan koneksi." }
        ]
      },
      {
        name: "Node.js (TS)",
        about: "Runtime JavaScript di server (V8) + TypeScript. Fungsinya: API, real-time, microservices. Satu bahasa dengan frontend.",
        scores: [
          { v: 6,  why: "Cukup cepat untuk kebanyakan app; event loop efisien untuk I/O." },
          { v: 5,  why: "GC handle memori; risiko di callback/async yang salah." },
          { v: 7,  why: "Event loop + worker threads; baik untuk I/O-bound." },
          { v: 10, why: "npm terbesar; hampir semua yang dibutuhkan sudah ada." },
          { v: 8,  why: "Mudah bagi developer frontend; TS menambah disiplin." },
          { v: 9,  why: "Lowongan full-stack JS/TS sangat banyak." },
          { v: 10, why: "Prototype & iterasi sangat cepat; ekosistem scaffolding lengkap." },
          { v: 7,  why: "TS memberi tipe, tapi runtime tetap dinamis (any bisa lolos)." },
          { v: 8,  why: "Deploy mudah (Vercel/Node/PM2); banyak platform servernya." },
          { v: 10, why: "Express/Next/Fastify/Hono — pilihan framework sangat banyak." },
          { v: 10, why: "Komunitas terbesar; Stack Overflow & tutorial melimpah." },
          { v: 6,  why: "Single thread — beban CPU berat butuh cluster/worker." }
        ]
      },
      {
        name: "Python",
        about: "Bahasa high-level interpreted, syntax bersih, multi-paradigma. Fungsinya: web (Django/FastAPI), AI/ML, automation, scraping.",
        scores: [
          { v: 4,  why: "Interpreted + GIL — lebih lambat untuk komputasi berat." },
          { v: 5,  why: "GC & tipe dinamis; risiko bug runtime lebih tinggi." },
          { v: 4,  why: "GIL membatasi thread paralel; asyncio membantu I/O saja." },
          { v: 9,  why: "Raja AI/ML (NumPy, Pandas, TensorFlow) + web lengkap." },
          { v: 10, why: "Paling mudah dipelajari; syntax seperti bahasa Inggris." },
          { v: 8,  why: "Banyak lowongan, terutama data/AI/backend." },
          { v: 9,  why: "Menulis fitur cepat dengan FastAPI/Django." },
          { v: 4,  why: "Tipe dinamis; type hints opsional (tidak dijalankan runtime)." },
          { v: 7,  why: "Mudah dengan Docker; banyak PaaS mendukung (Render, HF)." },
          { v: 8,  why: "FastAPI (ASGI) & Django matang." },
          { v: 9,  why: "Dokumentasi & komunitas sangat besar." },
          { v: 4,  why: "GIL & bobot interpreter menyulitkan scale murni." }
        ]
      },
      {
        name: "Java",
        about: "Bahasa enterprise (JVM) object-oriented. Fungsinya: backend enterprise (Spring Boot), Android, big data (Hadoop/Spark).",
        scores: [
          { v: 8,  why: "JIT di JVM membuat performa stabil tinggi." },
          { v: 6,  why: "GC aman, tapi overhead memori lebih besar." },
          { v: 7,  why: "Thread & virtual threads (Loom) cukup kuat." },
          { v: 9,  why: "Ekosistem enterprise sangat kaya (Spring, Hibernate, Maven)." },
          { v: 5,  why: "Verbose; banyak boilerplate (getter/setter, config)." },
          { v: 10, why: "Backbone perusahaan besar di seluruh dunia." },
          { v: 5,  why: "Verbose + build tool memperlambat penulisan." },
          { v: 9,  why: "Static typing kuat + null-safety modern." },
          { v: 8,  why: "Fat JAR/Docker; maturity deployment tinggi." },
          { v: 8,  why: "Spring Boot standar enterprise yang sangat matang." },
          { v: 9,  why: "Dokumentasi & komunitas enterprise sangat luas." },
          { v: 8,  why: "JVM + Spring mudah di-scale horizontal." }
        ]
      },
      {
        name: ".NET (C#)",
        about: "Ekosistem Microsoft: bahasa C# + runtime .NET. Fungsinya: web (ASP.NET), desktop, game (Unity), mobile (.NET MAUI).",
        scores: [
          { v: 8,  why: "Compiled ke IL + JIT — performa sangat baik." },
          { v: 7,  why: "GC aman; .NET 8+ makin efisien memori." },
          { v: 8,  why: "Async/await & task-based concurrency matang." },
          { v: 9,  why: "Ekosistem Microsoft + NuGet yang sangat lengkap." },
          { v: 6,  why: "Sedang; tooling VS membantu tapi konsep cukup banyak." },
          { v: 8,  why: "Banyak lowongan enterprise (bank, korporasi)." },
          { v: 6,  why: "Cepat dengan template, tapi setup enterprise berlapis." },
          { v: 9,  why: "C# static typing kuat + nullable reference types." },
          { v: 8,  why: "dotnet publish → deploy ke Windows/Linux/container mudah." },
          { v: 8,  why: "ASP.NET Core modern, lintas platform, performa tinggi." },
          { v: 8,  why: "Microsoft docs lengkap; komunitas enterprise besar." },
          { v: 8,  why: "ASP.NET Core scale horizontal dengan mudah." }
        ]
      },
      {
        name: "Ruby",
        about: "Bahasa berfilosofi 'developer happiness'. Fungsinya: web dengan Ruby on Rails — produktivitas tinggi dari ide ke launching.",
        scores: [
          { v: 3,  why: "Interpreted — lebih lambat untuk beban besar." },
          { v: 4,  why: "GC & tipe dinamis; rentan bug runtime." },
          { v: 3,  why: "GIL membatasi paralelisme thread CPU." },
          { v: 7,  why: "Rails ekosistem lengkap, tapi gem lain terbatas." },
          { v: 9,  why: "Syntax paling menyenangkan; Rails convention-friendly." },
          { v: 4,  why: "Lowongan menurun, masih ada di startup Rails." },
          { v: 9,  why: "Rails scaffolding membuat fitur CRUD super cepat." },
          { v: 3,  why: "Dynamic typing murni; no built-in type safety." },
          { v: 6,  why: "Deploy Rails butuh tuning (Puma, asset pipeline)." },
          { v: 6,  why: "Rails matang, tapi framework lain jarang." },
          { v: 7,  why: "Komunitas loyal & ramah; dokumentasi Rails bagus." },
          { v: 4,  why: "GIL & bobot Rails menyulitkan scale besar." }
        ]
      },
      {
        name: "PHP",
        about: "Bahasa scripting web tertua yang masih populer. Fungsinya: 70%+ web (WordPress, Laravel): web dynamic, API, e-commerce.",
        scores: [
          { v: 5,  why: "PHP 8 JIT meningkatkan performa, tapi kalah compiled." },
          { v: 4,  why: "GC & tipe longgar; risiko bug lebih tinggi." },
          { v: 3,  why: "Biasanya per-request model; concurrency terbatas." },
          { v: 8,  why: "Ekosistem web sangat besar (WordPress, Composer)." },
          { v: 9,  why: "Mudah dimulai; hosting murah berlimpah." },
          { v: 7,  why: "Banyak lowongan (WordPress/Laravel agency)." },
          { v: 8,  why: "Laravel mempercepat; edit + refresh langsung jalan." },
          { v: 4,  why: "Dynamic typing; PHP 7+ menambah tipe tapi opsional." },
          { v: 9,  why: "Hosting PHP termurah & paling mudah (cPanel)." },
          { v: 8,  why: "Laravel/Symfony sangat matang." },
          { v: 8,  why: "Dokumentasi PHP.net & komunitas sangat luas." },
          { v: 4,  why: "Arsitektur klasik kurang mendukung scale horizontal." }
        ]
      }
    ]
  },

  /* ================= DATABASE ================= */
  database: {
    title: "Perbandingan Database",
    subtitle: "Sistem penyimpanan data untuk aplikasi",
    winner: "PostgreSQL (104) & Supabase (104) — engine terbaik + penyedia terlengkap",
    note: "MongoDB unggul fleksibilitas skema. Redis unggul performa sebagai cache.",
    items: [
      {
        name: "PostgreSQL",
        about: "Database relasional open-source tercanggih, ACID compliant, extensible. Fungsinya: data apa pun — keuangan, geospasial (PostGIS), vector (pgvector), JSON.",
        scores: [
          { v: 10, why: "Query optimizer terbaik; JOIN kompleks tetap cepat." },
          { v: 10, why: "Relasional penuh: FK, constraint, index, view." },
          { v: 7,  why: "JSONB fleksibel, tapi skema relasional tetap utama." },
          { v: 10, why: "PostGIS, pgvector, full-text, dll — paling kaya." },
          { v: 6,  why: "Perlu install & config; hosting cloud memudahkan." },
          { v: 8,  why: "Performa baca sangat baik dengan index yang tepat." },
          { v: 7,  why: "Tulis baik; kalah dari cache khusus (Redis)." },
          { v: 10, why: "ACID penuh — jaminan transaksi terpercaya." },
          { v: 9,  why: "Streaming replication, failover, HA matang." },
          { v: 10, why: "Tooling terlengkap: psql, pgAdmin, DBeaver, ORM semua support." },
          { v: 8,  why: "Full-text search (tsvector) bagus tanpa tool eksternal." },
          { v: 9,  why: "JSONB native dengan query & index GIN." }
        ]
      },
      {
        name: "MySQL",
        about: "Database relasional open-source populer (Oracle). Fungsinya: menyimpan data relasional (user, order, product) — standar industri web.",
        scores: [
          { v: 8,  why: "Cepat untuk query standar; optimizer matang." },
          { v: 9,  why: "Relasional kuat; standard industri web." },
          { v: 6,  why: "JSON support ada, tapi kurang fleksibel." },
          { v: 5,  why: "Ekstensi lebih terbatas daripada Postgres." },
          { v: 7,  why: "Install & mulai cepat; banyak dokumentasi." },
          { v: 8,  why: "Performa baca tinggi, terutama read-heavy web." },
          { v: 7,  why: "Tulis stabil; InnoDB optimasi baik." },
          { v: 8,  why: "ACID dengan InnoDB; kuat untuk transaksi." },
          { v: 8,  why: "Replication matang (master-slave, Group Replication)." },
          { v: 8,  why: "Tooling luas; didukung semua hosting." },
          { v: 5,  why: "Full-text ada tapi kalah mutu dibanding Postgres." },
          { v: 8,  why: "JSON support sejak 5.7; cukup baik." }
        ]
      },
      {
        name: "MongoDB",
        about: "Database NoSQL document-based (JSON-like), schema-flexible. Fungsinya: struktur data yang sering berubah, prototype cepat, big data, analytics.",
        scores: [
          { v: 5,  why: "Cepat untuk look-up by id; JOIN/agregasi kompleks kalah relasional." },
          { v: 4,  why: "Document-based, bukan relasi antar tabel." },
          { v: 10, why: "Skema bebas — tambah kolom tanpa migrasi." },
          { v: 6,  why: "Aggregation pipeline kuat; ekstensi cukup." },
          { v: 8,  why: "Atlas & local mudah; tanpa skema = cepat mulai." },
          { v: 8,  why: "Performa baca bagus berkat denormalisasi doc." },
          { v: 8,  why: "Tulis cepat untuk single-doc ops." },
          { v: 5,  why: "ACID baru mendukung multi-doc transaction (4.0+)." },
          { v: 9,  why: "Sharding horizontal sangat matang." },
          { v: 8,  why: "Atlas, Compass, banyak ORM (Mongoose)." },
          { v: 7,  why: "Text search & Atlas Search cukup kuat." },
          { v: 10, why: "BSON = JSON native, query langsung dengan dokumen." }
        ]
      },
      {
        name: "SQLite",
        about: "Database engine embedded — tersimpan dalam satu file, tanpa server. Fungsinya: database lokal mobile/desktop, development, testing, analisis kecil.",
        scores: [
          { v: 5,  why: "Cepat untuk lokal; kalah di query besar & concurrent." },
          { v: 8,  why: "SQL relasional penuh walau embedded." },
          { v: 5,  why: "Skema relasional; migrasi manual via ALTER." },
          { v: 3,  why: "Ekstensi terbatas; FTS ada tapi fitur lain minim." },
          { v: 10, why: "Nol konfigurasi — cukup satu file .db." },
          { v: 6,  why: "Baca sangat cepat untuk single-user." },
          { v: 5,  why: "Satu writer pada satu waktu (locking)." },
          { v: 10, why: "ACID penuh untuk transaksi lokal." },
          { v: 1,  why: "Tanpa replikasi/HA bawaan (bukan client-server)." },
          { v: 5,  why: "Tooling cukup (sqlite3 CLI); bukan untuk produksi web besar." },
          { v: 3,  why: "FTS5 ada; tidak sekuat database server." },
          { v: 4,  why: "JSON functions ada; terbatas." }
        ]
      },
      {
        name: "Redis",
        about: "In-memory data store (RAM) berbasis key-value. Fungsinya: caching, session store, queue, real-time leaderboard, pub/sub.",
        scores: [
          { v: 3,  why: "Bukan untuk query kompleks — untuk akses key cepat." },
          { v: 1,  why: "Bukan relasional; struktur key-value/list/hash/set." },
          { v: 9,  why: "Skema bebas total — apa pun bisa disimpan." },
          { v: 4,  why: "Modul (RedisJSON, Search) ada tapi niche." },
          { v: 7,  why: "Install & mulai dalam 1 menit." },
          { v: 10, why: "Sub-millisecond baca di memori." },
          { v: 10, why: "Sub-millisecond tulis di memori." },
          { v: 3,  why: "ACID terbatas; data bisa hilang jika tak dikonfigurasi persist." },
          { v: 10, why: "Sentinel + Cluster untuk HA & scale." },
          { v: 7,  why: "RedisInsight & dukungan semua bahasa." },
          { v: 2,  why: "Search via RediSearch; bukan utama." },
          { v: 2,  why: "JSON via module; bukan document store utama." }
        ]
      },
      {
        name: "Supabase",
        about: "Open-source Firebase alternatif berbasis Postgres (DB + auth + storage + realtime). Fungsinya: backend siap pakai dengan API otomatis & RLS.",
        scores: [
          { v: 10, why: "Postgres engine = performa query kompleks terbaik." },
          { v: 10, why: "Postgres penuh di belakangnya." },
          { v: 7,  why: "Sama seperti Postgres (JSONB), skema fleksibel." },
          { v: 9,  why: "Auth, storage, realtime, edge functions, RLS." },
          { v: 8,  why: "Dashboard & SQL editor membuat setup sangat cepat." },
          { v: 8,  why: "Performa baca Postgres + PostgREST." },
          { v: 7,  why: "Performa tulis Postgres." },
          { v: 10, why: "ACID Postgres penuh." },
          { v: 9,  why: "Replication Postgres + managed infra." },
          { v: 9,  why: "Dashboard, SDK (JS/Dart), SQL editor, backups." },
          { v: 8,  why: "Full-text Postgres bawaan." },
          { v: 9,  why: "JSONB Postgres native." }
        ]
      }
    ]
  },

  /* ================= STACK ================= */
  stack: {
    title: "Perbandingan Kombinasi Stack Lengkap",
    subtitle: "Paket frontend + backend + database yang dipakai bersama. Ada ratusan kombinasi di dunia; ini yang paling populer.",
    winner: "MERN (95 poin) — Mongo + Express + React + Node, cepat untuk prototype",
    note: "T3 Stack (94) unggul type safety. .NET (92) untuk enterprise. Klik (i) di setiap kolom untuk tahu apa itu stack-nya.",
    items: [
      {
        name: "MERN",
        about: "MongoDB + Express + React + Node.js. Fungsinya: full-stack JavaScript penuh — satu bahasa di semua lapisan. Sangat populer untuk startup & prototype.",
        scores: [
          { v: 6,  why: "JS cukup cepat; Mongo cap pada query kompleks." },
          { v: 4,  why: "Tanpa tipe end-to-end; JS dinamis di semua lapis." },
          { v: 10, why: "Satu bahasa (JS) di mana-mana — on-board tim cepat." },
          { v: 10, why: "Ekosistem JS terbesar: Express, Mongoose, React, MUI." },
          { v: 8,  why: "Kurva landai karena satu bahasa saja." },
          { v: 9,  why: "Lowongan full-stack MERN sangat banyak." },
          { v: 8,  why: "Deploy mudah (Render, Vercel frontend + API)." },
          { v: 6,  why: "Node single-thread & Mongo butuh tuning untuk besar." },
          { v: 5,  why: "React SPA — SEO butuh SSR terpisah." },
          { v: 10, why: "Komunitas JS terbesar di dunia." },
          { v: 10, why: "React Native melengkapi mobile dari React yang sama." },
          { v: 9,  why: "Bertahun-tahun dipakai produksi startup besar." }
        ]
      },
      {
        name: "T3",
        about: "Next.js + tRPC + Prisma + PostgreSQL. Fungsinya: full-stack TypeScript dengan type safety penuh dari database ke UI. Favorit developer modern.",
        scores: [
          { v: 8,  why: "Next.js + Postgres — cepat dan efisien." },
          { v: 10, why: "Tipe mengalir dari DB (Prisma) ke API (tRPC) ke UI." },
          { v: 8,  why: "Scaffolding cepat; konsep tRPC/Prisma perlu waktu." },
          { v: 7,  why: "React + Prisma + Next ecosystem kaya." },
          { v: 7,  why: "TypeScript e2e menuntut disiplin tim." },
          { v: 8,  why: "Developer modern banyak yang menguasai TS/React." },
          { v: 8,  why: "Next + Vercel membuat deploy mulus." },
          { v: 8,  why: "Next edge + Postgres (Neon) scale dengan baik." },
          { v: 10, why: "SSR/SSG Next.js — SEO terbaik." },
          { v: 8,  why: "Komunitas TS/Next sangat aktif." },
          { v: 5,  why: "Mobile butuh React Native terpisah (bukan bagian stack)." },
          { v: 7,  why: "Masih relatif baru tapi cepat matang." }
        ]
      },
      {
        name: "Rustack",
        about: "Rust + Axum + React + PostgreSQL. Fungsinya: performa & keandalan maksimal — cocok untuk layanan yang menuntut stabilitas tinggi (Luxio memakai kombinasi ini).",
        scores: [
          { v: 10, why: "Rust + Postgres = performa puncak di semua lapisan." },
          { v: 9,  why: "Rust type system + SQLx query ter-periksa saat kompilasi." },
          { v: 3,  why: "Rust lambat untuk ditulis; kurva curam." },
          { v: 4,  why: "Ekosistem Rust lebih kecil di frontend (React tetap)." },
          { v: 3,  why: "Butuh developer Rust yang terampil." },
          { v: 3,  why: "Lowongan Rust niche; tim susah direkrut." },
          { v: 7,  why: "Binary Rust statis + React statis — deploy ringan." },
          { v: 10, why: "Rust concurrency + Postgres = skala horizontal mudah." },
          { v: 6,  why: "React SPA — SEO perlu SSR terpisah." },
          { v: 2,  why: "Komunitas Rust kecil di Asia Tenggara." },
          { v: 5,  why: "React Native terpisah; bukan bagian stack utama." },
          { v: 4,  why: "Terbukti andal, tapi adopsi masih muda." }
        ]
      },
      {
        name: "JAMStack",
        about: "JavaScript + API + Markup (mis. Jekyll/static + headless API + Markdown). Fungsinya: website super cepat, murah, aman — blog, landing page, dokumentasi.",
        scores: [
          { v: 5,  why: "Statis cepat, tapi fitur dinamis bergantung API eksternal." },
          { v: 3,  why: "Tanpa tipe end-to-end; bergantung API pihak ketiga." },
          { v: 7,  why: "Menulis konten Markdown cepat untuk situs konten." },
          { v: 4,  why: "Ekosistem terbatas pada generator statis & headless CMS." },
          { v: 9,  why: "Sangat mudah dipahami: file + template + API." },
          { v: 3,  why: "Lowongan khusus JAMStack sedikit." },
          { v: 10, why: "Deploy ke CDN statis (Netlify/Vercel) semudah git push." },
          { v: 4,  why: "Konten statis; fitur dinamis terbatas API." },
          { v: 7,  why: "Statis = sangat ramah SEO." },
          { v: 3,  why: "Komunitas niche." },
          { v: 2,  why: "Bukan untuk aplikasi mobile." },
          { v: 7,  why: "Matang untuk blog/landing, bukan app kompleks." }
        ]
      },
      {
        name: ".NET",
        about: "C# + ASP.NET Core + SQL Server + React/Angular. Fungsinya: aplikasi enterprise — banking, ERP, sistem korporat yang butuh stabilitas & dukungan Microsoft.",
        scores: [
          { v: 8,  why: "ASP.NET Core performa tinggi; SQL Server solid." },
          { v: 8,  why: "C# tipe kuat; Entity Framework type-safe." },
          { v: 5,  why: "Enterprise tooling & arsitektur berlapis memperlambat." },
          { v: 9,  why: "Ekosistem Microsoft + NuGet lengkap." },
          { v: 5,  why: "Konsep enterprise cukup banyak dipelajari." },
          { v: 9,  why: "Lowongan enterprise sangat banyak (bank, korporat)." },
          { v: 7,  why: "Azure/dotnet publish; deployment enterprise matang." },
          { v: 9,  why: "Scale horizontal dengan mudah di enterprise." },
          { v: 6,  why: "React/Angular SPA — SEO perlu SSR." },
          { v: 9,  why: "Komunitas & vendor support Microsoft besar." },
          { v: 7,  why: "React Native/.NET MAUI untuk mobile." },
          { v: 10, why: "Paling matang untuk produksi enterprise jangka panjang." }
        ]
      },
      {
        name: "Laravel",
        about: "PHP + Laravel + MySQL + Vue/Blade. Fungsinya: web app cepat & produktif — e-commerce, CMS, CRM, SaaS. Pilihan populer untuk agency & UMKM.",
        scores: [
          { v: 5,  why: "PHP cukup untuk kebanyakan web; kalah compiled." },
          { v: 4,  why: "PHP tipe longgar; Eloquent membantu tapi terbatas." },
          { v: 10, why: "Artisan CLI & scaffolding membuat CRUD instan." },
          { v: 8,  why: "Laravel + Forge + banyak package PHP." },
          { v: 10, why: "Kurva paling ramah untuk pengembangan web umum." },
          { v: 6,  why: "Banyak lowongan agency & perusahaan lokal." },
          { v: 9,  why: "Hosting PHP murah & deploy mudah." },
          { v: 5,  why: "Perlu tuning untuk beban sangat besar." },
          { v: 7,  why: "Blade/SSR ramah SEO; Vue opsional." },
          { v: 7,  why: "Komunitas Laravel besar & aktif." },
          { v: 3,  why: "Mobile butuh tooling terpisah." },
          { v: 9,  why: "10+ tahun, sangat matang & stabil." }
        ]
      },
      {
        name: "Django",
        about: "Python + Django + PostgreSQL + React/HTMX. Fungsinya: web app kompleks cepat ('batteries included'): admin panel, auth, ORM, forms — cocok MVP & internal tools.",
        scores: [
          { v: 5,  why: "Python cukup; kalah performa compiled untuk beban berat." },
          { v: 5,  why: "Django ORM kuat; Python tipe dinamis di sisi app." },
          { v: 10, why: "Admin panel & ORM otomatis mempercepat build." },
          { v: 8,  why: "Django packages + Python ecosystem kaya." },
          { v: 8,  why: "Struktur Django jelas & mudah dipahami." },
          { v: 8,  why: "Banyak lowongan Python/Django (startup & enterprise)." },
          { v: 8,  why: "Deploy ke Render/HF/any PaaS mudah." },
          { v: 6,  why: "Python GIL membatasi scale CPU-heavy." },
          { v: 6,  why: "Server-rendered Django ramah SEO; React opsional." },
          { v: 8,  why: "Komunitas Python/Django sangat besar." },
          { v: 3,  why: "Mobile butuh API terpisah (DRF) + React Native." },
          { v: 9,  why: "15+ tahun, terbukti produksi (Instagram memakainya)." }
        ]
      },
      {
        name: "Go-Vue-Postgres",
        about: "Go + Gin/Echo + Vue + PostgreSQL. Fungsinya: API backend Go yang cepat & ringan dipadukan frontend Vue — seimbang performa dan produktivitas.",
        scores: [
          { v: 9,  why: "Go + Postgres = performa tinggi & stabil." },
          { v: 7,  why: "Go tipe statis; tanpa type-safety sampai frontend." },
          { v: 7,  why: "Go cepat ditulis; Vue mudah; kombinasi produktif." },
          { v: 6,  why: "Ekosistem Go cukup; Vue cukup — gabungan sedang." },
          { v: 8,  why: "Go sederhana + Vue landai = tim cepat naik." },
          { v: 5,  why: "Lowongan gabungan khusus ini terbatas." },
          { v: 8,  why: "Go binary statis + Vue statis = deploy ringan." },
          { v: 9,  why: "Go concurrency unggul untuk scale." },
          { v: 6,  why: "Vue SPA — SEO butuh Nuxt terpisah." },
          { v: 5,  why: "Komunitas terbagi antara dua ekosistem." },
          { v: 3,  why: "Mobile butuh solusi terpisah." },
          { v: 6,  why: "Terbukti di banyak perusahaan, belum setua Java/PHP." }
        ]
      },
      {
        name: "MEVN",
        about: "MongoDB + Express + Vue + Node.js. Fungsinya: full-stack JavaScript dengan frontend Vue — mirip MERN tapi memakai Vue yang lebih mudah dipelajari.",
        scores: [
          { v: 6,  why: "JS cukup; Mongo cap pada query kompleks." },
          { v: 4,  why: "Tanpa tipe end-to-end." },
          { v: 9,  why: "Vue paling mudah dipelajari + JS di semua lapis." },
          { v: 9,  why: "Ekosistem JS + Vue ecosystem kuat." },
          { v: 9,  why: "Satu bahasa + Vue landai = tim cepat." },
          { v: 6,  why: "Lowongan ada tapi kalah MERN." },
          { v: 8,  why: "Deploy mudah seperti MERN." },
          { v: 6,  why: "Node single-thread; Mongo butuh tuning." },
          { v: 5,  why: "Vue SPA — SEO butuh Nuxt." },
          { v: 8,  why: "Komunitas JS + Vue besar." },
          { v: 7,  why: "Vue + Quasar/Capacitor untuk mobile." },
          { v: 8,  why: "Matang & banyak dipakai." }
        ]
      },
      {
        name: "LAMP",
        about: "Linux + Apache + MySQL + PHP. Fungsinya: stack web klasik paling banyak dipakai di dunia — dasar WordPress & jutaan hosting murah.",
        scores: [
          { v: 5,  why: "PHP/Apache cukup untuk web umum; bukan tercepat." },
          { v: 4,  why: "PHP tipe longgar." },
          { v: 8,  why: "Hosting siap pakai; edit PHP langsung jalan." },
          { v: 9,  why: "WordPress + ekosistem PHP/Linux sangat besar." },
          { v: 9,  why: "Materi & hosting melimpah — paling mudah dimulai." },
          { v: 7,  why: "Banyak lowongan WordPress/PHP." },
          { v: 9,  why: "Deploy semudah upload ke cPanel." },
          { v: 4,  why: "Arsitektur klasik; perlu rombak untuk skala besar." },
          { v: 7,  why: "Server-rendered PHP ramah SEO." },
          { v: 9,  why: "Komunitas & dukungan hosting terbesar." },
          { v: 2,  why: "Bukan untuk aplikasi mobile." },
          { v: 10, why: "25+ tahun, paling matang & terbukti." }
        ]
      },
      {
        name: "Rails",
        about: "Ruby + Ruby on Rails + PostgreSQL + Hotwire/Stimulus. Fungsinya: startup cepat & produktif — 'convention over configuration', cepat dari ide ke launching.",
        scores: [
          { v: 6,  why: "Rails cukup; Hotwire membuat UI ringan." },
          { v: 5,  why: "Ruby tipe dinamis; Rails ORM membantu." },
          { v: 9,  why: "Scaffolding & convention = build super cepat." },
          { v: 7,  why: "Ekosistem Rails lengkap (gems)." },
          { v: 8,  why: "Convention membuat tim konsisten & cepat." },
          { v: 4,  why: "Lowongan Rails menurun." },
          { v: 7,  why: "Deploy Rails (Render/Heroku) mudah." },
          { v: 5,  why: "Ruby GIL membatasi scale CPU." },
          { v: 8,  why: "Server-rendered Hotwire ramah SEO." },
          { v: 6,  why: "Komunitas loyal namun menyusut." },
          { v: 3,  why: "Mobile butuh API terpisah." },
          { v: 9,  why: "Matang; dipakai GitHub, Shopify, Basecamp." }
        ]
      },
      {
        name: "Phoenix",
        about: "Elixir + Phoenix + PostgreSQL + LiveView. Fungsinya: aplikasi real-time super efisien (chat, kolaborasi) berkat Erlang VM — sangat kuat untuk concurrency.",
        scores: [
          { v: 9,  why: "Erlang VM (BEAM) performa & fault-tolerance tinggi." },
          { v: 7,  why: "Elixir tipe dinamis; Ecto ORM membantu." },
          { v: 7,  why: "LiveView membuat UI real-time tanpa JS kompleks." },
          { v: 5,  why: "Ekosistem lebih kecil daripada JS/Python." },
          { v: 5,  why: "Elixir/functional perlu waktu dipelajari." },
          { v: 3,  why: "Lowongan niche." },
          { v: 6,  why: "Deploy BEAM releases butuh sedikit pengetahuan." },
          { v: 10, why: "Concurrency Erlang = skala luar biasa." },
          { v: 8,  why: "LiveView SSR ramah SEO." },
          { v: 5,  why: "Komunitas kecil tapi berkualitas." },
          { v: 2,  why: "Mobile butuh tooling terpisah." },
          { v: 7,  why: "Terbukti (Discord memakai Elixir), tapi adopsi terbatas." }
        ]
      },
      {
        name: "Spring+Angular",
        about: "Java Spring Boot + MySQL + Angular. Fungsinya: stack enterprise standar — banking, e-government, sistem korporat besar yang butuh keamanan & stabilitas.",
        scores: [
          { v: 8,  why: "Spring + JVM performa enterprise solid." },
          { v: 8,  why: "Java + Angular TypeScript — tipe kuat." },
          { v: 5,  why: "Boilerplate Spring & Angular memperlambat." },
          { v: 9,  why: "Ekosistem Java + Angular enterprise lengkap." },
          { v: 5,  why: "Konsep enterprise cukup berat." },
          { v: 9,  why: "Standar lowongan enterprise dunia." },
          { v: 7,  why: "Deploy Java jar/Docker; enterprise tooling matang." },
          { v: 8,  why: "JVM + Spring mudah scale horizontal." },
          { v: 5,  why: "Angular SPA — SEO butuh Angular Universal." },
          { v: 9,  why: "Komunitas & vendor support sangat besar." },
          { v: 8,  why: "Ionic/Capacitor untuk mobile dari Angular." },
          { v: 10, why: "Standar enterprise paling terbukti." }
        ]
      },
      {
        name: "SvelteKit+Supabase",
        about: "SvelteKit + Supabase (Postgres). Fungsinya: web modern ringan & cepat — frontend Svelte super kecil + backend Supabase siap pakai (auth, DB, storage).",
        scores: [
          { v: 9,  why: "Svelte bundle kecil + Supabase/Postgres cepat." },
          { v: 7,  why: "Supabase SDK typed; tanpa tipe penuh di frontend." },
          { v: 9,  why: "SvelteKit scaffolding + Supabase cepat dipakai." },
          { v: 6,  why: "Ekosistem Svelte kecil; Supabase membantu." },
          { v: 8,  why: "Svelte mudah + Supabase no-server = tim cepat." },
          { v: 4,  why: "Lowongan gabungan ini masih sedikit." },
          { v: 9,  why: "SvelteKit + Supabase cloud = deploy mudah." },
          { v: 8,  why: "Svelte ringan + Postgres scale baik." },
          { v: 9,  why: "SvelteKit SSR/SSG — SEO bagus." },
          { v: 6,  why: "Komunitas Svelte kecil tapi Supabase besar." },
          { v: 3,  why: "Mobile butuh solusi terpisah." },
          { v: 6,  why: "Modern, cepat berkembang, belum setua lainnya." }
        ]
      }
    ]
  },

  /* ================= RUNTIME ================= */
  runtime: {
    title: "Perbandingan Runtime & Infrastructure",
    subtitle: "Platform untuk menjalankan & mendeploy aplikasi",
    winner: "Docker (63 poin) — standar de facto container",
    note: "AWS EC2 (62) untuk fleksibilitas. Cloudflare Workers (59) untuk edge computing murah.",
    items: [
      {
        name: "Docker",
        about: "Platform container: membungkus aplikasi + dependency dalam satu paket. Fungsinya: aplikasi jalan sama persis di dev, staging, produksi.",
        scores: [
          { v: 7,  why: "Dockerfile sederhana; konsep image/container mudah dipahami." },
          { v: 7,  why: "Skala manual lewat banyak container; orkestrasi butuh K8s." },
          { v: 8,  why: "Gratis & hemat resource dibanding VM." },
          { v: 9,  why: "Container mulai sangat cepat (< 1 detik)." },
          { v: 10, why: "Kontrol penuh atas environment aplikasi." },
          { v: 2,  why: "Bukan edge network — berjalan di host Anda." },
          { v: 10, why: "Didukung semua platform & cloud." },
          { v: 10, why: "Dokumentasi & komunitas Docker sangat besar." }
        ]
      },
      {
        name: "Kubernetes",
        about: "Orkestrator container (CNCF) untuk mengelola ratusan container otomatis. Fungsinya: auto scaling, auto healing, rolling update — untuk skala enterprise.",
        scores: [
          { v: 3,  why: "Sangat kompleks; butuh waktu berbulan-bulan kuasai." },
          { v: 10, why: "Auto scale & auto heal ribuan pod." },
          { v: 5,  why: "Infrastruktur K8s mahal untuk skala kecil." },
          { v: 9,  why: "Pod hidup kembali cepat setelah restart." },
          { v: 10, why: "Kontrol penuh; extensible via CRD." },
          { v: 3,  why: "Edge network butuh setup khusus." },
          { v: 8,  why: "Ekosistem tools (Helm, Prometheus, Ingress) sangat kaya." },
          { v: 8,  why: "Dokumentasi & komunitas besar." }
        ]
      },
      {
        name: "Vercel",
        about: "Cloud platform frontend & serverless dari tim Next.js. Fungsinya: deploy website & API serverless instan dari GitHub — auto HTTPS, CDN global.",
        scores: [
          { v: 10, why: "Hubungkan GitHub → otomatis deploy. Semudah itu." },
          { v: 7,  why: "Auto scale serverless; batas di function duration." },
          { v: 7,  why: "Gratis tier generous untuk personal." },
          { v: 6,  why: "Cold start function lambat (dikurangi dengan edge)." },
          { v: 4,  why: "Terbatas pada ekosistem Vercel/Next." },
          { v: 8,  why: "CDN global & edge functions bawaan." },
          { v: 8,  why: "Integrasi GitHub, preview deployments, analytics." },
          { v: 8,  why: "Dokumentasi & komunitas kuat." }
        ]
      },
      {
        name: "Netlify",
        about: "Platform static site & serverless functions. Fungsinya: deploy website statis (JAMStack) & fungsi serverless — populer untuk blog, landing page, dokumentasi.",
        scores: [
          { v: 10, why: "Drag & drop / git push — sangat mudah." },
          { v: 6,  why: "Scale functions ada, tapi lebih terbatas dari Vercel." },
          { v: 7,  why: "Gratis tier bagus untuk static sites." },
          { v: 5,  why: "Cold start function lambat." },
          { v: 4,  why: "Terbatas pada static + functions." },
          { v: 7,  why: "CDN global bawaan." },
          { v: 7,  why: "Integrasi git, forms, identity, split testing." },
          { v: 7,  why: "Dokumentasi baik; komunitas JAMStack besar." }
        ]
      },
      {
        name: "AWS EC2",
        about: "Virtual machine (VPS) dari Amazon. Fungsinya: kendali penuh atas server — install apa pun, sesuaikan hardware, kontrol penuh untuk enterprise.",
        scores: [
          { v: 4,  why: "Perlu pahami instance, AMI, security group, VPC." },
          { v: 9,  why: "Auto scaling group & load balancer matang." },
          { v: 5,  why: "Bayar per jam; gratis tier terbatas." },
          { v: 10, why: "Server selalu hidup — tanpa cold start." },
          { v: 9,  why: "Kontrol penuh atas OS & software." },
          { v: 5,  why: "Region tersebar; edge network butuh CloudFront." },
          { v: 10, why: "Integrasi dengan seluruh ekosistem AWS (S3, RDS, Lambda)." },
          { v: 9,  why: "Dokumentasi & komunitas AWS terbesar." }
        ]
      },
      {
        name: "Cloudflare Workers",
        about: "Platform serverless yang menjalankan kode di edge network Cloudflare (100+ lokasi). Fungsinya: API cepat dekat user, geolocation, A/B testing, murah.",
        scores: [
          { v: 8,  why: "Tulis kode → wrangler deploy; konsep sederhana." },
          { v: 8,  why: "Scale otomatis di ribuan edge node." },
          { v: 10, why: "Gratis 100k request/hari; tanpa egress fee." },
          { v: 4,  why: "Cold start kecil di edge (lebih baik dari Lambda)." },
          { v: 5,  why: "Terbatas pada runtime V8 & batas CPU." },
          { v: 10, why: "Edge network terbesar di dunia." },
          { v: 6,  why: "Integrasi baik dengan Cloudflare (R2, D1, KV)." },
          { v: 6,  why: "Dokumentasi bagus; komunitas tumbuh." }
        ]
      },
      {
        name: "Render",
        about: "Cloud PaaS sederhana — deploy dari GitHub. Fungsinya: hosting web service, static site, cron, database Postgres/Redis — yang dipakai Luxio (render.yaml).",
        scores: [
          { v: 8,  why: "Hubungkan GitHub, Render auto-detect, klik deploy." },
          { v: 6,  why: "Scale manual; auto-scaling terbatas." },
          { v: 7,  why: "Gratis tier untuk web service + Postgres." },
          { v: 5,  why: "Service tidur saat idle → cold start saat bangun." },
          { v: 5,  why: "Terbatas pada blueprint Render (render.yaml)." },
          { v: 4,  why: "Region terbatas (US/EU, belum Indonesia)." },
          { v: 5,  why: "Integrasi GitHub & layanan bawaan cukup." },
          { v: 5,  why: "Dokumentasi cukup; komunitas kecil." }
        ]
      }
    ]
  },

  /* ================= DBaaS ================= */
  dbaas: {
    title: "Perbandingan Database-as-a-Service",
    subtitle: "Layanan database cloud tanpa urusan server (yang dipakai Luxio = Neon)",
    winner: "Neon (72 poin) — free tier generous + branching unik + scale-to-zero",
    note: "Data diambil dari dokumentasi Neon yang diunduh di folder neon-docs/.",
    items: [
      {
        name: "Neon",
        about: "Database-as-a-Service untuk Postgres dari Databricks. Fungsinya: hosting Postgres tanpa urusan server — branching (DB versioning), scale-to-zero, autoscaling. Dipakai Luxio.",
        scores: [
          { v: 10, why: "Free tier 5GB + kuota compute bulanan." },
          { v: 8,  why: "Postgres terkelola, performa baik." },
          { v: 10, why: "Branching unik seperti git untuk database." },
          { v: 10, why: "DB tidur saat tidak dipakai → tidak bayar." },
          { v: 8,  why: "Dashboard, SQL editor, backup, monitoring." },
          { v: 9,  why: "Postgres penuh di belakangnya." },
          { v: 9,  why: "Buat project + copy connection string = instan." },
          { v: 8,  why: "Pricing transparan, billing per usage." }
        ]
      },
      {
        name: "Supabase",
        about: "Open-source Firebase alternatif berbasis Postgres (DB + auth + storage + realtime). Fungsinya: backend siap pakai dengan API otomatis & RLS.",
        scores: [
          { v: 9,  why: "Free tier 500MB Postgres + fitur cukup." },
          { v: 7,  why: "Postgres baik; overhead PostgREST kecil." },
          { v: 3,  why: "Branching belum sekuat Neon (database branching baru)." },
          { v: 8,  why: "Proyek bisa pause; tapi bukan scale-to-zero penuh." },
          { v: 10, why: "Auth, storage, realtime, edge functions — lengkap." },
          { v: 10, why: "Postgres + fitur tambahan terlengkap." },
          { v: 10, why: "Dashboard & SDK membuat setup sangat cepat." },
          { v: 7,  why: "Biasanya predictable; fitur tambahan berbayar." }
        ]
      },
      {
        name: "PlanetScale",
        about: "DBaaS berbasis Vitess (MySQL compatible) dengan branching. Fungsinya: hosting MySQL skalabel + workflow branching & deploy requests (review schema change).",
        scores: [
          { v: 5,  why: "Free tier mulai terbatas (1 DB kecil)." },
          { v: 9,  why: "Vitess sangat cepat & scalable." },
          { v: 8,  why: "Branching + deploy request (mirror Neon untuk MySQL)." },
          { v: 7,  why: "Scale to zero terbatas (harus aktif untuk koneksi)." },
          { v: 7,  why: "Dashboard & CLI solid; kurang ekosistem ekstra." },
          { v: 8,  why: "MySQL compat (populer bagi pengguna MySQL)." },
          { v: 8,  why: "Setup instan dari console." },
          { v: 5,  why: "Biaya bisa membingungkan (compute + storage)." }
        ]
      },
      {
        name: "Mongo Atlas",
        about: "Layanan database MongoDB resmi dari MongoDB Inc. Fungsinya: hosting MongoDB terkelola — M0 gratis, skala ke cluster besar untuk big data.",
        scores: [
          { v: 7,  why: "Free tier M0 (512MB) tersedia." },
          { v: 7,  why: "Performa baik untuk document store." },
          { v: 1,  why: "Tanpa branching seperti git." },
          { v: 5,  why: "Cluster M0 tidur; tapi fitur scale-to-zero terbatas." },
          { v: 8,  why: "Atlas Search, Charts, triggers, banyak tools." },
          { v: 7,  why: "MongoDB (document store)." },
          { v: 8,  why: "Buat cluster dalam menit." },
          { v: 6,  why: "Pricing bisa naik; perlu pantau." }
        ]
      },
      {
        name: "RDS (AWS)",
        about: "Layanan database terkelola dari AWS (Postgres/MySQL/MariaDB). Fungsinya: database enterprise di infrastruktur AWS — HA, backup, security ketat.",
        scores: [
          { v: 1,  why: "Tidak ada free tier permanen (hanya trial 12 bulan)." },
          { v: 10, why: "Infrastruktur AWS performa sangat tinggi." },
          { v: 1,  why: "Tanpa branching." },
          { v: 1,  why: "Tidak scale-to-zero; bayar terus selama hidup." },
          { v: 9,  why: "Multi-AZ, read replica, backup, monitoring AWS." },
          { v: 9,  why: "Postgres/MySQL/MariaDB pilihan." },
          { v: 5,  why: "Setup butuh konfigurasi VPC/security group." },
          { v: 10, why: "Pricing jelas per instance, predictable." }
        ]
      },
      {
        name: "CockroachDB",
        about: "Database SQL terdistribusi (Distributed SQL) kompatibel Postgres. Fungsinya: high availability & low latency global multi-region — fintech, e-commerce besar.",
        scores: [
          { v: 0,  why: "Tidak ada free tier publik yang menonjol." },
          { v: 9,  why: "Distributed SQL kuat, auto-healing." },
          { v: 1,  why: "Tanpa branching." },
          { v: 1,  why: "Serverless cloud ada tapi bukan scale-to-zero penuh." },
          { v: 5,  why: "Tools untuk distributed ops; kurang ekosistem konsumen." },
          { v: 7,  why: "Postgres-compatible SQL." },
          { v: 6,  why: "Setup cluster distributed lebih kompleks." },
          { v: 8,  why: "Pricing per-node jelas." }
        ]
      }
    ]
  }
};

/* ---------- 3. DATA STORAGE (penyedia storage/bucket gratis) ---------- */
const STORAGE = {
  title: "Perbandingan Penyedia Storage / Bucket Gratis",
  subtitle: "Tempat penyimpanan file gratis: bucket S3-compatible, file sharing, dan hosting file anonymous",
  winner: "Cloudflare R2 (64 poin) — 10GB gratis + 0 biaya egress + S3-compatible",
  note: "Backblaze B2 (63) unggul harga egress & domain kustom. Supabase Storage (61) paling lengkap untuk aplikasi.",
  items: [
    {
      name: "Backblaze B2",
      about: "Penyimpanan object storage S3-compatible dengan 10GB gratis. Fungsinya: hosting file/bucket untuk aplikasi (gambar, video, backup) dengan harga egress termurah.",
      scores: [
        { v: 9,  why: "10GB gratis + 1GB download/hari." },
        { v: 8,  why: "File besar didukung (hingga 10GB+/file)." },
        { v: 10, why: "Permanen selama dalam kuota." },
        { v: 10, why: "S3 API kompatibel — pakai SDK AWS langsung." },
        { v: 9,  why: "Link langsung + domain kustom." },
        { v: 8,  why: "Enkripsi at-rest & in-transit." },
        { v: 7,  why: "Kecepatan baik dari Indonesia." },
        { v: 2,  why: "Perlu akun & kredensial." }
      ]
    },
    {
      name: "Cloudflare R2",
      about: "Object storage S3-compatible dari Cloudflare, 10GB gratis dengan 0 biaya egress (download). Fungsinya: bucket murah untuk aplikasi & media besar.",
      scores: [
        { v: 9,  why: "10GB gratis + 1 juta operasi A/hari." },
        { v: 7,  why: "Batas per file besar (5TB)." },
        { v: 10, why: "Permanen selama dalam kuota." },
        { v: 10, why: "S3 API kompatibel penuh." },
        { v: 9,  why: "Link langsung + domain kustom + presign." },
        { v: 9,  why: "Enkripsi & integrasi ekosistem Cloudflare." },
        { v: 8,  why: "CDN Cloudflare sangat cepat." },
        { v: 2,  why: "Perlu akun Cloudflare." }
      ]
    },
    {
      name: "Supabase Storage",
      about: "Bucket S3-compatible di dalam Supabase. Fungsinya: upload/download file dari aplikasi dengan autentikasi & row-level security bawaan.",
      scores: [
        { v: 7,  why: "1GB gratis (bundel dengan project)." },
        { v: 7,  why: "Batas file 50MB free (naikkan berbayar)." },
        { v: 9,  why: "Permanen selama project aktif." },
        { v: 10, why: "S3 API + SDK JS/Dart + integrasi auth & RLS." },
        { v: 9,  why: "Link langsung & presigned URL." },
        { v: 9,  why: "Auth + RLS = keamanan terkontrol per-user." },
        { v: 7,  why: "Via CDN Supabase; cukup cepat." },
        { v: 3,  why: "Butuh akun & project (bukan anonymous)." }
      ]
    },
    {
      name: "Firebase Storage",
      about: "Penyimpanan file dari Google (bagian Firebase) — cocok untuk aplikasi mobile/web. Fungsinya: upload/download file dengan SDK & autentikasi Google.",
      scores: [
        { v: 8,  why: "5GB gratis." },
        { v: 7,  why: "File besar didukung (2TB max, upload praktis)." },
        { v: 9,  why: "Permanen selama project aktif." },
        { v: 9,  why: "SDK lengkap (Android/iOS/Web) + security rules." },
        { v: 8,  why: "Download URL langsung." },
        { v: 8,  why: "Security rules Firebase ketat." },
        { v: 7,  why: "Melalui Google CDN, cepat." },
        { v: 3,  why: "Butuh project Firebase & login." }
      ]
    },
    {
      name: "AWS S3",
      about: "Object storage asli dari Amazon — standar industri. Fungsinya: bucket untuk aplikasi enterprise, backup, data lake; free tier terbatas.",
      scores: [
        { v: 5,  why: "5GB gratis 12 bulan pertama." },
        { v: 8,  why: "File sangat besar didukung (5TB)." },
        { v: 9,  why: "Permanen selama bayar/dalam kuota." },
        { v: 10, why: "S3 API standar dunia; semua SDK support." },
        { v: 9,  why: "Link langsung + presign + CloudFront." },
        { v: 9,  why: "Enkripsi, bucket policy, IAM lengkap." },
        { v: 8,  why: "Infrastruktur AWS global cepat." },
        { v: 2,  why: "Perlu akun AWS & konfigurasi IAM." }
      ]
    },
    {
      name: "Google Drive",
      about: "Penyimpanan cloud pribadi Google, 15GB gratis. Fungsinya: menyimpan & berbagi file pribadi/kerja; bisa diakses programatik lewat Drive API.",
      scores: [
        { v: 10, why: "15GB gratis paling besar untuk pribadi." },
        { v: 8,  why: "File besar didukung (5TB)." },
        { v: 10, why: "Permanen selama akun aktif." },
        { v: 6,  why: "Drive API ada tapi bukan S3-bucket murni." },
        { v: 10, why: "Link share sangat mudah & populer." },
        { v: 7,  why: "Enkripsi Google; kontrol share manual." },
        { v: 8,  why: "Server Google sangat cepat." },
        { v: 3,  why: "Butuh akun Google." }
      ]
    },
    {
      name: "MEGA",
      about: "Penyimpanan cloud 20GB gratis dengan enkripsi end-to-end. Fungsinya: menyimpan file pribadi yang butuh privasi & keamanan tinggi.",
      scores: [
        { v: 10, why: "20GB gratis — terbesar untuk pribadi." },
        { v: 7,  why: "Batas upload besar (untuk akun gratis dibatasi)." },
        { v: 10, why: "Permanen selama akun aktif." },
        { v: 6,  why: "MEGA SDK/API ada tapi kompleks." },
        { v: 9,  why: "Link share + folder share." },
        { v: 10, why: "Enkripsi end-to-end paling kuat." },
        { v: 6,  why: "Kecepatan bervariasi tergantung region." },
        { v: 3,  why: "Perlu akun (ada transfer quota gratis)." }
      ]
    },
    {
      name: "MediaFire",
      about: "Penyimpanan file gratis 10GB untuk berbagi. Fungsinya: upload & bagikan file lewat link — populer untuk distribusi file tanpa akun berbayar.",
      scores: [
        { v: 8,  why: "10GB gratis." },
        { v: 7,  why: "Batas 10GB per file (bebas untuk akun free)." },
        { v: 9,  why: "Permanen jika file aktif (akun)." },
        { v: 4,  why: "Tanpa API bucket; hanya web upload." },
        { v: 9,  why: "Link sharing mudah, tanpa tunggu." },
        { v: 6,  why: "Enkripsi standar; tidak end-to-end." },
        { v: 7,  why: "Cukup cepat dari Indonesia." },
        { v: 4,  why: "Bisa upload tanpa login untuk file kecil." }
      ]
    },
    {
      name: "Zippyfile",
      about: "File hosting gratis tanpa perlu akun. Fungsinya: upload file lalu bagikan link unduhan langsung — cepat untuk berbagi file kecil/temp.",
      scores: [
        { v: 6,  why: "Kuota gratis (terbatas, ada iklan)." },
        { v: 5,  why: "Batas file ~200MB untuk anonymous." },
        { v: 4,  why: "File bisa dihapus jika lama tidak diakses." },
        { v: 2,  why: "Tanpa API bucket resmi." },
        { v: 9,  why: "Link unduhan langsung tanpa akun." },
        { v: 5,  why: "Keamanan rendah; hanya link biasa." },
        { v: 6,  why: "Cukup cepat." },
        { v: 10, why: "Upload tanpa akun." }
      ]
    },
    {
      name: "Catbox",
      about: "File hosting anonymous sederhana. Fungsinya: upload file instan tanpa akun & dapatkan link langsung — populer di komunitas (chat, forum).",
      scores: [
        { v: 7,  why: "Kuota besar; batas 200MB/file." },
        { v: 6,  why: "Maks 200MB per file." },
        { v: 7,  why: "File permanen jika diakses (tanpa akun)." },
        { v: 3,  why: "Ada API sederhana tapi bukan S3-bucket." },
        { v: 10, why: "Link langsung instan tanpa akun." },
        { v: 5,  why: "Tanpa enkripsi; upload-anonim." },
        { v: 7,  why: "Cukup cepat." },
        { v: 10, why: "Fully anonymous, tanpa login." }
      ]
    },
    {
      name: "File.io",
      about: "Layanan berbagi file sementara (temp). Fungsinya: upload file, dapat link yang otomatis terhapus setelah diunduh — aman untuk transfer sekali pakai.",
      scores: [
        { v: 6,  why: "Gratis tanpa kuota tetap (2GB/file)." },
        { v: 8,  why: "Hingga 2GB per file (gratis 100MB)." },
        { v: 1,  why: "File otomatis terhapus setelah 1 unduhan." },
        { v: 3,  why: "API sederhana ada; bukan bucket." },
        { v: 10, why: "Link langsung; sekali download langsung bersih." },
        { v: 7,  why: "Aman karena self-destruct otomatis." },
        { v: 7,  why: "Cukup cepat." },
        { v: 10, why: "Upload tanpa akun." }
      ]
    },
    {
      name: "0x0.st",
      about: "Hosting file anonymous minimal dari nullsecurity. Fungsinya: upload file via web/curl tanpa akun, link langsung — favorit developer untuk berbagi temp.",
      scores: [
        { v: 7,  why: "Gratis; batas 512MB anonymous." },
        { v: 6,  why: "Maks 512MB per file." },
        { v: 5,  why: "File bisa expired (maks 30 hari tanpa akses)." },
        { v: 5,  why: "Upload via curl/web — API sederhana." },
        { v: 10, why: "Link langsung instan tanpa akun." },
        { v: 5,  why: "Minimal security (untuk file non-sensitif)." },
        { v: 6,  why: "Cukup cepat." },
        { v: 10, why: "Fully anonymous, tanpa login." }
      ]
    }
  ]
};

/* ============================================================
   4. GLOSARIUM
   ============================================================ */
const GLOSARIUM = [
  {
    name: "Stack",
    apa: "Kumpulan teknologi yang dipakai bersama: frontend + backend + database.",
    fungsi: "Membangun aplikasi lengkap dari ujung ke ujung (end-to-end).",
    cara: "Pilih 1 frontend + 1 backend + 1 database yang saling cocok, lalu pelajari ketiganya."
  },
  {
    name: "Framework",
    apa: "Kerangka kerja berisi aturan, struktur, dan tools siap pakai.",
    fungsi: "Mempercepat development dengan kode yang sudah terstruktur dan berpola.",
    cara: "Install framework → ikuti struktur foldernya → tulis kode di dalam template yang disediakan."
  },
  {
    name: "Runtime",
    apa: "Lingkungan untuk menjalankan kode di luar browser (mis. di server).",
    fungsi: "Mengeksekusi kode backend seperti Node.js untuk JavaScript.",
    cara: "Install runtime (mis. node) → jalankan file kode dengan perintah CLI: node app.js."
  },
  {
    name: "ORM / ODM",
    apa: "Penerjemah antara kode program dan database (Object-Relational Mapping).",
    fungsi: "Menulis query database pakai bahasa pemrograman, bukan SQL mentah.",
    cara: "Install ORM (mis. Prisma, SQLx) → definisikan model → panggil method seperti .find() / .save()."
  },
  {
    name: "Type Safety",
    apa: "Kemampuan bahasa mendeteksi tipe data yang salah sebelum kode dijalankan.",
    fungsi: "Mencegah bug seperti \"5\" + 3 yang menghasilkan hasil tidak terduga.",
    cara: "Pakai bahasa bertipe statis (Rust, TypeScript) atau tambahkan type hints di Python."
  },
  {
    name: "Ekosistem",
    apa: "Kumpulan library, tools, dan komunitas di sekitar sebuah bahasa.",
    fungsi: "Mempercepat development karena tidak perlu membuat semuanya sendiri.",
    cara: "Cari package di package manager: npm (JS), crates.io (Rust), PyPI (Python)."
  },
  {
    name: "Concurrency",
    apa: "Kemampuan menangani banyak tugas bersamaan dalam satu waktu.",
    fungsi: "Menangani ribuan request user tanpa server lemot.",
    cara: "Gunakan async/await, thread, atau goroutine sesuai bahasa yang dipakai."
  },
  {
    name: "Serverless",
    apa: "Cara menjalankan kode tanpa mengelola server sendiri.",
    fungsi: "Fokus ke kode; urusan server (skala, maintenance) diserap penyedia cloud.",
    cara: "Tulis fungsi → deploy ke AWS Lambda / Cloudflare Workers / Vercel Functions."
  },
  {
    name: "SSR (Server-Side Rendering)",
    apa: "Halaman web yang di-render (dibuat) di server, bukan di browser.",
    fungsi: "SEO lebih baik & loading pertama lebih cepat karena HTML sudah jadi.",
    cara: "Aktifkan SSR di framework seperti Next.js, Nuxt, atau SvelteKit."
  },
  {
    name: "SPA (Single Page Application)",
    apa: "Aplikasi web yang tidak reload halaman saat berpindah menu.",
    fungsi: "Pengalaman pengguna seperti aplikasi desktop: cepat & mulus.",
    cara: "Pakai React/Vue/Angular dengan client-side routing (React Router, Vue Router)."
  },
  {
    name: "Compiled vs Interpreted",
    apa: "Compiled = kode diubah jadi kode mesin dulu. Interpreted = kode dijalankan langsung.",
    fungsi: "Compiled lebih cepat; interpreted lebih fleksibel & mudah diuji.",
    cara: "Contoh compiled: Rust, Go. Contoh interpreted: Python, JavaScript."
  },
  {
    name: "Git",
    apa: "Version Control System (VCS) untuk melacak setiap perubahan kode.",
    fungsi: "Kolaborasi tim, rollback ke versi lama, branching & merging, code review.",
    cara: "git init → git add . → git commit -m \"pesan\" → git push → git pull."
  },
  {
    name: "Docker",
    apa: "Platform container: membungkus aplikasi + dependency dalam satu paket.",
    fungsi: "Aplikasi jalan sama persis di dev, staging, dan produksi.",
    cara: "Buat Dockerfile → docker build -t my-app . → docker run -p 3000:3000 my-app."
  },
  {
    name: "Kubernetes (K8s)",
    apa: "Orkestrator container dari Google (sekarang CNCF).",
    fungsi: "Auto scaling, auto healing, rolling update, load balancing container.",
    cara: "Buat deployment.yaml & service.yaml → kubectl apply -f deployment.yaml."
  },
  {
    name: "PostgreSQL",
    apa: "Database relasional open-source tercanggih, ACID compliant, extensible.",
    fungsi: "Menyimpan data apa pun: keuangan, geospasial (PostGIS), vector (pgvector), JSON.",
    cara: "psql -U postgres → CREATE DATABASE mydb → hubungkan via driver (sqlx, pg)."
  },
  {
    name: "MySQL",
    apa: "Database relasional open-source populer, standar industri untuk web app.",
    fungsi: "Menyimpan data relasional seperti user, order, product.",
    cara: "mysql -u root -p → CREATE DATABASE mydb → CREATE TABLE users(...)."
  },
  {
    name: "MongoDB",
    apa: "Database NoSQL document-based (JSON-like), schema-flexible.",
    fungsi: "Aplikasi dengan struktur data yang sering berubah, prototype cepat, big data.",
    cara: "mongosh → use mydb → db.users.insertOne({name: \"John\"})."
  },
  {
    name: "SQLite",
    apa: "Database engine embedded — tersimpan dalam satu file, tanpa server.",
    fungsi: "Database lokal untuk mobile/desktop app, development, testing.",
    cara: "sqlite3 mydb.db → tulis SQL standar (tidak ada server yang harus dijalankan)."
  },
  {
    name: "Redis",
    apa: "In-memory data store (database di RAM) berbasis key-value.",
    fungsi: "Caching, session store, queue, real-time leaderboard, pub/sub.",
    cara: "redis-server → redis-cli → SET key \"value\" → GET key → pakai ioredis di Node."
  },
  {
    name: "Neon",
    apa: "Database-as-a-Service untuk Postgres dari Databricks (yang dipakai Luxio).",
    fungsi: "Hosting Postgres tanpa urusan server: branching, scale-to-zero, autoscaling.",
    cara: "Buka console.neon.tech → buat project → copy connection string → isi DATABASE_URL."
  },
  {
    name: "Supabase",
    apa: "Open-source Firebase alternatif berbasis Postgres (database + auth + storage).",
    fungsi: "Backend siap pakai: API otomatis, row level security, realtime, storage.",
    cara: "Buat project → dapat URL & anon key → supabase.from('table').select('*')."
  },
  {
    name: "React",
    apa: "Library UI dari Meta untuk membangun antarmuka berbasis komponen.",
    fungsi: "Membangun web app interaktif & SPA; mobile lewat React Native.",
    cara: "npm create vite@latest my-app -- --template react → edit App.jsx → npm run dev."
  },
  {
    name: "Vue.js",
    apa: "Framework frontend progresif dari Evan You, mudah diintegrasikan bertahap.",
    fungsi: "Dari widget kecil hingga SPA/SSR penuh (Nuxt).",
    cara: "npm create vue@latest → syntax Single-File Component (.vue)."
  },
  {
    name: "Angular",
    apa: "Framework frontend dari Google, wajib TypeScript, berbasis component + module.",
    fungsi: "Aplikasi web SPA enterprise-scale, dashboard kompleks.",
    cara: "ng new my-app → ng serve → edit .component.ts dan .component.html."
  },
  {
    name: "Svelte",
    apa: "Framework yang mengompilasi kode jadi JavaScript vanilla (tanpa runtime framework).",
    fungsi: "Aplikasi web cepat & kecil, sangat interaktif.",
    cara: "npm create vite@latest my-app -- --template svelte → syntax .svelte."
  },
  {
    name: "Next.js",
    apa: "React framework untuk produksi dari Vercel (SSR, SSG, ISR, API Routes).",
    fungsi: "Web app dengan SEO baik + full-stack dalam satu project.",
    cara: "npx create-next-app → buat folder app/ dengan page.tsx → npm run dev."
  },
  {
    name: "Node.js",
    apa: "Runtime JavaScript di server (V8 engine), event-driven, non-blocking I/O.",
    fungsi: "Backend API, real-time apps, microservices, CLI tools.",
    cara: "node file.js, atau npm init → npm install express → tulis server."
  },
  {
    name: "TypeScript",
    apa: "Superset JavaScript dengan static typing (JavaScript + tipe data).",
    fungsi: "Menulis JavaScript yang lebih aman — bug tipe data terdeteksi saat mengetik.",
    cara: "npm install -g typescript → buat file.ts → tsc file.ts menghasilkan .js."
  },
  {
    name: "Express.js",
    apa: "Web framework minimal untuk Node.js, standar de facto backend JavaScript.",
    fungsi: "Membuat REST API & web server cepat dengan middleware.",
    cara: "npm install express → app.get('/', (req,res) => res.send('Hello')) → app.listen(3000)."
  },
  {
    name: "Rust",
    apa: "Bahasa sistem dari Rust Foundation — memory safe tanpa garbage collection.",
    fungsi: "Sistem, web backend (Axum/Rocket), performa kritis, CLI tools.",
    cara: "cargo new my-project → tulis di src/main.rs → cargo build / cargo run."
  },
  {
    name: "Axum",
    apa: "Web framework Rust modern, dibangun di atas tower & hyper dari tim tokio.",
    fungsi: "Membuat REST API backend di Rust dengan performa tinggi (dipakai Luxio).",
    cara: "Tambah axum di Cargo.toml → Router::new() → route(\"/\", get(handler))."
  },
  {
    name: "SQLx",
    apa: "Database driver & ORM untuk Rust dengan compile-time checked queries (dipakai Luxio).",
    fungsi: "Menghubungkan aplikasi Rust ke Postgres/MySQL/SQLite dengan query terperiksa.",
    cara: "sqlx::query!(\"SELECT ...\").fetch_all(&pool) — query salah = tidak bisa kompilasi."
  },
  {
    name: "Go (Golang)",
    apa: "Bahasa dari Google: kompilasi, static typing, concurrency built-in (goroutines).",
    fungsi: "Backend API performa tinggi, microservices, CLI tools, infrastructure.",
    cara: "go mod init my-app → main.go → go run . → go build (binary statis tunggal)."
  },
  {
    name: "Python",
    apa: "Bahasa high-level interpreted, syntax bersih, multi-paradigma.",
    fungsi: "Web backend (Django/FastAPI), data science/AI, automation, scraping.",
    cara: "python file.py → untuk web: pip install fastapi uvicorn → uvicorn main:app."
  },
  {
    name: "Java",
    apa: "Bahasa enterprise bersejarah (1995), JVM-based, object oriented.",
    fungsi: "Backend enterprise (Spring Boot), Android native, big data.",
    cara: "javac Main.java → java Main → Spring Boot: mvn spring-boot:run."
  },
  {
    name: "C#",
    apa: "Bahasa dari Microsoft, bagian dari ekosistem .NET.",
    fungsi: "Web backend (ASP.NET), API, desktop, game (Unity), mobile (.NET MAUI).",
    cara: "dotnet new webapi → dotnet run → edit Program.cs & Controllers/."
  },
  {
    name: "PHP",
    apa: "Bahasa scripting untuk web sejak 1995, khusus backend web.",
    fungsi: "70%+ web memakai PHP (WordPress, Laravel): web dynamic, API, e-commerce.",
    cara: "Buat index.php → php -S localhost:8000 → jalankan di server."
  },
  {
    name: "Ruby",
    apa: "Bahasa berfilosofi \"optimized for developer happiness\".",
    fungsi: "Web dengan Ruby on Rails — produktivitas tinggi dari ide ke launching.",
    cara: "gem install rails → rails new my-app → rails server."
  },
  {
    name: "Elixir / Phoenix",
    apa: "Elixir (bahasa di atas Erlang VM) + framework Phoenix + LiveView.",
    fungsi: "Aplikasi real-time super efisien — concurrency & fault-tolerance terbaik.",
    cara: "mix new my_app → tambah Phoenix → mix phx.server. (LiveView = UI real-time tanpa JS)."
  },
  {
    name: "Laravel",
    apa: "Web framework PHP terpopuler, \"The PHP framework for artisans\".",
    fungsi: "Full-stack web app: API, admin panel, e-commerce, CRM.",
    cara: "composer create-project laravel/laravel my-app → php artisan serve."
  },
  {
    name: "Django",
    apa: "Web framework Python full-stack, \"batteries-included\" (admin, ORM, auth sudah ada).",
    fungsi: "Membangun web app kompleks cepat — cocok MVP, CRM, content management.",
    cara: "pip install django → django-admin startproject mysite → python manage.py runserver."
  },
  {
    name: "FastAPI",
    apa: "Web framework Python modern untuk API dengan type hints & OpenAPI auto.",
    fungsi: "REST API cepat dengan validasi otomatis & dokumentasi Swagger jadi sendiri.",
    cara: "pip install fastapi uvicorn → uvicorn main:app --reload → buka /docs."
  },
  {
    name: "Prisma",
    apa: "ORM untuk Node.js/TypeScript — otomatisasi query database, type-safe.",
    fungsi: "Menulis query DB pakai JS/TS tanpa SQL mentah, auto-completion di IDE.",
    cara: "Buat schema.prisma → prisma generate → prisma.user.create({data: {...}})."
  },
  {
    name: "tRPC",
    apa: "Library API type-safe antara frontend & backend — tanpa REST/GraphQL.",
    fungsi: "Memanggil fungsi backend dari frontend seperti fungsi biasa, type safety penuh.",
    cara: "Di backend: initTRPC.create() → router({...}) → di frontend: trpc.greet.useQuery()."
  },
  {
    name: "Flyway",
    apa: "Tool migrasi database versioning berbasis file SQL.",
    fungsi: "Melacak perubahan skema DB seperti git — tiap perubahan = file SQL bernomor.",
    cara: "Buat sql/V1__create_users.sql → flyway migrate → file baru otomatis dijalankan."
  },
  {
    name: "Liquibase",
    apa: "Tool migrasi database versioning (alternatif Flyway) berbasis XML/YAML/JSON.",
    fungsi: "Sama seperti Flyway: melacak & menjalankan perubahan skema berurutan.",
    cara: "Buat changelog.xml → definisikan changeset → liquibase update."
  },
  {
    name: "Bucket (Object Storage)",
    apa: "Wadah penyimpanan file di layanan object storage (S3-style).",
    fungsi: "Menyimpan gambar, video, file user, backup — diakses lewat API/URL.",
    cara: "Buat bucket → upload file → dapat URL → simpan URL di database."
  },
  {
    name: "S3-compatible",
    apa: "API penyimpanan yang mengikuti standar Amazon S3.",
    fungsi: "Kode yang sama bisa dipakai untuk Backblaze/R2/Supabase/S3 tanpa ubah SDK.",
    cara: "Ganti endpoint & credentials, SDK AWS tetap jalan."
  },
  {
    name: "CDN (Content Delivery Network)",
    apa: "Jaringan server global yang menyimpan salinan file dekat ke user.",
    fungsi: "Loading file/foto lebih cepat dari mana pun di dunia.",
    cara: "Aktifkan CDN di penyedia (Cloudflare, Vercel, AWS CloudFront) → file otomatis dicache."
  },
  {
    name: "Presigned URL",
    apa: "URL khusus yang memberi akses file dalam waktu terbatas.",
    fungsi: "Memberi akses unduh file privat ke orang tertentu tanpa membuka bucket.",
    cara: "Buat presigned URL dari SDK → bagikan → berlaku selama durasi yang diset."
  },
  {
    name: "Egress fee",
    apa: "Biaya transfer data keluar dari penyimpanan (saat user download).",
    fungsi: "Menentukan harga hosting media — Cloudflare R2 bebas biaya ini.",
    cara: "Pilih penyedia dengan egress gratis untuk aplikasi media banyak download."
  },
  {
    name: "Zustand",
    apa: "State management library minimal untuk React (dipakai Luxio).",
    fungsi: "Menyimpan & membagikan state global antar komponen tanpa boilerplate Redux.",
    cara: "create((set) => ({ count: 0, increment: () => set(s => ({count: s.count+1})) })) → panggil di komponen."
  },
  {
    name: "WebSocket",
    apa: "Protokol komunikasi dua-arah (full duplex) real-time antara browser & server.",
    fungsi: "Chat, notifikasi real-time, game online, kolaborasi dokumen, live bidding.",
    cara: "Server: new WebSocket.Server({port:8080}) → client: new WebSocket('ws://...')."
  },
  {
    name: "Vercel",
    apa: "Cloud platform frontend & serverless, khusus Next.js/React/static sites.",
    fungsi: "Deploy instan dari GitHub: auto HTTPS, CDN global, analytics.",
    cara: "Push kode ke GitHub → hubungkan ke Vercel → deploy otomatis tiap push."
  },
  {
    name: "Cloudflare Workers",
    apa: "Platform serverless yang menjalankan kode di edge network Cloudflare.",
    fungsi: "Kode backend dekat ke user: latensi rendah, geolocation, A/B testing.",
    cara: "npx wrangler deploy setelah menulis kode di src/index.ts."
  },
  {
    name: "Render",
    apa: "Cloud platform PaaS — deploy app dari GitHub langsung (Luxio punya render.yaml).",
    fungsi: "Hosting web service, static site, cron job, database Postgres/Redis.",
    cara: "Hubungkan repositori GitHub → Render auto-detect → klik Deploy."
  },
  {
    name: "Backblaze B2",
    apa: "Penyimpanan object storage S3-compatible dengan 10GB gratis.",
    fungsi: "Hosting file/bucket untuk aplikasi dengan harga egress termurah.",
    cara: "Buat bucket → dapat S3 endpoint & key → upload via SDK AWS."
  },
  {
    name: "Cloudflare R2",
    apa: "Object storage S3-compatible dari Cloudflare, 10GB gratis, 0 egress.",
    fungsi: "Bucket murah untuk media besar & aplikasi (tanpa biaya download).",
    cara: "Buat R2 bucket di dashboard Cloudflare → sambungkan dengan SDK S3."
  },
  {
    name: "Firebase Storage",
    apa: "Penyimpanan file Google (bagian Firebase), 5GB gratis.",
    fungsi: "Upload/download file dari aplikasi mobile/web dengan SDK & security rules.",
    cara: "Tambahkan Firebase ke project → upload file → dapat download URL."
  },
  {
    name: "MEGA",
    apa: "Penyimpanan cloud 20GB gratis dengan enkripsi end-to-end.",
    fungsi: "Menyimpan file pribadi yang butuh privasi & keamanan tinggi.",
    cara: "Daftar akun MEGA → upload file → bagikan link terenkripsi."
  },
  {
    name: "AWS S3",
    apa: "Object storage asli dari Amazon — standar industri.",
    fungsi: "Bucket untuk aplikasi enterprise, backup, data lake; free tier terbatas.",
    cara: "Buat bucket di AWS Console → atur IAM & policy → akses via SDK."
  },
  {
    name: "Bun",
    apa: "Runtime JavaScript/TypeScript super cepat (pengganti Node.js), ditulis Zig.",
    fungsi: "Runtime + bundler + test runner + package manager dalam satu binary.",
    cara: "bun run file.ts → bun install (pengganti npm install)."
  },
  {
    name: "Solid.js",
    apa: "Framework frontend performa tercepat — tanpa Virtual DOM, signal-based.",
    fungsi: "Aplikasi butuh render cepat & bundle kecil (dashboard real-time).",
    cara: "npm create vite@latest my-app -- --template solid."
  },
  {
    name: "AWS (Amazon Web Services)",
    apa: "Cloud provider terbesar dari Amazon (EC2, RDS, Lambda, S3, dan 200+ layanan).",
    fungsi: "Menjalankan server, database, storage tanpa beli hardware sendiri.",
    cara: "Buat akun → buka console → pilih layanan → launch instance → SSH → deploy."
  },
  {
    name: "CockroachDB",
    apa: "Database SQL terdistribusi (Distributed SQL), kompatibel Postgres.",
    fungsi: "High availability & low latency global multi-region (fintech, e-commerce besar).",
    cara: "Deploy cluster → connect dengan driver Postgres biasa."
  },
  {
    name: "PlanetScale",
    apa: "Database-as-a-Service berbasis Vitess (MySQL compatible) dengan branching.",
    fungsi: "Hosting MySQL skalabel dengan workflow branching (mirror Neon untuk MySQL).",
    cara: "Buat database di planetscale.com → dapat connection string → hubungkan."
  }
];
