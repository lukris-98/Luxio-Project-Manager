import { precacheAndRoute } from 'workbox-precaching'

// Aktifkan SW baru SEGERA (tanpa menunggu reload kedua) dan klaim semua
// client — tanpa ini, update PWA baru terpakai setelah 2x refresh.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

precacheAndRoute(self.__WB_MANIFEST)

// =====================================================================
// Luxio Service Worker — caching + Web Push notifications.
// =====================================================================

// Tampilkan notifikasi push (dikirim server walau aplikasi tertutup).
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'Luxio', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Luxio'
  const options = {
    body: data.body || '',
    icon: '/luxio.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/', page: data.page || '', params: data.params || {} },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Klik notifikasi → buka halaman terkait.
self.addEventListener('notificationclick', (event) => {
  const d = (event.notification.data) || {}
  const url = d.url || '/'
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('navigate' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
