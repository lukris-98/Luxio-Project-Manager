# Perbandingan Bahasa & Stack Pemrograman Lengkap

> **Tujuan**: Membandingkan berbagai bahasa, framework, database, dan kombinasi stack secara objektif dengan 10+ kriteria.
> **Sistem Poin**: 1–10 per kriteria (10 = terbaik). Pemenang kategori ditandai **🥇**.

---

## 📋 Glosarium Istilah Umum (baca dulu)

| Istilah | Arti | Fungsi | Cara Pakai |
|---------|------|--------|------------|
| **Stack** | Kumpulan teknologi yang dipakai bersama (frontend + backend + DB) | Membangun aplikasi lengkap dari ujung ke ujung | Pilih 1 frontend + 1 backend + 1 database yang cocok |
| **Framework** | Kerangka kerja berisi aturan & tools siap pakai | Mempercepat development dengan kode yang sudah terstruktur | Install framework → ikuti struktur foldernya → tulis kode di dalam template yang disediakan |
| **Runtime** | Lingkungan untuk menjalankan kode di luar browser | Eksekusi kode di server (backend) | Install runtime → jalankan file kode dengan perintah CLI |
| **ORM/ODM** | Penerjemah antara kode dan database | Menulis query database pakai bahasa pemrograman, bukan SQL mentah | Install ORM → definisikan model/class → panggil method (.save(), .find()) |
| **Type Safety** | Kemampuan mendeteksi tipe data salah sebelum kode jalan | Mencegah bug seperti `"5" + 3` menghasilkan hasil yang tidak terduga | Pakai bahasa dengan tipe statis (Rust, TypeScript) atau tambahkan type hints |
| **Ecosystem** | Kumpulan library, tools, dan komunitas sekitar bahasa | Mempercepat development karena tidak perlu semuanya buat sendiri | Cari package di package manager (npm, crates.io, PyPI) |
| **Concurrency** | Kemampuan menangani banyak tugas bersamaan | Menangani ribuan request user tanpa lemot | Pakai async/await, thread, atau goroutine sesuai bahasa |
| **Serverless** | Menjalankan kode tanpa mengelola server sendiri | Fokus ke kode, urusan server diserap penyedia cloud | Tulis fungsi → deploy ke AWS Lambda / Cloudflare Workers |
| **SSR (Server-Side Rendering)** | Halaman web di-render di server, bukan di browser | SEO lebih baik & loading pertama lebih cepat | Aktifkan SSR di framework (Next.js, Nuxt, SvelteKit) |
| **SPA (Single Page Application)** | Aplikasi web yang tidak reload halaman saat navigasi | Pengalaman pengguna seperti aplikasi desktop | Pakai React/Vue/Angular dengan client-side routing |
| **Full-stack** | Bisa mengerjakan frontend + backend + database sekaligus | Satu orang bisa membuat aplikasi lengkap sendiri | Kuasai 1 frontend + 1 backend + 1 database yang saling cocok |
| **Compiled vs Interpreted** | Compiled: diubah jadi kode mesin dulu. Interpreted: dijalankan langsung | Compiled lebih cepat. Interpreted lebih fleksibel | Compiled: Rust, Go. Interpreted: Python, JavaScript |
| **REPL (Read-Eval-Print Loop)** | Terminal interaktif yang langsung menjalankan kode | Eksperimen cepat tanpa perlu simpan file | Ketik `python` atau `node` di terminal, lalu tulis kode langsung |
| **Tree Shaking** | Membuang kode yang tidak dipakai saat build | Ukuran file akhir lebih kecil, loading lebih cepat | Aktif secara otomatis di bundler modern (Vite, Webpack, Rollup) |

---

## 1. Perbandingan Bahasa Frontend

| Kriteria | **React** | **Vue** | **Angular** | **Svelte** | **Solid** | **Next.js (React SSR)** |
|----------|-----------|---------|-------------|------------|-----------|--------------------------|
| **1. Performa runtime** | 7 | 7 | 7 | 9 | **10** | 7 |
| **2. Ekosistem/library** | **10** | 8 | 9 | 5 | 3 | **10** |
| **3. Kurva belajar** | 7 | 9 | 4 | 9 | 6 | 6 |
| **4. Pasar kerja (lowongan)** | **10** | 7 | 8 | 3 | 1 | 9 |
| **5. Komunitas & dukungan** | **10** | 8 | 8 | 5 | 3 | 9 |
| **6. Type Safety (dengan TS)** | 9 | 8 | **10** | 7 | 9 | 9 |
| **7. Kecepatan development** | 7 | 9 | 5 | **10** | 8 | 7 |
| **8. Bundle size** | 5 | 6 | 4 | **9** | 9 | 5 |
| **9. SEO-friendliness** | 4 | 5 | 5 | 5 | 4 | **10** |
| **10. Tooling & DX** | 9 | 9 | 9 | 7 | 5 | 9 |
| **11. Mobile development** | **10** (React Native) | 7 (NativeScript) | 8 (Ionic) | 4 | 2 | 3 |
| **12. Maturitas & stabilitas** | **10** | 8 | 9 | 6 | 3 | 8 |
| **🏆 Total Poin** | **98** | 91 | 86 | 78 | 63 | 92 |

> **🏆 Pemenang Frontend: React (98 poin)** — Ekosistem terbesar, pasar kerja terbanyak, dan React Native sebagai bonus untuk mobile.
> *Catatan: Next.js (92) menang di SEO. Svelte/Solid unggul di bundle size & performa murni.*

---

## 2. Perbandingan Bahasa Backend

| Kriteria | **Rust** | **Go** | **Node.js (TS)** | **Python** | **Java** | **.NET (C#)** | **Ruby** | **PHP** |
|----------|----------|--------|-----------------|------------|----------|---------------|----------|---------|
| **1. Performa mentah** | **10** | 9 | 6 | 4 | 8 | 8 | 3 | 5 |
| **2. Memory safety** | **10** | 7 | 5 | 5 | 6 | 7 | 4 | 4 |
| **3. Concurrency** | 9 | **10** | 7 | 4 | 7 | 8 | 3 | 3 |
| **4. Ekosistem/library** | 6 | 8 | **10** | 9 | 9 | 9 | 7 | 8 |
| **5. Kurva belajar** | 3 | 8 | 8 | **10** | 5 | 6 | 9 | 9 |
| **6. Pasar kerja** | 5 | 8 | 9 | 8 | **10** | 8 | 4 | 7 |
| **7. Kecepatan development** | 4 | 7 | **10** | 9 | 5 | 6 | 9 | 8 |
| **8. Type safety (built-in)** | **10** | 8 | 7 | 4 | 9 | 9 | 3 | 4 |
| **9. Deployment & DevOps** | 6 | **10** (binary statis) | 8 | 7 | 8 | 8 | 6 | 9 |
| **10. Web framework populer** | 7 (Axum) | 8 (Gin) | **10** (Express/Next) | 8 (FastAPI) | 8 (Spring) | 8 (ASP.NET) | 6 (Rails) | 8 (Laravel) |
| **11. Komunitas & dokumentasi** | 7 | 8 | **10** | 9 | 9 | 8 | 7 | 8 |
| **12. Scaling horizontal** | 8 | **10** | 6 | 4 | 8 | 8 | 4 | 4 |
| **🏆 Total Poin** | 85 | **101** | 96 | 81 | 92 | 93 | 65 | 77 |

> **🏆 Pemenang Backend: Go (101 poin)** — Performa tinggi, concurrency built-in, binary kecil untuk deploy, kurva belajar sedang.
> *Catatan: Node.js (96) unggul di ekosistem & kecepatan development. Rust (85) unggul performa & memory safety tapi kurva curam.*

---

## 3. Perbandingan Database

| Kriteria | **PostgreSQL** | **MySQL** | **MongoDB** | **SQLite** | **Redis** | **Supabase (Postgres + tools)** |
|----------|---------------|-----------|-------------|------------|-----------|-------------------------------|
| **1. Performa query kompleks** | **10** | 8 | 5 | 5 | 3 | **10** |
| **2. Relasional/struktur data** | **10** | 9 | 4 | 8 | 1 | **10** |
| **3. Fleksibilitas skema** | 7 | 6 | **10** | 5 | 9 | 7 |
| **4. Ekstensi & fitur lanjutan** | **10** | 5 | 6 | 3 | 4 | 9 |
| **5. Kemudahan setup** | 6 | 7 | 8 | **10** | 7 | 8 |
| **6. Performa baca** | 8 | 8 | 8 | 6 | **10** | 8 |
| **7. Performa tulis** | 7 | 7 | 8 | 5 | **10** | 7 |
| **8. ACID compliance** | **10** | 8 | 5 | **10** | 3 | **10** |
| **9. Replikasi & HA** | 9 | 8 | 9 | 1 | **10** | 9 |
| **10. Ekosistem tools** | **10** | 8 | 8 | 5 | 7 | 9 |
| **11. Full-text search** | 8 | 5 | 7 | 3 | 2 | 8 |
| **12. JSON/document support** | 9 | 8 | **10** | 4 | 2 | 9 |
| **🏆 Total Poin** | **104** | 87 | 88 | 65 | 68 | **104** |

> **🏆 Pemenang Database: PostgreSQL (104 poin) & Supabase (104 poin)** — Postgres sebagai engine terbaik, Supabase sebagai penyedia dengan auth + API + storage bawaan.
> *Catatan: MongoDB unggul di fleksibilitas skema & JSON. Redis unggul di performa baca/tulis sebagai cache.*

---

## 4. Perbandingan Kombinasi Stack Lengkap

| Kriteria | **MERN** (Mongo+Express+React+Node) | **T3** (Next+tRPC+Prisma+Postgres) | **Rustack** (Rust+Axum+React+Postgres) | **JAMStack** (Jekyll+API+Markdown) | **.NET** (C#+SQL Server+React) | **Laravel** (PHP+MySQL+Vue) | **Django** (Python+Postgres+React) | **Go-Vue-Postgres** |
|----------|--------------------------------------|--------------------------------------|----------------------------------------|--------------------------------------|-------------------------------|----------------------------|-------------------------------------|---------------------|
| **1. Performa keseluruhan** | 6 | 8 | **10** | 5 | 8 | 5 | 5 | 9 |
| **2. Type safety end-to-end** | 4 | **10** | 9 | 3 | 8 | 4 | 5 | 7 |
| **3. Kecepatan build app** | **10** | 8 | 3 | 7 | 5 | **10** | **10** | 7 |
| **4. Ekosistem & library** | **10** | 7 | 4 | 4 | 9 | 8 | 8 | 6 |
| **5. Kurva belajar tim** | 8 | 7 | 3 | 9 | 5 | **10** | 8 | 8 |
| **6. Pasar kerja** | 9 | 8 | 3 | 3 | 9 | 6 | 8 | 5 |
| **7. Deployment mudah** | 8 | 8 | 7 | **10** | 7 | 9 | 8 | 8 |
| **8. Scalability** | 6 | 8 | **10** | 4 | 9 | 5 | 6 | 9 |
| **9. SEO-friendliness** | 5 | **10** | 6 | 7 | 6 | 7 | 6 | 6 |
| **10. Komunitas & job market** | **10** | 8 | 2 | 3 | 9 | 7 | 8 | 5 |
| **11. Mobile (React Native)** | **10** | 5 | 5 | 2 | 7 | 3 | 3 | 3 |
| **12. Maturitas & production-ready** | 9 | 7 | 4 | 7 | **10** | 9 | 9 | 6 |
| **🏆 Total Poin** | 95 | **102** | 67 | 64 | 92 | 83 | 84 | 79 |

> **🏆 Pemenang Stack: T3 Stack (102 poin)** — Next.js + tRPC + Prisma + PostgreSQL. Type safety penuh dari database ke frontend, SEO dengan Next.js, ekosistem React, database Postgres terbaik.
> *Runner-up: MERN (95) untuk prototype cepat & lowongan kerja terbanyak. .NET (92) untuk enterprise.*

---

## 5. Perbandingan Runtime & Infrastructure

| Kriteria | **Docker** | **Kubernetes** | **Vercel** | **Netlify** | **AWS EC2** | **Cloudflare Workers** | **Render** |
|----------|-----------|-----------------|-------------|-------------|-------------|----------------------|------------|
| **1. Ease of use** | 7 | 3 | **10** | **10** | 4 | 8 | 8 |
| **2. Scalability** | 7 | **10** | 7 | 6 | 9 | 8 | 6 |
| **3. Cost effective** | 8 | 5 | 7 | 7 | 5 | **10** | 7 |
| **4. Cold start** | 9 | 9 | 6 | 5 | **10** | 4 | 5 |
| **5. Fleksibilitas & kontrol** | **10** | **10** | 4 | 4 | 9 | 5 | 5 |
| **6. Global edge network** | 2 | 3 | 8 | 7 | 5 | **10** | 4 |
| **7. Ekosistem & integrasi** | **10** | 8 | 8 | 7 | **10** | 6 | 5 |
| **8. Dokumentasi & community** | **10** | 8 | 8 | 7 | 9 | 6 | 5 |
| **🏆 Total Poin** | **63** | 57 | 58 | 53 | 62 | 59 | 45 |

> **🏆 Pemenang Runtime: Docker (63 poin)** — Standar de facto container, didukung semua platform deployment.
> *Runner-up: AWS EC2 (62) untuk fleksibilitas maksimal. Cloudflare Workers (59) untuk edge computing murah.*

---

## 6. Perbandingan Layanan Database-as-a-Service (DBaaS)

| Kriteria | **Neon** | **Supabase** | **PlanetScale** | **Mongo Atlas** | **RDS (AWS)** | **CockroachDB** |
|----------|-----------|--------------|-----------------|-----------------|----------------|-----------------|
| **1. Free tier** | **10** | 9 | 5 | 7 | 1 | 0 |
| **2. Performa** | 8 | 7 | 9 | 7 | **10** | 9 |
| **3. Branching (DB versioning)** | **10** | 3 | 8 | 1 | 1 | 1 |
| **4. Scale to zero** | **10** | 8 | 7 | 5 | 1 | 1 |
| **5. Ekosistem tools** | 8 | **10** | 7 | 8 | 9 | 5 |
| **6. Jenis database** | 9 (Postgres) | **10** (Postgres + extras) | 8 (MySQL compat) | 7 (Mongo) | 9 (Postgres/MySQL) | 7 (Distributed SQL) |
| **7. Kemudahan setup** | 9 | **10** | 8 | 8 | 5 | 6 |
| **8. Pricing predictability** | 8 | 7 | 5 | 6 | **10** | 8 |
| **🏆 Total Poin** | **72** | 64 | 57 | 52 | 55 | 38 |

> **🏆 Pemenang DBaaS: Neon (72 poin)** — Free tier generous, branching (DB versioning) unik, scale-to-zero hemat biaya. Ini yang sudah dipakai di Luxio Project Manager.

---

# Glosarium Lengkap (A–Z)

Penjelasan rinci tentang setiap bahasa, framework, database, dan tool yang disebutkan di atas.

---

## A

### Angular
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Framework frontend dari Google, ditulis dalam TypeScript, arsitektur berbasis component + module + dependency injection |
| **Fungsinya** | Membangun aplikasi web SPA enterprise-scale, aplikasi dashboard kompleks, aplikasi internal perusahaan |
| **Cara pakai** | `npm install -g @angular/cli` → `ng new my-app` → `ng serve` → edit `.component.ts` dan `.component.html` |
| **Karakteristik** | Type safety ketat (wajib TS), RxJS untuk async, struktur kode kaku, cocok untuk tim besar |

### AWS (Amazon Web Services)
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Cloud provider terbesar dari Amazon: EC2 (VPS), RDS (database), Lambda (serverless), S3 (storage), dan 200+ layanan lain |
| **Fungsinya** | Menjalankan server, database, storage, dan infrastruktur tanpa beli hardware sendiri |
| **Cara pakai** | Buat akun AWS → buka console → pilih layanan (misal EC2) → launch instance → SSH → deploy aplikasi |
| **Karakteristik** | Pay-as-you-go, skalabel global, kurva belajar curam, dokumentasi lengkap |

### Axum
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Web framework Rust yang modern, dibangun di atas tower & hyper, dari tim tokio |
| **Fungsinya** | Membuat REST API backend di Rust dengan performa tinggi dan type safety |
| **Cara pakai** | Tambah `axum = "0.7"` di Cargo.toml → buat `Router::new()` → `route("/", get(handler))` → `axum::serve(listener, app)` |
| **Karakteristik** | Ekosistem tower untuk middleware, integrasi tokio async, ergonomis sebagai framework Rust |

---

## B

### Bun
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Runtime JavaScript/TypeScript alternatif (pengganti Node.js) super cepat, ditulis dalam Zig |
| **Fungsinya** | Menjalankan kode JS/TS, bundler, test runner, dan package manager dalam satu binary |
| **Cara pakai** | `curl -fsSL https://bun.sh/install | bash` → `bun run file.ts` → `bun install` (ganti npm) |
| **Karakteristik** | Kecepatan 4× Node.js, built-in TypeScript, kompatibel dengan API Node.js |

---

## C

### C#
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa pemrograman dari Microsoft, bagian dari .NET ecosystem, kuat untuk enterprise & game (Unity) |
| **Fungsinya** | Membuat web backend (ASP.NET), API, desktop app, game (Unity), mobile (Xamarin/.NET MAUI) |
| **Cara pakai** | Install .NET SDK → `dotnet new webapi` → `dotnet run` → edit `Program.cs` & `Controllers/` |
| **Karakteristik** | Type safety kuat, performa tinggi, LINQ untuk query, ekosistem Visual Studio luas |

### Cloudflare Workers
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Platform serverless yang menjalankan kode di edge network Cloudflare (100+ lokasi global) |
| **Fungsinya** | Menjalankan kode backend dekat ke user (latensi rendah), cocok untuk API cepat, geolocation, A/B testing |
| **Cara pakai** | `npm create cloudflare` → tulis kode di `src/index.ts` → `npx wrangler deploy` |
| **Karakteristik** | Cold start cepat (< 5 ms), bayar per request, gratis 100k request/hari, batasan runtime CPU per request |

### CockroachDB
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database SQL terdistribusi (Distributed SQL), kompatibel Postgres, auto-scale multi-region |
| **Fungsinya** | Aplikasi yang butuh high availability & low latency global (multi-region aktif-aktif), fintech, e-commerce besar |
| **Cara pakai** | Deploy CockroachDB cluster → connect dengan driver Postgres biasa → tulis SQL seperti Postgres |
| **Karakteristik** | Auto-healing, strong consistency, SQL standard, lebih kompleks dari instance tunggal |

---

## D

### Django
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Web framework Python full-stack, "batteries-included" (sudah ada admin panel, ORM, auth, forms) |
| **Fungsinya** | Membangun web app kompleks dengan cepat dengan banyak fitur built-in, cocok untuk MVP, CRM, content management |
| **Cara pakai** | `pip install django` → `django-admin startproject mysite` → `python manage.py runserver` → edit `models.py`, `views.py`, `urls.py` |
| **Karakteristik** | Admin panel otomatis dari model, ORM kuat, template engine, komunitas besar, monolithik default |

### Docker
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Platform container: membungkus aplikasi + dependency dalam satu package (container) yang bisa jalan di mana pun |
| **Fungsinya** | Menyelesaikan masalah "works on my machine" — aplikasi jalan sama persis di dev, staging, produksi |
| **Cara pakai** | Buat `Dockerfile` → `docker build -t my-app .` → `docker run -p 3000:3000 my-app` → atau `docker-compose up` untuk multi-container |
| **Karakteristik** | Isolasi lengkap, image ringan (Alpine), standar de facto deployment, butuh pengetahuan networking & storage |

---

## E

### Express.js
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Web framework minimal untuk Node.js, "standar de facto" backend JavaScript |
| **Fungsinya** | Membuat REST API & web server cepat dengan middleware sederhana |
| **Cara pakai** | `npm install express` → `const app = express()` → `app.get('/', (req, res) => res.send('Hello'))` → `app.listen(3000)` |
| **Karakteristik** | Minimal, fleksibel (tidak ada aturan kaku), ekosistem middleware luas, cocok untuk API kecil hingga besar |

---

## F

### FastAPI
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Web framework Python modern untuk API, dengan type hints & OpenAPI auto-generation |
| **Fungsinya** | Membuat REST API cepat dengan validasi request otomatis & dokumentasi swagger langsung jadi |
| **Cara pakai** | `pip install fastapi uvicorn` → bikin `app = FastAPI()` → `@app.get("/")` → `uvicorn main:app --reload` → buka `/docs` untuk Swagger UI |
| **Karakteristik** | Performa tinggi (async), type hints = validasi otomatis, dokumentasi otomatis, asyncio support |

### Flyway
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Tool migrasi database versioning berbasis SQL file (Java-based, tapi ada CLI untuk bahasa apa pun) |
| **Fungsinya** | Melacak perubahan skema database seperti git — setiap perubahan adalah file SQL bernomor |
| **Cara pakai** | Buat folder `sql/V1__create_users.sql` → isi `CREATE TABLE users(...);` → jalankan `flyway migrate` → otomatis menjalankan file baru yang belum dijalankan |
| **Karakteristik** | Sederhana (file SQL biasa), support semua database major, cocok untuk tim yang suka SQL mentah |

---

## G

### Git
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Version control system (VCS) terpopuler, melacak setiap perubahan kode |
| **Fungsinya** | Kolaborasi tim, rollback ke versi sebelumnya, branching & merging, code review |
| **Cara pakai** | `git init` → `git add .` → `git commit -m "pesan"` → `git push` → `git pull` → `git checkout -b fitur-baru` |
| **Karakteristik** | Distributed (setiap dev punya salinan lengkap), branching murah, standar industri |

### Go (Golang)
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa dari Google, kompilasi, static typing, concurrency built-in (goroutines & channels) |
| **Fungsinya** | Backend API performa tinggi, microservices, CLI tools, network services, infrastructure tools (Docker, Kubernetes ditulis di Go) |
| **Cara pakai** | `go mod init my-app` → buat `main.go` → `package main; func main() { ... }` → `go run .` → `go build` (binary statis) |
| **Karakteristik** | Compile cepat, binary tunggal tanpa dependency, goroutine ringan (ribuan concurrent), syntax sederhana |

---

## J

### Java
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa enterprise bersejarah (1995), JVM-based, object oriented, dikelola Oracle |
| **Fungsinya** | Backend enterprise (Spring Boot), Android (native), big data (Apache Hadoop/Spark), fintech |
| **Cara pakai** | Install JDK → `javac Main.java` → `java Main` → Spring Boot: `spring init` → `mvn spring-boot:run` |
| **Karakteristik** | Write once run anywhere (JVM), ekosistem perpustakaan masif, verbose (banyak boilerplate), mature |

### JavaScript
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa inti web — jalan di browser & Node.js, interpreted, dynamic typing |
| **Fungsinya** | Frontend interaktif (semua web app modern), backend (Node.js), mobile (React Native), desktop (Electron) |
| **Cara pakai** | Langsung di browser (`<script>` tag) atau Node.js (`node file.js`) — `console.log('Hello')` |
| **Karakteristik** | Multi-paradigma, event-driven, non-blocking I/O, ekosistem npm terbesar sedunia |

---

## K

### Kubernetes (K8s)
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Orkestrator container dari Google (sekarang CNCF) — mengelola ratusan container secara otomatis |
| **Fungsinya** | Auto scaling, auto healing (restart container mati), rolling update, load balancing, service discovery |
| **Cara pakai** | Buat `deployment.yaml` & `service.yaml` → `kubectl apply -f deployment.yaml` → `kubectl get pods` |
| **Karakteristik** | Sangat kompleks (butuh waktu belajar), powerful untuk skala besar, standar de facto orchestration |

---

## L

### Laravel
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Web framework PHP terpopuler, "The PHP framework for artisans" — syntax elegant |
| **Fungsinya** | Full-stack web app: API, admin panel, e-commerce, CRM — semuanya dengan sintaks ekspresif |
| **Cara pakai** | `composer create-project laravel/laravel my-app` → `php artisan serve` → edit `routes/web.php`, `app/Models/`, `app/Http/Controllers/` |
| **Karakteristik** | Eloquent ORM, Blade template, fitur built-in: auth, mail, queue, notification, scheduling |

### Liquibase
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Tool migrasi database versioning (alternatif Flyway) — berbasis XML/YAML/JSON/SQL |
| **Fungsinya** | Sama seperti Flyway: melacak & menjalankan perubahan skema database secara berurutan |
| **Cara pakai** | Buat `changelog.xml` → definisikan changeset → `liquibase --changeLogFile=changelog.xml update` |
| **Karakteristik** | Lebih kompleks dari Flyway tapi lebih fleksibel, support rollback, format multiple |

---

## M

### MongoDB
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database NoSQL document-based (JSON-like), schema-flexible, scalable horizontal |
| **Fungsinya** | Aplikasi dengan struktur data yang suka berubah, prototype cepat, big data, real-time analytics |
| **Cara pakai** | Install → `mongod` start → `mongosh` → `use mydb` → `db.users.insertOne({name: "John"})` → connect dari kode dengan Mongoose (Node) |
| **Karakteristik** | Skema fleksibel (tanpa migrations!), query JSON-native, skalabilitas sharding, ACID hanya di transaction terbaru |

### MySQL
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database relasional open-source populer (Oracle), standar industri untuk web app |
| **Fungsinya** | Menyimpan data relasional (user, order, product) — cocok untuk web app, e-commerce, CMS (WordPress) |
| **Cara pakai** | Install → `mysql -u root -p` → `CREATE DATABASE mydb` → `CREATE TABLE users(...)` → hubungkan dengan aplikasi via driver |
| **Karakteristik** | Cepat, stabil, dokumentasi banyak, kurang fitur lanjutan dibanding Postgres, lisensi Oracle |

---

## N

### Neon
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database-as-a-Service untuk Postgres dari Databricks, dengan fitur branching, scale-to-zero, autoscaling |
| **Fungsinya** | Hosting Postgres tanpa urusan server — buat DB instan, branch (seperti git untuk DB), auto-scale, tidak bayar saat tidak dipakai |
| **Cara pakai** | Buka https://console.neon.tech → buat project → copy connection string → isi di `DATABASE_URL` → deploy |
| **Karakteristik** | Free tier 5 GB, branching pertama di industri Postgres, scale-to-zero (0 cost saat idle) |

### Next.js
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | React framework untuk produksi dari Vercel — SSR, SSG, ISR, API routes, App Router |
| **Fungsinya** | Membuat web app dengan SEO baik (SSR), static site cepat (SSG), full-stack (API Routes), semua dalam satu project |
| **Cara pakai** | `npx create-next-app` → buat folder `app/` dengan `page.tsx` → `npm run dev` |
| **Karakteristik** | SEO terbaik untuk React, file-based routing, React Server Components, ekosistem besar |

### Node.js
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Runtime JavaScript di server (V8 engine), event-driven, non-blocking I/O |
| **Fungsinya** | Backend API, real-time apps (chat/game), microservices, CLI tools, build tools |
| **Cara pakai** | Install → `node file.js` untuk jalan — atau `npm init` buat project → `npm install express` |
| **Karakteristik** | NPM terbesar sedunia (2+ juta package), single-threaded tapi event loop, paling banyak digunakan saat ini |

---

## P

### PHP
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa scripting untuk web yang sudah ada sejak 1995, khusus untuk backend web |
| **Fungsinya** | 70%+ web di internet pakai PHP (WordPress, Laravel) — membuat web dynamic, API, e-commerce |
| **Cara pakai** | Buat `index.php` → `<?php echo "Hello"; ?>` → jalankan di server (Apache/Nginx + PHP-FPM) atau `php -S localhost:8000` |
| **Karakteristik** | Mudah dipelajari, sangat matang, dokumentasi lengkap, performa lebih rendah dari Rust/Go |

### PlanetScale
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database-as-a-Service berbasis Vitess (MySQL compatible) dengan fitur branching, serverless driver, non-blocking schema changes |
| **Fungsinya** | Hosting MySQL yang skalabel dengan branching workflow (mirror Neon untuk MySQL) |
| **Cara pakai** | Buka planetscale.com → buat database → dapat connection string → hubungkan ke aplikasi |
| **Karakteristik** | MySQL compatible, branching + deploy requests (schema change review), non-blocking DDL |

### PostgreSQL
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database relasional open-source tercanggih — ACID compliant, extensible, komunitas aktif |
| **Fungsinya** | Menyimpan data apa pun: keuangan, geospasial (PostGIS), vector (pgvector), JSON, full-text search |
| **Cara pakai** | Install → `psql -U postgres` → `CREATE DATABASE mydb` → hubungkan via driver (`sqlx`, `pg`) |
| **Karakteristik** | Paling kaya fitur dari semua database, ekstensi luas, standar SQL compliance tinggi, JSONB native |

### Prisma
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | ORM (Object-Relational Mapping) untuk Node.js dan TypeScript — otomatisasi query database |
| **Fungsinya** | Menulis query database pakai JavaScript/TypeScript tanpa SQL mentah — auto-completion, type safe |
| **Cara pakai** | `npm install @prisma/client` → buat `schema.prisma` definisi model → `prisma generate` → `prisma.user.create({data: {...}})` |
| **Karakteristik** | Type safety e2e dari DB ke kode, auto-completion IDE, migrasi versioning (`prisma migrate`), query API intuitif |

### Python
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa pemrograman high-level interpreted, syntax bersih & mudah dibaca, multi-paradigma |
| **Fungsinya** | Web backend (Django, FastAPI), data science/AI (NumPy, Pandas, TensorFlow), automation, scraping |
| **Cara pakai** | Install → `python file.py` → untuk web: `pip install fastapi uvicorn` → tulis API → `uvicorn main:app` |
| **Karakteristik** | Paling mudah dipelajari, AI/ML ecosystem tak terkalahkan, lebih lambat dari compiled language |

---

## R

### React
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Library UI dari Facebook (Meta) untuk membangun antarmuka pengguna berbasis komponen |
| **Fungsinya** | Membangun aplikasi web interaktif & SPA, mobile (React Native), desktop (Electron) |
| **Cara pakai** | `npm create vite@latest my-app -- --template react` → edit `App.jsx` → JSX (HTML + JS bersama) |
| **Karakteristik** | Virtual DOM, komponen reusable, deklaratif, ekosistem masif, hooks (useState, useEffect) |

### Redis
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | In-memory data store (database di RAM) — key-value store super cepat |
| **Fungsinya** | Caching (percepat query), session store, queue (sidekiq/bull), real-time leaderboard, pub/sub |
| **Cara pakai** | Install → `redis-server` → `redis-cli` → `SET key "value"` → `GET key` → connect dari kode pakai `ioredis` |
| **Karakteristik** | Sub-millisecond response, data persistent (bisa disimpan ke disk), tipe data beragam (string, list, set, sorted set, hash) |

### Render
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Cloud platform PaaS (Platform as a Service) — deploy app dari GitHub langsung |
| **Fungsinya** | Hosting web service, static site, cron job, database Postgres/Redis, semua di satu dashboard |
| **Cara pakai** | Hubungkan repositori GitHub → Render otomatis detect → klik "Deploy" (perhatikan `render.yaml` untuk konfigurasi) |
| **Karakteristik** | Free tier untuk web service + Postgres, auto HTTPS, auto deploy dari git push, sleep after inactivity |

### Ruby
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa dengan filosofi "optimized for developer happiness" — elegant & ekspresif |
| **Fungsinya** | Web dengan Ruby on Rails framework — produktivitas tinggi, cepat dari ide ke launching |
| **Cara pakai** | Install Ruby → `gem install rails` → `rails new my-app` → `rails server` |
| **Karakteristik** | Rails: "convention over configuration", kode indah, kurang populer dari dulu, komunitas loyal |

### Rust
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Bahasa sistem dari Mozilla (sekarang Rust Foundation) — memory safe tanpa garbage collection |
| **Fungsinya** | Sistem (OS, driver), web backend (Axum/Rocket), untuk performa kritis (game engine, browser, CLI tools) |
| **Cara pakai** | Install → `cargo new my-project` → tulis kode di `src/main.rs` → `cargo build` / `cargo run` |
| **Karakteristik** | Kecepatan C/C++ dengan jaminan memory safety, borrow checker unik, kurva belajar tajam |

---

## S

### Solid.js
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Framework frontend dengan performa tercepat — tanpa Virtual DOM, pakai signal-based reactivity |
| **Fungsinya** | Aplikasi yang membutuhkan render cepat & bundle kecil (dashboard real-time, animasi kompleks) |
| **Cara pakai** | `npm create vite@latest my-app -- --template solid` → syntax mirip React tapi JSX di-kompilasi bukan di-runtime |
| **Karakteristik** | Performa no.1 di benchmark (vs React, Vue, Svelte), true reactive, ukuran bundle kecil |

### SQLite
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database engine embedded (disimpan dalam satu file) — tidak butuh server terpisah |
| **Fungsinya** | Database lokal untuk mobile app, desktop app, embedded device, development/testing, analisis data kecil |
| **Cara pakai** | Install → `sqlite3 mydb.db` → SQL standard → dari kode pakai driver bawaan bahasa (tidak ada server!) |
| **Karakteristik** | Setup nol (0 konfigurasi), file-based, sangat cepat untuk baca lokal, write concurrent terbatas |

### SQLx
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Database driver & ORM untuk Rust — async, compile-time checked queries |
| **Fungsinya** | Menghubungkan aplikasi Rust ke database Postgres/MySQL/SQLite dengan query yang diperiksa saat kompilasi |
| **Cara pakai** | Tambah `sqlx = { version = "0.8", features = ["postgres"] }` di Cargo.toml → buat `PgPool::connect()` → `sqlx::query!("SELECT ...").fetch_all(&pool)` |
| **Karakteristik** | Compile-time query checking (query salah = kode tidak bisa kompil), async, migration built-in (`sqlx migrate`) |

### Supabase
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Open-source Firebase alternatif — backend as a service berbasis Postgres: database + auth + storage + realtime + edge functions |
| **Fungsinya** | Backend siap pakai tanpa tulis server — tinggal pakai SDK di frontend, auto dapat API + RLS + WebSocket |
| **Cara pakai** | Buka supabase.com → buat project → dapat URL & anon key → install `@supabase/supabase-js` → `supabase.from('table').select('*')` |
| **Karakteristik** | Postgres-based, row level security, real-time subscription, storage S3-compatible, auth UI siap pakai |

### Svelte
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Framework frontend yang mengompilasi kode menjadi JavaScript vanilla — tidak ada runtime framework di browser |
| **Fungsinya** | Aplikasi web cepat & kecil, terutama cocok untuk tampilan yang sangat interaktif |
| **Cara pakai** | `npm create vite@latest my-app -- --template svelte` → syntax `.svelte` (HTML + JS + CSS dalam satu file) → `npm run dev` |
| **Karakteristik** | Tidak ada Virtual DOM, kode output sangat kecil, reactivity sederhana (`$:`), SvelteKit untuk SSR |

---

## T

### tRPC
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Library untuk membuat API type-safe antara frontend & backend — tanpa perlu REST/GraphQL |
| **Fungsinya** | Memanggil fungsi backend dari frontend seperti memanggil fungsi biasa, dengan TypeScript full-stack |
| **Cara pakai** | Di backend: `const t = initTRPC.create()` → `router({ greet: t.procedure.input(z.string()).query(...)})` → di frontend: panggil `trpc.greet.useQuery("Luxio")` — type safety otomatis tanpa code generator |
| **Karakteristik** | Zero schema (TypeScript adalah satu-satunya schema), autocomplete penuh dari DB ke UI, integrasi mulus dengan Next.js |

### TypeScript
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Superset JavaScript dengan static typing — kode JavaScript + tipe data |
| **Fungsinya** | Menulis JavaScript yang lebih aman — mendeteksi bug tipe data saat mengetik kode (bukan saat runtime) |
| **Cara pakai** | `npm install -g typescript` → buat `file.ts` → `tsc file.ts` (menghasilkan `.js`) |
| **Karakteristik** | 95% kode JavaScript berjalan di TypeScript, strict mode menyelamatkan dari banyak bug, diadopsi luas di industri |

---

## V

### Vercel
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Cloud platform untuk frontend & serverless — khusus untuk Next.js (dibuat oleh tim Vercel), React, static sites |
| **Fungsinya** | Deploy website & API serverless instan dari GitHub — auto HTTPS, auto CDN global, analytics |
| **Cara pakai** | Push kode ke GitHub → hubungkan ke Vercel → auto detect framework → deploy otomatis tiap push |
| **Karakteristik** | Gratis untuk personal, instant deploy, edge functions, ISR (Incremental Static Regeneration), domain kustom |

### Vue.js
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Framework frontend progresif dari Evan You — mudah diintegrasikan bertahap |
| **Fungsinya** | Dari widget kecil di halaman yang sudah ada hingga aplikasi SPA/SSR (Nuxt) |
| **Cara pakai** | `npm create vue@latest` → syntax Single-File Component (`.vue`: template + script + style) |
| **Karakteristik** | Kurva belajar paling landai, dokumentasi terbaik di kelasnya, ekosistem cukup, Composition API (mirip hooks) |

---

## W

### WebSocket
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | Protokol komunikasi dua-arah (full duplex) real-time antara browser & server |
| **Fungsinya** | Chat aplikasi, notifikasi real-time, game online, kolaborasi dokumen (Google Docs-style), live bidding |
| **Cara pakai** | Di server: `new WebSocket.Server({ port: 8080 })` → on connection → on message → send — di client: `new WebSocket('ws://...')` |
| **Karakteristik** | Tidak seberat HTTP request, koneksi permanen, latensi rendah, perlu handle reconnection & scalability |

---

## Z

### Zustand
| Item | Penjelasan |
|------|-----------|
| **Apa itu** | State management library minimal untuk React — alternatif Redux yang lebih sederhana (yang sudah dipakai di Luxio!) |
| **Fungsinya** | Menyimpan & membagikan state global antar komponen — setara Redux tetapi tanpa boilerplate |
| **Cara pakai** | `npm install zustand` → `const useStore = create((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }))` → `const { count, increment } = useStore()` |
| **Karakteristik** | Tanpa provider, tanpa reducer, langsung panggil di komponen, support middleware (immer, persist, devtools) |

---

> **Dokumen ini dibuat untuk perbandingan objektif.** Pilihan stack terbaik tergantung konteks: tim, budget, skala, dan tujuan aplikasi.
>
> **Yang sudah dipakai di Luxio Project Manager:** React (frontend) + Rust/Axum/SQLx (backend) + Postgres/Neon (database) — masuk kategori "Rustack" yang unggul di performa & memory safety, cocok untuk aplikasi yang butuh keandalan tinggi.