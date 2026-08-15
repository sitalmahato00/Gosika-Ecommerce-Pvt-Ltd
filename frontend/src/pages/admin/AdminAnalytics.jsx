import React, { useState, useMemo } from 'react'
import {
  BarChart2, TrendingUp, Download, Calendar, DollarSign, ShoppingBag,
  Store, MapPin, CreditCard, PieChart, Star, CheckCircle2, ArrowUpRight,
  Sparkles, Layers, ShieldCheck, Zap
} from 'lucide-react'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const TIMEFRAME_METRICS = {
  '7d': {
    gmv: 1840000,
    growth: '+14.2%',
    commission: 184000,
    take_rate: '10.0%',
    orders: 680,
    avg_order: 2705,
    sellers: 18,
    top_share: '24%',
    months: [
      { m: 'Mon', v: 45, val: '2.4L' },
      { m: 'Tue', v: 60, val: '2.8L' },
      { m: 'Wed', v: 75, val: '3.1L' },
      { m: 'Thu', v: 90, val: '3.4L' },
      { m: 'Fri', v: 110, val: '3.9L' },
      { m: 'Sat', v: 130, val: '4.5L' },
      { m: 'Sun', v: 100, val: '3.6L' },
    ]
  },
  '30d': {
    gmv: 7840000,
    growth: '+18.4%',
    commission: 784000,
    take_rate: '10.0%',
    orders: 2845,
    avg_order: 2755,
    sellers: 18,
    top_share: '28%',
    months: [
      { m: 'Baisakh', v: 80, val: '8.2L' },
      { m: 'Jestha', v: 95, val: '9.5L' },
      { m: 'Ashadh', v: 110, val: '11.0L' },
      { m: 'Shrawan', v: 125, val: '12.5L' },
      { m: 'Bhadra', v: 140, val: '14.0L' },
    ]
  },
  '90d': {
    gmv: 22400000,
    growth: '+22.6%',
    commission: 2240000,
    take_rate: '10.0%',
    orders: 8120,
    avg_order: 2758,
    sellers: 24,
    top_share: '26%',
    months: [
      { m: 'Chaitra', v: 70, val: '7.5L' },
      { m: 'Baisakh', v: 80, val: '8.2L' },
      { m: 'Jestha', v: 95, val: '9.5L' },
      { m: 'Ashadh', v: 110, val: '11.0L' },
      { m: 'Shrawan', v: 125, val: '12.5L' },
      { m: 'Bhadra', v: 140, val: '14.0L' },
    ]
  },
  'Year': {
    gmv: 84500000,
    growth: '+31.8%',
    commission: 8450000,
    take_rate: '10.0%',
    orders: 31400,
    avg_order: 2691,
    sellers: 32,
    top_share: '22%',
    months: [
      { m: 'Q1', v: 65, val: '18.2M' },
      { m: 'Q2', v: 90, val: '21.5M' },
      { m: 'Q3', v: 115, val: '24.8M' },
      { m: 'Q4 (Est)', v: 140, val: '28.0M' },
    ]
  },
}

const PROVINCE_STATS = [
  { province: 'Bagmati Province (Kathmandu, Lalitpur, Bhaktapur)', orders: 1240, gmv: 3450000, share: 44 },
  { province: 'Koshi Province (Biratnagar, Dharan, Itahari)', orders: 620, gmv: 1650000, share: 21 },
  { province: 'Gandaki Province (Pokhara, Kaski, Tanahun)', orders: 430, gmv: 1180000, share: 15 },
  { province: 'Lumbini Province (Butwal, Bhairahawa, Palpa)', orders: 280, gmv: 790000, share: 10 },
  { province: 'Madhesh Province (Janakpur, Birgunj, Parsa)', orders: 150, gmv: 420000, share: 5 },
  { province: 'Sudurpashchim (Dhangadhi, Kailali, Mahendranagar)', orders: 75, gmv: 210000, share: 3 },
  { province: 'Karnali Province (Surkhet, Jumla, Mustang)', orders: 50, gmv: 140000, share: 2 },
]

const CATEGORY_SHARE = [
  { name: 'Authentic Handloom & Dhaka Textiles', share: 38, gmv: 2979200, color: '#3b82f6' },
  { name: 'Newari Metal Crafts & Bronze Idols', share: 24, gmv: 1881600, color: '#10b981' },
  { name: 'Organic Ilam Tea & Himalayan Spices', share: 18, gmv: 1411200, color: '#f59e0b' },
  { name: 'Hand-carved Woodcrafts & Windows', share: 12, gmv: 940800, color: '#8b5cf6' },
  { name: 'Natural Herbal Health & Wellness', share: 8, gmv: 627200, color: '#ec4899' },
]

const PAYMENT_METHODS = [
  { name: 'eSewa Digital Wallet', share: 42, count: 1195, color: '#60bb46' },
  { name: 'Khalti Digital Wallet', share: 28, count: 796, color: '#5d2e8e' },
  { name: 'Fonepay Direct Bank Transfer', share: 18, count: 512, color: '#d92525' },
  { name: 'Cash on Delivery (COD Verified)', share: 12, count: 342, color: '#0284c7' },
]

const TOP_STORES = [
  { rank: 1, name: 'Koshi Handicrafts Pvt. Ltd.', city: 'Biratnagar', orders: 412, gmv: 1980000, rating: 4.9, share: '25.2%' },
  { rank: 2, name: 'Lalitpur Heritage Metal & Bronze', city: 'Patan', orders: 284, gmv: 1640000, rating: 4.9, share: '20.9%' },
  { rank: 3, name: 'Eastern Dhaka Textile Weavers', city: 'Tehrathum', orders: 215, gmv: 1220000, rating: 4.8, share: '15.6%' },
  { rank: 4, name: 'Himalayan Organic Herbs & Tea', city: 'Ilam', orders: 360, gmv: 890000, rating: 4.9, share: '11.3%' },
  { rank: 5, name: 'Mustang Himalayan Dry Fruits', city: 'Jomsom', orders: 180, gmv: 640000, rating: 4.8, share: '8.2%' },
]

export default function AdminAnalytics() {
  const toast = useToast()
  const [timeframe, setTimeframe] = useState('30d')
  const [hoveredBar, setHoveredBar] = useState(null)

  const current = TIMEFRAME_METRICS[timeframe] || TIMEFRAME_METRICS['30d']

  const exportReport = (format) => {
    const rows = [
      ['Metric', 'Value', 'Growth / Subtitle'],
      ['Marketplace GMV', money(current.gmv), current.growth],
      ['Gross Commission', money(current.commission), current.take_rate],
      ['Orders Completed', current.orders, `Avg order: ${money(current.avg_order)}`],
      ['Active Artisan Sellers', current.sellers, `Top store share: ${current.top_share}`],
      [],
      ['Province', 'Orders', 'GMV (NPR)', 'Market Share (%)'],
      ...PROVINCE_STATS.map(p => [p.province, p.orders, p.gmv, `${p.share}%`]),
      [],
      ['Artisan Store Rank', 'Merchant Name', 'City', 'Orders Fulfilled', 'GMV (NPR)', 'Rating', 'Platform Share'],
      ...TOP_STORES.map(s => [s.rank, s.name, s.city, s.orders, s.gmv, `${s.rating} ★`, s.share])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_analytics_report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Platform ${timeframe.toUpperCase()} executive report exported to CSV`)
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Analytics & Operational Reports
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Deep-dive analytics across sales, customer acquisition, vendor volume, and provincial performance in Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="date-filter-group" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            {['7d', '30d', '90d', 'Year'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`date-filter-btn ${timeframe === tf ? 'active' : ''}`}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  background: timeframe === tf ? 'var(--primary)' : 'transparent',
                  color: timeframe === tf ? '#ffffff' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => exportReport('csv')}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Marketplace GMV</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(current.gmv)}</div>
          <div className="muted text-xs mt-1" style={{ color: '#16a34a', fontWeight: 700 }}>{current.growth} vs last period</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Gross Commission</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(current.commission)}</div>
          <div className="muted text-xs mt-1">{current.take_rate} effective take rate</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Orders Completed</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{current.orders.toLocaleString()}</div>
          <div className="muted text-xs mt-1">Avg order: {money(current.avg_order)}</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Sellers</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Store size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{current.sellers}</div>
          <div className="muted text-xs mt-1">Top store share: {current.top_share}</div>
        </div>
      </div>

      {/* Row 1: Monthly Marketplace Growth & Province Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {/* Sales Chart */}
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <BarChart2 size={17} color="var(--primary)" /> Marketplace Volume Trend ({timeframe})
            </h3>
            <span className="chip chip-sm font-semibold">{current.growth}</span>
          </div>
          <div style={{ marginTop: 20 }}>
            <svg viewBox="0 0 500 180" width="100%" height={180} style={{ overflow: 'visible' }}>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1={20} x2={480}
                  y1={150 - 130 * f} y2={150 - 130 * f}
                  stroke="var(--border)"
                  strokeDasharray="4,4"
                />
              ))}
              {/* Dynamic Bars */}
              {current.months.map((bar, idx) => {
                const totalBars = current.months.length
                const step = 440 / totalBars
                const x = 30 + idx * step
                const isHovered = hoveredBar === idx
                return (
                  <g
                    key={bar.m}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={x + 10}
                      y={150 - bar.v}
                      width={Math.max(28, step - 24)}
                      height={bar.v}
                      rx={6}
                      fill={isHovered ? 'var(--primary-dark)' : 'var(--primary)'}
                      style={{ transition: 'all 0.2s' }}
                    />
                    <text x={x + 10 + Math.max(28, step - 24) / 2} y={140 - bar.v} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">
                      {bar.val}
                    </text>
                    <text x={x + 10 + Math.max(28, step - 24) / 2} y={168} textAnchor="middle" fontSize={11} fill="var(--muted)">
                      {bar.m}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Nepal Province Performance */}
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <MapPin size={17} color="var(--primary)" /> Nepal Province Performance
            </h3>
            <span className="muted text-xs font-semibold">7 Provinces Active</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
            {PROVINCE_STATS.map((ps) => (
              <div key={ps.province}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-ink">{ps.province}</span>
                  <span className="muted font-normal">{ps.orders} orders · <strong>{money(ps.gmv)}</strong> ({ps.share}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${ps.share}%`,
                      background: ps.share > 30 ? 'var(--primary)' : ps.share > 15 ? '#10b981' : '#6366f1',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Share & Payment Gateways */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* Category Share */}
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Layers size={17} color="var(--primary)" /> Product Category Revenue Share
          </h3>
          <div className="flex flex-col gap-2.5">
            {CATEGORY_SHARE.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                  <span className="font-bold text-ink">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className="text-primary">{c.share}%</strong>
                  <span className="muted font-mono">{money(c.gmv)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <CreditCard size={17} color="var(--primary)" /> Payment Methods Distribution (Nepal)
          </h3>
          <div className="flex flex-col gap-2.5">
            {PAYMENT_METHODS.map((pm, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: pm.color }} />
                  <span className="font-bold text-ink">{pm.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong style={{ color: pm.color }}>{pm.share}%</strong>
                  <span className="muted">({pm.count} txns)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Performing Artisan Stores Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Store size={17} color="var(--primary)" /> Top Performing Artisan Merchant Stores (Nepal)
          </h3>
          <span className="muted text-xs font-semibold">Ranked by Volume</span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Artisan Merchant Store</th>
                <th>Hub Location</th>
                <th>Orders Fulfilled</th>
                <th>Total Volume (GMV)</th>
                <th>Satisfaction Rating</th>
                <th>Platform Share</th>
              </tr>
            </thead>
            <tbody>
              {TOP_STORES.map((s) => (
                <tr key={s.rank}>
                  <td>
                    <span className="avatar" style={{ width: 26, height: 26, background: s.rank === 1 ? '#fef3c7' : 'var(--bg)', color: s.rank === 1 ? '#d97706' : 'var(--ink)', fontWeight: 800, fontSize: 12 }}>
                      #{s.rank}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-ink">{s.name}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-ink flex items-center gap-1">
                      <MapPin size={11} color="var(--primary)" /> {s.city}, Nepal
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-ink">{s.orders}</span>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-primary">{money(s.gmv)}</span>
                  </td>
                  <td>
                    <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                      <Star size={11} fill="#10b981" /> {s.rating}
                    </span>
                  </td>
                  <td>
                    <span className="chip chip-sm font-semibold">{s.share}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
