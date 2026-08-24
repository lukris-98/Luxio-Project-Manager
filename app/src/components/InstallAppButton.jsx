import { Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallAppButton({ className = '', label = 'Install', iconOnly = false }) {
  const { canInstall, promptInstall } = useInstallPrompt()
  if (!canInstall) return null

  return (
    <button
      type="button"
      className={`install-app-btn ${className}`.trim()}
      onClick={promptInstall}
      title="Install Luxio di perangkat ini"
      aria-label={iconOnly ? label : undefined}
    >
      <Download size={18} />
      {!iconOnly && <span>{label}</span>}
    </button>
  )
}
