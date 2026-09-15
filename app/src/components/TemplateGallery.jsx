import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import AnimatedDropdown from './AnimatedDropdown'
import {
  X, Plus, Copy, Trash2, Share2, Check, Clock, Folder, KanbanSquare, ListTodo,
  Send, ChevronDown, UserRound, Inbox
} from 'lucide-react'
import './TemplateGallery.css'

// =====================================================================
// TemplateGallery.jsx — Galeri template (project / kanban / todolist).
// =====================================================================
// Digunakan di halaman Projects, Kanban, dan TodoList.
// Fitur:
//   - Lihat daftar template milik sendiri
//   - Simpan item saat ini sebagai template
//   - Pakai template (callback onUse)
//   - Hapus template
//   - Kirim template ke user lain (share)
//   - Terima / tolak template yang dikirim user lain
// =====================================================================

const TYPE_LABELS = {
  projects: { label: 'Project', icon: Folder, color: '#0780FA' },
  kanbans: { label: 'Kanban', icon: KanbanSquare, color: '#A78BFA' },
  todos: { label: 'Todo', icon: ListTodo, color: '#00D9A5' },
}

export default function TemplateGallery({ type, onClose, onUse, currentData, currentName }) {
  const {
    templates, saveTemplate, deleteTemplate, shareTemplate, templateShares,
    respondTemplateShare, members, currentUser,
  } = useStore()
  const [tab, setTab] = useState('my') // my | shared | save
  const [saveName, setSaveName] = useState(currentName || '')
  const [shareTarget, setShareTarget] = useState(null) // template id being shared
  const [shareMemberId, setShareMemberId] = useState('')
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false)

  const uid = currentUser?.id != null ? String(currentUser.id) : null
  const myTemplates = useMemo(() => {
    if (!uid) return []
    return (templates[uid]?.[type] || []).sort((a, b) => b.createdAt - a.createdAt)
  }, [templates, uid, type])

  const myShares = useMemo(() => {
    if (!uid) return []
    return (templateShares[uid] || [])
      .filter((s) => s.status === 'pending' && s.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [templateShares, uid, type])

  const acceptedShares = useMemo(() => {
    if (!uid) return []
    return (templateShares[uid] || [])
      .filter((s) => s.type === type && s.status !== 'pending')
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [templateShares, uid, type])

  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.projects
  const TypeIcon = typeLabel.icon

  const handleSave = () => {
    if (!saveName.trim() || !currentData) return
    saveTemplate(type, saveName.trim(), currentData)
    setSaveName('')
    setTab('my')
  }

  const handleShare = (tpl) => {
    setShareTarget(tpl)
    setShareMemberId('')
    setShareDropdownOpen(false)
  }

  const handleSendShare = () => {
    if (!shareTarget || !shareMemberId) return
    const member = members.find((m) => m.id === shareMemberId)
    if (!member) return
    shareTemplate(
      shareMemberId,
      member.name,
      type,
      shareTarget.name,
      shareTarget.data,
    )
    setShareTarget(null)
    setShareMemberId('')
  }

  // Filter members: exclude self
  const shareableMembers = members.filter((m) => String(m.id) !== uid)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal template-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="template-gallery-header">
            <TypeIcon size={20} style={{ color: typeLabel.color }} />
            <h2>Template {typeLabel.label}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="template-tabs">
          <button
            className={`template-tab ${tab === 'my' ? 'active' : ''}`}
            onClick={() => setTab('my')}
          >
            <Folder size={14} /> Saya ({myTemplates.length})
          </button>
          <button
            className={`template-tab ${tab === 'shared' ? 'active' : ''}`}
            onClick={() => setTab('shared')}
          >
            <Inbox size={14} /> Diterima ({myShares.length})
          </button>
          {currentData && (
            <button
              className={`template-tab ${tab === 'save' ? 'active' : ''}`}
              onClick={() => setTab('save')}
            >
              <Plus size={14} /> Simpan
            </button>
          )}
        </div>

        <div className="template-gallery-body">
          {/* Tab: Template Saya */}
          {tab === 'my' && (
            <div className="template-list">
              {myTemplates.length === 0 ? (
                <div className="template-empty">
                  <TypeIcon size={36} />
                  <p>Belum ada template {typeLabel.label.toLowerCase()}.</p>
                  <small>Buat {typeLabel.label.toLowerCase()} lalu simpan sebagai template untuk dipakai ulang.</small>
                </div>
              ) : (
                myTemplates.map((tpl) => (
                  <div key={tpl.id} className="template-card">
                    <div className="template-card-info">
                      <span className="template-card-name">{tpl.name}</span>
                      <span className="template-card-meta">
                        <Clock size={11} />
                        {new Date(tpl.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {tpl.sharedFrom && <span className="template-shared-badge">dari {tpl.sharedFrom}</span>}
                      </span>
                      {type === 'projects' && tpl.data && (
                        <span className="template-card-desc">
                          {tpl.data.viewType === 'kanban' ? 'Kanban' : 'Todo'} — {tpl.data.stages?.length || 0} tahap, {tpl.data.todoItems?.length || 0} tugas
                        </span>
                      )}
                      {type === 'kanbans' && tpl.data && (
                        <span className="template-card-desc">
                          {tpl.data.boardType || 'dynamic'} — {tpl.data.columns?.length || 0} kolom
                        </span>
                      )}
                      {type === 'todos' && tpl.data && (
                        <span className="template-card-desc">
                          {tpl.data.items?.length || 0} tugas
                        </span>
                      )}
                    </div>
                    <div className="template-card-actions">
                      <button
                        className="template-action-btn use"
                        title="Pakai template"
                        onClick={() => { onUse(tpl.data); onClose() }}
                      >
                        <Copy size={14} /> Pakai
                      </button>
                      <button
                        className="template-action-btn share"
                        title="Kirim ke user"
                        onClick={() => handleShare(tpl)}
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        className="template-action-btn delete"
                        title="Hapus template"
                        onClick={() => deleteTemplate(type, tpl.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Diterima (share dari user lain) */}
          {tab === 'shared' && (
            <div className="template-list">
              {myShares.length === 0 && acceptedShares.length === 0 ? (
                <div className="template-empty">
                  <Inbox size={36} />
                  <p>Belum ada template yang dikirim ke kamu.</p>
                </div>
              ) : (
                <>
                  {myShares.map((share) => (
                    <div key={share.id} className="template-card shared-pending">
                      <div className="template-card-info">
                        <span className="template-card-name">{share.templateName}</span>
                        <span className="template-card-meta">
                          <UserRound size={11} /> dari {share.fromUserName}
                          <Clock size={11} style={{ marginLeft: 6 }} />
                          {new Date(share.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="template-card-actions">
                        <button
                          className="template-action-btn use"
                          onClick={() => respondTemplateShare(share.id, true)}
                        >
                          <Check size={14} /> Terima
                        </button>
                        <button
                          className="template-action-btn delete"
                          onClick={() => respondTemplateShare(share.id, false)}
                        >
                          <X size={14} /> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                  {acceptedShares.map((share) => (
                    <div key={share.id} className={`template-card shared-${share.status}`}>
                      <div className="template-card-info">
                        <span className="template-card-name">{share.templateName}</span>
                        <span className="template-card-meta">
                          <UserRound size={11} /> dari {share.fromUserName}
                          <span className={`share-status-badge ${share.status}`}>
                            {share.status === 'accepted' ? 'Diterima' : 'Ditolak'}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Tab: Simpan sebagai template */}
          {tab === 'save' && (
            <div className="template-save-form">
              <p className="field-hint">
                Simpan {typeLabel.label.toLowerCase()} saat ini sebagai template untuk dipakai ulang di kemudian hari.
              </p>
              <div className="input-group">
                <label className="input-label">Nama Template</label>
                <input
                  type="text"
                  className="input"
                  placeholder={`Nama template ${typeLabel.label.toLowerCase()}...`}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={!saveName.trim()}
                onClick={handleSave}
              >
                <Plus size={14} /> Simpan sebagai Template
              </button>
            </div>
          )}
        </div>

        {/* Share popup (inline) */}
        {shareTarget && (
          <div className="template-share-popup">
            <div className="template-share-popup-inner">
              <h4>Kirim "{shareTarget.name}" ke:</h4>
              <div className="template-share-member-list">
                {shareableMembers.length === 0 ? (
                  <p className="field-hint">Belum ada anggota tim lain.</p>
                ) : (
                  shareableMembers.map((m) => (
                    <label key={m.id} className={`template-share-member ${shareMemberId === m.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="shareTarget"
                        value={m.id}
                        checked={shareMemberId === m.id}
                        onChange={() => setShareMemberId(m.id)}
                      />
                      <span className="template-share-avatar">
                        {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span>{m.name}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="template-share-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setShareTarget(null)}>Batal</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!shareMemberId}
                  onClick={handleSendShare}
                >
                  <Send size={14} /> Kirim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
