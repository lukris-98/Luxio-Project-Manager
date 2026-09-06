# Rate Limits & Kuota

Google Calendar API punya tiga lapis batasan yang berbeda. Melampaui salah satunya menghasilkan `403` atau `429`.

- Dokumentasi resmi: https://developers.google.com/workspace/calendar/api/guides/quota

> Catatan: batas kuota diperbarui per **1 Mei 2026**. Project Google Cloud yang memakai API ini antara November 2025 – April 2026 tetap memakai kuota lamanya; project yang dibuat pada atau setelah 1 Mei 2026 memakai kuota baru di bawah ini.

---

## 1. Tiga Lapis Batasan

| Lapis | Ditegakkan oleh | Gejala |
|---|---|---|
| **Kuota API** | Google Cloud project | `403 rateLimitExceeded` / `403 userRateLimitExceeded` / `429 rateLimitExceeded` |
| **Batas penggunaan umum Calendar** | Layanan Calendar (anti-abuse) | `403 quotaExceeded` "Calendar usage limits exceeded." |
| **Batas operasional** | Diterapkan situasional | Misal saat menulis ke satu kalender terlalu cepat berturut-turut |

---

## 2. Kuota API

| Jenis batas | Nilai |
|---|---|
| Per menit per project | 10.000 request |
| Per menit per user per project | 600 request |

Kuota dihitung per menit memakai **sliding window**. Lonjakan singkat yang melewati batas per menit akan menyebabkan rate limiting pada jendela berikutnya, sehingga rata-rata penggunaan tetap di dalam kuota.

### Ambang tagihan harian

| Jenis batas | Nilai |
|---|---|
| Per hari per project | 1.000.000 request |

Penggunaan di bawah ambang ini tidak menimbulkan biaya. Ambang harian ini **tidak bisa dinaikkan** lewat permintaan kuota.

---

## 3. Biaya Kuota per Operasi

| Operasi | Biaya |
|---|---|
| Kebanyakan method (`list`, `get`, `insert`, `update`, `delete`, dst.) | 1 unit |
| `patch` pada `events`, `calendars`, `calendarList`, `acl` | **3 unit** |

> Prinsip: dokumentasi resmi menyatakan setiap request `patch` mengonsumsi tiga unit kuota dan menyarankan `get` diikuti `update` (2 unit) bila kuota jadi kendala. Untuk kebanyakan aplikasi, keunggulan semantik `patch` (tidak menghapus field yang tak dikirim) lebih berharga daripada selisih 1 unit — pakai `patch` kecuali memang sedang mengejar kuota.

---

## 4. Batas Non-Kuota yang Sering Menghambat

| Batas | Nilai |
|---|---|
| `maxResults` events.list / events.instances | Default 250, maksimum 2500 |
| `maxResults` calendarList.list / settings.list | Default 100, maksimum 250 |
| `reminders.overrides[]` | Maksimum 5 per acara |
| `attachments[]` | Maksimum 25 per acara |
| `extendedProperties` | 300 properti, total 32 KB per acara |
| `freeBusy.calendarExpansionMax` | Maksimum 50 kalender |
| `freeBusy.groupExpansionMax` | Maksimum 100 anggota grup |
| Label acara per kalender | Maksimum 200 |
| TTL channel push default | 604800 detik (7 hari) |

---

## 5. Praktik yang Mengurangi Konsumsi Kuota

### A. Pakai push notifications, bukan polling

```
ANTI-POLA                                    POLA YANG BENAR
5.000 user × polling 1×/menit          watch sekali per kalender
= 5.000 request/menit                  → webhook dipanggil hanya saat ada perubahan
(kuota per project langsung habis)     → lalu 1× events.list dengan syncToken
```

Detail: [../guides/push-notifications.md](../guides/push-notifications.md).

### B. Sebar traffic, jangan sinkron tengah malam

Anti-pola klasik: semua klien melakukan full sync pada pukul 00:00. Ini pasti melewati kuota per menit.

```js
// Tentukan offset acak PER KLIEN dan simpan permanen, agar jadwal sync tersebar.
// Simpan hasilnya; jangan hitung ulang setiap start, supaya jadwal stabil.
function dailySyncDelayMs(clientId) {
  const seed = [...clientId].reduce((a, c) => a + c.charCodeAt(0), 0)
  return (seed % 1440) * 60_000                  // sebar merata sepanjang 24 jam
}

// Untuk operasi berkala, variasikan interval ±25% agar tidak membentuk gelombang.
function jitteredInterval(baseMs) {
  const factor = 0.75 + Math.random() * 0.5      // 0.75 – 1.25
  return Math.round(baseMs * factor)
}
```

### C. Incremental sync, bukan full sync

```bash
# Full sync: mahal, hanya untuk inisialisasi atau setelah 410.
curl -G ".../calendar/v3/calendars/primary/events" \
  --data-urlencode "timeMin=2025-09-06T00:00:00Z" -H "Authorization: Bearer ACCESS_TOKEN"

# Incremental sync: mengembalikan HANYA yang berubah — biasanya 0–beberapa item.
curl -G ".../calendar/v3/calendars/primary/events" \
  --data-urlencode "syncToken=CPDAlvWDx70CEPDAlvWDx70CGAU=" -H "Authorization: Bearer ACCESS_TOKEN"
```

Detail: [../guides/sync-tokens.md](../guides/sync-tokens.md).

### D. `quotaUser` untuk service account

Saat memakai domain-wide delegation, kuota "per menit per user per project" dibebankan ke **service account**, bukan ke user yang diimpersonasi. Akibatnya satu service account cepat kehabisan kuota meski melayani banyak user.

```bash
# quotaUser: string opaque yang mengidentifikasi user; hanya dipakai untuk perhitungan kuota.
curl -G "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  --data-urlencode "quotaUser=user-12345" \
  -H "Authorization: Bearer SERVICE_ACCOUNT_TOKEN"

# Alternatif lewat header:
curl "https://www.googleapis.com/calendar/v3/calendars/primary/events" \
  -H "Authorization: Bearer SERVICE_ACCOUNT_TOKEN" \
  -H "x-goog-quota-user: user-12345"
```

### E. `eventTypes` pada `watch` dan `list`

```bash
# Hanya pantau acara biasa; abaikan birthday/workingLocation/focusTime yang tidak dipakai UI.
curl -X POST -G "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch" \
  --data-urlencode "eventTypes=default" \
  -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "id": "01234567-89ab-cdef-0123456789ab", "type": "web_hook", "address": "https://mydomain.com/notifications" }'
```

---

## 6. Menangani Error Kuota

| Kode | `reason` | Retry? | Cara |
|---|---|---|---|
| `403` | `rateLimitExceeded` | Ya | Truncated exponential backoff |
| `403` | `userRateLimitExceeded` | Ya | Backoff + pertimbangkan `quotaUser` atau naikkan kuota per user |
| `429` | `rateLimitExceeded` | Ya | Sama persis dengan `403 rateLimitExceeded` |
| `403` | `quotaExceeded` | Tidak segera | Ini batas penggunaan Calendar (anti-abuse), bukan kuota project; kurangi laju tulis |
| `500` | `backendError` | Ya | Backoff |

### Truncated exponential backoff

Formula resmi: waktu tunggu = `min(((2^n) + random_number_milliseconds), maximum_backoff)` dengan `n` bertambah 1 setiap percobaan, `random_number_milliseconds` ≤ 1000 ms dan dihitung ulang tiap retry, serta `maximum_backoff` umumnya 32 atau 64 detik.

```js
// Retry hanya untuk error yang memang transien.
const RETRYABLE = new Set([403, 429, 500, 502, 503, 504])

async function callWithBackoff(fn, { maxRetries = 6, maximumBackoffMs = 32_000 } = {}) {
  for (let n = 0; ; n++) {
    try {
      return await fn()
    } catch (err) {
      const status = err?.code ?? err?.response?.status
      const reason = err?.errors?.[0]?.reason ?? err?.response?.data?.error?.errors?.[0]?.reason

      // 403 karena scope/izin TIDAK boleh di-retry — hanya yang berkaitan kuota.
      const quotaish = status !== 403 || ['rateLimitExceeded', 'userRateLimitExceeded'].includes(reason)
      if (!RETRYABLE.has(status) || !quotaish || n >= maxRetries) throw err

      // random_number_milliseconds mencegah semua klien retry serentak (thundering herd).
      const jitter = Math.floor(Math.random() * 1000)
      const waitMs = Math.min(2 ** n * 1000 + jitter, maximumBackoffMs)
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }
}
```

```python
import random, time
from googleapiclient.errors import HttpError

RETRYABLE = {403, 429, 500, 502, 503, 504}
QUOTA_REASONS = {'rateLimitExceeded', 'userRateLimitExceeded'}

def call_with_backoff(fn, max_retries=6, maximum_backoff=32.0):
    for n in range(max_retries + 1):
        try:
            return fn()
        except HttpError as err:
            status = err.resp.status
            reason = ''
            try:
                reason = err.error_details[0].get('reason', '')
            except Exception:
                pass
            # 403 non-kuota (mis. insufficientPermissions) bersifat permanen.
            quotaish = status != 403 or reason in QUOTA_REASONS
            if status not in RETRYABLE or not quotaish or n == max_retries:
                raise
            wait = min(2 ** n + random.random(), maximum_backoff)
            time.sleep(wait)
```

Detail penanganan error lain: [errors.md](errors.md) dan [../guides/error-handling.md](../guides/error-handling.md).

---

## 7. Menaikkan Kuota & Menguji Batas

| Kebutuhan | Cara |
|---|---|
| Naikkan kuota per project | Cloud Console → IAM & Admin → Quotas & System Limits → ajukan penyesuaian |
| Naikkan kuota per user | Bisa diajukan, tetapi **tidak disarankan** melewati default karena aplikasi akan menabrak batas jenis lain |
| Uji perilaku saat kena limit | Buat project uji terpisah, set kuota sangat rendah, jalankan aplikasi di sana |

> Prinsip: menaikkan kuota bukan solusi pertama. Urutan yang benar: push notifications → incremental sync → sebar traffic → baru minta kuota tambahan.
