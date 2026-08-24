import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { Plus, X, Key, Globe, AtSign, Eye, EyeOff, Copy, Pencil, FolderOpen, ExternalLink, Server, Wifi, Building2, CreditCard, Smartphone, FileKey } from 'lucide-react'
import './Vault.css'

const VAULT_CATEGORIES = [
  { value: 'Sosial Media', icon: Globe, color: '#3B82F6' },
  { value: 'Email', icon: AtSign, color: '#EF4444' },
  { value: 'API Key / Token', icon: Key, color: '#8B5CF6' },
  { value: 'Server / SSH', icon: Server, color: '#10B981' },
  { value: 'Wi-Fi', icon: Wifi, color: '#06B6D4' },
  { value: 'Bank / Kartu', icon: CreditCard, color: '#F59E0B' },
  { value: 'Akun Perusahaan', icon: Building2, color: '#6366F1' },
  { value: 'Aplikasi / Tools', icon: Smartphone, color: '#EC4899' },
  { value: 'Kunci / PIN', icon: FileKey, color: '#14B8A6' },
  { value: 'Lainnya', icon: FileKey, color: '#6B7280' },
]

const CAT_MAP = Object.fromEntries(VAULT_CATEGORIES.map((c) => [c.value, c]))

export default function Vault() {
  const { currentUser, vault, addVaultEntry, updateVaultEntry, deleteVaultEntry } = useStore()
  const userId = currentUser?.id
  const entries = useMemo(() => {
    if (userId == null || !vault) return []
    return vault[userId] || []
  }, [userId, vault])

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [visible, setVisible] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({
    category: 'Sosial Media',
    label: '',
    username: '',
    email: '',
    password: '',
    url: '',
    notes: '',
  })

  const filtered = useMemo(() => {
    let list = entries
    if (filterCat) list = list.filter((e) => e.category === filterCat)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((e) =>
      (e.label || '').toLowerCase().includes(q) ||
      (e.username || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    )
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [entries, filterCat, search])

  const resetForm = () => setForm({ category: 'Sosial Media', label: '', username: '', email: '', password: '', url: '', notes: '' })

  const openEdit = (entry) => {
    setEditId(entry.id)
    setForm({
      category: entry.category || 'Lainnya',
      label: entry.label || '',
      username: entry.username || '',
      email: entry.email || '',
      password: entry.password || '',
      url: entry.url || '',
      notes: entry.notes || '',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.label.trim()) return
    if (editId) {
      updateVaultEntry(editId, form)
    } else {
      addVaultEntry(form)
    }
    setShowForm(false)
    setEditId(null)
    resetForm()
  }

  const toggleVisible = (id) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const groups = {}
  filtered.forEach((e) => {
    const cat = e.category || 'Lainnya'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(e)
  })
  const orderedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

  return (
    <Layout>
      <div className="vault-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Brankas</h1>
            <p>Simpan akun sosial media, API key, dan kredensial lain</p>
          </div>
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); resetForm() }}>
              <Plus size={16} /> Tambah
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="vault-toolbar">
          <div className="vault-search">
            <input
              className="input"
              placeholder="Cari label, username, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input vault-cat-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Semua Kategori</option>
            {VAULT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <Key size={48} />
            <h3>Belum ada data tersimpan</h3>
            <p>Simpan akun sosial media, API key, password Wi-Fi, dan lainnya di sini</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Key size={40} />
            <h3>Tidak ada yang cocok</h3>
            <p>Coba ubah kata kunci atau filter kategori</p>
          </div>
        ) : (
          <div className="vault-groups">
            {orderedGroups.map(([cat, catEntries]) => {
              const catInfo = CAT_MAP[cat]
              const CatIcon = catInfo?.icon || FileKey
              return (
                <div key={cat} className="vault-group">
                  <div className="vault-group-head">
                    <CatIcon size={16} style={{ color: catInfo?.color }} />
                    <h2>{cat}</h2>
                    <span className="vault-group-count">{catEntries.length} entri</span>
                  </div>
                  <div className="vault-cards">
                    {catEntries.map((entry) => {
                      const isVisible = visible.has(entry.id)
                      return (
                        <div key={entry.id} className="vault-card">
                          <div className="vault-card-header">
                            <span className="vault-card-label">{entry.label || 'Tanpa Judul'}</span>
                            <div className="vault-card-actions">
                              <button className="vault-btn" onClick={() => toggleVisible(entry.id)} title={isVisible ? 'Sembunyikan' : 'Tampilkan'}>
                                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button className="vault-btn" onClick={() => openEdit(entry)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className="vault-btn vault-btn-danger" onClick={() => setDeleteTarget(entry)} title="Hapus">
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="vault-card-body">
                            {entry.username && (
                              <div className="vault-row">
                                <span className="vault-row-label">Username</span>
                                <span className="vault-row-value">{isVisible ? entry.username : '••••••••'}</span>
                                <button className="vault-copy" onClick={() => copyToClipboard(entry.username)}><Copy size={12} /></button>
                              </div>
                            )}
                            {entry.email && (
                              <div className="vault-row">
                                <span className="vault-row-label">Email</span>
                                <span className="vault-row-value">{isVisible ? entry.email : '••••••••'}</span>
                                <button className="vault-copy" onClick={() => copyToClipboard(entry.email)}><Copy size={12} /></button>
                              </div>
                            )}
                            {entry.password && (
                              <div className="vault-row">
                                <span className="vault-row-label">Password</span>
                                <span className="vault-row-value">{isVisible ? entry.password : '••••••••'}</span>
                                <button className="vault-copy" onClick={() => copyToClipboard(entry.password)}><Copy size={12} /></button>
                              </div>
                            )}
                            {entry.url && (
                              <div className="vault-row">
                                <span className="vault-row-label">URL</span>
                                <span className="vault-row-value vault-url">{entry.url}</span>
                                {entry.url.startsWith('http') && (
                                  <a href={entry.url} target="_blank" rel="noopener noreferrer" className="vault-copy" title="Buka">
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            )}
                            {entry.notes && <p className="vault-notes">{entry.notes}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Tambah / Edit */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal vault-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Tambah'} Entri</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Kategori</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {VAULT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Label / Nama</label>
                <input className="input" placeholder="cth: Instagram Bisnis" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} autoFocus />
              </div>
              <div className="vault-form-row">
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input className="input" placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input" type="email" placeholder="email@domain.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="vault-form-row">
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">URL</label>
                  <input className="input" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Catatan</label>
                <textarea className="input" rows={2} placeholder="Catatan tambahan..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" disabled={!form.label.trim()} onClick={handleSave}>
                {editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Hapus Entri"
          itemName={deleteTarget.label}
          message="Kredensial ini akan dihapus permanen."
          onConfirm={() => {
            deleteVaultEntry(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  )
}