import { useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { Rocket, Building2, GraduationCap, HeartHandshake, Users, Briefcase, ArrowRight, Check, X } from 'lucide-react'
import './UpgradeAkun.css'

// =====================================================================
// UpgradeAkun.jsx — Alur upgrade akun (Item 4).
// =====================================================================
// Akun self-register otomatis ber-role 'user' (terbatas). Halaman ini
// meng-upgrade ke paket berbayar: role berubah ke admin (plan Grup) atau
// super_admin (plan Organisasi) sesuai tipe organisasi yang diisi.
// =====================================================================

const ORG_TYPES = [
  { id: 'perusahaan', label: 'PT / CV / Perusahaan', icon: Building2, desc: 'Bisnis, agency, startup' },
  { id: 'sekolah', label: 'Sekolah', icon: GraduationCap, desc: 'Sekolah, kampus, lembaga kursus' },
  { id: 'yayasan', label: 'Yayasan', icon: HeartHandshake, desc: 'Lembaga nirlaba / sosial' },
  { id: 'komunitas', label: 'Komunitas', icon: Users, desc: 'Komunitas, perkumpulan, ormas' },
  { id: 'lainnya', label: 'Organisasi Lainnya', icon: Briefcase, desc: 'Tipe organisasi lain' },
]

const PLAN_OPTIONS = [
  {
    id: 'grup',
    label: 'Paket Grup',
    price: '149rb/bulan',
    role: 'Admin',
    desc: 'Untuk tim kecil. Role kamu menjadi Admin.',
    features: ['Hingga 15 anggota', '5 divisi', 'Assign task ke anggota', 'Chat grup tim', 'Dashboard grup'],
  },
  {
    id: 'organisasi',
    label: 'Paket Organisasi',
    price: '399rb/bulan',
    role: 'Super Admin',
    desc: 'Untuk perusahaan/lembaga. Role kamu menjadi Super Admin.',
    features: ['Hingga 100 anggota', 'Divisi unlimited', 'Role admin lengkap', 'Chat grup + DM', 'Analytics organisasi', 'AI Agent'],
    popular: true,
  },
]

export default function UpgradeAkun() {
  const { currentUser, upgradeAccount } = useStore()
  const [orgType, setOrgType] = useState('')
  const [plan, setPlan] = useState('grup')
  const [form, setForm] = useState({ name: '', industry: '', size: '1-10', legalNumber: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const handleSubmit = async () => {
    if (!orgType) return setError('Pilih tipe organisasi dulu.')
    if (!form.name.trim()) return setError('Nama organisasi wajib diisi.')
    setBusy(true)
    setError('')
    const res = await upgradeAccount({
      plan,
      org_type: orgType,
      name: form.name.trim(),
      industry: form.industry.trim() || undefined,
      size: form.size,
      legal_number: form.legalNumber.trim() || undefined,
      address: form.address.trim() || undefined,
    })
    setBusy(false)
    if (res.success) {
      setDone(res.res)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setError(res.message)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  }

  const isAlreadyUpgraded = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'owner'

  return (
    <>
      <motion.div className="upgrade-page" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Upgrade Akun</h1>
            <p>Tingkatkan akun untuk mengelola divisi, tim, dan anggota</p>
          </div>
        </motion.div>

        {done ? (
          <motion.div className="upgrade-success" variants={itemVariants}>
            <div className="upgrade-success-icon"><Check size={32} /></div>
            <h2>Akun Berhasil Di-upgrade!</h2>
            <p>
              Akun kamu sekarang memakai paket <strong>{done.plan}</strong> dengan role{' '}
              <strong>{done.role}</strong>. Data organisasi <strong>{form.name}</strong> tersimpan.
            </p>
            <p className="upgrade-success-note">Refresh halaman untuk melihat menu baru yang tersedia.</p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => window.location.reload()}
            >
              Masuk Dashboard <ArrowRight size={16} />
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div className="upgrade-banner" variants={itemVariants}>
              <Rocket size={20} />
              <div>
                <strong>Akun kamu saat ini: {currentUser?.role || 'user'}</strong>
                <span>
                  {isAlreadyUpgraded
                    ? 'Akun sudah memiliki role manajemen. Halaman ini untuk self-register (role user).'
                    : 'Role user hanya bisa melihat. Upgrade untuk membuka fitur manajemen lengkap.'}
                </span>
              </div>
            </motion.div>

            {!isAlreadyUpgraded && (
              <>
                <motion.div className="upgrade-section" variants={itemVariants}>
                  <div className="section-header"><Building2 size={18} /><h2>1. Tipe Organisasi</h2></div>
                  <div className="org-type-grid">
                    {ORG_TYPES.map((t) => {
                      const Icon = t.icon
                      return (
                        <button
                          key={t.id}
                          className={`org-type-card ${orgType === t.id ? 'selected' : ''}`}
                          onClick={() => { setOrgType(t.id); setError('') }}
                        >
                          <Icon size={20} />
                          <strong>{t.label}</strong>
                          <span>{t.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div className="upgrade-section" variants={itemVariants}>
                  <div className="section-header"><Rocket size={18} /><h2>2. Pilih Paket</h2></div>
                  <div className="plan-grid">
                    {PLAN_OPTIONS.map((p) => (
                      <div
                        key={p.id}
                        className={`plan-card ${plan === p.id ? 'selected' : ''} ${p.popular ? 'popular' : ''}`}
                        onClick={() => { setPlan(p.id); setError('') }}
                      >
                        {p.popular && <span className="plan-popular-badge">Terpopuler</span>}
                        <h3>{p.label}</h3>
                        <div className="plan-price">{p.price}</div>
                        <p className="plan-desc">{p.desc}</p>
                        <ul>
                          {p.features.map((f, i) => <li key={i}><Check size={13} /> {f}</li>)}
                        </ul>
                        <div className="plan-role">Role: <strong>{p.role}</strong></div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div className="upgrade-section" variants={itemVariants}>
                  <div className="section-header"><Briefcase size={18} /><h2>3. Data Organisasi</h2></div>
                  <div className="upgrade-form">
                    <div className="input-group">
                      <label className="input-label">Nama Organisasi <span className="req-star">*</span></label>
                      <input
                        type="text" className="input" placeholder="cth: PT Maju Bersama"
                        value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError('') }}
                      />
                    </div>
                    <div className="upgrade-form-row">
                      <div className="input-group">
                        <label className="input-label">Industri</label>
                        <input
                          type="text" className="input" placeholder="cth: Teknologi, Pendidikan"
                          value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Ukuran (jumlah orang)</label>
                        <select className="input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-100">51-100</option>
                          <option value="101-500">101-500</option>
                          <option value="500+">500+</option>
                        </select>
                      </div>
                    </div>
                    <div className="upgrade-form-row">
                      <div className="input-group">
                        <label className="input-label">Nomor Legal (NIB/Akta, opsional)</label>
                        <input
                          type="text" className="input" placeholder="cth: 8120001234567"
                          value={form.legalNumber} onChange={(e) => setForm({ ...form, legalNumber: e.target.value })}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Alamat (opsional)</label>
                        <input
                          type="text" className="input" placeholder="Alamat organisasi"
                          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {error && <p className="upgrade-error">{error}</p>}

                <motion.div className="upgrade-actions" variants={itemVariants}>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={busy}>
                    <Rocket size={16} /> {busy ? 'Memproses…' : 'Upgrade Sekarang'}
                  </button>
                  <p className="upgrade-note">Role otomatis: Grup → Admin, Organisasi → Super Admin. Data bisa diubah nanti di Pengaturan.</p>
                </motion.div>
              </>
            )}
          </>
        )}
      </motion.div>
    </>
  )
}
