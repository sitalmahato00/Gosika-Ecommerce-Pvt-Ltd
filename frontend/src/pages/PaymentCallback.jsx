import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle, ShoppingBag, RotateCw, Info } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
import { errorMessage } from '../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../utils/constants'
import { useCart } from '../context/CartContext'

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [failed, setFailed] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const { fetchCart } = useCart()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return

    // Extract search query from searchParams or direct window location
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '')

    const foundOrderId = searchParams.get('order_id') || urlParams.get('order_id') || hashParams.get('order_id')
    if (foundOrderId) {
      setOrderId(foundOrderId)
    }

    const data = searchParams.get('data') || urlParams.get('data') || hashParams.get('data') ||
      searchParams.get('result') || urlParams.get('result') || hashParams.get('result') ||
      searchParams.get('response') || urlParams.get('response')

    const statusParam = (searchParams.get('status') || urlParams.get('status') || hashParams.get('status') || '').toLowerCase()
    const qParam = (searchParams.get('q') || urlParams.get('q') || hashParams.get('q') || '').toLowerCase()

    if (statusParam === 'failure' || statusParam === 'canceled' || statusParam === 'cancelled' || qParam === 'fu') {
      done.current = true
      setFailed(true)
      setIsCancelled(true)
      setError('Payment was cancelled or could not be completed on eSewa. Your order is safely saved in your account and can be paid anytime.')
      return
    }

    if (!data) {
      done.current = true
      setFailed(true)
      setError('No payment confirmation data was received from eSewa. If you were charged, please check your orders page.')
      return
    }

    done.current = true

    api
      .post('/payments/esewa/callback', { data })
      .then((res) => {
        const payment = res.data.data
        if (typeof fetchCart === 'function') {
          fetchCart()
        }
        navigate('/order-success', {
          state: { orderId: payment?.order_id || foundOrderId, esewa: true },
          replace: true,
        })
      })
      .catch((err) => {
        setFailed(true)
        setError(errorMessage(err) || 'Could not verify payment with eSewa.')
      })
  }, [searchParams, navigate, fetchCart])

  const retryPayment = async () => {
    if (!orderId) {
      navigate('/orders')
      return
    }
    setRetrying(true)
    try {
      const payRes = await api.post('/payments/initiate', {
        order_id: orderId,
        method: 'esewa',
        success_url: `${window.location.origin}/payments/esewa/callback?order_id=${orderId}`,
        failure_url: `${window.location.origin}/payments/esewa/callback?status=failure&order_id=${orderId}`,
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
        formEl.submit()
        return
      }
      navigate(`/orders/${orderId}`)
    } catch {
      navigate(`/orders/${orderId}`)
    } finally {
      setRetrying(false)
    }
  }

  if (!failed) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 44, width: 'auto', marginBottom: 16, objectFit: 'contain' }} />
          <Loader2 size={42} className="spin" color="var(--primary)" style={{ margin: '16px auto' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>Verifying your eSewa payment…</h1>
          <p className="muted text-sm" style={{ marginTop: 6 }}>Please wait while we confirm your payment transaction with eSewa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ textAlign: 'center', padding: '44px 24px' }}>
        <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 40, width: 'auto', marginBottom: 16, objectFit: 'contain' }} />
        
        <span
          className="avatar"
          style={{
            width: 72,
            height: 72,
            background: isCancelled ? 'var(--warning-bg, #fffbeb)' : 'var(--danger-bg, #fef2f2)',
            color: isCancelled ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)',
            marginBottom: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
        >
          {isCancelled ? <AlertCircle size={36} /> : <XCircle size={36} />}
        </span>

        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          {isCancelled ? 'eSewa Payment Cancelled' : 'Payment could not be verified'}
        </h1>
        
        <p className="muted" style={{ maxWidth: 460, margin: '10px auto 20px', lineHeight: 1.5, fontSize: 14 }}>
          {error || 'We could not confirm your eSewa payment. Your order is preserved and remains pending payment.'}
        </p>

        {orderId && (
          <div style={{ marginBottom: 20 }}>
            <Button variant="primary" size="md" onClick={retryPayment} disabled={retrying}>
              <RotateCw size={15} className={retrying ? 'spin' : ''} /> {retrying ? 'Connecting to eSewa…' : 'Try Payment Again'}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 wrap" style={{ marginTop: 12 }}>
          {orderId ? (
            <Link to={`/orders/${orderId}`}>
              <Button variant="outline" size="md">
                View Order Details
              </Button>
            </Link>
          ) : (
            <Link to="/orders">
              <Button variant="primary" size="md">
                <ShoppingBag size={16} /> View My Orders
              </Button>
            </Link>
          )}
          <Link to="/shop">
            <Button variant="outline" size="md">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="alert alert-info" style={{ marginTop: 24, textAlign: 'left', fontSize: 12 }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>eSewa Test Sandbox Credentials:</strong>
            <div style={{ marginTop: 3 }}>
              <span>eSewa ID: <code>9711111111</code></span> &bull; <span>Password: <code>Nepal@123</code></span> &bull; <span>MPIN: <code>1122</code></span> &bull; <span>Token: <code>123456</code></span>
            </div>
          </div>
        </div>

        <div className="muted text-xs" style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CheckCircle2 size={13} color="var(--success)" />
          <span>If your account was debited, it will be automatically confirmed upon verification.</span>
        </div>
      </div>
    </div>
  )
}
