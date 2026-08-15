import React, { useState } from 'react'
import {
  Star, Search, CheckCircle2, XCircle, Trash2, MessageSquare, ThumbsUp, Flag, Check
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import RatingStars from '../../components/commerce/RatingStars'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = ['', 'pending', 'approved', 'hidden', 'rejected']

export default function AdminReviews() {
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  const fetcher = async (page) => api.get('/admin/reviews', {
    params: {
      page,
      per_page: 15,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      search: search || undefined,
    },
  })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [typeFilter, statusFilter, search],
    pageSize: 15,
  })

  const doApprove = async (r) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/reviews/${r.type}/${r.id}/approve`)
      toast.success('Review approved & published')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/reviews/${rejectTarget.type}/${rejectTarget.id}/reject`, { reason: rejectReason || undefined })
      toast.success('Review rejected')
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    setActionBusy(true)
    try {
      await api.delete(`/admin/reviews/${deleteTarget.type}/${deleteTarget.id}`)
      toast.success('Review deleted')
      setDeleteTarget(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const totalReviews = items.length
  const avgRating = totalReviews ? (items.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(2) : '0.00'
  const fiveStars = items.filter((r) => Number(r.rating) === 5).length
  const reported = items.filter((r) => r.status === 'pending' || r.status === 'rejected').length

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <Skeleton height={120} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={90} />)}
      </div>
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Customer Reviews & Reputation Moderation
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized governance for buyer feedback, product ratings, verified purchaser badges, and vendor SLA moderation.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Marketplace Reviews</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <MessageSquare size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalReviews} Reviews</div>
          <div className="muted text-xs mt-1">Across product & store feedback</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Average Rating</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Star size={18} fill="#f59e0b" />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{avgRating} ★</div>
          <div className="muted text-xs mt-1">From loaded reviews</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>5-Star Praise</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ThumbsUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>
            {totalReviews ? ((fiveStars / totalReviews) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="muted text-xs mt-1">{fiveStars} perfect score reviews</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: reported > 0 ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: reported > 0 ? '#991b1b' : 'var(--muted)' }}>Reported / Flagged</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Flag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: reported > 0 ? '#ef4444' : 'var(--ink)' }}>
            {reported} Flagged
          </div>
          <div className="muted text-xs mt-1">Awaiting admin decision</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Reviews (${meta.total})` },
          { value: 'product', label: `Product Reviews (${items.filter(r => r.type === 'product').length})` },
          { value: 'store', label: `Vendor Store Reviews (${items.filter(r => r.type === 'store').length})` },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${typeFilter === t.value ? 'active' : ''}`}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search feedback by item or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 wrap">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-xs ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
              onClick={() => setStatusFilter(st)}
            >
              {st === '' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!items.length ? (
          <EmptyState icon={Star} title="No reviews" message="No reviews match the current filters." />
        ) : (
          items.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                padding: 18,
                margin: 0,
                border: (r.status === 'pending' || r.status === 'rejected') ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="chip chip-sm"
                    style={{
                      background: r.type === 'store' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                      color: r.type === 'store' ? '#6366f1' : '#2563eb',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: 10,
                    }}
                  >
                    {r.type === 'store' ? 'Vendor Review' : 'Product Review'}
                  </span>
                  <span className="font-bold text-sm text-ink">{r.target?.name || '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <span className="muted text-xs">{formatDate(r.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 wrap">
                <RatingStars value={r.rating} size={15} showValue={false} />
                {r.title && <span className="font-bold text-sm text-ink">{r.title}</span>}
                <span className="muted text-xs">· by <strong>{r.customer?.name || 'Unknown'}</strong></span>
                {r.verified_buyer && (
                  <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                    <Check size={10} /> Verified Purchase
                  </span>
                )}
              </div>

              <p className="text-sm text-ink" style={{ lineHeight: 1.5, margin: '0 0 10px' }}>
                "{r.body}"
              </p>

              <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {r.status !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    onClick={() => doApprove(r)}
                    disabled={actionBusy}
                  >
                    <CheckCircle2 size={12} /> Approve & Publish
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => { setRejectTarget(r); setRejectReason('') }}
                    disabled={actionBusy}
                  >
                    <XCircle size={12} /> Reject
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger-outline btn-xs flex items-center gap-1"
                  onClick={() => setDeleteTarget(r)}
                  disabled={actionBusy}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {rejectTarget && (
        <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Review">
          <form
            onSubmit={(e) => { e.preventDefault(); doReject() }}
            className="flex flex-col gap-3"
          >
            <Textarea
              label="Rejection Reason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional reason recorded in the audit trail."
            />
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectTarget(null)} disabled={actionBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger btn-sm" disabled={actionBusy}>
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete review?"
        message={`This will permanently delete the review for "${deleteTarget?.target?.name || 'this item'}".`}
        confirmText="Delete"
        danger
        loading={actionBusy}
      />
    </div>
  )
}
