import { products, getProductImage } from '../../data/storeData'

function applyFilters(items, filter = {}) {
  return items.filter((p) => {
    if (!p.tags.includes('top-seller')) return false
    if (filter.category && p.category !== filter.category) return false
    if (filter.gender && p.gender !== filter.gender && p.gender !== 'unisex') return false
    if (filter.tag && !p.tags.includes(filter.tag)) return false
    if (filter.tags) {
      const required = Array.isArray(filter.tags) ? filter.tags : [filter.tags]
      if (!required.some((t) => p.tags.includes(t))) return false
    }
    return true
  })
}

export default function TopSellers({ filter = {} }) {
  const filtered = applyFilters(products, filter)
  const title = filter.tag === 'mothers-day' ? "Mother's Day — Top Sellers" : 'Top Sellers'

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-400 text-sm">
        No top sellers match this filter
      </div>
    )
  }

  return (
    <div>
      <div className="px-5 pt-5 pb-3 border-b border-zinc-100">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">{title}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} items</p>
      </div>
      <div className="p-4 space-y-1">
        {filtered.map((p, i) => {
          const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold text-zinc-300 w-5 shrink-0 text-right">#{i + 1}</span>
              <img
                src={getProductImage(p, 80, 100)}
                alt={p.name}
                className="w-10 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
                <p className="text-xs text-zinc-400 capitalize mt-0.5">{p.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-900">${p.price}</p>
                {p.tags.includes('sale') && p.originalPrice && (
                  <p className="text-xs text-zinc-400 line-through">${p.originalPrice}</p>
                )}
              </div>
              {totalStock <= 5 && <span className="badge-low shrink-0">Low</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
