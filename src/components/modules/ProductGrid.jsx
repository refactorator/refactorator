import { products } from '../../data/storeData'

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

function ProductCard({ product }) {
  const hasSale = product.tags.includes('sale')
  const isNew = product.tags.includes('new')
  const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0)
  const isLowStock = totalStock <= 5
  const imgUrl = `https://picsum.photos/seed/${product.id}/400/500`

  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg bg-zinc-100 aspect-[3/4] mb-3">
        <img
          src={imgUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasSale && <span className="badge-sale">Sale</span>}
          {isNew && <span className="badge-new">New</span>}
        </div>
        {isLowStock && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/90 text-xs font-semibold text-amber-700 text-center py-1 rounded">
            Only {totalStock} left
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">{product.category}</p>
        <p className="text-sm font-semibold text-zinc-900 leading-tight">{product.name}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-bold text-zinc-900">${product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-zinc-400 line-through">${product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductGrid({ filter = {} }) {
  const filtered = applyProductFilters(products, filter)

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
        No products match this filter
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
      {filtered.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
