import React from 'react'
import { money } from '../../../utils/format'

const CATEGORY_COLORS = [
  '#ff5500', // vibrant orange
  '#ea580c', // coral orange
  '#3b82f6', // blue
  '#eab308', // gold/yellow
  '#94a3b8', // slate
  '#1e293b', // charcoal
  '#8b5cf6', // purple
  '#10b981', // green
]

const DEFAULT_CATEGORY_DATA = [
  { name: 'Electronics', percentage: 32, amount: 1370240, color: '#ff5500' },
  { name: 'Fashion', percentage: 22, amount: 942180, color: '#ea580c' },
  { name: 'Mobile & Accessories', percentage: 18, amount: 768930, color: '#3b82f6' },
  { name: 'Beauty', percentage: 11, amount: 471260, color: '#eab308' },
  { name: 'Home & Living', percentage: 8, amount: 342890, color: '#94a3b8' },
  { name: 'Others', percentage: 9, amount: 390150, color: '#1e293b' },
]

export default function SalesByCategoryDonut({ data, totalSales }) {
  const items = data && data.length > 0
    ? data.map((item, idx) => ({
        name: item.category || item.name || 'Other',
        amount: Number(item.amount || 0),
        percentage: Number(item.share || item.percentage || 0),
        color: item.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }))
    : DEFAULT_CATEGORY_DATA

  const calculatedTotal = items.reduce((acc, item) => acc + (item.amount || 0), 0)
  const total = totalSales || calculatedTotal || 4285650

  const R = 46
  const CX = 60
  const CY = 60
  const STROKE = 19
  const circ = 2 * Math.PI * R

  let accumulatedPercent = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', width: '100%' }}>
      {/* Donut and Legend Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          alignItems: 'center',
          gap: 16,
          padding: '8px 0',
          flex: 1
        }}
      >
        {/* SVG Donut Chart */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto', flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" width={120} height={120}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {items.map((seg, i) => {
              const pct = seg.percentage || ((seg.amount / (total || 1)) * 100)
              const dash = (pct / 100) * circ
              const gap = circ - dash
              const strokeOffset = -(accumulatedPercent / 100) * circ
              accumulatedPercent += pct

              return (
                <circle
                  key={i}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={seg.color || '#ff5500'}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              )
            })}
          </svg>
        </div>

        {/* Legend List - full names without truncation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          {items.slice(0, 6).map((cat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, overflow: 'hidden' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color || '#ff5500', flexShrink: 0 }} />
                <span style={{ color: '#334155', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {cat.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                <span style={{ color: '#64748b', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {cat.percentage > 0 ? `${cat.percentage}%` : `${Math.round((cat.amount / (total || 1)) * 100)}%`}
                </span>
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {money(cat.amount, { decimals: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Total */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: 10,
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12.5,
          fontWeight: 700
        }}
      >
        <span style={{ color: 'var(--muted)' }}>Total Sales</span>
        <span style={{ color: 'var(--ink)', fontSize: 15.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
          {money(total, { decimals: 2 })}
        </span>
      </div>
    </div>
  )
}
