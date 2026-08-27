const OVERLAY_SELECTOR = '[class*="overlay"]:not(.sidebar-overlay):not(.nav-dropdown-backdrop):not(.profile-menu-backdrop):not(.role-switch-backdrop)'
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function initModalFocus() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        const overlay = node.matches(OVERLAY_SELECTOR) ? node : node.querySelector(OVERLAY_SELECTOR)
        if (!overlay) continue
        requestAnimationFrame(() => {
          const first = overlay.querySelector(FOCUSABLE)
          if (first) {
            first.focus({ preventScroll: true })
          } else {
            const modal = overlay.firstElementChild
            if (modal) {
              modal.setAttribute('tabindex', '-1')
              modal.focus({ preventScroll: true })
            }
          }
        })
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}