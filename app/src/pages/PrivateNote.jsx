import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import DOMPurify from 'dompurify'
import Layout from '../components/Layout'
import InviteUsers from '../components/InviteUsers'
import ThemeSelect from '../components/ThemeSelect'
import LabelFilterBar from '../components/LabelFilterBar'
import { Plus, X, Lock, LockOpen, Save, Trash2, KeyRound, FileText, Check, Bold, Italic, Underline, Highlighter, List, ListOrdered, FolderOpen, ArrowLeft } from 'lucide-react'
import './PrivateNote.css'

const MODAL = { none: 0, ask: 1, set: 2, unlock: 3, manage: 4, delete: 5 }
const MARK_COLOR = '#FDE047'

// Sanitasi HTML user-generated sebelum dirender ke editor / preview.
// Mencegah XSS dari konten catatan yang di-paste atau diedit.
const sanitizeHtml = (html) => DOMPurify.sanitize(html || '', {
  ALLOWED_TAGS: [
    'p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'mark',
    'ul', 'ol', 'li', 'span', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'a',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})

const stripHtml = (html) => {
  const el = document.createElement('div')
  el.innerHTML = sanitizeHtml(html)
  return el.textContent || ''
}

export default function PrivateNote() {
  const {
    currentUser, activeRole, privateNotes, addPrivateNote, updatePrivateNote, deletePrivateNote,
    userPin, selectedNoteId, setSelectedNoteId, toggleNoteCollaborator, setNoteTheme, themes, labelFilter,
  } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)

  const notes = useMemo(() => {
    if (dataKey == null || !privateNotes) return []
    return privateNotes[dataKey] || []
  }, [dataKey, privateNotes])

  const [sortBy, setSortBy] = useState('created-desc')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [activeId, setActiveId] = useState(null)
  const [unlocked, setUnlocked] = useState(() => new Set())
  const [title, setTitle] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [modal, setModal] = useState(MODAL.none)
  const [modalNoteId, setModalNoteId] = useState(null)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [toast, setToast] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTheme, setNewTheme] = useState('')
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false })

  // State modal hapus: wajib ketik DELETE, lalu PIN catatan (jika ada).
  const [deleteId, setDeleteId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const contentRef = useRef(null)

  // Filter & urutkan catatan berdasarkan label, tanggal, nama, dan pencarian.
  const filteredNotes = useMemo(() => {
    let list = notes.filter((n) => {
      if (labelFilter === null) return true
      const l = (n.theme || '').trim()
      if (labelFilter === '') return !l
      return l === labelFilter
    })
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((n) =>
        (n.title || '').toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q)
      )
    }
    const fromT = dateFrom ? new Date(dateFrom).getTime() : null
    const toT = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
    if (fromT || toT) {
      list = list.filter((n) => {
        const t = n.createdAt || n.updatedAt || 0
        if (fromT && t < fromT) return false
        if (toT && t > toT) return false
        return true
      })
    }
    return [...list].sort((a, b) => {
      const ta = a.createdAt || a.updatedAt || 0
      const tb = b.createdAt || b.updatedAt || 0
      if (sortBy === 'created-asc') return ta - tb
      if (sortBy === 'created-desc') return tb - ta
      if (sortBy === 'name-asc') return (a.title || '').localeCompare(b.title || '')
      return (b.title || '').localeCompare(a.title || '')
    })
  }, [notes, labelFilter, search, dateFrom, dateTo, sortBy])

  const noteLabelOptions = notes.map((n) => (n.theme || '').trim())

  const active = notes.find((n) => n.id === activeId) || null
  const isLocked = active != null && active.pin && !unlocked.has(active.id)

  // Bila dibuka dari sidebar (selectedNoteId), pilih catatan itu.
  useEffect(() => {
    if (selectedNoteId && notes.some((n) => n.id === selectedNoteId)) {
      setActiveId(selectedNoteId)
      setSelectedNoteId(null)
    }
  }, [selectedNoteId, notes, setSelectedNoteId])

  // Muat isi catatan aktif ke editor.
  // `isLocked` ikut di-dependency: saat editor terkunci, konten belum bisa
  // dimuat (contentRef null). Setelah catatan dibuka (unlock), editor baru
  // dirender — efek ini dijalankan ulang agar isi catatan tampil.
  useEffect(() => {
    const n = notes.find((x) => x.id === activeId)
    setTitle(n?.title || '')
    setContentHtml(n?.content || '')
    if (contentRef.current) {
      const html = n?.content || ''
      contentRef.current.innerHTML = sanitizeHtml(html)
    }
  }, [activeId, notes, isLocked])

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const refreshFmt = useCallback(() => {
    setFmt({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
    })
  }, [])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handler = () => refreshFmt()
    el.addEventListener('keyup', handler)
    el.addEventListener('mouseup', handler)
    document.addEventListener('selectionchange', handler)
    return () => {
      el.removeEventListener('keyup', handler)
      el.removeEventListener('mouseup', handler)
      document.removeEventListener('selectionchange', handler)
    }
  }, [activeId, isLocked, refreshFmt])

  const syncContent = () => {
    if (contentRef.current) setContentHtml(sanitizeHtml(contentRef.current.innerHTML))
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const html = e.clipboardData?.getData('text/html') || ''
    const text = e.clipboardData?.getData('text/plain') || ''
    const safe = sanitizeHtml(html) || text
    const el = contentRef.current
    if (!el) return
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      selection.deleteFromDocument()
      el.focus()
    }
    document.execCommand('insertText', false, DOMPurify.sanitize(safe))
    syncContent()
    refreshFmt()
  }

  const exec = (cmd, val) => {
    contentRef.current?.focus()
    document.execCommand(cmd, false, val)
    syncContent()
    refreshFmt()
  }

  const toggleMarker = () => {
    contentRef.current?.focus()
    const cur = document.queryCommandValue('hiliteColor')
    const applied = cur && cur !== 'transparent' && cur !== 'rgba(0, 0, 0, 0)' && cur !== '#00000000'
    document.execCommand('hiliteColor', false, applied ? 'transparent' : MARK_COLOR)
    syncContent()
  }

  const openNote = (id) => {
    const n = notes.find((x) => x.id === id)
    setActiveId(id)
    if (n && n.pin && !unlocked.has(id)) {
      setModalNoteId(id)
      setPin('')
      setPinError('')
      setModal(MODAL.unlock)
    }
  }

  // Buat catatan baru dalam tema tertentu.
  const handleAdd = () => {
    const id = addPrivateNote({ theme: newTheme })
    setActiveId(id)
    setShowNewForm(false)
    setNewTheme('')
  }

  const resetDeleteState = () => {
    setDeleteId(null)
    setDeleteConfirm('')
    setDeletePin('')
    setDeleteError('')
  }

  const openDeleteModal = (id) => {
    setDeleteId(id)
    setDeleteConfirm('')
    setDeletePin('')
    setDeleteError('')
    setModal(MODAL.delete)
  }

  const closeDeleteModal = () => {
    setModal(MODAL.none)
    setDeleteError('')
  }

  const deleteNote = notes.find((x) => x.id === deleteId) || null
  const deletePinVisible = deleteConfirm === 'DELETE' && deleteNote?.pin
  const canDelete = deleteConfirm === 'DELETE' && (!deleteNote?.pin || deletePin === deleteNote.pin)

  const handleConfirmDelete = () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Ketik DELETE untuk melanjutkan.')
      return
    }
    if (deleteNote?.pin && deletePin !== deleteNote.pin) {
      setDeleteError('PIN catatan salah.')
      return
    }
    deletePrivateNote(deleteId)
    setUnlocked((prev) => {
      const next = new Set(prev)
      next.delete(deleteId)
      return next
    })
    if (deleteId === activeId) setActiveId(null)
    resetDeleteState()
    setModal(MODAL.none)
    showToast('Catatan dihapus')
  }

  const handleSave = () => {
    if (!active) return
    updatePrivateNote(active.id, { title: title.trim(), content: contentHtml })
    showToast('Catatan tersimpan')
  }

  // Simpan lalu tawarkan pilihan PIN: pakai PIN akun yang ada atau buat baru.
  const handleSaveWithPin = () => {
    if (!active) return
    updatePrivateNote(active.id, { title: title.trim(), content: contentHtml })
    setModalNoteId(active.id)
    setPin('')
    setPinConfirm('')
    setPinError('')
    setModal(MODAL.ask)
  }

  // Pakai PIN akun (userPin) sebagai PIN catatan ini.
  const handleUseAccountPin = () => {
    if (!userPin) return
    updatePrivateNote(modalNoteId, { pin: userPin, locked: true })
    setUnlocked((prev) => new Set(prev).add(modalNoteId))
    setModal(MODAL.none)
    setPin('')
    showToast('Catatan terkunci PIN akun')
  }

  const closeModal = () => {
    setModal(MODAL.none)
    setPinError('')
  }

  const handleUnlock = () => {
    const n = notes.find((x) => x.id === modalNoteId)
    if (n && pin === n.pin) {
      setUnlocked((prev) => new Set(prev).add(n.id))
      setModal(MODAL.none)
      setPin('')
    } else {
      setPinError('PIN salah, coba lagi.')
    }
  }

  const handleSetPin = () => {
    if (!pin.trim()) {
      setPinError('PIN tidak boleh kosong.')
      return
    }
    if (pin !== pinConfirm) {
      setPinError('PIN tidak sama dengan konfirmasi.')
      return
    }
    updatePrivateNote(modalNoteId, { pin: pin.trim(), locked: true })
    setUnlocked((prev) => new Set(prev).add(modalNoteId))
    setModal(MODAL.none)
    setPin('')
    setPinConfirm('')
    setPinError('')
    showToast('PIN ditambahkan')
  }

  const handleRemovePin = () => {
    updatePrivateNote(modalNoteId, { pin: null, locked: false })
    setModal(MODAL.none)
    showToast('PIN dihapus')
  }

  const openPinModal = () => {
    if (!active) return
    setModalNoteId(active.id)
    setPin(active.pin ? '' : (userPin || ''))
    setPinConfirm('')
    setPinError('')
    setModal(active.pin ? MODAL.manage : MODAL.set)
  }

  const goAskToSet = () => {
    setModalNoteId(activeId)
    setPin(userPin || '')
    setPinConfirm('')
    setPinError('')
    setModal(MODAL.set)
  }

  // Kelompokkan catatan per label (dari hasil filter).
  const groups = {}
  ;['', ...themes].forEach((key) => { groups[key] = [] })
  filteredNotes.forEach((n) => {
    const key = (n.theme || '').trim()
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  const orderedGroups = Object.entries(groups).sort(([a], [b]) => {
    if (a === '') return -1
    if (b === '') return 1
    return a.localeCompare(b)
  })

  return (
    <Layout>
      <div className="note-page">
        <div className="page-header note-page-header">
          <div className="page-header-left">
            <h1>Catatan</h1>
            <p>Catatan pribadi kamu, bisa dikunci PIN per catatan</p>
          </div>
          <div className="page-header-right">
            {active && (
              <InviteUsers
                collaborators={active?.collaboratorIds || []}
                onToggle={(id) => toggleNoteCollaborator(active.id, id)}
              />
            )}
            <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
              <Plus size={16} /> Catatan Baru
            </button>
          </div>
        </div>

        {/* Form catatan baru dengan pilihan tema */}
        {showNewForm && (
          <div className="note-new-form">
            <div className="input-group">
              <label className="input-label">Label</label>
              <ThemeSelect value={newTheme} onChange={setNewTheme} />
              <p className="field-hint">Kelompokkan catatan dalam label, mis. "Pekerjaan".</p>
            </div>
            <div className="note-new-actions">
              <button className="btn btn-secondary" onClick={() => setShowNewForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAdd}>
                <Plus size={16} /> Buat Catatan
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && themes.length === 0 ? (
          <div className="note-empty">
            <FileText size={40} />
            <h3>Belum ada catatan</h3>
            <p>Buat catatan pribadi pertama kamu.</p>
            <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
              <Plus size={16} /> Buat Catatan
            </button>
          </div>
        ) : active == null ? (
          <div className="note-empty">
            <FileText size={40} />
            <h3>Pilih atau buat catatan</h3>
            <p>Klik salah satu catatan untuk membuka editor.</p>
          </div>
        ) : isLocked ? (
          <div className="note-locked">
            <Lock size={36} />
            <h3>Catatan terkunci</h3>
            <p>Masukkan PIN untuk membaca catatan ini.</p>
            <input
              type="password"
              className="input note-pin-input"
              placeholder="Masukkan PIN"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock() }}
              autoFocus
            />
            {pinError && <span className="note-pin-error">{pinError}</span>}
            <div className="note-locked-actions">
              <button className="btn btn-ghost" onClick={() => setActiveId(null)}>
                <ArrowLeft size={16} /> Batal
              </button>
              <button className="btn btn-primary" onClick={handleUnlock}>
                <LockOpen size={16} /> Buka
              </button>
            </div>
          </div>
        ) : (
          <div className="note-editor">
            <button className="btn btn-ghost btn-sm note-back-btn" onClick={() => setActiveId(null)}>
              <ArrowLeft size={14} /> Daftar Catatan
            </button>
            <input
              className="input note-title-input"
              placeholder="Judul catatan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div
              ref={contentRef}
              className="note-content-input"
              contentEditable
              suppressContentEditableWarning
              onInput={syncContent}
              onPaste={handlePaste}
              data-placeholder="Tulis catatan pribadi kamu di sini…"
            />
            <div className="note-toolbar">
              <div className="note-fmt-group">
                <button
                  className={`note-fmt-btn ${fmt.bold ? 'active' : ''}`}
                  title="Tebal (Bold)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec('bold')}
                >
                  <Bold size={16} />
                </button>
                <button
                  className={`note-fmt-btn ${fmt.italic ? 'active' : ''}`}
                  title="Miring (Italic)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec('italic')}
                >
                  <Italic size={16} />
                </button>
                <button
                  className={`note-fmt-btn ${fmt.underline ? 'active' : ''}`}
                  title="Garis bawah (Underline)"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec('underline')}
                >
                  <Underline size={16} />
                </button>
                <button
                  className="note-fmt-btn"
                  title="Marker / stabilo"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleMarker}
                >
                  <Highlighter size={16} />
                </button>
                <span className="note-fmt-sep" />
                <button
                  className={`note-fmt-btn ${fmt.ul ? 'active' : ''}`}
                  title="Bullets"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec('insertUnorderedList')}
                >
                  <List size={16} />
                </button>
                <button
                  className={`note-fmt-btn ${fmt.ol ? 'active' : ''}`}
                  title="Penomoran"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => exec('insertOrderedList')}
                >
                  <ListOrdered size={16} />
                </button>
              </div>
              <div className="note-toolbar-spacer" />
              <button className="btn btn-secondary" onClick={openPinModal}>
                {active.pin ? <KeyRound size={16} /> : <Lock size={16} />}
                {active.pin ? 'PIN' : 'Tambah PIN'}
              </button>
              <button className="btn btn-secondary" onClick={handleSaveWithPin}>
                <Lock size={16} /> Simpan dengan PIN
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Simpan
              </button>
              <button className="btn btn-ghost note-danger-btn" onClick={() => openDeleteModal(active.id)}>
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        )}

        {/* Daftar catatan per label — tampil bila tidak sedang mengedit */}
        {active == null && notes.length > 0 && (
          <>
            <LabelFilterBar
              labels={noteLabelOptions}
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              placeholder="Cari catatan..."
            />
            <div className="note-theme-list">
            {orderedGroups.map(([theme, themeNotes]) => (
              <div key={theme || '__none__'} className="note-theme-section">
                <div className="note-theme-head">
                  <FolderOpen size={16} />
                  <h2>{theme || 'Tanpa Label'}</h2>
                  <span className="note-theme-count">{themeNotes.length} catatan</span>
                </div>
                <div className="note-card-grid">
                  {themeNotes.map((n) => (
                    <div key={n.id} className="note-card" onClick={() => openNote(n.id)}>
                      <div className="note-card-title">
                        {n.pin && <Lock size={12} className="note-tab-lock" />}
                        <span className="note-card-title-text">{n.title || 'Tanpa judul'}</span>
                      </div>
                      <p className="note-card-snippet">{stripHtml(n.content) || 'Kosong'}</p>
                      <div className="note-card-meta">
                        <span>
                          {new Date(n.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <button
                          className="note-card-delete"
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(n.id) }}
                          title="Hapus catatan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="note-empty">
                <FileText size={40} />
                <h3>Tidak ada catatan yang cocok</h3>
                <p>Coba ubah filter label, tanggal, atau kata kunci pencarian</p>
              </div>
            )}
            </div>
          </>
        )}

        {toast && <div className="note-toast"><Check size={16} /> {toast}</div>}
      </div>

      {modal !== MODAL.none && (
        <div className="note-modal-overlay" onClick={modal === MODAL.delete ? closeDeleteModal : closeModal}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            {modal === MODAL.delete && (
              <>
                <div className="note-modal-head danger">
                  <Trash2 size={18} />
                  <h3>Hapus catatan?</h3>
                </div>
                <p className="note-modal-desc">
                  Catatan <strong>"{deleteNote?.title || 'Tanpa judul'}"</strong> akan dihapus permanen.
                  Ketik <strong>DELETE</strong> untuk melanjutkan.
                </p>
                <div className="input-group">
                  <label className="input-label">Ketik DELETE</label>
                  <input
                    className="input"
                    placeholder="DELETE"
                    value={deleteConfirm}
                    onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && canDelete) handleConfirmDelete() }}
                    autoFocus
                  />
                </div>
                {deletePinVisible && (
                  <div className="input-group">
                    <label className="input-label">PIN catatan</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Masukkan PIN catatan"
                      value={deletePin}
                      onChange={(e) => { setDeletePin(e.target.value); setDeleteError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && canDelete) handleConfirmDelete() }}
                      autoFocus
                    />
                  </div>
                )}
                {deleteError && <span className="note-pin-error">{deleteError}</span>}
                <div className="note-modal-actions">
                  <button className="btn btn-secondary" onClick={closeDeleteModal}>
                    Batal
                  </button>
                  <button className="btn btn-primary note-danger-solid" disabled={!canDelete} onClick={handleConfirmDelete}>
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </>
            )}

            {modal === MODAL.ask && (
              <>
                <div className="note-modal-head">
                  <Lock size={18} />
                  <h3>Simpan dengan PIN</h3>
                </div>
                <p className="note-modal-desc">
                  Pilih cara mengunci catatan ini. Kamu bisa pakai PIN akun yang
                  sudah ada, atau buat PIN baru khusus catatan ini.
                </p>
                <div className="note-pin-options">
                  {userPin && (
                    <button className="btn btn-primary note-pin-option" onClick={handleUseAccountPin}>
                      <KeyRound size={16} /> Gunakan PIN yang ada
                    </button>
                  )}
                  <button className="btn btn-secondary note-pin-option" onClick={goAskToSet}>
                    <Lock size={16} /> Buat PIN baru
                  </button>
                </div>
                <div className="note-modal-actions">
                  <button className="btn btn-ghost" onClick={closeModal}>
                    Batal
                  </button>
                </div>
              </>
            )}

            {modal === MODAL.set && (
              <>
                <div className="note-modal-head">
                  <Lock size={18} />
                  <h3>{active?.pin ? 'Ganti PIN' : 'Buat PIN'}</h3>
                </div>
                <div className="input-group">
                  <label className="input-label">PIN</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Masukkan PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setPinError('') }}
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ulangi PIN</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Ulangi PIN"
                    value={pinConfirm}
                    onChange={(e) => { setPinConfirm(e.target.value); setPinError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSetPin() }}
                  />
                </div>
                {pinError && <span className="note-pin-error">{pinError}</span>}
                <div className="note-modal-actions">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Batal
                  </button>
                  <button className="btn btn-primary" onClick={handleSetPin}>
                    <Lock size={16} /> Simpan PIN
                  </button>
                </div>
              </>
            )}

            {modal === MODAL.unlock && (
              <>
                <div className="note-modal-head">
                  <Lock size={18} />
                  <h3>Catatan terkunci</h3>
                </div>
                <div className="input-group">
                  <label className="input-label">PIN</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Masukkan PIN"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setPinError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock() }}
                    autoFocus
                  />
                </div>
                {pinError && <span className="note-pin-error">{pinError}</span>}
                <div className="note-modal-actions">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Batal
                  </button>
                  <button className="btn btn-primary" onClick={handleUnlock}>
                    <LockOpen size={16} /> Buka
                  </button>
                </div>
              </>
            )}

            {modal === MODAL.manage && (
              <>
                <div className="note-modal-head">
                  <KeyRound size={18} />
                  <h3>PIN Catatan</h3>
                </div>
                <p className="note-modal-desc">
                  Catatan ini terkunci PIN. Kamu bisa mengganti atau menghapus PIN-nya.
                </p>
                <div className="note-modal-actions">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Tutup
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setPin(''); setPinConfirm(''); setPinError(''); setModal(MODAL.set) }}>
                    <Lock size={16} /> Ganti PIN
                  </button>
                  <button className="btn btn-ghost note-danger-btn" onClick={handleRemovePin}>
                    Hapus PIN
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
