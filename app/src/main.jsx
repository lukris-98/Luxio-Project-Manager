// =====================================================================
// main.jsx — Titik masuk frontend (entry point).
// =====================================================================
// Merender komponen <App /> ke elemen #root pada index.html dan
// memuat CSS global. Hanya panggil ini satu kali; logika routing
// dan state ada di App.jsx & store/useStore.js.
// =====================================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)