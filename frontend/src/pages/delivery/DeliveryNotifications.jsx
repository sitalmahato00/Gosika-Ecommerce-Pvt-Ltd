import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle2, AlertTriangle, RotateCcw, Package, ChevronRight } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { formatDateTime, errorMessage } from '../../utils/format'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

const EVENT_META = {
  delivered: { icon: CheckCircle2, bg: '#ecfdf5', fg: '#10b981' },
  failed: { icon: AlertTriangle, bg: '#fef2f2', fg: '#ef4444' },
  returned_to_vendor: { icon: RotateCcw, bg: '#f1f5f9', fg: '#64748b' },
}

export default function DeliveryNotifications() {
  const [expanded, setExpanded] = useState(null)
  const history = useApi(() => api.get('/delivery-partner/history', { params: { per_page: 100 } }))

  const feed = useMemo(() => {
    const list = history.data?.data ?? []
    return list
      .slice()
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 12)
  }, [history.data])

  if (history.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={28} />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: 16, margin: 0 }}>
              <Skeleton height={48} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (history.error) {
    return <ErrorState message={errorMessage(history.error)} onRetry={() => history.reload()} />
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Notifications</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Updates on your deliveries and dispatches from the GOSIKA hub.
          </p>
        </div>
      </div>

      {feed.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          message="When deliveries are dispatched or completed, you will see activity here."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View Assigned Deliveries</Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((a) => {
            const meta = EVENT_META[a.status] || EVENT_META.failed
            const Icon = meta.icon
            const open = expanded === a.id
            return (
              <div key={a.id} className="card" style={{ padding: 14, margin: 0 }}>
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : a.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span className="avatar" style={{ width: 36, height: 36, background: meta.bg, color: meta.fg, flexShrink: 0 }}>
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-bold text-sm text-ink">
                      {a.status === 'delivered' && `Delivery confirmed — ${a.vendor_order_number || a.id}`}
                      {a.status === 'failed' && `Delivery failed — ${a.vendor_order_number || a.id}`}
                      {a.status === 'returned_to_vendor' && `Parcel returned — ${a.vendor_order_number || a.id}`}
                      {!['delivered', 'failed', 'returned_to_vendor'].includes(a.status) && `Delivery update — ${a.vendor_order_number || a.id}`}
                    </div>
                    <div className="muted text-xs mt-0.5">
                      {a.status === 'delivered' && `The customer confirmed the handover. Your fee has been added to your earnings.`}
                      {a.status === 'failed' && (a.failure_reason || 'The delivery could not be completed.')}
                      {a.status === 'returned_to_vendor' && `The parcel has been returned to the vendor.`}
                      {!['delivered', 'failed', 'returned_to_vendor'].includes(a.status) && `This delivery is currently in progress.`}
                    </div>
                    <div className="muted text-xs mt-1">{formatDateTime(a.updated_at)}</div>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: 4, transform: open ? 'rotate(90deg)' : 'none' }} />
                </button>
                {open && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
                      <Package size={12} /> View Delivery
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
