// =====================================================================
// push.js — Web Push (notifikasi walau aplikasi tertutup).
// =====================================================================
// Mengelola subscription push di browser (pushManager) dan mendaftarkan
// subscription ke backend (POST /api/push/subscribe) agar server bisa
// mengirim notifikasi push ke perangkat.
//
// VAPID public key (dari pasangan VAPID keys yang dibuat untuk Luxio).
// Private key disimpan di environment backend (VAPID_PRIVATE_KEY) dan
// tidak pernah masuk ke frontend.
// =====================================================================

import { api } from '../services/api'

// TODO: ganti dengan public key VAPID proyek jika berbeda.
export const VAPID_PUBLIC_KEY = 'BC7LrCm1pqFI95_4M-mn_OiPoE5-J7kgJwUEYP9Rt3wC3ThIeo_wzeATKcgsHCuWJ4R68RSpfiKcveCPbvp1IYA'

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function pushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

// Ambil subscription push yang aktif (jika ada).
export async function getPushSubscription() {
  if (!pushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch (e) {
    return null
  }
}

// Subscribe push (buat subscription baru bila belum ada) lalu daftarkan
// ke backend. Mengembalikan subscription (atau null bila gagal/tidak didukung).
export async function subscribeToPush() {
  if (!pushSupported()) return null
  try {
    if (Notification.permission !== 'granted') return null
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
    // Daftarkan ke backend (best-effort; lokal tetap tersimpan di browser).
    try {
      const json = sub.toJSON()
      await api.pushSubscribe({
        endpoint: json.endpoint,
        p256dh: json.keys && json.keys.p256dh,
        auth: json.keys && json.keys.auth,
      })
    } catch (e) {
      // Backend offline — subscription tetap aktif di browser.
    }
    return sub
  } catch (e) {
    return null
  }
}

// Batalkan subscription push (opsional — saat user logout/matikan).
export async function unsubscribeFromPush() {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
  } catch (e) {
    // abaikan
  }
}
