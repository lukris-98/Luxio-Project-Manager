import { useEffect, useRef, useState } from 'react'

// Sembunyikan navbar saat halaman di-scroll ke bawah, dan munculkan kembali
// begitu user scroll ke atas sedikit (mirip pola browser/app mobile).
export function useAutoHideNav(threshold = 8) {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y <= 0) {
        setHidden(false)
        lastY.current = 0
        return
      }
      if (y > lastY.current + threshold) {
        setHidden(true)
      } else if (y < lastY.current - threshold) {
        setHidden(false)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return hidden
}