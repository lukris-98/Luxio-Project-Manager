// =====================================================================
// bloggerCache.js — Cache TTL untuk Blogger API (memory + sessionStorage)
// =====================================================================
// - Semua GET (blogs/posts/pages/comments) disimpan dengan TTL pendek
//   supaya berpindah tab/blog tidak memanggil API berulang (cepat & hemat
//   quota).
// - Setiap operasi tulis (create/update/delete/publish/moderasi) otomatis
//   menghapus cache terkait lewat cacheInvalidate(prefix) di bloggerApi.js,
//   jadi tampilan langsung menyegarkan data setelah ada perubahan.
// - cacheClear() dipanggil saat logout/ganti akun supaya data akun lain
//   tidak tercampur.
// =====================================================================

const STORE_KEY = 'luxio_blogger_cache'

let cache = (() => {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') || {} }
  catch { return {} }
})()

const persist = () => {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(cache)) } catch { /* storage penuh — cache memory tetap jalan */ }
}

/** Ambil data dari cache; null bila tidak ada / sudah kedaluwarsa. */
export const cacheGet = (key) => {
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    delete cache[key]
    persist()
    return null
  }
  return entry.data
}

/** Simpan data ke cache dengan TTL (default 2 menit). */
export const cacheSet = (key, data, ttlMs = 120_000) => {
  cache[key] = { data, expiresAt: Date.now() + ttlMs }
  persist()
}

/** Hapus semua key yang diawali `prefix` (atau semua bila prefix kosong). */
export const cacheInvalidate = (prefix = '') => {
  for (const key of Object.keys(cache)) {
    if (!prefix || key.startsWith(prefix)) delete cache[key]
  }
  persist()
}

/** Bersihkan seluruh cache Blogger (dipakai saat logout/ganti akun). */
export const cacheClear = () => {
  cache = {}
  persist()
}
