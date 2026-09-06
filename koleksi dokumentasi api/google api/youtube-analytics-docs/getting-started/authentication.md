# Autentikasi & Scopes

YouTube Analytics API v2 **hanya** menerima OAuth 2.0. API key tidak berlaku, dan flow service account tidak didukung — tidak ada cara menautkan service account ke akun YouTube, sehingga request yang memakainya selalu gagal.

---

## 1. Daftar Scope

| Scope | Deskripsi resmi | Dipakai untuk |
|---|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | Lihat laporan YouTube Analytics untuk konten Anda. Memberi akses ke metrik aktivitas pengguna seperti jumlah view dan rating. | Semua laporan non-moneter |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | Lihat laporan moneter YouTube Analytics. Memberi akses ke metrik aktivitas pengguna **dan** estimasi pendapatan serta performa iklan. | `estimatedRevenue`, `estimatedAdRevenue`, `estimatedRedPartnerRevenue`, `grossRevenue`, `cpm`, `playbackBasedCpm`, `adImpressions`, `monetizedPlaybacks` |
| `https://www.googleapis.com/auth/youtube.readonly` | Lihat akun YouTube Anda. | **Wajib** untuk `reports.query`; juga salah satu opsi untuk `groupItems.list` |
| `https://www.googleapis.com/auth/youtube` | Kelola akun YouTube Anda. | Pemilik channel mengelola grup dan item grup |
| `https://www.googleapis.com/auth/youtubepartner` | Lihat dan kelola aset serta konten terkait di YouTube. | Pemilik konten mengelola grup dan item grup |

### Kombinasi yang dibutuhkan per operasi

| Operasi | Scope |
|---|---|
| `reports.query` (non-moneter) | `yt-analytics.readonly` **+** `youtube.readonly` |
| `reports.query` (dengan metrik pendapatan) | `yt-analytics-monetary.readonly` **+** `youtube.readonly` |
| `groups.list` | `yt-analytics.readonly` (salah satu dari empat scope Analytics diterima) |
| `groups.insert` / `update` / `delete` | `youtube` (pemilik channel) atau `youtubepartner` (pemilik konten) |
| `groupItems.list` | `youtube` **atau** (`youtube.readonly` **dan** `yt-analytics.readonly`) |
| `groupItems.insert` / `delete` | `youtube` atau `youtubepartner` |

> Prinsip: `yt-analytics-monetary.readonly` mencakup semua yang diberikan `yt-analytics.readonly`. Meminta keduanya sekaligus tidak menambah akses, hanya memperpanjang daftar izin di dialog consent.

---

## 2. Scope Analytics Bersifat Sensitif — Konsekuensi untuk Luxio

Scope YouTube Analytics termasuk kategori sensitif di Google. Konsekuensinya untuk aplikasi publik:

- Selama status OAuth consent screen masih `Testing`, hanya akun yang terdaftar sebagai **test user** dapat login, dan pengguna melihat peringatan **unverified app**.
- Untuk melayani pengguna umum, aplikasi harus melewati **proses verifikasi OAuth Google**: pengisian consent screen lengkap (privacy policy, terms of service, domain terverifikasi), penjelasan pemakaian setiap scope, dan biasanya video demo alur izin.
- Menambah scope tulis (`youtube`, `youtubepartner`) memperluas cakupan review. Untuk dashboard yang hanya menampilkan angka, scope tulis tidak dibutuhkan sama sekali.

> Prinsip untuk dashboard Luxio: **scope readonly sudah cukup.** Kombinasi `yt-analytics.readonly` + `youtube.readonly` melayani seluruh laporan views, watch time, engagement, demografi, geografi, sumber trafik, perangkat, dan audience retention. Tambahkan `yt-analytics-monetary.readonly` hanya pada halaman yang benar-benar menampilkan pendapatan, dan hanya bila akun memang dimonetisasi.

Di repo ini, konstanta scope sudah terdefinisi di `app/src/services/googleAuth.js`:

| Konstanta | Isi |
|---|---|
| `GOOGLE_SCOPES.YOUTUBE_ANALYTICS` | `['https://www.googleapis.com/auth/yt-analytics.readonly']` |
| `GOOGLE_SCOPES.YOUTUBE_ANALYTICS_MONETARY` | `['https://www.googleapis.com/auth/yt-analytics-monetary.readonly']` |
| `GOOGLE_SCOPES.YOUTUBE` | `['https://www.googleapis.com/auth/youtube.readonly']` |

Frontend Luxio memakai **Google Identity Services implicit (token) flow** melalui `requestGoogleToken({ scopes })` dan `googleFetch(url, { scopes })`. Cache token dikunci per **set scope**, jadi satu halaman sebaiknya memakai satu konstanta set scope bersama (mis. `YOUTUBE_PAGE_SCOPES` di `app/src/services/youtubeApi.js`) agar pengguna hanya melihat satu popup consent per halaman.

> Catatan: karena `reports.query` mewajibkan akses `youtube.readonly`, set scope halaman analytics harus memuat **`yt-analytics.readonly` dan `youtube.readonly` sekaligus** — bukan hanya salah satunya.

---

## 3. Flow OAuth yang Didukung

| Flow | Cocok untuk | Refresh token | Catatan |
|---|---|---|---|
| Server-side web app | Backend yang bisa menyimpan rahasia | Ya | Satu-satunya cara memperbarui token tanpa interaksi pengguna |
| Client-side / JavaScript web app | SPA di browser (pola yang dipakai Luxio) | Tidak | Token berumur ±1 jam; habis → minta ulang |
| Mobile & desktop app | CLI, script, aplikasi terpasang | Ya | Memakai `client_secret.json` |
| TV & limited-input device | — | — | **Tidak didukung** oleh Analytics/Reporting API |
| Service account | — | — | **Tidak didukung**; selalu error |

Referensi resmi: https://developers.google.com/youtube/reporting/guides/authorization

---

## 4. Memakai Access Token

Token dikirim di header. Ini cara yang dianjurkan.

```bash
curl -G "https://youtubeanalytics.googleapis.com/v2/reports" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  --data-urlencode "ids=channel==MINE" \
  --data-urlencode "startDate=2026-01-01" \
  --data-urlencode "endDate=2026-01-31" \
  --data-urlencode "metrics=views"
```

Alternatif: parameter query `access_token=ACCESS_TOKEN`. Hindari cara ini di produksi karena token bocor ke log akses dan riwayat browser.

---

## 5. Contoh Flow Client-Side (Google Identity Services)

```js
// Pola yang dipakai Luxio: satu set scope per halaman supaya hanya satu popup.
// reports.query WAJIB punya akses youtube.readonly, jadi keduanya disertakan.
const YT_ANALYTICS_SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
]

// initTokenClient = implicit/token flow GIS. Tidak menghasilkan refresh token.
const tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  scope: YT_ANALYTICS_SCOPES.join(' '),   // dipisah SPASI, bukan koma
  callback: (resp) => {
    if (resp.error) return console.error(resp.error)
    // resp.access_token berlaku resp.expires_in detik (umumnya 3600).
    fetchReport(resp.access_token)
  },
})

// Panggil dari event klik pengguna — popup diblokir bila dipanggil otomatis.
document.querySelector('#connect').onclick = () => tokenClient.requestAccessToken()

async function fetchReport(accessToken) {
  const params = new URLSearchParams({
    ids: 'channel==MINE',
    startDate: '2026-02-08',
    endDate: '2026-03-07',
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'day',
    sort: 'day',
  })
  const res = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (res.status === 401) throw new Error('Token kedaluwarsa — minta token baru')
  const data = await res.json()
  console.log(data.columnHeaders, data.rows)
}
```

---

## 6. Contoh Flow Installed App (Python)

```python
# Butuh: pip install google-auth-oauthlib google-api-python-client
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Kedua scope diminta bersamaan: yt-analytics untuk data, youtube.readonly
# karena reports.query mewajibkannya.
SCOPES = [
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.readonly',
]

flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
credentials = flow.run_local_server(port=0)   # buka browser, tangkap kode di localhost

# Nama service persis 'youtubeAnalytics', versi 'v2'.
analytics = build('youtubeAnalytics', 'v2', credentials=credentials)
```

---

## 7. Masa Berlaku & Pembaruan Token

| Aspek | Nilai |
|---|---|
| Access token | Berlaku ±1 jam (`expires_in` biasanya `3600`) |
| Refresh token | Hanya pada flow server-side dan installed app |
| SPA / implicit flow | Tidak ada refresh token — minta token baru saat kedaluwarsa |
| Pencabutan | `POST https://oauth2.googleapis.com/revoke?token=ACCESS_TOKEN` |

Pola aman untuk SPA: simpan `expiresAt` bersama token, beri margin ~60 detik sebelum kedaluwarsa, dan minta token baru sebelum request berikutnya. Ini pola yang sudah dipakai `getCachedToken()` di `app/src/services/googleAuth.js`.

---

## 8. Diagnosis Cepat

| Gejala | Penyebab paling mungkin | Tindakan |
|---|---|---|
| `401 Unauthorized` | Token kedaluwarsa atau header salah format | Minta token baru; pastikan `Bearer ` diikuti spasi |
| `403` dengan reason `insufficientPermissions` | Scope kurang — sering kali `youtube.readonly` yang lupa | Tambahkan scope, minta consent ulang |
| `403` dengan reason `forbidden` | Akun bukan pemilik channel / bukan pemilik konten yang diminta | Login dengan akun yang benar |
| Popup consent muncul terus | Set scope berubah antar panggilan → cache token miss | Pakai satu konstanta set scope untuk seluruh halaman |
| Peringatan **unverified app** | Consent screen masih status `Testing` | Tambahkan akun sebagai test user, atau ajukan verifikasi |

Peta error lengkap: [errors.md](errors.md).
