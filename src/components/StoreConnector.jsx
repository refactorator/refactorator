import { useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function StoreConnector({ onConnect }) {
  const { storeName, isDemo, isLoading, error, connectShopifyStore, disconnect } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [localError, setLocalError] = useState(null)

  const handleConnect = async () => {
    if (!domain.trim()) {
      setLocalError('Please enter a store domain')
      return
    }
    setLocalError(null)
    const result = await connectShopifyStore(domain.trim())
    if (result.success) {
      setIsOpen(false)
      setDomain('')
      onConnect?.({ storeName: result.storeName, productCount: result.productCount })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConnect()
    if (e.key === 'Escape') setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        {!isDemo && (
          <>
            <span className="text-xs text-green-600 font-semibold hidden sm:block">● {storeName}</span>
            <button
              onClick={disconnect}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Disconnect
            </button>
          </>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
            isDemo
              ? 'border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 bg-white'
              : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'
          }`}
        >
          {isDemo ? 'Connect Store' : 'Switch Store'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-900 mb-1">Connect a Shopify Store</h2>
        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          Enter any public Shopify store domain. No login or API key required — works with any store that has public products.
        </p>

        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Store Domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="gymshark.com or mystore.myshopify.com"
            className="w-full bg-stone-50 border border-zinc-200 text-zinc-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-400 placeholder-zinc-400"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['gymshark.com', 'allbirds.com', 'ruggable.com', 'chubbiesshorts.com'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDomain(s)}
                className="text-xs text-zinc-400 bg-stone-50 border border-zinc-200 rounded-lg px-2.5 py-1 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {(localError || error) && (
          <p className="text-xs text-red-500 mt-3 leading-relaxed">{localError || error}</p>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-3 h-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            Fetching products from {domain}…
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex-1 bg-zinc-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 border border-zinc-200 text-zinc-500 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
