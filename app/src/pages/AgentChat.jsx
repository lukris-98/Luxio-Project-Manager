import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { Bot, Send, Trash2, Terminal, Key, Loader, User, ChevronDown, Settings } from 'lucide-react'
import './AgentChat.css'

// =====================================================================
// AgentChat.jsx — AI Agent Chat (Item 8).
// =====================================================================
// Antarmuka terminal-style seperti KiloCode. Agent hanya bisa
// menjalankan TOOL terdaftar (tools.rs) — tidak ada akses database
// langsung. Owner/super_admin dapat mengatur penyedia AI di Settings.
// =====================================================================

export default function AgentChat() {
  const {
    currentUser, agentMessages, sendAgentMessage, clearAgentMessages,
  } = useStore()

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [aiProvider, setAiProvider] = useState('')
  const [aiKey, setAiKey] = useState('')
  const [configMsg, setConfigMsg] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const role = currentUser?.role || 'user'
  const canConfigure = role === 'owner' || role === 'super_admin'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentMessages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    await sendAgentMessage(text)
    setBusy(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLoadConfig = () => {
    // Load from currentUser (simpan dari backend)
    setAiProvider(currentUser?.ai_provider || '')
    setAiKey(currentUser?.ai_key || '')
    setShowConfig(true)
  }

  const handleSaveConfig = async () => {
    setConfigMsg('')
    try {
      const { api } = await import('../services/api')
      const res = await api.agentConfig({
        ai_provider: aiProvider,
        ai_key: aiKey,
      })
      if (res.ok) {
        setConfigMsg('Konfigurasi AI tersimpan.')
        setTimeout(() => setShowConfig(false), 1500)
      } else {
        setConfigMsg('Gagal menyimpan.')
      }
    } catch (e) {
      setConfigMsg('Gagal menyimpan. Pastikan backend online.')
    }
  }

  return (
    <Layout>
      <div className="agent-page">
        {/* Header */}
        <div className="agent-header">
          <div className="agent-header-left">
            <Bot size={18} />
            <h1>AI Agent</h1>
            <span className="agent-role-badge">Agent Luxio</span>
          </div>
          <div className="agent-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={clearAgentMessages} title="Hapus percakapan">
              <Trash2 size={14} /> Hapus
            </button>
            {canConfigure && (
              <button className="btn btn-ghost btn-sm" onClick={handleLoadConfig} title="Pengaturan AI">
                <Settings size={14} /> Konfigurasi
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="agent-messages">
          {agentMessages.length === 0 && (
            <div className="agent-welcome">
              <div className="agent-welcome-icon">
                <Terminal size={32} />
              </div>
              <h2>AI Agent Luxio</h2>
              <p>
                Agent hanya bisa menjalankan <strong>tool resmi</strong> yang terdaftar
                di sistem. Tidak ada akses database langsung.
              </p>
              <div className="agent-welcome-commands">
                <p>Coba perintah berikut:</p>
                <code>daftar target</code>
                <code>daftar divisi</code>
                <code>daftar anggota</code>
                <code>buat divisi Marketing</code>
                <code>buat target Nama Target Baru</code>
                <code>tambah anggota Nama email@kantor.com</code>
              </div>
            </div>
          )}

          {agentMessages.map((msg) => (
            <div key={msg.id} className={`agent-msg ${msg.sender}`}>
              <div className="agent-msg-avatar">
                {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="agent-msg-content">
                <span className="agent-msg-sender">
                  {msg.sender === 'agent' ? 'Agent' : 'Kamu'}
                </span>
                <div className="agent-msg-body">
                  {msg.body.split('\n').map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="agent-msg agent">
              <div className="agent-msg-avatar"><Bot size={14} /></div>
              <div className="agent-msg-content">
                <span className="agent-msg-sender">Agent</span>
                <div className="agent-msg-body agent-typing">
                  <Loader size={14} /> Memproses…
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="agent-input">
          <div className="agent-input-prompt">
            <span className="agent-prompt-sign">$</span>
          </div>
          <input
            ref={inputRef}
            className="agent-input-field"
            placeholder="Ketik perintah…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            autoFocus
          />
          <button
            className="agent-input-send"
            onClick={handleSend}
            disabled={!input.trim() || busy}
            title="Kirim (Enter)"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Config modal */}
        {showConfig && (
          <div className="agent-config-overlay" onClick={() => setShowConfig(false)}>
            <div className="agent-config-modal" onClick={(e) => e.stopPropagation()}>
              <div className="agent-config-head">
                <Key size={18} />
                <h3>Konfigurasi AI Provider</h3>
              </div>
              <p className="agent-config-desc">
                Masukkan API key dari penyedia AI (OpenAI, dll.) untuk mengaktifkan
                percakapan cerdas. Agent tetap mematuhi tool/action layer.
              </p>
              <div className="input-group">
                <label className="input-label">Penyedia AI</label>
                <select className="input" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                  <option value="">— Pilih penyedia —</option>
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="google">Google Gemini</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="local">Local (LLaMA, Mistral, dll.)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">API Key</label>
                <input
                  type="password"
                  className="input"
                  placeholder="sk-..."
                  value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                />
              </div>
              {configMsg && <p className="agent-config-msg">{configMsg}</p>}
              <div className="agent-config-actions">
                <button className="btn btn-secondary" onClick={() => setShowConfig(false)}>Tutup</button>
                <button className="btn btn-primary" onClick={handleSaveConfig}>
                  <Key size={14} /> Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}