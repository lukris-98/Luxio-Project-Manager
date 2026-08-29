import { useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import {
  Mail, CalendarDays, Send, MessageCircle, MessageSquare, BookOpen, Code, Folder,
  Plug, Link2, Unplug, Check, X, ShieldCheck,
} from 'lucide-react'
import './Connect.css'

const PROVIDERS = [
  { id: 'gmail', name: 'Gmail', icon: Mail, color: '#EA4335', desc: 'Kirim dan kelola email langsung dari Luxio', placeholder: 'email@gmail.com' },
  { id: 'google-calendar', name: 'Google Calendar', icon: CalendarDays, color: '#4285F4', desc: 'Sinkronkan jadwal dan pengingat acara kamu', placeholder: 'email@gmail.com' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: '#229ED9', desc: 'Terima notifikasi tugas dan update di Telegram', placeholder: '@username atau nomor telepon' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366', desc: 'Kirim laporan dan notifikasi via WhatsApp', placeholder: 'nomor WhatsApp (cth: 628xxxx)' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, color: '#611f69', desc: 'Integrasi dengan channel Slack tim kamu', placeholder: 'nama workspace / email' },
  { id: 'notion', name: 'Notion', icon: BookOpen, color: '#000000', desc: 'Sinkronkan catatan dan dokumen dari Notion', placeholder: 'email@notion.so' },
  { id: 'github', name: 'GitHub', icon: Code, color: '#333333', desc: 'Kaitkan repository dan isu ke proyek kamu', placeholder: 'username GitHub' },
  { id: 'dropbox', name: 'Dropbox', icon: Folder, color: '#0061FF', desc: 'Simpan dan bagikan file dari Dropbox', placeholder: 'email@dropbox.com' },
]

export default function Connect() {
  const { currentUser, activeRole, connections, connectProvider, disconnectProvider } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)
  const connMap = dataKey != null && connections ? connections[dataKey] || {} : {}

  const [modalProvider, setModalProvider] = useState(null)
  const [account, setAccount] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2500)
  }

  const openConnect = (provider) => {
    setModalProvider(provider)
    setAccount('')
  }

  const handleConnect = () => {
    if (!modalProvider || !account.trim()) return
    connectProvider(modalProvider.id, account.trim())
    setModalProvider(null)
    setAccount('')
    showToast(`${modalProvider.name} berhasil terhubung.`)
  }

  const handleDisconnect = (provider) => {
    if (!window.confirm(`Putuskan koneksi ${provider.name}?`)) return
    disconnectProvider(provider.id)
    showToast(`Koneksi ${provider.name} diputus.`)
  }

  return (
    <>
      <div className="connect-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Connect</h1>
            <p>Hubungkan akun eksternal: Gmail, Telegram, WhatsApp, dan lainnya</p>
          </div>
        </div>

        <div className="connect-note">
          <ShieldCheck size={16} />
          <span>Koneksi disimpan aman di perangkat kamu.</span>
        </div>

        <div className="connect-grid">
          {PROVIDERS.map((provider) => {
            const conn = connMap[provider.id]
            const isConnected = Boolean(conn?.connected)
            const ProviderIcon = provider.icon
            return (
              <div key={provider.id} className="connect-card">
                <div className="connect-card-top">
                  <div className="connect-icon" style={{ background: provider.color }}>
                    <ProviderIcon size={20} />
                  </div>
                  <div className="connect-card-info">
                    <div className="connect-name">{provider.name}</div>
                    <div className={`connect-status ${isConnected ? 'on' : 'off'}`}>
                      {isConnected ? (
                        <>
                          <Check size={12} /> Terkoneksi
                        </>
                      ) : (
                        <>
                          <Unplug size={12} /> Belum Terkoneksi
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className="connect-desc">{provider.desc}</p>
                {isConnected && conn?.account && (
                  <div className="connect-account">{conn.account}</div>
                )}
                <div className="connect-card-actions">
                  {isConnected ? (
                    <button className="btn btn-danger" onClick={() => handleDisconnect(provider)}>
                      <Unplug size={14} /> Putuskan
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => openConnect(provider)}>
                      <Plug size={14} /> Hubungkan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal hubungkan layanan (mock OAuth) */}
      {modalProvider && (
        <div className="modal-overlay" onClick={() => setModalProvider(null)}>
          <div className="modal connect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hubungkan {modalProvider.name}</h2>
              <button className="close-btn" onClick={() => setModalProvider(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="connect-modal-provider">
                <div className="connect-icon" style={{ background: modalProvider.color }}>
                  <modalProvider.icon size={20} />
                </div>
                <div>
                  <div className="connect-name">{modalProvider.name}</div>
                  <p className="connect-desc">Masukkan akun yang ingin dihubungkan (simulasi OAuth).</p>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Akun {modalProvider.name}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={modalProvider.placeholder}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConnect() }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalProvider(null)}>Batal</button>
              <button className="btn btn-primary" disabled={!account.trim()} onClick={handleConnect}>
                <Link2 size={16} /> Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="connect-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </>
  )
}
