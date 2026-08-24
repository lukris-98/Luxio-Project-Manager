import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../services/api'
import { UserPlus, X, Check, Search } from 'lucide-react'
import './InviteUsers.css'

// =====================================================================
// InviteUsers — Undang user untuk berkolaborasi pada satu item
// (target/kanban/todo/catatan).
// Menampilkan anggota perusahaan + pencarian global user (by username/
// nama/email) sehingga siapapun bisa diundang. Username bersifat unik
// per akun dan menjadi identitas publik (pengganti kode LUX).
// =====================================================================

export default function InviteUsers({ collaborators = [], onToggle, disabled }) {
  const { members, currentUser } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const debounceRef = useRef(null)

  const selected = new Set(collaborators)

  useEffect(() => {
    if (!open) return
    clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchUsers(q)
        setResults((res.results || []).filter((u) => u.id !== currentUser?.id))
        setSearchError('')
      } catch (e) {
        setResults([])
        setSearchError('Gagal mencari user. Pastikan backend online.')
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [open, query, currentUser?.id])

  return (
    <div className="invite-wrap">
      <button
        className="btn btn-secondary btn-sm invite-btn"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title="Undang user berkolaborasi"
      >
        <UserPlus size={14} />
        Undang
      </button>

      {open && (
        <>
          <div className="invite-backdrop" onClick={() => setOpen(false)} />
          <div className="invite-panel" onClick={(e) => e.stopPropagation()}>
            <div className="invite-head">
              <span>Undang Kolaborator</span>
              <button className="invite-close" onClick={() => setOpen(false)} aria-label="Tutup">
                <X size={14} />
              </button>
            </div>
            <div className="invite-body">
              {/* Pencarian user global */}
              <div className="invite-search-wrap">
                <Search size={14} className="invite-search-icon" />
                <input
                  type="text"
                  className="input invite-search-input"
                  placeholder="Cari username, nama, atau email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {searching && <span className="invite-search-spin" />}
              </div>
              {searchError && <p className="invite-search-error">{searchError}</p>}

              {/* Hasil pencarian global */}
              {results.length > 0 && (
                <>
                  <div className="invite-section-label">Global</div>
                  {results.map((u) => {
                    const checked = selected.has(u.id) || selected.has(u.user_code)
                    return (
                      <label key={u.id} className={`invite-option ${checked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggle(u.id)}
                        />
                        <span className="invite-avatar">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="invite-name">{u.name}</span>
                        {u.username ? <span className="invite-code">@{u.username}</span> : u.user_code ? <span className="invite-code">@{u.user_code}</span> : null}
                        {u.company_name && <span className="invite-company">{u.company_name}</span>}
                        {checked && <Check size={14} className="invite-check" />}
                      </label>
                    )
                  })}
                </>
              )}

              {/* Anggota perusahaan */}
              {members.length > 1 && (
                <>
                  <div className="invite-section-label">Perusahaan</div>
                  {members
                    .filter((m) => m.id !== currentUser?.id)
                    .map((m) => {
                      const checked = selected.has(m.id)
                      return (
                        <label key={m.id} className={`invite-option ${checked ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(m.id)}
                          />
                          <span className="invite-avatar">
                            {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="invite-name">{m.name}</span>
                          {checked && <Check size={14} className="invite-check" />}
                        </label>
                      )
                    })}
                </>
              )}

              {members.length === 0 && results.length === 0 && query.trim().length < 2 && (
                <p className="invite-empty">Ketik minimal 2 karakter untuk mencari user global.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}