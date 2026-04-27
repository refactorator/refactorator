import { useState, useRef } from 'react'
import { products } from '../../data/storeData'
import { applyProductFilters } from './ProductGrid'

const SWIPE_THRESHOLD = 80

export default function SwipeCard({ filter = {} }) {
  const filtered = applyProductFilters(products, filter)
  const [index, setIndex] = useState(0)
  const [cart, setCart] = useState([])
  const [skipped, setSkipped] = useState([])
  const [drag, setDrag] = useState({ active: false, x: 0, startX: 0 })
  const [flyDir, setFlyDir] = useState(null)
  const cardRef = useRef(null)

  const current = filtered[index]
  const next = filtered[index + 1]
  const done = index >= filtered.length

  const startDrag = (clientX) => {
    setDrag({ active: true, x: 0, startX: clientX })
  }

  const moveDrag = (clientX) => {
    if (!drag.active) return
    setDrag((d) => ({ ...d, x: clientX - d.startX }))
  }

  const endDrag = () => {
    if (!drag.active) return
    const delta = drag.x
    setDrag({ active: false, x: 0, startX: 0 })

    if (delta > SWIPE_THRESHOLD) {
      swipe('right')
    } else if (delta < -SWIPE_THRESHOLD) {
      swipe('left')
    }
  }

  const swipe = (dir) => {
    setFlyDir(dir)
    setTimeout(() => {
      if (dir === 'right') setCart((c) => [...c, current])
      else setSkipped((s) => [...s, current])
      setIndex((i) => i + 1)
      setFlyDir(null)
    }, 300)
  }

  const rotate = drag.active ? drag.x * 0.08 : 0
  const translateX = flyDir === 'right' ? 600 : flyDir === 'left' ? -600 : drag.x
  const opacity = flyDir ? 0 : 1

  const showAdd = drag.x > 30 || flyDir === 'right'
  const showPass = drag.x < -30 || flyDir === 'left'

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-5">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-zinc-900">You're all caught up</p>
          <p className="text-sm text-zinc-400 mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''} added to cart</p>
        </div>
        {cart.length > 0 && (
          <div className="w-full space-y-2 max-w-xs">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-left">Cart</p>
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-stone-50 border border-zinc-200 rounded-xl px-3 py-2">
                <img src={`https://picsum.photos/seed/${item.id}/40/50`} className="w-8 h-10 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">${item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => { setIndex(0); setCart([]); setSkipped([]) }}
          className="text-xs font-semibold text-zinc-500 underline underline-offset-2 hover:text-zinc-800 transition-colors"
        >
          Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-6 px-4 select-none">
      {/* Card stack */}
      <div className="relative w-full max-w-xs mx-auto" style={{ height: 360 }}>
        {/* Back card */}
        {next && (
          <div className="absolute inset-x-4 top-3 bottom-0 bg-white border border-zinc-200 rounded-2xl shadow-sm" />
        )}

        {/* Active card */}
        {current && (
          <div
            ref={cardRef}
            className="absolute inset-0 bg-white border border-zinc-200 rounded-2xl shadow-md overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
              opacity,
              transition: drag.active ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
              touchAction: 'none',
            }}
            onMouseDown={(e) => startDrag(e.clientX)}
            onMouseMove={(e) => moveDrag(e.clientX)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => startDrag(e.touches[0].clientX)}
            onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
            onTouchEnd={endDrag}
          >
            <img
              src={`https://picsum.photos/seed/${current.id}/400/300`}
              alt={current.name}
              className="w-full h-48 object-cover pointer-events-none"
            />

            {/* Swipe overlays */}
            <div
              className="absolute inset-0 flex items-start justify-start p-4 pointer-events-none"
              style={{ opacity: showAdd ? Math.min(drag.x / 80, 1) || 1 : 0, transition: 'opacity 0.1s' }}
            >
              <div className="border-2 border-green-500 text-green-500 text-lg font-black px-3 py-1 rounded-lg rotate-[-15deg]">
                ADD
              </div>
            </div>
            <div
              className="absolute inset-0 flex items-start justify-end p-4 pointer-events-none"
              style={{ opacity: showPass ? Math.min(-drag.x / 80, 1) || 1 : 0, transition: 'opacity 0.1s' }}
            >
              <div className="border-2 border-red-400 text-red-400 text-lg font-black px-3 py-1 rounded-lg rotate-[15deg]">
                PASS
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">{current.category}</p>
                  <p className="text-base font-bold text-zinc-900 leading-tight">{current.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-zinc-900">${current.price}</p>
                  {current.originalPrice && (
                    <p className="text-xs text-zinc-400 line-through">${current.originalPrice}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {current.sizes.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs bg-stone-100 text-zinc-600 px-2 py-0.5 rounded font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-5 mt-4">
        <button
          onClick={() => swipe('left')}
          className="w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-400 flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all shadow-sm text-xl font-bold"
        >
          ✕
        </button>
        <p className="text-xs text-zinc-400 font-medium">
          {index + 1} / {filtered.length}
          {cart.length > 0 && <span className="ml-2 text-green-600 font-semibold">{cart.length} in cart</span>}
        </p>
        <button
          onClick={() => swipe('right')}
          className="w-14 h-14 rounded-full bg-white border-2 border-green-200 text-green-500 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-all shadow-sm text-xl font-bold"
        >
          ♥
        </button>
      </div>
    </div>
  )
}
