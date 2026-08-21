import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { User, Bell, Shield, HelpCircle, Lock, KeyRound, Save, Users, Briefcase, Phone, MapPin, Calendar, GraduationCap, Wallet, Pencil, AlertTriangle, Bot } from 'lucide-react'
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

export default function Settings() {
  const {
    currentUser, setAppState, userPin, setUserPin,
    profile, loadProfile, updateProfile,
  } = useStore()

  const role = currentUser?.role || 'user'
  const canEditOthers = role === 'owner' || role === 'super_admin' || role === 'admin'

  const [form, setForm] = useState({
    name: '', email: '', phone: '', gender: '', address: '',
    position: '', joinDate: '', employmentStatus: '', birthDate: '',
    education: '', salary: '',
  })
  const [companyUsers, setCompanyUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinForm, setPinForm] = useState({ current: '', pin: '', confirm: '' })
  const [pinError, setPinError] = useState('')
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiProvider, setAiProvider] = useState('')
  const [aiKey, setAiKey] = useState('')
  const [aiConfigMsg, setAiConfigMsg] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const isEditingOther = Boolean(selectedUserId) && selectedUserId !== (currentUser?.id || '')

  const fillForm = (p) => {
    if (!p) return
    setForm({
      name: p.name || '',
      email: p.email || '',
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

  const handleChangePin = () => {
    if (!pinForm.current) return setPinError('Masukkan PIN saat ini.')
    if (pinForm.current !== userPin) return setPinError('PIN saat ini salah.')
    if (!/^\d{4,6}$/.test(pinForm.pin)) return setPinError('PIN baru harus 4–6 digit angka.')
    if (pinForm.pin !== pinForm.confirm) return setPinError('PIN baru tidak sama dengan konfirmasi.')
    setUserPin(pinForm.pin)
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
                  <ProfileField label="No. HP / WhatsApp" name="phone" placeholder="08xxxxxxxxxx" />
                  <ProfileField label="Jenis Kelamin" name="gender" options={GENDER_OPTIONS} />
                </div>
                <div className="profile-form-row">
                  <ProfileField label="Tanggal Lahir" name="birthDate" type="date" />
                  <ProfileField label="Pendidikan Terakhir" name="education" options={EDU_OPTIONS} />
                </div>
                <ProfileField label="Alamat" name="address" placeholder="Alamat lengkap domisili" />
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

          {/* Data login */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Lock size={18} />
              <h2>Data Login</h2>
            </div>
            <div className="settings-card">
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
                <div className="settings-item">
                  <div>
                    <span className="item-label">Penyedia AI</span>
                    <p className="item-desc">API key untuk AI Agent (OpenAI, dll.)</p>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAiModalOpen(true)}>
                    <KeyRound size={14} /> Konfigurasi
                  </button>
                </div>
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
                  <span className="item-label">Mulai dari awal</span>
                  <p className="item-desc">Hapus semua data dan mulai setup lagi</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  if (confirm('Mau mulai dari awal? Semua data akan dihapus.')) {
                    setAppState('setup')
                    useStore.setState({
                      setupStep: 0,
                      companyInfo: { name: '', industry: '', size: '', type: '' },
                      divisions: [],
                      members: [],
                      currentUser: null,
                      isAuthenticated: false,
                      projects: [],
                      tasks: []
                    })
                  }
                }}>
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

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

      {/* Modal AI Agent config */}
      {aiModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setAiModalOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-head">
              <Bot size={18} />
              <h3>Konfigurasi AI Agent</h3>
            </div>
            <p className="settings-modal-desc">
              Masukkan API key penyedia AI (OpenAI, dll). Agent hanya menjalankan tool resmi
              yang terdaftar di sistem (tool/action layer).
            </p>
            <div className="input-group">
              <label className="input-label">Penyedia AI</label>
              <select className="input" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                <option value="">— Pilih penyedia —</option>
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="google">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="local">Local (LLaMA, Mistral, dll.)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">API Key</label>
              <input
                type="password"
                className="input"
                placeholder="sk-..."
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
              />
            </div>
            {aiConfigMsg && <p className="settings-modal-success">{aiConfigMsg}</p>}
            <div className="settings-modal-actions">
              <button className="btn btn-secondary" onClick={() => setAiModalOpen(false)}>Tutup</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setAiConfigMsg('')
                  try {
                    const res = await api.agentConfig({ ai_provider: aiProvider, ai_key: aiKey })
                    setAiConfigMsg(res.ok ? 'Konfigurasi AI tersimpan.' : 'Gagal menyimpan.')
                    setTimeout(() => setAiModalOpen(false), 1400)
                  } catch (e) {
                    setAiConfigMsg('Gagal menyimpan. Pastikan backend online.')
                  }
                }}
              >
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
