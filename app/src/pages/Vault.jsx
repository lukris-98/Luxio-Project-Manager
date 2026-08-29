import { useEffect, useMemo, useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { Plus, X, Key, Globe, AtSign, Eye, EyeOff, Copy, Pencil, FolderOpen, ExternalLink, Server, Wifi, Building2, CreditCard, Smartphone, FileKey, Lock, User, Network, Hash, IdCard, Calendar, DollarSign, Link, LockOpen, Shield, Check, KeyRound, ArrowLeft } from 'lucide-react'
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
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({
    category: 'Sosial Media',
    label: '',
    fields: {},
    notes: '',
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

  const filtered = useMemo(() => {
    let list = entries
    if (filterCat) list = list.filter((e) => e.category === filterCat)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((e) =>
      (e.label || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q) ||
      Object.values(e.fields || {}).some((v) => String(v || '').toLowerCase().includes(q))
    )
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }, [entries, filterCat, search])

  const resetForm = () => setForm({ category: 'Sosial Media', label: '', fields: {}, notes: '', pinMode: 'none', pinValue: '', pinConfirm: '' })

  const openEdit = (entry) => {
    setEditId(entry.id)
    setForm({
      category: entry.category || 'Lainnya',
      label: entry.label || '',
      fields: { ...(entry.fields || {}) },
      notes: entry.notes || '',
      pinMode: entry.pin ? 'existing' : 'none',
      pinValue: '',
      pinConfirm: '',
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

  const groups = {}
  filtered.forEach((e) => {
    const cat = e.category || 'Lainnya'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(e)
  })
  const orderedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))

  // ============ GATE: SETUP / LOCKED ============
  if (vaultGate === 'setup') {
    return (
      <>
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
      </>
    )
  }

  if (vaultGate === 'locked') {
    return (
      <>
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
      </>
    )
  }

  // ============ UTAMA: Brankas terbuka ============
  return (
    <>
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

        <div className="vault-toolbar">
          <div className="vault-search">
            <input className="input" placeholder="Cari label atau isi data..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input vault-cat-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Semua Kategori</option>
            {VAULT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
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
                      const filledFields = getFilledFields(entry)
                      const hasPin = Boolean(entry.pin)
                      const isEntryLocked = hasPin && !entryUnlocked.has(entry.id)
                      return (
                        <div key={entry.id} className="vault-card">
                          <div className="vault-card-header">
                            <span className="vault-card-label">
                              {hasPin && <Lock size={11} className="vault-card-lock" />}
                              {entry.label || 'Tanpa Judul'}
                            </span>
                            <div className="vault-card-actions">
                              <button className="vault-btn" onClick={() => handleRevealClick(entry)} title={isVisible ? 'Sembunyikan' : 'Tampilkan'}>
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
                          {isEntryLocked && !isVisible ? (
                            <div className="vault-card-locked">
                              <Lock size={14} /> Terkunci PIN
                            </div>
                          ) : (
                            <div className="vault-card-body">
                              {filledFields.map((f) => {
                                const val = getFieldValue(entry, f.key)
                                return (
                                  <div key={f.key} className="vault-row">
                                    <span className="vault-row-label">
                                      <FieldIcon type={f.type} />
                                      {f.label}
                                    </span>
                                    <span className="vault-row-value">
                                      {f.type === 'password' || f.masked
                                        ? (isVisible ? val : '••••••••')
                                        : val}
                                    </span>
                                    <button className="vault-copy" onClick={() => copyToClipboard(val)} title="Salin">
                                      <Copy size={12} />
                                    </button>
                                    {f.key === 'url' && val.startsWith('http') && (
                                      <a href={val} target="_blank" rel="noopener noreferrer" className="vault-copy" title="Buka">
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                )
                              })}
                              {entry.notes && <p className="vault-notes">{entry.notes}</p>}
                            </div>
                          )}
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
              <button className="btn btn-secondary" onClick={() => setEntryPinModal(null)}>Batal</button>
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
              <div className="input-group">
                <label className="input-label">Kategori</label>
                <select className="input" value={form.category} onChange={(e) => { const newCat = e.target.value; setForm({ ...form, category: newCat, fields: {} }) }}>
                  {VAULT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Label / Nama</label>
                <input className="input" placeholder="cth: Instagram Bisnis" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} autoFocus />
              </div>

              {currentDefs.map((f) => (
                <div className="input-group" key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <input className="input" type={f.type === 'password' ? 'password' : 'text'} placeholder={f.placeholder} value={form.fields[f.key] || ''} onChange={(e) => setForm({ ...form, fields: { ...form.fields, [f.key]: e.target.value } })} />
                </div>
              ))}

              <div className="input-group">
                <label className="input-label">Catatan</label>
                <textarea className="input" rows={2} placeholder="Catatan tambahan..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                {editId ? 'Simpan' : 'Tambah'}
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
    </>
  )
}