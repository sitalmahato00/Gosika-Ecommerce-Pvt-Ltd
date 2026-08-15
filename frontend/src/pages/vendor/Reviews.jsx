import React, { useEffect, useState } from 'react'
import { Star, Check, Flag, MessageSquare, Package } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { formatDate, apiImage, errorMessage } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

function Stars({ rating, size = 15 }) {
  return (
    <span className="flex items-center gap-0.5" style={{ color: '#f59e0b' }} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
            <Star size={size} fill="rgba(245,158,11,0.18)" color="rgba(245,158,11,0.25)" />
            {fill > 0 && (
              <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fill * 100}%` }}>
                <Star size={size} fill="#f59e0b" color="#f59e0b" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

export default function VendorReviews() {
  const toast = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('product')
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/reviews').then((res) => {
      const list = res.data.data?.reviews || res.data.data || []
      setReviews(Array.isArray(list) ? list : [])
    }).catch(() => setReviews([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const list = tab === 'store' ? reviews.filter((r) => r.review_type === 'store' || r.target_type === 'store') : reviews.filter((r) => r.review_type !== 'store' && r.target_type !== 'store')

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return
    setSending(true)
    try {
      await api.post(`/vendor/reviews/${replyTarget.id}/reply`, { reply: replyText })
      toast.success('Reply published')
      setReplyTarget(null)
      setReplyText('')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const reportReview = async (r) => {
    try {
      await api.post(`/vendor/reviews/${r.id}/report`)
      toast.success('Review reported')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const average = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : 0
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(Number(r.rating || 0)) === star).length,
  }))

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton height={140} />
        <Skeleton height={220} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reviews & Ratings</h1>
          <p>What customers say about your products and store</p>
        </div>
      </div>

      {/* Rating summary */}
      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'center' }}>
          <div className="text-center" style={{ padding: '8px 0' }}>
            <div className="flex items-center justify-center gap-3">
              <span style={{ fontSize: 44, fontWeight: 700 }}>{reviews.length ? average.toFixed(1) : '—'}</span>
              <span className="flex flex-col items-start gap-1">
                <Stars rating={reviews.length ? Math.round(average * 2) / 2 : 0} size={18} />
                <span className="muted text-xs">{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="muted text-xs" style={{ width: 40 }}>{d.star} star</span>
                <div className="progress" style={{ flex: 1 }}><div style={{ width: reviews.length ? `${(d.count / reviews.length) * 100}%` : 0 }} /></div>
                <span className="muted text-xs" style={{ width: 28, textAlign: 'right' }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 0 }}>
        <button className={`tab ${tab === 'product' ? 'active' : ''}`} onClick={() => setTab('product')}>Product reviews</button>
        <button className={`tab ${tab === 'store' ? 'active' : ''}`} onClick={() => setTab('store')}>Store reviews</button>
      </div>

      {!list.length ? (
        <EmptyState
          icon={tab === 'store' ? Star : Package}
          title={tab === 'store' ? 'No store reviews yet' : 'No product reviews yet'}
          message={tab === 'store' ? 'Reviews left on your store page will appear here.' : 'Customer reviews of your products will appear here.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((r) => {
            const productName = r.product?.name || r.product_name || (r.product_id ? `Product #${r.product_id}` : null)
            return (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div className="flex items-start gap-3">
                  {productName ? (
                    <img src={apiImage(r.product?.image || r.product_image, productName)} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <span className="thumb" style={{ width: 52, height: 52, borderRadius: 8 }}><Star size={22} /></span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 wrap">
                      {productName && <span className="font-medium text-sm">{productName}</span>}
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Stars rating={Number(r.rating || 0)} />
                      <span className="muted text-xs">{r.customer?.name || r.customer_name || 'Customer'} · {formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-sm" style={{ margin: 0 }}>{r.review_text || r.comment || r.review}</p>
                    {r.vendor_reply && (
                      <div className="mt-2" style={{ padding: 10, borderRadius: 8, background: 'rgba(37,99,235,0.07)', fontSize: 13 }}>
                        <span className="font-medium" style={{ color: 'var(--primary)' }}>Your reply: </span>{r.vendor_reply}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Button variant="soft" size="sm" icon={MessageSquare} onClick={() => { setReplyTarget(r); setReplyText(r.vendor_reply || '') }}>
                      Reply
                    </Button>
                    <Button variant="outline" size="sm" icon={Flag} onClick={() => reportReview(r)}>Report</Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to review" size="lg">
        {replyTarget && (
          <div className="flex flex-col gap-2">
            <div className="card" style={{ background: 'var(--surface)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={Number(replyTarget.rating || 0)} />
                <span className="muted text-xs">{replyTarget.customer?.name || replyTarget.customer_name || 'Customer'}</span>
              </div>
              <p className="text-sm" style={{ margin: 0 }}>{replyTarget.review_text || replyTarget.comment || replyTarget.review}</p>
            </div>
            <Textarea label="Your reply" rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Thank the customer and address their feedback…" />
            <Button variant="primary" icon={Check} onClick={sendReply} disabled={sending || !replyText.trim()}>
              {sending ? 'Sending…' : 'Publish reply'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
