// =====================================================================
// analytics.js — Pelacakan event aplikasi (ringan & terpusat).
// =====================================================================
// Menyediakan `track(event, props)` untuk event penting (signup, login,
// create_project, create_target, complete_task, use_ai_agent, ...).
//
// Saat ini handler default hanya log ke console (mode dev). Untuk produksi,
// daftarkan handler ke `analytics.onTrack(handler)` — misalnya kirim ke
// Google Analytics / Plausible / server sendiri. Struktur event mengikuti
// development-standards-seo-adsense.md (S27).
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

// Default handler dev: tampilkan di console saja.
if (import.meta.env.DEV) {
  onTrack(({ event, props }) => console.debug(`[analytics] ${event}`, props))
}
