import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Navigation, Truck, Phone, User, Store, MapPin, Package,
  CheckCircle2, ChevronRight, AlertTriangle,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, errorMessage } from '../../utils/format'
import { ACTIVE_STATUSES, nextStep } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import DeliveryStatusTimeline from '../../components/delivery/DeliveryStatusTimeline'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryActiveRoute() {
  const toast = useToast()
  const assignments = useApi(() => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }))
  const [busyId, setBusyId] = useState(null)
  const [confirmAccept, setConfirmAccept] = useState(null)

  const all = assignments.data?.data ?? []
  const active = useMemo(() => all.filter((a) => ACTIVE_STATUSES.includes(a.status)), [all])
  const activeDelivery =
    active.find((a) => a.status === 'out_for_delivery') ||
    active.find((a) => a.status === 'picked_up') ||
    active.find((a) => a.status === 'accepted') ||
    active.find((a) => a.status === 'assigned')

  const handleAccept = async (a) => {
    setBusyId(a.id)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/accept`)
      toast.success('Delivery accepted. Proceed to pickup.')
      setConfirmAccept(null)
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
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={220} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={140} />
        </div>
      </div>
    )
  }

  if (assignments.error) {
    return <ErrorState message={errorMessage(assignments.error)} onRetry={() => assignments.reload()} />
  }

  if (!activeDelivery) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Active Delivery</h1>
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>Your current in-route delivery, live.</p>
        </div>
        <EmptyState
          icon={Navigation}
          title="No active delivery right now"
          message="You have no delivery in progress. Accept an assignment to start a route, or make sure you are online to receive dispatches."
          action={
            <Link to="/delivery/deliveries" className="btn btn-primary btn-sm">
              View Assigned Deliveries
            </Link>
          }
        />
      </div>
    )
  }

  const a = activeDelivery
  const step = nextStep(a)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Active Delivery</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {a.vendor_order_number || a.id} · <strong className="text-success">+{money(a.delivery_fee)}</strong>
          </p>
        </div>
        <DeliveryStatusBadge status={a.status} />
      </div>

      {/* Route Visual */}
      <div className="card" style={{ padding: '18px 20px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.25)' }}>
        <div className="flex flex-col" style={{ gap: 0 }}>
          {/* Pickup */}
          <div className="flex" style={{ gap: 12 }}>
            <div className="flex flex-col items-center" style={{ width: 22 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={10} />
              </span>
              <span style={{ width: 2, flex: 1, minHeight: 24, background: '#c7d2fe', borderLeft: '2px dashed #c7d2fe' }} />
            </div>
            <div style={{ paddingBottom: 10 }}>
              <div className="muted font-bold text-xs mb-1" style={{ color: '#4338ca' }}>PICKUP FROM VENDOR</div>
              <div className="font-bold text-ink text-sm">{a.pickup_address || '—'}</div>
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex" style={{ gap: 12 }}>
            <div className="flex flex-col items-center" style={{ width: 22 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={10} />
              </span>
            </div>
            <div>
              <div className="muted font-bold text-xs mb-1" style={{ color: '#059669' }}>DROP OFF TO CUSTOMER</div>
              <div className="font-bold text-ink text-sm">{a.recipient_name || '—'}</div>
              {a.recipient_phone && (
                <a href={`tel:${a.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                  <Phone size={10} /> {a.recipient_phone}
                </a>
              )}
              <div className="muted text-xs mt-0.5">{a.dropoff_address || '—'}</div>
              {a.cod_amount > 0 && (
                <div className="chip chip-sm mt-2" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: 800 }}>
                  Collect COD: {money(a.cod_amount)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
            View Dossier <ChevronRight size={12} />
          </Link>
          {a.status === 'assigned' ? (
            <button
              type="button"
              className="btn btn-primary btn-xs flex items-center gap-1"
              onClick={() => setConfirmAccept(a)}
              disabled={busyId === a.id}
            >
              <Package size={12} /> {busyId === a.id ? 'Accepting…' : 'Accept & Start Route'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {step && step.to && (
                <Link to={step.to} className={`btn btn-${step.color} btn-xs flex items-center gap-1`}>
                  {step.label} <ChevronRight size={12} />
                </Link>
              )}
              {(a.status === 'accepted' || a.status === 'picked_up' || a.status === 'out_for_delivery') && (
                <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline btn-xs flex items-center gap-1">
                  <AlertTriangle size={12} /> Mark Failed
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card" style={{ padding: '18px 20px', margin: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', color: 'var(--ink)' }}>Delivery Progress</h3>
        <DeliveryStatusTimeline assignment={a} />
      </div>

      <ConfirmDialog
        open={!!confirmAccept}
        onClose={() => setConfirmAccept(null)}
        onConfirm={() => confirmAccept && handleAccept(confirmAccept)}
        loading={busyId === confirmAccept?.id}
        title="Accept this delivery?"
        confirmText="Accept Delivery"
        message="Accepting confirms you will pick up this parcel from the vendor and deliver it to the customer."
      >
        {confirmAccept && (
          <div className="card" style={{ background: 'var(--bg)', padding: 12, margin: 0 }}>
            <div className="font-bold text-sm text-ink">{confirmAccept.vendor_order_number}</div>
            <div className="muted text-xs mt-0.5">
              {confirmAccept.recipient_name} · {money(confirmAccept.delivery_fee)}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
