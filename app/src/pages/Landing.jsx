import { useState, useEffect } from 'react'
import { getAppThemeMode, toggleAppThemeMode, useStore } from '../store/useStore'
import { motion, useSpring, useTransform, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { ArrowRight, ArrowUp, Check, Users, Target, BarChart3, Shield, Globe, Clock, Moon, Sun, Menu, X, Kanban, CheckSquare, Lock, Calendar, MessageSquare, Bot, Camera, Database, HardDrive, LogIn } from 'lucide-react'
import HeadlineMarquee from '../components/HeadlineMarquee'
import InstallAppButton from '../components/InstallAppButton'
import Logo from '../components/Logo'
import { useAutoHideNav } from '../utils/useAutoHideNav'
import './Landing.css'

// Animated Counter Component
function AnimatedCounter({ end, suffix = '' }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 })
  const display = useTransform(spring, (val) => Math.floor(val) + suffix)
  
  useEffect(() => {
    spring.set(end)
  }, [end, spring])
  
  return <motion.span>{display}</motion.span>
}

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const revealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

function RevealSection({ id, className, children }) {
  return (
    <motion.section
      id={id}
      className={className}
      variants={revealContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.section>
  )
}

export default function Landing() {
  const { setAppState, theme, setTheme } = useStore()
  const themeMode = getAppThemeMode(theme)
  const isDarkTheme = themeMode === 'dark'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const [cardMinimized, setCardMinimized] = useState(false)
  const [cardZoomed, setCardZoomed] = useState(false)
  const [cardShaking, setCardShaking] = useState(false)
  const { scrollY } = useScroll()
  const navHidden = useAutoHideNav()

  const handleCardClose = () => {
    setCardShaking(true)
    setTimeout(() => setCardShaking(false), 450)
  }
  
  const toggleTheme = () => {
    setTheme(toggleAppThemeMode(theme))
  }

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowBackTop(latest > 520)
  })

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const features = [
    { icon: Target, title: 'Target Berkala', desc: 'Buat target mingguan, bulanan, atau quarterly yang terstruktur dan terukur' },
    { icon: Users, title: 'Kolaborasi Tim', desc: 'Assign task ke divisi atau anggota tertentu. Semua orang tau tanggung jawabnya' },
    { icon: BarChart3, title: 'Monitoring Realtime', desc: 'Lihat progress seluruh tim dalam satu dashboard. Tidak perlu tanya-tanya lagi' },
    { icon: Clock, title: 'Deadline Tracking', desc: 'Tidak ada yang terlewat. Reminder otomatis sebelum deadline' },
    { icon: Shield, title: 'Aman & Privat', desc: 'Data perusahaan kamu tersimpan aman di database Neon. Tidak ada yang bisa lihat selain tim kamu' },
    { icon: Globe, title: 'Buka di Mana Saja', desc: 'PWA - bisa dibuka di browser apa saja, tanpa install aplikasi' },
  ]

  const featureGroups = [
    { icon: Target, title: 'Manajemen Target & Proyek', desc: 'Target mingguan, bulanan, quarterly dengan progress terukur' },
    { icon: Kanban, title: 'Kanban & To-Do', desc: 'Kelola task dengan board kanban atau daftar to-do sederhana' },
    { icon: Lock, title: 'Catatan Pribadi + PIN', desc: 'Catatan rahasia dikunci PIN — aman dari orang lain' },
    { icon: Calendar, title: 'Kalender & Pengingat', desc: 'Jadwal & reminder otomatis sebelum deadline tiba' },
    { icon: Users, title: 'Tim, Divisi & Kewenangan', desc: 'Atur divisi, tim, dan hak akses tiap anggota' },
    { icon: MessageSquare, title: 'Chat antar anggota + grup otomatis', desc: 'Diskusi antar anggota, grup chat otomatis per tim' },
    { icon: Bot, title: 'AI Agent', desc: 'Asisten AI yang menjalankan tool resmi sistem' },
    { icon: Camera, title: 'Absen Masuk + GPS & Selfie', desc: 'Absen dengan foto selfie dan lokasi GPS' },
    { icon: BarChart3, title: 'Analytics (Umami)', desc: 'Dashboard pengunjung situs tanpa jejak cookie' },
    { icon: Database, title: 'Monitoring Database (Neon)', desc: 'Pantau kuota & pemakaian PostgreSQL' },
    { icon: HardDrive, title: 'Penyimpanan (Backblaze)', desc: 'Penyimpanan objek untuk foto profil & absensi' },
    { icon: Shield, title: 'Keamanan: 2FA, PIN, email konfirmasi', desc: 'Aktivasi email, PIN pribadi, dan verifikasi dua langkah' },
  ]
  
const pricingPlans = [
    { name: 'Personal', price: 'Gratis', period: 'selamanya', description: 'Untuk individu mengelola project personal', features: ['1 user', '5 project aktif', '50 task aktif', '7 hari page history', 'Basic forms', 'Calendar view', 'Basic charts (1 view)', 'Basic automations', 'Publish ke web'], notIncluded: ['Export laporan PDF', 'API access', 'Private teamspaces', 'SAML SSO', 'Analytics advanced'], popular: false },
    { name: 'Profesional', price: '49rb', period: '/bulan', description: 'Untuk profesional & tim kecil', features: ['1 user', 'Project & task unlimited', '30 hari page history', 'Custom forms + logic', 'Calendar + reminder', 'Unlimited charts', 'API access & webhooks', '2FA authentication', 'Export laporan', 'Custom domain (bayar per domain)'], notIncluded: ['Private teamspaces', 'SAML SSO', 'Granular permissions', 'Audit log', 'SCIM provisioning'], popular: true },
    { name: 'Grup', price: '149rb', period: '/bulan', description: 'Untuk tim butuh kolaborasi advanced', features: ['Hingga 15 anggota', '5 divisi', 'Private teamspaces', 'Granular database permissions', '90 hari page history', 'SAML SSO', 'Verify any page', 'Domain verification', 'Premium connections', 'Advanced analytics', '1-way database sync', 'Export workspace PDF'], notIncluded: ['Unlimited members', 'SCIM provisioning', 'Audit log', 'Advanced security', 'DLP/SIEM', 'Customer success manager'], popular: false },
    { name: 'Organisasi', price: '399rb', period: '/bulan', description: 'Untuk organisasi butuh keamanan & kontrol penuh', features: ['Hingga 100 anggota', 'Divisi unlimited', 'Full admin role', 'Unlimited page history', 'Zero data retention AI', 'User provisioning (SCIM)', 'Advanced security & controls', 'Audit log lengkap', 'Admin content search', 'Domain management', 'Workspace consolidation', 'Security & Compliance (DLP, SIEM)', 'Custom data retention', 'Priority support', 'Customer success manager'], notIncluded: [], popular: false },
  ]
  
  const faqs = [
    { q: 'Berapa harganya?', a: 'Gratis untuk tim sampai 10 orang. Untuk tim lebih besar, hubungi kami via email.' },
    { q: 'Apakah data aman?', a: 'Sangat aman. Kami menggunakan enkripsi standar industri dan data tersimpan di server Neon yang aman.' },
    { q: 'Bisa coba dulu?', a: 'Bisa! Gratis tanpa kartu kredit. Langsung bisa pake setelah signup.' },
    { q: 'Bagaimana cara connect ke database?', a: 'Setelah daftar, kamu akan diarahkan untuk setup perusahaan, divisi, dan anggota. Semua data tersimpan di Neon PostgreSQL.' },
  ]
  
  return (
    <div className={`landing theme-${themeMode}`}>
      {/* Navigation */}
      <header className={`main-nav ${navHidden ? 'hidden' : ''}`}>
        <div className="nav-inner">
          <Logo onClick={() => setAppState('landing')} />
          
          <nav className="nav-links">
            <a href="#features">Fitur</a>
            <button className="nav-link" onClick={() => setAppState('pricing')}>Price</button>
            <button className="nav-link" onClick={() => setAppState('faq')}>FAQ</button>
          </nav>
          
          <div className="nav-actions">
            <InstallAppButton className="install-nav-btn" label="Install" />
            <button
              className="theme-toggle desktop-only"
              onClick={toggleTheme}
              aria-label={isDarkTheme ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            >
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="nav-link desktop-only" onClick={() => setAppState('auth')}>Log in</button>
            <button className="btn btn-primary desktop-only" onClick={() => setAppState('auth')}>
              Mulai Gratis
            </button>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mobile-menu-actions">
                <button
                  className="mobile-theme-toggle"
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false) }}
                >
                  {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
                  {isDarkTheme ? 'Mode Terang' : 'Mode Gelap'}
                </button>
                <button
                  className="mobile-login-btn"
                  onClick={() => { setAppState('auth'); setMobileMenuOpen(false) }}
                >
                  <LogIn size={16} /> Log in
                </button>
                <button
                  className="mobile-cta-btn"
                  onClick={() => { setAppState('auth'); setMobileMenuOpen(false) }}
                >
                  Mulai Gratis <ArrowRight size={16} />
                </button>
              </div>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Price</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Headline berita berjalan */}
      <HeadlineMarquee />
      
      {/* Hero */}
      <motion.section
        className="hero"
        variants={revealContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="hero-inner" variants={revealContainer}>
          <motion.div 
            className="hero-content"
            variants={revealItem}
          >
            <span className="hero-tag">Project & Target Manager</span>
            <h1>Kelola Target Tim<br/>Jadi Lebih <em>Jelas</em></h1>
            <p>
              Luxio bantu kamu dan tim konsisten mencapai target. 
              Mingguan, bulanan, atau quarterly — semua dalam satu tempat.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={() => setAppState('auth')}>
                Coba Gratis <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="hero-note">
              <Check size={14} />
              <span>Tanpa kartu kredit · Gratis untuk tim kecil</span>
            </div>
            
            {/* Animated Counters */}
            <div className="hero-counters">
              <div className="counter-item">
                <span className="counter-num"><AnimatedCounter end={500} suffix="+" /></span>
                <span className="counter-label">Tim aktif</span>
              </div>
              <div className="counter-item">
                <span className="counter-num"><AnimatedCounter end={10000} suffix="+" /></span>
                <span className="counter-label">Target dibuat</span>
              </div>
              <div className="counter-item">
                <span className="counter-num"><AnimatedCounter end={99} suffix="%" /></span>
                <span className="counter-label">Kepuasan</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="hero-visual"
            variants={revealItem}
          >
            <div className={`visual-card main ${cardZoomed ? 'zoomed' : ''} ${cardShaking ? 'shake' : ''}`}>
              <div className="card-header">
                <button className="card-btn card-btn-red" onClick={handleCardClose} aria-label="Tutup">
                  <span>×</span>
                </button>
                <button
                  className={`card-btn card-btn-yellow ${cardMinimized ? 'is-active' : ''}`}
                  onClick={() => setCardMinimized(!cardMinimized)}
                  aria-label="Minimalkan"
                >
                  <span>−</span>
                </button>
                <button
                  className={`card-btn card-btn-green ${cardZoomed ? 'is-active' : ''}`}
                  onClick={() => setCardZoomed(!cardZoomed)}
                  aria-label="Maksimalkan"
                >
                  <span>+</span>
                </button>
              </div>
              <div className={`card-body ${cardMinimized ? 'minimized' : ''}`}>
                <div className="stat-row">
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter end={12} /></span>
                    <span className="stat-label">Target Aktif</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter end={8} /></span>
                    <span className="stat-label">Selesai</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter end={4} /></span>
                    <span className="stat-label">On Progress</span>
                  </div>
                </div>
                <div className="list-preview">
                  <div className="list-item">
                    <span className="list-marker"></span>
                    <span className="list-text">Target Marketing Januari</span>
                    <span className="list-progress">75%</span>
                  </div>
                  <div className="list-item">
                    <span className="list-marker"></span>
                    <span className="list-text">Launch Q1 Product</span>
                    <span className="list-progress">45%</span>
                  </div>
                  <div className="list-item">
                    <span className="list-marker"></span>
                    <span className="list-text">Team Building</span>
                    <span className="list-progress">20%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="visual-accent"></div>
          </motion.div>
        </motion.div>
      </motion.section>
      
      {/* Features */}
      <RevealSection id="features" className="features">
        <motion.div className="section-inner" variants={revealContainer}>
          <motion.div className="section-header" variants={revealItem}>
            <h2>Apa yang bisa kamu lakukan?</h2>
            <p>Semua yang kamu butuhin untuk mengelola target tim</p>
          </motion.div>
          <motion.div className="features-grid" variants={revealContainer}>
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                className="feature-card"
                variants={revealItem}
              >
                <div className="feature-icon">
                  <feature.icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </RevealSection>
      
      {/* Pricing */}
      <RevealSection id="pricing" className="pricing">
        <motion.div className="section-inner" variants={revealContainer}>
          <motion.div className="section-header" variants={revealItem}>
            <h2>Harga</h2>
            <p>Pilih plan yang sesuai kebutuhan timmu</p>
          </motion.div>
<motion.div className="pricing-grid" variants={revealContainer}>
            {pricingPlans.map((plan, idx) => (
              <motion.div key={idx} className={`pricing-card ${plan.popular ? 'popular' : ''}`} variants={revealItem}>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <h3>{plan.name}</h3>
                <p className="pricing-description">{plan.description}</p>
                <div className="pricing-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <ul className="pricing-features">
                  {plan.features.map((f, i) => (
                    <li key={i}><Check size={14} /> {f}</li>
                  ))}
                </ul>

                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <ul className="pricing-not-included">
                    {plan.notIncluded.map((f, i) => (
                      <li key={i}>
                        <span className="not-included-icon">✕</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <button 
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                  onClick={() => setAppState('checkout')}
                >
                  {plan.price === 'Hubungi' ? 'Hubungi Kami' : 'Pilih Plan'}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </RevealSection>
      
      {/* FAQ */}
      <RevealSection id="faq" className="faq">
        <motion.div className="section-inner" variants={revealContainer}>
          <motion.div className="section-header" variants={revealItem}>
            <h2>Pertanyaan Umum</h2>
          </motion.div>
          <motion.div className="faq-list" variants={revealContainer}>
            {faqs.map((faq, idx) => (
              <motion.div key={idx} className="faq-item" variants={revealItem}>
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </RevealSection>
      
      {/* Fitur Lengkap */}
      <RevealSection id="fitur-lengkap" className="features-full">
        <motion.div className="section-inner" variants={revealContainer}>
          <motion.div className="section-header" variants={revealItem}>
            <h2>Fitur Lengkap</h2>
            <p>Semua yang kamu butuhkan untuk mengelola target, tim, dan operasional harian</p>
          </motion.div>
          <motion.div className="features-grid" variants={revealContainer}>
            {featureGroups.map((f, idx) => (
              <motion.div key={idx} className="feature-card" variants={revealItem}>
                <div className="feature-icon">
                  <f.icon size={22} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="cta">
        <motion.div className="section-inner" variants={revealContainer}>
          <motion.div className="cta-box" variants={revealItem}>
            <h2>Mau coba?</h2>
            <p>Gratis untuk tim sampai 10 orang. Langsung bisa pake.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setAppState('auth')}>
              Mulai Sekarang <ArrowRight size={18} />
            </button>
          </motion.div>
        </motion.div>
      </RevealSection>
      
      {/* Footer */}
      <motion.footer
        className="landing-footer"
        variants={revealContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="footer-inner" variants={revealContainer}>
          <motion.div className="footer-grid" variants={revealContainer}>
            <motion.div className="footer-brand-section" variants={revealItem}>
              <Logo onClick={() => setAppState('landing')} />
              <p className="footer-tagline">Project & Target Manager untuk Tim yang lebih produktif dan terorganisir.</p>
              <div className="footer-social">
                <a href="mailto:hello@luxio.id" className="social-link">hello@luxio.id</a>
              </div>
            </motion.div>
            
            <motion.div className="footer-links-group" variants={revealContainer}>
              <motion.div className="footer-col" variants={revealItem}>
                <h4>Produk</h4>
                <button onClick={() => setAppState('pricing')}>Harga</button>
                <button onClick={() => setAppState('faq')}>FAQ</button>
                <a href="#features">Fitur</a>
              </motion.div>
              
              <motion.div className="footer-col" variants={revealItem}>
                <h4>Perusahaan</h4>
                <a href="#">Tentang Kami</a>
                <a href="#">Karir</a>
                <a href="#">Blog</a>
              </motion.div>
              
              <motion.div className="footer-col" variants={revealItem}>
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div className="footer-bottom" variants={revealItem}>
            <p>&copy; 2026 Luxio. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </motion.div>
        </motion.div>
      </motion.footer>

      <AnimatePresence>
        {showBackTop && (
          <motion.button
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
