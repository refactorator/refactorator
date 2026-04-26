import ProductGrid from './modules/ProductGrid'
import CouponBar from './modules/CouponBar'
import ScrollingBar from './modules/ScrollingBar'
import TopSellers from './modules/TopSellers'
import InventoryTable from './modules/InventoryTable'
import LoyaltyWidget from './modules/LoyaltyWidget'

const MODULE_MAP = {
  ProductGrid,
  CouponBar,
  ScrollingBar,
  TopSellers,
  InventoryTable,
  LoyaltyWidget,
}

function ModuleWrapper({ module: moduleName, filter, label }) {
  const Component = MODULE_MAP[moduleName]
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-20 text-zinc-500 text-sm">
        Unknown module: {moduleName}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {label && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <Component filter={filter || {}} />
      </div>
    </div>
  )
}

export default function StorefrontPanel({ layout = [] }) {
  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
        <div className="text-4xl">🏪</div>
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
    <div className="flex flex-col h-full gap-3 p-3">
      {/* Top bar */}
      {hasTop && top.map((item, i) => (
        <div key={i} className="panel shrink-0 max-h-32 overflow-hidden">
          <ModuleWrapper module={item.module} filter={item.filter} />
        </div>
      ))}

      {/* Main area */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left sidebar */}
        {hasLeft && (
          <div className="panel w-72 shrink-0 overflow-hidden flex flex-col">
            {left.map((item, i) => (
              <div key={i} className="flex-1 overflow-y-auto">
                <ModuleWrapper module={item.module} filter={item.filter} />
              </div>
            ))}
          </div>
        )}

        {/* Center */}
        {hasCenter && (
          <div className="panel flex-1 overflow-hidden flex flex-col">
            {center.map((item, i) => (
              <div key={i} className="flex-1 overflow-y-auto">
                <ModuleWrapper module={item.module} filter={item.filter} />
              </div>
            ))}
          </div>
        )}

        {/* Right sidebar */}
        {hasRight && (
          <div className="panel w-72 shrink-0 overflow-hidden flex flex-col">
            {right.map((item, i) => (
              <div key={i} className="flex-1 overflow-y-auto">
                <ModuleWrapper module={item.module} filter={item.filter} />
              </div>
            ))}
          </div>
        )}

        {/* If only top and/or bottom (no left/center/right), show a placeholder */}
        {!hasLeft && !hasCenter && !hasRight && (
          <div className="panel flex-1 flex items-center justify-center text-zinc-600 text-sm">
            Add a center, left, or right module in the chat
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {hasBottom && bottom.map((item, i) => (
        <div key={i} className="panel shrink-0 max-h-32 overflow-hidden">
          <ModuleWrapper module={item.module} filter={item.filter} />
        </div>
      ))}
    </div>
  )
}
