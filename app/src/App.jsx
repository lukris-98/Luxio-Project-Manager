import { useEffect } from 'react'
import { useStore } from './store/useStore'
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
import Calendar from './pages/Calendar'
import Team from './pages/Team'
import Settings from './pages/Settings'
import AdminUsers from './pages/AdminUsers'
import UpgradeAkun from './pages/UpgradeAkun'

function App() {
  const { appState, currentPage, isAuthenticated, theme, setAppState } = useStore()

  // Terapkan tema ke seluruh dokumen (termasuk halaman pre-app seperti
  // Landing/Setup) dan warna asli komponen sistem (scrollbar, dsb).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0C0C0E' : '#FAFAFA')
  }, [theme])

  // Bila dibuka dari link konfirmasi email (?token=...), arahkan ke halaman
  // Auth yang akan memproses token (aktivasi akun).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('token')) {
      setAppState('auth')
    }
  }, [setAppState])

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