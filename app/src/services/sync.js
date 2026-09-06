// =====================================================================
// sync.js — Lapisan sinkronisasi & cache (Tahap 2, tanpa IndexedDB dulu)
// =====================================================================
// Tujuan:
//   1. Offline detection — tahu kapan online/offline.
//   2. Cache GET (stale-while-revalidate) — baca cache dulu supaya cepat,
//      lalu validasi ulang ke server di belakang layar.
//   3. Antrean tulis offline — kalau offline, operasi tulis masuk antrean
//      dan dikirim otomatis saat koneksi kembali.
//
// Didesain "cukup struktur data di store" sesuai rencana: cache disimpan
// dalam Map di memori + ditiru ke localStorage agar survive refresh
// (bukan IndexedDB — itu Tahap 3).
// =====================================================================

import {
  enqueue as queueEnqueue,
  count as queueCount,
  pending as queuePending,
  flush as queueFlush,
  clear as queueClear,
  onQueueChange as queueOnChange,
} from './syncQueue'

const CACHE_KEY = 'luxio-cache-v1'

// ---------- ONLINE/OFFLINE DETECTION ----------

let online = typeof navigator !== 'undefined' ? navigator.onLine : true
const listeners = new Set()

function setOnline(value) {
  const changed = online !== value
  online = value
  if (changed) {
    listeners.forEach((fn) => fn(online))
    if (online) flushQueue()
  }
}

// Pasang listener global (hanya sekali).
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
}

export function isOnline() {
  return online
}

export function onStatusChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------- CACHE (GET) ----------

let memoryCache = null

function loadCache() {
  if (memoryCache) return memoryCache
  memoryCache = new Map()
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v))
    }
  } catch (e) {
    // cache korup → mulai kosong
  }
  return memoryCache
}

function persistCache() {
  try {
    const obj = {}
    memoryCache.forEach((v, k) => { obj[k] = v })
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch (e) {
    // localStorage penuh — biarkan (tulis cache gagal tidak fatal)
  }
}

/**
 * Ambil dari cache. Mengembalikan { hit, value } — `hit=true` bila ada.
 */
export function cacheGet(key) {
  const hit = loadCache().get(key)
  return hit ? { hit: true, value: hit } : { hit: false, value: undefined }
}

/**
 * Simpan ke cache (dengan batas jumlah entri agar tidak membengkak).
 */
export function cacheSet(key, value) {
  const cache = loadCache()
  cache.set(key, value)
  // Batas sederhana: maks 200 entri, buang yang paling lama (Map FIFO).
  if (cache.size > 200) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  persistCache()
}

export function cacheInvalidate(key) {
  if (!memoryCache) return
  memoryCache.delete(key)
  persistCache()
}

export function cacheClear() {
  memoryCache = new Map()
  persistCache()
}

/**
 * Helper stale-while-revalidate.
 * - Bila cache ada → kembalikan { cached: true, value, fresh } langsung.
 * - `fresh=true` bila belum lewat `maxAgeMs`; tetap memicu revalidate
 *   di belakang (mengembalikan promise) bila sudah lama.
 * - Bila tidak ada cache → ambil dari `fetcher`, simpan, kembalikan.
 */
export async function staleWhileRevalidate(key, fetcher, maxAgeMs = 30_000) {
  const cached = cacheGet(key)
  const now = Date.now()

  if (cached.hit) {
    const age = now - (cached.value._t || 0)
    const fresh = age < maxAgeMs
    // Data kedaluwarsa → validasi ulang di belakang layar (tidak menghalangi UI).
    if (!fresh) {
      revalidateInBackground(key, fetcher)
    }
    return { cached: true, fresh, value: cached.value.data }
  }

  const data = await fetcher()
  cacheSet(key, { _t: now, data })
  return { cached: false, fresh: true, value: data }
}

async function revalidateInBackground(key, fetcher) {
  try {
    const data = await fetcher()
    cacheSet(key, { _t: Date.now(), data })
  } catch (e) {
    // Revalidate gagal — biarkan data lama tetap dipakai.
  }
}

// ---------- ANTREAN TULIS OFFLINE ----------
// Implementasi dipindah ke syncQueue.js (IndexedDB — Tahap 3).
// sync.js hanya re-export agar pemanggil lama (api.js) tidak perlu berubah.

/**
 * Tambah operasi tulis ke antrean (disimpan di IndexedDB).
 * @param {object} item { method, path, body }
 */
export function enqueueWrite(item) {
  queueEnqueue(item)
  if (online) flushQueue()
}

export async function queuedCount() {
  return queueCount()
}

export function onQueueChange(fn) {
  return queueOnChange(fn)
}

/**
 * Kirim semua operasi antrean ke server secara berurutan.
 * `sender` = async (item) => { ... } yang melakukan fetch & mengembalikan { ok }.
 */
export async function flushQueue(sender) {
  if (!online) return 0
  if (!sender || typeof sender !== 'function') return 0
  return queueFlush(sender)
}

export async function pendingWrites() {
  return queuePending()
}
