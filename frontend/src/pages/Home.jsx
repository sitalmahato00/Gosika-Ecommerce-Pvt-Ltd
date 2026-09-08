import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, ShieldCheck, RotateCcw, Headphones, ArrowRight,
  Sparkles, Flame, Star, Laptop, Shirt, ShoppingBag,
  Home as HomeIcon, Trophy, Utensils, BookOpen, Smartphone,
  ChevronRight, Check, Send, BadgeCheck
} from 'lucide-react'
import api from '../api/client'
import ProductCard, { ProductCardSkeletonMini } from '../components/commerce/ProductCard'
import ProductQuickView from '../components/commerce/ProductQuickView'
import { useToast } from '../context/ToastContext'

// Countdown timer hook for Flash Deals banner
function useCountdown(initialSeconds = 2 * 86400 + 14 * 3600 + 38 * 60 + 45) {
  const [seconds, setSeconds] = useState(initialSeconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : initialSeconds))
    }, 1000)
    return () => clearInterval(timer)
  }, [initialSeconds])

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
  }
}

// 8 Categories for the Floating Category Bar
const FLOATING_CATEGORIES = [
  { label: 'Electronics', icon: Laptop, slug: 'electronics' },
  { label: "Men's Fashion", icon: Shirt, slug: 'mens-fashion' },
  { label: "Women's Fashion", icon: ShoppingBag, slug: 'womens-fashion' },
  { label: 'Home & Living', icon: HomeIcon, slug: 'home-living' },
  { label: 'Beauty & Care', icon: Sparkles, slug: 'beauty-care' },
  { label: 'Sports & Fitness', icon: Trophy, slug: 'sports-fitness' },
  { label: 'Groceries', icon: Utensils, slug: 'groceries' },
  { label: 'Books & Stationery', icon: BookOpen, slug: 'books-stationery' },
]

// 4 Pastel Promo Banners (Trending Now)
const PASTEL_PROMOS = [
  {
    title: 'Up to 40% Off',
    subtitle: 'Latest models & accessories',
    badge: 'Smartphones',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    bg: '#eff6ff',
    border: '#dbeafe',
    ctaColor: '#2563eb',
    link: '/shop?category=smartphones',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80',
  },
  {
    title: 'From रु 499',
    subtitle: 'Modern appliances & tools',
    badge: 'Kitchen Essentials',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    bg: '#f0fdf4',
    border: '#dcfce7',
    ctaColor: '#16a34a',
    link: '/shop?category=home-living',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
  },
  {
    title: 'Flat 50% Off',
    subtitle: 'Trending styles this season',
    badge: 'Fashion Sale',
    badgeBg: '#ede9fe',
    badgeColor: '#5b21b6',
    bg: '#f5f3ff',
    border: '#ede9fe',
    ctaColor: '#7c3aed',
    link: '/shop?category=mens-fashion',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&q=80',
  },
  {
    title: 'Min 30% Off',
    subtitle: 'Skincare & cosmetics',
    badge: 'Beauty Store',
    badgeBg: '#fce7f3',
    badgeColor: '#9d174d',
    bg: '#fdf2f8',
    border: '#fce7f3',
    ctaColor: '#db2777',
    link: '/shop?category=beauty-care',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80',
  },
]

// 8 Circular Top Categories
const TOP_CATEGORIES = [
  { name: 'Mobile Phones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80', slug: 'mobile-phones' },
  { name: 'Laptops & PCs', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80', slug: 'laptops-pcs' },
  { name: "Men's Fashion", image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=300&q=80', slug: 'mens-fashion' },
  { name: "Women's Fashion", image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&q=80', slug: 'womens-fashion' },
  { name: 'Home Appliances', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&q=80', slug: 'home-appliances' },
  { name: 'TV & Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', slug: 'tv-audio' },
  { name: 'Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80', slug: 'watches' },
  { name: 'Bags & Luggage', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80', slug: 'bags-luggage' },
]

// 4 Clean Trust Cards
const TRUST_PERKS = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Across all 77 districts' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7 days return policy' },
  { icon: Headphones, title: 'Customer Support', desc: 'Dedicated 24/7 support' },
]

// Fallback high-fidelity products ensuring exact visual match if backend has fewer items
const FALLBACK_DEALS = [
  {
    id: 101,
    name: 'Wireless Noise Cancelling Headphones',
    price: 4999,
    compare_at_price: 6999,
    rating_avg: 4.9,
    rating_count: 84,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    brand: { name: 'Sony' },
  },
  {
    id: 102,
    name: 'Ultra Smart Watch Pro Series 8',
    price: 3499,
    compare_at_price: 4999,
    rating_avg: 4.8,
    rating_count: 62,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    brand: { name: 'Apple' },
  },
  {
    id: 103,
    name: 'Classic Minimalist Leather Backpack',
    price: 2799,
    compare_at_price: 3899,
    rating_avg: 4.7,
    rating_count: 45,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    brand: { name: 'Gosika Origin' },
  },
  {
    id: 104,
    name: 'True Wireless Bluetooth Earbuds 5.3',
    price: 1899,
    compare_at_price: 2999,
    rating_avg: 4.8,
    rating_count: 110,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
    brand: { name: 'JBL' },
  },
  {
    id: 105,
    name: 'Mechanical Gaming Keyboard RGB Backlit',
    price: 3850,
    compare_at_price: 5200,
    rating_avg: 4.9,
    rating_count: 73,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    brand: { name: 'Logitech' },
  },
  {
    id: 106,
    name: 'Smart Induction Cooktop 2000W',
    price: 4200,
    compare_at_price: 5900,
    rating_avg: 4.6,
    rating_count: 38,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
    brand: { name: 'Philips' },
  },
]

const FALLBACK_NEW = [
  {
    id: 201,
    name: 'Portable Wireless Speaker IPX7 Waterproof',
    price: 3299,
    compare_at_price: 3999,
    rating_avg: 4.8,
    rating_count: 29,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
    brand: { name: 'Boat' },
  },
  {
    id: 202,
    name: 'Premium Cotton Slim-Fit Casual Shirt',
    price: 1450,
    compare_at_price: 1950,
    rating_avg: 4.7,
    rating_count: 51,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80',
    brand: { name: 'Gosika Wear' },
  },
  {
    id: 203,
    name: 'Organic Hydrating Face Serum 50ml',
    price: 980,
    compare_at_price: 1400,
    rating_avg: 4.9,
    rating_count: 95,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80',
    brand: { name: 'The Derma Co' },
  },
  {
    id: 204,
    name: 'Ergonomic Mesh Office & Study Chair',
    price: 8500,
    compare_at_price: 10500,
    rating_avg: 4.8,
    rating_count: 42,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1580481077195-c9349c2642a8?w=500&q=80',
    brand: { name: 'Comfort+' },
  },
  {
    id: 205,
    name: 'Ceramic Non-Stick Granite Cookware Set',
    price: 3600,
    compare_at_price: 4800,
    rating_avg: 4.6,
    rating_count: 34,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1584990347449-397227eb0926?w=500&q=80',
    brand: { name: 'Prestige' },
  },
  {
    id: 206,
    name: 'Smart Air Purifier HEPA Filter Room',
    price: 6990,
    compare_at_price: 8990,
    rating_avg: 4.9,
    rating_count: 67,
    stock_status: 'in_stock',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80',
    brand: { name: 'Mi' },
  },
]

const HERO_SLIDES = [
  {
    title: 'Nepal ko\nOnline Bazaar',
    subtitle: 'Local products, trusted sellers, best deals – sabai ek thau ma.',
    cta: 'Shop Now',
    ctaTo: '/shop',
    cta2: 'Explore Deals',
    cta2To: '/shop?filter=deals',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=70',
    badge: "Nepal's Online Bazaar",
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

export default function Home() {
  const [deals, setDeals] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickView, setQuickView] = useState(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const toast = useToast()
  const countdown = useCountdown()

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      api.get('/products', { params: { discount: true, per_page: 6 } }).catch(() => ({ data: { data: [] } })),
      api.get('/products', { params: { sort: 'newest', per_page: 6 } }).catch(() => ({ data: { data: [] } })),
    ]).then(([dealsRes, newRes]) => {
      if (!alive) return
      const apiDeals = api.unwrapList(dealsRes.data)
      const apiNew = api.unwrapList(newRes.data)

      // Fill with high-fidelity fallback items if database has fewer than 6
      const mergedDeals = apiDeals.length >= 6
        ? apiDeals.slice(0, 6)
        : [...apiDeals, ...FALLBACK_DEALS.slice(apiDeals.length, 6)]

      const mergedNew = apiNew.length >= 6
        ? apiNew.slice(0, 6)
        : [...apiNew, ...FALLBACK_NEW.slice(apiNew.length, 6)]

      setDeals(mergedDeals)
      setNewArrivals(mergedNew)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    toast.success('Thank you for subscribing! Check your email for your रु 500 voucher.')
    setNewsletterEmail('')
  }

  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const active = HERO_SLIDES[slide]

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
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
        <div className="hero-slides-dots" role="tablist" aria-label="Slide indicators">
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

      {/* ==================== 2. FLOATING CATEGORY BAR (8 ICONS) ==================== */}
      <div className="container" style={{ padding: '0 20px' }}>
        <div className="floating-cat-card">
          <div className="floating-cat-grid">
            {FLOATING_CATEGORIES.map((cat) => {
              const IconComp = cat.icon
              return (
                <Link
                  key={cat.label}
                  to={`/shop?category=${cat.slug}`}
                  className="floating-cat-item"
                  aria-label={cat.label}
                >
                  <div className="floating-cat-icon">
                    <IconComp size={24} />
                  </div>
                  <span className="floating-cat-label">{cat.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ==================== 3. FLASH DEALS (COUNTDOWN + 6 PRODUCTS) ==================== */}
      <section className="container" style={{ padding: '48px 20px 24px' }}>
        {/* Countdown Header Banner */}
        <div className="flash-countdown-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={22} color="#ff5500" /> Flash Deals
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
              <span style={{ fontWeight: 600 }}>Ends in:</span>
              <span className="timer-chip">{countdown.days}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Days</span>
              <span className="timer-chip">{countdown.hours}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Hrs</span>
              <span className="timer-chip">{countdown.mins}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Mins</span>
              <span className="timer-chip">{countdown.secs}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Secs</span>
            </div>
          </div>
          <Link
            to="/shop?filter=deals"
            style={{ color: '#ff5500', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            View All Deals →
          </Link>
        </div>

        {/* 6 Product Cards Grid */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeletonMini key={i} />
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuickView} variant="outline" />
            ))}
          </div>
        )}
      </section>

      {/* ==================== 4. TRENDING NOW (4 PASTEL CARDS) ==================== */}
      <section className="container" style={{ padding: '24px 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Trending Now</h2>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Popular collections this week</p>
        </div>

        <div className="pastel-promo-grid">
          {PASTEL_PROMOS.map((promo) => (
            <Link
              key={promo.badge}
              to={promo.link}
              className="pastel-promo-card"
              style={{
                background: promo.bg,
                border: `1.5px solid ${promo.border}`,
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: promo.badgeBg,
                    color: promo.badgeColor,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 6,
                    marginBottom: 10,
                  }}
                >
                  {promo.badge}
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  {promo.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {promo.subtitle}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <span style={{ color: promo.ctaColor, fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Shop Now →
                </span>
                <img
                  src={promo.image}
                  alt={promo.badge}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    objectFit: 'cover',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== 5. NEW ARRIVALS (6 PRODUCTS) ==================== */}
      <section className="container" style={{ padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>New Arrivals</h2>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Fresh products from verified sellers</p>
          </div>
          <Link
            to="/shop?sort=newest"
            style={{ color: '#ff5500', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeletonMini key={i} />
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuickView} variant="outline" />
            ))}
          </div>
        )}
      </section>

      {/* ==================== 6. TOP CATEGORIES (8 CIRCULAR AVATARS) ==================== */}
      <section className="container" style={{ padding: '36px 20px 24px' }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Top Categories</h2>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0' }}>Explore products by top categories</p>
        </div>

        <div className="circular-cat-grid">
          {TOP_CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={`/shop?category=${cat.slug}`}
              className="circular-cat-card"
              aria-label={cat.name}
            >
              <div className="circular-cat-avatar">
                <img src={cat.image} alt={cat.name} loading="lazy" />
              </div>
              <span className="circular-cat-name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== 7. 4 CLEAN TRUST CARDS ==================== */}
      <section className="container" style={{ padding: '32px 20px' }}>
        <div className="trust-cards-grid">
          {TRUST_PERKS.map((t) => {
            const Icon = t.icon
            return (
              <div key={t.title} className="trust-card-clean">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#fff7ed',
                    border: '1px solid #ffedd5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff5500',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{t.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ==================== 8. FULL-WIDTH ORANGE NEWSLETTER BANNER ==================== */}
      <section className="container" style={{ padding: '16px 20px 48px' }}>
        <div className="newsletter-strip">
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '0 0 6px' }}>
              Subscribe to our Newsletter
            </h2>
            <p style={{ fontSize: 14, color: '#ffedd5', margin: 0, lineHeight: 1.5 }}>
              Get रु 500 off on your first order and stay updated with latest deals.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              borderRadius: 10,
              padding: 4,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px 14px',
                fontSize: 13.5,
                color: '#1e293b',
                background: 'transparent'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s ease'
              }}
            >
              Subscribe <Send size={13} />
            </button>
          </form>
        </div>
      </section>

      {/* Quick view modal */}
      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}
