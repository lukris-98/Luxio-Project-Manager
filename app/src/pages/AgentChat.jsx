import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
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
  const [aiBaseUrl, setAiBaseUrl] = useState('')
  const [aiKey, setAiKey] = useState('')
  const [aiModel, setAiModel] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
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
    // Load dari currentUser (disimpan di akun owner, ikut response me).
    setAiProvider(currentUser?.ai_provider || '')
    setAiBaseUrl(currentUser?.ai_base_url || '')
    setAiKey(currentUser?.ai_key || '')
    setAiModel(currentUser?.ai_model || '')
    setAiEnabled(currentUser?.ai_enabled !== false)
    setConfigMsg('')
    setShowConfig(true)
  }

  const handleSaveConfig = async () => {
    setConfigMsg('')
    if (!aiProvider.trim()) {
      setConfigMsg('Nama penyedia wajib diisi.')
      return
    }
    try {
      const { api } = await import('../services/api')
      const res = await api.agentConfig({
        provider_name: aiProvider.trim(),
        base_url: aiBaseUrl.trim(),
        api_key: aiKey.trim(),
        model: aiModel.trim(),
        enabled: aiEnabled,
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
    <>
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
                Hubungkan penyedia AI. Agent tetap mematuhi tool/action layer
                (authz + audit log) dan tidak punya akses database langsung.
              </p>
              <div className="input-group">
                <label className="input-label">Nama Provider <span style={{ color: 'var(--error)' }}>*</span></label>
                <input
                  className="input"
                  placeholder="mis. OpenAI, Anthropic, Groq, Ollama"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                />
                <p className="field-hint">Nama bebas untuk mengidentifikasi penyedia.</p>
              </div>
              <div className="input-group">
                <label className="input-label">Base URL</label>
                <input
                  className="input"
                  placeholder="mis. https://api.openai.com/v1"
                  value={aiBaseUrl}
                  onChange={(e) => setAiBaseUrl(e.target.value)}
                />
                <p className="field-hint">
                  Kosongkan untuk URL default penyedia populer. Untuk Ollama: http://localhost:11434/v1
                </p>
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
                <p className="field-hint">Kosongkan bila memakai model lokal (Ollama).</p>
              </div>
              <div className="input-group">
                <label className="input-label">Nama Model</label>
                <input
                  className="input"
                  placeholder="mis. gpt-4o, claude-sonnet-4, llama3.1"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="agent-config-toggle">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                  />
                  <span>Aktifkan AI Agent</span>
                </label>
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
    </>
  )
}