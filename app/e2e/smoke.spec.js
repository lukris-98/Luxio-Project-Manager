import { test, expect } from '@playwright/test'

test('landing page loads and renders the app root', async ({ page }) => {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')

  const root = page.locator('#root')
  await expect(root).toBeAttached({ timeout: 15000 })
  await expect(root).not.toBeEmpty()

  expect(errors.filter((m) => !/ResizeObserver|font/i.test(m))).toEqual([])
})
