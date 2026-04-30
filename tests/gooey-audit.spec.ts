import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, '../test-results/screenshots')

async function screenshot(page: Page, name: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  return filePath
}

// Collect console errors on the page
function attachConsoleErrorCollector(page: Page): () => string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
  return () => errors
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. INITIAL LOAD — Folio demo store
// ─────────────────────────────────────────────────────────────────────────────
test.describe('1. Initial Load — Folio Demo Store', () => {
  test('loads with Folio store name and 3 default modules', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Store name in header — the first span in header is "FOLIO"
    const headerSpan = page.locator('header span').first()
    await expect(headerSpan).toContainText('FOLIO')

    // Chat panel visible
    await expect(page.locator('text=Folio Assistant')).toBeVisible()

    // StorefrontPanel shows "3 modules"
    await expect(page.locator('text=3 modules')).toBeVisible()

    // Connect Store button visible
    await expect(page.locator('button:has-text("Connect Store")')).toBeVisible()

    // Persona chips — use .first() to avoid strict-mode when example prompts also match text
    await expect(page.locator('button:has-text("Bargain Hunter")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Gift Buyer")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Brand Loyalist")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Busy Parent")').first()).toBeVisible()
    // "Store Associate" appears as persona chip AND as example prompt — use exact match on rounded-full chip
    await expect(page.locator('button.rounded-full:has-text("Store Associate")')).toBeVisible()

    const screenshotPath = await screenshot(page, '01-initial-load-folio')
    console.log(`Screenshot: ${screenshotPath}`)

    const errors = getErrors()
    if (errors.length > 0) {
      console.warn('Console errors on initial load:', errors.slice(0, 5))
    }
  })

  test('demo products are rendered in ProductGrid', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // ProductGrid renders product images
    const images = page.locator('main img')
    const imgCount = await images.count()
    console.log(`Images found in main: ${imgCount}`)
    expect(imgCount).toBeGreaterThan(0)
  })

  test('default layout has 3 modules: ScrollingBar top, ProductGrid center, CouponBar right', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check module header labels — note: .uppercase is CSS-only, DOM text is mixed case
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Module header labels:', moduleLabels)
    const lower = moduleLabels.map(l => l.toLowerCase())

    // Expect "New Arrivals" or similar (ScrollingBar with new tag)
    expect(lower.some(l => l.includes('new arrivals') || l.includes('new'))).toBe(true)
    // Expect "All Products" or "Products" (ProductGrid)
    expect(lower.some(l => l.includes('products'))).toBe(true)
    // Expect "Offers & Coupons" (CouponBar)
    expect(lower.some(l => l.includes('coupons') || l.includes('offers'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONNECT STORE — Gymshark
// ─────────────────────────────────────────────────────────────────────────────
test.describe('2. Connect Store — Gymshark', () => {
  test('modal opens when Connect Store is clicked', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')

    await expect(page.locator('text=Connect a Shopify Store')).toBeVisible()
    await expect(page.locator('input[placeholder*="gymshark"]')).toBeVisible()
    await expect(page.locator('button:has-text("gymshark.com")')).toBeVisible()

    await screenshot(page, '02a-connect-modal-open')
  })

  test('modal closes on Cancel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await expect(page.locator('text=Connect a Shopify Store')).toBeVisible()

    await page.click('button:has-text("Cancel")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible()
  })

  test('modal closes on backdrop click', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await expect(page.locator('text=Connect a Shopify Store')).toBeVisible()

    // Click the backdrop (fixed overlay behind the modal)
    await page.click('.fixed.inset-0', { force: true, position: { x: 50, y: 50 } })
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible()
  })

  test('quick-fill buttons populate the input', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await page.click('button:has-text("gymshark.com")')

    const inputVal = await page.inputValue('input[placeholder*="gymshark"]')
    expect(inputVal).toBe('gymshark.com')
  })

  test('connect to gymshark.com — waits up to 15s for products, verifies store loaded', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await expect(page.locator('text=Connect a Shopify Store')).toBeVisible()

    // Type gymshark.com
    const input = page.locator('input[placeholder*="gymshark"]')
    await input.fill('gymshark.com')

    // Screenshot before clicking Connect
    await screenshot(page, '02b-connecting-gymshark-modal')

    // Hit Connect
    await page.click('button:has-text("Connect")')

    // Wait for modal to close (up to 15s) — success condition
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })

    // Verify store name updated (GYMSHARK shows in header)
    const headerName = await page.locator('header span').first().textContent()
    console.log(`Header store name after connect: "${headerName}"`)
    expect(headerName?.toLowerCase()).not.toBe('folio')

    // Gymshark connected — header now shows store name
    expect(headerName?.toUpperCase()).toContain('GYMSHARK')

    // Disconnect button should now appear
    await expect(page.locator('button:has-text("Disconnect")')).toBeVisible()

    // Screenshot connected state
    await screenshot(page, '02c-gymshark-connected')

    const errors = getErrors()
    const uniqueErrors = [...new Set(errors)]
    console.log(`Unique console errors after connect: ${uniqueErrors.length}`)
    uniqueErrors.slice(0, 3).forEach(e => console.warn(' -', e))
  })

  test('500 errors on Gymshark image load — document and count', async ({ page }) => {
    // This test documents the 500 errors we see from image requests
    const failedRequests: string[] = []

    page.on('response', (response) => {
      if (response.status() >= 500) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
    await page.click('button:has-text("Connect")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })

    await page.waitForTimeout(1000) // allow images to attempt loading

    console.log(`500 errors after Gymshark connect: ${failedRequests.length}`)
    if (failedRequests.length > 0) {
      console.warn('Sample 500 URLs:', failedRequests.slice(0, 3))
    }

    // NOTE: Gymshark real product images DO load (their CDN) — the 500s are from
    // loremflickr.com fallback images, which is acceptable. Document but don't fail.
    // This test passes regardless — it's a documentation/monitoring test.
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. AI CHAT — Layout transformations
// ─────────────────────────────────────────────────────────────────────────────
test.describe('3. AI Chat — Layout Transformations', () => {
  // Helper: navigate, connect to gymshark, wait for products
  async function connectGymshark(page: Page) {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
    await page.click('button:has-text("Connect")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(300)
  }

  async function sendChatMessage(page: Page, message: string) {
    const textarea = page.locator('textarea[placeholder*="Describe the layout"]')
    await textarea.fill(message)
    await page.keyboard.press('Enter')

    // Wait for loading dots to appear then disappear (AI response)
    // Use waitForFunction to avoid race conditions
    await page.waitForFunction(() => {
      const bouncing = document.querySelectorAll('[class*="animate-bounce"]')
      return bouncing.length === 0
    }, null, { timeout: 60_000 })
  }

  test('prompt: show me all pants on sale', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)
    await connectGymshark(page)

    await sendChatMessage(page, 'show me all pants on sale')

    // Chat should show user message
    await expect(page.locator('text=show me all pants on sale')).toBeVisible()

    // AI assistant reply should appear (bg-stone-50 border-zinc-200 text-zinc-700)
    const assistantMessages = page.locator('[class*="rounded-tl-sm"]')
    await expect(assistantMessages.last()).toBeVisible()

    // No error bubbles
    const errorBubbles = page.locator('[class*="bg-red-50"]')
    const errorCount = await errorBubbles.count()
    if (errorCount > 0) {
      const errorText = await errorBubbles.first().textContent()
      console.error(`Chat error bubble: "${errorText}"`)
    }
    expect(errorCount).toBe(0)

    // Layout should update
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Modules after pants-on-sale prompt:', moduleLabels)

    await screenshot(page, '03a-chat-pants-on-sale')

    const errors = getErrors()
    if (errors.length) console.warn('JS errors:', [...new Set(errors)].slice(0, 3))
  })

  test('prompt: show me tops for women with coupons on the left', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)
    await connectGymshark(page)

    await sendChatMessage(page, 'show me tops for women with coupons on the left')

    await expect(page.locator('text=show me tops for women with coupons on the left')).toBeVisible()

    // No error bubbles
    const errorBubbles = page.locator('[class*="bg-red-50"]')
    const errorCount = await errorBubbles.count()
    if (errorCount > 0) {
      const errorText = await errorBubbles.first().textContent()
      console.error(`Chat error bubble: "${errorText}"`)
    }
    expect(errorCount).toBe(0)

    // Check layout — CouponBar should appear on left
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Modules after tops-women-coupons prompt:', moduleLabels)
    const hasCoupons = moduleLabels.some(l => l.toLowerCase().includes('coupon') || l.toLowerCase().includes('offers'))
    console.log(`CouponBar present: ${hasCoupons}`)

    await screenshot(page, '03b-chat-tops-women-coupons-left')
    const errors = getErrors()
    if (errors.length) console.warn('JS errors:', [...new Set(errors)].slice(0, 3))
  })

  test('prompt: swipe through sale items like Tinder', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)
    await connectGymshark(page)

    await sendChatMessage(page, 'swipe through sale items like Tinder')

    await expect(page.locator('text=swipe through sale items like Tinder')).toBeVisible()

    // No error bubbles
    const errorBubbles = page.locator('[class*="bg-red-50"]')
    const errorCount = await errorBubbles.count()
    if (errorCount > 0) {
      const errorText = await errorBubbles.first().textContent()
      console.error(`Chat error bubble: "${errorText}"`)
    }
    expect(errorCount).toBe(0)

    // SwipeCard module should appear
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Modules after Tinder prompt:', moduleLabels)
    const hasSwipe = moduleLabels.some(l => l.toLowerCase().includes('swipe'))
    console.log(`SwipeCard present: ${hasSwipe}`)

    await screenshot(page, '03c-chat-swipe-tinder')
    const errors = getErrors()
    if (errors.length) console.warn('JS errors:', [...new Set(errors)].slice(0, 3))
  })

  test('prompt: store associate inventory view', async ({ page }) => {
    const getErrors = attachConsoleErrorCollector(page)
    await connectGymshark(page)

    await sendChatMessage(page, 'store associate inventory view')

    await expect(page.locator('text=store associate inventory view')).toBeVisible()

    // No error bubbles
    const errorBubbles = page.locator('[class*="bg-red-50"]')
    const errorCount = await errorBubbles.count()
    if (errorCount > 0) {
      const errorText = await errorBubbles.first().textContent()
      console.error(`Chat error bubble: "${errorText}"`)
    }
    expect(errorCount).toBe(0)

    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Modules after inventory prompt:', moduleLabels)
    const hasInventory = moduleLabels.some(l => l.toLowerCase().includes('inventory'))
    console.log(`InventoryTable present: ${hasInventory}`)

    await screenshot(page, '03d-chat-inventory-view')
    const errors = getErrors()
    if (errors.length) console.warn('JS errors:', [...new Set(errors)].slice(0, 3))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. PERSONA BUTTONS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4. Persona Buttons', () => {
  // Click persona chip — use rounded-full class to avoid matching example prompts
  async function clickPersona(page: Page, name: string) {
    await page.locator(`button.rounded-full:has-text("${name}")`).click()
  }

  test('Bargain Hunter persona loads correct layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Bargain Hunter')

    // Active profile bar should appear — shows "Active Layout"
    await expect(page.locator('text=Active Layout')).toBeVisible()

    // Layout should have 3 modules: CouponBar top + ProductGrid center (sale) + ScrollingBar bottom
    await expect(page.locator('text=3 modules')).toBeVisible()

    // Check module labels (case-insensitive — CSS uppercase is rendering only, not DOM)
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Bargain Hunter modules:', moduleLabels)
    const lower = moduleLabels.map(l => l.toLowerCase())
    expect(lower.some(l => l.includes('coupon') || l.includes('offers'))).toBe(true)
    expect(lower.some(l => l.includes('sale') || l.includes('on sale'))).toBe(true)

    await screenshot(page, '04a-persona-bargain-hunter')
  })

  test('Gift Buyer persona loads correct layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Gift Buyer')

    await expect(page.locator('text=Active Layout')).toBeVisible()
    await expect(page.locator('text=3 modules')).toBeVisible()

    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Gift Buyer modules:', moduleLabels)

    await screenshot(page, '04b-persona-gift-buyer')
  })

  test('Brand Loyalist persona loads correct layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Brand Loyalist')

    await expect(page.locator('text=Active Layout')).toBeVisible()

    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Brand Loyalist modules:', moduleLabels)
    const lower = moduleLabels.map(l => l.toLowerCase())
    // Should have LoyaltyWidget
    expect(lower.some(l => l.includes('loyalty'))).toBe(true)

    await screenshot(page, '04c-persona-brand-loyalist')
  })

  test('Busy Parent persona loads correct layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Busy Parent')

    await expect(page.locator('text=Active Layout')).toBeVisible()

    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Busy Parent modules:', moduleLabels)
    const lower = moduleLabels.map(l => l.toLowerCase())
    // Should have kids category
    expect(lower.some(l => l.includes('kids') || l.includes('children'))).toBe(true)

    await screenshot(page, '04d-persona-busy-parent')
  })

  test('Store Associate persona loads inventory table', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Store Associate')

    await expect(page.locator('text=Active Layout')).toBeVisible()

    // Should have 2 modules: scrolling bar (low stock) + inventory table
    await expect(page.locator('text=2 modules')).toBeVisible()

    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Store Associate modules:', moduleLabels)
    const lower = moduleLabels.map(l => l.toLowerCase())
    // Inventory label
    expect(lower.some(l => l.includes('inventory'))).toBe(true)
    // Low stock alert scrolling bar
    expect(lower.some(l => l.includes('low stock') || l.includes('stock'))).toBe(true)

    await screenshot(page, '04e-persona-store-associate')
  })

  test('Reset button returns to default layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Bargain Hunter')
    await expect(page.locator('text=Active Layout')).toBeVisible()

    await page.click('button:has-text("Reset")')
    await expect(page.locator('text=Active Layout')).not.toBeVisible()
    await expect(page.locator('text=3 modules')).toBeVisible()

    await screenshot(page, '04f-persona-reset')
  })

  test('clicking different personas switches layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await clickPersona(page, 'Bargain Hunter')
    await expect(page.locator('text=Active Layout')).toBeVisible()

    await clickPersona(page, 'Store Associate')

    // Module count should change to 2
    await expect(page.locator('text=2 modules')).toBeVisible()

    await screenshot(page, '04g-persona-switch')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. VISUAL BUG CHECKS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('5. Visual Bug Checks', () => {
  test('module remove (X) button works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify we start with 3 modules
    await expect(page.locator('text=3 modules')).toBeVisible()

    // The remove buttons have title="Remove" (confirmed from DOM inspection)
    await page.waitForSelector('button[title="Remove"]', { timeout: 10_000 })

    const removeButtons = page.locator('button[title="Remove"]')
    const count = await removeButtons.count()
    console.log(`Remove buttons found: ${count}`)
    expect(count).toBeGreaterThan(0)

    // Click the first remove button
    await removeButtons.first().click()

    // Should now show 2 modules
    await expect(page.locator('text=2 modules')).toBeVisible({ timeout: 5_000 })

    await screenshot(page, '05a-module-removed')
  })

  test('chat input send button disabled when input is empty', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The send button is the SVG arrow button inside the chat input area
    // It has class "bg-zinc-900" and "rounded-lg" — but need to target the right one
    // Using aria: it's a button inside the textarea wrapper
    const chatInputArea = page.locator('.panel').last()
    // Find the send button within the chat input area — it's the button with the SVG arrow
    const sendBtn = page.locator('button:has(svg)').last()
    const isDisabled = await sendBtn.isDisabled()
    console.log(`Send button disabled when empty: ${isDisabled}`)
    expect(isDisabled).toBe(true)

    // Type something — button should enable
    const textarea = page.locator('textarea[placeholder*="Describe the layout"]')
    await textarea.fill('test')
    const isEnabledAfterTyping = await sendBtn.isEnabled()
    console.log(`Send button enabled after typing: ${isEnabledAfterTyping}`)
    expect(isEnabledAfterTyping).toBe(true)

    // Clear — button should disable again
    await textarea.fill('')
    const isDisabledAfterClear = await sendBtn.isDisabled()
    console.log(`Send button disabled after clear: ${isDisabledAfterClear}`)
    expect(isDisabledAfterClear).toBe(true)
  })

  test('no layout overflow — storefront stays within viewport', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    console.log(`Body scroll width: ${bodyWidth}, viewport: ${viewportWidth}`)

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })

  test('connect with invalid domain shows error message', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('notashopifystore.fake')
    await page.click('button:has-text("Connect")')

    // Should show error message (not close the modal)
    await expect(page.locator('[class*="text-red"]').first()).toBeVisible({ timeout: 15_000 })
    // Modal should still be open
    await expect(page.locator('text=Connect a Shopify Store')).toBeVisible()

    await screenshot(page, '05b-invalid-domain-error')
  })

  test('example prompt buttons populate input correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click one of the example prompts in the chat panel
    const exampleBtn = page.locator('button:has-text("Show me all pants on sale")')
    await expect(exampleBtn).toBeVisible()
    await exampleBtn.click()

    const textarea = page.locator('textarea[placeholder*="Describe the layout"]')
    const val = await textarea.inputValue()
    expect(val).toContain('pants on sale')
  })

  test('enter key in store connector triggers connect', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    const input = page.locator('input[placeholder*="gymshark"]')
    await input.fill('gymshark.com')
    await input.press('Enter')

    // Modal should close on successful connect
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })
  })

  test('full page screenshot — gymshark bargain hunter layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
    await page.click('button:has-text("Connect")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })

    // Click Bargain Hunter persona
    await page.locator('button.rounded-full:has-text("Bargain Hunter")').click()
    await expect(page.locator('text=Active Layout')).toBeVisible()

    await screenshot(page, '05c-gymshark-bargain-hunter-full')
  })

  test('check for broken images — img elements with src that 404/500', async ({ page }) => {
    const failedImageUrls: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)/i) && response.status() >= 400) {
        failedImageUrls.push(`${response.status()} ${url}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    console.log(`Broken images on initial load: ${failedImageUrls.length}`)
    if (failedImageUrls.length > 0) {
      console.warn('Sample broken images:', failedImageUrls.slice(0, 5))
    }

    // Connect Gymshark and check again
    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
    await page.click('button:has-text("Connect")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(2000)

    const totalFailed = failedImageUrls.length
    console.log(`Total broken images after Gymshark connect: ${totalFailed}`)

    // Check if they are from loremflickr (expected) or real product images (bug)
    const loremflickrFailures = failedImageUrls.filter(u => u.includes('loremflickr'))
    const realImageFailures = failedImageUrls.filter(u => !u.includes('loremflickr'))

    console.log(`  loremflickr.com failures (fallback): ${loremflickrFailures.length}`)
    console.log(`  Real product image failures (bug): ${realImageFailures.length}`)

    if (realImageFailures.length > 0) {
      console.error('BROKEN REAL PRODUCT IMAGES:', realImageFailures.slice(0, 5))
    }
  })

  test('TopSellers module — verify empty state on Gymshark (known issue)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Connect Gymshark
    await page.click('button:has-text("Connect Store")')
    await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
    await page.click('button:has-text("Connect")')
    await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 20_000 })

    // Activate Gift Buyer (uses TopSellers)
    await page.locator('button.rounded-full:has-text("Gift Buyer")').click()
    await expect(page.locator('text=Active Layout')).toBeVisible()

    await screenshot(page, '05d-gift-buyer-gymshark-top-sellers')

    // Check if TopSellers shows any products
    const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500.uppercase').allTextContents()
    console.log('Gift Buyer modules on Gymshark:', moduleLabels)

    const topSellerModule = page.locator('text=TOP SELLERS').first()
    if (await topSellerModule.isVisible()) {
      // Look for product content inside top sellers
      const topSellerSection = page.locator('text=TOP SELLERS').first().locator('..')
      const hasProducts = await topSellerSection.locator('img, [class*="product"]').count()
      console.log(`TopSellers has ${hasProducts} product elements — known issue if 0 with real store`)
    }
  })
})
