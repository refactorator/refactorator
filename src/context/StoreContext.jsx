import { createContext, useContext, useState } from 'react'
import { products as demoProducts, coupons as demoCoupons, storeInfo as demoStoreInfo, getProductImage as demoGetImage } from '../data/storeData'
import { fetchShopifyStore } from '../services/shopifyService'

const StoreContext = createContext(null)

const DEMO_STATE = {
  products: demoProducts,
  coupons: demoCoupons,
  storeInfo: demoStoreInfo,
  storeName: 'Folio',
  getProductImage: demoGetImage,
  isDemo: true,
  isLoading: false,
  error: null,
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEMO_STATE)

  async function connectShopifyStore(domain) {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchShopifyStore(domain)
      setState({ ...data, isDemo: false, isLoading: false, error: null })
      return { success: true, storeName: data.storeName }
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: err.message }))
      return { success: false, error: err.message }
    }
  }

  function disconnect() {
    setState(DEMO_STATE)
  }

  return (
    <StoreContext.Provider value={{ ...state, connectShopifyStore, disconnect }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
