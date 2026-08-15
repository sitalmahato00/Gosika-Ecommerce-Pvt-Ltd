import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, RotateCcw, CheckCircle2, User, MapPin, Phone } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { FAILURE_REASONS } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryFailure() {
  const { id } = useParams()
  const toast = useToast()
  const assignment = useApi(() => api.get(`/delivery-partner/assignments/${id}`))
  const [reasonPreset, setReasonPreset] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const a = assignment.data

  const handleSubmit = (e) => {
    e.preventDefault()
    const reason = customReason.trim() || reasonPreset
    if (!reason) {
      toast.error('Please select or enter a failure reason.')
      return
    }
    setConfirm({ type: 'fail', reason })
  }

  const run = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await api.post(
        `/delivery-partner/assignments/${a.id}/${confirm.type}`,
        confirm.type === 'fail' ? { reason: confirm.reason } : {},
      )
      toast.success(
        confirm.type === 'fail'
          ? 'Delivery marked as failed.'
          : 'Parcel returned to vendor. Stock has been restored.',
      )
      setConfirm(null)
      setReasonPreset('')
      setCustomReason('')
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

  const canFail = ['accepted', 'picked_up', 'out_for_delivery'].includes(a.status)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1 wrap">
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 11 }}>
              <ArrowLeft size={12} /> Back to Delivery
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Failed Delivery</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {a.vendor_order_number || a.id} · {a.recipient_name || '—'}
          </p>
        </div>
        <DeliveryStatusBadge status={a.status} />
      </div>

      {/* Context */}
      <div className="card" style={{ padding: 16, margin: 0 }}>
        <div className="muted font-bold text-xs flex items-center gap-1 mb-1" style={{ color: '#059669' }}>
          <MapPin size={13} /> CUSTOMER DROP-OFF
        </div>
        <div className="font-bold text-ink text-sm">
          {a.recipient_name || '—'}
          {a.recipient_phone ? ` · ${a.recipient_phone}` : ''}
        </div>
        <div className="muted text-xs mt-0.5">{a.dropoff_address || '—'}</div>
        {a.cod_amount > 0 && (
          <div className="muted text-xs mt-1">
            COD to collect: <strong style={{ color: '#d97706' }}>{money(a.cod_amount)}</strong>
          </div>
        )}
      </div>

      {a.status === 'failed' && (
        <>
          <div className="card" style={{ padding: 18, margin: 0 }}>
            <div className="flex items-start gap-3">
              <span className="avatar" style={{ width: 38, height: 38, background: '#fef2f2', color: '#ef4444', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </span>
              <div>
                <div className="font-bold text-sm text-ink">Delivery marked as failed</div>
                <div className="muted text-xs mt-1">{a.failed_at ? formatDateTime(a.failed_at) : '—'}</div>
                {a.failure_reason && (
                  <div className="text-sm mt-2" style={{ color: '#dc2626' }}>{a.failure_reason}</div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, margin: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>Return parcel to vendor</h3>
            <p className="muted" style={{ fontSize: 13, margin: '0 0 14px' }}>
              If the parcel was not delivered, return it to the vendor so their stock can be restored.
            </p>
            <button type="button" className="btn btn-outline flex items-center gap-1" onClick={() => setConfirm({ type: 'return' })} disabled={busy}>
              <RotateCcw size={15} /> {busy ? 'Returning…' : 'Return to Vendor'}
            </button>
          </div>
        </>
      )}

      {a.status === 'returned_to_vendor' && (
        <div className="card" style={{ padding: 24, margin: 0, textAlign: 'center' }}>
          <span className="avatar" style={{ width: 48, height: 48, background: '#f1f5f9', color: '#64748b', margin: '0 auto 12px' }}>
            <RotateCcw size={24} />
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Parcel returned to vendor</h3>
          <p className="muted" style={{ margin: '0 auto 16px', maxWidth: 400 }}>
            {a.failure_reason || 'This delivery has been returned to the vendor.'}
          </p>
          <Link to="/delivery/deliveries" className="btn btn-primary btn-sm">Back to Deliveries</Link>
        </div>
      )}

      {a.status === 'delivered' && (
        <div className="card" style={{ padding: 24, margin: 0, textAlign: 'center' }}>
          <span className="avatar" style={{ width: 48, height: 48, background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px' }}>
            <CheckCircle2 size={24} />
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>This delivery was completed</h3>
          <p className="muted" style={{ margin: '0 auto 16px', maxWidth: 400 }}>
            No failure action is needed — the delivery was confirmed by the customer.
          </p>
          <Link to="/delivery/deliveries" className="btn btn-primary btn-sm">Back to Deliveries</Link>
        </div>
      )}

      {canFail && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 18, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>Mark this delivery as failed</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Select the closest reason. A reason is required before the failure is recorded.
          </p>

          <div className="form-group">
            <label className="label">Failure reason</label>
            <select
              className="select"
              value={reasonPreset}
              onChange={(e) => {
                setReasonPreset(e.target.value)
                if (e.target.value) setCustomReason('')
              }}
            >
              <option value="">Select a reason…</option>
              {FAILURE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Notes (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe what happened, e.g. customer was not reachable after multiple attempts…"
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value)
                if (e.target.value) setReasonPreset('')
              }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="btn btn-danger-outline flex items-center gap-1">
              <AlertTriangle size={15} /> Mark as Failed
            </button>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline">Cancel</Link>
          </div>
        </form>
      )}

      {!canFail && a.status !== 'failed' && a.status !== 'returned_to_vendor' && a.status !== 'delivered' && (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>Failure is not available in this state</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 14px' }}>
            Current status: <DeliveryStatusBadge status={a.status} /> — a delivery can only be marked failed after it is accepted.
          </p>
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-sm">Back to Delivery</Link>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        loading={busy}
        danger={confirm?.type === 'fail'}
        title={confirm?.type === 'fail' ? 'Mark delivery as failed?' : 'Return parcel to vendor?'}
        confirmText={confirm?.type === 'fail' ? 'Mark as Failed' : 'Confirm Return'}
        message={
          confirm?.type === 'fail'
            ? 'This records the delivery as failed with the reason you provided. You can return the parcel to the vendor afterwards.'
            : 'Confirm the parcel is being returned to the vendor. Stock will be restored automatically.'
        }
      />
    </div>
  )
}
