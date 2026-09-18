// =====================================================================
// preventZoomAndContextMenu.js
// =====================================================================
// Menolak (disable) zoom in / zoom out browser secara total di seluruh aplikasi Luxio
// dan menolak klik kanan cursor (context menu) kecuali pada input teks / textarea.
// =====================================================================

export function initPreventZoomAndContextMenu() {
  const isContextMenuAllowedTarget = (target) => {
    if (!target || !(target instanceof Element)) return false
    // Izinkan klik kanan pada input, textarea, & contenteditable (copy/paste/select/spellcheck)
    if (target.closest('input, textarea, [contenteditable="true"]')) return true
    return false
  }

  // Disable context menu (klik kanan)
  const handleContextMenu = (e) => {
    if (isContextMenuAllowedTarget(e.target) || e.defaultPrevented) {
      return
    }
    e.preventDefault()
  }

  // Disable keyboard zoom shortcuts (Ctrl / Cmd + '+', '-', '=', '_', '0')
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key
      const code = e.code
      if (
        key === '+' ||
        key === '-' ||
        key === '=' ||
        key === '_' ||
        key === '0' ||
        code === 'NumpadAdd' ||
        code === 'NumpadSubtract' ||
        code === 'Equal' ||
        code === 'Minus' ||
        code === 'Digit0' ||
        code === 'Numpad0'
      ) {
        e.preventDefault()
      }
    }
  }

  // Disable mouse wheel / trackpad zoom (Ctrl / Cmd + Wheel)
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
    }
  }

  // Disable touch pinch zoom gestures (Safari / iOS)
  const handleGesture = (e) => {
    e.preventDefault()
  }

  // Disable multi-touch pinch zoom
  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault()
    }
  }

  document.addEventListener('contextmenu', handleContextMenu, false)
  document.addEventListener('keydown', handleKeyDown, false)
  window.addEventListener('wheel', handleWheel, { passive: false })
  document.addEventListener('gesturestart', handleGesture, { passive: false })
  document.addEventListener('gesturechange', handleGesture, { passive: false })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })

  return () => {
    document.removeEventListener('contextmenu', handleContextMenu, false)
    document.removeEventListener('keydown', handleKeyDown, false)
    window.removeEventListener('wheel', handleWheel)
    document.removeEventListener('gesturestart', handleGesture)
    document.removeEventListener('gesturechange', handleGesture)
    document.removeEventListener('touchmove', handleTouchMove)
  }
}
