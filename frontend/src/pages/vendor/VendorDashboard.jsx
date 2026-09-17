import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, PackageCheck, Package, RotateCcw, AlertTriangle, TrendingUp, ArrowRight, Calendar } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { money } from '../../utils/format'
import { getNepaliDate } from '../../utils/nepalDate'
import KpiCard from '../../components/admin/KpiCard'
import ErrorState from '../../components/admin/ErrorState'
import FluidLineChart from '../../components/admin/charts/fx/FluidLineChart'
import AnimatedNumber from '../../components/admin/charts/fx/AnimatedNumber'
import StatusOrderTable from '../../components/admin/StatusOrderTable'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState('30d')
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    try {
      const res = await api.get('/vendor/dashboard', { params: { range: timeframe } })
      setData(res.data?.data)
    } catch (err) {
      console.error('Vendor dashboard load failed', err)
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [timeframe])

  const storeName = user?.company_name || user?.store_name || user?.name || 'My Store'

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading dashboard…</div>
  if (error) return <ErrorState message={error} onRetry={load} />

  const netEarnings = Number(data?.net_earnings || 0)
  const walletBalance = Number(data?.wallet?.available_balance || 0)
  const readyToShip = Number(data?.ready_to_ship || 0)
  const lowStock = Number(data?.low_stock_count || 0)
  const returnsCount = Number(data?.returns_count || 0)
  const returnsPending = Number(data?.returns_pending || 0)
  const pendingApprovals = Number(data?.pending_approvals || 0)
  const delta = Number(data?.revenue_delta || 0)
  const deltaLabel = delta >= 0 ? `+${delta}% vs last period` : `${delta}% vs last period`

  const recentOrders = (data?.recent_orders || []).map(o => ({
    id: o.id,
    order_number: o.order_number || o.vendor_order_number,
    customer: o.customer || '—',
    city: o.city || '—',
    product: o.product || '—',
    amount: Number(o.amount || 0),
    status: o.status,
  }))

  const trend = (data?.revenue_trend || [])
  const totalRevenue = Number(data?.total_revenue || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Store Overview</h1>
            <span style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>Verified Merchant</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>{storeName} · Fulfill, grow and track earnings.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <Calendar size={15} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{getNepaliDate()}</span>
        </div>
      </div>

      <div className="vend-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:1120px){.vend-kpi{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:768px){.vend-kpi{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.vend-kpi{grid-template-columns:1fr!important}}`}</style>
        <KpiCard label="Net Earnings" value={<AnimatedNumber value={netEarnings} format={money} duration={750} />} sub={deltaLabel} subUp={delta >= 0} Icon={Wallet} iconBg="#fff0e6" iconColor="#ff5500" to="/vendor/earnings" />
        <KpiCard label="Wallet Balance" value={<AnimatedNumber value={walletBalance} format={money} duration={750} />} sub="Available for payout" Icon={Wallet} iconBg="#e6f7ec" iconColor="#16a34a" to="/vendor/wallet" />
        <KpiCard label="Ready to Ship" value={readyToShip} sub={`${readyToShip} orders packed`} Icon={PackageCheck} iconBg="#e6f0fa" iconColor="#2563eb" to="/vendor/orders/ready" />
        <KpiCard label="Low Stock" value={lowStock} sub="Restock soon" Icon={AlertTriangle} iconBg="#ffebeb" iconColor="#e11d48" to="/vendor/inventory/low-stock" />
        <KpiCard label="Returns & RTO" value={returnsCount} sub={returnsPending > 0 ? `${returnsPending} awaiting action` : 'None pending'} Icon={RotateCcw} iconBg="#f3e8ff" iconColor="#9333ea" to="/vendor/returns" />
      </div>

      <div id="vend-mid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1080px){#vend-mid{grid-template-columns:1fr!important}}`}</style>
        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px 14px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Store Revenue</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{money(totalRevenue)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              {[{ label: '7D', val: '7d' }, { label: '30D', val: '30d' }, { label: '3M', val: '90d' }, { label: '12M', val: 'year' }].map(tab => {
                const active = timeframe === tab.val
                return <button key={tab.val} type="button" onClick={() => setTimeframe(tab.val)} className="btn-tactile" style={{ border: 'none', background: active ? '#ff5500' : 'transparent', color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: 11.5, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', boxShadow: active ? '0 2px 6px rgba(255,85,0,0.3)' : 'none', transition: 'all .2s ease' }}>{tab.label}</button>
              })}
            </div>
          </div>
          <div style={{ width: '100%', flex: 1, minHeight: 240, marginTop: 6 }}>
            <FluidLineChart labels={trend.map(p => p.label)} values={trend.map(p => Number(p.value))} formatValue={(v, short) => money(short ? Math.round(v) : v, { decimals: 0 })} />
          </div>
        </div>

        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Quick Actions</div>
          {[
            { label: 'Ready to Ship', sub: `${readyToShip} parcels awaiting pickup`, icon: PackageCheck, bg: '#e6f0fa', fg: '#2563eb', to: '/vendor/orders/ready' },
            { label: 'Accept Product Approvals', sub: pendingApprovals > 0 ? `${pendingApprovals} pending in queue` : 'No pending approvals', icon: Package, bg: '#fff0e6', fg: '#ff5500', to: '/vendor/products/approval' },
            { label: 'Low Stock Items', sub: lowStock > 0 ? `${lowStock} need restocking` : 'All stocked', icon: AlertTriangle, bg: '#ffebeb', fg: '#e11d48', to: '/vendor/inventory/low-stock' },
            { label: 'View Analytics', sub: 'Track performance', icon: TrendingUp, bg: '#e6f7ec', fg: '#16a34a', to: '/vendor/analytics' },
          ].map(r => (
            <Link key={r.label} to={r.to} className="btn-tactile" onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,85,0,0.35)')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#f1f5f9')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 11px', borderRadius: 10, textDecoration: 'none', background: '#fafbfc', border: '1px solid #f1f5f9', marginBottom: 6, transition: 'all .18s ease' }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: r.bg, color: r.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><r.icon size={16} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block' }}>{r.label}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.sub}</span>
              </span>
              <ArrowRight size={14} color="#94a3b8" />
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recent Orders</div>
          <Link to="/vendor/orders" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>All Orders <ArrowRight size={13} /></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No orders yet.</div>
        ) : (
          <StatusOrderTable
            columns={[
              { key: 'order_number', label: 'Order ID', render: (r) => <a href={`/vendor/orders/${r.id}`} style={{ color: '#ff5500', fontWeight: 700, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate(`/vendor/orders/${r.id}`) }}>#{r.order_number || r.id}</a> },
              { key: 'customer', label: 'Customer', render: (r) => <><div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.customer}</div><div style={{ fontSize: 10.5, color: '#94a3b8' }}>{r.city}</div></> },
              { key: 'product', label: 'Product' },
              { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
              { key: 'status', label: 'Status', render: (r, badge) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
            ]}
            rows={recentOrders}
            getStatus={(r) => r.status}
            statusFilter={filter}
            onStatusFilter={setFilter}
            searchPlaceholder="Search orders, customers, products…"
            perPage={7}
          />
        )}
      </div>
    </div>
  )
}
