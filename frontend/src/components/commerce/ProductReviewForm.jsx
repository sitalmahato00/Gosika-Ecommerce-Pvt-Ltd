import React, { useState } from 'react'
import { Star } from 'lucide-react'
import api from '../../api/client'

export default function ProductReviewForm({ productId, orderItemId, onSubmitted }) {
  const [draft, setDraft] = useState({ rating: 5, title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/marketplace/products/${productId}/reviews`, {
        ...draft,
        order_item_id: orderItemId,
      })
      onSubmitted()
    } catch (e) {
      setError(e.response?.data?.message || 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
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
        <label className="label" htmlFor={`review-title-${orderItemId}`}>Title <span className="muted">(optional)</span></label>
        <input
          id={`review-title-${orderItemId}`}
          className="input"
          maxLength={200}
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          placeholder="Summarize your experience"
        />
      </div>
      <div className="form-group">
        <label className="label" htmlFor={`review-body-${orderItemId}`}>Your review <span className="muted">(optional)</span></label>
        <textarea
          id={`review-body-${orderItemId}`}
          className="textarea"
          rows={4}
          maxLength={2000}
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          placeholder="What did you think about this product?"
        />
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
