import { products, getProductImage } from '../../data/storeData'

export function applyProductFilters(items, filter = {}) {
  return items.filter((p) => {
    if (filter.category && p.category !== filter.category) return false
    if (filter.gender && p.gender !== filter.gender && p.gender !== 'unisex') return false
    if (filter.brand && p.brand !== filter.brand) return false
    if (filter.tags) {
      const required = Array.isArray(filter.tags) ? filter.tags : [filter.tags]
      if (!required.some((t) => p.tags.includes(t))) return false
    }
    if (filter.tag && !p.tags.includes(filter.tag)) return false
    if (filter.size) {
      const s = filter.size.toUpperCase()
      if (!p.sizes.some((sz) => sz.toUpperCase() === s)) return false
      if ((p.stock[s] ?? p.stock[filter.size]) === 0) return false
    }
    return true
  })
}

function getSectionTitle(filter) {
  if (filter.tags?.includes('sale') || filter.tag === 'sale') return 'On Sale'
  if (filter.tags?.includes('new') || filter.tag === 'new') return 'New Arrivals'
  if (filter.tags?.includes('top-seller') || filter.tag === 'top-seller') return 'Top Sellers'
  if (filter.tags?.includes('mothers-day')) return "Mother's Day"
  if (filter.category) return filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
  return 'All Products'
}

export default function ProductGrid({ filter = {}, hideHeader = false }) {
  const filtered = applyProductFilters(products, filter)
  const isSaleView = filter.tags?.includes('sale') || filter.tag === 'sale'
  const title = getSectionTitle(filter)

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 text-sm px-5">
        No products match this filter
      </div>
    )
  }

  return (
    <div>
      {!hideHeader && (
        <div className="px-5 pt-5 pb-3 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} items</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
        {filtered.map((product) => {
          const isNew = product.tags.includes('new')
          const hasSale = product.tags.includes('sale')
          const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0)
          const isLowStock = totalStock <= 5

          return (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl bg-zinc-100 aspect-[3/4] mb-3">
                <img
                  src={getProductImage(product, 300, 400)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {isNew && !isSaleView && <span className="badge-new">New</span>}
                  {hasSale && !isSaleView && <span className="badge-sale">Sale</span>}
                </div>
                {isLowStock && (
                  <div className="absolute bottom-2 left-2 right-2 bg-white/90 text-xs font-semibold text-amber-700 text-center py-1 rounded-lg">
                    Only {totalStock} left
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">{product.category}</p>
              <p className="text-sm font-semibold text-zinc-900 leading-tight">{product.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-zinc-900">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xs text-zinc-400 line-through">${product.originalPrice}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
