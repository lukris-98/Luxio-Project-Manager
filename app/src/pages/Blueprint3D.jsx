import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, ExternalLink, Home } from 'lucide-react'
import './Blueprint3D.css'

export default function Blueprint3D() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="bp3d-page">
      {/* Top Header */}
      <div className="bp3d-header">
        <div className="bp3d-header-left">
          <button
            className="bp3d-header-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
            aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{sidebarCollapsed ? 'Perlebar' : 'Perkecil'}</span>
          </button>
          <div className="bp3d-header-titles">
            <h1>Blueprint3D</h1>
            <p>Desain denah ruangan 2D &amp; visualisasi 3D interior rumah</p>
          </div>
        </div>
        <div className="bp3d-header-right">
          <a
            href="https://furnishup.github.io/blueprint3d/example/"
            target="_blank"
            rel="noopener noreferrer"
            className="bp3d-external-link"
            title="Buka Blueprint3D di tab baru"
          >
            <ExternalLink size={16} />
            Buka Tab Baru
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className={`bp3d-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Collapsible Sidebar */}
        <aside className={`bp3d-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="bp3d-sidebar-header">
            <h3>Pintasan &amp; Info</h3>
            <button
              className="bp3d-sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
              aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="bp3d-sidebar-content">
              <div className="bp3d-info-section">
                <h4>Fungsi Utama</h4>
                <ul>
                  <li>Gambar denah dinding 2D interaktif</li>
                  <li>Atur ukuran ruangan &amp; posisi pintu/jendela</li>
                  <li>Tempatkan furnitur (meja, kursi, lemari, dll)</li>
                  <li>Switch mode 2D Floorplan &amp; 3D View</li>
                  <li>Navigasi kamera 3D (Orbit, Zoom, Pan)</li>
                  <li>Simpan &amp; muat desain ruangan</li>
                </ul>
              </div>

              <div className="bp3d-info-section">
                <h4>Cara Menggunakan</h4>
                <ul className="bp3d-shortcuts">
                  <li><span>1. Edit Floorplan</span> Modifikasi dinding di mode 2D</li>
                  <li><span>2. Tambah Item</span> Pilih furnitur dari katalog</li>
                  <li><span>3. Mode 3D</span> Klik tab 3D untuk melihat hasil</li>
                  <li><span>4. Rotasi Kamera</span> Klik &amp; drag di area 3D</li>
                </ul>
              </div>

              <div className="bp3d-info-section">
                <p className="bp3d-note">
                  <strong>Catatan:</strong> Blueprint3D berjalan langsung di browser kamu. Semua perubahan tersimpan lokal.
                </p>
              </div>

              <div className="bp3d-info-section">
                <a
                  href="https://github.com/furnishup/blueprint3d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bp3d-github-link"
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

        {/* Blueprint3D iframe */}
        <div className="bp3d-iframe-wrapper">
          <iframe
            src="https://furnishup.github.io/blueprint3d/example/"
            className="bp3d-iframe"
            title="Blueprint3D - 2D/3D Room Planner"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
          />
        </div>

        {/* Floating expand button when sidebar is collapsed */}
        {sidebarCollapsed && (
          <button
            className="bp3d-expand-btn"
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
