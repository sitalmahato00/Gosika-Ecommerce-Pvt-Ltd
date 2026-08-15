import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Package, ShoppingBag, Percent, ArrowRight, ArrowUpRight,
  ArrowDownLeft, BarChart2, Zap, CheckCircle2,
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const DATE_FILTERS = ['Today', '7 Days', '30 Days', '90 Days']

export default function VendorDashboard() {
  const toast = useToast()
  const [dashboard, setDashboard] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateFilter, setDateFilter] = useState('30 Days')
  const [acting, setActing] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.allSettled([api.get('/vendor/dashboard'), api.get('/vendor/me')]).then(([d, m]) => {
      if (d.status === 'fulfilled' && d.value.data.data) setDashboard(d.value.data.data)
      else setError('Could not load dashboard data')
      if (m.status === 'fulfilled' && m.value.data.data) setVendor(m.value.data.data)
      setLoading(false)
    })
  }
  useEffect(load, [])

  const handleReadyForPickup = async (orderId) => {
    setActing(orderId)
    try {
      await api.post(`/vendor/orders/${orderId}/ready-for-pickup`)
      toast.success('Order marked ready for pickup')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(null)
    }
  }

  const recentOrders = dashboard?.recent_orders || []
  const actionOrders = recentOrders.filter((o) => o.status === 'pending' || o.status === 'accepted')
  const transactions = dashboard?.recent_transactions || []
  const chartData = dashboard?.revenue_14d || []
  const wallet = dashboard?.wallet || {}

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} />)}
        </div>
        <Skeleton height={300} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 40 }}>
      <div className="flex items-center justify-between wrap gap-3">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
            Welcome back, {vendor?.company_name || 'Vendor'}
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

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <Link to="/vendor/wallet" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.4)', textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#166534' }}>Available Balance</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Wallet size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>
            {money(wallet?.available_balance)}
          </div>
          <div className="muted text-xs mt-1">Pending: {money(wallet?.pending_balance)}</div>
        </Link>

        <Link to="/vendor/orders" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Orders</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>{dashboard?.orders_count || 0}</div>
          <div className="text-xs mt-1" style={{ color: Number(dashboard?.pending_orders) ? '#f59e0b' : 'var(--muted)', fontWeight: 600 }}>
            {dashboard?.pending_orders || 0} pending action
          </div>
        </Link>

        <Link to="/vendor/products" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog SKUs</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <Package size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>{dashboard?.products_count || 0}</div>
          <div className="muted text-xs mt-1">Manage live inventory</div>
        </Link>

        <Link to="/vendor/commission" className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, textDecoration: 'none' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Platform Rate</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Percent size={18} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {vendor?.commission_rate || 0}%
          </div>
          <div className="muted text-xs mt-1">Revenue: {money(dashboard?.total_revenue)}</div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.1fr)', gap: 18, alignItems: 'start' }}>
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

          {chartData.length ? <MiniBarChart data={chartData} /> : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="es-icon"><BarChart2 size={32} /></div>
              <p className="muted">No revenue data for the last 14 days.</p>
            </div>
          )}
        </div>

        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Recent Wallet Activity</h3>
            <Link to="/vendor/wallet" className="btn btn-ghost btn-xs">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {transactions.length ? (
            <div>
              {transactions.map((t) => {
                const isCredit = String(t.transaction_type).startsWith('credit_') || Number(t.amount) > 0
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
                          {t.description || '—'}
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
                      {isCredit ? '+' : '-'}{money(Math.abs(Number(t.amount)))}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="es-icon"><Wallet size={32} /></div>
              <p className="muted">No transactions yet. Your earnings will appear here as orders are completed.</p>
            </div>
          )}
        </div>
      </div>

      {actionOrders.length > 0 && (
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
                {actionOrders.length} Customer Order{actionOrders.length > 1 ? 's' : ''} Requires Immediate Fulfillment
              </span>
            </div>
            <Link to="/vendor/orders" className="btn btn-warning btn-xs">
              View Order Queue
            </Link>
          </div>

          <div style={{ padding: '0 8px' }}>
            {actionOrders.slice(0, 3).map((o) => (
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
                    Placed {formatDate(o.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-ink">{money(o.grand_total)}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    disabled={acting === o.id}
                    onClick={() => handleReadyForPickup(o.id)}
                  >
                    {acting === o.id ? 'Marking…' : <><CheckCircle2 size={12} /> Accept & Ready</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to="/vendor/orders" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                      {o.vendor_order_number}
                    </Link>
                  </td>
                  <td className="muted text-xs">{o.store_name || '—'}</td>
                  <td className="font-bold text-sm text-ink">{money(o.grand_total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td><StatusBadge status={o.delivery_status || o.status} /></td>
                  <td className="muted text-xs">{formatDate(o.created_at)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: 24 }}>
                      <p className="muted">No orders yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1)
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
      {data.map((d, i) => {
        const v = Number(d.value) || 0
        const spacing = (w - pad * 2) / data.length
        const x = pad + i * spacing + (spacing - bw) / 2
        const bh = ((h - 30) * v) / max
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={h - bh - 18}
              width={bw}
              height={Math.max(bh, 4)}
              rx={4}
              fill="url(#barGrad2)"
            >
              <title>{d.label}: {money(v)}</title>
            </rect>
            <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontWeight="600">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
