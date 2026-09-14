import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle2, Truck, PackageSearch, RotateCcw, ShoppingBag, CheckCheck } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { formatDateTime, errorMessage } from '../../utils/format'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

const EVENT_META = {
  assignment: { icon: Truck, bg: 'rgba(255,85,0,0.12)', fg: '#ff5500' },
  delivery: { icon: PackageSearch, bg: 'rgba(14,165,233,0.12)', fg: '#0ea5e9' },
  order: { icon: ShoppingBag, bg: 'rgba(99,102,241,0.12)', fg: '#6366f1' },
  return: { icon: RotateCcw, bg: 'rgba(16,185,129,0.12)', fg: '#10b981' },
}

export default function DeliveryNotifications() {
  const toast = useToast()
  const [markingAll, setMarkingAll] = useState(false)

  const fetchFeed = (page, perPage) =>
    api.get('/delivery-partner/notifications', { params: { page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchFeed, {
    pageSize: 10,
  })

  const unread = Number(meta.unread_count) || 0

  const markRead = (n) => {
    api.post(`/delivery-partner/notifications/${n.id}/read`).catch(() => {})
    reload()
  }

  const go = (n) => {
    if (n.link) {
      const target = n.link.startsWith('/') ? n.link : `/${n.link}`
      window.location.assign(target)
    }
  }

  const markAllRead = () => {
    setMarkingAll(true)
    api.post('/delivery-partner/notifications/read-all')
      .then(() => {
        toast.success('All notifications marked as read.')
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setMarkingAll(false))
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Notifications</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Assignments, delivery updates and dispatch alerts from the GOSIKA hub.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: 16, margin: 0 }}>
              <Skeleton height={48} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          message="When deliveries are assigned or updated, you will see activity here."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View Assigned Deliveries</Link>}
        />
      ) : (
        <>
          <div className="card flex items-center gap-3 justify-between wrap" style={{ padding: '12px 16px', margin: 0 }}>
            <div className="flex items-center gap-2">
              <span className="chip chip-sm font-bold" style={{ background: unread > 0 ? 'rgba(255,85,0,0.12)' : '#f1f5f9', color: unread > 0 ? '#ff5500' : '#64748b', fontSize: 11 }}>
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </span>
              <span className="muted text-xs font-semibold">{meta.total} total</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((n) => {
              const meta = EVENT_META[n.category] || EVENT_META.delivery
              const Icon = meta.icon
              return (
                <div
                  key={n.id}
                  className={`card flex items-start gap-3 ${n.read_at ? '' : 'notif-unread'}`}
                  style={{ padding: 14, margin: 0, borderRadius: 12 }}
                >
                  <span className="avatar" style={{ width: 36, height: 36, background: meta.bg, color: meta.fg, flexShrink: 0 }}>
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-sm text-ink">{n.title}</div>
                      {!n.read_at && <span className="chip chip-sm font-bold" style={{ background: '#ff5500', color: '#fff', fontSize: 10, flexShrink: 0 }}>NEW</span>}
                    </div>
                    <div className="muted text-xs mt-0.5" style={{ lineHeight: 1.5 }}>{n.message}</div>
                    <div className="muted text-xs mt-1" style={{ fontSize: 11 }}>{formatDateTime(n.created_at)}</div>
                  </div>
                  {!n.read_at && (
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ flexShrink: 0 }}
                      onClick={() => markRead(n)}
                    >
                      <CheckCircle2 size={12} /> Read
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {meta.last_page > 1 && (
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}