// =====================================================================
// analytics.js — Pelacakan event aplikasi (ringan & terpusat).
// =====================================================================
// Menyediakan `track(event, props)` untuk event penting (signup, login,
// create_project, create_target, complete_task, use_ai_agent, ...).
//
// Handler produksi: firebase.js memasang handler yang meneruskan event
// ke Google Analytics 4 (GA4, property luxio-id) — lihat services/firebase.js.
// Struktur event mengikuti development-standards-seo-adsense.md (S27).
// =====================================================================

const handlers = []

/**
 * Daftarkan handler yang dipanggil untuk setiap event.
 * Handler menerima `{ event, props, ts }`.
 */
export function onTrack(handler) {
  handlers.push(handler)
}

/**
 * Kirim event analitik.
 * @param {string} event - nama event, contoh 'signup', 'create_target'
 * @param {object} [props] - properti tambahan (mis. plan, viewType)
 */
export function track(event, props = {}) {
  const payload = { event, props, ts: Date.now() }
  handlers.forEach((h) => {
    try { h(payload) } catch (e) { /* jangan sampai mengganggu aplikasi */ }
  })
  if (import.meta.env.DEV) {
    console.debug(`[track] ${event}`, props)
  }
}

// Handler GA4 didaftarkan SECARA LAZY (dynamic import) supaya modul
// services/firebase.js — beserta SDK Firebase yang di dalamnya — tidak
// masuk graph utama dan tidak ikut di-resolve saat testing.
let firebaseHandlerAdded = false
function ensureFirebaseHandler() {
  if (firebaseHandlerAdded) return
  firebaseHandlerAdded = true
  import('../services/firebase')
    .then((m) => onTrack(m.firebaseTrackHandler))
    .catch(() => {})
}
ensureFirebaseHandler()

// Default handler dev: tampilkan di console saja.
if (import.meta.env.DEV) {
  onTrack(({ event, props }) => console.debug(`[analytics] ${event}`, props))
}
