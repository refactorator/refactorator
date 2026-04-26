import { coupons } from '../../data/storeData'

export default function CouponBar({ filter = {} }) {
  let filtered = coupons.filter((c) => c.active)

  if (filter.code) {
    filtered = filtered.filter((c) => c.code === filter.code)
  }

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Active Coupons
      </p>
      {filtered.map((coupon) => (
        <div
          key={coupon.id}
          className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏷️</span>
            <div>
              <p className="text-sm font-semibold text-white">{coupon.description}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Expires {coupon.expires} · {coupon.applies_to}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-sm font-bold text-emerald-400">{coupon.discount}</span>
            <button
              className="bg-zinc-700 hover:bg-zinc-600 text-xs font-semibold text-zinc-200 px-3 py-1.5 rounded-md transition-colors font-mono tracking-wide"
              onClick={() => navigator.clipboard?.writeText(coupon.code)}
            >
              {coupon.code}
            </button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex items-center justify-center h-20 text-zinc-500 text-sm">
          No active coupons match this filter
        </div>
      )}
    </div>
  )
}
