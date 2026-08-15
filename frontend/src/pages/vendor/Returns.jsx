import React, { useCallback, useState } from 'react'
import { RotateCcw, Check, X, MessageSquare, ChevronRight } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const TABS = [
  { value: '', label: 'All Requests' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'completed', label: 'Completed' },
]

const RETURN_REASONS = {
  wrong_item: 'Wrong item received',
  damaged: 'Damaged / defective',
  not_as_described: 'Not as described',
  size_issue: 'Wrong size / fit',
  quality: 'Quality issue',
  other: 'Other',
}

export default function VendorReturns() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [response, setResponse] = useState('')
  const [acting, setActing] = useState(false)

  const fetcher = useCallback(
    async (page) => api.get('/vendor/returns', {
      params: { page, per_page: 15, status: status || undefined },
    }),
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [status],
    pageSize: 15,
  })

  const openRequest = (r) => {
    setSelected(r)
    setResponse(r.vendor_response || '')
  }

  const updateStatus = async (newStatus) => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/status`, { status: newStatus, response })
      toast.success(`Return ${newStatus.replace(/_/g, ' ')}`)
      setSelected(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Returns & Refunds</h1>
          <p>Review and manage customer return requests</p>
        </div>
        {meta.total > 0 && <span className="muted text-sm">{meta.total} request{meta.total !== 1 ? 's' : ''}</span>}
      </div>

      <div className="tabs" style={{ marginBottom: 16, overflowX: 'auto', display: 'flex', gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${status === t.value ? 'active' : ''}`}
            onClick={() => setStatus(t.value)}
            aria-pressed={status === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={68} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={RotateCcw}
          title={status ? `No ${status.replace(/_/g, ' ')} requests` : 'No return requests yet'}
          message="When customers request a return or refund, it will appear here for your review."
        />
      ) : (
        <>
          <div className="table-wrap hide-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium" style={{ fontSize: 13 }}>{r.return_number || `RTN-${String(r.id).slice(0, 6)}`}</td>
                    <td className="muted text-sm">{r.vendor_order_number || r.order_number || '—'}</td>
                    <td className="muted text-sm">{r.customer_name || '—'}</td>
                    <td className="muted text-sm" style={{ maxWidth: 180 }}>{r.product_name || '—'}</td>
                    <td className="muted text-sm">{RETURN_REASONS[r.reason] || (r.reason && r.reason.replace(/_/g, ' ')) || '—'}</td>
                    <td className="font-semibold">{money(r.amount)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="muted text-sm">{formatDateTime(r.created_at)}</td>
                    <td>
                      <button className="btn btn-soft btn-sm" onClick={() => openRequest(r)}>
                        Review <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 14 }}>{r.return_number || `RTN-${String(r.id).slice(0, 6)}`}</div>
                    <div className="muted text-xs">{r.customer_name} · {r.product_name}</div>
                  </div>
                  <span className="font-bold" style={{ fontSize: 15 }}>{money(r.amount)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={r.status} />
                  <button className="btn btn-soft btn-sm" onClick={() => openRequest(r)}>Review</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Review modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.return_number || 'Return request'}
        size="lg"
        footer={
          selected && ['requested', 'under_review'].includes(selected.status) ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="danger-outline" icon={X} disabled={acting} onClick={() => updateStatus('rejected')}>
                {acting ? <Spinner size={15} /> : 'Reject'}
              </Button>
              <Button variant="primary" icon={Check} disabled={acting} onClick={() => updateStatus('approved')}>
                {acting ? <Spinner size={15} color="#fff" /> : 'Approve Return'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                { label: 'Order', value: selected.vendor_order_number || '—' },
                { label: 'Customer', value: selected.customer_name || '—' },
                { label: 'Product', value: selected.product_name || '—' },
                { label: 'Amount', value: money(selected.amount) },
                { label: 'Status', value: <StatusBadge status={selected.status} /> },
                { label: 'Requested', value: formatDateTime(selected.created_at) },
              ].map((it) => (
                <div key={it.label}>
                  <div className="muted text-xs uppercase" style={{ letterSpacing: '0.05em' }}>{it.label}</div>
                  <div className="font-medium text-sm" style={{ marginTop: 3 }}>{it.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'var(--surface)', padding: 14 }}>
              <div className="muted text-xs uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Customer reason</div>
              <div className="text-sm">{RETURN_REASONS[selected.reason] || selected.reason || '—'}</div>
              {selected.reason_note && <p className="muted text-sm mb-0" style={{ marginTop: 8 }}>{selected.reason_note}</p>}
            </div>

            <Textarea
              label="Your response (visible to customer)"
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Add a note about how you will resolve this request…"
            />

            {selected.status && !['requested', 'under_review'].includes(selected.status) && (
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                <MessageSquare size={16} />
                <span>This request is already {selected.status.replace(/_/g, ' ')}. Use the response box to add follow-up notes.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
