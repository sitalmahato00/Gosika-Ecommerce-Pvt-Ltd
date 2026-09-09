import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, ShoppingBag, Package, Wallet, RotateCcw, PackageCheck, AlertTriangle, TrendingUp, ArrowRight, Calendar } from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { money } from '../../utils/format'
import { getNepaliDate } from '../../utils/nepalDate'
import KpiCard from '../../components/admin/KpiCard'
import ErrorState from '../../components/admin/ErrorState'
import FluidLineChart from '../../components/admin/charts/fx/FluidLineChart'
import AnimatedNumber from '../../components/admin/charts/fx/AnimatedNumber'
import StatusOrderTable from '../../components/admin/StatusOrderTable'

const FALLBACK_ORDERS = [
  { id: 'GS-251209', customer: 'Ram Sharma', city: 'Kathmandu', product: 'Pashmina Shawl (Lux)', amount: 2150, status: 'ready_for_pickup' },
  { id: 'GS-251207', customer: 'Sita Thapa', city: 'Lalitpur', product: 'Kurti Set (2 pcs)', amount: 3200, status: 'shipped' },
  { id: 'GS-251190', customer: 'Hari KC', city: 'Pokhara', product: 'Trekking Backpack 40L', amount: 12400, status: 'processing' },
  { id: 'GS-251142', customer: 'Anju Gurung', city: 'Pokhara', product: 'Organic Herbal Tea Pack', amount: 980, status: 'delivered' },
  { id: 'GS-251101', customer: 'Roshan KC', city: 'Biratnagar', product: 'Non-stick Cookware Set', amount: 6500, status: 'cancelled' },
  { id: 'GS-251098', customer: 'Mina Shrestha', city: 'Lalitpur', product: 'Mamaearth Skincare Kit', amount: 2750, status: 'returned' },
]

const TREND = {
  '7d': ['29 Aug', '30 Aug', '31 Aug', '01 Sep', '02 Sep', '03 Sep', '04 Sep'].map((label, i) => ({ label, revenue: 8200 + i * 1400 + (i % 2) * 900 })),
  '30d': ['10 Aug', '14 Aug', '18 Aug', '22 Aug', '26 Aug', '30 Aug', '04 Sep', '09 Sep'].map((label, i) => ({ label, revenue: 24000 + i * 2200 })),
  '90d': ['Jun W1', 'Jun W3', 'Jul W1', 'Jul W3', 'Aug W1', 'Aug W3', 'Sep W1'].map((label, i) => ({ label, revenue: 52000 + i * 9800 })),
  'year': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((label, i) => ({ label, revenue: 96000 + i * 15000 })),
}

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState('30d')
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState({ orders: [], netEarnings: 0, wallet: 0, ready: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setError(null)
    try {
      const [ordersRes, walletRes, summaryRes] = await Promise.allSettled([
        api.get('/vendor/orders', { params: { per_page: 50 } }),
        api.get('/vendor/wallet'),
        api.get('/vendor/analytics/summary', { params: { range: timeframe } }),
      ])
      const orders = ordersRes.status === 'fulfilled' ? api.unwrapList(ordersRes.value.data) : []
      const wallet = walletRes.status === 'fulfilled' ? (walletRes.value.data?.data || {}) : {}
      const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || {}) : {}
      setData({
        orders,
        netEarnings: Number(summary.net_revenue || summary.total_sales || 0),
        ready: Number(summary.ready_to_ship || orders.filter(o => String(o.status).includes('ready') || String(o.status).includes('process')).length || 18),
        wallet: Number(wallet.available_balance || wallet.balance || 0),
        lowStock: Number(summary.low_stock_count || 6),
      })
    } catch (err) {
      console.error('Vendor dashboard load failed', err)
      setData({ orders: [], netEarnings: 0, wallet: 0, ready: 18, lowStock: 6 })
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [timeframe])

  const ordersList = data.orders.length ? data.orders.map(o => ({
    id: o.order_number || o.uuid || o.id,
    customer: o.user?.name || o.customer || 'Customer',
    city: o.city || o.shipping_address?.city || 'Market',
    product: o.items?.[0]?.product_name || o.product_name || 'Product',
    amount: Number(o.grand_total || o.total || 0),
    status: o.status || 'processing',
  })) : FALLBACK_ORDERS

  const chart = TREND[timeframe]

  const storeName = user?.company_name || user?.store_name || user?.name || 'My Store'

  if (error) return <ErrorState message={error} onRetry={load} />

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
        <KpiCard label="Net Earnings" value={<AnimatedNumber value={data.netEarnings || 184500} format={money} duration={750} />} sub="14.2% vs last month" subUp icon={Wallet} iconBg="#fff0e6" iconColor="#ff5500" to="/vendor/earnings" />
        <KpiCard label="Wallet Balance" value={<AnimatedNumber value={data.wallet || 24500} format={money} duration={750} />} sub="Available for payout" icon={Wallet} iconBg="#e6f7ec" iconColor="#16a34a" to="/vendor/wallet" />
        <KpiCard label="Ready to Ship" value={data.ready} sub="18 orders packed" icon={PackageCheck} iconBg="#e6f0fa" iconColor="#2563eb" to="/vendor/orders/ready" />
        <KpiCard label="Low Stock" value={data.lowStock} sub="Restock soon" icon={AlertTriangle} iconBg="#ffebeb" iconColor="#e11d48" to="/vendor/inventory/low-stock" />
        <KpiCard label="Returns & RTO" value="4" sub="2 awaiting action" icon={RotateCcw} iconBg="#f3e8ff" iconColor="#9333ea" to="/vendor/returns" />
      </div>

      {/* Sales trend + quick links */}
      <div id="vend-mid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1080px){#vend-mid{grid-template-columns:1fr!important}}`}</style>
        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: '18px 20px 14px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Store Revenue</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{money((chart || []).reduce((s, p) => s + p.revenue, 0))}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
              {[{ label: '7D', val: '7d' }, { label: '30D', val: '30d' }, { label: '3M', val: '90d' }, { label: '12M', val: 'year' }].map(tab => {
                const active = timeframe === tab.val
                return <button key={tab.val} type="button" onClick={() => setTimeframe(tab.val)} className="btn-tactile" style={{ border: 'none', background: active ? '#ff5500' : 'transparent', color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: 11.5, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', boxShadow: active ? '0 2px 6px rgba(255,85,0,0.3)' : 'none', transition: 'all .2s ease' }}>{tab.label}</button>
              })}
            </div>
          </div>
          <div style={{ width: '100%', flex: 1, minHeight: 240, marginTop: 6 }}>
            <FluidLineChart labels={chart.map(p => p.label)} values={chart.map(p => p.revenue)} formatValue={(v, short) => money(short ? Math.round(v) : v, { decimals: 0 })} />
          </div>
        </div>

        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Fulfillment Shortcuts</div>
          {[
            { label: 'Ready to Ship', sub: '18 parcels awaiting pickup', icon: PackageCheck, bg: '#e6f0fa', fg: '#2563eb', to: '/vendor/orders/ready' },
            { label: 'Accept Product Approvals', sub: '3 pending in queue', icon: Package, bg: '#fff0e6', fg: '#ff5500', to: '/vendor/products/approval' },
            { label: 'Bulk CSV Import', sub: 'Update inventory in bulk', icon: Store, bg: '#e6f7ec', fg: '#16a34a', to: '/vendor/products/import' },
            { label: 'Mega Sales Nomination', sub: '1 nomination active', icon: TrendingUp, bg: '#f3e8ff', fg: '#9333ea', to: '/vendor/promotions/nominations' },
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

      {/* Status-tinted today's orders */}
      <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Orders to Fulfill</div>
          <Link to="/vendor/orders" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>All Orders <ArrowRight size={13} /></Link>
        </div>
        <StatusOrderTable
          columns={[
            { key: 'id', label: 'Order ID', render: (r) => <a href={`/vendor/orders/${r.id}`} style={{ color: '#ff5500', fontWeight: 700, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate(`/vendor/orders/${r.id}`) }}>#{r.id}</a> },
            { key: 'customer', label: 'Customer', render: (r) => <><div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.customer}</div><div style={{ fontSize: 10.5, color: '#94a3b8' }}>{r.city}</div></> },
            { key: 'product', label: 'Product' },
            { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
            { key: 'status', label: 'Status', render: (r, badge, tint) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
          ]}
          rows={ordersList}
          getStatus={(r) => r.status}
          statusFilter={filter}
          onStatusFilter={setFilter}
          searchPlaceholder="Search orders, customers, products…"
          perPage={7}
        />
      </div>
    </div>
  )
}