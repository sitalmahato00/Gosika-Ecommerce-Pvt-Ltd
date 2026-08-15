import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Clock, Trash, Check, Eye, Edit, XCircle, ArrowPath } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/orders').then((res) => {
      setOrders(res.data.data?.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}><Skeleton height={200} /><Skeleton height={200} /></div>
  }

  if (!orders.length) return <EmptyState icon={ShoppingBag} title="No Orders" message="You haven't placed any orders yet." />

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>My Orders</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {(orders && orders.map((o) => (
            <div key={o.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={o.product_cover || '/placeholder-product.jpg'}
                  alt={o.product_name}
                  className="w-16 h-16 object-cover rounded-sm"
                />
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 4 }}>{o.product_name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>× {o.quantity}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Order #{o.id}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }>Rs. {o.total}</span>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Status: {o.status}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Ordered: {formatDate(o.created_at)}</span>
              </div>
            </div>
          ))}
        ]}

        <div style={{ marginTop: 24 }}>
          <a href="/cart" className="btn btn-outline mt-4">Place New Order</a>
        </div>
      </div>
    </div>
  )
}