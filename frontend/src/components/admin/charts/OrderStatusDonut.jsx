import React from 'react'

const DEFAULT_STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#0ea5e9',
  processing: '#3b82f6',
  ready_for_pickup: '#8b5cf6',
  picked_up: '#6366f1',
  out_for_delivery: '#a855f7',
  delivered: '#10b981',
  completed: '#059669',
  cancelled: '#ef4444',
  returned: '#f97316',
  refunded: '#dc2626'
}

export default function OrderStatusDonut({ segments = [], total = 0 }) {
  const R = 52
  const CX = 75
  const CY = 75
  const STROKE = 22
  const circ = 2 * Math.PI * R

  // Process segments
  const validSegments = (segments || []).map(s => ({
    label: s.label || s.status || 'Other',
    count: Number(s.count || s.total || 0),
    color: s.color || DEFAULT_STATUS_COLORS[String(s.status || s.label).toLowerCase()] || '#94a3b8'
  })).filter(s => s.count > 0)

  const effectiveTotal = validSegments.reduce((a, s) => a + s.count, 0) || total

  if (effectiveTotal === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13, width: '100%' }}>
        No order status data available.
      </div>
    )
  }

  let accumulatedPercent = 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: 24, width: '100%' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: 150, height: 150, margin: '0 auto' }}>
        <svg viewBox="0 0 150 150" width={150} height={150}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {validSegments.map((seg, i) => {
            const pct = (seg.count / effectiveTotal) * 100
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
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={strokeOffset}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            )
          })}
        </svg>

        {/* Centered Total */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
            {effectiveTotal}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginTop: 3 }}>
            Total Orders
          </span>
        </div>
      </div>

      {/* Legend Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
        {validSegments.map((seg, i) => {
          const pct = ((seg.count / effectiveTotal) * 100).toFixed(1)
          return (
            <div key={i} className="flex items-center justify-between" style={{ fontSize: 12.5 }}>
              <div className="flex items-center gap-2">
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{seg.label}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{seg.count}</span>
                <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>({pct}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
