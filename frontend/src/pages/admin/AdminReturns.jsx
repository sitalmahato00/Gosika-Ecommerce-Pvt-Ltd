import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Check, X, Eye, RefreshCw,
  ShoppingBag, Store, User, AlertCircle, Truck
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { money, formatDateTime, timeAgo, apiImage, getProductImage, handleImgError } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const maxRefundAmount = item => {
  const purchasedQuantity = Math.max(1, Number(item?.order_item?.quantity || 1))
  const returnedQuantity = Math.max(1, Number(item?.quantity || 1))
  return (Number(item?.order_item?.line_total || 0) / purchasedQuantity) * returnedQuantity
}

const getReturnType = item => {
  if (item?.request_type === 'exchange' || String(item?.review_notes || '').trim().toLowerCase().startsWith('approved as exchange:')) return 'exchange'
  if (item?.request_type === 'replacement') return 'replacement'
  if (['refund_pending', 'refunded'].includes(item?.status) || item?.refunds?.length || item?.request_type === 'return_refund') return 'refund'
  return item?.request_type ? item.request_type.replace('_', ' ') : 'return'
}

const getStatusLabel = status => ({
  refund_pending: 'Refund Processing',
  under_review: 'Under Review',
})[status] || String(status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())

const getDeliveryAssignment = item => {
  const assignments = item?.vendor_order?.assignments || []
  return assignments.find(assignment => assignment.delivered_at) || assignments[0] || null
}

export default function AdminReturns() {
  const toast = useToast()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })
  const [detailItem, setDetailItem] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'process_refund'
    returnItem: null,
    loading: false
  })

  const [refundDraft, setRefundDraft] = useState({ method: 'esewa', amount: '', notes: '' })

  const loadReturns = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (search.trim()) params.search = search.trim()
      if (appliedDates.from) params.date_from = appliedDates.from
      if (appliedDates.to) params.date_to = appliedDates.to

      const res = await api.get('/admin/orders/returns', { params })
      const data = api.unwrapList(res.data)
      setReturns(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load return requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReturns()
  }, [page, statusFilter, search, appliedDates])

  const handleAction = (action, item) => {
    setDialogState({
      isOpen: true,
      action,
      returnItem: item,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, returnItem } = dialogState
    if (!returnItem) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = returnItem.uuid || returnItem.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/orders/returns/${targetId}/approve`, { notes: reason || 'Approved by admin' })
        toast.success(`Return #${returnItem.return_number || returnItem.id} approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/orders/returns/${targetId}/reject`, { reason })
        toast.success(`Return #${returnItem.return_number || returnItem.id} rejected.`)
      }

      setDialogState({ isOpen: false, action: null, returnItem: null, loading: false })
      loadReturns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleStatusChange = async (item, status, notes) => {
    try {
      await api.patch(`/admin/orders/returns/${item.uuid || item.id}/status`, {
        status,
        notes: notes || null
      })
      toast.success(`Return #${item.return_number || item.id} marked as ${status.replace(/_/g, ' ')}.`)
      loadReturns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update return status.')
    }
  }

  const acceptExchange = (item) => handleStatusChange(
    item,
    'approved',
    'Approved as exchange: replacement package to be dispatched by the store.'
  )

  const openRefundDialog = (item) => {
    setRefundDraft({
      method: item.order?.payment_method || 'esewa',
      amount: item.refund_amount || '',
      notes: ''
    })
    setDialogState({ isOpen: true, action: 'process_refund', returnItem: item, loading: false })
  }

  const submitRefund = async () => {
    const { returnItem } = dialogState
    if (!returnItem) return

    setDialogState(prev => ({ ...prev, loading: true }))
    try {
      await api.post(`/admin/orders/returns/${returnItem.uuid || returnItem.id}/refund`, {
        method: refundDraft.method,
        amount: refundDraft.amount,
        notes: refundDraft.notes || null
      })
      toast.success('Refund created (Requested). Complete it in Refunds Management.')
      setDialogState({ isOpen: false, action: null, returnItem: null, loading: false })
      loadReturns()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund creation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const columns = [
    {
      header: 'Return #',
      render: item => (
        <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
          #{item.return_number || item.id}
        </span>
      )
    },
    {
      header: 'Order Ref',
      render: item => (
        <Link
          to={`/admin/orders/${item.order?.uuid || item.order?.id || item.order_id}`}
          style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
        >
          #{item.order?.order_number || item.order_id}
        </Link>
      )
    },
    {
      header: 'Customer',
      accessor: item => item.user?.name || item.user?.email || 'Customer',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
            {item.user?.name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 'Customer'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {item.user?.email || ''}
          </div>
        </div>
      )
    },
    {
      header: 'Product / Store',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={item.order_item?.image || item.orderItem?.image || item.order_item?.product?.primary_image?.file_path || item.orderItem?.product?.primary_image?.file_path
              ? apiImage(item.order_item?.image || item.orderItem?.image || item.order_item?.product?.primary_image?.file_path || item.orderItem?.product?.primary_image?.file_path)
              : getProductImage(null)}
            alt={item.order_item?.product_name || item.orderItem?.product_name || 'Product'}
            onError={handleImgError}
            style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>
              {item.order_item?.product_name || item.orderItem?.product_name || 'Product'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Store: {item.store?.name || '—'} · Qty: {item.quantity || 1}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Reason',
      render: item => (
        <div style={{ maxWidth: 220 }}>
          <span className="chip chip-sm" style={{ background: '#f8fafc', fontWeight: 600, fontSize: 11, marginBottom: 2 }}>
            {item.reason_type ? item.reason_type.replace('_', ' ').toUpperCase() : 'RETURN'}
          </span>
          {item.reason && (
            <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.3 }} className="truncate">
              {item.reason}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Refund Amount',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#dc2626', fontSize: 13.5 }}>
          {money(item.refund_amount || 0)}
        </span>
      )
    },
    {
      header: 'Status',
      render: item => {
        const type = getReturnType(item)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
            <span className="chip chip-sm">{getStatusLabel(item.status)}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{type}</span>
            {item.pickup_collected_at && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>
                Pickup collected {formatDateTime(item.pickup_collected_at)}
              </span>
            )}
          </div>
        )
      }
    },
    {
      header: 'Requested',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isPending = item.status === 'requested' || item.status === 'under_review'
        const canRefund = getReturnType(item) !== 'exchange' && ['collected', 'inspected'].includes(item.status)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setDetailItem(item)}
              title="View full order and delivery details"
            >
              <Eye size={13} /> Details
            </button>
            {isPending ? (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve return"
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#2563eb', borderColor: '#bfdbfe' }}
                  onClick={() => acceptExchange(item)}
                  title="Accept as Exchange"
                >
                  <RotateCcw size={13} /> Exchange
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                  title="Reject Return"
                >
                  <X size={13} /> Reject
                </button>
              </>
            ) : canRefund ? (
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: '#ff5500', color: '#fff', border: 'none' }}
                onClick={() => openRefundDialog(item)}
                title="Create a refund against the linked payment"
              >
                <RotateCcw size={13} /> Process Refund
              </button>
            ) : item.status === 'refund_pending' ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>Refund Processing</span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{getStatusLabel(item.status)}</span>
            )}
          </div>
        )
      }
    }
  ]

  const detailOrder = detailItem?.order
  const detailAssignment = getDeliveryAssignment(detailItem)
  const deliveryUser = detailAssignment?.delivery_partner
  const deliveryUserName = deliveryUser?.name
    || deliveryUser?.user?.name
    || [deliveryUser?.user?.first_name, deliveryUser?.user?.last_name].filter(Boolean).join(' ')
    || 'Not assigned'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Returns & Exchanges"
        description="Approve or reject customer requests, process refunds, and track pickup and refund completion."
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: 'Returns & Exchanges' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadReturns}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(value) => { setPage(1); setSearch(value) }}
        debounceMs={300}
        searchPlaceholder="Search return, order, customer, or store..."
        statusFilter={statusFilter}
        onStatusChange={(value) => { setPage(1); setStatusFilter(value) }}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={() => {
          setPage(1)
          setAppliedDates({ from: fromDate, to: toDate })
        }}
        statusOptions={[
          { value: 'requested', label: 'Requested' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'collected', label: 'Collected' },
          { value: 'inspected', label: 'Inspected' },
          { value: 'refund_pending', label: 'Refund Pending' },
          { value: 'refunded', label: 'Refunded' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('all')
          setFromDate('')
          setToDate('')
          setAppliedDates({ from: '', to: '' })
          setPage(1)
        }}
      />

      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No return requests"
        emptyDescription="There are no customer return or exchange requests matching your filter."
      />

      {detailItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Return and order details"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={event => { if (event.target === event.currentTarget) setDetailItem(null) }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--ink)' }}>
                  Return #{detailItem.return_number || detailItem.id}
                </h2>
                <div className="muted text-sm mt-1">
                  Order {detailOrder?.order_number || detailItem.order_id} · {getReturnType(detailItem)} · {getStatusLabel(detailItem.status)}
                </div>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDetailItem(null)} aria-label="Close details">
                <X size={15} />
              </button>
            </div>

            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold flex items-center gap-1"><User size={13} /> CUSTOMER</div>
                <div className="font-bold text-sm mt-1">{detailItem.user?.name || `${detailItem.user?.first_name || ''} ${detailItem.user?.last_name || ''}`.trim() || 'Customer'}</div>
                <div className="muted text-xs">{detailItem.user?.email || '—'}</div>
                <div className="muted text-xs">{detailItem.user?.phone || detailItem.user?.phone_number || ''}</div>
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold flex items-center gap-1"><ShoppingBag size={13} /> ORDER</div>
                <div className="font-bold text-sm mt-1">{getStatusLabel(detailOrder?.status)}</div>
                <div className="muted text-xs">Payment: {getStatusLabel(detailOrder?.payment_status)} · {detailOrder?.payment_method || '—'}</div>
                <div className="font-bold text-sm mt-1">Total {money(detailOrder?.grand_total || 0)}</div>
                <div className="muted text-xs">
                  Subtotal {money(detailOrder?.subtotal || 0)} · Discount {money(detailOrder?.discount || 0)}
                </div>
                <div className="muted text-xs">
                  Delivery {money(detailOrder?.delivery_charge || 0)} · Tax {money(detailOrder?.tax || 0)}
                </div>
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold flex items-center gap-1"><Truck size={13} /> DELIVERY</div>
                <div className="font-bold text-sm mt-1">{deliveryUserName}</div>
                <div className="muted text-xs">
                  {detailAssignment?.delivered_at
                    ? `Delivered ${formatDateTime(detailAssignment.delivered_at)}`
                    : `Status: ${getStatusLabel(detailAssignment?.status)}`}
                </div>
                {detailAssignment?.delivery_partner?.phone && (
                  <div className="muted text-xs">{detailAssignment.delivery_partner.phone}</div>
                )}
                {detailAssignment?.dropoff_address && (
                  <div className="muted text-xs mt-1">Delivered to: {detailAssignment.dropoff_address}</div>
                )}
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold flex items-center gap-1"><Store size={13} /> STORE</div>
                <div className="font-bold text-sm mt-1">{detailItem.store?.name || detailItem.vendor_order?.store?.name || '—'}</div>
                <div className="muted text-xs">Vendor order: {detailItem.vendor_order?.vendor_order_number || '—'}</div>
                <div className="muted text-xs">Delivery status: {getStatusLabel(detailItem.vendor_order?.delivery_status || detailAssignment?.status)}</div>
              </div>
            </div>

            <section className="mb-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><ShoppingBag size={14} /> Order items</h3>
              <div className="overflow-x-auto" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                <table className="table" style={{ width: '100%', minWidth: 540 }}>
                  <thead>
                    <tr>
                      <th>Product</th><th>SKU / Variant</th><th>Qty</th><th>Unit price</th><th>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailOrder?.items || []).map(orderItem => (
                      <tr key={orderItem.uuid || orderItem.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <img
                              src={orderItem.image || orderItem.product?.primary_image?.file_path
                                ? apiImage(orderItem.image || orderItem.product?.primary_image?.file_path)
                                : getProductImage(null)}
                              alt={orderItem.product_name || 'Product'}
                              onError={handleImgError}
                              style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                            />
                            <span>{orderItem.product_name || 'Product'}</span>
                          </div>
                        </td>
                        <td>{[orderItem.sku, orderItem.variant_name].filter(Boolean).join(' · ') || '—'}</td>
                        <td>{orderItem.quantity}</td>
                        <td>{money(orderItem.unit_price || 0)}</td>
                        <td>{money(orderItem.line_total || 0)}</td>
                      </tr>
                    ))}
                    {!(detailOrder?.items || []).length && (
                      <tr><td colSpan={5} className="muted">Order items are unavailable.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h3 className="font-bold text-sm mb-2">Shipping address</h3>
                {detailOrder?.shipping_address ? (
                  <>
                    <div className="text-sm">{detailOrder.shipping_address.full_name || detailOrder.shipping_address.label}</div>
                    <div className="muted text-sm">
                      {[detailOrder.shipping_address.address_line_1, detailOrder.shipping_address.address_line_2, detailOrder.shipping_address.municipality?.name, detailOrder.shipping_address.district?.name, detailOrder.shipping_address.province?.name, detailOrder.shipping_address.postal_code]
                        .filter(Boolean).join(', ')}
                    </div>
                    <div className="muted text-sm">{detailOrder.shipping_address.phone || '—'}</div>
                  </>
                ) : <div className="muted text-sm">Shipping address unavailable.</div>}
                <h3 className="font-bold text-sm mt-3 mb-2">Payments</h3>
                {(detailOrder?.payments || []).length ? detailOrder.payments.map(payment => (
                  <div key={payment.uuid || payment.id} className="flex items-center justify-between gap-2 text-xs py-1">
                    <span>{payment.payment_number || payment.method} · {getStatusLabel(payment.status)}</span>
                    <strong>{money(payment.amount || 0)}</strong>
                  </div>
                )) : <div className="muted text-xs">No payment record.</div>}
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><RotateCcw size={14} /> Return request</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <span className="chip chip-sm" style={{ color: '#9a3412', background: '#ffedd5', border: '1px solid #fdba74', fontWeight: 800 }}>
                    Reason: {String(detailItem.reason_type || '—').replace(/_/g, ' ')}
                  </span>
                  <span className="chip chip-sm" style={{ color: '#1d4ed8', background: '#dbeafe', border: '1px solid #93c5fd', fontWeight: 800 }}>
                    Quantity: {detailItem.quantity || 1}
                  </span>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <div className="text-xs font-bold" style={{ color: '#9a3412' }}>CUSTOMER EXPLANATION</div>
                  <div className="text-sm mt-1" style={{ whiteSpace: 'pre-wrap' }}>{detailItem.reason || 'No additional explanation provided.'}</div>
                </div>
                <div className="text-sm mt-2"><strong>Preferred resolution:</strong> {detailItem.preferred_resolution || '—'}</div>
                <div className="text-sm mt-1"><strong>Return method:</strong> {detailItem.return_method === 'pickup' ? 'Courier pickup' : detailItem.return_method === 'drop_off' ? 'Self drop-off' : '—'}</div>
                <div className="text-sm mt-1"><strong>Pickup:</strong> {detailItem.pickup_collected_at ? `Collected ${formatDateTime(detailItem.pickup_collected_at)}` : 'Not collected'}</div>
                {detailItem.pickup_instructions && <div className="text-sm mt-1"><strong>Pickup notes:</strong> {detailItem.pickup_instructions}</div>}
                {detailItem.review_notes && (
                  <div className="mt-2 p-2 rounded text-sm" style={{ background: '#f1f5f9', border: '1px solid var(--border)' }}>
                    <strong>Review notes:</strong> {detailItem.review_notes}
                  </div>
                )}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs font-bold uppercase mb-2">Customer photos / videos</div>
                  {(detailItem.media || []).length ? (
                    <div className="flex flex-wrap gap-2">
                      {detailItem.media.map(media => (
                        <a
                          key={media.id}
                          href={apiImage(media.url || media.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={media.original_name || 'Return evidence'}
                          style={{ width: 88, height: 88, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {media.type === 'video' ? (
                            <video src={apiImage(media.url || media.path)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img
                              src={apiImage(media.url || media.path)}
                              alt={media.original_name || 'Return evidence'}
                              onError={handleImgError}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  ) : <div className="muted text-sm">No photos or videos were attached.</div>}
                </div>
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><AlertCircle size={14} /> Refunds</h3>
                {(detailItem.refunds || []).length ? detailItem.refunds.map(refund => (
                  <div key={refund.uuid || refund.id} className="flex items-center justify-between gap-2 text-sm py-1">
                    <span>{refund.refund_number || 'Refund'} · {getStatusLabel(refund.status)}</span>
                    <strong>{money(refund.amount || 0)}</strong>
                  </div>
                )) : <div className="muted text-sm">No refund processing has been started.</div>}
                <div className="muted text-xs mt-2">
                  Order total {money(detailOrder?.grand_total || 0)} · {detailOrder?.currency || 'NPR'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Dialog */}
      {dialogState.isOpen && dialogState.action === 'process_refund' && dialogState.returnItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setDialogState({ isOpen: false, action: null, returnItem: null, loading: false }) }}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Process Refund — Return #{dialogState.returnItem.return_number || dialogState.returnItem.id}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Order #{dialogState.returnItem.order?.order_number || dialogState.returnItem.order_id} · Item: {dialogState.returnItem.order_item?.product_name || 'Product'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Method</label>
                <select
                  className="input"
                  value={refundDraft.method}
                  onChange={e => setRefundDraft(d => ({ ...d, method: e.target.value }))}
                  style={{ height: 38, fontSize: 13, borderRadius: 8, fontWeight: 600 }}
                >
                  <option value="esewa">eSewa</option>
                  <option value="khalti">Khalti</option>
                  <option value="fonepay">Fonepay</option>
                  <option value="cod">Cash on Delivery</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Refund Amount</label>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  max={maxRefundAmount(dialogState.returnItem).toFixed(2)}
                  step="0.01"
                  value={refundDraft.amount}
                  onChange={e => setRefundDraft(d => ({ ...d, amount: e.target.value }))}
                  style={{ height: 38, fontSize: 13, borderRadius: 8, fontWeight: 600 }}
                />
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  Maximum for this item and quantity: {money(maxRefundAmount(dialogState.returnItem))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={refundDraft.notes}
                onChange={e => setRefundDraft(d => ({ ...d, notes: e.target.value }))}
                placeholder="Any administrative note for this refund..."
                style={{ fontSize: 13, borderRadius: 8 }}
              />
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, lineHeight: 1.5 }}>
              {refundDraft.method === 'esewa' ? (
                <>
                  Creates a <strong>Requested</strong> refund and verifies the payment via the <strong>eSewa status API</strong>. The payout is issued from the
                  eSewa merchant dashboard — finalize it in <strong>Refunds Management</strong> (eSewa must report the transaction refunded).
                </>
              ) : (
                <>
                  Creates a <strong>Requested</strong> refund against the order payment via <strong>{refundDraft.method.toUpperCase()}</strong> — finalize it in{' '}
                  <strong>Refunds Management</strong>.
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDialogState({ isOpen: false, action: null, returnItem: null, loading: false })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={dialogState.loading}
                onClick={submitRefund}
                style={{ background: '#ff5500', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                {dialogState.loading ? 'Creating...' : 'Create Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen && (dialogState.action === 'approve' || dialogState.action === 'reject')}
        onClose={() => setDialogState({ isOpen: false, action: null, returnItem: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Return #${dialogState.returnItem?.return_number || dialogState.returnItem?.id}?`
            : `Reject Return #${dialogState.returnItem?.return_number || dialogState.returnItem?.id}?`
        }
        message={
          dialogState.action === 'approve'
            ? `Approving will authorize the item return of ${money(dialogState.returnItem?.refund_amount || 0)}.`
            : 'Rejecting this return request requires an explanatory reason for the buyer.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={dialogState.action === 'approve' ? 'Approve Return' : 'Reject Return'}
        requireReason={dialogState.action === 'reject'}
        reasonPlaceholder="State why this return request is being rejected..."
      />
    </div>
  )
}
