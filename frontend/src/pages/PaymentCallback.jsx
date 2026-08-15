import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '../api/client'
import Button from '../components/ui/Button'
import { errorMessage } from '../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../utils/constants'

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    const data = searchParams.get('data') || searchParams.get('result')
    if (!data) {
      setFailed(true)
      setError('No payment data received from eSewa.')
      return
    }
    done.current = true
    api
      .post('/payments/esewa/callback', { data })
      .then((res) => {
        const payment = res.data.data
        navigate('/order-success', {
          state: { orderId: payment?.order_id, esewa: true },
          replace: true,
        })
      })
      .catch((err) => {
        setFailed(true)
        setError(errorMessage(err))
      })
  }, [searchParams, navigate])

  if (!failed) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 40, width: 'auto', marginBottom: 16 }} />
          <Loader2 size={40} className="spin" color="var(--primary)" />
          <h1 style={{ fontSize: 20, marginTop: 16 }}>Verifying your eSewa payment…</h1>
          <p className="muted text-sm">Please wait while we confirm your payment with eSewa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 40, width: 'auto', marginBottom: 16 }} />
        <span className="avatar" style={{ width: 72, height: 72, background: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: 16 }}>
          <XCircle size={36} />
        </span>
        <h1 style={{ fontSize: 22 }}>Payment could not be verified</h1>
        <p className="muted">{error || 'We could not confirm your eSewa payment. Your order is still pending payment.'}</p>
        <div className="flex items-center justify-center gap-2 wrap" style={{ marginTop: 20 }}>
          <Link to="/orders">
            <Button variant="primary">View my orders</Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline">Continue shopping</Button>
          </Link>
        </div>
        <div className="muted text-xs" style={{ marginTop: 16 }}>
          <CheckCircle2 size={12} /> If the payment was deducted, it will be verified automatically and your order will be confirmed.
        </div>
      </div>
    </div>
  )
}
