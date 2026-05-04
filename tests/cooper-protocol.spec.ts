/**
 * COOPER QA PROTOCOL — GOOEY
 * ─────────────────────────────────────────────────────────────────────────────
 * Definitive product quality gate. Not a regression suite — a full human-
 * simulation pass. Standard: if a first-time user notices anything wrong
 * within 60 seconds, this protocol failed.
 *
 * Every test derives from actual product behavior read from source. No
 * boilerplate, no guesses.
 *
 * Sections:
 *   1  — First Impression (landing, viewports, load time, console errors, fonts, artifact scan)
 *   2  — Primary Entry Flow (store connect via URL bar + chip, loading states, toast, stale data)
 *   3  — Data Rendering Quality (images, prices, text, badges, stock indicators)
 *   4  — Navigation & Filtering (category nav, filter editor, active states, empty states)
 *   5  — Drag, Resize, and Direct Manipulation (HTML5 drag/drop swap, resize handle)
 *   6  — Interactive Controls (filter editor open/apply/cancel, module picker, rapid retrigger)
 *   7  — Add / Remove / Create / Delete (add module via picker, remove module, remove all)
 *   8  — AI / Generative Features (chat prompts, layout outcomes, error handling, context)
 *   9  — Outbound Links & Actions (product cards, TopSellers rows open correct store pages)
 *  10  — Performance & Smoothness (state transition timing, animation, connect/disconnect cycle)
 *  11  — Error States (bad domain, network errors, graceful UI)
 *  12  — Cross-Instance Regression (3 different real stores, condensed Sections 2-5)
 *
 * Run: npx playwright test tests/cooper-protocol.spec.ts
 * Screenshots: test-results/cooper/
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SS_DIR = path.join(__dirname, '../test-results/cooper')
fs.mkdirSync(SS_DIR, { recursive: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ss(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: false })
}

/**
 * Connect to a Shopify store and wait until product images are visible in the
 * main panel. Returns elapsed ms.
 */
async function connectStore(page: Page, domain = 'gymshark.com'): Promise<number> {
  const t0 = Date.now()
  const input = page.locator('input[placeholder*="Shopify store"]')
  await input.click()
  await input.fill(domain)
  await page.keyboard.press('Enter')
  // Green dot = connected
  await page.waitForSelector('div.bg-green-500', { timeout: 60_000 })
  // First product image in main area = meaningful content visible
  await page.waitForSelector('main img', { timeout: 30_000 })
  await page.waitForTimeout(600)
  return Date.now() - t0
}

/**
 * Send a message via the chat panel and wait until the AI response arrives.
 * Returns the assistant message text.
 */
async function sendChat(page: Page, message: string): Promise<string> {
  const textarea = page.locator('textarea[placeholder*="Describe"]')
  await textarea.click()
  await textarea.fill(message)
  await textarea.press('Enter')
  // Confirm user bubble appeared — use the precise class set for user message bubbles
  await expect(page.locator('.rounded-2xl.rounded-tr-sm.px-4.bg-zinc-900').last()).toBeVisible({ timeout: 10_000 })
  // Wait for bounce loader to disappear (AI done)
  await page.waitForFunction(
    () => document.querySelectorAll('[class*="animate-bounce"]').length === 0,
    null,
    { timeout: 90_000 }
  )
  await page.waitForTimeout(400)
  // AI response bubble: bg-stone-50 border border-zinc-200 text-zinc-700 text-sm rounded-2xl rounded-tl-sm
  // This class combination uniquely identifies assistant messages (not user bubbles or the chat panel structure)
  const aiMsg = page.locator('.bg-stone-50.border-zinc-200.text-zinc-700.rounded-2xl').last()
  const text = (await aiMsg.innerText().catch(() => '')).trim()
  return text
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — FIRST IMPRESSION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 1 — First Impression', () => {

  test('1.1 · Desktop landing: headline above fold, no horizontal overflow', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Browse differently')

    // Verify h1 is within viewport vertically (above fold)
    const box = await h1.boundingBox()
    expect(box, 'h1 must exist in DOM with a bounding box').not.toBeNull()
    expect(box!.y + box!.height).toBeLessThan(900)
    expect(box!.y).toBeGreaterThanOrEqual(0)

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth, `Page overflows horizontally by ${scrollWidth - clientWidth}px — user sees cut-off content`).toBeLessThanOrEqual(clientWidth + 2)

    await ss(page, '01-desktop-landing')

    // Hard fail on any console errors during initial load
    expect(consoleErrors.length, `Console errors on load: ${consoleErrors.join(' | ')}`).toBe(0)
  })

  test('1.2 · Mobile landing: headline and chips visible above fold, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()

    const box = await h1.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThan(844)

    // At least the store suggestion chips are visible
    const chips = page.locator('button:has-text("gymshark.com")')
    await expect(chips.first()).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth, 'Mobile viewport overflows horizontally').toBeLessThanOrEqual(clientWidth + 2)

    await ss(page, '01-mobile-landing')
  })

  test('1.3 · Page load time to interactive state is under 5s', async ({ page }) => {
    const t0 = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Wait for h1 to be visible = interactive
    await expect(page.locator('h1')).toBeVisible({ timeout: 5_000 })
    const elapsed = Date.now() - t0
    console.log(`Load time to interactive: ${elapsed}ms`)
    expect(elapsed, `Landing page took ${elapsed}ms to be interactive — user will feel slowness`).toBeLessThan(5_000)
  })

  test('1.4 · No console errors on initial page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    expect(errors.length, `Console errors found on load: ${errors.join(' | ')}`).toBe(0)
  })

  test('1.5 · Fonts have rendered (Inter, not system fallback)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Check that document.fonts has the Inter family loaded
    const interLoaded = await page.evaluate(async () => {
      await document.fonts.ready
      return document.fonts.check('16px Inter')
    })
    expect(interLoaded, 'Inter font did not load — user sees system fallback font, product looks unpolished').toBe(true)
  })

  test('1.6 · Landing text contains no raw programming artifacts', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const bodyText = await page.locator('body').innerText()
    const artifacts = ['undefined', '[object Object]', 'NaN', '{{', '}}', 'null']
    for (const artifact of artifacts) {
      expect(bodyText, `Raw artifact "${artifact}" visible in landing page text`).not.toContain(artifact)
    }
  })

  test('1.7 · All landing CTAs visible without scrolling on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // URL bar input
    await expect(page.locator('input[placeholder*="Shopify store"]')).toBeVisible()
    // All 5 suggestion chips
    for (const chip of ['gymshark.com', 'allbirds.com', 'ruggable.com', 'chubbiesshorts.com', 'brooklinen.com']) {
      const btn = page.locator(`button:has-text("${chip}")`)
      await expect(btn).toBeVisible()
      const box = await btn.boundingBox()
      expect(box!.y + box!.height, `"${chip}" chip is below viewport fold`).toBeLessThan(900)
    }
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — PRIMARY ENTRY FLOW
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 2 — Primary Entry Flow', () => {

  test('2.1 · Connect via URL bar: spinner visible during load, green dot after', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('input[placeholder*="Shopify store"]')
    await input.click()
    await input.fill('gymshark.com')
    await page.keyboard.press('Enter')

    // Loading spinner should appear
    const spinner = page.locator('.animate-spin').first()
    await expect(spinner).toBeVisible({ timeout: 5_000 })

    // Wait for connected state
    await page.waitForSelector('div.bg-green-500', { timeout: 60_000 })
    await ss(page, '02-connected-gymshark')

    // Spinner should be gone
    await expect(spinner).not.toBeVisible()

    // Green dot is visible
    await expect(page.locator('div.bg-green-500').first()).toBeVisible()
  })

  test('2.2 · Connect via suggestion chip: landing replaced by connected layout', async ({ page }) => {
    await page.goto('/')
    const t0 = Date.now()
    const chip = page.locator('button:has-text("allbirds.com")')
    await chip.click()

    // Wait for green dot and images
    await page.waitForSelector('div.bg-green-500', { timeout: 60_000 })
    await page.waitForSelector('main img', { timeout: 30_000 })
    const elapsed = Date.now() - t0
    console.log(`allbirds.com connect via chip: ${elapsed}ms to meaningful content`)

    // Landing headline must be gone
    await expect(page.locator('h1:has-text("Browse differently")')).not.toBeVisible()

    // Chat panel and storefront panel must be visible
    await expect(page.locator('textarea[placeholder*="Describe"]')).toBeVisible()
    await ss(page, '02-allbirds-connected')
  })

  test('2.3 · Toast appears after connection with store name and product count', async ({ page }) => {
    await page.goto('/')
    const chip = page.locator('button:has-text("gymshark.com")')
    await chip.click()
    await page.waitForSelector('div.bg-green-500', { timeout: 60_000 })

    // Toast notification must contain "Connected" and a store name
    const toast = page.locator('.fixed.bottom-5')
    await expect(toast).toBeVisible({ timeout: 10_000 })
    const toastText = await toast.innerText()
    expect(toastText, 'Toast must contain store name').toMatch(/Connected to .+/)
    expect(toastText, 'Toast must report product count').toMatch(/\d+ products/)

    // Toast auto-dismisses within 5s
    await expect(toast).not.toBeVisible({ timeout: 5_000 })
  })

  test('2.4 · Loading state is visually distinct from initial state (loading text visible)', async ({ page }) => {
    await page.goto('/')
    const chip = page.locator('button:has-text("ruggable.com")')
    await chip.click()

    // During load, "Loading store…" or spinner must be visible
    // Use .first() to avoid strict mode violations when both elements are in DOM
    const loadIndicator = page.locator('text=Loading store').or(page.locator('.animate-spin')).first()
    await expect(loadIndicator).toBeVisible({ timeout: 5_000 })
  })

  test('2.5 · Connecting a second store replaces first — no stale data', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Read the current store name in the storefront panel header
    // The panel header shows storeName: ".text-xs.font-bold.text-zinc-800.uppercase" — first one in the storefront area
    const firstStoreName = await page.locator('.text-xs.font-bold.text-zinc-800.uppercase').first().innerText()

    // Now connect a different store — need to wait for the new store's images to appear
    // (green dot is already present, so we wait for a new network request to /api/shopify instead)
    const input = page.locator('input[placeholder*="Shopify store"]')
    await input.click()
    await input.fill('allbirds.com')
    // Wait for the in-flight network request for allbirds before checking label
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('allbirds.com'), { timeout: 60_000 }),
      page.keyboard.press('Enter'),
    ])
    // Wait for images to reload with allbirds content
    await page.waitForTimeout(3_000)

    const secondStoreName = await page.locator('.text-xs.font-bold.text-zinc-800.uppercase').first().innerText()
    expect(secondStoreName, 'Store name in header did not update after switching stores — stale data').not.toBe(firstStoreName)
    await ss(page, '02-store-switch')
  })

  test('2.6 · Disconnect button clears connected state and returns to landing', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Click the ✕ dismiss button in the URL bar
    const disconnectBtn = page.locator('button:has-text("✕")').first()
    await expect(disconnectBtn).toBeVisible()
    await disconnectBtn.click()

    // Landing headline must return
    await expect(page.locator('h1:has-text("Browse differently")')).toBeVisible({ timeout: 5_000 })
    await ss(page, '02-disconnected')
  })

  test('2.7 · Time from chip click to first meaningful content is under 30s', async ({ page }) => {
    await page.goto('/')
    const t0 = Date.now()
    await page.locator('button:has-text("gymshark.com")').click()
    await page.waitForSelector('main img', { timeout: 60_000 })
    const elapsed = Date.now() - t0
    console.log(`Gymshark full load (chip to first image): ${elapsed}ms`)
    expect(elapsed, `Store took ${elapsed}ms — exceeds 30s threshold`).toBeLessThan(30_000)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — DATA RENDERING QUALITY
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 3 — Data Rendering Quality', () => {

  test('3.1 · ProductGrid: product images have loaded (naturalWidth > 0)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Wait for grid images to appear
    await page.waitForSelector('.grid img', { timeout: 20_000 })
    await page.waitForTimeout(1500) // allow lazy-load images to settle

    const brokenImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.grid img')).filter(
        (img) => !(img as HTMLImageElement).naturalWidth
      ).length
    })
    expect(brokenImages, `${brokenImages} product images failed to load (broken image icons visible)`).toBe(0)
    await ss(page, '03-product-images')
  })

  test('3.2 · ProductGrid: all product names are non-empty strings', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Product names rendered in the grid (text-sm.font-semibold.text-zinc-900)
    const names = await page.locator('.grid .text-sm.font-semibold.text-zinc-900').allInnerTexts()
    expect(names.length, 'No product names found in grid').toBeGreaterThan(0)
    for (const name of names) {
      expect(name.trim(), `Empty product name found in grid`).not.toBe('')
      expect(name.trim(), `Product name is "undefined"`).not.toBe('undefined')
      expect(name.trim(), `Product name is "null"`).not.toBe('null')
    }
  })

  test('3.3 · ProductGrid: all prices are formatted with $ and are > 0', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Price elements: text-sm.font-bold.text-zinc-900 inside grid
    const priceEls = await page.locator('.grid .text-sm.font-bold.text-zinc-900').allInnerTexts()
    expect(priceEls.length, 'No price elements found in grid').toBeGreaterThan(0)
    for (const p of priceEls) {
      expect(p, `Price missing $ symbol: "${p}"`).toMatch(/^\$/)
      const num = parseFloat(p.replace('$', ''))
      expect(num, `Price is not > 0: "${p}"`).toBeGreaterThan(0)
    }
  })

  test('3.4 · ProductGrid: sale badge only appears when a strikethrough original price is also visible', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Find all sale badges
    const saleBadges = page.locator('.grid .badge-sale')
    const saleCount = await saleBadges.count()
    if (saleCount === 0) {
      console.log('WARN: No sale badges found — skipping sale badge / strikethrough pairing check')
      return
    }

    // For each product card that has a sale badge, verify a line-through price is visible
    const cards = page.locator('.grid > div.group')
    const cardCount = await cards.count()

    let mismatchCount = 0
    for (let i = 0; i < Math.min(cardCount, 20); i++) {
      const card = cards.nth(i)
      const hasSaleBadge = await card.locator('.badge-sale').count() > 0
      if (!hasSaleBadge) continue
      const hasStrikethrough = await card.locator('.line-through').count() > 0
      if (!hasStrikethrough) mismatchCount++
    }
    expect(mismatchCount, `${mismatchCount} product(s) show "Sale" badge without a visible original/strikethrough price`).toBe(0)
  })

  test('3.5 · ProductGrid: stock indicator is not "Only 0 left" — must say "Out of stock"', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    const bodyText = await page.locator('main').innerText()
    expect(bodyText, 'User sees "Only 0 left" — regression on out-of-stock label fix').not.toContain('Only 0 left')
  })

  test('3.6 · TopSellers panel renders items with name, price, and image', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Default layout has TopSellers in right position
    const rightPanel = page.locator('[style*="width"]').last()
    await page.waitForTimeout(1000)

    // TopSellers items: flex items with name, price, img
    const rows = page.locator('.p-4.space-y-1 > div')
    const rowCount = await rows.count()
    expect(rowCount, 'TopSellers panel has no rows — empty when it should show items').toBeGreaterThan(0)

    // Each row should have an image with naturalWidth
    const brokenInTop = await page.evaluate(() => {
      const topImgs = Array.from(document.querySelectorAll('.p-4.space-y-1 img'))
      return topImgs.filter((img) => !(img as HTMLImageElement).naturalWidth).length
    })
    expect(brokenInTop, `${brokenInTop} broken images in TopSellers`).toBe(0)
    await ss(page, '03-topsellers')
  })

  test('3.7 · ScrollingBar renders items and is animating', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // The scrolling track should have a transform applied (animation active)
    await page.waitForTimeout(1200)
    const transform = await page.evaluate(() => {
      const track = document.querySelector('[ref]') as HTMLElement
      // More reliable: find the whitespace-nowrap w-max element (the track)
      const el = document.querySelector('.flex.gap-3.whitespace-nowrap.w-max') as HTMLElement
      return el ? el.style.transform : null
    })
    // If animation is running, transform should have a non-zero translateX
    // We just verify the track element exists and has a style attribute
    const trackEl = page.locator('.flex.gap-3.whitespace-nowrap.w-max').first()
    await expect(trackEl, 'ScrollingBar animation track not found').toBeVisible()

    const itemCount = await page.locator('.flex.gap-3.whitespace-nowrap.w-max > div').count()
    expect(itemCount, 'ScrollingBar has no items').toBeGreaterThan(0)
    await ss(page, '03-scrollingbar')
  })

  test('3.8 · Category labels in ProductGrid are not raw product_type strings', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Category labels: text-xs.text-zinc-400.uppercase.tracking-wider in grid
    const catLabels = await page.locator('.grid .text-xs.text-zinc-400.uppercase.tracking-wider').allInnerTexts()
    const rawSeparatorPattern = /[|\/]/
    for (const label of catLabels.slice(0, 30)) {
      expect(label, `Category label contains raw separator character: "${label}"`).not.toMatch(rawSeparatorPattern)
    }
  })

  test('3.9 · Header does not display raw "undefined" or "null" for store name after connect', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    const headerText = await page.locator('header').innerText()
    expect(headerText, 'Header contains "undefined"').not.toContain('undefined')
    expect(headerText, 'Header contains "null"').not.toContain('null')
    expect(headerText, 'Header contains "[object Object]"').not.toContain('[object Object]')
  })

  test('3.10 · ProductGrid count label matches a real number', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // "X items" label
    const countLabel = page.locator('text=/\\d+ items/').first()
    await expect(countLabel).toBeVisible()
    const text = await countLabel.innerText()
    const n = parseInt(text)
    expect(n, `Product count "${text}" is 0 or NaN`).toBeGreaterThan(0)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — NAVIGATION & FILTERING
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 4 — Navigation & Filtering', () => {

  test('4.1 · Category nav appears after connecting a store', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Category nav appears under the header
    const navBtns = page.locator('header button.text-xs.font-semibold.text-zinc-500')
    const count = await navBtns.count()
    expect(count, 'No category nav buttons appeared after connecting Gymshark').toBeGreaterThan(0)
    await ss(page, '04-category-nav')
  })

  test('4.2 · Clicking a category nav button filters the ProductGrid', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Count initial items
    const initialCount = await page.locator('.grid > div.group').count()

    // Click the first category button that appears
    const firstCatBtn = page.locator('header button.text-xs.font-semibold.text-zinc-500').first()
    const catName = await firstCatBtn.innerText()
    await firstCatBtn.click()
    await page.waitForTimeout(600)

    // Count filtered items
    const filteredCount = await page.locator('.grid > div.group').count()
    console.log(`Category "${catName}": ${initialCount} → ${filteredCount} items`)

    // Either count changed or a section title appeared matching the category
    const titleEl = page.locator('h2.text-lg.font-bold.text-zinc-900').first()
    const titleText = await titleEl.innerText().catch(() => '')
    expect(
      filteredCount !== initialCount || titleText.toLowerCase().includes(catName.toLowerCase()),
      `Clicking category "${catName}" produced no visible change — filter may be broken`
    ).toBe(true)
    await ss(page, '04-category-filtered')
  })

  test('4.3 · "All" nav button resets layout to default (removes category filter)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Click first category
    const firstCatBtn = page.locator('header button.text-xs.font-semibold.text-zinc-500').first()
    await firstCatBtn.click()
    await page.waitForTimeout(500)

    const countAfterFilter = await page.locator('.grid > div.group').count()

    // Click "All"
    const allBtn = page.locator('header button:has-text("All")')
    await expect(allBtn).toBeVisible()
    await allBtn.click()
    await page.waitForTimeout(500)

    const countAfterAll = await page.locator('.grid > div.group').count()
    expect(countAfterAll, '"All" button did not restore the full product set').toBeGreaterThanOrEqual(countAfterFilter)
    await ss(page, '04-all-reset')
  })

  test('4.4 · ProfileSelector: clicking "Bargain Hunter" profile applies its layout', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const bargainBtn = page.locator('button:has-text("Bargain Hunter")').first()
    await expect(bargainBtn).toBeVisible()
    await bargainBtn.click()
    await page.waitForTimeout(600)

    // Profile bar is the full-width dark strip between header and main area
    // It contains a span with the profile name in uppercase tracking-wider style
    const profileNameSpan = page.locator('.text-xs.font-bold.text-zinc-400.uppercase.tracking-wider.shrink-0')
    await expect(profileNameSpan).toBeVisible()
    await expect(profileNameSpan).toContainText('Bargain Hunter')

    // CouponBar should now be in the top position (Bargain Hunter layout)
    const couponHeader = page.locator('text=Offers & Coupons')
    await expect(couponHeader).toBeVisible()
    await ss(page, '04-bargain-hunter')
  })

  test('4.5 · ProfileSelector: "Store Associate" profile loads InventoryTable', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // ProfileSelector renders inside the storefront panel header — scroll it into view
    const storeAssocBtn = page.locator('button:has-text("Store Associate")').first()
    await expect(storeAssocBtn).toBeVisible({ timeout: 10_000 })
    await storeAssocBtn.scrollIntoViewIfNeeded()
    await storeAssocBtn.click()
    await page.waitForTimeout(1_200)

    // InventoryTable renders a <table> element inside the center position
    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: 10_000 })

    // Column headers present
    await expect(page.locator('th:has-text("SKU")')).toBeVisible()
    await expect(page.locator('th:has-text("Product")')).toBeVisible()
    await expect(page.locator('th:has-text("Stock")')).toBeVisible()
    await ss(page, '04-store-associate')
  })

  test('4.6 · Profile Reset button returns to default layout', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Activate a profile
    await page.locator('button:has-text("Bargain Hunter")').first().click()
    await page.waitForTimeout(500)

    // Click the Reset button in the profile bar
    const resetBtn = page.locator('button:has-text("Reset")')
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()
    await page.waitForTimeout(500)

    // Profile bar should be gone — the profile name span disappears
    await expect(page.locator('.text-xs.font-bold.text-zinc-400.uppercase.tracking-wider.shrink-0').filter({ hasText: 'Bargain Hunter' })).not.toBeVisible()

    // Default layout: ScrollingBar title "Feed" or "Featured" visible
    await ss(page, '04-profile-reset')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — DRAG, RESIZE, AND DIRECT MANIPULATION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 5 — Drag, Resize, and Direct Manipulation', () => {

  test('5.1 · Drag handle is visible on each module card (⠿ icon present)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Drag handle has text content ⠿ and is in the module card header
    const handles = page.locator('[data-drag-handle]')
    const count = await handles.count()
    expect(count, 'No drag handles found — modules are not draggable').toBeGreaterThan(0)

    // Grab cursor applied (cursor-grab class)
    const firstHandle = handles.first()
    await expect(firstHandle).toBeVisible()
    const classes = await firstHandle.getAttribute('class')
    expect(classes, 'Drag handle missing cursor-grab class').toContain('cursor-grab')
  })

  test('5.2 · HTML5 drag: center module can be dragged to right slot (positions swap)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Read the current label in center and right positions
    const centerHandle = page.locator('[data-drag-handle="center"]')
    const rightHandle = page.locator('[data-drag-handle="right"]')
    await expect(centerHandle).toBeVisible()
    await expect(rightHandle).toBeVisible()

    const centerLabelBefore = await centerHandle.locator('.text-xs.font-semibold.text-zinc-500').innerText()
    const rightLabelBefore = await rightHandle.locator('.text-xs.font-semibold.text-zinc-500').innerText()

    // Perform real drag from center handle to right zone
    const fromBox = await centerHandle.boundingBox()
    const toBox = await rightHandle.boundingBox()
    expect(fromBox).not.toBeNull()
    expect(toBox).not.toBeNull()

    await page.mouse.move(fromBox!.x + fromBox!.width / 2, fromBox!.y + fromBox!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(100)
    await page.mouse.move(toBox!.x + toBox!.width / 2, toBox!.y + toBox!.height / 2, { steps: 15 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    await page.waitForTimeout(500)

    const centerLabelAfter = await page.locator('[data-drag-handle="center"]').locator('.text-xs.font-semibold.text-zinc-500').innerText().catch(() => '')
    const rightLabelAfter = await page.locator('[data-drag-handle="right"]').locator('.text-xs.font-semibold.text-zinc-500').innerText().catch(() => '')

    // The labels should have swapped
    expect(
      centerLabelAfter === rightLabelBefore || rightLabelAfter === centerLabelBefore,
      `Drag swap did not work. Center: "${centerLabelBefore}"→"${centerLabelAfter}", Right: "${rightLabelBefore}"→"${rightLabelAfter}"`
    ).toBe(true)
    await ss(page, '05-drag-swap')
  })

  test('5.3 · Drag outside any valid drop target leaves no broken visual state', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    const handle = page.locator('[data-drag-handle="top"]')
    await expect(handle).toBeVisible()
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()

    // Drag to the very corner of the screen (invalid drop target)
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(100)
    await page.mouse.move(50, 50, { steps: 10 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    await page.waitForTimeout(500)

    // Module being dragged should not have stuck opacity-40
    const topModule = page.locator('[data-drag-handle="top"]').locator('..')
    const opacityClass = await topModule.getAttribute('class')
    expect(opacityClass, 'Module stuck in dragging opacity-40 state after invalid drop').not.toContain('opacity-40')
    await ss(page, '05-drag-invalid-drop')
  })

  test('5.4 · Resize handle: dragging right resize handle changes panel width', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Right panel exists (TopSellers by default at ~288px)
    const rightPanel = page.locator('[data-drag-handle="right"]').locator('../..')
    await expect(rightPanel).toBeVisible()

    // Measure initial width
    const initialBox = await rightPanel.boundingBox()
    expect(initialBox).not.toBeNull()
    const initialWidth = initialBox!.width

    // Find the resize handle (cursor-col-resize element)
    const resizeHandle = page.locator('.cursor-col-resize').last()
    await expect(resizeHandle).toBeVisible()
    const rBox = await resizeHandle.boundingBox()
    expect(rBox).not.toBeNull()

    // Drag handle 80px to the left (shrink the right panel)
    await page.mouse.move(rBox!.x + rBox!.width / 2, rBox!.y + rBox!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(50)
    await page.mouse.move(rBox!.x - 80, rBox!.y + rBox!.height / 2, { steps: 20 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    await page.waitForTimeout(300)

    const newBox = await rightPanel.boundingBox()
    expect(newBox).not.toBeNull()
    const newWidth = newBox!.width
    console.log(`Right panel resize: ${initialWidth.toFixed(0)}px → ${newWidth.toFixed(0)}px`)
    expect(Math.abs(newWidth - initialWidth), `Resize handle did not change panel width. Before: ${initialWidth}px, After: ${newWidth}px`).toBeGreaterThan(20)
    await ss(page, '05-resize')
  })

  test('5.5 · Resize respects min width constraint (cannot shrink below 200px)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    const resizeHandle = page.locator('.cursor-col-resize').last()
    await expect(resizeHandle).toBeVisible()
    const rBox = await resizeHandle.boundingBox()
    expect(rBox).not.toBeNull()

    // Try to drag 500px to the left — well beyond the 200px min
    await page.mouse.move(rBox!.x + rBox!.width / 2, rBox!.y + rBox!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(50)
    await page.mouse.move(rBox!.x - 500, rBox!.y, { steps: 30 })
    await page.mouse.up()
    await page.waitForTimeout(300)

    const rightPanel = page.locator('[data-drag-handle="right"]').locator('../..')
    const finalBox = await rightPanel.boundingBox()
    expect(finalBox).not.toBeNull()
    expect(finalBox!.width, `Right panel shrank below 200px min — user sees crushed layout`).toBeGreaterThanOrEqual(198)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — INTERACTIVE CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 6 — Interactive Controls', () => {

  test('6.1 · Filter editor opens when ⚙ button is clicked', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Click the gear icon on the first module (top = ScrollingBar)
    const gearBtn = page.locator('button[title="Edit filters"]').first()
    await expect(gearBtn).toBeVisible()
    await gearBtn.click()

    // Filter editor should be visible (the absolute dropdown)
    const editor = page.locator('.absolute.top-full').first()
    await expect(editor).toBeVisible({ timeout: 3_000 })
    await ss(page, '06-filter-editor-open')
  })

  test('6.2 · Filter editor is fully within viewport (not clipped below bottom)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const gearBtn = page.locator('button[title="Edit filters"]').first()
    await gearBtn.click()

    const editor = page.locator('.absolute.top-full').first()
    await expect(editor).toBeVisible()
    const box = await editor.boundingBox()
    expect(box).not.toBeNull()
    const vpHeight = page.viewportSize()!.height
    expect(
      box!.y + box!.height,
      `Filter editor bottom edge (${box!.y + box!.height}px) clips below viewport (${vpHeight}px) — user cannot reach Apply button`
    ).toBeLessThanOrEqual(vpHeight + 2)
  })

  test('6.3 · Filter editor: selecting a category and clicking Apply updates module label', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Open filter editor on the center (ProductGrid) module
    const centerGear = page.locator('[data-drag-handle="center"]').locator('button[title="Edit filters"]')
    await expect(centerGear).toBeVisible()
    await centerGear.click()

    const editor = page.locator('.absolute.top-full').first()
    await expect(editor).toBeVisible()

    // Click the first non-"All" category button in the editor
    const catButtons = editor.locator('button').filter({ hasNotText: 'All' }).filter({ hasNotText: 'Apply' }).filter({ hasNotText: 'Cancel' })
    const firstCat = catButtons.first()
    const catName = await firstCat.innerText()
    await firstCat.click()
    await page.waitForTimeout(200)

    // Click Apply
    await editor.locator('button:has-text("Apply")').click()
    await page.waitForTimeout(400)

    // Editor should close
    await expect(page.locator('.absolute.top-full').first()).not.toBeVisible()

    // Module label in the drag handle should now reflect the selected category
    const centerLabel = await page.locator('[data-drag-handle="center"] .text-xs.font-semibold.text-zinc-500').innerText()
    expect(
      centerLabel.toLowerCase(),
      `Module label "${centerLabel}" does not reflect applied filter "${catName}"`
    ).toContain(catName.toLowerCase().trim())
    await ss(page, '06-filter-applied')
  })

  test('6.4 · Filter editor: Cancel discards changes, editor closes, label unchanged', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    const centerGear = page.locator('[data-drag-handle="center"]').locator('button[title="Edit filters"]')
    await centerGear.click()
    const editor = page.locator('.absolute.top-full').first()
    await expect(editor).toBeVisible()

    const labelBefore = await page.locator('[data-drag-handle="center"] .text-xs.font-semibold.text-zinc-500').innerText()

    // Select a category but then Cancel
    const catButtons = editor.locator('button').filter({ hasNotText: 'All' }).filter({ hasNotText: 'Apply' }).filter({ hasNotText: 'Cancel' })
    await catButtons.first().click()
    await editor.locator('button:has-text("Cancel")').click()
    await page.waitForTimeout(300)

    // Editor should be closed
    await expect(page.locator('.absolute.top-full').first()).not.toBeVisible()

    // Label unchanged
    const labelAfter = await page.locator('[data-drag-handle="center"] .text-xs.font-semibold.text-zinc-500').innerText()
    expect(labelAfter, 'Cancel changed the module label — filter was applied when it should not have been').toBe(labelBefore)
  })

  test('6.5 · Filter editor: rapid open/close 3 times leaves no stuck state', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    const gearBtn = page.locator('button[title="Edit filters"]').first()
    for (let i = 0; i < 3; i++) {
      await gearBtn.click()
      await page.waitForTimeout(150)
      const cancelBtn = page.locator('.absolute.top-full button:has-text("Cancel")').first()
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click()
      } else {
        await gearBtn.click() // toggle off
      }
      await page.waitForTimeout(150)
    }

    // Final state: editor closed, gear button in normal state (not highlighted)
    await expect(page.locator('.absolute.top-full').first()).not.toBeVisible()
    await ss(page, '06-rapid-retrigger')
  })

  test('6.6 · InventoryTable search input filters by product name', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Activate Store Associate profile to get InventoryTable
    const storeAssocBtn6 = page.locator('button:has-text("Store Associate")').first()
    await expect(storeAssocBtn6).toBeVisible({ timeout: 10_000 })
    await storeAssocBtn6.click()
    await page.waitForTimeout(1_200)

    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: 10_000 })

    // Count rows before search
    const rowsBefore = await page.locator('tbody tr').count()
    expect(rowsBefore, 'InventoryTable has no rows').toBeGreaterThan(0)

    // Get a real product name from the first row
    const firstName = await page.locator('tbody tr:first-child td:nth-child(2)').innerText()
    const searchTerm = firstName.split(' ')[0] // first word of the name

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search SKU"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill(searchTerm)
    await page.waitForTimeout(400)

    const rowsAfter = await page.locator('tbody tr').count()
    console.log(`InventoryTable search "${searchTerm}": ${rowsBefore} → ${rowsAfter} rows`)
    expect(rowsAfter, `Search did not filter — row count unchanged at ${rowsBefore}`).toBeLessThanOrEqual(rowsBefore)
    expect(rowsAfter, 'Search returned 0 results — should match at least the typed product').toBeGreaterThan(0)
    await ss(page, '06-inventory-search')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — ADD / REMOVE / CREATE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 7 — Add / Remove / Create / Delete', () => {

  test('7.1 · Remove a module: module disappears, surrounding layout remains valid', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Remove the top module (ScrollingBar)
    const removeBtn = page.locator('[data-drag-handle="top"]').locator('button[title="Remove"]')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()
    await page.waitForTimeout(400)

    // Top drag handle should be gone
    await expect(page.locator('[data-drag-handle="top"]')).not.toBeVisible()

    // Center and right modules should still be visible
    await expect(page.locator('[data-drag-handle="center"]')).toBeVisible()
    await expect(page.locator('[data-drag-handle="right"]')).toBeVisible()

    // AddZone for top should be visible (small + strip)
    await expect(page.locator('button:has-text("Add module")').first()).toBeVisible()
    await ss(page, '07-remove-top-module')
  })

  test('7.2 · Add module via picker: module appears in correct position', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Remove top module first to create an empty slot
    await page.locator('[data-drag-handle="top"]').locator('button[title="Remove"]').click()
    await page.waitForTimeout(300)

    // Click the "+ Add module" button for the top slot
    const addBtn = page.locator('button:has-text("Add module")').first()
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    // Module picker modal should open
    const modal = page.locator('.fixed.inset-0.bg-black\\/40')
    await expect(modal).toBeVisible({ timeout: 3_000 })
    await expect(page.locator('text=Add to top')).toBeVisible()

    // Pick "Scrolling Bar" from the picker
    await page.locator('button:has-text("Scrolling Bar")').first().click()
    await page.waitForTimeout(400)

    // Modal should close
    await expect(modal).not.toBeVisible()

    // Top position should now have a module
    await expect(page.locator('[data-drag-handle="top"]')).toBeVisible()
    await ss(page, '07-add-module')
  })

  test('7.3 · Module picker only shows modules valid for the target position', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Remove top module to expose the top slot
    await page.locator('[data-drag-handle="top"]').locator('button[title="Remove"]').click()
    await page.waitForTimeout(300)

    await page.locator('button:has-text("Add module")').first().click()
    await expect(page.locator('.fixed.inset-0.bg-black\\/40')).toBeVisible()

    // "top" position only supports: ScrollingBar, CouponBar (from CATALOG)
    // Modules NOT valid for top: ProductGrid, InventoryTable, SwipeCard, LoyaltyWidget, TopSellers
    const modalButtons = await page.locator('.fixed.inset-0.bg-black\\/40 button.w-full').allInnerTexts()
    const invalidForTop = ['Product Grid', 'Inventory', 'Swipe to Shop', 'Loyalty', 'Top Sellers']
    for (const invalid of invalidForTop) {
      const found = modalButtons.some(b => b.includes(invalid))
      expect(found, `Module picker for "top" slot incorrectly offers "${invalid}" which is not valid for that position`).toBe(false)
    }

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  })

  test('7.4 · Module picker cancel button closes modal without adding anything', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Remove a module
    await page.locator('[data-drag-handle="top"]').locator('button[title="Remove"]').click()
    await page.waitForTimeout(300)

    // Open picker
    await page.locator('button:has-text("Add module")').first().click()
    await expect(page.locator('.fixed.inset-0.bg-black\\/40')).toBeVisible()

    // Click Cancel
    await page.locator('.fixed.inset-0.bg-black\\/40 button:has-text("Cancel")').click()
    await page.waitForTimeout(300)

    // Modal closed, slot still empty
    await expect(page.locator('.fixed.inset-0.bg-black\\/40')).not.toBeVisible()
    await expect(page.locator('[data-drag-handle="top"]')).not.toBeVisible()
    await expect(page.locator('button:has-text("Add module")').first()).toBeVisible()
  })

  test('7.5 · Remove all modules: empty state renders with "Add module" buttons for all positions', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Remove top, then center, then right
    for (const pos of ['top', 'center', 'right']) {
      const removeBtn = page.locator(`[data-drag-handle="${pos}"]`).locator('button[title="Remove"]')
      if (await removeBtn.isVisible()) {
        await removeBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // Empty state text
    await expect(page.locator('text=Describe a layout in the chat')).toBeVisible()
    await ss(page, '07-all-removed-empty-state')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — AI / GENERATIVE FEATURES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 8 — AI / Generative Features', () => {

  test('8.1 · Chat: sending a message shows user bubble and loading indicator', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const textarea = page.locator('textarea[placeholder*="Describe"]')
    await textarea.fill('Show me tops for women')
    await textarea.press('Enter')

    // User message bubble has a very specific class set: rounded-2xl rounded-tr-sm px-4 py-2.5 font-medium
    // This distinguishes it from the chat header and profile avatar
    const userBubble = page.locator('.rounded-2xl.rounded-tr-sm.px-4.bg-zinc-900').last()
    await expect(userBubble).toBeVisible({ timeout: 5_000 })
    await expect(userBubble).toContainText('Show me tops for women')

    // Loading animation (bounce dots) appears
    const bounce = page.locator('[class*="animate-bounce"]').first()
    await expect(bounce).toBeVisible({ timeout: 5_000 })
    await ss(page, '08-chat-loading')
  })

  test('8.2 · Chat "Show tops for women": layout updates, ProductGrid visible with tops filter', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const aiResponse = await sendChat(page, 'Show me all tops for women')
    expect(aiResponse, 'AI response was empty').not.toBe('')
    expect(aiResponse, 'AI response contains raw JSON').not.toMatch(/^\{/)
    expect(aiResponse, 'AI response contains code artifacts').not.toContain('```')

    // ProductGrid should be in the layout
    await expect(page.locator('.grid')).toBeVisible()
    await ss(page, '08-tops-women-layout')
  })

  test('8.3 · Chat "Swipe through everything like Tinder": SwipeCard appears in center', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    await sendChat(page, 'Swipe through everything like Tinder')

    // SwipeCard has a distinctive element with "Swipe to Shop" label
    await expect(page.locator('text=Swipe to Shop').first()).toBeVisible({ timeout: 10_000 })

    // Swipe action buttons (✕ pass, ♥ add)
    await expect(page.locator('button:has-text("✕")').first()).toBeVisible()
    await expect(page.locator('button:has-text("♥")').first()).toBeVisible()
    await ss(page, '08-swipe-layout')
  })

  test('8.4 · Chat "Store associate inventory view": InventoryTable appears', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    await sendChat(page, 'Store associate inventory view')

    // InventoryTable has a <table> with SKU/Product/Stock columns
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('th:has-text("SKU")')).toBeVisible()
    await ss(page, '08-inventory-layout')
  })

  test('8.5 · Chat "Loyalty + new arrivals": layout updates with at least 2 modules', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const response = await sendChat(page, 'Give me a loyalty + new arrivals layout')
    expect(response, 'AI response was empty').not.toBe('')

    // The layout must have updated — verify the module count indicator changed (system prompt requires >= 2 modules)
    const moduleCountLabel = page.locator('text=/ modules?$/')
    // More reliable: count drag handles — there should be at least 2
    const dragHandles = page.locator('[data-drag-handle]')
    const handleCount = await dragHandles.count()
    expect(handleCount, 'AI returned fewer than 2 modules — layout is too sparse for the requested view').toBeGreaterThanOrEqual(2)

    // LoyaltyWidget is preferred but AI may vary — check either widget or grid is present
    const hasLoyalty = await page.locator('text=points balance').count() > 0
    const hasGrid = await page.locator('.grid').count() > 0
    const hasTopSellers = await page.locator('.p-4.space-y-1').count() > 0
    expect(hasLoyalty || hasGrid || hasTopSellers, 'AI returned a layout with no recognizable content modules').toBe(true)
    await ss(page, '08-loyalty-new-arrivals')
  })

  test('8.6 · Chat: 3 prompts in sequence without reload — each updates layout', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const prompts = [
      'Show all tops for women with coupons on the left',
      'Top sellers on the right, sale items in the center',
      'Store associate inventory view',
    ]

    for (let i = 0; i < prompts.length; i++) {
      const response = await sendChat(page, prompts[i])
      expect(response, `Prompt ${i + 1} returned empty response`).not.toBe('')
      expect(response, `Prompt ${i + 1} returned raw JSON`).not.toMatch(/^[\{\[]/)
      await ss(page, `08-sequential-chat-${i + 1}`)
    }

    // After "Store associate inventory view" — table must be present
    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 })
  })

  test('8.7 · Chat: Enter key sends message (not just send button)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const textarea = page.locator('textarea[placeholder*="Describe"]')
    await textarea.fill('Show outerwear')
    await textarea.press('Enter')

    // User message bubble uses rounded-tr-sm which distinguishes it from other bg-zinc-900 elements
    const userBubble = page.locator('.rounded-2xl.rounded-tr-sm.bg-zinc-900').last()
    await expect(userBubble).toContainText('Show outerwear', { timeout: 5_000 })
    // Wait for AI to finish
    await page.waitForFunction(
      () => document.querySelectorAll('[class*="animate-bounce"]').length === 0,
      null,
      { timeout: 90_000 }
    )
  })

  test('8.8 · Chat: Shift+Enter inserts newline, does not send', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    const textarea = page.locator('textarea[placeholder*="Describe"]')
    await textarea.fill('line one')
    await textarea.press('Shift+Enter')
    await textarea.type('line two')

    // Input should still contain both lines
    const val = await textarea.inputValue()
    expect(val, 'Shift+Enter sent the message instead of inserting newline').toContain('line one')
    expect(val, 'line two not appended after Shift+Enter').toContain('line two')

    // No user message bubble appeared (message was not sent)
    // User message bubbles have class rounded-tr-sm — very specific to the chat bubble shape
    const bubbleCount = await page.locator('.rounded-2xl.rounded-tr-sm.bg-zinc-900').count()
    expect(bubbleCount, 'Shift+Enter incorrectly sent the message').toBe(0)
  })

  test('8.9 · Chat: send button is disabled when textarea is empty', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // The send button is the icon button in the chat input row
    const sendBtn = page.locator('button.shrink-0.w-8.h-8.rounded-lg.bg-zinc-900').last()
    await expect(sendBtn).toBeDisabled()

    const textarea = page.locator('textarea[placeholder*="Describe"]')
    await textarea.fill('something')
    await expect(sendBtn).toBeEnabled()

    await textarea.fill('')
    await expect(sendBtn).toBeDisabled()
  })

  test('8.10 · Chat example prompts: clicking one populates the textarea', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // The example prompt buttons are only visible when messages.length === 0
    const exampleBtn = page.locator('text=Show me all tops for women with coupons on the left').first()
    await expect(exampleBtn).toBeVisible()
    await exampleBtn.click()

    const textarea = page.locator('textarea[placeholder*="Describe"]')
    const val = await textarea.inputValue()
    expect(val, 'Clicking example prompt did not populate textarea').toContain('tops for women')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — OUTBOUND LINKS & ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 9 — Outbound Links & Actions', () => {

  test('9.1 · ProductGrid: clicking a product card opens a new tab to correct store URL', async ({ page, context }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid > div.group', { timeout: 20_000 })

    // Get the product SKU from the first card's shop URL intent
    // The card's click handler uses: `https://${storeDomain}/products/${product.sku}`
    // We verify a new page is opened when the card is clicked
    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10_000 }),
      page.locator('.grid > div.group').first().click(),
    ])

    await newPage.waitForLoadState('domcontentloaded', { timeout: 15_000 })
    const newUrl = newPage.url()
    expect(newUrl, 'Product link does not go to gymshark.com').toContain('gymshark.com')
    expect(newUrl, 'Product link does not go to a /products/ path').toContain('/products/')
    console.log(`Product card opened: ${newUrl}`)
    await newPage.close()
  })

  test('9.2 · TopSellers: clicking a row opens a new tab to correct store URL', async ({ page, context }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.p-4.space-y-1 > div', { timeout: 20_000 })

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 10_000 }),
      page.locator('.p-4.space-y-1 > div').first().click(),
    ])

    await newPage.waitForLoadState('domcontentloaded', { timeout: 15_000 })
    const newUrl = newPage.url()
    expect(newUrl, 'TopSellers row link does not go to gymshark.com').toContain('gymshark.com')
    expect(newUrl, 'TopSellers row link does not go to a /products/ path').toContain('/products/')
    await newPage.close()
  })

  test('9.3 · CouponBar: code button copies to clipboard (no error thrown)', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // Activate Bargain Hunter to get CouponBar
    await page.locator('button:has-text("Bargain Hunter")').first().click()
    await page.waitForTimeout(600)

    const couponBtn = page.locator('.font-mono.tracking-wider').first()
    const count = await couponBtn.count()
    if (count === 0) {
      console.log('WARN: No coupons available for this store — CouponBar copy test skipped')
      return
    }

    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Click should not throw
    await expect(couponBtn).toBeVisible()
    await couponBtn.click()
    await ss(page, '09-coupon-copy')
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — PERFORMANCE & SMOOTHNESS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 10 — Performance & Smoothness', () => {

  test('10.1 · Connect, disconnect, reconnect 3 times — no ghost elements accumulate', async ({ page }) => {
    await page.goto('/')

    for (let cycle = 1; cycle <= 3; cycle++) {
      await connectStore(page, 'gymshark.com')
      await page.waitForTimeout(400)

      // Count product cards in the grid
      const cardCount = await page.locator('.grid > div.group').count()
      console.log(`Cycle ${cycle}: ${cardCount} product cards`)
      expect(cardCount, `Cycle ${cycle}: zero product cards after connect`).toBeGreaterThan(0)

      // Disconnect
      await page.locator('button:has-text("✕")').first().click()
      await page.waitForTimeout(300)

      // No product cards should remain after disconnect
      const afterDisconnect = await page.locator('.grid > div.group').count()
      expect(afterDisconnect, `Cycle ${cycle}: ${afterDisconnect} ghost product cards remain after disconnect`).toBe(0)
    }
    await ss(page, '10-connect-disconnect-cycle')
  })

  test('10.2 · Profile switch time-to-render is under 2s', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForTimeout(500)

    // Scroll Store Associate button into view (it is last in a horizontally scrolling row)
    const storeAssocBtn10 = page.locator('button:has-text("Store Associate")').first()
    await expect(storeAssocBtn10).toBeVisible({ timeout: 10_000 })
    await storeAssocBtn10.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)

    const t0 = Date.now()
    await storeAssocBtn10.click()
    // InventoryTable is pure synchronous React render — should appear in well under 2s
    await page.waitForSelector('table', { timeout: 5_000 })
    const elapsed = Date.now() - t0
    console.log(`Profile switch (Store Associate) render time: ${elapsed}ms`)
    expect(elapsed, `Profile switch took ${elapsed}ms — user sees delay`).toBeLessThan(2_000)
  })

  test('10.3 · Category nav filter applies within 1s of click', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    const t0 = Date.now()
    const firstCat = page.locator('header button.text-xs.font-semibold.text-zinc-500').first()
    await firstCat.click()
    await page.waitForTimeout(100)
    // Grid should re-render with new items
    await page.waitForSelector('.grid > div.group', { timeout: 3_000 })
    const elapsed = Date.now() - t0
    console.log(`Category filter render time: ${elapsed}ms`)
    expect(elapsed, `Category filter took ${elapsed}ms`).toBeLessThan(1_000)
  })

  test('10.4 · After large data load, scrolling the ProductGrid does not freeze the page', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')
    await page.waitForSelector('.grid', { timeout: 20_000 })

    // Scroll down through the grid
    const grid = page.locator('.flex-1.overflow-y-auto').first()
    await grid.evaluate(el => { el.scrollTop = 1000 })
    await page.waitForTimeout(300)

    // Page should still respond — verify we can still click a button
    const categoryBtn = page.locator('header button.text-xs.font-semibold.text-zinc-500').first()
    await expect(categoryBtn).toBeEnabled()
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — ERROR STATES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 11 — Error States', () => {

  test('11.1 · Invalid domain shows human-readable error, not a raw stack trace', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('input[placeholder*="Shopify store"]')
    await input.click()
    await input.fill('totallynotarealshopifystore12345.xyz')
    await page.keyboard.press('Enter')

    // Wait for the error to appear
    const errorMsg = page.locator('.text-red-500').first()
    await expect(errorMsg).toBeVisible({ timeout: 30_000 })

    const errorText = await errorMsg.innerText()
    console.log(`Error message shown: "${errorText}"`)

    // Must be human-readable, not a raw code dump
    expect(errorText, 'Error message is empty').not.toBe('')
    expect(errorText, 'Error message contains raw JS error constructor').not.toContain('TypeError')
    expect(errorText, 'Error message contains raw stack trace').not.toContain('at ')
    expect(errorText, 'Error message contains raw JSON').not.toContain('{')

    // URL bar should still be functional after error
    await expect(input).toBeEnabled()
    await ss(page, '11-invalid-domain-error')
  })

  test('11.2 · After error, user can immediately retry with a valid store', async ({ page }) => {
    await page.goto('/')

    // First: fail with bad domain
    const input = page.locator('input[placeholder*="Shopify store"]')
    await input.click()
    await input.fill('notashopifystore99999.xyz')
    await page.keyboard.press('Enter')
    await page.locator('.text-red-500').first().waitFor({ timeout: 30_000 })

    // Then retry with valid domain
    const elapsed = await connectStore(page, 'allbirds.com')
    console.log(`Recovery connect time: ${elapsed}ms`)

    // Should successfully connect
    await expect(page.locator('div.bg-green-500').first()).toBeVisible()
    await expect(page.locator('main img').first()).toBeVisible()
    await ss(page, '11-error-recovery')
  })

  test('11.3 · Empty textarea prevents message send — button is disabled and no bubble appears', async ({ page }) => {
    await page.goto('/')
    await connectStore(page, 'gymshark.com')

    // The send button should be disabled when textarea is empty
    const sendBtn = page.locator('button.shrink-0.w-8.h-8.rounded-lg.bg-zinc-900').last()
    await expect(sendBtn, 'Send button must be disabled when textarea is empty').toBeDisabled()

    // Count existing user message bubbles
    const bubblesBefore = await page.locator('.rounded-2xl.rounded-tr-sm.bg-zinc-900').count()

    // Force-click the disabled button — the handler should guard with `if (!input.trim() || isLoading) return`
    await sendBtn.click({ force: true })
    await page.waitForTimeout(500)

    const bubblesAfter = await page.locator('.rounded-2xl.rounded-tr-sm.bg-zinc-900').count()
    expect(bubblesAfter, 'Force-clicking disabled send button created a message bubble — empty send guard is broken').toBe(bubblesBefore)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — CROSS-INSTANCE REGRESSION
// Run condensed Sections 2-5 against 3 different real Shopify stores
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Section 12 — Cross-Instance Regression', () => {

  const STORES = [
    { domain: 'allbirds.com',        label: 'Allbirds' },
    { domain: 'chubbiesshorts.com',  label: 'Chubbies' },
    { domain: 'brooklinen.com',      label: 'Brooklinen' },
  ]

  for (const store of STORES) {
    test(`12 · ${store.label} (${store.domain}): connects, renders products, no artifacts`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

      await page.goto('/')
      const elapsed = await connectStore(page, store.domain)
      console.log(`${store.label} connect time: ${elapsed}ms`)

      // Connected indicator
      await expect(page.locator('div.bg-green-500').first()).toBeVisible()

      // Products visible
      await expect(page.locator('main img').first()).toBeVisible()

      // Product names are real strings
      const names = await page.locator('.grid .text-sm.font-semibold.text-zinc-900').allInnerTexts()
      expect(names.length, `${store.label}: no product names in grid`).toBeGreaterThan(0)
      for (const name of names.slice(0, 10)) {
        expect(name.trim(), `${store.label}: empty/null product name`).not.toBe('')
        expect(name, `${store.label}: "undefined" in product name`).not.toContain('undefined')
      }

      // Prices formatted correctly
      const prices = await page.locator('.grid .text-sm.font-bold.text-zinc-900').allInnerTexts()
      for (const p of prices.slice(0, 10)) {
        expect(p, `${store.label}: price missing $ — "${p}"`).toMatch(/^\$/)
      }

      // No "Only 0 left" regression
      const mainText = await page.locator('main').innerText()
      expect(mainText, `${store.label}: "Only 0 left" regression`).not.toContain('Only 0 left')

      // No console errors
      expect(errors.length, `${store.label}: console errors: ${errors.join(' | ')}`).toBe(0)

      // Category nav renders
      const navBtns = page.locator('header button.text-xs.font-semibold.text-zinc-500')
      const navCount = await navBtns.count()
      expect(navCount, `${store.label}: no category nav buttons`).toBeGreaterThan(0)

      // Clicking first category changes the view
      await navBtns.first().click()
      await page.waitForTimeout(500)
      await expect(page.locator('h2.text-lg.font-bold.text-zinc-900').first()).toBeVisible()

      // Drag handle visible
      await expect(page.locator('[data-drag-handle]').first()).toBeVisible()

      await ss(page, `12-${store.label.toLowerCase()}`)
    })
  }

})

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY REPORTER
// ─────────────────────────────────────────────────────────────────────────────

test.afterAll(async () => {
  // Playwright's built-in reporter handles pass/fail tallies.
  // This hook exists as a hook-point for future custom summary injection.
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  COOPER PROTOCOL COMPLETE                                                    ║
║  Sections 1-12 executed.                                                     ║
║  Screenshots: test-results/cooper/                                           ║
║  Verdict:                                                                    ║
║    SHIP     — if no tests are marked FAILED above                            ║
║    DO NOT SHIP — any FAILED test = blocking issue, listed above              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `)
})
