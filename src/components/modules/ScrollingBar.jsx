import { useEffect, useRef } from 'react'
import { products } from '../../data/storeData'

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
      const sizeStr = filter.size.toUpperCase()
      if (!p.sizes.some(s => s.toLowerCase() === filter.size.toLowerCase())) return false
    }
    if (filter.lowStock) {
      const total = Object.values(p.stock).reduce((a, b) => a + b, 0)
      if (total > 5) return false
    }
    return true
  })
}

export default function ScrollingBar({ filter = {} }) {
  const trackRef = useRef(null)
  const filtered = applyFilters(products, filter)
  const items = [...filtered, ...filtered]

  useEffect(() => {
    const track = trackRef.current
    if (!track || filtered.length === 0) return
    let pos = 0
    const speed = 0.5
    let raf

    const animate = () => {
      pos -= speed
      if (Math.abs(pos) >= track.scrollWidth / 2) pos = 0
      track.style.transform = `translateX(${pos}px)`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [filtered.length])

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-zinc-500 text-sm px-4">
        No items match this filter
      </div>
    )
  }

  return (
    <div className="overflow-hidden py-2 px-4">
      <div ref={trackRef} className="flex gap-4 whitespace-nowrap w-max">
        {items.map((p, i) => {
          const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
          return (
            <div
              key={`${p.id}-${i}`}
              className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 hover:border-zinc-500 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-sm font-medium text-zinc-200">{p.name}</span>
              <span className="text-xs text-zinc-400">${p.price}</span>
              {p.tags.includes('sale') && (
                <span className="badge-sale">Sale</span>
              )}
              {totalStock <= 5 && (
                <span className="badge-low">Low stock</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
