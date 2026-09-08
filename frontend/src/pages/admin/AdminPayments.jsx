import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard, Search, CheckCircle2, Clock, RotateCcw,
  Eye, Download, RefreshCw, X, ArrowUpRight
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminPayments() {
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)

  const [refundDialog, setRefundDialog] = useState({
    isOpen: false,
    payment: null,
    loading: false
  })

  const loadPayments = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (providerFilter) params.provider = providerFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/payments', { params })
      const data = api.unwrapList(res.data)
      setPayments(data)
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
      toast.error('Failed to load payment transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [page, statusFilter, providerFilter])

  const handleConfirmRefund = async (reason) => {
    const { payment } = refundDialog
    if (!payment) return

    setRefundDialog(prev => ({ ...prev, loading: true }))
    const targetId = payment.uuid || payment.id

    try {
      await api.post(`/admin/payments/${targetId}/refund`, {
        amount: Number(payment.amount),
        reason
      })
      toast.success(`Refund initiated for payment #${payment.payment_number || payment.id}`)
      setRefundDialog({ isOpen: false, payment: null, loading: false })
      loadPayments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed.')
      setRefundDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Payment #', 'Order #', 'Customer', 'Gateway Provider', 'Amount', 'Status', 'Date'],
      ...payments.map(p => [
        p.payment_number || p.id,
        p.order_number || p.order_id || '',
        `"${p.customer?.full_name || p.user?.name || 'Customer'}"`,
        p.provider || p.payment_method || 'COD',
        p.amount || 0,
        p.status || '',
        formatDateTime(p.created_at || p.initiated_at)
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_payments_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payments exported to CSV.')
  }

  const columns = [
    {
      header: 'Payment Ref',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
            #{item.payment_number || item.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
            {item.provider_reference || item.transaction_id || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Order Ref',
      render: item => (
        <Link
          to={`/admin/orders/${item.order_id || item.order?.id}`}
          style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
        >
          #{item.order_number || item.order_id}
        </Link>
      )
    },
    {
      header: 'Customer',
      render: item => {
        const name = item.customer?.full_name || item.user?.name || 'Customer'
        return (
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
            {name}
          </div>
        )
      }
    },
    {
      header: 'Gateway',
      render: item => (
        <span className="chip chip-sm" style={{ fontWeight: 700, fontSize: 11.5, background: '#f8fafc' }}>
          {(item.provider || item.payment_method || 'COD').toUpperCase()}
        </span>
      )
    },
    {
      header: 'Amount',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 13.5 }}>
          {money(item.amount)}
        </span>
      )
    },
    {
      header: 'Gateway Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Timestamp',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at || item.initiated_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setSelectedTxn(item)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Eye size={12} /> Inspect
          </button>

          {item.status === 'paid' && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ color: '#dc2626' }}
              onClick={() => setRefundDialog({ isOpen: true, payment: item, loading: false })}
              title="Issue Refund"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Payment Transactions"
        description="Monitor digital gateway payments (eSewa, Khalti), cash on delivery reconciliations, and transactions."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Payments' }
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
              onClick={loadPayments}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment #, order #, provider ref..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'paid', label: 'Paid / Captured' },
          { value: 'initiated', label: 'Initiated' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        extraFilters={
          <div style={{ minWidth: 140 }}>
            <select
              className="input"
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              style={{ height: 36, fontSize: 13, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="">All Providers</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>
        }
        onReset={() => { setSearch(''); setStatusFilter('all'); setProviderFilter('') }}
      />

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No payment transactions"
        emptyDescription="There are no payment records matching your filter parameters."
      />

      {/* Inspect Payment Modal */}
      {selectedTxn && (
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
          onClick={e => { if (e.target === e.currentTarget) setSelectedTxn(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  Transaction #{selectedTxn.payment_number || selectedTxn.id}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Order #{selectedTxn.order_number || selectedTxn.order_id}
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedTxn(null)}>✕</button>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Amount Processed</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>{money(selectedTxn.amount)}</div>
              </div>
              <StatusBadge status={selectedTxn.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Gateway Provider:</span>
                <span style={{ fontWeight: 700 }}>{(selectedTxn.provider || selectedTxn.payment_method || 'COD').toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Provider Ref ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedTxn.provider_reference || selectedTxn.transaction_id || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Payer / Customer:</span>
                <span style={{ fontWeight: 600 }}>{selectedTxn.customer?.full_name || selectedTxn.user?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--muted)' }}>Initiated Timestamp:</span>
                <span>{formatDateTime(selectedTxn.created_at || selectedTxn.initiated_at)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedTxn(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Refund Dialog */}
      <ConfirmDialog
        isOpen={refundDialog.isOpen}
        onClose={() => setRefundDialog({ isOpen: false, payment: null, loading: false })}
        onConfirm={handleConfirmRefund}
        loading={refundDialog.loading}
        title={`Initiate Refund for Payment #${refundDialog.payment?.payment_number || refundDialog.payment?.id}?`}
        message={`This will execute a refund of ${money(refundDialog.payment?.amount || 0)} back to the customer.`}
        variant="danger"
        confirmText="Execute Refund"
        requireReason={true}
        reasonPlaceholder="Specify reason for refund..."
      />
    </div>
  )
}
