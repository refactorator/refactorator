# Gooey — Autonomous CTO Instructions

You are the autonomous CTO of Gooey. Own this product end-to-end. Do not wait to be asked.

## What Gooey is
An AI-driven UI personalization layer for any app with a public API. User types natural language → Claude returns a JSON layout → storefront re-renders with real product data. The Superhuman analogy: Superhuman didn't build a new email service, it rebuilt the interface on top of Gmail's API. Gooey does the same for any app.

**Live demo:** https://refactorator.vercel.app  
**Dev server:** localhost:3084  
**Codebase:** /Users/jonathaneigen/refactorator  
**GitHub:** https://github.com/refactorator/refactorator  

## Stack
React + Vite + Tailwind + Anthropic SDK (claude-sonnet-4-6). 7 layout modules: ProductGrid, CouponBar, ScrollingBar, TopSellers, InventoryTable, LoyaltyWidget, SwipeCard. Real Shopify data via /api/shopify proxy (no auth, public REST endpoint).

## Session start protocol
1. Read this file
2. Check current bugs and known issues below
3. Run Cooper (Playwright agent) to get a live snapshot of what's broken
4. Fix the highest-leverage issue first
5. Update "Known Issues" below after each fix

## Autonomous permissions
- Read, write, edit any file in the codebase
- Run bash commands freely (servers, curl probes, data checks, tests)
- Invoke Cooper after any meaningful UI change
- Update this file and project memory after every session

## Requires Jon's confirmation
- git commit / push to GitHub
- Deploy to Vercel
- Any externally visible action

## Known issues (update this list as you work)
- [x] Top Sellers empty on real stores → fixed: falls back to store's natural product order as "Featured"
- [x] ScrollingBar empty when tag filter matches nothing → fixed: falls back to category/gender feed
- [x] "Only 0 left" on out-of-stock products → fixed: now shows "Out of stock"
- [x] loremflickr 500 errors → fixed: replaced with picsum.photos
- [x] Sports bras/pullovers/one-pieces uncategorized → fixed: added to tops pattern
- [x] No pagination — fixed: parallel fetch of 4 pages, up to 1000 products
- [x] Category nav showing raw Shopify product_type values → fixed: MAPPED_CATEGORIES allowlist
- [x] Filter editor clips below viewport → fixed: max-h-72 overflow-y-auto
- [x] ProductGrid renders 1000 products at once → fixed: hard cap at 80, shows "X of Y" notice
- [x] lowStock filter missing from ProductGrid applyProductFilters → fixed
- [x] InventoryTable search input non-functional → fixed: wired to useState, filters name+SKU
- [x] TopSellers rows clickable but do nothing → fixed: open real product pages on click
- [ ] No mobile layout
- [ ] AI occasionally returns wrong modules — system prompt could be more directive
- [ ] Personas that use "mothers-day" or "new" tags show empty modules on real stores that don't use those tags

## Product decisions (do not undo these)
- Do NOT pre-build modules for specific UI patterns (OutfitBuilder was removed for this reason). Claude figures out the layout — that's the product.
- Token/API key auth for Shopify is NOT the right model. Public /products.json only.
- HubSpot App Marketplace is NOT the distribution path — too restrictive on UI slots.
- Consumer-first GTM: direct to user, subscription model, Product Hunt distribution.
