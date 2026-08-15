import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import { money } from '../utils/format'

export default function OrderSuccess() {
  const { state } = useLocation()
  const order = state?.order
  const khalti = state?.khalti

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
        {khalti && (
          <div className="alert alert-warning" style={{ textAlign: 'left' }}>
            <Clock size={18} />
            <div>
              <strong>Complete your Khalti payment</strong>
              <br />
              We opened a Khalti payment window. Your order will be confirmed once the payment is verified. You can also
              check payment status on your order page.
            </div>
          </div>
        )}
        <div className="card" style={{ background: 'var(--bg)', maxWidth: 360, margin: '20px auto' }}>
          <div className="flex justify-between text-sm"><span className="muted">Total paid</span><span className="font-bold">{money(order.grand_total)}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="muted">Payment</span><span className="font-medium">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Khalti'}</span></div>
        </div>
        <div className="flex items-center justify-center gap-2 wrap">
          <Link to={`/orders/${order.id}`} className="btn btn-primary">Track your order</Link>
          <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  )
}
