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

function UrlBar() {
  const { storeDomain, storeName, isLoading, error, connectShopifyStore, disconnect } = useStore()
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const val = input.trim()
    if (!val) return
    await connectShopifyStore(val)
    setInput('')
    inputRef.current?.blur()
  }

  const displayValue = focused ? input : (storeDomain || input)

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-lg mx-4">
      <div className={`flex items-center gap-2 bg-stone-100 border rounded-xl px-3 py-2 transition-all ${focused ? 'border-zinc-400 bg-white' : 'border-transparent'}`}>
        {storeDomain && !focused && (
          <div className="w-4 h-4 shrink-0 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        )}
        {!storeDomain && !focused && (
          <svg className="w-4 h-4 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        )}
        <input
          ref={inputRef}
          value={focused ? input : (storeDomain ? `${storeDomain} — ${storeName}` : '')}
          onChange={e => setInput(e.target.value)}
          onFocus={() => { setFocused(true); setInput(storeDomain || '') }}
          onBlur={() => { setFocused(false); setInput('') }}
          placeholder="Enter any Shopify store — gymshark.com, allbirds.com…"
          className="flex-1 bg-transparent text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none min-w-0"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin shrink-0" />
        )}
        {storeDomain && !isLoading && !focused && (
          <button type="button" onClick={disconnect} className="text-zinc-400 hover:text-zinc-600 text-xs shrink-0 transition-colors">✕</button>
        )}
        {focused && input && (
          <button type="submit" className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 shrink-0 transition-colors">Go ↵</button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1 px-3">{error}</p>}
    </form>
  )
}

function LandingState({ onConnect }) {
  const { connectShopifyStore, isLoading } = useStore()
  const suggestions = ['gymshark.com', 'allbirds.com', 'ruggable.com', 'chubbiesshorts.com', 'brooklinen.com']

  const connect = async (domain) => {
    const result = await connectShopifyStore(domain)
    if (result.success) onConnect?.(result)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 text-center">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 mb-2">Browse differently.</h1>
        <p className="text-zinc-400 text-sm max-w-sm">Enter any Shopify store above and let your AI reshape the interface around you.</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => connect(s)}
            disabled={isLoading}
            className="text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 hover:border-zinc-400 hover:text-zinc-900 transition-all disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
      {isLoading && <p className="text-xs text-zinc-400 animate-pulse">Loading store…</p>}
    </div>
  )
}

export default function App() {
  const { storeName, storeDomain, products } = useStore()
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [activeProfile, setActiveProfile] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [toast, setToast] = useState(null)

  const isConnected = !!storeDomain

  // Reset layout when store changes
  useEffect(() => {
    if (isConnected) setLayout(DEFAULT_LAYOUT)
  }, [storeDomain])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Dynamic category nav from real store data
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort()
  const navCategories = categories.length > 0
    ? categories.slice(0, 5)
    : ['Women', 'Men', 'Kids', 'Sale', 'New']

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout)
  }, [])

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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50 font-sans">
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl animate-fade-in pointer-events-none">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-5 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center h-14 gap-4">
          {/* GOOEY logo */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-lg font-black tracking-tighter text-zinc-900">GOOEY</span>
            {isConnected && (
              <span className="text-xs text-zinc-300 font-medium hidden sm:block">browser</span>
            )}
          </div>

          {/* URL bar */}
          <UrlBar />

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-white font-semibold">J</div>
          </div>
        </div>

        {/* Category nav — only shown when store is connected */}
        {isConnected && (
          <div className="max-w-screen-2xl mx-auto flex items-center gap-1 pb-2 overflow-x-auto">
            {navCategories.map(cat => (
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
              <LandingState onConnect={({ storeName, productCount }) =>
                setToast(`Connected to ${storeName} — ${productCount} products loaded`)
              } />
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
                      <span className="text-xs text-zinc-400">{layout.length} module{layout.length !== 1 ? 's' : ''}</span>
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
