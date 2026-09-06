// =====================================================================
// googleAuth.js — Autentikasi OAuth 2.0 Google (semua layanan Google).
// =====================================================================
// Memakai Google Identity Services (GIS) "token client" (implicit flow):
//  - Hanya butuh OAuth Client ID (tanpa client secret) — aman di frontend.
//  - Popup Google muncul saat user klik tombol "Login dengan Google".
//  - Access token di-cache (memory + sessionStorage) sampai kedaluwarsa,
//    supaya berpindah halaman tidak meminta login ulang.
//
// Konfigurasi (wajib diisi pemilik app di Google Cloud Console):
//  1. Buat OAuth Client ID tipe "Web application".
//  2. Authorized JavaScript origins:
//       http://localhost:5173              (dev)
//       https://luxio.web.id               (produksi)
//       https://luxio-id.web.app           (Firebase Hosting default)
//  3. Aktifkan API yang dipakai di project tersebut: Gmail, Blogger,
//     Drive, Calendar, YouTube Data v3, YouTube Analytics, YouTube
//     Reporting.
//  4. OAuth consent screen: tambahkan scope + test users selama status
//     masih "Testing"; isi tautan kebijakan privasi & persyaratan layanan
//     (https://luxio.web.id/privasi dan https://luxio.web.id/syarat).
//  5. Simpan Client ID di file .env:
//       VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
//
// PENTING soal cache token: kunci cache adalah SET scope yang diminta.
// Meminta scope set yang berbeda = popup consent baru. Karena itu setiap
// halaman memakai satu konstanta scope set (mis. YOUTUBE_PAGE_SCOPES di
// services/youtubeApi.js) yang dipakai BERSAMA oleh halaman dan seluruh
// klien API-nya, supaya user hanya melihat satu popup per halaman.
// =====================================================================

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Scope OAuth per layanan. Prinsip: minta scope SEKECIL mungkin karena
// verifikasi OAuth Google makin ketat untuk scope sensitif/restricted.
export const GOOGLE_SCOPES = {
  GMAIL: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ],
  BLOGGER: ['https://www.googleapis.com/auth/blogger'],
  // Drive: drive.file = hanya file yang dibuat/dipilih lewat aplikasi ini.
  // Sengaja BUKAN 'drive' atau 'drive.readonly' — keduanya restricted scope
  // yang mewajibkan security assessment (CASA) tahunan berbiaya.
  DRIVE: ['https://www.googleapis.com/auth/drive.file'],
  // Calendar: cukup baca daftar kalender + kelola acara.
  CALENDAR: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  // YouTube Data API v3 — baca channel/video/playlist milik sendiri.
  YOUTUBE: ['https://www.googleapis.com/auth/youtube.readonly'],
  // Tambahan bila nanti perlu tulis (upload video, ubah playlist).
  YOUTUBE_MANAGE: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
  ],
  // YouTube Analytics API v2 + YouTube Reporting API v1 memakai scope sama.
  YOUTUBE_ANALYTICS: ['https://www.googleapis.com/auth/yt-analytics.readonly'],
  // Laporan pendapatan (butuh akun YouTube Partner).
  YOUTUBE_ANALYTICS_MONETARY: [
    'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  ],
  // Profil dasar untuk menampilkan nama/email akun yang login.
  PROFILE: ['openid', 'email', 'profile'],
}


export const isGoogleConfigured = () => Boolean(CLIENT_ID)

let gsiPromise = null
function loadGsiScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Gagal memuat skrip Google.')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => { gsiPromise = null; reject(new Error('Gagal memuat skrip Google. Periksa koneksi.')) }
    document.head.appendChild(s)
  })
  return gsiPromise
}

// Token cache per-set scope: { [scopeKey]: { token, expiresAt, email } }
const TOKEN_STORE_KEY = 'luxio_google_tokens'
let tokens = {}
try {
  tokens = JSON.parse(sessionStorage.getItem(TOKEN_STORE_KEY) || '{}') || {}
} catch { tokens = {} }

const persistTokens = () => {
  try { sessionStorage.setItem(TOKEN_STORE_KEY, JSON.stringify(tokens)) } catch { /* abaikan */ }
}

const scopeKeyOf = (scopes) => [...scopes].sort().join(' ')

export const getCachedToken = (scopes) => {
  const entry = tokens[scopeKeyOf(scopes)]
  if (!entry) return null
  // Beri margin 60 detik sebelum kedaluwarsa.
  if (!entry.token || Date.now() > entry.expiresAt - 60_000) {
    delete tokens[scopeKeyOf(scopes)]
    persistTokens()
    return null
  }
  return entry
}

export const clearGoogleTokens = () => {
  tokens = {}
  persistTokens()
}

// Revoke token (cabut izin) — dipakai tombol "Keluar".
export const revokeGoogleToken = async (scopes) => {
  const entry = tokens[scopeKeyOf(scopes)]
  if (!entry) return
  delete tokens[scopeKeyOf(scopes)]
  persistTokens()
  await loadGsiScript()
  try { window.google.accounts.oauth2.revoke(entry.token, () => {}) } catch { /* abaikan */ }
}

/**
 * Minta access token via popup GIS. Resolve { token, expiresAt, email }.
 * Jika user sudah pernah memberi izin untuk scope yang sama dan token
 * masih hidup, resolve langsung dari cache tanpa popup.
 */
export const requestGoogleToken = async ({ scopes, email = '', prompt = '' } = {}) => {
  if (!isGoogleConfigured()) {
    const err = new Error('NOT_CONFIGURED')
    err.code = 'NOT_CONFIGURED'
    throw err
  }
  const cached = getCachedToken(scopes)
  if (cached && (!email || cached.email === email)) return cached

  await loadGsiScript()
  return new Promise((resolve, reject) => {
    let settled = false
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: scopes.join(' '),
      ...(email ? { login_hint: email } : {}),
      ...(prompt ? { prompt } : {}),
      callback: (resp) => {
        settled = true
        if (resp?.error) {
          const err = new Error(resp.error_description || resp.error)
          err.code = resp.error
          reject(err)
          return
        }
        const entry = {
          token: resp.access_token,
          // exp_in detik dari sekarang.
          expiresAt: Date.now() + Number(resp.expires_in || 3600) * 1000,
          scope: resp.scope || scopes.join(' '),
          email,
        }
        tokens[scopeKeyOf(scopes)] = entry
        persistTokens()
        resolve(entry)
      },
      error_callback: (err) => {
        settled = true
        const e = new Error(err?.message || err?.type || 'Popup ditutup')
        e.code = err?.type || 'popup_closed'
        reject(e)
      },
    })
    client.requestAccessToken()
    // Jaga-jaga bila popup ditutup tanpa callback (beberapa browser).
    setTimeout(() => { if (!settled) { /* biarkan; error_callback biasanya terpanggil */ } }, 0)
  })
}

/**
 * Wrapper fetch untuk Google API: otomatis sisipkan Bearer token;
 * bila 401 (token kadaluarsa) coba ambil token baru sekali lalu ulang.
 *
 * Opsi `raw: true` mengembalikan objek Response mentah (untuk unduh file
 * biner / CSV), bukan hasil res.json().
 */
export const googleFetch = async (url, { method = 'GET', body, headers = {}, scopes, email = '', raw = false } = {}) => {
  const entry = await requestGoogleToken({ scopes, email })
  const isPlainObject = body && typeof body !== 'string' && !(body instanceof Blob) && !(body instanceof FormData)
  const doFetch = (token) =>
    fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isPlainObject ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body ? { body: isPlainObject ? JSON.stringify(body) : body } : {}),
    })

  let res = await doFetch(entry.token)
  if (res.status === 401) {
    clearGoogleTokens()
    const fresh = await requestGoogleToken({ scopes, email })
    res = await doFetch(fresh.token)
  }
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j?.error?.message || j?.error_description || ''
    } catch { /* biarkan kosong */ }
    const err = new Error(detail || `Google API error ${res.status}`)
    err.status = res.status
    throw err
  }
  if (raw) return res
  if (res.status === 204) return null
  return res.json()
}

/** Info akun Google yang login (nama, email, foto). */
export const fetchGoogleUserInfo = async (scopes) => {
  const data = await googleFetch('https://www.googleapis.com/oauth2/v3/userinfo', { scopes })
  return { name: data.name, email: data.email, picture: data.picture }
}
