import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import api from '../api/client'
import ErrorState from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { money, formatDate, errorMessage } from '../utils/format'
import { PAYMENT_METHOD_LABELS, PAYMENT_BRAND_LOGOS } from '../utils/constants'

export default function OrderSuccess() {
  const { state } = useLocation()
  const [order, setOrder] = useState(state?.order || null)
  const [loading, setLoading] = useState(!state?.order && !!state?.orderId)
  const [error, setError] = useState(null)
  const orderId = state?.orderId || order?.id
  const onlinePayment = state?.khalti || state?.esewa
  const isConfirmed = order?.status === 'confirmed' || order?.status === 'processing' || order?.payment_status === 'paid'

  const load = () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    api
      .get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data.data))
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!order && orderId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (loading) {
    return (
      <div className="page-shell container container-narrow">
        <Skeleton height={220} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell container">
        <ErrorState message={errorMessage(error, 'Could not load your order.')} onRetry={load} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page-shell container">
        <p className="muted">No order to show here.</p>
        <Link to="/shop" className="btn btn-primary">Go shopping</Link>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <span className="avatar" style={{ width: 72, height: 72, background: 'var(--success-bg)', color: 'var(--success)', marginBottom: 16 }}>
          <CheckCircle2 size={36} />
        </span>
        <h1 style={{ fontSize: 24 }}>Order Placed Successfully!</h1>
        <p className="muted">
          Thank you for shopping on Gosika. Your order <strong className="text-primary">#{order.order_number || order.id}</strong> has been placed.
          {order.payment_method === 'cod' && ' Pay cash on delivery when your order arrives.'}
        </p>
        {onlinePayment && !isConfirmed && (
          <div className="alert alert-warning" style={{ textAlign: 'left' }}>
            <Clock size={18} />
            <div>
              <strong>Complete your {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} payment</strong>
              <br />
              We redirected you to {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} to complete the payment. Your
              order will be confirmed once the payment is verified. You can also check payment status on your order page.
            </div>
          </div>
        )}
        <div className="card" style={{ background: 'var(--bg)', maxWidth: 360, margin: '20px auto' }}>
          <div className="flex justify-between text-sm"><span className="muted">Total paid</span><span className="font-bold">{money(order.grand_total)}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="muted">Payment</span><span className="font-medium flex items-center gap-1">{order.payment_method === 'esewa' && <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 16, width: 'auto' }} />}{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</span></div>
          {(order.estimated_delivery || order.delivery_eta) && (
            <div className="flex justify-between text-sm mt-1"><span className="muted">Estimated delivery</span><span className="font-medium">{formatDate(order.estimated_delivery || order.delivery_eta)}</span></div>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 wrap">
          <Link to={`/orders/${order.id}`} className="btn btn-primary">Track your order</Link>
          <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
