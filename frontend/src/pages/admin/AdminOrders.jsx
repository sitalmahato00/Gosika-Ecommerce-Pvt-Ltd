import React, { useState, useEffect } from 'react'
import {
  ShoppingBag, Search, Eye, Download, Clock, CheckCircle2, Truck,
  MapPin, Phone, Mail, User, Store, Package, Banknote, Wallet,
  CreditCard, Smartphone
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrders() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    if (paymentFilter) params.payment_method = paymentFilter
    if (search) params.search = search
    const today = new Date()
    if (dateRange === 'today') {
      params.date_from = today.toISOString().slice(0, 10)
      params.date_to = today.toISOString().slice(0, 10)
    } else if (dateRange === '7d') {
      const from = new Date(today.getTime() - 6 * 86400000)
      params.date_from = from.toISOString().slice(0, 10)
      params.date_to = today.toISOString().slice(0, 10)
    } else if (dateRange === '30d') {
      const from = new Date(today.getTime() - 29 * 86400000)
      params.date_from = from.toISOString().slice(0, 10)
      params.date_to = today.toISOString().slice(0, 10)
    }
    return api.get('/admin/orders', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, paymentFilter, search, dateRange],
    pageSize: 15,
  })

  useEffect(() => {
    if (!selectedOrder) return
    setDetailLoading(true)
    setOrderDetail(null)
    api.get(`/admin/orders/${selectedOrder.id}`)
      .then((r) => setOrderDetail(r.data.data || null))
      .catch(() => setOrderDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selectedOrder])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const doCancel = async () => {
    if (!orderDetail || actionBusy) return
    const reason = window.prompt('Reason for cancelling this order:')
    if (reason === null) return
    if (!reason.trim()) {
      toast.error('A cancellation reason is required')
      return
    }
    setActionBusy(true)
    try {
      await api.post(`/admin/orders/${orderDetail.id}/cancel`, { reason: reason.trim() })
      toast.success(`Order ${orderDetail.order_number} cancelled`)
      setSelectedOrder(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Phone', 'City', 'Store Name', 'Items Count', 'Payment Method', 'Grand Total (NPR)', 'Platform Commission (NPR)', 'Status', 'Fulfillment'],
      ...items.map((o) => {
        const vo = o.vendor_orders && o.vendor_orders[0]
        const commission = (o.vendor_orders || []).reduce((s, v) => s + Number(v.commission_amount || 0), 0)
        return [
          o.order_number,
          formatDateTime(o.created_at),
          o.customer?.full_name || 'Customer',
          o.customer?.phone || 'N/A',
          o.shipping_address?.city || o.shipping_address?.district || 'Nepal',
          vo?.store_name || vo?.vendor_name || 'Store',
          o.item_count || (o.items || []).length,
          (o.payment_method || 'N/A').toUpperCase(),
          o.grand_total || 0,
          commission,
          o.status,
          vo?.delivery_status || 'N/A',
        ]
      }),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_admin_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Orders exported to CSV')
  }

  const totalGMV = items.reduce((s, o) => s + Number(o.grand_total || 0), 0)
  const pendingCount = items.filter((o) => o.status === 'pending').length
  const transitCount = items.filter((o) => o.status === 'out_for_delivery' || o.status === 'processing' || o.status === 'picked_up').length
  const deliveredCount = items.filter((o) => o.status === 'delivered' || o.status === 'completed').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Marketplace Order Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Global centralized view of all buyer purchases, multi-vendor fulfillment, payment clearances, and courier deliveries across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV Report
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Orders</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total} Orders</div>
          <div className="muted text-xs mt-1">Gross GMV: {money(totalGMV)}</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Dispatch</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{pendingCount} Pending</div>
          <div className="muted text-xs mt-1">Awaiting vendor preparation</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>In Courier Transit</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{transitCount} In Transit</div>
          <div className="muted text-xs mt-1">Processing / out for delivery</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivered & Settled</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{deliveredCount} Completed</div>
          <div className="muted text-xs mt-1">On this page</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${meta.total})` : `(${items.filter((o) => o.status === t.value).length})`}
          </button>
        ))}
      </div>

      <div className="card flex items-center wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search Order ID, Buyer Name, Store Name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 150, height: 36 }}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160, height: 36 }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payment Types</option>
          <option value="esewa">eSewa Digital Wallet</option>
          <option value="khalti">Khalti Wallet</option>
          <option value="fonepay">Fonepay Direct Bank</option>
          <option value="cod">Cash on Delivery (COD)</option>
        </select>

        {(search || paymentFilter || dateRange !== 'all') && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger font-bold"
            onClick={() => { setSearch(''); setSearchInput(''); setPaymentFilter(''); setDateRange('all') }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={ShoppingBag}
          title={statusFilter ? `No ${statusFilter} orders` : 'No orders found'}
          message={search ? 'No orders match your search term.' : 'Customer orders will appear here as purchases are made.'}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Placed Date & Time</th>
                  <th>Customer (Buyer)</th>
                  <th>Vendor & Store Origin</th>
                  <th>Order Amount</th>
                  <th>Payment Gateway</th>
                  <th>Fulfillment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => {
                  const paymentIcon = order.payment_method === 'khalti' ? Wallet :
                    order.payment_method === 'esewa' ? null :
                    order.payment_method === 'fonepay' ? Smartphone : Banknote
                  const PaymentIconComp = paymentIcon
                  const isEsewa = order.payment_method === 'esewa'
                  const vo = (order.vendor_orders && order.vendor_orders[0]) || null
                  const commission = (order.vendor_orders || []).reduce((s, v) => s + Number(v.commission_amount || 0), 0)
                  const itemCount = order.item_count != null ? order.item_count : (order.items || []).length

                  return (
                    <tr key={order.id}>
                      <td>
                        <span
                          className="font-mono font-bold text-primary text-xs"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          #{order.order_number}
                        </span>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="muted text-xs">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{order.customer?.full_name || 'Customer'}</div>
                        <div className="muted text-xs flex items-center gap-1">
                          <MapPin size={10} /> {order.shipping_address?.city || order.shipping_address?.district || 'Nepal'} · {order.customer?.phone}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-xs text-ink">
                          {vo?.store_name || vo?.vendor_name || '—'}
                        </div>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>
                          {(order.vendor_orders || []).length} vendor order{(order.vendor_orders || []).length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{money(order.grand_total)}</div>
                        <div className="muted text-xs" style={{ fontSize: 10, color: '#166534' }}>
                          Comm: {money(commission)}
                        </div>
                      </td>
                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textTransform: 'uppercase',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {isEsewa ? (
                            <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 14, width: 'auto' }} />
                          ) : (
                            <PaymentIconComp size={11} color="var(--primary)" />
                          )}
                          {order.payment_method || 'N/A'}
                        </span>
                        <div className="muted text-xs" style={{ fontSize: 10, marginTop: 2 }}>
                          {order.payment_status}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={vo?.delivery_status} />
                        <div className="muted text-xs font-mono" style={{ fontSize: 10, marginTop: 2 }}>
                          {vo?.vendor_order_number || '—'}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs flex items-center gap-1"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => setSelectedOrder(order)}
                          title="Inspect full details"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}

      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Dossier: #${selectedOrder.order_number}`}
          size="lg"
        >
          {detailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={56} />)}
            </div>
          ) : !orderDetail ? (
            <p className="muted text-sm m-0">Could not load order details. Please try again.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
                <div className="flex items-center justify-between wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Order State:</span>
                    <StatusBadge status={orderDetail.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="muted text-xs">Payment:</span>
                    <StatusBadge status={orderDetail.payment_status} />
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                  <div>
                    <span className="muted block text-xs">Date Placed:</span>
                    <strong className="text-ink">{formatDateTime(orderDetail.created_at)}</strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">Payment Method:</span>
                    <strong className="text-ink uppercase flex items-center gap-1">
                      {orderDetail.payment_method === 'esewa' && <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 13, width: 'auto' }} />}
                      {orderDetail.payment_method || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">Gateway Ref ID:</span>
                    <strong className="font-mono text-xs text-primary">{orderDetail.payments?.[0]?.provider_transaction_id || orderDetail.payments?.[0]?.payment_number || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">Order Number:</span>
                    <strong className="text-ink">#{orderDetail.order_number}</strong>
                  </div>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                <div className="card" style={{ padding: 16, margin: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                    <User size={14} color="var(--primary)" /> Buyer & Delivery Destination
                  </h4>
                  <div className="text-sm">
                    <div className="font-bold text-ink">{orderDetail.customer?.full_name}</div>
                    <div className="muted text-xs mt-1 flex items-center gap-1">
                      <Phone size={11} /> {orderDetail.customer?.phone}
                    </div>
                    <div className="muted text-xs mt-0.5 flex items-center gap-1">
                      <Mail size={11} /> {orderDetail.customer?.email}
                    </div>
                    <div className="text-xs text-ink mt-2 p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <MapPin size={12} color="var(--primary)" style={{ display: 'inline', marginRight: 4 }} />
                      {[orderDetail.shipping_address?.street, orderDetail.shipping_address?.city, orderDetail.shipping_address?.district, orderDetail.shipping_address?.province].filter(Boolean).join(', ') || '—'}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 16, margin: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                    <Store size={14} color="var(--primary)" /> Fulfilling Merchant Workshops
                  </h4>
                  {(orderDetail.vendor_orders || []).length ? (
                    orderDetail.vendor_orders.map((vo, idx) => (
                      <div key={vo.id || idx} style={{ padding: '6px 0', borderBottom: idx < orderDetail.vendor_orders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div className="font-bold text-sm text-ink">{vo.store_name || vo.vendor_name}</div>
                        <div className="muted text-xs mt-0.5">Vendor: {vo.vendor_name} · {vo.vendor_order_number}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={vo.status} />
                          <StatusBadge status={vo.delivery_status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted text-xs m-0">No vendor orders available.</p>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: 16, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                  <Package size={14} color="var(--primary)" /> Purchased Line Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(orderDetail.items || []).map((item, idx) => (
                    <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div className="font-bold text-sm text-ink">{item.product_name}</div>
                        <div className="muted text-xs">SKU: <span className="font-mono">{item.sku || 'N/A'}</span> · Qty: {item.quantity} × {money(item.unit_price)}</div>
                      </div>
                      <div className="font-bold text-sm text-ink">{money(item.line_total)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Gross Item Subtotal:</span>
                    <span>{money(orderDetail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Discount:</span>
                    <span style={{ color: '#166534', fontWeight: 700 }}>- {money(orderDetail.discount)}</span>
                  </div>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Delivery Fee:</span>
                    <span>{money(orderDetail.delivery_charge)}</span>
                  </div>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Tax:</span>
                    <span>{money(orderDetail.tax)}</span>
                  </div>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Platform Commission:</span>
                    <span style={{ color: '#166534', fontWeight: 700 }}>- {money((orderDetail.vendor_orders || []).reduce((s, v) => s + Number(v.commission_amount || 0), 0))}</span>
                  </div>
                  <div className="flex justify-between text-xs muted mb-1">
                    <span>Merchant Net Settlement Payout:</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{money((orderDetail.vendor_orders || []).reduce((s, v) => s + Number(v.vendor_payable || 0), 0))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink)' }}>
                    <span>Customer Total Billed:</span>
                    <span className="text-primary">{money(orderDetail.grand_total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {orderDetail.can_cancel ? (
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-xs"
                    disabled={actionBusy}
                    onClick={doCancel}
                  >
                    {actionBusy ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                ) : <span />}
                <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
                  <button type="button" className="btn btn-outline btn-xs" onClick={() => setSelectedOrder(null)}>
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
