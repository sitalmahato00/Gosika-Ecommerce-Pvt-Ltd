import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Undo2, Check, Trash, Clock, Eye, Edit, XCircle } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function CustomerReturns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [returnId, setReturnId] = useState(null)

  useEffect(() => {
    api.get('/customer/returns').then((res) => {
      setReturns(res.data.data?.returns || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  const handleRefund = async (id) => {
    await api.post(`/customer/returns/${id}/refund`)
    toast.success('Refund processed successfully')
    setOpen(false)
    setReturnId(null)
    setReturns((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!returns.length) {
    return (
      <div className="p-8 text-center">
        <div className="es-icon"><ReturnLeft size={48} /></div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Returns</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>You haven't requested any returns.</p>
        <button className="btn btn-primary">Request a Return</button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>My Returns</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(returns && returns.map((r) => (
            <div key={r.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 16 }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={r.product_cover || '/placeholder-product.jpg'}
                  alt={r.product_name}
                  className="w-16 h-16 object-cover rounded-sm"
                />
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 2 }}>{r.product_name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>× {r.quantity}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Order #{r.order_id}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Rs. {r.total}</span>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Reason: {r.reason}</span>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Status: {r.status}</span>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Requested: {formatDate(r.created_at)}</span>
              </div>
              {r.status !== 'refunded' && r.status !== 'rejected' && (
                <button className="btn btn-danger btn-sm mt-2 w-full">Cancel Return</button>
              )}
            </div>
          ))}
        ]}

        <div style={{ marginTop: 24 }}>
          <button className="btn btn-primary w-full mt-4" onClick={() => setOpen(true)}>Request New Return</button>
        </div>
      </div>
    </div>
  )
}