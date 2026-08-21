import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Plus, Users, UserPlus, X, Search, User, ArrowLeft, ChevronDown, Globe, Hash } from 'lucide-react'
import './Chat.css'

export default function ChatPage() {
  const {
    currentUser, conversations, chatMessages, chatContacts,
    loadConversations, loadChatMessages, sendChatMessage, loadChatContacts, addChatContact,
    createChatGroup,
  } = useStore()

  const [selectedConv, setSelectedConv] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [showContacts, setShowContacts] = useState(false)
  const [contactCode, setContactCode] = useState('')
  const [contactError, setContactError] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupError, setGroupError] = useState('')
  const [mobilePanel, setMobilePanel] = useState('list') // 'list' | 'chat'
  const messagesEndRef = useRef(null)

  const role = currentUser?.role || 'user'
  const isAdmin = role === 'owner' || role === 'super_admin' || role === 'admin'

  useEffect(() => {
    loadConversations()
    loadChatContacts()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, selectedConv])

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv)
    setMobilePanel('chat')
    if (conv.id) {
      await loadChatMessages(conv.id)
    }
  }

  const handleSend = async () => {
    const text = messageText.trim()
    if (!text || !selectedConv) return
    setMessageText('')

    const payload = {
      body: text,
      ...(selectedConv.kind === 'dm'
        ? { to_user_id: selectedConv.other_user_id }
        : { group_id: selectedConv.group_id }),
    }
    if (selectedConv.id) {
      payload.conversation_id = selectedConv.id
    }
    await sendChatMessage(payload)
    // Reload messages after send.
    if (selectedConv.id) {
      await loadChatMessages(selectedConv.id)
    }
  }

  const handleAddContact = async () => {
    if (!contactCode.trim()) return
    setContactError('')
    const res = await addChatContact(contactCode.trim())
    if (res.success) {
      setContactCode('')
    } else {
      setContactError(res.message)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return setGroupError('Nama grup wajib diisi.')
    setGroupError('')
    const res = await createChatGroup({ name: groupName.trim() })
    if (res.success) {
      setShowCreateGroup(false)
      setGroupName('')
    } else {
      setGroupError(res.message)
    }
  }

  const messages = selectedConv ? (chatMessages[selectedConv.id] || []) : []

  const convIcon = (conv) => {
    if (conv.kind === 'dm') return <User size={16} />
    if (conv.group_kind === 'company') return <Globe size={16} />
    if (conv.group_kind === 'division') return <Hash size={16} />
    return <Users size={16} />
  }

  return (
    <Layout>
      <div className="chat-page">
        {/* Sidebar: daftar percakapan */}
        <div className={`chat-sidebar ${mobilePanel === 'list' ? 'mobile-show' : ''}`}>
          <div className="chat-sidebar-header">
            <h2>Chat</h2>
            <div className="chat-sidebar-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowContacts(!showContacts)} title="Kontak">
                <UserPlus size={16} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateGroup(true)} title="Grup baru">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="chat-conv-list">
            {conversations.length === 0 && (
              <div className="chat-conv-empty">
                <MessageSquare size={24} />
                <p>Belum ada percakapan. Tambah kontak untuk memulai chat.</p>
              </div>
            )}
            {conversations.map((conv) => {
              const isActive = selectedConv?.id === conv.id || selectedConv?.group_id === conv.group_id
              const lastMsg = chatMessages[conv.id]?.slice(-1)?.[0]
              return (
                <button
                  key={conv.id + (conv.group_id || '')}
                  className={`chat-conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className="chat-conv-avatar">{convIcon(conv)}</div>
                  <div className="chat-conv-info">
                    <span className="chat-conv-name">{conv.name}</span>
                    {lastMsg && <span className="chat-conv-preview">{lastMsg.body}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Panel kontak */}
          {showContacts && (
            <div className="chat-contacts-panel">
              <div className="chat-contacts-head">
                <UserPlus size={16} />
                <span>Kontak</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowContacts(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="chat-contacts-add">
                <input
                  className="input"
                  placeholder="Kode user (LUX...)"
                  value={contactCode}
                  onChange={(e) => setContactCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddContact() }}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddContact}>
                  <Plus size={14} />
                </button>
              </div>
              {contactError && <p className="chat-contacts-error">{contactError}</p>}
              <div className="chat-contacts-list">
                {chatContacts.map((c) => (
                  <div key={c.id} className="chat-contact-item">
                    <div className="chat-conv-avatar"><User size={14} /></div>
                    <div className="chat-conv-info">
                      <span className="chat-conv-name">{c.name}</span>
                      <span className="chat-conv-preview">{c.email}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Mulai chat"
                      onClick={() => {
                        setShowContacts(false)
                        handleSelectConv({
                          kind: 'dm',
                          other_user_id: c.id,
                          name: c.name,
                          id: null,
                          avatar_seed: c.name,
                        })
                      }}
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                ))}
                {chatContacts.length === 0 && (
                  <p className="chat-contacts-empty">Belum ada kontak. Cari lewat kode user.</p>
                )}
              </div>
            </div>
          )}

          {/* Panel buat grup */}
          {showCreateGroup && (
            <div className="chat-contacts-panel">
              <div className="chat-contacts-head">
                <Users size={16} />
                <span>Buat Grup</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateGroup(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="chat-contacts-add">
                <input
                  className="input"
                  placeholder="Nama grup"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup() }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleCreateGroup}>
                  <Plus size={14} />
                </button>
              </div>
              {groupError && <p className="chat-contacts-error">{groupError}</p>}
            </div>
          )}
        </div>

        {/* Main: percakapan */}
        <div className={`chat-main ${mobilePanel === 'chat' ? 'mobile-show' : ''}`}>
          {selectedConv ? (
            <>
              <div className="chat-main-header">
                <button className="chat-back-btn" onClick={() => { setMobilePanel('list'); setSelectedConv(null) }}>
                  <ArrowLeft size={18} />
                </button>
                <div className="chat-conv-avatar">{convIcon(selectedConv)}</div>
                <span className="chat-main-name">{selectedConv.name}</span>
                {selectedConv.kind === 'dm' && (
                  <span className="chat-main-dm">DM</span>
                )}
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-messages-empty">
                    <MessageSquare size={24} />
                    <p>Belum ada pesan. Kirim pesan pertama!</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser?.id
                  return (
                    <div key={msg.id} className={`chat-msg ${isMine ? 'mine' : 'other'}`}>
                      {!isMine && <div className="chat-msg-avatar">{convIcon(selectedConv)}</div>}
                      <div className="chat-msg-content">
                        {!isMine && <span className="chat-msg-sender">{msg.sender_name || 'User'}</span>}
                        <div className="chat-msg-bubble">
                          {msg.body}
                          {isMine && isAdmin && selectedConv.group_kind && (
                            <span className="chat-msg-admin-badge" title="Admin bisa lihat semua pesan">Admin</span>
                          )}
                        </div>
                        <span className="chat-msg-time">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input">
                <input
                  className="input"
                  placeholder="Ketik pesan…"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                />
                <button className="btn btn-primary" onClick={handleSend} disabled={!messageText.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-main-empty">
              <MessageSquare size={48} />
              <h3>Pilih percakapan</h3>
              <p>Pilih chat dari daftar, atau tambah kontak untuk memulai DM.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}