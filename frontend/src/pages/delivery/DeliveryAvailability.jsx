import React from 'react'
import { Link } from 'react-router-dom'
import { Radio, CalendarCheck, Sunrise, MapPin, Loader2, AlertTriangle } from 'lucide-react'
import { useDelivery } from '../../context/DeliveryContext'
import { errorMessage } from '../../utils/format'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

export default function DeliveryAvailability() {
  const toast = useToast()
  const { rider, loading, error, reload, online, toggleOnline, toggling } = useDelivery()

  const handleToggle = async () => {
    try {
      const updated = await toggleOnline()
      if (updated) toast.success(`${updated.is_online ? 'You are now online' : 'You are now offline'} — availability updated.`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={150} />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={() => reload()} />
  }

  const status = online === false ? 'offline' : online === true ? 'online' : String(rider?.status || 'offline')

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Availability</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Control when you appear in the dispatch pool. Go online to receive new assignments.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 22px', margin: 0, border: online === true ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(148, 163, 184, 0.3)' }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex items-center gap-3">
            <span
              className="avatar"
              style={{
                width: 46,
                height: 46,
                background: online === true ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                color: online === true ? '#10b981' : '#64748b',
              }}
            >
              <Radio size={22} />
            </span>
            <div>
              <div className="font-black text-ink" style={{ fontSize: 17 }}>
                {online === true ? 'You are Online' : 'You are Offline'}
              </div>
              <div className="muted text-xs mt-0.5">
                {online === true
                  ? 'New deliveries can be assigned to you right now.'
                  : 'You are not receiving assignments. Flip the switch to go online.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className="flex items-center gap-2 relative"
            style={{ border: 'none', background: 'transparent', cursor: toggling ? 'default' : 'pointer', padding: 8 }}
            aria-pressed={online === true}
            role="switch"
            aria-label="Toggle availability"
          >
            <span
              style={{
                width: 46,
                height: 26,
                borderRadius: 999,
                background: online === true ? '#10b981' : '#cbd5e1',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: online === true ? 23 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  transition: 'left 0.2s',
                }}
              />
            </span>
            {toggling && <Loader2 size={16} className="spin" color="#64748b" />}
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 18 }}>
          <div className="flex items-center gap-2.5" style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 10 }}>
            <CalendarCheck size={15} color="#4f46e5" />
            <div>
              <div className="muted text-xs font-bold">Status</div>
              <div className="text-sm font-bold text-ink capitalize">{status}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5" style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 10 }}>
            <Sunrise size={15} color="#f59e0b" />
            <div>
              <div className="muted text-xs font-bold">Shift</div>
              <div className="text-sm font-bold text-ink">As scheduled</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5" style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 10 }}>
            <MapPin size={15} color="#10b981" />
            <div>
              <div className="muted text-xs font-bold">Service Areas</div>
              <div className="text-sm font-bold text-ink truncate" style={{ maxWidth: 180 }}>
                {Array.isArray(rider?.service_areas) && rider.service_areas.length
                  ? rider.service_areas.join(', ')
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', margin: 0, background: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
        <p className="m-0 text-xs" style={{ color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <span>
            Gone offline for a break? Assignments already accepted stay with you — finish them, then toggle off when you are done.
          </span>
        </p>
      </div>

      <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
        <h3 className="font-bold text-ink" style={{ fontSize: 14, marginBottom: 4 }}>Earnings snapshot</h3>
        <p className="muted text-xs m-0" style={{ marginBottom: 12 }}>
          Track how being available translates into earnings.
        </p>
        <Link to="/delivery/earnings" className="btn btn-outline btn-sm">View Earnings</Link>
      </div>
    </div>
  )
}