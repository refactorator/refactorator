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
      if (!p.sizes.some((s) => s.toLowerCase() === filter.size.toLowerCase())) return false
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
  const items = [...filtered, ...filtered, ...filtered]

  useEffect(() => {
    const track = trackRef.current
    if (!track || filtered.length === 0) return
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
  }, [filtered.length])

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-zinc-400 text-sm px-4">
        No items match this filter
      </div>
    )
  }

  return (
    <div className="overflow-hidden py-3 px-4">
      <div ref={trackRef} className="flex gap-3 whitespace-nowrap w-max">
        {items.map((p, i) => {
          const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
          return (
            <div
              key={`${p.id}-${i}`}
              className="inline-flex items-center gap-3 bg-stone-50 border border-zinc-200 rounded-full pl-2 pr-4 py-1.5 hover:border-zinc-400 transition-colors cursor-pointer shrink-0"
            >
              <img
                src={`https://picsum.photos/seed/${p.id}/28/28`}
                className="w-7 h-7 rounded-full object-cover"
                alt=""
              />
              <span className="text-sm font-medium text-zinc-800">{p.name}</span>
              <span className="text-xs font-bold text-zinc-500">${p.price}</span>
              {p.tags.includes('sale') && <span className="badge-sale">Sale</span>}
              {totalStock <= 5 && <span className="badge-low">Low</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
