import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import api from '../../api/client'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, humanizeEnum, errorMessage } from '../../utils/format'
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/constants'

export default function AccountPayments() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/orders', { params: { per_page: 20 } })
      .then((r) => setOrders(r.data?.data?.data || []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="card">
      <h2 style={{ fontSize: 17 }}>Payment History</h2>
      <p className="muted text-sm">A summary of payments across your orders.</p>
      {loading ? (
        <div className="flex flex-col gap-2"><Skeleton height={50} /><Skeleton height={50} /></div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={load} />
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
                  <td><Link to={`/orders/${o.id}`} className="font-medium">#{o.order_number}</Link></td>
                  <td>{formatDateTime(o.placed_at)}</td>
                  <td>{PAYMENT_METHOD_LABELS[o.payment_method] || humanizeEnum(o.payment_method) || '—'}</td>
                  <td>{PAYMENT_STATUS_LABELS[o.payment_status] || humanizeEnum(o.payment_status) || '—'}</td>
                  <td className="font-semibold">{money(o.grand_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={CreditCard} title="No payments yet" message="Your payment history will appear here after your first order." />
      )}
    </div>
  )
}
