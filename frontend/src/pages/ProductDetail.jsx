import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Heart, Share2, Truck, ShieldCheck, RefreshCcw,
  Store, ChevronRight, CheckCircle2, AlertTriangle, Star, Eye
} from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiImage, money, formatDate, errorMessage, getProductImage, FALLBACK_PRODUCT_IMAGES } from '../utils/format'
import ProductCard, { ProductCardSkeletonMini } from '../components/commerce/ProductCard'
import RatingStars from '../components/commerce/RatingStars'
import QtyStepper from '../components/commerce/QtyStepper'
import { Skeleton } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'specs', label: 'Specifications' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'shipping', label: 'Shipping & Returns' },
]

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const { user } = useAuth()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [tab, setTab] = useState('description')
  const [imageIdx, setImageIdx] = useState(0)
  const [variantId, setVariantId] = useState(null)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setTab('description')
    setImageIdx(0)
    setVariantId(null)
    setQty(1)
    api
      .get(`/products/${id}`, { params: { load: 'images,attributes' } })
      .then((res) => {
        const p = res.data.data
        if (!alive) return
        setProduct(p)
        const def = p.variants?.find((v) => v.is_default) || p.variants?.[0]
        if (def) setVariantId(def.id)
        api.get(`/marketplace/products/${id}/reviews`).then((r) => alive && setReviews(r.data.data || [])).catch(() => {})
        const catSlug = p.category?.slug
        if (catSlug) {
          setRelatedLoading(true)
          api
            .get('/products', { params: { category: catSlug, per_page: 8, load: 'brand,store,images' } })
            .then((r) => alive && setRelated((r.data.data || []).filter((x) => x.id !== p.id)))
            .catch(() => {})
            .finally(() => alive && setRelatedLoading(false))
        }
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  const defaultImg = getProductImage(product)
  const images = product?.images?.length
    ? product.images.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : product?.primary_image
      ? [{ url: product.primary_image.url || product.primary_image }]
      : [{ url: defaultImg }, { url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80' }]
  const activeImage = images[imageIdx]?.url || defaultImg

  const variant = product?.variants?.find((v) => v.id === variantId)
  const price = variant?.price ?? product?.price
  const compareAt = variant?.compare_at_price ?? product?.compare_at_price
  const stock = variant?.stock_status || product?.stock_status
  const inStock = stock === 'in_stock' || stock === 'low_stock'
  const maxQty = Number(variant?.quantity || product?.quantity || 99)

  const handleAdd = async () => {
    if (!inStock) return
    setBusy(true)
    try {
      await addItem({ productId: product.id, variantId: variant?.id || null, quantity: qty })
      toast.success('Added to cart')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const handleWish = async () => {
    if (!user) {
      toast.info('Please login to save items to your wishlist')
      navigate('/login')
      return
    }
    await toggle(product.id)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    } catch {
      toast.info(window.location.href)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/marketplace/products/${product.id}/reviews`, reviewForm)
      toast.success('Review submitted for approval')
      setShowReviewForm(false)
      setReviewForm({ rating: 5, title: '', body: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="page-shell container">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 32 }}>
          <Skeleton height={440} style={{ borderRadius: 'var(--radius-lg)' }} />
          <div>
            <Skeleton height={28} width="70%" style={{ marginBottom: 16 }} />
            <Skeleton height={20} width="40%" style={{ marginBottom: 16 }} />
            <Skeleton height={36} width="35%" style={{ marginBottom: 16 }} />
            <Skeleton height={80} style={{ marginBottom: 16 }} />
            <Skeleton height={50} />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-shell container">
        <ErrorState message={errorMessage(error, 'Product not found.')} onRetry={() => navigate('/shop')} />
      </div>
    )
  }

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }} className="truncate">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 36,
          alignItems: 'start',
        }}
        id="product-detail-layout"
      >
        <style>{`
          @media (min-width: 900px) {
            #product-detail-layout { grid-template-columns: 460px 1fr !important; }
          }
        `}</style>

        {/* Gallery Left */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img
              src={apiImage(activeImage) || defaultImg}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
            />
            {compareAt > price && (
              <span className="discount-tag" style={{ position: 'absolute', top: 12, left: 12, fontSize: 13 }}>
                -{Math.round(((compareAt - price) / compareAt) * 100)}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="product-gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIdx(i)}
                  className={`product-thumb ${imageIdx === i ? 'active' : ''}`}
                  aria-label={`Thumbnail ${i + 1}`}
                >
                  <img src={apiImage(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Right */}
        <div>
          {/* Brand & Store */}
          <div className="flex items-center gap-2 wrap mb-1">
            {product.brand && (
              <span className="chip" style={{ fontWeight: 600 }}>{product.brand.name}</span>
            )}
            {product.store && (
              <Link to={`/store/${product.store.id}`} className="flex items-center gap-1 muted text-sm hover:text-primary">
                <Store size={14} /> Sold by <strong style={{ color: 'var(--ink)' }}>{product.store.name}</strong>
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 24, lineHeight: 1.3, margin: '8px 0 10px' }}>
            {product.name}
          </h1>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-3 wrap mb-2">
            <RatingStars value={product.rating_avg} count={product.rating_count} size={15} />
            <span className="muted text-xs">·</span>
            <span className="muted text-xs">SKU: {product.sku || 'N/A'}</span>
            <span className="muted text-xs">·</span>
            <span className="muted text-xs flex items-center gap-1"><Eye size={12} /> {product.views_count || 0} views</span>
          </div>

          {/* Price Box */}
          <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px 20px', margin: '16px 0' }}>
            <div className="flex items-baseline gap-3 wrap">
              <span className="price-current" style={{ fontSize: 28, color: 'var(--primary-darker)' }}>
                {money(price)}
              </span>
              {compareAt > price && (
                <span className="price-old" style={{ fontSize: 16 }}>{money(compareAt)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${inStock ? 'badge-in_stock' : 'badge-out_of_stock'}`}>
                {inStock ? 'In Stock · Ready to ship' : 'Out of Stock'}
              </span>
              {stock === 'low_stock' && (
                <span className="text-warning text-xs font-semibold">Only {maxQty} left!</span>
              )}
            </div>
          </div>

          {/* Variants Selector */}
          {product.variants?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="label">Variants / Options</div>
              <div className="flex gap-2 wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`pill ${variantId === v.id ? 'active' : ''}`}
                    onClick={() => setVariantId(v.id)}
                  >
                    {v.name || (v.attributes || []).map((a) => `${a.attribute}: ${a.value}`).join(', ')}
                    {v.price != null && ` (${money(v.price)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-3 wrap" style={{ margin: '20px 0' }}>
            <QtyStepper value={qty} onChange={setQty} min={1} max={Math.max(1, maxQty)} disabled={!inStock} />
            <button
              className="btn btn-primary btn-lg flex-1"
              onClick={handleAdd}
              disabled={!inStock || busy}
              style={{ minWidth: 200 }}
            >
              <ShoppingCart size={18} /> {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button className="icon-btn icon-btn-lg" onClick={handleWish} aria-label="Toggle wishlist">
              <Heart size={20} fill={isWishlisted(product.id) ? 'var(--danger)' : 'none'} color={isWishlisted(product.id) ? 'var(--danger)' : 'var(--muted)'} />
            </button>
            <button className="icon-btn icon-btn-lg" onClick={handleShare} aria-label="Share product">
              <Share2 size={19} />
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="card card-pad-none" style={{ overflow: 'hidden', marginTop: 20 }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
              <Truck size={18} color="var(--primary)" />
              <div className="text-sm">
                <strong>Nationwide Delivery</strong> — Delivered to all 77 districts in Nepal.
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <div className="text-sm">
                <strong>GOSIKA Buyer Protection</strong> — 100% genuine product guarantee.
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <RefreshCcw size={18} color="var(--warning)" />
              <div className="text-sm">
                <strong>7 Days Easy Return</strong> — Hassle-free returns on eligible items.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div style={{ marginTop: 44 }}>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'reviews' && reviews.length > 0 && <span className="tab-count">{reviews.length}</span>}
            </button>
          ))}
        </div>

        <div className="card mt-2" style={{ minHeight: 180, padding: 24 }}>
          {tab === 'description' && (
            <div>
              {product.short_description && <p className="font-semibold" style={{ fontSize: 15 }}>{product.short_description}</p>}
              <p className="muted" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{product.description || 'No detailed description provided for this product.'}</p>
            </div>
          )}

          {tab === 'specs' && (
            <table className="table" style={{ minWidth: 0 }}>
              <tbody>
                {[
                  ['Brand', product.brand?.name || 'Generic / Unbranded'],
                  ['SKU', product.sku || '—'],
                  ['Weight', product.weight_grams ? `${product.weight_grams} g` : '—'],
                  ['Dimensions', product.dimensions || '—'],
                  ['Availability', inStock ? 'In Stock' : 'Out of Stock'],
                  ['Stock Quantity', maxQty],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontWeight: 600, background: 'var(--bg)', width: 200 }}>{k}</td>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-3 wrap">
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink)' }}>{(Number(product.rating_avg) || 0).toFixed(1)}</span>
                  <div>
                    <RatingStars value={product.rating_avg} size={18} showValue={false} />
                    <div className="muted text-sm mt-1">{product.rating_count || reviews.length} customer review{reviews.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                {user ? (
                  <button className="btn btn-outline btn-sm" onClick={() => setShowReviewForm((s) => !s)}>
                    {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-ghost btn-sm">Login to write a review</Link>
                )}
              </div>

              {showReviewForm && (
                <form className="card mb-3" onSubmit={submitReview} style={{ background: 'var(--bg)' }}>
                  <h4 style={{ fontSize: 15, marginBottom: 12 }}>Write your review</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => setReviewForm((f) => ({ ...f, rating: r }))}
                            aria-label={`${r} stars`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                          >
                            <Star size={22} color={r <= reviewForm.rating ? '#f59e0b' : '#cbd5e1'} fill={r <= reviewForm.rating ? '#f59e0b' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="label">Headline</label>
                      <input className="input" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Excellent quality, fast shipping!" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Your review</label>
                    <textarea className="textarea" rows={3} value={reviewForm.body} onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))} placeholder="Tell other shoppers what you liked or disliked about this product…" required />
                  </div>
                  <button className="btn btn-primary btn-sm">Submit Review</button>
                </form>
              )}

              {reviews.length ? (
                <div className="flex flex-col gap-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="card" style={{ padding: 16 }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{(r.user?.name || 'C')[0].toUpperCase()}</span>
                          <div>
                            <div className="font-semibold text-sm">{r.user?.name || 'Verified Buyer'}</div>
                            <span className="muted text-xs">{formatDate(r.created_at)}</span>
                          </div>
                        </div>
                        <RatingStars value={r.rating} size={14} showValue={false} />
                      </div>
                      {r.title && <div className="font-semibold mt-2" style={{ fontSize: 14 }}>{r.title}</div>}
                      {r.body && <p className="muted m-0 mt-1" style={{ fontSize: 13.5 }}>{r.body}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No reviews yet" message="Be the first to review this product and help others choose." />
              )}
            </div>
          )}

          {tab === 'shipping' && (
            <div className="flex flex-col gap-4">
              {[
                { icon: Truck, t: 'Nationwide Delivery Across Nepal', d: 'We partner with leading local courier services to deliver across all 7 provinces. Typical delivery takes 2 to 5 business days.' },
                { icon: ShieldCheck, t: 'GOSIKA Buyer Protection', d: 'Every purchase on GOSIKA is protected. If your product is damaged or not as described, get a full replacement or refund.' },
                { icon: RefreshCcw, t: '7-Day Return Policy', d: 'Return items within 7 days of delivery for a prompt refund. Items must be in original condition with packaging.' },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3">
                  <span className="avatar" style={{ width: 42, height: 42, background: 'var(--primary-50)', color: 'var(--primary)' }}><f.icon size={20} /></span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 14 }}>{f.t}</div>
                    <div className="muted text-sm mt-1">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedLoading ? (
        <div className="product-grid" style={{ marginTop: 40 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeletonMini key={i} />
          ))}
        </div>
      ) : related.length > 0 ? (
        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Related Products</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Sticky Mobile Add To Cart Bar */}
      <div className="sticky-add-bar">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="truncate font-semibold text-sm">{product.name}</div>
          <div className="price-current" style={{ fontSize: 16, color: 'var(--primary)' }}>{money(price)}</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!inStock || busy}
          style={{ padding: '8px 20px' }}
        >
          <ShoppingCart size={16} /> {inStock ? 'Add' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}
