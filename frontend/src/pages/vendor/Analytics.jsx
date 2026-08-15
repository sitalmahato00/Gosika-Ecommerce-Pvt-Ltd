import React, { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingBag, Receipt, Target, Star, Package,
  BarChart3, ArrowUpRight, ArrowDownRight, Layers, PieChart,
  Calendar, Download
} from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { money, apiImage, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
]

const DATA_BY_PERIOD = {
  '7d': {
    kpis: { revenue: 348200, orders: 86, aov: 4048.83, conversion: 3.2 },
    monthly: [
      { label: 'Mon', value: 42000 },
      { label: 'Tue', value: 58000 },
      { label: 'Wed', value: 39000 },
      { label: 'Thu', value: 64000 },
      { label: 'Fri', value: 72000 },
      { label: 'Sat', value: 85000 },
      { label: 'Sun', value: 48000 },
    ],
    orders: { total: 86, completed: 78, cancelled: 4, returned: 4 },
  },
  '30d': {
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
    orders: { total: 342, completed: 296, cancelled: 22, returned: 24 },
  },
  '90d': {
    kpis: { revenue: 3640000, orders: 980, aov: 3714.28, conversion: 2.9 },
    monthly: [
      { label: 'May', value: 152000 },
      { label: 'Jun', value: 138000 },
      { label: 'Jul', value: 175000 },
      { label: 'Aug', value: 214000 },
    ],
    orders: { total: 980, completed: 860, cancelled: 58, returned: 62 },
  },
  '12m': {
    kpis: { revenue: 14850000, orders: 4120, aov: 3604.36, conversion: 2.7 },
    monthly: [
      { label: 'Sep', value: 95000 },
      { label: 'Oct', value: 180000 },
      { label: 'Nov', value: 165000 },
      { label: 'Dec', value: 120000 },
      { label: 'Jan', value: 110000 },
      { label: 'Feb', value: 86000 },
      { label: 'Mar', value: 118000 },
      { label: 'Apr', value: 94000 },
      { label: 'May', value: 152000 },
      { label: 'Jun', value: 138000 },
      { label: 'Jul', value: 175000 },
      { label: 'Aug', value: 214000 },
    ],
    orders: { total: 4120, completed: 3680, cancelled: 210, returned: 230 },
  },
}

const TOP_PRODUCTS = [
  {
    id: 1,
    name: 'Pure Pashmina Cashmere Shawl (Handwoven)',
    category: 'Fashion & Handloom',
    units_sold: 148,
    revenue: 532800,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80',
  },
  {
    id: 2,
    name: 'Organic Himalayan Green Tea (First Flush)',
    category: 'Food & Beverages',
    units_sold: 231,
    revenue: 277200,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
  },
  {
    id: 3,
    name: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    category: 'Handicrafts & Decor',
    units_sold: 96,
    revenue: 264000,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
  },
  {
    id: 4,
    name: 'Organic Nepali Large Black Cardamom (Alaichi 100g)',
    category: 'Food & Spices',
    units_sold: 310,
    revenue: 186000,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  },
  {
    id: 5,
    name: 'Traditional Carved Wooden Peacock Window',
    category: 'Art & Heritage',
    units_sold: 52,
    revenue: 156000,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80',
  },
]

const CATEGORIES = [
  { label: 'Handloom & Pashmina', revenue: 532800 },
  { label: 'Organic Agro & Spices', revenue: 463200 },
  { label: 'Handicrafts & Carvings', revenue: 420000 },
  { label: 'Singing Bowls & Brassware', revenue: 289000 },
]

const TRAFFIC = [
  { label: 'Direct Store Visits', value: 42 },
  { label: 'Google & Organic Search', value: 31 },
  { label: 'Social Media (Facebook / IG / TikTok)', value: 18 },
  { label: 'Affiliate & Referrals', value: 9 },
]

function BarChart({ data, format }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-3" style={{ height: 230, padding: '20px 8px 0' }}>
      {data.map((d) => {
        const heightPct = Math.max((d.value / max) * 100, 4)
        return (
          <div key={d.label} className="flex flex-col items-center gap-2" style={{ flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end' }}>
            <span className="muted text-xs font-semibold" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
              {format ? format(d.value) : d.value}
            </span>
            <div
              title={`${d.label}: ${d.value}`}
              className="bar"
              style={{
                width: '65%',
                maxWidth: 48,
                height: `${heightPct}%`,
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.3s ease',
              }}
            />
            <span className="text-xs font-semibold text-ink">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function VendorAnalytics() {
  const toast = useToast()
  const [period, setPeriod] = useState('30d')
  const [loading, setLoading] = useState(false)

  const currentData = DATA_BY_PERIOD[period] || DATA_BY_PERIOD['30d']
  const k = currentData.kpis
  const monthly = currentData.monthly
  const topProducts = TOP_PRODUCTS
  const categories = CATEGORIES
  const traffic = TRAFFIC
  const orders = currentData.orders

  const kpis = [
    { icon: TrendingUp, label: 'Gross Revenue', value: money(k.revenue), sub: 'Total store sales', color: 'var(--primary)' },
    { icon: ShoppingBag, label: 'Total Orders', value: orders.total.toLocaleString(), sub: `${orders.completed} successfully fulfilled`, color: '#10b981' },
    { icon: Receipt, label: 'Avg. Order Value', value: money(k.aov), sub: 'Average basket size', color: '#f59e0b' },
    { icon: Target, label: 'Conversion Rate', value: `${k.conversion}%`, sub: 'Store visitors to buyers', color: '#8b5cf6' },
  ]

  const totalCat = categories.reduce((s, c) => s + Number(c.revenue || 0), 0)

  const exportReport = () => {
    const csv = [
      'Period,Metric,Value',
      `${period},Gross Revenue,${k.revenue}`,
      `${period},Total Orders,${orders.total}`,
      `${period},Avg Order Value,${k.aov}`,
      `${period},Conversion Rate,${k.conversion}%`,
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Performance analytics exported')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Sales Analytics & Growth Performance</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor real-time revenue velocity, top converting catalog products, and regional sales distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportReport}>
            <Download size={13} /> Export Report
          </button>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                className={`tab ${period === p.key ? 'active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        {kpis.map((kp) => (
          <div key={kp.label} className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>{kp.label}</span>
              <span className="avatar" style={{ width: 34, height: 34, background: 'var(--bg)', color: kp.color }}>
                <kp.icon size={17} />
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{kp.value}</div>
            <div className="muted text-xs mt-1">{kp.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Over Time Chart */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <BarChart3 size={17} color="var(--primary)" /> Revenue Growth Overview
            </h3>
            <span className="muted text-xs">Gross sales figures in Nepali Rupees (NPR) for the selected timeframe</span>
          </div>
          <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
            <ArrowUpRight size={12} /> +18.6% vs previous period
          </span>
        </div>
        <BarChart
          data={monthly}
          format={(v) => `Rs ${Number(v).toLocaleString('en-IN')}`}
        />
      </div>

      {/* Top Products & Category Breakdown */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
        {/* Top Products Card */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Package size={16} color="var(--primary)" /> Best Performing Products
            </h3>
            <span className="muted text-xs">Top 5 by revenue</span>
          </div>

          <div style={{ padding: '4px 18px 12px' }}>
            {topProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: 46, height: 46, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-ink truncate" style={{ fontSize: 13 }}>{p.name}</div>
                  <div className="muted text-xs mt-0.5">{p.category} · <strong>{p.units_sold}</strong> units sold</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-sm text-ink">{money(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories & Traffic Breakdown */}
        <div className="flex flex-col gap-4">
          {/* Category Revenue Breakdown */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
              <Layers size={16} color="var(--primary)" /> Sales by Category
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categories.map((c) => {
                const val = Number(c.revenue || 0)
                const pct = totalCat ? Math.round((val / totalCat) * 100) : 0
                return (
                  <div key={c.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-ink">{c.label}</span>
                      <span className="muted text-xs font-semibold">{money(val)} · {pct}%</span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Traffic Channels Breakdown */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
              <PieChart size={16} color="var(--primary)" /> Customer Acquisition Channels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {traffic.map((t) => (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink">{t.label}</span>
                    <span className="muted text-xs font-semibold">{t.value}%</span>
                  </div>
                  <div className="progress" style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.value}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Fulfillment Status Breakdown */}
      <div className="card" style={{ padding: '18px 24px', marginTop: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Order Fulfillment Status Breakdown</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total Placed', value: orders.total, tone: 'var(--primary)' },
            { label: 'Successfully Completed', value: orders.completed, tone: 'var(--success)' },
            { label: 'Cancelled Orders', value: orders.cancelled, tone: 'var(--danger)' },
            { label: 'Returned Claims', value: orders.returned, tone: 'var(--warning)' },
          ].map((s) => (
            <div key={s.label} className="text-center" style={{ padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div className="font-bold" style={{ fontSize: 24, color: s.tone }}>{s.value.toLocaleString()}</div>
              <div className="muted text-xs mt-1 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
