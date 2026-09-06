# Kemampuan Maintenance & Alur — Penjelasan

File ini merangkum **apa yang perlu dilakukan/bisa dikendalikan** terkait maintenance Neon dan **alurnya**, berdasarkan [maintenance-updates-overview.md](maintenance-updates-overview.md), [updates.md](updates.md), [platform-maintenance.md](platform-maintenance.md), dan [operations.md](operations.md).

---

## 1. Daftar Kemampuan

| Kemampuan | Sumber |
|---|---|
| Memahami cara update diterapkan (restart compute, prewarming) | [updates.md](updates.md) |
| Menentukan update window (plan berbayar) | [updates.md](updates.md) |
| Memahami platform maintenance (di luar update compute) | [platform-maintenance.md](platform-maintenance.md) |
| Menjadwalkan jendela maintenance project | API/Console |
| Menyiapkan aplikasi agar tahan restart | [operations.md](operations.md) |

## 2. Dua Jenis Aktivitas

| Jenis | Cakupan | Kontrol |
|---|---|---|
| **Compute updates** | Upgrade minor Postgres, security patch, OS | Update window di plan berbayar; restart beberapa detik; cache prewarm otomatis |
| **Platform maintenance** | Infrastruktur Neon di luar compute | Dijadwalkan Neon; dinotifikasikan |

> Compute > 8 CU autoscale tidak ikut update otomatis — perlu restart manual (`POST .../endpoints/{ep}/restart`, lihat [../computes/kemampuan-dan-alur.md](../computes/kemampuan-dan-alur.md)).

## 3. Alur Saat Update Terjadi

```
Notifikasi update (email/console)
        │
plan berbayar? ──ya──► set update window (hari + jam) ──┐
        │ tidak                                         │
        └── Neon jadwalkan dengan pemberitahuan ────────┤
                                                        ▼
                                compute di-restart (± detik)
                                + prewarming cache (otomatis, tanpa biaya)
                                                        │
                                                        ▼
                          koneksi drop sesaat ──► aplikasi retry ──► normal
```

## 4. Kode yang Harus Dipersiapkan (sisi aplikasi)

Restart membuat koneksi terputus sesaat. Yang menahan aplikasi tetap sehat bukan API Neon, melainkan retry policy di driver/aplikasi:

```
koneksi gagal ──► tunggu singkat (mis. 100ms) ──► coba ulang
      ──► ulangi hingga N kali dengan backoff ──► baru gagalkan request
```

- Pool koneksi (pgBouncer / Neon pooled connection) biasanya otomatis menyambung ulang — aktifkan pooled (`pooled=true` di `connection_uri`, lihat [../projects/kemampuan-dan-alur.md](../projects/kemampuan-dan-alur.md)).
- Transaksi yang gagal di tengah restart = rollback oleh Postgres; aplikasi cukup mengulang transaksi, tidak perlu repair data.

## 5. Checklist Kesiapan

- [ ] Aplikasi punya retry koneksi (driver config atau wrapper)
- [ ] Plan berbayar: update window diset di jam sepi
- [ ] Compute besar (>8 CU) dimasukkan jadwal restart manual
- [ ] Menangani email notifikasi maintenance (forward ke tim on-call)
- [ ] Pemantauan error koneksi untuk membedakan maintenance vs insiden
