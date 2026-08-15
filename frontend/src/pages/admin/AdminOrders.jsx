import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Search, Eye, Filter, Download, ArrowRight,
  Clock, CheckCircle2, XCircle, Truck, RotateCcw, AlertTriangle,
  ChevronRight, Calendar, Banknote, Wallet, CreditCard, Smartphone
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

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
  const [updating, setUpdating] = useState(false)

  const fetcher = useCallback(
    async (page) => api.get('/orders', {
      params: {
        page,
        per_page: 15,
        status: statusFilter || undefined,
        search: search || undefined,
        payment_method: paymentFilter || undefined,
      },
    }),
    [statusFilter, search, paymentFilter]
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search, paymentFilter],
    pageSize: 15,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const cancelOrder = async (orderId) => {
    setUpdating(true)
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Cancelled by administrator' })
      toast.success('Order cancelled successfully')
      setSelectedOrder(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setUpdating(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Payment Method', 'Grand Total', 'Status'],
      ...items.map((o) => [
        o.order_number || o.id,
        formatDateTime(o.created_at),
        o.customer?.name || o.user?.name || 'Customer',
        o.customer?.email || o.user?.email || 'N/A',
        o.payment_method || 'COD',
        o.grand_total || o.total || 0,
        o.status,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Orders exported to CSV')
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Order Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Global view of all marketplace transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          {meta.total > 0 && (
            <span className="muted text-sm">{meta.total} order{meta.total !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
            aria-pressed={statusFilter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search Order ID, Customer, or Vendor…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} />
          </button>
        </form>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 150 }}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">Date Range: All</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="cod">Cash on Delivery</option>
          <option value="khalti">Khalti</option>
          <option value="esewa">eSewa</option>
          <option value="fonepay">Fonepay</option>
        </select>

        {(search || paymentFilter) && (
          <button
            className="btn btn-ghost btn-xs text-danger"
            onClick={() => { setSearch(''); setSearchInput(''); setPaymentFilter('') }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Orders Table */}
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
        <>
          <div className="table-wrap hide-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Vendor / Store</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((order) => {
                  const paymentIcon = order.payment_method === 'khalti' ? Wallet :
                    order.payment_method === 'esewa' ? CreditCard :
                    order.payment_method === 'fonepay' ? Smartphone : Banknote
                  const PaymentIconComp = paymentIcon
                  return (
                    <tr key={order.id}>
                      <td>
                        <span
                          className="font-bold text-primary text-xs"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          #{order.order_number || order.id}
                        </span>
                      </td>
                      <td className="muted text-xs">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td>
                        <div className="font-semibold text-sm text-ink">{order.customer?.name || order.user?.name || 'Customer'}</div>
                        <div className="muted text-xs">{order.customer?.phone || order.user?.email || '—'}</div>
                      </td>
                      <td>
                        <span className="font-medium text-sm text-ink">
                          {order.store?.name || order.vendor_name || 'Himalayan Crafts'}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-ink">{money(order.grand_total || order.total || 0)}</span>
                      </td>
                      <td>
                        <span className="chip chip-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', fontSize: 11 }}>
                          <PaymentIconComp size={11} color="var(--primary)" />
                          {order.payment_method || 'COD'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => setSelectedOrder(order)}
                          title="Inspect order"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.order_number || selectedOrder.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status overview */}
            <div className="card" style={{ background: 'var(--bg)', padding: 14 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Order Status</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex items-center justify-between text-xs muted">
                <span>Placed: {formatDateTime(selectedOrder.created_at)}</span>
                <span>Payment: <strong style={{ color: 'var(--ink)' }}>{selectedOrder.payment_method || 'COD'}</strong></span>
              </div>
            </div>

            {/* Customer & Shipping */}
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 6 }}>Delivery Information</h4>
              <div className="text-sm">
                <strong>{selectedOrder.customer?.name || selectedOrder.shipping_address?.name || 'Customer'}</strong>
                <div className="muted text-xs mt-1">
                  {selectedOrder.shipping_address?.street ? `${selectedOrder.shipping_address.street}, ` : ''}
                  {selectedOrder.shipping_address?.municipality || 'Kathmandu'}, {selectedOrder.shipping_address?.district || 'Bagmati'}
                </div>
                <div className="muted text-xs mt-1">Phone: {selectedOrder.customer?.phone || selectedOrder.shipping_address?.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Item list */}
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8 }}>Order Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div className="font-medium text-sm">{item.name || item.product?.name || `Product #${item.product_id}`}</div>
                      <div className="muted text-xs">Qty: {item.quantity} · {money(item.unit_price || 0)}</div>
                    </div>
                    <div className="font-semibold text-sm">{money(item.total_price || (item.quantity * item.unit_price) || 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary */}
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: 10 }}>
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span className="text-primary">{money(selectedOrder.grand_total || selectedOrder.total || 0)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <button
                  className="btn btn-danger-outline btn-sm"
                  onClick={() => cancelOrder(selectedOrder.id)}
                  disabled={updating}
                >
                  Cancel Order
                </button>
              )}
              <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
