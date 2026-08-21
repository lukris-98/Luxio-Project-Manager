import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import ReminderWatcher from './ReminderWatcher'
import HeadlineMarquee from './HeadlineMarquee'
import { requestNotificationPermission } from '../utils/notify'
import { 
  LayoutDashboard, Target, CheckSquare, Users, Settings, LogOut, Menu, X, Bell, Calendar, Sun, Moon, BellRing, CheckCheck, Trash2, Crown, PanelLeftClose, PanelLeftOpen, Lock, CreditCard, ChevronDown, Building2, ChevronUp, ShieldCheck, Check, MessageSquare, Bot, Rocket, UserPlus, KeyRound 
} from 'lucide-react'
import './Layout.css'

const NOTIF_ICON = {
  deadline: '⏰',
  create: '🎯',
}

const ROLE_LABELS = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
}

const ROLE_OPTIONS = ['owner', 'super_admin', 'admin', 'user']

export default function Layout({ children }) {
  const {
    currentPage, setCurrentPage, logout, currentUser, companyInfo, appState, setAppState,
    notifications, markAllNotificationsRead, clearNotifications,
    theme, setTheme, activeRole, setActiveRole,
    userPin, setUserPin, isAuthenticated,
  } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const lastToastId = useRef(null)

  // Role efektif: untuk OWNER bisa act-as (owner/super_admin/admin/user),
  // untuk akun lain = role aslinya.
  const effRole = activeRole || currentUser?.role || 'member'
  const isRealOwner = currentUser?.role === 'owner'
  const isDivisiMode = effRole === 'owner' || effRole === 'super_admin'

  // Nav disusun ulang sesuai role efektif.
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: Target, label: 'Target' },
    { id: 'kanban', icon: Target, label: 'Kanban' },
    { id: 'todo-list', icon: CheckSquare, label: 'Todo' },
    { id: 'private-note', icon: Lock, label: 'Catatan Pribadi' },
    { id: 'calendar', icon: Calendar, label: 'Kalender' },
    { id: 'my-tasks', icon: CheckSquare, label: 'Task Saya' },
    // Super Admin / Owner => Divisi (CRUD divisi+tim), Admin/User => Tim.
    { id: 'team', icon: isDivisiMode ? Building2 : Users, label: isDivisiMode ? 'Divisi' : 'Tim' },
    // Chat (Item 5) — semua role dengan akses.
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    // AI Agent (Item 8) — owner/super_admin.
    ...(effRole === 'owner' || effRole === 'super_admin' ? [{ id: 'agent', icon: Bot, label: 'AI Agent' }] : []),
    // Upgrade akun (Item 4) — khusus role user.
    ...(effRole === 'user' ? [{ id: 'upgrade', icon: Rocket, label: 'Upgrade Akun' }] : []),
    // Kelola Akun khusus pemilik (role efektif owner).
    ...(effRole === 'owner' ? [{ id: 'admin-users', icon: Crown, label: 'Kelola Akun' }] : []),
  ]

  const handleRoleChange = (role) => {
    setActiveRole(role)
    setRoleOpen(false)
    setSidebarOpen(false)
  }

  // Kalau role diganti dan sedang di halaman khusus owner, lempar ke dashboard.
  useEffect(() => {
    if (currentPage === 'admin-users' && effRole !== 'owner') {
      setCurrentPage('dashboard')
    }
  }, [effRole, currentPage, setCurrentPage])

  // Toast untuk notifikasi terbaru (muncul beberapa detik di dalam web).
  useEffect(() => {
    if (notifications.length === 0) return
    const latest = notifications[0]
    if (lastToastId.current === latest.id) return
    lastToastId.current = latest.id
    setToast(latest)
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [notifications])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleNotifClick = () => {
    requestNotificationPermission()
    setNotifOpen((v) => !v)
  }

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId)
    setSidebarOpen(false)
    setProfileOpen(false)
  }

  const handleLogout = () => {
    logout()
    setAppState('landing')
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // PIN akun wajib di-set setelah login (untuk catatan pribadi).
  useEffect(() => {
    if (isAuthenticated && !userPin) {
      setPinModalOpen(true)
    }
  }, [isAuthenticated, userPin])

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ReminderWatcher />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="logo" onClick={() => setCurrentPage('dashboard')}>
              <span className="logo-mark">L</span>
              <span className="logo-text">Luxio</span>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="profile-wrap">
            <button
              className="profile-btn"
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              title={currentUser?.name || 'Profil'}
            >
              <div className="user-avatar">
                {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser?.name || 'User'}</span>
                <span className="user-role">{companyInfo.name || 'Company'}</span>
              </div>
              <ChevronDown size={16} className="profile-chevron" />
            </button>

            {profileOpen && (
              <>
                <div className="profile-menu-backdrop" onClick={() => setProfileOpen(false)} />
                <div className="profile-menu" role="menu">
                  <button
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); setAppState('pricing') }}
                  >
                    <CreditCard size={16} />
                    <span>Langganan</span>
                  </button>
                  <button
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={() => handleNavClick('settings')}
                  >
                    <Settings size={16} />
                    <span>Pengaturan</span>
                  </button>
                  <div className="profile-menu-sep" />
                  <button
                    className="profile-menu-item danger"
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); handleLogout() }}
                  >
                    <LogOut size={16} />
                    <span>Keluar</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            aria-label={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      
      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          
          <div className="topbar-right">
            {isRealOwner && (
              <div className="role-switch">
                <button
                  className="role-switch-btn"
                  onClick={() => setRoleOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={roleOpen}
                  title="Ganti role (mode owner)"
                >
                  <ShieldCheck size={16} />
                  <span className="role-switch-label">{ROLE_LABELS[effRole] || effRole}</span>
                  {roleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {roleOpen && (
                  <>
                    <div className="role-switch-backdrop" onClick={() => setRoleOpen(false)} />
                    <div className="role-switch-menu" role="menu">
                      <div className="role-switch-head">Masuk sebagai</div>
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r}
                          className={`role-switch-option ${effRole === r ? 'active' : ''}`}
                          role="menuitem"
                          onClick={() => handleRoleChange(r)}
                        >
                          <ShieldCheck size={14} />
                          <span>{ROLE_LABELS[r]}</span>
                          {effRole === r && <Check size={14} className="role-switch-check" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="notif-wrap">
              <button className="notification-btn" onClick={handleNotifClick} aria-label="Notifikasi">
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notifications-panel">
                  <div className="notifications-panel-header">
                    <span>Notifikasi</span>
                    <div className="notifications-panel-actions">
                      <button className="notif-action-btn" onClick={markAllNotificationsRead} title="Tandai dibaca">
                        <CheckCheck size={14} />
                      </button>
                      <button className="notif-action-btn" onClick={clearNotifications} title="Bersihkan">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                          <span className="notification-item-icon">
                            {NOTIF_ICON[n.type] || '🔔'}
                          </span>
                          <div className="notification-item-content">
                            <span className="notification-item-title">{n.title}</span>
                            <span className="notification-item-body">{n.body}</span>
                            <span className="notification-item-time">
                              {new Date(n.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notifications-empty">
                        <BellRing size={22} />
                        <span>Belum ada notifikasi</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-avatar-sm">
              {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Headline berita berjalan */}
        <HeadlineMarquee />

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Toast notifikasi (tampil di dalam web, semua perangkat) */}
      {toast && (
        <div className="notif-toast" key={toast.id}>
          <span className="notif-toast-icon">{NOTIF_ICON[toast.type] || '🔔'}</span>
          <div className="notif-toast-content">
            <span className="notif-toast-title">{toast.title}</span>
            <span className="notif-toast-body">{toast.body}</span>
          </div>
          <button className="notif-toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modal wajib: set PIN akun (muncul setelah login bila belum di-set) */}
      {pinModalOpen && (
        <PinSetupModal
          onClose={() => { if (userPin) setPinModalOpen(false) }}
          onSet={(pin) => { setUserPin(pin); setPinModalOpen(false); setToast({ title: 'PIN tersimpan', body: 'PIN akun kamu sudah diatur', type: 'create' }) }}
          closable={Boolean(userPin)}
        />
      )}
    </div>
  )
}

/* ---------- Modal PIN Akun ---------- */

function PinSetupModal({ onClose, onSet, closable }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSet = () => {
    if (!pin.trim()) return setError('PIN tidak boleh kosong.')
    if (!/^\d{4,6}$/.test(pin.trim())) return setError('PIN harus 4–6 digit angka.')
    if (pin !== confirm) return setError('PIN tidak sama dengan konfirmasi.')
    onSet(pin.trim())
  }

  return (
    <div className="pin-modal-overlay">
      <div className="pin-modal">
        <div className="pin-modal-icon">
          <Lock size={24} />
        </div>
        <h2>Atur PIN Akun</h2>
        <p>
          PIN dipakai untuk mengunci Catatan Pribadi kamu. Wajib di-set sebelum
          memakai aplikasi. Kamu bisa mengubahnya nanti di Pengaturan.
        </p>
        <div className="input-group">
          <label className="input-label">PIN (4–6 digit)</label>
          <input
            type="password"
            className="input"
            inputMode="numeric"
            placeholder="cth: 1234"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError('') }}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Ulangi PIN</label>
          <input
            type="password"
            className="input"
            inputMode="numeric"
            placeholder="Ulangi PIN"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSet() }}
          />
        </div>
        {error && <span className="pin-modal-error">{error}</span>}
        <div className="pin-modal-actions">
          {closable && <button className="btn btn-ghost" onClick={onClose}>Nanti</button>}
          <button className="btn btn-primary" disabled={!pin.trim() || !confirm.trim()} onClick={handleSet}>
            <Check size={16} /> Simpan PIN
          </button>
        </div>
      </div>
    </div>
  )
}
