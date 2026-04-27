import { storeInfo } from '../../data/storeData'

export default function LoyaltyWidget({ filter = {} }) {
  const { loyaltyPoints, loyaltyTier, nextTier, pointsToNextTier, recentOrders } = storeInfo
  const totalToNext = loyaltyPoints + pointsToNextTier
  const progress = Math.round((loyaltyPoints / totalToNext) * 100)

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Loyalty</p>

      <div className="bg-zinc-900 text-white rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold">{loyaltyPoints.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">points balance</p>
          </div>
          <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wide">
            {loyaltyTier}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{loyaltyTier}</span>
            <span>{pointsToNextTier} pts to {nextTier}</span>
          </div>
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Recent Orders</p>
        <div className="space-y-1.5">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between text-xs rounded-xl px-3 py-2.5 bg-stone-50 border border-zinc-100"
            >
              <div>
                <p className="font-semibold text-zinc-800">{order.item}</p>
                <p className="text-zinc-400 mt-0.5">{order.date}</p>
              </div>
              <span className="font-bold text-zinc-700">${order.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
