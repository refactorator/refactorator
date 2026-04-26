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

## Layout Positions
- **top**: Full-width bar at the top (scrolling ticker, announcements, coupons) — max height ~120px
- **bottom**: Full-width bar at the bottom (similar to top)
- **left**: Left sidebar (~288px wide) — good for coupons, loyalty, filters
- **center**: Main content area — good for product grids, top sellers, inventory table
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

## Available Product Categories
tops, pants, dresses, outerwear, accessories, kids

## Response Format
You MUST return a valid JSON object with exactly this structure:
{
  "layout": [
    { "position": "top|bottom|left|center|right", "module": "ModuleName", "filter": {} }
  ],
  "message": "A friendly, conversational message to show the user describing what you've set up for them."
}

Rules:
- Return ONLY valid JSON — no markdown fences, no extra text
- You can include 1-5 layout items
- Each layout position can only appear once (except you can have both top and bottom)
- "message" should be 1-2 sentences, warm and helpful
- If the request is ambiguous, make a reasonable interpretation and explain it in "message"
- Never invent module names not listed above`

export default function ChatPanel({ onLayoutChange, externalMessages = [] }) {
  const [internalMessages, setInternalMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const prevExternalRef = useRef([])

  // Merge new external messages (e.g. profile switches) into the chat
  useEffect(() => {
    const prev = prevExternalRef.current
    const newOnes = externalMessages.slice(prev.length)
    if (newOnes.length > 0) {
      setInternalMessages((m) => [...m, ...newOnes])
      prevExternalRef.current = externalMessages
    }
  }, [externalMessages])

  const messages = internalMessages

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
      if (!apiKey) {
        throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')
      }

      const client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
      })

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: newMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content })),
      })

      const raw = response.content[0]?.text || ''
      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch {
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
        else throw new Error('Claude returned non-JSON response')
      }

      if (parsed.layout) onLayoutChange(parsed.layout)

      const assistantMsg = {
        role: 'assistant',
        content: parsed.message || 'Layout updated.',
        id: Date.now() + 1,
      }
      setInternalMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg = {
        role: 'error',
        content: `Error: ${err.message}`,
        id: Date.now() + 1,
      }
      setInternalMessages((prev) => [...prev, errorMsg])
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

  return (
    <div className="panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-zinc-200">Folio AI</span>
        </div>
        <span className="text-xs text-zinc-500">Personalize your view</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="text-3xl">✦</div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Describe the interface you want in plain language.
            </p>
            <div className="space-y-2 mt-4">
              {[
                'Show me all pants in size small with coupons on the left',
                "Top sellers for Mother's Day on the right, new arrivals in the center",
                'Give me the store associate inventory view',
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setInput(ex); textareaRef.current?.focus() }}
                  className="block w-full text-left text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
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
              <div className="max-w-[85%] bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg px-3 py-2">
                {msg.content}
              </div>
            ) : msg.role === 'system' ? (
              <div className="w-full bg-zinc-800/50 border border-zinc-700/30 text-zinc-400 text-xs rounded-lg px-3 py-2 italic text-center">
                {msg.content}
              </div>
            ) : msg.role === 'user' ? (
              <div className="max-w-[85%] bg-white text-zinc-900 text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 font-medium">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[85%] bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 focus-within:border-zinc-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder="Describe the layout you want..."
            rows={1}
            className="flex-1 bg-transparent text-zinc-200 text-sm placeholder-zinc-500 resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-lg bg-white text-zinc-900 flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5 text-center">↵ to send · shift+↵ for new line</p>
      </div>
    </div>
  )
}
