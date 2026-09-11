import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight, Truck } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime } from '../../utils/format'
import { AccountPage, AccountSection, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

const ACTIVE_STATUSES = ['confirmed', 'accepted', 'processing', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery']

export default function AccountActiveOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/orders', { params: { per_page: 100 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        const list = Array.isArray(raw) ? raw : []
        setOrders(list.filter((o) => ACTIVE_STATUSES.includes(o.status)))
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Active Order Tracking" subtitle="Orders that are confirmed, preparing or on the way to you.">
        <AccountSkeleton rows={3} height={92} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Active Order Tracking" subtitle="Orders that are confirmed, preparing or on the way to you.">
        <AccountError message="Could not load your orders." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage
      title="Active Order Tracking"
      subtitle="Orders that are confirmed, preparing or on the way to you."
      actions={<Link to="/account/orders" className="btn btn-outline btn-sm">All Orders</Link>}
    >
      {orders.length === 0 ? (
        <AccountEmpty
          icon={Truck}
          title="No active orders"
          message="You don't have any orders in transit right now. Start shopping to track your next order here."
          action={<Link to="/shop" className="btn btn-primary">Browse Products</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 18, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div className="font-semibold" style={{ fontSize: 14, color: 'var(--primary)' }}>#{o.order_number || o.id}</div>
                  <div className="muted text-xs">{o.placed_at ? formatDateTime(o.placed_at) : ''}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="muted text-sm">
                  {o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'} · Total{' '}
                  <strong style={{ color: 'var(--ink)' }}>{money(o.grand_total)}</strong>
                </div>
                <Link to={`/account/orders/${o.id}`} className="flex items-center gap-1.5" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  <MapPin size={15} /> Track Order <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}