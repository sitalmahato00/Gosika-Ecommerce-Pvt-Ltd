import React, { useState } from 'react'
import { BarChart2, TrendingUp, Download, Calendar, DollarSign, ShoppingBag, Store, MapPin, CreditCard } from 'lucide-react'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PROVINCE_STATS = [
  { province: 'Bagmati Province', orders: 1240, gmv: 3450000, share: 44 },
  { province: 'Koshi Province', orders: 620, gmv: 1650000, share: 21 },
  { province: 'Gandaki Province', orders: 430, gmv: 1180000, share: 15 },
  { province: 'Lumbini Province', orders: 280, gmv: 790000, share: 10 },
  { province: 'Madhesh Province', orders: 150, gmv: 420000, share: 5 },
  { province: 'Sudurpashchim', orders: 75, gmv: 210000, share: 3 },
  { province: 'Karnali Province', orders: 50, gmv: 140000, share: 2 },
]

export default function AdminAnalytics() {
  const toast = useToast()
  const [timeframe, setTimeframe] = useState('30d')

  const exportReport = (format) => {
    toast.success(`Platform ${format.toUpperCase()} report exported successfully`)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics & Operational Reports</h1>
          <p>Deep-dive analytics across sales, customer acquisition, vendor volume, and provincial performance in Nepal</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="date-filter-group">
            {['7d', '30d', '90d', 'Year'].map((tf) => (
              <button
                key={tf}
                className={`date-filter-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => exportReport('csv')}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><DollarSign size={20} /></div>
          <div className="kpi-value">{money(7840000)}</div>
          <div className="kpi-label">Marketplace GMV</div>
          <div className="kpi-sub">+18.4% vs last period</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><TrendingUp size={20} /></div>
          <div className="kpi-value">{money(784000)}</div>
          <div className="kpi-label">Gross Commission</div>
          <div className="kpi-sub">10.0% effective take rate</div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-icon"><ShoppingBag size={20} /></div>
          <div className="kpi-value">2,845</div>
          <div className="kpi-label">Orders Completed</div>
          <div className="kpi-sub">Avg order: Rs. 2,755</div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-icon"><Store size={20} /></div>
          <div className="kpi-value">18</div>
          <div className="kpi-label">Active Sellers</div>
          <div className="kpi-sub">Top store share: 28%</div>
        </div>
      </div>

      {/* Visual Analytics Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Sales & Commission Trends Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={18} color="var(--primary)" /> Monthly Marketplace Growth (Rs.)
            </h3>
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
              {/* Bars */}
              {[
                { m: 'Baisakh', v: 80, val: '8.2L' },
                { m: 'Jestha', v: 95, val: '9.5L' },
                { m: 'Ashadh', v: 110, val: '11.0L' },
                { m: 'Shrawan', v: 125, val: '12.5L' },
                { m: 'Bhadra', v: 140, val: '14.0L' },
              ].map((bar, idx) => {
                const x = 50 + idx * 90
                return (
                  <g key={bar.m}>
                    <rect
                      x={x}
                      y={150 - bar.v}
                      width={44}
                      height={bar.v}
                      rx={6}
                      fill="var(--primary)"
                    />
                    <text x={x + 22} y={140 - bar.v} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">
                      {bar.val}
                    </text>
                    <text x={x + 22} y={168} textAnchor="middle" fontSize={11} fill="var(--muted)">
                      {bar.m}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Nepal Province Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={18} color="var(--primary)" /> Nepal Province Performance
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {PROVINCE_STATS.map((ps) => (
              <div key={ps.province}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{ps.province}</span>
                  <span className="muted">{ps.orders} orders · {money(ps.gmv)} ({ps.share}%)</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${ps.share}%`,
                      background: 'var(--primary)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
