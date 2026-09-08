import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Check, X, Eye, RefreshCw,
  ShoppingBag, Store, User, AlertCircle
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminReturns() {
  const toast = useToast()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject'
    returnItem: null,
    loading: false
  })

  const loadReturns = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }

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
  }, [page, statusFilter])

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
        <div>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>
            {item.order_item?.product_name || item.orderItem?.product_name || 'Product'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Store: {item.store?.name || '—'} · Qty: {item.quantity || 1}
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
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
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
        const isPending = item.status === 'requested' || item.status === 'pending'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            {isPending ? (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve Return"
                >
                  <Check size={13} /> Approve
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
            ) : (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Processed</span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Return Requests"
        description="Review, verify, and authorize customer item returns across all marketplace sellers."
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: 'Returns' }
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
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'requested', label: 'Requested (Pending Review)' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'completed', label: 'Completed' },
        ]}
        onReset={() => setStatusFilter('all')}
      />

      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No return requests"
        emptyDescription="There are no active customer return requests matching your filter."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
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
