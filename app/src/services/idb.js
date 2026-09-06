// =====================================================================
// idb.js — Wrapper IndexedDB (Tahap 3)
// =====================================================================
// Menggantikan localStorage untuk menyimpan state yang besar (zustand
// persist) supaya tidak cepat penuh (localStorage cuma ~5MB) dan tidak
// memblokir UI (IndexedDB async).
//
// API mengikuti bentuk yang diharapkan zustand persist middleware:
//   getItem(name) -> Promise<json string | null>
//   setItem(name, value) -> Promise<void>
//   removeItem(name) -> Promise<void>
// =====================================================================

const DB_NAME = 'luxio-db'
const STORE = 'kv'

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
        db.createObjectStore(STORE) // keyPath default = key
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode, fn) {
  return openDB().then((db) =>
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

export async function getItem(key) {
  try {
    const value = await tx('readonly', (s) => s.get(key))
    if (value !== undefined && value !== null) return value
    // Migrasi satu kali: data lama masih di localStorage → pindahkan ke
    // IndexedDB supaya sesi/state tidak hilang saat beralih storage.
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        await tx('readwrite', (s) => s.put(raw, key))
        return raw
      }
    } catch (_) {
      // abaikan
    }
    return null
  } catch (e) {
    // Fallback ke localStorage bila IndexedDB gagal (mis. private mode).
    try {
      const raw = localStorage.getItem(key)
      return raw
    } catch (_) {
      return null
    }
  }
}

export async function setItem(key, value) {
  try {
    await tx('readwrite', (s) => s.put(value, key))
  } catch (e) {
    // Fallback localStorage.
    try {
      localStorage.setItem(key, value)
    } catch (_) {
      // localStorage penuh — abaikan (persist gagal tidak fatal).
    }
  }
}

export async function removeItem(key) {
  try {
    await tx('readwrite', (s) => s.delete(key))
  } catch (e) {
    try {
      localStorage.removeItem(key)
    } catch (_) {
      // abaikan
    }
  }
}

// Hapus SEMUA data di database (dipakai saat logout untuk kebersihan).
export async function clearAll() {
  try {
    const db = await openDB()
    const t = db.transaction(STORE, 'readwrite')
    t.objectStore(STORE).clear()
    await new Promise((resolve) => { t.oncomplete = resolve; t.onerror = resolve })
  } catch (e) {
    // abaikan
  }
}

// Estimasi total ukuran data (byte) untuk indikator kuota di UI (Tahap 4).
export async function estimateSize() {
  let total = 0
  try {
    const db = await openDB()
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).openCursor()
    await new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          try {
            total += JSON.stringify(cursor.value || '').length
          } catch (_) {
            total += 0
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    // fallback: ukuran localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        total += (localStorage.getItem(k) || '').length
      }
    } catch (_) {
      total = 0
    }
  }
  return total
}
