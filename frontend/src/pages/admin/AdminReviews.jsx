import React, { useState } from 'react'
import {
  Star, Search, CheckCircle2, XCircle, Trash2, MessageSquare, ThumbsUp, Flag, Check,
  HelpCircle, Send, MessageCircle
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
import { formatDate, errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = ['', 'pending', 'approved', 'hidden', 'rejected']

/* ------------------------------ Reviews tab ------------------------------ */

function ReviewsTab() {
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
    <div className="w-full flex flex-col gap-4">
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

/* ------------------------------- Q&A tab -------------------------------- */

function QaTab() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [answerTarget, setAnswerTarget] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  const fetcher = async (page) => api.get('/admin/questions', {
    params: {
      page,
      per_page: 15,
      status: statusFilter || undefined,
      search: search || undefined,
    },
  })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search],
    pageSize: 15,
  })

  const doApprove = async (q) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/questions/${q.id}/approve`)
      toast.success('Question approved')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const submitAnswer = async (e) => {
    e.preventDefault()
    if (!answerTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/questions/${answerTarget.id}/answer`, { answer: answerText })
      toast.success('Answer published')
      setAnswerTarget(null)
      setAnswerText('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/questions/${rejectTarget.id}/reject`, { reason: rejectReason || undefined })
      toast.success('Question rejected')
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
      await api.delete(`/admin/questions/${deleteTarget.id}`)
      toast.success('Question deleted')
      setDeleteTarget(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const pending = items.filter((q) => q.status === 'pending').length
  const answered = items.filter((q) => q.answer).length
  const rejected = items.filter((q) => q.status === 'rejected').length

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <Skeleton height={100} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={90} />)}
      </div>
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Customer Questions</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <MessageCircle size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total} Questions</div>
          <div className="muted text-xs mt-1">Asked on product pages</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Pending Moderation</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <HelpCircle size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: pending ? '#f59e0b' : 'var(--ink)' }}>{pending} Pending</div>
          <div className="muted text-xs mt-1">Awaiting review</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Answered</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Send size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{answered} Answered</div>
          <div className="muted text-xs mt-1">Official replies live</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: rejected ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: rejected ? '#991b1b' : 'var(--muted)' }}>Rejected</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <XCircle size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: rejected ? '#ef4444' : 'var(--ink)' }}>{rejected} Rejected</div>
          <div className="muted text-xs mt-1">Hidden from product pages</div>
        </div>
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search questions or products…"
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
          <EmptyState icon={HelpCircle} title="No questions" message="No customer questions match the current filters." />
        ) : (
          items.map((q) => (
            <div
              key={q.id}
              className="card"
              style={{
                padding: 18,
                margin: 0,
                border: q.status === 'pending' ? '2px solid rgba(245, 158, 11, 0.35)' : (q.status === 'rejected' ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)'),
              }}
            >
              <div className="flex items-center justify-between wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="chip chip-sm" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', fontSize: 10 }}>
                    Product Q&A
                  </span>
                  <span className="font-bold text-sm text-ink">{q.target?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={q.status} />
                  <span className="muted text-xs">{formatDate(q.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 wrap">
                {q.target?.image && (
                  <span className="thumb" style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={apiImage(q.target.image, q.target.name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                )}
                <div className="flex items-center gap-1 flex-wrap">
                  <HelpCircle size={14} color="#f59e0b" />
                  <span className="muted text-xs">by <strong>{q.customer?.name || 'Unknown'}</strong></span>
                  {q.customer?.email && <span className="muted text-xs">({q.customer.email})</span>}
                </div>
              </div>

              <div className="card" style={{ padding: '12px 14px', margin: '0 0 10px', background: 'var(--bg-soft)' }}>
                <p className="text-sm text-ink" style={{ lineHeight: 1.5, margin: 0 }}>"{q.question}"</p>
              </div>

              {q.answer ? (
                <div className="card" style={{ padding: '12px 14px', margin: '0 0 10px', background: 'rgba(16, 185, 129, 0.06)', borderLeft: '3px solid #10b981' }}>
                  <div className="muted text-xs font-bold uppercase mb-1" style={{ letterSpacing: '0.04em', color: '#10b981' }}>
                    <Send size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> Official Answer
                  </div>
                  <p className="text-sm text-ink" style={{ lineHeight: 1.5, margin: 0 }}>{q.answer}</p>
                  {q.answered_at && <div className="muted text-xs mt-1">by {q.answered_by || 'Administrator'} · {formatDate(q.answered_at)}</div>}
                </div>
              ) : !['rejected'].includes(q.status) && (
                <div className="muted text-xs mb-2">Not answered yet.</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                {q.status !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    onClick={() => doApprove(q)}
                    disabled={actionBusy}
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-xs flex items-center gap-1"
                  onClick={() => { setAnswerTarget(q); setAnswerText(q.answer || '') }}
                  disabled={actionBusy}
                >
                  <Send size={12} /> {q.answer ? 'Edit Answer' : 'Answer'}
                </button>
                {q.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => { setRejectTarget(q); setRejectReason('') }}
                    disabled={actionBusy}
                  >
                    <XCircle size={12} /> Reject
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger-outline btn-xs flex items-center gap-1"
                  onClick={() => setDeleteTarget(q)}
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

      {answerTarget && (
        <Modal
          open={!!answerTarget}
          onClose={() => setAnswerTarget(null)}
          title={answerTarget.answer ? 'Edit Answer' : 'Answer Customer Question'}
        >
          <form onSubmit={submitAnswer} className="flex flex-col gap-3">
            <div className="card" style={{ padding: '10px 12px', margin: 0, background: 'var(--bg-soft)' }}>
              <p className="text-sm text-ink" style={{ margin: 0 }}>"{answerTarget.question}"</p>
              <div className="muted text-xs mt-1">by {answerTarget.customer?.name || 'Unknown'} · for {answerTarget.target?.name || 'product'}</div>
            </div>
            <Textarea
              label="Official Answer"
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Provide a helpful, verified answer. Publishing also approves the question."
              required
            />
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAnswerTarget(null)} disabled={actionBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1" disabled={actionBusy || !answerText.trim()}>
                <Send size={13} /> {actionBusy ? 'Saving…' : 'Publish Answer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rejectTarget && (
        <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Question">
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
        title="Delete question?"
        message={`This will permanently delete the question for "${deleteTarget?.target?.name || 'this product'}".`}
        confirmText="Delete"
        danger
        loading={actionBusy}
      />
    </div>
  )
}

/* ------------------------------- Shell ----------------------------------- */

export default function AdminReviews() {
  const [tab, setTab] = useState('reviews')

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Customer Reviews & Q&A Moderation
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized governance for buyer feedback, product ratings, verified purchaser badges, and product Q&A.
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        <button type="button" className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          <Star size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} /> Reviews
        </button>
        <button type="button" className={`tab ${tab === 'qa' ? 'active' : ''}`} onClick={() => setTab('qa')}>
          <HelpCircle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} /> Product Q&A
        </button>
      </div>

      {tab === 'reviews' ? <ReviewsTab /> : <QaTab />}
    </div>
  )
}