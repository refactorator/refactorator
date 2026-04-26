import { useState, useCallback } from 'react'
import ChatPanel from './components/ChatPanel'
import StorefrontPanel from './components/StorefrontPanel'
import ProfileSelector from './components/ProfileSelector'

export default function App() {
  const [layout, setLayout] = useState([])
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
        content: `Switched to ${profile.name} profile. Default layout loaded.`,
        id: Date.now(),
      },
    ])
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 shrink-0">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <span className="text-zinc-900 text-xs font-black">F</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Folio</span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-500">Refactorator Demo</span>
            </div>
          </div>

          {/* Profile Selector */}
          <div className="flex-1 flex justify-center">
            <ProfileSelector activeProfile={activeProfile} onSelect={handleProfileSelect} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-zinc-600">New York, NY</span>
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
              J
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex min-h-0">
        <div className="max-w-screen-2xl w-full mx-auto flex gap-0 h-[calc(100vh-65px)]">
          {/* Chat */}
          <div className="w-80 shrink-0 p-4 pr-2">
            <ChatPanel
              onLayoutChange={handleLayoutChange}
              externalMessages={chatMessages}
            />
          </div>

          {/* Storefront */}
          <div className="flex-1 min-w-0 p-4 pl-2">
            <div className="panel h-full">
              {/* Store header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-200">
                    {activeProfile ? activeProfile.name : 'Folio Storefront'}
                  </span>
                  {activeProfile && (
                    <span className="text-xs text-zinc-500">{activeProfile.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">{layout.length} module{layout.length !== 1 ? 's' : ''} active</span>
                  {layout.length > 0 && (
                    <button
                      onClick={() => { setLayout([]); setActiveProfile(null) }}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 49px)' }}>
                <StorefrontPanel layout={layout} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
