import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, ShieldCheck, RotateCcw, Headphones, ArrowRight, ImageOff,
  Sparkles, Flame, Send, TrendingUp, Package, Store, Award
} from 'lucide-react'
import api from '../api/client'
import ProductCard, { ProductCardSkeletonMini } from '../components/commerce/ProductCard'
import ProductQuickView from '../components/commerce/ProductQuickView'
import { useToast } from '../context/ToastContext'
import { getCategoryIcon } from '../utils/icons'
import { apiImage, errorMessage, money } from '../utils/format'

// 4 Clean Trust Cards
const TRUST_PERKS = [
  { icon: Truck, title: 'Free Delivery', desc: 'On all orders' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% Safe' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always Here' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Hassle Free' },
]

const EMPTY_HOME_DATA = {
  categories: [],
  deals: [],
  newArrivals: [],
  trending: [],
  featuredProducts: [],
  recommendedProducts: [],
  stores: [],
  brands: [],
  campaigns: [],
}

export default function Home() {
  const [homeData, setHomeData] = useState(EMPTY_HOME_DATA)
  const [loadErrors, setLoadErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [quickView, setQuickView] = useState(null)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [failedCampaignImages, setFailedCampaignImages] = useState(() => new Set())
  const toast = useToast()

  useEffect(() => {
    let alive = true
    const requests = {
      categories: () => api.get('/categories'),
      deals: () => api.get('/deals', { params: { per_page: 6 } }),
      trending: () => api.get('/products', { params: { sort: 'top', per_page: 6 } }),
      newArrivals: () => api.get('/products', { params: { sort: 'newest', per_page: 6 } }),
      featuredProducts: () => api.get('/products', { params: { featured: true, per_page: 6 } }),
      recommendedProducts: () => api.get('/products', { params: { sort: 'rating', per_page: 24 } }),
      stores: () => api.get('/marketplace/stores', { params: { per_page: 6 } }),
      brands: () => api.get('/brands'),
      campaigns: () => api.get('/campaigns'),
    }

    Promise.all(Object.entries(requests).map(async ([key, request]) => {
      try {
        const response = await request()
        return { key, items: api.unwrapList(response.data) }
      } catch (error) {
        return { key, error: errorMessage(error, `Could not load ${key}.`) }
      }
    })).then((results) => {
      if (!alive) return
      const nextData = { ...EMPTY_HOME_DATA }
      const nextErrors = {}
      results.forEach(({ key, items, error }) => {
        if (error) nextErrors[key] = error
        else nextData[key] = items
      })
      setHomeData(nextData)
      setLoadErrors(nextErrors)
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

  const {
    categories, deals, trending, newArrivals, featuredProducts,
    recommendedProducts, stores, brands, campaigns,
  } = homeData
  const [slide, setSlide] = useState(0)
  const heroSlides = campaigns

  useEffect(() => {
    if (heroSlides.length < 2) return undefined
    const timer = setInterval(() => setSlide((current) => (current + 1) % heroSlides.length), 5000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const activeSlideIndex = slide % Math.max(heroSlides.length, 1)
  const activeCampaign = heroSlides[activeSlideIndex]
  const campaignImageKey = activeCampaign
    ? `${activeCampaign.id || ''}:${activeCampaign.image || ''}`
    : ''
  const showCampaignImage = Boolean(activeCampaign?.image && !failedCampaignImages.has(campaignImageKey))
  const campaignType = activeCampaign?.type?.replace(/_/g, ' ')
  const campaignDiscount = Number(activeCampaign?.discount_value)
  const campaignOffer = activeCampaign?.type === 'free_shipping'
    ? 'Free delivery'
    : activeCampaign?.discount_type === 'percentage' && campaignDiscount > 0
      ? `${campaignDiscount}% OFF`
      : activeCampaign?.discount_type === 'fixed' && campaignDiscount > 0
        ? `${money(campaignDiscount)} OFF`
        : campaignType
  const alreadyShownProducts = new Set(
    [...deals, ...trending, ...newArrivals, ...featuredProducts].map((product) => product.id)
  )
  const distinctRecommendations = recommendedProducts
    .filter((product) => !alreadyShownProducts.has(product.id))
    .slice(0, 6)
  const uniqueRecommendations = distinctRecommendations.length
    ? distinctRecommendations
    : recommendedProducts.slice(0, 6)

  const renderProductSection = (title, Icon, items, key, href) => {
    const error = loadErrors[key]
    if (loading || (!items.length && !error)) return null

    return (
      <section className="container home-products-section" key={key}>
        <div className="home-section-heading">
          <h2><Icon size={19} aria-hidden="true" />{title}</h2>
          <Link to={href}>View All <ArrowRight size={14} /></Link>
        </div>
        {error ? (
          <p className="home-section-error" role="alert">{error}</p>
        ) : (
          <div className="product-grid home-products-grid">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={setQuickView} variant="outline" />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="gosika-home" style={{ background: '#f7f8fc', minHeight: '100vh' }}>
      {/* ==================== HERO ==================== */}
      {(heroSlides.length > 0 || loadErrors.campaigns) && (
        <section className="hero-section home-hero" aria-label="Featured promotions">
          {loadErrors.campaigns ? (
            <p className="container home-section-error" role="alert">{loadErrors.campaigns}</p>
          ) : activeCampaign ? (
            <>
              <div className="container hero-content home-hero-content">
                <div className="home-hero-copy">
                  <span className="home-hero-badge">
                    <Sparkles size={13} />
                    {campaignType || 'Featured campaign'}
                  </span>
                  <h1 className="hero-title home-hero-title">{activeCampaign.title}</h1>
                  <p className="hero-subtitle home-hero-subtitle">
                    {activeCampaign.tagline || activeCampaign.description || activeCampaign.title}
                  </p>
                  {campaignOffer && (
                    <p className="home-campaign-offer">{campaignOffer}</p>
                  )}
                  <div className="hero-actions">
                    <Link to="/shop" className="btn btn-primary home-hero-cta">
                      Shop campaign <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className={`home-hero-visual${showCampaignImage ? ' has-banner-image' : ''}`} aria-hidden="true">
                  {showCampaignImage ? (
                    <div className="home-hero-banner-art">
                      <img
                        src={apiImage(activeCampaign.image)}
                        alt=""
                        loading="eager"
                        onError={() => setFailedCampaignImages((failed) => new Set(failed).add(campaignImageKey))}
                      />
                    </div>
                  ) : (
                    <div className="home-hero-campaign-placeholder">
                      <ImageOff size={36} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </div>

              {heroSlides.length > 1 && (
                <div className="hero-slides-dots" role="tablist" aria-label="Campaign slides">
                  {heroSlides.map((campaign, index) => (
                    <button
                      key={campaign.id || index}
                      className={`hero-dot ${index === activeSlideIndex ? 'active' : ''}`}
                      onClick={() => setSlide(index)}
                      aria-label={`Go to campaign: ${campaign.title}`}
                      aria-selected={index === slide}
                    />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      )}

      {/* ==================== SHOPPER PROMISES ==================== */}
      <section className="container home-trust-wrap" aria-label="Shopping benefits">
        <div className="floating-cat-card">
          <div className="trust-cards-grid home-trust-grid">
            {TRUST_PERKS.map((perk) => {
              const Icon = perk.icon
              return (
                <div key={perk.title} className="trust-card-clean home-trust-card">
                  <span className="home-trust-icon"><Icon size={19} /></span>
                  <span className="home-trust-copy"><strong>{perk.title}</strong><small>{perk.desc}</small></span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {(loading || categories.length > 0 || loadErrors.categories) && (
        <section className="container home-category-section">
          <div className="home-section-heading">
            <h2><span />Shop by Categories</h2>
            <Link to="/shop">View All <ArrowRight size={14} /></Link>
          </div>
          {loadErrors.categories ? (
            <p className="home-section-error" role="alert">{loadErrors.categories}</p>
          ) : loading ? (
            <div className="home-category-grid home-category-loading" aria-label="Loading categories">
              {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
            </div>
          ) : (
            <div className="home-category-grid">
              {categories.slice(0, 12).map((category, index) => {
                const Icon = getCategoryIcon(category, index)
                return (
                  <Link
                    key={category.id}
                    to={`/shop?category=${encodeURIComponent(category.slug)}`}
                    className="home-category-item"
                    aria-label={category.name}
                  >
                    <div className="home-category-image">
                      {category.image ? (
                        <img
                          src={apiImage(category.image)}
                          alt={category.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                            event.currentTarget.nextSibling.style.display = 'grid'
                          }}
                        />
                      ) : null}
                      <Icon
                        className={`home-category-fallback${category.image ? '' : ' visible'}`}
                        size={30}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="home-category-label">{category.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      )}

      {(loading || deals.length > 0 || loadErrors.deals) && (
        <section className="container home-deals-section">
          <div className="home-section-heading home-deals-heading">
            <h2><Flame size={20} aria-hidden="true" />Today's Deals</h2>
            <Link to="/shop?filter=deals">See All <ArrowRight size={14} /></Link>
          </div>
          {loadErrors.deals ? (
            <p className="home-section-error" role="alert">{loadErrors.deals}</p>
          ) : loading ? (
            <div className="product-grid home-products-grid home-deals-grid">
              {Array.from({ length: 4 }, (_, index) => <ProductCardSkeletonMini key={index} />)}
            </div>
          ) : (
            <div className="product-grid home-products-grid home-deals-grid">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickView} variant="outline" />
              ))}
            </div>
          )}
        </section>
      )}

      {renderProductSection('Trending Now', TrendingUp, trending, 'trending', '/shop?sort=top')}
      {renderProductSection('New Arrivals', Package, newArrivals, 'newArrivals', '/shop?sort=newest')}
      {renderProductSection('Featured Products', Sparkles, featuredProducts, 'featuredProducts', '/shop?sort=top')}
      {renderProductSection('Recommended Products', Award, uniqueRecommendations, 'recommendedProducts', '/shop?sort=rating')}

      {!loading && (stores.length > 0 || loadErrors.stores) && (
        <section className="container home-listing-section">
          <div className="home-section-heading">
            <h2><Store size={19} aria-hidden="true" />Featured Sellers</h2>
            <Link to="/shop?mode=stores">View All <ArrowRight size={14} /></Link>
          </div>
          {loadErrors.stores ? (
            <p className="home-section-error" role="alert">{loadErrors.stores}</p>
          ) : (
            <div className="home-store-grid">
              {stores.slice(0, 6).map((store) => (
                <Link key={store.id} to={`/store/${store.id}`} className="home-store-card">
                  <span className="home-store-logo">
                    <Store size={24} aria-hidden="true" />
                    {store.logo ? (
                      <img src={apiImage(store.logo)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                    ) : null}
                  </span>
                  <span className="home-store-details">
                    <strong>{store.name}</strong>
                    <small>{store.product_count || 0} products{store.location ? ` · ${store.location}` : ''}</small>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && (brands.length > 0 || loadErrors.brands) && (
        <section className="container home-listing-section">
          <div className="home-section-heading">
            <h2><Award size={19} aria-hidden="true" />Top Brands</h2>
            <Link to="/brands">View All <ArrowRight size={14} /></Link>
          </div>
          {loadErrors.brands ? (
            <p className="home-section-error" role="alert">{loadErrors.brands}</p>
          ) : (
            <div className="home-brand-grid">
              {brands.slice(0, 8).map((brand) => (
                <Link key={brand.id} to={`/brand/${brand.slug || brand.id}`} className="home-brand-card">
                  <span className="home-brand-logo">
                    <span aria-hidden="true">{brand.name?.charAt(0)?.toUpperCase()}</span>
                    {brand.logo ? (
                      <img src={apiImage(brand.logo)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />
                    ) : null}
                  </span>
                  <strong>{brand.name}</strong>
                  <small>{brand.products_count || 0} products</small>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================== 7. FULL-WIDTH ORANGE NEWSLETTER BANNER ==================== */}
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
