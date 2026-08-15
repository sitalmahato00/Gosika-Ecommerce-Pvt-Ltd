import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, ShieldCheck, BadgeCheck, Headphones, ArrowRight,
  Sparkles, Clock, Flame, Star, Package, ChevronRight, Zap,
  MapPin, Shield, Award, CreditCard, Banknote, Wallet, Smartphone,
  Store, Shirt, Utensils, Home as HomeIcon, BookOpen, Trophy,
  Heart, Gamepad2, Laptop, ShoppingBag, Eye
} from 'lucide-react'
import api from '../api/client'
import ProductCard, { ProductCardSkeletonMini } from '../components/commerce/ProductCard'
import SectionHeader from '../components/commerce/SectionHeader'
import ProductQuickView from '../components/commerce/ProductQuickView'
import { apiImage, getStoreImage } from '../utils/format'

function useProducts(params, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .get('/products', { params })
      .then((res) => alive && setData(res.data.data || []))
      .catch(() => alive && setData([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, deps)
  return { data, loading }
}

const HERO_SLIDES = [
  {
    title: 'Everything You Need,\nDelivered Across Nepal',
    subtitle: 'Shop products from thousands of trusted vendors — from Koshi to Sudurpashchim, delivered to your doorstep.',
    cta: 'Shop Now',
    ctaTo: '/shop',
    cta2: 'Explore Deals',
    cta2To: '/shop?filter=deals',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=70',
    badge: "Nepal's Trusted Marketplace",
  },
  {
    title: 'Genuine Products.\nTrusted Local Sellers.',
    subtitle: 'Every vendor is KYC-verified. Every purchase is backed by Gosika buyer protection.',
    cta: 'Browse Stores',
    ctaTo: '/shop?mode=stores',
    cta2: 'View All Products',
    cta2To: '/shop',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=70',
    badge: 'Verified Sellers Only',
  },
  {
    title: 'Fast Delivery.\nCash on Delivery Available.',
    subtitle: 'Free delivery on orders over Rs. 2,000. Pay by cash, Khalti, eSewa or Fonepay.',
    cta: 'Start Shopping',
    ctaTo: '/shop',
    cta2: 'New Arrivals',
    cta2To: '/shop?sort=newest',
    image: 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=1200&q=70',
    badge: 'Multiple Payment Options',
  },
]

import { getCategoryIcon } from '../utils/icons'

const WHY_GOSIKA = [
  { icon: BadgeCheck, color: 'blue', title: 'Verified Vendors', desc: 'All sellers are KYC-verified before they can list products.' },
  { icon: ShieldCheck, color: 'green', title: 'Buyer Protection', desc: 'Secure payments and easy returns on every order.' },
  { icon: Truck, color: 'purple', title: 'Nationwide Delivery', desc: 'Delivering to all 77 districts across Nepal.' },
  { icon: CreditCard, color: 'amber', title: 'Flexible Payments', desc: 'COD, Khalti, eSewa, Fonepay — pay your way.' },
  { icon: Headphones, color: 'blue', title: '24/7 Support', desc: 'Our team is here to help you, any time.' },
  { icon: Award, color: 'green', title: 'Quality Assured', desc: 'Products reviewed and quality-checked by our team.' },
]

export default function Home() {
  const [slide, setSlide] = useState(0)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const featured = useProducts({ is_featured: true, per_page: 10 }, [])
  const newest = useProducts({ sort: 'newest', per_page: 10 }, [])
  const topRated = useProducts({ sort: 'top', per_page: 10 }, [])
  const deals = useProducts({ discount: true, per_page: 10 }, [])
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(true)
  const [quickView, setQuickView] = useState(null)

  useEffect(() => {
    api.get('/categories', { params: { per_page: 12 } })
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false))
    api.get('/marketplace/stores', { params: { per_page: 8 } })
      .then((r) => setStores(r.data.data || []))
      .catch(() => {})
      .finally(() => setStoresLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const active = HERO_SLIDES[slide]

  return (
    <div>
      {/* ==================== HERO ==================== */}
      <section className="hero-section" aria-label="Featured promotions">
        <div className="container hero-content">
          {/* Text */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span className="chip chip-navy" style={{ marginBottom: 16, display: 'inline-flex' }}>
              <Sparkles size={13} /> {active.badge}
            </span>
            <h1 className="hero-title">{active.title}</h1>
            <p className="hero-subtitle">{active.subtitle}</p>
            <div className="hero-actions">
              <Link to={active.ctaTo} className="btn btn-primary btn-lg">
                {active.cta} <ArrowRight size={17} />
              </Link>
              <Link
                to={active.cta2To}
                className="btn btn-lg"
                style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              >
                {active.cta2}
              </Link>
            </div>
            <div className="hero-trust">
              <span><Truck size={14} /> Nationwide delivery</span>
              <span><BadgeCheck size={14} /> Verified sellers</span>
              <span><ShieldCheck size={14} /> Buyer protection</span>
            </div>
          </div>

          {/* Image */}
          <div className="hide-sm">
            <img
              src={active.image}
              alt=""
              className="hero-img"
              loading="eager"
            />
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="hero-dots" role="tablist" aria-label="Slide indicators">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === slide ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === slide}
            />
          ))}
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      <section className="container section-tight" aria-label="Product categories">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/shop" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>
        {categoriesLoading ? (
          <div className="category-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="category-grid">
            {categories.map((c, i) => {
              const IconComp = getCategoryIcon(c, i)
              return (
                <Link
                  key={c.id}
                  to={`/shop?category=${c.slug}`}
                  className="category-card"
                  aria-label={`Browse ${c.name}`}
                >
                  <span className="cat-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={22} color="var(--primary)" />
                  </span>
                  <span className="cat-name">{c.name}</span>
                  {c.products_count > 0 && (
                    <span className="cat-count">{c.products_count} items</span>
                  )}
                </Link>
              )
            })}
          </div>
        ) : null}
      </section>

      {/* ==================== FLASH DEALS ==================== */}
      <section className="container section" aria-label="Today's deals">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Flame size={20} color="var(--danger)" /> Today's Deals
            </span>
          }
          subtitle="Handpicked offers from our vendors — limited time"
          to="/shop?filter=deals"
        />
        <ProductRow items={deals.data} loading={deals.loading} onQuickView={setQuickView} empty="No active deals right now. Check back soon!" />
      </section>

      {/* ==================== FEATURED ==================== */}
      <section className="container section" style={{ paddingTop: 0 }} aria-label="Featured products">
        <SectionHeader title={<span className="flex items-center gap-2"><Star size={18} color="#f59e0b" /> Featured Products</span>} subtitle="Handpicked by our team" to="/shop" />
        <ProductRow items={featured.data} loading={featured.loading} onQuickView={setQuickView} empty="No featured products yet." />
      </section>

      {/* ==================== TRUST FEATURES ==================== */}
      <section className="container section" style={{ paddingTop: 0 }} aria-label="Why GOSIKA">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="section-title">Why Shop on GOSIKA?</h2>
            <p className="section-subtitle">Nepal's most trusted multi-vendor marketplace</p>
          </div>
        </div>
        <div className="feature-grid">
          {WHY_GOSIKA.map((f) => {
            const iconClass = {
              blue: 'feature-icon-blue',
              green: 'feature-icon-green',
              amber: 'feature-icon-amber',
              purple: 'feature-icon-purple',
            }[f.color]
            return (
              <div key={f.title} className="feature-card">
                <span className={`feature-icon ${iconClass}`}>
                  <f.icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <div className="font-semibold" style={{ fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                  <div className="muted text-sm">{f.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ==================== NEW ARRIVALS ==================== */}
      <section className="container section" style={{ paddingTop: 0 }} aria-label="New arrivals">
        <SectionHeader
          title={<span className="flex items-center gap-2"><Clock size={18} /> New Arrivals</span>}
          subtitle="Fresh products from our verified vendors"
          to="/shop?sort=newest"
        />
        <ProductRow items={newest.data} loading={newest.loading} onQuickView={setQuickView} empty="No new products yet. Check back soon!" />
      </section>

      {/* ==================== TOP VENDORS ==================== */}
      {(storesLoading || stores.length > 0) && (
        <section className="container section" style={{ paddingTop: 0 }} aria-label="Top vendors">
          <SectionHeader title="Top Stores" subtitle="Stores with the best ratings across Nepal" to="/shop?mode=stores" />
          {storesLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {stores.map((s) => (
                <StoreCard key={s.id} store={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== TOP RATED ==================== */}
      <section className="container section" style={{ paddingTop: 0 }} aria-label="Top rated products">
        <SectionHeader title="Top Rated" subtitle="Loved by customers across Nepal" to="/shop?sort=top" />
        <ProductRow items={topRated.data} loading={topRated.loading} onQuickView={setQuickView} empty="No ratings yet." />
      </section>

      {/* ==================== PAYMENT METHODS ==================== */}
      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ background: 'var(--bg)', padding: '24px' }}>
          <div className="flex items-center justify-between wrap gap-4">
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Multiple payment options</h3>
              <p className="muted text-sm m-0">Pay securely with your preferred method</p>
            </div>
            <div className="flex items-center gap-3 wrap">
              {[
                { label: 'Cash on Delivery', icon: Banknote, color: '#166534', bg: '#f0fdf4' },
                { label: 'Khalti', icon: Wallet, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'eSewa', icon: CreditCard, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Fonepay', icon: Smartphone, color: '#1d4ed8', bg: '#eff6ff' },
              ].map((m) => (
                <span
                  key={m.label}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 'var(--radius)',
                    background: m.bg, color: m.color,
                    fontSize: 13, fontWeight: 600,
                    border: `1px solid ${m.bg}`,
                  }}
                >
                  <m.icon size={16} /> {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SELL ON GOSIKA CTA ==================== */}
      <section className="container section" style={{ paddingTop: 0 }}>
        <div
          style={{
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, var(--primary-darker) 0%, var(--primary) 60%, #0ea5e9 100%)',
            padding: '52px 40px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span className="chip chip-navy" style={{ marginBottom: 16, display: 'inline-flex' }}>
              <Zap size={13} /> Grow your business
            </span>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 3.5vw, 32px)', marginBottom: 12 }}>
              Reach customers across all of Nepal
            </h2>
            <p style={{ color: '#bfdbfe', maxWidth: 520, margin: '0 auto 28px', fontSize: 15, lineHeight: 1.6 }}>
              Join thousands of vendors growing their business on GOSIKA. No joining fee, simple commission, fast payouts.
            </p>
            <div className="flex items-center justify-center gap-3 wrap">
              <Link to="/vendor/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary-darker)' }}>
                Become a Seller <ArrowRight size={17} />
              </Link>
              <Link to="/help" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                Learn More
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 wrap" style={{ marginTop: 24, fontSize: 13, color: '#bfdbfe' }}>
              <span className="flex items-center gap-1"><BadgeCheck size={14} /> Zero joining fees</span>
              <span className="flex items-center gap-1"><Truck size={14} /> We handle delivery</span>
              <span className="flex items-center gap-1"><CreditCard size={14} /> Fast payouts</span>
            </div>
          </div>
        </div>
      </section>

      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}

function ProductRow({ items, loading, onQuickView, empty }) {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductCardSkeletonMini key={i} />
        ))}
      </div>
    )
  }
  if (!items?.length) {
    return (
      <div style={{ padding: '32px 0', color: 'var(--muted)', textAlign: 'center', fontSize: 14 }}>
        {empty}
      </div>
    )
  }
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
      ))}
    </div>
  )
}

function StoreCard({ store }) {
  const banner = getStoreImage(store)
  const logo = store.logo ? apiImage(store.logo) : null
  return (
    <Link to={`/store/${store.id}`} className="vendor-card" aria-label={`Visit ${store.name} store`}>
      <div
        className="vendor-card-banner"
        style={{ backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="vendor-card-avatar">
          {logo ? (
            <img src={logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
          ) : (
            <Store size={22} color="var(--primary)" />
          )}
        </div>
      </div>
      <div className="vendor-card-body">
        <div className="font-semibold truncate" style={{ fontSize: 14 }}>{store.name}</div>
        {store.tagline && (
          <div className="muted text-xs line-clamp-1" style={{ marginTop: 2 }}>{store.tagline}</div>
        )}
        <div className="flex items-center gap-3 mt-2" style={{ fontSize: 12, color: 'var(--muted)' }}>
          {store.rating_avg > 0 && (
            <span className="flex items-center gap-1">
              <Star size={12} color="#f59e0b" fill="#f59e0b" /> {Number(store.rating_avg).toFixed(1)}
            </span>
          )}
          {store.products_count > 0 && (
            <span className="flex items-center gap-1">
              <Package size={12} /> {store.products_count} products
            </span>
          )}
          {store.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {store.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
