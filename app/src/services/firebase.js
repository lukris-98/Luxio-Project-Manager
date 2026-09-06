// =====================================================================
// firebase.js — Firebase Analytics (project luxio-id).
// =====================================================================
// Config web Firebase BUKAN rahasia (apiKey hanya identifier klien;
// keamanan diatur lewat rules/kebijakan Firebase), jadi nilai default
// di-hardcode di sini dan tetap bisa ditimpa lewat env VITE_FIREBASE_*.
//
// SDK dimuat LAZY (dynamic import) supaya bundle utama tidak ikut
// membawa firebase. Semua fungsi aman dipanggil kapan pun: kalau SDK
// belum siap atau tidak didukung browser, event diantrekan/dibuang
// tanpa error.
//
// Dipakai bersama utils/analytics.js: satu handler dipasang di
// main.jsx sehingga semua panggilan track() ikut terkirim ke GA4.
// =====================================================================

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAtVPfadMgHbm0_CKTGwINUiYJJLl4RjBw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'luxio-id.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'luxio-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'luxio-id.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '293061249215',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:293061249215:web:f1cbeb04ec5cb54ea61e0a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X2V95T96YR',
}

let fbPromise = null
let measurementEnabled = false

// Antrean event sebelum SDK siap; dibuang setelah flush agar tidak bocor.
let queue = []
const MAX_QUEUE = 50

/**
 * Inisialisasi Firebase Analytics. Idempoten — boleh dipanggil berkali-kali.
 * Resolve true bila analytics aktif.
 */
export const initFirebaseAnalytics = async () => {
  if (measurementEnabled) return true
  if (!fbPromise) {
    fbPromise = (async () => {
      try {
        // Analytics hanya jalan di browser yang mendukung (bukan SSR/file://).
        const [{ getApps, initializeApp }, analytics] = await Promise.all([
          import('firebase/app'),
          import('firebase/analytics'),
        ])
        const app = getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(FIREBASE_CONFIG)
        if (!(await analytics.isSupported())) return false
        analytics.getAnalytics(app)
        return true
      } catch {
        return false
      }
    })()
  }
  measurementEnabled = await fbPromise
  if (measurementEnabled) {
    const pending = queue
    queue = []
    pending.forEach((q) => logFirebaseEvent(q.event, q.params))
  }
  return measurementEnabled
}

/**
 * Kirim event ke GA4. Bila SDK belum siap, masuk antrean (maks 50 event).
 * Nama event GA4: huruf kecil + underscore, maks 40 karakter.
 */
export const logFirebaseEvent = (event, params = {}) => {
  const name = String(event || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40)
  if (!name) return
  if (!measurementEnabled) {
    if (queue.length < MAX_QUEUE) queue.push({ event: name, params })
    return
  }
  // fire-and-forget: jangan biarkan error analytics mengganggu aplikasi.
  fbPromise
    .then(async () => {
      if (!measurementEnabled) return
      const analytics = await import('firebase/analytics')
      const { getApps } = await import('firebase/app')
      const app = getApps().find((a) => a.name === '[DEFAULT]')
      if (!app) return
      // Placeholder user_id dihapus; params dibatasi agar aman.
      analytics.logEvent(analytics.getAnalytics(app), name, params)
    })
    .catch(() => {})
}

/**
 * Handler untuk analytics.onTrack() — meneruskan semua event aplikasi
 * ke GA4 dengan nama di-prefiks `luxio_` supaya tidak bertabrakan dengan
 * event default GA4.
 */
export const firebaseTrackHandler = ({ event, props }) => {
  logFirebaseEvent(`luxio_${event}`, {
    ...props,
    // GA4 menolak nilai non-primitif; ratakan jadi string.
    ...Object.fromEntries(
      Object.entries(props || {}).map(([k, v]) => [
        k,
        typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? v : String(v),
      ]),
    ),
  })
}
