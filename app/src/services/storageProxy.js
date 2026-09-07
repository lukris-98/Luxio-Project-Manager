// =====================================================================
// storageProxy.js — Jembatan ke proxy API eksternal di backend Luxio
// (`POST /api/storage/proxy`).
// =====================================================================
// API Neon & Backblaze B2 tidak mengirim header CORS, sehingga browser
// tidak bisa memanggilnya langsung. Backend Luxio meneruskan request
// server-to-server dengan safeguard:
//   - wajib sesi login Luxio (Authorization: Bearer token),
//   - allowlist host (api.neon.tech, *.backblazeb2.com, dst.),
//   - rate limit per user.
// Body request/response dikirim dalam base64 agar mendukung biner (upload).
// =====================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'luxio-token'

function bytesToBase64(bytes) {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

function base64ToBytes(b64) {
  const bin = atob(b64 || '')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Kirim request melalui proxy storage.
 * @param {string} url        URL eksternal lengkap (https://api.neon.tech/…)
 * @param {object} options    { method, headers, body } — body: string | object | Uint8Array
 * @returns {Promise<{status:number, contentType:string, text:string, json:object|null, bytes:Uint8Array}>}
 */
export async function proxyFetch(url, { method = 'GET', headers = {}, body } = {}) {
  let bodyBase64
  if (body != null) {
    if (body instanceof Uint8Array) {
      bodyBase64 = bytesToBase64(body)
    } else {
      const str = typeof body === 'string' ? body : JSON.stringify(body)
      bodyBase64 = bytesToBase64(new TextEncoder().encode(str))
    }
  }

  const token = localStorage.getItem(TOKEN_KEY)
  let res
  try {
    res = await fetch(`${API_BASE}/api/storage/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ url, method, headers, ...(bodyBase64 ? { bodyBase64 } : {}) }),
    })
  } catch {
    throw new Error('Tidak bisa menghubungi server Luxio. Periksa koneksi internet.')
  }

  if (res.status === 401) {
    const err = new Error('Sesi berakhir. Login ulang ke Luxio.')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  if (res.status === 403) throw new Error('Domain ini tidak diizinkan melalui proxy Luxio.')
  if (res.status === 429) throw new Error('Terlalu banyak permintaan ke server. Tunggu sebentar, lalu coba lagi.')
  if (res.status === 502) throw new Error('Server Luxio gagal menghubungi layanan eksternal. Coba lagi.')
  if (!res.ok) throw new Error(`Server proxy error ${res.status}.`)

  const data = await res.json()
  const bytes = base64ToBytes(data.bodyBase64)
  const text = new TextDecoder().decode(bytes)
  let json = null
  try { json = JSON.parse(text) } catch { /* bukan JSON — biarkan null */ }
  return { status: data.status, contentType: data.contentType || '', text, json, bytes }
}
