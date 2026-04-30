export const userProfiles = [
  {
    id: 'bargain-hunter',
    name: 'Bargain Hunter',
    description: 'Focused on deals, sales, and best prices',
    prompt: 'Show all active coupon codes on top, sale items in the center grid, and new arrivals scrolling at the bottom',
    defaultLayout: [
      { position: 'top', module: 'CouponBar', filter: {} },
      { position: 'center', module: 'ProductGrid', filter: { tags: ['sale'] } },
      { position: 'bottom', module: 'ScrollingBar', filter: { tags: ['new'] } },
    ],
  },
  {
    id: 'gift-buyer',
    name: 'Gift Buyer',
    description: 'Shopping for others — gifts, occasions, and top picks',
    prompt: 'Show top sellers in the center with a scrolling featured feed on top and coupons on the right',
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: {} },
      { position: 'center', module: 'TopSellers', filter: {} },
      { position: 'right', module: 'CouponBar', filter: {} },
    ],
  },
  {
    id: 'brand-loyalist',
    name: 'Brand Loyalist',
    description: 'Follows favorite brands, loves early access and loyalty perks',
    prompt: 'Show my loyalty points and tier on the left, new arrivals in the center, and top sellers scrolling at the bottom',
    defaultLayout: [
      { position: 'left', module: 'LoyaltyWidget', filter: {} },
      { position: 'center', module: 'ProductGrid', filter: { tags: ['new'] } },
      { position: 'bottom', module: 'ScrollingBar', filter: { tags: ['sale'] } },
    ],
  },
  {
    id: 'busy-parent',
    name: 'Busy Parent',
    description: 'Practical, fast, focused on kids and family needs',
    prompt: 'Show kids items scrolling at top, coupons on the left, and all kids products in the center',
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: { category: 'kids' } },
      { position: 'left', module: 'CouponBar', filter: {} },
      { position: 'center', module: 'ProductGrid', filter: { category: 'kids' } },
    ],
  },
  {
    id: 'store-associate',
    name: 'Store Associate',
    description: 'Internal view — inventory, stock levels, and product lookup',
    prompt: 'Show low-stock alerts in a scrolling ticker at the top and the full inventory table with stock levels in the center',
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: { lowStock: true } },
      { position: 'center', module: 'InventoryTable', filter: {} },
    ],
  },
]
