// =====================================================================
// storageSession.js — Sesi buka halaman "Penyimpanan".
// =====================================================================
// Setelah lolos 2 langkah (kode OTP email + PIN owner), sesi unlock
// disimpan di localStorage TERIKAT user, sehingga tahan refresh, pindah
// tab, dan pindah halaman. Sesi HANYA berakhir bila:
//   - user klik tombol "Keluar" di halaman Penyimpanan, atau
//   - user logout dari aplikasi (useStore.logout memanggil clear).
// =====================================================================

const UNLOCKED_KEY = 'luxio_storage_unlocked'
const PIN_CH_KEY = 'luxio_storage_pin_challenge'

export function isStorageUnlocked(userId) {
  if (!userId) return false
  try {
    const v = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || 'null')
    return Boolean(v && v.uid === userId)
  } catch { return false }
}

export function setStorageUnlocked(userId) {
  try { localStorage.setItem(UNLOCKED_KEY, JSON.stringify({ uid: userId })) } catch { /* penuh/privacy */ }
}

/** Challenge langkah-2 (PIN) dari verifikasi OTP — sekali pakai, ada TTL. */
export function getPinChallenge(userId) {
  if (!userId) return null
  try {
    const c = JSON.parse(localStorage.getItem(PIN_CH_KEY) || 'null')
    if (c && c.uid === userId && c.challenge && Number(c.exp) > Date.now()) return c
  } catch { /* abaikan */ }
  return null
}

export function setPinChallenge(userId, challenge, ttlSec) {
  try {
    localStorage.setItem(PIN_CH_KEY, JSON.stringify({
      uid: userId, challenge, exp: Date.now() + (ttlSec || 600) * 1000,
    }))
  } catch { /* abaikan */ }
}

export function clearPinChallenge() {
  try { localStorage.removeItem(PIN_CH_KEY) } catch { /* abaikan */ }
}

export function clearStorageSession() {
  try {
    localStorage.removeItem(UNLOCKED_KEY)
    localStorage.removeItem(PIN_CH_KEY)
  } catch { /* abaikan */ }
}
