import React, { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Receipt, Target, Star, Package, BarChart3 } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { money, apiImage, formatDate } from '../../utils/format'

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
]

const MOCK = {
  kpis: { revenue: 1284500, orders: 342, aov: 3755.85, conversion: 2.8 },
  monthly: [
    { label: 'Feb', value: 86000 },
    { label: 'Mar', value: 118000 },
    { label: 'Apr', value: 94000 },
    { label: 'May', value: 152000 },
    { label: 'Jun', value: 138000 },
    { label: 'Jul', value: 175000 },
    { label: 'Aug', value: 214000 },
  ],
  top_products: [
    { id: 1, name: 'Handwoven Pashmina Shawl', category: 'Fashion', units_sold: 148, revenue: 532800 },
    { id: 2, name: 'Organic Himalayan Green Tea', category: 'Grocery', units_sold: 231, revenue: 277200 },
    { id: 3, name: 'Singing Bowl Meditation Set', category: 'Handmade', units_sold: 96, revenue: 264000 },
    { id: 4, name: 'Nepali Cardamom 100g', category: 'Grocery', units_sold: 310, revenue: 186000 },
    { id: 5, name: 'Brass Buddha Statue', category: 'Handmade', units_sold: 52, revenue: 156000 },
  ],
  categories: [
    { label: 'Fashion', revenue: 532800 },
    { label: 'Grocery', revenue: 463200 },
    { label: 'Handmade', revenue: 420000 },
    { label: 'Electronics', revenue: 289000 },
  ],
  traffic: [
    { label: 'Direct', value: 42 },
    { label: 'Search', value: 31 },
    { label: 'Social', value: 18 },
    { label: 'Referral', value: 9 },
  ],
  orders: { total: 342, completed: 296, cancelled: 22, returned: 24 },
}

function BarChart({ data, format }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-3" style={{ height: 220, padding: '16px 8px 0' }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-2" style={{ flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end' }}>
          <span className="muted text-xs font-medium" style={{ whiteSpace: 'nowrap' }}>{format ? format(d.value) : d.value}</span>
          <div
            title={`${d.label}: ${d.value}`}
            className="bar"
            style={{ width: '70%', maxWidth: 44, height: `${Math.max((d.value / max) * 100, 3)}%`, background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)', borderRadius: 6 }}
          />
          <span className="muted text-xs">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/analytics', { params: { period } })
      .then((res) => setAnalytics(res.data.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
        <Skeleton height={240} />
        <Skeleton height={240} />
      </div>
    )
  }

  const a = analytics || MOCK
  const k = a.kpis || a.summary || {}
  const monthly = a.monthly || a.sales_over_time || MOCK.monthly
  const topProducts = a.top_products || a.top_products_by_revenue || []
  const categories = a.categories || a.category_breakdown || []
  const traffic = a.traffic || a.traffic_sources || []
  const orders = a.orders || {}

  const kpis = [
    { icon: TrendingUp, label: 'Revenue', value: money(k.revenue ?? k.total_revenue), sub: 'Gross sales' },
    { icon: ShoppingBag, label: 'Orders', value: (k.orders ?? orders.total ?? 0).toLocaleString(), sub: `${orders.completed ?? k.completed ?? 0} completed` },
    { icon: Receipt, label: 'Avg order value', value: money(k.aov ?? k.avg_order_value), sub: 'Per order' },
    { icon: Target, label: 'Conversion', value: `${k.conversion ?? k.conversion_rate ?? 0}%`, sub: 'Visitors to orders' },
  ]

  const totalCat = categories.reduce((s, c) => s + Number(c.revenue || c.value || 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Sales & Performance</h1>
          <p>Track revenue, orders and growth over time</p>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {PERIODS.map((p) => (
            <button key={p.key} className={`tab ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {kpis.map((kp) => (
          <div key={kp.label} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="kpi-label">{kp.label}</div>
              <kp.icon size={18} color="var(--primary)" />
            </div>
            <div className="kpi-value">{kp.value}</div>
            <div className="muted text-xs">{kp.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16 }} className="mb-1">Revenue overview</h3>
        {monthly.length ? <BarChart data={monthly} format={(v) => money(v).replace(/\.\d+/, '').replace('Rs. ', 'Rs ')} /> : <EmptyState icon={BarChart3} title="No sales data" message="Sales will appear here as orders are placed." />}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, alignItems: 'start' }}>
        {/* Top products */}
        <div className="card">
          <h3 style={{ fontSize: 16 }} className="mb-2">Top products</h3>
          {topProducts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topProducts.slice(0, 6).map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <img src={apiImage(p.image || p.primary_image, p.name)} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm ellipsis">{p.name}</div>
                    <div className="muted text-xs">{p.category?.name || p.category || ''} · {p.units_sold ?? p.sales_count ?? 0} sold</div>
                  </div>
                  <span className="font-semibold text-sm">{money(p.revenue ?? p.sales ?? p.total_sales)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Package} title="No product data" message="Top selling products will appear here." size={30} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Category breakdown */}
          <div className="card">
            <h3 style={{ fontSize: 16 }} className="mb-2">Sales by category</h3>
            {categories.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categories.map((c) => {
                  const val = Number(c.revenue || c.value || 0)
                  const pct = totalCat ? Math.round((val / totalCat) * 100) : 0
                  return (
                    <div key={c.label || c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{c.label || c.name}</span>
                        <span className="muted text-xs">{money(val)} · {pct}%</span>
                      </div>
                      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No category data" size={30} />
            )}
          </div>

          {/* Traffic sources */}
          <div className="card">
            <h3 style={{ fontSize: 16 }} className="mb-2">Traffic sources</h3>
            {traffic.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {traffic.map((t) => (
                  <div key={t.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t.label}</span>
                      <span className="muted text-xs">{t.value}%</span>
                    </div>
                    <div className="progress"><div style={{ width: `${t.value}%` }} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No traffic data" size={30} />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16 }} className="mb-2">Order status breakdown</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          {[
            { label: 'Total', value: orders.total ?? k.orders ?? 0, tone: 'var(--primary)' },
            { label: 'Completed', value: orders.completed ?? k.completed ?? 0, tone: 'var(--success)' },
            { label: 'Cancelled', value: orders.cancelled ?? k.cancelled ?? 0, tone: 'var(--danger)' },
            { label: 'Returned', value: orders.returned ?? k.returned ?? 0, tone: 'var(--warning)' },
          ].map((s) => (
            <div key={s.label} className="text-center" style={{ padding: '12px 0' }}>
              <div className="font-semibold" style={{ fontSize: 22, color: s.tone }}>{s.value.toLocaleString()}</div>
              <div className="muted text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
