import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { Megaphone, Users, Loader2, Send, BellRing, Search } from 'lucide-react'
import { api } from '../services/api'
import './NotificationsPage.css'

// =====================================================================
// NotificationsPage.jsx — Kirim notifikasi in-app ke target.
// =====================================================================
// Owner         : bisa kirim ke semua user / semua role / user spesifik.
// Super Admin   : hanya ke bawahan dalam satu perusahaan (admin, member).
// Admin         : hanya ke bawahan dalam satu perusahaan (member).
// =====================================================================

const ROLE_LABELS = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
  member: 'Member',
}

const TARGET_MODES = [
  { id: 'all', label: 'Semua user (seluruh sistem)' },
  { id: 'role', label: 'Per role' },
  { id: 'users', label: 'Pilih user' },
]

export default function NotificationsPage() {
  const { currentUser } = useStore()
  const role = currentUser?.role
  const isOwner = role === 'owner'
  const isAllowed = ['owner', 'super_admin', 'admin'].includes(role)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mode, setMode] = useState(isOwner ? 'all' : 'users')
  const [roles, setRoles] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    if (!isAllowed || !currentUser?.id) return
    setLoadingUsers(true)
    setError('')
    try {
      // Owner melihat semua akun; super_admin/admin hanya user dalam
      // perusahaannya (yang bisa mereka jangkau).
      const data = isOwner
        ? await api.getAdminUsers(currentUser.id)
        : await api.getCompanyUsers()
      const list = Array.isArray(data) ? data : data.users || []
      setUsers(list)
    } catch (e) {
      setError('Gagal memuat daftar user. Pastikan backend online.')
    } finally {
      setLoadingUsers(false)
    }
  }, [isAllowed, isOwner, currentUser?.id])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Role yang boleh disasar:
  // - Owner: semua role.
  // - Super admin: admin, user/member.
  // - Admin: hanya user/member.
  const selectableRoles = isOwner
    ? ['super_admin', 'admin', 'user', 'member']
    : role === 'super_admin'
      ? ['admin', 'user', 'member']
      : ['user', 'member']

  // User yang boleh disasar oleh super_admin/admin hanya bawahan.
  // (Backend memverifikasi lagi — filter ini hanya bantu UX.)
  const filteredUsers = users.filter((u) => {
    if (u.id === currentUser?.id) return false
    if (!isOwner) {
      if (u.role === 'owner' || u.role === 'super_admin') return false
      if (role === 'admin' && u.role === 'admin') return false
    }
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const toggleRole = (r) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))

  const toggleUser = (id) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const canSend = title.trim() !== '' &&
    (mode === 'all' || (mode === 'role' && roles.length > 0) || (mode === 'users' && selectedUsers.length > 0))

  const handleSend = async () => {
    if (!canSend || sending) return
    setSending(true)
    setError('')
    setNotice('')
    const targets =
      mode === 'all'
        ? { mode: 'all' }
        : mode === 'role'
          ? { mode: 'role', roles }
          : { mode: 'users', user_ids: selectedUsers }
    try {
      const res = await api.sendNotification({ title: title.trim(), body: body.trim(), kind: 'info', targets })
      setNotice(`Notifikasi terkirim ke ${res.sent || 0} user.`)
      setTitle('')
      setBody('')
      setRoles([])
      setSelectedUsers([])
      setQuery('')
    } catch (e) {
      setError(e.status === 403 ? 'Anda tidak berhak mengirim ke target itu.' : 'Gagal mengirim notifikasi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <motion.div
        className="notif-send-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>Kirim Notifikasi</h1>
            <p>Owner &gt; semua user · Super Admin / Admin &gt; bawahan</p>
          </div>
        </motion.div>

        <div className="notif-role-notice">
          <Megaphone size={16} />
          <span>
            {isOwner
              ? 'Anda login sebagai Owner — bisa mengirim notifikasi ke semua user, role tertentu, atau user pilihan di seluruh sistem.'
              : `Anda login sebagai ${ROLE_LABELS[role]} — hanya bisa mengirim ke bawahan dalam satu perusahaan.`}
          </span>
        </div>

        {notice && <div className="admin-toast success">{notice}</div>}
        {error && <div className="admin-toast error">{error}</div>}

        <div className="notif-compose">
          <div className="input-group">
            <label className="input-label">Judul *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: Rapat mingguan, Pengumuman penting"
              maxLength={120}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Isi pesan</label>
            <textarea
              className="input notif-body-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis detail pengumuman atau instruksi..."
              rows={4}
            />
          </div>

          {/* Target */}
          <div className="notif-target-section">
            <span className="input-label">Target penerima *</span>

            <div className="notif-mode-tabs">
              {TARGET_MODES.filter((m) => isOwner || m.id !== 'all').map((m) => (
                <button
                  key={m.id}
                  className={`notif-mode-tab ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'all' && (
              <p className="notif-mode-hint">
                <BellRing size={14} /> Notifikasi dikirim ke <strong>semua akun</strong> di seluruh sistem.
              </p>
            )}

            {mode === 'role' && (
              <div className="notif-role-grid">
                {selectableRoles.map((r) => (
                  <button
                    key={r}
                    className={`notif-role-chip ${roles.includes(r) ? 'active' : ''}`}
                    onClick={() => toggleRole(r)}
                  >
                    {ROLE_LABELS[r] || r}
                  </button>
                ))}
              </div>
            )}

            {mode === 'users' && (
              <div className="notif-user-picker">
                <div className="notif-search">
                  <Search size={16} />
                  <input
                    className="notif-search-input"
                    placeholder="Cari nama atau email..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {loadingUsers ? (
                  <div className="notif-loading"><Loader2 size={16} className="spin" /> Memuat daftar user...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="notif-empty">Tidak ada user yang bisa dipilih.</div>
                ) : (
                  <div className="notif-user-list">
                    {filteredUsers.map((u) => (
                      <label key={u.id} className={`notif-user-item ${selectedUsers.includes(u.id) ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                        />
                        <div className="notif-user-avatar">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="notif-user-meta">
                          <span className="notif-user-name">{u.name}</span>
                          <span className="notif-user-email">{u.email}</span>
                        </div>
                        <span className="badge badge-muted">{ROLE_LABELS[u.role] || u.role}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!loadingUsers && filteredUsers.length > 0 && (
                  <div className="notif-selected-count">
                    <Users size={14} /> {selectedUsers.length} user dipilih
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="btn btn-primary notif-send-btn" disabled={!canSend || sending} onClick={handleSend}>
            {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {sending ? 'Mengirim...' : 'Kirim Notifikasi'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
