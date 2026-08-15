import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash, Check, X, Plus, Eye, Edit } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function CustomerCart() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState('')
  const [openRemove, setOpenRemove] = useState(false)
  const [removeItem, setRemoveItem] = useState(null)

  useEffect(() => {
    api.get('/customer/cart').then((res) => {
      setItems(res.data.data?.items || [])
    }).catch((e) => setError(e)).finally(() => setLoading(false))
  }, [])

  const remove = async (id) => {
    setOpenRemove(true)
    setRemoveItem(id)
  }

  const confirmRemove = async () => {
    if (!removeItem) return
    await api.delete(`/customer/cart/items/${removeItem}`)
    setItems(items.filter((i) => i.id !== removeItem))
    setOpenRemove(false)
    setRemoveItem(null)
    toast.success('Item removed from cart')
  }

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}><Skeleton height={200} /><Skeleton height={200} /></div>
  }

  if (error) return <ErrorState onRetry={() => {}} />

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const subtotal = items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0)

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Cart</h2>

        {items.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-center gap-3">
                  <img
                    src={item.cover_image || item.images?.[0] || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 style={{ fontSize: 14, marginBottom: 4 }}>{item.name}</h4>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>Vendor: {item.vendor_name || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-muted">Price</span>
                  <span className="font-medium">${item.price}</span>
                  <span className="text-xs text-muted ml-2">× {item.quantity || 1}</span>
                </div>
                {item.quantity > 1 && (
                  <div className="mt-2">
                    <button className="btn btn-sm btn-outline" onClick={() => setItems(items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))}>-</button>
                    <span className="ml-2 font-medium">{item.quantity - 1}</button>
                    <button className="btn btn-sm btn-outline" onClick={() => setItems(items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}>+</button>
                  </div>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => setOpenRemove(true)}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} title="Cart is empty" message="Add products to start shopping.">
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
          </EmptyState>
        }

        <div className="card p-4 mt-6" style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Order Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div>
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
          </div>

          {coupon && (
            <div style={{ margin: '10px 0', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <span>Coupon</span>
              <span>-${coupon}</span>
            </div>
          )}

          <div style={{ margin: '10px 0', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <span>Total</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }>${subtotal + (coupon ? Number(coupon.replace('-', '')) : 0)}</span>
          </div>

          <button className="btn btn-primary w-full mt-4" style={{ marginTop: 12 }}>
            <span style={{ flex: 1 }}>Proceed to Checkout</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12hM19 12"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}