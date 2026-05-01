import { test, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, '../test-results/visual-audit')

async function screenshot(page: Page, name: string, desc: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`[SCREENSHOT] ${name} — ${desc} → ${filePath}`)
  return filePath
}

function collectConsoleLogs(page: Page) {
  const logs: { type: string; text: string }[] = []
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }))
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }))
  return () => logs
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — DEFAULT STATE
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 1 — Default state: first impression on load', async ({ page }) => {
  const getLogs = collectConsoleLogs(page)

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await screenshot(page, '01-default-state', 'First load, no interaction')

  // Document exactly what's in the header
  const headerText = await page.locator('header').textContent()
  console.log('[HEADER TEXT]', headerText?.trim())

  // Document all visible button labels
  const buttons = await page.locator('button:visible').allTextContents()
  console.log('[VISIBLE BUTTONS]', buttons.map(b => `"${b.trim()}"`).join(', '))

  // Document module labels
  const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULE LABELS]', moduleLabels)

  // Count images
  const imgCount = await page.locator('img:visible').count()
  console.log('[IMAGE COUNT]', imgCount)

  // Document chat panel content
  const chatPanelText = await page.locator('text=Folio Assistant').isVisible()
  console.log('[CHAT PANEL VISIBLE]', chatPanelText)

  // Are there any JS errors?
  const logs = getLogs()
  const errors = logs.filter(l => l.type === 'error' || l.type === 'pageerror')
  console.log('[JS ERRORS ON LOAD]', errors.length, errors.slice(0, 3).map(e => e.text))
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — CONNECT GYMSHARK
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 2 — Connect Gymshark', async ({ page }) => {
  const getLogs = collectConsoleLogs(page)

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Screenshot modal BEFORE opening
  await screenshot(page, '02a-before-connect', 'Before clicking Connect Store')

  // Open modal
  await page.click('button:has-text("Connect Store")')
  await page.waitForSelector('text=Connect a Shopify Store', { timeout: 5000 })
  await screenshot(page, '02b-modal-open', 'Connect modal open')

  // Fill in gymshark.com
  const input = page.locator('input[placeholder*="gymshark"]')
  await input.fill('gymshark.com')
  await screenshot(page, '02c-modal-filled', 'gymshark.com typed in')

  // Click Connect
  await page.click('button:has-text("Connect")')

  // Wait for modal to close (means success)
  await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 25_000 })

  // Wait a moment for data to render
  await page.waitForTimeout(1500)

  await screenshot(page, '02d-gymshark-connected', 'After Gymshark connected')

  // Document what changed in header
  const headerText = await page.locator('header').textContent()
  console.log('[HEADER AFTER CONNECT]', headerText?.trim())

  // Any disconnect button?
  const disconnectVisible = await page.locator('button:has-text("Disconnect")').isVisible()
  console.log('[DISCONNECT BUTTON VISIBLE]', disconnectVisible)

  // Module labels after connect
  const moduleLabels = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES AFTER CONNECT]', moduleLabels)

  // Image count
  const imgCount = await page.locator('img:visible').count()
  console.log('[IMAGE COUNT AFTER CONNECT]', imgCount)

  const errors = getLogs().filter(l => l.type === 'error' || l.type === 'pageerror')
  console.log('[JS ERRORS AFTER CONNECT]', errors.length, errors.slice(0, 3).map(e => e.text))
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — MODULE INTERACTIONS
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 3a — Gear icon: does filter editor appear?', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await screenshot(page, '03-before-gear', 'Before clicking gear')

  // Look for gear icon button — check different selectors
  const gearSelectors = [
    'button[title="Configure"]',
    'button[title="Settings"]',
    'button[title="Edit"]',
    'button[title="Filter"]',
    'button:has(svg[class*="gear"])',
    '[data-testid="gear"]',
    'button.gear',
  ]

  let gearFound = false
  for (const sel of gearSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[GEAR SELECTOR FOUND] "${sel}" — ${count} elements`)
      gearFound = true
      await page.locator(sel).first().click()
      await page.waitForTimeout(500)
      await screenshot(page, '03a-after-gear-click', `After clicking gear via "${sel}"`)
      break
    }
  }

  if (!gearFound) {
    // Try to find any SVG button in module headers
    const moduleHeaderButtons = await page.locator('.text-xs.font-semibold.text-zinc-500').locator('..').locator('button').all()
    console.log(`[MODULE HEADER BUTTONS] found ${moduleHeaderButtons.length}`)

    if (moduleHeaderButtons.length > 0) {
      // Log all their titles/aria labels
      for (const btn of moduleHeaderButtons) {
        const title = await btn.getAttribute('title')
        const ariaLabel = await btn.getAttribute('aria-label')
        const text = await btn.textContent()
        console.log(`  button: title="${title}" aria-label="${ariaLabel}" text="${text?.trim()}"`)
      }
    }

    // Screenshot the module header area anyway
    await screenshot(page, '03a-no-gear-found', 'No gear button located')
    console.log('[GEAR RESULT] No gear/configure button found with standard selectors')
  }

  // After clicking gear (or not), document what's visible
  const allText = await page.locator('body').textContent()
  const hasFilterEditor = allText?.toLowerCase().includes('filter') || allText?.toLowerCase().includes('configure')
  console.log('[FILTER EDITOR APPEARED]', hasFilterEditor)
})

test('STEP 3b — Drag module to different position', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const modulesBefore = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES BEFORE DRAG]', modulesBefore)

  await screenshot(page, '03b-before-drag', 'Layout before drag attempt')

  // Find draggable handles — check for drag handle selectors
  const dragHandleSelectors = [
    '[data-drag-handle]',
    '[class*="drag"]',
    '[title*="drag"]',
    '[aria-label*="drag"]',
    'button[title="Move"]',
    'button[title="Drag"]',
    '[class*="handle"]',
  ]

  let dragHandleFound = false
  for (const sel of dragHandleSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[DRAG HANDLE FOUND] "${sel}" — ${count} elements`)
      dragHandleFound = true
      break
    }
  }

  if (!dragHandleFound) {
    // Module headers themselves might be draggable
    const moduleHeaders = page.locator('.text-xs.font-semibold.text-zinc-500').first()
    const headerBB = await moduleHeaders.boundingBox()
    console.log('[DRAG HANDLE NOT FOUND] — trying to drag module header directly')
    console.log('[MODULE HEADER BOUNDING BOX]', headerBB)

    if (headerBB) {
      // Attempt drag from first module header to somewhere lower
      await page.mouse.move(headerBB.x + headerBB.width / 2, headerBB.y + headerBB.height / 2)
      await page.mouse.down()
      await page.mouse.move(headerBB.x + headerBB.width / 2, headerBB.y + 200, { steps: 20 })
      await page.waitForTimeout(500)
      await screenshot(page, '03b-during-drag', 'During drag attempt')
      await page.mouse.up()
      await page.waitForTimeout(500)
    }
  }

  const modulesAfter = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES AFTER DRAG]', modulesAfter)

  const orderChanged = JSON.stringify(modulesBefore) !== JSON.stringify(modulesAfter)
  console.log('[DRAG REORDERED MODULES]', orderChanged)

  await screenshot(page, '03b-after-drag', 'After drag attempt')
})

test('STEP 3c — Resize sidebar by dragging handle', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await screenshot(page, '03c-before-resize', 'Before resize attempt')

  // Look for resize handles
  const resizeHandleSelectors = [
    '[class*="resize"]',
    '[class*="splitter"]',
    '[class*="divider"]',
    '[data-resize-handle]',
    '.resize-handle',
    '[class*="border-l cursor"]',
    '[style*="cursor: col-resize"]',
    '[style*="cursor:col-resize"]',
  ]

  let resizeHandleFound = false
  for (const sel of resizeHandleSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[RESIZE HANDLE FOUND] "${sel}" — ${count} elements`)
      resizeHandleFound = true

      const handle = page.locator(sel).first()
      const bb = await handle.boundingBox()
      if (bb) {
        await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
        await page.mouse.down()
        await page.mouse.move(bb.x + 100, bb.y + bb.height / 2, { steps: 20 })
        await page.waitForTimeout(500)
        await screenshot(page, '03c-during-resize', 'During resize drag')
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
      break
    }
  }

  if (!resizeHandleFound) {
    console.log('[RESIZE HANDLE] No resize handle found — documenting panel structure')
    // Document the layout structure
    const panels = await page.locator('[class*="panel"]').count()
    console.log(`[PANELS COUNT]`, panels)
    const cols = await page.locator('[class*="col"]').count()
    console.log(`[COL COUNT]`, cols)
  }

  await screenshot(page, '03c-after-resize', 'After resize attempt')
})

test('STEP 3d — Add Module button (+ in empty slot)', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await screenshot(page, '03d-before-add-module', 'Before clicking add module')

  // Look for add module button
  const addSelectors = [
    'button:has-text("+")',
    'button[title="Add module"]',
    'button[title="Add"]',
    'button[aria-label="Add module"]',
    '[class*="add-module"]',
    'button:has(svg[class*="plus"])',
  ]

  let addFound = false
  for (const sel of addSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[ADD MODULE BTN FOUND] "${sel}" — ${count} elements`)
      addFound = true
      await page.locator(sel).first().click()
      await page.waitForTimeout(500)
      await screenshot(page, '03d-after-add-click', `After clicking add via "${sel}"`)
      break
    }
  }

  if (!addFound) {
    console.log('[ADD MODULE BTN] Not found with standard selectors — checking all visible buttons')
    const allButtons = await page.locator('button:visible').allTextContents()
    console.log('[ALL BUTTONS]', allButtons.map(b => `"${b.trim()}"`))
    await screenshot(page, '03d-no-add-found', 'No + add module button found')
  }

  // Did a picker appear?
  const pickerSelectors = ['text=Add Module', 'text=Choose a module', 'text=Module picker', '[class*="picker"]']
  for (const sel of pickerSelectors) {
    const visible = await page.locator(sel).isVisible().catch(() => false)
    if (visible) {
      console.log(`[MODULE PICKER APPEARED] via selector: "${sel}"`)
      await screenshot(page, '03d-module-picker-open', 'Module picker visible')
    }
  }
})

test('STEP 3e — Remove module with X button', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const modulesBefore = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES BEFORE REMOVE]', modulesBefore)

  await screenshot(page, '03e-before-remove', 'Before removing module')

  // Find remove buttons
  const removeSelectors = [
    'button[title="Remove"]',
    'button[title="Delete"]',
    'button[aria-label="Remove"]',
    'button:has-text("✕")',
    'button:has-text("×")',
    'button:has-text("x")',
  ]

  let removeFound = false
  for (const sel of removeSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[REMOVE BTN FOUND] "${sel}" — ${count} elements`)
      removeFound = true
      await page.locator(sel).first().click()
      await page.waitForTimeout(500)
      break
    }
  }

  if (!removeFound) {
    console.log('[REMOVE BTN] Not found with standard selectors')
    // Hover over module header — maybe remove only appears on hover
    const moduleHeader = page.locator('.text-xs.font-semibold.text-zinc-500').first()
    await moduleHeader.hover()
    await page.waitForTimeout(300)
    await screenshot(page, '03e-hover-module-header', 'Hovering module header — looking for remove button')

    // Try again after hover
    for (const sel of removeSelectors) {
      const count = await page.locator(sel).count()
      if (count > 0) {
        console.log(`[REMOVE BTN FOUND AFTER HOVER] "${sel}" — ${count}`)
        removeFound = true
        await page.locator(sel).first().click()
        await page.waitForTimeout(500)
        break
      }
    }
  }

  const modulesAfter = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES AFTER REMOVE]', modulesAfter)
  console.log('[MODULE REMOVED SUCCESSFULLY]', modulesAfter.length < modulesBefore.length)

  await screenshot(page, '03e-after-remove', 'After remove attempt')
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — PRODUCT CARDS
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 4 — Product grid: images, clicking, buy actions', async ({ page }) => {
  const failedImages: string[] = []
  page.on('response', resp => {
    if (resp.url().match(/\.(jpg|jpeg|png|webp)/i) && resp.status() >= 400) {
      failedImages.push(`${resp.status()} ${resp.url().substring(0, 80)}`)
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await screenshot(page, '04a-product-grid-folio', 'Product grid with demo data')

  // Count images that are actually visible
  const allImages = await page.locator('img').all()
  let loadedCount = 0
  let brokenCount = 0
  for (const img of allImages.slice(0, 20)) {
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth).catch(() => 0)
    if (naturalWidth > 0) loadedCount++
    else brokenCount++
  }
  console.log(`[IMAGES] loaded=${loadedCount} broken=${brokenCount} (sampled first 20)`)
  console.log(`[FAILED IMAGE REQUESTS]`, failedImages.slice(0, 5))

  // Find product cards — look for clickable cards
  const cardSelectors = [
    '[class*="product-card"]',
    '[class*="ProductCard"]',
    '[class*="card"]:has(img)',
    'div:has(> img):has(> [class*="price"])',
    'article',
  ]

  for (const sel of cardSelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[PRODUCT CARD SELECTOR] "${sel}" — ${count} found`)
      break
    }
  }

  // Can we click a product card?
  const firstImg = page.locator('main img').first()
  const imgBB = await firstImg.boundingBox()
  if (imgBB) {
    // Click the product image area
    await page.mouse.click(imgBB.x + imgBB.width / 2, imgBB.y + imgBB.height / 2)
    await page.waitForTimeout(600)
    await screenshot(page, '04b-after-product-click', 'After clicking first product image')

    // Check if anything opened (modal, drawer, etc.)
    const modals = await page.locator('[class*="modal"], [class*="drawer"], [role="dialog"]').count()
    console.log('[PRODUCT CLICK RESULT] Modal/drawer opened:', modals > 0)

    // Check URL changed
    const url = page.url()
    console.log('[URL AFTER PRODUCT CLICK]', url)
  }

  // Look for buy/add to cart buttons
  const buySelectors = [
    'button:has-text("Add to Cart")',
    'button:has-text("Buy")',
    'button:has-text("Shop")',
    'a:has-text("Buy")',
    '[class*="buy"]',
    '[class*="cart"]',
  ]

  for (const sel of buySelectors) {
    const count = await page.locator(sel).count()
    if (count > 0) {
      console.log(`[BUY BUTTON FOUND] "${sel}" — ${count}`)
    }
  }
  console.log('[BUY BUTTONS] (checking all above)')
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — CHAT: "show me tops for women"
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 5 — Chat: "show me tops for women"', async ({ page }) => {
  const getLogs = collectConsoleLogs(page)

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const modulesBefore = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES BEFORE CHAT]', modulesBefore)

  await screenshot(page, '05a-before-chat', 'Before sending chat message')

  // Find the textarea
  const textarea = page.locator('textarea[placeholder*="Describe the layout"]')
  const textareaVisible = await textarea.isVisible()
  console.log('[TEXTAREA VISIBLE]', textareaVisible)

  if (!textareaVisible) {
    // Try alternate selectors
    const altTextarea = page.locator('textarea').first()
    const altVisible = await altTextarea.isVisible()
    console.log('[ALT TEXTAREA VISIBLE]', altVisible)
    const placeholder = await altTextarea.getAttribute('placeholder')
    console.log('[TEXTAREA PLACEHOLDER]', placeholder)
  }

  await textarea.fill('show me tops for women')
  await screenshot(page, '05b-chat-typed', 'After typing message')

  // Send via Enter
  await page.keyboard.press('Enter')
  await screenshot(page, '05c-chat-sending', 'Message sent, waiting for AI response')

  // Wait for loading animation to disappear (AI responding)
  console.log('[WAITING FOR AI RESPONSE]...')
  const responseStarted = await page.waitForSelector('[class*="animate-bounce"]', { timeout: 10_000 }).catch(() => null)
  if (responseStarted) {
    console.log('[AI LOADING DOTS APPEARED]')
    // Wait for them to go away
    await page.waitForFunction(() => {
      return document.querySelectorAll('[class*="animate-bounce"]').length === 0
    }, null, { timeout: 90_000 })
    console.log('[AI LOADING DOTS GONE — response complete]')
  } else {
    console.log('[NO LOADING DOTS FOUND — may have responded instantly or never started]')
    await page.waitForTimeout(3000)
  }

  await screenshot(page, '05d-chat-response-received', 'After AI response received')

  const modulesAfter = await page.locator('.text-xs.font-semibold.text-zinc-500').allTextContents()
  console.log('[MODULES AFTER CHAT]', modulesAfter)

  const layoutChanged = JSON.stringify(modulesBefore) !== JSON.stringify(modulesAfter)
  console.log('[LAYOUT CHANGED BY CHAT]', layoutChanged)

  // Check for error bubbles
  const errorBubbles = await page.locator('[class*="bg-red-50"], [class*="text-red"]').count()
  console.log('[ERROR BUBBLES VISIBLE]', errorBubbles)

  // Full screenshot after
  await screenshot(page, '05e-final-layout-after-chat', 'Final layout state after chat')

  const errors = getLogs().filter(l => l.type === 'error' || l.type === 'pageerror')
  console.log('[JS ERRORS DURING CHAT]', errors.length, errors.slice(0, 3).map(e => e.text))
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — VISUAL AUDIT: what's broken / ugly / confusing
// ─────────────────────────────────────────────────────────────────────────────
test('STEP 6 — Visual audit: layout, empty states, confusion points', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Screenshot full viewport
  await screenshot(page, '06a-full-viewport', 'Full viewport default state')

  // Measure layout proportions
  const mainEl = page.locator('main')
  const mainBB = await mainEl.boundingBox().catch(() => null)
  const header = page.locator('header')
  const headerBB = await header.boundingBox().catch(() => null)
  console.log('[MAIN BB]', mainBB)
  console.log('[HEADER BB]', headerBB)

  // Check for any visible empty states
  const emptyStateTexts = ['No products', 'Empty', 'No results', '0 items', 'nothing here']
  for (const text of emptyStateTexts) {
    const count = await page.locator(`text=${text}`).count()
    if (count > 0) console.log(`[EMPTY STATE FOUND] "${text}"`)
  }

  // Hover over various elements to find hidden affordances
  // Module header
  const firstModuleHeader = page.locator('.text-xs.font-semibold.text-zinc-500').first()
  if (await firstModuleHeader.isVisible()) {
    await firstModuleHeader.hover()
    await page.waitForTimeout(400)
    await screenshot(page, '06b-hover-module-header', 'Hover on module header — hidden affordances')
  }

  // Check if product images have alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count()
  const imagesWithEmptyAlt = await page.locator('img[alt=""]').count()
  console.log(`[IMAGES WITHOUT ALT] ${imagesWithoutAlt}`)
  console.log(`[IMAGES WITH EMPTY ALT] ${imagesWithEmptyAlt}`)

  // Check for horizontal scroll
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = page.viewportSize()?.width ?? 1440
  console.log(`[HORIZONTAL OVERFLOW] bodyScrollWidth=${bodyScrollWidth} viewport=${viewportWidth} overflow=${bodyScrollWidth > viewportWidth}`)

  // Check module count display
  const moduleCountText = await page.locator('text=3 modules').isVisible()
  console.log('[MODULE COUNT VISIBLE]', moduleCountText)

  // Profile selector area
  const profileSelectorVisible = await page.locator('text=Bargain Hunter').isVisible()
  console.log('[PERSONA CHIPS VISIBLE]', profileSelectorVisible)

  // StorefrontPanel structure
  const storefrontPanelEl = page.locator('.panel').first()
  const storefrontBB = await storefrontPanelEl.boundingBox().catch(() => null)
  console.log('[STOREFRONT PANEL BB]', storefrontBB)

  // Chat panel
  const chatPanelEl = page.locator('.panel').last()
  const chatBB = await chatPanelEl.boundingBox().catch(() => null)
  console.log('[CHAT PANEL BB]', chatBB)

  // Check what happens when we scroll inside product grid
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(400)
  await screenshot(page, '06c-after-scroll', 'After scrolling down 300px')

  // Connect Gymshark and re-audit
  await page.click('button:has-text("Connect Store")')
  await page.locator('input[placeholder*="gymshark"]').fill('gymshark.com')
  await page.click('button:has-text("Connect")')
  await expect(page.locator('text=Connect a Shopify Store')).not.toBeVisible({ timeout: 25_000 })
  await page.waitForTimeout(1500)

  await screenshot(page, '06d-gymshark-loaded-audit', 'Gymshark loaded — visual audit')

  // Scroll product grid
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(400)
  await screenshot(page, '06e-gymshark-scrolled', 'Gymshark after scroll')

  // Hover first product image
  const firstProductImg = page.locator('main img').first()
  if (await firstProductImg.isVisible()) {
    await firstProductImg.hover()
    await page.waitForTimeout(400)
    await screenshot(page, '06f-hover-product', 'Hovering first product image')
  }

  // Check SwipeCard layout (Tinder style)
  await page.locator('button.rounded-full:has-text("Bargain Hunter")').click()
  await expect(page.locator('text=Active Layout')).toBeVisible({ timeout: 5000 })
  await screenshot(page, '06g-bargain-hunter-layout', 'Bargain Hunter persona layout')

  await page.locator('button.rounded-full:has-text("Store Associate")').click()
  await screenshot(page, '06h-store-associate-layout', 'Store Associate persona layout')

  await page.locator('button.rounded-full:has-text("Gift Buyer")').click()
  await screenshot(page, '06i-gift-buyer-layout', 'Gift Buyer persona layout')

  await page.locator('button.rounded-full:has-text("Brand Loyalist")').click()
  await screenshot(page, '06j-brand-loyalist-layout', 'Brand Loyalist persona layout')

  await page.locator('button.rounded-full:has-text("Busy Parent")').click()
  await screenshot(page, '06k-busy-parent-layout', 'Busy Parent persona layout')

  // Final reset
  await page.click('button:has-text("Reset")')
  await screenshot(page, '06l-after-reset', 'After reset')
})
