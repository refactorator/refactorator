import { coupons } from '../../data/storeData'

export default function CouponBar({ filter = {} }) {
  let filtered = coupons.filter((c) => c.active)
  if (filter.code) filtered = filtered.filter((c) => c.code === filter.code)

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
        Offers & Coupons
      </p>
      {filtered.map((coupon) => (
        <div
          key={coupon.id}
          className="flex items-center justify-between bg-stone-50 border border-zinc-200 rounded-xl px-4 py-3 hover:border-zinc-300 transition-colors"
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-semibold text-zinc-900 leading-tight">{coupon.description}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Expires {coupon.expires}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-zinc-900">{coupon.discount}</span>
            <button
              className="bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors font-mono tracking-wider"
              onClick={() => navigator.clipboard?.writeText(coupon.code)}
              title="Click to copy"
            >
              {coupon.code}
            </button>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="flex items-center justify-center h-20 text-zinc-400 text-sm">
          No active coupons
        </div>
      )}
    </div>
  )
}
