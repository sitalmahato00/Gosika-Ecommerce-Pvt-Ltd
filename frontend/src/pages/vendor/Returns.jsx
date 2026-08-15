import React, { useState } from 'react'
import {
  RotateCcw, Check, X, Eye, Search, Clock,
  CheckCircle2, Package
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage, apiImage } from '../../utils/format'

const RETURN_REASONS = {
  wrong_item: 'Wrong item received',
  damaged: 'Damaged during transit',
  not_as_described: 'Product not as described',
  size_issue: 'Wrong size / fit',
  quality: 'Quality defect / stitching issue',
  other: 'Other reasons',
}

const STATUS_OPTIONS = [
  'under_review',
  'approved',
  'rejected',
  'collected',
  'inspected',
  'refund_pending',
  'refunded',
  'completed',
]

const TABS = [
  { value: '', label: 'All Requests' },
  { value: 'requested', label: 'New Requests' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'rejected', label: 'Rejected' },
]

export default function VendorReturns() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [nextStatus, setNextStatus] = useState('')
  const [response, setResponse] = useState('')
  const [acting, setActing] = useState(false)

  const fetchReturns = (page, pageSize) =>
    api.get('/vendor/returns', { params: { status, search, page, per_page: pageSize } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchReturns, {
    pageSize: 10,
    deps: [status, search],
  })

  const changeStatus = (value) => {
    setPage(1)
    setStatus(value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openRequest = (r) => {
    setSelected(r)
    setNextStatus(r.status)
    setResponse(r.response || '')
  }

  const updateStatus = async (newStatus) => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/status`, { status: newStatus, response })
      toast.success(`Return request marked as ${newStatus.replace(/_/g, ' ')}`)
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  const totalRequests = meta.total
  const pendingCount = items.filter((i) => ['requested', 'under_review'].includes(i.status)).length
  const approvedCount = items.filter((i) => i.status === 'approved').length
  const refundedCount = items.filter((i) => ['refunded', 'completed'].includes(i.status)).length

  const countFor = (s) => (s === '' ? items.length : items.filter((i) => i.status === s).length)

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Returns & Refunds Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review buyer return claims, authorize item exchanges, and approve customer refunds within the 7-day escrow window.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <RotateCcw size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Return Claims</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{totalRequests} Claims</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Under Review / Pending</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{pendingCount} Pending</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Approved for Return</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{approvedCount} Approved</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Settled & Refunded</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{refundedCount} Settled</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn btn-xs ${status === t.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => changeStatus(t.value)}
              >
                {t.label} ({countFor(t.value)})
              </button>
            ))}
          </div>

          <form onSubmit={applySearch} style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search claim #, product…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {loading ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Reference</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th>Return Reason</th>
                  <th>Refund Amount</th>
                  <th>Claim Status</th>
                  <th>Claim Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}><Skeleton height={26} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : items.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Reference</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th>Return Reason</th>
                  <th>Refund Amount</th>
                  <th>Claim Status</th>
                  <th>Claim Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
                        {r.return_number}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-xs" style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        {r.order_number || '—'}
                      </span>
                    </td>

                    <td>
                      <div className="font-semibold text-sm text-ink">{r.customer?.full_name || '—'}</div>
                      <div className="muted text-xs">{r.customer?.phone || r.customer?.email || ''}</div>
                    </td>

                    <td style={{ maxWidth: 240 }}>
                      <div className="flex items-center gap-2">
                        {r.product_image && (
                          <img
                            src={apiImage(r.product_image)}
                            alt={r.product_name || 'Product'}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm text-ink truncate">{r.product_name || '—'}</div>
                          {r.quantity > 0 && <div className="muted text-xs">Qty: {r.quantity}</div>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="chip chip-sm" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: 600 }}>
                        {RETURN_REASONS[r.reason_type] || r.reason_type}
                      </span>
                      {r.reason && <div className="muted text-xs mt-0.5" style={{ maxWidth: 180 }}>{r.reason}</div>}
                    </td>

                    <td className="font-bold text-sm text-ink">
                      {money(r.refund_amount)}
                    </td>

                    <td>
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(r.created_at)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-soft btn-xs flex items-center gap-1"
                        onClick={() => openRequest(r)}
                      >
                        <Eye size={12} /> Review Claim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={RotateCcw}
          title="No return claims found"
          message="There are no return requests matching your current status filter."
          action={
            <button className="btn btn-outline" onClick={() => {
              setSearchInput('')
              setSearch('')
              changeStatus('')
            }}>
              Reset Filters
            </button>
          }
        />
      )}

      {items.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Review Return Claim: ${selected.return_number}`}
          size="lg"
        >
          <div className="flex flex-col gap-3">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <div className="muted text-xs uppercase font-semibold">Order Reference</div>
                <div className="font-mono font-bold text-sm text-ink mt-0.5">{selected.order_number || '—'}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Customer</div>
                <div className="font-bold text-sm text-ink mt-0.5">{selected.customer?.full_name || '—'}</div>
                <div className="muted text-xs">{selected.customer?.phone || selected.customer?.email || ''}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Refund Amount</div>
                <div className="font-bold text-sm text-primary mt-0.5">{money(selected.refund_amount)}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Status</div>
                <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, background: '#fff' }}>
              <div className="muted text-xs uppercase font-semibold mb-1">Product</div>
              <div className="flex items-center gap-2">
                {selected.product_image && (
                  <img
                    src={apiImage(selected.product_image)}
                    alt={selected.product_name || 'Product'}
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div>
                  <div className="font-bold text-sm text-ink">{selected.product_name || '—'}</div>
                  {selected.quantity > 0 && <div className="muted text-xs">Quantity: {selected.quantity}</div>}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, background: '#fff' }}>
              <div className="muted text-xs uppercase font-semibold mb-1">Customer Return Reason:</div>
              <div className="font-bold text-sm text-ink">
                {RETURN_REASONS[selected.reason_type] || selected.reason_type}
              </div>
              {selected.reason && (
                <div className="muted text-xs mt-1" style={{ fontStyle: 'italic' }}>
                  "{selected.reason}"
                </div>
              )}
            </div>

            <div className="form-row">
              <Select
                label="Update Status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Seller Response & Instructions to Buyer"
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="e.g. Return approved. Please pack the item and our delivery courier will pick it up tomorrow."
            />

            <div className="flex justify-between items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                  Cancel
                </button>
                {selected.status === 'under_review' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm flex items-center gap-1"
                      disabled={acting}
                      onClick={() => updateStatus('rejected')}
                    >
                      <X size={13} /> Reject Request
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex items-center gap-1"
                      disabled={acting}
                      onClick={() => updateStatus('approved')}
                    >
                      <Check size={13} /> Approve Return
                    </button>
                  </>
                )}
              </div>
              <Button
                variant="primary"
                icon={Package}
                disabled={acting || nextStatus === selected.status}
                onClick={() => updateStatus(nextStatus)}
              >
                Update Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
