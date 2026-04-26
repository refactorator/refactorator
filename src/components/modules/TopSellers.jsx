import { products } from '../../data/storeData'

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

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
        No top sellers match this filter
      </div>
    )
  }

  return (
    <div className="p-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Top Sellers {filter.tag === 'mothers-day' ? "· Mother's Day" : ''}
      </p>
      <div className="space-y-2">
        {filtered.map((p, i) => {
          const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
          const hasSale = p.tags.includes('sale')

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 hover:border-zinc-600 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <span className="text-xs font-bold text-zinc-600 w-5 shrink-0">#{i + 1}</span>
              <div className="w-8 h-8 bg-zinc-700/40 rounded flex items-center justify-center text-base shrink-0">
                {p.category === 'tops' && '👕'}
                {p.category === 'pants' && '👖'}
                {p.category === 'dresses' && '👗'}
                {p.category === 'outerwear' && '🧥'}
                {p.category === 'accessories' && '👜'}
                {p.category === 'kids' && '🧒'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{p.name}</p>
                <p className="text-xs text-zinc-500 capitalize">{p.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">${p.price}</p>
                {hasSale && p.originalPrice && (
                  <p className="text-xs text-zinc-500 line-through">${p.originalPrice}</p>
                )}
              </div>
              {totalStock <= 5 && (
                <span className="badge-low shrink-0">Low</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
