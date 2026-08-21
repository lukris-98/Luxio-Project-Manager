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

const TOKEN_KEY = 'luxio-token'

/**
 * Ambil session token dari localStorage.
 * Token dikirim pada header `Authorization: Bearer <token>` untuk setiap
 * request ke backend. Backend memakai token ini untuk menentukan identitas
 * user (bukan lagi user_id di body/query yang bisa dipalsukan).
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

/**
 * Helper untuk request HTTP POST dengan body JSON.
 * @param {string} path   - path endpoint, contoh '/api/auth/login'
 * @param {object} body   - payload yang dikirim sebagai JSON
 * @returns {Promise<object>} response JSON dari server
 */
async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
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
    headers: authHeaders(),
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
    headers: authHeaders(),
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
    headers: authHeaders(),
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
  // Aktivasi akun memakai token dari email konfirmasi.
  verifyEmail: (token) =>
    post('/api/auth/verify', { token }),
  // Verifikasi kode 2FA setelah login tahap 1.
  verify2FA: (email, code) =>
    post('/api/auth/2fa/verify', { email, code }),
  logout: () =>
    post('/api/auth/logout', {}),
  me: () =>
    get('/api/auth/me'),

  // ---- Companies ----
  createCompany: (data) => post('/api/companies', data),
  getCompanies: (userId) => get('/api/companies', { user_id: userId }),

  // ---- Divisions ----
  createDivision: (data) => post('/api/divisions', data),
  getDivisions: (companyId) => get('/api/divisions', { company_id: companyId }),

  // ---- Members ----
  createMember: (data) => post('/api/members', data),
  getMembers: (companyId) => get('/api/members', { company_id: companyId }),
  // Daftarkan anggota baru + buat akun login (email/password) + kirim email sambutan.
  registerMember: (data) => post('/api/members/register', data),
  // Kirim email notifikasi ke anggota (admin/super admin).
  notifyMember: (data) => post('/api/members/notify', data),

  // ---- Projects ----
  getProjects: (companyId) => get('/api/projects', { company_id: companyId }),

  // ---- Tools / AI Agent actions ----
  // Daftar tool + schema yang tersedia (kontrak agent).
  listTools: () => get('/api/tools'),
  // Jalankan satu tool. actorType: 'user' | 'ai_agent'.
  executeTool: ({ tool, args, confirm = false, idempotencyKey, actorType = 'user' }) =>
    post('/api/tools/execute', {
      tool,
      args,
      confirm,
      ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      actor_type: actorType,
    }),

  // ---- Admin (khusus OWNER) ----
  // List semua akun di sistem. actor_id = id user OWNER yang memanggil.
  getAdminUsers: (actorId) => get('/api/admin/users', { actor_id: actorId }),
  createAdminUser: (data) => post('/api/admin/users', data),
  updateAdminUser: (data) => put('/api/admin/users', data),
  deleteAdminUser: (data) => del('/api/admin/users', data),
}
