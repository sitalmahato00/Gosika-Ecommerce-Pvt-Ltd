import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, MapPin, Truck, ShieldCheck, Phone } from 'lucide-react'
import api from '../api/client'
import StatusBadge from '../components/commerce/StatusBadge'
import ErrorState from '../components/ui/ErrorState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { money, formatDateTime, apiImage, errorMessage } from '../utils/format'
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_BRAND_LOGOS } from '../utils/constants'
import { useToast } from '../context/ToastContext'

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tracking, setTracking] = useState([])
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

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

  const cancelOrder = async () => {
    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason || undefined })
      toast.success('Order cancelled')
      setCancelOpen(false)
      setCancelReason('')
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
          success_url: `${window.location.origin}/payments/esewa/callback?order_id=${order.id}`,
          failure_url: `${window.location.origin}/payments/esewa/callback?status=failure&order_id=${order.id}`,
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
        <Link to="/orders">My Orders</Link> <ChevronRight size={13} />
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
            {order.can_cancel && (
              <Button variant="danger-outline" size="sm" onClick={() => setCancelOpen(true)}>Cancel order</Button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          #order-detail-layout { grid-template-columns: 1fr 340px !important; }
        }
      `}</style>
      <div id="order-detail-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, alignItems: 'start' }}>
        <div className="flex flex-col gap-4">
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
                      src={apiImage(it.image, it.product_name || it.name)}
                      alt=""
                      className="thumb-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = getProductImage(it) }}
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
        message="Once cancelled, this order cannot be restored. Any pending payments will be refunded."
        confirmText="Yes, cancel order"
      >
        <textarea
          className="textarea"
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          disabled={cancelling}
          placeholder="Optional: tell us why you are cancelling this order (e.g. changed my mind, wrong address, duplicate order)"
          style={{ marginTop: 10 }}
        />
      </ConfirmDialog>
    </div>
  )
}
