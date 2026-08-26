import React from 'react'
import { money } from '../../../utils/format'

export default function SalesLineChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        No sales transaction data recorded for this timeframe.
      </div>
    )
  }

  const W = 1000
  const H = 240
  const PAD_L = 75
  const PAD_R = 25
  const PAD_T = 20
  const PAD_B = 35
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const vals = data.map(d => Number(d.revenue ?? d.value ?? d.total ?? 0))
  const maxRaw = Math.max(...vals, 1000)
  // Round up max to a clean upper bound
  const maxV = Math.ceil(maxRaw / 1000) * 1000

  // Calculate points
  const pts = vals.map((v, i) => {
    const x = PAD_L + (i / Math.max(vals.length - 1, 1)) * chartW
    const y = PAD_T + chartH - (Math.min(v, maxV) / maxV) * chartH
    return { x, y, v }
  })

  // Smooth cubic bezier path
  const pathD = pts.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`
    const prev = arr[i - 1]
    const cp1x = prev.x + (pt.x - prev.x) * 0.5
    const cp1y = prev.y
    const cp2x = prev.x + (pt.x - prev.x) * 0.5
    const cp2y = pt.y
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`
  }, '')

  const fillD = pts.length > 0 ? `${pathD} L ${pts[pts.length - 1].x},${PAD_T + chartH} L ${pts[0].x},${PAD_T + chartH} Z` : ''

  // Y-axis ticks
  const yTicks = [
    { y: PAD_T, label: money(maxV) },
    { y: PAD_T + chartH * 0.25, label: money(maxV * 0.75) },
    { y: PAD_T + chartH * 0.5, label: money(maxV * 0.5) },
    { y: PAD_T + chartH * 0.75, label: money(maxV * 0.25) },
    { y: PAD_T + chartH, label: 'Rs. 0' },
  ]

  // Clean, evenly spaced X-axis labels
  const totalCount = data.length
  const step = Math.max(1, Math.floor((totalCount - 1) / 5))
  const xLabels = []
  for (let idx = 0; idx < totalCount; idx += step) {
    xLabels.push({
      label: data[idx]?.label || data[idx]?.date || `Day ${idx + 1}`,
      x: PAD_L + (idx / Math.max(totalCount - 1, 1)) * chartW,
    })
  }

  const lastIndex = totalCount - 1
  if (xLabels.length > 0 && Math.abs(xLabels[xLabels.length - 1].x - (PAD_L + chartW)) > 60) {
    xLabels.push({
      label: data[lastIndex]?.label || data[lastIndex]?.date || `Day ${lastIndex + 1}`,
      x: PAD_L + chartW,
    })
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={240}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="salesGradBlueAdmin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={t.y}
              y2={t.y}
              stroke="#f1f5f9"
              strokeWidth="1.2"
              strokeDasharray={idx === yTicks.length - 1 ? undefined : "3 3"}
            />
            <text
              x={PAD_L - 10}
              y={t.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#94a3b8"
              fontWeight="600"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {fillD && <path d={fillD} fill="url(#salesGradBlueAdmin)" />}

        {/* Current period blue line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {pts.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={3.5}
            fill="#fff"
            stroke="#2563eb"
            strokeWidth={2}
          />
        ))}

        {/* X-axis date labels */}
        {xLabels.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={H - 10}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontWeight="600"
          >
            {lbl.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
