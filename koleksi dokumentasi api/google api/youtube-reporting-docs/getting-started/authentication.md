# Authentication — OAuth 2.0 & Scopes

Semua request YouTube Reporting API **wajib** diotorisasi dengan OAuth 2.0 oleh channel atau content owner yang memiliki data yang diminta.

- Token endpoint: `https://oauth2.googleapis.com/token`
- Auth endpoint: `https://accounts.google.com/o/oauth2/v2/auth`
- Header request: `Authorization: Bearer ACCESS_TOKEN`
- Panduan resmi: https://developers.google.com/youtube/reporting/guides/authorization

---

## 1. Scopes

| Scope | Deskripsi resmi |
|---|---|
| `https://www.googleapis.com/auth/yt-analytics.readonly` | View YouTube Analytics reports for your YouTube content. Memberi akses ke metrik aktivitas pengguna seperti jumlah view dan rating. |
| `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` | View monetary and non-monetary YouTube Analytics reports for your YouTube content. Memberi akses ke metrik aktivitas pengguna **plus** estimasi pendapatan dan metrik performa iklan. |

Pemetaan kebutuhan → scope:

| Yang akan Anda ambil | Scope minimum |
|---|---|
| `channel_basic_a3`, `channel_traffic_source_a3`, laporan aktivitas pengguna lain | `yt-analytics.readonly` |
| `content_owner_basic_a4`, laporan asset non-pendapatan | `yt-analytics.readonly` |
| `content_owner_estimated_revenue_a1`, `content_owner_asset_estimated_revenue_a1` | `yt-analytics-monetary.readonly` |
| Laporan ad performance content owner | `yt-analytics-monetary.readonly` |
| Laporan system-managed pendapatan (ads, subscriptions, Shorts, pajak) | `yt-analytics-monetary.readonly` |

> Prinsip: discovery document mencantumkan **kedua** scope pada setiap method, jadi kegagalan karena scope tidak muncul saat memanggil endpoint, melainkan saat isi laporan memuat data pendapatan. Tentukan scope berdasarkan **laporan yang akan diproses**, bukan berdasarkan endpoint.

---

## 2. Alur OAuth yang Didukung

| Alur | Didukung | Catatan |
|---|---|---|
| Server-side web apps | Ya | Pilihan utama untuk pipeline backend |
| JavaScript / client-side web apps | Ya | Tidak disarankan untuk Reporting API — file CSV besar dan token berumur pendek |
| Installed apps (mobile & desktop) | Ya | Praktis untuk consent sekali jalan lewat `http://localhost` |
| Device flow (TV & input terbatas) | **Tidak** | Reporting API dan Analytics API tidak mendukung alur ini |
| Service account | **Tidak** | Tidak ada cara menautkan service account ke akun YouTube; percobaan otorisasi menghasilkan error |

Implikasi praktis: pipeline otomatis **tetap** membutuhkan consent manual satu kali dari akun manusia pemilik channel/content owner. Setelah itu, simpan `refresh_token` dan jalankan pipeline tanpa interaksi.

---

## 3. Mendapatkan Refresh Token

```bash
# LANGKAH 1 — arahkan user ke URL consent.
# access_type=offline WAJIB, jika tidak, refresh_token tidak dikirim.
# prompt=consent memaksa refresh_token dikirim ulang bahkan bila user pernah menyetujui.
open "https://accounts.google.com/o/oauth2/v2/auth?\
client_id=CLIENT_ID&\
redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback&\
response_type=code&\
access_type=offline&\
prompt=consent&\
include_granted_scopes=true&\
scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyt-analytics-monetary.readonly"
```

```bash
# LANGKAH 2 — tukar authorization code menjadi token.
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=AUTH_CODE" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:8080/callback" \
  -d "grant_type=authorization_code"
```

```json
{
  "access_token": "ya29.a0AfB_...",
  "expires_in": 3599,
  "refresh_token": "1//0gXy...",
  "scope": "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
  "token_type": "Bearer"
}
```

| Field | Sifat | Cara menyimpan |
|---|---|---|
| `access_token` | Kedaluwarsa ±1 jam (`expires_in`) | Cache di memori, boleh hilang |
| `refresh_token` | Persisten sampai dicabut | Simpan terenkripsi di backend / secret manager |
| `scope` | Scope yang benar-benar disetujui | Verifikasi; user bisa mencentang sebagian saja |
| `token_type` | Selalu `Bearer` | — |

---

## 4. Menyegarkan Access Token

```bash
curl -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
# → { "access_token": "ya29...", "expires_in": 3599, "scope": "...", "token_type": "Bearer" }
# Perhatikan: response refresh TIDAK menyertakan refresh_token baru. Simpan yang lama.
```

```js
// Pola refresh dengan margin keamanan.
// Unduhan CSV besar bisa memakan menit; token yang hampir habis berisiko 401 di tengah stream.
let cached = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt) return cached.token;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YT_CLIENT_ID,
      client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: process.env.YT_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`refresh gagal: ${res.status} ${await res.text()}`);

  const data = await res.json();
  // Kurangi 5 menit dari expires_in sebagai buffer.
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 300) * 1000 };
  return cached.token;
}
```

Kegagalan refresh yang **tidak boleh** di-retry:

| Error | Penyebab | Tindakan |
|---|---|---|
| `400 invalid_grant` | Refresh token dicabut, kedaluwarsa, atau password akun berubah | Consent ulang oleh user |
| `400 invalid_client` | `client_id`/`client_secret` salah | Periksa kredensial Cloud Console |
| `403 access_denied` | Aplikasi belum diverifikasi dan user bukan test user | Tambah test user atau ajukan verifikasi |

---

## 5. Memakai Token pada Request

```bash
# Header Authorization dipakai untuk SEMUA endpoint, termasuk saat mengunduh downloadUrl.
curl "https://youtubereporting.googleapis.com/v1/jobs" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# downloadUrl juga butuh header yang sama — bukan URL publik.
curl -L "DOWNLOAD_URL" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Accept-Encoding: gzip" --compressed \
  -o report.csv
```

Alternatif query parameter `access_token=ACCESS_TOKEN` dan `oauth_token=ACCESS_TOKEN` tersedia (tercantum di discovery document), tetapi menaruh token di URL membuatnya bocor ke log akses dan riwayat shell. Gunakan header.

---

## 6. `onBehalfOfContentOwner`

Parameter query yang diterima **semua** method Reporting API.

| Aspek | Nilai |
|---|---|
| Lokasi | Query string |
| Tipe | `string` |
| Deskripsi resmi | "The content owner's external ID on which behalf the user is acting on. If not set, the user is acting for himself (his own channel)." |
| Wajib untuk | Laporan `content_owner_*`, laporan asset, seluruh laporan system-managed |
| Tidak diperlukan untuk | Laporan `channel_*` dan `playlist_*` milik channel akun itu sendiri |

```bash
# Tanpa parameter: konteks = channel milik user yang terautentikasi.
curl "https://youtubereporting.googleapis.com/v1/reportTypes" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Dengan parameter: konteks = content owner. reportTypes yang dikembalikan berbeda,
# dan job yang dibuat akan menjadi milik content owner tersebut.
curl "https://youtubereporting.googleapis.com/v1/reportTypes?onBehalfOfContentOwner=CONTENT_OWNER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

> Prinsip: konsisten. Kalau job dibuat dengan `onBehalfOfContentOwner`, semua pemanggilan `jobs.list`, `jobs.reports.list`, dan `jobs.delete` untuk job itu harus menyertakan parameter yang sama. Tanpa parameter, API mencari job di konteks channel pribadi dan job tersebut tidak akan terlihat.

---

## 7. Parameter Standar Lain

Tercantum pada discovery document, berlaku untuk semua method:

| Parameter | Tipe | Fungsi |
|---|---|---|
| `alt` | `json` \| `media` \| `proto` | Format response. `media` dipakai untuk unduhan file |
| `fields` | string | Partial response — pilih field yang dikembalikan |
| `prettyPrint` | boolean (default `true`) | Indentasi response JSON |
| `quotaUser` | string (maks. 40 karakter) | Penanda pengguna untuk keperluan kuota pada aplikasi server-side |
| `key` | string | API key. Tidak menggantikan OAuth pada API ini |
| `access_token` / `oauth_token` | string | Alternatif header `Authorization` |
| `callback` | string | JSONP |
| `$.xgafv` | `1` \| `2` | Format error v1 atau v2 |
| `uploadType` / `upload_protocol` | string | Protokol upload media — tidak relevan untuk Reporting API |

```bash
# fields menghemat bandwidth pada list yang panjang: hanya ambil kolom yang dipakai pipeline.
curl "https://youtubereporting.googleapis.com/v1/jobs/JOB_ID/reports?fields=reports(id,startTime,endTime,createTime,downloadUrl),nextPageToken" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 8. Keamanan Kredensial

| Aturan | Alasan |
|---|---|
| `client_secret` dan `refresh_token` hanya di backend | Keduanya memberi akses jangka panjang ke data Analytics |
| Jangan taruh token di query string di lingkungan produksi | Bocor ke access log, proxy, dan riwayat shell |
| Jangan commit `.env` | Gunakan secret manager atau environment variable runtime |
| Enkripsi `refresh_token` at rest | Dicuri = akses data selama token belum dicabut |
| Rotasi bila ada indikasi kebocoran | Cabut di https://myaccount.google.com/permissions, lalu consent ulang |
| Aplikasi frontend tidak menyimpan token Reporting API | Frontend hanya membaca hasil yang sudah tersimpan di backend |

Alasan arsitektural mengapa Reporting API tidak dipanggil dari browser: [../guides/bulk-reports-flow.md](../guides/bulk-reports-flow.md).
