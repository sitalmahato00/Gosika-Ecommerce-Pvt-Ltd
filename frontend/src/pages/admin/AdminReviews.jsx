import React, { useState } from 'react'
import { Star, Search, Eye, Trash2, CheckCircle2, EyeOff, AlertTriangle, MessageSquare } from 'lucide-react'
import RatingStars from '../../components/commerce/RatingStars'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_REVIEWS = [
  { id: 1, type: 'product', target: 'Pashmina Pure Cashmere Shawl', customer: 'Aarav Shrestha', rating: 5, title: 'Outstanding warmth and feel', body: 'The authentic Nepali craft quality is noticeable immediately. Very satisfied!', status: 'published', date: '2026-08-15' },
  { id: 2, type: 'product', target: 'Wireless ANC Earbuds', customer: 'Deepak KC', rating: 1, title: 'Stopped working in 2 days', body: 'Battery drained completely and now will not turn back on.', status: 'reported', date: '2026-08-14' },
  { id: 3, type: 'vendor', target: 'Kathmandu Handicrafts', customer: 'Sita Sharma', rating: 5, title: 'Super fast delivery to Pokhara', body: 'Seller dispatched within 2 hours of ordering. Great packaging!', status: 'published', date: '2026-08-13' },
  { id: 4, type: 'product', target: 'Organic Herbal Tea (500g)', customer: 'Pooja Thapa', rating: 4, title: 'Very aromatic and fresh', body: 'Good packaging, taste is authentic Ilam tea.', status: 'published', date: '2026-08-12' },
  { id: 5, type: 'vendor', target: 'Everest Apparel', customer: 'Rohan Tamang', rating: 2, title: 'Delayed shipment', body: 'Took over 6 days just to dispatch from warehouse.', status: 'hidden', date: '2026-08-10' },
]

export default function AdminReviews() {
  const toast = useToast()
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const toggleStatus = (id, newStatus) => {
    setReviews(reviews.map((r) => r.id === id ? { ...r, status: newStatus } : r))
    toast.success(`Review status changed to ${newStatus}`)
  }

  const deleteReview = (id) => {
    setReviews(reviews.filter((r) => r.id !== id))
    toast.success('Review deleted')
  }

  const filtered = reviews.filter((r) => {
    const matchesType = !typeFilter || r.type === typeFilter
    const matchesStatus = !statusFilter || r.status === statusFilter
    const matchesSearch = !search ||
      r.target.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.body.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customer Reviews & Ratings</h1>
          <p>Moderate product and vendor reviews across the marketplace</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {[
          { value: '', label: 'All Reviews' },
          { value: 'product', label: 'Product Reviews' },
          { value: 'vendor', label: 'Vendor Reviews' },
        ].map((t) => (
          <button
            key={t.value}
            className={`tab ${typeFilter === t.value ? 'active' : ''}`}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search reviews by item or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'published', 'reported', 'hidden'].map((st) => (
            <button
              key={st}
              className={`pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === '' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((r) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between mb-2 wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`chip chip-sm ${r.type === 'vendor' ? 'chip-navy' : ''}`} style={{ textTransform: 'capitalize' }}>
                  {r.type}
                </span>
                <span className="font-bold text-sm text-ink">{r.target}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="muted text-xs">{formatDate(r.date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <RatingStars value={r.rating} size={14} showValue={false} />
              <span className="font-semibold text-sm">{r.title}</span>
              <span className="muted text-xs">by {r.customer}</span>
            </div>

            <p className="muted text-sm m-0 mb-3" style={{ lineHeight: 1.6 }}>{r.body}</p>

            <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {r.status !== 'published' && (
                <button
                  className="btn btn-success btn-xs"
                  onClick={() => toggleStatus(r.id, 'published')}
                >
                  <CheckCircle2 size={12} /> Approve & Publish
                </button>
              )}
              {r.status !== 'hidden' && (
                <button
                  className="btn btn-outline btn-xs"
                  onClick={() => toggleStatus(r.id, 'hidden')}
                >
                  <EyeOff size={12} /> Hide Review
                </button>
              )}
              <button
                className="btn btn-danger-outline btn-xs"
                onClick={() => deleteReview(r.id)}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
