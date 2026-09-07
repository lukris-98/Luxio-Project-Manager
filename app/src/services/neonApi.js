// =====================================================================
// neonApi.js — Klien Neon Platform API v2 (api.neon.tech) dari browser.
// =====================================================================
// Login memakai API KEY akun Neon (dibuat di console.neon.tech → API Keys).
// Mendukung operasi utama sesuai dokumentasi (koleksi dokumentasi api/
// neon-docs/reference-api):
//   - Akun    : GET /users/me
//   - API key : list / create / revoke
//   - Project : list / create / get / delete
//   - Branch  : list / create / delete
//   - Endpoint: list / start / suspend / delete
//   - Database: list / create / delete (per branch)
//   - Role    : list / create / delete (per branch)
//   - Snapshot: list / create / delete (per branch)
//   - Operasi : list (riwayat operations per project)
//   - Konsumsi: consumption per project
// =====================================================================

import { proxyFetch } from './storageProxy'

const BASE = 'https://api.neon.tech/v2'
const KEY_STORE = 'luxio_neon_api_key'

// API key aplikasi Luxio (milik pemilik akun Neon) — dipakai untuk
// autologin halaman Penyimpanan tanpa mengisi form.
export const NEON_APP_KEY = 'napi_q3q6h3cavnjrd20tdbw1vpggbuaflc2654jsr21xfl1pkwudc4l4hw8t3q2s12id'

/** Pastikan ada API key aktif (autologin dengan key aplikasi). */
export const ensureNeonAppSession = () => {
  if (!apiKey) setNeonKey(NEON_APP_KEY)
  return isNeonLoggedIn()
}

let apiKey = (() => {
  try { return localStorage.getItem(KEY_STORE) || '' } catch { return '' }
})()

export const getNeonKey = () => apiKey
export const setNeonKey = (key) => {
  apiKey = (key || '').trim()
  try { apiKey ? localStorage.setItem(KEY_STORE, apiKey) : localStorage.removeItem(KEY_STORE) } catch { /* abaikan */ }
}
export const isNeonLoggedIn = () => Boolean(apiKey)

/** Fetch generik dengan Bearer API key + pesan error yang ramah. */
export const neonFetch = async (path, { method = 'GET', body } = {}) => {
  if (!apiKey) {
    const err = new Error('Belum login ke Neon. Masukkan API key dulu.')
    err.code = 'NOT_LOGGED_IN'
    throw err
  }
  // Lewat proxy Luxio (api.neon.tech tidak mengirim header CORS untuk
  // origin aplikasi, jadi browser tidak bisa memanggil langsung).
  const res = await proxyFetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body } : {}),
  })
  if (res.status === 401) {
    const err = new Error('API key Neon tidak valid atau sudah dicabut. Login ulang.')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  if (res.status >= 400) {
    throw new Error(res.json?.message || res.json?.error?.message || `Neon API error ${res.status}`)
  }
  return res.json
}

// ---------- Akun ----------

export const getMe = () => neonFetch('/users/me')

// ---------- API Keys ----------

export const listApiKeys = () => neonFetch('/api_keys').then((d) => d.keys || [])
export const createApiKey = (keyName) =>
  neonFetch('/api_keys', { method: 'POST', body: { key_name: keyName } })
export const revokeApiKey = (id) => neonFetch(`/api_keys/${id}`, { method: 'DELETE' })

// ---------- Projects ----------

export const listProjects = () => neonFetch('/projects?limit=100').then((d) => d.projects || [])
export const getProject = (id) => neonFetch(`/projects/${id}`).then((d) => d.project)
export const createProject = (name, pgVersion = '17') =>
  neonFetch('/projects', { method: 'POST', body: { project: { name, pg_version: pgVersion } } })
    .then((d) => d.project)
export const deleteProject = (id) => neonFetch(`/projects/${id}`, { method: 'DELETE' })

// ---------- Branches ----------

export const listBranches = (projectId) =>
  neonFetch(`/projects/${projectId}/branches`).then((d) => d.branches || [])
export const createBranch = (projectId, name, parentId) =>
  neonFetch(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: { branch: { ...(name ? { name } : {}), ...(parentId ? { parent_id: parentId } : {}) } },
  }).then((d) => d.branch)
export const deleteBranch = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}`, { method: 'DELETE' })

// ---------- Endpoints ----------

export const listEndpoints = (projectId) =>
  neonFetch(`/projects/${projectId}/endpoints`).then((d) => d.endpoints || [])
export const startEndpoint = (projectId, endpointId) =>
  neonFetch(`/projects/${projectId}/endpoints/${endpointId}/start`, { method: 'POST' })
export const suspendEndpoint = (projectId, endpointId) =>
  neonFetch(`/projects/${projectId}/endpoints/${endpointId}/suspend`, { method: 'POST' })

// ---------- Databases (per branch) ----------

export const listDatabases = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases`).then((d) => d.databases || [])
export const createDatabase = (projectId, branchId, name, ownerName) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases`, {
    method: 'POST',
    body: { database: { name, owner_name: ownerName } },
  }).then((d) => d.database)
export const deleteDatabase = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases/${name}`, { method: 'DELETE' })

// ---------- Roles (per branch) ----------

export const listRoles = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles`).then((d) => d.roles || [])
export const createRole = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles`, {
    method: 'POST',
    body: { role: { name } },
  }).then((d) => d.role)
export const deleteRole = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles/${name}`, { method: 'DELETE' })

// ---------- Snapshots (per branch) ----------

export const listSnapshots = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/snapshots`).then((d) => d.snapshots || [])
export const createSnapshot = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/snapshots`, { method: 'POST' })

// ---------- Operations & konsumsi ----------

export const listOperations = (projectId, limit = 20) =>
  neonFetch(`/projects/${projectId}/operations?limit=${limit}`).then((d) => d.operations || [])
export const getProjectConsumption = (projectId) =>
  neonFetch(`/projects/${projectId}/consumption`)
