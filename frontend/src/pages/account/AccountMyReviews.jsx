import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, MessageCircleReply, Star, ShoppingBag } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { apiImage, formatDate, getProductImage, handleImgError } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountMyReviews() {
  const [reviews, setReviews] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeReviewId, setActiveReviewId] = useState(null)
  const [draft, setDraft] = useState({ rating: 5, title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/customer/reviews', { params: { per_page: 50 } }),
      api.get('/customer/reviews/pending', { params: { per_page: 50 } }),
    ])
      .then(([reviewsResponse, pendingResponse]) => {
        const reviewsData = reviewsResponse.data?.data?.data ?? reviewsResponse.data?.data ?? reviewsResponse.data
        const pendingData = pendingResponse.data?.data?.data ?? pendingResponse.data?.data ?? pendingResponse.data
        setReviews(Array.isArray(reviewsData) ? reviewsData : [])
        setPendingReviews(Array.isArray(pendingData) ? pendingData : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const startReview = (item) => {
    setActiveReviewId(item.id)
    setDraft({ rating: 5, title: '', body: '' })
    setSubmitError('')
  }

  const submitReview = async (event, item) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.post(`/marketplace/products/${item.product_id}/reviews`, {
        ...draft,
        order_item_id: item.id,
      })
      setActiveReviewId(null)
      load()
    } catch (e) {
      setSubmitError(e.response?.data?.message || 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AccountPage title="My Reviews" subtitle="Everything you have shared with the community.">
        <AccountSkeleton rows={3} height={96} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="My Reviews" subtitle="Everything you have shared with the community.">
        <AccountError message="Could not load your reviews." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="My Reviews" subtitle="Review delivered purchases and see the feedback you have shared.">
      {reviews.length === 0 && pendingReviews.length === 0 ? (
        <AccountEmpty
          icon={MessageSquare}
          title="No reviews yet"
          message="Reviews become available here after your order has been delivered."
          action={<Link to="/shop" className="btn btn-primary"><ShoppingBag size={16} /> Browse Products</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {pendingReviews.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>Ready to review</h2>
                <p className="muted text-sm" style={{ margin: '4px 0 0' }}>Share your experience with products from delivered orders.</p>
              </div>
              {pendingReviews.map((item) => (
                <article key={item.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                  <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <img
                        src={item.image ? apiImage(item.image) : getProductImage(null)}
                        alt={item.product_name || 'Product'}
                        onError={handleImgError}
                        style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        {item.product_id ? (
                          <Link to={`/product/${item.product_id}`} className="font-semibold" style={{ display: 'block', fontSize: 14, color: 'var(--ink)', textDecoration: 'none' }}>
                            {item.product_name || 'Purchased product'}
                          </Link>
                        ) : (
                          <div className="font-semibold" style={{ fontSize: 14 }}>{item.product_name || 'Purchased product'}</div>
                        )}
                        <div className="muted text-xs" style={{ marginTop: 4 }}>
                          Order #{item.order_number || item.order_id} · {formatDate(item.placed_at)}
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => activeReviewId === item.id ? setActiveReviewId(null) : startReview(item)}>
                      {activeReviewId === item.id ? 'Cancel' : 'Write a review'}
                    </button>
                  </div>
                  {activeReviewId === item.id && (
                    <form onSubmit={(event) => submitReview(event, item)} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                      <label className="label">Your rating</label>
                      <div className="flex items-center gap-1" style={{ marginBottom: 14 }}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                            aria-pressed={draft.rating === rating}
                            onClick={() => setDraft((current) => ({ ...current, rating }))}
                            style={{ border: 0, background: 'transparent', padding: 4, color: rating <= draft.rating ? '#f59e0b' : '#cbd5e1', cursor: 'pointer' }}
                          >
                            <Star size={24} fill={rating <= draft.rating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className="label" htmlFor={`review-title-${item.id}`}>Title <span className="muted">(optional)</span></label>
                        <input
                          id={`review-title-${item.id}`}
                          className="input"
                          maxLength={200}
                          value={draft.title}
                          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                          placeholder="Summarize your experience"
                        />
                      </div>
                      <div className="form-group">
                        <label className="label" htmlFor={`review-body-${item.id}`}>Your review <span className="muted">(optional)</span></label>
                        <textarea
                          id={`review-body-${item.id}`}
                          className="textarea"
                          rows={4}
                          maxLength={2000}
                          value={draft.body}
                          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                          placeholder="What did you think about this product?"
                        />
                      </div>
                      {submitError && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{submitError}</p>}
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit review'}
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </section>
          )}

          {reviews.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>Your reviews</h2>
              {reviews.map((r) => (
                <article key={r.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                  <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      {r.image && (
                        <img src={apiImage(r.image)} alt="" onError={handleImgError} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div className="font-semibold" style={{ fontSize: 14 }}>{r.product_name}</div>
                        <div className="muted text-xs">{formatDate(r.created_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rating-stars" aria-label={`Rated ${r.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={15} fill={i <= r.rating ? 'currentColor' : 'none'} color={i <= r.rating ? '#f59e0b' : '#cbd5e1'} />
                        ))}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  {r.title && <div className="font-semibold" style={{ fontSize: 14 }}>{r.title}</div>}
                  {r.body && <p className="m-0" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{r.body}</p>}
                  {r.reply && (
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
                      <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--primary)', marginBottom: 4 }}>
                        <MessageCircleReply size={13} /> Seller / Marketplace reply
                      </span>
                      <div>{r.reply}</div>
                    </div>
                  )}
                  {r.product_id && <Link to={`/product/${r.product_id}`} className="text-primary text-sm" style={{ fontWeight: 700, textDecoration: 'none' }}>View product</Link>}
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </AccountPage>
  )
}