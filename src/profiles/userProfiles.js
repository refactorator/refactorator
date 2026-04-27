export const userProfiles = [
  {
    id: 'bargain-hunter',
    name: 'Bargain Hunter',
    description: 'Focused on deals, sales, and best prices',
    defaultLayout: [
      { position: 'top', module: 'CouponBar', filter: {} },
      { position: 'center', module: 'ProductGrid', filter: { tags: ['sale'] } },
      { position: 'bottom', module: 'ScrollingBar', filter: { tags: ['new'] } },
    ],
  },
  {
    id: 'gift-buyer',
    name: 'Gift Buyer',
    description: "Shopping for others — gifts, occasions, and top picks",
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: { tags: ['mothers-day'] } },
      { position: 'center', module: 'TopSellers', filter: {} },
      { position: 'right', module: 'CouponBar', filter: { code: 'MOMDAY30' } },
    ],
  },
  {
    id: 'brand-loyalist',
    name: 'Brand Loyalist',
    description: 'Follows favorite brands, loves early access and loyalty perks',
    defaultLayout: [
      { position: 'left', module: 'LoyaltyWidget', filter: {} },
      { position: 'center', module: 'ProductGrid', filter: { tags: ['new'], brand: 'Folio' } },
      { position: 'bottom', module: 'ScrollingBar', filter: { tags: ['top-seller'] } },
    ],
  },
  {
    id: 'busy-parent',
    name: 'Busy Parent',
    description: 'Practical, fast, focused on kids and family needs',
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: { category: 'kids' } },
      { position: 'left', module: 'CouponBar', filter: { code: 'KIDS20' } },
      { position: 'center', module: 'ProductGrid', filter: { category: 'kids' } },
    ],
  },
  {
    id: 'store-associate',
    name: 'Store Associate',
    description: 'Internal view — inventory, stock levels, and product lookup',
    defaultLayout: [
      { position: 'top', module: 'ScrollingBar', filter: { lowStock: true } },
      { position: 'center', module: 'InventoryTable', filter: {} },
    ],
  },
]
