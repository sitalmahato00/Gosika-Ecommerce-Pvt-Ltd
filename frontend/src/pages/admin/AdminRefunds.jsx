import React, { useState } from 'react'
import {
  RotateCcw, CheckCircle2, XCircle, Search, Eye,
  Download, FileText, User, Package
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Requests' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'processing', label: 'Processing' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminRefunds() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    return api.get('/admin/refunds', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search, statusFilter] })

  const openDetails = async (r) => {
    setSelectedRefund(r)
    setDetailLoading(true)
    try {
      const res = await api.get(`/admin/refunds/${r.id}`)
      setSelectedRefund(res.data.data)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionBusy(true)
    try {
      const res = await api.post(`/admin/refunds/${id}/approve`)
      toast.success('Refund claim approved')
      if (selectedRefund?.id === id) setSelectedRefund(res.data.data)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!selectedRefund) return
    setActionBusy(true)
    try {
      const res = await api.post(`/admin/refunds/${selectedRefund.id}/reject`, { reason: rejectReason })
      toast.success('Refund claim rejected')
      setSelectedRefund(res.data.data)
      setRejectOpen(false)
      setRejectReason('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Refund Number', 'Order Reference', 'Customer', 'Product', 'Refund Amount (NPR)', 'Status', 'Created At'],
      ...items.map((r) => [
        r.refund_number,
        r.order_number,
        r.customer?.full_name || '—',
        r.order_item?.product_name || '—',
        r.amount,
        r.status,
        r.created_at,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_refunds_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Refunds ledger exported to CSV')
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return <EmptyState icon={RotateCcw} title="No refunds" message="No refund requests found." />
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Refunds, Returns & Dispute Moderation</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review customer return requests and gateway refund dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
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
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: '0 0 16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search by refund number or order…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted text-xs font-semibold">{meta.total} refund claim{meta.total !== 1 ? 's' : ''}</span>
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Order Reference</th>
                <th>Buyer Customer</th>
                <th>Product Item</th>
                <th>Refund Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span
                      className="font-mono font-bold text-primary text-xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => openDetails(r)}
                    >
                      {r.refund_number}
                    </span>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{formatDateTime(r.created_at)}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-ink" style={{ whiteSpace: 'nowrap' }}>
                      {r.order_number || '—'}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-ink">{r.customer?.full_name || '—'}</div>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{r.customer?.email || r.customer?.phone || ''}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-ink line-clamp-1" title={r.order_item?.product_name}>{r.order_item?.product_name || '—'}</div>
                    <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>{r.order_item?.sku || ''}</div>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-ink">{money(r.amount)}</span>
                  </td>
                  <td>
                    <span className="muted text-xs line-clamp-1" title={r.reason || ''}>{r.reason || '—'}</span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => openDetails(r)}
                    >
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {selectedRefund && !rejectOpen && (
        <Modal
          open={!!selectedRefund}
          onClose={() => setSelectedRefund(null)}
          title={`Return Claim Dossier: ${selectedRefund.refund_number}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {detailLoading ? (
              <Skeleton height={80} />
            ) : (
              <>
                <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-ink">Requested Refund Amount</span>
                    <StatusBadge status={selectedRefund.status} />
                  </div>
                  <div className="font-black text-3xl text-primary">{money(selectedRefund.amount)}</div>
                  <div className="muted text-xs mt-1">
                    Payment Ref: <span className="font-mono font-bold text-primary">{selectedRefund.payment_number || '—'}</span> · Provider Ref: <span className="font-mono">{selectedRefund.provider_refund_id || '—'}</span>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div className="card" style={{ padding: 14, margin: 0 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                      <User size={13} color="var(--primary)" /> Buyer Information
                    </h4>
                    <div className="text-xs">
                      <div className="font-bold text-ink text-sm">{selectedRefund.customer?.full_name || '—'}</div>
                      <div className="muted mt-0.5">Phone: {selectedRefund.customer?.phone || '—'}</div>
                      <div className="muted mt-0.5">Email: {selectedRefund.customer?.email || '—'}</div>
                      <div className="muted mt-0.5">Order Ref: <span className="font-mono font-bold">{selectedRefund.order_number || '—'}</span></div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 14, margin: 0 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                      <Package size={13} color="var(--primary)" /> Order Item
                    </h4>
                    <div className="text-xs">
                      {selectedRefund.order_item ? (
                        <>
                          <div className="font-bold text-ink text-sm">{selectedRefund.order_item.product_name}</div>
                          <div className="muted mt-0.5">SKU: <span className="font-mono font-bold">{selectedRefund.order_item.sku}</span></div>
                          <div className="muted mt-0.5">Qty: {selectedRefund.order_item.quantity}</div>
                          <div className="muted mt-0.5">Line Total: <span className="font-bold text-ink">{money(selectedRefund.order_item.line_total)}</span></div>
                        </>
                      ) : (
                        <div className="muted">No item details</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 14, margin: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                    <FileText size={13} color="var(--primary)" /> Refund Reason
                  </h4>
                  <p className="text-xs text-ink m-0 p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                    {selectedRefund.reason || 'No reason provided'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  {selectedRefund.status === 'requested' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        onClick={() => handleApprove(selectedRefund.id)}
                        disabled={actionBusy}
                      >
                        <CheckCircle2 size={14} /> Approve Refund
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm flex items-center gap-1"
                        onClick={() => setRejectOpen(true)}
                      >
                        <XCircle size={14} /> Reject Claim
                      </button>
                    </div>
                  )}
                  <button type="button" className="btn btn-outline btn-sm ml-auto" onClick={() => setSelectedRefund(null)}>
                    Close Dossier
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {rejectOpen && selectedRefund && (
        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={`Reject Refund Claim: ${selectedRefund.refund_number}`}>
          <form onSubmit={handleReject} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Rejection Reason <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Exceeded 7-day return policy window or item tags removed."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger btn-sm" disabled={actionBusy}>Confirm Rejection</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
