// =====================================================================
// neonApi.js — Klien Neon Platform API v2 (api.neon.tech) dari browser,
// VIA PROXY Luxio (`POST /api/storage/proxy` di backend).
// =====================================================================
// KEAMANAN: API key TIDAK PERNAH ada di frontend. Browser memakai
// placeholder "APP_NEON" pada header Authorization; proxy backend
// menggantinya dengan API key asli yang tersimpan di environment server.
//
// Operasi utama (dokumentasi Neon API v2):
//   - Akun    : GET /users/me
//   - API key : list / create / revoke
//   - Project : list / create / get / delete
//   - Branch  : list / create / delete
//   - Endpoint: list / start / suspend
//   - Database: list / create / delete (per branch)
//   - Role    : list / create / delete (per branch)
//   - Snapshot: list / create (per branch)
//   - Operasi : list (riwayat operations per project)
//   - Konsumsi: consumption per project
// =====================================================================

import { proxyFetch } from './storageProxy'

// Neon memakai beberapa host API; api.neon.tech kadang bermasalah DNS,
// console.neon.tech menyajikan API yang sama (/api/v2). Coba berurutan.
const BASES = ['https://console.neon.tech/api/v2', 'https://api.neon.tech/v2']
let activeBase = null

// Marker: dipakai bersama b2Api untuk status autologin di UI.
export const NEON_APP_KEY = 'APP_NEON'
export const ensureNeonAppSession = () => true

export const isNeonLoggedIn = () => true
export const getNeonKey = () => 'APP_NEON'
export const setNeonKey = () => {}

/** Fetch generik — kredensial diisi server-side oleh proxy. */
export const neonFetch = async (path, { method = 'GET', body } = {}) => {
  const ordered = activeBase ? [activeBase, ...BASES.filter((b) => b !== activeBase)] : [...BASES]
  let lastErr = null
  for (const base of ordered) {
    let res
    try {
      res = await proxyFetch(`${base}${path}`, {
        method,
        headers: {
          Authorization: 'Bearer APP_NEON',
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body } : {}),
      })
    } catch (e) {
      // Proxy gagal menghubungi host ini (DNS/502) → coba base berikutnya.
      lastErr = e
      continue
    }
    activeBase = base
    if (res.status === 401) {
      const err = new Error('Akses storage tidak valid atau sudah dicabut.')
      err.code = 'UNAUTHORIZED'
      throw err
    }
    if (res.status === 503) {
      throw new Error('Server storage belum siap. Muat ulang halaman nanti.')
    }
    if (res.status >= 400) {
      throw new Error(res.json?.message || res.json?.error?.message || `API error ${res.status}`)
    }
    return res.json
  }
  throw lastErr || new Error('Semua endpoint Neon tidak dapat dihubungi.')
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
  neonFetch(`/projects/${projectId}/endpoints`).then((d) => d.endpoints || []).then((d) => d.endpoints || [])
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
