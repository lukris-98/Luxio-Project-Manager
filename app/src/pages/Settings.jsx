import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { User, Bell, Shield, HelpCircle } from 'lucide-react'
import './Settings.css'

export default function Settings() {
  const { currentUser, companyInfo, setAppState } = useStore()
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }
  
  const handleStartOver = () => {
    if (confirm('Mau mulai dari awal? Semua data akan dihapus.')) {
      setAppState('setup')
      useStore.setState({
        setupStep: 0,
        companyInfo: { name: '', industry: '', size: '', type: '' },
        divisions: [],
        members: [],
        currentUser: null,
        isAuthenticated: false,
        projects: [],
        tasks: []
      })
    }
  }
  
  return (
    <Layout>
      <motion.div 
        className="settings-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Pengaturan</h1>
            <p>Kelola akun dan preferensi</p>
          </div>
        </motion.div>
        
        <div className="settings-sections">
          {/* Profile */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <User size={18} />
              <h2>Profil</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <span className="item-label">Nama</span>
                <span className="item-value">{currentUser?.name || '-'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">Email</span>
                <span className="item-value">{currentUser?.email || '-'}</span>
              </div>
              <div className="settings-item">
                <span className="item-label">Perusahaan</span>
                <span className="item-value">{companyInfo.name || '-'}</span>
              </div>
            </div>
          </motion.div>
          
          {/* Notifications */}
          <motion.div className="settings-section" variants={itemVariants}>
            <div className="section-header">
              <Bell size={18} />
              <h2>Notifikasi</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item toggle-item">
                <span className="item-label">Email notifikasi</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="settings-item toggle-item">
                <span className="item-label">Reminder task</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </motion.div>
          
          {/* Danger Zone */}
          <motion.div className="settings-section danger" variants={itemVariants}>
            <div className="section-header">
              <Shield size={18} />
              <h2>Risiko Tinggi</h2>
            </div>
            <div className="settings-card">
              <div className="settings-item">
                <div>
                  <span className="item-label">Mulai dari awal</span>
                  <p className="item-desc">Hapus semua data dan mulai setup lagi</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleStartOver}>
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  )
}