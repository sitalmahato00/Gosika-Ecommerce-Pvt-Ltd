import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import api from '../../api/client'
import { money, formatDateTime, humanizeEnum, errorMessage } from '../../utils/format'
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_BRAND_LOGOS } from '../../utils/constants'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountPayments() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/orders', { params: { per_page: 20 } })
      .then((r) => setOrders(Array.isArray(r.data?.data?.data) ? r.data.data.data : []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <AccountPage title="Payment History" subtitle="A summary of payments across your orders.">
      {loading ? (
        <AccountSkeleton rows={2} height={52} asCards={false} />
      ) : error ? (
        <AccountError message={errorMessage(error)} onRetry={load} />
      ) : orders.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Method</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/account/orders/${o.id}`} className="font-medium">#{o.order_number}</Link></td>
                  <td>{formatDateTime(o.placed_at)}</td>
                  <td className="flex items-center gap-1">{o.payment_method === 'esewa' && <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 13, width: 'auto' }} />}{PAYMENT_METHOD_LABELS[o.payment_method] || humanizeEnum(o.payment_method) || '—'}</td>
                  <td>{PAYMENT_STATUS_LABELS[o.payment_status] || humanizeEnum(o.payment_status) || '—'}</td>
                  <td className="font-semibold">{money(o.grand_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <AccountEmpty icon={CreditCard} title="No payments yet" message="Your payment history will appear here after your first order." />
      )}
    </AccountPage>
  )
}