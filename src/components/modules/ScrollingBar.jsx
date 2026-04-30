import { useEffect, useRef } from 'react'
import { useStore } from '../../context/StoreContext'

function applyFilters(items, filter = {}) {
  return items.filter((p) => {
    if (filter.category && p.category !== filter.category) return false
    if (filter.gender && p.gender !== filter.gender && p.gender !== 'unisex') return false
    if (filter.tags) {
      const required = Array.isArray(filter.tags) ? filter.tags : [filter.tags]
      if (!required.some((t) => p.tags.includes(t))) return false
    }
    if (filter.tag && !p.tags.includes(filter.tag)) return false
    if (filter.size) {
      if (!p.sizes.some((s) => s.toLowerCase() === filter.size.toLowerCase())) return false
    }
    if (filter.lowStock) {
      const total = Object.values(p.stock).reduce((a, b) => a + b, 0)
      if (total > 5) return false
    }
    return true
  })
}

function getBarTitle(filter, isFallback) {
  if (isFallback) return filter.category
    ? filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
    : 'Featured'
  if (filter.lowStock) return 'Low Stock Alert'
  if (filter.tags?.includes('new') || filter.tag === 'new') return 'New Arrivals'
  if (filter.tags?.includes('sale') || filter.tag === 'sale') return 'On Sale'
  if (filter.tags?.includes('top-seller')) return 'Top Sellers'
  if (filter.tags?.includes('mothers-day')) return "Mother's Day Picks"
  if (filter.category) return filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
  return 'Featured'
}

export default function ScrollingBar({ filter = {} }) {
  const { products, getProductImage } = useStore()
  const trackRef = useRef(null)

  const filtered = applyFilters(products, filter)

  // Fall back to a general feed if the filter returns nothing (real stores rarely have specific tags/categories)
  // Exception: lowStock filter — empty is meaningful (no low-stock items is good news)
  const isFallback = filtered.length === 0 && !filter.lowStock && products.length > 0
  const source = isFallback
    ? products.slice(0, 25)
    : filtered

  const title = getBarTitle(filter, isFallback)
  const items = source.length > 0 ? [...source, ...source, ...source] : []

  useEffect(() => {
    const track = trackRef.current
    if (!track || source.length === 0) return
    let pos = 0
    const speed = 0.4
    let raf

    const animate = () => {
      pos -= speed
      if (Math.abs(pos) >= track.scrollWidth / 3) pos = 0
      track.style.transform = `translateX(${pos}px)`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [source.length])

  if (source.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-zinc-400 text-sm px-4">
        No items match this filter
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0">
      <div className="shrink-0 px-4 py-3 border-r border-zinc-100">
        <p className="text-xs font-bold text-zinc-800 uppercase tracking-widest whitespace-nowrap">{title}</p>
      </div>
      <div className="flex-1 overflow-hidden py-2 pl-3">
        <div ref={trackRef} className="flex gap-3 whitespace-nowrap w-max">
          {items.map((p, i) => {
            const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
            return (
              <div
                key={`${p.id}-${i}`}
                className="inline-flex items-center gap-2.5 bg-stone-50 border border-zinc-200 rounded-full pl-1.5 pr-4 py-1 hover:border-zinc-400 transition-colors cursor-pointer shrink-0"
              >
                <img
                  src={getProductImage(p, 28, 28)}
                  className="w-6 h-6 rounded-full object-cover"
                  alt=""
                />
                <span className="text-xs font-semibold text-zinc-700">{p.name}</span>
                <span className="text-xs font-bold text-zinc-900">${p.price}</span>
                {p.tags.includes('sale') && <span className="badge-sale">Sale</span>}
                {totalStock > 0 && totalStock <= 5 && <span className="badge-low">{totalStock} left</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
