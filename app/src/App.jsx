import { lazy, Suspense, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { getAppThemeConfig, normalizeAppTheme, useStore } from './store/useStore'
import { initModalFocus } from './utils/modalFocus'
import UrlSync from './components/UrlSync'
import Layout from './components/Layout'
// =====================================================================
// App.jsx — Router utama aplikasi.
// =====================================================================
// - URL dikelola react-router (BrowserRouter di main.jsx) dan disinkronkan
//   ke state global lewat komponen <UrlSync /> (shareable URL, deep-link,
//   back/forward). 
// - Halaman di-load secara lazy (React.lazy) agar bundle terpecah per
//   halaman (lihat vite.config manualChunks).
// =====================================================================

// Halaman publik + area app di-load lazy; Landing dibiarkan eager agar
// first paint cepat.
const Landing = lazy(() => import('./pages/Landing'))
const Pricing = lazy(() => import('./pages/Pricing'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Auth = lazy(() => import('./pages/Auth'))
const Setup = lazy(() => import('./pages/Setup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const MyTasks = lazy(() => import('./pages/MyTasks'))
const Kanban = lazy(() => import('./pages/Kanban'))
const TodoList = lazy(() => import('./pages/TodoList'))
const PrivateNote = lazy(() => import('./pages/PrivateNote'))
const Vault = lazy(() => import('./pages/Vault'))
const StoragePage = lazy(() => import('./pages/StoragePage'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Team = lazy(() => import('./pages/Team'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const UpgradeAkun = lazy(() => import('./pages/UpgradeAkun'))
const AgentChat = lazy(() => import('./pages/AgentChat'))
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))
const AttendanceAdmin = lazy(() => import('./pages/AttendanceAdmin'))
const Research = lazy(() => import('./pages/Research'))
const Apps = lazy(() => import('./pages/Apps'))
const Connect = lazy(() => import('./pages/Connect'))
const MetadataCreator = lazy(() => import('./pages/MetadataCreator'))
const BangMotion = lazy(() => import('./pages/BangMotion'))
const GmailPage = lazy(() => import('./pages/GmailPage'))
const BloggerPage = lazy(() => import('./pages/BloggerPage'))
// Grup "Google" di sidebar — satu halaman per layanan API Google.
const DrivePage = lazy(() => import('./pages/DrivePage'))
const GCalendarPage = lazy(() => import('./pages/GCalendarPage'))
const YouTubePage = lazy(() => import('./pages/YouTubePage'))

function PageLoader() {
  // Fallback Suspense dibuat "senyap" (hampir tidak terlihat) — tanpa spinner
  // besar yang membuat layar tampak berkedip. Karena semua chunk halaman
  // sudah di-preload saat app mulai, fallback ini nyaris tidak pernah muncul.
  return (
    <div aria-hidden="true" style={{ minHeight: '40vh' }} />
  )
}

function App() {
  const { appState, currentPage, isAuthenticated, theme, setAppState } = useStore()

  // Preload semua chunk halaman lazy DI AWAL, agar saat berpindah halaman
  // tidak muncul fallback Suspense (spinner) yang membuat layar berkedip.
  useEffect(() => {
    const chunks = [
      import('./pages/Pricing'),
      import('./pages/FAQ'),
      import('./pages/Checkout'),
      import('./pages/Auth'),
      import('./pages/Setup'),
      import('./pages/Dashboard'),
      import('./pages/Projects'),
      import('./pages/ProjectDetail'),
      import('./pages/MyTasks'),
      import('./pages/Kanban'),
      import('./pages/TodoList'),
      import('./pages/PrivateNote'),
      import('./pages/Vault'),
      import('./pages/StoragePage'),
      import('./pages/Calendar'),
      import('./pages/Team'),
      import('./pages/Settings'),
      import('./pages/AdminUsers'),
      import('./pages/UpgradeAkun'),
      import('./pages/AgentChat'),
      import('./pages/OwnerDashboard'),
      import('./pages/AttendancePage'),
      import('./pages/AttendanceAdmin'),
      import('./pages/Research'),
      import('./pages/Apps'),
      import('./pages/Connect'),
      import('./pages/MetadataCreator'),
      import('./pages/BangMotion'),
      import('./pages/GmailPage'),
      import('./pages/BloggerPage'),
      import('./pages/DrivePage'),
      import('./pages/GCalendarPage'),
      import('./pages/YouTubePage'),
    ]
    chunks.forEach((p) => p.catch(() => {}))
  }, [])

  // Terapkan tema ke seluruh dokumen (termasuk halaman pre-app seperti
  // Landing/Setup) dan warna asli komponen sistem (scrollbar, dsb).
  useEffect(() => {
    const activeTheme = normalizeAppTheme(theme)
    const themeConfig = getAppThemeConfig(activeTheme)

    document.documentElement.setAttribute('data-theme', activeTheme)
    document.documentElement.style.colorScheme = themeConfig.scheme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', themeConfig.color)
  }, [theme])

  // Bila dibuka dari link konfirmasi email (?token=...), arahkan ke halaman
  // Auth yang akan memproses token (aktivasi akun).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('token')) {
      setAppState('auth')
    }
  }, [setAppState])

  // CATATAN: efek "paksa landing saat tamu berada di halaman publik" telah
  // dihapus — halaman publik (pricing/faq/checkout) BOLEH dibuka tamu via
  // deep-link. UrlSync menjadikan URL sumber kebenaran saat load.

  // Fokus otomatis ke modal/pop-up saat muncul (scroll & keyboard focus).
  useEffect(() => {
    return initModalFocus()
  }, [])

  const renderApp = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'projects':
        return <Projects />
      case 'project-detail':
        return <ProjectDetail />
      case 'my-tasks':
        return <MyTasks />
      case 'kanban':
        return <Kanban />
      case 'todo-list':
        return <TodoList />
      case 'private-note':
        return <PrivateNote />
      case 'vault':
        return <Vault />
      case 'storage':
        return <StoragePage />
      case 'calendar':
        return <Calendar />
      case 'team':
        return <Team />
      case 'settings':
        return <Settings />
      case 'admin-users':
        return <AdminUsers />
      case 'upgrade':
        return <UpgradeAkun />
      case 'agent':
        return <AgentChat />
      case 'owner-dashboard':
        return <OwnerDashboard />
      case 'attendance':
        return <AttendancePage />
      case 'attendance-admin':
        return <AttendanceAdmin />
      case 'research':
        return <Research />
      case 'apps':
        return <Apps />
      case 'connect':
        return <Connect />
      case 'metadata-creator':
        return <MetadataCreator />
      case 'bang-motion':
        return <BangMotion />
      case 'gmail':
        return <GmailPage />
      case 'blogger':
        return <BloggerPage />
      case 'drive':
        return <DrivePage />
      case 'google-calendar':
        return <GCalendarPage />
      case 'youtube':
        return <YouTubePage />
      default:
        return <Dashboard />
    }
  }
  // Landing pages — tapi kalau sesi masih aktif (dipulihkan persist dari
  // localStorage setelah refresh) jangan kirim user ke landing walau
  // appState sempat tertinggal 'landing'; langsung render halaman app.
  let content
  if (appState === 'landing') {
    content = isAuthenticated ? (
      <Layout>{renderApp()}</Layout>
    ) : (
      <Landing />
    )
  } else if (appState === 'pricing') {
    content = <Pricing />
  } else if (appState === 'faq') {
    content = <FAQ />
  } else if (appState === 'checkout') {
    content = <Checkout />
  } else if (appState === 'auth') {
    content = <Auth />
  } else if (appState === 'setup') {
    content = <Setup />
  } else if (!isAuthenticated) {
    content = <Landing />
  } else {
    content = <Layout>{renderApp()}</Layout>
  }

  // ---------------------------------------------------------------
  // Transisi antar halaman ala "theme lain" — View Transition API.
  // Aksi setCurrentPage di-store dibungkus document.startViewTransition:
  // snapshot lama diambil, halaman baru dirender sinkron (flushSync) di
  // dalam callback transisi. Browser tanpa dukungan render langsung.
  // ---------------------------------------------------------------
  useEffect(() => {
    const original = useStore.getState().setCurrentPage
    useStore.setState({
      setCurrentPage: (page) => {
        const state = useStore.getState()
        if (page === state.currentPage) {
          original(page)
          return
        }
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!document.startViewTransition || reduce) {
          original(page)
          return
        }
        document.startViewTransition(() => {
          flushSync(() => original(page))
        })
      },
    })
  }, [])

  return (
    <>
      <UrlSync />
      <Suspense fallback={<PageLoader />}>
        {content}
      </Suspense>
    </>
  )
}

export default App