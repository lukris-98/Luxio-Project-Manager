import { motion } from 'framer-motion'
import { Check, ArrowLeft, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import './Pricing.css'

// =====================================================================
// Pricing.jsx — Harga (versi revisi, Item 7).
// =====================================================================
// Fitur mencerminkan fitur aktual yang sudah tersedia di aplikasi:
// catatan pribadi ber-PIN, chat grup/DM, target & kanban, level
// kewenangan, dan AI Agent (organisasi). Semua paket berbayar menawarkan
// uji coba (trial) gratis 1 bulan.
// =====================================================================

const plans = [
  {
    name: 'Personal',
    price: 'Gratis',
    period: '',
    trial: false,
    desc: 'Untuk mengatur target pribadi tanpa biaya.',
    features: [
      '1 user',
      '3 target aktif',
      '25 task aktif',
      'Kanban & Todo dasar',
      'Catatan Pribadi ber-PIN',
      'Kalender & task saya',
    ],
    popular: false,
  },
  {
    name: 'Profesional',
    price: '49rb',
    period: '/bulan',
    trial: true,
    desc: 'Ruang kerja pribadi tanpa limit untuk profesional.',
    features: [
      '1 user',
      'Target & task unlimited',
      'Kalender + reminder',
      'Catatan Pribadi ber-PIN',
      'Chat pribadi (DM)',
      'Export laporan bulanan',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Grup',
    price: '149rb',
    period: '/bulan',
    trial: true,
    desc: 'Untuk tim kecil yang membagi tugas lintas anggota.',
    features: [
      'Hingga 15 anggota',
      '5 divisi',
      'Assign task ke anggota',
      'Chat grup divisi & perusahaan',
      'Role admin & level kewenangan',
      'Dashboard grup',
      'Support prioritas',
    ],
    popular: true,
  },
  {
    name: 'Organisasi',
    price: '399rb',
    period: '/bulan',
    trial: true,
    desc: 'Untuk perusahaan, sekolah, yayasan, atau komunitas.',
    features: [
      'Hingga 100 anggota',
      'Divisi unlimited',
      'Level kewenangan lengkap (owner → viewer)',
      'Chat grup + DM + monitoring admin',
      'AI Agent berbasis tool',
      'Analytics organisasi',
      'Upgrade akun self-service',
      'Priority onboarding',
    ],
    popular: false,
  },
]

export default function Pricing() {
  const { setAppState } = useStore()

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <a href="/" className="back-link">
          <ArrowLeft size={18} /> Kembali
        </a>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Harga
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Pilih plan yang sesuai dengan kebutuhanmu
        </motion.p>
        <motion.div
          className="trial-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Sparkles size={16} />
          Semua paket berbayar bisa dicoba gratis 1 bulan
        </motion.div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            {plan.popular && <span className="popular-badge">Terpopuler</span>}
            {plan.trial && <span className="trial-badge">Coba 1 bulan gratis</span>}
            <h3>{plan.name}</h3>
            <p className="plan-desc">{plan.desc}</p>
            <div className="pricing-price">
              <span className="price">{plan.price}</span>
              <span className="period">{plan.period}</span>
            </div>
            <ul className="pricing-features">
              {plan.features.map((f, i) => (
                <li key={i}><Check size={14} /> {f}</li>
              ))}
            </ul>
            <button
              className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-lg`}
              onClick={() => setAppState('checkout')}
            >
              {plan.price === 'Gratis' ? 'Mulai Gratis' : 'Coba Gratis 1 Bulan'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="pricing-note">
        <p>Semua paket berbayar termasuk uji coba gratis 1 bulan, backup otomatis, update fitur, dan support via email.</p>
        <p>Paket Personal gratis dengan limit. Tidak perlu kartu kredit untuk mencoba.</p>
      </div>
    </div>
  )
}
