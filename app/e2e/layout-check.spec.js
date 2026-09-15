import { test, expect } from '@playwright/test'

// Daftar semua halaman yang perlu dicek layout-nya
const ALL_PAGES = [
  { name: 'dashboard', url: '/app/dashboard' },
  { name: 'projects', url: '/app/projects' },
  { name: 'my-tasks', url: '/app/my-tasks' },
  { name: 'kanban', url: '/app/kanban' },
  { name: 'todo-list', url: '/app/todo-list' },
  { name: 'private-note', url: '/app/private-note' },
  { name: 'vault', url: '/app/vault' },
  { name: 'storage', url: '/app/storage' },
  { name: 'calendar', url: '/app/calendar' },
  { name: 'team', url: '/app/team' },
  { name: 'settings', url: '/app/settings' },
  { name: 'admin-users', url: '/app/admin-users' },
  { name: 'agent', url: '/app/agent' },
  { name: 'owner-dashboard', url: '/app/owner-dashboard' },
  { name: 'attendance', url: '/app/attendance' },
  { name: 'attendance-admin', url: '/app/attendance-admin' },
  { name: 'research', url: '/app/research' },
  { name: 'apps', url: '/app/apps' },
  { name: 'connect', url: '/app/connect' },
  { name: 'upgrade', url: '/app/upgrade' },
  { name: 'landing', url: '/' },
  { name: 'pricing', url: '/pricing' },
  { name: 'faq', url: '/faq' },
  { name: 'auth', url: '/auth' },
]

async function seedSession(page) {
  await page.addInitScript(() => {
    localStorage.setItem('luxio-token', 'e2e-token')
    localStorage.setItem('luxio_storage_unlocked', JSON.stringify({ uid: 'u1' }))
    localStorage.setItem('luxio_pin_prompt_u1', '1')
  })
  await page.goto('/')
  await page.evaluate(() => new Promise((resolve, reject) => {
    const req = indexedDB.open('luxio-db', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv')
    }
    req.onsuccess = () => {
      const db = req.result
      const state = {
        state: {
          currentUser: { id: 'u1', email: 'owner@luxio.web.id', name: 'Owner', role: 'owner', plan: 'business', company_id: 'c1' },
          token: 'e2e-token',
          isAuthenticated: true,
          hasCompletedSetup: true,
          activeRole: 'owner',
          companies: [{ id: 'c1', name: 'Luxio' }],
        },
        version: 5,
      }
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put(JSON.stringify(state), 'luxio-store')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  }))
}

async function mockApis(page) {
  await page.route(/^((?!storage\/proxy).)*$/, async (route) => {
    const url = route.request().url()
    if (!url.includes('/api/')) return route.fallback()
    if (url.includes('auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', email: 'owner@luxio.web.id', name: 'Owner', role: 'owner', plan: 'business', company_id: 'c1' }),
      })
    }
    if (url.includes('/api/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', email: 'owner@luxio.web.id', name: 'Owner', role: 'owner', plan: 'business', company_id: 'c1', username: 'owner_luxio' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, success: true }),
    })
  })
}

test.describe('Layout check — semua halaman', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await mockApis(page)
  })

  for (const pg of ALL_PAGES) {
    test(pg.name + ' renders tanpa JS error', async ({ page }) => {
      test.setTimeout(30000)
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))

      await page.goto(pg.url, { waitUntil: 'domcontentloaded' })

      const root = page.locator('#root')
      await expect(root).toBeAttached({ timeout: 10000 })
      await page.waitForTimeout(1500)

      const projName = test.info().project.name
      await page.screenshot({ path: 'test-results/' + pg.name + '-' + projName + '.png', fullPage: true })

      const realErrors = errors.filter((m) => !/ResizeObserver|font|WebSocket|Failed to fetch|Transition was skipped|NotSupportedError/i.test(m))
      expect(realErrors).toEqual([])
    })
  }

  test('sidebar mobile: klik hamburger muncul expanded', async ({ page }) => {
    test.setTimeout(20000)
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const vw = page.viewportSize()?.width || 1440
    if (vw > 900) {
      test.skip()
      return
    }

    const menuBtn = page.locator('.menu-btn')
    if (await menuBtn.isVisible()) {
      await menuBtn.click()
      await page.waitForTimeout(500)

      const sidebar = page.locator('.sidebar')
      await expect(sidebar).toHaveClass(/open/)
      const projName = test.info().project.name
      await page.screenshot({ path: 'test-results/sidebar-open-' + projName + '.png', fullPage: false })
    }
  })
})
