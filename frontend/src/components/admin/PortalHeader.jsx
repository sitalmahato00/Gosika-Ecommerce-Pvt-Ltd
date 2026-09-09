import React from 'react'
import { Calendar } from 'lucide-react'

/**
 * Standard page header used across all portal dashboards.
 * Includes an optional Nepali date chip, role pill, and right-side action slot.
 */
export default function PortalHeader({
  title,
  subtitle,
  icon: Icon,
  iconBg = 'rgba(255,85,0,0.12)',
  actions,
  date,
  pill,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        {Icon && (
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: iconBg, color: '#ff5500',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 21, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
            {pill}
          </div>
          {subtitle && <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {date && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{date}</span>
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
