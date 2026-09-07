// =====================================================================
// StoragePage.jsx — Halaman "Penyimpanan": kelola layanan cloud storage.
// =====================================================================
// 2 tab dengan behavior sama (gate login → dashboard kelola):
//   1. NEON    — login akun Neon via API key, kelola project, branch,
//                endpoint, database, role, snapshot, API key, konsumsi,
//                dan riwayat operasi (sesuai dokumentasi Neon API v2).
//   2. BACKBLAZE — login keyID + applicationKey, kelola bucket & file
//                (list/upload/unduh/hapus) via B2 API v2.
// Kredensial disimpan lokal per browser (keyname per halaman; tidak ikut
// persist store agar tidak ikut backup).
// =====================================================================

import { useCallback, useEffect, useState } from 'react'
import {
  Database, KeyRound, LogOut, RefreshCw, Plus, Trash2, ExternalLink,
  HardDrive, Layers, Server, Boxes, Activity, Loader2, FolderOpen,
  UploadCloud, Download, ChevronDown, Play, PauseCircle, UserRound,
  AlertTriangle,
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
import './StoragePage.css'

// Ses pulihkan storage 2FA (30 menit) — per verifikasi email OWNER.
const STORAGE_2FA_KEY = 'luxio_storage_2fa_ok'

export default function StoragePage() {
  // Gate 2FA: klik halaman Penyimpanan → wajib kode email sebelum isi.
  const [verified, setVerified] = useState(() => {
    try {
      const t = Number(sessionStorage.getItem(STORAGE_2FA_KEY) || 0)
      return t > Date.now()
    } catch { return false }
  })

  // Autologin Neon & B2 begitu lolos 2FA.
  useEffect(() => {
    if (!verified) return
    ensureNeonAppSession()
    b2EnsureAppSession().catch(() => {})
  }, [verified])

  const [tab, setTab] = useState('neon') // 'neon' | 'b2' | 'hf'
  if (!verified) return <StorageGate2fa onVerified={() => setVerified(true)} />

  return (
    <div className="storage-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1><HardDrive size={22} /> Penyimpanan</h1>
          <p>Kelola database Neon, object storage Backblaze B2, dan log backend HF dalam satu tempat.</p>
        </div>
        <div className="storage-tabs" role="tablist">
          <button className={`storage-tab ${tab === 'neon' ? 'active' : ''}`} onClick={() => setTab('neon')} role="tab">
            <Database size={15} /> Neon
          </button>
          <button className={`storage-tab ${tab === 'b2' ? 'active' : ''}`} onClick={() => setTab('b2')} role="tab">
            <Boxes size={15} /> Backblaze B2
          </button>
          <button className={`storage-tab ${tab === 'hf' ? 'active' : ''}`} onClick={() => setTab('hf')} role="tab">
            <ScrollText size={15} /> Backend HF
          </button>
        </div>
      </div>
      {tab === 'neon' && <NeonPanel />}
      {tab === 'b2' && <B2Panel />}
      {tab === 'hf' && <HfLogsPanel />}
    </div>
  )
}

/* =====================================================================
   GATE 2FA — kirim kode ke email owner + verifikasi.
   ===================================================================== */

function StorageGate2fa({ onVerified }) {
  const [stage, setStage] = useState('send') // 'send' | 'verify'
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true); setError(''); setInfo('')
    try {
      const res = await api.sendStorage2fa()
      setInfo(`Kode verifikasi dikirim ke ${res.email || 'email master'}. Berlaku 5 menit.`)
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
      await api.verifyStorage2fa(code.trim())
      try { sessionStorage.setItem(STORAGE_2FA_KEY, String(Date.now() + 30 * 60 * 1000)) } catch { /* abaikan */ }
      onVerified()
    } catch (e) {
      setError(e.message || 'Kode salah atau kadaluarsa.')
    } finally { setBusy(false) }
  }

  return (
    <div className="storage-gate">
      <div className="storage-gate-card neon">
        <div className="storage-gate-logo b2"><ShieldCheck size={30} /></div>
        <h2>Verifikasi Penyimpanan</h2>
        <p>
          Halaman ini mengakses database Neon &amp; storage Backblaze.
          Masukkan kode verifikasi yang dikirim ke email <strong>master@luxio.web.id</strong>.
        </p>
        {stage === 'send' ? (
          <button className="btn btn-primary storage-login-btn" onClick={send} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {busy ? 'Mengirim kode…' : 'Kirim Kode Verifikasi'}
          </button>
        ) : (
          <form onSubmit={verify} className="storage-gate-form">
            <div className="input-group">
              <label className="input-label" htmlFor="storage-2fa-code">Kode Verifikasi (6 digit)</label>
              <input
                id="storage-2fa-code" className="input" inputMode="numeric" maxLength={6}
                placeholder="••••••" value={code} autoFocus
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              />
            </div>
            {info && <small className="storage-gate-note">{info}</small>}
            {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
            <button type="submit" className="btn btn-primary storage-login-btn" disabled={busy || code.length < 4}>
              {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />} Buka Penyimpanan
            </button>
            <button type="button" className="btn btn-ghost" onClick={send} disabled={busy}>Kirim ulang kode</button>
          </form>
        )}
      </div>
    </div>
  )
}

/* =====================================================================
   PANEL BACKEND HF — log Space (run/build) via API resmi HF.
   ===================================================================== */

function HfLogsPanel() {
  const [stream, setStream] = useState('run')
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(false)

  const load = useCallback(async (s = stream) => {
    setLoading(true); setError('')
    try {
      const res = await api.getHfLogs(s, 300)
      if (!res.ok) throw new Error(res.error || 'Gagal mengambil log.')
      setLogs(res.logs || '(kosong)')
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [stream])

  useEffect(() => { load(stream) }, [stream, load])
  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => load(stream), 8000)
    return () => clearInterval(id)
  }, [auto, stream, load])

  return (
    <div className="storage-dash">
      <div className="storage-dash-bar">
        <div className="storage-dash-account">
          <span className="storage-avatar hf"><ScrollText size={17} /></span>
          <div>
            <strong>Log Space HF — lukris/n8n</strong>
            <small>via api.huggingface.co (token dari env backend)</small>
          </div>
        </div>
        <div className="storage-dash-bar-actions">
          <select className="input" style={{ minHeight: 36, width: 140 }} value={stream} onChange={(e) => setStream(e.target.value)}>
            <option value="run">Container (run)</option>
            <option value="build">Build</option>
          </select>
          <button className={`btn btn-ghost ${auto ? 'active' : ''}`} onClick={() => setAuto((a) => !a)} title="Auto refresh 8 detik">
            {auto ? 'Auto: ON' : 'Auto: OFF'}
          </button>
          <button className="btn btn-ghost" onClick={() => load()} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Muat ulang
          </button>
        </div>
      </div>
      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
      <pre className="hf-log-box">{loading && !logs ? 'Memuat log…' : logs || '(kosong)'}</pre>
    </div>
  )
}

/* =====================================================================
   PANEL NEON
   ===================================================================== */

function NeonPanel() {
  // Autologin aktif: key aplikasi dipasang saat gate 2FA lolos, jadi
  // loggedIn biasanya true sejak awal (form login tetap ada sebagai
  // fallback bila key aplikasi dicabut).
  const [loggedIn, setLoggedIn] = useState(isNeonLoggedIn())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!loggedIn) {
    return (
      <NeonLogin
        busy={busy} setBusy={setBusy} error={error} setError={setError}
        onDone={() => setLoggedIn(true)}
      />
    )
  }
  return <NeonDashboard onLogout={() => { setNeonKey(''); setLoggedIn(false) }} />
}

function NeonLogin({ busy, setBusy, error, setError, onDone }) {
  const [key, setKey] = useState('')
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!key.trim()) return setError('Masukkan API key Neon.')
    setBusy(true); setError('')
    setNeonKey(key.trim())
    try {
      await getMe()
      onDone()
    } catch (err) {
      setNeonKey('')
      setError(err.message)
    } finally { setBusy(false) }
  }
  return (
    <div className="storage-gate">
      <div className="storage-gate-card neon">
        <div className="storage-gate-logo neon"><Database size={30} /></div>
        <h2>Masuk ke Neon</h2>
        <p>
          Hubungkan akun Neon kamu untuk mengelola project, branch, endpoint,
          dan database PostgreSQL langsung dari Luxio.
        </p>
        <form onSubmit={handleLogin} className="storage-gate-form">
          <div className="input-group">
            <label className="input-label" htmlFor="neon-key">API Key Neon</label>
            <input
              id="neon-key" className="input" type="password" autoComplete="off"
              placeholder="napi_xxxxxxxxxxxxxxxx" value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
            />
          </div>
          {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
          <button type="submit" className="btn btn-primary storage-login-btn" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
            {busy ? 'Memverifikasi…' : 'Masuk dengan API Key'}
          </button>
        </form>
        <small className="storage-gate-note">
          Buat API key di <a href="https://console.neon.tech/app/settings/api-keys" target="_blank" rel="noreferrer">console.neon.tech → API Keys <ExternalLink size={10} /></a>.
          Key disimpan hanya di browser kamu.
        </small>
      </div>
    </div>
  )
}

function NeonDashboard({ onLogout }) {
  const [me, setMe] = useState(null)
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null) // { branches, endpoints, operations, consumption, databases, roles, snapshots }
  const [section, setSection] = useState('branches')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [meData, projList] = await Promise.all([getMe(), listProjects()])
      setMe(meData)
      setProjects(projList)
    } catch (e) {
      if (e.code === 'UNAUTHORIZED') { onLogout(); return }
      setError(e.message)
    } finally { setLoading(false) }
  }, [onLogout])

  useEffect(() => { loadAll() }, [loadAll])

  // Muat detail project terpilih (branches, endpoints, operations, dsb.)
  const loadDetail = useCallback(async (projectId) => {
    if (!projectId) { setDetail(null); return }
    setLoading(true); setError('')
    try {
      const [branches, endpoints, operations, consumption] = await Promise.all([
        listBranches(projectId),
        listEndpoints(projectId).catch(() => []),
        listOperations(projectId, 10).catch(() => []),
        getProjectConsumption(projectId).catch(() => null),
      ])
      setDetail({ branches, endpoints, operations, consumption })
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDetail(selected?.id) }, [selected, loadDetail])

  const run = async (id, fn) => {
    setBusyId(id); setError('')
    try { await fn(); await loadAll(); if (selected) await loadDetail(selected.id) }
    catch (e) { setError(e.message) }
    finally { setBusyId('') }
  }

  return (
    <div className="storage-dash">
      {/* Bar akun */}
      <div className="storage-dash-bar">
        <div className="storage-dash-account">
          <span className="storage-avatar neon"><UserRound size={17} /></span>
          <div>
            <strong>{me?.name || 'Akun Neon'}</strong>
            <small>{me?.email || ''} · License: {me?.license || 'free'}</small>
          </div>
        </div>
        <div className="storage-dash-bar-actions">
          <button className="btn btn-ghost" onClick={() => setShowCreate((s) => !s)} disabled={loading}>
            <Plus size={15} /> Project Baru
          </button>
          <button className="btn btn-ghost" onClick={loadAll} title="Muat ulang" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
          <button className="btn btn-ghost" onClick={onLogout} title="Keluar"><LogOut size={15} /></button>
        </div>
      </div>

      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}

      {/* Form project baru */}
      {showCreate && (
        <CreateProjectForm
          onDone={async (p) => { setShowCreate(false); await loadAll(); setSelected(p) }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="storage-dash-body">
        {/* Kolom daftar project */}
        <aside className="storage-list-col">
          <div className="storage-col-title"><Layers size={13} /> Projects ({projects.length})</div>
          {loading && !projects.length && <div className="storage-empty"><Loader2 size={16} className="spin" /> Memuat…</div>}
          {!loading && !projects.length && !error && <div className="storage-empty">Belum ada project.</div>}
          {projects.map((p) => (
            <button key={p.id} className={`storage-list-item ${selected?.id === p.id ? 'active' : ''}`} onClick={() => setSelected(p)}>
              <Database size={14} />
              <span className="storage-list-item-name">{p.name}</span>
              <small>{p.region_id || p.pg_version || ''}</small>
              <span
                className="storage-item-del" title="Hapus project"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`Hapus project "${p.name}"? Semua branch & data hilang permanen.`)) {
                    run(p.id, () => deleteProject(p.id))
                  }
                }}
              >
                {busyId === p.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              </span>
            </button>
          ))}
        </aside>

        {/* Detail project terpilih */}
        {selected && (
          <section className="storage-detail">
            <div className="storage-detail-head">
              <div>
                <h2>{selected.name}</h2>
                <small>
                  PG {selected.pg_version} · {selected.region_id || '-'} · dibuat {selected.created_at ? new Date(selected.created_at).toLocaleDateString('id-ID') : '-'}
                </small>
              </div>
              {detail?.consumption?.total_consumption && (
                <span className="storage-pill" title="Konsumsi bulan ini">
                  <Activity size={12} /> {Number(detail.consumption.total_consumption).toFixed(2)} jam kompute
                </span>
              )}
            </div>

            <div className="storage-section-tabs">
              {[
                ['branches', 'Branches'], ['endpoints', 'Endpoints'],
                ['operations', 'Operations'],
              ].map(([id, label]) => (
                <button key={id} className={`storage-section-tab ${section === id ? 'active' : ''}`} onClick={() => setSection(id)}>{label}</button>
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
            {section === 'operations' && (
              <OperationsSection detail={detail} />
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function CreateProjectForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [pg, setPg] = useState('17')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Nama project wajib diisi.')
    setBusy(true); setErr('')
    try { const p = await createProject(name.trim(), pg); onDone(p) }
    catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }
  return (
    <form className="storage-create-form" onSubmit={submit}>
      <div className="input-group">
        <label className="input-label">Nama Project</label>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="mis. Production DB" autoFocus />
      </div>
      <div className="input-group">
        <label className="input-label">Versi PostgreSQL</label>
        <select className="input" value={pg} onChange={(e) => setPg(e.target.value)}>
          {['17', '16', '15', '14'].map((v) => <option key={v} value={v}>PostgreSQL {v}</option>)}
        </select>
      </div>
      {err && <div className="gmail-error"><AlertTriangle size={15} /> {err}</div>}
      <div className="storage-create-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Buat Project
        </button>
      </div>
    </form>
  )
}

function BranchSection({ selected, detail, run, busyId, onRefresh }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const mainBranch = detail?.branches?.find((b) => b.primary) || detail?.branches?.[0]

  const addBranch = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try { await createBranch(selected.id, name.trim(), mainBranch?.id); setName(''); onRefresh() }
    catch (e2) { alert(e2.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="storage-rows">
      <form className="storage-inline-form" onSubmit={addBranch}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama branch baru (mis. staging)" />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Buat Branch
        </button>
      </form>
      {(detail?.branches || []).map((b) => (
        <div key={b.id} className="storage-row">
          <Layers size={14} />
          <div className="storage-row-main">
            <strong>{b.name}{b.primary ? ' (primary)' : ''}</strong>
            <small>{b.id}</small>
          </div>
          <span className="storage-row-actions">
            <button className="storage-mini-btn" title="Snapshot sekarang"
              onClick={() => run(b.id, () => createSnapshot(selected.id, b.id))}>
              {busyId === b.id ? <Loader2 size={13} className="spin" /> : <Server size={13} />}
            </button>
            {!b.primary && (
              <button className="storage-mini-btn danger" title="Hapus branch"
                onClick={() => { if (window.confirm(`Hapus branch "${b.name}"?`)) run(b.id, () => deleteBranch(selected.id, b.id)) }}>
                <Trash2 size={13} />
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

function EndpointSection({ selected, detail, run, busyId }) {
  return (
    <div className="storage-rows">
      {(detail?.endpoints || []).map((ep) => (
        <div key={ep.id} className="storage-row">
          <Server size={14} />
          <div className="storage-row-main">
            <strong>{ep.host || ep.id}</strong>
            <small>{ep.type || 'compute'} · {ep.status || 'idle'} {ep.current_state ? `(${ep.current_state})` : ''}</small>
          </div>
          <span className="storage-row-actions">
            <button className="storage-mini-btn" title="Start compute" onClick={() => run(ep.id, () => startEndpoint(selected.id, ep.id))}>
              {busyId === ep.id ? <Loader2 size={13} className="spin" /> : <Play size={13} />}
            </button>
            <button className="storage-mini-btn" title="Suspend compute" onClick={() => run(ep.id, () => suspendEndpoint(selected.id, ep.id))}>
              <PauseCircle size={13} />
            </button>
          </span>
        </div>
      ))}
      {!detail?.endpoints?.length && <div className="storage-empty">Tidak ada endpoint.</div>}
    </div>
  )
}

function OperationsSection({ detail }) {
  return (
    <div className="storage-rows">
      {(detail?.operations || []).map((op) => (
        <div key={op.id} className="storage-row">
          <Activity size={14} />
          <div className="storage-row-main">
            <strong>{op.action || op.kind || 'operation'}</strong>
            <small>
              {op.status || ''} · {op.created_at ? new Date(op.created_at).toLocaleString('id-ID') : ''}
            </small>
          </div>
          <span className={`storage-op-badge ${op.status || ''}`}>{op.status || '-'}</span>
        </div>
      ))}
      {!detail?.operations?.length && <div className="storage-empty">Belum ada operasi.</div>}
    </div>
  )
}

/* =====================================================================
   PANEL BACKBLAZE B2
   ===================================================================== */

// Kredensial bawaan aplikasi (diberikan pemilik akun B2) — lihat b2Api.js.
const B2_DEFAULT = B2_APP_CREDENTIALS

function B2Panel() {
  const [loggedIn, setLoggedIn] = useState(isB2LoggedIn())
  return loggedIn ? <B2Dashboard onLogout={() => { b2Logout(); setLoggedIn(false) }} /> : <B2Login onDone={() => setLoggedIn(true)} />
}

function B2Login({ onDone }) {
  const saved = getB2Session()
  const [keyId, setKeyId] = useState(B2_DEFAULT.keyId)
  const [appKey, setAppKey] = useState(B2_DEFAULT.appKey)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!keyId.trim() || !appKey.trim()) return setError('keyID dan applicationKey wajib diisi.')
    setBusy(true); setError('')
    try { await b2Authorize(keyId, appKey); onDone() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <div className="storage-gate">
      <div className="storage-gate-card b2">
        <div className="storage-gate-logo b2"><Boxes size={30} /></div>
        <h2>Masuk ke Backblaze B2</h2>
        <p>
          Hubungkan akun B2 untuk mengelola bucket dan file (upload, unduh,
          hapus) langsung dari Luxio.
        </p>
        <form onSubmit={handleLogin} className="storage-gate-form">
          <div className="input-group">
            <label className="input-label" htmlFor="b2-keyid">Key ID</label>
            <input id="b2-keyid" className="input" value={keyId} onChange={(e) => { setKeyId(e.target.value); setError('') }} autoComplete="off" />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="b2-appkey">Application Key</label>
            <input id="b2-appkey" className="input" type="password" value={appKey} onChange={(e) => { setAppKey(e.target.value); setError('') }} autoComplete="off" />
          </div>
          {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
          <button type="submit" className="btn btn-primary storage-login-btn" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}
            {busy ? 'Menghubungkan…' : 'Masuk ke B2'}
          </button>
        </form>
        <small className="storage-gate-note">
          Kredensial {saved?.keyName || B2_DEFAULT.keyName} sudah terisi bawaan. Disimpan hanya di browser kamu.
        </small>
      </div>
    </div>
  )
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
    try { const d = await listFileNames(bucketId); setFiles(d.files) }
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

