import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import api from '../../api/client'
import { apiImage, getStoreImage } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountStores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/customer/stores', { params: { per_page: 50 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        setStores(Array.isArray(raw) ? raw : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Followed Stores" subtitle="Stores you have bought from — revisit them to find more great products.">
        <AccountSkeleton rows={2} height={150} asCards={false} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Followed Stores" subtitle="Stores you have bought from — revisit them to find more great products.">
        <AccountError message="Could not load your stores." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="Followed Stores" subtitle="Stores you have bought from — revisit them to find more great products.">
      {stores.length === 0 ? (
        <AccountEmpty
          icon={Store}
          title="No stores yet"
          message="Stores you order from will appear here. Explore the marketplace to discover new sellers."
          action={<Link to="/shop" className="btn btn-primary">Explore Shops</Link>}
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {stores.map((s) => (
            <Link
              key={s.id}
              to={`/store/${s.id}`}
              className="card"
              style={{ padding: 18, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={s.logo ? apiImage(s.logo) : getStoreImage(s)}
                  alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div className="font-semibold" style={{ fontSize: 15 }}>{s.name}</div>
                <div className="muted text-xs">{(s.products_count ?? 0).toLocaleString()} products</div>
              </div>
              <span className="btn btn-outline btn-sm" style={{ textAlign: 'center' }}>Visit Store</span>
            </Link>
          ))}
        </div>
      )}
    </AccountPage>
  )
}