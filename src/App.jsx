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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-0 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-14 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-black tracking-tighter text-zinc-900">FOLIO</span>
            <span className="text-xs text-zinc-300 font-medium hidden sm:block">New York</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-zinc-900 transition-colors">Women</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Men</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Kids</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Sale</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">New</a>
          </nav>

          {/* Profile Selector */}
          <div className="flex-1 flex justify-center">
            <ProfileSelector activeProfile={activeProfile} onSelect={handleProfileSelect} />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0">
            <button className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block">Search</button>
            <button className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block">Bag (0)</button>
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-white font-semibold">
              J
            </div>
          </div>
        </div>
      </header>

      {/* Personalization label */}
      {activeProfile && (
        <div className="bg-zinc-900 text-white text-xs font-semibold text-center py-2 tracking-wide">
          Viewing as: {activeProfile.name} — {activeProfile.description}
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex min-h-0" style={{ height: 'calc(100vh - 57px)' }}>
        <div className="max-w-screen-2xl w-full mx-auto flex h-full">
          {/* Chat */}
          <div className="w-80 shrink-0 p-4 pr-2">
            <ChatPanel
              onLayoutChange={handleLayoutChange}
              externalMessages={chatMessages}
            />
          </div>

          {/* Storefront */}
          <div className="flex-1 min-w-0 py-4 pl-2 pr-4">
            <div className="panel h-full flex flex-col overflow-hidden">
              {/* Store subheader */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest">
                    {activeProfile ? activeProfile.name : 'All Products'}
                  </p>
                  <span className="text-zinc-300 text-xs">—</span>
                  <span className="text-xs text-zinc-400">{layout.length} module{layout.length !== 1 ? 's' : ''}</span>
                </div>
                {activeProfile && (
                  <button
                    onClick={() => { setLayout(DEFAULT_LAYOUT); setActiveProfile(null) }}
                    className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    Reset to default
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <StorefrontPanel layout={layout} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
