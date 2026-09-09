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
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const RETURN_STATUSES = [
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
]

export default function AdminReturns() {
  const toast = useToast()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

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
      render: item => (
        <select
          className="input"
          value={item.status}
          onChange={e => handleStatusChange(item, e.target.value)}
          title="Edit return status"
          style={{ fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: 'var(--ink)', minWidth: 132 }}
        >
          {RETURN_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )
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
        const canRefund = ['approved', 'collected', 'inspected', 'refund_pending'].includes(item.status)
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
            {isPending ? (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve as Refund"
                >
                  <Check size={13} /> Refund
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
                  step="0.01"
                  value={refundDraft.amount}
                  onChange={e => setRefundDraft(d => ({ ...d, amount: e.target.value }))}
                  style={{ height: 38, fontSize: 13, borderRadius: 8, fontWeight: 600 }}
                />
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
