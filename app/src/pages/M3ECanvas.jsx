import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, ExternalLink, Palette } from 'lucide-react'
import './M3ECanvas.css'

export default function M3ECanvas() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="m3e-canvas-page">
      {/* Top Header */}
      <div className="m3e-header">
        <div className="m3e-header-left">
          <button
            className="m3e-header-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
            aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{sidebarCollapsed ? 'Perlebar' : 'Perkecil'}</span>
          </button>
          <div className="m3e-header-titles">
            <h1>M3E Canvas</h1>
            <p>Rancang sketsa UI Material 3 Expressive & konversi ke prompt AI vibe-coding</p>
          </div>
        </div>
        <div className="m3e-header-right">
          <a
            href="https://lnkiai.github.io/m3e-canvas/"
            target="_blank"
            rel="noopener noreferrer"
            className="m3e-external-link"
            title="Buka M3E Canvas di tab baru"
          >
            <ExternalLink size={16} />
            Buka Tab Baru
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className={`m3e-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Collapsible Sidebar */}
        <aside className={`m3e-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="m3e-sidebar-header">
            <h3>Pintasan & Info</h3>
            <button
              className="m3e-sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
              aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="m3e-sidebar-content">
              <div className="m3e-info-section">
                <h4>Fungsi Utama</h4>
                <ul>
                  <li>Drag-and-drop komponen Material 3 Expressive</li>
                  <li>Desain layar HP dan Desktop</li>
                  <li>Hubungkan antar-layar dengan navigasi tap</li>
                  <li>Sesuaikan tema M3 Expressive (Warna, Bentuk, Typo)</li>
                  <li>Ekspor sebagai prompt coding AI (Vibe-coding)</li>
                  <li>Bagikan link dan kolaborasi</li>
                </ul>
              </div>

              <div className="m3e-info-section">
                <h4>Pintasan Keyboard</h4>
                <ul className="m3e-shortcuts">
                  <li><span>Pilih / Tangan</span> <kbd>V / H</kbd></li>
                  <li><span>Geser Canvas</span> <kbd>Space</kbd></li>
                  <li><span>Zoom & Pan</span> <kbd>Wheel</kbd></li>
                  <li><span>Zoom in / out / fit</span> <kbd>+ - 0</kbd></li>
                  <li><span>Undo / Redo</span> <kbd>Ctrl+Z</kbd></li>
                  <li><span>Duplikat</span> <kbd>Ctrl+D</kbd></li>
                  <li><span>Geser Elemen</span> <kbd>Panah</kbd></li>
                  <li><span>Hapus</span> <kbd>Delete</kbd></li>
                  <li><span>Pratinjau</span> <kbd>P</kbd></li>
                </ul>
              </div>

              <div className="m3e-info-section">
                <h4>Fitur Lengkap</h4>
                <ul>
                  <li><strong>Komponen:</strong> Tombol, FAB, chip, bar, kartu, daftar, dialog, input</li>
                  <li><strong>Koneksi Magnetik:</strong> Bagian otomatis menyatu</li>
                  <li><strong>Animasi M3:</strong> Indikator morphing bentuk</li>
                  <li><strong>Transisi:</strong> Slide, fade, expand</li>
                  <li><strong>Format Prompt:</strong> Bahasa Indonesia, Inggris, Jepang, Mandarin</li>
                </ul>
              </div>

              <div className="m3e-info-section">
                <p className="m3e-note">
                  <strong>Catatan:</strong> M3E Canvas berjalan langsung di browser kamu. Semua hasil karya tersimpan otomatis di localStorage browser.
                </p>
              </div>

              <div className="m3e-info-section">
                <a
                  href="https://github.com/lnkiai/m3e-canvas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="m3e-github-link"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  Repository GitHub
                </a>
              </div>
            </div>
          )}
        </aside>

        {/* Canvas iframe */}
        <div className="m3e-canvas-wrapper">
          <iframe
            src="https://lnkiai.github.io/m3e-canvas/"
            className="m3e-canvas-iframe"
            title="M3E Canvas - Material 3 Expressive UI Builder"
            allow="clipboard-write"
          />
        </div>

        {/* Floating expand button when sidebar is collapsed */}
        {sidebarCollapsed && (
          <button
            className="m3e-expand-btn"
            onClick={() => setSidebarCollapsed(false)}
            title="Perlebar sidebar"
            aria-label="Perlebar sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
