import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Navigation, DollarSign, Banknote, Power, Phone, User, Store,
  ArrowRight, Clock, ChevronRight, Package, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { isSameDay, ACTIVE_STATUSES, nextStep, completionDate } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryDashboard() {
  const toast = useToast()
  const { rider, online, toggleOnline, toggling } = useDelivery()
  const [busyId, setBusyId] = useState(null)
  const assignments = useApi(
    () => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }),
    { cacheKey: 'delivery_assignments' }
  )

  const all = assignments.data?.data ?? []
  const active = useMemo(() => all.filter((a) => ACTIVE_STATUSES.includes(a.status)), [all])
  const inTransit = active.filter((a) => a.status === 'picked_up' || a.status === 'out_for_delivery')
  const delivered = all.filter((a) => a.status === 'delivered')
  const deliveredToday = delivered.filter((a) => isSameDay(a.delivered_at))
  const todayEarnings = deliveredToday.reduce((s, a) => s + Number(a.delivery_fee || 0), 0)
  const codInHand = delivered.reduce((s, a) => s + Number(a.cod_amount || 0), 0)
  const activeDelivery =
    active.find((a) => a.status === 'out_for_delivery') ||
    active.find((a) => a.status === 'picked_up') ||
    active.find((a) => a.status === 'accepted') ||
    active.find((a) => a.status === 'assigned')

  const recent = [...all]
    .filter((a) => a.status === 'delivered' || a.status === 'failed' || a.status === 'returned_to_vendor')
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 4)

  const area = Array.isArray(rider?.service_areas) && rider.service_areas.length > 0 ? rider.service_areas[0] : 'Dispatch Hub'

  const handleToggle = async () => {
    try {
      const updated = await toggleOnline()
      toast.success(updated?.is_online ? 'You are now ONLINE — ready for dispatch.' : 'You are now OFFLINE — paused from new dispatches.')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const handleAccept = async (a) => {
    setBusyId(a.id)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/accept`)
      toast.success('Delivery accepted. Proceed to pickup.')
      assignments.reload({ silent: true })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  if (assignments.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <Skeleton width={260} height={28} />
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: 18, margin: 0 }}>
              <Skeleton width={120} height={12} style={{ marginBottom: 14 }} />
              <Skeleton width={90} height={22} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18, margin: 0 }}>
          <Skeleton height={120} />
        </div>
      </div>
    )
  }

  if (assignments.error) {
    return <ErrorState message={errorMessage(assignments.error)} onRetry={() => assignments.reload()} />
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header with Duty Status Switcher */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1 wrap">
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
              Rider Dispatch Dashboard
            </h1>
            <span
              className="chip chip-sm"
              style={{
                background: online ? '#ecfdf5' : '#f8fafc',
                color: online ? '#10b981' : '#64748b',
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              ● {online ? 'ONLINE / ON DUTY' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            Welcome back, <strong>{rider?.name || 'Delivery Partner'}</strong> · Assigned to{' '}
            <strong>{area}</strong>
            {rider?.vehicle_type ? ` · ${rider.vehicle_type}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-1.5 ${online ? 'btn-danger-outline' : 'btn-success'}`}
            onClick={handleToggle}
            disabled={toggling}
          >
            <Power size={14} /> {online ? 'Go Offline (Break)' : 'Go Online (Start Shift)'}
          </button>
        </div>
      </div>

      {/* 4 Rider KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Assignments</span>
            <span className="avatar" style={{ width: 34, height: 34, background: '#fff0e6', color: '#ff5500' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{active.length} Tasks Pending</div>
          <div className="muted text-xs mt-1">Pick-up &amp; drop-off queue</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>On Road / In Transit</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Navigation size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{inTransit.length} Out on Route</div>
          <div className="muted text-xs mt-1">Picked up, heading to customer</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Today's Earnings</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(todayEarnings)}</div>
          <div className="muted text-xs mt-1">{deliveredToday.length} deliveries fulfilled today</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>COD Cash Collected</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(codInHand)}</div>
          <div className="muted text-xs mt-1">Ready for daily hub remittance</div>
        </div>
      </div>

      {/* Active Delivery Hero */}
      {activeDelivery && (
        <div
          className="card"
          style={{
            margin: 0,
            overflow: 'hidden',
            border: '2px solid rgba(16, 185, 129, 0.25)',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="avatar" style={{ width: 30, height: 30, background: '#10b981', color: '#fff' }}>
              <Navigation size={16} />
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)', flex: 1 }}>
              Active Delivery · {activeDelivery.vendor_order_number || activeDelivery.id}
            </h3>
            <DeliveryStatusBadge status={activeDelivery.status} />
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, fontSize: 12.5 }}>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="muted font-bold text-xs flex items-center gap-1 mb-1">
                  <Store size={12} color="#4f46e5" /> Pickup from vendor
                </div>
                <div className="font-bold text-ink">{activeDelivery.pickup_address || '—'}</div>
              </div>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="muted font-bold text-xs flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <User size={12} color="#10b981" /> Deliver to
                  </span>
                  {activeDelivery.recipient_phone && (
                    <a href={`tel:${activeDelivery.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                      <Phone size={10} /> Call
                    </a>
                  )}
                </div>
                <div className="font-bold text-ink">
                  {activeDelivery.recipient_name || '—'}
                  {activeDelivery.recipient_phone ? ` · ${activeDelivery.recipient_phone}` : ''}
                </div>
                <div className="muted text-xs mt-0.5">{activeDelivery.dropoff_address || '—'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between wrap gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="muted">
                  Fee: <strong className="text-success">{money(activeDelivery.delivery_fee)}</strong>
                </span>
                {activeDelivery.cod_amount > 0 && (
                  <span className="font-bold" style={{ color: '#d97706' }}>
                    Collect COD: {money(activeDelivery.cod_amount)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/delivery/deliveries/${activeDelivery.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
                  View Dossier <ChevronRight size={12} />
                </Link>
                {activeDelivery.status === 'assigned' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    onClick={() => handleAccept(activeDelivery)}
                    disabled={busyId === activeDelivery.id}
                  >
                    <Package size={12} /> {busyId === activeDelivery.id ? 'Accepting…' : 'Accept'}
                  </button>
                ) : (
                  (() => {
                    const step = nextStep(activeDelivery)
                    return step && step.to ? (
                      <Link to={step.to} className="btn btn-success btn-xs flex items-center gap-1">
                        <ArrowRight size={12} /> {step.label}
                      </Link>
                    ) : null
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Dispatches List */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <Truck size={17} color="#4f46e5" /> Assigned Delivery Tasks ({active.length})
            </h3>
            <p className="muted text-xs m-0 mt-0.5">Accept assignments, pick up from vendors, and deliver to customer doorsteps.</p>
          </div>
          <Link to="/delivery/deliveries" className="btn btn-outline btn-xs flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {active.length === 0 ? (
          <div style={{ padding: '24px 20px' }}>
            <EmptyState
              icon={Truck}
              title="No active deliveries"
              message="When the dispatch hub assigns a delivery it will appear here. Make sure you are online to receive assignments."
              action={
                <Link to="/delivery/history" className="btn btn-outline btn-sm">
                  View Delivery History
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {active.map((t) => (
              <div key={t.id} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flex items-center justify-between wrap gap-2">
                  <div className="flex items-center gap-2 wrap">
                    <span className="font-mono font-bold text-xs" style={{ background: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: 4 }}>
                      {t.vendor_order_number || t.id}
                    </span>
                    <DeliveryStatusBadge status={t.status} size="xs" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="muted">
                      ETA
                      <strong> {t.assigned_at ? formatDateTime(t.assigned_at) : '—'}</strong>
                    </span>
                    <span className="font-bold" style={{ color: '#16a34a' }}>Fee: +{money(t.delivery_fee)}</span>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div className="muted font-bold text-xs flex items-center gap-1 mb-1">
                      <Store size={12} color="#4f46e5" /> Pickup
                    </div>
                    <div className="font-bold text-ink">{t.pickup_address || '—'}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div className="muted font-bold text-xs flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <User size={12} color="#10b981" /> Drop-off
                      </span>
                      {t.recipient_phone && (
                        <a href={`tel:${t.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                          <Phone size={10} /> Call
                        </a>
                      )}
                    </div>
                    <div className="font-bold text-ink">{t.recipient_name || '—'}</div>
                    <div className="muted text-xs mt-0.5">{t.dropoff_address || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between wrap gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2 text-xs">
                    {t.cod_amount > 0 && (
                      <span className="font-bold flex items-center gap-1" style={{ color: '#d97706' }}>
                        <Banknote size={12} /> Collect COD: {money(t.cod_amount)}
                      </span>
                    )}
                    <Link to={`/delivery/deliveries/${t.id}`} className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                      Dossier <ChevronRight size={10} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.status === 'assigned' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-xs flex items-center gap-1"
                        onClick={() => handleAccept(t)}
                        disabled={busyId === t.id}
                      >
                        <Package size={12} /> {busyId === t.id ? 'Accepting…' : 'Accept & Pick Up'}
                      </button>
                    )}
                    {t.status === 'accepted' && (
                      <Link to={`/delivery/deliveries/${t.id}/pickup`} className="btn btn-primary btn-xs flex items-center gap-1">
                        <Package size={12} /> Proceed to Pickup
                      </Link>
                    )}
                    {t.status === 'picked_up' && (
                      <Link to={`/delivery/deliveries/${t.id}/deliver`} className="btn btn-primary btn-xs flex items-center gap-1">
                        <Navigation size={12} /> Start Delivery
                      </Link>
                    )}
                    {t.status === 'out_for_delivery' && (
                      <Link to={`/delivery/deliveries/${t.id}/deliver`} className="btn btn-success btn-xs flex items-center gap-1">
                        <CheckCircle2 size={12} /> Confirm Delivery
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      {recent.length > 0 && (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <Clock size={16} color="#64748b" /> Recently Completed
            </h3>
            <Link to="/delivery/history" className="btn btn-ghost btn-xs text-primary flex items-center gap-1">
              History <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {recent.map((a) => {
              const doneDate = completionDate(a)
              return (
                <Link
                  key={a.id}
                  to={`/delivery/deliveries/${a.id}`}
                  style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
                >
                  <span className="avatar" style={{ width: 32, height: 32, background: a.status === 'delivered' ? '#ecfdf5' : '#fef2f2', color: a.status === 'delivered' ? '#10b981' : '#ef4444' }}>
                    {a.status === 'delivered' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-bold text-sm text-ink truncate">{a.vendor_order_number || a.id}</div>
                    <div className="muted text-xs mt-0.5 truncate">{a.recipient_name} · {a.dropoff_address || '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="muted text-xs">{doneDate ? formatDateTime(doneDate) : '—'}</span>
                    {a.status === 'delivered' && (
                      <span className="font-bold text-xs" style={{ color: '#16a34a' }}>+{money(a.delivery_fee)}</span>
                    )}
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
