# Kemampuan Integrasi & Alur — Penjelasan

File ini merangkum **apa yang bisa dilakukan** lewat integrasi Neon dan **alur pemasangannya**, berdasarkan [integrations.md](integrations.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Metode |
|---|---|
| Menambahkan integrasi pihak ketiga ke project | Console → Integrations → **Add** |
| Mengonfigurasi/menghapus integrasi terpasang | Kartu integrasi **Added** → **Manage** |
| Integrasi dengan setup otomatis | Klik Add → alur OAuth/otomatis |
| Integrasi dengan setup manual | Kartu punya tombol **Read** → ikuti panduan |
| Meminta integrasi yang belum ada | Tombol **Request** |
| Mengusulkan integrasi baru | Tombol **Suggest an integration** |

## 2. Alur Menambahkan Integrasi

```
Console ──► halaman Integrations
              │
   status "Added"? ──ya──► Manage (ubah/hapus konfigurasi)
              │ tidak
              ▼
   tombol Add ──► setup otomatis (OAuth/klik)  ──► selesai
              └─► atau manual: tombol Read ──► ikuti panduan platform tsb
```

- **Setup otomatis**: Neon menangani koneksi (mis. berbagi token ke Vercel/CI) — biasanya beberapa klik.
- **Setup manual**: langkah berada di sisi platform lain (mis. set environment variable, konfigurasi dashboard pihak ketiga) — panduan dibuka lewat tombol **Read**.

## 3. Kaitan dengan Kemampuan Lain

| Integrasi biasanya butuh | Di mana dijelaskan |
|---|---|
| API key untuk automasi luar | [../permissions/kemampuan-dan-alur.md](../permissions/kemampuan-dan-alur.md) |
| Connection string per branch (mis. deploy preview) | [../branches/kemampuan-dan-alur.md](../branches/kemampuan-dan-alur.md) |
| Endpoint programatik untuk platform CI/CD | [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md) |

Pola umum integrasi CI/CD + Neon: platform deploy memanggil Neon API (buat branch per preview → ambil `connection_uri` → inject sebagai env var) — semua endpoint yang dibutuhkan ada di [../reference-api/api.md](../reference-api/api.md).
