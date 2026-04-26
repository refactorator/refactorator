import { products } from '../../data/storeData'

function applyFilters(items, filter = {}) {
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
      const sizeStr = filter.size.toUpperCase()
      if (!p.sizes.includes(sizeStr) && !p.sizes.some(s => s.toLowerCase() === filter.size.toLowerCase())) return false
      if (p.stock[sizeStr] === 0) return false
    }
    return true
  })
}

function TagBadge({ tag }) {
  if (tag === 'sale') return <span className="badge-sale">Sale</span>
  if (tag === 'new') return <span className="badge-new">New</span>
  if (tag === 'top-seller') return <span className="badge-hot">Hot</span>
  return null
}

export default function ProductGrid({ filter = {}, compact = false }) {
  const filtered = applyFilters(products, filter)

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
        No products match this filter
      </div>
    )
  }

  const cols = compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'

  return (
    <div className={`grid ${cols} gap-3 p-4`}>
      {filtered.map((product) => {
        const hasSale = product.tags.includes('sale')
        const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0)
        const isLowStock = totalStock <= 5

        return (
          <div
            key={product.id}
            className="group bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 hover:border-zinc-600 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <div className="w-full aspect-square bg-zinc-700/30 rounded-md mb-3 flex items-center justify-center text-2xl font-light text-zinc-600">
              {product.category === 'tops' && '👕'}
              {product.category === 'pants' && '👖'}
              {product.category === 'dresses' && '👗'}
              {product.category === 'outerwear' && '🧥'}
              {product.category === 'accessories' && '👜'}
              {product.category === 'kids' && '🧒'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap gap-1 min-h-[18px]">
                {product.tags.slice(0, 2).map((t) => (
                  <TagBadge key={t} tag={t} />
                ))}
              </div>

              <p className="text-xs text-zinc-300 font-medium leading-tight line-clamp-2">
                {product.name}
              </p>

              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-white">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xs text-zinc-500 line-through">${product.originalPrice}</span>
                )}
              </div>

              {isLowStock && (
                <p className="text-xs text-yellow-500">Only {totalStock} left</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
