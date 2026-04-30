import { useState, useRef, useCallback } from 'react'
import { useStore } from '../context/StoreContext'
import ProductGrid from './modules/ProductGrid'
import CouponBar from './modules/CouponBar'
import ScrollingBar from './modules/ScrollingBar'
import TopSellers from './modules/TopSellers'
import InventoryTable from './modules/InventoryTable'
import LoyaltyWidget from './modules/LoyaltyWidget'
import SwipeCard from './modules/SwipeCard'

const MODULE_MAP = { ProductGrid, CouponBar, ScrollingBar, TopSellers, InventoryTable, LoyaltyWidget, SwipeCard }

const CATALOG = [
  { name: 'ProductGrid',    label: 'Product Grid',   desc: 'Grid of product cards',          icon: '⊞', positions: ['center','left','right'] },
  { name: 'ScrollingBar',   label: 'Scrolling Bar',  desc: 'Horizontal scrolling ticker',    icon: '↔', positions: ['top','bottom'] },
  { name: 'TopSellers',     label: 'Top Sellers',    desc: 'Ranked featured products',       icon: '↑', positions: ['right','left','center'] },
  { name: 'CouponBar',      label: 'Coupons',        desc: 'Active discount codes',          icon: '%', positions: ['left','right'] },
  { name: 'LoyaltyWidget',  label: 'Loyalty',        desc: 'Points balance & orders',        icon: '★', positions: ['left','right'] },
  { name: 'InventoryTable', label: 'Inventory',      desc: 'SKU and stock levels',           icon: '≡', positions: ['center'] },
  { name: 'SwipeCard',      label: 'Swipe to Shop',  desc: 'Tinder-style product cards',     icon: '♥', positions: ['center'] },
]

const FILTER_TAGS = ['sale', 'new', 'top-seller']
const GENDERS = ['women', 'men', 'unisex', 'kids']

function moduleLabel(module, filter = {}) {
  if (module === 'ProductGrid') {
    if (filter.tags?.includes('sale')) return 'On Sale'
    if (filter.tags?.includes('new')) return 'New Arrivals'
    if (filter.category) return filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
    return 'All Products'
  }
  if (module === 'ScrollingBar') {
    if (filter.lowStock) return 'Low Stock Alert'
    if (filter.tags?.includes('sale')) return 'On Sale'
    if (filter.tags?.includes('new')) return 'New Arrivals'
    if (filter.category) return filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
    return 'Feed'
  }
  if (module === 'TopSellers') return 'Top Sellers'
  if (module === 'CouponBar') return 'Offers & Coupons'
  if (module === 'InventoryTable') return 'Inventory'
  if (module === 'LoyaltyWidget') return 'Loyalty'
  if (module === 'SwipeCard') return 'Swipe to Shop'
  return module
}

// ── Filter Editor ──────────────────────────────────────────────────────────────
function FilterEditor({ module, filter, onSave, onClose }) {
  const { products } = useStore()
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort()
  const [f, setF] = useState({ ...filter })

  const toggle = (key, val) => setF(prev => {
    const arr = prev[key] ? [...prev[key]] : []
    return arr.includes(val)
      ? { ...prev, [key]: arr.filter(x => x !== val) }
      : { ...prev, [key]: [...arr, val] }
  })

  const showTagsFilter = ['ProductGrid','ScrollingBar','SwipeCard','TopSellers'].includes(module)
  const showCategoryFilter = ['ProductGrid','ScrollingBar','SwipeCard','TopSellers','InventoryTable'].includes(module)
  const showGenderFilter = ['ProductGrid','ScrollingBar','SwipeCard','TopSellers'].includes(module)
  const showLowStock = ['InventoryTable','ScrollingBar'].includes(module)

  return (
    <div className="absolute top-full left-0 right-0 z-30 bg-white border border-zinc-200 rounded-b-xl shadow-lg p-4 space-y-4">
      {showCategoryFilter && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setF(p => ({ ...p, category: undefined }))}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${!f.category ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
            >All</button>
            {categories.map(c => (
              <button key={c}
                onClick={() => setF(p => ({ ...p, category: p.category === c ? undefined : c }))}
                className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-colors ${f.category === c ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {showGenderFilter && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Gender</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setF(p => ({ ...p, gender: undefined }))}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${!f.gender ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
            >All</button>
            {GENDERS.map(g => (
              <button key={g}
                onClick={() => setF(p => ({ ...p, gender: p.gender === g ? undefined : g }))}
                className={`text-xs px-2.5 py-1 rounded-lg border capitalize transition-colors ${f.gender === g ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
              >{g}</button>
            ))}
          </div>
        </div>
      )}

      {showTagsFilter && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tags</p>
          <div className="flex gap-1.5">
            {FILTER_TAGS.map(t => (
              <button key={t}
                onClick={() => toggle('tags', t)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${f.tags?.includes(t) ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
              >{t}</button>
            ))}
          </div>
        </div>
      )}

      {showLowStock && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setF(p => ({ ...p, lowStock: !p.lowStock }))}
              className={`w-9 h-5 rounded-full transition-colors relative ${f.lowStock ? 'bg-zinc-900' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${f.lowStock ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-zinc-600">Low stock only</span>
          </label>
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-zinc-100">
        <button
          onClick={() => onSave(f)}
          className="flex-1 bg-zinc-900 text-white text-xs font-semibold py-2 rounded-lg hover:bg-zinc-700 transition-colors"
        >Apply</button>
        <button
          onClick={onClose}
          className="px-3 border border-zinc-200 text-zinc-500 text-xs rounded-lg hover:bg-stone-50 transition-colors"
        >Cancel</button>
      </div>
    </div>
  )
}

// ── Module Picker ──────────────────────────────────────────────────────────────
function ModulePicker({ targetPosition, occupiedPositions, onAdd, onClose }) {
  const available = CATALOG.filter(m => m.positions.includes(targetPosition))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-bold text-zinc-900">Add to {targetPosition}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Pick a module</p>
        </div>
        <div className="p-3 space-y-1">
          {available.map(m => (
            <button
              key={m.name}
              onClick={() => onAdd(m.name)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 transition-colors text-left"
            >
              <span className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-600 shrink-0">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-800">{m.label}</p>
                <p className="text-xs text-zinc-400">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 pb-4">
          <button onClick={onClose} className="w-full border border-zinc-200 text-zinc-500 text-xs font-semibold py-2 rounded-xl hover:bg-stone-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Zone (empty slot with + button) ───────────────────────────────────────
function AddZone({ position, onAdd, className }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <button
        onClick={() => onAdd(position)}
        className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-500 border border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl px-3 py-2 transition-all"
      >
        <span className="text-base leading-none">+</span>
        <span>Add module</span>
      </button>
    </div>
  )
}

// ── Resize Handle ──────────────────────────────────────────────────────────────
function ResizeHandle({ onMouseDown }) {
  return (
    <div
      className="w-2 shrink-0 cursor-col-resize flex items-center justify-center group hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
      onMouseDown={onMouseDown}
    >
      <div className="w-0.5 h-10 bg-zinc-200 group-hover:bg-zinc-400 rounded-full transition-colors" />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StorefrontPanel({ layout = [], onLayoutChange }) {
  const [draggedPos, setDraggedPos] = useState(null)
  const [dragOverPos, setDragOverPos] = useState(null)
  const [editingPos, setEditingPos] = useState(null)
  const [addingToPos, setAddingToPos] = useState(null)
  const [leftWidth, setLeftWidth] = useState(288)
  const [rightWidth, setRightWidth] = useState(288)
  const resizeRef = useRef({ active: false, side: null, startX: 0, startWidth: 0 })

  const byPos = (pos) => layout.find(l => l.position === pos)
  const occupiedPositions = layout.map(l => l.position)

  const startResize = useCallback((e, side) => {
    e.preventDefault()
    const startWidth = side === 'left' ? leftWidth : rightWidth
    resizeRef.current = { active: true, side, startX: e.clientX, startWidth }

    const onMove = (e) => {
      if (!resizeRef.current.active) return
      const delta = e.clientX - resizeRef.current.startX
      const newW = Math.max(200, Math.min(520, resizeRef.current.startWidth + (side === 'left' ? delta : -delta)))
      if (side === 'left') setLeftWidth(newW)
      else setRightWidth(newW)
    }
    const onUp = () => {
      resizeRef.current.active = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftWidth, rightWidth])

  const handleDrop = (targetPos) => {
    if (!draggedPos || draggedPos === targetPos || !onLayoutChange) return
    const updated = layout.map(item => {
      if (item.position === draggedPos) return { ...item, position: targetPos }
      if (item.position === targetPos) return { ...item, position: draggedPos }
      return item
    })
    onLayoutChange(updated)
    setDraggedPos(null)
    setDragOverPos(null)
  }

  const removeModule = (pos) => {
    if (onLayoutChange) onLayoutChange(layout.filter(l => l.position !== pos))
    if (editingPos === pos) setEditingPos(null)
  }

  const addModule = (moduleName) => {
    if (!addingToPos || !onLayoutChange) return
    onLayoutChange([...layout.filter(l => l.position !== addingToPos), { position: addingToPos, module: moduleName, filter: {} }])
    setAddingToPos(null)
  }

  const saveFilter = (pos, newFilter) => {
    if (!onLayoutChange) return
    onLayoutChange(layout.map(l => l.position === pos ? { ...l, filter: newFilter } : l))
    setEditingPos(null)
  }

  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-zinc-400">Describe a layout in the chat, or add a module below</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {['top','left','center','right'].map(pos => (
            <button key={pos} onClick={() => setAddingToPos(pos)}
              className="text-xs text-zinc-400 border border-dashed border-zinc-300 hover:border-zinc-500 hover:text-zinc-600 rounded-xl px-3 py-2 transition-all"
            >+ {pos}</button>
          ))}
        </div>
        {addingToPos && <ModulePicker targetPosition={addingToPos} occupiedPositions={[]} onAdd={addModule} onClose={() => setAddingToPos(null)} />}
      </div>
    )
  }

  const top = byPos('top')
  const bottom = byPos('bottom')
  const left = byPos('left')
  const center = byPos('center')
  const right = byPos('right')

  function DropZone({ position, children, className }) {
    const isOver = dragOverPos === position && draggedPos && draggedPos !== position
    return (
      <div
        className={`${className} relative transition-colors ${isOver ? 'bg-zinc-50 ring-2 ring-inset ring-zinc-300 rounded-xl' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOverPos(position) }}
        onDragLeave={() => setDragOverPos(null)}
        onDrop={() => handleDrop(position)}
      >
        {children}
      </div>
    )
  }

  function ModuleCard({ item }) {
    const Component = MODULE_MAP[item.module]
    if (!Component) return null
    const label = moduleLabel(item.module, item.filter)
    const isEditing = editingPos === item.pos || editingPos === item.position
    const pos = item.position

    return (
      <div className={`h-full flex flex-col transition-opacity ${draggedPos === pos ? 'opacity-30' : ''}`}>
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 shrink-0 bg-white cursor-grab active:cursor-grabbing select-none"
          draggable
          onDragStart={() => setDraggedPos(pos)}
          onDragEnd={() => { setDraggedPos(null); setDragOverPos(null) }}
        >
          <div className="flex items-center gap-2">
            <div className="text-zinc-300 hover:text-zinc-500 px-0.5 text-base leading-none select-none">⠿</div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Edit filter button */}
            <button
              onClick={() => setEditingPos(editingPos === pos ? null : pos)}
              className={`w-6 h-6 flex items-center justify-center rounded transition-all text-xs ${editingPos === pos ? 'bg-zinc-900 text-white' : 'text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100'}`}
              title="Edit filters"
            >⚙</button>
            {/* Remove button */}
            <button
              onClick={() => removeModule(pos)}
              className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-all text-xs"
              title="Remove"
            >✕</button>
          </div>
        </div>

        {/* Filter editor (drops down from header) */}
        {editingPos === pos && (
          <div className="relative z-20 shrink-0">
            <FilterEditor
              module={item.module}
              filter={item.filter || {}}
              onSave={newFilter => saveFilter(pos, newFilter)}
              onClose={() => setEditingPos(null)}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Component filter={item.filter || {}} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top row */}
      {top ? (
        <DropZone position="top" className="border-b border-zinc-100 shrink-0 overflow-hidden">
          <ModuleCard item={top} />
        </DropZone>
      ) : (
        <AddZone position="top" onAdd={setAddingToPos} className="h-10 border-b border-zinc-100 shrink-0" />
      )}

      {/* Middle */}
      <div className="flex flex-1 min-h-0">
        {/* Left */}
        {left ? (
          <>
            <DropZone position="left" className="shrink-0 border-r border-zinc-100 overflow-hidden flex flex-col" style={{ width: leftWidth }}>
              <ModuleCard item={left} />
            </DropZone>
            <ResizeHandle onMouseDown={e => startResize(e, 'left')} />
          </>
        ) : (
          <AddZone position="left" onAdd={setAddingToPos} className="w-12 border-r border-zinc-100 shrink-0" />
        )}

        {/* Center */}
        {center ? (
          <DropZone position="center" className="flex-1 overflow-hidden flex flex-col min-w-0">
            <ModuleCard item={center} />
          </DropZone>
        ) : (
          <AddZone position="center" onAdd={setAddingToPos} className="flex-1" />
        )}

        {/* Right */}
        {right ? (
          <>
            <ResizeHandle onMouseDown={e => startResize(e, 'right')} />
            <DropZone position="right" className="shrink-0 border-l border-zinc-100 overflow-hidden flex flex-col" style={{ width: rightWidth }}>
              <ModuleCard item={right} />
            </DropZone>
          </>
        ) : (
          <AddZone position="right" onAdd={setAddingToPos} className="w-12 border-l border-zinc-100 shrink-0" />
        )}
      </div>

      {/* Bottom row */}
      {bottom ? (
        <DropZone position="bottom" className="border-t border-zinc-100 shrink-0 overflow-hidden">
          <ModuleCard item={bottom} />
        </DropZone>
      ) : (
        <AddZone position="bottom" onAdd={setAddingToPos} className="h-10 border-t border-zinc-100 shrink-0" />
      )}

      {/* Module picker modal */}
      {addingToPos && (
        <ModulePicker
          targetPosition={addingToPos}
          occupiedPositions={occupiedPositions}
          onAdd={addModule}
          onClose={() => setAddingToPos(null)}
        />
      )}
    </div>
  )
}
