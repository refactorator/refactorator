import { useStore } from '../../context/StoreContext'

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
  const { products } = useStore()
  const filtered = applyFilters(products, filter)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Inventory — {filtered.length} items
        </p>
        <input
          type="text"
          placeholder="Search SKU or product..."
          className="bg-stone-50 border border-zinc-200 text-zinc-700 text-xs rounded-lg px-3 py-2 w-52 focus:outline-none focus:border-zinc-400 placeholder-zinc-400"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-stone-50 border-b border-zinc-200">
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">SKU</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Product</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Category</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Price</th>
              <th className="text-left text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Sizes</th>
              <th className="text-right text-zinc-400 font-semibold px-4 py-3 uppercase tracking-wider">Stock</th>
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
                  className={`border-b border-zinc-100 hover:bg-stone-50 transition-colors ${
                    i === filtered.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{p.sku}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-800">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-500 capitalize">{p.category}</td>
                  <td className="px-4 py-3 font-bold text-zinc-800">${p.price}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.sizes.join(', ')}</td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-zinc-800'
                  }`}>
                    {totalStock}
                  </td>
                  <td className="px-4 py-3">
                    {isOut ? (
                      <span className="badge bg-red-100 text-red-600">Out of stock</span>
                    ) : isLow ? (
                      <span className="badge-low">Low stock</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">In stock</span>
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
