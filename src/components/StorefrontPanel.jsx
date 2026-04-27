import { useState } from 'react'
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

const ALL_POSITIONS = ['top', 'left', 'center', 'right', 'bottom']

function getModuleLabel(module, filter = {}) {
  const labels = {
    ProductGrid: filter.tags?.includes('sale') ? 'On Sale' : filter.tags?.includes('new') ? 'New Arrivals' : filter.tags?.includes('top-seller') ? 'Top Sellers' : filter.category ? filter.category.charAt(0).toUpperCase() + filter.category.slice(1) : 'Products',
    CouponBar: 'Offers & Coupons',
    ScrollingBar: filter.lowStock ? 'Low Stock Alert' : filter.tags?.includes('new') ? 'New Arrivals' : filter.tags?.includes('sale') ? 'On Sale' : filter.tags?.includes('mothers-day') ? "Mother's Day" : filter.category ? filter.category.charAt(0).toUpperCase() + filter.category.slice(1) : 'Feed',
    TopSellers: filter.tag === 'mothers-day' ? "Mother's Day — Top Sellers" : 'Top Sellers',
    InventoryTable: 'Inventory',
    LoyaltyWidget: 'Loyalty',
    SwipeCard: 'Swipe to Shop',
  }
  return labels[module] || module
}

export default function StorefrontPanel({ layout = [], onLayoutChange }) {
  const [draggedPos, setDraggedPos] = useState(null)
  const [dragOverPos, setDragOverPos] = useState(null)

  const handleDrop = (targetPos) => {
    if (!draggedPos || draggedPos === targetPos || !onLayoutChange) return
    const updated = layout.map((item) => {
      if (item.position === draggedPos) return { ...item, position: targetPos }
      if (item.position === targetPos) return { ...item, position: draggedPos }
      return item
    })
    onLayoutChange(updated)
    setDraggedPos(null)
    setDragOverPos(null)
  }

  const removeModule = (position) => {
    if (onLayoutChange) onLayoutChange(layout.filter((l) => l.position !== position))
  }

  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <p className="text-sm">Select a profile or describe a layout in the chat</p>
      </div>
    )
  }

  const byPos = (pos) => layout.find((l) => l.position === pos)

  const top = byPos('top')
  const bottom = byPos('bottom')
  const left = byPos('left')
  const center = byPos('center')
  const right = byPos('right')

  function DropZone({ position, children, className }) {
    const isOver = dragOverPos === position && draggedPos && draggedPos !== position
    const hasContent = !!byPos(position)

    return (
      <div
        className={`${className} relative transition-all ${
          draggedPos && !hasContent ? 'outline-dashed outline-2 outline-zinc-300 outline-offset-2 rounded-xl' : ''
        } ${isOver ? 'bg-zinc-100/60' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOverPos(position) }}
        onDragLeave={() => setDragOverPos(null)}
        onDrop={() => handleDrop(position)}
      >
        {draggedPos && !hasContent && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 pointer-events-none z-10">
            Drop here
          </div>
        )}
        {children}
      </div>
    )
  }

  function ModuleCard({ item }) {
    const Component = MODULE_MAP[item.module]
    if (!Component) return null
    const label = getModuleLabel(item.module, item.filter)
    const isDragging = draggedPos === item.position

    return (
      <div
        className={`h-full flex flex-col transition-opacity ${isDragging ? 'opacity-40' : ''}`}
        draggable
        onDragStart={() => setDraggedPos(item.position)}
        onDragEnd={() => { setDraggedPos(null); setDragOverPos(null) }}
      >
        {/* Module header bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 transition-colors px-1 select-none"
              title="Drag to move"
            >
              ⠿
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
          </div>
          <button
            onClick={() => removeModule(item.position)}
            className="w-5 h-5 flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-all text-xs"
            title="Remove module"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component filter={item.filter || {}} />
        </div>
      </div>
    )
  }

  const hasLeft = !!left
  const hasRight = !!right
  const hasCenter = !!center
  const hasTop = !!top
  const hasBottom = !!bottom

  return (
    <div className="flex flex-col h-full">
      {/* Top */}
      {hasTop ? (
        <DropZone position="top" className="border-b border-zinc-100 shrink-0 overflow-hidden">
          <ModuleCard item={top} />
        </DropZone>
      ) : draggedPos ? (
        <DropZone position="top" className="h-12 border-b border-zinc-100 shrink-0" />
      ) : null}

      {/* Middle row */}
      <div className="flex flex-1 min-h-0">
        {/* Left */}
        {hasLeft ? (
          <DropZone position="left" className="w-72 shrink-0 border-r border-zinc-100 overflow-hidden flex flex-col">
            <ModuleCard item={left} />
          </DropZone>
        ) : draggedPos ? (
          <DropZone position="left" className="w-16 border-r border-zinc-100 shrink-0" />
        ) : null}

        {/* Center */}
        {hasCenter ? (
          <DropZone position="center" className="flex-1 overflow-hidden flex flex-col">
            <ModuleCard item={center} />
          </DropZone>
        ) : (
          <DropZone position="center" className="flex-1 flex items-center justify-center">
            {!draggedPos && (
              <p className="text-xs text-zinc-400">Add a center module in the chat</p>
            )}
          </DropZone>
        )}

        {/* Right */}
        {hasRight ? (
          <DropZone position="right" className="w-72 shrink-0 border-l border-zinc-100 overflow-hidden flex flex-col">
            <ModuleCard item={right} />
          </DropZone>
        ) : draggedPos ? (
          <DropZone position="right" className="w-16 border-l border-zinc-100 shrink-0" />
        ) : null}
      </div>

      {/* Bottom */}
      {hasBottom ? (
        <DropZone position="bottom" className="border-t border-zinc-100 shrink-0 overflow-hidden">
          <ModuleCard item={bottom} />
        </DropZone>
      ) : draggedPos ? (
        <DropZone position="bottom" className="h-12 border-t border-zinc-100 shrink-0" />
      ) : null}
    </div>
  )
}
