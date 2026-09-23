import { useState, useEffect, useRef } from 'react'
import { getAppThemeFamily, getAppThemeMode, makeAppTheme, useStore } from '../store/useStore'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import PinInput from '../components/PinInput'
import { motion } from 'framer-motion'
import { User, Bell, Shield, HelpCircle, Lock, KeyRound, Save, Users, Briefcase, Phone, MapPin, Calendar, GraduationCap, Wallet, Pencil, AlertTriangle, Bot, Eye, EyeOff, Download, Upload, Zap, Palette, Trash2, Plus, Cloud, CloudOff, RefreshCw, Database, Cpu } from 'lucide-react'
import { api } from '../services/api'
import useSyncStatus, { STORAGE_SOFT_LIMIT_BYTES } from '../hooks/useSyncStatus'
import './Settings.css'

// =====================================================================
// Settings.jsx — Pengaturan lengkap akun (Item 1 + Item 2).
// =====================================================================
// - Menampilkan SEMUA data pribadi (nama, email, no HP, gender, alamat,
//   posisi, join date, status pegawai, pendidikan, gaji).
// - Data login: email & PIN akun.
// - Edit sendiri maksimal 3x/bulan; admin/super_admin bisa edit data user
//   lain maksimal 10x/bulan. Counter direset otomatis tiap bulan.
// - "Ubah PIN" untuk mengganti PIN akun (catatan pribadi).
// =====================================================================

const GENDER_OPTIONS = ['', 'Laki-laki', 'Perempuan']
const STATUS_OPTIONS = ['', 'Full-time', 'Part-time', 'Kontrak', 'Magang', 'Freelance']
const EDU_OPTIONS = ['', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']
const THEME_FAMILY_OPTIONS = [
  { value: 'sanity', label: 'Sanity' },
  { value: 'luxio', label: 'Luxio' },
  { value: 'luxio-new', label: 'Luxio New' },
  { value: 'main-white', label: 'Main White' },
]
const THEME_MODE_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

// =====================================================================
// SyncSettingsPanel — Status sinkronisasi & penyimpanan lokal (Tahap 4).
// Muncul DI SINI (halaman Pengaturan) saja, bukan di topbar.
// =====================================================================
function SyncSettingsPanel() {
  const { online, pending, storage, storageLabel, storagePct, flushing, syncNow } = useSyncStatus()
  const nearLimit = storage > STORAGE_SOFT_LIMIT_BYTES * 0.9

  return (
    <>
      <div className="settings-item column-item">
        <div>
          <span className="item-label">Status koneksi</span>
          <span className="item-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className={`sync-dot ${online ? 'on' : 'off'}`} />
            {online ? 'Online — terhubung ke server' : 'Offline — bekerja dari data lokal'}
          </span>
        </div>
      </div>

      <div className="settings-item column-item">
        <div>
          <span className="item-label">Perubahan menunggu dikirim</span>
          <span className="item-value">
            {pending === 0
              ? 'Semua tersinkron.'
              : `${pending} operasi menunggu — akan otomatis terkirim saat koneksi pulih.`}
          </span>
        </div>
        {pending > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 10 }}
            onClick={() => syncNow()}
            disabled={flushing || !online}
          >
            <RefreshCw size={14} className={flushing ? 'spin' : ''} />
            {flushing ? 'Menyinkronkan…' : 'Sinkronkan sekarang'}
          </button>
        )}
      </div>

      <div className="settings-item column-item">
        <div>
          <span className="item-label">Penyimpanan lokal perangkat</span>
          <span className="item-value">
            {storageLabel} digunakan ({storagePct}% dari {Math.round(STORAGE_SOFT_LIMIT_BYTES / (1024 * 1024))} MB)
          </span>
        </div>
        <div className="storage-meter">
          <div
            className={`storage-meter-fill ${nearLimit ? 'warn' : ''}`}
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <p className="item-hint">
          {nearLimit
            ? 'Penyimpanan hampir penuh. Data lama akan dibersihkan otomatis atau hapus data yang tidak terpakai.'
            : 'Data disimpan di perangkat agar cepat tampil & bisa diakses offline. Data lama dibersihkan otomatis.'}
        </p>
      </div>
    </>
  )
}

// =====================================================================
// NeonOrgManagement — Kelola Organization ID untuk Neon Storage Tab
// =====================================================================
function NeonOrgManagement() {
  const [orgIds, setOrgIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOrgId, setNewOrgId] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadOrgIds = async () => {
    setLoading(true)
    try {
      const res = await api.getNeonOrganizations()
      setOrgIds(res.organizations || [])
    } catch (e) {
      setError(e.message || 'Gagal memuat daftar organization')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrgIds()
  }, [])

  const handleAdd = async () => {
    if (!newOrgId.trim()) {
      setError('Organization ID wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.addNeonOrganization({
        org_id: newOrgId.trim(),
        name: newOrgName.trim() || newOrgId.trim(),
      })
      setSuccess('Organization berhasil ditambahkan')
      setNewOrgId('')
      setNewOrgName('')
      setShowAddForm(false)
      await loadOrgIds()
    } catch (e) {
      setError(e.message || 'Gagal menambahkan organization')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus organization ini?')) return
    setLoading(true)
    setError('')
    try {
      await api.deleteNeonOrganization(id)
      setSuccess('Organization berhasil dihapus')
      await loadOrgIds()
    } catch (e) {
      setError(e.message || 'Gagal menghapus organization')
    } finally {
      setLoading(false)
    }
  }

  const handleSetActive = async (id) => {
    setLoading(true)
    setError('')
    try {
      await api.setActiveNeonOrganization(id)
      setSuccess('Organization aktif diubah')
      await loadOrgIds()
    } catch (e) {
      setError(e.message || 'Gagal mengubah organization aktif')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="settings-section" variants={{ hidden: { opacity: 1, y: 15 }, visible: { opacity: 1, y: 0 } }}>
      <div className="section-header">
        <Cloud size={18} />
        <h2>Neon Organization</h2>
      </div>
      <div className="settings-card">
        <div className="settings-item column-item">
          <div>
            <span className="item-label">Kelola Organization ID</span>
            <p className="item-desc">
              Tambah, hapus, atau ganti organization aktif untuk Storage Tab. 
              Organization aktif akan digunakan untuk menampilkan data storage.
            </p>
          </div>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => {
              setShowAddForm(!showAddForm)
              setError('')
              setSuccess('')
            }}
          >
            <Plus size={14} /> Tambah Organization
          </button>
        </div>

        {error && (
          <div className="settings-item">
            <div className="gmail-error" style={{ marginBottom: 10 }}>
              <AlertTriangle size={15} /> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="settings-item">
            <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: 10 }}>
              ✅ {success}
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="settings-item column-item" style={{ background: 'var(--bg-secondary)', padding: 15, marginBottom: 15 }}>
            <div className="input-group">
              <label className="input-label">Organization ID <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                className="input"
                placeholder="mis. org-curly-bonus-71722205"
                value={newOrgId}
                onChange={(e) => {
                  setNewOrgId(e.target.value)
                  setError('')
                }}
              />
              <p className="field-hint">
                Format: org-xxxxx-xxxxx-xxxxx. Bisa dilihat di Neon Console → Organization Settings.
              </p>
            </div>
            <div className="input-group">
              <label className="input-label">Nama Organization (opsional)</label>
              <input
                className="input"
                placeholder="mis. My Company"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </div>
            <div className="settings-modal-actions" style={{ justifyContent: 'flex-start', gap: 10 }}>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleAdd}
                disabled={loading || !newOrgId.trim()}
              >
                <Plus size={14} /> {loading ? 'Menyimpan…' : 'Simpan'}
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => {
                  setShowAddForm(false)
                  setNewOrgId('')
                  setNewOrgName('')
                  setError('')
                }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {loading && orgIds.length === 0 ? (
          <div className="settings-item">
            <span className="item-value">Memuat...</span>
          </div>
        ) : orgIds.length === 0 ? (
          <div className="settings-item">
            <span className="item-value">
              Belum ada organization. Tambahkan satu untuk menggunakan Storage Tab.
            </span>
          </div>
        ) : (
          <div className="ai-provider-list">
            {orgIds.map((org) => (
              <div key={org.id} className={`ai-provider-item ${org.is_active ? 'active' : ''}`}>
                <div className="ai-provider-main">
                  <span className="ai-provider-name">{org.name || org.org_id}</span>
                  <span className="ai-provider-meta">
                    {org.org_id}{org.is_active ? ' · aktif' : ''}
                  </span>
                </div>
                <div className="ai-provider-actions">
                  {!org.is_active && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleSetActive(org.id)}
                      disabled={loading}
                      title="Jadikan aktif"
                    >
                      Aktifkan
                    </button>
                  )}
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(org.id)}
                    disabled={loading}
                    title="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// =====================================================================
// CredentialManagement — kredensial API terenkripsi di database
// (Requirements Document: user-credentials-management).
// Hanya owner/super_admin. Nilai SELALU masked dari server (Req 14.7);
// ikon mata memanggil endpoint /reveal yang diaudit + auto re-mask
// setelah 30 detik tanpa aktivitas (Req 14.3-14.6).
// =====================================================================
const CRED_PROVIDERS = ['neon', 'smtp', 'backblaze_b2', 'openai', 'anthropic', 'custom']
const CRED_PROVIDER_LABELS = {
  neon: 'Neon',
  smtp: 'SMTP',
  backblaze_b2: 'Backblaze B2',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom: 'Custom',
}
// Field per provider (Req 2.2-2.7). `secret: 'password'` -> dots,
// `secret: 'key'` -> mask parsial "abc...xyz" (server-side yang otoritatif).
const CRED_FIELD_DEFS = {
  neon: [
    { key: 'api_key', label: 'API Key', required: true, secret: 'key', hint: 'Organization / Personal API key dari Neon Console' },
    { key: 'org_id', label: 'Organization ID (opsional)', hint: 'org-xxxxx-xxxxx-xxxxx' },
  ],
  smtp: [
    { key: 'host', label: 'Host', required: true, placeholder: 'smtp.gmail.com' },
    { key: 'port', label: 'Port', required: true, type: 'number', placeholder: '587' },
    { key: 'username', label: 'Username', required: true },
    { key: 'password', label: 'Password / App Password', required: true, secret: 'password' },
    { key: 'from_address', label: 'From Address', required: true, placeholder: 'noreply@domain.com' },
  ],
  backblaze_b2: [
    { key: 'application_key_id', label: 'Application Key ID', required: true, secret: 'key', hint: 'Contoh: 005xxxxxxx (12 digit, dari B2 → App Keys → Key ID)' },
    { key: 'application_key', label: 'Application Key', required: true, secret: 'key', hint: 'Di-generate dari B2 → App Keys → Generate New (bukan Master Key)' },
    { key: 'bucket_name', label: 'Bucket Name (opsional)', hint: 'Jika kosong, otomatis pakai bucket "luxio-files"' },
  ],
  openai: [
    { key: 'api_key', label: 'API Key', required: true, secret: 'key', hint: 'Dimulai dengan "sk-"' },
    { key: 'organization_id', label: 'Organization ID (opsional)' },
    { key: 'base_url', label: 'Base URL (opsional)', hint: 'default https://api.openai.com/v1' },
  ],
  anthropic: [
    { key: 'api_key', label: 'API Key', required: true, secret: 'key', hint: 'Dimulai dengan "sk-ant-"' },
  ],
  custom: [],
}

function credApiMsg(e, fallback) {
  // Pesan error server selalu generik / tanpa plaintext (Req 3.10-3.11).
  try {
    const j = JSON.parse(e.message)
    if (j && j.message) return j.message
  } catch { /* bukan JSON — pakai teks mentah */ }
  return e.message || fallback || 'Operasi gagal'
}

function customSecretKind(key) {
  const k = String(key).toLowerCase()
  if (k.includes('password')) return 'password'
  if (k.includes('key') || k.includes('secret') || k.includes('token')) return 'key'
  return null
}

function CredentialManagement({ isOwner }) {
  const [creds, setCreds] = useState([])
  const [envProviders, setEnvProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(null)
  const [revealed, setRevealed] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [ioModal, setIoModal] = useState(null)
  const lastActivity = useRef(Date.now())
  const revealedRef = useRef(revealed)
  revealedRef.current = revealed

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.listCredentials()
      setCreds(res.credentials || [])
      setEnvProviders(res.env_providers || [])
    } catch (e) {
      setError(credApiMsg(e, 'Gagal memuat daftar kredensial'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Req 14.6 — auto re-mask setelah 30 detik tanpa aktivitas di Settings.
  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now() }
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    const timer = setInterval(() => {
      if (Object.keys(revealedRef.current).length && Date.now() - lastActivity.current > 30000) {
        setRevealed({})
      }
    }, 5000)
    return () => {
      window.removeEventListener('mousemove', bump)
      window.removeEventListener('keydown', bump)
      clearInterval(timer)
    }
  }, [])

  const openForm = (provider, cred) => {
    const values = {}
    ;(CRED_FIELD_DEFS[provider] || []).forEach((f) => {
      values[f.key] = cred && cred.data ? (cred.data[f.key] ?? '') : ''
    })
    setForm({
      mode: cred ? 'edit' : 'add',
      id: cred?.id,
      provider,
      displayName: cred?.display_name || '',
      values,
      customPairs: cred && provider === 'custom'
        ? Object.entries(cred.data || {}).map(([k, v]) => ({ k, v: String(v ?? '') }))
        : [{ k: '', v: '' }],
      show: {},
      test: null,
      busy: false,
    })
    setError('')
    setSuccess('')
  }

  const buildData = () => {
    if (form.provider === 'custom') {
      const out = {}
      form.customPairs.forEach(({ k, v }) => {
        const key = k.trim()
        if (key) out[key] = v
      })
      return out
    }
    const out = {}
    CRED_FIELD_DEFS[form.provider].forEach((f) => {
      const raw = String(form.values[f.key] ?? '').trim()
      if (raw !== '') out[f.key] = f.type === 'number' ? Number(raw) : raw
    })
    return out
  }

  const submitForm = async () => {
    setForm({ ...form, busy: true })
    setError('')
    setSuccess('')
    try {
      const payload = {
        provider_type: form.provider,
        display_name: form.displayName.trim(),
        data: buildData(),
      }
      if (form.mode === 'add') {
        const res = await api.createCredential(payload)
        setSuccess(`Kredensial ${CRED_PROVIDER_LABELS[form.provider]} berhasil disimpan` + (res.warning ? ` — ${res.warning}` : ''))
      } else {
        const res = await api.updateCredential(form.id, payload)
        setSuccess('Kredensial berhasil diperbarui' + (res.warning ? ` — ${res.warning}` : ''))
      }
      setForm(null)
      await load() // Req 3.5 — refresh daftar setelah submit
    } catch (e) {
      setError(credApiMsg(e, 'Gagal menyimpan kredensial'))
      setForm({ ...form, busy: false })
    }
  }

  // Req 12 — uji koneksi, read-only (tidak menyimpan apa pun).
  const testConnection = async () => {
    const target = form.mode === 'edit'
      ? { id: form.id }
      : { provider_type: form.provider, data: buildData() }
    setForm({ ...form, test: { busy: true } })
    try {
      const res = await api.testCredential(target)
      setForm({ ...form, test: { ok: true, text: res.message || 'Connection successful' } })
    } catch (e) {
      setForm({ ...form, test: { ok: false, text: credApiMsg(e, 'Uji koneksi gagal') } })
    }
  }

  const activate = async (id) => {
    setError('')
    setSuccess('')
    try {
      const res = await api.activateCredential(id)
      setSuccess('Kredensial diaktifkan' + (res.warning ? ` — ${res.warning}` : ''))
      await load()
    } catch (e) {
      setError(credApiMsg(e, 'Gagal mengaktifkan kredensial'))
    }
  }

  const confirmDelete = async () => {
    const t = deleteTarget
    if (!t) return
    setError('')
    try {
      await api.deleteCredential(t.id)
      setSuccess('Kredensial berhasil dihapus') // Req 15.7
      setDeleteTarget(null)
      setDeleteConfirm('')
      await load()
    } catch (e) {
      setDeleteTarget(null)
      setError(credApiMsg(e, 'Gagal menghapus kredensial')) // Req 15.8
    }
  }

  const toggleReveal = async (c) => {
    if (revealed[c.id]) {
      const next = { ...revealed }
      delete next[c.id]
      setRevealed(next) // Req 14.5 — klik lagi -> masked lagi
      return
    }
    try {
      const res = await api.revealCredential(c.id)
      setRevealed({ ...revealed, [c.id]: res.data || {} }) // Req 14.4
    } catch (e) {
      setError(credApiMsg(e, 'Gagal membuka kredensial'))
    }
  }

  const doExport = async () => {
    setIoModal({ ...ioModal, busy: true, error: '' })
    try {
      const res = await api.exportCredentials(ioModal.password)
      // Req 17.1 — unduh berkas JSON terenkripsi password.
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.bundle, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = res.file_name || 'luxio-credentials-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setIoModal(null)
      setSuccess(`Ekspor ${res.count} kredensial ke berkas terenkripsi`)
    } catch (e) {
      setIoModal({ ...ioModal, busy: false, error: credApiMsg(e, 'Ekspor gagal') })
    }
  }

  const onImportFile = async (file) => {
    if (!file) return
    try {
      const bundle = JSON.parse(await file.text())
      setIoModal({ ...ioModal, bundle, fileName: file.name, error: '', summary: '', errors: [] })
    } catch {
      setIoModal({ ...ioModal, bundle: null, fileName: '', error: 'Berkas bukan JSON ekspor yang valid' })
    }
  }

  const doImport = async () => {
    setIoModal({ ...ioModal, busy: true, error: '' })
    try {
      const res = await api.importCredentials(ioModal.password, ioModal.bundle)
      setIoModal({
        ...ioModal,
        busy: false,
        errors: res.errors || [],
        summary: res.summary_text || `${res.imported} credentials imported, ${res.skipped} skipped`, // Req 17.8
      })
      await load() // Req 3.5
    } catch (e) {
      setIoModal({ ...ioModal, busy: false, error: credApiMsg(e, 'Impor gagal') })
    }
  }

  // Req 8 — migrasi kredensial .env ke database (khusus owner).
  const importEnv = async () => {
    if (!window.confirm('Impor kredensial dari variabel .env backend ke database terenkripsi?')) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await api.importEnvCredentials()
      const parts = []
      if (res.imported?.length) parts.push(`${res.imported.length} diimpor`)
      if (res.skipped?.length) parts.push(`${res.skipped.length} dilewati`)
      if (res.errors?.length) parts.push(`${res.errors.length} error`)
      setSuccess(`Impor dari .env selesai: ${parts.join(', ') || 'tidak ada perubahan'}. ${res.note || ''}`)
      await load()
    } catch (e) {
      setError(credApiMsg(e, 'Impor dari .env gagal'))
    } finally {
      setLoading(false)
    }
  }

  const fieldLabel = (f) => `${f.label}${f.required ? ' *' : ''}`

  return (
    <motion.div className="settings-section" variants={{ hidden: { opacity: 1, y: 15 }, visible: { opacity: 1, y: 0 } }}>
      <div className="section-header">
        <KeyRound size={18} />
        <h2>Credentials Management</h2>
      </div>
      <div className="settings-card">
        <div className="settings-item column-item">
          <div>
            <span className="item-label">Kredensial API (terenkripsi AES-256-GCM di database)</span>
            <p className="item-desc">
              Simpan API key Neon, SMTP, Backblaze B2, OpenAI, Anthropic, atau custom di sini —
              bukan di file .env, sehingga tidak akan pernah ter-commit ke Git.
              Nilai sensitif selalu ditampilkan ter-mask; klik ikon mata untuk membuka sementara
              (tertutup sendiri setelah 30 detik tidak aktif).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIoModal({ mode: 'export', password: '', busy: false, error: '' })}>
              <Download size={13} /> Export Credentials
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIoModal({ mode: 'import', password: '', bundle: null, fileName: '', busy: false, error: '', summary: '', errors: [] })}>
              <Upload size={13} /> Import Credentials
            </button>
          </div>
        </div>

        {envProviders.length > 0 && (
          <div className="settings-item column-item">
            <div className="cred-env-banner">
              <AlertTriangle size={15} />
              <div style={{ flex: 1 }}>
                Provider yang juga masih terisi di .env: <strong>{envProviders.map((p) => CRED_PROVIDER_LABELS[p] || p).join(', ')}</strong>.
                {' '}Kredensial database diprioritaskan saat keduanya ada.
                {isOwner && (
                  <button className="btn btn-secondary btn-sm" style={{ marginLeft: 10 }} onClick={importEnv} disabled={loading}>
                    Import dari .env
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="settings-item">
            <div className="gmail-error" style={{ marginBottom: 10 }}>
              <AlertTriangle size={15} /> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="settings-item">
            <div className="cred-success" style={{ marginBottom: 10 }}>
              ✅ {success}
            </div>
          </div>
        )}

        {loading && creds.length === 0 ? (
          <div className="settings-item">
            <span className="item-value">Memuat kredensial…</span>
          </div>
        ) : (
          CRED_PROVIDERS
            .filter((provider) => {
              // Neon & B2 khusus owner saja (akses halaman Penyimpanan).
              if ((provider === 'neon' || provider === 'backblaze_b2') && !isOwner) return false
              return true
            })
            .map((provider) => {
            const list = creds.filter((c) => c.provider_type === provider)
            const label = CRED_PROVIDER_LABELS[provider] || provider
            return (
              <div key={provider} className="settings-item column-item cred-group">
                <div className="cred-group-head">
                  <span className="item-label">
                    {label}
                    <span className="cred-count"> · {list.length > 0 ? `${list.length} tersimpan` : 'belum ada'}</span>
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={() => openForm(provider, null)}>
                    <Plus size={14} /> Add Credential
                  </button>
                </div>

                {list.length === 0 ? (
                  <p className="item-desc">Belum ada kredensial {label}. Klik “Add Credential” untuk menambah.</p>
                ) : (
                  <div className="ai-provider-list" style={{ width: '100%' }}>
                    {list.map((c) => {
                      const isRevealed = !!revealed[c.id]
                      const plain = revealed[c.id] || {}
                      return (
                        <div key={c.id} className={`ai-provider-item ${c.is_active ? 'active' : ''}`}>
                          <div className="ai-provider-main">
                            <span className="ai-provider-name">
                              {c.display_name}
                              {c.is_active && <span className="cred-badge cred-badge-active">Active</span>}
                              {c.needs_rotation && (
                                <span className="cred-badge" role="note">
                                  <AlertTriangle size={11} /> Consider rotating this credential
                                  <span className="cred-tooltip">
                                    This credential is {c.age_days} days old. Rotate credentials regularly for better security.
                                  </span>
                                </span>
                              )}
                            </span>
                            <span className="ai-provider-meta">
                              {label}
                              {c.decrypt_error && ' · data tidak terbaca (kunci enkripsi berubah?)'}
                              {' · '}{isRevealed ? 'tertampil' : 'masked'}
                            </span>
                            <div className="cred-fields">
                              {Object.entries(c.data || {}).map(([k, v]) => (
                                <code key={k} className="cred-field-pair">
                                  {k}: {isRevealed && plain[k] !== undefined ? String(plain[k]) : String(v ?? '')}
                                </code>
                              ))}
                            </div>
                          </div>
                          <div className="ai-provider-actions">
                            {/* Req 14.3-14.5 — ikon mata buka/tutup plaintext */}
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleReveal(c)}
                              title={isRevealed ? 'Tutup nilai kredensial' : 'Tampilkan nilai lengkap'}
                              disabled={!c.data}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            {!c.is_active && (
                              <button className="btn btn-secondary btn-sm" onClick={() => activate(c.id)} title="Jadikan aktif">
                                Activate
                              </button>
                            )}
                            <button className="btn btn-secondary btn-sm" onClick={() => openForm(c.provider_type, c)} title="Edit">
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => { setDeleteTarget(c); setDeleteConfirm(''); setError('') }}
                              title="Hapus"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ---- Form tambah/edit (+ Test Connection) ---- */}
      {form && (
        <div className="settings-modal-overlay" onClick={() => setForm(null)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <KeyRound size={16} />
              <h3>{form.mode === 'add' ? `+ Add Credential — ${CRED_PROVIDER_LABELS[form.provider]}` : `Edit — ${CRED_PROVIDER_LABELS[form.provider]}`}</h3>
            </div>
            <p className="settings-modal-desc">
              Data dikirim ke backend dan disimpan terenkripsi (AES-256-GCM).
              {' '}Field bertanda * wajib diisi. Saat edit, nilai berformat “abc…xyz” berarti tidak diubah.
            </p>

            <div className="input-group">
              <label className="input-label">Nama Tampilan *</label>
              <input
                className="input"
                maxLength={100}
                placeholder='mis. "Neon Produksi"'
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
              <p className="field-hint">Maksimal 100 karakter. Tag HTML dibersihkan otomatis.</p>
            </div>

            {CRED_FIELD_DEFS[form.provider].map((f) => (
              <div className="input-group" key={f.key}>
                <label className="input-label">{fieldLabel(f)}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={f.secret && !form.show[f.key] ? 'password' : f.type === 'number' ? 'number' : 'text'}
                    placeholder={f.placeholder || (form.mode === 'add' ? (f.hint || '') : '')}
                    value={form.values[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, values: { ...form.values, [f.key]: e.target.value }, test: null })}
                  />
                  {f.secret && (
                    <button
                      type="button"
                      className="cred-eye"
                      onClick={() => setForm({ ...form, show: { ...form.show, [f.key]: !form.show[f.key] } })}
                      title="Toggle visibilitas"
                    >
                      {form.show[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                {f.hint && <p className="field-hint">{f.hint}</p>}
              </div>
            ))}

            {form.provider === 'custom' && (
              <div className="input-group">
                <label className="input-label">Key-value pairs *</label>
                {form.customPairs.map((pair, i) => {
                  const kind = customSecretKind(pair.k)
                  return (
                    <div className="cred-pair-row" key={i}>
                      <input
                        className="input"
                        placeholder="mis. client_id"
                        value={pair.k}
                        onChange={(e) => {
                          const next = [...form.customPairs]
                          next[i] = { ...next[i], k: e.target.value }
                          setForm({ ...form, customPairs: next })
                        }}
                      />
                      <input
                        className="input"
                        type={kind && !form.show[`pair${i}`] ? 'password' : 'text'}
                        placeholder="value"
                        value={pair.v}
                        onChange={(e) => {
                          const next = [...form.customPairs]
                          next[i] = { ...next[i], v: e.target.value }
                          setForm({ ...form, customPairs: next })
                        }}
                      />
                      {kind && (
                        <button
                          type="button"
                          className="cred-eye"
                          onClick={() => setForm({ ...form, show: { ...form.show, [`pair${i}`]: !form.show[`pair${i}`] } })}
                        >
                          {form.show[`pair${i}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setForm({ ...form, customPairs: form.customPairs.filter((_, j) => j !== i) })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setForm({ ...form, customPairs: [...form.customPairs, { k: '', v: '' }] })}
                >
                  <Plus size={13} /> Tambah pasangan
                </button>
                <p className="field-hint">Key yang mengandung “key/secret/token/password” otomatis di-mask di daftar.</p>
              </div>
            )}

            {form.test && (
              <div className={form.test.ok ? 'settings-modal-success' : 'settings-modal-error'}>
                {form.test.busy ? 'Menguji koneksi…' : form.test.text}
              </div>
            )}
            {error && <div className="settings-modal-error">{error}</div>}

            <div className="settings-modal-actions">
              {form.provider !== 'custom' && (
                <button className="btn btn-secondary" onClick={testConnection} disabled={form.test?.busy || form.busy}>
                  <Zap size={14} /> Test Connection
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setForm(null)}>Batal</button>
              <button className="btn btn-primary" onClick={submitForm} disabled={form.busy}>
                <Save size={14} /> {form.busy ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Konfirmasi hapus (Req 15) ---- */}
      {deleteTarget && (
        <div className="settings-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <Trash2 size={16} />
              <h3>Hapus kredensial?</h3>
            </div>
            <p className="settings-modal-desc">
              <strong>{deleteTarget.display_name}</strong> provider <strong>{CRED_PROVIDER_LABELS[deleteTarget.provider_type] || deleteTarget.provider_type}</strong>
            </p>
            {deleteTarget.is_active && (
              <>
                <div className="settings-modal-error" style={{ marginBottom: 4 }}>
                  This is your active credential for {CRED_PROVIDER_LABELS[deleteTarget.provider_type] || deleteTarget.provider_type}.
                  {' '}Deleting it will disable {CRED_PROVIDER_LABELS[deleteTarget.provider_type] || deleteTarget.provider_type} integration.
                </div>
                <div className="input-group">
                  <label className="input-label">
                    Ketik <strong>{deleteTarget.display_name}</strong> untuk konfirmasi penghapusan
                  </label>
                  <input className="input" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
                </div>
              </>
            )}
            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button
                className="btn btn-danger"
                disabled={deleteTarget.is_active && deleteConfirm.trim() !== deleteTarget.display_name}
                onClick={confirmDelete}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Export / Import (Req 17) ---- */}
      {ioModal && (
        <div className="settings-modal-overlay" onClick={() => setIoModal(null)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              {ioModal.mode === 'export' ? <Download size={16} /> : <Upload size={16} />}
              <h3>{ioModal.mode === 'export' ? 'Export Credentials' : 'Import Credentials'}</h3>
            </div>
            <p className="settings-modal-desc">
              {ioModal.mode === 'export'
                ? 'Semua kredensial diekspor sebagai satu berkas JSON terenkripsi AES-256-GCM dengan password yang kamu tentukan. Simpan password di tempat aman — tanpa password, berkas tidak dapat dipulihkan.'
                : 'Pilih berkas ekspor (.json) lalu masukkan password pembuka Berkas. Kredensial dengan provider + nama yang sudah ada akan dilewati.'}
            </p>

            {ioModal.mode === 'import' && (
              <div className="input-group">
                <label className="input-label">Berkas ekspor *</label>
                <input
                  className="input"
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => onImportFile(e.target.files?.[0])}
                />
                {ioModal.fileName && <p className="field-hint">Dipilih: {ioModal.fileName}</p>}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{ioModal.mode === 'export' ? 'Password ekspor *' : 'Password berkas *'}</label>
              <input
                className="input"
                type="password"
                placeholder="minimal 8 karakter"
                value={ioModal.password}
                onChange={(e) => setIoModal({ ...ioModal, password: e.target.value, error: '' })}
              />
              {ioModal.mode === 'export' && <p className="field-hint">Kunci diturunkan dengan Argon2id — tidak disimpan server.</p>}
            </div>

            {ioModal.error && <div className="settings-modal-error">{ioModal.error}</div>}
            {ioModal.summary && (
              <div className="settings-modal-success">
                {ioModal.summary}
                {ioModal.errors?.length > 0 && (
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {ioModal.errors.map((err, i) => (
                      <li key={i}>
                        {err.display_name} ({err.provider_type}): {typeof err.error === 'string' ? err.error : 'tidak valid'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setIoModal(null)}>{ioModal.summary ? 'Tutup' : 'Batal'}</button>
              <button
                className="btn btn-primary"
                disabled={ioModal.busy || ioModal.password.length < 8 || (ioModal.mode === 'import' && !ioModal.bundle)}
                onClick={ioModal.mode === 'export' ? doExport : doImport}
              >
                {ioModal.busy ? 'Memproses…' : ioModal.mode === 'export' ? 'Export & Unduh' : 'Impor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function Settings() {
  const {
    currentUser, setAppState, userPin, setUserPin, changePin,
    profile, loadProfile, updateProfile, updateAvatar, theme, setTheme,
    requirePinForDelete, setRequirePinForDelete,
  } = useStore()

  const themeFamily = getAppThemeFamily(theme)
  const themeMode = getAppThemeMode(theme)
  const setThemeFamily = (family) => setTheme(makeAppTheme(family, themeMode))
  const setThemeMode = (mode) => setTheme(makeAppTheme(themeFamily, mode))

  const role = currentUser?.role || 'user'
  const canEditOthers = role === 'owner' || role === 'super_admin' || role === 'admin'
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', username: '', phone: '', gender: '', address: '',
    position: '', joinDate: '', employmentStatus: '', birthDate: '',
    education: '', salary: '',
  })
  const [companyUsers, setCompanyUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinForm, setPinForm] = useState({ current: '', pin: '', confirm: '' })
  const [pinError, setPinError] = useState('')
  // AI Provider multi
  const [providers, setProviders] = useState([])
  const [showAiForm, setShowAiForm] = useState(false)
  const [editAiId, setEditAiId] = useState(null)
  const [aiForm, setAiForm] = useState({
    provider_id: '', display_name: '', api_type: 'openai-compatible',
    base_url: '', api_key: '', model: '', enabled: true, is_active: false,
  })
  const [fetchingModels, setFetchingModels] = useState(false)
  const [aiModels, setAiModels] = useState([])
  const [aiConfigMsg, setAiConfigMsg] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [views, setViews] = useState(null)
  // Foto profil (upload) — data URL base64.
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef(null)
  // Auto-fetch model saat Base URL / API Key berubah (form AI provider).
  const lastFetchedUrlRef = useRef('')
  const autoFetchTimerRef = useRef(null)

  const isEditingOther = Boolean(selectedUserId) && selectedUserId !== (currentUser?.id || '')

  const fillForm = (p) => {
    if (!p) return
    setForm({
      name: p.name || '',
      email: p.email || '',
      username: p.username || '',
      phone: p.phone || '',
      gender: p.gender || '',
      address: p.address || '',
      position: p.position || '',
      joinDate: p.join_date || '',
      employmentStatus: p.employment_status || '',
      birthDate: p.birth_date || '',
      education: p.education || '',
      salary: p.salary || '',
    })
  }

  // Muat profil sendiri + daftar user perusahaan (untuk admin).
  useEffect(() => {
    loadProfile().then((p) => { if (p) fillForm(p) })
    if (canEditOthers) {
      api.getCompanyUsers()
        .then((res) => setCompanyUsers(res.users || []))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Muat statistik tampilan profil (TikTok-style views).
  useEffect(() => {
    if (!currentUser?.id) return
    api.getProfileViews(currentUser.id)
      .then(setViews)
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  // Muat daftar AI provider saat pertama kali (owner/super_admin).
  useEffect(() => {
    if (role === 'owner' || role === 'super_admin') {
      loadProviders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const loadProviders = async () => {
    try {
      const res = await api.getAIProviders()
      setProviders(res.providers || [])
    } catch (_) { /* ignore */ }
  }

  const openAiForm = (provider = null) => {
    if (provider) {
      setEditAiId(provider.id)
      setAiForm({
        provider_id: provider.provider_id || '',
        display_name: provider.display_name || '',
        api_type: provider.api_type || 'openai-compatible',
        base_url: provider.base_url || '',
        api_key: '',
        model: provider.model || '',
        enabled: provider.enabled !== false,
        is_active: provider.is_active || false,
      })
      setAiModels(provider.model ? [provider.model] : [])
    } else {
      setEditAiId(null)
      setAiForm({ provider_id: '', display_name: '', api_type: 'openai-compatible', base_url: '', api_key: '', model: '', enabled: true, is_active: false })
      setAiModels([])
    }
    setShowAiForm(true)
  }

  const handleFetchModels = async () => {
    if (!aiForm.base_url.trim()) return
    setFetchingModels(true)
    setAiConfigMsg('')

    const baseUrl = aiForm.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '')
    // Coba langsung dari browser dulu (tanpa backend), fallback ke server.
    let models = []
    let usedBackend = false
    try {
      const url = `${baseUrl}/models`
      const headers = { 'Content-Type': 'application/json' }
      if (aiForm.api_type === 'anthropic-messages') {
        headers['x-api-key'] = aiForm.api_key.trim()
        headers['anthropic-version'] = '2023-06-01'
      } else {
        headers['Authorization'] = `Bearer ${aiForm.api_key.trim()}`
      }
      const res = await fetch(url, { method: 'GET', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (Array.isArray(body.data)) {
        models = body.data.map((m) => (m && (m.id || m.model)) || null).filter(Boolean)
      } else if (Array.isArray(body)) {
        models = body.map((m) => (m && (m.id || m.name)) || null).filter(Boolean)
      } else if (body.models && Array.isArray(body.models)) {
        models = body.models.map((m) => (typeof m === 'string' ? m : (m && m.id) || null)).filter(Boolean)
      }
      models = models.map(String)
    } catch {
      try {
        const res = await api.fetchAIModels({ api_type: aiForm.api_type, base_url: baseUrl, api_key: aiForm.api_key.trim() })
        models = res.models || []
        usedBackend = true
      } catch (e) {
        setAiConfigMsg('Gagal fetch model. Periksa Base URL, API Key, dan koneksi.')
        setFetchingModels(false)
        return
      }
    }

    setAiModels(models)
    if (models.length > 0) setAiConfigMsg(`${models.length} model ditemukan${usedBackend ? ' (via server)' : ' (langsung browser)'}.`)
    else setAiConfigMsg('Tidak ada model ditemukan. Cek Base URL & API Key.')
    setFetchingModels(false)
  }

  // Auto-fetch daftar model saat Base URL / API Key / tipe API berubah
  // (debounce 1,2 detik) — selama form AI provider terbuka.
  useEffect(() => {
    if (!showAiForm) return
    if (autoFetchTimerRef.current) clearTimeout(autoFetchTimerRef.current)
    const baseUrl = (aiForm.base_url || '').trim().replace(/\/+$/, '').replace(/\/models$/, '')
    const hasKey = Boolean(aiForm.api_key && aiForm.api_key.trim())
    const urlComplete = /^https?:\/\/.+\..+/.test(baseUrl)
    if (!baseUrl || !hasKey || !urlComplete) return
    const key = `${aiForm.api_type}|${baseUrl}`
    if (key === lastFetchedUrlRef.current) return
    setAiModels([])
    autoFetchTimerRef.current = setTimeout(() => {
      handleFetchModels()
    }, 1200)
    return () => { if (autoFetchTimerRef.current) clearTimeout(autoFetchTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiForm, aiForm.base_url, aiForm.api_key, aiForm.api_type])

  const handleSaveProvider = async () => {
    setAiConfigMsg('')
    if (!aiForm.provider_id.trim() || !aiForm.display_name.trim()) return
    try {
      if (editAiId) {
        const patch = {}
        for (const k of ['provider_id', 'display_name', 'api_type', 'base_url', 'model', 'enabled', 'is_active']) {
          if (aiForm[k] !== undefined) patch[k] = aiForm[k]
        }
        // API key hanya dikirim bila diisi ulang — kosong artinya biarkan
        // key tersimpan di server tidak berubah (field edit memang kosong).
        if (aiForm.api_key && aiForm.api_key.trim()) patch.api_key = aiForm.api_key
        await api.updateAIProvider(editAiId, patch)
      } else {
        await api.createAIProvider(aiForm)
      }
      setShowAiForm(false)
      loadProviders()
    } catch (e) {
      setAiConfigMsg('Gagal menyimpan. Pastikan backend online.')
    }
  }

  const activateProvider = async (id) => {
    try {
      await api.updateAIProvider(id, { is_active: true })
      loadProviders()
    } catch (_) { /* ignore */ }
  }

  const deleteProvider = async (id) => {
    try {
      await api.deleteAIProvider(id)
      loadProviders()
    } catch (_) { /* ignore */ }
  }

  // Bila profil di-refresh / dipilih user lain, isi ulang form.
  useEffect(() => {
    if (!selectedUserId || selectedUserId === (currentUser?.id || '')) {
      if (profile) fillForm(profile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, selectedUserId])

  const flash = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setFormError('')
  }

  // ----- Foto profil (upload / kamera / hapus) -----
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setFormError('')
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(reader.result)
      setAvatarUploading(false)
    }
    reader.onerror = () => {
      setAvatarUploading(false)
      setFormError('Gagal membaca foto. Coba lagi.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveAvatar = async () => {
    if (!avatarUrl) return
    setAvatarUploading(true)
    setFormError('')
    const res = await updateAvatar(avatarUrl)
    setAvatarUploading(false)
    if (res.success) {
      setAvatarUrl('')
      flash('Foto profil berhasil diubah')
    } else {
      setFormError(res.message || 'Gagal menyimpan foto profil.')
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Nama dan email wajib diisi.')
      return
    }
    setSaving(true)
    setFormError('')
    const payload = {
      ...(isEditingOther ? { user_id: selectedUserId } : {}),
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      address: form.address.trim(),
      position: form.position.trim(),
      join_date: form.joinDate,
      employment_status: form.employmentStatus,
      birth_date: form.birthDate,
      education: form.education,
      salary: form.salary.trim(),
    }
    const res = await updateProfile(payload)
    setSaving(false)
    if (res.success) {
      flash(res.profile.edit_limit >= 10 ? 'Data user berhasil diperbarui' : 'Profil berhasil disimpan')
      if (isEditingOther) loadProfile()
    } else {
      setFormError(res.message)
    }
  }

  const handleSelectUser = async (userId) => {
    setSelectedUserId(userId)
    if (!userId) {
      if (profile) fillForm(profile)
      return
    }
    try {
      const p = await api.getProfile(userId)
      fillForm(p)
    } catch (e) {
      setFormError('Gagal memuat data user.')
    }
  }

  const handleChangePin = async () => {
    if (!pinForm.current) return setPinError('Masukkan PIN saat ini.')
    if (pinForm.current !== userPin) return setPinError('PIN saat ini salah.')
    if (!/^\d{4,6}$/.test(pinForm.pin)) return setPinError('PIN baru harus 4–6 digit angka.')
    if (pinForm.pin !== pinForm.confirm) return setPinError('PIN baru tidak sama dengan konfirmasi.')
    // Sinkron ke backend (owner) atau simpan lokal (non-owner).
    if (currentUser?.role === 'owner') {
      const result = await changePin(pinForm.pin)
      if (!result.success) return setPinError(result.message)
    } else {
      setUserPin(pinForm.pin)
    }
    setPinModalOpen(false)
    setPinForm({ current: '', pin: '', confirm: '' })
    setPinError('')
    flash('PIN akun berhasil diubah')
  }

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 1, y: 15 },
    visible: { opacity: 1, y: 0 }
  }

  const remainingSelf = Math.max(0, (profile?.edit_limit || 3) - (profile?.edit_count || 0))
  const remainingAdmin = Math.max(0, 10 - (profile?.edit_count || 0))

  const ProfileField = ({ label, name, placeholder = '', type = 'text', options }) => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {options ? (
        <select name={name} className="input" value={form[name] || ''} onChange={handleChange}>
          {options.map((o) => <option key={o || 'blank'} value={o}>{o || '— Pilih —'}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          className="input"
          placeholder={placeholder}
          value={form[name] || ''}
          onChange={handleChange}
        />
      )}
    </div>
  )

  return (
    <>
      <motion.div
        className="settings-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Pengaturan</h1>
            <p>Kelola profil, data login, PIN, dan preferensi</p>
          </div>
        </motion.div>

        <div className="settings-sections">
          {/* Edit kuota info */}
          <motion.div className="edit-quota-card" variants={itemVariants}>
            <AlertTriangle size={16} />
            <span>
              Kuota edit bulan ini: <strong>{profile?.edit_count || 0}/{profile?.edit_limit || 3}</strong> dipakai.
              {remainingSelf > 0
                ? ` Sisa ${remainingSelf} edit untuk bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}.`
                : ' Kuota habis — tunggu bulan berikutnya untuk mengedit lagi.'}
            </span>
          </motion.div>

          {/* Sinkronisasi & Penyimpanan Lokal */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Database size={18} />
              <h2>Sinkronisasi &amp; Penyimpanan</h2>
            </div>
            <div className="settings-card">
              <SyncSettingsPanel />
            </div>
          </motion.div>

          {/* Tampilan */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Palette size={18} />
              <h2>Tampilan</h2>
            </div>
            <div className="settings-card">
              
            </div>
          </motion.div>

          {/* Profil lengkap */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <User size={18} />
              <h2>Data Pribadi</h2>
            </div>
            <div className="settings-card">
              {canEditOthers && (
                <div className="settings-item column-item">
                  <div>
                    <span className="item-label">Edit data user lain (admin/super_admin)</span>
                    <p className="item-desc">Maksimal 10x/bulan. Pilih user untuk memuat datanya.</p>
                  </div>
                  <select
                    className="input settings-user-select"
                    value={selectedUserId}
                    onChange={(e) => handleSelectUser(e.target.value)}
                  >
                    <option value="">— Data saya sendiri —</option>
                    {companyUsers
                      .filter((u) => u.id !== currentUser?.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                  </select>
                </div>
              )}

              {isEditingOther && (
                <div className="settings-item editing-other-notice">
                  <span className="item-label">Sedang mengedit data: <strong>{form.name || 'User'}</strong></span>
                </div>
              )}

              {/* Foto profil */}
              <div className="settings-item column-item">
                <div>
                  <span className="item-label">Foto Profil</span>
                  <p className="item-desc">Unggah foto asli kamu atau gunakan logo Luxio.</p>
                </div>
                <div className="profile-avatar-uploader">
                  <div className="profile-avatar-preview">
                    <img
                      src={avatarUrl || currentUser?.avatar_url || '/luxio.png'}
                      alt="Foto profil"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/luxio.png' }}
                    />
                  </div>
                  <div className="profile-avatar-btns">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="attendance-file-input"
                      onChange={handleAvatarFile}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => avatarInputRef.current?.click()}>
                      <Pencil size={14} /> Pilih Foto
                    </button>
                    {avatarUrl && (
                      <button className="btn btn-primary btn-sm" disabled={avatarUploading} onClick={handleSaveAvatar}>
                        <Save size={14} /> {avatarUploading ? 'Menyimpan…' : 'Simpan Foto'}
                      </button>
                    )}
                    {!avatarUrl && currentUser?.avatar_url && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          const res = await updateAvatar('')
                          if (res.success) { setAvatarUrl(''); flash('Kembali ke logo Luxio') }
                        }}
                      >
                        <Trash2 size={14} /> Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-form">
                <div className="profile-form-row">
                  <ProfileField label="Nama Lengkap" name="name" placeholder="Nama sesuai identitas" />
                  <ProfileField label="Email" name="email" type="email" placeholder="nama@email.com" />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Username" name="username" placeholder="mis. joko123 (unik)" />
                  <ProfileField label="No. HP / WhatsApp" name="phone" placeholder="08xxxxxxxxxx" />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Jenis Kelamin" name="gender" options={GENDER_OPTIONS} />
                  <ProfileField label="Tanggal Lahir" name="birthDate" type="date" />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Pendidikan Terakhir" name="education" options={EDU_OPTIONS} />
                  <ProfileField label="Alamat" name="address" placeholder="Alamat lengkap domisili" />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Posisi / Jabatan" name="position" placeholder="mis. Frontend Developer" />
                  <ProfileField label="Status Kepegawaian" name="employmentStatus" options={STATUS_OPTIONS} />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Tanggal Bergabung" name="joinDate" type="date" />
                  <ProfileField label="Gaji / Upah" name="salary" placeholder="mis. 5000000" />
                </div>
              </div>

              {formError && <p className="settings-form-error">{formError}</p>}

              <div className="settings-item">
                <div>
                  <span className="item-label">Simpan perubahan</span>
                  <p className="item-desc">
                    {isEditingOther
                      ? `Kuota admin: ${Math.min(10, (profile?.edit_count || 0))}/10 dipakai`
                      : `Kuota pribadi: ${(profile?.edit_count || 0)}/${(profile?.edit_limit || 3)} dipakai`}
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saving || remainingSelf <= 0}
                >
                  <Save size={14} /> {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Profil Saya — views TikTok-style */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Eye size={18} />
              <h2>Profil Saya</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <span className="item-label">Total tampilan profil</span>
                  <p className="item-desc">Berapa kali profil kamu dilihat anggota lain</p>
                </div>
                <span className="views-count">{views?.total_views ?? '-'}</span>
              </div>

              {views?.can_see_viewers ? (
                views.viewers && views.viewers.length > 0 ? (
                  <div className="viewers-list">
                    {views.viewers.map((v, i) => (
                      <div key={i} className="viewer-row">
                        <div className="viewer-avatar">
                          {(v.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="viewer-info">
                          <span className="viewer-name">{v.name}</span>
                          <span className="viewer-meta">
                            {[v.position, v.company_name].filter(Boolean).join(' Â· ') || v.email || '-'}
                          </span>
                        </div>
                        <span className="viewer-time">
                          {new Date(v.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="settings-item">
                    <span className="item-value">Belum ada yang melihat profil kamu.</span>
                  </div>
                )
              ) : (
                <div className="settings-item">
                  <span className="item-value">Hanya pemilik profil yang bisa melihat daftar pengunjung.</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Data login */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Lock size={18} />
              <h2>Data Login</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <span className="item-label">Username</span>
                <span className="item-value">@{profile?.username || currentUser?.username || 'Belum di-set'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">Email login</span>
                <span className="item-value">{currentUser?.email || '-'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">Role</span>
                <span className="item-value">{currentUser?.role || '-'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">Paket (plan)</span>
                <span className="item-value">{currentUser?.plan || '-'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">PIN akun</span>
                <span className="item-value">{userPin ? '••••••' : 'Belum di-set'}</span>
              </div>
            </div>
          </motion.div>

          {/* Ubah PIN */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <KeyRound size={18} />
              <h2>Keamanan</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <span className="item-label">Ubah PIN akun</span>
                  <p className="item-desc">PIN dipakai untuk kunci Catatan Pribadi</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setPinModalOpen(true); setPinError('') }}>
                  <KeyRound size={14} /> Ubah PIN
                </button>
              </div>
            </div>
          </motion.div>

          {/* AI Agent — dialihkan ke halaman AI Providers */}
          {(role === 'owner' || role === 'super_admin') && (
            <motion.div className="settings-section" variants={itemVariants}>
              <div className="section-header">
                <Bot size={18} />
                <h2>AI Agent</h2>
              </div>
              <div className="settings-card">
                <div className="settings-item column-item">
                  <div>
                    <span className="item-label">Penyedia AI</span>
                    <p className="item-desc">Kelola provider AI (OpenAI, Anthropic, Ollama, dll) di halaman dedicated.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setCurrentPage('ai-providers')}>
                    <Cpu size={14} /> Buka AI Providers
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Neon Organization — khusus owner saja (akses halaman Penyimpanan) */}
          {role === 'owner' && (
            <NeonOrgManagement />
          )}

          {/* Credentials Management — setelah bagian Neon Organization
              (Req 3.1); owner/super_admin saja (Req 3.11). */}
          {(role === 'owner' || role === 'super_admin') && (
            <CredentialManagement isOwner={role === 'owner'} />
          )}

          {/* Notifications */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Bell size={18} />
              <h2>Notifikasi</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item toggle-item">
                <span className="item-label">Email notifikasi</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item toggle-item">
                <span className="item-label">Reminder task</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div className="settings-section danger" variants={itemVariants}>
            <div className="section-header">
              <Shield size={18} />
              <h2>Risiko Tinggi</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <span className="item-label">Verifikasi Penghapusan</span>
                  <p className="item-desc">
                    Wajib diisi sebelum menghapus akun, target, kanban, maupun to-do.
                  </p>
                </div>
              </div>
              <div className="settings-item delete-verify-setting">
                <label className={`verify-option ${requirePinForDelete ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={requirePinForDelete}
                    onChange={(e) => setRequirePinForDelete(e.target.checked)}
                  />
                  <span>
                    <strong>Wajib masukkan PIN akun saat menghapus</strong>
                    <small>
                      Jika dicentang: setiap penghapusan (akun, target, kanban, to-do) memerlukan PIN akun yang sedang dipakai.
                      Jika tidak dicentang: cukup ketik <strong>DELETE</strong> (huruf besar).
                    </small>
                  </span>
                </label>
              </div>
              <div className="settings-item">
                <div>
                  <span className="item-label">Mulai dari awal</span>
                  <p className="item-desc">Hapus semua data dan mulai setup lagi</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)}>
                  <Trash2 size={14} /> Reset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Konfirmasi reset (mulai dari awal) */}
      {showResetConfirm && (
        <DeleteConfirmModal
          title="Mulai dari Awal"
          message="Semua data (target, kanban, to-do, catatan, anggota) akan dihapus dan kamu kembali ke alur setup."
          confirmLabel="Ya, Reset Semua"
          onConfirm={() => {
            setShowResetConfirm(false)
            setAppState('setup')
            useStore.setState({
              setupStep: 0,
              companyInfo: { name: '', industry: '', size: '', type: '' },
              divisions: [],
              members: [],
              teams: [],
              currentUser: null,
              isAuthenticated: false,
              projects: [],
              tasks: [],
              kanbanBoards: [],
            })
          }}
          onClose={() => setShowResetConfirm(false)}
        />
      )}

      {/* Modal Ubah PIN */}
      {pinModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setPinModalOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <KeyRound size={18} />
              <h3>Ubah PIN Akun</h3>
            </div>
            <p className="settings-modal-desc">PIN dipakai untuk membuka Catatan Pribadi yang dikunci.</p>
            <div className="input-group">
              <label className="input-label">PIN saat ini</label>
              <PinInput length={6} value={pinForm.current} onChange={(v) => { setPinForm({ ...pinForm, current: v }); setPinError('') }} />
            </div>
            <div className="input-group">
              <label className="input-label">PIN baru (4–6 digit)</label>
              <PinInput length={6} value={pinForm.pin} onChange={(v) => { setPinForm({ ...pinForm, pin: v }); setPinError('') }} />
            </div>
            <div className="input-group">
              <label className="input-label">Ulangi PIN baru</label>
              <PinInput length={6} value={pinForm.confirm} onChange={(v) => { setPinForm({ ...pinForm, confirm: v }); setPinError('') }} onComplete={handleChangePin} />
            </div>
            {pinError && <span className="settings-modal-error">{pinError}</span>}
            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setPinModalOpen(false)}>Batal</button>
              <button className="btn btn-primary" disabled={!pinForm.pin || !pinForm.confirm} onClick={handleChangePin}>
                <KeyRound size={14} /> Simpan PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal AI Provider (multi) */}
      {showAiForm && (
        <div className="settings-modal-overlay" onClick={() => setShowAiForm(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <Bot size={18} />
              <h3>{editAiId ? 'Edit' : 'Tambah'} Provider AI</h3>
            </div>
            <p className="settings-modal-desc">
              Hubungkan penyedia AI. Bisa menambah banyak provider; tandai satu sebagai aktif (default).
            </p>

            <div className="input-group">
              <label className="input-label">Provider ID <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                className="input"
                placeholder="mis. openai, anthropic, groq, ollama"
                value={aiForm.provider_id}
                onChange={(e) => setAiForm({ ...aiForm, provider_id: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Display Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                className="input"
                placeholder="mis. OpenAI, Anthropic, Groq"
                value={aiForm.display_name}
                onChange={(e) => setAiForm({ ...aiForm, display_name: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Provider API</label>
              <select
                className="input"
                value={aiForm.api_type}
                onChange={(e) => setAiForm({ ...aiForm, api_type: e.target.value })}
              >
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="openai-responses">OpenAI Responses</option>
                <option value="anthropic-messages">Anthropic Messages</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Base URL</label>
              <input
                className="input"
                placeholder="mis. https://api.openai.com/v1"
                value={aiForm.base_url}
                onChange={(e) => setAiForm({ ...aiForm, base_url: e.target.value })}
              />
              <p className="field-hint">Ollama lokal: http://localhost:11434/v1 · Daftar model otomatis diambil dari {aiForm.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '') ? `${aiForm.base_url.trim().replace(/\/+$/, '').replace(/\/models$/, '')}/models` : 'GET {base_url}/models'} begitu Base URL &amp; API Key terisi.</p>
            </div>

            <div className="input-group">
              <label className="input-label">API Key</label>
              <input
                type="password"
                className="input"
                placeholder="sk-..."
                value={aiForm.api_key}
                onChange={(e) => setAiForm({ ...aiForm, api_key: e.target.value })}
              />
              <p className="field-hint">Kosongkan bila model lokal (Ollama).</p>
            </div>

            <div className="input-group">
              <label className="input-label">Model</label>
              <div className="ai-model-row">
                <select
                  className="input"
                  value={aiForm.model}
                  disabled={fetchingModels}
                  onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}
                >
                  <option value="">{fetchingModels ? 'Mengambil daftar model…' : (aiModels.length ? '— pilih model —' : '— ketik Base URL + API Key —')}</option>
                  {aiModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={fetchingModels || !aiForm.base_url.trim()}
                  onClick={handleFetchModels}
                >
                  {fetchingModels ? 'Memuat...' : 'Fetch Models'}
                </button>
              </div>
              {aiModels.length > 0 && (
                <p className="field-hint" style={{ color: 'var(--success)' }}>{aiModels.length} model tersedia dari Base URL ini.</p>
              )}
            </div>

            <div className="input-group">
              <label className="settings-modal-toggle">
                <input type="checkbox" checked={aiForm.enabled} onChange={(e) => setAiForm({ ...aiForm, enabled: e.target.checked })} />
                <span>Aktifkan provider ini</span>
              </label>
            </div>
            <div className="input-group">
              <label className="settings-modal-toggle">
                <input type="checkbox" checked={aiForm.is_active} onChange={(e) => setAiForm({ ...aiForm, is_active: e.target.checked })} />
                <span>Jadikan provider aktif (default)</span>
              </label>
            </div>

            {aiConfigMsg && <p className="settings-modal-success">{aiConfigMsg}</p>}
            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAiForm(false)}>Tutup</button>
              <button className="btn btn-primary" disabled={!aiForm.provider_id.trim() || !aiForm.display_name.trim()} onClick={handleSaveProvider}>
                <Save size={14} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="settings-toast"><CheckIcon /> {toast}</div>}
    </>
  )
}

function CheckIcon() {
  return <Save size={15} />
}
