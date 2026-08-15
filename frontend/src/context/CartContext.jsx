import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const SESSION_KEY = 'gosika_cart_session'

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = 'guest_' + crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const sessionId = useRef(getSessionId())

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('gosika_token')
    const headers = token ? {} : { 'X-Session-Id': sessionId.current }
    try {
      const res = await api.get('/cart', { headers })
      const data = res.data.data || res.data
      if (data && Array.isArray(data.items)) {
        setCart(data)
      } else {
        setCart(null)
      }
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [user?.id, fetchCart])

  const withHeaders = (token) =>
    token ? {} : { 'X-Session-Id': sessionId.current }

  const run = async (fn) => {
    const token = localStorage.getItem('gosika_token')
    const result = await fn(token ? {} : withHeaders(token))
    await fetchCart()
    return result
  }

  const addItem = async ({ productId, variantId = null, quantity = 1 }) => {
    const token = localStorage.getItem('gosika_token')
    const res = await api.post(
      '/cart/items',
      {
        product_id: productId,
        variant_id: variantId,
        quantity,
      },
      { headers: token ? {} : { 'X-Session-Id': sessionId.current } }
    )
    await fetchCart()
    return res
  }

  const updateItem = async (itemId, quantity) => {
    const token = localStorage.getItem('gosika_token')
    const res = await api.put(
      `/cart/items/${itemId}`,
      { quantity },
      { headers: token ? {} : { 'X-Session-Id': sessionId.current } }
    )
    await fetchCart()
    return res
  }

  const removeItem = async (itemId) => {
    const token = localStorage.getItem('gosika_token')
    const res = await api.delete(`/cart/items/${itemId}`, {
      headers: token ? {} : { 'X-Session-Id': sessionId.current },
    })
    await fetchCart()
    return res
  }

  const clearCart = async () => {
    const token = localStorage.getItem('gosika_token')
    const res = await api.delete('/cart', {
      headers: token ? {} : { 'X-Session-Id': sessionId.current },
    })
    await fetchCart()
    return res
  }

  const itemCount = cart?.item_count || 0
  const subtotal = Number(cart?.subtotal || 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        subtotal,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        run,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
