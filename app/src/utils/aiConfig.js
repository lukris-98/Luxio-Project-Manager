// =====================================================================
// aiConfig.js — Konfigurasi AI bersama untuk halaman Agent & Metadata Creator.
// =====================================================================
// Kedua halaman menggunakan penyimpanan dan pemanggilan model yang sama
// sehingga pengaturan di satu halaman otomatis tersedia di halaman lain.
// =====================================================================

const AI_CONFIG_KEY = 'luxio-ai-config'
const LEGACY_AI_CONFIG_KEY = 'luxio-metadata-ai-config'

export const DEFAULT_AI_CONFIG = {
  api_type: 'openai-compatible',
  base_url: '',
  api_key: '',
  model: '',
}

export function loadAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (raw) return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) }
  } catch {}
  // Migrasi satu kali dari kunci lama (Metadata Creator sebelumnya).
  try {
    const raw = localStorage.getItem(LEGACY_AI_CONFIG_KEY)
    if (raw) {
      const cfg = { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) }
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
      localStorage.removeItem(LEGACY_AI_CONFIG_KEY)
      return cfg
    }
  } catch {}
  return null
}

export function saveAiConfig(cfg) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
  } catch {}
}

export const normalizeBaseUrl = (url) =>
  (url || '').trim().replace(/\/+$/, '').replace(/\/models$/, '')

export function modelKeyFor(cfg) {
  return `${cfg.api_type}|${normalizeBaseUrl(cfg.base_url)}`
}

// Fetch dengan timeout agar request tidak menggantung selamanya.
export async function fetchWithTimeout(url, opts = {}, ms = 60000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`Waktu respons AI habis (${ms / 1000} detik). Periksa koneksi / model.`)
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Ambil daftar model LANGSUNG dari browser ke {base_url}/models.
// Mendukung OpenAI / B.AI / Anthropic. Fallback ke backend bila gagal.
export async function fetchModelsDirect(cfg) {
  const base = normalizeBaseUrl(cfg.base_url)
  const url = `${base}/models`
  const headers = { 'Content-Type': 'application/json' }
  if (cfg.api_type === 'anthropic-messages') {
    headers['x-api-key'] = (cfg.api_key || '').trim()
    headers['anthropic-version'] = '2023-06-01'
  } else {
    headers['Authorization'] = `Bearer ${(cfg.api_key || '').trim()}`
  }
  const res = await fetchWithTimeout(url, { method: 'GET', headers }, 20000)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  let list = []
  if (Array.isArray(body.data)) {
    list = body.data.map((m) => (m && (m.id || m.model)) || null).filter(Boolean)
  } else if (Array.isArray(body)) {
    list = body.map((m) => (m && (m.id || m.name)) || null).filter(Boolean)
  } else if (body.models && Array.isArray(body.models)) {
    list = body.models.map((m) => (typeof m === 'string' ? m : (m && m.id) || null)).filter(Boolean)
  }
  return list.map(String)
}

// Kirim chat ke model AI (openai-compatible / openai-responses / anthropic-messages).
export async function callAIChat(cfg, messages) {
  const base = normalizeBaseUrl(cfg.base_url)
  const model = cfg.model.trim()
  const key = cfg.api_key.trim()
  if (!base || !key || !model) throw new Error('Konfigurasi AI belum lengkap.')

  let response
  if (cfg.api_type === 'anthropic-messages') {
    const res = await fetchWithTimeout(`${base}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 2000, messages }),
    })
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    response = data.content?.[0]?.text || data.content?.[0]?.content || ''
  } else if (cfg.api_type === 'openai-responses') {
    const res = await fetchWithTimeout(`${base}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        instructions: 'You are a helpful AI assistant.',
        input: messages.map((m) => m.role === 'user' ? m.content : { type: 'message', role: m.role, content: [{ type: 'input_text', text: m.content }] }),
      }),
    })
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    response = data.output_text || data.output?.[0]?.content?.[0]?.text || JSON.stringify(data)
  } else {
    const res = await fetchWithTimeout(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0.7, messages }),
    })
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    response = data.choices?.[0]?.message?.content || ''
  }
  return String(response || '').trim()
}