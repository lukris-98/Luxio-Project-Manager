// =====================================================================
// b2Api.js — Klien Backblaze B2 API v2 dari browser, VIA PROXY Luxio
// (`POST /api/storage/proxy` di backend) karena API B2 tidak mengirim
// header CORS sehingga browser tidak bisa memanggilnya langsung.
// =====================================================================
// KEAMANAN: kredensial (keyID/applicationKey) TIDAK PERNAH ada di
// frontend. Browser memakai placeholder "APP_B2" pada header
// Authorization; proxy backend menggantinya dengan kredensial asli yang
// tersimpan di environment server.
// =====================================================================

import { proxyFetch } from './storageProxy'

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v2'
const KEY_STORE = 'luxio_b2_session'

// Metadata sesi NON-SENSITIF: apiUrl, accountId, dsb. Tidak ada token
// asli di sini — panggilan tetap lewat placeholder APP_B2.
let session = (() => {
  try { return JSON.parse(sessionStorage.getItem(KEY_STORE) || 'null') } catch { return null }
})()

const persist = () => {
  try { session ? sessionStorage.setItem(KEY_STORE, JSON.stringify(session)) : sessionStorage.removeItem(KEY_STORE) } catch { /* abaikan */ }
}

export const getB2Session = () => session
export const isB2LoggedIn = () => Boolean(session?.authorized)

export const b2Logout = () => { session = null; persist() }

// Kompatibilitas lama: tidak lagi membawa kredensial apa pun.
export const B2_APP_CREDENTIALS = { placeholder: true }

/**
 * Authorize via proxy dengan placeholder kredensial aplikasi.
 * Backend mengisi kredensial asli dari env-nya sendiri.
 */
export const b2Authorize = async () => {
  const res = await proxyFetch(`${AUTH_URL}/b2_authorize_account`, {
    headers: { Authorization: 'Basic APP_B2' },
  })
  if (res.status === 401) throw new Error('Kredensial storage salah atau kedaluwarsa.')
  if (res.status === 503) throw new Error('Storage server belum siap. Coba lagi nanti.')
  if (res.status !== 200 || !res.json) {
    throw new Error(res.json?.message || `Storage API error ${res.status}.`)
  }
  const d = res.json
  session = {
    apiUrl: d.apiUrl,
    downloadUrl: d.downloadUrl,
    accountId: d.accountId,
    keyName: d.keyName || '—',
    authorized: true,
    authorizedAt: Date.now(),
  }
  persist()
  return { accountId: session.accountId, keyName: session.keyName }
}

/** Pastikan sesi aplikasi tersedia (dipakai Bang Motion & Penyimpanan). */
export const b2EnsureAppSession = async () => {
  if (isB2LoggedIn()) return session
  await b2Authorize()
  return session
}

/** Panggilan B2 API standar (POST JSON) via proxy dengan placeholder. */
const b2Call = async (api, body = {}) => {
  if (!session?.authorized) {
    const err = new Error('Belum terhubung ke storage.')
    err.code = 'NOT_LOGGED_IN'
    throw err
  }
  const res = await proxyFetch(`${session.apiUrl}/b2api/v2/${api}`, {
    method: 'POST',
    headers: { Authorization: 'Basic APP_B2', 'Content-Type': 'application/json' },
    body,
  })
  if (res.status === 401) {
    b2Logout()
    const err = new Error(res.json?.message || 'Sesi storage berakhir. Muat ulang halaman.')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  if (res.status !== 200) {
    throw new Error(res.json?.message || `Storage API error ${res.status}.`)
  }
  return res.json
}

// ---------- Buckets ----------

export const listBuckets = () =>
  b2Call('b2_list_buckets', { accountId: session.accountId }).then((d) => d.buckets || [])

export const createBucket = (name, isPrivate = true) =>
  b2Call('b2_create_bucket', {
    accountId: session.accountId,
    bucketName: name,
    bucketType: isPrivate ? 'allPrivate' : 'allPublic',
  }).then((d) => d.bucket)

export const deleteBucket = (bucketId) =>
  b2Call('b2_delete_bucket', { accountId: session.accountId, bucketId })

// ---------- Files ----------

export const listFileNames = (bucketId, startFileName = '', max = 100) =>
  b2Call('b2_list_file_names', { bucketId, ...(startFileName ? { startFileName } : {}), maxCount: max })
    .then((d) => ({ files: d.files || [], next: d.nextFileName || '' }))

/**
 * Upload file: b2_get_upload_url lalu kirim binary via proxy.
 */
export const uploadFile = async (bucketId, file) => {
  const up = await b2Call('b2_get_upload_url', { bucketId })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sha1Bytes = await crypto.subtle.digest('SHA-1', bytes)
  const sha1 = Array.from(new Uint8Array(sha1Bytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const res = await proxyFetch(up.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Basic APP_B2',
      'X-Bz-File-Name': encodeURIComponent(file.name),
      'Content-Type': file.type || 'b2/x-auto',
      'X-Bz-Content-Sha1': sha1,
    },
    body: bytes,
  })
  if (res.status !== 200) {
    throw new Error(res.json?.message || `Upload gagal (${res.status}).`)
  }
  return res.json
}

export const deleteFileVersion = (fileName, fileId) =>
  b2Call('b2_delete_file_version', { fileName, fileId })

/** URL unduh file via downloadUrl + nama bucket + nama file (bucket public). */
export const downloadUrlFor = (bucketName, fileName) => {
  if (!session?.downloadUrl) return ''
  return `${session.downloadUrl}/file/${encodeURIComponent(bucketName)}/${fileName.split('/').map(encodeURIComponent).join('/')}`
}

/**
 * Unduh file via proxy (berfungsi untuk bucket private & public).
 * Mengembalikan Blob hasil unduhan.
 */
export const downloadFileViaProxy = async (bucketName, fileName) => {
  const url = downloadUrlFor(bucketName, fileName)
  const res = await proxyFetch(url)
  if (res.status !== 200) throw new Error(`Unduh gagal (${res.status}).`)
  const contentType = res.contentType || 'application/octet-stream'
  return new Blob([res.bytes], { type: contentType })
}
