import React from 'react'
import { Check } from 'lucide-react'
import { DELIVERY_STATUS_ORDER } from '../../utils/delivery'
import { formatDateTime } from '../../utils/format'

const STEPS = [
  { key: 'assigned', label: 'Assigned', field: 'assigned_at' },
  { key: 'accepted', label: 'Accepted', field: 'accepted_at' },
  { key: 'picked_up', label: 'Picked Up', field: 'picked_up_at' },
  { key: 'out_for_delivery', label: 'Out for Delivery', field: 'out_for_delivery_at' },
  { key: 'delivered', label: 'Delivered', field: 'delivered_at' },
]

export default function DeliveryStatusTimeline({ assignment }) {
  if (!assignment) return null

  const status = assignment.status
  const currentIdx = DELIVERY_STATUS_ORDER.indexOf(status)
  const isDelivered = status === 'delivered'
  const isFailed = status === 'failed' || status === 'returned_to_vendor'

  const rows = (isFailed ? STEPS.slice(0, 4) : STEPS).map((step) => ({
    ...step,
    ts: assignment[step.field],
    done: Boolean(assignment[step.field]),
    isCurrent: status === step.key,
  }))

  return (
    <div className="flex flex-col" style={{ gap: 0 }}>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1
        const dotColor = row.done ? '#10b981' : row.isCurrent ? '#4f46e5' : '#cbd5e1'
        return (
          <div key={row.key} className="flex" style={{ gap: 12 }}>
            <div className="flex flex-col items-center" style={{ width: 22 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: row.done ? '#10b981' : row.isCurrent ? '#eef2ff' : '#f1f5f9',
                  color: row.done ? '#fff' : row.isCurrent ? '#4f46e5' : '#94a3b8',
                  border: '2px solid ' + dotColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {row.done ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: row.isCurrent ? '#4f46e5' : '#94a3b8',
                    }}
                  />
                )}
              </span>
              {!isLast && (
                <span style={{ width: 2, flex: 1, minHeight: 18, background: row.done ? '#a7f3d0' : '#e2e8f0' }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: row.done || row.isCurrent ? 800 : 600,
                  color: row.done || row.isCurrent ? 'var(--ink)' : '#64748b',
                }}
              >
                {row.label}
              </div>
              <div className="muted text-xs mt-0.5">
                {row.ts ? formatDateTime(row.ts) : row.isCurrent ? 'In progress' : 'Pending'}
              </div>
            </div>
          </div>
        )
      })}

      {isFailed && (
        <div className="flex" style={{ gap: 12 }}>
          <div className="flex flex-col items-center" style={{ width: 22 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: status === 'failed' ? '#ef4444' : '#64748b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Check size={12} strokeWidth={3} />
            </span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: status === 'failed' ? '#ef4444' : '#334155' }}>
              {status === 'failed' ? 'Failed' : 'Returned to Vendor'}
            </div>
            <div className="muted text-xs mt-0.5">
              {status === 'failed'
                ? assignment.failed_at
                  ? formatDateTime(assignment.failed_at)
                  : '—'
                : assignment.updated_at
                ? formatDateTime(assignment.updated_at)
                : '—'}
            </div>
            {assignment.failure_reason && (
              <div className="text-xs mt-1" style={{ color: '#dc2626' }}>
                {assignment.failure_reason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
