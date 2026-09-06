// =====================================================================
// driveApi.js — Klien Google Drive API v3 via token OAuth googleAuth.js
// =====================================================================
// Scope yang dipakai: drive.file (LIHAT googleAuth.js).
// Konsekuensi penting yang HARUS dipahami:
//   drive.file hanya memberi akses ke file yang DIBUAT atau DIBUKA lewat
//   aplikasi ini. File lama di Drive user TIDAK akan muncul di daftar.
//   Untuk membaca seluruh isi Drive dibutuhkan scope 'drive.readonly'
//   atau 'drive' yang berstatus RESTRICTED — Google mewajibkan security
//   assessment (CASA) tahunan berbiaya untuk keduanya.
//
// Dokumentasi lengkap: koleksi dokumentasi api/google api/drive-docs/
// =====================================================================

import { googleFetch, GOOGLE_SCOPES } from './googleAuth'

const BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

// Scope set tunggal yang dipakai halaman DAN semua fungsi di file ini,
// supaya user hanya melihat satu popup consent.
export const DRIVE_PAGE_SCOPES = [...GOOGLE_SCOPES.DRIVE, ...GOOGLE_SCOPES.PROFILE]

// Drive v3 mengembalikan field minim secara default — selalu minta eksplisit.
const FILE_FIELDS = [
  'id', 'name', 'mimeType', 'size', 'modifiedTime', 'createdTime',
  'iconLink', 'thumbnailLink', 'webViewLink', 'webContentLink',
  'parents', 'trashed', 'starred', 'shared', 'owners(displayName,emailAddress)',
].join(',')

const mapFile = (f) => ({
  id: f.id,
  name: f.name || '(tanpa nama)',
  mimeType: f.mimeType || '',
  isFolder: f.mimeType === 'application/vnd.google-apps.folder',
  size: Number(f.size || 0),
  modifiedTime: f.modifiedTime || '',
  createdTime: f.createdTime || '',
  iconLink: f.iconLink || '',
  thumbnailLink: f.thumbnailLink || '',
  webViewLink: f.webViewLink || '',
  webContentLink: f.webContentLink || '',
  parents: f.parents || [],
  trashed: Boolean(f.trashed),
  starred: Boolean(f.starred),
  shared: Boolean(f.shared),
  owner: f.owners?.[0]?.displayName || '',
})

// ---------- Kuota penyimpanan ----------

export const getStorageInfo = async () => {
  const data = await googleFetch(
    `${BASE}/about?fields=storageQuota,user(displayName,emailAddress,photoLink)`,
    { scopes: DRIVE_PAGE_SCOPES },
  )
  const q = data.storageQuota || {}
  return {
    limit: Number(q.limit || 0),
    usage: Number(q.usage || 0),
    usageInDrive: Number(q.usageInDrive || 0),
    usageInTrash: Number(q.usageInDriveTrash || 0),
    user: {
      name: data.user?.displayName || '',
      email: data.user?.emailAddress || '',
      picture: data.user?.photoLink || '',
    },
  }
}

// ---------- Daftar & cari file ----------

/**
 * Daftar file. `folderId` kosong = akar akses aplikasi.
 * `q` = kata kunci nama (dibungkus jadi `name contains '...'`).
 */
export const listFiles = async ({ folderId = '', q = '', pageToken = '', pageSize = 50, orderBy = 'folder,modifiedTime desc' } = {}) => {
  const clauses = ['trashed = false']
  if (folderId) clauses.push(`'${escapeQuery(folderId)}' in parents`)
  if (q) clauses.push(`name contains '${escapeQuery(q)}'`)
  const params = new URLSearchParams({
    q: clauses.join(' and '),
    pageSize: String(pageSize),
    orderBy,
    fields: `nextPageToken,files(${FILE_FIELDS})`,
    spaces: 'drive',
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/files?${params.toString()}`, { scopes: DRIVE_PAGE_SCOPES })
  return {
    files: (data.files || []).map(mapFile),
    nextPageToken: data.nextPageToken || '',
  }
}

// Tanda kutip tunggal dan backslash harus di-escape di parameter `q` Drive.
const escapeQuery = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

export const getFile = async (fileId) => {
  const data = await googleFetch(`${BASE}/files/${fileId}?fields=${encodeURIComponent(FILE_FIELDS)}`, {
    scopes: DRIVE_PAGE_SCOPES,
  })
  return mapFile(data)
}

// ---------- Folder ----------

export const createFolder = async (name, parentId = '') => {
  const data = await googleFetch(`${BASE}/files?fields=${encodeURIComponent(FILE_FIELDS)}`, {
    method: 'POST',
    scopes: DRIVE_PAGE_SCOPES,
    body: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
  })
  return mapFile(data)
}

// ---------- Unggah ----------

/**
 * Unggah file kecil–menengah dengan multipart (satu request).
 * Untuk file besar (> ~5 MB) pakai uploadResumable().
 */
export const uploadFile = async (file, { parentId = '', name = '' } = {}) => {
  const metadata = { name: name || file.name, ...(parentId ? { parents: [parentId] } : {}) }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)
  const data = await googleFetch(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=${encodeURIComponent(FILE_FIELDS)}`,
    { method: 'POST', scopes: DRIVE_PAGE_SCOPES, body: form },
  )
  return mapFile(data)
}

/**
 * Unggah resumable: minta session URL dulu, lalu kirim seluruh isi file.
 * onProgress(percent) dipanggil selama pengiriman.
 */
export const uploadResumable = async (file, { parentId = '', name = '', onProgress } = {}) => {
  const metadata = { name: name || file.name, ...(parentId ? { parents: [parentId] } : {}) }
  const initRes = await googleFetch(
    `${UPLOAD_BASE}/files?uploadType=resumable&fields=${encodeURIComponent(FILE_FIELDS)}`,
    {
      method: 'POST',
      scopes: DRIVE_PAGE_SCOPES,
      body: metadata,
      headers: { 'X-Upload-Content-Type': file.type || 'application/octet-stream' },
      raw: true,
    },
  )
  const sessionUrl = initRes.headers.get('Location')
  if (!sessionUrl) throw new Error('Drive tidak memberi URL sesi unggah.')

  // XHR dipakai (bukan fetch) karena hanya XHR punya event progress upload.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', sessionUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(mapFile(JSON.parse(xhr.responseText))) } catch { resolve(null) }
      } else {
        reject(new Error(`Unggah gagal (${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new Error('Unggah gagal: koneksi terputus.'))
    xhr.send(file)
  })
}

// ---------- Unduh ----------

/** Unduh isi file biner sebagai Blob (bukan Google Docs native). */
export const downloadFile = async (fileId) => {
  const res = await googleFetch(`${BASE}/files/${fileId}?alt=media`, {
    scopes: DRIVE_PAGE_SCOPES,
    raw: true,
  })
  return res.blob()
}

/** Ekspor Google Docs/Sheets/Slides ke format lain (mis. PDF). */
export const exportFile = async (fileId, mimeType = 'application/pdf') => {
  const res = await googleFetch(
    `${BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
    { scopes: DRIVE_PAGE_SCOPES, raw: true },
  )
  return res.blob()
}

// ---------- Ubah & hapus ----------

export const renameFile = async (fileId, name) => {
  const data = await googleFetch(`${BASE}/files/${fileId}?fields=${encodeURIComponent(FILE_FIELDS)}`, {
    method: 'PATCH',
    scopes: DRIVE_PAGE_SCOPES,
    body: { name },
  })
  return mapFile(data)
}

export const setStarred = async (fileId, starred) => {
  const data = await googleFetch(`${BASE}/files/${fileId}?fields=${encodeURIComponent(FILE_FIELDS)}`, {
    method: 'PATCH',
    scopes: DRIVE_PAGE_SCOPES,
    body: { starred },
  })
  return mapFile(data)
}

/** Pindahkan ke tempat sampah (bisa dipulihkan user dari Drive). */
export const trashFile = (fileId) =>
  googleFetch(`${BASE}/files/${fileId}`, {
    method: 'PATCH',
    scopes: DRIVE_PAGE_SCOPES,
    body: { trashed: true },
  })

/** Hapus permanen — TIDAK bisa dibatalkan. */
export const deleteFilePermanently = (fileId) =>
  googleFetch(`${BASE}/files/${fileId}`, { method: 'DELETE', scopes: DRIVE_PAGE_SCOPES })

// ---------- Berbagi ----------

/**
 * Bagikan file. type: 'user' | 'group' | 'domain' | 'anyone'.
 * role: 'reader' | 'commenter' | 'writer'.
 */
export const shareFile = (fileId, { type = 'user', role = 'reader', emailAddress = '', domain = '' } = {}) =>
  googleFetch(`${BASE}/files/${fileId}/permissions?fields=id,type,role`, {
    method: 'POST',
    scopes: DRIVE_PAGE_SCOPES,
    body: {
      type,
      role,
      ...(emailAddress ? { emailAddress } : {}),
      ...(domain ? { domain } : {}),
    },
  })

export const listPermissions = async (fileId) => {
  const data = await googleFetch(
    `${BASE}/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress,domain,displayName)`,
    { scopes: DRIVE_PAGE_SCOPES },
  )
  return data.permissions || []
}

export const removePermission = (fileId, permissionId) =>
  googleFetch(`${BASE}/files/${fileId}/permissions/${permissionId}`, {
    method: 'DELETE',
    scopes: DRIVE_PAGE_SCOPES,
  })

// ---------- Util tampilan ----------

export const formatBytes = (bytes) => {
  const n = Number(bytes || 0)
  if (n <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1)
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
