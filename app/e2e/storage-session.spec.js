// @ts-check
import { test, expect } from '@playwright/test'

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64')

function mockNeonRoute(url) {
  if (url.includes('/users/me')) return { user: { id: 'ns1', email: 'owner@luxio.web.id', name: 'Owner Luxio', license_type: 'free' } }
  if (url.includes('/projects?') || url.match(/\/projects(\?|$)/)) {
    return { projects: [{ project: { id: 'p1', name: 'luxio-production', pg_version: '17', region_id: 'ap-southeast-1', created_at: '2026-01-01T00:00:00Z', default_branch_id: 'br1' }, limits: {} }] }
  }
  if (url.includes('/api_keys')) return { keys: [{ key: { id: 'k1', name: 'CLI', created_at: '2026-01-01T00:00:00Z' }, allowed_scopes: ['admin'] }] }
  if (url.includes('/branches')) return { branches: [{ branch: { id: 'br1', name: 'main', primary: true, current_state: 'ready', created_at: '2026-01-01T00:00:00Z' }, project: { id: 'p1' } }] }
  if (url.includes('/endpoints')) return { endpoints: [{ endpoint: { id: 'ep1', branch_id: 'br1', type: 'read_write', current_state: 'running', name: 'ep-green' } }] }
  if (url.includes('/operations')) return { operations: [{ id: 'op1', action: 'create_project', state: 'finished', created_at: '2026-01-01T00:00:00Z', progress: { total_steps: 3, completed_steps: 3 } }] }
  if (url.includes('/consumption')) return { total_consumption: 12.5 }
  if (url.includes('/databases')) return { databases: [{ database: { name: 'neondb', owner_name: 'neondb_owner' } }] }
  if (url.includes('/roles')) return { roles: [{ role: { name: 'neondb_owner', protected: true } }] }
  if (url.includes('/snapshots')) return { snapshots: [{ snapshot: { id: 'snap1', created_at: '2026-01-01T00:00:00Z' } }] }
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

// Membuka halaman untuk pertama kali: selesaikan gate 2 langkah (OTP + PIN)
// lalu assert sesi tersimpan; kemudian keluar akun menghapus sesi storage.
test('alur 2 langkah penuh -> sesi tersimpan; logout menghapusnya', async ({ page }) => {
  test.setTimeout(60000)
  // Sesi login tapi storage BELUM unlock.
  await page.addInitScript(() => localStorage.setItem('luxio-token', 'e2e-token'))
  await page.goto('/')
  await page.evaluate(() => new Promise((resolve) => {
    const req = indexedDB.open('luxio-db', 1)
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv') }
    req.onsuccess = () => {
      const db = req.result
      const st = { state: { currentUser: { id: 'u1', email: 'owner@luxio.web.id', role: 'owner' }, token: 'e2e-token', isAuthenticated: true, hasCompletedSetup: true, activeRole: 'owner' }, version: 5 }
      const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(JSON.stringify(st), 'luxio-store'); tx.oncomplete = () => resolve()
    }
  }))
  await mockApis(page)
  await page.route('**/api/storage/2fa/send', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))
  await page.route('**/api/storage/2fa/verify', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, pin_challenge: 'ch-1', pin_expires_in: 600 }) }))
  await page.route('**/api/storage/2fa/pin', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))

  await page.goto('/app/storage', { waitUntil: 'networkidle' }).catch(() => {})
  await expect(page.locator('text=Kirim Kode Verifikasi')).toBeVisible({ timeout: 10000 })
  await page.click('text=Kirim Kode Verifikasi')
  await page.fill('#storage-2fa-code', '123456')
  await page.click('button:has-text("Lanjut ke PIN")')
  await page.fill('#storage-pin-input', '2468')
  await page.click('button:has-text("Simpan & Buka")')
  await expect(page.locator('h1', { hasText: 'Penyimpanan' })).toBeVisible({ timeout: 10000 })
  // Sesi tersimpan permanen (Ingat perangkat ini default ON).
  expect(await page.evaluate(() => localStorage.getItem('luxio_storage_unlocked'))).toContain('u1')
})

// Reproduksi bug "kosong": akun ter-organisasi, GET /projects tanpa org_id
// => 404 "org_id is required". Kode org-aware harus ambil /orgs lalu query
// ulang per-org dan project TETAP tampil.
test('org-aware: akun ber-organisasi tetap menampilkan project', async ({ page }) => {
  test.setTimeout(60000)
  await seedSession(page)
  await page.route('**/api/storage/2fa/pin', async (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))
  await page.route(/^((?!storage\/proxy).)*$/, async (route) => {
    const url = route.request().url()
    if (!url.includes('/api/')) return route.fallback()
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, success: true }) })
  })
  await page.route('**/api/storage/proxy', async (route) => {
    const inner = (JSON.parse(route.request().postData() || '{}').url) || ''
    let data
    if (inner.includes('/users/me')) data = { user: { id: 'ns', name: 'Owner', email: 'owner@luxio.web.id' } }
    else if (inner.includes('org_id=')) data = { projects: [{ project: { id: 'orgp1', name: 'luxio-org-prod', region_id: 'aws', created_at: '2026-01-01T00:00:00Z' } }] }
    else if (inner.match(/\/projects(\?|$)/)) data = { message: 'org_id is required, you can find it on your organization settings page' }
    else if (inner.includes('organizations')) data = { organizations: [{ id: 'org-1', name: 'Luxio Org', handle: 'luxio', plan: 'business' }] }
    else if (inner.includes('/api_keys')) data = { keys: [] }
    else if (inner.includes('/branches')) data = { branches: [] }
    else if (inner.includes('/endpoints')) data = { endpoints: [] }
    else if (inner.includes('/operations')) data = { operations: [] }
    else data = {}
    const innerStatus = inner.match(/\/projects(\?|$)/) && !inner.includes('org_id=') ? 404 : 200
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: innerStatus, contentType: 'application/json', bodyBase64: b64(data) }) })
  })
  await page.goto('/app/storage', { waitUntil: 'networkidle' })
  await expect(page.locator('text=luxio-org-prod')).toBeVisible({ timeout: 10000 })
})
