import { useState, useEffect } from 'react'
import { getAppThemeFamily, getAppThemeMode, makeAppTheme, useStore } from '../store/useStore'
import Layout from '../components/Layout'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { motion } from 'framer-motion'
import { User, Bell, Shield, HelpCircle, Lock, KeyRound, Save, Users, Briefcase, Phone, MapPin, Calendar, GraduationCap, Wallet, Pencil, AlertTriangle, Bot, Eye, Palette, Trash2, Plus } from 'lucide-react'
import { api } from '../services/api'
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
  { value: 'luxio', label: 'Luxio' },
  { value: 'main-white', label: 'Main White' },
]
const THEME_MODE_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export default function Settings() {
  const {
    currentUser, setAppState, userPin, setUserPin, changePin,
    profile, loadProfile, updateProfile, theme, setTheme,
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
    try {
      const res = await api.fetchAIModels({ api_type: aiForm.api_type, base_url: aiForm.base_url.trim(), api_key: aiForm.api_key.trim() })
      setAiModels(res.models || [])
      if ((res.models || []).length > 0) setAiConfigMsg(`${res.models.length} model ditemukan.`)
      else setAiConfigMsg('Tidak ada model ditemukan. Cek Base URL & API Key.')
    } catch (e) {
      setAiConfigMsg('Gagal fetch model. Periksa Base URL & API Key.')
    } finally {
      setFetchingModels(false)
    }
  }

  const handleSaveProvider = async () => {
    setAiConfigMsg('')
    if (!aiForm.provider_id.trim() || !aiForm.display_name.trim()) return
    try {
      if (editAiId) {
        const patch = {}
        for (const k of ['provider_id', 'display_name', 'api_type', 'base_url', 'api_key', 'model', 'enabled', 'is_active']) {
          if (aiForm[k] !== undefined) patch[k] = aiForm[k]
        }
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
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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
    <Layout>
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
                            {[v.position, v.company_name].filter(Boolean).join(' · ') || v.email || '-'}
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
                            {p.api_type} · {p.model || 'tanpa model'}{p.is_active ? ' · aktif' : ''}
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
              <input
                type="password" className="input" inputMode="numeric" placeholder="PIN saat ini"
                value={pinForm.current}
                onChange={(e) => { setPinForm({ ...pinForm, current: e.target.value }); setPinError('') }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">PIN baru (4–6 digit)</label>
              <input
                type="password" className="input" inputMode="numeric" placeholder="PIN baru"
                value={pinForm.pin}
                onChange={(e) => { setPinForm({ ...pinForm, pin: e.target.value }); setPinError('') }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Ulangi PIN baru</label>
              <input
                type="password" className="input" inputMode="numeric" placeholder="Ulangi PIN baru"
                value={pinForm.confirm}
                onChange={(e) => { setPinForm({ ...pinForm, confirm: e.target.value }); setPinError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleChangePin() }}
              />
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
              <p className="field-hint">Ollama lokal: http://localhost:11434/v1</p>
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
                  onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}
                >
                  <option value="">— pilih model —</option>
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
              <p className="field-hint">Tempel Base URL + API Key lalu klik Fetch Models untuk auto-muat semua model.</p>
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
    </Layout>
  )
}

function CheckIcon() {
  return <Save size={15} />
}
