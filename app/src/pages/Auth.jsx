import { useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { ArrowLeft, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react'
import './Auth.css'

export default function Auth() {
  const { setAppState, login, register } = useStore()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

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
        if (form.password.length < 6) {
          setError('Password minimal 6 karakter')
          setLoading(false)
          return
        }

        const result = await register(form.name, form.email, form.password)
        if (result.success) {
          // User baru wajib lewat setup
          setAppState('setup')
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
        if (result.success) {
          // Sudah setup? langsung app. Belum? ke setup.
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <button className="back-btn" onClick={() => setAppState('landing')}>
            <ArrowLeft size={18} />
            Kembali
          </button>
          <div className="logo" onClick={() => setAppState('landing')}>
            <span className="logo-mark">L</span>
            <span className="logo-text">Luxio</span>
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
                  <label className="input-label">Nama Lengkap</label>
                  <div className="input-icon">
                    <User size={16} />
                    <input
                      type="text"
                      name="name"
                      className="input"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    name="password"
                    className="input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="input-group">
                  <label className="input-label">Konfirmasi Password</label>
                  <div className="input-icon">
                    <Lock size={16} />
                    <input
                      type="password"
                      name="confirmPassword"
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
        </motion.div>
      </div>
    </div>
  )
}
