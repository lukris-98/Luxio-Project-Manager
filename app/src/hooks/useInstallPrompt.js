import { useState, useEffect, useCallback } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    let installedFromStore = false
    try {
      installedFromStore = window.localStorage.getItem('luxio-installed') === '1'
    } catch (e) {}
    setIsInstalled(media.matches || window.navigator.standalone === true || installedFromStore)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      try { window.localStorage.setItem('luxio-installed', '1') } catch (e) {}
    }

    const handleDisplayMode = (e) => {
      if (e.matches) {
        setIsInstalled(true)
        try { window.localStorage.setItem('luxio-installed', '1') } catch (e) {}
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    media.addEventListener('change', handleDisplayMode)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      media.removeEventListener('change', handleDisplayMode)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    try { await deferredPrompt.userChoice } catch (e) {}
    setDeferredPrompt(null)
    return true
  }, [deferredPrompt])

  return { canInstall: Boolean(deferredPrompt) && !isInstalled, isInstalled, promptInstall }
}
