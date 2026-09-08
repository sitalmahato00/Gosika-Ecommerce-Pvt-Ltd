import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Check, X, Eye, RefreshCw, Download,
  Receipt, CreditCard, User, Package, ExternalLink
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminRefunds() {
  const toast = useToast()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRefund, setSelectedRefund] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject'
    refund: null,
    loading: false
  })

  const loadRefunds = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/refunds', { params })
      const data = api.unwrapList(res.data)
      setRefunds(data)
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
      toast.error('Failed to load refunds.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRefunds()
  }, [page, statusFilter])

  const handleAction = (action, refund) => {
    setDialogState({
      isOpen: true,
      action,
      refund,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, refund } = dialogState
    if (!refund) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = refund.uuid || refund.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/refunds/${targetId}/approve`)
        toast.success(`Refund claim #${refund.refund_number || refund.id} approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/refunds/${targetId}/reject`, { reason })
        toast.success(`Refund claim #${refund.refund_number || refund.id} rejected.`)
      }

      setDialogState({ isOpen: false, action: null, refund: null, loading: false })
      if (selectedRefund && (selectedRefund.id === refund.id || selectedRefund.uuid === refund.uuid)) {
        setSelectedRefund(null)
      }
      loadRefunds()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund processing failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Refund #', 'Order #', 'Customer', 'Refund Amount', 'Status', 'Date'],
      ...refunds.map(r => [
        r.refund_number || r.id,
        r.order_number || r.order_id || '',
        `"${r.customer?.full_name || r.user?.name || 'Customer'}"`,
        r.amount || 0,
        r.status || '',
        formatDateTime(r.created_at)
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_refunds_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Refunds exported to CSV.')
  }

  const columns = [
    {
      header: 'Refund #',
      render: item => (
        <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
          #{item.refund_number || item.id}
        </span>
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
        const email = item.customer?.email || item.user?.email || ''
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{name}</div>
            {email && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{email}</div>}
          </div>
        )
      }
    },
    {
      header: 'Amount',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#dc2626', fontSize: 13.5 }}>
          {money(item.amount)}
        </span>
      )
    },
    {
      header: 'Reason',
      render: item => (
        <div style={{ maxWidth: 200, fontSize: 12, color: 'var(--muted)' }} className="truncate" title={item.reason}>
          {item.reason || '—'}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Initiated',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at || item.initiated_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isRequested = item.status === 'requested' || item.status === 'pending'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setSelectedRefund(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={12} /> Inspect
            </button>

            {isRequested && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve Refund"
                >
                  <Check size={12} /> Approve
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                  title="Reject Refund"
                >
                  <X size={12} /> Reject
                </button>
              </>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Refunds & Reversals"
        description="Verify buyer return claims, gateway refund disbursements, and payment ledger adjustments."
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: 'Refunds' }
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
              onClick={loadRefunds}
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
        searchPlaceholder="Search by refund # or order #..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'requested', label: 'Requested (Pending Review)' },
          { value: 'approved', label: 'Approved' },
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Completed' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'failed', label: 'Failed' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={refunds}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No refunds recorded"
        emptyDescription="There are no refund records matching your selected filter parameters."
      />

      {/* Refund Detail Modal */}
      {selectedRefund && (
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
          onClick={e => { if (e.target === e.currentTarget) setSelectedRefund(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 580,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    Refund Claim #{selectedRefund.refund_number || selectedRefund.id}
                  </h3>
                  <StatusBadge status={selectedRefund.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Linked to Order #{selectedRefund.order_number || selectedRefund.order_id}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedRefund(null)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount Banner */}
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Refund Amount</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{money(selectedRefund.amount)}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                Payment Ref: <strong>{selectedRefund.payment_number || 'Gateway'}</strong>
              </div>
            </div>

            {/* Buyer & Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Buyer:</span>
                <span style={{ fontWeight: 700 }}>{selectedRefund.customer?.full_name || selectedRefund.user?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Reason:</span>
                <span style={{ fontWeight: 600, maxWidth: 300, textAlign: 'right' }}>{selectedRefund.reason || 'No explanation provided'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--muted)' }}>Created At:</span>
                <span>{formatDateTime(selectedRefund.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              {(selectedRefund.status === 'requested' || selectedRefund.status === 'pending') && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => handleAction('reject', selectedRefund)}
                  >
                    Reject Claim
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700 }}
                    onClick={() => handleAction('approve', selectedRefund)}
                  >
                    <Check size={14} style={{ marginRight: 4 }} /> Approve & Execute Refund
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, refund: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Refund of ${money(dialogState.refund?.amount || 0)}?`
            : `Reject Refund Claim #${dialogState.refund?.refund_number || dialogState.refund?.id}?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will trigger gateway refund reversal and adjust the vendor wallet ledger.'
            : 'Please specify the reason why this refund claim is being rejected.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={dialogState.action === 'approve' ? 'Approve & Execute' : 'Reject Claim'}
        requireReason={dialogState.action === 'reject'}
        reasonPlaceholder="Provide the administrative explanation for rejecting this refund..."
      />
    </div>
  )
}
