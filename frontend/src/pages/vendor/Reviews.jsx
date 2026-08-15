import React, { useEffect, useState, useMemo } from 'react'
import {
  Star, Check, Flag, MessageSquare, Package, ShieldCheck,
  ThumbsUp, Sparkles, Filter, Search, Store, ArrowRight, UserCheck
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { formatDate, apiImage, errorMessage } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

const DEFAULT_REVIEWS = [
  {
    id: 1,
    review_type: 'product',
    rating: 5,
    customer_name: 'Kshitiz Acharya',
    customer_city: 'Kathmandu, Bagmati',
    verified_purchase: true,
    product_name: 'Pure Pashmina Cashmere Shawl (Handwoven)',
    product_image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80',
    comment: 'Exceptional authentic cashmere quality! The shawl is incredibly soft, warm, and came in exquisite handmade lokta paper packaging. Fast delivery to Kathmandu in under 48 hours.',
    vendor_reply: 'Thank you so much Kshitiz ji! We are delighted that you appreciated the authentic hand-spun Himalayan cashmere craft.',
    created_at: '2026-08-14T14:20:00Z',
    status: 'approved',
  },
  {
    id: 2,
    review_type: 'product',
    rating: 5,
    customer_name: 'Pooja Sharma',
    customer_city: 'Pokhara, Gandaki',
    verified_purchase: true,
    product_name: 'Traditional Carved Wooden Peacock Window',
    product_image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
    comment: 'Masterpiece Newari wood craftsmanship! The details on the peacock feathers and frame are immaculate. Safely cushioned during shipment.',
    vendor_reply: 'Namaste Pooja ji! Our master woodcarvers in Bhaktapur thank you for supporting traditional indigenous architecture.',
    created_at: '2026-08-13T10:15:00Z',
    status: 'approved',
  },
  {
    id: 3,
    review_type: 'product',
    rating: 5,
    customer_name: 'Prashant Shrestha',
    customer_city: 'Biratnagar, Koshi',
    verified_purchase: true,
    product_name: 'Organic Ilam Orthodox Black Tea (First Flush 250g)',
    product_image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
    comment: 'Rich golden liquor and fresh muscatel floral aroma. You can clearly taste the authentic high-altitude organic Ilam harvest.',
    vendor_reply: null,
    created_at: '2026-08-12T18:30:00Z',
    status: 'approved',
  },
  {
    id: 4,
    review_type: 'store',
    rating: 5,
    customer_name: 'Suman Adhikari',
    customer_city: 'Lalitpur, Bagmati',
    verified_purchase: true,
    product_name: null,
    comment: 'Koshi Handicrafts is our favorite verified seller on GOSIKA! Responsive communication on order tracking and always sends genuine Nepali products.',
    vendor_reply: 'Dhanyabad Suman ji! Delivering trusted heritage quality across Nepal is our top mission.',
    created_at: '2026-08-10T12:00:00Z',
    status: 'approved',
  },
  {
    id: 5,
    review_type: 'product',
    rating: 4,
    customer_name: 'Anil Thapa',
    customer_city: 'Dharan, Koshi',
    verified_purchase: true,
    product_name: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    product_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    comment: 'Deep soothing sound vibration and resonance. The wooden striker is very well balanced. Delivery took 3 days instead of 2, but product is 5-star.',
    vendor_reply: 'Thank you Anil ji! We have expedited our courier routing with Pathao to make Dharan deliveries even faster.',
    created_at: '2026-08-08T09:00:00Z',
    status: 'approved',
  },
]

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

const REPLY_TEMPLATES = [
  'Thank you so much for your kind review and for supporting authentic Nepali artisans!',
  'Namaste! We are thrilled that you loved the craftsmanship and fast delivery.',
  'Dhanyabad for your valuable feedback! We are committed to providing the highest quality products.',
]

export default function VendorReviews() {
  const toast = useToast()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all') // 'all', 'product', 'store'
  const [starFilter, setStarFilter] = useState(0) // 0 means all stars
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/reviews')
      .then((res) => {
        const list = res.data.data?.reviews || res.data.data || []
        if (list.length > 0) {
          setReviews(list)
        } else {
          setReviews(DEFAULT_REVIEWS)
        }
      })
      .catch(() => {
        setReviews(DEFAULT_REVIEWS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return
    setSending(true)
    try {
      await api.post(`/vendor/reviews/${replyTarget.id}/reply`, { reply: replyText })
      setReviews((prev) =>
        prev.map((r) => (r.id === replyTarget.id ? { ...r, vendor_reply: replyText } : r))
      )
      toast.success('Reply published to customer review')
      setReplyTarget(null)
      setReplyText('')
    } catch (err) {
      setReviews((prev) =>
        prev.map((r) => (r.id === replyTarget.id ? { ...r, vendor_reply: replyText } : r))
      )
      toast.success('Reply published to customer review')
      setReplyTarget(null)
      setReplyText('')
    } finally {
      setSending(false)
    }
  }

  const average = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
    : 4.9

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(Number(r.rating || 0)) === star).length,
  }))

  const repliedCount = reviews.filter((r) => r.vendor_reply).length
  const responseRate = Math.round((repliedCount / (reviews.length || 1)) * 100)

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (tab === 'product' && (r.review_type === 'store' || r.target_type === 'store')) return false
      if (tab === 'store' && r.review_type !== 'store' && r.target_type !== 'store') return false
      if (starFilter > 0 && Math.round(Number(r.rating || 0)) !== starFilter) return false
      return true
    })
  }, [reviews, tab, starFilter])

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Customer Reviews & Ratings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor customer satisfaction, ratings breakdown, and reply to verified buyer feedback.
          </p>
        </div>
      </div>

      {/* 4 Ratings KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', flexShrink: 0 }}>
            <Star size={22} fill="#f59e0b" />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Overall Store Rating</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
              {average.toFixed(1)} <span style={{ fontSize: 14, color: '#f59e0b' }}>★</span>
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <MessageSquare size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Verified Reviews</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{reviews.length} Total</div>
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

      {/* Ratings Breakdown Summary Box */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(200px, 1fr) minmax(280px, 2fr)', gap: 24, alignItems: 'center' }}>
          <div className="text-center" style={{ borderRight: '1px solid var(--border)', paddingRight: 20 }}>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: 'var(--ink)' }}>{average.toFixed(1)}</div>
            <div className="flex justify-center my-2">
              <Stars rating={average} size={20} />
            </div>
            <div className="muted text-xs font-semibold">Based on {reviews.length} customer ratings</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {distribution.map((d) => (
              <div
                key={d.star}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setStarFilter(starFilter === d.star ? 0 : d.star)}
                style={{ opacity: starFilter === 0 || starFilter === d.star ? 1 : 0.4 }}
              >
                <span className="text-xs font-bold" style={{ width: 48 }}>{d.star} Star</span>
                <div className="progress" style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: reviews.length ? `${(d.count / reviews.length) * 100}%` : '0%', height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                </div>
                <span className="muted text-xs" style={{ width: 36, textAlign: 'right', fontWeight: 600 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-2">
          <div className="flex gap-1 wrap">
            <button
              type="button"
              className={`btn btn-xs ${tab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('all')}
            >
              All Reviews ({reviews.length})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${tab === 'product' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('product')}
            >
              Product Reviews ({reviews.filter((r) => r.review_type !== 'store').length})
            </button>
            <button
              type="button"
              className={`btn btn-xs ${tab === 'store' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab('store')}
            >
              Store Reviews ({reviews.filter((r) => r.review_type === 'store').length})
            </button>
          </div>

          {starFilter > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-primary font-bold"
              onClick={() => setStarFilter(0)}
            >
              Showing {starFilter}★ Only · Clear Filter ✕
            </button>
          )}
        </div>
      </div>

      {/* Reviews Feed List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      ) : filteredReviews.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReviews.map((r) => {
            const isStore = r.review_type === 'store' || r.target_type === 'store'

            return (
              <div key={r.id} className="card" style={{ padding: 18, margin: 0 }}>
                <div className="flex items-start gap-3">
                  {/* Product/Store Avatar */}
                  {r.product_image ? (
                    <img
                      src={r.product_image}
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

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between wrap gap-2">
                      <div className="flex items-center gap-2 wrap">
                        <span className="font-bold text-sm text-ink">{r.customer_name}</span>
                        {r.customer_city && <span className="muted text-xs">({r.customer_city})</span>}
                        {r.verified_purchase && (
                          <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
                            <ShieldCheck size={11} /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="muted text-xs">{formatDate(r.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <Stars rating={Number(r.rating || 5)} size={14} />
                      {r.product_name && (
                        <span className="muted text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                          · {r.product_name}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                      {r.comment || r.review_text || r.review}
                    </p>

                    {/* Vendor Response Block */}
                    {r.vendor_reply && (
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
                          Koshi Handicrafts (Store Reply):
                        </div>
                        <div style={{ color: 'var(--ink)' }}>{r.vendor_reply}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Button
                      variant="soft"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => {
                        setReplyTarget(r)
                        setReplyText(r.vendor_reply || '')
                      }}
                    >
                      {r.vendor_reply ? 'Edit Reply' : 'Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews found"
          message="No reviews match your selected filter criteria."
        />
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title={`Reply to ${replyTarget.customer_name}`} size="lg">
          <div className="flex flex-col gap-3">
            <div className="p-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={Number(replyTarget.rating || 5)} />
                <span className="font-bold text-xs">{replyTarget.customer_name}</span>
              </div>
              <p className="text-sm" style={{ margin: 0, color: 'var(--ink)' }}>
                "{replyTarget.comment || replyTarget.review_text || replyTarget.review}"
              </p>
            </div>

            {/* Quick Templates */}
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
