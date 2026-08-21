// =====================================================================
// api.js — Klien API terpusat untuk seluruh frontend.
// =====================================================================
// Semua pemanggilan ke backend Rust (Axum) lewat file ini, supaya URL
// dan penanganan error terpusat di satu tempat. Komponen lain cukup
// memanggil `api.*` dan tidak perlu tahu detail fetch.
//
// Base URL diambil dari env `VITE_API_URL` (file `.env` di root app),
// fallback ke `http://localhost:3000` (port default backend).
// =====================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Helper untuk request HTTP POST dengan body JSON.
 * @param {string} path   - path endpoint, contoh '/api/auth/login'
 * @param {object} body   - payload yang dikirim sebagai JSON
 * @returns {Promise<object>} response JSON dari server
 */
async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || res.statusText)
    err.status = res.status
    throw err
  }
  return res.json()
}

/**
 * Helper untuk request HTTP GET.
 * @param {string} path   - path endpoint, contoh '/api/projects'
 * @param {object} params - query string, contoh { company_id: 'x' } -> ?company_id=x
 * @returns {Promise<object|Array>} response JSON dari server
 */
async function get(path, params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * Helper untuk request HTTP PUT dengan body JSON.
 */
async function put(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || res.statusText)
    err.status = res.status
    throw err
  }
  return res.json()
}

/**
 * Helper untuk request HTTP DELETE dengan body JSON.
 */
async function del(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(text || res.statusText)
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

// Daftar semua endpoint yang tersedia. Tambahkan endpoint baru di sini
// agar konsisten dan mudah di-trace dari satu tempat.
export const api = {
  // ---- Auth ----
  register: (name, email, password) =>
    post('/api/auth/register', { name, email, password }),
  login: (email, password) =>
    post('/api/auth/login', { email, password }),

  // ---- Companies ----
  createCompany: (data) => post('/api/companies', data),
  getCompanies: (userId) => get('/api/companies', { user_id: userId }),

  // ---- Divisions ----
  createDivision: (data) => post('/api/divisions', data),
  getDivisions: (companyId) => get('/api/divisions', { company_id: companyId }),

  // ---- Members ----
  createMember: (data) => post('/api/members', data),
  getMembers: (companyId) => get('/api/members', { company_id: companyId }),

  // ---- Projects ----
  getProjects: (companyId) => get('/api/projects', { company_id: companyId }),

  // ---- Admin (khusus OWNER) ----
  // List semua akun di sistem. actor_id = id user OWNER yang memanggil.
  getAdminUsers: (actorId) => get('/api/admin/users', { actor_id: actorId }),
  createAdminUser: (data) => post('/api/admin/users', data),
  updateAdminUser: (data) => put('/api/admin/users', data),
  deleteAdminUser: (data) => del('/api/admin/users', data),
}
