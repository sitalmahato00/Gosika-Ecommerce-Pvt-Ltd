import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Mail, Phone, Clock, BadgeCheck, Store as StoreIcon, Calendar } from 'lucide-react'
import api from '../api/client'
import ProductCard from '../components/commerce/ProductCard'
import ProductQuickView from '../components/commerce/ProductQuickView'
import RatingStars from '../components/commerce/RatingStars'
import { ProductCardSkeletonMini } from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { useList } from '../hooks/useApi'
import { apiImage, errorMessage, getStoreImage, getStoreBanner, formatDate } from '../utils/format'

export default function Store() {
  const { id } = useParams()
  const [store, setStore] = useState(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('')
  const [quickView, setQuickView] = useState(null)

  useEffect(() => {
    setStoreLoading(true)
    setError(null)
    api
      .get(`/marketplace/stores/${id}`)
      .then((r) => setStore(r.data.data))
      .catch((e) => setError(e))
      .finally(() => setStoreLoading(false))
  }, [id])

  const fetcher = useCallback(
    async (page) => api.get(`/marketplace/stores/${id}/products`, { params: { page, per_page: 12, sort: sort || undefined, load: 'brand,images' } }),
    [id, sort],
  )

  const { items, meta, page, setPage, loading, error: listError } = useList(fetcher, { deps: [id, sort], pageSize: 12 })

  if (storeLoading) {
    return (
      <div className="page-shell container">
        <div className="card" style={{ padding: 0 }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
          <div style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 22, width: 200 }} />
            <div className="skeleton" style={{ height: 14, width: 300, marginTop: 12 }} />
          </div>
        </div>
        <div className="product-grid mt-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeletonMini key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !store) {
    return <div className="page-shell container"><ErrorState message={errorMessage(error, 'Store not found.')} /></div>
  }

  const storeBanner = getStoreBanner(store)
  const storeLogo = getStoreImage(store)

  return (
    <div className="page-shell container">
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div style={{ height: 200, position: 'relative', overflow: 'hidden', background: 'var(--navy)' }}>
          <img src={storeBanner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.1) 60%)' }} />
        </div>
        <div style={{ padding: '0 20px 20px', position: 'relative' }}>
          <div className="avatar" style={{ position: 'absolute', top: -36, width: 72, height: 72, border: '4px solid #fff', boxShadow: 'var(--shadow-md)', overflow: 'hidden', background: '#fff' }}>
            <img src={storeLogo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ paddingTop: 44 }}>
            <div className="flex items-center gap-2 wrap">
              <h1 style={{ fontSize: 22, marginBottom: 0 }}>{store.name}</h1>
              <BadgeCheck size={18} color="var(--success)" aria-label="Verified store" />
            </div>
            <div className="flex items-center gap-4 wrap mt-1 text-sm">
              <RatingStars value={store.rating_avg} count={store.rating_count} size={14} />
              <span className="muted">{meta.total || store.product_count || 0} products</span>
              {store.location && (
                <span className="muted flex items-center gap-1"><MapPin size={13} /> {store.location}</span>
              )}
              {store.member_since && (
                <span className="muted flex items-center gap-1"><Calendar size={13} /> Member since {formatDate(store.member_since)}</span>
              )}
            </div>
            {store.description && <p className="muted mt-2" style={{ maxWidth: 720 }}>{store.description}</p>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Contact & Location</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            {store.contact_email && (
              <span className="muted flex items-center gap-1.5" style={{ wordBreak: 'break-all' }}>
                <Mail size={13} style={{ flexShrink: 0 }} /> {store.contact_email}
              </span>
            )}
            {store.contact_phone && (
              <span className="muted flex items-center gap-1.5"><Phone size={13} /> {store.contact_phone}</span>
            )}
            {store.location && (
              <span className="muted flex items-start gap-1.5">
                <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>
                  {store.address?.address_line_1}
                  {store.address?.address_line_2 ? `, ${store.address.address_line_2}` : ''}
                </span>
              </span>
            )}
          </div>
        </div>
        {Array.isArray(store.operating_hours) && store.operating_hours.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>Operating Hours</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }}>
              {store.operating_hours.map((h) => (
                <div key={h.day_of_week} className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.day_of_week] || 'Day'}
                  </span>
                  <span style={{ fontWeight: 700, color: h.is_closed ? '#dc2626' : 'var(--ink)' }}>
                    {h.is_closed ? 'Closed' : `${h.opens_at?.slice(0, 5) || '—'} – ${h.closes_at?.slice(0, 5) || '—'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <h2 style={{ fontSize: 18 }}>Products from {store.name}</h2>
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {loading ? (
        <div className="product-grid mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeletonMini key={i} />
          ))}
        </div>
      ) : listError ? (
        <ErrorState message={errorMessage(listError)} />
      ) : !items.length ? (
        <EmptyState title="No products yet" message="This store hasn't published any products yet. Check back soon." />
      ) : (
        <>
          <div className="product-grid mt-2">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
            ))}
          </div>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </>
      )}

      {quickView && <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />}
    </div>
  )
}
