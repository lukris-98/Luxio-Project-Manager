import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { BarChart3, Settings, Eye, Save, Link2, RefreshCw, AlertTriangle, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import './Analytics.css'

// =====================================================================
// Analytics.jsx — Halaman Analytics untuk menampilkan Umami Analytics
// dalam iframe. Khusus owner saja.
// =====================================================================

const STORAGE_KEY = 'luxio_analytics_config'

export default function Analytics() {
  const { currentUser } = useStore()
  const [config, setConfig] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [websiteId, setWebsiteId] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState('')
  const [iframeLoading, setIframeLoading] = useState(true)

  // Load config dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setConfig(parsed)
        setWebsiteId(parsed.websiteId)
        setShareUrl(parsed.shareUrl)
      } else {
        setShowConfig(true)
      }
    } catch (e) {
      console.error('Error loading analytics config:', e)
      setShowConfig(true)
    }
  }, [])

  const handleSaveConfig = () => {
    setError('')

    // Validasi input
    if (!websiteId.trim()) {
      setError('Website ID wajib diisi')
      return
    }

    if (!shareUrl.trim()) {
      setError('Share URL wajib diisi')
      return
    }

    // Validasi format Share URL
    try {
      const url = new URL(shareUrl)
      if (!url.pathname.includes('/share/')) {
        setError('Share URL tidak valid. Pastikan URL mengandung "/share/"')
        return
      }
    } catch (e) {
      setError('Format Share URL tidak valid')
      return
    }

    const newConfig = {
      websiteId: websiteId.trim(),
      shareUrl: shareUrl.trim(),
      updatedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
      setShowConfig(false)
      setError('')
      setIframeLoading(true)
    } catch (e) {
      setError('Gagal menyimpan konfigurasi: ' + e.message)
    }
  }

  const handleReset = () => {
    setWebsiteId('')
    setShareUrl('')
    setError('')
  }

  const handleClearConfig = () => {
    if (window.confirm('Hapus konfigurasi analytics? Anda perlu mengisi ulang Website ID dan Share URL.')) {
      localStorage.removeItem(STORAGE_KEY)
      setConfig(null)
      setWebsiteId('')
      setShareUrl('')
      setShowConfig(true)
    }
  }

  return (
    <motion.div
      className="analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Dashboard analytics Umami untuk tracking pengunjung website</p>
        </div>
        <div className="page-header-right">
          {config && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfig(!showConfig)}
              title="Pengaturan Analytics"
            >
              <Settings size={16} />
              {showConfig ? 'Tutup' : 'Pengaturan'}
            </button>
          )}
        </div>
      </div>

      {/* Config Form */}
      {showConfig && (
        <motion.div
          className="analytics-config-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="analytics-config-header">
            <div className="analytics-config-title">
              <Settings size={20} />
              <h2>Konfigurasi Umami Analytics</h2>
            </div>
          </div>

          <div className="analytics-config-body">
            <div className="analytics-info-banner">
              <Info size={16} />
              <div>
                <strong>Cara mendapatkan Website ID dan Share URL:</strong>
                <ol>
                  <li>Buka dashboard Umami Analytics Anda</li>
                  <li>Pilih website yang ingin ditampilkan</li>
                  <li>Klik tombol <strong>Share</strong> di bagian atas</li>
                  <li>Copy <strong>Website ID</strong> (contoh: 1f612a04-2d55-41b8-868b-1e17b8dc7f50)</li>
                  <li>Copy <strong>Share URL</strong> lengkap (contoh: https://umami.example.com/share/xxxxx/website-name)</li>
                </ol>
              </div>
            </div>

            {error && (
              <div className="analytics-error">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">
                Website ID <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="1f612a04-2d55-41b8-868b-1e17b8dc7f50"
                value={websiteId}
                onChange={(e) => setWebsiteId(e.target.value)}
              />
              <p className="field-hint">
                Website ID dari Umami Analytics (format UUID)
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">
                Share URL <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://umami.example.com/share/xxxxx/website-name"
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
              />
              <p className="field-hint">
                URL share dashboard dari Umami (harus mengandung "/share/")
              </p>
            </div>

            <div className="analytics-config-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveConfig}
                disabled={!websiteId.trim() || !shareUrl.trim()}
              >
                <Save size={16} />
                Simpan & Tampilkan
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                <RefreshCw size={16} />
                Reset
              </button>
              {config && (
                <button className="btn btn-ghost" onClick={() => setShowConfig(false)}>
                  Batal
                </button>
              )}
            </div>

            {config && (
              <div className="analytics-current-config">
                <p className="analytics-config-label">Konfigurasi tersimpan:</p>
                <div className="analytics-config-item">
                  <strong>Website ID:</strong>
                  <code>{config.websiteId}</code>
                </div>
                <div className="analytics-config-item">
                  <strong>Share URL:</strong>
                  <code className="analytics-url-truncate">{config.shareUrl}</code>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleClearConfig}>
                  Hapus Konfigurasi
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Analytics Dashboard */}
      {config && !showConfig && (
        <motion.div
          className="analytics-dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="analytics-dashboard-header">
            <div className="analytics-dashboard-info">
              <Eye size={16} />
              <span>Menampilkan analytics untuk: <strong>{config.websiteId}</strong></span>
            </div>
            <div className="analytics-dashboard-actions">
              <a
                href={config.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                title="Buka di tab baru"
              >
                <Link2 size={14} />
                Buka di Tab Baru
              </a>
            </div>
          </div>

          <div className="analytics-iframe-container">
            {iframeLoading && (
              <div className="analytics-iframe-loading">
                <div className="spinner"></div>
                <span>Memuat dashboard analytics...</span>
              </div>
            )}
            <iframe
              src={config.shareUrl}
              className="analytics-iframe"
              title="Umami Analytics Dashboard"
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false)
                setError('Gagal memuat dashboard analytics')
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!config && !showConfig && (
        <div className="analytics-empty">
          <BarChart3 size={48} />
          <h2>Analytics Belum Dikonfigurasi</h2>
          <p>Anda perlu mengisi Website ID dan Share URL dari Umami Analytics terlebih dahulu</p>
          <button className="btn btn-primary" onClick={() => setShowConfig(true)}>
            <Settings size={16} />
            Konfigurasi Sekarang
          </button>
        </div>
      )}
    </motion.div>
  )
}
