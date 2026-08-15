import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  SlidersHorizontal, X, PackageSearch, ChevronDown,
  ChevronRight, LayoutGrid, List, Search, Star
} from 'lucide-react'
import api from '../api/client'
import ProductCard from '../components/commerce/ProductCard'
import ProductQuickView from '../components/commerce/ProductQuickView'
import { ProductCardSkeletonMini } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import Drawer from '../components/ui/Drawer'
import { useList } from '../hooks/useApi'
import { errorMessage } from '../utils/format'
import { PRICE_RANGES } from '../utils/constants'

const SORTS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'top', label: 'Best Selling' },
  { value: 'discount', label: 'Biggest Discount' },
]

const RATINGS = [
  { value: '4', label: '4 Stars & above', stars: 4 },
  { value: '3', label: '3 Stars & above', stars: 3 },
  { value: '2', label: '2 Stars & above', stars: 2 },
]

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="filter-section">
      <button
        className="filter-section-header w-full"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          size={15}
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color: 'var(--muted)', flexShrink: 0 }}
        />
      </button>
      {open && <div className="filter-section-body">{children}</div>}
    </div>
  )
}

function FilterSidebar({ categories, brands, filters, onUpdate, onClear }) {
  const { category, brand, range, minRating, inStock } = filters

  return (
    <aside className="filter-sidebar" aria-label="Product filters">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-semibold" style={{ fontSize: 14 }}>Filters</span>
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-xs" onClick={onClear} style={{ color: 'var(--danger)' }}>
            Clear All
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label className="checkbox-row" style={{ padding: '5px 0' }}>
            <input type="radio" name="cat" checked={!category} onChange={() => onUpdate({ category: '' })} style={{ accentColor: 'var(--primary)' }} />
            <span style={{ flex: 1, fontSize: 13 }}>All Categories</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className="checkbox-row" style={{ padding: '5px 0' }}>
              <input
                type="radio"
                name="cat"
                checked={category === c.slug}
                onChange={() => onUpdate({ category: category === c.slug ? '' : c.slug })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
              {c.products_count > 0 && (
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.products_count}</span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label className="checkbox-row" style={{ padding: '5px 0' }}>
            <input type="radio" name="range" checked={!range} onChange={() => onUpdate({ range: '' })} style={{ accentColor: 'var(--primary)' }} />
            <span style={{ fontSize: 13 }}>Any Price</span>
          </label>
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="checkbox-row" style={{ padding: '5px 0' }}>
              <input
                type="radio"
                name="range"
                checked={range === r.label}
                onChange={() => onUpdate({ range: range === r.label ? '' : r.label })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 13 }}>{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {brands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {brands.slice(0, 15).map((b) => (
              <label key={b.id} className="checkbox-row" style={{ padding: '5px 0' }}>
                <input
                  type="checkbox"
                  checked={brand === String(b.id)}
                  onChange={() => onUpdate({ brand: brand === String(b.id) ? '' : String(b.id) })}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ flex: 1, fontSize: 13 }}>{b.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Rating" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {RATINGS.map((r) => (
            <label key={r.value} className="checkbox-row" style={{ padding: '5px 0' }}>
              <input
                type="radio"
                name="rating"
                checked={minRating === r.value}
                onChange={() => onUpdate({ minRating: minRating === r.value ? '' : r.value })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 13 }}>{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen={false}>
        <label className="checkbox-row" style={{ padding: '5px 0' }}>
          <input
            type="checkbox"
            checked={inStock === '1'}
            onChange={() => onUpdate({ inStock: inStock === '1' ? '' : '1' })}
            style={{ accentColor: 'var(--primary)' }}
          />
          <span style={{ fontSize: 13 }}>In Stock Only</span>
        </label>
      </FilterSection>
    </aside>
  )
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [quickView, setQuickView] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const brand = params.get('brand') || ''
  const store = params.get('store') || ''
  const sort = params.get('sort') || ''
  const range = params.get('range') || ''
  const minRating = params.get('minRating') || ''
  const inStock = params.get('inStock') || ''
  const mode = params.get('mode') || ''

  const filters = { category, brand, range, minRating, inStock }

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(() => {})
    api.get('/brands').then((r) => setBrands(r.data.data || [])).catch(() => {})
  }, [])

  const buildParams = useCallback((p) => {
    const q = {
      per_page: 16,
      load: 'brand,store,images',
      sort: p.sort || undefined,
      search: p.search || undefined,
      category: p.category || undefined,
      brand: p.brand || undefined,
      store: p.store || undefined,
      min_rating: p.minRating || undefined,
      in_stock: p.inStock || undefined,
      featured: p.mode === 'featured' ? 1 : undefined,
    }
    if (p.range) {
      const r = PRICE_RANGES.find((x) => x.label === p.range)
      if (r) { q.min_price = r.min; q.max_price = r.max }
    }
    return q
  }, [])

  const fetcher = useCallback(
    async (page) => api.get('/products', { params: { ...buildParams(Object.fromEntries(params)), page } }),
    [params, buildParams],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [search, category, brand, store, sort, range, minRating, inStock, mode],
    pageSize: 16,
  })

  const update = (patch, reset = true) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    if (reset) next.delete('page')
    setParams(next, { replace: true })
    setFilterOpen(false)
  }

  const clearAll = () => navigate('/shop', { replace: true })

  const activeFilters = [category, brand, range, minRating, inStock].filter(Boolean).length
  const pageTitle = category
    ? categories.find((c) => c.slug === category)?.name || 'Products'
    : search
    ? `Results for "${search}"`
    : 'All Products'

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        {category ? (
          <>
            <Link to="/shop">Shop</Link>
            <ChevronRight size={13} className="breadcrumb-sep" />
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{pageTitle}</span>
          </>
        ) : (
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Shop</span>
        )}
      </nav>

      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-3" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 2 }}>{pageTitle}</h1>
          <p className="muted text-sm m-0">
            {loading ? 'Loading…' : `${meta.total} product${meta.total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div className="flex" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              className="icon-btn"
              style={{ border: 'none', borderRadius: 0, background: viewMode === 'grid' ? 'var(--primary-50)' : '#fff', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--muted)' }}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className="icon-btn"
              style={{ border: 'none', borderRadius: 0, borderLeft: '1px solid var(--border)', background: viewMode === 'list' ? 'var(--primary-50)' : '#fff', color: viewMode === 'list' ? 'var(--primary)' : 'var(--muted)' }}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={16} />
            </button>
          </div>

          {/* Sort */}
          <select
            className="select"
            style={{ width: 'auto', minWidth: 180 }}
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            aria-label="Sort products"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Mobile filter/sort bar */}
      <div className="show-sm" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ flex: 1 }}
          onClick={() => setFilterOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal size={14} /> Filters {activeFilters > 0 && `(${activeFilters})`}
        </button>
        <select
          className="select"
          style={{ flex: 1 }}
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          aria-label="Sort products"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2 wrap mb-3">
          {category && (
            <span className="filter-chip">
              {categories.find((c) => c.slug === category)?.name || category}
              <button onClick={() => update({ category: '' })} aria-label="Remove category filter"><X size={12} /></button>
            </span>
          )}
          {brand && (
            <span className="filter-chip">
              {brands.find((b) => String(b.id) === brand)?.name || 'Brand'}
              <button onClick={() => update({ brand: '' })} aria-label="Remove brand filter"><X size={12} /></button>
            </span>
          )}
          {range && (
            <span className="filter-chip">
              {range}
              <button onClick={() => update({ range: '' })} aria-label="Remove price filter"><X size={12} /></button>
            </span>
          )}
          {minRating && (
            <span className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {minRating}.0 & above
              <button onClick={() => update({ minRating: '' })} aria-label="Remove rating filter"><X size={12} /></button>
            </span>
          )}
          {inStock && (
            <span className="filter-chip">
              In Stock Only
              <button onClick={() => update({ inStock: '' })} aria-label="Remove stock filter"><X size={12} /></button>
            </span>
          )}
          <button className="btn btn-ghost btn-xs" onClick={clearAll} style={{ color: 'var(--danger)' }}>
            Clear all
          </button>
        </div>
      )}

      {/* Layout: sidebar + products */}
      <div className="shop-layout">
        {/* Desktop sidebar */}
        <FilterSidebar
          categories={categories}
          brands={brands}
          filters={filters}
          onUpdate={update}
          onClear={clearAll}
        />

        {/* Products area */}
        <div>
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 16 }).map((_, i) => (
                <ProductCardSkeletonMini key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={reload} />
          ) : !items.length ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              message={
                search
                  ? `No results for "${search}". Try a different search term or remove some filters.`
                  : "Try adjusting your filters to find what you're looking for."
              }
              action={
                <button className="btn btn-primary" onClick={clearAll}>
                  View All Products
                </button>
              }
            />
          ) : (
            <>
              <div className="product-grid">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Products">
        <FilterSidebar
          categories={categories}
          brands={brands}
          filters={filters}
          onUpdate={update}
          onClear={clearAll}
        />
        <div style={{ padding: '16px 0 0', borderTop: '1px solid var(--border)', marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-outline flex-1" onClick={clearAll}>Clear All</button>
          <button className="btn btn-primary flex-1" onClick={() => setFilterOpen(false)}>
            Show Results {meta.total > 0 && `(${meta.total})`}
          </button>
        </div>
      </Drawer>

      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}
