import React, { useState } from 'react'
import { money } from '../../../utils/format'

// Helper to determine clean, round step intervals for Y-axis (no weird numbers like 50,250)
function getCleanMax(val) {
  if (val <= 20000) return 20000
  if (val <= 40000) return 40000
  if (val <= 60000) return 60000
  if (val <= 80000) return 80000
  if (val <= 100000) return 100000
  if (val <= 150000) return 150000
  if (val <= 200000) return 200000
  if (val <= 300000) return 300000
  if (val <= 400000) return 400000
  if (val <= 600000) return 600000
  if (val <= 800000) return 800000
  if (val <= 1000000) return 1000000
  if (val <= 1200000) return 1200000
  if (val <= 1600000) return 1600000
  return Math.ceil(val / 200000) * 200000
}

export default function SalesLineChart({ data = [] }) {
  const [hoveredPt, setHoveredPt] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100%', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        No sales transaction data recorded for this timeframe.
      </div>
    )
  }

  const W = 1000
  const H = 290
  const PAD_L = 95
  const PAD_R = 25
  const PAD_T = 20
  const PAD_B = 32
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const vals = data.map(d => Number(d.revenue ?? d.value ?? d.total ?? 0))
  const maxRaw = Math.max(...vals, 1000)
  const maxV = getCleanMax(maxRaw)

  // Calculate points spanning the full chart height
  const pts = vals.map((v, i) => {
    const x = PAD_L + (i / Math.max(vals.length - 1, 1)) * chartW
    const ratio = maxV > 0 ? Math.min(v, maxV) / maxV : 0
    const y = PAD_T + chartH - ratio * chartH
    return { x, y, v, item: data[i] }
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

  // 5 clean horizontal grid ticks (0%, 25%, 50%, 75%, 100%) - all clean round numbers
  const yTicks = [
    { y: PAD_T, label: money(maxV, { decimals: 0 }) },
    { y: PAD_T + chartH * 0.25, label: money(maxV * 0.75, { decimals: 0 }) },
    { y: PAD_T + chartH * 0.50, label: money(maxV * 0.50, { decimals: 0 }) },
    { y: PAD_T + chartH * 0.75, label: money(maxV * 0.25, { decimals: 0 }) },
    { y: PAD_T + chartH, label: money(0, { decimals: 0 }) },
  ]

  // Clean, evenly spaced X-axis labels
  const totalCount = data.length
  const step = Math.max(1, Math.floor((totalCount - 1) / 6))
  const xLabels = []
  for (let idx = 0; idx < totalCount; idx += step) {
    xLabels.push({
      label: data[idx]?.label || data[idx]?.date || `Day ${idx + 1}`,
      x: PAD_L + (idx / Math.max(totalCount - 1, 1)) * chartW,
    })
  }

  const lastIndex = totalCount - 1
  if (xLabels.length > 0 && Math.abs(xLabels[xLabels.length - 1].x - (PAD_L + chartW)) > 55) {
    xLabels.push({
      label: data[lastIndex]?.label || data[lastIndex]?.date || `Day ${lastIndex + 1}`,
      x: PAD_L + chartW,
    })
  }

  const endPt = pts[pts.length - 1]

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ width: '100%', height: '100%', minHeight: 260, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="salesGradOrangeAdmin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5500" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff5500" stopOpacity="0.00" />
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
              strokeWidth="1.3"
              strokeDasharray={idx === yTicks.length - 1 ? undefined : "3 3"}
            />
            <text
              x={PAD_L - 12}
              y={t.y + 4.5}
              textAnchor="end"
              fontSize="12"
              fill="#64748b"
              fontWeight="700"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Area fill under curve */}
        {fillD && <path d={fillD} fill="url(#salesGradOrangeAdmin)" />}

        {/* Main orange curve stroke */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#ff5500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Highlighted last end point matching image design */}
        {endPt && (
          <g>
            <circle
              cx={endPt.x}
              cy={endPt.y}
              r={10}
              fill="rgba(255, 85, 0, 0.22)"
            />
            <circle
              cx={endPt.x}
              cy={endPt.y}
              r={5.5}
              fill="#ff5500"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
          </g>
        )}

        {/* Interactive hover points & tooltips */}
        {pts.map((pt, i) => {
          const isHovered = hoveredPt === i
          return (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 3}
                fill={isHovered ? '#ff5500' : '#ffffff'}
                stroke="#ff5500"
                strokeWidth={isHovered ? 2.5 : 1.5}
                style={{ cursor: 'pointer', opacity: isHovered ? 1 : 0.65, transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredPt(i)}
                onMouseLeave={() => setHoveredPt(null)}
              />
              {isHovered && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={Math.max(10, Math.min(pt.x - 60, W - 130))}
                    y={Math.max(5, pt.y - 44)}
                    width={120}
                    height={34}
                    rx={7}
                    fill="#1e293b"
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
                  />
                  <text
                    x={Math.max(10, Math.min(pt.x - 60, W - 130)) + 60}
                    y={Math.max(5, pt.y - 44) + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#94a3b8"
                    fontWeight="600"
                  >
                    {pt.item?.label || `Day ${i + 1}`}
                  </text>
                  <text
                    x={Math.max(10, Math.min(pt.x - 60, W - 130)) + 60}
                    y={Math.max(5, pt.y - 44) + 27}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#ffffff"
                    fontWeight="800"
                  >
                    {money(pt.v, { decimals: 0 })}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* X-axis date labels */}
        {xLabels.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={H - 8}
            textAnchor="middle"
            fontSize="12"
            fill="#64748b"
            fontWeight="700"
          >
            {lbl.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
