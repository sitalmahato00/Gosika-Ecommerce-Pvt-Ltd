import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, CheckCircle2, Navigation, Store, User, Phone, ChevronRight } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

const CHECKLIST = [
  'Verify the sealed parcel matches the order reference.',
  'Confirm the item count before leaving the vendor.',
  'Note any visible damage before accepting the parcel.',
  'Collect the drop-off address and customer contact.',
]

export default function DeliveryPickup() {
  const { id } = useParams()
  const toast = useToast()
  const assignment = useApi(() => api.get(`/delivery-partner/assignments/${id}`))
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState([])

  const a = assignment.data

  const toggleCheck = (i) => {
    setChecked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
  }

  const run = async (type) => {
    setBusy(true)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/${type}`)
      toast.success(type === 'accept' ? 'Delivery accepted. Now pick up the parcel from the vendor.' : 'Parcel picked up. You are ready to start delivery.')
      setConfirm(null)
      setChecked([])
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
          <Skeleton height={140} />
        </div>
      </div>
    )
  }

  if (assignment.error) {
    return <ErrorState message={errorMessage(assignment.error)} onRetry={() => assignment.reload()} />
  }

  if (!a) return null

  const isPickedUp = a.status === 'picked_up'
  const isOutForDelivery = a.status === 'out_for_delivery'
  const isDone = a.status === 'delivered' || a.status === 'returned_to_vendor'
  const needsPickup = a.status === 'accepted'

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1 wrap">
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 11 }}>
              <ArrowLeft size={12} /> Back to Delivery
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Pickup Workflow</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {a.vendor_order_number || a.id}
          </p>
        </div>
        <DeliveryStatusBadge status={a.status} />
      </div>

      {isDone ? (
        <div className="card" style={{ padding: 24, margin: 0, textAlign: 'center' }}>
          <span className="avatar" style={{ width: 48, height: 48, background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px' }}>
            <CheckCircle2 size={24} />
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>
            {a.status === 'delivered' ? 'This delivery is already completed' : 'This parcel has been returned to the vendor'}
          </h3>
          <p className="muted" style={{ margin: '0 auto 16px', maxWidth: 380 }}>No further pickup action is required for this delivery.</p>
          <Link to="/delivery/deliveries" className="btn btn-primary btn-sm">Back to Deliveries</Link>
        </div>
      ) : isPickedUp || isOutForDelivery ? (
        <div className="card" style={{ padding: 24, margin: 0, textAlign: 'center' }}>
          <span className="avatar" style={{ width: 48, height: 48, background: '#ecfdf5', color: '#10b981', margin: '0 auto 12px' }}>
            <Package size={24} />
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Parcel picked up — ready for delivery</h3>
          <p className="muted" style={{ margin: '0 auto 16px', maxWidth: 400 }}>
            The parcel has been collected from the vendor. Start your delivery to the customer to generate the confirmation OTP.
          </p>
          <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-primary flex items-center gap-1">
            <Navigation size={15} /> Start Delivery
          </Link>
        </div>
      ) : a.status === 'assigned' ? (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>Step 1 — Accept this delivery</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            You must accept the assignment before you can pick up the parcel from the vendor.
          </p>
          <button type="button" className="btn btn-primary flex items-center gap-1" onClick={() => setConfirm('accept')} disabled={busy}>
            <Package size={15} /> {busy ? 'Accepting…' : 'Accept Delivery'}
          </button>
        </div>
      ) : needsPickup ? (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>Step 2 — Pick up from vendor</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Confirm the parcel details at <strong>{a.pickup_address || 'the vendor'}</strong> before leaving.
          </p>

          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Store size={15} color="#4338ca" />
              <span className="font-bold text-sm text-ink">{a.pickup_address || 'Vendor'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs muted">
              <User size={13} /> Deliver to <strong className="text-ink">{a.recipient_name}</strong>
              {a.recipient_phone && (
                <a href={`tel:${a.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                  <Phone size={10} /> Call
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 10 }}>
            {CHECKLIST.map((c, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={checked.includes(i)}
                  onChange={() => toggleCheck(i)}
                />
                <span className="text-ink">{c}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn btn-primary flex items-center gap-1"
              onClick={() => setConfirm('pickup')}
              disabled={busy || checked.length < CHECKLIST.length}
            >
              <Package size={15} /> {busy ? 'Confirming…' : 'Confirm Pickup'}
            </button>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline">View Dossier</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>Pickup is not available in the current state</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Current status: <DeliveryStatusBadge status={a.status} /> — pickup can only be completed after the delivery is accepted.
          </p>
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-sm">
            Back to Delivery
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
        loading={busy}
        title={confirm === 'accept' ? 'Accept this delivery?' : 'Confirm parcel picked up?'}
        confirmText={confirm === 'accept' ? 'Accept Delivery' : 'Confirm Pickup'}
        message={
          confirm === 'accept'
            ? 'Accepting confirms you will pick up this parcel from the vendor and deliver it to the customer.'
            : 'Confirm you have collected the sealed parcel and verified the checklist above.'
        }
      />
    </div>
  )
}
