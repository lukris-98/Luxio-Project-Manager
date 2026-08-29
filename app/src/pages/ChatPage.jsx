import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../services/api'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Plus, Users, UserPlus, X, Search, User, ArrowLeft, ChevronDown, Globe, Hash, Eye, Building2 } from 'lucide-react'
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

  // Pencarian user global + profil publik
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [viewProfile, setViewProfile] = useState(null) // { user, conv } | null

  const role = currentUser?.role || 'user'
  const isAdmin = role === 'owner' || role === 'super_admin' || role === 'admin'

  useEffect(() => {
    loadConversations()
    loadChatContacts()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, selectedConv])

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const res = await api.searchUsers(q.trim())
      setSearchResults(res.results || [])
    } catch (e) {
      setSearchError('Gagal mencari. Pastikan backend online.')
    } finally {
      setSearching(false)
    }
  }

  const handleViewProfile = async (userId) => {
    try {
      const profile = await api.getPublicProfile(userId)
      setViewProfile({ user: profile })
    } catch (e) {
      setSearchError('Gagal memuat profil.')
    }
  }

  const handleStartDmFromSearch = async (u) => {
    setSearchQuery('')
    setSearchResults([])
    setViewProfile(null)
    handleSelectConv({
      kind: 'dm',
      other_user_id: u.id,
      name: u.name,
      id: null,
      avatar_seed: u.name,
    })
  }

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

    const isNewDm = selectedConv.kind === 'dm' && !selectedConv.id
    const payload = {
      body: text,
      ...(selectedConv.kind === 'dm'
        ? { to_user_id: selectedConv.other_user_id }
        : { group_id: selectedConv.group_id }),
    }
    if (selectedConv.id) {
      payload.conversation_id = selectedConv.id
    }
    const res = await sendChatMessage(payload)
    if (isNewDm && res.success && res.res?.conversation_id) {
      // Percakapan DM baru: muat ulang daftar lalu pilih percakapan itu.
      const convs = await loadConversations()
      const created = convs.find((c) => c.kind === 'dm' && c.other_user_id === selectedConv.other_user_id)
      if (created) {
        setSelectedConv(created)
        await loadChatMessages(created.id)
      }
    } else if (selectedConv.id) {
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
    <>
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

          {/* Pencarian user global (username/nama/email) */}
          <div className="chat-search">
            <div className="chat-search-box">
              <Search size={15} />
              <input
                className="chat-search-input"
                placeholder="Cari orang / username…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button className="chat-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]) }} title="Bersihkan">
                  <X size={14} />
                </button>
              )}
            </div>

            {searching && <p className="chat-search-hint">Mencari…</p>}
            {searchError && <p className="chat-search-error">{searchError}</p>}

            {searchQuery && !searching && searchResults.length > 0 && (
              <div className="chat-search-results">
                {searchResults.map((u) => (
                  <div key={u.id} className="chat-search-item">
                    <div className="chat-conv-avatar"><User size={14} /></div>
                    <div className="chat-conv-info">
                      <span className="chat-conv-name">{u.name}</span>
                      <span className="chat-conv-preview">
                        {u.position || u.role}
                        {u.company_name ? ` • ${u.company_name}` : ''}
                      </span>
                    </div>
                    <div className="chat-search-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Lihat profil"
                        onClick={() => handleViewProfile(u.id)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Chat"
                        onClick={() => handleStartDmFromSearch(u)}
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && !searchError && (
              <p className="chat-search-hint">Tidak ada hasil untuk "{searchQuery}"</p>
            )}
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
                  placeholder="Username (cth: joko123)"
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
                  <p className="chat-contacts-empty">Belum ada kontak. Cari lewat username.</p>
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

      {/* Modal profil publik */}
      {viewProfile && viewProfile.user && (
        <div className="modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Profil {viewProfile.user.name}</h2>
              <button className="modal-close-btn" onClick={() => setViewProfile(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="chat-profile-avatar">
                <User size={32} />
              </div>
              <h3 className="chat-profile-name">{viewProfile.user.name}</h3>
              {viewProfile.user.position && <p className="chat-profile-detail">{viewProfile.user.position}</p>}
              <div className="chat-profile-info">
                {viewProfile.user.username && (
                  <div className="chat-profile-row">
                    <span className="chat-profile-label">Username</span>
                    <span className="chat-profile-value">@{viewProfile.user.username}</span>
                  </div>
                )}
                {viewProfile.user.company_name && (
                  <div className="chat-profile-row">
                    <span className="chat-profile-label">Perusahaan</span>
                    <span className="chat-profile-value">{viewProfile.user.company_name}{viewProfile.user.company_industry ? ` (${viewProfile.user.company_industry})` : ''}</span>
                  </div>
                )}
                {viewProfile.user.email_visible && viewProfile.user.email && (
                  <div className="chat-profile-row">
                    <span className="chat-profile-label">Email</span>
                    <span className="chat-profile-value">{viewProfile.user.email}</span>
                  </div>
                )}
                <div className="chat-profile-row">
                  <span className="chat-profile-label">Role</span>
                  <span className="chat-profile-value">{viewProfile.user.role}</span>
                </div>
                <div className="chat-profile-row">
                  <span className="chat-profile-label">Paket</span>
                  <span className="chat-profile-value">{viewProfile.user.plan}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewProfile(null)}>Tutup</button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const u = viewProfile.user
                    setViewProfile(null)
                    handleStartDmFromSearch(u)
                  }}
                >
                  <MessageSquare size={16} /> Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}