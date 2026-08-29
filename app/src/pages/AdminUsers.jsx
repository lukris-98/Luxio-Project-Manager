import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import Select from '../components/Select'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { motion } from 'framer-motion'
import {
  Shield, Users, Plus, Mail, Pencil, Trash2, ArrowUp, ArrowDown, X, Crown, Sparkles,
} from 'lucide-react'
import { api } from '../services/api'
import './AdminUsers.css'

const ROLE_LABELS = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  member: 'Member',
}

// Role otomatis dari paket (aturan auto-role, tidak bisa dipindah tangankan).
const roleForPlan = (plan) =>
  plan === 'grup' ? 'admin'
  : plan === 'organisasi' ? 'super_admin'
  : 'member'

const PLAN_ORDER = ['personal', 'profesional', 'grup', 'organisasi']

const PLAN_LABELS = {
  personal: 'Personal',
  profesional: 'Profesional',
  grup: 'Grup',
  organisasi: 'Organisasi',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  plan: 'personal',
}

export default function AdminUsers() {
  const { currentUser } = useStore()
  const isOwner = currentUser?.role === 'owner'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadUsers = useCallback(async () => {
    if (!isOwner || !currentUser?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await api.getAdminUsers(currentUser.id)
      setUsers(data)
    } catch (e) {
      setError('Gagal memuat daftar akun. Pastikan backend online.')
    } finally {
      setLoading(false)
    }
  }, [isOwner, currentUser?.id])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Nama, email, dan password wajib diisi')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Email tidak valid')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.createAdminUser({
        actor_id: currentUser.id,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        plan: form.plan,
      })
      setShowCreate(false)
      setForm(emptyForm)
      flash('Akun berhasil dibuat')
      loadUsers()
    } catch (e) {
      setError(e.status === 409 ? 'Email sudah terdaftar' : 'Gagal membuat akun')
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async (userId, patch) => {
    setBusy(true)
    setError('')
    try {
      await api.updateAdminUser({ actor_id: currentUser.id, user_id: userId, ...patch })
      flash('Akun berhasil diperbarui')
      loadUsers()
    } catch (e) {
      setError(e.status === 409 ? 'Email sudah dipakai akun lain' : e.message || 'Gagal memperbarui akun')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveEdit = async () => {
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name) return setError('Nama tidak boleh kosong')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email tidak valid')
    if (form.password && form.password.length < 8) return setError('Password minimal 8 karakter')

    const patch = {
      name,
      email,
      plan: form.plan,
      ...(form.password ? { password: form.password } : {}),
    }
    await handleUpdate(editUser.id, patch)
    setEditUser(null)
    setForm(emptyForm)
  }

  const handlePlanMove = (user, dir) => {
    const idx = PLAN_ORDER.indexOf(user.plan)
    const next = idx + dir
    if (next < 0 || next >= PLAN_ORDER.length) return
    if (user.role === 'owner') return
    handleUpdate(user.id, { plan: PLAN_ORDER[next] })
  }

  const handleDelete = async (user) => {
    if (user.role === 'owner') return
    setDeleteTarget(user)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    setError('')
    try {
      await api.deleteAdminUser({ actor_id: currentUser.id, user_id: deleteTarget.id })
      flash('Akun berhasil dihapus')
      setDeleteTarget(null)
      loadUsers()
    } catch (e) {
      setError('Gagal menghapus akun')
    } finally {
      setBusy(false)
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return <span className="badge badge-gold">Owner</span>
      case 'super_admin':
        return <span className="badge badge-purple">Super Admin</span>
      case 'admin':
        return <span className="badge badge-warning">Admin</span>
      default:
        return <span className="badge badge-muted">Member</span>
    }
  }

  const getPlanBadge = (plan) => (
    <span className={`badge plan-badge plan-${plan}`}>{PLAN_LABELS[plan] || plan}</span>
  )

  const stats = {
    total: users.length,
    owners: users.filter((u) => u.role === 'owner').length,
    superAdmins: users.filter((u) => u.role !== 'owner' && roleForPlan(u.plan) === 'super_admin').length,
    admins: users.filter((u) => u.role !== 'owner' && roleForPlan(u.plan) === 'admin').length,
    members: users.filter((u) => u.role !== 'owner' && roleForPlan(u.plan) === 'member').length,
  }

  return (
    <>
      <motion.div
        className="admin-users-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>Kelola Akun</h1>
            <p>Pusat kendali seluruh akun Luxio (khusus Owner)</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Tambah Akun
          </button>
        </motion.div>

        <div className="role-notice owner-notice">
          <Crown size={16} />
          <span>Anda login sebagai Owner — berhak membuat, mengedit, menghapus, serta upgrade/downgrade semua akun.</span>
        </div>

        {notice && <div className="admin-toast success">{notice}</div>}
        {error && <div className="admin-toast error">{error}</div>}

        <div className="admin-stats">
          <div className="stat-card">
            <Users size={18} />
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Akun</span>
            </div>
          </div>
          <div className="stat-card">
            <Crown size={18} />
            <div className="stat-info">
              <span className="stat-value">{stats.owners}</span>
              <span className="stat-label">Owner</span>
            </div>
          </div>
          <div className="stat-card">
            <Shield size={18} />
            <div className="stat-info">
              <span className="stat-value">{stats.superAdmins + stats.admins}</span>
              <span className="stat-label">Admin</span>
            </div>
          </div>
          <div className="stat-card">
            <Users size={18} />
            <div className="stat-info">
              <span className="stat-value">{stats.members}</span>
              <span className="stat-label">Member</span>
            </div>
          </div>
        </div>

        <div className="admin-users-list">
          {loading ? (
            <div className="empty-card">Memuat daftar akun...</div>
          ) : users.length === 0 ? (
            <div className="empty-card">Belum ada akun terdaftar</div>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUser?.id
              const planIdx = PLAN_ORDER.indexOf(user.plan)
              const canUpgrade = user.role !== 'owner' && planIdx < PLAN_ORDER.length - 1
              const canDowngrade = user.role !== 'owner' && planIdx > 0
              return (
                <motion.div
                  key={user.id}
                  className="admin-user-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="admin-user-avatar">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="admin-user-info">
                    <span className="admin-user-name">
                      {user.name}
                      {isSelf && <span className="self-tag">Anda</span>}
                    </span>
                    <span className="admin-user-email">
                      <Mail size={12} /> {user.email}
                    </span>
                  </div>

                  <div className="admin-user-role" title="Role otomatis mengikuti paket akun">
                    {getRoleBadge(user.role === 'owner' ? 'owner' : roleForPlan(user.plan))}
                  </div>

                  <div className="admin-user-plan">
                    {getPlanBadge(user.plan)}
                    {user.role !== 'owner' && (
                      <div className="plan-move">
                        <button
                          className={`plan-arrow ${!canDowngrade ? 'disabled' : ''}`}
                          title="Downgrade akun"
                          onClick={() => canDowngrade && handlePlanMove(user, -1)}
                          disabled={!canDowngrade}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          className={`plan-arrow ${!canUpgrade ? 'disabled' : ''}`}
                          title="Upgrade akun"
                          onClick={() => canUpgrade && handlePlanMove(user, 1)}
                          disabled={!canUpgrade}
                        >
                          <ArrowUp size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="admin-user-actions">
                    <button
                      className="action-btn"
                      title="Edit akun"
                      onClick={() => {
                        setEditUser(user)
                        setForm({
                          name: user.name,
                          email: user.email,
                          password: '',
                          plan: user.plan,
                        })
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    {user.role !== 'owner' && (
                      <button
                        className="action-btn danger"
                        title="Hapus akun"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Modal: Tambah Akun */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Tambah Akun</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Plan / Paket</label>
                  <Select
                    allowReset={false}
                    value={form.plan}
                    onChange={(v) => setForm({ ...form, plan: v })}
                    options={PLAN_ORDER.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
                  />
                  <p className="field-hint">
                    Role otomatis: Personal/Profesional = Member · Grup = Admin · Organisasi = Super Admin
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={busy}>
                  Batal
                </button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={busy}>
                  {busy ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Akun */}
        {editUser && (
          <div className="modal-overlay" onClick={() => setEditUser(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Akun</h2>
                <button className="modal-close" onClick={() => setEditUser(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Password (kosongkan bila tidak diganti)</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Role (otomatis dari paket)</label>
                  {editUser.role === 'owner' ? (
                    <input type="text" className="input" value="Owner" disabled />
                  ) : (
                    <>
                      <div className="edit-role-badge">
                        {getRoleBadge(roleForPlan(form.plan))}
                        <span className="role-auto-hint">
                          <Sparkles size={12} /> Role mengikuti paket, tidak bisa diganti manual
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="input-group">
                  <label className="input-label">Plan / Paket</label>
                  {editUser.role === 'owner' ? (
                    <input type="text" className="input" value="Organisasi" disabled />
                  ) : (
                    <Select
                      allowReset={false}
                      value={form.plan}
                      onChange={(v) => setForm({ ...form, plan: v })}
                      options={PLAN_ORDER.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
                    />
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditUser(null)} disabled={busy}>
                  Batal
                </button>
                <button className="btn btn-primary" onClick={handleSaveEdit} disabled={busy}>
                  {busy ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Konfirmasi hapus akun */}
        {deleteTarget && (
          <DeleteConfirmModal
            title="Hapus Akun"
            itemName={`${deleteTarget.name} (${deleteTarget.email})`}
            message="Data perusahaan akun ini ikut terhapus. Tindakan ini tidak bisa dibatalkan."
            confirmLabel={busy ? 'Menghapus...' : 'Ya, Hapus'}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </motion.div>
    </>
  )
}
