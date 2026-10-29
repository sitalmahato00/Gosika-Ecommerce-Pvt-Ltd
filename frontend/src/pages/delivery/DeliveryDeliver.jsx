import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Navigation, Package, CheckCircle2,
  Banknote, AlertTriangle, Phone, MapPin, User, Store,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, errorMessage } from '../../utils/format'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryDeliver() {
  const { id } = useParams()
  const toast = useToast()
  const assignment = useApi(() => api.get(`/delivery-partner/assignments/${id}`))
  const [otpInput, setOtpInput] = useState('')
  const [collectCash, setCollectCash] = useState(true)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const a = assignment.data

  const handleStartDelivery = async () => {
    setBusy(true)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/out-for-delivery`)
      assignment.reload({ silent: true })
      toast.success('Shipment marked out for delivery. Request customer OTP upon arrival.')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/deliver`, { otp: otpInput })
      setDone(true)
      toast.success('Delivery confirmed! Fee credited to your earnings.')
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
          <Skeleton height={180} />
        </div>
      </div>
    )
  }

  if (assignment.error) {
    return <ErrorState message={errorMessage(assignment.error)} onRetry={() => assignment.reload()} />
  }

  if (!a) return null

  const isCod = Number(a.cod_amount || 0) > 0

  if (done || a.status === 'delivered') {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="card" style={{ padding: 28, margin: 0, textAlign: 'center' }}>
          <span className="avatar" style={{ width: 56, height: 56, background: '#ecfdf5', color: '#10b981', margin: '0 auto 14px' }}>
            <CheckCircle2 size={28} />
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>Delivery Completed</h3>
          <p className="muted" style={{ margin: '0 auto 18px', maxWidth: 400 }}>
            {a.vendor_order_number || a.id} has been confirmed by the customer. Your delivery fee{' '}
            <strong className="text-success">{money(a.delivery_fee)}</strong> has been credited to your earnings.
          </p>
          <div className="flex items-center justify-center gap-2 wrap">
            <Link to="/delivery" className="btn btn-primary btn-sm">Back to Dashboard</Link>
            <Link to="/delivery/earnings" className="btn btn-outline btn-sm">View Earnings</Link>
          </div>
        </div>
      </div>
    )
  }

  const renderGuidance = (title, message, action) => (
    <div className="card" style={{ padding: 24, margin: 0, textAlign: 'center' }}>
      <span className="avatar" style={{ width: 48, height: 48, background: '#eef2ff', color: '#4f46e5', margin: '0 auto 12px' }}>
        <Package size={24} />
      </span>
      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>{title}</h3>
      <p className="muted" style={{ margin: '0 auto 16px', maxWidth: 420 }}>{message}</p>
      {action}
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1 wrap">
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 11 }}>
              <ArrowLeft size={12} /> Back to Delivery
            </Link>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Customer Delivery</h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {a.vendor_order_number || a.id} · <strong className="text-success">+{money(a.delivery_fee)}</strong>
          </p>
        </div>
        <DeliveryStatusBadge status={a.status} />
      </div>

      {/* Dropoff summary */}
      <div className="card" style={{ padding: 16, margin: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <span className="muted font-bold text-xs flex items-center gap-1" style={{ color: '#059669' }}>
            <MapPin size={13} /> DELIVER TO
          </span>
          {a.recipient_phone && (
            <a href={`tel:${a.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
              <Phone size={10} /> Call Customer
            </a>
          )}
        </div>
        <div className="font-bold text-ink text-sm">
          {a.recipient_name || '—'}
          {a.recipient_phone ? ` · ${a.recipient_phone}` : ''}
        </div>
        <div className="muted text-xs mt-0.5">{a.dropoff_address || '—'}</div>
        <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="chip chip-sm" style={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 800 }}>
            Fee {money(a.delivery_fee)}
          </span>
          {isCod && (
            <span className="chip chip-sm" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: 800 }}>
              Collect COD {money(a.cod_amount)}
            </span>
          )}
        </div>
      </div>

      {a.status === 'picked_up' && (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>Step 1 — Start delivery to the customer</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Starting delivery marks this shipment as out for delivery. The customer will see their secure 6-digit handover OTP on their Gosika Order Detail page.
          </p>
          <button
            type="button"
            className="btn btn-primary flex items-center gap-1"
            onClick={handleStartDelivery}
            disabled={busy}
          >
            <Navigation size={15} /> {busy ? 'Starting…' : 'Start Delivery to Customer'}
          </button>
        </div>
      )}

      {a.status === 'out_for_delivery' && (
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>Step 2 — Verify customer OTP & complete delivery</h3>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
            Ask the customer for the 6-digit Delivery OTP displayed on their Gosika Order Detail page upon handover. Enter it below to complete delivery.
          </p>

          <form onSubmit={handleConfirm} className="flex flex-col gap-3">
            {isCod && (
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  required
                  checked={collectCash}
                  onChange={(e) => setCollectCash(e.target.checked)}
                />
                <span className="font-bold text-ink flex items-center gap-1">
                  <Banknote size={13} color="#d97706" /> I have collected {money(a.cod_amount)} cash in full
                </span>
              </label>
            )}

            <div className="form-group">
              <label className="label">Customer Delivery OTP (6 Digits) <span className="req">*</span></label>
              <input
                className="input font-mono font-bold text-center"
                style={{ fontSize: 20, letterSpacing: '0.24em' }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="4 9 1 2 8 3"
              />
              <span className="muted text-xs mt-1 block">Customer can find their secure 6-digit handover OTP on their Gosika Order Detail page.</span>
            </div>

            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-success flex items-center gap-1" disabled={busy || otpInput.length !== 6}>
                <CheckCircle2 size={15} /> {busy ? 'Verifying…' : 'Confirm Delivered'}
              </button>
              <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline flex items-center gap-1">
                <AlertTriangle size={14} /> Mark Failed
              </Link>
            </div>
          </form>
        </div>
      )}

      {(a.status === 'assigned' || a.status === 'accepted') &&
        renderGuidance(
          'Complete pickup first',
          'You need to pick up the parcel from the vendor before you can start the customer delivery.',
          <Link to={`/delivery/deliveries/${a.id}/pickup`} className="btn btn-primary btn-sm">
            Go to Pickup
          </Link>,
        )}

      {(a.status === 'failed' || a.status === 'returned_to_vendor') &&
        renderGuidance(
          'Delivery not in progress',
          'This delivery is not out for delivery. You can view the failure details and return the parcel to the vendor if needed.',
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-primary btn-sm">
            View Delivery
          </Link>,
        )}
    </div>
  )
}
