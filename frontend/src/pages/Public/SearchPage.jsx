import React, { useState, useSearchParams } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')

  const handleSearch = () => {
    if (!query.trim()) return
    navigate(`/search-results?q=${encodeURIComponent(query)}&category=${category}&brand=${brand}`)
  }

  const fetcher = async () => {
    const p = {}
    if (query) p.search = query
    if (category) p.category = category
    if (brand) p.brand = brand
    return api.get('/products', { params: p })
  }
  const { items, error } = useList(fetcher)

  if (error) return <ErrorState onRetry={() => {}} />

  if (!items.length && query) return <EmptyState icon={Search} title="No results" message="No products found matching your search." />

  return (
    <div className="py-8">
      <div className="container">
        <div className="mb-6">
          <h2 style={{ fontSize: 28 }}>Search Results</h2>
          <p style={{ color: '#6b7280', marginBottom: 12 }}>Showing results for <strong>{query || ''}</strong></p>
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

        {query ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} showRating />
            ))}
          </div>
        ) : (
          <div className="empty-state text-center py-12">
            <div className="es-icon"><Search size={48} /></div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Start shopping</h3>
            <p style={{ color: '#6b7280', marginBottom: 12 }}>Enter keywords to find products, brands, or categories</p>
            <form style={{ maxWidth: 300, display: 'flex' }} onSubmit={handleSearch}>
              <input type="text" placeholder="Search..." required />
              <button type="submit" className="btn btn-primary mt-4">Search</button>
            </form>
          </div>
        )}

        {!query && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <span style={{ marginRight: 8 }}><Search size={16} /></span>
            Start typing to search products, brands, and categories across Gosika Marketplace.
          </div>
        )}
      </div>
    </div>
  )
}