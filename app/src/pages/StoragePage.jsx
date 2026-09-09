// =====================================================================
// StoragePage.jsx — Halaman "Penyimpanan": kelola layanan cloud storage.
// =====================================================================
// 2 tab dengan behavior sama (gate 2 langkah → dashboard kelola):
// Gate: kode OTP email owner + PIN owner berurutan (StorageGate2fa).
// Sesi unlock tersimpan di localStorage terikat user — tahan refresh &
// pindah halaman; berakhir saat logout / klik "Keluar".
//   1. NEON    — login akun Neon via API key, kelola project, branch,
//                endpoint, database, role, snapshot, API key, konsumsi,
//                dan riwayat operasi (sesuai dokumentasi Neon API v2).
//   2. BACKBLAZE — login keyID + applicationKey, kelola bucket & file
//                (list/upload/unduh/hapus) via B2 API v2.
// Kredensial disimpan lokal per browser (keyname per halaman; tidak ikut
// persist store agar tidak ikut backup).
// =====================================================================

import { Component, useCallback, useEffect, useState } from 'react'
import {
  Database, KeyRound, LogOut, RefreshCw, Plus, Trash2, ExternalLink,
  HardDrive, Layers, Server, Boxes, Activity, Loader2, FolderOpen,
  UploadCloud, Download, ChevronDown, Play, PauseCircle, UserRound,
  AlertTriangle, ShieldCheck, ScrollText, Lock, Send, GitBranch,
} from 'lucide-react'
import {
  getNeonKey, setNeonKey, isNeonLoggedIn, neonFetch, ensureNeonAppSession,
  getMe, listApiKeys, createApiKey, revokeApiKey,
  listProjects, createProject, deleteProject,
  listBranches, createBranch, deleteBranch,
  listEndpoints, startEndpoint, suspendEndpoint,
  listDatabases, createDatabase, deleteDatabase,
  listRoles, createRole, deleteRole,
  listSnapshots, createSnapshot,
  listOperations, getProjectConsumption,
} from '../services/neonApi'
import {
  getB2Session, isB2LoggedIn, b2Authorize, b2Logout, B2_APP_CREDENTIALS,
  b2EnsureAppSession, listBuckets, createBucket, deleteBucket,
  listFileNames, uploadFile, deleteFileVersion, downloadFileViaProxy,
} from '../services/b2Api'
import { api } from '../services/api'
import { useStore } from '../store/useStore'
import {
  isStorageUnlocked, setStorageUnlocked, getPinChallenge,
  setPinChallenge, clearPinChallenge, clearStorageSession,
} from '../services/storageSession'
import './StoragePage.css'

export default function StoragePage() {
  // Gate 2 langkah: klik halaman Penyimpanan → wajib kode email (2FA),
  // lalu PIN owner, sebelum isi halaman tampil. Setelah lolos, sesi
  // bertahan lintas refresh/halaman sampai logout atau klik "Keluar".
  const { currentUser } = useStore()
  const uid = currentUser?.id || currentUser?.email || ''
  const [verified, setVerified] = useState(() => isStorageUnlocked(uid))

  useEffect(() => {
    setVerified(isStorageUnlocked(uid))
  }, [uid])

  // Autologin Neon & B2 begitu lolos 2FA.
  useEffect(() => {
    if (!verified) return
    ensureNeonAppSession()
    b2EnsureAppSession().catch(() => {})
  }, [verified])

  const [tab, setTab] = useState('neon') // 'neon' | 'b2' | 'hf'
  if (!verified) return <StorageGate2fa userId={uid} onVerified={() => setVerified(true)} />

  const handleExit = () => {
    clearStorageSession()
    setVerified(false)
  }

  return (
    <div className="storage-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1><HardDrive size={22} /> Penyimpanan</h1>
          <p>Kelola database, penyimpanan file, dan log backend dalam satu tempat.</p>
        </div>
        <div className="storage-tabs" role="tablist">
          <button className={`storage-tab ${tab === 'neon' ? 'active' : ''}`} onClick={() => setTab('neon')} role="tab">
            <Database size={15} /> Database
          </button>
          <button className={`storage-tab ${tab === 'b2' ? 'active' : ''}`} onClick={() => setTab('b2')} role="tab">
            <Boxes size={15} /> File
          </button>
          <button className={`storage-tab ${tab === 'hf' ? 'active' : ''}`} onClick={() => setTab('hf')} role="tab">
            <ScrollText size={15} /> Backend
          </button>
          <button className="storage-tab storage-exit" onClick={handleExit} title="Kunci halaman Penyimpanan (butuh 2 langkah lagi untuk masuk)">
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>
      <StorageBoundary key={tab}>
        {tab === 'neon' && <NeonPanel />}
        {tab === 'b2' && <B2Panel />}
        {tab === 'hf' && <HfLogsPanel />}
      </StorageBoundary>
    </div>
  )
}

/* =====================================================================
   ERROR BOUNDARY — kegagalan data panel tidak boleh membuat website
   blank; tampilkan kartu error + tombol coba lagi.
   ===================================================================== */

class StorageBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: '' }
  }

  static getDerivedStateFromError(err) {
    return { error: err?.message || 'Terjadi kesalahan tak terduga.' }
  }

  componentDidCatch(err) {
    console.error('[StoragePage] panel crash:', err)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="storage-gate">
          <div className="storage-gate-card b2">
            <div className="storage-gate-logo b2"><AlertTriangle size={30} /></div>
            <h2>Panel gagal dimuat</h2>
            <p>{this.state.error}</p>
            <button className="btn btn-primary storage-login-btn" onClick={() => this.setState({ error: '' })}>
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* =====================================================================
   GATE KEAMANAN 2 LANGKAH — (1) kode OTP email owner, (2) PIN owner.
   Keduanya wajib lolos berurutan sebelum halaman terbuka.
   ===================================================================== */

function StorageGate2fa({ userId, onVerified }) {
  // 'send' → kirim kode · 'verify' → input kode OTP · 'pin' → input PIN owner
  const [stage, setStage] = useState(() => (getPinChallenge(userId) ? 'pin' : 'send'))
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [challenge, setChallenge] = useState(() => getPinChallenge(userId)?.challenge || '')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const stepNo = stage === 'pin' ? 2 : 1

  const send = async () => {
    setBusy(true); setError(''); setInfo('')
    try {
      await api.sendStorage2fa()
      setInfo(`Kode verifikasi sudah dikirim ke email kamu. Berlaku 5 menit.`)
      setStage('verify')
    } catch (e) {
      setError(e.message || 'Gagal mengirim kode.')
    } finally { setBusy(false) }
  }

  const verify = async (e) => {
    e?.preventDefault?.()
    if (!code.trim()) return setError('Masukkan kode verifikasi.')
    setBusy(true); setError('')
    try {
      const res = await api.verifyStorage2fa(code.trim())
      if (!res?.ok || !res.pin_challenge) {
        setError('Kode diterima tapi sesi PIN tidak aktif. Kirim ulang kode email.')
        return
      }
      setPinChallenge(userId, res.pin_challenge, res.pin_expires_in || 600)
      setChallenge(res.pin_challenge)
      setCode('')
      setInfo('')
      setStage('pin')
    } catch (e) {
      setError(e.message || 'Kode salah atau kadaluarsa.')
    } finally { setBusy(false) }
  }

  const verifyPin = async (e) => {
    e?.preventDefault?.()
    if (pin.length < 4) return setError('Masukkan PIN owner (4-6 digit).')
    setBusy(true); setError(''); setInfo('')
    try {
      const res = await api.verifyStoragePin(pin, challenge)
      if (!res?.ok) {
        setError(res?.message || 'PIN salah.')
        if (res?.challenge_invalid) {
          clearPinChallenge()
          setChallenge('')
          setStage('send')
        }
        return
      }
      setStorageUnlocked(userId)
      clearPinChallenge()
      onVerified()
    } catch (e) {
      setError(e.message || 'Gagal memverifikasi PIN. Terlalu sering coba? Tunggu sebentar.')
    } finally { setBusy(false) }
  }

  return (
    <div className="storage-gate">
      <div className="storage-gate-card neon">
        <div className="storage-gate-logo b2"><ShieldCheck size={30} /></div>
        <h2>Verifikasi Keamanan</h2>
        <p>
          Halaman ini bersifat privat dan memerlukan <strong>2 langkah</strong>:
          kode verifikasi dari email kamu, lalu PIN owner.
        </p>
        {stage === 'pin' ? (
          <form onSubmit={verifyPin} className="storage-gate-form">
            <div className="input-group">
              <label className="input-label" htmlFor="storage-pin-input">Langkah {stepNo}/2 — PIN Owner (4-6 digit)</label>
              <input
                id="storage-pin-input" className="input" type="password" inputMode="numeric" maxLength={6}
                placeholder="••••" value={pin} autoFocus
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
              />
            </div>
            {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
            <button type="submit" className="btn btn-primary storage-login-btn" disabled={busy || pin.length < 4}>
              {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />} Buka Penyimpanan
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => {
              clearPinChallenge()
              setChallenge(''); setStage('send'); setError(''); setInfo('')
            }} disabled={busy}>Ganti kode email</button>
          </form>
        ) : stage === 'send' ? (
          <>
            <p className="storage-gate-note">Langkah {stepNo}/2 — kirim kode verifikasi email.</p>
            <button className="btn btn-primary storage-login-btn" onClick={send} disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {busy ? 'Mengirim kode…' : 'Kirim Kode Verifikasi'}
            </button>
          </>
        ) : (
          <form onSubmit={verify} className="storage-gate-form">
            <div className="input-group">
              <label className="input-label" htmlFor="storage-2fa-code">Langkah {stepNo}/2 — Kode Verifikasi (6 digit)</label>
              <input
                id="storage-2fa-code" className="input" inputMode="numeric" maxLength={6}
                placeholder="••••••" value={code} autoFocus
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              />
            </div>
            {info && <small className="storage-gate-note">{info}</small>}
            {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
            <button type="submit" className="btn btn-primary storage-login-btn" disabled={busy || code.length < 4}>
              {busy ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={16} />} Lanjut ke PIN
            </button>
            <button type="button" className="btn btn-ghost" onClick={send} disabled={busy}>Kirim ulang kode</button>
          </form>
        )}
        {error && stage === 'send' && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
      </div>
    </div>
  )
}

/* =====================================================================
   PANEL BACKEND HF — log Space (run/build) via API resmi HF.
   ===================================================================== */

function HfLogsPanel() {
  // Dua sub-tab terpisah: Container (run) & Build — masing-masing punya
  // isi log sendiri (cache per tab) dan auto-refresh aktif untuk tab aktif.
  const [tab, setTab] = useState('run') // 'run' | 'build'
  const [logsBy, setLogsBy] = useState({ run: '', build: '' })
  const [loadedOnce, setLoadedOnce] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(true)

  const load = useCallback(async (s = tab) => {
    setLoading(true); setError('')
    try {
      const res = await api.getHfLogs(s, 300)
      if (!res.ok) throw new Error(res.error || 'Gagal mengambil log.')
      setLogsBy((prev) => ({ ...prev, [s]: res.logs || '(kosong)' }))
      setLoadedOnce((prev) => ({ ...prev, [s]: true }))
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { if (!loadedOnce[tab]) load(tab) }, [tab, loadedOnce, load])
  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => load(tab), 8000)
    return () => clearInterval(id)
  }, [auto, tab, load])

  const logs = logsBy[tab]

  return (
    <div className="storage-dash">
      <div className="storage-dash-bar">
        <div className="storage-dash-account">
          <span className="storage-avatar hf"><ScrollText size={17} /></span>
          <div>
            <strong>Log Server</strong>
            <small>Container &amp; build · read-only</small>
          </div>
        </div>
        <div className="storage-dash-bar-actions">
          <div className="hf-log-tabs">
            <button
              className={`hf-log-tab ${tab === 'run' ? 'active' : ''}`}
              onClick={() => setTab('run')}
            >
              Container
            </button>
            <button
              className={`hf-log-tab ${tab === 'build' ? 'active' : ''}`}
              onClick={() => setTab('build')}
            >
              Build
            </button>
          </div>
          <button className={`btn btn-ghost ${auto ? 'active' : ''}`} onClick={() => setAuto((a) => !a)} title="Auto refresh 8 detik">
            {auto ? 'Auto: ON' : 'Auto: OFF'}
          </button>
          <button className="btn btn-ghost" onClick={() => load()} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Muat ulang
          </button>
        </div>
      </div>
      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
      <pre className="hf-log-box">{(loading && !logs) ? 'Memuat log…' : logs || '(kosong)'}</pre>
    </div>
  )
}

/* =====================================================================
   PANEL NEON (Database Cloud Neon.tech)
   ===================================================================== */

function NeonPanel() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'fail' | 'need_key'
  const [error, setError] = useState('')
  const [customKey, setCustomKey] = useState('')
  const [savingKey, setSavingKey] = useState(false)

  const check = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      await getMe()
      setStatus('ok')
    } catch (e) {
      setError(e.message)
      if (e.message?.includes('503') || e.code === 'UNAUTHORIZED' || e.message?.includes('tidak valid')) {
        setStatus('need_key')
      } else {
        setStatus('fail')
      }
    }
  }, [])

  useEffect(() => { check() }, [check])

  const handleSaveConfigKey = async (e) => {
    e.preventDefault()
    if (!customKey.trim()) return
    setSavingKey(true); setError('')
    try {
      await api.updateOwnerConfig('neon', { api_key: customKey.trim() })
      setCustomKey('')
      await check()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan API Key.')
    } finally {
      setSavingKey(false)
    }
  }

  if (status === 'loading') {
    return <div className="storage-empty"><Loader2 size={16} className="spin" /> Menyambungkan ke Neon Cloud API…</div>
  }

  if (status === 'need_key') {
    return (
      <div className="storage-gate">
        <div className="storage-gate-card neon">
          <div className="storage-gate-logo neon"><Database size={30} /></div>
          <h2>Konfigurasi API Key Neon</h2>
          <p>
            API Key Neon belum dikonfigurasi di server atau memerlukan pembaharuan.
            Masukkan Neon Personal Access Token (API Key) dari console.neon.tech.
          </p>
          {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
          <form onSubmit={handleSaveConfigKey} className="storage-gate-form" style={{ marginTop: 15 }}>
            <div className="input-group">
              <label className="input-label">Neon API Key (Personal Access Token)</label>
              <input
                type="password"
                className="input"
                placeholder="npg_xxxxxxxxxxxx"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary storage-login-btn" disabled={savingKey || !customKey.trim()}>
              {savingKey ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
              {savingKey ? 'Menyimpan…' : 'Simpan API Key & Hubungkan'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (status === 'fail') {
    return (
      <div className="storage-gate">
        <div className="storage-gate-card neon">
          <div className="storage-gate-logo neon"><Database size={30} /></div>
          <h2>Tidak Bisa Tersambung ke Neon</h2>
          <p>Gagal menghubungi server storage Neon. Silakan periksa koneksi atau coba lagi.</p>
          {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <button className="btn btn-primary" onClick={check}>
              <RefreshCw size={16} /> Coba Lagi
            </button>
            <button className="btn btn-ghost" onClick={() => setStatus('need_key')}>
              <KeyRound size={16} /> Ganti API Key
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <NeonDashboard onLogout={check} onChangeKey={() => setStatus('need_key')} />
}

function NeonDashboard(props) {
  // DEV-TRACE: tangkap stack asli dari crash render yang tidak terbaca
  // lewat source map, lalu lempar ulang agar tetap kena StorageBoundary.
  try {
    return NeonDashboardInner(props)
  } catch (e) {
    console.error('[STORAGE-DEBUG] NeonDashboard render throw:', e?.stack || e)
    throw e
  }
}

function NeonDashboardInner({ onLogout, onChangeKey }) {
  const [me, setMe] = useState(null)
  const [apiKeys, setApiKeys] = useState([])
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null) // { branches, endpoints, operations, consumption, databases, roles, snapshots }
  const [activeTab, setActiveTab] = useState('projects') // 'projects' | 'apikeys' | 'operations'
  const [section, setSection] = useState('branches') // 'branches' | 'endpoints' | 'databases' | 'roles' | 'snapshots'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [showCreateProj, setShowCreateProj] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKeyVal, setCreatedKeyVal] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [meData, projList, keysList] = await Promise.all([
        getMe().catch(() => null),
        listProjects().catch(() => []),
        listApiKeys().catch(() => []),
      ])
      setMe(meData && typeof meData === 'object' ? meData : null)
      setProjects(Array.isArray(projList) ? projList : [])
      setApiKeys(Array.isArray(keysList) ? keysList : [])
      const projs = Array.isArray(projList) ? projList : []
      if (projs.length > 0 && !selected) {
        setSelected(projs[0])
      }
    } catch (e) {
      if (e.code === 'UNAUTHORIZED') { onLogout(); return }
      setError(e.message)
    } finally { setLoading(false) }
  }, [onLogout, selected])

  useEffect(() => { loadAll() }, [])

  // Muat detail project terpilih
  const loadDetail = useCallback(async (projectId) => {
    if (!projectId) { setDetail(null); return }
    setLoading(true); setError('')
    try {
      const [branches, endpoints, operations, consumption] = await Promise.all([
        listBranches(projectId).catch(() => []),
        listEndpoints(projectId).catch(() => []),
        listOperations(projectId, 15).catch(() => []),
        getProjectConsumption(projectId).catch(() => null),
      ])

      const flatBranches = (branches || []).map((b) => (b && b.branch) || b)
      const primaryBranch = flatBranches.find((b) => b.primary) || flatBranches[0]
      let databases = []
      let roles = []
      let snapshots = []

      if (primaryBranch) {
        [databases, roles, snapshots] = await Promise.all([
          listDatabases(projectId, primaryBranch.id).catch(() => []),
          listRoles(projectId, primaryBranch.id).catch(() => []),
          listSnapshots(projectId, primaryBranch.id).catch(() => []),
        ])
      }

      setDetail({ branches, endpoints, operations, consumption, databases, roles, snapshots, primaryBranch })
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (selected?.id) loadDetail(selected.id)
  }, [selected?.id, loadDetail])

  const run = async (id, fn) => {
    setBusyId(id); setError('')
    try {
      await fn()
      await loadAll()
      if (selected) await loadDetail(selected.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId('')
    }
  }

  const handleCreateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setBusyId('create_key'); setError('')
    try {
      const res = await createApiKey(newKeyName.trim())
      setCreatedKeyVal(res.key || res.raw_key || 'Dibuat')
      setNewKeyName('')
      await loadAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="storage-dash">
      {/* Bar Akun & Stats */}
      <div className="storage-dash-bar">
        <div className="storage-dash-account">
          <span className="storage-avatar neon"><UserRound size={18} /></span>
          <div>
            <strong>{me?.name || me?.email || 'Akun Owner Neon'}</strong>
            <small>{me?.email ? `${me.email} · ` : ''}ID: {me?.id || '-'} · Plan: {me?.license || 'free'}</small>
          </div>
        </div>
        <div className="storage-dash-bar-actions">
          <div className="hf-log-tabs">
            <button className={`hf-log-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
              <Database size={13} style={{ marginRight: 4 }} /> Projects (${projects.length})
            </button>
            <button className={`hf-log-tab ${activeTab === 'apikeys' ? 'active' : ''}`} onClick={() => setActiveTab('apikeys')}>
              <KeyRound size={13} style={{ marginRight: 4 }} /> API Keys (${apiKeys.length})
            </button>
          </div>
          <button className="btn btn-ghost" onClick={onChangeKey} title="Ganti API Key">
            <KeyRound size={15} /> Key
          </button>
          <button className="btn btn-ghost" onClick={loadAll} title="Muat ulang" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}

      {/* VIEW 1: PROJECTS & DATABASES */}
      {activeTab === 'projects' && (
        <>
          {showCreateProj && (
            <CreateProjectForm
              onDone={async (p) => { setShowCreateProj(false); await loadAll(); setSelected(p) }}
              onCancel={() => setShowCreateProj(false)}
            />
          )}

          <div className="storage-dash-body">
            {/* Sidebar Daftar Project */}
            <aside className="storage-list-col">
              <div className="storage-col-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><Layers size={13} /> Projects ({projects.length})</span>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setShowCreateProj((s) => !s)}>
                  <Plus size={13} /> Baru
                </button>
              </div>

              {loading && !projects.length && <div className="storage-empty"><Loader2 size={16} className="spin" /> Memuat…</div>}
              {!loading && !projects.length && !error && <div className="storage-empty">Belum ada project.</div>}
              
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={`storage-list-item ${selected?.id === p.id ? 'active' : ''}`}
                  onClick={() => setSelected(p)}
                >
                  <Database size={14} />
                  <div className="storage-list-item-main">
                    <span className="storage-list-item-name">{p.name}</span>
                    <small>PG {p.pg_version || '17'} · {p.region_id || 'ap-southeast-1'}</small>
                  </div>
                  <span
                    className="storage-item-del"
                    title="Hapus project"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Hapus project "${p.name}"? Semua branch & database akan terhapus.`)) {
                        run(p.id, () => deleteProject(p.id))
                      }
                    }}
                  >
                    {busyId === p.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                  </span>
                </button>
              ))}
            </aside>

            {/* Content Detail Project */}
            {selected ? (
              <section className="storage-detail">
                <div className="storage-detail-head">
                  <div>
                    <h2>{selected.name}</h2>
                    <small>
                      ID: {selected.id} · PG {selected.pg_version || '17'} · Region: {selected.region_id || 'ap-southeast-1'} · Dibuat: {selected.created_at ? new Date(selected.created_at).toLocaleDateString('id-ID') : '-'}
                    </small>
                  </div>
                  {detail?.consumption?.total_consumption && (
                    <span className="storage-pill" title="Konsumsi kompute bulan ini">
                      <Activity size={12} /> {Number(detail.consumption.total_consumption).toFixed(2)} jam kompute
                    </span>
                  )}
                </div>

                {/* Sub Tab Detail Project */}
                <div className="storage-section-tabs">
                  {[
                    ['branches', `Branches (${detail?.branches?.length || 0})`],
                    ['endpoints', `Endpoints (${detail?.endpoints?.length || 0})`],
                    ['databases', `Databases (${detail?.databases?.length || 0})`],
                    ['roles', `Roles (${detail?.roles?.length || 0})`],
                    ['snapshots', `Snapshots (${detail?.snapshots?.length || 0})`],
                    ['operations', `Operations (${detail?.operations?.length || 0})`],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      className={`storage-section-tab ${section === id ? 'active' : ''}`}
                      onClick={() => setSection(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {section === 'branches' && (
                  <BranchSection
                    selected={selected} detail={detail} run={run} busyId={busyId}
                    onRefresh={() => loadDetail(selected.id)}
                  />
                )}
                {section === 'endpoints' && (
                  <EndpointSection selected={selected} detail={detail} run={run} busyId={busyId} />
                )}
                {section === 'databases' && (
                  <DatabaseSection selected={selected} detail={detail} run={run} busyId={busyId} onRefresh={() => loadDetail(selected.id)} />
                )}
                {section === 'roles' && (
                  <RoleSection selected={selected} detail={detail} run={run} busyId={busyId} onRefresh={() => loadDetail(selected.id)} />
                )}
                {section === 'snapshots' && (
                  <SnapshotSection selected={selected} detail={detail} run={run} busyId={busyId} />
                )}
                {section === 'operations' && (
                  <OperationsSection detail={detail} />
                )}
              </section>
            ) : (
              <div className="storage-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                Pilih project dari daftar di sebelah kiri untuk melihat detail.
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: API KEYS */}
      {activeTab === 'apikeys' && (
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <div>
              <h3 style={{ margin: 0 }}>Daftar API Keys (Personal Access Tokens)</h3>
              <small style={{ color: 'var(--text-tertiary)' }}>API Key yang digunakan untuk mengakses Neon API v2</small>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateKey((s) => !s)}>
              <Plus size={15} /> Buat API Key Baru
            </button>
          </div>

          {showCreateKey && (
            <form onSubmit={handleCreateKey} className="storage-inline-form" style={{ marginBottom: 15, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <input
                className="input"
                placeholder="Nama Token (mis. CLI Server / Backup)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                autoFocus
              />
              <button className="btn btn-primary" disabled={busyId === 'create_key' || !newKeyName.trim()}>
                {busyId === 'create_key' ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Buat Token
              </button>
            </form>
          )}

          {createdKeyVal && (
            <div className="gmail-error" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: 15 }}>
              <strong>API Key Berhasil Dibuat!</strong> Simpan key ini sekarang karena tidak akan ditampilkan lagi:
              <code style={{ display: 'block', marginTop: 6, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>{createdKeyVal}</code>
            </div>
          )}

          <div className="storage-rows">
            {apiKeys.map((k) => (
              <div key={k.id} className="storage-row">
                <KeyRound size={15} />
                <div className="storage-row-main">
                  <strong>{k.name || k.key_name || 'API Key'}</strong>
                  <small>ID: {k.id} · Dibuat: {k.created_at ? new Date(k.created_at).toLocaleString('id-ID') : '-'}</small>
                </div>
                <span className="storage-row-actions">
                  <button
                    className="storage-mini-btn danger"
                    title="Cabut API Key"
                    onClick={() => {
                      if (window.confirm(`Cabut API Key "${k.name || k.id}"?`)) {
                        run(k.id, () => revokeApiKey(k.id))
                      }
                    }}
                  >
                    {busyId === k.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Cabut
                  </button>
                </span>
              </div>
            ))}
            {!apiKeys.length && <div className="storage-empty">Tidak ada API Key terdaftar.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- normalisasi bentuk respons Neon v2 (ada/tanpa wrapper) ---------- */
const unwrap = (arr, key) => (Array.isArray(arr) ? arr : []).map((it) => (it && it[key]) || it)

function CreateProjectForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [pg, setPg] = useState('17')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Nama project wajib diisi.')
    setBusy(true); setErr('')
    try {
      const p = await createProject(name.trim(), pg)
      onDone(p)
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }
  return (
    <form className="storage-create-form" onSubmit={submit} style={{ marginBottom: 12 }}>
      <div className="input-group">
        <label className="input-label">Nama Project</label>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="mis. luxio-production" autoFocus />
      </div>
      <div className="input-group">
        <label className="input-label">Versi PostgreSQL</label>
        <select className="input" value={pg} onChange={(e) => setPg(e.target.value)}>
          {['17', '16', '15', '14'].map((v) => <option key={v} value={v}>PG {v}</option>)}
        </select>
      </div>
      {err && <div className="gmail-error"><AlertTriangle size={15} /> {err}</div>}
      <div className="storage-create-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Buat Project
        </button>
      </div>
    </form>
  )
}

function BranchSection({ selected, detail, run, busyId, onRefresh }) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [busy, setBusy] = useState(false)
  const branches = unwrap(detail?.branches, 'branch')
  const primaryId = selected?.default_branch_id
    || branches.find((b) => b.primary)?.id
    || branches[0]?.id

  const addBranch = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await createBranch(selected.id, name.trim(), parentId || undefined)
      setName(''); setParentId('')
      onRefresh()
    } catch (e2) {
      alert(e2.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="storage-rows">
      <form className="storage-inline-form" onSubmit={addBranch}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Branch Baru (kosong = random)" />
        <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Parent: default (primary)</option>
          {branches.filter((b) => b.id).map((b) => <option key={b.id} value={b.id}>{b.name || b.id}</option>)}
        </select>
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Buat Branch
        </button>
      </form>
      {branches.map((b) => (
        <div key={b.id} className="storage-row">
          <GitBranch size={14} />
          <div className="storage-row-main">
            <strong>{b.name || b.id}</strong>
            <small>
              {b.id === primaryId ? 'Primary · ' : ''}
              State: {b.current_state || b.default_kernel_parameters ? 'ok' : '-'}
              {b.parent_id ? ` · dari ${b.parent_id}` : ''}
              {b.created_at ? ` · ${new Date(b.created_at).toLocaleDateString('id-ID')}` : ''}
            </small>
          </div>
          <span className="storage-row-actions">
            {b.id !== primaryId && !b.protected && (
              <button
                className="storage-mini-btn danger"
                title="Hapus Branch"
                onClick={() => {
                  if (window.confirm(`Hapus branch "${b.name || b.id}"? Endpoint & database di branch ini ikut terhapus.`)) {
                    run(b.id, () => deleteBranch(selected.id, b.id))
                  }
                }}
              >
                {busyId === b.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </span>
        </div>
      ))}
      {!branches.length && <div className="storage-empty">Tidak ada branch. Buat dari database default untuk percobaan yang aman.</div>}
    </div>
  )
}

function EndpointSection({ selected, detail, run, busyId }) {
  const endpoints = unwrap(detail?.endpoints, 'endpoint')
  const branchName = (id) => unwrap(detail?.branches, 'branch').find((b) => b.id === id)?.name || id || '-'
  return (
    <div className="storage-rows">
      {endpoints.map((ep) => {
        const running = (ep.current_state || ep.status) === 'running'
        const idle = ['idle', 'suspended'].includes(ep.current_state || ep.status)
        return (
          <div key={ep.id || ep.compute_endpoint_id} className="storage-row">
            <Server size={14} />
            <div className="storage-row-main">
              <strong>{ep.name || ep.compute_endpoint_id || ep.id}</strong>
              <small>
                {ep.type || 'read_write'} · branch {branchName(ep.branch_id)} · state: {ep.current_state || ep.status || '-'}
              </small>
            </div>
            <span className="storage-row-actions">
              {idle && (
                <button
                  className="storage-mini-btn" title="Wake / start endpoint"
                  disabled={busyId === `start:${ep.id}`}
                  onClick={() => run(`start:${ep.id}`, () => startEndpoint(selected.id, ep.id))}
                >
                  {busyId === `start:${ep.id}` ? <Loader2 size={13} className="spin" /> : <Play size={13} />} Start
                </button>
              )}
              {running && ep.type !== 'read_write' && (
                <button
                  className="storage-mini-btn" title="Suspend endpoint"
                  disabled={busyId === `stop:${ep.id}`}
                  onClick={() => run(`stop:${ep.id}`, () => suspendEndpoint(selected.id, ep.id))}
                >
                  {busyId === `stop:${ep.id}` ? <Loader2 size={13} className="spin" /> : <PauseCircle size={13} />} Suspend
                </button>
              )}
            </span>
          </div>
        )
      })}
      {!endpoints.length && <div className="storage-empty">Belum ada endpoint (compute) di project ini.</div>}
    </div>
  )
}

function OperationsSection({ detail }) {
  const ops = unwrap(detail?.operations, 'operation')
  return (
    <div className="storage-rows">
      {ops.map((o) => {
        const prog = o.progress || {}
        const total = Number(prog.total_steps) || Number(prog.total_worker_count) || 0
        const done = Number(prog.completed_steps) || Number(prog.completed_worker_count) || 0
        const pct = total > 0 ? Math.round((done / total) * 100) : null
        const state = o.state || o.status || (o.finish_time ? 'finished' : 'running')
        return (
          <div key={o.id} className="storage-row">
            <Activity size={14} />
            <div className="storage-row-main">
              <strong>{o.action || o.type || 'Operation'}</strong>
              <small>
                {state}{pct != null ? ` · ${pct}%` : ''}
                {o.created_at ? ` · ${new Date(o.created_at).toLocaleString('id-ID')}` : ''}
                {o.error ? ` · error: ${JSON.stringify(o.error)}` : ''}
              </small>
            </div>
            <span className={`storage-pill ${state === 'finished' || state === 'completed' ? 'ok' : ''}`}>{state}</span>
          </div>
        )
      })}
      {!ops.length && <div className="storage-empty">Belum ada riwayat operasi.</div>}
    </div>
  )
}

function DatabaseSection({ selected, detail, run, busyId, onRefresh }) {
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('neondb_owner')
  const [busy, setBusy] = useState(false)
  const primaryBranch = detail?.primaryBranch

  const addDb = async (e) => {
    e.preventDefault()
    if (!name.trim() || !primaryBranch) return
    setBusy(true)
    try {
      await createDatabase(selected.id, primaryBranch.id, name.trim(), ownerName.trim() || 'neondb_owner')
      setName('')
      onRefresh()
    } catch (e2) {
      alert(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="storage-rows">
      <form className="storage-inline-form" onSubmit={addDb}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Database (mis. app_production)" />
        <input className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Role (default neondb_owner)" style={{ maxWidth: 180 }} />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Buat DB
        </button>
      </form>
      {(detail?.databases || []).map((db) => (
        <div key={db.id || db.name} className="storage-row">
          <Database size={14} />
          <div className="storage-row-main">
            <strong>{db.name}</strong>
            <small>Owner: {db.owner_name} · Branch: {primaryBranch?.name || '-'}</small>
          </div>
          <span className="storage-row-actions">
            <button
              className="storage-mini-btn danger"
              title="Hapus Database"
              onClick={() => {
                if (window.confirm(`Hapus database "${db.name}"?`)) {
                  run(db.name, () => deleteDatabase(selected.id, primaryBranch.id, db.name))
                }
              }}
            >
              {busyId === db.name ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
            </button>
          </span>
        </div>
      ))}
      {!detail?.databases?.length && <div className="storage-empty">Tidak ada database tambahan.</div>}
    </div>
  )
}

function RoleSection({ selected, detail, run, busyId, onRefresh }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const primaryBranch = detail?.primaryBranch

  const addRole = async (e) => {
    e.preventDefault()
    if (!name.trim() || !primaryBranch) return
    setBusy(true)
    try {
      await createRole(selected.id, primaryBranch.id, name.trim())
      setName('')
      onRefresh()
    } catch (e2) {
      alert(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="storage-rows">
      <form className="storage-inline-form" onSubmit={addRole}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Role Baru (mis. app_readonly)" />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Buat Role
        </button>
      </form>
      {(detail?.roles || []).map((r) => (
        <div key={r.name} className="storage-row">
          <UserRound size={14} />
          <div className="storage-row-main">
            <strong>{r.name}</strong>
            <small>Branch: {primaryBranch?.name || '-'} · Protected: {r.protected ? 'Ya' : 'Tidak'}</small>
          </div>
          <span className="storage-row-actions">
            {!r.protected && (
              <button
                className="storage-mini-btn danger"
                title="Hapus Role"
                onClick={() => {
                  if (window.confirm(`Hapus role "${r.name}"?`)) {
                    run(r.name, () => deleteRole(selected.id, primaryBranch.id, r.name))
                  }
                }}
              >
                {busyId === r.name ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </span>
        </div>
      ))}
      {!detail?.roles?.length && <div className="storage-empty">Tidak ada role tersimpan.</div>}
    </div>
  )
}

function SnapshotSection({ selected, detail, run, busyId }) {
  const primaryBranch = detail?.primaryBranch
  return (
    <div className="storage-rows">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span>Daftar Point-in-time Snapshots (Branch {primaryBranch?.name || '-'})</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => run('create_snapshot', () => createSnapshot(selected.id, primaryBranch.id))}
          disabled={busyId === 'create_snapshot' || !primaryBranch}
        >
          {busyId === 'create_snapshot' ? <Loader2 size={13} className="spin" /> : <Server size={13} />} Buat Snapshot Sekarang
        </button>
      </div>
      {(detail?.snapshots || []).map((s) => (
        <div key={s.id} className="storage-row">
          <Server size={14} />
          <div className="storage-row-main">
            <strong>Snapshot #{s.id}</strong>
            <small>Dibuat: {s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '-'}</small>
          </div>
        </div>
      ))}
      {!detail?.snapshots?.length && <div className="storage-empty">Belum ada snapshot tersimpan.</div>}
    </div>
  )
}

/* =====================================================================
   PANEL PENYIMPANAN FILE (autologin via kredensial aplikasi di server)
   ===================================================================== */

function B2Panel() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'fail'
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      await b2EnsureAppSession()
      setStatus('ok')
    } catch (e) {
      setError(e.message)
      setStatus('fail')
    }
  }, [])

  useEffect(() => { check() }, [check])

  if (status === 'loading') {
    return <div className="storage-empty"><Loader2 size={16} className="spin" /> Menyambungkan…</div>
  }
  if (status === 'fail') {
    return (
      <div className="storage-gate">
        <div className="storage-gate-card b2">
          <div className="storage-gate-logo b2"><Boxes size={30} /></div>
          <h2>Tidak bisa tersambung</h2>
          <p>Server penyimpanan sedang tidak tersedia. Coba lagi.</p>
          {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
          <button className="btn btn-primary storage-login-btn" onClick={check}>
            <RefreshCw size={16} /> Coba Lagi
          </button>
        </div>
      </div>
    )
  }
  return <B2Dashboard onLogout={check} />
}

function B2Dashboard({ onLogout }) {
  const session = getB2Session()
  const [buckets, setBuckets] = useState([])
  const [selected, setSelected] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [uploading, setUploading] = useState(0) // 0..1
  const [busyId, setBusyId] = useState('')

  const loadBuckets = useCallback(async () => {
    setLoading(true); setError('')
    try { setBuckets(await listBuckets()) }
    catch (e) {
      if (e.code === 'UNAUTHORIZED') { onLogout(); return }
      setError(e.message)
    }
    finally { setLoading(false) }
  }, [onLogout])

  useEffect(() => { loadBuckets() }, [loadBuckets])

  const loadFiles = useCallback(async (bucketId) => {
    if (!bucketId) { setFiles([]); return }
    setLoading(true)
    try { const d = await listFileNames(bucketId); setFiles(Array.isArray(d?.files) ? d.files : []) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadFiles(selected?.bucketId) }, [selected, loadFiles])

  const run = async (id, fn) => {
    setBusyId(id); setError('')
    try { await fn(); await loadBuckets(); if (selected) await loadFiles(selected.bucketId) }
    catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    setUploading(0.5); setError('')
    try {
      await uploadFile(selected.bucketId, file)
      await loadFiles(selected.bucketId)
      await loadBuckets()
    } catch (err) { setError(err.message) }
    finally { setUploading(0); e.target.value = '' }
  }

  return (
    <div className="storage-dash">
      <div className="storage-dash-bar">
        <div className="storage-dash-account">
          <span className="storage-avatar b2"><UserRound size={17} /></span>
          <div>
            <strong>{session?.keyName}</strong>
            <small>Account: {session?.accountId}</small>
          </div>
        </div>
        <div className="storage-dash-bar-actions">
          <button className="btn btn-ghost" onClick={() => setShowCreate((s) => !s)} disabled={loading}>
            <Plus size={15} /> Bucket Baru
          </button>
          <button className="btn btn-ghost" onClick={loadBuckets} title="Muat ulang" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn btn-ghost" onClick={onLogout} title="Keluar"><LogOut size={15} /></button>
        </div>
      </div>

      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
      {uploading > 0 && (
        <div className="storage-upload-bar"><div style={{ width: `${Math.round(uploading * 100)}%` }} /></div>
      )}

      {showCreate && (
        <CreateBucketForm
          onDone={async () => { setShowCreate(false); await loadBuckets() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="storage-dash-body">
        {/* Daftar bucket */}
        <aside className="storage-list-col">
          <div className="storage-col-title"><FolderOpen size={13} /> Buckets ({buckets.length})</div>
          {loading && !buckets.length && <div className="storage-empty"><Loader2 size={16} className="spin" /> Memuat…</div>}
          {!loading && !buckets.length && !error && <div className="storage-empty">Belum ada bucket.</div>}
          {buckets.map((b) => (
            <button key={b.bucketId} className={`storage-list-item ${selected?.bucketId === b.bucketId ? 'active' : ''}`} onClick={() => setSelected(b)}>
              <Boxes size={14} />
              <span className="storage-list-item-name">{b.bucketName}</span>
              <small>{b.bucketType === 'allPrivate' ? 'private' : 'public'}</small>
              <span
                className="storage-item-del" title="Hapus bucket"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`Hapus bucket "${b.bucketName}"? Bucket harus kosong.`)) {
                    run(b.bucketId, () => deleteBucket(b.bucketId))
                  }
                }}
              >
                {busyId === b.bucketId ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </span>
            </button>
          ))}
        </aside>

        {/* File dalam bucket */}
        {selected && (
          <section className="storage-detail">
            <div className="storage-detail-head">
              <div>
                <h2>{selected.bucketName}</h2>
                <small>{selected.bucketType} · bucketId {selected.bucketId}</small>
              </div>
              <label className="btn btn-primary storage-upload-btn">
                {uploading > 0 ? <Loader2 size={15} className="spin" /> : <UploadCloud size={15} />}
                {uploading > 0 ? `${Math.round(uploading * 100)}%` : 'Upload File'}
                <input type="file" hidden onChange={handleUpload} disabled={uploading > 0} />
              </label>
            </div>
            <div className="storage-rows">
              {loading && !files.length && <div className="storage-empty"><Loader2 size={16} className="spin" /> Memuat file…</div>}
              {!loading && !files.length && <div className="storage-empty">Bucket kosong.</div>}
              {files.map((f) => (
                <div key={f.fileId} className="storage-row">
                  <HardDrive size={14} />
                  <div className="storage-row-main">
                    <strong>{f.fileName}</strong>
                    <small>
                      {(f.contentLength / 1024).toFixed(1)} KB · {f.uploadTimestamp ? new Date(f.uploadTimestamp).toLocaleString('id-ID') : ''}
                    </small>
                  </div>
                  <span className="storage-row-actions">
                    <button
                      className="storage-mini-btn" title="Unduh"
                      onClick={async () => {
                        try {
                          const blob = await downloadFileViaProxy(selected.bucketName, f.fileName)
                          const a = document.createElement('a')
                          a.href = URL.createObjectURL(blob)
                          a.download = f.fileName.split('/').pop() || f.fileName
                          a.click()
                          URL.revokeObjectURL(a.href)
                        } catch (err) { setError(err.message) }
                      }}
                    >
                      <Download size={13} />
                    </button>
                    <button className="storage-mini-btn danger" title="Hapus file"
                      onClick={() => { if (window.confirm(`Hapus "${f.fileName}"?`)) run(f.fileId, () => deleteFileVersion(f.fileName, f.fileId)) }}>
                      {busyId === f.fileId ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function CreateBucketForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Nama bucket wajib diisi.')
    setBusy(true); setErr('')
    try { await createBucket(name.trim().toLowerCase(), isPrivate); onDone() }
    catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }
  return (
    <form className="storage-create-form" onSubmit={submit}>
      <div className="input-group">
        <label className="input-label">Nama Bucket (huruf kecil/angka/tanda hubung)</label>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="mis. luxio-backup" autoFocus />
      </div>
      <div className="input-group">
        <label className="input-label">Tipe Bucket</label>
        <select className="input" value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
      </div>
      {err && <div className="gmail-error"><AlertTriangle size={15} /> {err}</div>}
      <div className="storage-create-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Buat Bucket
        </button>
      </div>
    </form>
  )
}

