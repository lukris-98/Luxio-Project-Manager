import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Bot, Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle, CheckCircle, Key, Globe, Cpu, History } from 'lucide-react'
import { useStore } from '../store/useStore'
import { api } from '../services/api'
import './AIProviders.css'

const API_TYPE_OPTIONS = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'openai-responses', label: 'OpenAI Responses' },
  { value: 'anthropic-messages', label: 'Anthropic Messages' },
]

const BASE_URL_HISTORY_KEY = 'luxio-ai-providers-base-url-history'
const MAX_HISTORY = 10

const getBaseUrlHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(BASE_URL_HISTORY_KEY) || '[]')
  } catch { return [] }
}

const saveBaseUrlToHistory = (url) => {
  if (!url.trim()) return
  const history = getBaseUrlHistory().filter((h) => h !== url.trim())
  history.unshift(url.trim())
  localStorage.setItem(BASE_URL_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function AIProviders() {
  const { currentUser, role } = useStore()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    provider_id: '', display_name: '', api_type: 'openai-compatible',
    base_url: '', api_key: '', model: '', enabled: true, is_active: false,
  })
  const [fetchingModels, setFetchingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState([])
  const [testStatus, setTestStatus] = useState(null)
  const [testMessage, setTestMessage] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [baseUrlHistory, setBaseUrlHistory] = useState([])
  const [showBaseUrlDropdown, setShowBaseUrlDropdown] = useState(false)
  const baseUrlRef = useRef(null)
  const autoFetchTimerRef = useRef(null)
  const lastFetchedRef = useRef('')

  const loadProviders = async () => {
    setLoading(true)
    try {
      const res = await api.getAIProviders()
      setProviders(res.providers || [])
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    setBaseUrlHistory(getBaseUrlHistory())
  }, [showForm])

  const resetForm = () => {
    setForm({ provider_id: '', display_name: '', api_type: 'openai-compatible', base_url: '', api_key: '', model: '', enabled: true, is_active: false })
    setAvailableModels([])
    setTestStatus(null)
    setTestMessage('')
    setEditId(null)
  }

  const openAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditId(p.id)
    setForm({
      provider_id: p.provider_id || '',
      display_name: p.display_name || '',
      api_type: p.api_type || 'openai-compatible',
      base_url: p.base_url || '',
      api_key: '',
      model: p.model || '',
      enabled: p.enabled !== false,
      is_active: p.is_active || false,
    })
    setAvailableModels(p.model ? [p.model] : [])
    setTestStatus(null)
    setTestMessage('')
    setShowForm(true)
  }

  const testConnection = async () => {
    if (!form.base_url.trim()) return
    setTesting(true)
    setTestStatus(null)
    setTestMessage('')

    const baseUrl = form.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '')
    let success = false
    let message = ''

    try {
      const url = `${baseUrl}/models`
      const headers = { 'Content-Type': 'application/json' }
      if (form.api_type === 'anthropic-messages') {
        headers['x-api-key'] = form.api_key.trim()
        headers['anthropic-version'] = '2023-06-01'
      } else {
        headers['Authorization'] = `Bearer ${form.api_key.trim()}`
      }
      const res = await fetch(url, { method: 'GET', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      let models = []
      if (Array.isArray(body.data)) models = body.data.map((m) => (m && (m.id || m.model)) || null).filter(Boolean)
      else if (Array.isArray(body)) models = body.map((m) => (m && (m.id || m.name)) || null).filter(Boolean)
      else if (body.models && Array.isArray(body.models)) models = body.models.map((m) => (typeof m === 'string' ? m : (m && m.id) || null)).filter(Boolean)
      setAvailableModels(models.map(String))
      success = true
      message = models.length > 0 ? `${models.length} model ditemukan` : 'Koneksi berhasil, tapi tidak ada model ditemukan'
    } catch {
      try {
        const res = await api.fetchAIModels({ api_type: form.api_type, base_url: baseUrl, api_key: form.api_key.trim() })
        const models = res.models || []
        setAvailableModels(models)
        success = true
        message = models.length > 0 ? `${models.length} model ditemukan (via server)` : 'Koneksi berhasil, tapi tidak ada model ditemukan'
      } catch (e) {
        message = 'Gagal terhubung. Periksa Base URL, API Key, dan koneksi.'
        success = false
      }
    }

    setTestStatus(success ? 'success' : 'error')
    setTestMessage(message)
    setTesting(false)
  }

  useEffect(() => {
    if (!showForm) return
    const baseUrl = (form.base_url || '').trim().replace(/\/+$/, '').replace(/\/models$/, '')
    const hasKey = Boolean(form.api_key && form.api_key.trim())
    const urlComplete = /^https?:\/\/.+\..+/.test(baseUrl)
    if (!baseUrl || !hasKey || !urlComplete) return
    const key = `${form.api_type}|${baseUrl}`
    if (key === lastFetchedRef.current) return

    if (autoFetchTimerRef.current) clearTimeout(autoFetchTimerRef.current)
    autoFetchTimerRef.current = setTimeout(() => {
      lastFetchedRef.current = key
      testConnection()
    }, 1500)
    return () => { if (autoFetchTimerRef.current) clearTimeout(autoFetchTimerRef.current) }
  }, [showForm, form.base_url, form.api_key, form.api_type])

  const handleSave = async () => {
    if (!form.provider_id.trim() || !form.display_name.trim()) return
    setSaving(true)
    try {
      if (editId) {
        const patch = {}
        for (const k of ['provider_id', 'display_name', 'api_type', 'base_url', 'model', 'enabled', 'is_active']) {
          if (form[k] !== undefined) patch[k] = form[k]
        }
        if (form.api_key && form.api_key.trim()) patch.api_key = form.api_key
        await api.updateAIProvider(editId, patch)
      } else {
        await api.createAIProvider(form)
      }
      await loadProviders()
      setShowForm(false)
      resetForm()
    } catch (_) {}
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteAIProvider(deleteTarget.id)
      await loadProviders()
      setDeleteTarget(null)
    } catch (_) {}
  }

  const activateProvider = async (id) => {
    try {
      await api.updateAIProvider(id, { is_active: true })
      await loadProviders()
    } catch (_) {}
  }

  if (role) {
    return (
      <div className="ai-providers-page">
        <div className="ai-providers-restricted">
          <AlertCircle size={48} />
          <h2>Akses Ditolak</h2>
          <p>Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-providers-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header-left">
          <div className="page-icon">
            <Bot size={24} />
          </div>
          <div>
            <h1>AI Providers</h1>
            <p>Kelola provider AI untuk Agent. Tambah, edit, dan atur provider aktif.</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Provider
        </button>
      </motion.div>

      {loading ? (
        <div className="ai-providers-loading">
          <Loader2 size={32} className="spin" />
          <span>Memuat provider...</span>
        </div>
      ) : providers.length === 0 && !showForm ? (
        <motion.div className="ai-providers-empty" variants={itemVariants} initial="hidden" animate="visible">
          <Cpu size={48} />
          <h3>Belum Ada Provider</h3>
          <p>Tambahkan provider AI untuk menghubungkan Agent ke model AI.</p>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> Tambah Provider Pertama
          </button>
        </motion.div>
      ) : (
        <motion.div className="providers-list" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible">
          {providers.map((p) => (
            <motion.div key={p.id} className={`provider-card ${p.is_active ? 'active' : ''}`} variants={itemVariants}>
              <div className="provider-main">
                <div className="provider-info">
                  <div className="provider-name-row">
                    <span className="provider-name">{p.display_name || p.provider_id || 'Provider'}</span>
                    {p.is_active && <span className="provider-badge">Aktif</span>}
                  </div>
                  <div className="provider-meta">
                    <span><Globe size={12} /> {p.api_type}</span>
                    <span><Key size={12} /> {p.model || 'tanpa model'}</span>
                    <span>{p.base_url ? p.base_url.replace(/\/+$/, '') : 'tanpa base URL'}</span>
                  </div>
                </div>
              </div>
              <div className="provider-actions">
                {!p.is_active && (
                  <button className="btn btn-secondary btn-sm" onClick={() => activateProvider(p.id)} title="Jadikan aktif">
                    Aktifkan
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                  <Pencil size={13} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)} title="Hapus">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {showForm && (
        <motion.div className="provider-form-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="provider-form" variants={itemVariants} initial="hidden" animate="visible">
            <div className="form-header">
              <h2><Bot size={20} /> {editId ? 'Edit Provider' : 'Provider Baru'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowForm(false); resetForm() }}>
                <X size={16} />
              </button>
            </div>

            <div className="form-body">
              <div className="form-row">
<div className="input-group">
                <label>Provider ID <span className="required">*</span></label>
                <input className="input" placeholder="mis. openai, anthropic, groq" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })} autoComplete="off" />
              </div>
              <div className="input-group">
                <label>Display Name <span className="required">*</span></label>
                <input className="input" placeholder="mis. OpenAI, Anthropic, Groq" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} autoComplete="off" />
              </div>
              </div>

              <div className="input-group">
                <label>Provider API</label>
                <select className="input" value={form.api_type} onChange={(e) => setForm({ ...form, api_type: e.target.value })}>
                  {API_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Base URL</label>
                <input className="input" placeholder="mis. https://api.openai.com/v1" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} />
              </div>

              <div className="input-group">
                <label>API Key</label>
                <input type="password" className="input" placeholder="sk-..." value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
                <small className="field-hint">Kosongkan bila model lokal (Ollama)</small>
              </div>

              <div className="input-group">
                <label>Model</label>
                <div className="model-row">
                  <select className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
                    <option value="">{testing ? 'Menguji koneksi...' : (availableModels.length ? '— pilih model —' : '— ketik Base URL + API Key —')}</option>
                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={testing || !form.base_url.trim()} onClick={testConnection}>
                    {testing ? <Loader2 size={14} className="spin" /> : 'Test'}
                  </button>
                </div>
                {availableModels.length > 0 && <small className="field-hint success">{availableModels.length} model tersedia</small>}
              </div>

              {testStatus && (
                <div className={`test-result ${testStatus}`}>
                  {testStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{testMessage}</span>
                </div>
              )}

              <div className="form-toggles">
                <label className="toggle-label">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                  <span>Aktifkan provider</span>
                </label>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  <span>Jadikan provider aktif (default)</span>
                </label>
              </div>
            </div>

            <div className="form-footer">
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>Batal</button>
              <button className="btn btn-primary" disabled={!form.provider_id.trim() || !form.display_name.trim() || saving} onClick={handleSave}>
                {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />} Simpan
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {deleteTarget && (
        <div className="provider-form-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={32} className="confirm-icon" />
            <h3>Hapus Provider?</h3>
            <p>Hapus provider <strong>{deleteTarget.display_name || deleteTarget.provider_id}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
            {deleteTarget.is_active && <p className="confirm-warning">Provider ini sedang aktif. Menghapus akan menonaktifkan integrasi AI.</p>}
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={14} /> Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}