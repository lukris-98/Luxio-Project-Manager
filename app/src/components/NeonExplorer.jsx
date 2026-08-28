import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, KeyRound, LogIn, LogOut, RefreshCw, Plus, Trash2, X, Check, Play, Pause, Copy, FolderOpen, GitBranch, Server, HardDrive, Activity, KeySquare, Globe, ChevronDown, ChevronRight, Loader2, Save, ExternalLink, Circle } from 'lucide-react'
import { api } from '../services/api'
import './NeonExplorer.css'

// =====================================================================
// NeonExplorer — Explorer lengkap API Neon (console.neon.tech/api/v2).
// =====================================================================
// - Login dengan API key. Verifikasi via GET /users/me.
// - Tab: Ringkasan, Project, Branch, Endpoint, Konsumsi, API Key, Raw.
// - SEMUA panggilan lewat BACKEND PROXY (/api/owner/neon/proxy) karena
//   API Neon tidak mengizinkan CORS dari browser (origin aplikasi).
// - Bila key lokal kosong, backend otomatis memakai env NEON_API_KEY.
// =====================================================================

const NEON_BASE = 'https://console.neon.tech/api/v2'

const TABS = [
  { id: 'overview', label: 'Ringkasan', icon: Activity },
  { id: 'projects', label: 'Project', icon: FolderOpen },
  { id: 'branches', label: 'Branch', icon: GitBranch },
  { id: 'endpoints', label: 'Endpoint', icon: Server },
  { id: 'consumption', label: 'Konsumsi', icon: HardDrive },
  { id: 'api-keys', label: 'API Key', icon: KeySquare },
  { id: 'raw', label: 'Raw API', icon: Globe },
]

function fmtDate(ts) {
  if (!ts) return '-'
  try { return new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return ts }
}

function fmtBytes(b) {
  if (b == null) return '-'
  const gb = b / 1e9
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`
}

export default function NeonExplorer({ savedApiKey, onSaveApiKey }) {
  const [apiKey, setApiKey] = useState(savedApiKey || '')
  const [inputKey, setInputKey] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [me, setMe] = useState(null)
  const [tab, setTab] = useState('overview')

  // Data caches
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [branches, setBranches] = useState([])
  const [endpoints, setEndpoints] = useState([])
  const [consumption, setConsumption] = useState(null)
  const [apiKeys, setApiKeys] = useState([])
  const [regions, setRegions] = useState([])
  const [operations, setOperations] = useState([])
  const [databases, setDatabases] = useState([])
  const [roles, setRoles] = useState([])
  const [snapshots, setSnapshots] = useState([])

  const [projectDetail, setProjectDetail] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)

  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')

  const [showRaw, setShowRaw] = useState(false)

  const flash = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  // Helper: panggil API Neon VIA BACKEND PROXY (hindari CORS console.neon.tech).
  // Key dari input user dikirim ke backend; bila kosong, backend pakai NEON_API_KEY env.
  const call = useCallback(async (method, path, body) => {
    const res = await api.neonProxy(method, path, body, apiKey)
    if (res.status >= 400) {
      const msg = res.data?.message || res.data?.error || res.data?.error_code || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return res.data
  }, [apiKey])

  // ---------- LOGIN ----------
  const doLogin = async () => {
    const key = (inputKey || apiKey || '').trim()
    if (!key) { setError('Masukkan API key Neon terlebih dahulu.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.neonProxy('GET', '/users/me', null, key)
      if (res.status >= 400) {
        throw new Error(res.data?.message || res.data?.error || 'API key tidak valid')
      }
      setMe(res.data)
      setApiKey(key)
      setLoggedIn(true)
      onSaveApiKey?.(key)
      setInputKey('')
      loadAll(key)
      flash('Berhasil masuk ke Neon')
    } catch (e) {
      setError(e.message || 'Gagal login ke Neon')
    } finally {
      setLoading(false)
    }
  }

  const doLogout = () => {
    setLoggedIn(false); setMe(null)
    setProjects([]); setSelectedProject(null); setBranches([]); setEndpoints([])
    setConsumption(null); setApiKeys([]); setRegions([]); setOperations([])
    setDatabases([]); setRoles([]); setSnapshots([]); setProjectDetail(null); setRawResponse(null)
  }

  // ---------- LOAD ALL ----------
  const loadAll = async (key = apiKey) => {
    const k = key || apiKey
    if (!k) return
    setBusy('memuat')
    setError('')
    try {
      const [p, r, c] = await Promise.allSettled([
        call('GET', '/projects'),
        call('GET', '/regions'),
        call('GET', '/consumption_history/v2/projects?limit=1'),
      ])
      if (p.status === 'fulfilled' && p.value.projects) setProjects(p.value.projects)
      if (r.status === 'fulfilled' && r.value.regions) setRegions(r.value.regions)
      if (c.status === 'fulfilled' && c.value.projects) setConsumption(c.value.projects[0])
      // API keys (mungkin 403 utk user biasa)
      try {
        const ak = await call('GET', '/api_keys')
        if (ak.api_keys) setApiKeys(ak.api_keys)
      } catch { /* noop */ }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  // ---------- PROJECT ----------
  const loadProjectDetail = async (projectId) => {
    setSelectedProject(projectId)
    setBusy('project')
    try {
      const [detail, br, ep, ops, snap] = await Promise.allSettled([
        call('GET', `/projects/${projectId}`),
        call('GET', `/projects/${projectId}/branches`),
        call('GET', `/projects/${projectId}/endpoints`),
        call('GET', `/projects/${projectId}/operations`),
        call('GET', `/projects/${projectId}/snapshots`),
      ])
      if (detail.status === 'fulfilled') setProjectDetail(detail.value.project)
      if (br.status === 'fulfilled') setBranches(br.value.branches || [])
      if (ep.status === 'fulfilled') setEndpoints(ep.value.endpoints || [])
      if (ops.status === 'fulfilled') setOperations(ops.value.operations || [])
      if (snap.status === 'fulfilled') setSnapshots(snap.value.snapshots || [])
      if (branches.length > 0) loadBranchDetail(projectId, branches[0].id)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const loadBranchDetail = async (projectId, branchId) => {
    try {
      const [db, rl] = await Promise.allSettled([
        call('GET', `/projects/${projectId}/branches/${branchId}/databases`),
        call('GET', `/projects/${projectId}/branches/${branchId}/roles`),
      ])
      if (db.status === 'fulfilled') setDatabases(db.value.databases || [])
      if (rl.status === 'fulfilled') setRoles(rl.value.roles || [])
    } catch { /* noop */ }
  }

  const createProject = async () => {
    const name = window.prompt('Nama project baru:')
    if (!name) return
    setBusy('create-project')
    try {
      await call('POST', '/projects', { project: { name, region_id: 'aws-us-east-2' } })
      flash('Project dibuat')
      loadAll()
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const deleteProject = async (projectId) => {
    if (!window.confirm('Hapus project ini? Data akan dihapus permanen.')) return
    setBusy('delete-project')
    try {
      await call('DELETE', `/projects/${projectId}`)
      flash('Project dihapus')
      loadAll()
      if (selectedProject === projectId) { setSelectedProject(null); setBranches([]); setEndpoints([]) }
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const createBranch = async (projectId) => {
    setBusy('create-branch')
    try {
      await call('POST', `/projects/${projectId}/branches`, { branch: {} })
      flash('Branch dibuat')
      loadProjectDetail(projectId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const deleteBranch = async (projectId, branchId) => {
    if (!window.confirm('Hapus branch ini?')) return
    setBusy('delete-branch')
    try {
      await call('DELETE', `/projects/${projectId}/branches/${branchId}`)
      flash('Branch dihapus')
      loadProjectDetail(projectId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const createDatabase = async (projectId, branchId) => {
    const name = window.prompt('Nama database baru:')
    if (!name) return
    setBusy('create-db')
    try {
      await call('POST', `/projects/${projectId}/branches/${branchId}/databases`, { database: { name } })
      flash('Database dibuat')
      loadBranchDetail(projectId, branchId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const deleteDatabase = async (projectId, branchId, dbName) => {
    if (!window.confirm(`Hapus database ${dbName}?`)) return
    setBusy('delete-db')
    try {
      await call('DELETE', `/projects/${projectId}/branches/${branchId}/databases/${dbName}`)
      flash('Database dihapus')
      loadBranchDetail(projectId, branchId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const createRole = async (projectId, branchId) => {
    const name = window.prompt('Nama role baru:')
    if (!name) return
    setBusy('create-role')
    try {
      await call('POST', `/projects/${projectId}/branches/${branchId}/roles`, { role: { name } })
      flash('Role dibuat')
      loadBranchDetail(projectId, branchId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const deleteRole = async (projectId, branchId, roleName) => {
    if (!window.confirm(`Hapus role ${roleName}?`)) return
    setBusy('delete-role')
    try {
      await call('DELETE', `/projects/${projectId}/branches/${branchId}/roles/${roleName}`)
      flash('Role dihapus')
      loadBranchDetail(projectId, branchId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const endpointAction = async (projectId, endpointId, action) => {
    setBusy(`ep-${action}`)
    try {
      await call('POST', `/projects/${projectId}/endpoints/${endpointId}/${action}`)
      flash(action === 'start' ? 'Endpoint dijalankan' : 'Endpoint di-suspend')
      loadProjectDetail(projectId)
    } catch (e) { setError(e.message) } finally { setBusy('') }
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text || '').catch(() => {})
    flash('Disalin')
  }

  // Raw API: panggilan manual.
  const [rawMethod, setRawMethod] = useState('GET')
  const [rawPath, setRawPath] = useState('/projects')
  const [rawBody, setRawBody] = useState('')
  const [rawResult, setRawResult] = useState(null)

  const runRaw = async () => {
    if (!apiKey) return
    setBusy('raw')
    setRawResult(null)
    try {
      let body
      try { body = rawBody.trim() ? JSON.parse(rawBody) : undefined } catch { setError('Body JSON tidak valid'); setBusy(''); return }
      const data = await call(rawMethod, rawPath.trim(), body)
      setRawResult(data)
    } catch (e) {
      setRawResult({ error: e.message })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="neon-explorer">
      {/* ===== Login gate ===== */}
      {!loggedIn ? (
        <div className="neon-login">
          <div className="neon-login-icon"><Database size={40} /></div>
          <h3>Masuk ke Neon</h3>
          <p>Masukkan API key Neon untuk memantau project, kuota, dan semua data akun kamu.</p>
          <p className="neon-login-hint">
            Buat API key di <strong>Neon Console → Account → API Keys</strong>. Key sudah melewati
            verifikasi 2FA akunmu sehingga aman dipakai di sini. Base URL: <code>https://console.neon.tech/api/v2</code>
          </p>
          <div className="neon-login-input">
            <KeyRound size={16} />
            <input
              type="password"
              className="input"
              placeholder="NEON_API_KEY (ntrn_...)"
              value={inputKey || apiKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doLogin() }}
            />
          </div>
          {savedApiKey && (
            <p className="neon-login-saved">Key tersimpan di perangkat. Klik "Masuk" untuk lanjut.</p>
          )}
          {error && <p className="neon-error">{error}</p>}
          <button className="btn btn-primary" onClick={doLogin} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
            {loading ? 'Menghubungkan…' : 'Masuk ke Neon'}
          </button>
          <a className="neon-doc-link" href="https://neon.tech/docs/reference/api" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Dokumentasi API Neon
          </a>
        </div>
      ) : (
        <div className="neon-explorer-body">
          {/* Header */}
          <div className="neon-header">
            <div className="neon-header-left">
              <Database size={18} />
              <div>
                <h3>Neon Explorer</h3>
                <span className="neon-me">
                  {me?.email || 'Terhubung'} · <strong>{me?.plan || '-'}</strong>
                </span>
              </div>
            </div>
            <div className="neon-header-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => loadAll()} disabled={busy === 'memuat'}>
                <RefreshCw size={14} className={busy === 'memuat' ? 'spin' : ''} /> Muat Ulang
              </button>
              <button className="btn btn-secondary btn-sm" onClick={doLogout}>
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </div>

          {error && <p className="neon-error">{error}</p>}

          {/* Tabs */}
          <div className="neon-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`neon-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* ===== Overview ===== */}
          {tab === 'overview' && (
            <div className="neon-panel">
              <div className="neon-cards">
                <div className="neon-card">
                  <span className="neon-card-label">Project</span>
                  <span className="neon-card-value">{projects.length}</span>
                </div>
                <div className="neon-card">
                  <span className="neon-card-label">Region</span>
                  <span className="neon-card-value">{regions.length}</span>
                </div>
                <div className="neon-card">
                  <span className="neon-card-label">API Key</span>
                  <span className="neon-card-value">{apiKeys.length}</span>
                </div>
                <div className="neon-card">
                  <span className="neon-card-label">Plan</span>
                  <span className="neon-card-value">{me?.plan || '-'}</span>
                </div>
              </div>

              <div className="neon-account-info">
                <h4>Info Akun (GET /users/me)</h4>
                <div className="neon-kv">
                  <span>ID</span><code>{me?.id || '-'}</code>
                  <span>Email</span><code>{me?.email || '-'}</code>
                  <span>Nama</span><code>{me?.name || '-'}</code>
                  <span>Plan</span><code>{me?.plan || '-'}</code>
                  <span>Kelas</span><code>{me?.billing_plan || me?.org_id ? 'Organization' : 'Personal'}</code>
                  <span>Default Branch Limit</span><code>{me?.default_branch_limit || '-'}</code>
                  <span>Default Project Limit</span><code>{me?.default_project_limit || '-'}</code>
                  <span>Max Project</span><code>{me?.max_project_limit || '-'}</code>
                </div>
              </div>

              {consumption && (
                <div className="neon-consumption-summary">
                  <h4>Konsumsi Bulan Ini</h4>
                  {consumption.data && (
                    <div className="neon-cards">
                      <div className="neon-card">
                        <span className="neon-card-label">Storage</span>
                        <span className="neon-card-value">
                          {fmtBytes(consumption.data.reduce((s, d) => s + (d.data_storage_bytes_hour || 0), 0))}
                        </span>
                      </div>
                      <div className="neon-card">
                        <span className="neon-card-label">Compute</span>
                        <span className="neon-card-value">
                          {(consumption.data.reduce((s, d) => s + (d.compute_time_seconds || 0), 0) / 3600).toFixed(2)} jam
                        </span>
                      </div>
                      <div className="neon-card">
                        <span className="neon-card-label">Synthetic Monitor</span>
                        <span className="neon-card-value">
                          {consumption.data.reduce((s, d) => s + (d.synthetic_storage_seconds_hour || 0), 0)}
                        </span>
                      </div>
                      <div className="neon-card">
                        <span className="neon-card-label">Data Transfer</span>
                        <span className="neon-card-value">
                          {fmtBytes(consumption.data.reduce((s, d) => s + (d.data_transfer_bytes || 0), 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== Projects ===== */}
          {tab === 'projects' && (
            <div className="neon-panel">
              <div className="neon-panel-head">
                <h4>Project</h4>
                <button className="btn btn-primary btn-sm" onClick={createProject} disabled={busy}>
                  <Plus size={14} /> Buat Project
                </button>
              </div>
              {projects.length === 0 && <p className="neon-empty">Belum ada project.</p>}
              {projects.map((p) => (
                <div key={p.id} className={`neon-project-row ${selectedProject === p.id ? 'active' : ''}`}>
                  <button className="neon-project-main" onClick={() => loadProjectDetail(p.id)}>
                    <div className="neon-project-icon"><FolderOpen size={16} /></div>
                    <div className="neon-project-info">
                      <span className="neon-project-name">{p.name}</span>
                      <span className="neon-project-meta">
                        {p.region_id} · {p.created_at ? fmtDate(p.created_at) : '-'} · status: {p.status}
                      </span>
                    </div>
                  </button>
                  <div className="neon-project-actions">
                    <button className="vault-btn" onClick={() => copyText(p.connection_uri || '')} title="Salin connection string">
                      <Copy size={14} />
                    </button>
                    <button className="vault-btn vault-btn-danger" onClick={() => deleteProject(p.id)} title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== Branch & Database & Role (per project terpilih) ===== */}
          {tab === 'branches' && (
            <div className="neon-panel">
              <div className="neon-panel-head">
                <h4>Branch & Database</h4>
                {selectedProject && (
                  <button className="btn btn-primary btn-sm" onClick={() => createBranch(selectedProject)} disabled={busy}>
                    <Plus size={14} /> Buat Branch
                  </button>
                )}
              </div>
              {!selectedProject && <p className="neon-empty">Pilih project dulu di tab Project.</p>}
              {branches.length === 0 && selectedProject && <p className="neon-empty">Belum ada branch.</p>}
              {branches.map((b) => {
                const branchDatabases = databases
                const branchRoles = roles
                return (
                  <div key={b.id} className="neon-branch">
                    <div className="neon-branch-head">
                      <div>
                        <span className="neon-branch-name">
                          {b.name} {b.primary && <span className="neon-badge">primary</span>}
                          {b.default && <span className="neon-badge">default</span>}
                        </span>
                        <span className="neon-branch-meta">ID: {b.id} · {fmtDate(b.created_at)}</span>
                      </div>
                      <button className="vault-btn vault-btn-danger" onClick={() => deleteBranch(selectedProject, b.id)} title="Hapus branch">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="neon-branch-detail">
                      <div className="neon-sub-block">
                        <div className="neon-sub-head">
                          <span>Database</span>
                          <button className="btn btn-secondary btn-sm" onClick={() => createDatabase(selectedProject, b.id)} disabled={busy}>
                            <Plus size={12} /> Tambah
                          </button>
                        </div>
                        {branchDatabases.map((db) => (
                          <div key={db.name} className="neon-db-row">
                            <span><Circle size={8} fill="currentColor" /> {db.name}</span>
                            <span className="neon-db-actions">
                              <code className="neon-db-owner">{db.owner_name}</code>
                              <button className="vault-btn vault-btn-danger" onClick={() => deleteDatabase(selectedProject, b.id, db.name)} title="Hapus">
                                <X size={12} />
                              </button>
                            </span>
                          </div>
                        ))}
                        {branchDatabases.length === 0 && <p className="neon-empty">Belum ada database.</p>}
                      </div>
                      <div className="neon-sub-block">
                        <div className="neon-sub-head">
                          <span>Role</span>
                          <button className="btn btn-secondary btn-sm" onClick={() => createRole(selectedProject, b.id)} disabled={busy}>
                            <Plus size={12} /> Tambah
                          </button>
                        </div>
                        {branchRoles.map((r) => (
                          <div key={r.name} className="neon-db-row">
                            <span><Circle size={8} fill="currentColor" /> {r.name}</span>
                            <span className="neon-db-actions">
                              <code className="neon-db-owner">{r.branch_id ? 'branch' : '-'}</code>
                              <button className="vault-btn vault-btn-danger" onClick={() => deleteRole(selectedProject, b.id, r.name)} title="Hapus">
                                <X size={12} />
                              </button>
                            </span>
                          </div>
                        ))}
                        {branchRoles.length === 0 && <p className="neon-empty">Belum ada role.</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ===== Endpoints ===== */}
          {tab === 'endpoints' && (
            <div className="neon-panel">
              <div className="neon-panel-head"><h4>Compute Endpoint</h4></div>
              {!selectedProject && <p className="neon-empty">Pilih project dulu di tab Project.</p>}
              {endpoints.length === 0 && selectedProject && <p className="neon-empty">Belum ada endpoint.</p>}
              {endpoints.map((ep) => (
                <div key={ep.id} className="neon-endpoint-row">
                  <div className="neon-endpoint-info">
                    <span className={`neon-dot ${ep.state === 'active' ? 'on' : ep.state === 'suspended' ? 'off' : 'mid'}`} />
                    <div>
                      <span className="neon-project-name">{ep.id}</span>
                      <span className="neon-project-meta">
                        {ep.type} · {ep.region_id} · {ep.state} · {ep.host}
                      </span>
                    </div>
                  </div>
                  <div className="neon-endpoint-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={ep.state === 'active' || busy}
                      onClick={() => endpointAction(selectedProject, ep.id, 'start')}
                    >
                      <Play size={12} /> Start
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={ep.state !== 'active' || busy}
                      onClick={() => endpointAction(selectedProject, ep.id, 'suspend')}
                    >
                      <Pause size={12} /> Suspend
                    </button>
                    <button className="vault-btn" onClick={() => copyText(ep.host)} title="Salin host"><Copy size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== Consumption ===== */}
          {tab === 'consumption' && (
            <div className="neon-panel">
              <div className="neon-panel-head">
                <h4>Konsumsi (GET /consumption_history/v2/projects)</h4>
                <button className="btn btn-secondary btn-sm" onClick={() => loadAll()} disabled={busy}>
                  <RefreshCw size={14} className={busy ? 'spin' : ''} /> Muat
                </button>
              </div>
              {!consumption && <p className="neon-empty">Belum ada data konsumsi.</p>}
              {consumption && (
                <>
                  <div className="neon-kv">
                    <span>Project ID</span><code>{consumption.project_id || '-'}</code>
                    <span>Periode</span><code>{consumption.period_start ? `${fmtDate(consumption.period_start)} → ${fmtDate(consumption.period_end)}` : '-'}</code>
                    <span>Jumlah data poin</span><code>{(consumption.data || []).length}</code>
                  </div>
                  {consumption.data && (
                    <div className="neon-consumption-table">
                      <table className="owner-table">
                        <thead>
                          <tr>
                            <th>Waktu</th>
                            <th>Storage (GB)</th>
                            <th>Compute (detik)</th>
                            <th>Data Transfer (MB)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consumption.data.map((d, i) => (
                            <tr key={i}>
                              <td>{d.measured_at ? fmtDate(d.measured_at) : '-'}</td>
                              <td>{(d.data_storage_bytes_hour || 0) / 1e9}</td>
                              <td>{d.compute_time_seconds || 0}</td>
                              <td>{((d.data_transfer_bytes || 0) / 1e6).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== API Keys ===== */}
          {tab === 'api-keys' && (
            <div className="neon-panel">
              <div className="neon-panel-head"><h4>API Key Neon (GET /api_keys)</h4></div>
              {apiKeys.length === 0 && <p className="neon-empty">Belum ada API key terdaftar (atau tidak punya akses).</p>}
              {apiKeys.map((k) => (
                <div key={k.id} className="neon-api-key-row">
                  <div>
                    <span className="neon-project-name">{k.name || '-'}</span>
                    <span className="neon-project-meta">ID: {k.id} · dibuat {k.created_at ? fmtDate(k.created_at) : '-'}</span>
                  </div>
                  <code className="neon-api-key-id">{k.id.slice(0, 12)}…</code>
                </div>
              ))}
            </div>
          )}

          {/* ===== Raw API ===== */}
          {tab === 'raw' && (
            <div className="neon-panel">
              <div className="neon-panel-head">
                <h4>Neon API Playground</h4>
                <p className="neon-raw-hint">Panggil endpoint API Neon secara manual. Base URL otomatis: <code>{NEON_BASE}</code></p>
              </div>
              <div className="neon-raw-form">
                <select className="input neon-raw-method" value={rawMethod} onChange={(e) => setRawMethod(e.target.value)}>
                  {['GET', 'POST', 'PATCH', 'DELETE', 'PUT'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  className="input"
                  placeholder="/projects  |  /projects/{id}/branches  |  /users/me"
                  value={rawPath}
                  onChange={(e) => setRawPath(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') runRaw() }}
                />
                <button className="btn btn-primary btn-sm" onClick={runRaw} disabled={busy === 'raw' || !apiKey}>
                  {busy === 'raw' ? <Loader2 size={14} className="spin" /> : <Play size={14} />} Jalankan
                </button>
              </div>
              <div className="input-group">
                <label className="input-label">Body (JSON, opsional)</label>
                <textarea
                  className="input neon-raw-body"
                  rows={3}
                  placeholder='{ "project": { "name": "contoh", "region_id": "aws-us-east-2" } }'
                  value={rawBody}
                  onChange={(e) => setRawBody(e.target.value)}
                />
              </div>
              {rawResult && (
                <div className="neon-raw-result">
                  <span className="item-label">Respons</span>
                  <pre className="owner-pre">{JSON.stringify(rawResult, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {toast && (
            <div className="neon-toast">
              <Check size={14} /> {toast}
            </div>
          )}
        </div>
      )}
    </div>
  )
}