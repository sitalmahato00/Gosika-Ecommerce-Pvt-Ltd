import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Phone, User, Store, MapPin, Banknote, Package,
  Navigation, CheckCircle2, RotateCcw, AlertTriangle, ChevronRight, Truck, Clock,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { nextStep } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import DeliveryStatusTimeline from '../../components/delivery/DeliveryStatusTimeline'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryDetail() {
  const { id } = useParams()
  const toast = useToast()
  const assignment = useApi(() => api.get(`/delivery-partner/assignments/${id}`))
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const a = assignment.data

  const doAction = async (type) => {
    setBusy(true)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/${type}`)
      toast.success(
        type === 'accept'
          ? 'Delivery accepted. Proceed to pickup.'
          : type === 'return'
          ? 'Parcel marked as returned to vendor.'
          : 'Status updated.',
      )
      setConfirm(null)
      assignment.reload({ silent: true })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (assignment.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={26} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={160} />
        </div>
      </div>
    )
  }

  if (assignment.error) {
    return <ErrorState message={errorMessage(assignment.error)} onRetry={() => assignment.reload()} />
  }

  if (!a) return null

  const step = nextStep(a)
  const isCod = Number(a.cod_amount || 0) > 0

  const renderActions = () => {
    switch (a.status) {
      case 'assigned':
        return (
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setConfirm({ type: 'accept' })}
            disabled={busy}
          >
            <Package size={14} /> {busy ? 'Accepting…' : 'Accept Delivery'}
          </button>
        )
      case 'accepted':
        return (
          <Link to={`/delivery/deliveries/${a.id}/pickup`} className="btn btn-primary btn-sm flex items-center gap-1">
            <Package size={14} /> Proceed to Pickup
          </Link>
        )
      case 'picked_up':
        return (
          <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-primary btn-sm flex items-center gap-1">
            <Navigation size={14} /> Start Delivery
          </Link>
        )
      case 'out_for_delivery':
        return (
          <>
            <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-success btn-sm flex items-center gap-1">
              <CheckCircle2 size={14} /> Confirm Delivery
            </Link>
            <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline btn-sm flex items-center gap-1">
              <AlertTriangle size={14} /> Mark Failed
            </Link>
          </>
        )
      case 'failed':
        return (
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1"
            onClick={() => setConfirm({ type: 'return' })}
            disabled={busy}
          >
            <RotateCcw size={14} /> {busy ? 'Returning…' : 'Return to Vendor'}
          </button>
        )
      default:
        return (
          <Link to="/delivery/history" className="btn btn-outline btn-sm">
            Back to History
          </Link>
        )
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1 wrap">
            <Link to="/delivery/deliveries" className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 11 }}>
              <ArrowLeft size={12} /> Deliveries
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>
              Delivery {a.vendor_order_number || a.id}
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Order #{a.vendor_order_number || '—'} · Assigned {a.assigned_at ? formatDateTime(a.assigned_at) : '—'}
          </p>
        </div>
        <DeliveryStatusBadge status={a.status} />
      </div>

      {/* Pickup & Dropoff */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted font-bold text-xs flex items-center gap-1" style={{ color: '#4338ca' }}>
              <Store size={13} /> PICKUP FROM VENDOR
            </span>
          </div>
          <div className="font-bold text-ink text-sm">{a.pickup_address || '—'}</div>
          <div className="muted text-xs mt-1">Collect the sealed parcel and verify before leaving.</div>
        </div>

        <div className="card" style={{ padding: 16, margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted font-bold text-xs flex items-center gap-1" style={{ color: '#059669' }}>
              <MapPin size={13} /> DROP OFF TO CUSTOMER
            </span>
            {a.recipient_phone && (
              <a href={`tel:${a.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                <Phone size={10} /> Call
              </a>
            )}
          </div>
          <div className="font-bold text-ink text-sm">{a.recipient_name || '—'}</div>
          <div className="muted text-xs mt-0.5">
            {a.recipient_phone ? a.recipient_phone + ' · ' : ''}
            {a.dropoff_address || '—'}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="card flex items-center justify-between" style={{ padding: '14px 16px', margin: 0 }}>
          <div>
            <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivery Fee</div>
            <div className="font-bold text-lg text-success" style={{ fontSize: 18 }}>{money(a.delivery_fee)}</div>
          </div>
          <Truck size={22} color="#10b981" />
        </div>
        <div className="card flex items-center justify-between" style={{ padding: '14px 16px', margin: 0 }}>
          <div>
            <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Payment</div>
            <div className="font-bold" style={{ fontSize: 15, color: isCod ? '#d97706' : '#10b981' }}>
              {isCod ? `COD ${money(a.cod_amount)}` : 'Prepaid'}
            </div>
          </div>
          <Banknote size={22} color={isCod ? '#f59e0b' : '#10b981'} />
        </div>
        <div className="card flex items-center justify-between" style={{ padding: '14px 16px', margin: 0 }}>
          <div>
            <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Customer</div>
            <div className="font-bold" style={{ fontSize: 15, color: 'var(--ink)' }}>{a.recipient_name || '—'}</div>
          </div>
          <User size={22} color="#64748b" />
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: '18px 20px', margin: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', color: 'var(--ink)' }}>Delivery Progress</h3>
        <DeliveryStatusTimeline assignment={a} />
      </div>

      {/* Tracking Updates */}
      {Array.isArray(a.tracking) && a.tracking.length > 0 && (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <Clock size={15} /> Tracking Updates
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {a.tracking.map((t) => (
              <div key={t.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span className="avatar" style={{ width: 28, height: 28, background: '#eef2ff', color: '#4f46e5', flexShrink: 0 }}>
                  <Truck size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink capitalize">{String(t.status || '').replace(/_/g, ' ')}</div>
                  {t.note && <div className="muted text-xs mt-0.5">{t.note}</div>}
                </div>
                <span className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>{t.tracked_at ? formatDateTime(t.tracked_at) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between wrap gap-2">
        {step && step.to ? (
          <Link to={step.to} className={`btn btn-${step.color} flex items-center gap-1`}>
            {step.label} <ChevronRight size={14} />
          </Link>
        ) : (
          renderActions()
        )}
        {a.status === 'out_for_delivery' && (
          <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline btn-sm flex items-center gap-1">
            <AlertTriangle size={14} /> Mark Failed
          </Link>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doAction(confirm.type)}
        loading={busy}
        title={confirm?.type === 'accept' ? 'Accept this delivery?' : 'Return parcel to vendor?'}
        confirmText={confirm?.type === 'accept' ? 'Accept Delivery' : 'Confirm Return'}
        message={
          confirm?.type === 'accept'
            ? 'Accepting confirms you will pick up this parcel from the vendor and deliver it to the customer.'
            : 'Confirm the parcel is being returned to the vendor. Stock will be restored automatically.'
        }
      />
    </div>
  )
}
