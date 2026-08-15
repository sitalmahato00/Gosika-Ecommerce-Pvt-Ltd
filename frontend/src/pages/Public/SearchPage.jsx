import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useList } from '../../hooks/useApi'

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') || ''
  const [query, setQuery] = useState(q)

  useEffect(() => {
    setQuery(q)
  }, [q])

  const handleSearch = (e) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    navigate('/search?q=' + encodeURIComponent(term))
  }

  const fetcher = (page, pageSize) => api.get('/products', { params: { search: q, page, per_page: pageSize } })
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [q], pageSize: 20 })

  if (loading) {
    return (
      <div className="py-8">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <Skeleton height={180} />
            <Skeleton height={180} />
            <Skeleton height={180} />
            <Skeleton height={180} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="container">
          <ErrorState message="Could not load search results." onRetry={reload} />
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="mb-6">
          <h2 style={{ fontSize: 28 }}>Search Results</h2>
          <p style={{ color: '#6b7280', marginBottom: 12 }}>
            {q ? <>Showing results for <strong>{q}</strong></> : 'Search for products, brands, and categories across Gosika Marketplace.'}
          </p>
        </div>

        <div className="card p-4 mb-6" style={{ borderColor: '#d1d5db' }}>
          <form style={{ display: 'flex', gap: 8, maxWidth: 400 }} onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              aria-label="Search"
            />
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-outline" onClick={() => setQuery('')}>Clear</button>
          </form>
        </div>

        {q ? (
          items.length ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} showRating />
                ))}
              </div>
              <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={Search} title="No results" message={`No products found matching "${q}".`} />
          )
        ) : (
          <div className="empty-state text-center py-12">
            <div className="es-icon"><Search size={48} /></div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Start shopping</h3>
            <p style={{ color: '#6b7280', marginBottom: 12 }}>Enter keywords to find products, brands, or categories</p>
            <form style={{ maxWidth: 300, display: 'flex' }} onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary mt-4">Search</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
