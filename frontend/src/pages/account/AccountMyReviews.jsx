import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, MessageCircleReply } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { apiImage, formatDate } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountMyReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/customer/reviews', { params: { per_page: 50 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        setReviews(Array.isArray(raw) ? raw : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="My Reviews & Photos" subtitle="Everything you have shared with the community.">
        <AccountSkeleton rows={3} height={96} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="My Reviews & Photos" subtitle="Everything you have shared with the community.">
        <AccountError message="Could not load your reviews." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="My Reviews & Photos" subtitle="Everything you have shared with the community.">
      {reviews.length === 0 ? (
        <AccountEmpty
          icon={MessageSquare}
          title="No reviews yet"
          message="Once you review a purchased product, it shows up here with its approval status."
          action={<Link to="/account/reviews/pending" className="btn btn-primary">Review Purchases</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="flex items-center gap-3">
                  {r.image && (
                    <img src={apiImage(r.image)} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                  )}
                  <div>
                    <div className="font-semibold" style={{ fontSize: 14 }}>{r.product_name}</div>
                    <div className="muted text-xs">{formatDate(r.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rating-stars" aria-label={`Rated ${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i <= r.rating ? '#f59e0b' : 'none'} stroke={i <= r.rating ? '#f59e0b' : '#cbd5e1'} strokeWidth="1.8" style={{ marginRight: 1 }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
              {r.title && <div className="font-semibold" style={{ fontSize: 14 }}>{r.title}</div>}
              {r.body && <p className="m-0" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{r.body}</p>}
              {r.reply && (
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--primary)', marginBottom: 4 }}>
                    <MessageCircleReply size={13} /> Seller / Marketplace reply
                  </span>
                  <div>{r.reply}</div>
                </div>
              )}
              <Link to={`/product/${r.product_id}`} className="text-primary text-sm" style={{ fontWeight: 700, textDecoration: 'none' }}>View product</Link>
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}