// =====================================================================
// notify.js — Utilitas notifikasi (browser + in-app).
// =====================================================================
// 1. Notification API  : notifikasi sistem (laptop/desktop + Android).
// 2. navigator.vibrate : getar di HP/tablet saat notif muncul.
// 3. localStorage dedupe: setiap deadline hanya mengingatkan satu kali.
// =====================================================================

const NOTIFIED_KEY = 'luxio-notified-deadlines'

export function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export function notifySupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Tampilkan notifikasi sistem. Mengembalikan true bila berhasil tampil.
export function notify({ title, body, tag, icon }) {
  const shown = []
  if (notifySupported() && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, { body, tag, icon })
      n.onclick = () => {
        window.focus()
        n.close()
      }
      shown.push('browser')
    } catch (e) {
      // Notification constructor gagal (mis. Safari) — abaikan.
    }
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([200, 120, 200])
    } catch (e) {
      // vibrate tidak didukung — abaikan.
    }
  }
  return shown.length > 0
}

// Cek apakah sebuah key sudah pernah dinotifikasi (anti-spam satu kali per deadline).
export function alreadyNotified(key) {
  try {
    const list = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}')
    return Boolean(list[key])
  } catch (e) {
    return false
  }
}

export function markNotified(key) {
  try {
    const list = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}')
    list[key] = Date.now()
    // Batasi jumlah key agar tidak membesar tanpa batas.
    const keys = Object.keys(list)
    if (keys.length > 500) {
      const oldest = keys.sort((a, b) => list[a] - list[b]).slice(0, keys.length - 500)
      oldest.forEach((k) => delete list[k])
    }
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list))
  } catch (e) {
    // localStorage penuh/diblokir — abaikan.
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch (e) {
    return dateStr
  }
}

// Hari selisih sebuah tanggal dari hari ini (0 = hari ini, 1 = besok, dst).
export function daysUntil(dateStr) {
  if (!dateStr) return null
  try {
    const target = new Date(dateStr + 'T00:00:00')
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((target - today) / 86400000)
  } catch (e) {
    return null
  }
}
