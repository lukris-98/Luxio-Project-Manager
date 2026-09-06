/**
 * Format a date string or Date object to a human-readable Indonesian format.
 * e.g. "22 Agu 2026" or "22 Agu 2026, 17:00"
 */
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export function formatDate(value, { includeTime = false } = {}) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const day = d.getDate()
  const month = MONTHS_SHORT[d.getMonth()]
  const year = d.getFullYear()
  const base = `${day} ${month} ${year}`
  if (!includeTime) return base
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${base}, ${hh}:${mm}`
}

export function formatRelative(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const now = new Date()
  const diff = d - now
  const absDiff = Math.abs(diff)
  const days = Math.round(absDiff / 86400000)
  if (days === 0) return 'Hari ini'
  if (diff < 0) return `${days} hari lalu`
  if (days === 1) return 'Besok'
  if (days < 7) return `${days} hari lagi`
  return formatDate(value)
}
