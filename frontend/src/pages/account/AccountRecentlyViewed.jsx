import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'
import { timeAgo } from '../../utils/format'

export default function AccountRecentlyViewed() {
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/marketplace/recently-viewed', { params: { per_page: 24 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        setViews(Array.isArray(raw) ? raw : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Recently Viewed" subtitle="Products you looked at, ready to pick up where you left off.">
        <AccountSkeleton rows={3} height={220} asCards={false} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Recently Viewed" subtitle="Products you looked at, ready to pick up where you left off.">
        <AccountError message="Could not load recently viewed products." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="Recently Viewed" subtitle="Products you looked at, ready to pick up where you left off.">
      {views.length === 0 ? (
        <AccountEmpty
          icon={History}
          title="Nothing viewed yet"
          message="Products you browse on the marketplace will appear here so you can find them again easily."
          action={<Link to="/shop" className="btn btn-primary">Browse Products</Link>}
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {views.map((v) => (
            <div key={v.id} style={{ position: 'relative' }}>
              <ProductCard product={v.product} />
              {v.viewed_at && (
                <div className="muted text-xs" style={{ textAlign: 'center', marginTop: 6 }}>Viewed {timeAgo(v.viewed_at)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}