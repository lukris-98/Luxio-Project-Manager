// =====================================================================
// s3TransferQueue.js — Antrian transfer (upload/download) ala Google Drive
// =====================================================================
// Fitur:
//   - Antrian upload & download dengan concurrency (3 paralel).
//   - Progress per item (upload: progress event fetch; download: stream reader).
//   - Retry otomatis (2x, backoff) untuk kegagalan jaringan.
//   - Pause / resume / cancel global dan per item.
//   - Subscriber untuk reaktif UI (React).
//   - Persist daftar antrian di sessionStorage (bukan localStorage, supaya
//     tidak menumpuk antar tab) — hanya metadata, bukan file body.
// =====================================================================

const MAX_CONCURRENT = 3
const MAX_RETRIES = 2
const QUEUE_KEY = 'luxio-s3-queue'

import { api } from './api'

// status: queued | uploading | downloading | done | error | canceled | paused
let items = new Map() // id -> item
let running = 0
let paused = false
let listeners = new Set()
let hydrated = false

function notify() {
  const snapshot = listItems()
  listeners.forEach((fn) => {
    try { fn(snapshot) } catch { /* noop */ }
  })
  persist()
}

function persist() {
  try {
    const meta = listItems().map((it) => ({
      id: it.id, kind: it.kind, name: it.name, key: it.key, size: it.size,
      status: it.status, progress: it.progress, error: it.error,
      addedAt: it.addedAt, finishedAt: it.finishedAt,
    }))
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(meta))
  } catch { /* noop */ }
}

function hydrate() {
  if (hydrated) return
  hydrated = true
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    arr.forEach((m) => {
      if (['uploading', 'downloading'].includes(m.status)) {
        // Transfer yang mati saat reload → tandai error (tidak bisa dilanjutkan)
        m.status = 'error'
        m.error = 'Transfer terputus (halaman dimuat ulang)'
      }
      items.set(m.id, { ...m, file: null, controller: null, retry: 0 })
    })
  } catch { /* noop */ }
}

export function listItems() {
  return Array.from(items.values()).map((it) => ({ ...it }))
}

export function subscribe(fn) {
  hydrate()
  listeners.add(fn)
  fn(listItems())
  return () => listeners.delete(fn)
}

export function isPaused() { return paused }

export function pauseAll() {
  paused = true
  items.forEach((it) => {
    if (it.status === 'queued') it.status = 'paused'
  })
  notify()
}

export function resumeAll() {
  paused = false
  items.forEach((it) => {
    if (it.status === 'paused') it.status = 'queued'
  })
  notify()
  pump()
}

export function pauseItem(id) {
  const it = items.get(id)
  if (!it || it.status !== 'queued') return
  it.status = 'paused'
  notify()
}

export function resumeItem(id) {
  const it = items.get(id)
  if (!it || it.status !== 'paused') return
  it.status = 'queued'
  notify()
  pump()
}

export function cancelItem(id) {
  const it = items.get(id)
  if (!it) return
  if (it.controller) it.controller.abort()
  it.status = 'canceled'
  it.controller = null
  notify()
}

export function clearFinished() {
  Array.from(items.entries()).forEach(([id, it]) => {
    if (['done', 'error', 'canceled'].includes(it.status)) items.delete(id)
  })
  notify()
}

export function retryItem(id) {
  const it = items.get(id)
  if (!it || !['error', 'canceled', 'paused'].includes(it.status)) return
  if (it.kind === 'upload' && !it.file) return
  it.status = 'queued'
  it.progress = 0
  it.error = ''
  it.retry = 0
  notify()
  pump()
}

export function enqueueUpload(file, opts = {}) {
  hydrate()
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  items.set(id, {
    id, kind: 'upload', name: file.name, size: file.size, file,
    key: null, status: 'queued', progress: 0, error: '', retry: 0,
    addedAt: Date.now(), controller: null,
    category: opts.category || '',
  })
  notify()
  pump()
  return id
}

export function enqueueDownload(item) {
  hydrate()
  const id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  items.set(id, {
    id, kind: 'download', name: item.name || (item.key || '').split('/').pop() || 'file',
    size: item.size || 0, key: item.key, file: null,
    status: 'queued', progress: 0, error: '', retry: 0,
    addedAt: Date.now(), controller: null,
  })
  notify()
  pump()
  return id
}

function pump() {
  if (paused) return
  while (running < MAX_CONCURRENT) {
    const next = Array.from(items.values()).find((it) => it.status === 'queued')
    if (!next) break
    next.status = next.kind === 'upload' ? 'uploading' : 'downloading'
    running += 1
    runItem(next).finally(() => {
      running -= 1
      notify()
      pump()
    })
  }
  notify()
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function runItem(it) {
  const maxTry = MAX_RETRIES + 1
  for (let attempt = 1; attempt <= maxTry; attempt += 1) {
    if (['canceled', 'paused'].includes(it.status)) return
    try {
      if (it.kind === 'upload') await doUpload(it)
      else await doDownload(it)
      it.status = 'done'
      it.progress = 100
      it.finishedAt = Date.now()
      notify()
      return
    } catch (err) {
      if (it.status === 'canceled') return
      if (err && err.name === 'AbortError') { it.status = 'canceled'; notify(); return }
      if (it.status === 'paused') { it.status = 'queued'; return }
      it.error = String((err && err.message) || err).replace(/^Error: ?/, '')
      if (attempt < maxTry) {
        it.retry = attempt
        await delay(600 * attempt)
        if (['canceled', 'paused'].includes(it.status)) return
      } else {
        it.status = 'error'
        it.finishedAt = Date.now()
        notify()
        return
      }
    }
  }
}

// ---- Upload: XHR (progress event) via api.s3UploadXhr ----
async function doUpload(it) {
  await new Promise((resolve, reject) => {
    const { url, token } = { url: api.s3UploadXhr.url(), token: api.s3UploadXhr.token() }
    const xhr = new XMLHttpRequest()
    it.controller = { abort: () => { xhr.abort() } }
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) it.progress = Math.round((e.loaded / e.total) * 100)
      notify()
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          it.key = json.key || it.key
          it.name = json.file_name || it.name
        } catch { /* noop */ }
        resolve()
      } else {
        reject(new Error(`Upload gagal (${xhr.status}): ${xhr.responseText.slice(0, 160)}`))
      }
    }
    xhr.onerror = () => reject(new Error('Koneksi terputus saat upload'))
    xhr.onabort = () => reject(Object.assign(new Error('Dibatalkan'), { name: 'AbortError' }))
    const fd = new FormData()
    fd.append('file', it.file)
    fd.append('category', it.category || '')
    xhr.send(fd)
  })
}

// ---- Download: fetch + ReadableStream (progress) via api.s3DownloadStream ----
async function doDownload(it) {
  const { res } = await api.s3DownloadStream(it.key, it.controller?.signal)
  if (!res.ok) throw new Error(`Gagal mengunduh file (${res.status})`)

  const total = Number(res.headers.get('content-length')) || it.size || 0
  const name = it.name || it.key.split('/').pop() || 'file'

  const finish = (blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader()
    const chunks = []
    let loaded = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      if (total) it.progress = Math.min(99, Math.round((loaded / total) * 100))
      else it.progress = Math.min(99, Math.round((loaded / (25 * 1024 * 1024)) * 100))
      notify()
    }
    finish(new Blob(chunks))
  } else {
    // Fallback browser lama: tanpa progress detail
    const blob = await res.blob()
    finish(blob)
  }
}
