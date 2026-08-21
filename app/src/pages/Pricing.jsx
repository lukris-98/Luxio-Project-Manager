import { motion } from 'framer-motion'
import { Check, ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import './Pricing.css'

const plans = [
  { 
    name: 'Personal', 
    price: 'Gratis', 
    period: '', 
    desc: 'Untuk mulai mengatur target pribadi tanpa biaya.',
    features: ['1 user', '3 project aktif', '25 task aktif', 'Dashboard personal', 'Data tersimpan lokal demo'], 
    popular: false 
  },
  { 
    name: 'Profesional', 
    price: '49rb', 
    period: '/bulan', 
    desc: 'Untuk pekerja profesional yang butuh ruang kerja tanpa limit.',
    features: ['1 user', 'Project & task unlimited', 'Kalender dan reminder', 'Export laporan bulanan', 'Email support'], 
    popular: true 
  },
  { 
    name: 'Grup', 
    price: '149rb', 
    period: '/bulan', 
    desc: 'Untuk tim kecil yang mulai membagi tugas lintas anggota.',
    features: ['Hingga 15 anggota', '5 divisi', 'Assign task ke anggota', 'Dashboard grup', 'Support prioritas'], 
    popular: false 
  },
  { 
    name: 'Organisasi', 
    price: '399rb', 
    period: '/bulan', 
    desc: 'Untuk perusahaan, instansi, sekolah, atau lembaga yang butuh kontrol lebih.',
    features: ['Hingga 100 anggota', 'Divisi unlimited', 'Role admin lengkap', 'Analytics organisasi', 'Priority onboarding'], 
    popular: false 
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
            {plan.popular && <span className="popular-badge">Best Value</span>}
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
              {plan.price === 'Gratis' ? 'Mulai Gratis' : 'Pilih Plan'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="pricing-note">
        <p>Semua paket berbayar termasuk backup otomatis, update fitur, dan support via email.</p>
        <p>Paket Personal gratis dengan limit. Tidak perlu kartu kredit.</p>
      </div>
    </div>
  )
}
