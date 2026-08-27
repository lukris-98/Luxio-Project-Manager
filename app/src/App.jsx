import { lazy, Suspense, useEffect } from 'react'
import { getAppThemeConfig, normalizeAppTheme, useStore } from './store/useStore'
import { initModalFocus } from './utils/modalFocus'
import UrlSync from './components/UrlSync'
// =====================================================================
// App.jsx — Router utama aplikasi.
// =====================================================================
// - URL dikelola react-router (HashRouter di main.jsx) dan disinkronkan
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
const Calendar = lazy(() => import('./pages/Calendar'))
const Team = lazy(() => import('./pages/Team'))
const Settings = lazy(() => import('./pages/Settings'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const UpgradeAkun = lazy(() => import('./pages/UpgradeAkun'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const AgentChat = lazy(() => import('./pages/AgentChat'))
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))
const AttendanceAdmin = lazy(() => import('./pages/AttendanceAdmin'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const Games = lazy(() => import('./pages/Games'))
const AlarmTimer = lazy(() => import('./pages/AlarmTimer'))
const Research = lazy(() => import('./pages/Research'))
const Performance = lazy(() => import('./pages/Performance'))
const Apps = lazy(() => import('./pages/Apps'))
const Connect = lazy(() => import('./pages/Connect'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )
}

function App() {
  const { appState, currentPage, isAuthenticated, theme, setAppState, seedOwnerDummyData } = useStore()

  // Seed data demo untuk owner — sekali, saat sesi dipulihkan dari
  // localStorage (mis. refresh) atau setelah login via alur lain.
  useEffect(() => {
    if (isAuthenticated) seedOwnerDummyData()
  }, [isAuthenticated, seedOwnerDummyData])

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

  // Saat refresh: jangan tertahan di halaman publik (pricing/faq/checkout)
  // yang tersimpan dari sesi sebelumnya. Pengguna yang belum login kembali ke
  // Landing; yang sudah login otomatis diarahkan ke halaman app oleh logika
  // render di bawah. Halaman publik tetap bisa dibuka lewat navigasi.
  useEffect(() => {
    if (['pricing', 'faq', 'checkout'].includes(appState)) {
      setAppState('landing')
    }
  }, [appState, setAppState])

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
      case 'chat':
        return <ChatPage />
      case 'agent':
        return <AgentChat />
      case 'owner-dashboard':
        return <OwnerDashboard />
      case 'attendance':
        return <AttendancePage />
      case 'attendance-admin':
        return <AttendanceAdmin />
      case 'send-notification':
        return <NotificationsPage />
      case 'games':
        return <Games />
      case 'alarm-timer':
        return <AlarmTimer />
      case 'research':
        return <Research />
      case 'performance':
        return <Performance />
      case 'apps':
        return <Apps />
      case 'connect':
        return <Connect />
      default:
        return <Dashboard />
    }
  }
  // Landing pages — tapi kalau sesi masih aktif (dipulihkan persist dari
  // localStorage setelah refresh) jangan kirim user ke landing walau
  // appState sempat tertinggal 'landing'; langsung render halaman app.
  let content
  if (appState === 'landing') {
    content = isAuthenticated ? renderApp() : <Landing />
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
    content = renderApp()
  }

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