import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Heart, MapPin, Clock, CheckCircle2, Truck,
  ShoppingBag, ArrowRight, CreditCard
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { money, formatDate, errorMessage } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'

const PENDING_STATUSES = ['pending', 'payment_pending', 'confirmed', 'accepted']
const IN_TRANSIT_STATUSES = ['processing', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'shipped']
const DELIVERED_STATUSES = ['delivered', 'completed']

export default function AccountDashboard() {
  const { user } = useAuth()
  const { ids } = useWishlist()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/orders', { params: { per_page: 50 } })
      .then((res) => setOrders(res.data?.data?.data || []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const total = orders.length
  const pending = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length
  const inTransit = orders.filter((o) => IN_TRANSIT_STATUSES.includes(o.status)).length
  const delivered = orders.filter((o) => DELIVERED_STATUSES.includes(o.status)).length

  const KPIs = [
    { icon: Package, label: 'Total Orders', value: total, to: '/orders', color: 'blue', sub: 'All time' },
    { icon: Clock, label: 'Pending', value: pending, to: '/orders?status=pending', color: 'amber', sub: 'Need attention' },
    { icon: Truck, label: 'In Transit', value: inTransit, to: '/orders', color: 'purple', sub: 'On the way' },
    { icon: CheckCircle2, label: 'Delivered', value: delivered, to: '/orders?status=delivered', color: 'green', sub: 'Completed' },
    { icon: Heart, label: 'Wishlist', value: ids?.length || 0, to: '/wishlist', color: 'red', sub: 'Saved items' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
        <Skeleton height={280} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={load} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome */}
      <div>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h2>
        <p className="muted text-sm m-0">Here's a summary of your activity on GOSIKA.</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        {KPIs.map((k) => {
          const colorClass = `kpi-${k.color}`
          return (
            <Link
              key={k.label}
              to={k.to}
              className={`kpi-card ${colorClass}`}
              style={{ display: 'block', textDecoration: 'none' }}
              aria-label={`${k.label}: ${k.value}`}
            >
              <div className="kpi-icon">
                <k.icon size={20} aria-hidden="true" />
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label" style={{ marginBottom: 2 }}>{k.label}</div>
              <div className="kpi-sub">{k.sub}</div>
            </Link>
          )
        })}
      </div>

      {/* Recent orders */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>Recent Orders</h3>
          <Link to="/orders" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              message="You haven't placed any orders yet. Start shopping!"
              action={<Link to="/shop" className="btn btn-primary">Browse Products</Link>}
            />
          </div>
        ) : (
          <div>
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
                    <span className="font-semibold" style={{ fontSize: 14 }}>
                      #{order.order_number || order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="muted text-xs">
                    {formatDate(order.placed_at || order.created_at)} · {order.items?.length ?? 0} item{order.items?.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-bold" style={{ fontSize: 15 }}>{money(order.grand_total)}</div>
                  <div style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                    View →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { icon: ShoppingBag, label: 'Continue Shopping', to: '/shop', color: 'var(--primary)', bg: 'var(--primary-50)' },
          { icon: Heart, label: 'My Wishlist', to: '/wishlist', color: '#dc2626', bg: '#fef2f2' },
          { icon: MapPin, label: 'My Addresses', to: '/account/addresses', color: 'var(--success)', bg: 'var(--success-bg)' },
          { icon: CreditCard, label: 'Payment Methods', to: '/account/payments', color: 'var(--warning)', bg: 'var(--warning-bg)' },
        ].map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="card card-hover"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, textDecoration: 'none', color: 'var(--ink)',
            }}
          >
            <span style={{
              width: 40, height: 40, borderRadius: 'var(--radius)',
              background: a.bg, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <a.icon size={18} color={a.color} aria-hidden="true" />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
