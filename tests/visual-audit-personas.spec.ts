import { test, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SCREENSHOTS_DIR = path.join(__dirname, '../test-results/visual-audit')

async function screenshot(page: Page, name: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  const fp = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path: fp, fullPage: false })
  console.log(`[SS] ${name} → ${fp}`)
  return fp
}

async function connectGymshark(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("Connect Store")')
  await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
  await page.click('button:has-text("Connect")')
  await page.locator('text=Connect a Shopify Store').waitFor({ state: 'hidden', timeout: 25_000 })
  await page.waitForTimeout(800)
}

test('Persona layouts + product hover', async ({ page }) => {
  await connectGymshark(page)

  // Product hover — use force:true to skip stability check
  const firstImg = page.locator('main img').first()
  await firstImg.hover({ force: true }).catch(() => {})
  await page.waitForTimeout(500)
  await screenshot(page, 'P-product-hover')

  // Click product to see if anything happens
  await firstImg.click({ force: true }).catch(() => {})
  await page.waitForTimeout(600)
  await screenshot(page, 'P-product-clicked')

  // Bargain Hunter
  await page.locator('button.rounded-full:has-text("Bargain Hunter")').click()
  await page.locator('text=Active Layout').waitFor({ timeout: 5000 })
  await screenshot(page, 'P-bargain-hunter')

  // Store Associate
  await page.locator('button.rounded-full:has-text("Store Associate")').click()
  await page.waitForTimeout(600)
  await screenshot(page, 'P-store-associate')

  // Gift Buyer
  await page.locator('button.rounded-full:has-text("Gift Buyer")').click()
  await page.waitForTimeout(600)
  await screenshot(page, 'P-gift-buyer')

  // Brand Loyalist
  await page.locator('button.rounded-full:has-text("Brand Loyalist")').click()
  await page.waitForTimeout(600)
  await screenshot(page, 'P-brand-loyalist')

  // Busy Parent
  await page.locator('button.rounded-full:has-text("Busy Parent")').click()
  await page.waitForTimeout(600)
  await screenshot(page, 'P-busy-parent')

  // Reset
  await page.click('button:has-text("Reset")')
  await page.waitForTimeout(400)
  await screenshot(page, 'P-after-reset')

  // Also audit: what does the ⚙ button actually do?
  // The gear was found in buttons list as "⚙" — but with what selector?
  const gearBtn = page.locator('button:has-text("⚙")').first()
  const gearVisible = await gearBtn.isVisible()
  console.log('[GEAR BUTTON VISIBLE]', gearVisible)
  if (gearVisible) {
    const gearBB = await gearBtn.boundingBox()
    console.log('[GEAR BUTTON BB]', gearBB)
    await gearBtn.click()
    await page.waitForTimeout(500)
    await screenshot(page, 'P-after-gear-click')
    // What appeared?
    const allText = await page.locator('body').innerText()
    const lines = allText.split('\n').filter(l => l.trim()).slice(0, 30)
    console.log('[PAGE TEXT AFTER GEAR]', lines)
  }

  // Check the "+Add module" button more carefully
  const addBtn = page.locator('button:has-text("+Add module")').first()
  const addVisible = await addBtn.isVisible()
  console.log('[+ADD MODULE VISIBLE]', addVisible)
  if (addVisible) {
    await addBtn.click()
    await page.waitForTimeout(500)
    await screenshot(page, 'P-add-module-clicked')
    const allButtons = await page.locator('button:visible').allTextContents()
    console.log('[BUTTONS AFTER ADD MODULE CLICK]', allButtons.map(b => `"${b.trim()}"`))
  }
})

test('Chat with Gymshark connected', async ({ page }) => {
  await connectGymshark(page)
  await screenshot(page, 'C-gymshark-default')

  const textarea = page.locator('textarea[placeholder*="Describe the layout"]')
  await textarea.fill('show me tops for women')
  await screenshot(page, 'C-typed-tops-women')
  await page.keyboard.press('Enter')

  // Wait for bounce dots
  await page.waitForSelector('[class*="animate-bounce"]', { timeout: 10_000 }).catch(() => null)
  await screenshot(page, 'C-loading-dots')

  // Wait for them to go away
  await page.waitForFunction(() => {
    return document.querySelectorAll('[class*="animate-bounce"]').length === 0
  }, null, { timeout: 90_000 })

  await page.waitForTimeout(500)
  await screenshot(page, 'C-tops-women-result')

  const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES AFTER TOPS WOMEN]', moduleLabels)
})
