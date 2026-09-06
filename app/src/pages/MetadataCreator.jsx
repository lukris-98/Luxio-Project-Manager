import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import {
  loadAiConfig, saveAiConfig, DEFAULT_AI_CONFIG, normalizeBaseUrl, fetchModelsDirect, modelKeyFor, fetchWithTimeout,
} from '../utils/aiConfig'
import {
  LayoutDashboard, ImagePlus, History, UploadCloud, X, Sparkles,
  Loader, Check, Copy, Trash2, Settings, Bot, Download, Search,
  Clock, Tags, FileText, FolderOpen, Cpu, Plus, RefreshCw,
  ChevronRight, Eye, AlertTriangle, Package, Image as ImageIcon, Layers, SlidersHorizontal, BarChart3, ShieldCheck,
} from 'lucide-react'
import './MetadataCreator.css'

// =====================================================================
// MetadataCreator.jsx — Pembuat metadata untuk Adobe Stock Contributor.
// =====================================================================
// - 3 tab: Dashboard (statistik), Creator (upload + generate metadata AI),
//   Riwayat (daftar gambar yang sudah dibuat metadatanya, filter waktu & A-Z).
// - Upload gambar: lewat tombol (banyak sekaligus) ATAU tempel Ctrl+V pada
//   kotak teks (dari clipboard / file manager).
// - Memakai konfigurasi model AI yang sama dengan halaman AI Agent
//   (provider AI). Input konfigurasi tersedia di sini dan bisa dijalankan
//   langsung dari halaman ini.
// - Riwayat disimpan lokal (localStorage) sehingga bertahan saat refresh.
// =====================================================================

const METADATA_STORAGE_KEY = 'luxio-metadata-history'

// Kategori resmi Adobe Stock Contributor (dropdown "Category" di portal).
// Sumber: https://helpx.adobe.com/stock/contributor/content-policies-guidelines/metadata/choose-right-category-content.html
const ADOBE_CATEGORIES = [
  'Animals', 'Buildings and architecture', 'Business', 'Drinks', 'The environment',
  'States of mind', 'Food', 'Graphic resources', 'Hobbies and leisure', 'Industry',
  'Landscape', 'Lifestyle', 'People', 'Plants and flowers', 'Culture and religion',
  'Science', 'Social issues', 'Sports', 'Technology', 'Transport', 'Travel',
]

// Tipe konten Adobe Stock — harus sesuai karakter visual. Foto AI-art/abstrak
// umumnya "Illustrations", bukan "Photos".
// Sumber: https://helpx.adobe.com/stock/contributor/submit-your-content/submit-generative-ai-content/generative-ai-content-guidelines.html
const ADOBE_CONTENT_TYPES = ['Photos', 'Illustrations']

// Nomor kategori untuk kolom "Category" pada CSV upload Adobe Stock
// (angka yang tampil di dialog upload-CSV Contributor Portal).
// Urutan sama dengan daftar kategori resmi: index array + 1.
const ADOBE_CATEGORY_NUMBERS = Object.fromEntries(ADOBE_CATEGORIES.map((c, i) => [c, i + 1]))

// Kata ciri khas "prompt AI" yang memicu penolakan / terlihat spam keyword.
const PROMPT_STYLE_WORDS = [
  'render', 'high resolution', '8k', '4k', 'hq', 'masterpiece', 'octane',
  'artstation', 'behance', 'unreal engine', 'cinematic lighting', 'concept art',
  'digital art', 'ai generated', 'generated', 'hyper realistic', 'ultra realistic',
  'trending', 'style of', 'in the style', 'volumetric', 'pristine', 'ethereal',
  'translucent', 'modern art concept', 'high detail', 'sharp focus', 'wallpaper',
  'best quality', 'award winning',
]

// Aturan resmi yang dipakai untuk validasi kepatuhan hasil metadata.
const ADOBE_RULES = {
  titleMaxIdeal: 70,
  titleMaxHard: 100,
  keywordMax: 49,
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'creator', label: 'Creator', icon: ImagePlus },
  { id: 'history', label: 'Riwayat', icon: History },
]

const TIME_FILTERS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'today', label: 'Hari Ini' },
  { value: '7d', label: '7 Hari Terakhir' },
  { value: '30d', label: '30 Hari Terakhir' },
  { value: 'year', label: 'Tahun Ini' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
]

// =====================================================================
// Helper penyimpanan riwayat (localStorage).
// =====================================================================
function loadHistory() {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* penyimpanan penuh — abaikan */
  }
}

// =====================================================================
// Panggil AI provider untuk menghasilkan metadata (langsung dari browser).
// =====================================================================
async function callAIGenerate(cfg, { filename, subject }, existing = {}) {
  if (!cfg || !cfg.base_url.trim() || !cfg.api_key.trim() || !cfg.model.trim()) {
    throw new Error('Konfigurasi AI belum lengkap (Base URL, API Key, Model).')
  }

  const base = normalizeBaseUrl(cfg.base_url)
  const systemPrompt = `You are an expert Adobe Stock Contributor metadata writer. Adobe's moderators refuse content with bad, prompt-style, or keyword-stuffed metadata. Follow Adobe's official rules EXACTLY.

TITLE (biggest cause of refusals):
- Write ONE short, plain, human-readable sentence a photographer would write — describe what is visually in the image.
- STRICTLY under 70 characters.
- NEVER output a long comma/period-separated chain of adjectives ("Pristine ..., soft ..., minimalist ..., modern art concept ..."). That is AI-prompt style and gets refused.
- NEVER mention software, "AI", "render", "digital art", "high resolution", "concept", "style", or any artist name, real/fictional person, brand, or copyright.
- Focus on the main subject and what a customer would type to find it.

DESCRIPTION:
- 1-2 plain sentences (supporting detail: scene, light, mood, possible use). Do not repeat the title verbatim.

CATEGORY:
- Pick exactly ONE from: ${ADOBE_CATEGORIES.join(', ')}. Match the content theme.

CONTENT TYPE:
- Pick exactly ONE of: ${ADOBE_CONTENT_TYPES.join(', ')}. "Photos" = looks shot by a camera with realistic real-world subjects. "Illustrations" = artistic/abstract/fantasy/3D-style work (most AI abstract waves, gradients and textures belong here).

KEYWORDS (exactly ${existing.keywordCount || 40} relevant keywords):
- Nouns, adjectives and concepts ONLY; think like a customer searching Adobe Stock.
- Order by importance: the FIRST 10 keywords matter most for search ranking — main subject first, then specifics, then concepts/setting/viewpoint.
- Use each keyword ONCE — no duplicates, no near-duplicates.
- Mix broad and specific terms; may include setting (indoor/outdoor/day/night/studio), viewpoint, colors, number of people, demographics if relevant.
- NO brand/trademark names, NO artist or person names, NO fictional character names, NO "AI", NO software names, NO "stock photo"/"royalty free". One language only (English).
- If the image is a generic abstract wave/gradient/background texture, remember Adobe Stock is saturated with very similar content and refuses "similar content" submissions — so write keywords that highlight anything that makes THIS image distinguishable (specific color palette, shape, lighting, composition, potential use as a background/backdrop for presentations, web design, etc.).

DIVERSITY ACROSS A BATCH:
- Your title and keywords must be noticeably different from these ALREADY-USED titles in the current batch: ${(existing.titles || []).join(' | ') || 'none'}.
- Do not repeat those titles or their keyword phrases.

Respond with ONLY valid JSON (no markdown fences, no extra text) in exactly this shape:
{"title":"...","description":"...","category":"...","contentType":"Photos or Illustrations","keywords":["k1","k2",...]}`

  const userPrompt = `IMAGE INFO:
- Filename: ${filename}
- Subject / what the user sees in the image: ${subject && subject.trim() ? subject.trim() : 'not provided'}

Write Adobe Stock compliant metadata JSON for THIS image only.`

  let response
  if (cfg.api_type === 'anthropic-messages') {
    const res = await fetchWithTimeout(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.api_key.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: cfg.model.trim(),
        max_tokens: 1800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    }, 120000)
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const text = data.content?.[0]?.text || data.content?.[0]?.content || ''
    response = text
  } else if (cfg.api_type === 'openai-responses') {
    const res = await fetchWithTimeout(`${base}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.api_key.trim()}`,
      },
      body: JSON.stringify({
        model: cfg.model.trim(),
        instructions: systemPrompt,
        input: userPrompt,
      }),
    }, 120000)
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    response = data.output_text || data.output?.[0]?.content?.[0]?.text || JSON.stringify(data)
  } else {
    const res = await fetchWithTimeout(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.api_key.trim()}`,
      },
      body: JSON.stringify({
        model: cfg.model.trim(),
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    }, 120000)
    if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    response = data.choices?.[0]?.message?.content || ''
  }

  return parseAIResult(response)
}

function parseAIResult(text) {
  if (!text) throw new Error('Respons AI kosong.')
  let cleaned = String(text).trim()
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.slice(start, end + 1)
  }
  let obj
  try {
    obj = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Respons AI tidak valid (bukan JSON).')
    obj = JSON.parse(match[0])
  }
  const keywords = Array.isArray(obj.keywords)
    ? obj.keywords
      .map((k) => String(k).trim())
      .filter(Boolean)
      .slice(0, ADOBE_RULES.keywordMax)
    : String(obj.keywords || '').split(',').map((k) => k.trim()).filter(Boolean).slice(0, ADOBE_RULES.keywordMax)
  const contentType = ADOBE_CONTENT_TYPES.includes(String(obj.contentType || '').trim())
    ? String(obj.contentType).trim()
    : String(obj.content_type || '').trim()
      ? (ADOBE_CONTENT_TYPES.includes(String(obj.content_type).trim()) ? String(obj.content_type).trim() : '')
      : ''
  return {
    title: String(obj.title || '').trim() || 'Untitled',
    description: String(obj.description || '').trim(),
    category: String(obj.category || '').trim() || 'Graphic resources',
    contentType,
    keywords: [...new Set(keywords)],
  }
}

// =====================================================================
// Validasi kepatuhan aturan Adobe Stock untuk sebuah hasil metadata.
// Mengembalikan { errors: [], warnings: [] }.
// =====================================================================
function validateAdobe(result) {
  const errors = []
  const warnings = []
  if (!result) return { errors, warnings }
  const title = (result.title || '').trim()
  const lowerTitle = title.toLowerCase()
  const joined = [title, result.description || '', ...(result.keywords || [])].join(' ').toLowerCase()

  if (!title) errors.push('Judul kosong.')
  else if (title.length > ADOBE_RULES.titleMaxHard) {
    errors.push(`Judul ${title.length} karakter — terlalu panjang (maks ${ADOBE_RULES.titleMaxHard}).`)
  } else if (title.length > ADOBE_RULES.titleMaxIdeal) {
    warnings.push(`Judul ${title.length} karakter — idealnya di bawah ${ADOBE_RULES.titleMaxIdeal}.`)
  }

  if (!result.contentType) {
    warnings.push('Pilih tipe konten (Photos untuk fotorealistis, Illustrations untuk seni/abstrak/AI-art).')
  }

  const dupes = (result.keywords || []).filter((k, i, arr) => arr.indexOf(k) !== i)
  if (dupes.length > 0) warnings.push(`Keyword ganda ditemukan: ${dupes.join(', ')}.`)

  if ((result.keywords || []).length === 0) errors.push('Belum ada keyword/label.')
  else if ((result.keywords || []).length < 30) warnings.push(`Hanya ${result.keywords.length} keyword — disarankan mendekati 40 agar mudah ditemukan.`)
  else if ((result.keywords || []).length > ADOBE_RULES.keywordMax) errors.push(`Keyword melebihi ${ADOBE_RULES.keywordMax} (maks Adobe).`)

  const flagged = PROMPT_STYLE_WORDS.filter((w) => joined.includes(w))
  if (flagged.length > 0) {
    warnings.push(`Gaya "prompt AI" terdeteksi (${flagged.join(', ')}) — ganti dengan bahasa manusia biasa agar tidak ditolak.`)
  }
  if (/\bai\b|openai|midjourney|dall|stable diffusion|firefly/i.test(joined)) {
    errors.push('Menyebut AI/software tidak boleh ada di judul maupun keyword.')
  }
  if (/\b(copyright|trademark|©|™|®)\b/.test(joined)) {
    errors.push('Ada simbol/merek dagang — hapus dari metadata.')
  }
  return { errors, warnings }
}

// =====================================================================
// Helpers kecil
// =====================================================================
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const formatBytes = (b) => {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const fmtDate = (ts) =>
  new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

const buildAdobeCSV = (items) => {
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
  const cleanTitle = (t) => (t || '').replace(/,/g, ' ').replace(/\n/g, ' ').trim()
  const header = ['Filename', 'Title', 'Keywords', 'Category', 'Releases']
  const rows = items.map((it) => [
    esc(it.filename),
    esc(cleanTitle(it.title)),
    esc((it.keywords || []).join(', ')),
    String(ADOBE_CATEGORY_NUMBERS[it.category] || ''),
    esc(it.releases || ''),
  ])
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

const ADOBE_KEYWORDS_CSV = (item) => (item.keywords || []).map((k) => `"${String(k).replace(/"/g, '""')}"`).join(',')

// =====================================================================
// Page
// =====================================================================
export default function MetadataCreator() {
  const [activeTab, setActiveTab] = useState('creator')

  // ---- AI config ----
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG)
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const [providers, setProviders] = useState([])
  const [activeProvider, setActiveProvider] = useState(null)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [aiModels, setAiModels] = useState([])
  const [aiMsg, setAiMsg] = useState('')
  const [aiErr, setAiErr] = useState('')

  // ---- Upload & generate ----
  const [images, setImages] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [targetKeywords, setTargetKeywords] = useState(40)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const fileInputRef = useRef(null)
  const pasteRef = useRef(null)

  // ---- History ----
  const [history, setHistory] = useState([])
  const [filterTime, setFilterTime] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewItem, setViewItem] = useState(null)

  const [toast, setToast] = useState('')
  const flash = useCallback((msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }, [])

  // Refs untuk auto-fetch model saat Base URL berubah.
  const lastFetchedUrl = useRef('')
  const autoFetchTimer = useRef(null)

  // Muat riwayat + config AI saat mount.
  useEffect(() => {
    setHistory(loadHistory())
    const cfg = loadAiConfig()
    if (cfg) setAiConfig(cfg)
  }, [])

  // Muat daftar provider AI (sama seperti halaman AI Agent) untuk menandai
  // provider aktif & memudahkan prefill konfigurasi.
  useEffect(() => {
    api.getAIProviders()
      .then((res) => {
        const list = res.providers || []
        setProviders(list)
        setActiveProvider(list.find((p) => p.is_active) || list[0] || null)
      })
      .catch(() => {})
  }, [])

  const persistConfig = (cfg) => {
    setAiConfig(cfg)
    setAiMsg('')
    setAiErr('')
    saveAiConfig(cfg)
    flash('Konfigurasi AI tersimpan')
  }

  const handleFetchModels = async (cfgOverride) => {
    const cfg = cfgOverride || aiConfig
    const baseUrl = normalizeBaseUrl(cfg.base_url)
    if (!baseUrl) return setAiErr('Isi Base URL dulu.')
    if (!cfg.api_key || !cfg.api_key.trim()) return setAiErr('Isi API Key dulu untuk mengambil daftar model.')
    setFetchingModels(true)
    setAiErr('')
    setAiMsg('')

    let models = []
    let usedBackend = false
    // Coba langsung dari browser dulu (CORS harus diizinkan provider).
    try {
      models = await fetchModelsDirect(cfg)
    } catch {
      // Fallback ke backend bila CORS / network error.
      try {
        const res = await api.fetchAIModels({
          api_type: cfg.api_type,
          base_url: baseUrl,
          api_key: cfg.api_key.trim(),
        })
        models = res.models || []
        usedBackend = true
      } catch {
        setAiErr('Gagal fetch model. Coba langsung dari browser maupun lewat server. Periksa Base URL, API Key, dan koneksi.')
        setFetchingModels(false)
        return
      }
    }

    setAiModels(models)
    lastFetchedUrl.current = modelKeyFor(cfg)
    if (models.length > 0) {
      setAiMsg(`${models.length} model ditemukan${usedBackend ? ' (via server)' : ' (langsung browser)'} dari ${baseUrl}.`)
      if (!cfg.model && models.length === 1) {
        setAiConfig((c) => ({ ...c, model: models[0] }))
      }
    } else {
      setAiErr('Tidak ada model ditemukan. Cek Base URL & API Key.')
    }
    setFetchingModels(false)
  }

  // Auto-fetch daftar model: setiap kali Base URL / API Key / tipe API
  // berubah (debounce 1,2 detik), otomatis ambil list model dari endpoint
  // GET {base_url}/models. Cocok untuk provider OpenAI-Compatible maupun
  // Responses API (mis. B.AI: https://api.b.ai/v1/models).
  useEffect(() => {
    if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current)
    const baseUrl = normalizeBaseUrl(aiConfig.base_url)
    const hasKey = Boolean(aiConfig.api_key && aiConfig.api_key.trim())
    const urlComplete = /^https?:\/\/.+\..+/.test(baseUrl)
    if (!baseUrl || !hasKey || !urlComplete) return
    const key = modelKeyFor(aiConfig)
    if (key === lastFetchedUrl.current) return
    setAiModels([])
    autoFetchTimer.current = setTimeout(() => {
      handleFetchModels(aiConfig)
    }, 1200)
    return () => { if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiConfig.base_url, aiConfig.api_key, aiConfig.api_type])

  const fillFromActiveProvider = () => {
    if (!activeProvider) return
    setAiConfig((c) => ({
      ...c,
      api_type: activeProvider.api_type || c.api_type,
      base_url: activeProvider.base_url || c.base_url,
      model: activeProvider.model || c.model,
    }))
    setAiMsg(`Prefill dari provider "${activeProvider.display_name || activeProvider.provider_id}". Masukkan API Key lalu coba generate.`)
    setAiErr('')
  }

  // ---- Upload handlers ----
  const addImages = (fileList) => {
    const list = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return
    const pending = list.map((file) => ({ id: uid(), file, name: file.name, size: file.size, preview: '', subject: '', releases: '', result: null, status: 'pending', error: '' }))
    setImages((prev) => [...prev, ...pending])
    pending.forEach((img) => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => prev.map((x) => (x.id === img.id ? { ...x, preview: reader.result } : x)))
      }
      reader.readAsDataURL(img.file)
    })
  }

  const handleFiles = (e) => {
    if (e.target.files) addImages(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items || []
    const files = e.clipboardData?.files || []
    const collected = []
    if (files.length > 0) {
      for (const f of files) {
        if (f.type.startsWith('image/')) collected.push(f)
      }
    } else {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) collected.push(blob)
        }
      }
    }
    if (collected.length > 0) {
      e.preventDefault()
      addImages(collected)
      flash(`${collected.length} gambar ditempel dari clipboard`)
    }
  }

  const removeImage = (id) => {
    setImages((prev) => prev.filter((x) => x.id !== id))
  }

  const updateSubject = (id, value) => {
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, subject: value } : x)))
  }

  const updateReleases = (id, value) => {
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, releases: value } : x)))
  }

  const updateResult = (id, patch) => {
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, result: { ...(x.result || {}), ...patch } } : x)))
  }

  const updateResultTitle = (id, value) => updateResult(id, { title: value })
  const updateResultDescription = (id, value) => updateResult(id, { description: value })
  const removeKeyword = (id, idx) => {
    setImages((prev) => prev.map((x) => {
      if (x.id !== id) return x
      const kw = [...(x.result?.keywords || [])]
      kw.splice(idx, 1)
      return { ...x, result: { ...(x.result || {}), keywords: kw } }
    }))
  }

  // ---- Generate metadata ----
  const generateAll = async () => {
    if (!aiConfig.base_url.trim() || !aiConfig.api_key.trim() || !aiConfig.model.trim()) {
      setAiConfigOpen(true)
      setAiErr('Lengkapi konfigurasi AI dulu (Base URL, API Key, Model).')
      return
    }
    const targets = images.filter((x) => x.status !== 'done')
    if (targets.length === 0) {
      flash('Tidak ada gambar untuk diproses. Upload dulu.')
      return
    }
    setGenerating(true)
    setProgress({ done: 0, total: targets.length })

    let ok = 0
    let failed = 0
    const usedTitles = []
    for (let i = 0; i < targets.length; i += 1) {
      const img = targets[i]
      setImages((prev) => prev.map((x) => (x.id === img.id ? { ...x, status: 'generating', error: '' } : x)))
      setProgress({ done: i, total: targets.length })
      try {
        const meta = await callAIGenerate(aiConfig, { filename: img.name, subject: img.subject }, { titles: usedTitles, keywordCount: Math.max(1, Number(targetKeywords) || 40) })
        const kw = (meta.keywords || []).slice(0, Math.max(1, Number(targetKeywords) || 40))
        const deduped = [...new Set(kw)]
        setImages((prev) => prev.map((x) => (x.id === img.id ? { ...x, status: 'done', result: { ...meta, keywords: deduped } } : x)))
        usedTitles.push(meta.title)
        ok += 1
      } catch (err) {
        setImages((prev) => prev.map((x) => (x.id === img.id ? { ...x, status: 'error', error: err.message } : x)))
        failed += 1
      }
    }
    setProgress({ done: targets.length, total: targets.length })
    setGenerating(false)

    if (failed === 0) flash(`Selesai! ${ok} metadata berhasil dibuat.`)
    else flash(`${ok} berhasil, ${failed} gagal. Periksa hasil di bawah.`)
  }

  // Simpan hasil ke riwayat (satu gambar).
  const saveToHistory = (img) => {
    if (!img.result) return
    const entry = {
      id: uid(),
      filename: img.name,
      size: img.size,
      preview: img.preview,
      subject: img.subject,
      releases: img.releases || '',
      title: img.result.title,
      description: img.result.description,
      contentType: img.result.contentType || '',
      category: img.result.category,
      keywords: img.result.keywords || [],
      createdAt: Date.now(),
    }
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 500)
      saveHistory(next)
      return next
    })
    flash('Metadata tersimpan ke Riwayat')
  }

  // Simpan semua hasil (done) sekaligus.
  const saveAllToHistory = () => {
    const done = images.filter((x) => x.status === 'done' && x.result)
    if (done.length === 0) return
    const entries = done.map((img) => ({
      id: uid(),
      filename: img.name,
      size: img.size,
      preview: img.preview,
      subject: img.subject,
      releases: img.releases || '',
      title: img.result.title,
      description: img.result.description,
      contentType: img.result.contentType || '',
      category: img.result.category,
      keywords: img.result.keywords || [],
      createdAt: Date.now(),
    }))
    setHistory((prev) => {
      const next = [...entries, ...prev].slice(0, 500)
      saveHistory(next)
      return next
    })
    flash(`${entries.length} metadata tersimpan ke Riwayat`)
  }

  const removeFromHistory = (id) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x.id !== id)
      saveHistory(next)
      return next
    })
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
    flash('Riwayat dikosongkan')
  }

  // ---- Filter & sort history ----
  const filteredHistory = (() => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    let list = history.filter((it) => {
      if (filterTime === 'today') return now - it.createdAt < day
      if (filterTime === '7d') return now - it.createdAt < 7 * day
      if (filterTime === '30d') return now - it.createdAt < 30 * day
      if (filterTime === 'year') {
        const d = new Date(it.createdAt)
        const y = new Date(now)
        return d.getFullYear() === y.getFullYear()
      }
      return true
    })
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((it) =>
        (it.title || '').toLowerCase().includes(q) ||
        (it.filename || '').toLowerCase().includes(q) ||
        (it.keywords || []).some((k) => k.toLowerCase().includes(q))
      )
    }
    if (sortOrder === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortOrder === 'za') list = [...list].sort((a, b) => b.title.localeCompare(a.title))
    else if (sortOrder === 'oldest') list = [...list].sort((a, b) => a.createdAt - b.createdAt)
    else list = [...list].sort((a, b) => b.createdAt - a.createdAt)
    return list
  })()

  // ---- Dashboard stats ----
  const dashStats = (() => {
    const totalImages = history.length
    const totalKeywords = history.reduce((acc, h) => acc + (h.keywords?.length || 0), 0)
    const totalSize = history.reduce((acc, h) => acc + (h.size || 0), 0)
    const totalCategories = new Set(history.map((h) => h.category)).size
    const last7 = []
    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const start = dayStart.getTime() - i * 86400000
      const end = start + 86400000
      const count = history.filter((h) => h.createdAt >= start && h.createdAt < end).length
      const d = new Date(dayStart.getTime() - i * 86400000)
      last7.push({ day: d.toLocaleDateString('id-ID', { weekday: 'short' }), count })
    }
    const categoryCounts = {}
    history.forEach((h) => {
      const c = h.category || 'Lainnya'
      categoryCounts[c] = (categoryCounts[c] || 0) + 1
    })
    const topCategories = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
    const maxCat = Math.max(1, ...topCategories.map((c) => c.value))
    return { totalImages, totalKeywords, totalSize, totalCategories, last7, topCategories, maxCat }
  })()

  const recentHistory = [...history].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { opacity: 1, y: 15 },
    visible: { opacity: 1, y: 0 },
  }

  const openAiConfigPanel = () => {
    setAiConfigOpen(true)
    setAiErr('')
  }

  const doneCount = images.filter((x) => x.status === 'done').length

  return (
    <motion.div className="metadata-page" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className="page-header" variants={itemVariants}>
        <div className="page-header-left">
          <h1>Metadata Creator</h1>
          <p>Buat nama SEO &amp; 40 label (keywords) untuk upload Adobe Stock Contributor</p>
        </div>
        <div className="page-header-right">
          <span className={`metadata-provider-dot ${activeProvider || (aiConfig.base_url && aiConfig.api_key) ? 'active' : 'inactive'}`} />
          <span className="item-value" style={{ fontSize: '0.8125rem' }}>
            {activeProvider
              ? `Model aktif: ${activeProvider.display_name || activeProvider.provider_id} (${activeProvider.model || 'tanpa model'})`
              : aiConfig.model ? `Model: ${aiConfig.model}` : 'Belum ada model AI aktif'}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="metadata-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`metadata-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'history' && history.length > 0 && (
              <span className="badge badge-muted" style={{ marginLeft: 6 }}>{history.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== DASHBOARD TAB ==================== */}
      {activeTab === 'dashboard' && (
        <motion.div className="metadata-dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="metadata-kpi-grid">
            <div className="metadata-kpi-card">
              <div className="metadata-kpi-icon icon-purple"><ImageIcon size={20} /></div>
              <div className="metadata-kpi-details">
                <span className="metadata-kpi-label">Gambar Diproses</span>
                <div className="metadata-kpi-value">{dashStats.totalImages}</div>
                <span className="metadata-kpi-sub">metadata dibuat</span>
              </div>
            </div>
            <div className="metadata-kpi-card">
              <div className="metadata-kpi-icon icon-blue"><Tags size={20} /></div>
              <div className="metadata-kpi-details">
                <span className="metadata-kpi-label">Total Keyword</span>
                <div className="metadata-kpi-value">{dashStats.totalKeywords.toLocaleString('id-ID')}</div>
                <span className="metadata-kpi-sub">label SEO</span>
              </div>
            </div>
            <div className="metadata-kpi-card">
              <div className="metadata-kpi-icon icon-orange"><Package size={20} /></div>
              <div className="metadata-kpi-details">
                <span className="metadata-kpi-label">Ukuran Gambar</span>
                <div className="metadata-kpi-value">{formatBytes(dashStats.totalSize)}</div>
                <span className="metadata-kpi-sub">{dashStats.totalCategories} kategori</span>
              </div>
            </div>
            <div className="metadata-kpi-card">
              <div className="metadata-kpi-icon icon-green"><Cpu size={20} /></div>
              <div className="metadata-kpi-details">
                <span className="metadata-kpi-label">Provider AI</span>
                <div className="metadata-kpi-value">{activeProvider ? 'Aktif' : aiConfig.base_url ? 'Terisi' : 'Belum'}</div>
                <span className="metadata-kpi-sub">{activeProvider?.model || aiConfig.model || 'konfigurasi dulu'}</span>
              </div>
            </div>
          </div>

          <div className="metadata-dash-grid">
            {/* Grafik aktivitas */}
            <div className="metadata-dash-panel">
              <div className="metadata-panel-header">
                <h3>Aktivitas 7 Hari</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('history')}>
                  Riwayat <ChevronRight size={12} />
                </button>
              </div>
              {dashStats.totalImages === 0 ? (
                <div className="metadata-history-empty">
                  <BarChart3 size={32} />
                  <span>Belum ada aktivitas. Buat metadata pertama kamu!</span>
                </div>
              ) : (
                <div className="metadata-week-bars">
                  {dashStats.last7.map((d) => {
                    const max = Math.max(1, ...dashStats.last7.map((x) => x.count))
                    const pct = Math.max(6, Math.round((d.count / max) * 100))
                    return (
                      <div key={d.day} className="metadata-week-col">
                        <span className="metadata-week-num">{d.count}</span>
                        <div className="metadata-week-bar" style={{ height: `${pct}%` }} />
                        <span className="metadata-week-day">{d.day}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Distribusi kategori */}
            <div className="metadata-dash-panel">
              <div className="metadata-panel-header">
                <h3>Kategori Teratas</h3>
              </div>
              {dashStats.topCategories.length === 0 ? (
                <div className="metadata-history-empty">
                  <Layers size={32} />
                  <span>Belum ada data kategori.</span>
                </div>
              ) : (
                <div className="metadata-category-list">
                  {dashStats.topCategories.map((c) => (
                    <div key={c.name} className="metadata-category-row">
                      <span className="metadata-category-name">{c.name}</span>
                      <span className="metadata-category-count">{c.value}</span>
                      <div className="metadata-category-bar">
                        <div className="metadata-category-fill" style={{ width: `${Math.round((c.value / dashStats.maxCat) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Provider status + aksi cepat */}
          <div className="metadata-dash-grid">
            <div className="metadata-dash-panel">
              <div className="metadata-panel-header">
                <h3>Status Provider AI</h3>
                <button className="btn btn-secondary btn-sm" onClick={openAiConfigPanel}>
                  <Settings size={13} /> Konfigurasi
                </button>
              </div>
              {providers.length > 0 ? (
                <div className="metadata-provider-status">
                  <span className={`metadata-provider-dot ${activeProvider ? 'active' : 'inactive'}`} />
                  <div className="metadata-kpi-details">
                    <span className="metadata-kpi-label">
                      {activeProvider ? `${activeProvider.display_name || activeProvider.provider_id} — aktif` : 'Tidak ada provider aktif'}
                    </span>
                    <div className="metadata-recent-title">
                      {activeProvider
                        ? `${activeProvider.api_type} · ${activeProvider.model || 'tanpa model'}`
                        : `${providers.length} provider tersimpan`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="metadata-provider-status">
                  <span className="metadata-provider-dot inactive" />
                  <div className="metadata-kpi-details">
                    <span className="metadata-kpi-label">Belum ada provider AI</span>
                    <div className="metadata-recent-title">Isi konfigurasi di panel Creator agar bisa generate.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="metadata-dash-panel">
              <div className="metadata-panel-header">
                <h3>Aksi Cepat</h3>
              </div>
              <div className="metadata-quick-actions">
                <button className="metadata-quick-btn" onClick={() => { setActiveTab('creator'); setAiConfigOpen(true) }}>
                  <Settings size={15} /> Konfigurasi AI
                </button>
                <button className="metadata-quick-btn" onClick={() => setActiveTab('creator')}>
                  <UploadCloud size={15} /> Upload Gambar
                </button>
                <button className="metadata-quick-btn" onClick={() => setActiveTab('history')}>
                  <History size={15} /> Lihat Riwayat
                </button>
                <button className="metadata-quick-btn" onClick={() => {
                  const csv = buildAdobeCSV(filteredHistory)
                  downloadFile(csv, 'metadata-adobe-stock.csv', 'text/csv;charset=utf-8')
                  flash('CSV format Adobe Stock diunduh')
                }}>
                  <Download size={15} /> Export Adobe CSV
                </button>
              </div>
            </div>
          </div>

          {/* Aktivitas terbaru */}
          <div className="metadata-dash-panel">
            <div className="metadata-panel-header">
              <h3>Aktivitas Terbaru</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('history')}>
                Lihat Semua <ChevronRight size={12} />
              </button>
            </div>
            {recentHistory.length === 0 ? (
              <div className="metadata-history-empty">
                <Clock size={32} />
                <span>Belum ada aktivitas metadata.</span>
              </div>
            ) : (
              <div className="metadata-recent-list">
                {recentHistory.map((h) => (
                  <div key={h.id} className="metadata-recent-item">
                    {h.preview ? <img className="metadata-recent-thumb" src={h.preview} alt="" /> : <div className="metadata-recent-thumb" />}
                    <div className="metadata-recent-info">
                      <div className="metadata-recent-title">{h.title}</div>
                      <div className="metadata-recent-meta">{h.category} · {h.keywords?.length || 0} keyword · {fmtDate(h.createdAt)}</div>
                    </div>
                    <span className="badge badge-success">{h.keywords?.length || 0} label</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ==================== CREATOR TAB ==================== */}
      {activeTab === 'creator' && (
        <motion.div className="metadata-creator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Panel konfigurasi AI */}
          <div className="metadata-ai-config-card">
            <div className="metadata-ai-config-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} style={{ color: 'var(--accent)' }} />
                <h3>Konfigurasi Model AI</h3>
                <span className="badge badge-muted">sama dengan halaman AI Agent</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setAiConfigOpen((v) => !v)}>
                <SlidersHorizontal size={13} /> {aiConfigOpen ? 'Tutup' : 'Atur'}
              </button>
            </div>

            {!aiConfig.base_url || !aiConfig.api_key || !aiConfig.model ? (
              <div className="metadata-ai-config-msg" style={{ color: 'var(--warning)' }}>
                <AlertTriangle size={14} style={{ verticalAlign: -2 }} /> Konfigurasi AI belum lengkap. Klik "Atur" untuk memasukkan Base URL, API Key, dan Model.
              </div>
            ) : (
              <div className="metadata-provider-status">
                <span className="metadata-provider-dot active" />
                <div className="metadata-kpi-details">
                  <span className="metadata-kpi-label">Siap dipakai</span>
                  <div className="metadata-recent-title">
                    {aiConfig.api_type} · {aiConfig.model} · {aiConfig.base_url}
                  </div>
                </div>
              </div>
            )}

            {aiConfigOpen && (
              <div className="metadata-ai-config-form" style={{ marginTop: 12 }}>
                <div className="input-group">
                  <label className="input-label">Provider API</label>
                  <select className="input" value={aiConfig.api_type} onChange={(e) => setAiConfig((c) => ({ ...c, api_type: e.target.value }))}>
                    <option value="openai-compatible">OpenAI Compatible</option>
                    <option value="openai-responses">OpenAI Responses (B.AI / Responses API)</option>
                    <option value="anthropic-messages">Anthropic Messages</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Base URL</label>
                  <input className="input" placeholder="mis. https://api.b.ai/v1" value={aiConfig.base_url} onChange={(e) => setAiConfig((c) => ({ ...c, base_url: e.target.value }))} />
                  <p className="field-hint" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Daftar model otomatis diambil dari {aiConfig.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '') ? `${aiConfig.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '')}/models` : 'GET {base_url}/models'} begitu Base URL &amp; API Key terisi.
                  </p>
                </div>
                <div className="input-group">
                  <label className="input-label">API Key</label>
                  <input type="password" className="input" placeholder="sk-..." value={aiConfig.api_key} onChange={(e) => setAiConfig((c) => ({ ...c, api_key: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Model</label>
                  <div className="ai-model-row" style={{ display: 'flex', gap: 6 }}>
                    <select
                      className="input"
                      style={{ flex: 1 }}
                      value={aiConfig.model}
                      disabled={fetchingModels}
                      onChange={(e) => setAiConfig((c) => ({ ...c, model: e.target.value }))}
                    >
                      <option value="">{fetchingModels ? 'Mengambil daftar model…' : (aiModels.length ? '— pilih model —' : '— ketik Base URL + API Key —')}</option>
                      {aiModels.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" title="Muat ulang daftar model" disabled={fetchingModels || !aiConfig.base_url.trim()} onClick={handleFetchModels}>
                      {fetchingModels ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
                    </button>
                  </div>
                  {aiModels.length > 0 && (
                    <p className="field-hint" style={{ fontSize: '0.6875rem', color: 'var(--success)', marginTop: 2 }}>
                      <Check size={11} /> {aiModels.length} model tersedia dari Base URL ini.
                    </p>
                  )}
                </div>
              </div>
            )}

            {aiMsg && <p className="metadata-ai-config-msg">{aiMsg}</p>}
            {aiErr && <p className="metadata-ai-config-err">{aiErr}</p>}

            <div className="metadata-ai-config-actions">
              {activeProvider && (
                <button className="btn btn-secondary btn-sm" onClick={fillFromActiveProvider}>
                  <Bot size={13} /> Pakai provider aktif ({activeProvider.display_name || activeProvider.provider_id})
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => persistConfig(aiConfig)}>
                <Check size={13} /> Simpan Konfigurasi
              </button>
            </div>
          </div>

          {/* Ceklis kepatuhan Adobe Stock */}
          <div className="metadata-ai-config-card">
            <div className="metadata-ai-config-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
                <h3>Ceklis Kepatuhan Adobe Stock</h3>
                <span className="badge badge-muted">cegah penolakan</span>
              </div>
            </div>
            <div className="metadata-compliance-grid">
              {[
                { ok: 'Judul pendek, manusiawi, &lt;70 karakter (bukan gaya prompt AI)', bad: 'Judul panjang merinci seperti prompt AI → ditolak' },
                { ok: 'Tipe konten sesuai: abstrak/AI-art = Illustrations', bad: 'Memilih "Photos" untuk karya ilustrasi/AI' },
                { ok: 'Keyword relevan, urutan penting (10 pertama paling berpengaruh)', bad: 'Keyword acak, duplikat, atau tidak relevan' },
                { ok: 'Tanpa nama artis, orang, karakter, merek, IP', bad: 'Sebut nama artis/orang/merek → tolak' },
                { ok: 'Metadata beda tiap gambar (diversifikasi)', bad: 'Judul & keyword identik antar gambar mirip → tolak' },
                { ok: 'Centang "Created using generative AI tools" saat upload', bad: 'Lupa menandai konten generative AI' },
              ].map((r, i) => (
                <div key={i} className="metadata-compliance-item">
                  <span className="metadata-compliance-icon ok"><Check size={12} /></span>
                  <span className="metadata-compliance-text">{r.ok}</span>
                </div>
              ))}
            </div>
            <p className="metadata-ai-config-msg" style={{ marginTop: 8, fontSize: '0.75rem' }}>
              Referensi: Adobe Stock — generative AI content guidelines, tips judul &amp; keyword, dan kebijakan konten serupa (similar content). File AI-art abstrak seperti gelombang/gradient sangat banyak di koleksi Adobe, jadi metadata harus menonjolkan pembeda unik dan jangan upload varian yang nyaris identik.
            </p>
            <details style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Nomor kategori untuk CSV upload</summary>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', marginTop: 6 }}>
                {ADOBE_CATEGORIES.map((c, i) => (
                  <div key={c} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 6, lineHeight: 1.5 }}>
                Gunakan nomor di atas pada kolom <strong>Category</strong> di file CSV.<br />
                Format CSV: <code>Filename,Title,Keywords,Category,Releases</code><br />
                Judul: maks 70 karakter, tanpa koma. Keyword: maks 50, dipisah koma, urut kepentingan. Releases: nama file release JPEG (opsional). Maks 5.000 baris / 1 MB per file CSV (.csv, UTF-8).
              </p>
            </details>
          </div>

          {/* Area upload */}
          <div
            className={`metadata-upload-area ${images.length > 0 ? 'has-images' : ''} ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addImages(e.dataTransfer.files) }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="attendance-file-input" onChange={handleFiles} />
            {images.length === 0 ? (
              <>
                <div className="metadata-upload-icon"><UploadCloud size={44} /></div>
                <h3>Upload gambar untuk dibuatkan metadata</h3>
                <p>Klik untuk pilih banyak gambar sekaligus, atau tempel (Ctrl+V) pada kolom di bawah.</p>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                  <UploadCloud size={15} /> Pilih Gambar
                </button>
                <div className="input-group" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={pasteRef}
                    className="input metadata-paste-input"
                    placeholder="Tekan Ctrl+V di sini untuk menempel gambar dari clipboard..."
                    onPaste={handlePaste}
                    onFocus={() => pasteRef.current?.select()}
                  />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{images.length} gambar dipilih</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="input-group" style={{ margin: 0, flex: 1, minWidth: 220 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      className="input metadata-paste-input"
                      style={{ margin: 0, width: '100%', maxWidth: 'none' }}
                      placeholder="Tempel (Ctrl+V) tambahan gambar dari clipboard..."
                      onPaste={handlePaste}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    <Plus size={13} /> Tambah
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setImages([]) }}>
                    <Trash2 size={13} /> Bersihkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview grid */}
          {images.length > 0 && (
            <div className="metadata-preview-grid">
              {images.map((img) => (
                <div key={img.id} className="metadata-preview-card">
                  <div className="metadata-preview-img-wrap">
                    {img.preview ? <img src={img.preview} alt={img.name} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size={18} className="spin" /></div>}
                    <button className="metadata-preview-remove" onClick={() => removeImage(img.id)} title="Hapus"><X size={13} /></button>
                    {img.status === 'done' && <span className="badge badge-success" style={{ position: 'absolute', top: 4, left: 4 }}><Check size={10} /> OK</span>}
                    {img.status === 'error' && <span className="badge badge-error" style={{ position: 'absolute', top: 4, left: 4 }}>Gagal</span>}
                    {img.status === 'generating' && <span className="badge badge-warning" style={{ position: 'absolute', top: 4, left: 4 }}><Loader size={10} className="spin" /> AI</span>}
                  </div>
                  <div className="metadata-preview-body">
                    <span className="metadata-preview-name">{img.name} · {formatBytes(img.size)}</span>
                    <input
                      className="metadata-preview-subject"
                      placeholder="Subjek / deskripsi singkat gambar (opsional)"
                      value={img.subject}
                      onChange={(e) => updateSubject(img.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kontrol generate */}
          {images.length > 0 && (
            <div className="metadata-gen-controls">
              <span className="metadata-gen-label"><Tags size={13} /> Target keyword:</span>
              <input
                className="metadata-gen-input"
                type="number"
                min={1}
                max={50}
                value={targetKeywords}
                onChange={(e) => setTargetKeywords(Number(e.target.value) || 40)}
              />
              <div style={{ flex: 1 }} />
              {doneCount > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={saveAllToHistory}>
                  <Check size={13} /> Simpan {doneCount} ke Riwayat
                </button>
              )}
              <button className="btn btn-primary" onClick={generateAll} disabled={generating}>
                {generating ? <><Loader size={14} className="spin" /> Membuat metadata {progress.done}/{progress.total}...</> : <><Sparkles size={14} /> Generate Metadata</>}
              </button>
            </div>
          )}

          {/* Hasil */}
          {images.some((x) => x.result) && (
            <div className="metadata-result-grid">
              {images.filter((x) => x.result).map((img) => {
                const v = validateAdobe(img.result)
                const issuesTotal = v.errors.length + v.warnings.length
                return (
                <div key={img.id} className="metadata-result-card">
                  <div className="metadata-result-header">
                    {img.preview ? <img className="metadata-result-thumb" src={img.preview} alt="" /> : <div className="metadata-result-thumb" />}
                    <div className="metadata-result-info">
                      <div className="metadata-result-filename">{img.name}</div>
                      <div className="metadata-result-status">
                        {img.result.contentType ? `${img.result.contentType} · ` : ''}{img.result.category} · {img.result.keywords?.length || 0} keyword · siap upload
                      </div>
                    </div>
                    {v.errors.length > 0
                      ? <span className="badge badge-error">{v.errors.length} error</span>
                      : v.warnings.length > 0
                        ? <span className="badge badge-warning">{issuesTotal} catatan</span>
                        : <span className="badge badge-success"><Check size={10} /> OK</span>}
                  </div>
                  <div className="metadata-result-body">
                    {issuesTotal > 0 && (
                      <div style={{ marginBottom: 12, padding: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        {v.errors.length > 0 && <div style={{ color: 'var(--error)', marginBottom: 4 }}><AlertTriangle size={12} /> {v.errors.join('; ')}</div>}
                        {v.warnings.length > 0 && <div style={{ color: 'var(--warning)' }}><AlertTriangle size={12} /> {v.warnings.join('; ')}</div>}
                      </div>
                    )}
                    <div className="metadata-result-field">
                      <span className="metadata-result-field-label"><FileText size={11} /> Judul SEO ({img.result.title.length} karakter, ideal &lt;70)</span>
                      <input className="input" value={img.result.title} onChange={(e) => updateResultTitle(img.id, e.target.value)} maxLength={ADOBE_RULES.titleMaxHard} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{img.result.title.length}/{ADOBE_RULES.titleMaxHard}</span>
                    </div>
                    <div className="metadata-result-field">
                      <span className="metadata-result-field-label"><FileText size={11} /> Deskripsi</span>
                      <textarea className="input" rows={3} value={img.result.description} onChange={(e) => updateResultDescription(img.id, e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="metadata-result-field">
                        <span className="metadata-result-field-label"><FolderOpen size={11} /> Kategori (No. {ADOBE_CATEGORY_NUMBERS[img.result.category] || '?'})</span>
                        <select className="input" value={img.result.category} onChange={(e) => updateResult(img.id, { category: e.target.value })}>
                          {ADOBE_CATEGORIES.map((c) => <option key={c} value={c}>{c} ({ADOBE_CATEGORY_NUMBERS[c]})</option>)}
                        </select>
                      </div>
                      <div className="metadata-result-field">
                        <span className="metadata-result-field-label"><ImageIcon size={11} /> Tipe konten</span>
                        <select className="input" value={img.result.contentType || ''} onChange={(e) => updateResult(img.id, { contentType: e.target.value })}>
                          <option value="">— pilih —</option>
                          {ADOBE_CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="metadata-result-field">
                      <span className="metadata-result-field-label"><FileText size={11} /> Releases (opsional — nama file release JPEG yg diunggah di Adobe, maks 30 karakter)</span>
                      <input className="input" placeholder="mis. model-release-1.jpg" value={img.releases || ''} onChange={(e) => updateReleases(img.id, e.target.value)} maxLength={30} />
                    </div>
                    <div className="metadata-result-field">
                      <span className="metadata-result-field-label"><Tags size={11} /> Keyword / Label ({img.result.keywords?.length || 0})</span>
                      <div className="metadata-result-keywords">
                        {img.result.keywords.map((k, i) => (
                          <span key={`${k}-${i}`} className="metadata-keyword-chip">
                            {k}
                            <button className="metadata-keyword-remove" onClick={() => removeKeyword(img.id, i)} title="Hapus keyword">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="metadata-result-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(img.result.keywords.join(', ')); flash('Keyword disalin') }}>
                      <Copy size={13} /> Salin Keyword
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      downloadFile(`Title: ${img.result.title}\nContent type: ${img.result.contentType || '(auto)'}\nCategory: ${img.result.category}\n\n${img.result.description}\n\nKeywords (${img.result.keywords.length}):\n${img.result.keywords.join(', ')}`, `${img.name.replace(/\.[^.]+$/, '')}.txt`)
                    }}>
                      <Download size={13} /> Download .txt
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      downloadFile(buildAdobeCSV([{ ...img, filename: img.name, title: img.result.title, category: img.result.category, keywords: img.result.keywords, releases: img.releases || '' }]), `${img.name.replace(/\.[^.]+$/, '')}-adobe.csv`, 'text/csv;charset=utf-8')
                      flash('CSV format Adobe Stock diunduh')
                    }}>
                      <Download size={13} /> Adobe CSV
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => saveToHistory(img)}>
                      <Check size={13} /> Simpan ke Riwayat
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== HISTORY TAB ==================== */}
      {activeTab === 'history' && (
        <motion.div className="metadata-history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="metadata-history-toolbar">
            <div className="metadata-history-search">
              <Search size={15} className="metadata-history-search-icon" />
              <input placeholder="Cari judul, nama file, atau keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <select className="metadata-filter-select" value={filterTime} onChange={(e) => setFilterTime(e.target.value)}>
              {TIME_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select className="metadata-filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const csv = buildAdobeCSV(filteredHistory)
              downloadFile(csv, 'metadata-adobe-stock.csv', 'text/csv;charset=utf-8')
              flash(`Export ${filteredHistory.length} item ke CSV format Adobe Stock`)
            }}>
              <Download size={13} /> Adobe CSV
            </button>
            {history.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={clearHistory}>
                <Trash2 size={13} /> Hapus Semua
              </button>
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="metadata-history-empty">
              <ImageIcon size={40} />
              <span>{history.length === 0 ? 'Belum ada gambar dengan metadata. Upload & generate dulu di tab Creator.' : 'Tidak ada hasil sesuai filter.'}</span>
              {history.length === 0 && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('creator')}>
                    <ImagePlus size={14} /> Buka Creator
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="metadata-history-list">
              {filteredHistory.map((h) => (
                <div key={h.id} className="metadata-history-item" onClick={() => setViewItem(h)}>
                  {h.preview ? <img className="metadata-history-thumb" src={h.preview} alt="" /> : <div className="metadata-history-thumb" />}
                  <div className="metadata-history-info">
                    <div className="metadata-history-title">{h.title}</div>
                    <div className="metadata-history-meta">
                      <span>{h.contentType ? `${h.contentType} · ` : ''}{h.category}</span>
                      <span>{h.keywords?.length || 0} keyword</span>
                      <span>{fmtDate(h.createdAt)}</span>
                    </div>
                  </div>
                  <div className="metadata-history-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" title="Lihat" onClick={() => setViewItem(h)}>
                      <Eye size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Salin keyword" onClick={() => { navigator.clipboard?.writeText((h.keywords || []).join(', ')); flash('Keyword disalin') }}>
                      <Copy size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Download .txt" onClick={() => downloadFile(`Title: ${h.title}\nContent type: ${h.contentType || '(auto)'}\nCategory: ${h.category}\n\n${h.description}\n\nKeywords (${(h.keywords || []).length}):\n${(h.keywords || []).join(', ')}`, `${(h.filename || 'metadata').replace(/\.[^.]+$/, '')}.txt`)}>
                      <Download size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Hapus" onClick={() => removeFromHistory(h.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== MODAL LIHAT HASIL ==================== */}
      {viewItem && (
        <div className="metadata-modal-overlay" onClick={() => setViewItem(null)}>
          <div className="metadata-modal" onClick={(e) => e.stopPropagation()}>
            <div className="metadata-modal-header">
              <h2>Detail Metadata</h2>
              <button className="metadata-modal-close" onClick={() => setViewItem(null)}><X size={18} /></button>
            </div>
            <div className="metadata-modal-body">
              {viewItem.preview && <img src={viewItem.preview} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />}
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Nama file</span>
                <span style={{ fontSize: '0.875rem' }}>{viewItem.filename}</span>
              </div>
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Judul SEO</span>
                <span style={{ fontSize: '0.875rem' }}>{viewItem.title}</span>
              </div>
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Deskripsi</span>
                <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{viewItem.description}</span>
              </div>
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Tipe konten</span>
                <span style={{ fontSize: '0.875rem' }}>{viewItem.contentType || '(auto)'}</span>
              </div>
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Kategori</span>
                <span style={{ fontSize: '0.875rem' }}>{viewItem.category}</span>
              </div>
              <div className="metadata-modal-field">
                <span className="metadata-modal-field-label">Keyword ({viewItem.keywords?.length || 0})</span>
                <div className="metadata-modal-keywords">
                  {viewItem.keywords.map((k, i) => <span key={i} className="metadata-keyword-chip">{k}</span>)}
                </div>
              </div>
            </div>
            <div className="metadata-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText((viewItem.keywords || []).join(', ')); flash('Keyword disalin') }}>
                <Copy size={13} /> Salin Keyword
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const csv = buildAdobeCSV([viewItem])
                downloadFile(csv, `${(viewItem.filename || 'metadata').replace(/\.[^.]+$/, '')}-adobe.csv`, 'text/csv;charset=utf-8')
                flash('CSV format Adobe Stock diunduh')
              }}>
                <Download size={13} /> Adobe CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="metadata-toast"><Check size={15} /> {toast}</div>}
    </motion.div>
  )
}
