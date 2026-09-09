// @ts-check
import { test, expect } from '@playwright/test'

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64')

function mockNeonRoute(url) {
  if (url.includes('/users/me')) return { id: 'ns1', email: 'owner@luxio.web.id', name: 'Owner Luxio', license: 'free' }
  if (url.includes('/projects?') || url.match(/\/projects(\?|$)/)) {
    return { projects: [{ id: 'p1', name: 'luxio-production', pg_version: '17', region_id: 'ap-southeast-1', created_at: '2026-01-01T00:00:00Z', default_branch_id: 'br1' }] }
  }
  if (url.includes('/api_keys')) return { keys: [{ id: 'k1', name: 'CLI', created_at: '2026-01-01T00:00:00Z' }] }
  if (url.includes('/branches')) return { branches: [{ id: 'br1', name: 'main', primary: true, current_state: 'ready', created_at: '2026-01-01T00:00:00Z' }] }
  if (url.includes('/endpoints')) return { endpoints: [{ id: 'ep1', branch_id: 'br1', type: 'read_write', current_state: 'running', name: 'ep-green' }] }
  if (url.includes('/operations')) return { operations: [{ id: 'op1', action: 'create_project', state: 'finished', created_at: '2026-01-01T00:00:00Z', progress: { total_steps: 3, completed_steps: 3 } }] }
  if (url.includes('/consumption')) return { total_consumption: 12.5 }
  if (url.includes('/databases')) return { databases: [] }
  if (url.includes('/roles')) return { roles: [] }
  if (url.includes('/snapshots')) return { snapshots: [] }
  return {}
}

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
  await page.route('**/api/storage/proxy', async (route) => {
    let data = {}
    try { data = mockNeonRoute(JSON.parse(route.request().postData() || '{}').url || '') } catch { data = {} }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 200, contentType: 'application/json', bodyBase64: b64(data) }) })
  })
  await page.route(/^((?!storage\/proxy).)*$/, async (route) => {
    const url = route.request().url()
    if (!url.includes('/api/')) return route.fallback()
    if (url.includes('auth/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'owner@luxio.web.id', name: 'Owner', role: 'owner', plan: 'business', company_id: 'c1' }) })
    }
    if (url.includes('/api/profile')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'owner@luxio.web.id', name: 'Owner', role: 'owner', plan: 'business', company_id: 'c1', username: 'owner_luxio', user_code: 'owner_luxio' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, success: true }) })
  })
}

test('refresh di /app/storage tetap di halaman Penyimpanan & data Neon tampil', async ({ page }) => {
  test.setTimeout(60000)
  await seedSession(page)
  await mockApis(page)

  await page.goto('/app/storage', { waitUntil: 'networkidle' })
  await expect(page.locator('h1', { hasText: 'Penyimpanan' })).toBeVisible({ timeout: 10000 })

  // Data Neon ter-fetch (project p1 -> BranchSection dst. harus render, bukan crash)
  await expect(page.locator('text=luxio-production').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.storage-row', { hasText: 'main' }).first()).toBeVisible({ timeout: 5000 })

  // REPLIKA LAPORAN: refresh di URL storage
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.locator('h1', { hasText: 'Penyimpanan' })).toBeVisible({ timeout: 10000 })
  await expect(page).toHaveURL(/\/app\/storage$/)

  // Tombol Keluar menghapus sesi -> gate 2 langkah muncul lagi
  await page.click('button:has-text("Keluar")')
  await expect(page.locator('h2', { hasText: 'Verifikasi Keamanan' })).toBeVisible({ timeout: 10000 })
  expect(await page.evaluate(() => localStorage.getItem('luxio_storage_unlocked'))).toBeNull()
})
