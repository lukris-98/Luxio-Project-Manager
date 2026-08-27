import { useMemo, useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import Layout from '../components/Layout'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { Search, Plus, X, Trash2, Lightbulb, FolderOpen, Pencil, Check, BookOpen, Hash, Tag } from 'lucide-react'
import './Research.css'

const CATEGORIES = ['Ide', 'Riset', 'Draft', 'Produksi', 'Selesai']

function formatDate(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function Research() {
  const { currentUser, activeRole, researchTopics, addResearchTopic, updateResearchTopic, deleteResearchTopic } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)
  const topics = useMemo(() => {
    if (dataKey == null || !researchTopics) return []
    return researchTopics[dataKey] || []
  }, [dataKey, researchTopics])

  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ topic: '', category: 'Ide', notes: '' })
  const [ideaInputs, setIdeaInputs] = useState({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = topics
    if (q) {
      list = list.filter((t) =>
        (t.topic || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.ideas || []).some((i) => String(i || '').toLowerCase().includes(q))
      )
    }
    return [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [topics, search])

  const resetForm = () => setForm({ topic: '', category: 'Ide', notes: '' })

  const handleSave = () => {
    if (!form.topic.trim()) return
    const data = { ...form, topic: form.topic.trim(), notes: form.notes.trim() }
    if (editingId) {
      updateResearchTopic(editingId, data)
      setEditingId(null)
    } else {
      addResearchTopic(data)
    }
    resetForm()
  }

  const startEdit = (topic) => {
    setEditingId(topic.id)
    setForm({ topic: topic.topic || '', category: topic.category || 'Ide', notes: topic.notes || '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    resetForm()
  }

  const addIdea = (topicId) => {
    const text = (ideaInputs[topicId] || '').trim()
    if (!text) return
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    updateResearchTopic(topicId, { ideas: [...(topic.ideas || []), text] })
    setIdeaInputs((prev) => ({ ...prev, [topicId]: '' }))
  }

  const removeIdea = (topicId, index) => {
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    updateResearchTopic(topicId, { ideas: (topic.ideas || []).filter((_, i) => i !== index) })
  }

  const handleIdeaKeyDown = (e, topicId) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIdea(topicId)
    }
  }

  const groups = {}
  filtered.forEach((t) => {
    const cat = CATEGORIES.includes(t.category) ? t.category : 'Ide'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(t)
  })
  const orderedGroups = CATEGORIES.filter((c) => groups[c]).map((c) => [c, groups[c]])

  return (
    <Layout>
      <div className="research-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Riset Konten</h1>
            <p>Riset ide dan topik konten</p>
          </div>
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm() }}>
              <Plus size={16} /> Tambah Topik
            </button>
          </div>
        </div>

        {/* Form Tambah / Edit */}
        <div className="research-form">
          <div className="research-form-row">
            <div className="input-group">
              <label className="input-label">Nama Topik</label>
              <input
                className="input"
                placeholder="cth: Tips Memulai Bisnis Online"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Kategori</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Catatan</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Catatan riset, referensi, atau ide awal..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="research-form-actions">
            {editingId && (
              <button className="btn btn-secondary" onClick={cancelEdit}>Batal</button>
            )}
            <button className="btn btn-primary" disabled={!form.topic.trim()} onClick={handleSave}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Topik'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="research-search">
          <Search size={16} className="research-search-icon" />
          <input
            className="input"
            placeholder="Cari topik atau ide..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {topics.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Belum ada topik riset</h3>
            <p>Tambahkan ide dan topik konten pertamamu di atas</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <h3>Tidak ada yang cocok</h3>
            <p>Coba ubah kata kunci pencarian</p>
          </div>
        ) : (
          <div className="research-groups">
            {orderedGroups.map(([cat, catTopics]) => (
              <div key={cat} className="research-group">
                <div className="research-group-head">
                  <FolderOpen size={16} />
                  <h2>{cat}</h2>
                  <span className="research-group-count">{catTopics.length} topik</span>
                </div>
                <div className="research-grid">
                  {catTopics.map((topic) => {
                    const isExpanded = expandedId === topic.id
                    return (
                      <div
                        key={topic.id}
                        className={`research-card${isExpanded ? ' expanded' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : topic.id)}
                      >
                        <div className="research-card-head">
                          <span className="research-cat-badge"><Tag size={10} /> {topic.category}</span>
                          <div className="research-card-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="vault-btn" onClick={() => startEdit(topic)} title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button className="vault-btn vault-btn-danger" onClick={() => setDeleteTarget(topic)} title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3 className="research-card-title">{topic.topic || 'Tanpa Judul'}</h3>
                        {topic.notes && (
                          <p className="research-card-notes">{topic.notes}</p>
                        )}
                        <div className="research-card-meta">
                          <span><Lightbulb size={12} /> {(topic.ideas || []).length} ide</span>
                          <span><Hash size={12} /> {formatDate(topic.createdAt)}</span>
                        </div>

                        {isExpanded && (
                          <div className="research-details" onClick={(e) => e.stopPropagation()}>
                            {topic.notes && (
                              <div className="research-full-notes">
                                <strong>Catatan</strong>
                                <p>{topic.notes}</p>
                              </div>
                            )}
                            <div className="research-ideas">
                              <strong>Daftar Ide</strong>
                              {(topic.ideas || []).length === 0 ? (
                                <p className="research-no-ideas">Belum ada ide untuk topik ini.</p>
                              ) : (
                                (topic.ideas || []).map((idea, idx) => (
                                  <div key={idx} className="research-idea">
                                    <span>{idea}</span>
                                    <button
                                      className="vault-btn vault-btn-danger"
                                      onClick={() => removeIdea(topic.id, idx)}
                                      title="Hapus ide"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="research-idea-form">
                              <input
                                className="input"
                                placeholder="Tulis ide baru..."
                                value={ideaInputs[topic.id] || ''}
                                onChange={(e) => setIdeaInputs((prev) => ({ ...prev, [topic.id]: e.target.value }))}
                                onKeyDown={(e) => handleIdeaKeyDown(e, topic.id)}
                              />
                              <button className="btn btn-primary" onClick={() => addIdea(topic.id)}>
                                <Check size={14} /> Tambah
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Konfirmasi hapus */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Hapus Topik Riset"
          itemName={deleteTarget.topic}
          message="Topik riset beserta ide-idenya akan dihapus permanen."
          onConfirm={() => {
            deleteResearchTopic(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  )
}
