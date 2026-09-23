import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PanelLeftClose, PanelLeftOpen, ExternalLink,
  Bot, ChevronDown, Check, Loader2, AlertTriangle,
  Wand2, Code2, Copy, Eye, EyeOff, Plus, Trash2, X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { api } from '../services/api'
import { callAIChat, fetchModelsDirect, normalizeBaseUrl } from '../utils/aiConfig'
import './M3ECanvas.css'

// System prompt untuk HTML design generation
const M3E_SYSTEM_PROMPT = `Kamu adalah ahli UI/UX developer. Tugasmu menghasilkan desain HTML yang lengkap dan indah berdasarkan deskripsi sketsa atau prompt yang diberikan.

Aturan WAJIB:
1. Selalu hasilkan HTML lengkap dari <!DOCTYPE html> sampai </html>
2. Gunakan Material Design 3 / Material 3 Expressive sebagai dasar desain
3. CSS embedded di dalam <style> tag, JavaScript embedded di <script> tag
4. Gunakan Google Fonts (via @import) untuk tipografi M3 (Roboto, Google Sans, dll)
5. Pastikan responsif dan modern
6. Gunakan warna dan tema yang sesuai M3 (seed color bisa dipilih)
7. Tambahkan animasi dan transisi yang halus
8. Komponen: tombol, card, app bar, navigation, FAB, chip, dll sesuai M3 spec
9. Buat interaktif bila memungkinkan (hover, click state)
10. Jangan sertakan penjelasan di luar HTML — hanya output HTML murni

Output HANYA berupa HTML lengkap, diawali \`\`\`html dan diakhiri \`\`\`.`

function extractHtml(raw) {
  const m = raw.match(/```html\s*([\s\S]*?)```/i) || raw.match(/```\s*(<!DOCTYPE[\s\S]*?)<\/html>/i)
  if (m) return m[1].trim()
  const direct = raw.match(/(<!DOCTYPE html[\s\S]*?<\/html>)/i)
  if (direct) return direct[1].trim()
  return raw.trim()
}

// Form tambah provider custom
function AddProviderForm({ onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const canFetch = baseUrl.trim() && apiKey.trim()

  const handleFetchModels = useCallback(async () => {
    setFetchingModels(true)
    setFetchError('')
    setModels([])
    setSelectedModel('')
    try {
      const list = await fetchModelsDirect({ base_url: baseUrl.trim(), api_key: apiKey.trim(), api_type: 'openai-compatible' })
      if (!list.length) throw new Error('Tidak ada model ditemukan.')
      setModels(list)
      setSelectedModel(list[0])
    } catch (err) {
      setFetchError(err.message || 'Gagal fetch model.')
    } finally {
      setFetchingModels(false)
    }
  }, [baseUrl, apiKey])

  // Auto-fetch model saat base_url dan api_key terisi (debounce 800ms)
  useEffect(() => {
    if (!canFetch) return
    const timer = setTimeout(() => { handleFetchModels() }, 800)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, apiKey])

  const handleSave = async () => {
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim() || !selectedModel) return
    setSaving(true)
    try {
      const provider = {
        provider_id: `custom-${Date.now()}`,
        display_name: name.trim(),
        base_url: normalizeBaseUrl(baseUrl.trim()),
        api_key: apiKey.trim(),
        api_type: 'openai-compatible',
        model: selectedModel,
        enabled: true,
        is_active: false,
      }
      await api.saveAIProvider(provider)
      onSaved(provider)
    } catch (err) {
      setFetchError(err.message || 'Gagal menyimpan provider.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="m3e-add-provider-form">
      <div className="m3e-form-head">
        <Plus size={15} />
        <strong>Tambah Provider AI</strong>
        <button className="m3e-icon-btn" onClick={onCancel}><X size={14} /></button>
      </div>

      <label className="m3e-label">Nama Provider</label>
      <input
        className="m3e-input"
        placeholder="mis. OpenAI, Groq, OpenRouter…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="m3e-label">Base URL</label>
      <input
        className="m3e-input"
        placeholder="https://api.openai.com/v1"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
      />

      <label className="m3e-label">API Key</label>
      <div className="m3e-input-row">
        <input
          className="m3e-input flex-1"
          type={showKey ? 'text' : 'password'}
          placeholder="sk-…"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button className="m3e-icon-btn" onClick={() => setShowKey((v) => !v)} title={showKey ? 'Sembunyikan' : 'Tampilkan'}>
          {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {fetchingModels && (
        <div className="m3e-fetch-status">
          <Loader2 size={13} className="spin" /> Auto-fetching models…
        </div>
      )}
      {fetchError && (
        <div className="m3e-fetch-error">
          <AlertTriangle size={13} /> {fetchError}
          <button className="m3e-link-btn" onClick={handleFetchModels}>Coba lagi</button>
        </div>
      )}
      {models.length > 0 && (
        <>
          <label className="m3e-label">Model <small>({models.length} tersedia)</small></label>
          <select className="m3e-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </>
      )}

      <div className="m3e-form-actions">
        <button className="m3e-btn-secondary" onClick={onCancel}>Batal</button>
        <button
          className="m3e-btn-primary"
          onClick={handleSave}
          disabled={saving || !name.trim() || !baseUrl.trim() || !apiKey.trim() || !selectedModel}
        >
          {saving ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
          Simpan
        </button>
      </div>
    </div>
  )
}

// Main M3ECanvas component
export default function M3ECanvas() {
  const { setCurrentPage, setToast } = useStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // AI Provider state
  const [providers, setProviders] = useState(null)
  const [providerId, setProviderId] = useState('')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [showAddProvider, setShowAddProvider] = useState(false)

  // Generate HTML state
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [htmlPreviewMode, setHtmlPreviewMode] = useState('preview')

  const previewRef = useRef(null)

  // Load providers
  useEffect(() => {
    let on = true
    api.getAIProviders()
      .then((res) => {
        if (!on) return
        const list = (res.providers || []).filter((p) => p.enabled !== false)
        setProviders(list)
        const act = list.find((p) => p.is_active) || list[0]
        if (act) setProviderId(act.id)
      })
      .catch(() => { if (on) setProviders([]) })
    return () => { on = false }
  }, [])

  const activeProvider = (providers || []).find((p) => p.id === providerId) || null
  const noProvider = providers !== null && providers.length === 0

  const handleProviderSaved = async (newProvider) => {
    setShowAddProvider(false)
    try {
      const res = await api.getAIProviders()
      const list = (res.providers || []).filter((p) => p.enabled !== false)
      setProviders(list)
      const saved = list.find((p) =>
        p.provider_id === newProvider.provider_id || p.display_name === newProvider.display_name
      )
      if (saved) setProviderId(saved.id)
    } catch { /* biarkan */ }
    setToast?.({ title: 'Provider disimpan', body: 'Pilih model lalu generate HTML.', type: 'create' })
  }

  // Generate HTML
  const handleGenerate = async () => {
    const provider = (providers || []).find((p) => p.id === providerId)
    if (!provider) { setGenError('Pilih atau daftarkan provider AI dulu.'); return }
    const text = prompt.trim()
    if (!text) { setGenError('Tulis deskripsi desain dulu.'); return }

    setGenerating(true); setGenError(''); setGeneratedHtml('')
    try {
      const cfg = {
        providerId: provider.id,
        api_type: provider.api_type || 'openai-compatible',
        base_url: provider.base_url,
        api_key: provider.api_key,
        model: provider.model,
      }
      const raw = await callAIChat(cfg, [
        { role: 'system', content: M3E_SYSTEM_PROMPT },
        { role: 'user', content: `Buat desain HTML Material 3 Expressive berdasarkan sketsa/deskripsi berikut:\n\n${text}` },
      ], { maxTokens: 12000, temperature: 0.7 })
      const html = extractHtml(raw)
      if (!html || html.length < 100) throw new Error('Model tidak menghasilkan HTML valid. Coba lagi atau pakai model yang lebih kuat.')
      setGeneratedHtml(html)
      setHtmlPreviewMode('preview')
      setToast?.({ title: 'HTML berhasil dibuat!', type: 'create' })
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const copyHtml = async () => {
    try { await navigator.clipboard.writeText(generatedHtml); setToast?.({ title: 'HTML disalin', type: 'info' }) } catch { /* ignore */ }
  }
  const openHtmlInTab = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }
  const downloadHtml = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `m3e-design-${Date.now()}.html`
    a.click()
  }

  return (
    <div className="m3e-canvas-page">
      {/* Top Header */}
      <div className="m3e-header">
        <div className="m3e-header-left">
          <button
            className="m3e-header-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{sidebarCollapsed ? 'Perlebar' : 'Perkecil'}</span>
          </button>
          <div className="m3e-header-titles">
            <h1>M3E Canvas</h1>
            <p>Rancang sketsa UI Material 3 Expressive &amp; konversi ke HTML via AI</p>
          </div>
        </div>
        <div className="m3e-header-right">
          {/* Model picker */}
          {providers && providers.length > 0 && (
            <div className="m3e-model-pick">
              <button
                className={`m3e-model-btn ${modelMenuOpen ? 'open' : ''}`}
                onClick={() => setModelMenuOpen((o) => !o)}
                title="Ganti model AI"
              >
                <Bot size={14} />
                <span>{activeProvider?.display_name || activeProvider?.provider_id || 'Model'}</span>
                <em>{activeProvider?.model || '—'}</em>
                <ChevronDown size={13} />
              </button>
              {modelMenuOpen && (
                <>
                  <div className="m3e-model-overlay" onClick={() => setModelMenuOpen(false)} />
                  <div className="m3e-model-menu">
                    <div className="m3e-model-menu-title">Pilih model AI</div>
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        className={`m3e-model-item ${p.id === providerId ? 'active' : ''}`}
                        onClick={() => { setProviderId(p.id); setModelMenuOpen(false) }}
                      >
                        <Bot size={14} />
                        <span>{p.display_name || p.provider_id}</span>
                        <em>{p.model}</em>
                        {p.id === providerId && <Check size={13} />}
                      </button>
                    ))}
                    <button className="m3e-model-manage" onClick={() => { setModelMenuOpen(false); setCurrentPage('ai-providers') }}>
                      <Wand2 size={13} /> Kelola Provider AI
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <a href="https://lnkiai.github.io/m3e-canvas/" target="_blank" rel="noopener noreferrer" className="m3e-external-link" title="Buka M3E Canvas di tab baru">
            <ExternalLink size={16} /> Buka Tab Baru
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className={`m3e-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Collapsible Sidebar */}
        <aside className={`m3e-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="m3e-sidebar-header">
            <h3>Panel AI &amp; Info</h3>
            <button className="m3e-sidebar-toggle" onClick={() => setSidebarCollapsed(true)} title="Perkecil sidebar">
              <PanelLeftClose size={18} />
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="m3e-sidebar-content">

              {/* AI Section */}
              <div className="m3e-ai-section">
                <h4><Bot size={13} /> Generate HTML dengan AI</h4>

                {noProvider && !showAddProvider && (
                  <div className="m3e-no-provider">
                    <AlertTriangle size={14} />
                    <span>Belum ada provider AI.</span>
                    <div className="m3e-no-provider-actions">
                      <button className="m3e-btn-primary" onClick={() => setShowAddProvider(true)}>
                        <Plus size={13} /> Tambah Provider
                      </button>
                      <button className="m3e-btn-secondary" onClick={() => setCurrentPage('ai-providers')}>
                        <Wand2 size={13} /> Pengaturan
                      </button>
                    </div>
                  </div>
                )}

                {showAddProvider && (
                  <AddProviderForm onSaved={handleProviderSaved} onCancel={() => setShowAddProvider(false)} />
                )}

                {providers && providers.length > 0 && !showAddProvider && (
                  <div className="m3e-provider-actions">
                    <button className="m3e-link-btn small" onClick={() => setShowAddProvider(true)}>
                      <Plus size={12} /> Tambah provider
                    </button>
                    <button className="m3e-link-btn small" onClick={() => setCurrentPage('ai-providers')}>
                      <Wand2 size={12} /> Kelola
                    </button>
                  </div>
                )}

                {!showAddProvider && (
                  <>
                    <label className="m3e-label">Deskripsi / Prompt Desain</label>
                    <textarea
                      className="m3e-textarea"
                      rows={5}
                      placeholder="Contoh: Halaman login app e-commerce dengan top app bar, form email & password, tombol Login M3, dan link Lupa password. Tema hijau emerald."
                      value={prompt}
                      onChange={(e) => { setPrompt(e.target.value); setGenError('') }}
                    />
                    {genError && (
                      <div className="m3e-gen-error"><AlertTriangle size={13} /> {genError}</div>
                    )}
                    <button
                      className="m3e-btn-generate"
                      onClick={handleGenerate}
                      disabled={generating || (!activeProvider && !noProvider)}
                    >
                      {generating
                        ? <><Loader2 size={14} className="spin" /> Generating…</>
                        : <><Wand2 size={14} /> Generate HTML</>}
                    </button>
                  </>
                )}
              </div>

              {/* Generated HTML Result */}
              {generatedHtml && (
                <div className="m3e-html-result">
                  <div className="m3e-html-result-head">
                    <span><Code2 size={13} /> Hasil HTML</span>
                    <div className="m3e-html-result-tabs">
                      <button className={`m3e-tab ${htmlPreviewMode === 'preview' ? 'active' : ''}`} onClick={() => setHtmlPreviewMode('preview')}>
                        <Eye size={12} /> Preview
                      </button>
                      <button className={`m3e-tab ${htmlPreviewMode === 'code' ? 'active' : ''}`} onClick={() => setHtmlPreviewMode('code')}>
                        <Code2 size={12} /> Kode
                      </button>
                    </div>
                  </div>
                  <div className="m3e-html-preview-box">
                    {htmlPreviewMode === 'preview' ? (
                      <iframe
                        ref={previewRef}
                        className="m3e-html-iframe"
                        title="HTML Preview"
                        srcDoc={generatedHtml}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    ) : (
                      <pre className="m3e-code-view"><code>{generatedHtml}</code></pre>
                    )}
                  </div>
                  <div className="m3e-html-actions">
                    <button className="m3e-action-btn" onClick={copyHtml}><Copy size={13} /> Salin</button>
                    <button className="m3e-action-btn" onClick={openHtmlInTab}><ExternalLink size={13} /> Tab Baru</button>
                    <button className="m3e-action-btn" onClick={downloadHtml}><Code2 size={13} /> Unduh</button>
                    <button className="m3e-action-btn danger" onClick={() => setGeneratedHtml('')}><Trash2 size={13} /> Hapus</button>
                  </div>
                </div>
              )}

              {/* Info sections */}
              <div className="m3e-info-section">
                <h4>Fungsi Utama</h4>
                <ul>
                  <li>Drag-and-drop komponen Material 3 Expressive</li>
                  <li>Desain layar HP dan Desktop</li>
                  <li>Hubungkan antar-layar dengan navigasi tap</li>
                  <li>Sesuaikan tema M3 Expressive (Warna, Bentuk, Typo)</li>
                  <li>Ekspor sebagai prompt coding AI (Vibe-coding)</li>
                  <li>Bagikan link dan kolaborasi</li>
                </ul>
              </div>

              <div className="m3e-info-section">
                <h4>Pintasan Keyboard</h4>
                <ul className="m3e-shortcuts">
                  <li><span>Pilih / Tangan</span> <kbd>V / H</kbd></li>
                  <li><span>Geser Canvas</span> <kbd>Space</kbd></li>
                  <li><span>Zoom &amp; Pan</span> <kbd>Wheel</kbd></li>
                  <li><span>Zoom in / out / fit</span> <kbd>+ - 0</kbd></li>
                  <li><span>Undo / Redo</span> <kbd>Ctrl+Z</kbd></li>
                  <li><span>Duplikat</span> <kbd>Ctrl+D</kbd></li>
                  <li><span>Geser Elemen</span> <kbd>Panah</kbd></li>
                  <li><span>Hapus</span> <kbd>Delete</kbd></li>
                  <li><span>Pratinjau</span> <kbd>P</kbd></li>
                </ul>
              </div>

              <div className="m3e-info-section">
                <p className="m3e-note">
                  <strong>Catatan:</strong> M3E Canvas berjalan langsung di browser kamu. Semua hasil karya tersimpan otomatis di localStorage browser.
                </p>
              </div>

              <div className="m3e-info-section">
                <a href="https://github.com/lnkiai/m3e-canvas" target="_blank" rel="noopener noreferrer" className="m3e-github-link">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  Repository GitHub
                </a>
              </div>
            </div>
          )}
        </aside>

        {/* Canvas iframe */}
        <div className="m3e-canvas-wrapper">
          <iframe
            src="https://lnkiai.github.io/m3e-canvas/"
            className="m3e-canvas-iframe"
            title="M3E Canvas - Material 3 Expressive UI Builder"
            allow="clipboard-write; clipboard-read; storage-access"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals allow-presentation"
          />
        </div>

        {/* Floating expand button */}
        {sidebarCollapsed && (
          <button className="m3e-expand-btn" onClick={() => setSidebarCollapsed(false)} title="Perlebar sidebar">
            <PanelLeftOpen size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
