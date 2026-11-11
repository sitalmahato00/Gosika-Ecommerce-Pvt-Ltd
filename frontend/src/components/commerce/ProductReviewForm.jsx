import React, { useEffect, useState } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import api from '../../api/client'

export default function ProductReviewForm({ productId, orderItemId, onSubmitted }) {
  const [draft, setDraft] = useState({ rating: 5, title: '', body: '' })
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const previews = photos.map((photo) => URL.createObjectURL(photo))
    setPhotoPreviews(previews)
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview))
  }, [photos])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('rating', String(draft.rating))
      if (draft.title) formData.append('title', draft.title)
      if (draft.body) formData.append('body', draft.body)
      if (orderItemId) formData.append('order_item_id', orderItemId)
      photos.forEach((photo) => formData.append('photos[]', photo))
      await api.post(`/marketplace/products/${productId}/reviews`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
      <div className="form-group">
        <label className="label" htmlFor={`review-photos-${orderItemId}`}>Photos <span className="muted">(optional, up to 5)</span></label>
        <label
          htmlFor={`review-photos-${orderItemId}`}
          className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
          style={{ cursor: 'pointer' }}
        >
          <ImagePlus size={15} /> Add photos
        </label>
        <input
          id={`review-photos-${orderItemId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.target.files || [])
            if (photos.length + selected.length > 5) {
              setError('You can attach up to 5 photos.')
            } else {
              setPhotos((current) => [...current, ...selected])
              setError('')
            }
            event.target.value = ''
          }}
          style={{ display: 'none' }}
        />
        <p className="muted text-xs" style={{ margin: '6px 0 0' }}>JPG, PNG, or WebP; maximum 5 MB per photo.</p>
        {photos.length > 0 && (
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginTop: 10 }}>
            {photoPreviews.map((preview, index) => (
              <div key={`${photos[index].name}-${index}`} style={{ position: 'relative', width: 64, height: 64 }}>
                <img src={preview} alt={`Review upload ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, display: 'grid', placeItems: 'center', border: 0, borderRadius: '50%', background: 'var(--ink)', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
