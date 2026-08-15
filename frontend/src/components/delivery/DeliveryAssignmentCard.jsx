import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Banknote, ChevronRight, User } from 'lucide-react'
import { money } from '../../utils/format'
import DeliveryStatusBadge from './DeliveryStatusBadge'

export default function DeliveryAssignmentCard({ assignment, actions, to, date, showPhone }) {
  if (!assignment) return null
  const hasFooter = assignment.cod_amount > 0 || date || actions || to
  return (
    <div className="card" style={{ padding: 16, margin: 0 }}>
      <div className="flex items-center justify-between wrap gap-2 mb-2">
        <div className="flex items-center gap-2 wrap">
          <span
            className="font-mono font-bold text-xs"
            style={{ background: 'var(--primary-50)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 4 }}
          >
            {assignment.vendor_order_number || assignment.id}
          </span>
          <DeliveryStatusBadge status={assignment.status} size="xs" />
        </div>
        <span className="muted text-xs">
          Fee <strong className="text-success">{money(assignment.delivery_fee)}</strong>
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12 }}>
        <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
          <div className="muted font-bold text-xs flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <MapPin size={12} color="#10b981" /> Drop-off
            </span>
            {showPhone && assignment.recipient_phone && (
              <a href={`tel:${assignment.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                <Phone size={10} /> Call
              </a>
            )}
          </div>
          <div className="font-bold text-ink">{assignment.recipient_name || '—'}</div>
          <div className="muted text-xs mt-0.5">{assignment.dropoff_address || '—'}</div>
        </div>
        <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
          <div className="muted font-bold text-xs flex items-center gap-1 mb-1">
            <User size={12} color="var(--primary)" /> Pickup
          </div>
          <div className="muted text-xs mt-0.5">{assignment.pickup_address || '—'}</div>
        </div>
      </div>

      {hasFooter && (
        <div className="flex items-center justify-between wrap gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3 text-xs">
            {assignment.cod_amount > 0 && (
              <span className="font-bold flex items-center gap-1" style={{ color: '#d97706' }}>
                <Banknote size={12} /> COD {money(assignment.cod_amount)}
              </span>
            )}
            {date && <span className="muted">{date}</span>}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : to ? (
            <Link to={to} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}
