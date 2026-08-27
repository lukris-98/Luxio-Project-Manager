import { useEffect } from 'react'
import { getAppThemeConfig, normalizeAppTheme, useStore } from './store/useStore'
import { initModalFocus } from './utils/modalFocus'
// =====================================================================
// App.jsx — Router utama aplikasi (manual, belum pakai react-router).
// =====================================================================
// Menentukan halaman yang dirender berdasarkan state global `useStore`:
//   - appState 'landing'/'pricing'/'faq'/'checkout'/'auth'/'setup'
//     => halaman publik/prasytar sebelum masuk aplikasi.
//   - isAuthenticated false        => arahkan ke Landing.
//   - selain itu => render halaman dalam area 'app' via currentPage.
// CATATAN: react-router-dom sudah ada di package.json tapi belum dipakai;
//          migrasi ke router ini adalah salah satu item roadmap (lihat README).
// =====================================================================
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import FAQ from './pages/FAQ'
import Checkout from './pages/Checkout'
import Auth from './pages/Auth'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import MyTasks from './pages/MyTasks'
import Kanban from './pages/Kanban'
import TodoList from './pages/TodoList'
import PrivateNote from './pages/PrivateNote'
import Vault from './pages/Vault'
import Calendar from './pages/Calendar'
import Team from './pages/Team'
import Settings from './pages/Settings'
import AdminUsers from './pages/AdminUsers'
import UpgradeAkun from './pages/UpgradeAkun'
import ChatPage from './pages/ChatPage'
import AgentChat from './pages/AgentChat'
import OwnerDashboard from './pages/OwnerDashboard'
import AttendancePage from './pages/AttendancePage'
import AttendanceAdmin from './pages/AttendanceAdmin'
import NotificationsPage from './pages/NotificationsPage'
import Games from './pages/Games'
import AlarmTimer from './pages/AlarmTimer'
import Research from './pages/Research'
import Performance from './pages/Performance'
import Apps from './pages/Apps'
import Connect from './pages/Connect'

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
  if (appState === 'landing') {
    return isAuthenticated ? renderApp() : <Landing />
  }
  
  if (appState === 'pricing') {
    return <Pricing />
  }
  
  if (appState === 'faq') {
    return <FAQ />
  }
  
  if (appState === 'checkout') {
    return <Checkout />
  }
  
  // Auth flow
  if (appState === 'auth') {
    return <Auth />
  }
  
  // Setup flow
  if (appState === 'setup') {
    return <Setup />
  }
  
  // Main app - require auth
  if (!isAuthenticated) {
    return <Landing />
  }
  
  return renderApp()
}

export default App