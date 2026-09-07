// =====================================================================
// b2Api.js — Klien Backblaze B2 API v2 dari browser, VIA PROXY Luxio
// (`POST /api/storage/proxy` di backend) karena API B2 tidak mengirim
// header CORS sehingga browser tidak bisa memanggilnya langsung.
// =====================================================================
// Login memakai keyID + applicationKey (basic auth b2_authorize_account).
// Setelah authorize, semua request memakai authorizationToken + apiUrl +
// downloadUrl yang dikembalikan server. Operasi yang didukung:
//   - b2_authorize_account   (login)
//   - b2_list_buckets        (daftar bucket)
//   - b2_create_bucket       (buat bucket)
//   - b2_delete_bucket       (hapus bucket)
//   - b2_list_file_names     (daftar file dalam bucket)
//   - b2_upload_file         (upload file — binary via proxy)
//   - b2_delete_file_version (hapus file)
//   - download via downloadUrl (public) atau proxy (private)
// =====================================================================

import { proxyFetch } from './storageProxy'

const AUTH_URL = 'https://api.backblazeb2.com/b2api/v2'
const KEY_STORE = 'luxio_b2_session'

// Sesi authorize aktif: { apiUrl, downloadUrl, token, accountId, ... }
let session = (() => {
  try { return JSON.parse(sessionStorage.getItem(KEY_STORE) || 'null') } catch { return null }
})()

const persist = () => {
  try { session ? sessionStorage.setItem(KEY_STORE, JSON.stringify(session)) : sessionStorage.removeItem(KEY_STORE) } catch { /* abaikan */ }
}

export const getB2Session = () => session
export const isB2LoggedIn = () => Boolean(session?.token)
export const b2Logout = () => { session = null; persist() }

// Kredensial aplikasi Luxio (application key milik pemilik akun B2).
// Dipakai untuk login otomatis oleh fitur yang butuh B2 (mis. Bang Motion
// menyimpan hasil) tanpa mengharuskan user login manual dulu.
export const B2_APP_CREDENTIALS = {
  keyId: '005b7f30a3ea0b50000000001',
  appKey: 'K005kn5dwT76XP8Z93UDnuMPQoZvWak',
  keyName: 'Luxio',
}

/** Pastikan ada sesi B2 — login otomatis dengan kredensial aplikasi. */
export const b2EnsureAppSession = async () => {
  if (isB2LoggedIn()) return session
  await b2Authorize(B2_APP_CREDENTIALS.keyId, B2_APP_CREDENTIALS.appKey)
  return session
}

/**
 * Login: b2_authorize_account dengan Basic auth keyID:applicationKey.
 * Token berlaku maksimal 24 jam; disimpan di sessionStorage (hilang saat
 * tab ditutup — aman untuk kredensial).
 */
export const b2Authorize = async (keyId, applicationKey) => {
  const authHeader = `Basic ${btoa(`${keyId.trim()}:${applicationKey.trim()}`)}`
  const res = await proxyFetch(`${AUTH_URL}/b2_authorize_account`, {
    headers: { Authorization: authHeader },
  })
  if (res.status === 401) throw new Error('keyID atau applicationKey salah.')
  if (res.status !== 200 || !res.json) {
    throw new Error(res.json?.message || `B2 API error ${res.status}.`)
  }
  const d = res.json
  session = {
    apiUrl: d.apiUrl,
    downloadUrl: d.downloadUrl,
    token: d.authorizationToken,
    accountId: d.accountId,
    keyName: d.keyName || '—',
    allowed: d.allowed || null,
    authorizedAt: Date.now(),
  }
  persist()
  return { accountId: session.accountId, keyName: session.keyName }
}

/** Panggilan B2 API standar (POST JSON) dengan token sesi, via proxy. */
const b2Call = async (api, body = {}) => {
  if (!session?.token) {
    const err = new Error('Belum login ke Backblaze B2.')
    err.code = 'NOT_LOGGED_IN'
    throw err
  }
  const res = await proxyFetch(`${session.apiUrl}/b2api/v2/${api}`, {
    method: 'POST',
    headers: { Authorization: session.token, 'Content-Type': 'application/json' },
    body,
  })
  if (res.status === 401) {
    // Token kadaluarsa → sesi dibuang; UI akan menampilkan gate login lagi.
    b2Logout()
    const err = new Error(res.json?.message || 'Sesi B2 berakhir. Login ulang.')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  if (res.status !== 200) {
    throw new Error(res.json?.message || `B2 API error ${res.status}.`)
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
 * (Progress XHR tidak tersedia lewat proxy — UI memakai indikator loading.)
 */
export const uploadFile = async (bucketId, file) => {
  const up = await b2Call('b2_get_upload_url', { bucketId })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const sha1Bytes = await crypto.subtle.digest('SHA-1', bytes)
  const sha1 = Array.from(new Uint8Array(sha1Bytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const res = await proxyFetch(up.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: up.authorizationToken,
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
