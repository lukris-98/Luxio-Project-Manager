// =====================================================================
// syncQueue.js — Antrean sinkronisasi offline (Tahap 3)
// =====================================================================
// Menyimpan operasi tulis (POST/PUT/DELETE) yang gagal/terblokir saat
// offline DI DALAM IndexedDB (bukan localStorage) supaya kapasitas besar
// dan tidak ikut terbawa migrate state zustand.
//
// API:
//   enqueue(item)          -> tambah operasi ke antrean
//   count()                -> jumlah antrean saat ini
//   pending()              -> ambil semua isi antrean
//   flush(sender)          -> kirim semua ke server via sender
//   clear()                -> kosongkan antrean (setelah sukses semua)
//   onQueueChange(fn)      -> subscribe perubahan (untuk badge UI)
// =====================================================================

const DB_NAME = 'luxio-db'
const STORE = 'sync-queue'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const store = t.objectStore(STORE)
        const request = fn(store)
        t.oncomplete = () => resolve(request && request.result)
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
      })
  )
}

// ---------- SUBSCRIBER (untuk badge sinkronisasi di UI) ----------
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

export function onQueueChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------- OPERASI ----------

/**
 * Tambah operasi ke antrean.
 * @param {object} item { method, path, body } (id dibuat otomatis)
 */
export async function enqueue(item) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const record = { ...item, id, createdAt: Date.now() }
  try {
    await tx('readwrite', (s) => s.put(record))
  } catch (e) {
    // IndexedDB gagal → fallback: simpan di memori (hilang saat refresh).
    fallbackMemory.push(record)
  }
  notify()
  return id
}

export async function count() {
  try {
    return await tx('readonly', (s) => s.count())
  } catch (e) {
    return fallbackMemory.length
  }
}

export async function pending() {
  try {
    return await tx('readonly', (s) => s.getAll())
  } catch (e) {
    return [...fallbackMemory]
  }
}

/**
 * Kirim semua antrean ke server.
 * `sender(item)` harus mengembalikan { ok: true } bila sukses.
 * Operasi sukses dihapus; yang gagal tetap tinggal untuk retry.
 * @returns {Promise<number>} jumlah yang berhasil
 */
export async function flush(sender) {
  const items = await pending()
  if (!items.length) return 0
  const failed = []
  let sent = 0
  for (const item of items) {
    try {
      const res = await sender(item)
      if (res && res.ok) {
        sent++
        await tx('readwrite', (s) => s.delete(item.id))
      } else {
        failed.push(item)
      }
    } catch (e) {
      failed.push(item)
    }
  }
  // Simpan kembali yang gagal (retry berikutnya).
  if (failed.length > 0) {
    try {
      for (const item of failed) {
        await tx('readwrite', (s) => s.put(item))
      }
    } catch (e) {
      // abaikan
    }
  }
  fallbackMemory = failed
  notify()
  return sent
}

export async function clear() {
  try {
    await tx('readwrite', (s) => s.clear())
  } catch (e) {
    fallbackMemory = []
  }
  notify()
}

// Fallback in-memory bila IndexedDB tidak tersedia.
let fallbackMemory = []
