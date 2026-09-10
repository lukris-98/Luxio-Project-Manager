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

// Host API v2 Neon = HANYA console.neon.tech (diuji end-to-end via proxy
// produksi: console → 200 + daftar project; api.neon.tech/v2 → 502/DNS mati
// dari kontainer HF, tetapi kadang "berhasil" untuk /users/me saja lalu
// /projects → 401/org-required, sehingga membuat daftar tampak kosong).
const BASES = ['https://console.neon.tech/api/v2']
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

// Neon v2 membungkus tiap item ({ projects:[{project:…}], branches:[{branch:…}],
// dst). Beberapa varian juga memakai { data:[…] }. Helper ini menormalkan
// semuanya; bentuk tak dikenal dicetak ke console (bukan disenyapkan → []
// tanpa jejak yang bikin panel tampak "kosong" padahal ada error).
const asList = (v, key, tag) => {
  let arr = null
  if (Array.isArray(v)) arr = v
  else if (v && Array.isArray(v.data)) arr = v.data
  if (!arr) {
    if (v !== undefined && v !== null) console.warn(`[neonApi] /${tag}: bentuk respons tak dikenal:`, v)
    return []
  }
  return arr.map((x) => (x && x[key]) || x)
}

// ---------- Akun ----------

export const getMe = () => neonFetch('/users/me').then((d) => (d && d.user) || d || null)

// ---------- API Keys ----------

export const listApiKeys = () =>
  neonFetch('/api_keys').then((d) => asList(d && d.keys, 'key', 'api_keys'))
export const createApiKey = (keyName) =>
  neonFetch('/api_keys', { method: 'POST', body: { key_name: keyName } })
export const revokeApiKey = (id) => neonFetch(`/api_keys/${id}`, { method: 'DELETE' })

/** Ambil org_id dari berbagai bentuk respons /orgs & /users/me. */
const extractOrgIds = (me, orgsRes) => {
  const ids = new Set()
  const lists = [orgsRes?.organizations, orgsRes?.orgs, orgsRes?.data, me?.organizations]
  for (const raw of lists) {
    const arr = Array.isArray(raw) ? raw : raw && Array.isArray(raw.data) ? raw.data : []
    for (const o of arr) {
      const x = (o && o.organization) || o
      if (x && typeof x.id === 'string') ids.add(x.id)
    }
  }
  if (me && typeof me.org_id === 'string') ids.add(me.org_id)
  if (me && typeof me.current_org_id === 'string') ids.add(me.current_org_id)
  return [...ids]
}

let cachedOrgIds = null

// Neon 2025: GET /projects butuh ?org_id= untuk akun ber-organisasi.
// Strategi: coba tanpa org dulu; bila error "org_id" → tarik daftar org
// (via /users/me + /orgs) lalu query per-org dan digabung.
const withOrg = (path, orgId) => `${path}${path.includes('?') ? '&' : '?'}org_id=${encodeURIComponent(orgId)}`

const orgAwareList = async (path, unwrapKey, tag) => {
  if (!cachedOrgIds) {
    try {
      const d = await neonFetch(path)
      cachedOrgIds = []
      return asList(d && d[tag], unwrapKey, tag)
    } catch (e) {
      if (!/org_id/i.test(e?.message || '')) throw e
      let orgsRes = null
      let me = null
      try { me = await getMe() } catch { /* opsional */ }
      try { orgsRes = await neonFetch('/users/me/organizations') } catch { /* host/shape lawas */ }
      cachedOrgIds = extractOrgIds(me, orgsRes)
      if (!cachedOrgIds.length) {
        throw new Error('Akun Neon ini terorganisasi tapi daftar org gagal diambil. Buat API key di level Organization (console.neon.tech → organization settings → API keys) agar org_id otomatis.')
      }
    }
  }
  if (!cachedOrgIds.length) return []
  const merged = []
  const seen = new Set()
  let firstErr = null
  for (const orgId of cachedOrgIds) {
    try {
      const d = await neonFetch(withOrg(path, orgId))
      for (const item of asList(d && d[tag], unwrapKey, tag)) {
        const id = item && (item.id || item[unwrapKey === 'branch' ? 'branch_id' : 'id'])
        if (id && seen.has(id)) continue
        if (id) seen.add(id)
        merged.push(item)
      }
    } catch (e) { firstErr = firstErr || e }
  }
  if (!merged.length && firstErr) throw firstErr
  return merged
}

// Pembuatan project juga wajib org_id pada akun ter-organisasi.
const ensureOrgIds = async () => {
  if (cachedOrgIds) return cachedOrgIds
  try {
    const me = await getMe()
    let orgsRes = null
    try { orgsRes = await neonFetch('/orgs') } catch { /* opsional */ }
    cachedOrgIds = extractOrgIds(me, orgsRes)
  } catch { cachedOrgIds = [] }
  return cachedOrgIds
}

const orgAwareCreate = async (path, name, pgVersion) => {
  const body = { project: { name, pg_version: pgVersion } }
  const ids = await ensureOrgIds()
  for (const orgId of ids) {
    try {
      const d = await neonFetch(`${path}?org_id=${encodeURIComponent(orgId)}`, { method: 'POST', body })
      return (d && d.project) || d
    } catch (e) {
      if (/org_id/i.test(e?.message || '')) continue
      if (/does not belong|already has|no such/i.test(e?.message || '')) continue
      throw e
    }
  }
  if (!ids.length) throw new Error('Akun Neon butuh organization id untuk membuat project — daftar org tidak dapat diambil.')
  const d = await neonFetch(path, { method: 'POST', body })
  return (d && d.project) || d
}

// ---------- Projects ----------

export const listProjects = () => orgAwareList('/projects?limit=100', 'project', 'projects')
export const getProject = (id) => neonFetch(`/projects/${id}`).then((d) => d.project || d || null)
export const createProject = (name, pgVersion = '17') =>
  orgAwareCreate('/projects', name, pgVersion)
export const deleteProject = (id) => neonFetch(`/projects/${id}`, { method: 'DELETE' })

// ---------- Branches ----------

export const listBranches = (projectId) =>
  neonFetch(`/projects/${projectId}/branches`).then((d) => asList(d && d.branches, 'branch', 'branches'))
export const createBranch = (projectId, name, parentId) =>
  neonFetch(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: { branch: { ...(name ? { name } : {}), ...(parentId ? { parent_id: parentId } : {}) } },
  }).then((d) => d.branch)
export const deleteBranch = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}`, { method: 'DELETE' })

// ---------- Endpoints ----------

export const listEndpoints = (projectId) =>
  neonFetch(`/projects/${projectId}/endpoints`).then((d) => asList(d && d.endpoints, 'endpoint', 'endpoints'))
export const startEndpoint = (projectId, endpointId) =>
  neonFetch(`/projects/${projectId}/endpoints/${endpointId}/start`, { method: 'POST' })
export const suspendEndpoint = (projectId, endpointId) =>
  neonFetch(`/projects/${projectId}/endpoints/${endpointId}/suspend`, { method: 'POST' })

// ---------- Databases (per branch) ----------

export const listDatabases = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases`).then((d) => asList(d && d.databases, 'database', 'databases'))
export const createDatabase = (projectId, branchId, name, ownerName) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases`, {
    method: 'POST',
    body: { database: { name, owner_name: ownerName } },
  }).then((d) => d.database)
export const deleteDatabase = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/databases/${name}`, { method: 'DELETE' })

// ---------- Roles (per branch) ----------

export const listRoles = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles`).then((d) => asList(d && d.roles, 'role', 'roles'))
export const createRole = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles`, {
    method: 'POST',
    body: { role: { name } },
  }).then((d) => d.role)
export const deleteRole = (projectId, branchId, name) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/roles/${name}`, { method: 'DELETE' })

// ---------- Snapshots (per branch) ----------

export const listSnapshots = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/snapshots`).then((d) => asList(d && d.snapshots, 'snapshot', 'snapshots'))
export const createSnapshot = (projectId, branchId) =>
  neonFetch(`/projects/${projectId}/branches/${branchId}/snapshots`, { method: 'POST' })

// ---------- Operations & konsumsi ----------

export const listOperations = (projectId, limit = 20) =>
  neonFetch(`/projects/${projectId}/operations?limit=${limit}`).then((d) => asList(d && d.operations, 'operation', 'operations'))
export const getProjectConsumption = (projectId) =>
  neonFetch(`/projects/${projectId}/consumption`)

// ---------- Organization Storage Consumption ----------

/**
 * Fetch organization-level storage consumption history.
 * Requires Organization API Key with org-level permissions.
 * @param {string} orgId - Organization ID (e.g., "org-curly-bonus-71722205")
 * @param {string} from - Start date in ISO format (YYYY-MM-DD)
 * @param {string} to - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise<Object>} Storage consumption data with periods array
 */
export const getOrganizationStorageConsumption = async (orgId, from, to) => {
  if (!orgId) {
    throw new Error('Organization ID diperlukan untuk mengambil data storage')
  }
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const query = params.toString() ? `?${params.toString()}` : ''
  return neonFetch(`/organizations/${orgId}/consumption_history/storage${query}`)
}

/**
 * Get list of organizations for the current user.
 * @returns {Promise<Array>} List of organizations
 */
export const listOrganizations = async () => {
  try {
    const d = await neonFetch('/users/me/organizations')
    return asList(d?.organizations || d?.orgs || d?.data, 'organization', 'organizations')
  } catch (e) {
    console.warn('[neonApi] Failed to fetch organizations:', e.message)
    return []
  }
}
