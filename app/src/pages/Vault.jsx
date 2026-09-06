import { useEffect, useMemo, useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import {
  Plus, X, Key, Globe, AtSign, Eye, EyeOff, Copy, Pencil, FolderOpen, ExternalLink,
  Server, Wifi, Building2, CreditCard, Smartphone, FileKey, Lock, User, Network, Hash,
  IdCard, Calendar, DollarSign, Link, LockOpen, Shield, Check, KeyRound, ArrowLeft,
  History, Folder, Tag, MoreVertical, Search, Filter, ShieldCheck, Share2, FileText, ChevronDown
} from 'lucide-react'
import './Vault.css'

const VAULT_FIELD_DEFS = {
  'Sosial Media': [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'username', masked: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@domain.com', masked: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', masked: true },
    { key: 'url', label: 'URL Profil', type: 'url', placeholder: 'https://instagram.com/...', masked: false },
  ],
  Email: [
    { key: 'email', label: 'Alamat Email', type: 'email', placeholder: 'nama@email.com', masked: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', masked: true },
    { key: 'provider', label: 'Penyedia', type: 'text', placeholder: 'Gmail / Outlook / Yahoo', masked: false },
    { key: 'url', label: 'URL Login', type: 'url', placeholder: 'https://mail.google.com', masked: false },
  ],
  'API Key / Token': [
    { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'sk-...', masked: true },
    { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Secret key', masked: true },
    { key: 'baseUrl', label: 'Base URL', type: 'url', placeholder: 'https://api.example.com', masked: false },
  ],
  'Server / SSH': [
    { key: 'host', label: 'Host / IP', type: 'text', placeholder: '192.168.1.1 atau server.example.com', masked: false },
    { key: 'port', label: 'Port', type: 'text', placeholder: '22', masked: false },
    { key: 'username', label: 'Username', type: 'text', placeholder: 'root', masked: true },
    { key: 'password', label: 'Password / SSH Key', type: 'password', placeholder: 'Password atau private key path', masked: true },
  ],
  'Wi-Fi': [
    { key: 'ssid', label: 'SSID (Nama Wi-Fi)', type: 'text', placeholder: 'Nama jaringan', masked: false },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password Wi-Fi', masked: true },
  ],
  'Bank / Kartu': [
    { key: 'cardNumber', label: 'No. Kartu', type: 'text', placeholder: '1234 5678 9012 3456', masked: true },
    { key: 'cardHolder', label: 'Nama Pemilik', type: 'text', placeholder: 'Nama di kartu', masked: false },
    { key: 'expiry', label: 'Masa Berlaku', type: 'text', placeholder: 'MM/YY', masked: false },
    { key: 'cvv', label: 'CVV', type: 'text', placeholder: '123', masked: true },
    { key: 'pin', label: 'PIN ATM', type: 'password', placeholder: 'PIN 6 digit', masked: true },
  ],
  'Akun Perusahaan': [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'username', masked: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@perusahaan.com', masked: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', masked: true },
    { key: 'url', label: 'URL Portal', type: 'url', placeholder: 'https://portal.perusahaan.com', masked: false },
  ],
  'Aplikasi / Tools': [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'username', masked: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@domain.com', masked: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', masked: true },
    { key: 'licenseKey', label: 'License Key', type: 'text', placeholder: 'XXXX-XXXX-XXXX-XXXX', masked: true },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'https://...', masked: false },
  ],
  'Kunci / PIN': [
    { key: 'pin', label: 'PIN / Kode', type: 'password', placeholder: 'PIN atau kode akses', masked: true },
  ],
  Dokumen: [
    { key: 'docType', label: 'Jenis Dokumen', type: 'text', placeholder: 'KTP / Paspor / SIM / NPWP', masked: false },
    { key: 'docNumber', label: 'Nomor Dokumen', type: 'text', placeholder: 'Nomor Identitas', masked: true },
    { key: 'expiryDate', label: 'Masa Berlaku', type: 'text', placeholder: 'DD/MM/YYYY', masked: false },
  ],
  'Catatan Aman': [
    { key: 'secureContent', label: 'Isi Catatan Rahasia', type: 'textarea', placeholder: 'Tulis info rahasia di sini...', masked: true },
  ],
  Lainnya: [
    { key: 'username', label: 'Username', type: 'text', placeholder: 'username', masked: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@domain.com', masked: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', masked: true },
    { key: 'url', label: 'URL', type: 'url', placeholder: 'https://...', masked: false },
  ],
}

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
  { value: 'Dokumen', icon: FileText, color: '#2563EB' },
  { value: 'Catatan Aman', icon: Lock, color: '#EA580C' },
  { value: 'Lainnya', icon: FileKey, color: '#6B7280' },
]

const CAT_MAP = Object.fromEntries(VAULT_CATEGORIES.map((c) => [c.value, c]))

function getFilledFields(entry) {
  const defs = VAULT_FIELD_DEFS[entry.category] || VAULT_FIELD_DEFS['Lainnya']
  return defs.filter((f) => {
    const val = entry.fields?.[f.key] || entry[f.key] || ''
    return val.trim()
  })
}

function getFieldValue(entry, key) {
  return entry.fields?.[key] || entry[key] || ''
}

function FieldIcon({ type }) {
  switch (type) {
    case 'email': return <AtSign size={12} />
    case 'password': return <Lock size={12} />
    case 'url': return <Link size={12} />
    default: return <User size={12} />
  }
}

export default function Vault() {
  const { currentUser, activeRole, vault, addVaultEntry, updateVaultEntry, deleteVaultEntry, vaultSettings, setVaultPin, userPin } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)
  const entries = useMemo(() => {
    if (dataKey == null || !vault) return []
    return vault[dataKey] || []
  }, [dataKey, vault])

  const vaultSetting = useMemo(() => {
    if (dataKey == null) return null
    return vaultSettings[dataKey] || null
  }, [dataKey, vaultSettings])

  // State brankas terkunci / setup
  const [vaultGate, setVaultGate] = useState('loading') // 'loading' | 'setup' | 'locked' | 'unlocked'
  const [vaultPinInput, setVaultPinInput] = useState('')
  const [vaultPinConfirm, setVaultPinConfirm] = useState('')
  const [vaultPinError, setVaultPinError] = useState('')
  const [vaultPinMode, setVaultPinMode] = useState('existing') // 'existing' | 'new'

  // Per-entry PIN: daftar entry yang sudah di-unlock per sesi
  const [entryUnlocked, setEntryUnlocked] = useState(() => new Set())

  // State form
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [visible, setVisible] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest | oldest | az | za
  const [filterCat, setFilterCat] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('Semua Item')
  const [selectedTag, setSelectedTag] = useState(null)

  // Show active dynamic modals
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const [form, setForm] = useState({
    category: 'Sosial Media',
    label: '',
    fields: {},
    notes: '',
    folder: 'Personal',
    tags: '',
    isShared: false,
    pinMode: 'none', // 'none' | 'new' | 'existing'
    pinValue: '',
    pinConfirm: '',
  })

  // State modal unlock entry PIN
  const [entryPinModal, setEntryPinModal] = useState(null) // entry id or null
  const [entryPin, setEntryPin] = useState('')
  const [entryPinError, setEntryPinError] = useState('')

  // Inisialisasi gate brankas
  useEffect(() => {
    if (vaultGate !== 'loading') return
    if (vaultSetting && vaultSetting.pin) {
      setVaultGate('locked')
    } else {
      setVaultGate('setup')
    }
  }, [vaultGate, vaultSetting])

  const currentDefs = VAULT_FIELD_DEFS[form.category] || VAULT_FIELD_DEFS['Lainnya']

  // Folders list
  const folders = ['Semua Item', 'Personal', 'Work', 'Finance', 'Social', 'Server & API']

  // Extract all tags dynamically from entries
  const allTags = useMemo(() => {
    const tagsSet = new Set()
    entries.forEach((e) => {
      if (e.tags) {
        e.tags.split(',').forEach((t) => {
          const clean = t.trim()
          if (clean) tagsSet.add(clean)
        })
      }
    })
    return Array.from(tagsSet)
  }, [entries])

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = entries

    // Filter Kategori
    if (filterCat) {
      list = list.filter((e) => e.category === filterCat)
    }

    // Filter Folder
    if (selectedFolder !== 'Semua Item') {
      list = list.filter((e) => e.folder === selectedFolder)
    }

    // Filter Tag
    if (selectedTag) {
      list = list.filter((e) => {
        if (!e.tags) return false
        return e.tags.split(',').map((t) => t.trim()).includes(selectedTag)
      })
    }

    // Filter Search
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((e) =>
        (e.label || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q) ||
        (e.folder || '').toLowerCase().includes(q) ||
        (e.tags || '').toLowerCase().includes(q) ||
        Object.values(e.fields || {}).some((v) => String(v || '').toLowerCase().includes(q))
      )
    }

    // Sort
    const sorted = [...list]
    if (sortBy === 'newest') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    } else if (sortBy === 'az') {
      sorted.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
    } else if (sortBy === 'za') {
      sorted.sort((a, b) => (b.label || '').localeCompare(a.label || ''))
    }

    return sorted
  }, [entries, filterCat, selectedFolder, selectedTag, search, sortBy])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = entries.length
    const akun = entries.filter((e) => ['Sosial Media', 'Email', 'Akun Perusahaan', 'Aplikasi / Tools'].includes(e.category)).length
    const dokumen = entries.filter((e) => e.category === 'Dokumen').length
    const catatan = entries.filter((e) => e.category === 'Catatan Aman').length
    const dibagikan = entries.filter((e) => e.isShared).length
    return { total, akun, dokumen, catatan, dibagikan }
  }, [entries])

  // History List
  const historyLogs = useMemo(() => {
    const logs = []
    entries.forEach((e) => {
      if (e.createdAt) {
        logs.push({
          id: `${e.id}-create`,
          action: 'Ditambahkan',
          label: e.label,
          category: e.category,
          time: e.createdAt,
        })
      }
      if (e.updatedAt && e.updatedAt !== e.createdAt) {
        logs.push({
          id: `${e.id}-update`,
          action: 'Diperbarui',
          label: e.label,
          category: e.category,
          time: e.updatedAt,
        })
      }
    })
    return logs.sort((a, b) => b.time - a.time).slice(0, 15)
  }, [entries])

  const resetForm = () => setForm({
    category: 'Sosial Media',
    label: '',
    fields: {},
    notes: '',
    folder: 'Personal',
    tags: '',
    isShared: false,
    pinMode: 'none',
    pinValue: '',
    pinConfirm: ''
  })

  const openEdit = (entry) => {
    setEditId(entry.id)
    setForm({
      category: entry.category || 'Lainnya',
      label: entry.label || '',
      fields: { ...(entry.fields || {}) },
      notes: entry.notes || '',
      folder: entry.folder || 'Personal',
      tags: entry.tags || '',
      isShared: entry.isShared || false,
      pinMode: entry.pin ? 'existing' : 'none',
      pinValue: entry.pin || '',
      pinConfirm: entry.pin || '',
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.label.trim()) return
    const data = { ...form, label: form.label.trim(), notes: form.notes.trim() }
    // Terapkan PIN sesuai mode
    if (form.pinMode === 'new') {
      data.pin = form.pinValue.trim()
    } else if (form.pinMode === 'existing') {
      data.pin = form.pinValue.trim()
    } else {
      data.pin = null
    }
    delete data.pinMode
    delete data.pinValue
    delete data.pinConfirm
    if (editId) {
      updateVaultEntry(editId, data)
    } else {
      addVaultEntry(data)
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

  const handleRevealClick = (entry) => {
    if (entry.pin && !entryUnlocked.has(entry.id)) {
      setEntryPinModal(entry.id)
      setEntryPin('')
      setEntryPinError('')
    } else {
      toggleVisible(entry.id)
    }
  }

  const handleEntryPinUnlock = () => {
    const entry = entries.find((e) => e.id === entryPinModal)
    if (!entry) return
    if (entryPin === entry.pin) {
      setEntryUnlocked((prev) => new Set(prev).add(entry.id))
      setEntryPinModal(null)
      setEntryPin('')
      toggleVisible(entry.id)
    } else {
      setEntryPinError('PIN salah.')
    }
  }

  const handleSetVaultPin = () => {
    const pin = vaultPinInput.trim()
    if (!pin) return setVaultPinError('PIN tidak boleh kosong.')
    if (vaultPinMode === 'new') {
      if (pin !== vaultPinConfirm.trim()) return setVaultPinError('PIN tidak sama dengan konfirmasi.')
    }
    setVaultPin(pin)
    setVaultGate('unlocked')
  }

  const handleUnlockVault = () => {
    if (vaultPinInput.trim() === vaultSetting?.pin) {
      setVaultGate('unlocked')
      setVaultPinInput('')
      setVaultPinError('')
    } else {
      setVaultPinError('PIN salah.')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // ============ GATE: SETUP / LOCKED ============
  if (vaultGate === 'setup') {
    return (
      <div className="vault-page">
        <div className="vault-gate">
          <Shield size={48} />
          <h2>Kunci Brankas</h2>
          <p>Brankas perlu dikunci PIN untuk melindungi data kamu.</p>
          <div className="vault-gate-options">
            {userPin && (
              <button className="btn btn-primary" onClick={() => { setVaultPin(userPin); setVaultGate('unlocked') }}>
                <KeyRound size={16} /> Pakai PIN Akun
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => { setVaultPinMode('new'); setVaultPinInput(''); setVaultPinConfirm(''); setVaultPinError('') }}>
              <Lock size={16} /> Buat PIN Baru
            </button>
          </div>
          {vaultPinMode === 'new' && (
            <div className="vault-gate-form">
              <div className="input-group">
                <label className="input-label">PIN Baru</label>
                <input type="password" className="input" placeholder="Masukkan PIN" value={vaultPinInput} onChange={(e) => { setVaultPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setVaultPinError('') }} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Ulangi PIN</label>
                <input type="password" className="input" placeholder="Ulangi PIN" value={vaultPinConfirm} onChange={(e) => { setVaultPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6)); setVaultPinError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleSetVaultPin() }} />
              </div>
              {vaultPinError && <span className="vault-pin-error">{vaultPinError}</span>}
              <button className="btn btn-primary" onClick={handleSetVaultPin} disabled={!vaultPinInput.trim() || !vaultPinConfirm.trim()}>
                <Check size={16} /> Simpan PIN
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (vaultGate === 'locked') {
    return (
      <div className="vault-page">
        <div className="vault-gate">
          <Lock size={48} />
          <h2>Brankas Terkunci</h2>
          <p>Masukkan PIN brankas untuk melanjutkan.</p>
          <div className="input-group">
            <input type="password" className="input" placeholder="PIN Brankas" value={vaultPinInput} onChange={(e) => { setVaultPinInput(e.target.value); setVaultPinError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleUnlockVault() }} autoFocus />
          </div>
          {vaultPinError && <span className="vault-pin-error">{vaultPinError}</span>}
          <button className="btn btn-primary" onClick={handleUnlockVault} disabled={!vaultPinInput.trim()}>
            <LockOpen size={16} /> Buka Brankas
          </button>
        </div>
      </div>
    )
  }

  // ============ UTAMA: Brankas terbuka ============
  return (
    <div className="vault-redesign">
      {/* Top Header & Action Buttons */}
      <div className="vault-header">
        <div className="vault-header-info">
          <h1>Brankas Keamanan</h1>
          <p>Kelola password, API key, dokumen identitas, dan catatan rahasia secara aman</p>
        </div>
        <div className="vault-header-actions">
          <select className="vault-action-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Semua Kategori</option>
            {VAULT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => setShowHistoryModal(true)}>
            <History size={16} /> Riwayat
          </button>
          <button className="btn btn-primary btn-add-item" onClick={() => { setShowForm(true); setEditId(null); resetForm() }}>
            <Plus size={16} /> Tambah Item
          </button>
        </div>
      </div>

      {/* 5 Top Summary KPI Cards */}
      <div className="vault-kpi-grid">
        <div className="kpi-card" onClick={() => { setSelectedFolder('Semua Item'); setSelectedTag(null); }}>
          <div className="kpi-icon-wrapper blue">
            <Key size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Item</span>
            <h3 className="kpi-value">{stats.total}</h3>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setFilterCat('Sosial Media')}>
          <div className="kpi-icon-wrapper purple">
            <User size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Akun Login</span>
            <h3 className="kpi-value">{stats.akun}</h3>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setFilterCat('Dokumen')}>
          <div className="kpi-icon-wrapper green">
            <FileText size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Dokumen</span>
            <h3 className="kpi-value">{stats.dokumen}</h3>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setFilterCat('Catatan Aman')}>
          <div className="kpi-icon-wrapper orange">
            <Lock size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Catatan Aman</span>
            <h3 className="kpi-value">{stats.catatan}</h3>
          </div>
        </div>

        <div className="kpi-card" onClick={() => { setSelectedFolder('Semua Item'); setSelectedTag('Shared'); }}>
          <div className="kpi-icon-wrapper red">
            <Share2 size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Dibagikan</span>
            <h3 className="kpi-value">{stats.dibagikan}</h3>
          </div>
        </div>
      </div>

      <div className="vault-main-layout">
        {/* Left Sidebar Filter (Folders & Tags) */}
        <div className="vault-sidebar">
          <div className="sidebar-section">
            <h4>Folders</h4>
            <ul className="folder-list">
              {folders.map((f) => (
                <li
                  key={f}
                  className={`folder-item ${selectedFolder === f ? 'active' : ''}`}
                  onClick={() => { setSelectedFolder(f); setSelectedTag(null); }}
                >
                  <Folder size={16} />
                  <span>{f}</span>
                  <span className="badge-count">
                    {f === 'Semua Item' ? entries.length : entries.filter((e) => e.folder === f).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section">
            <h4>Tags</h4>
            {allTags.length === 0 ? (
              <p className="no-tags">Belum ada tag</p>
            ) : (
              <ul className="tag-list">
                <li
                  className={`tag-item ${selectedTag === null ? 'active' : ''}`}
                  onClick={() => setSelectedTag(null)}
                >
                  <Tag size={14} />
                  <span>Semua Tag</span>
                </li>
                {allTags.map((tag) => (
                  <li
                    key={tag}
                    className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    <div className="tag-dot" />
                    <span>{tag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Central Content Area */}
        <div className="vault-content">
          {/* Central Search/Sorting Row */}
          <div className="vault-search-sort-row">
            <div className="search-box-wrapper">
              <Search className="search-icon" size={18} />
              <input
                className="vault-search-input"
                placeholder="Cari label, username, catatan, atau folder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="sort-box-wrapper">
              <select className="vault-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="az">A - Z</option>
                <option value="za">Z - A</option>
              </select>
            </div>
          </div>

          {/* Detailed list/table of credential items */}
          {entries.length === 0 ? (
            <div className="vault-empty-state">
              <Key size={48} />
              <h3>Belum ada data tersimpan</h3>
              <p>Simpan akun sosial media, API key, password Wi-Fi, dan lainnya secara aman di sini.</p>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); resetForm(); }}>
                Tambah Item Pertama
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="vault-empty-state">
              <Search size={40} />
              <h3>Tidak ada item ditemukan</h3>
              <p>Coba sesuaikan kata kunci pencarian, filter folder, atau tag Anda.</p>
              <button className="btn btn-secondary" onClick={() => { setSearch(''); setSelectedFolder('Semua Item'); setSelectedTag(null); setFilterCat(''); }}>
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="vault-table-wrapper">
              <table className="vault-table">
                <thead>
                  <tr>
                    <th>Nama & Kredensial</th>
                    <th>Kategori</th>
                    <th>Folder & Tags</th>
                    <th>Dibuat / Diupdate</th>
                    <th>Status Keamanan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const isVisible = visible.has(entry.id)
                    const filledFields = getFilledFields(entry)
                    const hasPin = Boolean(entry.pin)
                    const isEntryLocked = hasPin && !entryUnlocked.has(entry.id)

                    // Find info fields for display (e.g. username/email/value)
                    const primaryField = filledFields.find(f => f.key === 'username' || f.key === 'email' || f.key === 'cardNumber' || f.key === 'apiKey' || f.key === 'ssid')
                    const primaryVal = primaryField ? getFieldValue(entry, primaryField.key) : ''

                    const catInfo = CAT_MAP[entry.category] || CAT_MAP['Lainnya']
                    const CatIcon = catInfo.icon || FileKey

                    return (
                      <tr key={entry.id} className="vault-row-item">
                        <td>
                          <div className="item-identity">
                            <div className="item-avatar" style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}>
                              <CatIcon size={18} />
                            </div>
                            <div className="item-name-info">
                              <span className="item-label">{entry.label || 'Tanpa Judul'}</span>
                              {primaryVal && (
                                <div className="item-credential-snippet">
                                  <span className="snippet-text">
                                    {primaryField?.type === 'password' || primaryField?.masked
                                      ? (isVisible && !isEntryLocked ? primaryVal : '••••••••')
                                      : primaryVal}
                                  </span>
                                  <button className="btn-copy-snippet" onClick={() => copyToClipboard(primaryVal)} title="Salin">
                                    <Copy size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="category-badge" style={{ borderColor: `${catInfo.color}35`, color: catInfo.color, backgroundColor: `${catInfo.color}08` }}>
                            {entry.category}
                          </span>
                        </td>

                        <td>
                          <div className="folder-tag-badges">
                            {entry.folder && (
                              <span className="folder-badge">
                                <Folder size={11} /> {entry.folder}
                              </span>
                            )}
                            {entry.tags && entry.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                              <span key={tag} className="tag-badge">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td>
                          <span className="date-text">{formatDate(entry.updatedAt || entry.createdAt)}</span>
                        </td>

                        <td>
                          <div className="status-sec-wrapper">
                            {hasPin ? (
                              <span className={`status-pill pin-locked ${isEntryLocked ? 'locked' : 'unlocked'}`}>
                                {isEntryLocked ? <Lock size={12} /> : <LockOpen size={12} />}
                                {isEntryLocked ? 'PIN Terkunci' : 'PIN Terbuka'}
                              </span>
                            ) : (
                              <span className="status-pill standard-secure">
                                <ShieldCheck size={12} /> Terlindungi
                              </span>
                            )}
                            {entry.isShared && (
                              <span className="status-pill shared-badge">
                                <Share2 size={11} /> Dibagikan
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="action-cell-container">
                            <button
                              className={`action-icon-btn ${isVisible ? 'active' : ''}`}
                              onClick={() => handleRevealClick(entry)}
                              title={isVisible ? 'Sembunyikan password' : 'Lihat password'}
                            >
                              {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              className="action-icon-btn"
                              onClick={() => openEdit(entry)}
                              title="Edit item"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="action-icon-btn danger"
                              onClick={() => setDeleteTarget(entry)}
                              title="Hapus item"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Riwayat Aktivitas */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal vault-modal history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Riwayat Aktivitas Brankas</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {historyLogs.length === 0 ? (
                <p className="no-history-text">Belum ada riwayat aktivitas terbaru.</p>
              ) : (
                <div className="history-log-list">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="history-log-item">
                      <div className="log-dot" />
                      <div className="log-content">
                        <span className="log-action">{log.action}</span>
                        <span className="log-label"> {log.label}</span>
                        <span className="log-category"> ({log.category})</span>
                        <div className="log-time">{new Date(log.time).toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal unlock entry PIN */}
      {entryPinModal && (
        <div className="modal-overlay" onClick={() => { setEntryPinModal(null); setEntryPinError('') }}>
          <div className="modal vault-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2>Buka Entri</h2>
              <button className="close-btn" onClick={() => setEntryPinModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p className="vault-entry-pin-desc">Entri ini dilindungi PIN. Masukkan PIN untuk melihat detailnya.</p>
              <div className="input-group">
                <label className="input-label">PIN Entri</label>
                <input type="password" className="input" placeholder="Masukkan PIN" value={entryPin} onChange={(e) => { setEntryPin(e.target.value); setEntryPinError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleEntryPinUnlock() }} autoFocus />
              </div>
              {entryPinError && <span className="vault-pin-error">{entryPinError}</span>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setEntryPinModal(null); setEntryPinError('') }}>Batal</button>
              <button className="btn btn-primary" disabled={!entryPin.trim()} onClick={handleEntryPinUnlock}>
                <LockOpen size={16} /> Buka
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Tambah / Edit */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal vault-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit' : 'Tambah'} Entri</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid-two">
                <div className="input-group">
                  <label className="input-label">Kategori</label>
                  <select className="input" value={form.category} onChange={(e) => { const newCat = e.target.value; setForm({ ...form, category: newCat, fields: {} }) }}>
                    {VAULT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Folder</label>
                  <select className="input" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}>
                    {folders.slice(1).map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid-two">
                <div className="input-group">
                  <label className="input-label">Label / Nama</label>
                  <input className="input" placeholder="cth: Instagram Bisnis" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} autoFocus />
                </div>
                <div className="input-group">
                  <label className="input-label">Tags (Pisahkan koma)</label>
                  <input className="input" placeholder="cth: Penting, Rahasia" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>

              {currentDefs.map((f) => (
                <div className="input-group" key={f.key}>
                  <label className="input-label">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="input" rows={3} placeholder={f.placeholder} value={form.fields[f.key] || ''} onChange={(e) => setForm({ ...form, fields: { ...form.fields, [f.key]: e.target.value } })} />
                  ) : (
                    <input className="input" type={f.type === 'password' ? 'password' : 'text'} placeholder={f.placeholder} value={form.fields[f.key] || ''} onChange={(e) => setForm({ ...form, fields: { ...form.fields, [f.key]: e.target.value } })} />
                  )}
                </div>
              ))}

              <div className="input-group">
                <label className="input-label">Catatan Tambahan</label>
                <textarea className="input" rows={2} placeholder="Catatan tambahan..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="input-group-checkbox">
                <input
                  type="checkbox"
                  id="isSharedCheckbox"
                  checked={form.isShared}
                  onChange={(e) => setForm({ ...form, isShared: e.target.checked })}
                />
                <label htmlFor="isSharedCheckbox">Bagikan kredensial ini dengan tim (Shared)</label>
              </div>

              {/* Opsi PIN per entri */}
              <div className="vault-pin-options">
                <label className="input-label">Lindungi dengan PIN</label>
                <div className="vault-pin-radio-group">
                  <label className={`vault-pin-radio ${form.pinMode === 'none' ? 'active' : ''}`}>
                    <input type="radio" name="vaultPinMode" checked={form.pinMode === 'none'} onChange={() => setForm({ ...form, pinMode: 'none', pinValue: '', pinConfirm: '' })} />
                    <LockOpen size={14} /> Tidak usah PIN
                  </label>
                  <label className={`vault-pin-radio ${form.pinMode === 'new' ? 'active' : ''}`}>
                    <input type="radio" name="vaultPinMode" checked={form.pinMode === 'new'} onChange={() => setForm({ ...form, pinMode: 'new' })} />
                    <Lock size={14} /> Buat PIN baru
                  </label>
                  {(userPin || vaultSetting?.pin) && (
                    <label className={`vault-pin-radio ${form.pinMode === 'existing' ? 'active' : ''}`}>
                      <input type="radio" name="vaultPinMode" checked={form.pinMode === 'existing'} onChange={() => setForm({ ...form, pinMode: 'existing' })} />
                      <KeyRound size={14} /> Pakai PIN yang ada
                    </label>
                  )}
                </div>
                {form.pinMode === 'new' && (
                  <div className="vault-pin-inputs">
                    <input type="password" className="input" placeholder="PIN baru" value={form.pinValue} onChange={(e) => setForm({ ...form, pinValue: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                    <input type="password" className="input" placeholder="Ulangi PIN" value={form.pinConfirm} onChange={(e) => setForm({ ...form, pinConfirm: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                  </div>
                )}
                {form.pinMode === 'existing' && (
                  <select className="input" value={form.pinValue} onChange={(e) => setForm({ ...form, pinValue: e.target.value })}>
                    <option value="">Pilih PIN…</option>
                    {userPin && <option value={userPin}>PIN Akun</option>}
                    {vaultSetting?.pin && <option value={vaultSetting.pin}>PIN Brankas</option>}
                  </select>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" disabled={!form.label.trim() || (form.pinMode === 'new' && (!form.pinValue.trim() || form.pinValue !== form.pinConfirm))} onClick={handleSave}>
                {editId ? 'Simpan Perubahan' : 'Tambah Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title="Hapus Entri"
          itemName={deleteTarget.label}
          message="Kredensial ini akan dihapus permanen."
          onConfirm={() => { deleteVaultEntry(deleteTarget.id); setDeleteTarget(null) }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}