import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

export default function KpiCard({
  label,
  value,
  sub,
  subUp,
  Icon,
  iconBg = '#dbeafe',
  iconColor = '#2563eb',
  to,
  style = {}
}) {
  const content = (
    <div
      className={`card card-lift ${to ? 'btn-tactile' : ''}`}
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: to ? 'pointer' : 'default',
        position: 'relative',
        ...style
      }}
    >
      {Icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={22} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }} className="truncate">
          {value}
        </div>
        {sub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11.5 }}>
            {subUp !== undefined && (
              subUp
                ? <TrendingUp size={12} color="#16a34a" />
                : <TrendingDown size={12} color="#dc2626" />
            )}
            <span style={{ color: subUp === undefined ? '#64748b' : subUp ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {sub}
            </span>
          </div>
        )}
      </div>

      {to && (
        <div style={{ color: '#94a3b8' }}>
          <ArrowUpRight size={16} />
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  return content
}
