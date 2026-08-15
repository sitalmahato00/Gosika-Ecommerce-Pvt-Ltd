import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, Check, X, PackageCheck, MapPin, Phone, Truck } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, apiImage, errorMessage, getProductImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function VendorOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    api.get(`/vendor/orders/${id}`).then((r) => setOrder(r.data.data)).catch((e) => setError(e)).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const act = async (path, successMsg) => {
    setBusy(true)
    try {
      await api.post(`/vendor/orders/${id}/${path}`)
      toast.success(successMsg)
      setRejectOpen(false)
      load()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton height={80} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (error || !order) {
    return <ErrorState message={errorMessage(error, 'Order not found.')} onRetry={load} />
  }

  const customer = order.order?.user
  const addr = order.order?.shipping_address || order.shipping_address

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1 muted text-sm" aria-label="Breadcrumb">
        <Link to="/vendor/orders">Orders</Link> <ChevronRight size={13} />
        <span className="font-semibold" style={{ color: 'var(--ink)' }}>{order.vendor_order_number}</span>
      </nav>

      <div className="card">
        <div className="flex items-center justify-between wrap gap-2">
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>{order.vendor_order_number}</h2>
            <div className="muted text-sm">Placed {formatDateTime(order.created_at)} · {order.store_name}</div>
          </div>
          <div className="flex items-center gap-2 wrap">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.delivery_status} />
            {order.status === 'pending' && (
              <>
                <Button variant="success" size="sm" icon={Check} disabled={busy} onClick={() => act('accept', 'Order accepted')}>Accept</Button>
                <Button variant="danger-outline" size="sm" icon={X} disabled={busy} onClick={() => setRejectOpen(true)}>Reject</Button>
              </>
            )}
            {order.status === 'accepted' && (
              <Button variant="primary" size="sm" icon={PackageCheck} disabled={busy} onClick={() => act('ready-for-pickup', 'Marked ready for pickup')}>
                Ready for pickup
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }} className="mb-2">Items</h3>
          <div className="flex flex-col">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="thumb" style={{ width: 44, height: 44 }}>
                  <img
                    src={it.image ? apiImage(it.image) : getProductImage(it)}
                    alt=""
                    className="thumb-img"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{it.product_name}</div>
                  {it.variant_name && <div className="muted text-xs">{it.variant_name}</div>}
                  <div className="muted text-xs">× {it.quantity} · {money(it.unit_price)}</div>
                </div>
                <div className="font-semibold text-sm">{money(it.line_total)}</div>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div className="flex flex-col gap-1 text-sm" style={{ maxWidth: 360 }}>
            <div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(order.items_subtotal)}</span></div>
            <div className="flex justify-between"><span className="muted">Delivery</span><span>{Number(order.delivery_charge) > 0 ? money(order.delivery_charge) : 'Free'}</span></div>
            {Number(order.tax) > 0 && <div className="flex justify-between"><span className="muted">Tax</span><span>{money(order.tax)}</span></div>}
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span className="font-bold">Grand total</span><span className="price-current">{money(order.grand_total)}</span>
            </div>
            <div className="flex justify-between mt-1"><span className="muted">Commission ({order.commission_rate}%)</span><span className="text-danger">-{money(order.commission_amount)}</span></div>
            <div className="flex justify-between"><span className="muted font-semibold">You receive</span><span className="font-bold text-success">{money(order.vendor_payable)}</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><MapPin size={16} color="var(--primary)" /> Delivery address</h3>
            <div className="text-sm">
              <div className="font-semibold">{addr?.name}</div>
              <div className="muted">{addr?.street}, {addr?.municipality}, {addr?.district}, {addr?.province}</div>
              <div className="muted flex items-center gap-1 mt-1"><Phone size={12} /> {addr?.phone}</div>
            </div>
          </div>

          {order.assignments?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><Truck size={16} color="var(--primary)" /> Delivery</h3>
              {order.assignments.map((a) => (
                <div key={a.id} className="text-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.delivery_partner_name || 'Delivery partner'}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="muted text-xs">Fee: {money(a.delivery_fee)} · COD: {money(a.cod_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={() => act('reject', 'Order rejected')}
        danger
        loading={busy}
        title="Reject this order?"
        confirmText="Reject order"
        message="Let us know why you're rejecting this order so we can inform the customer."
      >
        <div className="mt-2">
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Out of stock, unable to fulfil…" />
        </div>
      </ConfirmDialog>
    </div>
  )
}
