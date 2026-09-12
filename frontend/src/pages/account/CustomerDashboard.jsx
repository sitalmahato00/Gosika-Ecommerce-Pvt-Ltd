import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, PackageCheck, RotateCcw, Heart, Ticket, Clock, ArrowRight, Star, MapPin, LifeBuoy, Lock } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { initials, money, formatDateTime } from '../../utils/format'
import StatusOrderTable from '../../components/admin/StatusOrderTable'
import { AccountPage, AccountSection, AccountGrid, AccountStat, AccountSkeleton } from './AccountUI'

const ACTIVE_STATUSES = ['confirmed', 'accepted', 'processing', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery']

export default function CustomerDashboard() {
  const { user } = useAuth()
  const { ids: wishlistIds } = useWishlist()
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .get('/orders', { params: { per_page: 100 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        if (alive) setOrders(Array.isArray(raw) ? raw : [])
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    api
      .get('/customer/returns', { params: { per_page: 100 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        if (alive) setReturns(Array.isArray(raw) ? raw : [])
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const name = user?.name || 'Customer'

  const recent = useMemo(
    () =>
      orders.slice(0, 10).map((o) => ({
        id: o.order_number || o.id,
        item: o.items?.[0]?.product_name || `${o.items?.length || 0} items`,
        date: o.placed_at ? formatDateTime(o.placed_at) : '',
        amount: Number(o.grand_total) || 0,
        status: o.status,
        _order: o,
      })),
    [orders]
  )

  const collect = useMemo(() => ({
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    delivered: orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length,
    pendingReturns: returns.filter((r) => ['requested', 'under_review'].includes(r.status)).length,
  }), [orders, returns])

  if (loading) {
    return (
      <AccountPage title="Account Overview" subtitle="Your buyer hub — orders, savings, lists & more.">
        <AccountSkeleton rows={3} height={90} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="Account Overview" subtitle="Your buyer hub — orders, savings, lists & more.">
      {/* Greeting hero card */}
      <div className="card" style={{ background: 'linear-gradient(120deg,#161d2b 0%,#253046 100%)', borderRadius: 18, border: 'none', padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, color: '#fff', boxShadow: '0 8px 24px -6px rgba(15,23,42,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17 }}>{initials(name)}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Welcome back, {name.split(' ')[0]}</div>
            <div style={{ fontSize: 12.5, color: '#cbd5e1', fontWeight: 500 }}>Your buyer hub · orders, savings, lists & more</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL SPEND</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{money(orders.reduce((s, o) => s + (Number(o.grand_total) || 0), 0))}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{orders.length} order{orders.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* KPI row */}
      <AccountGrid min={155}>
        <AccountStat label="Active Orders" value={collect.active} sub="In transit" icon={ShoppingBag} tone="primary" to="/account/orders/active" />
        <AccountStat label="Delivered" value={collect.delivered} sub="All time" icon={PackageCheck} tone="success" to="/account/orders" />
        <AccountStat label="Pending Returns" value={collect.pendingReturns} sub="Action needed" icon={RotateCcw} tone="purple" to="/account/returns" />
        <AccountStat label="Wishlist" value={wishlistIds.length} sub="Saved for later" icon={Heart} tone="danger" to="/account/wishlist" />
        <AccountStat label="My Vouchers" value="—" sub="Check deals" icon={Ticket} tone="blue" to="/account/vouchers" />
      </AccountGrid>

      {/* Quick actions */}
      <AccountGrid min={170}>
        {[
          { label: 'Track Order', to: '/account/orders/active', icon: Clock, tone: 'primary' },
          { label: 'My Reviews', to: '/account/reviews', icon: Star, tone: 'success' },
          { label: 'Addresses', to: '/account/addresses', icon: MapPin, tone: 'purple' },
          { label: 'Help Center', to: '/account/help', icon: LifeBuoy, tone: 'blue' },
          { label: 'Security', to: '/account/security', icon: Lock, tone: 'danger' },
        ].map((a) => (
          <Link key={a.label} to={a.to}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: `var(--${a.tone}-50, var(--primary-50))`, color: `var(--${a.tone}, var(--primary))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a.icon size={18} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{a.label}</span>
            <ArrowRight size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </Link>
        ))}
      </AccountGrid>

      {/* Status-tinted order history */}
      <AccountSection
        title="My Recent Orders"
        action={<Link to="/account/orders" style={{ color: 'var(--primary)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>All Orders <ArrowRight size={13} /></Link>}
        pad={18}
      >
        <StatusOrderTable
          columns={[
            { key: 'id', label: 'Order', render: (r) => <span style={{ color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>#{r.id}</span> },
            { key: 'item', label: 'Item' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
            { key: 'status', label: 'Status', render: (r, badge) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
          ]}
          rows={recent}
          getStatus={(r) => r.status}
          statusFilter={filter}
          onStatusFilter={setFilter}
          searchPlaceholder="Search orders…"
          perPage={6}
        />
      </AccountSection>
    </AccountPage>
  )
}