import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import './Select.css'

// =====================================================================
// Select.jsx — Dropdown kustom (mengganti <select> bawaan browser).
// =====================================================================
// Gaya modern & konsisten dengan design system (dark/light theme).
// Fitur: buka/tutup dengan klik, pilih lewat menu, tutup saat klik di
// luar / tekan Escape, opsi reset ke kosong (`allowReset`), dan ikon
// chevron yang berputar saat terbuka.
// =====================================================================

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  allowReset = true,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  // Tutup dropdown saat klik di luar area atau tekan Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const current = options.find((o) => String(o.value) === String(value))

  const pick = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`select ${open ? 'select-open' : ''} ${className}`}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`select-value ${current ? '' : 'select-value-placeholder'}`}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={16} className="select-chevron" />
      </button>

      {open && (
        <div className="select-menu" role="listbox">
          {allowReset && (
            <button
              type="button"
              role="option"
              aria-selected={value === '' || value == null}
              className={`select-option ${value === '' || value == null ? 'select-option-active' : ''}`}
              onClick={() => pick('')}
            >
              <span>{placeholder}</span>
              {(value === '' || value == null) && <Check size={16} />}
            </button>
          )}
          {options.map((opt) => {
            const isActive = String(opt.value) === String(value)
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`select-option ${isActive ? 'select-option-active' : ''}`}
                onClick={() => pick(opt.value)}
              >
                <span>{opt.label}</span>
                {isActive && <Check size={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
