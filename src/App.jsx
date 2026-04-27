import { useState, useCallback } from 'react'
import ChatPanel from './components/ChatPanel'
import StorefrontPanel from './components/StorefrontPanel'
import ProfileSelector from './components/ProfileSelector'

const DEFAULT_LAYOUT = [
  { position: 'top', module: 'ScrollingBar', filter: { tags: ['new'] } },
  { position: 'center', module: 'ProductGrid', filter: {} },
  { position: 'right', module: 'CouponBar', filter: {} },
]

export default function App() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [activeProfile, setActiveProfile] = useState(null)
  const [chatMessages, setChatMessages] = useState([])

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout)
  }, [])

  const handleProfileSelect = useCallback((profile) => {
    setActiveProfile(profile)
    setLayout(profile.defaultLayout)
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'system',
        content: `Switched to ${profile.name}. Default layout loaded.`,
        id: Date.now(),
      },
    ])
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-14 gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xl font-black tracking-tighter text-zinc-900">FOLIO</span>
            <span className="text-xs text-zinc-300 font-medium hidden sm:block">New York</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <a href="#" className="hover:text-zinc-900 transition-colors">Women</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Men</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Kids</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Sale</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">New</a>
          </nav>
          <div className="flex-1 flex justify-center">
            <ProfileSelector activeProfile={activeProfile} onSelect={handleProfileSelect} />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-zinc-400 hidden sm:block">Bag (0)</span>
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-white font-semibold">J</div>
          </div>
        </div>
      </header>

      {/* Profile prompt bar */}
      {activeProfile && (
        <div className="bg-zinc-900 text-white px-6 py-2 shrink-0 flex items-center gap-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">Active Layout</span>
          <span className="text-zinc-400 text-xs">—</span>
          <span className="text-xs text-zinc-300 italic truncate">"{activeProfile.prompt}"</span>
          <button
            onClick={() => { setLayout(DEFAULT_LAYOUT); setActiveProfile(null) }}
            className="ml-auto shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main — flex-1 min-h-0 ensures this fills exactly the remaining vertical space */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        <div className="max-w-screen-2xl w-full mx-auto flex h-full">
          {/* Chat panel */}
          <div className="w-80 shrink-0 h-full p-4 pr-2 overflow-hidden flex flex-col">
            <ChatPanel
              onLayoutChange={handleLayoutChange}
              externalMessages={chatMessages}
            />
          </div>

          {/* Storefront */}
          <div className="flex-1 min-w-0 h-full py-4 pl-2 pr-4 overflow-hidden flex flex-col">
            <div className="panel h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold text-zinc-800 uppercase tracking-widest">
                    {activeProfile ? activeProfile.name : 'All Products'}
                  </p>
                  <span className="text-zinc-200 text-xs">—</span>
                  <span className="text-xs text-zinc-400">{layout.length} module{layout.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">Drag modules to rearrange · Click ✕ to remove</p>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <StorefrontPanel layout={layout} onLayoutChange={handleLayoutChange} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
