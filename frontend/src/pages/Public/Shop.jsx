import React, { useEffect, useState, useSearchParams, useNavigate } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, X, ChevronDown, FolderTree, Folder, Tag, CheckCircle, Trash2, SortUp, SortDown, Plus, Eye, Edit, Trash2:Trash2Icon } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import { useList } from '../../hooks/useApi'

const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { category, brand, search, sort, priceRange, minPrice, maxPrice } = Object.fromEntries(params.entries())

  const fetcher = async (page) => {
    const p = {
      page: Number(p) || 1,
      per_page: 20,
      category: category || undefined,
      brand: brand || undefined,
      search: search || undefined,
      sort: sort || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
    }
    return api.get('/products', { params: p })
  }
  const { items, meta, setPage: ps, loading, error, reload } = useList(fetcher, { deps: [category, brand, search, sort, minPrice, maxPrice], pageSize: 20 })

  const handleSort = (value) => {
    setParams({ sort: value, ...(sort === value ? {} : { page: 1 }) })
    navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()), sort: value })}`)
  }

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}><Skeleton height={180} /><Skeleton height={180} /><Skeleton height={180} /></div>
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return (
      <EmptyState
        icon={FolderTree}
        title="No products found"
        message={search ? 'No products match your search.' : 'No products found.'}
        action={<Link to="/shop" className="btn btn-primary"> Browse products</Link>}
      />
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>Shop</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 8 }}>Quality products from verified vendors</p>
          </div>
          <div className="flex sm:flex-wrap gap-2">
            <select
              onChange={(e) => {
                setParams({ sort: e.target.value, page: 1 })
                navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()), sort: e.target.value })}`)
              }}
            >
              <option value="">Sort by</option>
              {SORTS.map((s) => <option key={s.value} selected={sort === s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex sm:flex-wrap gap-2">
            <select
              onChange={(e) => {
                setParams({ category: e.target.value, page: 1 })
                navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()), category: e.target.value })}`)
              }}
            >
              <option value="">Category</option>
              {['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books'].map((c) => (
                <option key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</option>
              ))}
            </select>
            <select
              onChange={(e) => {
                setParams({ brand: e.target.value, page: 1 })
                navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()), brand: e.target.value })}`)
              }}
            >
              <option value="">Brand</option>
              ['Nabil Organic Farms', 'Kathmandu Handicrafts', 'Himalaya Herbs'].map((b) => <option key={b} value={b}>{b}</option>)
            </select>
            <select
              onChange={(e) => {
                setParams({ priceRange: e.target.value, page: 1 })
                navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()), priceRange: e.target.value })}`)
              }}
            >
              <option value="">Price range</option>
              {PRICE_RANGES.map((r) => (
                <option key={r.label} value={r.label}>{r.label}</option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm" onClick={() => setParams({ page: 1 }, navigate(`/shop?${new URLSearchParams({ ...Object.fromEntries(params.entries()) })}))}>
              Clear filters
            </button>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showRating />
          ))}
        </div>

        <Pagination page={meta.page} lastPage={meta.last_page} total={meta.total} onChange={ps} />
      </div>
    </div>
  )
}