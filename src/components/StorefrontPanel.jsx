import ProductGrid from './modules/ProductGrid'
import CouponBar from './modules/CouponBar'
import ScrollingBar from './modules/ScrollingBar'
import TopSellers from './modules/TopSellers'
import InventoryTable from './modules/InventoryTable'
import LoyaltyWidget from './modules/LoyaltyWidget'
import SwipeCard from './modules/SwipeCard'

const MODULE_MAP = {
  ProductGrid,
  CouponBar,
  ScrollingBar,
  TopSellers,
  InventoryTable,
  LoyaltyWidget,
  SwipeCard,
}

function ModuleWrapper({ module: moduleName, filter }) {
  const Component = MODULE_MAP[moduleName]
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-20 text-zinc-400 text-sm">
        Unknown module: {moduleName}
      </div>
    )
  }
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Component filter={filter || {}} />
      </div>
    </div>
  )
}

export default function StorefrontPanel({ layout = [] }) {
  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
        <p className="text-sm">Select a profile or type in the chat to get started</p>
      </div>
    )
  }

  const top = layout.filter((l) => l.position === 'top')
  const bottom = layout.filter((l) => l.position === 'bottom')
  const left = layout.filter((l) => l.position === 'left')
  const right = layout.filter((l) => l.position === 'right')
  const center = layout.filter((l) => l.position === 'center')

  const hasTop = top.length > 0
  const hasBottom = bottom.length > 0
  const hasLeft = left.length > 0
  const hasRight = right.length > 0
  const hasCenter = center.length > 0

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Top bar */}
      {hasTop && top.map((item, i) => (
        <div key={i} className="border-b border-zinc-100 shrink-0 overflow-hidden">
          <ModuleWrapper module={item.module} filter={item.filter} />
        </div>
      ))}

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        {hasLeft && (
          <div className="w-72 shrink-0 border-r border-zinc-100 overflow-y-auto">
            {left.map((item, i) => (
              <ModuleWrapper key={i} module={item.module} filter={item.filter} />
            ))}
          </div>
        )}

        {/* Center */}
        {hasCenter && (
          <div className="flex-1 overflow-y-auto">
            {center.map((item, i) => (
              <ModuleWrapper key={i} module={item.module} filter={item.filter} />
            ))}
          </div>
        )}

        {/* Right sidebar */}
        {hasRight && (
          <div className="w-72 shrink-0 border-l border-zinc-100 overflow-y-auto">
            {right.map((item, i) => (
              <ModuleWrapper key={i} module={item.module} filter={item.filter} />
            ))}
          </div>
        )}

        {/* Fallback if only top/bottom set */}
        {!hasLeft && !hasCenter && !hasRight && (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
            Add a center, left, or right module in the chat
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {hasBottom && bottom.map((item, i) => (
        <div key={i} className="border-t border-zinc-100 shrink-0 overflow-hidden">
          <ModuleWrapper module={item.module} filter={item.filter} />
        </div>
      ))}
    </div>
  )
}
