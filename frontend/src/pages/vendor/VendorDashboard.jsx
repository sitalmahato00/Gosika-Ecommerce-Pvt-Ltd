import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Package, ShoppingBag, Store, ArrowRight, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, BarChart2, Zap
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime } from '../../utils/format'

const DATE_FILTERS = ['Today', '7 Days', '30 Days', '90 Days']

export default function VendorDashboard() {
  const [wallet, setWallet] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [productsMeta, setProductsMeta] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('30 Days')

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/wallet'),
      api.get('/vendor/me'),
      api.get('/vendor/orders', { params: { per_page: 50 } }),
      api.get('/vendor/products', { params: { per_page: 1 } }),
      api.get('/vendor/wallet/transactions', { params: { per_page: 30 } }),
    ]).then(([w, v, o, p, t]) => {
      if (w.status === 'fulfilled') setWallet(w.value.data.data)
      if (v.status === 'fulfilled') setVendor(v.value.data.data)
      if (o.status === 'fulfilled') setOrders(o.value.data.data || [])
      if (p.status === 'fulfilled') setProductsMeta({ total: p.value.data?.meta?.total ?? 0 })
      if (t.status === 'fulfilled') setTransactions((t.value.data.data || []).slice(0, 30))
      setLoading(false)
    })
  }, [])

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const processingOrders = orders.filter((o) => ['confirmed', 'processing'].includes(o.status))
  const deliveredOrders = orders.filter((o) => ['delivered', 'completed'].includes(o.status))

  const chartData = useMemo(() => {
    const byDay = {}
    transactions.forEach((t) => {
      if (Number(t.amount) <= 0) return
      const day = (t.created_at || '').slice(0, 10)
      byDay[day] = (byDay[day] || 0) + Number(t.amount)
    })
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
  }, [transactions])

  const totalRevenue = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} />)}
        </div>
        <Skeleton height={260} />
        <Skeleton height={200} />
      </div>
    )
  }

  const status = vendor?.status?.value || vendor?.status || 'pending'
  const pendingStatus = ['pending', 'under_review'].includes(status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="flex items-center justify-between wrap gap-3">
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>
            Welcome back, {vendor?.company_name || 'Vendor'}
          </h2>
          <p className="muted text-sm m-0">Here's what's happening with your business.</p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <div className="date-filter-group">
            {DATE_FILTERS.map((f) => (
              <button
                key={f}
                className={`date-filter-btn ${dateFilter === f ? 'active' : ''}`}
                onClick={() => setDateFilter(f)}
                aria-pressed={dateFilter === f}
              >
                {f}
              </button>
            ))}
          </div>
          <Link to="/vendor/products/new" className="btn btn-primary btn-sm">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Pending status alert */}
      {pendingStatus && (
        <div className="alert alert-warning">
          <AlertTriangle size={18} />
          <div>
            Your vendor application is <strong>{status.replace(/_/g, ' ')}</strong>. You can create products now,
            but they will only go live once your application is approved by our team.
            <Link to="/vendor/profile" style={{ marginLeft: 8, fontWeight: 600 }}>
              Complete your profile →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Link to="/vendor/wallet" className="kpi-card kpi-green" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="kpi-icon"><Wallet size={20} /></div>
          <div className="kpi-value">{money(wallet?.available_balance ?? 0)}</div>
          <div className="kpi-label">Available Balance</div>
          <div className="kpi-sub">Pending: {money(wallet?.pending_balance ?? 0)}</div>
        </Link>

        <Link to="/vendor/orders" className="kpi-card kpi-blue" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="kpi-icon"><ShoppingBag size={20} /></div>
          <div className="kpi-value">{orders.length}</div>
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-sub">{pendingOrders.length} pending action</div>
        </Link>

        <Link to="/vendor/products" className="kpi-card kpi-purple" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="kpi-icon"><Package size={20} /></div>
          <div className="kpi-value">{productsMeta.total}</div>
          <div className="kpi-label">Products</div>
          <div className="kpi-sub">Manage inventory</div>
        </Link>

        <div className="kpi-card kpi-amber">
          <div className="kpi-icon"><TrendingUp size={20} /></div>
          <div className="kpi-value">{vendor?.commission_rate ?? 0}%</div>
          <div className="kpi-label">Commission Rate</div>
          <div className="kpi-sub">Revenue: {money(totalRevenue)}</div>
        </div>
      </div>

      {/* Revenue chart + Transactions row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>

        {/* Revenue chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={16} color="var(--primary)" /> Revenue (last 14 days)
            </h3>
            <Link to="/vendor/wallet" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
              Wallet →
            </Link>
          </div>
          {chartData.length > 0 ? (
            <MiniBarChart data={chartData} />
          ) : (
            <div className="muted text-sm" style={{ padding: '24px 0', textAlign: 'center' }}>
              No revenue data yet. Your earnings will appear here as orders are completed.
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>Recent Transactions</h3>
            <Link to="/vendor/wallet" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: 20 }}>
              <EmptyState icon={Wallet} title="No transactions yet" message="Transactions appear here as you make sales." />
            </div>
          ) : (
            <div>
              {transactions.slice(0, 6).map((t) => (
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
                  <div style={{ minWidth: 0 }}>
                    <div className="font-medium capitalize" style={{ fontSize: 13 }}>
                      {t.transaction_type?.replace(/_/g, ' ')}
                    </div>
                    <div className="muted text-xs truncate" style={{ maxWidth: 200 }}>{t.description}</div>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                      color: Number(t.amount) < 0 ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    {Number(t.amount) < 0 ? '-' : '+'}{money(Math.abs(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--warning-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h3 style={{ fontSize: 15, margin: 0, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={16} /> {pendingOrders.length} Order{pendingOrders.length !== 1 ? 's' : ''} Need Your Action
            </h3>
            <Link to="/vendor/orders" className="btn btn-warning btn-sm">View Orders</Link>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Store</th>
                  <th>Total</th>
                  <th>Placed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium" style={{ fontSize: 13 }}>{o.vendor_order_number}</td>
                    <td className="muted" style={{ fontSize: 13 }}>{o.store_name}</td>
                    <td className="font-semibold">{money(o.grand_total)}</td>
                    <td className="muted text-sm">{formatDateTime(o.created_at)}</td>
                    <td>
                      <Link to={`/vendor/orders/${o.id}`} className="btn btn-soft btn-sm">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All recent orders */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>Recent Orders</h3>
          <Link to="/vendor/orders" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              message="Once customers order from your store, orders appear here."
            />
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Store</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/vendor/orders/${o.id}`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                        {o.vendor_order_number}
                      </Link>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>{o.store_name}</td>
                    <td className="font-semibold">{money(o.grand_total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><StatusBadge status={o.delivery_status} /></td>
                    <td className="muted text-sm">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(([, v]) => v), 1)
  const w = 500
  const h = 140
  const pad = 8
  const bw = Math.min(30, (w - pad * 2) / data.length - 4)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Revenue chart" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad} x2={w - pad}
          y1={h - (h - 26) * f - 18}
          y2={h - (h - 26) * f - 18}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}
      {data.map(([day, v], i) => {
        const spacing = (w - pad * 2) / data.length
        const x = pad + i * spacing + (spacing - bw) / 2
        const bh = ((h - 26) * v) / max
        return (
          <g key={day}>
            <rect
              x={x} y={h - bh - 18}
              width={bw} height={Math.max(bh, 2)}
              rx={4}
              fill="url(#barGrad)"
            >
              <title>{day}: {v.toLocaleString()}</title>
            </rect>
            {i % 2 === 0 && (
              <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize={9} fill="var(--muted)">
                {day.slice(5)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
