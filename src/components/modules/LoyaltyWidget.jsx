import { storeInfo } from '../../data/storeData'

export default function LoyaltyWidget({ filter = {} }) {
  const { loyaltyPoints, loyaltyTier, nextTier, pointsToNextTier, recentOrders } = storeInfo
  const totalToNext = loyaltyPoints + pointsToNextTier
  const progress = Math.round((loyaltyPoints / totalToNext) * 100)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Loyalty Status</p>
        <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
          ⭐ {loyaltyTier}
        </span>
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{loyaltyPoints.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">points balance</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-300">{pointsToNextTier} pts to {nextTier}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{loyaltyTier}</span>
            <span>{nextTier}</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Recent Purchases</p>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between text-xs bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5"
            >
              <div>
                <p className="text-zinc-200 font-medium">{order.item}</p>
                <p className="text-zinc-500 mt-0.5">{order.date}</p>
              </div>
              <span className="font-semibold text-zinc-300">${order.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
