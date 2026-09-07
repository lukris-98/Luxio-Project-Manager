import React, { useState, useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import AnimatedDropdown from './AnimatedDropdown'
import PinInput from './PinInput'
import { getAppThemeMode, toggleAppThemeMode, useStore, dataKeyFor } from '../store/useStore'
import { api } from '../services/api'
import ReminderWatcher from './ReminderWatcher'
import InstallAppButton from './InstallAppButton'
import { requestNotificationPermission } from '../utils/notify'
import { subscribeToPush } from '../utils/push'
import { useAutoHideNav } from '../utils/useAutoHideNav'
import Logo from './Logo'
import { 
  LayoutDashboard, Target, CheckSquare, Users, Settings, LogOut, Menu, X, Bell, Calendar, Sun, Moon, BellRing, CheckCheck, Trash2, Crown, PanelLeftClose, PanelLeftOpen, Lock, CreditCard, ChevronDown, Building2, ChevronUp, ShieldCheck, Check, Bot, Rocket, UserPlus, KeyRound, Activity, Clock, ClipboardList, ChevronRight, StickyNote, KanbanSquare, ListTodo, Search, UserRound, AppWindow, Plug2, Plus, Wrench, Tags, Mail, Rss, Chrome, HardDrive, CalendarDays, Youtube, Clapperboard
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

// Warna aksen tiap ikon sidebar — semua seragam orange (aksen tema).
const NAV_COLORS = {
  dashboard: 'var(--accent)',
  projects: 'var(--accent)',
  kanban: 'var(--accent)',
  'todo-list': 'var(--accent)',
  'private-note': 'var(--accent)',
  calendar: 'var(--accent)',
  'my-tasks': 'var(--accent)',
  team: 'var(--accent)',
  agent: 'var(--accent)',
  upgrade: 'var(--accent)',
  'admin-users': 'var(--accent)',
  'owner-dashboard': 'var(--accent)',
  attendance: 'var(--accent)',
  'attendance-admin': 'var(--accent)',
  research: 'var(--accent)',
  apps: 'var(--accent)',
  connect: 'var(--accent)',
  tools: 'var(--accent)',
  'metadata-creator': 'var(--accent)',
  google: '#4285F4',
  gmail: '#EA4335',
  blogger: '#FF8000',
  drive: '#1A73E8',
  'google-calendar': '#4285F4',
  youtube: '#FF0000',
}

// Link yang punya dropdown berisi item-nya (max 3 terlihat, scroll bila lebih).
const DROPDOWN_IDS = new Set(['projects', 'kanban', 'todo-list', 'private-note'])

// Dropdown "Tools" — berisi tautan ke tool khusus (static, bukan data).
// Hanya dapat diakses lewat tombol dropdown ini.
const TOOL_LINKS = [
  {
    key: 'tool-metadata-creator',
    id: 'metadata-creator',
    type: 'tool',
    icon: Tags,
    label: 'Metadata Creator',
    sub: 'SEO nama & 40 label untuk Adobe Stock',
    page: 'metadata-creator',
  },
  {
    key: 'tool-bang-motion',
    id: 'bang-motion',
    type: 'tool',
    icon: Clapperboard,
    label: 'Bang Motion',
    sub: 'Motion graphics AI — opener, promo, explainer',
    page: 'bang-motion',
  },
]

// Dropdown "Google" — semua halaman layanan API Google. Sama seperti
// "Tools": 'google' bukan halaman nyata, hanya pemicu dropdown.
const GOOGLE_LINKS = [
  {
    key: 'google-gmail',
    id: 'gmail',
    type: 'tool',
    icon: Mail,
    label: 'Gmail',
    sub: 'Baca, kirim, dan kelola email',
    page: 'gmail',
  },
  {
    key: 'google-blogger',
    id: 'blogger',
    type: 'tool',
    icon: Rss,
    label: 'Blogger',
    sub: 'Post, halaman, dan moderasi komentar',
    page: 'blogger',
  },
  {
    key: 'google-drive',
    id: 'drive',
    type: 'tool',
    icon: HardDrive,
    label: 'Drive',
    sub: 'Unggah, bagikan, dan kelola file',
    page: 'drive',
  },
  {
    key: 'google-calendar',
    id: 'google-calendar',
    type: 'tool',
    icon: CalendarDays,
    label: 'Calendar',
    sub: 'Acara, rapat berulang, dan Meet',
    page: 'google-calendar',
  },
  {
    key: 'google-youtube',
    id: 'youtube',
    type: 'tool',
    icon: Youtube,
    label: 'YouTube',
    sub: 'Data, Analytics, dan Reporting API',
    page: 'youtube',
  },
]

// Grup statis: id item sidebar → daftar tautan anaknya. Dipakai render loop
// untuk memutuskan apakah sebuah item hanya membuka dropdown (bukan halaman).
const STATIC_GROUPS = {
  tools: TOOL_LINKS,
  google: GOOGLE_LINKS,
}

// Halaman anak tiap grup statis — dipakai untuk menandai item grup sebagai
// "active" ketika salah satu halaman anaknya sedang dibuka.
const STATIC_GROUP_PAGES = Object.fromEntries(
  Object.entries(STATIC_GROUPS).map(([id, links]) => [id, links.map((l) => l.page)]),
)

// Ambil huruf awal untuk avatar.
const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

// Sumber gambar avatar: foto profil user (bila ada) — fallback teks inisial.
const avatarSrc = (user) => user?.avatar_url || null

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
    label: label || 'Tanpa Folder',
    page: PAGE_BY_ITEM[itemId] || itemId,
  }))
}

export default function Layout({ children }) {
  const {
    currentPage, setCurrentPage, logout, currentUser, companyInfo, appState, setAppState,
    notifications, markAllNotificationsRead, markNotificationRead, loadServerNotifications,
    theme, setTheme, activeRole, setActiveRole, setLabelFilter,
    userPin, setUserPin, isAuthenticated, members,
    projects, kanbanBoards, tasks, privateNotes, selectedNoteId, setSelectedNoteId,
    openProject, openKanbanBoard,
  } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // default mengecil
  const [sidebarHover, setSidebarHover] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [toast, setToast] = useState(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const topbarHidden = useAutoHideNav()

  // Sidebar terlipat EFEKTIF: saat mode "perkecil", hover melebarkan sementara
  // dan keluar hover mengecilkan lagi. Mode "perbesar" mengunci tetap lebar.
  const isCollapsed = sidebarCollapsed && !sidebarHover

  // Role efektif: untuk OWNER bisa act-as (owner/super_admin/admin/user),
  // untuk akun lain = role aslinya.
  const effRole = activeRole || currentUser?.role || 'member'
  const isRealOwner = currentUser?.role === 'owner'
  const isDivisiMode = effRole === 'owner' || effRole === 'super_admin'

  // Nav disusun ulang sesuai role efektif.
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'projects', icon: Target, label: 'Project' },
    { id: 'kanban', icon: KanbanSquare, label: 'Kanban' },
    { id: 'todo-list', icon: ListTodo, label: 'Todo' },
    { id: 'private-note', icon: StickyNote, label: 'Catatan' },
    { id: 'vault', icon: KeyRound, label: 'Brankas' },
    // Penyimpanan cloud (Neon + Backblaze B2) — semua role.
    { id: 'storage', icon: HardDrive, label: 'Penyimpanan' },
    { id: 'calendar', icon: Calendar, label: 'Kalender' },
    { id: 'my-tasks', icon: CheckSquare, label: 'Task Saya' },
    // Super Admin / Owner => Divisi (CRUD divisi+tim), Admin/User => Tim.
    { id: 'team', icon: isDivisiMode ? Building2 : Users, label: isDivisiMode ? 'Divisi' : 'Tim' },
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
    // Riset konten — semua role.
    { id: 'research', icon: Search, label: 'Riset Konten' },
    // Aplikasi (hub launcher) — semua role.
    { id: 'apps', icon: AppWindow, label: 'Aplikasi' },
    // Connect (integrasi eksternal) — semua role.
    { id: 'connect', icon: Plug2, label: 'Connect' },
    // Google — dropdown berisi semua halaman layanan API Google
    // (Gmail, Blogger, Drive, Calendar, YouTube). Bukan halaman sendiri.
    { id: 'google', icon: Chrome, label: 'Google' },
    // Tools — dropdown berisi tautan tool khusus (mis. Metadata Creator).
    { id: 'tools', icon: Wrench, label: 'Tools' },
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
  }, [effRole, currentPage, setCurrentPage])

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
    // Buka/tutup panel DULU (jangan biarkan request izin menunda/error).
    const willOpen = !notifOpen
    setNotifOpen(willOpen)
    if (!willOpen) return
    // Saat pertama kali dibuka, minta izin notifikasi (jika belum) + daftarkan Web Push.
    // requestNotificationPermission bisa mengembalikan string (izin sudah
    // ada / tidak didukung) atau Promise — bungkus dengan Promise.resolve.
    Promise.resolve(requestNotificationPermission())
      .then((perm) => {
        if (perm === 'granted') subscribeToPush()
      })
      .catch(() => {})
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

  // Klik link dengan dropdown: buka dropdown item-nya & tutup yang lain
  // (satu dropdown aktif pada satu waktu), lalu pindahkan fokus keyboard
  // ke item pertama dropdown yang baru terbuka.
  const dropdownItemRefs = useRef({})
  const dropdownElRefs = useRef({})
  const handleDropdownToggle = (item) => {
    setOpenDropdown((cur) => {
      const next = cur === item.id ? null : item.id
      if (next) {
        // Auto-scroll: kalau daftar dropdown "tenggelam" di bawah area
        // sidebar yang terlihat, gulir sampai seluruh daftarnya terlihat.
        requestAnimationFrame(() => {
          dropdownElRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          dropdownItemRefs.current[next]?.[0]?.focus({ preventScroll: true })
        })
      }
      return next
    })
  }

  // Buka item dari dropdown: label => buka halaman dgn filter label; item lain
  // (project/board/note) => route berdasarkan jenis item.
  const handleDropdownItem = (entry) => {
    if (entry.type === 'tool') {
      setCurrentPage(entry.page)
    } else if (entry.type === 'label') {
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

  // PIN akun: ditawarkan SEKALI per akun per perangkat setelah login
  // (PIN catatan pribadi bersifat lokal; backend hanya menyimpan PIN owner).
  // Kalau ditutup ("Nanti"), jangan menginterogasi lagi di login berikutnya.
  const pinPromptKey = `luxio_pin_prompt_${currentUser?.id ?? 'anon'}`
  useEffect(() => {
    if (!isAuthenticated || userPin) return
    let dismissed = null
    try { dismissed = localStorage.getItem(pinPromptKey) } catch { /* abaikan */ }
    if (dismissed === '1') return
    setPinModalOpen(true)
  }, [isAuthenticated, userPin, pinPromptKey])

  return (
    <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ReminderWatcher />

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''} ${openDropdown ? 'nav-dropdown-open' : ''}`}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
          <div className="sidebar-header">
            <Logo onClick={() => setCurrentPage('dashboard')} />
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => {
            // Item dropdown untuk link ini (dihitung sekali per render).
            // Grup statis ("Tools", "Google") memakai daftar tautan tetap;
            // grup lain (project/kanban/todo/catatan) dibangun dari data.
            const staticLinks = STATIC_GROUPS[item.id]
            const isStaticGroup = Boolean(staticLinks)
            const dropdownItems = isStaticGroup
              ? staticLinks
              : DROPDOWN_IDS.has(item.id)
                ? buildDropdownItems(item.id, { projects, kanbanBoards, tasks, privateNotes, currentUser, activeRole })
                : []
            const hasDropdown = isStaticGroup || dropdownItems.length > 0
            // Grup statis bukan halaman nyata: tandai aktif bila salah satu
            // halaman anaknya sedang dibuka.
            const isActive = isStaticGroup
              ? STATIC_GROUP_PAGES[item.id].includes(currentPage)
              : currentPage === item.id
            return (
            <div key={item.id} className="nav-item-wrap">
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() =>
                  isStaticGroup || (DROPDOWN_IDS.has(item.id) && hasDropdown)
                    ? handleDropdownToggle(item)
                    : handleNavClick(item.id)
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={14} style={{ color: NAV_COLORS[item.id] || 'var(--accent)' }} />
                <span>{item.label}</span>
                {hasDropdown && (
                  <ChevronRight
                    size={12}
                    className={`nav-drop-chevron ${openDropdown === item.id ? 'open' : ''}`}
                  />
                )}
              </button>

              {/* Dropdown item link (target/kanban/todo/catatan/tool/google) */}
              {hasDropdown && (
                <AnimatedDropdown show={openDropdown === item.id}>
                <div
                  className="nav-dropdown"
                  ref={(el) => { dropdownElRefs.current[item.id] = el }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="nav-dropdown-head">
                    <span>{item.label}</span>
                    {/* Grup statis tidak punya halaman "Semua". */}
                    {!isStaticGroup && (
                      <button className="nav-dropdown-all" onClick={() => handleNavClick(item.id)}>
                        Semua
                      </button>
                    )}
                  </div>
                  <div className="nav-dropdown-list">
                    {dropdownItems.map((entry, di) => (
                      <button
                        key={entry.key}
                        ref={(el) => {
                          if (!dropdownItemRefs.current[item.id]) dropdownItemRefs.current[item.id] = []
                          dropdownItemRefs.current[item.id][di] = el
                        }}
                        className={`nav-dropdown-item ${currentPage === entry.page ? 'active' : ''}`}
                        onClick={() => handleDropdownItem(entry)}
                      >
                        <span className="nav-drop-item-icon" style={{ color: NAV_COLORS[entry.id] || NAV_COLORS[item.id] }}>
                          {entry.icon
                            ? (React.isValidElement(entry.icon) ? entry.icon : <entry.icon size={16} />)
                            : <item.icon size={16} />}
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
                </AnimatedDropdown>
              )}
            </div>
            )
          })}
        </nav>
        
        <div className="sidebar-footer">
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

          <div className="mobile-topbar-brand">
            <Logo onClick={() => setCurrentPage('dashboard')} />
          </div>

          <div className="topbar-search" role="search">
            <Search size={18} />
            <input type="search" placeholder="Cari tugas, proyek, atau tim..." aria-label="Cari tugas, proyek, atau tim" />
          </div>
          
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
                  <div className="role-switch-backdrop" onClick={() => setRoleOpen(false)} />
                )}
                <AnimatedDropdown show={roleOpen}>
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
                </AnimatedDropdown>
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

              <AnimatedDropdown show={notifOpen}>
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
                </AnimatedDropdown>
            </div>

            <div className="profile-wrap topbar-profile-wrap">
              <button
                className="profile-btn topbar-profile-btn"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                title={currentUser?.name || 'Profil'}
              >
                <div className="user-avatar">
                  {avatarSrc(currentUser) ? (
                    <img src={avatarSrc(currentUser)} alt="Avatar" />
                  ) : (
                    <span className="avatar-initials">{initials(currentUser?.name)}</span>
                  )}
                </div>
                <div className="user-details">
                  <span className="user-name">{currentUser?.name || 'User'}</span>
                </div>
                <ChevronDown size={16} className="profile-chevron" />
              </button>

              {profileOpen && (
                <>
                  <div className="profile-menu-backdrop" onClick={() => setProfileOpen(false)} />
                  <AnimatedDropdown show={profileOpen}>
                  <div className="profile-menu" role="menu">
                    <div className="profile-menu-head">
                      <div className="profile-menu-avatar">
                        {avatarSrc(currentUser) ? (
                          <img src={avatarSrc(currentUser)} alt="Avatar" />
                        ) : (
                          <span className="avatar-initials">{initials(currentUser?.name)}</span>
                        )}
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
                        onClick={() => { setProfileOpen(false); setLogoutConfirmOpen(true) }}
                      >
                        <LogOut size={16} />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                  </AnimatedDropdown>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <MotionConfig reducedMotion="always">
            {children}
          </MotionConfig>
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

      <nav className="mobile-bottom-nav" aria-label="Navigasi utama mobile">
        <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => handleNavClick('dashboard')}>
          <LayoutDashboard size={19} />
          <span>Beranda</span>
        </button>
        <button className={currentPage === 'my-tasks' ? 'active' : ''} onClick={() => handleNavClick('my-tasks')}>
          <CheckSquare size={19} />
          <span>Tugas</span>
        </button>
        <button className="mobile-bottom-fab" onClick={() => handleNavClick('projects')} aria-label="Buat proyek">
          <Plus size={24} />
        </button>
        <button className={currentPage === 'attendance' ? 'active' : ''} onClick={() => handleNavClick('attendance')}>
          <Clock size={19} />
          <span>Absen</span>
        </button>
        <button className={currentPage === 'settings' ? 'active' : ''} onClick={() => handleNavClick('settings')}>
          <Settings size={19} />
          <span>Akun</span>
        </button>
      </nav>

      {/* Konfirmasi keluar akun */}
      {logoutConfirmOpen && (
        <LogoutConfirmModal
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => { setLogoutConfirmOpen(false); handleLogout() }}
        />
      )}

      {/* Modal PIN akun (muncul setelah login bila belum di-set; bisa "Nanti") */}
      {pinModalOpen && (
        <PinSetupModal
          onClose={() => {
            if (!userPin) {
              try { localStorage.setItem(pinPromptKey, '1') } catch { /* abaikan */ }
            }
            setPinModalOpen(false)
          }}
          onSet={(pin) => { setUserPin(pin); setPinModalOpen(false); setToast({ title: 'PIN tersimpan', body: 'PIN akun kamu sudah diatur', type: 'create' }) }}
          closable
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
  const confirmRef = useRef(null)

  const handleSet = () => {
    if (!pin.trim()) return setError('PIN tidak boleh kosong.')
    if (!/^\d{4,6}$/.test(pin.trim())) return setError('PIN harus 4–6 digit angka.')
    if (pin !== confirm) return setError('PIN tidak sama dengan konfirmasi.')
    onSet(pin.trim())
  }

  const handleFirstComplete = () => {
    confirmRef.current?.focus()
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
          <PinInput length={6} value={pin} onChange={(v) => { setPin(v); setError('') }} onComplete={handleFirstComplete} />
        </div>
        <div className="input-group">
          <label className="input-label">Ulangi PIN</label>
          <PinInput length={6} value={confirm} onChange={(v) => { setConfirm(v); setError('') }} onComplete={handleSet} autoFocus={false} inputRef={confirmRef} />
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

/* ---------- Konfirmasi Keluar Akun ---------- */

function LogoutConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="pin-modal-overlay">
      <div className="pin-modal">
        <div className="pin-modal-icon">
          <LogOut size={24} />
        </div>
        <h2>Keluar Akun?</h2>
        <p>
          Kamu akan keluar dari akun ini. Pastikan semua data sudah tersinkron.
          Klik <strong>Ya, Keluar</strong> untuk mengakhiri sesi.
        </p>
        <div className="pin-modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            <LogOut size={16} /> Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
