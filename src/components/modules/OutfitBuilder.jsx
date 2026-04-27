import { useState } from 'react'
import { products, getProductImage } from '../../data/storeData'

const RAILS = [
  { key: 'tops', label: 'Shirts & Tops', categories: ['tops'] },
  { key: 'pants', label: 'Pants & Bottoms', categories: ['pants', 'dresses'] },
  { key: 'shoes', label: 'Shoes', categories: ['shoes'] },
]

function getRailItems(categories, filter = {}) {
  return products.filter((p) => {
    if (!categories.includes(p.category)) return false
    if (filter.gender && p.gender !== filter.gender && p.gender !== 'unisex') return false
    if (filter.tags) {
      const required = Array.isArray(filter.tags) ? filter.tags : [filter.tags]
      if (!required.some((t) => p.tags.includes(t))) return false
    }
    return true
  })
}

export default function OutfitBuilder({ filter = {} }) {
  const rails = RAILS.map((r) => ({
    ...r,
    items: getRailItems(r.categories, filter),
  }))

  const [indices, setIndices] = useState({ tops: 0, pants: 0, shoes: 0 })
  const [savedOutfits, setSavedOutfits] = useState([])
  const [justSaved, setJustSaved] = useState(false)

  const navigate = (railKey, dir) => {
    const railItems = rails.find((r) => r.key === railKey)?.items || []
    if (railItems.length === 0) return
    setIndices((prev) => ({
      ...prev,
      [railKey]: (prev[railKey] + dir + railItems.length) % railItems.length,
    }))
  }

  const addOutfit = () => {
    const outfit = {
      id: Date.now(),
      items: rails.map((r) => r.items[indices[r.key]]).filter(Boolean),
    }
    if (outfit.items.length === 0) return
    setSavedOutfits((prev) => [...prev, outfit])
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 border-b border-zinc-100 shrink-0">
        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Outfit Builder</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Use arrows to mix and match, then save your outfit</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-zinc-100">
          {rails.map((rail) => {
            const current = rail.items[indices[rail.key]]
            const count = rail.items.length
            const idx = indices[rail.key]

            return (
              <div key={rail.key} className="flex items-center gap-0 px-5 py-4">
                {/* Label */}
                <div className="w-32 shrink-0">
                  <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{rail.label}</p>
                  {count > 0 && (
                    <p className="text-xs text-zinc-400 mt-0.5">{idx + 1} / {count}</p>
                  )}
                </div>

                {/* Arrow left */}
                <button
                  onClick={() => navigate(rail.key, -1)}
                  disabled={count <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 transition-all disabled:opacity-20 shrink-0 mr-3"
                >
                  ←
                </button>

                {/* Product card */}
                {current ? (
                  <div className="flex items-center gap-4 flex-1 min-w-0 bg-stone-50 border border-zinc-200 rounded-2xl px-4 py-3">
                    <img
                      src={getProductImage(current, 120, 150)}
                      alt={current.name}
                      className="w-16 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">{current.category}</p>
                      <p className="text-sm font-bold text-zinc-900 leading-tight">{current.name}</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold text-zinc-900">${current.price}</span>
                        {current.originalPrice && (
                          <span className="text-xs text-zinc-400 line-through">${current.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {current.sizes.slice(0, 4).map((s) => (
                          <span key={s} className="text-xs bg-white border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {current.tags.includes('new') && <span className="badge-new">New</span>}
                      {current.tags.includes('sale') && <span className="badge-sale">Sale</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-stone-50 border border-dashed border-zinc-300 rounded-2xl px-4 py-6 text-center">
                    <p className="text-xs text-zinc-400">No {rail.label.toLowerCase()} available</p>
                  </div>
                )}

                {/* Arrow right */}
                <button
                  onClick={() => navigate(rail.key, 1)}
                  disabled={count <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 transition-all disabled:opacity-20 shrink-0 ml-3"
                >
                  →
                </button>
              </div>
            )
          })}
        </div>

        {/* Add outfit button */}
        <div className="px-5 py-4 border-t border-zinc-100">
          <button
            onClick={addOutfit}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              justSaved
                ? 'bg-green-600 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-700'
            }`}
          >
            {justSaved ? 'Outfit Added to Cart' : 'Add Outfit to Cart'}
          </button>
        </div>

        {/* Saved outfits */}
        {savedOutfits.length > 0 && (
          <div className="px-5 pb-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Saved Outfits ({savedOutfits.length})</p>
            <div className="space-y-3">
              {savedOutfits.map((outfit) => (
                <div key={outfit.id} className="flex items-center gap-2 bg-stone-50 border border-zinc-200 rounded-xl px-3 py-2">
                  {outfit.items.map((item) => (
                    <img
                      key={item.id}
                      src={getProductImage(item, 50, 60)}
                      alt={item.name}
                      className="w-10 h-12 rounded-lg object-cover"
                    />
                  ))}
                  <div className="flex-1 min-w-0 ml-1">
                    <p className="text-xs font-semibold text-zinc-700 truncate">
                      {outfit.items.map((i) => i.name).join(' + ')}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ${outfit.items.reduce((sum, i) => sum + i.price, 0)} total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
