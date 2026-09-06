# Kemampuan & Alur — Getting Started

File ini menjelaskan **kemampuan tahap setup** YouTube Reporting API dan membedah **kode kredensial baris per baris**, sebelum masuk ke pemanggilan endpoint di [../reference-api/kemampuan-dan-alur.md](../reference-api/kemampuan-dan-alur.md).

---

## 1. Kemampuan Tahap Setup

| Kemampuan | Di mana dikerjakan | File detail |
|---|---|---|
| Mengaktifkan YouTube Reporting API pada project | Google Cloud Console | [enable-api.md](enable-api.md) |
| Membuat OAuth client ID (Web / Desktop) | Google Cloud Console | [enable-api.md](enable-api.md) |
| Mengonfigurasi OAuth consent screen + scopes | Google Cloud Console | [enable-api.md](enable-api.md) |
| Menukar authorization code menjadi access + refresh token | Kode aplikasi | [authentication.md](authentication.md) |
| Menyegarkan access token yang kedaluwarsa | Kode aplikasi | [authentication.md](authentication.md) |
| Bertindak atas nama content owner | Parameter `onBehalfOfContentOwner` | [authentication.md](authentication.md) |
| Verifikasi hak akses akun terhadap tipe laporan | `reportTypes.list` | [quickstart.md](quickstart.md) |
| Menjadwalkan job pertama & mengunduh CSV pertama | `jobs.create` → `jobs.reports.list` → `downloadUrl` | [quickstart.md](quickstart.md) |
| Memahami biaya kuota | — | [rate-limits.md](rate-limits.md) |
| Menangani error & retry | — | [errors.md](errors.md) |

---

## 2. Alur Setup Sekali Jalan

```
[Google Cloud Console]                          [Aplikasi Anda]
buat project
   │
   ├─► enable "YouTube Reporting API"
   │
   ├─► OAuth consent screen
   │     + scope yt-analytics.readonly
   │     (+ yt-analytics-monetary.readonly bila butuh pendapatan)
   │
   └─► credentials → OAuth client ID ──► client_id + client_secret
                                              │
                                              ▼
                                    user consent (browser)
                                              │
                                              ▼
                                    authorization code
                                              │
                                              ▼
                              POST oauth2.googleapis.com/token
                                              │
                          ┌───────────────────┴───────────────────┐
                          ▼                                       ▼
                  access_token (±1 jam)                    refresh_token (persisten)
                          │                                       │
                          ▼                                       ▼
              Authorization: Bearer ACCESS_TOKEN        simpan terenkripsi di backend
```

> Prinsip: `refresh_token` adalah satu-satunya artefak yang perlu disimpan permanen. `access_token` bersifat sementara dan boleh dibuang; ambil ulang dari `refresh_token` setiap kali scheduler berjalan.

---

## 3. Kode Kredensial Baris per Baris

### 3.1 Menukar authorization code (curl)

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=AUTH_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

| Baris | Fungsi |
|---|---|
| `code=AUTH_CODE` | Kode sekali pakai dari redirect consent screen. Berlaku singkat; kalau habis, ulangi consent |
| `client_id` / `client_secret` | Identitas OAuth client dari Cloud Console. `client_secret` **tidak boleh** ada di bundle frontend |
| `redirect_uri` | Harus sama persis dengan yang terdaftar di OAuth client, termasuk skema dan trailing slash |
| `grant_type=authorization_code` | Menandakan penukaran code → token (bukan refresh) |

Response berisi `access_token`, `expires_in` (detik), `refresh_token`, dan `scope`. `refresh_token` hanya dikirim saat consent pertama atau bila URL consent menyertakan `access_type=offline` dan `prompt=consent`.

### 3.2 Menyegarkan token (Node.js)

```js
// Refresh token manual tanpa client library — cukup untuk scheduler backend.
async function refreshAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID,          // dari Cloud Console
      client_secret: process.env.YT_CLIENT_SECRET,  // rahasia; hanya di server
      refresh_token: process.env.YT_REFRESH_TOKEN,  // hasil consent, tersimpan terenkripsi
      grant_type: 'refresh_token',                  // membedakan dari authorization_code
    }),
  });

  if (!res.ok) {
    // 400 invalid_grant = refresh token dicabut/kedaluwarsa → WAJIB consent ulang.
    // Retry tidak akan menolong pada kasus ini.
    throw new Error(`refresh gagal: ${res.status} ${await res.text()}`);
  }

  const { access_token, expires_in } = await res.json();
  // Segarkan lebih awal (mis. 5 menit sebelum expiry) agar unduhan panjang tidak
  // kehabisan token di tengah jalan.
  return { accessToken: access_token, expiresAt: Date.now() + (expires_in - 300) * 1000 };
}
```

### 3.3 Kredensial dengan client library (Python)

```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Credentials dibangun dari refresh_token; access_token diambil otomatis oleh library
# saat request pertama dan disegarkan sendiri ketika kedaluwarsa.
creds = Credentials(
    token=None,                                   # biarkan None: paksa refresh di awal
    refresh_token=os.environ["YT_REFRESH_TOKEN"],
    token_uri="https://oauth2.googleapis.com/token",
    client_id=os.environ["YT_CLIENT_ID"],
    client_secret=os.environ["YT_CLIENT_SECRET"],
    scopes=["https://www.googleapis.com/auth/yt-analytics.readonly"],
)

# nama service = "youtubereporting", versi = "v1".
# Salah menulis "youtubeAnalytics" akan membangun client untuk API yang berbeda.
reporting = build("youtubereporting", "v1", credentials=creds)
```

| Bagian | Fungsi |
|---|---|
| `token=None` | Tidak ada access token tersimpan; library melakukan refresh sebelum request pertama |
| `refresh_token` | Kunci akses jangka panjang; tanpa ini setiap eksekusi butuh consent manual |
| `token_uri` | Endpoint refresh Google. Wajib diisi kalau `Credentials` dibuat manual |
| `scopes` | Harus subset dari scope yang disetujui user. Meminta scope yang belum disetujui → `403` |
| `build("youtubereporting", "v1", ...)` | Membentuk client dari discovery document `https://youtubereporting.googleapis.com/$discovery/rest?version=v1` |

---

## 4. Checklist Sebelum Menulis Kode Pipeline

| # | Cek | Cara verifikasi |
|---|---|---|
| 1 | API sudah aktif di project | Cloud Console → APIs & Services → Enabled APIs |
| 2 | Scope yang diminta sesuai kebutuhan | `yt-analytics.readonly` cukup bila tidak memproses pendapatan |
| 3 | `refresh_token` tersimpan aman di backend | Bukan di localStorage, bukan di bundle frontend |
| 4 | Akun benar-benar berhak atas laporan | `reportTypes.list` mengembalikan `reportTypeId` yang dituju |
| 5 | Ada storage untuk hasil impor | Retensi API hanya 60 hari; data lebih lama harus milik Anda |
| 6 | Ada scheduler | Harian cukup; jangan andalkan trigger dari UI |
| 7 | Ada tabel penanda laporan terproses | Lihat [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md) |

---

## 5. Peta File Getting Started

| File | Baca kalau... |
|---|---|
| [overview.md](overview.md) | Anda belum yakin API ini cocok untuk kebutuhan Anda |
| [enable-api.md](enable-api.md) | Anda mulai dari project Google Cloud kosong |
| [authentication.md](authentication.md) | Anda perlu detail OAuth, scope, dan content owner |
| [quickstart.md](quickstart.md) | Anda ingin CSV pertama dalam satu sesi kerja |
| [rate-limits.md](rate-limits.md) | Anda memikirkan biaya kuota dan frekuensi polling |
| [errors.md](errors.md) | Request Anda mengembalikan status non-2xx |

Perbandingan dengan Analytics API dan tabel keputusan: [../README.md](../README.md).
