// =====================================================================
// main.jsx — Titik masuk frontend (entry point).
// =====================================================================
// Merender komponen <App /> ke elemen #root pada index.html dan
// memuat CSS global. Hanya panggil ini satu kali; logika routing
// dan state ada di App.jsx & store/useStore.js.
// =====================================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

// Firebase Analytics (GA4, project luxio-id) di-init SETELAH render pertama
// supaya tidak memperlambat first paint. SDK dimuat dynamic import (chunk
// terpisah); gagal loading analytics tidak boleh mengganggu aplikasi.
import('./services/firebase')
  .then((m) => m.initFirebaseAnalytics())
  .catch(() => {})