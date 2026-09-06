// =====================================================================
// useSyncStatus.js — Hook status sinkronisasi (Tahap 4)
// =====================================================================
// Memberi UI info real-time:
//   - online / offline
//   - jumlah operasi yang menunggu dikirim (pending queue)
//   - perkiraan ukuran penyimpanan lokal (untuk indikator kuota)
//   - fungsi sinkron manual (mengirim queue)
// =====================================================================

import { useState, useEffect, useCallback } from 'react'
import { isOnline, onStatusChange, queuedCount, onQueueChange, flushQueue } from '../services/sync'
import { estimateSize } from '../services/idb'

// Batas perkiraan penyimpanan lokal (kuota lunak) — Tahap 4.
export const STORAGE_SOFT_LIMIT_BYTES = 100 * 1024 * 1024 // 100 MB

const fmtBytes = (n) => {
  if (!n) return '0 KB'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function useSyncStatus() {
  const [online, setOnline] = useState(isOnline())
  const [pending, setPending] = useState(0)
  const [storage, setStorage] = useState(0)
  const [flushing, setFlushing] = useState(false)

  // Reaktivitas status online/offline.
  useEffect(() => {
    const off = onStatusChange((v) => setOnline(v))
    return off
  }, [])

  // Pantau antrean tulis.
  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const c = await queuedCount()
      if (alive) setPending(c)
    }
    refresh()
    const off = onQueueChange(refresh)
    const iv = setInterval(refresh, 5000) // sinkron berkala tiap 5 dtk
    return () => { alive = false; off(); clearInterval(iv) }
  }, [])

  // Estimasi ukuran penyimpanan lokal (kuota).
  useEffect(() => {
    let alive = true
    const refresh = async () => {
      const s = await estimateSize()
      if (alive) setStorage(s)
    }
    refresh()
    const iv = setInterval(refresh, 15000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  // Sinkron manual: kirim antrean yang menunggu.
  const syncNow = useCallback(async () => {
    if (flushing) return 0
    setFlushing(true)
    const { api } = await import('../services/api')
    const sent = await api.flushPending()
    setFlushing(false)
    const c = await queuedCount()
    setPending(c)
    return sent
  }, [flushing])

  const storagePct = Math.min(100, Math.round((storage / STORAGE_SOFT_LIMIT_BYTES) * 100))

  return {
    online,
    pending,
    storage,
    storageLabel: fmtBytes(storage),
    storagePct,
    flushing,
    syncNow,
  }
}
