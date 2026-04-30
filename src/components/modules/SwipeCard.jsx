import { useState, useRef } from 'react'
import { useStore } from '../../context/StoreContext'
import { applyProductFilters } from './ProductGrid'

const SWIPE_THRESHOLD = 80

export default function SwipeCard({ filter = {} }) {
  const { products, getProductImage } = useStore()
  const filtered = applyProductFilters(products, filter)
  const [index, setIndex] = useState(0)
  const [cart, setCart] = useState([])
  const [drag, setDrag] = useState({ active: false, x: 0, startX: 0 })
  const [flyDir, setFlyDir] = useState(null)

  const current = filtered[index]
  const next = filtered[index + 1]
  const done = index >= filtered.length

  const startDrag = (clientX) => setDrag({ active: true, x: 0, startX: clientX })
  const moveDrag = (clientX) => {
    if (!drag.active) return
    setDrag((d) => ({ ...d, x: clientX - d.startX }))
  }
  const endDrag = () => {
    if (!drag.active) return
    const delta = drag.x
    setDrag({ active: false, x: 0, startX: 0 })
    if (delta > SWIPE_THRESHOLD) swipe('right')
    else if (delta < -SWIPE_THRESHOLD) swipe('left')
  }

  const swipe = (dir) => {
    setFlyDir(dir)
    setTimeout(() => {
      if (dir === 'right') setCart((c) => [...c, current])
      setIndex((i) => i + 1)
      setFlyDir(null)
    }, 280)
  }

  const rotate = drag.active ? drag.x * 0.07 : 0
  const translateX = flyDir === 'right' ? 600 : flyDir === 'left' ? -600 : drag.x
  const opacity = flyDir ? 0 : 1
  const showAdd = (drag.active && drag.x > 30) || flyDir === 'right'
  const showPass = (drag.active && drag.x < -30) || flyDir === 'left'

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-5">
        <p className="text-lg font-bold text-zinc-900">All done</p>
        <p className="text-sm text-zinc-400">{cart.length} item{cart.length !== 1 ? 's' : ''} added to cart</p>
        {cart.length > 0 && (
          <div className="w-full space-y-2 max-w-xs text-left">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cart</p>
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-stone-50 border border-zinc-200 rounded-xl px-3 py-2">
                <img src={getProductImage(item, 40, 50)} className="w-8 h-10 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-400">${item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => { setIndex(0); setCart([]) }}
          className="text-xs font-semibold text-zinc-400 underline underline-offset-2 hover:text-zinc-700"
        >
          Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-5 px-4 select-none">
      <div className="w-full text-center mb-2">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Swipe to Shop</p>
        <p className="text-xs text-zinc-400 mt-0.5">{index + 1} of {filtered.length}{cart.length > 0 && ` · ${cart.length} in cart`}</p>
      </div>

      <div className="relative w-full max-w-xs mx-auto" style={{ height: 340 }}>
        {next && (
          <div className="absolute inset-x-4 top-3 bottom-0 bg-white border border-zinc-200 rounded-2xl shadow-sm" />
        )}
        {current && (
          <div
            className="absolute inset-0 bg-white border border-zinc-200 rounded-2xl shadow-md overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
              opacity,
              transition: drag.active ? 'none' : 'transform 0.28s ease, opacity 0.28s ease',
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
              src={getProductImage(current, 400, 260)}
              alt={current.name}
              className="w-full h-44 object-cover pointer-events-none"
            />
            <div className="absolute top-3 left-3 pointer-events-none"
              style={{ opacity: showAdd ? Math.min(Math.abs(drag.x) / 80, 1) || 1 : 0 }}>
              <span className="border-2 border-green-500 text-green-600 text-sm font-black px-2 py-0.5 rounded-lg -rotate-12 inline-block">ADD</span>
            </div>
            <div className="absolute top-3 right-3 pointer-events-none"
              style={{ opacity: showPass ? Math.min(Math.abs(drag.x) / 80, 1) || 1 : 0 }}>
              <span className="border-2 border-red-400 text-red-400 text-sm font-black px-2 py-0.5 rounded-lg rotate-12 inline-block">PASS</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">{current.category}</p>
              <div className="flex items-start justify-between mt-0.5">
                <p className="text-base font-bold text-zinc-900 leading-tight flex-1 mr-2">{current.name}</p>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-zinc-900">${current.price}</p>
                  {current.originalPrice && <p className="text-xs text-zinc-400 line-through">${current.originalPrice}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {current.sizes.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs bg-stone-100 text-zinc-600 px-2 py-0.5 rounded font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 mt-3">
        <button onClick={() => swipe('left')} className="w-12 h-12 rounded-full bg-white border-2 border-zinc-200 text-zinc-400 flex items-center justify-center hover:border-red-300 hover:text-red-400 transition-all shadow-sm text-lg font-bold">✕</button>
        <button onClick={() => swipe('right')} className="w-12 h-12 rounded-full bg-white border-2 border-zinc-200 text-zinc-400 flex items-center justify-center hover:border-green-300 hover:text-green-500 transition-all shadow-sm text-lg">♥</button>
      </div>
    </div>
  )
}
