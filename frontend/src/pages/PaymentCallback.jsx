import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertCircle, ShoppingBag, RotateCw, Info } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
import { errorMessage } from '../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../utils/constants'
import { useCart } from '../context/CartContext'

const MAX_POLL_ATTEMPTS = 10
const POLL_INTERVAL_MS = 3000

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [failed, setFailed] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollAttempts, setPollAttempts] = useState(0)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const { fetchCart } = useCart()
  const done = useRef(false)
  const pollTimer = useRef(null)

  const goToSuccess = useCallback((oid, payment) => {
    if (typeof fetchCart === 'function') fetchCart()
    navigate('/order-success', {
      state: { orderId: payment?.order_id || oid, esewa: true },
      replace: true,
    })
  }, [fetchCart, navigate])

  const pollVerification = useCallback(async (oid) => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      setPollAttempts(i + 1)
      try {
        const res = await api.post('/payments/esewa/verify-by-order', { order_id: oid })
        if (res.data?.success) {
          goToSuccess(oid, res.data.data?.payment)
          return
        }
      } catch {
        // Payment not yet verified, continue polling
      }
      await new Promise(r => { pollTimer.current = setTimeout(r, POLL_INTERVAL_MS) })
    }
    setPolling(false)
    setFailed(true)
    setError('eSewa payment could not be verified after multiple attempts. Your order is saved — you can retry payment from your orders page.')
  }, [goToSuccess])

  useEffect(() => {
    if (done.current) return

    const data = searchParams.get('data') || searchParams.get('result') || searchParams.get('response')
    const statusParam = (searchParams.get('status') || '').toLowerCase()

    if (statusParam === 'failure' || statusParam === 'canceled' || statusParam === 'cancelled') {
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
          state: { orderId: payment?.order_id, esewa: true },
          replace: true,
        })
      })
      .catch((err) => {
        setFailed(true)
        setError(errorMessage(err) || 'Could not verify payment with eSewa.')
      })
  }, [searchParams, navigate, fetchCart, pollVerification])

  useEffect(() => {
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current) }
  }, [])

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

  if (!failed && !polling) {
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

  if (polling) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 44, width: 'auto', marginBottom: 16, objectFit: 'contain' }} />
          <Loader2 size={42} className="spin" color="var(--primary)" style={{ margin: '16px auto' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>Checking payment status…</h1>
          <p className="muted text-sm" style={{ marginTop: 6 }}>
            eSewa did not send a confirmation. We are checking your payment status directly (attempt {pollAttempts}/{MAX_POLL_ATTEMPTS}).
          </p>
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
          <span style={{ flexShrink: 0, display: 'inline-flex' }}><Info size={16} /></span>
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
