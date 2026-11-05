import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Search, Eye, Download, Clock,
  RefreshCw, CheckCircle2, XCircle, Truck, Store,
  CreditCard, ArrowRight
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function AdminOrders() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const branding = useBranding()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedDateRange, setAppliedDateRange] = useState({ from: '', to: '' })

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    order: null,
    loading: false
  })

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (paymentFilter) params.payment_method = paymentFilter
      if (search.trim()) params.search = search.trim()
      if (appliedDateRange.from) params.date_from = appliedDateRange.from
      if (appliedDateRange.to) params.date_to = appliedDateRange.to

      const res = await api.get('/admin/orders', { params })
      const data = api.unwrapList(res.data)
      setOrders(data)
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
      toast.error('Failed to load marketplace orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter, paymentFilter, search, appliedDateRange])

  const resetFilters = () => {
    setPage(1)
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('')
    setDateFrom('')
    setDateTo('')
    setAppliedDateRange({ from: '', to: '' })
  }

  const handleConfirmCancel = async (reason) => {
    const { order } = dialogState
    if (!order) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = order.uuid || order.id

    try {
      await api.post(`/admin/orders/${targetId}/cancel`, { reason })
      toast.success(`Order #${order.order_number || order.id} has been cancelled.`)
      setDialogState({ isOpen: false, order: null, loading: false })
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rangeLabel = appliedDateRange.from || appliedDateRange.to
      ? `${appliedDateRange.from || 'Beginning'} – ${appliedDateRange.to || 'Present'}`
      : 'All time'
    const columns = [
      { label: 'Order #' },
      { label: 'Customer' },
      { label: 'Customer Phone' },
      { label: 'Payment Method' },
      { label: 'Payment Status' },
      { label: 'Fulfillment Status' },
      { label: 'Grand Total', align: 'right' },
      { label: 'Refunded', align: 'right' },
      { label: 'Net Total', align: 'right' },
      { label: 'Return Type' },
      { label: 'Placed At' },
    ]
    const rows = orders.map((o) => {
      const customer = o.customer?.full_name || o.user?.name || `${o.user?.first_name || ''} ${o.user?.last_name || ''}`.trim() || 'Customer'
      return [
        o.order_number || o.id,
        customer,
        o.customer?.phone || o.shipping_address?.phone || o.user?.phone || '',
        o.payment_method || 'COD',
        o.payment_status || 'pending',
        o.status || 'pending',
        money(o.grand_total || o.total || 0),
        money(o.refunded_amount || 0),
        money(o.net_total ?? o.grand_total ?? o.total ?? 0),
        (o.return_categories || []).join(', '),
        formatDateTime(o.created_at || o.placed_at),
      ]
    })
    exportReportFromRows({
      columns,
      rows,
      title: 'Marketplace Orders Report',
      subtitle: 'Filtered multi-vendor checkout transactions, fulfilment routing and payment lifecycles.',
      sectionLabel: 'Filtered Orders',
      fileName: `gosika_orders_${new Date().toISOString().slice(0, 10)}`,
      rangeLabel,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Orders exported as branded report.')
  }

  const columns = [
    {
      header: 'Order #',
      render: item => (
        <Link
          to={`/admin/orders/${item.uuid || item.id}`}
          style={{ fontWeight: 800, color: 'var(--primary)', textDecoration: 'none', fontSize: 13 }}
        >
          #{item.order_number || item.id}
        </Link>
      )
    },
    {
      header: 'Customer',
      render: item => {
        const name = item.customer?.full_name || item.user?.name || `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 'Customer'
        const phone = item.customer?.phone || item.shipping_address?.phone || item.user?.phone || ''
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{name}</div>
            {phone && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{phone}</div>}
          </div>
        )
      }
    },
    {
      header: 'Payment',
      render: item => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>
            {item.payment_method ? item.payment_method.toUpperCase() : 'COD'}
          </div>
          <div style={{ fontSize: 11, color: item.payment_status === 'paid' ? '#16a34a' : 'var(--muted)', fontWeight: 600 }}>
            {item.payment_status ? item.payment_status.toUpperCase() : 'PENDING'}
          </div>
        </div>
      )
    },
    {
      header: 'Vendors / Packages',
      render: item => {
        const vCount = (item.vendor_orders || item.vendorOrders)?.length || 1
        return (
          <span className="chip chip-sm" style={{ fontSize: 11, fontWeight: 700, background: '#f8fafc' }}>
            <Store size={12} style={{ marginRight: 4 }} />
            {vCount} {vCount === 1 ? 'store' : 'stores'}
          </span>
        )
      }
    },
    {
      header: 'Fulfillment Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Return / Refund',
      render: item => (
        (item.return_categories || []).length
          ? <div className="flex flex-wrap gap-1">{item.return_categories.map(category => (
            <span key={category} className="chip chip-sm" style={{ fontSize: 10 }}>{category}</span>
          ))}</div>
          : <span className="muted text-xs">—</span>
      )
    },
    {
      header: 'Net / Grand Total',
      align: 'right',
      render: item => (
        <div>
          {Number(item.refunded_amount) > 0 && (
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
              −{money(item.refunded_amount)} refunded
            </div>
          )}
          {Number(item.refunded_amount) > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>
              {money(item.grand_total || item.total || 0)}
            </div>
          )}
          <div style={{ fontWeight: 900, color: Number(item.refunded_amount) > 0 ? '#15803d' : 'var(--ink)', fontSize: 13.5 }}>
            {money(item.net_total ?? item.grand_total ?? item.total ?? 0)}
          </div>
        </div>
      )
    },
    {
      header: 'Placed Date',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at || item.placed_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <Link
            to={`/admin/orders/${item.uuid || item.id}`}
            className="btn btn-outline btn-xs"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Eye size={12} /> View
          </Link>

          {item.status !== 'cancelled' && item.status !== 'delivered' && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ color: '#dc2626' }}
              onClick={e => {
                e.stopPropagation()
                setDialogState({ isOpen: true, order: item, loading: false })
              }}
              title="Cancel Order"
            >
              <XCircle size={13} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Marketplace Orders"
        description="Monitor multi-vendor checkout transactions, fulfillment routing, and order lifecycles."
        exportInfo="Export includes only the orders currently shown after applied filters."
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: 'All Orders' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadOrders}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={value => { setPage(1); setSearch(value) }}
        searchPlaceholder="Search order #, customer name, phone..."
        debounceMs={350}
        statusFilter={statusFilter}
        onStatusChange={value => { setPage(1); setStatusFilter(value) }}
        statusOptions={[
          { value: 'pending', label: 'Pending Payment / Confirmation' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'processing', label: 'Processing at Merchant' },
          { value: 'ready_for_pickup', label: 'Ready for Pickup' },
          { value: 'out_for_delivery', label: 'Out for Delivery' },
          { value: 'delivered', label: 'Delivered' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'returned', label: 'Returned' },
        ]}
        extraFilters={
          <>
            <div style={{ minWidth: 130 }}>
              <select
                className="input"
                value={paymentFilter}
                onChange={e => { setPage(1); setPaymentFilter(e.target.value) }}
                style={{ height: 36, fontSize: 13, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="">All Payments</option>
                <option value="esewa">eSewa</option>
                <option value="khalti">Khalti</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
          </>
        }
        fromDate={dateFrom}
        toDate={dateTo}
        onFromDateChange={setDateFrom}
        onToDateChange={setDateTo}
        onApplyFilters={() => {
          setPage(1)
          setAppliedDateRange({ from: dateFrom, to: dateTo })
        }}
        hasActiveFilters={Boolean(search || (statusFilter && statusFilter !== 'all') || paymentFilter || dateFrom || dateTo)}
        onReset={resetFilters}
      />

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={item => navigate(`/admin/orders/${item.uuid || item.id}`)}
        emptyTitle="No orders found"
        emptyDescription="There are no marketplace customer orders matching your selected filters."
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, order: null, loading: false })}
        onConfirm={handleConfirmCancel}
        loading={dialogState.loading}
        title={`Cancel Order #${dialogState.order?.order_number || dialogState.order?.id}?`}
        message="Cancelling this order will release reserved inventory and cancel all vendor packages."
        variant="danger"
        confirmText="Cancel Order"
        requireReason={true}
        reasonPlaceholder="Provide the administrative explanation for cancelling this order..."
      />
    </div>
  )
}
