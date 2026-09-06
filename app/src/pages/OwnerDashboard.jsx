import { useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { BarChart3, Database, HardDrive, RefreshCw, Crown, ExternalLink, HelpCircle, Activity, Play, Settings, ChevronRight, Download, Trash } from 'lucide-react'
import './OwnerDashboard.css'

const SERVICES_CATEGORIES = ['Semua Layanan', 'Database', 'Analytics', 'Penyimpanan', 'Sistem']

export default function OwnerDashboard() {
  const { currentUser } = useStore()
  const [activeTab, setActiveTab] = useState('Semua Layanan')

  return (
    <>
      <div className="owner-container-main">
        <div className="owner-dashboard-page">
          {/* Header */}
          <div className="page-header owner-header-custom">
            <div className="page-header-left">
              <h1>Pemantauan</h1>
              <p className="owner-desc-sub">Pantau layanan eksternal dan statistik platform dalam satu tempat.</p>
            </div>
            <div className="owner-header-right">
              <button className="btn btn-secondary"><Settings size={16} /> Atur Integrasi</button>
            </div>
          </div>

          {/* Kategori Tabs */}
          <div className="owner-filter-tabs">
            {SERVICES_CATEGORIES.map(category => (
              <button
                key={category}
                className={`owner-filter-tab-btn ${activeTab === category ? 'active' : ''}`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <h3>Gratis di Luxio</h3>
          <ul>
            <li>Manajemen project & proyek (todo + kanban)</li>
            <li>Catatan pribadi + PIN</li>
            <li>Kalender & pengingat</li>
            <li>Tim, divisi & kewenangan</li>
            <li>Chat antar anggota + grup otomatis</li>
            <li>Absen masuk + GPS & selfie</li>
            <li>Keamanan: 2FA, PIN, email konfirmasi</li>
          </ul>
        </div>

        <div className="suggestion-col paid">
          <h3>Berbayar di Luxio</h3>
          <ul>
            <li>Analytics (Umami) — dashboard pengunjung</li>
            <li>Monitoring Database (Neon) — kuota & pemakaian</li>
            <li>Penyimpanan (Backblaze B2) — foto profil & absensi</li>
            <li>AI Agent — otomatisasi task via tool layer</li>
            <li>Kuota project/task lebih besar & anggota tak terbatas</li>
          </ul>
        </div>
      </div>

      <div className="owner-note">
        <strong>Rekomendasi:</strong> gratis untuk kebutuhan dasar tim kecil; upgrade ke paket berbayar
        untuk membuka analytics, monitoring database, penyimpanan, dan AI Agent. Semua paket tersedia
        trial 1 bulan.
      </div>
    </>
  )
}
