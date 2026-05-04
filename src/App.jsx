import { useState, useCallback, useEffect, useRef } from 'react'
import ChatPanel from './components/ChatPanel'
import StorefrontPanel from './components/StorefrontPanel'
import ProfileSelector from './components/ProfileSelector'
import { useStore } from './context/StoreContext'

const DEFAULT_LAYOUT = [
  { position: 'top', module: 'ScrollingBar', filter: {} },
  { position: 'center', module: 'ProductGrid', filter: {} },
  { position: 'right', module: 'TopSellers', filter: {} },
]

const SUGGESTED_STORES = [
  'gymshark.com',
  'allbirds.com',
  'ruggable.com',
  'chubbiesshorts.com',
  'brooklinen.com',
  'bombas.com',
  'mejuri.com',
  'huckberry.com',
]

// ── Store chip (connected store tag in header) ─────────────────────────────────
function StoreChip({ domain, name, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 bg-stone-100 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
      <span className="max-w-[90px] truncate">{name || domain}</span>
      <button
        onClick={onRemove}
        className="text-zinc-400 hover:text-zinc-700 transition-colors leading-none ml-0.5"
      >✕</button>
    </div>
  )
}

// ── Add store input ────────────────────────────────────────────────────────────
function AddStoreInput() {
  const { addStore, loading, errors, stores } = useStore()
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const isAnyLoading = Object.values(loading).some(Boolean)
  const lastError = Object.values(errors)[0]

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const val = input.trim()
    if (!val) return
    await addStore(val)
    setInput('')
    inputRef.current?.blur()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-4">
      <div className={`flex items-center gap-2 flex-wrap bg-stone-100 border rounded-xl px-3 py-2 transition-all ${focused ? 'border-zinc-400 bg-white' : 'border-transparent'}`}>
        {!focused && !isAnyLoading && (
          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        )}
        {isAnyLoading && (
          <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" />
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={stores.length === 0 ? 'Enter any Shopify store — gymshark.com…' : 'Add another store…'}
          className="flex-1 bg-transparent text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none min-w-[160px]"
        />
        {focused && input && (
          <button type="submit" className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 shrink-0 transition-colors">Add ↵</button>
        )}
      </div>
      {lastError && <p className="text-xs text-red-500 mt-1 px-3">{lastError}</p>}
    </form>
  )
}

// ── Landing state ─────────────────────────────────────────────────────────────
function LandingState() {
  const { addStore, loading } = useStore()
  const [selected, setSelected] = useState(new Set())
  const isAnyLoading = Object.values(loading).some(Boolean)

  const toggleStore = (domain) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(domain) ? next.delete(domain) : next.add(domain)
      return next
    })
  }

  const connectSelected = async () => {
    await Promise.all([...selected].map(d => addStore(d)))
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 text-center">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 mb-2">Browse differently.</h1>
        <p className="text-zinc-400 text-sm max-w-sm">Pick one store or a dozen. Ask anything. Your AI reshapes the view in real time.</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {SUGGESTED_STORES.map(s => (
          <button
            key={s}
            onClick={() => toggleStore(s)}
            disabled={isAnyLoading}
            className={`text-sm font-medium rounded-xl px-4 py-2.5 border transition-all disabled:opacity-40 ${
              selected.has(s)
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'text-zinc-600 bg-white border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <button
          onClick={connectSelected}
          disabled={isAnyLoading}
          className="bg-zinc-900 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {isAnyLoading ? 'Loading…' : `Browse ${selected.size} store${selected.size !== 1 ? 's' : ''} →`}
        </button>
      )}

      {!selected.size && (
        <p className="text-xs text-zinc-400">Or type any Shopify domain in the bar above</p>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { stores, isConnected, allProducts, removeStore, disconnectAll } = useStore()
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [activeProfile, setActiveProfile] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [toast, setToast] = useState(null)

  // Reset layout when first store connects or all stores removed
  useEffect(() => {
    if (isConnected) setLayout(DEFAULT_LAYOUT)
  }, [isConnected])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const MAPPED_CATEGORIES = ['tops', 'pants', 'dresses', 'outerwear', 'shoes', 'accessories', 'kids']
  const categories = [...new Set(allProducts.map(p => p.category))]
    .filter(c => MAPPED_CATEGORIES.includes(c))
    .sort()

  const handleLayoutChange = useCallback((newLayout) => setLayout(newLayout), [])

  const handleProfileSelect = useCallback((profile) => {
    setActiveProfile(profile)
    setLayout(profile.defaultLayout)
  }, [])

  const filterByCategory = (cat) => {
    setLayout([
      { position: 'top', module: 'ScrollingBar', filter: { category: cat } },
      { position: 'center', module: 'ProductGrid', filter: { category: cat } },
      { position: 'right', module: 'TopSellers', filter: { category: cat } },
    ])
    setActiveProfile(null)
  }

  const storeName = stores.length === 1
    ? stores[0].name
    : stores.length > 1 ? `${stores.length} stores` : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50 font-sans">
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl animate-fade-in pointer-events-none">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-5 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center h-14 gap-3">
          {/* Logo */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-lg font-black tracking-tighter text-zinc-900">GOOEY</span>
            {isConnected && <span className="text-xs text-zinc-300 font-medium hidden sm:block">browser</span>}
          </div>

          {/* Add store input */}
          <AddStoreInput />

          {/* Connected store chips */}
          {stores.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 max-w-xs">
              {stores.map(s => (
                <StoreChip
                  key={s.domain}
                  domain={s.domain}
                  name={s.name}
                  onRemove={() => removeStore(s.domain)}
                />
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {isConnected && (
              <button
                onClick={disconnectAll}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Clear all
              </button>
            )}
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-white font-semibold">J</div>
          </div>
        </div>

        {/* Category nav */}
        {isConnected && (
          <div className="max-w-screen-2xl mx-auto flex items-center gap-1 pb-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => filterByCategory(cat)}
                className="text-xs font-semibold text-zinc-500 uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-lg hover:bg-stone-100 hover:text-zinc-900 transition-colors"
              >
                {cat}
              </button>
            ))}
            {categories.length > 0 && (
              <button
                onClick={() => { setLayout(DEFAULT_LAYOUT); setActiveProfile(null) }}
                className="text-xs font-semibold text-zinc-400 uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-lg hover:bg-stone-100 hover:text-zinc-900 transition-colors ml-2"
              >
                All
              </button>
            )}
          </div>
        )}
      </header>

      {/* Profile bar */}
      {activeProfile && isConnected && (
        <div className="bg-zinc-900 text-white px-6 py-2 shrink-0 flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">{activeProfile.name}</span>
          <span className="text-zinc-600 text-xs">—</span>
          <span className="text-xs text-zinc-400 italic truncate">"{activeProfile.prompt}"</span>
          <button
            onClick={() => { setLayout(DEFAULT_LAYOUT); setActiveProfile(null) }}
            className="ml-auto shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        <div className="max-w-screen-2xl w-full mx-auto flex h-full">
          {!isConnected ? (
            <div className="flex-1">
              <LandingState />
            </div>
          ) : (
            <>
              {/* Chat */}
              <div className="w-72 shrink-0 h-full p-4 pr-2 overflow-hidden flex flex-col">
                <ChatPanel
                  onLayoutChange={handleLayoutChange}
                  onProfileSelect={handleProfileSelect}
                  externalMessages={chatMessages}
                />
              </div>

              {/* Storefront */}
              <div className="flex-1 min-w-0 h-full py-4 pl-2 pr-4 overflow-hidden flex flex-col">
                <div className="panel h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest">
                        {activeProfile ? activeProfile.name : storeName}
                      </span>
                      <span className="text-zinc-200 text-xs">—</span>
                      <span className="text-xs text-zinc-400">{allProducts.length.toLocaleString()} products · {layout.length} module{layout.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ProfileSelector activeProfile={activeProfile} onSelect={handleProfileSelect} />
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <StorefrontPanel layout={layout} onLayoutChange={handleLayoutChange} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
