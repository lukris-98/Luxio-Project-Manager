import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import DOMPurify from 'dompurify'
import Layout from '../components/Layout'
import { Plus, X, Lock, LockOpen, Save, Trash2, KeyRound, FileText, Check, Bold, Italic, Underline, Highlighter, List, ListOrdered, History } from 'lucide-react'
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
    currentUser, privateNotes, addPrivateNote, updatePrivateNote, deletePrivateNote,
    closePrivateNote, openPrivateNote,
  } = useStore()
  const userId = currentUser?.id

  const notes = useMemo(() => {
    if (userId == null || !privateNotes) return []
    return privateNotes[userId] || []
  }, [userId, privateNotes])

  // Tab hanya menampilkan catatan yang masih terbuka (belum ditutup).
  const openNotes = useMemo(() => notes.filter((n) => !n.closed), [notes])
  const closedCount = notes.length - openNotes.length

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
  const [listOpen, setListOpen] = useState(false)
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false })

  // State modal hapus: wajib ketik DELETE, lalu PIN catatan (jika ada).
  const [deleteId, setDeleteId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const contentRef = useRef(null)

  const active = notes.find((n) => n.id === activeId) || null
  const isLocked = active != null && active.pin && !unlocked.has(active.id)

  // Auto-pilih catatan terbuka terbaru saat halaman dibuka / tab ditutup.
  useEffect(() => {
    if (openNotes.length === 0) {
      setActiveId(null)
      return
    }
    if (!openNotes.some((n) => n.id === activeId)) {
      const latest = [...openNotes].sort((a, b) => b.updatedAt - a.updatedAt)[0]
      setActiveId(latest.id)
    }
  }, [openNotes, activeId])

  useEffect(() => {
    const n = notes.find((x) => x.id === activeId)
    setTitle(n?.title || '')
    setContentHtml(n?.content || '')
    if (contentRef.current) {
      const html = n?.content || ''
      // Selalu sanitasi sebelum disuntikkan ke DOM (cegah XSS).
      contentRef.current.innerHTML = sanitizeHtml(html)
    }
  }, [activeId, notes])

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

  // Cegah XSS lewat paste: baca clipboard HTML, sanitasi, lalu sisipkan
  // sebagai teks (format editor lama via execCommand, isi aman).
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

  const openFromList = (n) => {
    if (n.closed) openPrivateNote(n.id)
    openNote(n.id)
  }

  const handleAdd = () => {
    const id = addPrivateNote({})
    setActiveId(id)
  }

  // [x] pada tab hanya menutup tab (catatan tetap tersimpan, dibuka lagi dari Riwayat).
  const handleCloseTab = (id) => {
    if (id === activeId) setActiveId(null)
    closePrivateNote(id)
    setUnlocked((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
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
    if (!active.pin) {
      setModalNoteId(active.id)
      setPin('')
      setPinConfirm('')
      setPinError('')
      setModal(MODAL.ask)
    }
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
    setPin('')
    setPinConfirm('')
    setPinError('')
    setModal(active.pin ? MODAL.manage : MODAL.set)
  }

  const goAskToSet = () => {
    setModalNoteId(activeId)
    setPin('')
    setPinConfirm('')
    setPinError('')
    setModal(MODAL.set)
  }

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes])

  return (
    <Layout>
      <div className="note-page">
        <div className="page-header note-page-header">
          <div className="page-header-left">
            <h1>Catatan Pribadi</h1>
            <p>Catatan pribadi kamu, bisa dikunci PIN per catatan</p>
          </div>
          {notes.length > 0 && (
            <button className="btn btn-secondary note-list-btn" onClick={() => setListOpen(true)}>
              <History size={16} /> Riwayat Catatan
            </button>
          )}
        </div>

        <div className="note-tabs">
          {openNotes.map((n) => (
            <div key={n.id} className={`note-tab ${n.id === activeId ? 'active' : ''}`}>
              <button
                className="note-tab-main"
                onClick={() => openNote(n.id)}
                title={n.title || 'Tanpa judul'}
              >
                {n.pin ? <Lock size={12} className="note-tab-lock" /> : null}
                <span className="note-tab-title">{n.title || 'Tanpa judul'}</span>
              </button>
              <button
                className="note-tab-close"
                onClick={(e) => { e.stopPropagation(); handleCloseTab(n.id) }}
                title="Tutup tab (catatan tetap tersimpan)"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button className="note-tab-add" onClick={handleAdd} title="Catatan baru">
            <Plus size={16} />
          </button>
        </div>

        {openNotes.length === 0 ? (
          <div className="note-empty">
            <History size={40} />
            <h3>{notes.length > 0 ? 'Belum ada tab terbuka' : 'Belum ada catatan'}</h3>
            <p>
              {notes.length > 0
                ? 'Catatan yang ditutup tidak hilang — buka lagi dari Riwayat.'
                : 'Buat catatan pribadi pertama kamu.'}
            </p>
            <div className="note-empty-actions">
              {closedCount > 0 && (
                <button className="btn btn-secondary" onClick={() => setListOpen(true)}>
                  <History size={16} /> Buka dari Riwayat ({closedCount})
                </button>
              )}
              <button className="btn btn-primary" onClick={handleAdd}>
                <Plus size={16} /> Buat Catatan
              </button>
            </div>
          </div>
        ) : active == null ? (
          <div className="note-empty">
            <FileText size={40} />
            <h3>Pilih atau buat catatan</h3>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} /> Buat Catatan
            </button>
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
            <button className="btn btn-primary" onClick={handleUnlock}>
              <LockOpen size={16} /> Buka
            </button>
          </div>
        ) : (
          <div className="note-editor">
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
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Simpan
              </button>
              <button className="btn btn-ghost note-danger-btn" onClick={() => openDeleteModal(active.id)}>
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        )}

        {toast && <div className="note-toast"><Check size={16} /> {toast}</div>}
      </div>

      {listOpen && (
        <div className="note-modal-overlay" onClick={() => setListOpen(false)}>
          <div className="note-modal note-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-head">
              <History size={18} />
              <h3>Riwayat Catatan ({notes.length})</h3>
            </div>
            {closedCount > 0 && (
              <p className="note-modal-desc">
                {closedCount} catatan ditutup. Klik untuk membuka kembali.
              </p>
            )}
            <div className="note-list">
              {sortedNotes.map((n) => (
                <div
                  key={n.id}
                  className={`note-list-item ${n.id === activeId ? 'active' : ''} ${n.closed ? 'closed' : ''}`}
                >
                  <button
                    className="note-list-open"
                    onClick={() => { setListOpen(false); openFromList(n) }}
                  >
                    <div className="note-list-info">
                      <span className="note-list-title">
                        {n.closed && <span className="note-list-closed-badge">Ditutup</span>}
                        {n.title || 'Tanpa judul'}
                      </span>
                      <span className="note-list-snippet">{stripHtml(n.content) || 'Kosong'}</span>
                    </div>
                    <div className="note-list-meta">
                      {n.pin && <Lock size={12} className="note-tab-lock" />}
                      <span className="note-list-date">
                        {new Date(n.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </button>
                  <button
                    className="note-list-delete"
                    title="Hapus catatan"
                    onClick={(e) => { e.stopPropagation(); openDeleteModal(n.id) }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="note-modal-actions">
              <button className="btn btn-secondary" onClick={() => setListOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <h3>Kunci catatan?</h3>
                </div>
                <p className="note-modal-desc">
                  Tambahkan PIN untuk catatan ini? Hanya kamu yang bisa membukanya.
                </p>
                <div className="note-modal-actions">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Tidak
                  </button>
                  <button className="btn btn-primary" onClick={goAskToSet}>
                    <Lock size={16} /> Ya, tambahkan PIN
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
