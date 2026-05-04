import { createContext, useContext, useState, useMemo } from 'react'
import { fetchShopifyStore } from '../services/shopifyService'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [stores, setStores] = useState([])       // [{ domain, name, products, coupons, storeInfo, getProductImage }]
  const [loading, setLoading] = useState({})     // { domain: true/false }
  const [errors, setErrors] = useState({})       // { domain: errorMsg }

  const allProducts = useMemo(() =>
    stores.flatMap(s =>
      s.products.map(p => ({ ...p, storeDomain: s.domain, storeName: s.name }))
    ), [stores])

  const allCoupons = useMemo(() =>
    stores.flatMap(s => s.coupons), [stores])

  const isLoading = Object.values(loading).some(Boolean)
  const isConnected = stores.length > 0

  function getProductImage(product, w = 400, h = 500) {
    // Find the store this product belongs to for its getProductImage fn
    const store = stores.find(s => s.domain === product.storeDomain) ?? stores[0]
    if (store) return store.getProductImage(product, w, h)
    if (product.imageUrl) return product.imageUrl
    const seed = product.id?.replace(/\D/g, '').slice(-8) || '1'
    return `https://picsum.photos/seed/${seed}/${w}/${h}`
  }

  async function addStore(domain) {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    if (stores.find(s => s.domain === clean)) return { success: false, error: 'Already connected' }

    setLoading(l => ({ ...l, [clean]: true }))
    setErrors(e => { const next = { ...e }; delete next[clean]; return next })

    try {
      const data = await fetchShopifyStore(clean)
      setStores(prev => [...prev, {
        domain: clean,
        name: data.storeName,
        products: data.products,
        coupons: data.coupons,
        storeInfo: data.storeInfo,
        getProductImage: data.getProductImage,
      }])
      setLoading(l => ({ ...l, [clean]: false }))
      return { success: true, storeName: data.storeName, productCount: data.products.length }
    } catch (err) {
      setLoading(l => ({ ...l, [clean]: false }))
      setErrors(e => ({ ...e, [clean]: err.message }))
      return { success: false, error: err.message }
    }
  }

  function removeStore(domain) {
    setStores(prev => prev.filter(s => s.domain !== domain))
    setErrors(e => { const next = { ...e }; delete next[domain]; return next })
  }

  function disconnectAll() {
    setStores([])
    setLoading({})
    setErrors({})
  }

  // backward-compat aliases consumed by existing modules
  const storeDomain = stores[0]?.domain ?? null
  const storeName = stores.length === 1
    ? stores[0].name
    : stores.length > 1 ? `${stores.length} stores` : null
  const storeInfo = stores[0]?.storeInfo ?? null

  return (
    <StoreContext.Provider value={{
      stores, allProducts, allCoupons,
      isLoading, isConnected, loading, errors,
      addStore, removeStore, disconnectAll, getProductImage,
      // backward compat
      products: allProducts,
      coupons: allCoupons,
      storeDomain,
      storeName,
      storeInfo,
      // legacy — some components still call connectShopifyStore
      connectShopifyStore: addStore,
      disconnect: disconnectAll,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
