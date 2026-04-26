import { products } from '../../data/storeData'

function applyFilters(items, filter = {}) {
  return items.filter((p) => {
    if (filter.category && p.category !== filter.category) return false
    if (filter.lowStock) {
      const total = Object.values(p.stock).reduce((a, b) => a + b, 0)
      if (total > 8) return false
    }
    return true
  })
}

export default function InventoryTable({ filter = {} }) {
  const filtered = applyFilters(products, filter)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Inventory · {filtered.length} items
        </p>
        <input
          type="text"
          placeholder="Search SKU or product..."
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-md px-3 py-1.5 w-48 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-800 border-b border-zinc-700">
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">SKU</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Product</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Category</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Price</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Sizes</th>
              <th className="text-right text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Total Stock</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0)
              const isLow = totalStock <= 5
              const isOut = totalStock === 0

              return (
                <tr
                  key={p.id}
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${
                    i === filtered.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-zinc-500">{p.sku}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">{p.category}</td>
                  <td className="px-4 py-3 text-zinc-300">${p.price}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.sizes.join(', ')}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${
                    isOut ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-zinc-200'
                  }`}>
                    {totalStock}
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Out of stock</span>
                    ) : isLow ? (
                      <span className="badge-low">Low stock</span>
                    ) : (
                      <span className="badge bg-zinc-700/50 text-zinc-400 border border-zinc-600/30">In stock</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
