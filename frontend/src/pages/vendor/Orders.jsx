import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Clock, Check, XCircle, Eye, Edit, Trash, ArrowPath, Calendar } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/orders', { params: { per_page: 10 } }).then((res) => {
      setOrders(res.data.data?.orders || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}><Skeleton height={200} /><Skeleton height={200} /></div>
  }

  if (!orders.length) return <EmptyState icon={ShoppingBag} title="No Orders" message="No orders found." />

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Orders</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(orders && orders.map((o) => (
            <div key={o.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={o.product_cover || '/placeholder-product.jpg'}
                  alt={o.product_name}
                  className="w-16 h-16 object-cover rounded-sm"
                />
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 2 }}>{o.product_name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>× {o.quantity}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span>Order #</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{o.id}</span>
                </div>
                <div>
                  <span>Status</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: 'var(--primary)', color: '#fff' }}>{o.status}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0' }}>Rs. {o.total}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Ordered: {formatDate(o.created_at)}</p>

              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Payment:</span>
                <span style={{ fontWeight: 500 }}>{o.payment_method}</span>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Delivery:</span>
                <span style={{ fontWeight: 500 }}>{o.shipping_method}</span>
              </div>
            </div>
          ))}
        ]}

        {!orders.length && (
          <EmptyState icon={ShoppingBag} title="No Orders" message="No orders found." />
        )}
      </div>
    </div>
  )
}