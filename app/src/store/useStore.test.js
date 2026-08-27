import { describe, it, expect } from 'vitest'
import {
  dataKeyFor,
  levelFromXp,
  xpForNextLevel,
  GAMIFICATION_BADGES,
} from '../store/useStore'

describe('dataKeyFor', () => {
  it('returns `${id}:${role}` for owner accounts', () => {
    expect(dataKeyFor({ id: 42, role: 'owner' }, 'admin')).toBe('42:admin')
  })

  it('defaults owner role to "owner" when activeRole is missing', () => {
    expect(dataKeyFor({ id: 42, role: 'owner' })).toBe('42:owner')
  })

  it('returns just the id for non-owner accounts', () => {
    expect(dataKeyFor({ id: 7, role: 'super_admin' }, 'super_admin')).toBe('7')
    expect(dataKeyFor({ id: 7, role: 'member' }, 'user')).toBe('7')
  })

  it('returns null for a null user', () => {
    expect(dataKeyFor(null, 'admin')).toBeNull()
  })

  it('returns null when user id is missing', () => {
    expect(dataKeyFor({ role: 'owner' }, 'admin')).toBeNull()
  })
})

describe('levelFromXp', () => {
  it('returns level 1 at 0 XP', () => {
    expect(levelFromXp(0)).toBe(1)
  })

  it('returns level 2 at 200 XP', () => {
    expect(levelFromXp(200)).toBe(2)
  })

  it('returns level 3 at 450 XP', () => {
    expect(levelFromXp(450)).toBe(3)
  })

  it('handles null/undefined XP as 0', () => {
    expect(levelFromXp(null)).toBe(1)
    expect(levelFromXp(undefined)).toBe(1)
  })
})

describe('xpForNextLevel', () => {
  it('returns 200 XP needed at 0 XP', () => {
    expect(xpForNextLevel(0)).toBe(200)
  })

  it('returns 50 XP needed at 150 XP', () => {
    expect(xpForNextLevel(150)).toBe(50)
  })

  it('returns 200 XP needed exactly at a level boundary', () => {
    expect(xpForNextLevel(200)).toBe(200)
  })
})

describe('GAMIFICATION_BADGES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(GAMIFICATION_BADGES)).toBe(true)
    expect(GAMIFICATION_BADGES.length).toBeGreaterThan(0)
  })

  it('has required fields on every badge', () => {
    for (const badge of GAMIFICATION_BADGES) {
      expect(typeof badge.id).toBe('string')
      expect(badge.id.length).toBeGreaterThan(0)
      expect(typeof badge.name).toBe('string')
      expect(badge.name.length).toBeGreaterThan(0)
      expect(typeof badge.icon).toBe('string')
      expect(badge.icon.length).toBeGreaterThan(0)
    }
  })

  it('has unique badge ids', () => {
    const ids = GAMIFICATION_BADGES.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
