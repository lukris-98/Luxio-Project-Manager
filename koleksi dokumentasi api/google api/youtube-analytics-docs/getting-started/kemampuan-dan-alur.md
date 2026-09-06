# Kemampuan & Alur — Setup YouTube Analytics API v2

File ini menjelaskan **alur setup dari nol sampai request pertama berhasil**, plus keputusan yang harus diambil di setiap langkah.

Urutan bacaan yang disarankan:

| Urutan | File | Yang dihasilkan |
|---|---|---|
| 1 | [overview.md](overview.md) | Paham model dimensi × metrik × filter × rentang tanggal |
| 2 | [enable-api.md](enable-api.md) | Project Cloud aktif + OAuth Client ID |
| 3 | [authentication.md](authentication.md) | Access token dengan scope yang benar |
| 4 | [quickstart.md](quickstart.md) | Respons `youtubeAnalytics#resultTable` pertama |
| 5 | [rate-limits.md](rate-limits.md) | Tahu batas baris, batas kombinasi, latensi data |
| 6 | [errors.md](errors.md) | Tahu arti error yang muncul |

---

## 1. Alur Setup

```
┌─ Google Cloud Console ────────────────────────────────────────────┐
│ 1. Buat/pilih project                                             │
│ 2. Enable "YouTube Analytics API"                                 │
│    (+ "YouTube Data API v3" bila butuh judul/thumbnail)            │
│ 3. OAuth consent screen: isi app info, privacy policy, ToS        │
│ 4. Tambahkan scope: yt-analytics.readonly + youtube.readonly      │
│ 5. Credentials → Create → OAuth client ID → pilih tipe aplikasi   │
│    - Web application  → isi Authorized JavaScript origins         │
│    - Desktop app      → dapat client_secret.json                  │
└───────────────────────────┬───────────────────────────────────────┘
                            ▼
┌─ Runtime aplikasi ────────────────────────────────────────────────┐
│ 6. Jalankan flow OAuth 2.0 sesuai tipe aplikasi                   │
│ 7. Terima access_token (berlaku ±1 jam)                           │
│ 8. GET /v2/reports dengan header Authorization: Bearer <token>     │
│ 9. Token kedaluwarsa → refresh_token (server) / minta ulang (SPA)  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Keputusan yang Menentukan Sisanya

| Keputusan | Pilihan | Konsekuensi |
|---|---|---|
| Channel atau pemilik konten? | `ids=channel==MINE` / `ids=channel==CHANNEL_ID` vs `ids=contentOwner==CONTENT_OWNER_ID` | Pemilik konten wajib peserta YouTube Partner Program dan wajib menyertakan filter entitas |
| Butuh angka pendapatan? | Ya → `yt-analytics-monetary.readonly` | Scope lebih sensitif; hanya relevan bila akun dimonetisasi |
| Butuh judul video? | Ya → aktifkan juga YouTube Data API v3 | Request tambahan; metadata wajib dihapus/diperbarui maksimum 30 hari |
| Tipe aplikasi | SPA (implicit/token flow) vs server-side | SPA tidak punya refresh token; token habis → minta ulang |
| Perlu segmen kustom? | Ya → `groups` + `groupItems` | Butuh scope tulis `youtube` atau `youtubepartner` |

---

## 3. Tiga Kesalahan Paling Sering di Awal

1. **Lupa scope `youtube.readonly`.** `reports.query` sekarang mewajibkan akses ke `https://www.googleapis.com/auth/youtube.readonly`. Hanya membawa `yt-analytics.readonly` akan gagal.
2. **Menggabungkan metrik dari laporan berbeda.** `views` dan `viewerPercentage` berada di laporan berbeda. Setiap tipe laporan punya daftar metrik/dimensi tersendiri — lihat [../guides/channel-reports.md](../guides/channel-reports.md).
3. **Mengasumsikan urutan kolom.** Selalu baca `columnHeaders[]`. Urutan kolom mengikuti urutan parameter, tetapi hardcode indeks akan pecah begitu parameter berubah.

---

## 4. Verifikasi Setup Berhasil

```bash
# Request paling minimal yang mungkin. Kalau ini jalan, setup benar.
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "metrics=views"
# → 200 { "kind": "youtubeAnalytics#resultTable", "columnHeaders": [...], "rows": [[N]] }
# → 401 token kedaluwarsa / tidak ada
# → 403 scope kurang, atau akun bukan pemilik channel
# → 400 parameter salah (mis. format tanggal bukan YYYY-MM-DD)
```

Peta error lengkap: [errors.md](errors.md).
