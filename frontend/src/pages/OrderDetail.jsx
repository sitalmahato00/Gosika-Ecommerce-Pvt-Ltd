import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, MapPin, Truck, ShieldCheck, Phone, Clock, AlertCircle, HelpCircle, KeyRound, Copy, CheckCircle2 } from 'lucide-react'
import api from '../api/client'
import StatusBadge from '../components/commerce/StatusBadge'
import ErrorState from '../components/ui/ErrorState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { money, formatDateTime, apiImage, errorMessage, handleImgError } from '../utils/format'
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_BRAND_LOGOS } from '../utils/constants'
import { useToast } from '../context/ToastContext'

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Selected the wrong product or quantity',
  'Incorrect delivery address',
  'Found a better price elsewhere',
  'Payment issue',
  'Delivery taking too long',
  'Changed my mind',
  'Other',
]

export default function OrderDetail({ embedded = false, basePath = '/orders' }) {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tracking, setTracking] = useState([])
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0])
  const [explanation, setExplanation] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [otpCopied, setOtpCopied] = useState(false)

  const copyOtp = () => {
    if (!order?.delivery_otp) return
    navigator.clipboard.writeText(order.delivery_otp)
    setOtpCopied(true)
    toast.success('Delivery OTP copied to clipboard!')
    setTimeout(() => setOtpCopied(false), 2000)
  }

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get(`/orders/${id}`)
      .then(async (res) => {
        const o = res.data.data
        setOrder(o)
        try {
          const t = await api.get(`/orders/${id}/tracking`)
          setTracking(t.data.data || [])
        } catch {
          setTracking([])
        }
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  useEffect(() => {
    if (order?.cancellation_seconds_remaining > 0) {
      setCountdown(order.cancellation_seconds_remaining)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setCountdown(0)
    }
  }, [order?.cancellation_seconds_remaining, order?.id])

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s < 10 ? '0' : ''}${s}s`
  }

  const cancelOrder = async () => {
    if (selectedReason === 'Other' && !explanation.trim()) {
      toast.error('Please provide an explanation when selecting "Other".')
      return
    }

    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: selectedReason,
        explanation: explanation.trim() || undefined,
      })
      toast.success('Order cancelled successfully')
      setCancelOpen(false)
      setSelectedReason(CANCEL_REASONS[0])
      setExplanation('')
      load()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setCancelling(false)
    }
  }

  const [paying, setPaying] = useState(false)
  const initiatePayment = async () => {
    setPaying(true)
    try {
      if (order.payment_method === 'khalti') {
        const payRes = await api.post('/payments/initiate', { order_id: order.id, method: 'khalti' })
        const payment = payRes.data.data
        if (payment?.payment_url) {
          window.open(payment.payment_url, '_blank', 'noopener')
          toast.info('Please complete payment in the opened tab.')
        }
      } else if (order.payment_method === 'esewa') {
        const payRes = await api.post('/payments/initiate', {
          order_id: order.id,
          method: 'esewa',
          success_url: `${window.location.origin}/payments/esewa/callback`,
          failure_url: `${window.location.origin}/payments/esewa/callback?status=failure`,
        })
        const payment = payRes.data.data
        if (payment?.payment_form?.action && payment?.payment_form?.fields) {
          const formEl = document.createElement('form')
          formEl.method = 'POST'
          formEl.action = payment.payment_form.action
          formEl.style.display = 'none'
          Object.entries(payment.payment_form.fields).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            formEl.appendChild(input)
          })
          document.body.appendChild(formEl)
          toast.info('Redirecting to eSewa to complete payment…')
          formEl.submit()
        }
      }
    } catch (err) {
      toast.error('Failed to initiate payment: ' + errorMessage(err))
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell container">
        <Skeleton height={90} />
        <Skeleton height={240} style={{ marginTop: 16 }} />
      </div>
    )
  }

  if (error || !order) {
    return <div className="page-shell container"><ErrorState message={errorMessage(error, 'Order not found.')} onRetry={load} /></div>
  }

  const stepIdx = ORDER_STATUS_FLOW.indexOf(order.status)
  const addr = order.shipping_address || {}

  return (
    <div className="page-shell container">
      <nav className="flex items-center gap-1 muted text-sm mb-2" aria-label="Breadcrumb">
        <Link to={basePath}>My Orders</Link> <ChevronRight size={13} />
        <span className="font-semibold" style={{ color: 'var(--ink)' }}>#{order.order_number}</span>
      </nav>

      <div className="card mb-2">
        <div className="flex items-center justify-between wrap gap-2">
          <div>
            <h1 style={{ fontSize: 20, marginBottom: 4 }}>Order #{order.order_number}</h1>
            <div className="muted text-sm">Placed on {formatDateTime(order.placed_at)}</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status} />
            {order.payment_status === 'pending' && ['khalti', 'esewa'].includes(order.payment_method) && (
               <Button variant="primary" size="sm" onClick={initiatePayment} disabled={paying}>
                 {paying ? 'Processing...' : 'Pay Now'}
               </Button>
            )}
            {order.can_cancel && countdown > 0 && (
              <div className="flex items-center gap-1 text-xs" style={{ background: '#fef3c7', color: '#b45309', padding: '5px 10px', borderRadius: 6, fontWeight: 700 }}>
                <Clock size={13} />
                <span>Cancel within {formatCountdown(countdown)}</span>
              </div>
            )}
            {order.can_cancel && countdown > 0 && (
              <Button variant="danger-outline" size="sm" onClick={() => setCancelOpen(true)}>Cancel order</Button>
            )}
          </div>
        </div>
      </div>

      {order.cancellation_blocked_reason && order.status !== 'cancelled' && (
        <div className="alert alert-info mb-2 flex items-center justify-between wrap gap-2" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} color="#0284c7" />
            <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{order.cancellation_blocked_reason}</span>
          </div>
          <Link to="/account/support" className="btn btn-outline btn-xs flex items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
            <HelpCircle size={13} /> Contact Support
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          #order-detail-layout { grid-template-columns: 1fr 340px !important; }
        }
      `}</style>
      <div id="order-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, alignItems: 'start' }}>
        <div className="flex flex-col gap-4">
          {/* Delivery Confirmation OTP Card */}
          {order.delivery_otp && order.status !== 'cancelled' && (
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
                border: '1.5px solid #fed7aa',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.08)',
                padding: '18px 22px',
              }}
            >
              <div className="flex items-center justify-between wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(255, 85, 0, 0.12)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      Delivery Confirmation OTP
                    </h3>
                    <p className="muted text-xs" style={{ margin: 0 }}>
                      Provide this 6-digit verification code to your delivery rider upon package handover.
                    </p>
                  </div>
                </div>

                {order.status === 'delivered' ? (
                  <span className="chip chip-success chip-sm flex items-center gap-1">
                    <CheckCircle2 size={12} /> Delivery Verified
                  </span>
                ) : (
                  <span className="chip chip-sm" style={{ background: '#ffedd5', color: '#c2410c', fontWeight: 700 }}>
                    Required on Handover
                  </span>
                )}
              </div>

              <div
                className="flex items-center justify-between wrap gap-3 p-3 rounded"
                style={{
                  background: '#ffffff',
                  border: '1px dashed #fdba74',
                  marginTop: 10,
                }}
              >
                <div>
                  <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.05em' }}>
                    Your 6-Digit Delivery PIN
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: '0.22em',
                      color: 'var(--primary)',
                      fontFamily: 'monospace',
                      marginTop: 2,
                    }}
                  >
                    {order.delivery_otp}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm flex items-center gap-1.5"
                    onClick={copyOtp}
                  >
                    <Copy size={14} /> {otpCopied ? 'Copied!' : 'Copy OTP'}
                  </button>
                </div>
              </div>

              <div className="muted text-xs mt-2 flex items-center gap-1.5">
                <ShieldCheck size={13} color="#ea580c" />
                <span>Only share this code with the courier rider when you physically receive your package.</span>
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="card">
            <h2 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-3"><Truck size={17} color="var(--primary)" /> Order Status</h2>
            <div className="timeline">
              {ORDER_STATUS_FLOW.map((s, i) => {
                const state = i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''
                const cancelled = order.status === 'cancelled'
                return (
                  <div key={s} className={`timeline-item ${cancelled ? (i === 0 ? 'active' : '') : state}`}>
                    <div className="font-medium text-sm" style={{ color: state === 'active' ? 'var(--primary)' : undefined }}>
                      {ORDER_STATUS_LABELS[s]}
                    </div>
                    <div className="muted text-xs">
                      {cancelled && i === 0 ? 'Order was cancelled' : state === 'active' ? 'Current status' : ''}
                    </div>
                  </div>
                )
              })}
              {order.status === 'cancelled' && (
                <div className="timeline-item active">
                  <div className="font-medium text-sm" style={{ color: 'var(--danger)' }}>Cancelled</div>
                  <div className="muted text-xs">This order was cancelled.</div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <h2 style={{ fontSize: 16 }} className="mb-2">Items ({order.items?.length})</h2>
            <div className="flex flex-col">
              {(order.items || []).map((it) => (
                <div key={it.id} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Link to={`/product/${it.product_id}`} className="thumb" style={{ width: 56, height: 56 }}>
                    <img
                      src={it.image ? apiImage(it.image, it.product_name || it.name) : getProductImage(it, 0, true)}
                      alt={it.product_name || ''}
                      className="thumb-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={handleImgError}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${it.product_id}`} className="font-medium text-sm">{it.product_name}</Link>
                    {it.variant_name && <div className="muted text-xs">{it.variant_name}</div>}
                    <div className="muted text-xs">× {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold">{money(it.line_total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking */}
          {tracking.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: 16 }} className="mb-3">Delivery Tracking</h2>
              <div className="timeline">
                {tracking.map((t) => (
                  <div key={t.id} className={`timeline-item ${t.status === 'delivered' ? 'done' : 'active'}`}>
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.description && <div className="muted text-xs">{t.description}</div>}
                    <div className="muted text-xs mt-1">{formatDateTime(t.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <h2 style={{ fontSize: 16 }} className="mb-2">Order Summary</h2>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(order.subtotal)}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between"><span className="muted">Discount</span><span className="text-success">-{money(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="muted">Delivery</span><span>{Number(order.delivery_charge) > 0 ? money(order.delivery_charge) : 'Free'}</span></div>
              {Number(order.tax) > 0 && <div className="flex justify-between"><span className="muted">Tax</span><span>{money(order.tax)}</span></div>}
              <div className="flex justify-between mt-1" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span className="font-bold">Total</span><span className="price-current">{money(order.grand_total)}</span>
              </div>
              <div className="flex justify-between mt-1"><span className="muted">Payment</span><span className="font-medium flex items-center gap-1">{order.payment_method === 'esewa' && <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 14, width: 'auto' }} />}{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</span></div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><MapPin size={16} color="var(--primary)" /> Delivery Address</h2>
            <div className="text-sm">
              <div className="font-semibold">{addr.name}</div>
              <div className="muted">{addr.street}, {addr.municipality}, {addr.district}, {addr.province}</div>
              <div className="muted flex items-center gap-1 mt-1"><Phone size={12} /> {addr.phone}</div>
            </div>
          </div>

          {order.delivery_otp && order.status !== 'cancelled' && (
            <div className="card" style={{ padding: 16, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase" style={{ color: '#c2410c', letterSpacing: '0.04em' }}>Delivery OTP</span>
                <KeyRound size={15} color="#ea580c" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.18em', color: '#c2410c', fontFamily: 'monospace' }}>
                {order.delivery_otp}
              </div>
              <p className="muted text-xs mt-1" style={{ margin: '4px 0 0' }}>
                Share with delivery rider upon handover.
              </p>
            </div>
          )}

          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            <ShieldCheck size={18} />
            <span>Every order on Gosika is covered by the Gosika Buyer Protection guarantee.</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelOrder}
        danger
        loading={cancelling}
        title="Cancel this order?"
        message="Please select the reason for cancellation. Once cancelled, reserved stock will be released."
        confirmText="Yes, cancel order"
      >
        <div className="flex flex-col gap-3" style={{ marginTop: 12, textAlign: 'left' }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Reason for cancellation *</label>
            <select
              className="select select-sm w-full"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={cancelling}
              style={{ width: '100%', borderRadius: 8 }}
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other' ? (
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Explanation (Required) *</label>
              <textarea
                className="textarea w-full"
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                disabled={cancelling}
                placeholder="Please describe why you wish to cancel this order..."
                style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                required
              />
            </div>
          ) : (
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>Additional Note (Optional)</label>
              <textarea
                className="textarea w-full"
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                disabled={cancelling}
                placeholder="Optional details or feedback..."
                style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
              />
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}
