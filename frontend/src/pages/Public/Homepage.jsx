import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, PackageSearch, ChevronDown, Search, Heart, Check, Trash, Eye, Edit, Trash2, Plus, ArrowPath } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useList } from '../../hooks/useApi'

const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const PRICE_RANGES = [
  { label: 'Under Rs. 1,000', min: 0, max: 1000 },
  { label: 'Rs. 1,000 – 5,000', min: 1000, max: 5000 },
  { label: 'Rs. 5,000 – 15,000', min: 5000, max: 15000 },
  { label: 'Above Rs. 15,000', min: 15000, max: 10000000 },
]

export default function Homepage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Get products for homepage
  const fetcher = async (page) => {
    const p = Object.fromEntries(params.entries())
    return api.get('/products', { params: { page: Number(p.page) || 1, per_page: 20, ...p } })
  }
  const { items, meta, setPage, loading, error, reload } = useList(fetcher, { deps: [params], pageSize: 20 })

  if (loading) {
    return (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}><Skeleton height={180} /><Skeleton height={180} /><Skeleton height={180} /></div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) return <EmptyState icon={Search} title="No products" message="No products found. Use filters to narrow results." />

  return (
    <div className="py-8">
      <div className="container">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16 }}>
            Discover Quality Products From Trusted Sellers
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: 24 }}>
            Handcrafted items from verified vendors across Nepal. Safe, secure, and delivered to your doorstep.
          </p>
          <div className="flex gap-4">
            <a href="/shop" className="btn btn-primary">Shop Now</a>
            <a href="/vendor/register" className="btn btn-outline">Become a Vendor</a>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mb-6">
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Featured Categories</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books'].map((cat) => (
              <a
                key={cat}
                href={`/shop?category=${cat.toLowerCase().replace(/\s+/g, '-')}`
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 18 }}>{cat[0]}</span>
                  <span>{cat}</span>
                  <span className="ml-auto"><ArrowPath size={14} style={{ color: 'var(--primary)' }}" /></span>
                </a>
              ))}
            ))}
          </div>
        </div>

        {/* Trending Products */}
        <div className="mb-6">
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Trending Products</h2>
          <div className="product-grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} showRating />
            ))}
          </div>
          <a href="/shop" className="muted text-sm" style={{ marginTop: 12 }}>View all products</a>
        </div>

        {/* Best Sellers */}
        <div className="mb-6">
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Best Sellers</h2>
          <div className="product-grid">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} showRating />
            ))}
          </div>
        </div>

        {/* Flash Sale */}
        <div className="mb-6 promo-strip">
          <span>Flash Sale - Up to 50% Off</span>
        </div>

        {/* Featured Vendors */}
        <div className="mb-6">
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Featured Vendors</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {['Nabil Organic Farms', 'Kathmandu Handicrafts', 'Himalaya Herbal'], (vendor) => (
              <a
                key={vendor}
                href={`/vendor/${Math.random().toString(36).substr(2, 9)}`
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 16 }}>{vendor[0]}</span>
                  <span>{vendor}</span>
                  <span className="ml-auto"><Heart size={14} style={{ color: 'var(--primary)' }}" /></span>
                </a>
              ))}
            ))}
          </div>
        </div>

        {/* Popular Brands */}
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Popular Brands</h2>
          <div className="flex flex-col sm:flex-row gap-2" style={{ flexWrap: 'wrap' }}>
            [{'XYZ Textiles'}, {'Kathmandu Crafts'}, {'Himalaya Herbs']}.map((brand) => (
              <a
                key={brand}
                href={`/brand/${brand.toLowerCase().replace(/\s+/g, '-')}`
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6, background: 'var(--primary-50)', color: 'var(--primary)', textDecoration: 'none', fontSize: 13 }}>
                  <span>{brand[0]}</span>
                  <span>{brand}</span>
                </a>
              ))}
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-8 promo-strip" style={{ background: 'var(--navy)', color: '#fff', padding: '20px', marginTop: 32 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Subscribe for Updates</h3>
          <p style={{ opacity: 0.9, marginBottom: 12 }}>Get latest deals and product launches delivered to your inbox</p>
          <form style={{ maxWidth: 400, display: 'flex', gap: 8 }} onSubmit={(e) => {
            e.preventDefault()
            alert('Thank you for subscribing!')
          }}>
            <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: 8, border: '1px solid #4a5568', borderRadius: 6 }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Subscribe</button>
          </form>
        </div>
      </div>
    </div>
  )
}