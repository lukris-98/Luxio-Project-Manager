import { describe, it, expect } from 'vitest'
import { formatDate, daysUntil } from '../utils/notify'

const pad = (n) => String(n).padStart(2, '0')
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function dateStr(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return toYmd(d)
}

describe('formatDate', () => {
  it('returns a non-empty string containing the year for a valid date', () => {
    const out = formatDate('2026-09-30')
    expect(typeof out).toBe('string')
    expect(out.length).toBeGreaterThan(0)
    expect(out).toContain('2026')
  })

  it('returns an empty string for empty input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    expect(daysUntil(dateStr(0))).toBe(0)
  })

  it('returns 1 for tomorrow', () => {
    expect(daysUntil(dateStr(1))).toBe(1)
  })

  it('returns -1 for yesterday', () => {
    expect(daysUntil(dateStr(-1))).toBe(-1)
  })

  it('returns 3 for three days from now', () => {
    expect(daysUntil(dateStr(3))).toBe(3)
  })

  it('returns null for empty input', () => {
    expect(daysUntil('')).toBeNull()
    expect(daysUntil(null)).toBeNull()
    expect(daysUntil(undefined)).toBeNull()
  })
})
