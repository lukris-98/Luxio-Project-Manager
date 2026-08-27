import { useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { Check, ArrowLeft, Mail, LogIn, UserPlus, Landmark, Wallet } from 'lucide-react'
import BankIcon, { banks } from '../components/BankIcon'
import Logo from '../components/Logo'
import './Checkout.css'

const plans = [
  { 
    id: 'personal', 
    name: 'Personal', 
    price: 0, 
    period: 'selamanya',
    description: 'Untuk individu mengelola project personal',
    features: [
      '1 user',
      '5 project aktif',
      '50 task aktif', 
      '7 hari page history',
      'Basic forms',
      'Calendar view',
      'Basic charts (1 view)',
      'Basic automations',
      'Publish ke web'
    ],
    notIncluded: [
      'Export laporan PDF',
      'API access',
      'Private teamspaces',
      'SAML SSO',
      'Analytics advanced'
    ]
  },
  { 
    id: 'profesional', 
    name: 'Profesional', 
    price: 49000, 
    period: '/bulan',
    description: 'Untuk profesional & tim kecil',
    features: [
      '1 user',
      'Project & task unlimited',
      '30 hari page history',
      'Custom forms + logic',
      'Calendar + reminder',
      'Unlimited charts',
      'API access & webhooks',
      '2FA authentication',
      'Export laporan',
      'Custom domain (bayar per domain)'
    ],
    notIncluded: [
      'Private teamspaces',
      'SAML SSO',
      'Granular permissions',
      'Audit log',
      'SCIM provisioning'
    ],
    popular: true
  },
  { 
    id: 'grup', 
    name: 'Grup', 
    price: 149000, 
    period: '/bulan',
    description: 'Untuk tim yang butuh kolaborasi advanced',
    features: [
      'Hingga 15 anggota',
      '5 divisi',
      'Private teamspaces',
      'Granular database permissions',
      '90 hari page history',
      'SAML SSO',
      'Verify any page',
      'Domain verification',
      'Premium connections (GitHub, Asana)',
      'Advanced analytics',
      '1-way database sync',
      'Export workspace PDF'
    ],
    notIncluded: [
      'Unlimited members',
      'SCIM provisioning',
      'Audit log',
      'Advanced security controls',
      'DLP/SIEM connections',
      'Customer success manager'
    ]
  },
  { 
    id: 'organisasi', 
    name: 'Organisasi', 
    price: 399000, 
    period: '/bulan',
    description: 'Untuk organisasi butuh keamanan & kontrol penuh',
    features: [
      'Hingga 100 anggota',
      'Divisi unlimited',
      'Full admin role',
      'Unlimited page history',
      'Zero data retention AI',
      'User provisioning (SCIM)',
      'Advanced security & controls',
      'Audit log lengkap',
      'Admin content search',
      'Domain management',
      'Workspace consolidation',
      'Security & Compliance (DLP, SIEM)',
      'Custom data retention',
      'Priority support',
      'Customer success manager'
    ],
    notIncluded: []
  }
]

export default function Checkout() {
  const { setAppState, isAuthenticated } = useStore()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [step, setStep] = useState(1) // 1: select plan, 2: payment
  const [methodTab, setMethodTab] = useState('bank')
  
  const TAX_RATE = 0.11
  const subtotal = selectedPlan?.price || 0
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax
  
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setStep(2)
  }
  
  const handlePayment = (e) => {
    e.preventDefault()
    const method = e.target.elements.method?.value
    const phoneNumber = '081332108131'
    const amount = total
    
    const bank = banks.find(b => b.id === method)

    // Transfer Bank - show account info
    if (bank) {
      alert(`🏦 Transfer ${bank.name}\n\n No. Rekening: ${bank.account}\n Atas Nama: Luxio.id\n Jumlah: Rp ${formatPrice(amount)}\n\nPastikan transfer sesuai nominal untuk otomatis aktivasi.\n\nBelum teraktivasi? Hubungi hello@luxio.id`)
    } else if (method === 'gopay' || method === 'dana') {
      // For GoPay or DANA - open the payment app directly
      const appName = method === 'gopay' ? 'GoPay' : 'DANA'
      
      if (method === 'gopay') {
        // Try to open Gojek app
        const gopayUrl = `gojek://transfer?to=${phoneNumber}&amount=${amount}`
        window.location.href = gopayUrl
      } else if (method === 'dana') {
        // Try to open DANA app
        const danaUrl = `dana://transfer?receiver=${phoneNumber}&amount=${amount}`
        window.location.href = danaUrl
      }
      
      // Show payment info alert
      alert(`📱 Pembayaran ${appName}\n\n Nomor: ${phoneNumber}\n Jumlah: Rp ${formatPrice(amount)}\n\nPastikan transfer sesuai nominal untuk otomatis aktivasi.\n\nBelum teraktivasi? Hubungi hello@luxio.id`)
    }
    
    // For demo, continue to setup after showing info
    setTimeout(() => {
      setAppState('setup')
    }, 2000)
  }
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }
  
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <button className="back-btn" onClick={() => setAppState('landing')}>
            <ArrowLeft size={18} />
            Kembali
          </button>
          <Logo onClick={() => setAppState('landing')} />
        </div>
        
        {step === 1 ? (
          /* Step 1: Select Plan */
          <motion.div 
            className="checkout-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="step-header">
              <h1>Pilih Plan</h1>
              <p>Pilih paket yang sesuai dengan kebutuhan tim kamu</p>
            </div>
            
<div className="plans-list">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`plan-card ${plan.popular ? 'popular' : ''}`}
                >
                  {plan.popular && <span className="plan-badge">Best Value</span>}
                  
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <p className="plan-description">{plan.description}</p>
                    <div className="plan-price">
                      {plan.price === 0 ? (
                        <span className="price">Gratis</span>
                      ) : (
                        <>
                          <span className="price">Rp {formatPrice(plan.price)}</span>
                          <span className="period">{plan.period}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <ul className="plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}><Check size={14} /> {f}</li>
                    ))}
                  </ul>

                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <ul className="plan-not-included">
                      {plan.notIncluded.map((f, i) => (
                        <li key={i}>
                          <span className="not-included-icon">✕</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <button 
                    className={`btn btn-lg ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.price === 0 ? 'Mulai Gratis' : 'Lanjut ke Pembayaran'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Step 2: Payment */
          <motion.div 
            className="checkout-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="step-header">
              <h1>Checkout</h1>
              <p>Lengkapi pembayaran untuk plan {selectedPlan?.name}</p>
            </div>
            
            <div className="checkout-content">
              {/* Order Summary */}
              <div className="order-summary">
                <h3>Ringkasan Pesanan</h3>
                <div className="summary-item">
                  <span>Harga {selectedPlan?.name}</span>
                  <span>Rp {formatPrice(subtotal)}</span>
                </div>
                <div className="summary-item">
                  <span>PPN 11%</span>
                  <span>Rp {formatPrice(tax)}</span>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <span>Rp {formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Payment Form */}
              <form className="payment-form" onSubmit={handlePayment}>
                {!isAuthenticated && (
                  <div className="auth-reminder">
                    <h3>Masuk dulu untuk aktivasi</h3>
                    <p>Paket akan tersambung ke akun Luxio kamu setelah login atau daftar.</p>
                    <div className="auth-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAppState('setup')}>
                        <LogIn size={16} />
                        Login
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setAppState('setup')}>
                        <UserPlus size={16} />
                        Daftar
                      </button>
                    </div>
                  </div>
                )}

                <h3>Metode Pembayaran</h3>
                
                <div className="payment-tabs">
                  <button
                    type="button"
                    className={`payment-tab ${methodTab === 'bank' ? 'active' : ''}`}
                    onClick={() => setMethodTab('bank')}
                  >
                    <Landmark size={16} />
                    Transfer Bank
                  </button>
                  <button
                    type="button"
                    className={`payment-tab ${methodTab === 'ewallet' ? 'active' : ''}`}
                    onClick={() => setMethodTab('ewallet')}
                  >
                    <Wallet size={16} />
                    E-Wallet
                  </button>
                </div>
                
                {methodTab === 'bank' ? (
                  <div className="payment-methods bank-list">
                    {banks.map(bank => (
                      <label className="payment-method" key={bank.id}>
                        <input type="radio" name="method" value={bank.id} defaultChecked={bank.id === 'bri'} />
                        <BankIcon bank={bank} size={36} />
                        <span className="payment-method-info">
                          <span className="payment-method-name">{bank.name}</span>
                          <span className="payment-method-number">{bank.account}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="payment-methods">
                    <label className="payment-method">
                      <input type="radio" name="method" value="gopay" defaultChecked />
                      <span className="wallet-badge" style={{ background: '#00AED6' }}>G</span>
                      <span className="payment-method-info">
                        <span className="payment-method-name">GoPay</span>
                        <span className="payment-method-number">0813-3210-8131</span>
                      </span>
                    </label>
                    <label className="payment-method">
                      <input type="radio" name="method" value="dana" />
                      <span className="wallet-badge" style={{ background: '#0F64FF' }}>D</span>
                      <span className="payment-method-info">
                        <span className="payment-method-name">DANA</span>
                        <span className="payment-method-number">0813-3210-8131</span>
                      </span>
                    </label>
                  </div>
                )}
                
                <div className="input-group">
                  <label className="input-label">Email untuk invoice</label>
                  <div className="input-icon">
                    <Mail size={16} />
                    <input type="email" className="input" placeholder="email@company.com" required />
                  </div>
                </div>
                
                <div className="payment-note">
                  <p>Untuk demo, klik tombol di bawah akan langsung masuk ke aplikasi.</p>
                </div>
                
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {selectedPlan?.price === 0 ? 'Mulai Gratis' : `Bayar Rp ${formatPrice(total)}`}
                </button>
              </form>
            </div>
            
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Pilih Plan Lain
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
