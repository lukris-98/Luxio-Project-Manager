import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'
import './Auth.css'

export default function Login() {
  const { setAppState, login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    login(email, password)
  }
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="auth-back" onClick={() => setAppState('landing')}>
          <ArrowLeft size={16} />
          Back
        </button>
        
        <div className="auth-card">
          <div className="auth-header">
            <Logo onClick={() => setAppState('landing')} />
            <h1>Log in</h1>
            <p>Masuk ke akunmu</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="input"
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon">
                <Lock size={16} />
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Log In
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Belum punya akun? <button onClick={() => setAppState('setup')}>Sign up</button></p>
          </div>
        </div>
      </div>
    </div>
  )
}