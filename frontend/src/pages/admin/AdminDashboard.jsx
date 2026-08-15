import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Clock, TrendingUp, CheckCircle2, XCircle, ArrowRight,
  ChevronRight, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { money, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState([])
  const [pendingVendors, setPendingVendors] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [payouts, setPayouts] = useState([])
  const [summary, setSummary] = useState(null)
  const [ordersByStatus, setOrdersByStatus] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [timeframe, setTimeframe] = useState('30d')
  const [actionBusy, setActionBusy] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.allSettled([
      api.get('/admin/vendors', { params: { per_page: 50 } }),
      api.get('/admin/vendors', { params: { per_page: 10, status: 'pending' } }),
      api.get('/admin/orders', { params: { per_page: 6 } }),
      api.get('/admin/wallet/payouts', { params: { per_page: 50 } }),
      api.get('/admin/analytics/summary', { params: { range: timeframe } }),
      api.get('/admin/analytics/orders-by-status', { params: { range: timeframe } }),
      api.get('/admin/analytics/payment-methods', { params: { range: timeframe } }),
    ]).then(([v, pv, o, p, s, obs, pm]) => {
      if (v.status === 'fulfilled') setVendors(v.value.data.data || [])
      if (pv.status === 'fulfilled') setPendingVendors(pv.value.data.data || [])
      if (o.status === 'fulfilled') setRecentOrders(o.value.data.data || [])
      if (p.status === 'fulfilled') setPayouts(p.value.data.data || [])
      if (s.status === 'fulfilled') setSummary(s.value.data.data || null)
      if (obs.status === 'fulfilled') setOrdersByStatus(obs.value.data.data || [])
      if (pm.status === 'fulfilled') setPaymentMethods(pm.value.data.data || [])
      setLoading(false)
    })
  }

  useEffect(loadData, [timeframe])

  const doApproveVendor = async (vendorId, name) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendorId}/approve`)
      toast.success(`Approved vendor "${name}"`)
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doRejectVendor = async (vendorId, name) => {
    const reason = window.prompt(`Enter rejection reason for "${name}":`)
    if (!reason) return
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendorId}/reject`, { reason })
      toast.success(`Rejected vendor "${name}"`)
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  // Calculations from real analytics summary
  const stats = useMemo(() => {
    const s = summary || {}
    const pendingSettlements = payouts.filter((p) => p.status === 'pending').reduce((acc, p) => acc + Number(p.amount || 0), 0)

    return {
      totalSales: Number(s.gross_revenue || 0),
      totalOrders: Number(s.orders_count || 0),
      avgOrderValue: Number(s.avg_order_value || 0),
      commissionTotal: Number(s.commission_total || 0),
      activeCustomers: Number(s.new_customers || 0),
      totalVendors: Number(s.active_vendors || 0),
      deliveryFees: Number(s.delivery_fees || 0),
      refundsTotal: Number(s.refunds_total || 0),
      pendingSettlements,
    }
  }, [summary, payouts])

  // Payment Breakdown from analytics
  const PAYMENT_COLORS = { cod: '#16a34a', khalti: '#7c3aed', esewa: '#15803d', fonepay: '#2563eb', cod_esewa: '#2563eb', bank_transfer: '#d97706', wallet: '#7c3aed', other: '#64748b' }
  const paymentShare = useMemo(() => {
    const total = paymentMethods.reduce((acc, m) => acc + Number(m.count || 0), 0)
    if (!total) return []
    return paymentMethods.map((m) => ({
      name: m.method || 'other',
      share: total ? Math.round((Number(m.count) / total) * 100) : 0,
      color: PAYMENT_COLORS[m.method] || '#64748b',
    }))
  }, [paymentMethods])

  const statusBars = useMemo(() => {
    const total = ordersByStatus.reduce((acc, s) => acc + Number(s.count || 0), 0) || 1
    return ordersByStatus.map((s) => ({
      status: s.status,
      count: Number(s.count || 0),
      pct: Math.round((Number(s.count || 0) / total) * 100),
    }))
  }, [ordersByStatus])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={105} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header matching screenshot */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>System Overview</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Welcome Back, Admin. Here's what's happening today across the marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="date-filter-group">
            {[{ label: '7 Days', value: '7d' }, { label: '30 Days', value: '30d' }, { label: '90 Days', value: '90d' }, { label: 'Year', value: 'year' }].map((tf) => (
              <button
                key={tf.value}
                className={`date-filter-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadData} title="Refresh metrics">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 5 KPI Cards in single row matching screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-label">Total Sales (GMV)</div>
          <div className="kpi-value">{money(stats.totalSales)}</div>
          <div className="kpi-sub" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={13} /> Avg order {money(stats.avgOrderValue)}
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{stats.totalOrders.toLocaleString()}</div>
          <div className="kpi-sub" style={{ color: 'var(--muted)' }}>
            Commission {money(stats.commissionTotal)}
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-label">New Customers</div>
          <div className="kpi-value">{stats.activeCustomers.toLocaleString()}</div>
          <div className="kpi-sub" style={{ color: 'var(--muted)' }}>
            Registered this period
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-label">Active Vendors</div>
          <div className="kpi-value">{stats.totalVendors.toLocaleString()}</div>
          <div className="kpi-sub" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {pendingVendors.length} awaiting approval
          </div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-label">Pending Settlements</div>
          <div className="kpi-value">{money(stats.pendingSettlements)}</div>
          <div className="kpi-sub" style={{ color: 'var(--danger)' }}>
            Refunds {money(stats.refundsTotal)}
          </div>
        </div>
      </div>

      {/* Middle Section: Sales Overview (Line Chart) + Payment Methods (Donut Chart) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20 }} id="admin-charts-grid">
        <style>{`
          @media (max-width: 960px) {
            #admin-charts-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Sales Overview: Orders by Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Orders by Status</h3>
              <p className="muted text-xs m-0 mt-1">Order volume distribution across the selected period</p>
            </div>
            <Link to="/admin/analytics" className="btn btn-ghost btn-xs">
              View Analytics <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '6px 0' }}>
            {statusBars.length === 0 && <p className="muted text-sm">No order data for this period.</p>}
            {statusBars.map((s) => (
              <div key={s.status}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-ink">{humanizeEnum(s.status)}</span>
                  <span className="muted">{s.count.toLocaleString()} ({s.pct}%)</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${s.pct}%`, background: 'var(--primary)', height: '100%', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Donut / Circular Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Payment Methods</h3>
              <p className="muted text-xs m-0 mt-1">Transaction distribution by gateway</p>
            </div>
            <Link to="/admin/payments" className="btn btn-ghost btn-xs">Details</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            {paymentShare.length === 0 ? (
              <p className="muted text-sm" style={{ padding: '30px 0' }}>No payment data for this period.</p>
            ) : (
              <>
                {/* SVG Donut Chart */}
                <svg viewBox="0 0 160 160" width={140} height={140}>
                  <circle cx="80" cy="80" r="54" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                  {paymentShare.reduce((acc, m, i) => {
                    const offset = acc * 3.39
                    acc += m.share
                    return [...acc, { ...m, offset, prev: acc }]
                  }, [0]).filter((m) => typeof m === 'object').map((m, i) => (
                    <circle
                      key={m.name + i}
                      cx="80" cy="80" r="54" fill="none"
                      stroke={m.color} strokeWidth="22"
                      strokeDasharray={`${m.share * 3.39} ${100 * 3.39}`}
                      strokeDashoffset={`${-m.offset}`}
                      transform="rotate(-90 80 80)"
                    />
                  ))}
                  <text x="80" y="76" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--ink)">
                    {paymentShare.length ? `${paymentShare[0].share}%` : '—'}
                  </text>
                  <text x="80" y="92" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--muted)">
                    {paymentShare.length ? humanizeEnum(paymentShare[0].name) : ''}
                  </text>
                </svg>

                {/* Legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 14 }}>
                  {paymentShare.map((pm) => (
                    <div key={pm.name} className="flex items-center gap-2">
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: pm.color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-semibold text-ink">{humanizeEnum(pm.name)}</span>
                        <span className="muted ml-1">({pm.share}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders (Table) + Vendor Approvals Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20 }} id="admin-tables-grid">
        <style>{`
          @media (max-width: 960px) {
            #admin-tables-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Recent Orders Table */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Recent Orders</h3>
              <p className="muted text-xs m-0 mt-1">Latest customer transactions</p>
            </div>
            <Link to="/admin/orders" className="btn btn-ghost btn-xs">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <Link to={`/admin/orders`} className="font-semibold text-primary text-xs">
                        #{ord.order_number || ord.id}
                      </Link>
                    </td>
                    <td className="text-sm font-medium text-ink">
                      {ord.customer?.name || ord.user?.name || 'Customer'}
                    </td>
                    <td className="font-bold text-sm">
                      {money(ord.grand_total || ord.total || 0)}
                    </td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Approvals Queue */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Vendor Approvals</h3>
              <p className="muted text-xs m-0 mt-1">Pending KYC applications</p>
            </div>
            <Link to="/admin/vendors" className="btn btn-ghost btn-xs">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pendingVendors.length === 0 && <p className="muted text-sm" style={{ padding: '20px' }}>No vendors awaiting approval.</p>}
            {pendingVendors.slice(0, 4).map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="avatar" style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
                    <Store size={18} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-semibold text-sm truncate text-ink">{v.company_name}</div>
                    <div className="muted text-xs truncate">{v.business_email || 'Nepal'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-success btn-xs"
                    onClick={() => doApproveVendor(v.id, v.company_name)}
                    disabled={actionBusy}
                    title="Approve vendor"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button
                    className="btn btn-danger-outline btn-xs"
                    onClick={() => doRejectVendor(v.id, v.company_name)}
                    disabled={actionBusy}
                    title="Reject vendor"
                  >
                    <XCircle size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}