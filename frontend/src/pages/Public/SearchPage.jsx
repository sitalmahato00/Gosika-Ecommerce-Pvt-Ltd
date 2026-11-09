import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Clock3, TrendingUp } from 'lucide-react'
import api from '../../api/client'
import ProductCard, { ProductCardSkeletonMini } from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { useList } from '../../hooks/useApi'

const RECENT_SEARCHES_KEY = 'gosika_recent_searches'
const POPULAR_SEARCHES = ['New arrivals', 'Kurtas', 'Skincare', 'Mobile accessories', 'Home essentials']

function readRecentSearches() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((term) => typeof term === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') || ''
  const [query, setQuery] = useState(q)
  const [recent, setRecent] = useState(readRecentSearches)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState('')

  useEffect(() => {
    setQuery(q)
  }, [q])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2 || term === q) {
      setSuggestions([])
      setSuggestionsLoading(false)
      setSuggestionsError('')
      return undefined
    }

    let active = true
    setSuggestionsLoading(true)
    setSuggestionsError('')
    const timer = setTimeout(() => {
      api.get('/products/suggestions', { params: { q: term }, skipCache: true })
        .then((res) => {
          if (active) setSuggestions(Array.isArray(res.data?.data) ? res.data.data : [])
        })
        .catch(() => {
          if (active) {
            setSuggestions([])
            setSuggestionsError('Search suggestions are temporarily unavailable.')
          }
        })
        .finally(() => {
          if (active) setSuggestionsLoading(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, q])

  const fetcher = (page, pageSize) => q
    ? api.get('/products', { params: { search: q, page, per_page: pageSize } })
    : Promise.resolve({ data: { data: [], meta: { total: 0, last_page: 1 } } })
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [q], pageSize: 20 })

  const rememberSearch = (term) => {
    const next = [term, ...recent.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5)
    setRecent(next)
    try {
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
    } catch {
      setSuggestionsError('Recent searches could not be saved on this device.')
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    rememberSearch(term)
    setPage(1)
    setSuggestions([])
    navigate('/search?q=' + encodeURIComponent(term))
  }

  const clearSearch = () => {
    setQuery('')
    setPage(1)
    setSuggestions([])
    navigate('/search')
  }

  const searchFor = (term) => {
    setQuery(term)
    rememberSearch(term)
    setPage(1)
    setSuggestions([])
    navigate('/search?q=' + encodeURIComponent(term))
  }

  return (
    <div className="page-shell container search-page">
      <header className="search-page-heading">
        <h1>Search products</h1>
        <p>{q ? <>Showing results for <strong>“{q}”</strong></> : 'Find products, brands, and categories across Gosika Marketplace.'}</p>
      </header>

      <div className="search-panel">
        <form className="search-form" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="marketplace-search">Search products, brands, and categories</label>
          <Search size={19} aria-hidden="true" />
          <input
            id="marketplace-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands, categories..."
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-outline search-clear" onClick={clearSearch}>Clear</button>
        </form>

        {(suggestionsLoading || suggestionsError || suggestions.length > 0) && query.trim().length >= 2 && query.trim() !== q && (
          <div className="search-suggestions" role="status" aria-live="polite">
            {suggestionsLoading && <span>Finding suggestions…</span>}
            {suggestionsError && <span>{suggestionsError}</span>}
            {!suggestionsLoading && !suggestionsError && suggestions.map((suggestion, index) => {
              const label = typeof suggestion === 'string'
                ? suggestion
                : suggestion.name || suggestion.label || suggestion.title
              return label ? (
                <button key={`${label}-${index}`} type="button" onClick={() => searchFor(label)}>
                  <Search size={14} /> {label}
                </button>
              ) : null
            })}
          </div>
        )}
      </div>

      {!q ? (
        <section className="search-discovery" aria-label="Search suggestions">
          <div className="search-empty-icon"><Search size={25} /></div>
          <h2>What are you looking for?</h2>
          <p>Start with a popular search or enter a product name above.</p>
          {recent.length > 0 && (
            <div className="search-term-group">
              <h3><Clock3 size={15} /> Recent searches</h3>
              <div className="search-term-list">
                {recent.map((term) => <button key={term} type="button" onClick={() => searchFor(term)}>{term}</button>)}
              </div>
            </div>
          )}
          <div className="search-term-group">
            <h3><TrendingUp size={15} /> Popular searches</h3>
            <div className="search-term-list">
              {POPULAR_SEARCHES.map((term) => <button key={term} type="button" onClick={() => searchFor(term)}>{term}</button>)}
            </div>
          </div>
        </section>
      ) : loading ? (
        <div className="search-product-grid" aria-label="Loading search results" aria-busy="true">
          {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeletonMini key={index} />)}
        </div>
      ) : error ? (
        <ErrorState message="Could not load search results." onRetry={reload} />
      ) : items.length ? (
        <>
          <div className="search-results-summary">{meta.total ?? items.length} products found</div>
          <div className="search-product-grid">
            {items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </>
      ) : (
        <div className="search-no-results">
          <EmptyState
            icon={Search}
            title="No products found"
            message={`We couldn't find products matching “${q}”. Try a different keyword or browse popular searches.`}
            action={(
              <div className="search-term-list">
                {POPULAR_SEARCHES.slice(0, 3).map((term) => <button key={term} type="button" onClick={() => searchFor(term)}>{term}</button>)}
              </div>
            )}
          />
        </div>
      )}
    </div>
  )
}
