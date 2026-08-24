import { useState } from 'react'
import { useStore } from '../store/useStore'
import { FolderOpen, Plus } from 'lucide-react'
import './ThemeSelect.css'

// =====================================================================
// LabelSelect — Pilih / buat label untuk mengelompokkan item.
// Dipakai di form target, kanban, todo, dan catatan.
// =====================================================================

export default function ThemeSelect({ value, onChange, placeholder = 'Pilih atau ketik label baru...' }) {
  const { themes, addTheme } = useStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handlePick = (name) => {
    onChange(name === '' ? '' : name)
    setCreating(false)
    setNewName('')
  }

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    addTheme(name)
    onChange(name)
    setCreating(false)
    setNewName('')
  }

  return (
    <div className="theme-select">
      <FolderOpen size={16} className="theme-select-icon" />

      {!creating ? (
        <>
          <select
            className="input theme-select-input"
            value={value || ''}
            onChange={(e) => handlePick(e.target.value)}
          >
            <option value="">Tanpa label</option>
            {themes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button type="button" className="theme-select-add" onClick={() => setCreating(true)} title="Label baru">
            <Plus size={14} />
          </button>
        </>
      ) : (
        <div className="theme-select-create">
          <input
            className="input"
            autoFocus
            placeholder="Nama label baru (mis. Project Rumah)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          />
          <button type="button" className="btn btn-sm btn-primary" onClick={handleCreate}>
            Simpan
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCreating(false)}>
            Batal
          </button>
        </div>
      )}
    </div>
  )
}
