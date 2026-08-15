import React, { useState, useMemo } from 'react'
import {
  Search, CheckCircle2, Clock, RotateCcw, Eye, DollarSign, Download
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

const STATUS_OPTIONS = [
  'initiated',
  'processing',
  'verification',
  'paid',
  'failed',
  'cancelled',
  'expired',
  'refunded',
  'partially_refunded',
  'exception',
]

export default function AdminPayments() {
  const toast = useToast()
  const [providerFilter, setProviderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refundOpen, setRefundOpen] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundSaving, setRefundSaving] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    if (providerFilter) params.provider = providerFilter
    if (search) params.search = search
    return api.get('/admin/payments', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search, statusFilter, providerFilter] })

  const openDetails = async (p) => {
    setSelectedTxn(p)
    setDetailLoading(true)
    try {
      const res = await api.get(`/admin/payments/${p.id}`)
      setSelectedTxn(res.data.data)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  const openRefund = (p) => {
    setRefundOpen(p)
    setRefundAmount(p.amount)
    setRefundReason('')
  }

  const handleRefund = async (e) => {
    e.preventDefault()
    setRefundSaving(true)
    try {
      await api.post(`/admin/payments/${refundOpen.id}/refund`, {
        amount: Number(refundAmount),
        reason: refundReason || null,
      })
      toast.success(`Refund of ${money(refundAmount)} requested`)
      setRefundOpen(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRefundSaving(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Payment Number', 'Order Number', 'Customer', 'Gateway', 'Amount (NPR)', 'Status', 'Initiated At'],
      ...items.map((p) => [
        p.payment_number,
        p.order_number,
        p.customer?.full_name || p.payer_name || '—',
        p.provider || p.method,
        p.amount,
        p.status,
        p.initiated_at || p.created_at,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_payments_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payment transactions exported to CSV')
  }

  const providers = Array.from(new Set(items.map((p) => p.provider).filter(Boolean)))

  const totals = useMemo(() => {
    const totalVolume = items.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const paidVolume = items.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const pendingVolume = items.filter((p) => ['initiated', 'processing', 'verification'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const refundVolume = items.filter((p) => ['refunded', 'partially_refunded'].includes(p.status)).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return { totalVolume, paidVolume, pendingVolume, refundVolume }
  }, [items])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return <EmptyState icon={DollarSign} title="No payments" message="No payment transactions found." />
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Payment & Gateway Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor transactions, settlements, and refunds across payment gateways.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Volume</span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{money(totals.totalVolume)}</div>
          <span className="muted text-xs mt-1 block">{meta.total} transactions</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Settled / Paid</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-success">{money(totals.paidVolume)}</div>
          <span className="muted text-xs mt-1 block">Successfully captured</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Pending</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-warning">{money(totals.pendingVolume)}</div>
          <span className="muted text-xs mt-1 block">Awaiting completion</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Refunds</span>
            <RotateCcw size={16} color="var(--danger)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-danger">{money(totals.refundVolume)}</div>
          <span className="muted text-xs mt-1 block">Returned to buyers</span>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${providerFilter === '' ? 'active' : ''}`} onClick={() => setProviderFilter('')}>
          All Gateways ({meta.total})
        </button>
        {providers.map((g) => (
          <button
            key={g}
            className={`tab ${providerFilter === g ? 'active' : ''}`}
            onClick={() => setProviderFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by payment number or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Payment Number</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Gateway</th>
              <th>Amount</th>
              <th>Gateway Ref</th>
              <th>Status</th>
              <th>Initiated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="font-bold text-sm text-ink font-mono">{p.payment_number}</span>
                </td>
                <td>
                  <span className="font-semibold text-primary font-mono text-xs">{p.order_number || '—'}</span>
                </td>
                <td className="text-sm font-medium text-ink">{p.customer?.full_name || p.payer_name || '—'}</td>
                <td>
                  <span className="chip chip-sm" style={{ fontWeight: 700 }}>
                    {p.provider || p.method || '—'}
                  </span>
                </td>
                <td>
                  <span className="font-bold text-ink text-sm">{money(p.amount)}</span>
                </td>
                <td className="muted text-xs font-mono">{p.provider_transaction_id || '—'}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="muted text-xs">{formatDateTime(p.initiated_at || p.created_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn btn-outline btn-xs" onClick={() => openDetails(p)}>
                      <Eye size={12} /> Details
                    </button>
                    {p.status === 'paid' && (
                      <button className="btn btn-danger-outline btn-xs" onClick={() => openRefund(p)}>
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {selectedTxn && (
        <Modal open={!!selectedTxn} onClose={() => setSelectedTxn(null)} title={`Payment: ${selectedTxn.payment_number || selectedTxn.id}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {detailLoading ? (
              <Skeleton height={80} />
            ) : (
              <>
                <div className="card" style={{ background: 'var(--bg)', padding: 16 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="muted text-xs uppercase font-semibold">Payment Status</span>
                    <StatusBadge status={selectedTxn.status} />
                  </div>
                  <div className="font-extrabold text-2xl text-primary">{money(selectedTxn.amount)}</div>
                  <div className="muted text-xs mt-1">Currency: {selectedTxn.currency}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <span className="muted text-xs block">Order Number</span>
                    <span className="font-semibold text-primary">{selectedTxn.order_number || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Payment Method</span>
                    <span className="font-semibold">{selectedTxn.method || selectedTxn.provider || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Customer Name</span>
                    <span className="font-semibold">{selectedTxn.customer?.full_name || selectedTxn.payer_name || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Gateway Reference</span>
                    <span className="font-mono text-xs">{selectedTxn.provider_transaction_id || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Payer Email</span>
                    <span className="font-mono text-xs">{selectedTxn.payer_email || selectedTxn.customer?.email || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Payer Phone</span>
                    <span className="font-mono text-xs">{selectedTxn.payer_phone || selectedTxn.customer?.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Initiated At</span>
                    <span className="font-semibold text-xs">{formatDateTime(selectedTxn.initiated_at)}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block">Verified At</span>
                    <span className="font-semibold text-xs">{formatDateTime(selectedTxn.verified_at)}</span>
                  </div>
                </div>

                {(selectedTxn.refunds || []).length > 0 && (
                  <div className="card" style={{ padding: 14 }}>
                    <div className="font-bold text-sm mb-2">Refunds</div>
                    {(selectedTxn.refunds || []).map((r) => (
                      <div key={r.id} className="flex justify-between items-center text-xs py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="font-mono font-bold">{r.refund_number}</span>
                        <span className="font-bold">{money(r.amount)}</span>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedTxn(null)}>Close</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {refundOpen && (
        <Modal open={!!refundOpen} onClose={() => setRefundOpen(null)} title={`Process Refund: ${refundOpen.payment_number}`}>
          <form onSubmit={handleRefund} className="flex flex-col gap-3">
            <p className="text-sm muted m-0">
              Issue a refund of <strong>{money(refundOpen.amount)}</strong> to <strong>{refundOpen.customer?.full_name || refundOpen.payer_name || 'customer'}</strong>.
            </p>
            <div className="form-group">
              <label className="label">Refund Amount (NPR) <span className="req">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Refund Reason</label>
              <textarea
                className="textarea"
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Order cancelled by customer or defective item returned."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRefundOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-danger btn-sm" disabled={refundSaving}>
                {refundSaving ? 'Processing…' : 'Confirm & Process Refund'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
