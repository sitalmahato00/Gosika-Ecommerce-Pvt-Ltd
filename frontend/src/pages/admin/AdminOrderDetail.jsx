import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, ArrowLeft, Store, Truck, CreditCard,
  User, MapPin, Phone, Mail, Clock, Calendar, CheckCircle2,
  XCircle, AlertTriangle, RotateCcw, Package, DollarSign,
  Download, Printer
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import Timeline from '../../components/admin/Timeline'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/admin/ErrorState'
import { money, formatDate, formatDateTime, getProductImage, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'cancel' | 'refund'
    loading: false
  })

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/admin/orders/${id}`)
      setOrder(res.data?.data || null)
    } catch (err) {
      setError('Order record could not be retrieved.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleConfirmAction = async (reason) => {
    const { action } = dialogState
    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = order.uuid || order.id

    try {
      if (action === 'cancel') {
        await api.post(`/admin/orders/${targetId}/cancel`, { reason })
        toast.success(`Order #${order.order_number || order.id} has been cancelled.`)
      }

      setDialogState({ isOpen: false, action: null, loading: false })
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={40} width={240} />
        <Skeleton height={140} style={{ borderRadius: 14 }} />
        <Skeleton height={320} style={{ borderRadius: 14 }} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <ErrorState
        title="Order Not Found"
        message={error || 'The requested order details could not be found.'}
        onRetry={loadOrder}
      />
    )
  }

  const customerName = order.user?.name || order.user?.first_name ? `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim() : (order.customer?.full_name || 'Customer')
  const customerEmail = order.user?.email || order.customer?.email || '—'
  const customerPhone = order.user?.phone || order.customer?.phone || '—'
  const address = order.shipping_address_snapshot || order.shippingAddress || {}
  const vendorOrders = Array.isArray(order.vendor_orders || order.vendorOrders) ? (order.vendor_orders || order.vendorOrders) : []
  const payments = Array.isArray(order.payments) ? order.payments : []
  const isCancellable = order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed'

  // Build timeline events
  const timelineEvents = [
    {
      title: 'Order Placed',
      description: `Order #${order.order_number || order.id} created by customer.`,
      status: 'pending',
      created_at: order.created_at || order.placed_at
    }
  ]

  if (order.status_history && Array.isArray(order.status_history)) {
    order.status_history.forEach(h => {
      timelineEvents.push({
        title: `Status: ${h.to_status}`,
        description: h.reason || `Transitioned from ${h.from_status || 'previous'} to ${h.to_status}`,
        status: h.to_status,
        created_at: h.created_at
      })
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={`Order #${order.order_number || order.id}`}
        description={`Placed on ${formatDateTime(order.created_at || order.placed_at)} · Grand Total: ${money(order.grand_total || order.total || 0)}`}
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: `#${order.order_number || order.id}` }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Printer size={14} /> Print Invoice
            </button>

            {isCancellable && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => setDialogState({ isOpen: true, action: 'cancel', loading: false })}
              >
                <XCircle size={14} style={{ marginRight: 4 }} /> Cancel Order
              </button>
            )}
          </div>
        }
      />

      {/* Top Banner Status Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#eff6ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>
                Order #{order.order_number || order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Payment Status: <strong>{order.payment_status?.toUpperCase() || 'PENDING'}</strong> via <strong>{order.payment_method?.toUpperCase() || 'COD'}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Grand Total
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
            {money(order.grand_total || order.total || 0)}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: 20 }} id="admin-order-grid">
        <style>{`@media(max-width:920px){#admin-order-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Left Column: Multi-Vendor Orders Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad-none" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={17} color="var(--primary)" /> Multi-Vendor Fulfillment Packages ({vendorOrders.length || 1})
              </h3>
            </div>

            {vendorOrders.length === 0 ? (
              /* Fallback if flat items */
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{it.product_name || it.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{it.sku || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{money(it.unit_price || it.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{money((it.unit_price || it.price) * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {vendorOrders.map((vo, voIdx) => {
                  const storeName = vo.store?.name || vo.vendor?.company_name || `Vendor Package #${voIdx + 1}`
                  const items = Array.isArray(vo.items) ? vo.items : []
                  const assignment = vo.assignments && vo.assignments.length > 0 ? vo.assignments[0] : null
                  const rider = assignment?.delivery_partner || assignment?.deliveryPartner

                  return (
                    <div
                      key={vo.id || vo.uuid || voIdx}
                      style={{
                        padding: 20,
                        borderBottom: voIdx < vendorOrders.length - 1 ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      {/* Vendor Store Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                              Store: {storeName}
                            </span>
                            <StatusBadge status={vo.status} />
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                            Vendor Order #{vo.vendor_order_number || vo.id} · Commission: {vo.commission_rate ?? 10}% ({money(vo.commission_amount || 0)})
                          </div>
                        </div>

                        {/* Delivery Assignment Status */}
                        {rider && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#f8fafc', padding: '4px 10px', borderRadius: 8 }}>
                            <Truck size={14} color="#10b981" />
                            <span>Rider: <strong>{rider.name || rider.user?.name}</strong></span>
                            <StatusBadge status={assignment.status} />
                          </div>
                        )}
                      </div>

                      {/* Items Table */}
                      <div className="table-wrap" style={{ background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <table className="table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th style={{ textAlign: 'right' }}>Price</th>
                              <th style={{ textAlign: 'right' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, itIdx) => (
                              <tr key={it.id || itIdx}>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                                    {it.product_name || it.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                                    SKU: {it.sku || '—'}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>{money(it.unit_price || it.price)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800 }}>{money(it.line_total || (it.unit_price * it.quantity))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Financial Totals Summary */}
            <div style={{ padding: '16px 20px', background: '#fafbfc', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320, marginLeft: 'auto', fontSize: 13 }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{money(order.subtotal || order.grand_total || 0)}</span>
                </div>
                {order.delivery_charge > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Shipping Fee:</span>
                    <span style={{ fontWeight: 600 }}>{money(order.delivery_charge)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between" style={{ color: '#16a34a' }}>
                    <span>Coupon Discount:</span>
                    <span style={{ fontWeight: 700 }}>- {money(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)', fontSize: 15 }}>
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Grand Total:</span>
                  <span style={{ fontWeight: 900, color: '#16a34a' }}>{money(order.grand_total || order.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="var(--primary)" /> Order Event & Audit Timeline
            </h3>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Right Column: Customer & Delivery Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Profile Card */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={16} color="var(--primary)" /> Customer Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{customerName}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>User ID: #{order.user_id || 'Guest'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                <Mail size={14} color="#94a3b8" />
                <span>{customerEmail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                <Phone size={14} color="#94a3b8" />
                <span>{customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#e11d48" /> Shipping Address
            </h3>

            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                {address.recipient_name || address.full_name || customerName}
              </div>
              <div>{address.address_line_1 || address.address_line1 || address.address || 'Address details on file'}</div>
              {address.address_line_2 && <div>{address.address_line_2}</div>}
              <div>
                {address.city || address.municipality || ''} {address.district ? `· ${address.district}` : ''} {address.province ? `· Province ${address.province}` : ''}
              </div>
              {address.phone && (
                <div style={{ marginTop: 4, fontWeight: 600 }}>Phone: {address.phone}</div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} color="var(--primary)" /> Payment Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Method:</span>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{order.payment_method?.toUpperCase() || 'COD'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Payment Status:</span>
                <StatusBadge status={order.payment_status || 'pending'} />
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--muted)' }}>Currency:</span>
                <span style={{ fontWeight: 600 }}>NPR (Rs.)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={`Cancel Order #${order.order_number || order.id}?`}
        message="Cancelling this order will update all vendor packages and notify the customer."
        variant="danger"
        confirmText="Cancel Order"
        requireReason={true}
        reasonPlaceholder="State the administrative reason for cancelling this order..."
      />
    </div>
  )
}
