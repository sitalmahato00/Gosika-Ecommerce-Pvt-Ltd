import React, { useCallback, useState } from 'react'
import {
  Star, Check, MessageSquare, Store,
  ThumbsUp, Sparkles, UserCheck, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import RatingStars from '../../components/commerce/RatingStars'
import { useToast } from '../../context/ToastContext'
import { formatDate, apiImage, errorMessage } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'

const TYPE_TABS = [
  { id: 'all', label: 'All Reviews' },
  { id: 'product', label: 'Product Reviews' },
  { id: 'store', label: 'Store Reviews' },
]

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'rejected', label: 'Rejected' },
]

const REPLY_TEMPLATES = [
  'Thank you so much for your kind review and for supporting authentic Nepali artisans!',
  'Namaste! We are thrilled that you loved the craftsmanship and fast delivery.',
  'Dhanyabad for your valuable feedback! We are committed to providing the highest quality products.',
]

export default function VendorReviews() {
  const toast = useToast()
  const [typeTab, setTypeTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const fetcher = useCallback(
    async (page) =>
      api.get('/vendor/reviews', {
        params: {
          page,
          per_page: 15,
          status: statusFilter || undefined,
          rating: ratingFilter || undefined,
        },
      }),
    [statusFilter, ratingFilter],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, ratingFilter],
    pageSize: 15,
  })

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return
    setSending(true)
    try {
      await api.post(`/vendor/reviews/${replyTarget.type}/${replyTarget.id}/reply`, { reply: replyText.trim() })
      toast.success('Reply published to customer review')
      setReplyTarget(null)
      setReplyText('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const filtered = typeTab === 'all' ? items : items.filter((r) => r.type === typeTab)

  const average = items.length
    ? items.reduce((s, r) => s + Number(r.rating || 0), 0) / items.length
    : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: items.filter((r) => Math.round(Number(r.rating || 0)) === star).length,
  }))

  const repliedCount = items.filter((r) => r.reply).length
  const responseRate = Math.round((repliedCount / (items.length || 1)) * 100)

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Customer Reviews & Ratings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor customer satisfaction, ratings breakdown, and reply to verified buyer feedback.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={reload} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', flexShrink: 0 }}>
            <Star size={22} fill="#f59e0b" />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Overall Rating</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
              {average ? average.toFixed(1) : '—'} <span style={{ fontSize: 14, color: '#f59e0b' }}>★</span>
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <MessageSquare size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Reviews</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{meta.total}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <ThumbsUp size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>5-Star Praise</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
              {distribution.find((d) => d.star === 5)?.count || 0} reviews
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <UserCheck size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Response Rate</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{responseRate}% Replied</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr) minmax(280px, 2fr)', gap: 24, alignItems: 'center' }}>
          <div className="text-center" style={{ borderRight: '1px solid var(--border)', paddingRight: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: 'var(--ink)' }}>{average ? average.toFixed(1) : '—'}</div>
            <div className="flex justify-center my-2">
              <RatingStars value={average} size={20} showValue={false} />
            </div>
            <div className="muted text-xs font-semibold">Based on {meta.total} customer ratings</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {distribution.map((d) => (
              <div
                key={d.star}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setRatingFilter(ratingFilter === d.star ? 0 : d.star)}
                style={{ opacity: ratingFilter === 0 || ratingFilter === d.star ? 1 : 0.4 }}
              >
                <span className="text-xs font-bold" style={{ width: 48 }}>{d.star} Star</span>
                <div className="progress" style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: items.length ? `${(d.count / items.length) * 100}%` : '0%', height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                </div>
                <span className="muted text-xs" style={{ width: 36, textAlign: 'right', fontWeight: 600 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-2">
          <div className="flex gap-1 wrap">
            {TYPE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${typeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTypeTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 wrap">
            <select
              className="select"
              style={{ height: 30, padding: '2px 8px', fontSize: 12, width: 140 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(statusFilter || ratingFilter > 0) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-primary font-bold"
                onClick={() => { setStatusFilter(''); setRatingFilter(0) }}
              >
                Clear Filters ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : filtered.length ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((r) => {
              const customer = r.customer || {}
              const isStore = r.type === 'store'

              return (
                <div key={r.id} className="card" style={{ padding: 18, margin: 0 }}>
                  <div className="flex items-start gap-3">
                    {r.image ? (
                      <img
                        src={apiImage(r.image)}
                        alt=""
                        style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <span
                        className="avatar"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--primary-50)',
                          color: 'var(--primary)',
                          flexShrink: 0,
                        }}
                      >
                        <Store size={26} />
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between wrap gap-2">
                        <div className="flex items-center gap-2 wrap">
                          <span className="font-bold text-sm text-ink">{customer.full_name || 'Customer'}</span>
                          {isStore && (
                            <span className="chip chip-sm" style={{ background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 700 }}>
                              <Store size={11} /> Store Review
                            </span>
                          )}
                          <StatusBadge status={r.status} />
                        </div>
                        <span className="muted text-xs">{formatDate(r.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 my-1">
                        <RatingStars value={Number(r.rating || 0)} size={14} showValue={false} />
                        {r.product_name && (
                          <span className="muted text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                            · {r.product_name}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-ink" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                        {r.body}
                      </p>

                      {r.reply && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(37,99,235,0.06)',
                            borderLeft: '3px solid var(--primary)',
                            fontSize: 13,
                          }}
                        >
                          <div className="font-bold text-xs" style={{ color: 'var(--primary)', marginBottom: 2 }}>
                            Your Store Reply{r.replied_at ? ` · ${formatDate(r.replied_at)}` : ''}:
                          </div>
                          <div style={{ color: 'var(--ink)' }}>{r.reply}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Button
                        variant="soft"
                        size="sm"
                        icon={MessageSquare}
                        onClick={() => {
                          setReplyTarget(r)
                          setReplyText(r.reply || '')
                        }}
                      >
                        {r.reply ? 'Edit Reply' : 'Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews found"
          message="No reviews match your selected filter criteria."
        />
      )}

      {replyTarget && (
        <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply to ${replyTarget.customer?.full_name || 'Customer'}`} size="lg">
          <div className="flex flex-col gap-3">
            <div className="p-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <RatingStars value={Number(replyTarget.rating || 0)} size={15} showValue={false} />
                <span className="font-bold text-xs">{replyTarget.customer?.full_name || 'Customer'}</span>
              </div>
              <p className="text-sm" style={{ margin: 0, color: 'var(--ink)' }}>
                "{replyTarget.body}"
              </p>
            </div>

            <div>
              <span className="muted text-xs font-semibold uppercase block mb-1 flex items-center gap-1">
                <Sparkles size={11} color="var(--primary)" /> Quick Reply Templates:
              </span>
              <div className="flex flex-col gap-1">
                {REPLY_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-ghost btn-xs text-left"
                    style={{ border: '1px solid var(--border)', background: '#fff', fontSize: 12, padding: '6px 10px' }}
                    onClick={() => setReplyText(tmpl)}
                  >
                    "{tmpl}"
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Your Public Store Reply"
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a personalized reply to thank the customer…"
            />

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReplyTarget(null)}>
                Cancel
              </button>
              <Button variant="primary" icon={Check} onClick={sendReply} disabled={sending || !replyText.trim()}>
                {sending ? 'Publishing…' : 'Publish Reply'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
