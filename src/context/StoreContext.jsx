import { createContext, useContext, useState } from 'react'
import { fetchShopifyStore } from '../services/shopifyService'

const StoreContext = createContext(null)

const EMPTY_STATE = {
  products: [],
  coupons: [],
  storeInfo: null,
  storeName: null,
  storeDomain: null,
  getProductImage: () => null,
  isLoading: false,
  error: null,
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(EMPTY_STATE)

  async function connectShopifyStore(domain) {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const data = await fetchShopifyStore(domain)
      setState({ ...EMPTY_STATE, ...data, isLoading: false })
      return { success: true, storeName: data.storeName, productCount: data.products.length }
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: err.message }))
      return { success: false, error: err.message }
    }
  }

  function disconnect() {
    setState(EMPTY_STATE)
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
