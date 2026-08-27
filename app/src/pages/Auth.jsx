import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { ArrowLeft, LogIn, UserPlus, Mail, Lock, User, ShieldCheck, MailCheck, RefreshCw, KeyRound, KeySquare } from 'lucide-react'
import Logo from '../components/Logo'
import './Auth.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Auth() {
  const { setAppState, login, register, verify2FA, verifyEmail, verifyPin, googleLogin } = useStore()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Alur verifikasi
  // stage: 'form' | 'otp' | 'pin' | 'confirm-sent' | 'verifying'
  const [stage, setStage] = useState('form')
  const [otp, setOtp] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [pin, setPin] = useState('')
  const [pinMode, setPinMode] = useState('verify') // 'verify' | 'setup'

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })

  // Bila dibuka dari link email konfirmasi: ?token=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setStage('verifying')
      ;(async () => {
        const result = await verifyEmail(token)
        if (result.success) {
          const { hasCompletedSetup } = useStore.getState()
          setAppState(hasCompletedSetup ? 'app' : 'setup')
        } else {
          setError(result.message || 'Link konfirmasi tidak valid atau sudah kedaluwarsa.')
          setStage('form')
        }
      })()
    }
  }, [verifyEmail, setAppState])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  // ---------- GOOGLE LOGIN ----------
  const handleGoogleLogin = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Login belum dikonfigurasi (VITE_GOOGLE_CLIENT_ID).')
      return
    }
    setError('')
    setLoading(true)

    // Muat script GSI bila belum ada.
    if (!document.getElementById('gsi-script')) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.id = 'gsi-script'
        s.src = 'https://accounts.google.com/gsi/client'
        s.async = true
        s.defer = true
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    const handleCredential = async (response) => {
      setLoading(true)
      const result = await googleLogin(response.credential)
      if (!result.success) {
        setError(result.message || 'Gagal login dengan Google.')
        setLoading(false)
      }
    }

    window.google?.accounts?.id?.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      cancel_on_tap_outside: false,
    })
    window.google?.accounts?.id?.prompt()
  }, [googleLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        if (!form.name || !form.email || !form.password) {
          setError('Semua field harus diisi')
          setLoading(false)
          return
        }
        if (form.password !== form.confirmPassword) {
          setError('Password tidak cocok')
          setLoading(false)
          return
        }
        if (form.password.length < 8) {
          setError('Password minimal 8 karakter')
          setLoading(false)
          return
        }

        const result = await register(form.name, form.email, form.password, form.username.trim() || undefined)
        if (result.success) {
          // Pendaftar harus konfirmasi email dulu sebelum bisa login.
          setStage('confirm-sent')
        } else {
          setError(result.message)
        }
      } else {
        if (!form.email || !form.password) {
          setError('Email dan password harus diisi')
          setLoading(false)
          return
        }

        const result = await login(form.email, form.password)
        if (result.success && result.requires2FA) {
          setOtpEmail(form.email)
          setStage('otp')
        } else if (result.success && result.requiresPin !== undefined) {
          // Owner: login pakai PIN, bukan 2FA email.
          setOtpEmail(form.email)
          setPinMode(result.requiresPinSetup ? 'setup' : 'verify')
          setStage('pin')
        } else if (result.success) {
          const { hasCompletedSetup } = useStore.getState()
          setAppState(hasCompletedSetup ? 'app' : 'setup')
        } else {
          setError(result.message)
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otp.trim()) {
      setError('Masukkan kode verifikasi.')
      return
    }
    setLoading(true)
    setError('')
    const result = await verify2FA(otpEmail, otp.trim())
    if (result.success) {
      const { hasCompletedSetup } = useStore.getState()
      setAppState(hasCompletedSetup ? 'app' : 'setup')
    } else {
      setError(result.message || 'Kode salah. Coba lagi.')
      setOtp('')
    }
    setLoading(false)
  }

  const handlePinSubmit = async (e) => {
    e.preventDefault()
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      setError('PIN harus 4-6 digit angka.')
      return
    }
    setLoading(true)
    setError('')
    const result = await verifyPin(otpEmail, pin)
    if (result.success) {
      setAppState('app')
    } else {
      setError(result.message || 'PIN salah. Coba lagi.')
      setPin('')
    }
    setLoading(false)
  }

  const goBackToLogin = () => {
    setStage('form')
    setMode('login')
    setError('')
  }

  const showTabs = stage === 'form'

  // ---------- KOTAK KODE 6 DIGIT (2FA) ----------
  const OTP_LENGTH = 6
  const otpRefs = useRef([])

  const focusOtpBox = useCallback((index) => {
    const el = otpRefs.current[index]
    if (el) { el.focus(); el.select?.() }
  }, [])

  // Saat kotak terisi, otomatis pindah caret ke kotak berikutnya.
  const handleOtpBoxChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const digits = otp.split('')
    digits[index] = cleaned
    const next = digits.join('').slice(0, OTP_LENGTH)
    setOtp(next)
    setError('')
    if (cleaned && index < OTP_LENGTH - 1) focusOtpBox(index + 1)
  }

  const handleOtpBoxKeyDown = (index, e) => {
    // Backspace di kotak kosong => kembali ke kotak sebelumnya.
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      e.preventDefault()
      focusOtpBox(index - 1)
    }
    // Panah kiri/kanan pindah caret.
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusOtpBox(index - 1)
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusOtpBox(index + 1)
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    setOtp(pasted)
    setError('')
    focusOtpBox(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <button className="back-btn" onClick={() => setAppState('landing')}>
            <ArrowLeft size={18} />
            Kembali
          </button>
          <Logo onClick={() => setAppState('landing')} />
        </div>

        {/* Form Card */}
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ---------- LAYAR VERIFIKASI EMAIL (link ?token=) ---------- */}
          {stage === 'verifying' && (
            <div className="auth-content">
              <div className="auth-icon-big"><ShieldCheck size={36} /></div>
              <h1>Mengaktifkan Akun</h1>
              <p className="auth-subtitle">Memverifikasi email kamu…</p>
              {error && <div className="auth-error">{error}</div>}
              {!error && (
                <div className="auth-loading">
                  <RefreshCw size={20} className="spin" />
                  <span>Mohon tunggu sebentar</span>
                </div>
              )}
              {error && (
                <button className="btn btn-secondary" onClick={goBackToLogin} style={{ width: '100%' }}>
                  Kembali ke Login
                </button>
              )}
            </div>
          )}

          {/* ---------- LAYAR KONFIRMASI EMAIL SUDAH DIKIRIM ---------- */}
          {stage === 'confirm-sent' && (
            <div className="auth-content">
              <div className="auth-icon-big"><MailCheck size={36} /></div>
              <h1>Cek Email Kamu</h1>
              <p className="auth-subtitle">
                Kami sudah mengirim email konfirmasi ke <strong>{form.email}</strong>.
                Klik tautan di email tersebut untuk mengaktifkan akun, lalu login.
              </p>
              <p className="auth-subtitle" style={{ marginTop: 8 }}>
                Tidak menerima? Periksa folder spam, atau daftar ulang.
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={goBackToLogin}>
                <LogIn size={16} /> Kembali ke Login
              </button>
            </div>
          )}

          {/* ---------- LAYAR KODE 2FA ---------- */}
          {stage === 'otp' && (
            <div className="auth-content">
              <div className="auth-icon-big"><ShieldCheck size={36} /></div>
              <h1>Verifikasi Dua Langkah</h1>
              <p className="auth-subtitle">
                Kami sudah mengirim kode 6 digit ke <strong>{otpEmail}</strong>.
                Masukkan kode untuk melanjutkan.
              </p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleOtpSubmit} className="auth-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="auth-otp">Kode Verifikasi</label>
                  <div className="otp-boxes">
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`otp-box${otp[i] ? ' filled' : ''}`}
                        value={otp[i] || ''}
                        autoFocus={i === 0}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpBoxKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || otp.length !== OTP_LENGTH}>
                  {loading ? 'Memverifikasi…' : 'Verifikasi & Masuk'}
                </button>
              </form>

              <div className="auth-footer">
                <button className="auth-link" onClick={goBackToLogin}>
                  Gunakan email / password lain
                </button>
              </div>
            </div>
          )}

          {/* ---------- LAYAR PIN (khusus OWNER) ---------- */}
          {stage === 'pin' && (
            <div className="auth-content">
              <div className="auth-icon-big"><KeySquare size={36} /></div>
              <h1>{pinMode === 'setup' ? 'Atur PIN Akun' : 'Masukkan PIN'}</h1>
              <p className="auth-subtitle">
                {pinMode === 'setup'
                  ? 'Buat PIN 4-6 digit untuk melindungi akun owner. PIN ini menggantikan kode email saat login.'
                  : `Masukkan PIN akun kamu untuk melanjutkan ke <strong>${otpEmail}</strong>.`}
              </p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handlePinSubmit} className="auth-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="auth-pin">PIN</label>
                  <div className="input-icon">
                    <KeyRound size={16} />
                    <input
                      type="password"
                      name="pin"
                      id="auth-pin"
                      className="input"
                      placeholder="••••"
                      maxLength={6}
                      autoFocus
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || pin.length < 4}>
                  {loading ? 'Memproses…' : pinMode === 'setup' ? 'Simpan & Masuk' : 'Verifikasi & Masuk'}
                </button>
              </form>

              <div className="auth-footer">
                <button className="auth-link" onClick={goBackToLogin}>
                  Gunakan email / password lain
                </button>
              </div>
            </div>
          )}

          {/* ---------- LAYAR FORM LOGIN / REGISTER ---------- */}
          {showTabs && (
            <>
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => { setMode('login'); setError('') }}
                >
                  <LogIn size={16} />
                  Masuk
                </button>
                <button
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => { setMode('register'); setError('') }}
                >
                  <UserPlus size={16} />
                  Daftar
                </button>
              </div>

              <div className="auth-content">
                <h1>{mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h1>
                <p className="auth-subtitle">
                  {mode === 'login'
                    ? 'Masuk ke akun Luxio kamu'
                    : 'Gratis selamanya untuk personal use'}
                </p>

                {error && (
                  <div className="auth-error">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                  {mode === 'register' && (
                    <div className="input-group">
                      <label className="input-label" htmlFor="auth-name">Nama Lengkap</label>
                      <div className="input-icon">
                        <User size={16} />
                        <input
                          type="text"
                          name="name"
                          id="auth-name"
                          className="input"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label" htmlFor="auth-email">Email</label>
                    <div className="input-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        name="email"
                        id="auth-email"
                        className="input"
                        placeholder="nama@email.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="input-group">
                      <label className="input-label" htmlFor="auth-username">Username (unik)</label>
                      <div className="input-icon">
                        <User size={16} />
                        <input
                          type="text"
                          name="username"
                          id="auth-username"
                          className="input"
                          placeholder="mis. joko123 (opsional)"
                          value={form.username}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label" htmlFor="auth-password">Password</label>
                    <div className="input-icon">
                      <Lock size={16} />
                      <input
                        type="password"
                        name="password"
                        id="auth-password"
                        className="input"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="input-group">
                      <label className="input-label" htmlFor="auth-confirm">Konfirmasi Password</label>
                      <div className="input-icon">
                        <Lock size={16} />
                        <input
                          type="password"
                          name="confirmPassword"
                          id="auth-confirm"
                          className="input"
                          placeholder="••••••••"
                          value={form.confirmPassword}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar Gratis'}
                  </button>
                </form>

                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="auth-divider">
                      <span>atau lanjutkan dengan</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-google btn-lg"
                      style={{ width: '100%' }}
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                      </svg>
                      {loading ? 'Memproses...' : 'Lanjut dengan Google'}
                    </button>
                  </>
                )}

                <div className="auth-footer">
                  {mode === 'login' ? (
                    <p>
                      Belum punya akun?{' '}
                      <button className="auth-link" onClick={() => setMode('register')}>
                        Daftar gratis
                      </button>
                    </p>
                  ) : (
                    <p>
                      Sudah punya akun?{' '}
                      <button className="auth-link" onClick={() => setMode('login')}>
                        Masuk
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
