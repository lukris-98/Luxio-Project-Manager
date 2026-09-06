import { useRef, useEffect } from 'react'
import './PinInput.css'

// =====================================================================
// PinInput.jsx — Input PIN 6 digit ala kode 2FA (kotak per digit,
// auto-focus berpindah, backspace mundur, paste didukung).
// =====================================================================
// Props:
//   length  = jumlah kotak (default 6)
//   value   = string digit ('' saat kosong)
//   onChange(digitString)
//   onComplete() — dipanggil saat kotak penuh
//   autoFocus
// =====================================================================
export default function PinInput({ length = 6, value = '', onChange, onComplete, autoFocus = true, inputRef }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  // Fokus ke kotak kosong pertama saat mount / reset.
  useEffect(() => {
    if (autoFocus && !value) {
      const firstEmpty = refs.current.findIndex((r) => r && !r.value)
      const idx = firstEmpty === -1 ? 0 : firstEmpty
      refs.current[idx]?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Izinkan parent mem-fokuskan komponen ini (mis. saat step berikutnya).
  useEffect(() => {
    if (inputRef) inputRef.current = { focus: () => refs.current[0]?.focus() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef])

  // Saat value berubah penuh -> onComplete
  useEffect(() => {
    if (value.length === length && onComplete) onComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length])

  const handleChange = (idx, e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      // Hapus digit di kotak ini
      const next = value.slice(0, idx) + value.slice(idx + 1)
      onChange(next)
      if (idx > 0) refs.current[idx - 1]?.focus()
      return
    }
    // Ambil digit terakhir yang diketik (mendukung paste multi-digit)
    const digit = raw.slice(-1)
    const next = (value.slice(0, idx) + digit + value.slice(idx + 1)).slice(0, length)
    onChange(next)
    if (idx < length - 1) refs.current[idx + 1]?.focus()
    if (next.length === length && onComplete) onComplete()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      e.preventDefault()
      refs.current[idx - 1]?.focus()
      const next = value.slice(0, idx - 1) + value.slice(idx)
      onChange(next)
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length)
    onChange(text)
    if (text.length === length) {
      refs.current[length - 1]?.focus()
      if (onComplete) onComplete()
    } else if (text.length > 0) {
      refs.current[Math.min(text.length, length - 1)]?.focus()
    }
  }

  return (
    <div className="pin-input">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className={`pin-box ${d ? 'filled' : ''}`}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
