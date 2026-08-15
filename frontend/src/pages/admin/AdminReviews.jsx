import React, { useState, useMemo } from 'react'
import {
  Star, Search, Eye, Trash2, CheckCircle2, EyeOff, AlertTriangle,
  MessageSquare, Award, ShieldCheck, ThumbsUp, Filter, MapPin,
  Check, User, CornerDownRight, Flag
} from 'lucide-react'
import RatingStars from '../../components/commerce/RatingStars'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_REVIEWS = [
  {
    id: 1,
    type: 'product',
    target: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    customer: 'Aarav Shrestha',
    location: 'Kathmandu, Bagmati',
    rating: 5,
    title: 'Outstanding warmth, authentic Himalayan Cashmere',
    body: 'The authentic Nepali craft quality is noticeable immediately. Lightweight yet provides unmatched warmth. Very satisfied with Koshi Handicrafts!',
    status: 'published',
    verified_buyer: true,
    date: '2026-08-15',
    admin_note: 'Verified with Order #ORD-2026-98101',
  },
  {
    id: 2,
    type: 'product',
    target: 'Handcrafted Tibetan Singing Bowl (7 Sacred Metals)',
    customer: 'Dr. Maya Karki',
    location: 'Patan, Bagmati',
    rating: 5,
    title: 'Deep harmonic resonance and acoustic clarity',
    body: 'The sustaining vibration and handmade acoustic chime is extraordinary for meditation sessions. Shipped with fragile packaging and rosewood striker.',
    status: 'published',
    verified_buyer: true,
    date: '2026-08-14',
    admin_note: 'Quality approved by Lalitpur Artisan Desk',
  },
  {
    id: 3,
    type: 'vendor',
    target: 'Koshi Handicrafts Pvt. Ltd.',
    customer: 'Sita Sharma',
    location: 'Pokhara, Gandaki',
    rating: 5,
    title: 'Super fast delivery to Pokhara Lakeside',
    body: 'Seller dispatched within 2 hours of order placement. Received via Pathao courier in flawless condition with authentic craft certification.',
    status: 'published',
    verified_buyer: true,
    date: '2026-08-13',
    admin_note: '5-star vendor SLA compliance',
  },
  {
    id: 4,
    type: 'product',
    target: 'Organic Ilam Orthodox Black Tea (500g Tin)',
    customer: 'Pooja Thapa',
    location: 'Biratnagar, Koshi',
    rating: 4,
    title: 'Very aromatic and fresh first-flush leaves',
    body: 'Good airtight tin packaging, aroma and golden liquor taste is authentic Ilam tea. Would appreciate faster delivery to Morang district.',
    status: 'published',
    verified_buyer: true,
    date: '2026-08-12',
    admin_note: null,
  },
  {
    id: 5,
    type: 'product',
    target: 'Traditional Carved Wooden Peacock Window',
    customer: 'Bikash Gurung',
    location: 'Butwal, Lumbini',
    rating: 5,
    title: 'Exquisite Bhaktapur Newari Woodcarving',
    body: 'Masterpiece craftsmanship! Installed at our entrance lobby and everyone compliments the intricate feather carvings.',
    status: 'published',
    verified_buyer: true,
    date: '2026-08-11',
    admin_note: null,
  },
  {
    id: 6,
    type: 'vendor',
    target: 'Eastern Dhaka Textile Works',
    customer: 'Rohan Tamang',
    location: 'Dharan, Koshi',
    rating: 2,
    title: 'Delayed courier dispatch by 3 days',
    body: 'The saree quality is good, but seller took over 3 business days to pack and hand over parcel to Pathao rider.',
    status: 'reported',
    verified_buyer: true,
    date: '2026-08-10',
    admin_note: 'Vendor notified regarding dispatch SLA bottleneck',
  },
]

export default function AdminReviews() {
  const toast = useToast()
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [starFilter, setStarFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedReview, setSelectedReview] = useState(null)

  const toggleStatus = (id, newStatus) => {
    setReviews(reviews.map((r) => r.id === id ? { ...r, status: newStatus } : r))
    toast.success(`Review marked as "${newStatus}"`)
  }

  const deleteReview = (id) => {
    if (!window.confirm('Permanently delete this customer review?')) return
    setReviews(reviews.filter((r) => r.id !== id))
    toast.success('Review deleted')
  }

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false
      if (statusFilter && r.status !== statusFilter) return false
      if (starFilter && r.rating !== starFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchTarget = (r.target || '').toLowerCase().includes(q)
        const matchCust = (r.customer || '').toLowerCase().includes(q)
        const matchBody = (r.body || '').toLowerCase().includes(q)
        if (!matchTarget && !matchCust && !matchBody) return false
      }
      return true
    })
  }, [reviews, typeFilter, statusFilter, starFilter, search])

  // Aggregate metrics
  const totalReviews = reviews.length
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(2)
  const fiveStarsCount = reviews.filter((r) => r.rating === 5).length
  const reportedCount = reviews.filter((r) => r.status === 'reported').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
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

      {/* 4 KPI Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Marketplace Reviews</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <MessageSquare size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalReviews} Reviews</div>
          <div className="muted text-xs mt-1">100% verified buyers</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Average Rating</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Star size={18} fill="#f59e0b" />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{avgRating} ★ (Excellent)</div>
          <div className="muted text-xs mt-1">High customer satisfaction</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>5-Star Praise</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ThumbsUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>
            {((fiveStarsCount / totalReviews) * 100).toFixed(1)}%
          </div>
          <div className="muted text-xs mt-1">{fiveStarsCount} perfect score reviews</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: reportedCount > 0 ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: reportedCount > 0 ? '#991b1b' : 'var(--muted)' }}>Reported / Flagged</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Flag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: reportedCount > 0 ? '#ef4444' : 'var(--ink)' }}>
            {reportedCount} Flagged
          </div>
          <div className="muted text-xs mt-1">Awaiting admin decision</div>
        </div>
      </div>

      {/* Review Type Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Reviews (${reviews.length})` },
          { value: 'product', label: `Product Reviews (${reviews.filter(r => r.type === 'product').length})` },
          { value: 'vendor', label: `Vendor Store Reviews (${reviews.filter(r => r.type === 'vendor').length})` },
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

      {/* Filter Row */}
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

        {/* Status Pills */}
        <div className="flex gap-1 wrap">
          {['', 'published', 'reported', 'hidden'].map((st) => (
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

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{
              padding: 18,
              margin: 0,
              border: r.status === 'reported' ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
            }}
          >
            {/* Top Review Metadata */}
            <div className="flex items-center justify-between wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="chip chip-sm"
                  style={{
                    background: r.type === 'vendor' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                    color: r.type === 'vendor' ? '#6366f1' : '#2563eb',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontSize: 10,
                  }}
                >
                  {r.type === 'vendor' ? 'Vendor Review' : 'Product Review'}
                </span>
                <span className="font-bold text-sm text-ink">{r.target}</span>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <span className="muted text-xs">{formatDate(r.date)}</span>
              </div>
            </div>

            {/* Stars, Title & Author */}
            <div className="flex items-center gap-2 mb-2 wrap">
              <RatingStars value={r.rating} size={15} showValue={false} />
              <span className="font-bold text-sm text-ink">{r.title}</span>
              <span className="muted text-xs">· by <strong>{r.customer}</strong></span>
              <span className="muted text-xs flex items-center gap-0.5">
                <MapPin size={10} /> ({r.location})
              </span>
              {r.verified_buyer && (
                <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                  <Check size={10} /> Verified Purchase
                </span>
              )}
            </div>

            {/* Review Body */}
            <p className="text-sm text-ink" style={{ lineHeight: 1.5, margin: '0 0 10px' }}>
              "{r.body}"
            </p>

            {/* Internal Admin Note if present */}
            {r.admin_note && (
              <div className="p-2 mb-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--muted)' }}>
                <span className="font-bold text-ink">Admin Audit Note:</span> {r.admin_note}
              </div>
            )}

            {/* Moderation Controls */}
            <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {r.status !== 'published' && (
                <button
                  type="button"
                  className="btn btn-primary btn-xs flex items-center gap-1"
                  onClick={() => toggleStatus(r.id, 'published')}
                >
                  <CheckCircle2 size={12} /> Approve & Publish
                </button>
              )}
              {r.status !== 'hidden' && (
                <button
                  type="button"
                  className="btn btn-outline btn-xs flex items-center gap-1"
                  onClick={() => toggleStatus(r.id, 'hidden')}
                >
                  <EyeOff size={12} /> Hide from Store
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger-outline btn-xs flex items-center gap-1"
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
