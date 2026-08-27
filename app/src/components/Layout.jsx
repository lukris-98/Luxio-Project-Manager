import React, { useState, useEffect, useRef } from 'react'
import { getAppThemeMode, toggleAppThemeMode, useStore, dataKeyFor } from '../store/useStore'
import { api } from '../services/api'
import ReminderWatcher from './ReminderWatcher'
import HeadlineMarquee from './HeadlineMarquee'
import InstallAppButton from './InstallAppButton'
import { requestNotificationPermission } from '../utils/notify'
import { subscribeToPush } from '../utils/push'
import { useAutoHideNav } from '../utils/useAutoHideNav'
import Logo from './Logo'
import { 
  LayoutDashboard, Target, CheckSquare, Users, Settings, LogOut, Menu, X, Bell, Calendar, Sun, Moon, BellRing, CheckCheck, Trash2, Crown, PanelLeftClose, PanelLeftOpen, Lock, CreditCard, ChevronDown, Building2, ChevronUp, ShieldCheck, Check, MessageSquare, Bot, Rocket, UserPlus, KeyRound, Activity, Clock, ClipboardList, Megaphone, ChevronRight, StickyNote, KanbanSquare, ListTodo, Search, AlarmClock, Trophy, Star, UserRound, AppWindow, Plug2 
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

// Warna aksen tiap ikon sidebar (mengikuti warna brand, dibedakan per item).
const NAV_COLORS = {
  dashboard: 'var(--accent)',
  projects: '#F87171',
  kanban: '#A78BFA',
  'todo-list': '#4ADE80',
  'private-note': '#FACC15',
  calendar: '#22D3EE',
  'my-tasks': '#34D399',
  team: '#60A5FA',
  chat: '#22D3EE',
  agent: '#F472B6',
  upgrade: '#FB923C',
  'admin-users': '#FBBF24',
  'owner-dashboard': '#A78BFA',
  attendance: '#4ADE80',
  'attendance-admin': '#60A5FA',
  'send-notification': '#22D3EE',
  research: '#34D399',
  'alarm-timer': '#F472B6',
  games: '#FACC15',
  performance: '#FB923C',
  apps: '#A78BFA',
  connect: '#22D3EE',
  profile: '#FF6B35',
}

// Link yang punya dropdown berisi item-nya (max 3 terlihat, scroll bila lebih).
const DROPDOWN_IDS = new Set(['projects', 'kanban', 'todo-list', 'private-note'])

// Ambil huruf awal untuk avatar.
const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

// Sumber gambar avatar: foto profil user (bila ada) atau logo Luxio.
const avatarSrc = (user) => user?.avatar_url || `${import.meta.env.BASE_URL || '/'}luxio.png`

// Warna avatar kolaborator (dari palet brand).
const AVATAR_COLORS = ['#FF6B35', '#22D3EE', '#A78BFA', '#4ADE80', '#FACC15', '#F472B6', '#60A5FA', '#F87171']
const colorFor = (id) => AVATAR_COLORS[String(id).length % AVATAR_COLORS.length]

// Bangun daftar dropdown tiap link sidebar.
// Dropdown kini menampilkan NAMA LABEL saja (bukan item per item).
//  - projects     : label dari seluruh target (project).
//  - kanban       : label dari board kanban + target bertipe kanban.
//  - todo-list    : label dari seluruh task (global + per target).
//  - private-note : label dari catatan pribadi user yang login.
const PAGE_BY_ITEM = {
  projects: 'projects',
  kanban: 'kanban',
  'todo-list': 'todo-list',
  'private-note': 'private-note',
}

function buildDropdownItems(itemId, { projects, kanbanBoards, tasks, privateNotes, currentUser, activeRole }) {
  const labelSet = new Set()
  const pushLabel = (items) =>
    items.forEach((x) => {
      const l = (x.theme || '').trim()
      if (l) labelSet.add(l)
      else labelSet.add('')
    })

  switch (itemId) {
    case 'projects':
      pushLabel(projects)
      break
    case 'kanban': {
      pushLabel(kanbanBoards)
      const kanbanProjects = projects.filter(
        (p) => p.viewType === 'kanban' && !kanbanBoards.some((b) => b.projectId === p.id)
      )
      pushLabel(kanbanProjects)
      break
    }
    case 'todo-list':
      pushLabel(tasks)
      break
    case 'private-note': {
      const uid = dataKeyFor(currentUser, activeRole)
      pushLabel(uid != null ? privateNotes[uid] || [] : [])
      break
    }
    default:
      return []
  }

  const labels = [...labelSet].sort((a, b) => {
    if (a === '') return -1
    if (b === '') return 1
    return a.localeCompare(b)
  })

  return labels.map((label) => ({
    key: `lbl-${itemId}-${label || '__none__'}`,
    id: label,
    type: 'label',
    label: label || 'Tanpa Label',
    page: PAGE_BY_ITEM[itemId] || itemId,
  }))
}

export default function Layout({ children }) {
  const {
    currentPage, setCurrentPage, logout, currentUser, companyInfo, appState, setAppState,
    notifications, markAllNotificationsRead, markNotificationRead, loadServerNotifications,
    theme, setTheme, activeRole, setActiveRole, setLabelFilter,
    userPin, setUserPin, isAuthenticated,
    projects, kanbanBoards, tasks, privateNotes, selectedNoteId, setSelectedNoteId,
    openProject, openKanbanBoard,
  } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [toast, setToast] = useState(null)
  const lastToastId = useRef(null)
  const topbarHidden = useAutoHideNav()

  // Role efektif: untuk OWNER bisa act-as (owner/super_admin/admin/user),
  // untuk akun lain = role aslinya.
  const effRole = activeRole || currentUser?.role || 'member'
  const isRealOwner = currentUser?.role === 'owner'
  const isDivisiMode = effRole === 'owner' || effRole === 'super_admin'

  // Nav disusun ulang sesuai role efektif.
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: Target, label: 'Target' },
    { id: 'kanban', icon: KanbanSquare, label: 'Kanban' },
    { id: 'todo-list', icon: ListTodo, label: 'Todo' },
    { id: 'private-note', icon: StickyNote, label: 'Catatan' },
    { id: 'vault', icon: KeyRound, label: 'Brankas' },
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
    // Pemantauan owner (analytics, database, storage, log) — khusus owner.
    ...(effRole === 'owner' ? [{ id: 'owner-dashboard', icon: Activity, label: 'Pemantauan' }] : []),
    // Absen masuk kerja (semua role).
    { id: 'attendance', icon: Clock, label: 'Absen' },
    // Dashboard absensi (khusus admin/super_admin/owner).
    ...(effRole === 'admin' || effRole === 'super_admin' || effRole === 'owner'
      ? [{ id: 'attendance-admin', icon: ClipboardList, label: 'Dashboard Absen' }]
      : []),
    // Kirim notifikasi ke bawahan (owner/super_admin/admin).
    ...(effRole === 'owner' || effRole === 'super_admin' || effRole === 'admin'
      ? [{ id: 'send-notification', icon: Megaphone, label: 'Kirim Notifikasi' }]
      : []),
    // Riset konten — semua role.
    { id: 'research', icon: Search, label: 'Riset Konten' },
    // Alarm & Timer — semua role.
    { id: 'alarm-timer', icon: AlarmClock, label: 'Alarm & Timer' },
    // Mode game (level + badge) — semua role.
    { id: 'games', icon: Trophy, label: 'Game Mode' },
    // Penilaian kinerja tim — khusus admin/super_admin/owner.
    ...(effRole === 'admin' || effRole === 'super_admin' || effRole === 'owner'
      ? [{ id: 'performance', icon: Star, label: 'Penilaian Kinerja' }]
      : []),
    // Aplikasi (hub launcher) — semua role.
    { id: 'apps', icon: AppWindow, label: 'Aplikasi' },
    // Connect (integrasi eksternal) — semua role.
    { id: 'connect', icon: Plug2, label: 'Connect' },
    // Profil sosial (TikTok-style): foto, like, komentar, share.
    { id: 'profile', icon: UserRound, label: 'Profil' },
  ]

  const handleRoleChange = (role) => {
    setActiveRole(role)
    setRoleOpen(false)
    setSidebarOpen(false)
  }

  // Kalau role diganti dan sedang di halaman khusus owner, lempar ke dashboard.
  useEffect(() => {
    if ((currentPage === 'admin-users' || currentPage === 'owner-dashboard') && effRole !== 'owner') {
      setCurrentPage('dashboard')
    }
    if (currentPage === 'send-notification' && !['owner', 'super_admin', 'admin'].includes(effRole)) {
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

  const themeMode = getAppThemeMode(theme)
  const isDarkTheme = themeMode === 'dark'
  const toggleTheme = () => {
    setTheme(toggleAppThemeMode(theme))
  }

  // Muat notifikasi dari backend setiap 30 detik selama sesi aktif.
  useEffect(() => {
    if (!isAuthenticated) return
    loadServerNotifications()
    const id = setInterval(loadServerNotifications, 30000)
    return () => clearInterval(id)
  }, [isAuthenticated, loadServerNotifications])

  // Daftarkan Web Push sekali saat sesi aktif & izin notifikasi sudah diberikan.
  useEffect(() => {
    if (!isAuthenticated) return
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      subscribeToPush()
    }
  }, [isAuthenticated])

  const handleNotifClick = () => {
    requestNotificationPermission()
      .then((perm) => {
        // Izinkan notifikasi → daftarkan juga Web Push (notif walau app tertutup).
        if (perm === 'granted') subscribeToPush()
      })
    setNotifOpen((v) => !v)
    if (!notifOpen) {
      markAllNotificationsRead()
      api.readNotifications([], true).catch(() => {})
    }
  }

  // Klik satu notifikasi → tandai dibaca + pindah ke halaman terkait.
  const handleNotifClickItem = (n) => {
    markNotificationRead(n.id)
    setNotifOpen(false)
    if (!n.page) return
    const p = n.params || {}
    if (n.page === 'project-detail') {
      openProject(p.projectId || p.id)
    } else if (n.page === 'kanban') {
      openKanbanBoard(p.boardId)
    } else if (n.page === 'chat') {
      setCurrentPage('chat')
    } else {
      setCurrentPage(n.page)
    }
  }

  // Klik notifikasi sistem (native browser) → arahkan ke halaman terkait.
  useEffect(() => {
    const onNativeClick = (e) => {
      const d = e.detail || {}
      if (!d.page) return
      handleNotifClickItem({ page: d.page, params: d.params || {} })
    }
    window.addEventListener('luxio:notif-click', onNativeClick)
    return () => window.removeEventListener('luxio:notif-click', onNativeClick)
  }, [handleNotifClickItem])

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId)
    setSidebarOpen(false)
    setProfileOpen(false)
    setOpenDropdown(null)
    if (DROPDOWN_IDS.has(pageId)) setLabelFilter(null)
  }

  // Klik link dengan dropdown: buka/tutup dropdown item-nya.
  const handleDropdownToggle = (item) => {
    setOpenDropdown((cur) => (cur === item.id ? null : item.id))
  }

  // Buka item dari dropdown: label => buka halaman dgn filter label; item lain
  // (project/board/note) => route berdasarkan jenis item.
  const handleDropdownItem = (entry) => {
    if (entry.type === 'label') {
      setLabelFilter(entry.id === '' ? '' : entry.id)
      setCurrentPage(entry.page)
    } else if (entry.type === 'note') {
      setSelectedNoteId(entry.id)
      setCurrentPage('private-note')
    } else if (entry.type === 'board') {
      openKanbanBoard(entry.id)
    } else if (entry.type === 'todo-list') {
      setCurrentPage('todo-list')
    } else {
      // project, atau default: buka halaman detail target.
      openProject(entry.id)
    }
    setSidebarOpen(false)
    setProfileOpen(false)
    setOpenDropdown(null)
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''} ${openDropdown ? 'nav-dropdown-open' : ''}`}>
          <div className="sidebar-header">
            <Logo onClick={() => setCurrentPage('dashboard')} />
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => {
            // Item dropdown untuk link ini (dihitung sekali per render).
            const dropdownItems = DROPDOWN_IDS.has(item.id)
              ? buildDropdownItems(item.id, { projects, kanbanBoards, tasks, privateNotes, currentUser, activeRole })
              : []
            const hasDropdown = dropdownItems.length > 0
            return (
            <div key={item.id} className="nav-item-wrap">
              <button
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() =>
                  DROPDOWN_IDS.has(item.id) && hasDropdown
                    ? handleDropdownToggle(item)
                    : handleNavClick(item.id)
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon size={18} style={{ color: NAV_COLORS[item.id] || 'var(--accent)' }} />
                <span>{item.label}</span>
                {hasDropdown && (
                  <ChevronRight
                    size={14}
                    className={`nav-drop-chevron ${openDropdown === item.id ? 'open' : ''}`}
                  />
                )}
              </button>

              {/* Dropdown item link (target/kanban/todo/catatan) */}
              {hasDropdown && openDropdown === item.id && (
                <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="nav-dropdown-head">
                    <span>{item.label}</span>
                    <button className="nav-dropdown-all" onClick={() => handleNavClick(item.id)}>
                      Semua
                    </button>
                  </div>
                  <div className="nav-dropdown-list">
                    {dropdownItems.map((entry) => (
                      <button
                        key={entry.key}
                        className="nav-dropdown-item"
                        onClick={() => handleDropdownItem(entry)}
                      >
                        <span className="nav-drop-item-icon" style={{ color: NAV_COLORS[item.id] }}>
                          {entry.icon || <item.icon size={16} />}
                        </span>
                        <span className="nav-drop-item-main">
                          <span className="nav-drop-item-name">{entry.label}</span>
                          {entry.sub && <span className="nav-drop-item-sub">{entry.sub}</span>}
                        </span>
                        {/* Avatar kolaborator multi-user */}
                        {entry.collaborators && entry.collaborators.length > 0 && (
                          <span className="nav-drop-collab" title={`Kolaborator: ${entry.collaborators.map((c) => c.name).join(', ')}`}>
                            {entry.collaborators.slice(0, 3).map((c) => (
                              <span key={c.id} className="nav-drop-avatar" style={{ background: c.color }}>
                                {c.initial}
                              </span>
                            ))}
                            {entry.collaborators.length > 3 && (
                              <span className="nav-drop-avatar more">+{entry.collaborators.length - 3}</span>
                            )}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )
          })}
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
                <img src={avatarSrc(currentUser)} alt="Avatar" />
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser?.name || 'User'}</span>
              </div>
              <ChevronDown size={16} className="profile-chevron" />
            </button>

            {profileOpen && (
              <>
                <div className="profile-menu-backdrop" onClick={() => setProfileOpen(false)} />
                <div className="profile-menu" role="menu">
                  <div className="profile-menu-head">
                    <div className="profile-menu-avatar">
                      <img src={avatarSrc(currentUser)} alt="Avatar" />
                    </div>
                    <div className="profile-menu-identity">
                      <span className="profile-menu-name">{currentUser?.name || 'User'}</span>
                      <span className="profile-menu-email">{currentUser?.email || ''}</span>
                    </div>
                  </div>

                  <div className="profile-menu-group">
                    <span className="profile-menu-group-label">Akun</span>
                    <button
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => handleNavClick('settings')}
                    >
                      <UserRound size={16} />
                      <span>Profil</span>
                    </button>
                    <button
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => handleNavClick('settings')}
                    >
                      <Settings size={16} />
                      <span>Pengaturan</span>
                    </button>
                  </div>

                  <div className="profile-menu-group">
                    <span className="profile-menu-group-label">Keuangan</span>
                    <button
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => { setProfileOpen(false); setAppState('pricing') }}
                    >
                      <CreditCard size={16} />
                      <span>Langganan / Payment</span>
                    </button>
                  </div>

                  <div className="profile-menu-group">
                    <button
                      className="profile-menu-item danger"
                      role="menuitem"
                      onClick={() => { setProfileOpen(false); handleLogout() }}
                    >
                      <LogOut size={16} />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="sidebar-bottom">
            <span className="sidebar-version" title="Versi aplikasi">v1.0.5</span>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
              aria-label={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Backdrop penutup dropdown sidebar */}
      {openDropdown && <div className="nav-dropdown-backdrop" onClick={() => setOpenDropdown(null)} />}
      
      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className={`topbar ${topbarHidden ? 'hidden' : ''}`}>
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

            <InstallAppButton className="install-btn" label="Install" />

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDarkTheme ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            >
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="notif-wrap">
              <button className="notification-btn" onClick={handleNotifClick} aria-label="Notifikasi">
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notifications-panel">
                  <div className="notifications-panel-header">
                    <span>Notifikasi</span>
                    <div className="notifications-panel-actions">
                      <button className="notif-action-btn" onClick={markAllNotificationsRead} title="Tandai dibaca">
                        <CheckCheck size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${n.read ? 'read' : 'unread'}${n.page ? ' clickable' : ''}`}
                          onClick={() => handleNotifClickItem(n)}
                        >
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
        <div
          className={`notif-toast${toast.page ? ' clickable' : ''}`}
          key={toast.id}
          onClick={() => toast.page && handleNotifClickItem(toast)}
          role={toast.page ? 'button' : undefined}
        >
          <span className="notif-toast-icon">{NOTIF_ICON[toast.type] || '🔔'}</span>
          <div className="notif-toast-content">
            <span className="notif-toast-title">{toast.title}</span>
            <span className="notif-toast-body">{toast.body}</span>
          </div>
          <button
            className="notif-toast-close"
            onClick={(e) => { e.stopPropagation(); setToast(null) }}
          >
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
