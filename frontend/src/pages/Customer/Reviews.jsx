import React, { useEffect, useState } from 'react'
import { Star, StarHalf, XCircle, Check, Trash, Edit, Eye } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/reviews').then((res) => {
      setReviews(res.data.data?.reviews || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={180} /></div>
  }

  if (!reviews.length) return <EmptyState icon={Star} title="No Reviews" message="You haven't written any reviews yet." />

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Your Reviews</h2>

        {reviews.map((r) => (
          <div key={r.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 16 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex">
                {Array(r.rating).fill(1).map((_, i) => (
                  <span key={i} className="text-primary text-xs" />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', ml: 8 }}>{r.rating}/5</span>
            </div>
            <p style={{ fontSize: 14, marginBottom: 8, color: 'var(--muted)' }}>{r.review_text}</p>
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--muted)' }}>{r.customer_name}</span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>{formatDate(r.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}