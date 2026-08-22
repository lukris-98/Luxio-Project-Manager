import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { BarChart3, Database, HardDrive, ScrollText, Lightbulb, Save, RefreshCw, KeyRound, FolderOpen, Plus, X, Check, Crown } from 'lucide-react'
import { api } from '../services/api'
import './OwnerDashboard.css'

// =====================================================================
// OwnerDashboard.jsx — Pusat kendali owner (khusus role 'owner').
// =====================================================================
// - Analytics (Umami): simpan share URL + website id, tampilkan dashboard
//   via iframe (share URL sudah menyematkan token auth).
// - Database (Neon): simpan API key, cek status project & kuota konsumsi.
// - Storage (Backblaze B2): simpan kredensial, cek status akun.
// - Log Aktivitas: tabel audit log seluruh sistem.
// - Saran Fitur: perbandingan fitur gratis vs berbayar.
// =====================================================================

const TABS = [
  { id: 'analytics', label: 'Analytics (Umami)', icon: BarChart3 },
  { id: 'database', label: 'Database (Neon)', icon: Database },
  { id: 'storage', label: 'Storage (Backblaze)', icon: HardDrive },
  { id: 'logs', label: 'Log Aktivitas', icon: ScrollText },
  { id: 'saran', label: 'Saran Fitur', icon: Lightbulb },
]

// Kuota gratis Neon: 0.5 GB storage, 190 jam compute per bulan.
const NEON_FREE_STORAGE_BYTES = 0.5 * 1e9
const NEON_FREE_COMPUTE_SECONDS = 190 * 3600

export default function OwnerDashboard() {
  const { currentUser, setCurrentPage } = useStore()
  const isOwner = currentUser?.role === 'owner'

  const [tab, setTab] = useState('analytics')
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState('')
  const [toast, setToast] = useState('')

  // Umami
  const [umamiForm, setUmamiForm] = useState({ share_url: '', website_id: '' })

  // Neon
  const [neonForm, setNeonForm] = useState({ api_key: '' })
  const [neonProjects, setNeonProjects] = useState([])
  const [newNeonProject, setNewNeonProject] = useState('')
  const [neonStatus, setNeonStatus] = useState(null)
  const [neonLoading, setNeonLoading] = useState(false)
  const [neonError, setNeonError] = useState('')

  // Backblaze B2
  const [b2Form, setB2Form] = useState({ key_id: '', application_key: '', bucket_name: '', endpoint: '' })
  const [b2Status, setB2Status] = useState(null)
  const [b2Loading, setB2Loading] = useState(false)
  const [b2Error, setB2Error] = useState('')

  // Logs
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState('')

  // Guard: hanya owner yang boleh melihat halaman ini.
  useEffect(() => {
    if (!isOwner) setCurrentPage('dashboard')
  }, [isOwner, setCurrentPage])

  // Muat konfigurasi owner (masked) untuk mengisi form & status.
  useEffect(() => {
    if (!isOwner) return
    api.ownerGetConfig()
      .then((cfg) => {
        setConfig(cfg)
        setUmamiForm({
          share_url: cfg?.umami?.share_url || '',
          website_id: cfg?.umami?.website_id || '',
        })
        setNeonProjects(Array.isArray(cfg?.neon?.projects) ? cfg.neon.projects : [])
        setB2Form((f) => ({
          ...f,
          bucket_name: cfg?.backblaze?.bucket_name || '',
          endpoint: cfg?.backblaze?.endpoint || '',
        }))
      })
      .catch(() => {})
  }, [isOwner])

  const flash = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const refreshConfig = async () => {
    try {
      const cfg = await api.ownerGetConfig()
      setConfig(cfg)
      return cfg
    } catch (e) {
      return null
    }
  }

  // ---------------- Umami ----------------
  const saveUmami = async () => {
    if (!umamiForm.share_url.trim()) {
      flash('Share URL Umami wajib diisi.')
      return
    }
    setSaving('umami')
    try {
      await api.ownerSetConfig('umami', {
        share_url: umamiForm.share_url.trim(),
        website_id: umamiForm.website_id.trim(),
      })
      await refreshConfig()
      flash('Konfigurasi Umami tersimpan')
    } catch (e) {
      flash('Gagal menyimpan konfigurasi Umami')
    } finally {
      setSaving('')
    }
  }

  // ---------------- Neon ----------------
  const saveNeon = async () => {
    // API key diacak setelah disimpan; wajib diisi ulang saat menyimpan
    // agar tidak menimpa nilai lama dengan kosong.
    if (!neonForm.api_key.trim()) {
      flash('API key Neon wajib diisi saat menyimpan.')
      return
    }
    setSaving('neon')
    setNeonError('')
    try {
      await api.ownerSetConfig('neon', {
        api_key: neonForm.api_key.trim(),
        projects: neonProjects,
      })
      await refreshConfig()
      setNeonForm((f) => ({ ...f, api_key: '' }))
      flash('Konfigurasi Neon tersimpan')
    } catch (e) {
      setNeonError('Gagal menyimpan konfigurasi Neon.')
    } finally {
      setSaving('')
    }
  }

  const addNeonProject = () => {
    const name = newNeonProject.trim()
    if (!name) return
    setNeonProjects((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setNewNeonProject('')
  }

  const removeNeonProject = (name) => {
    setNeonProjects((prev) => prev.filter((p) => p !== name))
  }

  const checkNeon = async () => {
    setNeonLoading(true)
    setNeonError('')
    setNeonStatus(null)
    try {
      const res = await api.neonStatus()
      setNeonStatus(res)
    } catch (e) {
      setNeonError('Gagal mengecek status Neon. Pastikan backend online dan API key valid.')
    } finally {
      setNeonLoading(false)
    }
  }

  const summarizeConsumption = (c) => {
    if (!c || !Array.isArray(c.data)) return null
    const storageBytes = c.data.reduce((s, d) => s + (d.data_storage_bytes_hour || 0), 0)
    const computeSeconds = c.data.reduce((s, d) => s + (d.compute_time_seconds || 0), 0)
    return { storageGb: storageBytes / 1e9, computeHours: computeSeconds / 3600 }
  }

  // ---------------- Backblaze B2 ----------------
  const saveB2 = async () => {
    if (!b2Form.key_id.trim() || !b2Form.application_key.trim()) {
      flash('keyID dan applicationKey B2 wajib diisi saat menyimpan.')
      return
    }
    setSaving('b2')
    setB2Error('')
    try {
      await api.ownerSetConfig('backblaze', {
        key_id: b2Form.key_id.trim(),
        application_key: b2Form.application_key.trim(),
        bucket_name: b2Form.bucket_name.trim(),
        endpoint: b2Form.endpoint.trim(),
      })
      await refreshConfig()
      setB2Form((f) => ({ ...f, key_id: '', application_key: '' }))
      flash('Konfigurasi Backblaze tersimpan')
    } catch (e) {
      setB2Error('Gagal menyimpan konfigurasi Backblaze.')
    } finally {
      setSaving('')
    }
  }

  const checkB2 = async () => {
    setB2Loading(true)
    setB2Error('')
    setB2Status(null)
    try {
      const res = await api.b2Status()
      setB2Status(res)
    } catch (e) {
      setB2Error('Gagal mengecek status Backblaze. Pastikan backend online dan kredensial valid.')
    } finally {
      setB2Loading(false)
    }
  }

  // ---------------- Logs ----------------
  const loadLogs = async () => {
    setLogsLoading(true)
    setLogsError('')
    try {
      const res = await api.ownerLogs()
      setLogs(res.logs || [])
    } catch (e) {
      setLogsError('Gagal memuat log aktivitas.')
    } finally {
      setLogsLoading(false)
    }
  }

  const fmtTime = (t) =>
    t ? new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'

  if (!isOwner) return null

  return (
    <Layout>
      <motion.div
        className="owner-dashboard-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>Pemantauan Owner</h1>
            <p>Analytics, database, storage, dan log aktivitas sistem</p>
          </div>
        </motion.div>

        <div className="role-notice owner-notice">
          <Crown size={16} />
          <span>Anda login sebagai Owner — berhak melihat & mengelola seluruh konfigurasi sistem.</span>
        </div>

        <div className="owner-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`owner-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="owner-tab-panel">
          {tab === 'analytics' && (
            <AnalyticsTab
              config={config}
              form={umamiForm}
              setForm={setUmamiForm}
              saving={saving === 'umami'}
              onSave={saveUmami}
            />
          )}

          {tab === 'database' && (
            <NeonTab
              config={config}
              form={neonForm}
              setForm={setNeonForm}
              projects={neonProjects}
              newProject={newNeonProject}
              setNewProject={setNewNeonProject}
              onAddProject={addNeonProject}
              onRemoveProject={removeNeonProject}
              onSave={saveNeon}
              saving={saving === 'neon'}
              status={neonStatus}
              loading={neonLoading}
              error={neonError}
              onCheck={checkNeon}
            />
          )}

          {tab === 'storage' && (
            <StorageTab
              config={config}
              form={b2Form}
              setForm={setB2Form}
              onSave={saveB2}
              saving={saving === 'b2'}
              status={b2Status}
              loading={b2Loading}
              error={b2Error}
              onCheck={checkB2}
            />
          )}

          {tab === 'logs' && (
            <LogsTab
              logs={logs}
              loading={logsLoading}
              error={logsError}
              onLoad={loadLogs}
              fmtTime={fmtTime}
            />
          )}

          {tab === 'saran' && <SuggestionsTab />}
        </div>

        {toast && (
          <div className="owner-toast">
            <Check size={15} /> {toast}
          </div>
        )}
      </motion.div>
    </Layout>
  )
}

/* ---------------- Tab: Analytics (Umami) ---------------- */

function AnalyticsTab({ config, form, setForm, saving, onSave }) {
  const hasShareUrl = Boolean(config?.umami?.share_url)
  return (
    <div className="owner-card">
      <div className="owner-card-head">
        <BarChart3 size={18} />
        <div>
          <h2>Analytics (Umami)</h2>
          <p>Dashboard pengunjung situs — share URL sudah menyematkan token auth, jadi cukup tempel linknya.</p>
        </div>
      </div>

      <div className="owner-form-grid">
        <div className="input-group">
          <label className="input-label">Share URL Umami</label>
          <input
            className="input"
            placeholder="mis. https://analytics.kamu.id/share/xxxxx/nama-situs"
            value={form.share_url}
            onChange={(e) => setForm({ ...form, share_url: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Website ID</label>
          <input
            className="input"
            placeholder="mis. abc123-def456"
            value={form.website_id}
            onChange={(e) => setForm({ ...form, website_id: e.target.value })}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
        <Save size={14} /> {saving ? 'Menyimpan…' : 'Simpan Konfigurasi'}
      </button>

      {hasShareUrl && (
        <div className="owner-iframe-wrap">
          <div className="owner-info-row">
            <span>Website ID: <strong>{config?.umami?.website_id || '-'}</strong></span>
          </div>
          <iframe
            src={config?.umami?.share_url}
            title="Umami Analytics"
            style={{ width: '100%', height: '600px', border: '0' }}
          />
        </div>
      )}
    </div>
  )
}

/* ---------------- Tab: Database (Neon) ---------------- */

function NeonTab({
  config, form, setForm, projects, newProject, setNewProject,
  onAddProject, onRemoveProject, onSave, saving, status, loading, error, onCheck,
}) {
  const consumption = summarizeNeonConsumption(status)
  return (
    <div className="owner-card">
      <div className="owner-card-head">
        <Database size={18} />
        <div>
          <h2>Database (Neon)</h2>
          <p>API key untuk memantau project & kuota PostgreSQL. Kuota gratis = 0.5 GB storage, 190 jam compute/bulan.</p>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Neon API Key</label>
        <input
          type="password"
          className="input"
          placeholder={config?.neon?.api_key_set ? 'API key sudah diatur — isi ulang untuk mengganti' : 'masukkan API key Neon'}
          value={form.api_key}
          onChange={(e) => setForm({ ...form, api_key: e.target.value })}
        />
        <p className="field-hint">API key disembunyikan setelah disimpan. Isi ulang bila ingin mengubah.</p>
      </div>

      <div className="owner-projects-box">
        <span className="item-label">Daftar Project (di konfigurasi)</span>
        {projects.length > 0 ? (
          <div className="owner-project-chips">
            {projects.map((p) => (
              <span key={p} className="owner-project-chip">
                <FolderOpen size={13} />
                {p}
                <button className="chip-remove" onClick={() => onRemoveProject(p)} title="Hapus dari daftar">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="item-desc">Belum ada project tercatat di konfigurasi.</p>
        )}
        <div className="owner-project-add">
          <input
            className="input"
            placeholder="Nama project baru, mis. Database 2"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onAddProject() }}
          />
          <button className="btn btn-secondary btn-sm" onClick={onAddProject}>
            <Plus size={14} /> Tambah
          </button>
        </div>
        <p className="field-hint">
          Jika Database 1 penuh, tambah project Neon baru dan isi API key di sini.
        </p>
      </div>

      <div className="owner-actions">
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Menyimpan…' : 'Simpan Konfigurasi'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCheck} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Mengecek…' : 'Cek Status'}
        </button>
      </div>

      {error && <p className="owner-error">{error}</p>}

      {status && !status.configured && (
        <div className="owner-warning">
          <KeyRound size={15} />
          <span>{status.message || 'Neon belum dikonfigurasi.'}</span>
        </div>
      )}

      {status?.configured && (
        <div className="owner-status-block">
          <div className="owner-status-head">
            <h3>Project Neon</h3>
          </div>
          {Array.isArray(status.projects) && status.projects.length > 0 ? (
            <div className="owner-table-wrap">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Region</th>
                    <th>Dibuat</th>
                    <th>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {status.projects.map((p) => (
                    <tr key={p.id || p.name}>
                      <td>{p.name || p.id}</td>
                      <td>{p.region_id || p.region?.id || '-'}</td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}</td>
                      <td>
                        {Array.isArray(p.branches) && p.branches.length > 0
                          ? p.branches.map((b) => b.name || b.id).join(', ')
                          : p.branch_ids && p.branch_ids.length
                            ? `${p.branch_ids.length} branch`
                            : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="item-desc">Tidak ada project ditemukan untuk API key ini.</p>
          )}

          {consumption && (
            <div className="owner-quota">
              <div className="owner-quota-item">
                <span className="quota-label">Storage</span>
                <span className="quota-value">{consumption.storageGb.toFixed(3)} GB <em>/ 0.5 GB gratis</em></span>
                <div className="quota-bar">
                  <div
                    className="quota-fill"
                    style={{ width: `${Math.min(100, (consumption.storageGb / 0.5) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="owner-quota-item">
                <span className="quota-label">Compute</span>
                <span className="quota-value">{consumption.computeHours.toFixed(1)} jam <em>/ 190 jam gratis</em></span>
                <div className="quota-bar">
                  <div
                    className="quota-fill"
                    style={{ width: `${Math.min(100, (consumption.computeHours / 190) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="owner-raw">
            <span className="item-label">Respons mentah (raw JSON)</span>
            <pre className="owner-pre">{JSON.stringify(status, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function summarizeNeonConsumption(status) {
  if (!status?.configured || !status.consumption || !Array.isArray(status.consumption.data)) return null
  const storageBytes = status.consumption.data.reduce((s, d) => s + (d.data_storage_bytes_hour || 0), 0)
  const computeSeconds = status.consumption.data.reduce((s, d) => s + (d.compute_time_seconds || 0), 0)
  return { storageGb: storageBytes / 1e9, computeHours: computeSeconds / 3600 }
}

/* ---------------- Tab: Storage (Backblaze B2) ---------------- */

function StorageTab({ config, form, setForm, onSave, saving, status, loading, error, onCheck }) {
  return (
    <div className="owner-card">
      <div className="owner-card-head">
        <HardDrive size={18} />
        <div>
          <h2>Storage (Backblaze B2)</h2>
          <p>Penyimpanan objek untuk foto profil & selfie absensi.</p>
        </div>
      </div>

      <div className="owner-form-grid">
        <div className="input-group">
          <label className="input-label">keyID</label>
          <input
            type="password"
            className="input"
            placeholder={config?.backblaze?.key_id_set ? 'keyID sudah diatur — isi ulang untuk mengganti' : 'masukkan keyID B2'}
            value={form.key_id}
            onChange={(e) => setForm({ ...form, key_id: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">applicationKey</label>
          <input
            type="password"
            className="input"
            placeholder="masukkan application key B2"
            value={form.application_key}
            onChange={(e) => setForm({ ...form, application_key: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Nama Bucket</label>
          <input
            className="input"
            placeholder="mis. luxio-files"
            value={form.bucket_name}
            onChange={(e) => setForm({ ...form, bucket_name: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Endpoint</label>
          <input
            className="input"
            placeholder="mis. s3.us-west-004.backblazeb2.com"
            value={form.endpoint}
            onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
          />
        </div>
      </div>
      <p className="field-hint">
        Kredensial diacak setelah disimpan — isi ulang bila ingin mengubah. Bucket & endpoint bisa diubah tanpa kredensial baru.
      </p>

      <div className="owner-actions">
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Menyimpan…' : 'Simpan Konfigurasi'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCheck} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Mengecek…' : 'Cek Status'}
        </button>
      </div>

      {error && <p className="owner-error">{error}</p>}

      {status && !status.configured && (
        <div className="owner-warning">
          <KeyRound size={15} />
          <span>{status.message || 'Backblaze belum dikonfigurasi.'}</span>
        </div>
      )}

      {status?.configured && (
        <div className="owner-status-block">
          <div className="owner-account-info">
            <div className="owner-account-item">
              <span className="item-label">Account ID</span>
              <span className="item-value mono">{status.account_id || '-'}</span>
            </div>
            <div className="owner-account-item">
              <span className="item-label">API URL</span>
              <span className="item-value mono">{status.api_url || '-'}</span>
            </div>
            <div className="owner-account-item">
              <span className="item-label">Download URL</span>
              <span className="item-value mono">{status.download_url || '-'}</span>
            </div>
            {status.allowed && (
              <div className="owner-account-item">
                <span className="item-label">Akses diizinkan</span>
                <span className="item-value mono">{JSON.stringify(status.allowed)}</span>
              </div>
            )}
          </div>
          <div className="owner-raw">
            <span className="item-label">Respons mentah (raw JSON)</span>
            <pre className="owner-pre">{JSON.stringify(status, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Tab: Log Aktivitas ---------------- */

function LogsTab({ logs, loading, error, onLoad, fmtTime }) {
  const isBad = (result) => result === 'error' || result === 'blocked' || result === 'failed'
  return (
    <div className="owner-card">
      <div className="owner-card-head">
        <ScrollText size={18} />
        <div>
          <h2>Log Aktivitas</h2>
          <p>Audit log seluruh sistem (200 entri terakhir).</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLoad} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Memuat…' : 'Muat Log'}
        </button>
      </div>

      {error && <p className="owner-error">{error}</p>}

      {logs.length === 0 && !loading && (
        <div className="owner-empty">Belum ada log dimuat.</div>
      )}

      {logs.length > 0 && (
        <div className="owner-table-wrap">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Aksi</th>
                <th>Hasil</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} title={l.detail || ''}>
                  <td className="nowrap">{fmtTime(l.created_at)}</td>
                  <td>
                    <span className="log-user">{l.user_name || 'Sistem'}</span>
                    {l.user_email && <span className="log-email">{l.user_email}</span>}
                  </td>
                  <td className="nowrap">
                    <span className="log-tool">{l.tool_name || '-'}</span>
                    <span className="log-action">{l.action || '-'}</span>
                  </td>
                  <td>
                    <span className={`log-result ${isBad(l.result) ? 'bad' : ''}`}>{l.result || '-'}</span>
                  </td>
                  <td className="log-target">{l.target_resource || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------------- Tab: Saran Fitur ---------------- */

function SuggestionsTab() {
  return (
    <div className="owner-card">
      <div className="owner-card-head">
        <Lightbulb size={18} />
        <div>
          <h2>Saran Fitur</h2>
          <p>Ringkasan fitur gratis vs berbayar (detail lengkap di rekomendasi_fitur.md).</p>
        </div>
      </div>

      <div className="suggestion-grid">
        <div className="suggestion-col free">
          <h3>Gratis di Luxio</h3>
          <ul>
            <li>Manajemen target & proyek (todo + kanban)</li>
            <li>Catatan pribadi + PIN</li>
            <li>Kalender & pengingat</li>
            <li>Tim, divisi & kewenangan</li>
            <li>Chat antar anggota + grup otomatis</li>
            <li>Absen masuk + GPS & selfie</li>
            <li>Keamanan: 2FA, PIN, email konfirmasi</li>
          </ul>
        </div>

        <div className="suggestion-col paid">
          <h3>Berbayar di Luxio</h3>
          <ul>
            <li>Analytics (Umami) — dashboard pengunjung</li>
            <li>Monitoring Database (Neon) — kuota & pemakaian</li>
            <li>Penyimpanan (Backblaze B2) — foto profil & absensi</li>
            <li>AI Agent — otomatisasi task via tool layer</li>
            <li>Kuota project/task lebih besar & anggota tak terbatas</li>
          </ul>
        </div>
      </div>

      <div className="owner-note">
        <strong>Rekomendasi:</strong> gratis untuk kebutuhan dasar tim kecil; upgrade ke paket berbayar
        untuk membuka analytics, monitoring database, penyimpanan, dan AI Agent. Semua paket tersedia
        trial 1 bulan.
      </div>
    </div>
  )
}
