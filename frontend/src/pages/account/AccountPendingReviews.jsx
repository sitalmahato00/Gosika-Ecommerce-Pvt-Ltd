import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import api from '../../api/client'
import { money, apiImage } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountPendingReviews() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/customer/reviews/pending', { params: { per_page: 50 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        setItems(Array.isArray(raw) ? raw : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Pending Reviews" subtitle="Tell the community what you think about items you bought.">
        <AccountSkeleton rows={3} height={64} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Pending Reviews" subtitle="Tell the community what you think about items you bought.">
        <AccountError message="Could not load pending reviews." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="Pending Reviews" subtitle="Tell the community what you think about items you bought.">
      {items.length === 0 ? (
        <AccountEmpty
          icon={Star}
          title="All caught up!"
          message="You have reviewed every eligible purchase. New reviews appear here as items are delivered."
          action={<Link to="/account/orders" className="btn btn-primary">View Orders</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((it) => (
            <div key={it.id} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {it.image && (
                <img src={apiImage(it.image)} alt={it.product_name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="font-semibold" style={{ fontSize: 14.5 }}>{it.product_name}</div>
                <div className="muted text-xs">
                  #{it.order_number} · Qty {it.quantity} · {money(Number(it.unit_price))}
                </div>
              </div>
              <Link to={`/product/${it.product_id}`} className="btn btn-primary btn-sm">
                <Star size={14} /> Write Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}