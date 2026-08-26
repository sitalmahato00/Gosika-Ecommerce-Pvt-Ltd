import React from 'react'
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'
import { timeAgo, formatDateTime } from '../../utils/format'

export default function Timeline({ events = [], emptyText = 'No timeline events recorded.' }) {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        {emptyText}
      </div>
    )
  }

  const getStatusIcon = (status = '') => {
    const s = String(status).toLowerCase()
    if (s.includes('deliver') || s.includes('complet') || s.includes('approv') || s.includes('paid')) {
      return <CheckCircle2 size={16} color="#16a34a" />
    }
    if (s.includes('cancel') || s.includes('reject') || s.includes('fail')) {
      return <XCircle size={16} color="#dc2626" />
    }
    if (s.includes('review') || s.includes('transit') || s.includes('pickup') || s.includes('process')) {
      return <Clock size={16} color="#2563eb" />
    }
    return <AlertCircle size={16} color="#d97706" />
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          left: 7,
          top: 8,
          bottom: 8,
          width: 2,
          backgroundColor: '#e2e8f0'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {events.map((evt, idx) => {
          const timestamp = evt.created_at || evt.timestamp || evt.date
          return (
            <div key={idx} style={{ position: 'relative' }}>
              {/* Dot / Icon */}
              <div
                style={{
                  position: 'absolute',
                  left: -24,
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px #fff'
                }}
              >
                {getStatusIcon(evt.to_status || evt.status || evt.action)}
              </div>

              {/* Event Content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {evt.title || evt.action || evt.to_status || 'Status Change'}
                  </span>
                  {timestamp && (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }} title={formatDateTime ? formatDateTime(timestamp) : timestamp}>
                      {timeAgo ? timeAgo(timestamp) : String(timestamp)}
                    </span>
                  )}
                </div>

                {evt.description && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0', lineHeight: 1.4 }}>
                    {evt.description}
                  </p>
                )}

                {evt.reason && (
                  <div style={{ marginTop: 4, padding: '4px 8px', background: '#f8fafc', borderRadius: 6, fontSize: 12, color: '#475569', borderLeft: '2px solid #cbd5e1' }}>
                    <strong>Note:</strong> {evt.reason}
                  </div>
                )}

                {evt.actor && (
                  <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 3 }}>
                    By: <strong>{evt.actor}</strong>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
