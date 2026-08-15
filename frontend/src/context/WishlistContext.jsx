import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setIds([])
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/wishlist')
      const items = res.data.data || res.data
      setIds(Array.isArray(items) ? items.map((i) => i.product?.id || i.product_id) : [])
    } catch {
      setIds([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchWishlist()
  }, [user?.id, fetchWishlist])

  const toggle = async (productId) => {
    if (!user) return { requireAuth: true }
    if (busyId) return null
    setBusyId(productId)
    try {
      if (ids.includes(productId)) {
        await api.delete('/wishlist/items', { data: { product_id: productId } })
        setIds((p) => p.filter((i) => i !== productId))
      } else {
        await api.post('/wishlist/items', { product_id: productId })
        setIds((p) => [...p, productId])
      }
      return { ok: true }
    } catch {
      return { ok: false }
    } finally {
      setBusyId(null)
    }
  }

  const isWishlisted = (id) => ids.includes(id)

  return (
    <WishlistContext.Provider value={{ ids, loading, busyId, toggle, isWishlisted, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
