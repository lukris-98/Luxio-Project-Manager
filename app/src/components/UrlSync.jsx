import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

// =====================================================================
// UrlSync — jembatan react-router <-> state global (Zustand).
// =====================================================================
// Menjadikan URL sebagai sumber navigasi yang bisa dibagikan / deep-link:
//   - '/#/'              → landing
//   - '/#/pricing'       → pricing
//   - '/#/faq'           → faq
//   - '/#/checkout'      → checkout
//   - '/#/auth'          → auth
//   - '/#/setup'         → setup
//   - '/#/app/<page>'    → halaman aplikasi (dashboard, kanban, dll)
//   - '/#/app/<page>/<id>' → deep-link project-detail / kanban
// Store tetap jadi sumber kebenaran; komponen ini hanya menyinkronkan
// URL <-> store tanpa mengubah logika navigasi yang sudah ada.
// =====================================================================

const PUBLIC_ROUTES = ['pricing', 'faq', 'checkout', 'auth', 'setup']

export default function UrlSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    appState, currentPage, isAuthenticated,
    setAppState, setCurrentPage, openProject, openKanbanBoard,
  } = useStore()
  const syncingFromUrl = useRef(false)
  const syncingFromStore = useRef(false)

  // Store → URL
  useEffect(() => {
    if (syncingFromUrl.current) return
    let path = '/'
    if (appState === 'app') {
      if (!isAuthenticated) {
        path = '/'
      } else {
        path = `/app/${currentPage || 'dashboard'}`
      }
    } else if (PUBLIC_ROUTES.includes(appState)) {
      path = `/${appState}`
    }
    if (location.pathname !== path) {
      syncingFromStore.current = true
      navigate(path, { replace: isAuthenticated && appState === 'app' ? false : true })
      syncingFromStore.current = false
    }
  }, [appState, currentPage, isAuthenticated, location.pathname, navigate])

  // URL → Store (deep-link, back/forward)
  useEffect(() => {
    if (syncingFromStore.current) return
    const parts = location.pathname.split('/').filter(Boolean)
    syncingFromUrl.current = true
    try {
      if (parts[0] === 'app') {
        const page = parts[1] || 'dashboard'
        const param = parts[2] || ''
        if (currentPage !== page) setCurrentPage(page)
        if (param && page === 'project-detail' && typeof openProject === 'function') {
          openProject(Number(param) || param)
        } else if (param && page === 'kanban' && typeof openKanbanBoard === 'function') {
          openKanbanBoard(Number(param) || param)
        }
      } else {
        const s = parts[0] || ''
        if (PUBLIC_ROUTES.includes(s) && appState !== s) setAppState(s)
      }
    } finally {
      syncingFromUrl.current = false
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}