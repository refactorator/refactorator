import { useState, useRef, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the UI personalization engine for Folio, a mid-range fashion retailer. Your job is to interpret natural language requests and return structured JSON describing how to render the storefront interface.

## Available Modules
- **ProductGrid**: A grid of product cards. Supports filters.
- **CouponBar**: List of active discount coupons. Supports filter by code.
- **ScrollingBar**: A horizontally scrolling ticker of products. Supports filters.
- **TopSellers**: A ranked list of top-selling items. Supports filters.
- **InventoryTable**: Internal inventory table with SKU, stock levels, and alerts. For store associates.
- **LoyaltyWidget**: Shows loyalty points balance, tier, and recent purchases.
- **SwipeCard**: Tinder-style swipe interface — one product card at a time, swipe right to add to cart, swipe left to skip. Great for browsing filtered selections interactively.

## Layout Positions
- **top**: Full-width bar at the top (scrolling ticker, announcements) — compact height
- **bottom**: Full-width bar at the bottom
- **left**: Left sidebar (~288px wide) — good for coupons, loyalty, filters
- **center**: Main content area — good for grids, tables, swipe cards
- **right**: Right sidebar (~288px wide) — good for recommendations, top sellers, loyalty

## Product Filter Options
Filters go inside the "filter" object:
- category: "tops" | "pants" | "dresses" | "outerwear" | "accessories" | "kids"
- gender: "women" | "men" | "unisex" | "kids"
- tags: array of ["sale", "new", "top-seller", "mothers-day", "linen"]
- tag: single tag string
- brand: "Folio" | "Folio Kids"
- size: a size string like "S", "M", "4", "2T" etc.
- lowStock: true (only show items with ≤5 total stock)
- code: a specific coupon code (for CouponBar only)

## Available Coupons
SPRING25 (25% off spring), SAVE15 ($15 off $100+), KIDS20 (20% off kids), MEMBER10 (10% loyalty exclusive), FREESHIP (free shipping), MOMDAY30 (30% off women's Mother's Day)

## Response Format
You MUST return a valid JSON object with exactly this structure:
{
  "layout": [
    { "position": "top|bottom|left|center|right", "module": "ModuleName", "filter": {} }
  ],
  "message": "A friendly, helpful message describing what you set up."
}

Rules:
- Return ONLY valid JSON — no markdown, no extra text outside the JSON object
- You can include 1-5 layout items
- "message" should be 1-2 sentences, warm and direct
- If a user asks for a swipe/dating-app/Tinder-style interface, use SwipeCard in the center position
- Never invent module names not in the list above`

export default function ChatPanel({ onLayoutChange, externalMessages = [] }) {
  const [internalMessages, setInternalMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const prevExternalRef = useRef([])

  useEffect(() => {
    const newOnes = externalMessages.slice(prevExternalRef.current.length)
    if (newOnes.length > 0) {
      setInternalMessages((m) => [...m, ...newOnes])
      prevExternalRef.current = externalMessages
    }
  }, [externalMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [internalMessages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text, id: Date.now() }
    const newMessages = [...internalMessages, userMsg]
    setInternalMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')

      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: newMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content })),
      })

      const raw = response.content[0]?.text || ''
      let parsed
      try {
        // Strip markdown code fences and leading/trailing whitespace
        const cleaned = raw
          .replace(/^```(?:json)?\s*/im, '')
          .replace(/```\s*$/im, '')
          .trim()
        parsed = JSON.parse(cleaned)
      } catch {
        // Fall back to extracting the first JSON object in the response
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            parsed = JSON.parse(match[0])
          } catch {
            throw new Error('Could not parse layout from response')
          }
        } else {
          throw new Error('No layout data returned')
        }
      }

      if (parsed.layout) onLayoutChange(parsed.layout)

      setInternalMessages((prev) => [
        ...prev,
        { role: 'assistant', content: parsed.message || 'Layout updated.', id: Date.now() + 1 },
      ])
    } catch (err) {
      setInternalMessages((prev) => [
        ...prev,
        { role: 'error', content: `${err.message}`, id: Date.now() + 1 },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const messages = internalMessages

  return (
    <div className="panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-zinc-800">Folio Assistant</span>
        </div>
        <span className="text-xs text-zinc-400">Personalize your view</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="py-6 space-y-4">
            <p className="text-sm text-zinc-500 leading-relaxed text-center">
              Describe the layout you want in plain language.
            </p>
            <div className="space-y-2">
              {[
                'Show me all pants on sale with coupons on the left',
                "Top sellers for Mother's Day and active offers",
                'Swipe through all sale items like Tinder',
                'Store associate inventory view',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setInput(ex); textareaRef.current?.focus() }}
                  className="block w-full text-left text-xs text-zinc-500 bg-stone-50 border border-zinc-200 rounded-xl px-3 py-2.5 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'error' ? (
              <div className="max-w-[85%] bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">
                {msg.content}
              </div>
            ) : msg.role === 'system' ? (
              <div className="w-full bg-stone-50 border border-zinc-100 text-zinc-400 text-xs rounded-xl px-3 py-2 italic text-center">
                {msg.content}
              </div>
            ) : msg.role === 'user' ? (
              <div className="max-w-[85%] bg-zinc-900 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 font-medium">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[85%] bg-stone-50 border border-zinc-200 text-zinc-700 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-50 border border-zinc-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-100 shrink-0">
        <div className="flex items-end gap-2 bg-stone-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus-within:border-zinc-400 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder="Describe the layout you want..."
            rows={1}
            className="flex-1 bg-transparent text-zinc-800 text-sm placeholder-zinc-400 resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1.5 text-center">↵ send · shift+↵ new line</p>
      </div>
    </div>
  )
}
