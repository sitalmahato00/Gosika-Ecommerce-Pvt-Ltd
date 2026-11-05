import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  SlidersHorizontal, X, PackageSearch, ChevronDown,
  ChevronRight, LayoutGrid, List, Search, Star, MapPin
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
import VendorCard from '../components/commerce/VendorCard'
import { getSearchLocation } from '../utils/searchLocation'

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

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

const toggleSelection = (values, value) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

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
  const [customPrice, setCustomPrice] = useState({ min: filters.minPrice, max: filters.maxPrice })
  const [priceError, setPriceError] = useState('')

  useEffect(() => {
    setCustomPrice({ min: filters.minPrice, max: filters.maxPrice })
    setPriceError('')
  }, [filters.minPrice, filters.maxPrice])

  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  )

  return (
    <aside className="filter-sidebar" aria-label="Product filters">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className="font-semibold" style={{ fontSize: 14 }}>Filters</span>
          <span style={{ display: 'block', marginTop: 2, color: 'var(--muted)', fontSize: 11 }}>Match any choice per section; sections combine.</span>
        </div>
        {hasActiveFilters && (
          <button className="btn btn-ghost btn-xs" onClick={onClear} style={{ color: 'var(--danger)' }}>
            Clear All
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label className="checkbox-row" style={{ padding: '5px 0' }}>
            <input
              type="checkbox"
              checked={filters.category.length === 0}
              onChange={() => onUpdate({ category: [] })}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ flex: 1, fontSize: 13 }}>All Categories</span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className="checkbox-row" style={{ padding: '5px 0' }}>
              <input
                type="checkbox"
                checked={filters.category.includes(c.slug)}
                onChange={() => onUpdate({ category: toggleSelection(filters.category, c.slug) })}
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
            <input
              type="checkbox"
              checked={filters.priceRanges.length === 0 && !filters.minPrice && !filters.maxPrice}
              onChange={() => onUpdate({ priceRange: [], minPrice: '', maxPrice: '' })}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: 13 }}>Any Price</span>
          </label>
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="checkbox-row" style={{ padding: '5px 0' }}>
              <input
                type="checkbox"
                checked={filters.priceRanges.includes(r.key)}
                onChange={() => onUpdate({ priceRange: toggleSelection(filters.priceRanges, r.key) })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 13 }}>{r.label}</span>
            </label>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const min = customPrice.min === '' ? '' : Number(customPrice.min)
            const max = customPrice.max === '' ? '' : Number(customPrice.max)
            if (min !== '' && max !== '' && min > max) {
              setPriceError('Minimum price must not exceed maximum price.')
              return
            }
            setPriceError('')
            onUpdate({ minPrice: min === '' ? '' : String(min), maxPrice: max === '' ? '' : String(max) })
          }}
          style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}
        >
          <span style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Custom price (Rs.)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label="Minimum price"
              placeholder="Min"
              value={customPrice.min}
              onChange={(event) => setCustomPrice((current) => ({ ...current, min: event.target.value }))}
              style={{ width: '50%', minWidth: 0, padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
            />
            <span aria-hidden="true">–</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label="Maximum price"
              placeholder="Max"
              value={customPrice.max}
              onChange={(event) => setCustomPrice((current) => ({ ...current, max: event.target.value }))}
              style={{ width: '50%', minWidth: 0, padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
            />
          </div>
          {priceError && <p role="alert" style={{ margin: '6px 0 0', color: 'var(--danger)', fontSize: 11 }}>{priceError}</p>}
          <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 8 }}>Apply price</button>
        </form>
      </FilterSection>

      {brands.length > 0 && (
        <FilterSection title="Brand" defaultOpen={false}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {brands.slice(0, 15).map((b) => (
              <label key={b.id} className="checkbox-row" style={{ padding: '5px 0' }}>
                <input
                  type="checkbox"
                  checked={filters.brand.includes(String(b.id))}
                  onChange={() => onUpdate({ brand: toggleSelection(filters.brand, String(b.id)) })}
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
                type="checkbox"
                checked={filters.minRatings.includes(r.value)}
                onChange={() => onUpdate({ minRatings: toggleSelection(filters.minRatings, r.value) })}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 13 }}>{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen={false}>
        {AVAILABILITY_OPTIONS.map((option) => (
          <label key={option.value} className="checkbox-row" style={{ padding: '5px 0' }}>
            <input
              type="checkbox"
              checked={filters.availability.includes(option.value)}
              onChange={() => onUpdate({ availability: toggleSelection(filters.availability, option.value) })}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: 13 }}>{option.label}</span>
          </label>
        ))}
      </FilterSection>
    </aside>
  )
}

function StoreDirectory() {
  const fetcher = useCallback(
    (page) => api.get('/marketplace/stores', { params: { page, per_page: 12 } }),
    [],
  )
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { pageSize: 12 })

  return (
    <div className="page-shell container">
      <div className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Stores</span>
      </div>
      <div className="mb-3">
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Shop by Store</h1>
        <p className="muted text-sm m-0">
          {loading ? 'Loading stores…' : `${meta.total} store${meta.total === 1 ? '' : 's'} to explore`}
        </p>
      </div>
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeletonMini key={index} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, 'Could not load stores.')} onRetry={reload} />
      ) : items.length ? (
        <>
          <div className="product-grid">
            {items.map((store) => <VendorCard key={store.id} store={store} />)}
          </div>
          <div style={{ marginTop: 24 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      ) : (
        <EmptyState title="No stores available" message="There are no active stores to show right now. Please check back soon." />
      )}
    </div>
  )
}

function ProductShop() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [filterOpen, setFilterOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [quickView, setQuickView] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  const search = params.get('search') || ''
  const category = params.getAll('category')
  const brand = params.getAll('brand')
  const store = params.get('store') || ''
  const filter = params.get('filter') || ''
  const nearby = params.get('nearby') === '1'
  const sort = params.get('sort') || (filter === 'deals' ? 'discount' : search ? 'rating' : '')
  const legacyRange = params.get('range') || ''
  const priceRanges = params.getAll('priceRange').length
    ? params.getAll('priceRange')
    : PRICE_RANGES.filter((range) => range.label === legacyRange).map((range) => range.key)
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const minRatings = params.getAll('minRating')
  const availability = params.getAll('availability')
  if (availability.length === 0 && params.get('inStock') === '1') availability.push('in_stock')
  const mode = params.get('mode') || ''

  const filters = { category, brand, priceRanges, minPrice, maxPrice, minRatings, availability }

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(() => {})
    api.get('/brands').then((r) => setBrands(r.data.data || [])).catch(() => {})
  }, [])

  const buildParams = useCallback((p) => {
    const q = {
      per_page: 16,
      load: 'brand,store,images',
      sort: p.sort || (p.filter === 'deals' ? 'discount' : p.search ? 'rating' : undefined),
      discount: p.filter === 'deals' ? 1 : undefined,
      search: p.search || undefined,
      category: p.category.length ? p.category : undefined,
      brand: p.brand.length ? p.brand : undefined,
      store: p.store || undefined,
      min_rating: p.minRatings.length ? p.minRatings : undefined,
      availability: p.availability.length ? p.availability : undefined,
      price_ranges: p.priceRanges.length ? p.priceRanges : undefined,
      min_price: p.minPrice || undefined,
      max_price: p.maxPrice || undefined,
      featured: p.mode === 'featured' ? 1 : undefined,
    }
    if (p.nearby === '1') {
      const location = getSearchLocation()
      if (location) {
        q.latitude = location.latitude
        q.longitude = location.longitude
      }
    }
    return q
  }, [])

  const fetcher = useCallback(
    async (page) => api.get('/products', {
      params: {
        ...buildParams({
          ...Object.fromEntries(params),
          category,
          brand,
          priceRanges,
          minPrice,
          maxPrice,
          minRatings,
          availability,
        }),
        page,
      },
    }),
    [params, buildParams, category, brand, priceRanges, minPrice, maxPrice, minRatings, availability],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [
      search, category.join(','), brand.join(','), store, sort, priceRanges.join(','),
      minPrice, maxPrice, minRatings.join(','), availability.join(','), mode, filter, nearby,
    ],
    pageSize: 16,
  })

  const update = (patch, reset = true) => {
    const next = new URLSearchParams(params)
    if ('priceRange' in patch || 'minPrice' in patch || 'maxPrice' in patch) next.delete('range')
    if ('availability' in patch) next.delete('inStock')
    Object.entries(patch).forEach(([k, v]) => {
      next.delete(k)
      if (Array.isArray(v)) {
        v.forEach((value) => next.append(k, value))
      } else if (v !== '' && v !== null && v !== undefined) {
        next.set(k, v)
      }
    })
    if (reset) {
      next.delete('page')
      setPage(1)
    }
    setParams(next, { replace: true })
  }

  const clearAll = () => navigate('/shop', { replace: true })

  const activeFilters =
    category.length + brand.length + priceRanges.length + minRatings.length + availability.length +
    Number(Boolean(minPrice || maxPrice)) + Number(Boolean(filter))
  const pageTitle = category.length === 1
    ? categories.find((c) => c.slug === category[0])?.name || 'Products'
    : category.length > 1
    ? 'Filtered Products'
    : search
    ? `Results for "${search}"`
    : filter === 'deals'
    ? 'Flash Deals'
    : 'All Products'

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        {category.length > 0 ? (
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
          {nearby && (
            <p className="muted text-xs m-0" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={13} /> Nearby stores first, then top rated
            </p>
          )}
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
          {category.map((slug) => (
            <span key={slug} className="filter-chip">
              {categories.find((c) => c.slug === slug)?.name || slug}
              <button onClick={() => update({ category: category.filter((item) => item !== slug) })} aria-label={`Remove ${slug} category filter`}><X size={12} /></button>
            </span>
          ))}
          {brand.map((id) => (
            <span key={id} className="filter-chip">
              {brands.find((item) => String(item.id) === id)?.name || 'Brand'}
              <button onClick={() => update({ brand: brand.filter((item) => item !== id) })} aria-label="Remove brand filter"><X size={12} /></button>
            </span>
          ))}
          {priceRanges.map((key) => (
            <span key={key} className="filter-chip">
              {PRICE_RANGES.find((item) => item.key === key)?.label || key}
              <button onClick={() => update({ priceRange: priceRanges.filter((item) => item !== key) })} aria-label="Remove price range filter"><X size={12} /></button>
            </span>
          ))}
          {(minPrice || maxPrice) && (
            <span className="filter-chip">
              Rs. {minPrice || '0'} – {maxPrice || 'Any'}
              <button onClick={() => update({ minPrice: '', maxPrice: '' })} aria-label="Remove custom price filter"><X size={12} /></button>
            </span>
          )}
          {minRatings.map((rating) => (
            <span key={rating} className="filter-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {rating}.0 & above
              <button onClick={() => update({ minRating: minRatings.filter((item) => item !== rating) })} aria-label={`Remove ${rating} star rating filter`}><X size={12} /></button>
            </span>
          ))}
          {availability.map((status) => (
            <span key={status} className="filter-chip">
              {AVAILABILITY_OPTIONS.find((item) => item.value === status)?.label || status}
              <button onClick={() => update({ availability: availability.filter((item) => item !== status) })} aria-label={`Remove ${status} availability filter`}><X size={12} /></button>
            </span>
          ))}
          {filter === 'deals' && (
            <span className="filter-chip">
              Flash Deals
              <button onClick={() => update({ filter: '' })} aria-label="Remove flash deals filter"><X size={12} /></button>
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

export default function Shop() {
  const [params] = useSearchParams()
  return params.get('mode') === 'stores' ? <StoreDirectory /> : <ProductShop />
}
