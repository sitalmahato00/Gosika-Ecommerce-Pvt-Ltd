import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, ShoppingCart, Users, Store, Wallet,
  ChevronRight, Package, AlertTriangle,
  Calendar, TrendingUp, ArrowRight,
} from 'lucide-react'
import api from '../../api/client'
import { money } from '../../utils/format'
import { getNepaliDate } from '../../utils/nepalDate'
import KpiCard from '../../components/admin/KpiCard'
import ErrorState from '../../components/admin/ErrorState'
import FluidLineChart from '../../components/admin/charts/fx/FluidLineChart'
import AnimatedNumber from '../../components/admin/charts/fx/AnimatedNumber'
import StatusOrderTable from '../../components/admin/StatusOrderTable'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('30d')
  const [data, setData] = useState({ summary: null, salesTimeline: [], recentOrders: [], pendingKycCount: 0, pendingPayoutsCount: 0 })

  const loadDashboardData = async () => {
    if (!data.summary) setLoading(true)
    setError(null)
    try {
      const [ordersRes, summaryRes, salesTimelineRes, kycRes, payoutsRes] = await Promise.allSettled([
        api.get('/admin/orders', { params: { per_page: 50 } }),
        api.get('/admin/analytics/summary', { params: { range: timeframe } }),
        api.get('/admin/analytics/sales-timeline', { params: { range: timeframe } }),
        api.get('/admin/vendors/kyc', { params: { status: 'submitted', per_page: 1 } }),
        api.get('/admin/wallet/payouts', { params: { status: 'pending', per_page: 1 } }),
      ])
      const recentOrders = ordersRes.status === 'fulfilled' ? api.unwrapList(ordersRes.value.data) : []
      const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || null) : null
      const salesTimeline = salesTimelineRes.status === 'fulfilled' ? (salesTimelineRes.value.data?.data || []) : []
      const pendingKycCount = kycRes.status === 'fulfilled' ? (kycRes.value.data?.meta?.pagination?.total ?? api.unwrapList(kycRes.value.data).length ?? 0) : 0
      const pendingPayoutsCount = payoutsRes.status === 'fulfilled' ? (payoutsRes.value.data?.meta?.pagination?.total ?? api.unwrapList(payoutsRes.value.data).length ?? 0) : 0
      setData({ summary, salesTimeline, recentOrders, pendingKycCount, pendingPayoutsCount })
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Failed to load real-time marketplace analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboardData() }, [timeframe])

  const s = data.summary || {}
  const grossRevenue = Number(s.gross_revenue || s.total_sales || 0)
  const ordersCount = Number(s.orders_count || 0)
  const newCustomers = Number(s.new_customers || 0)
  const activeVendors = Number(s.active_vendors || 0)
  const pendingPayouts = Number(s.pending_payouts || 0)

  const chartData = useMemo(() => {
    const raw = data.salesTimeline
    if (raw && raw.length > 0) {
      return raw
    }
    return []
  }, [data.salesTimeline])

  const overviewSales = useMemo(() => {
    const sum = chartData.reduce((acc, c) => acc + Number(c.revenue || c.value || 0), 0)
    if (sum > 0) return Math.round(sum)
    if (s.gross_revenue) return Math.round(Number(s.gross_revenue))
    return 0
  }, [chartData, s.gross_revenue])

  const timeframeLabel = { '7d': 'previous 7 days', '30d': 'previous 30 days', '90d': 'previous 3 months', 'year': 'previous year' }[timeframe] || 'previous 30 days'

  const ordersList = (data.recentOrders && data.recentOrders.length > 0)
    ? data.recentOrders.map(ord => ({
        id: ord.order_number || ord.uuid || ord.id,
        customer: ord.user?.name || (ord.customer?.full_name || 'Customer'),
        city: ord.shipping_address?.city || 'City Center',
        product: ord.items?.[0]?.product_name || 'Assorted Items',
        amount: Number(ord.grand_total || ord.total || 0),
        payment: ord.payment_method || 'cod',
        status: ord.status || 'processing',
      }))
    : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const nepaliDateText = getNepaliDate()

  if (loading && !data.summary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div style={{ height: 46, width: 260, background: 'white', borderRadius: 10, border: '1px solid var(--border)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 96, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }} />)}
        </div>
        <div style={{ height: 320, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: '100%' }}>
      {/* Greeting header with lifecycle pill + Nepali date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{greeting}, Admin</h1>
            <span style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              Super Admin
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>
            Here's what's happening across your marketplace right now.
          </p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <Calendar size={15} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{nepaliDateText}</span>
        </div>
      </div>

      {/* KPI row with hover lift */}
      <div className="admin-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`
          @media(max-width:1120px){.admin-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
          @media(max-width:768px){.admin-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
          @media(max-width:480px){.admin-kpi-grid{grid-template-columns:1fr!important}}
        `}</style>
        <KpiCard label="Total Sales" value={<AnimatedNumber value={grossRevenue} format={money} duration={750} />} sub="18.4% vs last 30d" subUp icon={ShoppingBag} iconBg="#fff0e6" iconColor="#ff5500" to="/admin/analytics/reports" />
        <KpiCard label="Total Orders" value={<AnimatedNumber value={ordersCount} format={(v) => Math.round(v).toLocaleString()} duration={750} />} sub="12.8% vs last 30d" subUp icon={ShoppingCart} iconBg="#e6f0fa" iconColor="#2563eb" to="/admin/orders" />
        <KpiCard label="New Customers" value={<AnimatedNumber value={newCustomers} format={(v) => Math.round(v).toLocaleString()} duration={750} />} sub="8.2% vs last 30d" subUp icon={Users} iconBg="#e6f7ec" iconColor="#16a34a" to="/admin/customers" />
        <KpiCard label="Active Sellers" value={<AnimatedNumber value={activeVendors} format={(v) => Math.round(v).toLocaleString()} duration={750} />} sub="6.4% vs last 30d" subUp icon={Store} iconBg="#f3e8ff" iconColor="#9333ea" to="/admin/marketplace/vendors" />
        <KpiCard label="Pending Payouts" value={<AnimatedNumber value={pendingPayouts} format={money} duration={750} />} sub="Awaiting settlement" icon={Wallet} iconBg="#ffebeb" iconColor="#e11d48" to="/admin/finance/payouts" />
      </div>

      {/* Middle: Sales Overview + Marketplace Health */}
      <div id="admin-middle-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1080px){#admin-middle-row,#admin-bottom-row{grid-template-columns:1fr!important}}`}</style>

        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px 14px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Sales Overview</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginTop: 2, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                <AnimatedNumber value={overviewSales} format={money} duration={900} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>
                <TrendingUp size={12} /> <span>↑ 18.4%</span>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>compared to {timeframeLabel}</span>
              </div>
            </div>
            {/* Timeframe pills — chart morphs in place, canvas NOT remounted */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              {[{ label: '7D', val: '7d' }, { label: '30D', val: '30d' }, { label: '3M', val: '90d' }, { label: '12M', val: 'year' }].map(tab => {
                const active = timeframe === tab.val
                return (
                  <button key={tab.val} type="button" onClick={() => setTimeframe(tab.val)} className="btn-tactile"
                    style={{ border: 'none', background: active ? '#ff5500' : 'transparent', color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: 11.5, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', boxShadow: active ? '0 2px 6px rgba(255,85,0,0.3)' : 'none', transition: 'all .2s ease' }}>
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ width: '100%', flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column', marginTop: 6 }}>
            <FluidLineChart labels={chartData.map(pt => pt.label)} values={chartData.map(pt => Number(pt.revenue || pt.value || 0))} formatValue={(v, short) => money(short ? Math.round(v) : v, { decimals: 0 })} />
          </div>
        </div>

        {/* Marketplace Health */}
        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: '18px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Marketplace Health</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Active Products', value: s.active_products || data.pendingKycCount || 0, delta: s.products_growth || null, deltaUp: true, icon: Package, bg: '#e6f0fa', fg: '#2563eb', to: '/admin/marketplace/products' },
              { label: 'Active Sellers', value: activeVendors, delta: s.vendors_growth || null, deltaUp: true, icon: Store, bg: '#e6f7ec', fg: '#16a34a', to: '/admin/marketplace/vendors' },
              { label: 'Pending Seller Applications', value: data.pendingKycCount || 0, delta: 'awaiting KYC', icon: Users, bg: '#fff0e6', fg: '#ff5500', to: '/admin/marketplace/kyc', badge: true },
              { label: 'Low Stock Products', value: s.low_stock_products || 0, delta: s.low_stock_growth || null, deltaUp: false, icon: AlertTriangle, bg: '#ffebeb', fg: '#dc2626', to: '/admin/marketplace/products' },
              { label: 'Pending Orders', value: s.pending_orders || 0, delta: s.pending_orders_growth || null, deltaUp: true, icon: ShoppingCart, bg: '#f3e8ff', fg: '#9333ea', to: '/admin/orders', badge: s.pending_orders || null },
            ].map((row) => (
              <Link key={row.label} to={row.to} className="btn-tactile hover:-translate-y-0"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 10, textDecoration: 'none', background: '#fafbfc', border: '1px solid #f1f5f9', transition: 'all .18s ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,85,0,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#f1f5f9')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: row.bg, color: row.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <row.icon size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{typeof row.value === 'number' ? row.value.toLocaleString() : row.value}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {row.delta && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: row.deltaUp === false ? '#dc2626' : row.badge ? '#ea580c' : '#16a34a', background: row.deltaUp === false ? '#fef2f2' : row.badge ? '#fff7ed' : '#f0fdf4', padding: '2px 7px', borderRadius: 12 }}>
                      {row.delta}
                    </span>
                  )}
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Status-tinted Recent Orders */}
      <div id="admin-bottom-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }}>
        <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recent Orders</div>
            <Link to="/admin/orders" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={13} />
            </Link>
          </div>
          <StatusOrderTable
            columns={[
              { key: 'id', label: 'Order ID', render: (r) => <a href={`/admin/orders/${r.id}`} style={{ color: '#ff5500', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); navigate(`/admin/orders/${r.id}`) }}>#{r.id}</a>, sticky: true },
              { key: 'customer', label: 'Customer', render: (r) => <><div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.customer}</div><div style={{ fontSize: 10.5, color: '#94a3b8' }}>{r.city}</div></> },
              { key: 'product', label: 'Product', render: (r) => <span style={{ color: '#334155', fontWeight: 500, maxWidth: 200, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.product}</span> },
              { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{money(r.amount)}</span> },
              { key: 'payment', label: 'Payment', render: (r) => <span style={{ background: '#f8fafc', border: '1px solid var(--border)', color: '#475569', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{r.payment}</span> },
              { key: 'status', label: 'Status', render: (r, badge) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-block', whiteSpace: 'nowrap' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
            ]}
            rows={ordersList}
            getStatus={(r) => r.status}
            searchPlaceholder="Search orders, customers, products…"
            searchKeys={['id', 'customer', 'product', 'city']}
            perPage={7}
          />
        </div>
      </div>
    </div>
  )
}
