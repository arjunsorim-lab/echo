import { test, expect } from '@playwright/test'
import { loadFixture, login } from './fixture.js'

let info
test.beforeAll(async () => { info = await loadFixture() })

for (const [route, label] of [
  ['/fetal-echo-report', 'Cardiac views'],
  ['/adult-echo-report', 'Right ventricle'],
  ['/pediatric-echo-report', 'Cardiac position'],
]) {
  test(`${route} saves and reuses a custom choice`, async ({ page }) => {
    await login(page, 'l1', info.password)
    await page.goto(route)
    if (route === '/fetal-echo-report') await page.getByRole('button', { name: 'Echo details', exact: true }).click()
    const input = page.getByLabel(label, { exact: true }).first()
    const value = `Synthetic choice ${Date.now()}`
    await page.getByRole('button', { name: `Add ${label} choice`, exact: true }).first().click()
    await page.getByLabel(`New ${label} choice`, { exact: true }).first().fill(value)
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(input).toHaveValue(value)
    await page.reload()
    if (route === '/fetal-echo-report') await page.getByRole('button', { name: 'Echo details', exact: true }).click()
    const selector = page.getByLabel(`Choose ${label}`, { exact: true }).first()
    await expect(selector.locator('option', { hasText: value })).toHaveCount(1)
    await selector.selectOption(value)
    await expect(page.getByLabel(label, { exact: true }).first()).toHaveValue(value)
  })
}
