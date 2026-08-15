import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Package, ShoppingBag, Store, ArrowRight, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, BarChart2, Zap, ArrowUpRight,
  ArrowDownLeft, Truck, ShieldCheck, Percent, ExternalLink
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const DATE_FILTERS = ['Today', '7 Days', '30 Days', '90 Days']

const MOCK_14_DAYS_REVENUE = [
  ['08-02', 12500],
  ['08-03', 18400],
  ['08-04', 9800],
  ['08-05', 22000],
  ['08-06', 15600],
  ['08-07', 31000],
  ['08-08', 27500],
  ['08-09', 19200],
  ['08-10', 34800],
  ['08-11', 26400],
  ['08-12', 41000],
  ['08-13', 38500],
  ['08-14', 52000],
  ['08-15', 46800],
]

const MOCK_RECENT_TRANSACTIONS = [
  {
    id: 1,
    transaction_type: 'order_settlement',
    description: 'Earnings from order VO-EAB6D2B8 (Pashmina Shawl)',
    amount: 5850,
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 2,
    transaction_type: 'platform_commission',
    description: 'GOSIKA 10% commission on order VO-EAB6D2B8',
    amount: -585,
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 3,
    transaction_type: 'order_settlement',
    description: 'Earnings from order VO-6DF04EA8 (Ilam Tea)',
    amount: 1530,
    created_at: '2026-08-14T20:15:00Z',
  },
  {
    id: 4,
    transaction_type: 'bank_payout',
    description: 'RTGS clearance to Nabil Bank Account',
    amount: -5000,
    created_at: '2026-08-13T16:00:00Z',
  },
]

const MOCK_ACTION_ORDERS = [
  {
    id: 1,
    vendor_order_number: 'VO-2E080B9D',
    store_name: 'Koshi Handicrafts Main Store',
    customer_name: 'Kshitiz Acharya',
    customer_city: 'Kathmandu, Bagmati',
    product_preview: 'Pure Pashmina Cashmere Shawl (Handwoven)',
    grand_total: 5850,
    created_at: '2026-08-15T08:45:00Z',
    status: 'pending',
    delivery_status: 'pending_pickup',
  },
]

const MOCK_RECENT_ORDERS = [
  {
    id: 1,
    vendor_order_number: 'VO-EAB6D2B8',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Pooja Sharma',
    customer_city: 'Pokhara, Gandaki',
    product_preview: 'Traditional Carved Wooden Peacock Window',
    grand_total: 3780,
    status: 'delivered',
    delivery_status: 'delivered',
    created_at: '2026-08-14T23:58:00Z',
  },
  {
    id: 2,
    vendor_order_number: 'VO-2E080B9D',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Kshitiz Acharya',
    customer_city: 'Kathmandu, Bagmati',
    product_preview: 'Pure Pashmina Cashmere Shawl',
    grand_total: 5850,
    status: 'pending',
    delivery_status: 'pending_pickup',
    created_at: '2026-08-14T23:57:00Z',
  },
  {
    id: 3,
    vendor_order_number: 'VO-6DF04EA8',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Prashant Shrestha',
    customer_city: 'Biratnagar, Koshi',
    product_preview: 'Organic Ilam Orthodox Black Tea 250g',
    grand_total: 1530,
    status: 'delivered',
    delivery_status: 'delivered',
    created_at: '2026-08-14T22:44:00Z',
  },
  {
    id: 4,
    vendor_order_number: 'VO-93993919',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Anil Thapa',
    customer_city: 'Dharan, Koshi',
    product_preview: 'Handcrafted Tibetan Singing Bowl',
    grand_total: 3400,
    status: 'delivered',
    delivery_status: 'delivered',
    created_at: '2026-08-14T22:31:00Z',
  },
]

export default function VendorDashboard() {
  const toast = useToast()
  const [wallet, setWallet] = useState({
    available_balance: 18470,
    pending_balance: 3200,
  })
  const [vendor, setVendor] = useState({
    company_name: 'Koshi Handicrafts Pvt. Ltd.',
    commission_rate: 10,
    status: 'approved',
  })
  const [orders, setOrders] = useState(MOCK_RECENT_ORDERS)
  const [transactions, setTransactions] = useState(MOCK_RECENT_TRANSACTIONS)
  const [productsMeta, setProductsMeta] = useState({ total: 14 })
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('30 Days')

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/wallet'),
      api.get('/vendor/me'),
      api.get('/vendor/orders', { params: { per_page: 20 } }),
      api.get('/vendor/products', { params: { per_page: 1 } }),
      api.get('/vendor/wallet/transactions', { params: { per_page: 20 } }),
    ]).then(([w, v, o, p, t]) => {
      if (w.status === 'fulfilled' && w.value.data.data) setWallet(w.value.data.data)
      if (v.status === 'fulfilled' && v.value.data.data) setVendor(v.value.data.data)
      if (o.status === 'fulfilled' && o.value.data.data?.length) setOrders(o.value.data.data)
      if (p.status === 'fulfilled' && p.value.data?.meta?.total) setProductsMeta({ total: p.value.data.meta.total })
      if (t.status === 'fulfilled' && t.value.data.data?.length) setTransactions(t.value.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const pendingOrders = orders.filter((o) => o.status === 'pending')

  const chartData = MOCK_14_DAYS_REVENUE

  const totalRevenue = 415800

  const handleAcceptOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.vendor_order_number === orderId || o.id === orderId ? { ...o, status: 'confirmed' } : o))
    )
    toast.success(`Order ${orderId} confirmed and queued for courier pickup!`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 40 }}>
      {/* Header Bar */}
      <div className="flex items-center justify-between wrap gap-3">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
            Welcome back, {vendor?.company_name || 'Koshi Handicrafts'}
          </h2>
          <p className="muted text-sm mt-1" style={{ margin: 0 }}>
            Here is what is happening across your stores, orders, and wallet today.
          </p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <div className="date-filter-group">
            {DATE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`date-filter-btn ${dateFilter === f ? 'active' : ''}`}
                onClick={() => setDateFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <Link to="/vendor/products/new" className="btn btn-primary btn-sm flex items-center gap-1">
            + Add Product
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {/* Available Balance */}
        <Link to="/vendor/wallet" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.4)', textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#166534' }}>Available Balance</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Wallet size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>
            {money(wallet?.available_balance || 18470)}
          </div>
          <div className="muted text-xs mt-1">Pending: {money(wallet?.pending_balance || 3200)}</div>
        </Link>

        {/* Total Orders */}
        <Link to="/vendor/orders" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Orders</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>{orders.length || 18}</div>
          <div className="text-xs mt-1" style={{ color: pendingOrders.length ? '#f59e0b' : 'var(--muted)', fontWeight: 600 }}>
            {pendingOrders.length || 1} pending action
          </div>
        </Link>

        {/* Active Products */}
        <Link to="/vendor/products" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog SKUs</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Package size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>{productsMeta.total || 14}</div>
          <div className="muted text-xs mt-1">Manage live inventory</div>
        </Link>

        {/* Commission Rate */}
        <Link to="/vendor/commission" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Platform Rate</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Percent size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {vendor?.commission_rate || 10}%
          </div>
          <div className="muted text-xs mt-1">Revenue: {money(totalRevenue)}</div>
        </Link>
      </div>

      {/* Revenue Chart (14 Days) + Recent Transactions Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.1fr)', gap: 18, alignItems: 'start' }}>
        {/* 14-Day Revenue Chart Card */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                <BarChart2 size={17} color="var(--primary)" /> 14-Day Revenue Trend
              </h3>
              <span className="muted text-xs">Daily gross order volume in NPR</span>
            </div>
            <Link to="/vendor/earnings" className="btn btn-ghost btn-xs text-primary font-bold">
              View Earnings →
            </Link>
          </div>

          <MiniBarChart data={chartData} />
        </div>

        {/* Recent Transactions Activity */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Recent Wallet Activity</h3>
            <Link to="/vendor/wallet" className="btn btn-ghost btn-xs">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div>
            {transactions.slice(0, 4).map((t) => {
              const isCredit = Number(t.amount) > 0
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 18px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="avatar"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: isCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: isCredit ? '#10b981' : '#ef4444',
                        flexShrink: 0,
                      }}
                    >
                      {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-ink truncate" style={{ fontSize: 13 }}>
                        {t.transaction_type?.replace(/_/g, ' ')}
                      </div>
                      <div className="muted text-xs truncate" style={{ maxWidth: 220, fontSize: 11 }}>
                        {t.description}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      flexShrink: 0,
                      color: isCredit ? '#10b981' : '#ef4444',
                    }}
                  >
                    {isCredit ? '+' : ''}{money(t.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action Required Banner */}
      {pendingOrders.length > 0 && (
        <div className="card card-pad-none" style={{ overflow: 'hidden', border: '2px solid rgba(245, 158, 11, 0.5)' }}>
          <div
            style={{
              padding: '14px 20px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div className="flex items-center gap-2">
              <Zap size={18} color="#d97706" />
              <span className="font-bold text-sm" style={{ color: '#92400e' }}>
                {pendingOrders.length} Customer Order Requires Immediate Fulfillment
              </span>
            </div>
            <Link to="/vendor/orders" className="btn btn-warning btn-xs">
              View Order Queue
            </Link>
          </div>

          <div style={{ padding: '0 8px' }}>
            {pendingOrders.slice(0, 2).map((o) => (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">{o.vendor_order_number}</span>
                    <span className="chip chip-sm" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>Pending Dispatch</span>
                  </div>
                  <div className="muted text-xs mt-0.5">
                    Buyer: <strong>{o.customer_name || 'Kshitiz Acharya'}</strong> ({o.customer_city || 'Kathmandu'}) · {formatDate(o.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-ink">{money(o.grand_total)}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    onClick={() => handleAcceptOrder(o.vendor_order_number)}
                  >
                    <CheckCircle2 size={12} /> Accept & Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Recent Orders Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Recent Orders Overview</h3>
          <Link to="/vendor/orders" className="btn btn-ghost btn-xs">
            View All Orders <ArrowRight size={12} />
          </Link>
        </div>

        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 680 }}>
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Store / Branch</th>
                <th>Order Amount</th>
                <th>Order Status</th>
                <th>Courier Delivery</th>
                <th>Placement Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to="/vendor/orders" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                      {o.vendor_order_number}
                    </Link>
                  </td>
                  <td className="muted text-xs">{o.store_name}</td>
                  <td className="font-bold text-sm text-ink">{money(o.grand_total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><StatusBadge status={o.delivery_status || 'delivered'} /></td>
                  <td className="muted text-xs">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(([, v]) => v), 1)
  const w = 560
  const h = 150
  const pad = 10
  const bw = Math.min(26, (w - pad * 2) / data.length - 6)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Revenue chart" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={w - pad}
          y1={h - (h - 30) * f - 18}
          y2={h - (h - 30) * f - 18}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}
      {data.map(([day, v], i) => {
        const spacing = (w - pad * 2) / data.length
        const x = pad + i * spacing + (spacing - bw) / 2
        const bh = ((h - 30) * v) / max
        return (
          <g key={day}>
            <rect
              x={x}
              y={h - bh - 18}
              width={bw}
              height={Math.max(bh, 4)}
              rx={4}
              fill="url(#barGrad2)"
            >
              <title>{day}: Rs {v.toLocaleString()}</title>
            </rect>
            <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontWeight="600">
              {day}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
