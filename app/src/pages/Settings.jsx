import { useState, useEffect, useRef } from 'react'
import { getAppThemeFamily, getAppThemeMode, makeAppTheme, useStore } from '../store/useStore'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import PinInput from '../components/PinInput'
import { motion } from 'framer-motion'
import { User, Bell, Shield, HelpCircle, Lock, KeyRound, Save, Users, Briefcase, Phone, MapPin, Calendar, GraduationCap, Wallet, Pencil, AlertTriangle, Bot, Eye, Palette, Trash2, Plus, Cloud, CloudOff, RefreshCw, Database } from 'lucide-react'
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
              <div className="settings-item column-item">
                <div>
                  <span className="item-label">Tema aplikasi</span>
                  <p className="item-desc">Pilih keluarga tema dan mode warna untuk seluruh aplikasi.</p>
                </div>
                <div className="settings-theme-controls">
                  <div className="input-group">
                    <label className="input-label">Tema</label>
                    <select
                      className="input settings-theme-select"
                      value={themeFamily}
                      onChange={(e) => setThemeFamily(e.target.value)}
                    >
                      {THEME_FAMILY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Mode</label>
                    <select
                      className="input settings-theme-select"
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value)}
                    >
                      {THEME_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
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

          {/* AI Agent (Item 8) — khusus owner/super_admin */}
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
                    <p className="item-desc">Kelola banyak provider (OpenAI, Anthropic, Ollama, dll). Aktifkan satu sebagai default.</p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={openAiForm}>
                    <Plus size={14} /> Tambah Provider
                  </button>
                </div>

                {providers.length === 0 ? (
                  <p className="ai-providers-empty">Belum ada provider. Tambahkan satu untuk menghubungkan AI Agent.</p>
                ) : (
                  <div className="ai-provider-list">
                    {providers.map((p) => (
                      <div key={p.id} className={`ai-provider-item ${p.is_active ? 'active' : ''}`}>
                        <div className="ai-provider-main">
                          <span className="ai-provider-name">{p.display_name || p.provider_id || 'Provider'}</span>
                          <span className="ai-provider-meta">
                            {p.api_type} Â· {p.model || 'tanpa model'}{p.is_active ? ' Â· aktif' : ''}
                          </span>
                        </div>
                        <div className="ai-provider-actions">
                          {!p.is_active && (
                            <button className="btn btn-secondary btn-sm" onClick={() => activateProvider(p.id)} title="Jadikan aktif">
                              Aktifkan
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => openAiForm(p)}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteProvider(p.id)} title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Neon Organization — khusus owner/super_admin */}
          {(role === 'owner' || role === 'super_admin') && (
            <NeonOrgManagement />
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
