import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Tag } from 'lucide-react'
import api from '../../api/client'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { apiImage, errorMessage } from '../../utils/format'

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    api.get('/brands')
      .then((response) => {
        if (active) setBrands(response.data?.data || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visibleBrands = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query
      ? brands.filter((brand) => brand.name?.toLowerCase().includes(query))
      : brands
  }, [brands, search])

  return (
    <div className="page-shell container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">/</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Top Brands</span>
      </nav>

      <div className="flex items-center justify-between gap-3 wrap mb-3">
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Shop by Brand</h1>
          <p className="muted text-sm m-0">Explore products from your favorite brands.</p>
        </div>
        <label className="search-bar" style={{ maxWidth: 340, width: '100%' }}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brands…"
            aria-label="Search brands"
          />
        </label>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} height={180} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, 'Could not load brands.')} />
      ) : visibleBrands.length ? (
        <div className="product-grid">
          {visibleBrands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brand/${brand.slug || brand.id}`}
              className="card card-hover"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20, textAlign: 'center', textDecoration: 'none' }}
            >
              <div style={{ position: 'relative', width: 88, height: 88, display: 'grid', placeItems: 'center', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 16, background: '#fff' }}>
                <span style={{ position: 'absolute', color: 'var(--primary)', fontSize: 24, fontWeight: 800 }}>
                  {brand.name?.charAt(0)?.toUpperCase() || <Tag size={28} />}
                </span>
                {brand.logo ? (
                  <img
                    src={apiImage(brand.logo)}
                    alt={`${brand.name} logo`}
                    onError={(event) => { event.currentTarget.style.display = 'none' }}
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', padding: 8, background: '#fff' }}
                  />
                ) : null}
              </div>
              <div>
                <h2 className="m-0" style={{ color: 'var(--ink)', fontSize: 15 }}>{brand.name}</h2>
                <span className="muted text-xs">
                  {brand.products_count || 0} products
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title={search ? 'No matching brands' : 'No brands available'}
          message={search ? 'Try another brand name.' : 'There are no active brands to show right now.'}
        />
      )}
    </div>
  )
}
