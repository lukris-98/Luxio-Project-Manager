import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import ContributorStack from './ContributorStack'
import { X, Upload, Download, Trash2, Plus, Check, FileText, StickyNote, Users, Paperclip, ListTodo, Eye } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import './TaskDetailModal.css'

// =====================================================================
// TaskDetailModal.jsx — Popup detail pekerjaan item kanban (dibuka lewat
// icon mata di tiap item kanban). Berisi:
//   - nama & deskripsi item
//   - daftar kontributor (bisa dikelola bila terdaftar di task)
//   - daftar file yang diupload kontributor + tombol upload file apapun
//   - to-do list item (dibuat kontributor, bisa dicentang)
//   - kotak catatan
// Kontributor yang TIDAK terdaftar di task hanya bisa melihat & mengunduh.
// =====================================================================
export default function TaskDetailModal({ board, task, onClose }) {
  const { currentUser, members, updateKanbanTask, toggleBoardCollaborator } = useStore()
  const [name, setName] = useState(task.title || '')
  const [desc, setDesc] = useState(task.description || '')
  const [note, setNote] = useState(task.note || '')
  const [todos, setTodos] = useState(Array.isArray(task.todos) ? task.todos : [])
  const [files, setFiles] = useState(Array.isArray(task.files) ? task.files : [])
  const [newTodo, setNewTodo] = useState('')
  const fileInputRef = useRef(null)

  // Kontributor terdaftar = anggota di task (assignedTo + collaborators).
  const taskCollabIds = [task.assignedTo, ...(task.collaboratorIds || [])].filter(Boolean)
  const isRegistered = taskCollabIds.includes(currentUser?.id)

  const contributors = (() => {
    const list = []
    const assignee = task.assignedTo ? members.find((m) => m.id === task.assignedTo) : null
    if (assignee) list.push(assignee)
    ;(task.collaboratorIds || []).forEach((id) => {
      if (list.some((m) => m.id === id)) return
      const m = members.find((x) => x.id === id)
      if (m) list.push(m)
    })
    ;(board.collaboratorIds || []).forEach((id) => {
      if (list.some((m) => m.id === id)) return
      const m = members.find((x) => x.id === id)
      if (m) list.push(m)
    })
    if (list.length === 0 && currentUser) list.push(currentUser)
    return list
  })()

  const contributionOf = (memberId) => {
    const reg = contributors.filter((m) => taskCollabIds.includes(m.id))
    if (reg.length === 0) return 0
    const idx = reg.findIndex((m) => m.id === memberId)
    if (idx === -1) return 0
    if (idx === 0) return reg.length === 1 ? 100 : Math.round(60 / reg.length + 20)
    return Math.round(40 / Math.max(1, reg.length - 1))
  }

  // ---- Simpan ----
  const save = (extra = {}) => {
    updateKanbanTask(board.id, task.id, { title: name, description: desc, note, todos, files, ...extra })
  }
  const saveAndClose = () => { save(); onClose() }

  // ---- To-do item ----
  const addTodo = () => {
    if (!newTodo.trim() || !isRegistered) return
    setTodos((t) => [...t, { id: Date.now(), text: newTodo.trim(), completed: false, createdBy: currentUser?.id }])
    setNewTodo('')
  }
  const toggleTodo = (id) => {
    if (!isRegistered) return
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)))
  }
  const removeTodo = (id) => {
    if (!isRegistered) return
    setTodos((t) => t.filter((x) => x.id !== id))
  }

  // ---- File upload (file apapun) — hanya kontributor terdaftar ----
  const handleFiles = (e) => {
    if (!isRegistered) return
    const list = Array.from(e.target.files || [])
    if (list.length === 0) return
    setFiles((f) => [
      ...f,
      ...list.map((file) => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type || 'file',
        uploadedBy: currentUser?.id,
        uploadedAt: Date.now(),
        dataUrl: null, // demo lokal: file tidak benar2 diunggah ke server
      })),
    ])
    e.target.value = ''
  }
  const removeFile = (id) => {
    if (!isRegistered) return
    setFiles((f) => f.filter((x) => x.id !== id))
  }
  const downloadFile = (f) => {
    // File demo: unduh berupa info teks (backend nyata akan menyajikan blob).
    const blob = new Blob([`File: ${f.name}\nDiunggah oleh: ${members.find((m) => m.id === f.uploadedBy)?.name || 'Unknown'}\nTanggal: ${new Date(f.uploadedAt).toLocaleString('id-ID')}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

  return (
    <div className="task-detail-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-detail-head">
          <span className="task-detail-badge"><Eye size={14} /> Detail Pekerjaan</span>
          <button className="close-btn" onClick={saveAndClose}><X size={16} /></button>
        </div>

        <div className="task-detail-body">
          {/* Nama & deskripsi */}
          <div className="task-detail-section">
            <label className="input-label">Nama Item</label>
            {isRegistered ? (
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <p className="task-detail-text">{task.title}</p>
            )}
          </div>
          <div className="task-detail-section">
            <label className="input-label">Deskripsi</label>
            {isRegistered ? (
              <textarea className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Jelaskan pekerjaan ini..." />
            ) : (
              <p className="task-detail-text">{task.description || 'Tidak ada deskripsi.'}</p>
            )}
          </div>

          {deadlineText(task) && (
            <div className="task-detail-meta">
              {task.priority && <span className={`task-priority ${task.priority}`}>{task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Sedang'}</span>}
              <span className="task-deadline"><CalendarClock size={12} /> {deadlineText(task)}</span>
            </div>
          )}

          {/* Kontributor */}
          <div className="task-detail-section">
            <label className="input-label"><Users size={13} /> Kontributor</label>
            <ContributorStack
              contributors={contributors}
              contributionOf={contributionOf}
              onRemove={isRegistered ? (memberId) => {
                const rest = (task.collaboratorIds || []).filter((id) => id !== memberId)
                toggleBoardCollaborator(board.id, memberId)
                updateKanbanTask(board.id, task.id, { collaboratorIds: rest })
              } : undefined}
              label="Contributors"
            />
            {!isRegistered && <p className="task-detail-hint">Kamu hanya dapat melihat daftar kontributor.</p>}
          </div>

          {/* File upload */}
          <div className="task-detail-section">
            <label className="input-label"><Paperclip size={13} /> File Terupload ({files.length})</label>
            <div className="task-detail-files">
              {files.length === 0 && <p className="task-detail-hint">Belum ada file.</p>}
              {files.map((f) => (
                <div key={f.id} className="task-file-row">
                  <FileText size={14} />
                  <span className="task-file-name">{f.name}</span>
                  <span className="task-file-meta">{fmtSize(f.size)} · {members.find((m) => m.id === f.uploadedBy)?.name || '?'}</span>
                  <button className="task-file-btn" onClick={() => downloadFile(f)} title="Unduh"><Download size={13} /></button>
                  {isRegistered && (
                    <button className="task-file-btn danger" onClick={() => removeFile(f.id)} title="Hapus"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}
            </div>
            {isRegistered ? (
              <>
                <input ref={fileInputRef} type="file" multiple hidden onChange={handleFiles} />
                <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={14} /> Upload File
                </button>
              </>
            ) : (
              <p className="task-detail-hint">Hanya kontributor terdaftar yang bisa mengunggah file.</p>
            )}
          </div>

          {/* To-do list item */}
          <div className="task-detail-section">
            <label className="input-label"><ListTodo size={13} /> To-do List ({todos.filter((t) => t.completed).length}/{todos.length})</label>
            <div className="task-detail-todos">
              {todos.length === 0 && <p className="task-detail-hint">Belum ada to-do.</p>}
              {todos.map((t) => (
                <div key={t.id} className="task-todo-row">
                  <button className={`kanban-check ${t.completed ? 'on' : ''}`} onClick={() => toggleTodo(t.id)} disabled={!isRegistered}>
                    {t.completed && <Check size={12} />}
                  </button>
                  <span className={`task-todo-text ${t.completed ? 'done' : ''}`}>{t.text}</span>
                  {isRegistered && (
                    <button className="task-file-btn danger" onClick={() => removeTodo(t.id)}><Trash2 size={12} /></button>
                  )}
                </div>
              ))}
            </div>
            {isRegistered && (
              <div className="task-todo-add">
                <input
                  className="input"
                  placeholder="Tambah to-do..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                />
                <button className="btn btn-primary btn-sm" onClick={addTodo}><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className="task-detail-section">
            <label className="input-label"><StickyNote size={13} /> Catatan</label>
            {isRegistered ? (
              <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk item ini..." />
            ) : (
              <p className="task-detail-text">{task.note || 'Tidak ada catatan.'}</p>
            )}
          </div>
        </div>

        <div className="task-detail-foot">
          <span className="task-detail-hint">
            {isRegistered ? 'Kamu bisa mengedit item ini.' : 'Mode lihat-saja (bukan kontributor terdaftar).'}
          </span>
          <div className="task-detail-foot-actions">
            {isRegistered && <button className="btn btn-secondary" onClick={save}>Simpan</button>}
            <button className="btn btn-primary" onClick={saveAndClose}>Selesai</button>
          </div>
        </div>
      </div>
    </div>
  )
}
