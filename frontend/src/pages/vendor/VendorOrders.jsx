import React, { useCallback, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, ChevronRight, Search, Download, CheckCircle2,
  Clock, Truck, Check, PackageCheck, XCircle,
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'

const STATUS_TABS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
]

const VIEW_META = {
  all: {
    title: 'Vendor Orders Management',
    subtitle: 'Track incoming customer purchases, manage fulfillment status, and coordinate delivery dispatches.',
    status: '',
  },
  ready: {
    title: 'To Ship',
    subtitle: 'Orders that are packed and ready to be handed over for shipment.',
    status: 'ready_for_pickup',
  },
  shipped: {
    title: 'Shipped',
    subtitle: 'Orders that have been dispatched to the delivery partner.',
    status: 'out_for_delivery',
  },
}

export default function VendorOrders({ view = 'all' }) {
  const viewMeta = VIEW_META[view] || VIEW_META.all
  const toast = useToast()
  const [status, setStatus] = useState(viewMeta.status)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetcher = useCallback(
    (page, pageSize) => api.get('/vendor/orders', {
      params: {
        page,
        per_page: pageSize,
        status: status || undefined,
      },
    }),
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [status],
    pageSize: 15,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((o) =>
      String(o.vendor_order_number || '').toLowerCase().includes(q) ||
      String(o.store_name || '').toLowerCase().includes(q) ||
      String(o.items?.[0]?.product_name || '').toLowerCase().includes(q),
    )
  }, [items, search])

  const doAction = async (order, action, successMsg) => {
    setBusy(`${order.id}:${action}`)
    try {
      await api.post(`/vendor/orders/${order.id}/${action}`)
      toast.success(successMsg)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) return toast.error('Please provide a reason')
    setBusy(`${rejectTarget.id}:reject`)
    try {
      await api.post(`/vendor/orders/${rejectTarget.id}/reject`, { reason: rejectReason.trim() })
      toast.success('Order rejected')
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const totalVolume = filtered.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)
  const pendingCount = filtered.filter((o) => o.status === 'pending').length
  const fulfillmentCount = filtered.filter((o) => ['accepted', 'confirmed', 'processing', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)).length
  const deliveredCount = filtered.filter((o) => ['delivered', 'completed'].includes(o.status)).length

  const exportCSV = () => {
    const headers = ['Order Number', 'Store', 'Items Count', 'Total NPR', 'Status', 'Delivery Status', 'Date']
    const rows = filtered.map((o) => [
      o.vendor_order_number,
      `"${o.store_name || ''}"`,
      o.items?.length || 1,
      o.grand_total,
      o.status,
      o.delivery_status,
      o.created_at,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-vendor-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Orders CSV exported')
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={90} />)}
        </div>
        <Skeleton height={80} />
        <Skeleton height={300} />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={reload} />
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{viewMeta.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            {viewMeta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <ShoppingBag size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Order Volume</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{money(totalVolume)}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Pending Acceptance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{pendingCount} Orders</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <Truck size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>In Fulfillment / Transit</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{fulfillmentCount} Orders</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Fulfilled & Delivered</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{deliveredCount} Orders</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn btn-xs ${status === t.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => { setStatus(t.value); setPage(1) }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 230 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search order #, store, item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Store Catalog Items</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Delivery Status</th>
                  <th>Order Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/vendor/orders/${o.id}`}
                        className="font-mono font-bold text-sm"
                        style={{ color: 'var(--primary)' }}
                      >
                        {o.vendor_order_number}
                      </Link>
                      <div className="muted text-xs mt-0.5">{o.store_name || '—'}</div>
                    </td>

                    <td className="text-sm">
                      <div className="font-medium text-ink">
                        {o.items?.[0]?.product_name || `${o.items?.length || 1} Item`}
                      </div>
                      {o.items?.length > 1 && (
                        <div className="muted text-xs">+{o.items.length - 1} other item(s)</div>
                      )}
                    </td>

                    <td className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                      {money(o.grand_total)}
                    </td>

                    <td><StatusBadge status={o.status} /></td>
                    <td><StatusBadge status={o.delivery_status} /></td>

                    <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(o.created_at)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1">
                        {o.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-success btn-xs flex items-center gap-1"
                              disabled={busy === `${o.id}:accept`}
                              onClick={() => doAction(o, 'accept', 'Order accepted')}
                            >
                              <Check size={11} /> Accept
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-xs flex items-center gap-1"
                              onClick={() => { setRejectTarget(o); setRejectReason('') }}
                            >
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}

                        {o.status === 'accepted' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs flex items-center gap-1"
                            disabled={busy === `${o.id}:ready-for-pickup`}
                            onClick={() => doAction(o, 'ready-for-pickup', 'Marked ready for courier pickup')}
                          >
                            <PackageCheck size={11} /> Ready
                          </button>
                        )}

                        <Link
                          to={`/vendor/orders/${o.id}`}
                          className="btn btn-soft btn-xs flex items-center gap-1"
                        >
                          Manage <ChevronRight size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          message="Try changing the status filter or search keywords."
          action={
            <button className="btn btn-outline" onClick={() => { setSearch(''); setStatus(''); setPage(1) }}>
              Reset Filters
            </button>
          }
        />
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={confirmReject}
        danger
        loading={busy === `${rejectTarget?.id}:reject`}
        title="Reject this order?"
        confirmText="Reject order"
        message="Let us know why you're rejecting this order so we can inform the customer."
      >
        <div className="mt-2">
          <Input label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Out of stock, unable to fulfil…" />
        </div>
      </ConfirmDialog>
    </div>
  )
}
