import React, { useEffect, useState } from 'react'
import { Calendar, Trash, Zap as Flash, Check, XCircle, Clock } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useList } from '../../hooks/useApi'

export default function DealsPage() {
  const toast = useToast()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/deals/active').then((res) => {
      const data = res.data.data || []
      setDeals(data.map((d) => ({
        ...d,
        discount: d.discount_percentage || (d.compare_at_price && d.price && Math.round(((d.compare_at_price - d.price) / d.compare_at_price) * 100)),
        original_price: d.compare_at_price || d.price,
        sale_price: d.price,
      })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}><Skeleton height={180} /><Skeleton height={180} /></div>
  }

  if (!deals.length) return <EmptyState icon={Flash} title="No active deals" message="No current deals." />

  return (
    <div className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 28 }}>Flash Sale</h2>
          <div>
            <span style={{ fontSize: 12, background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>Today Only</span>
          </div>
        </div>
        <div className="promo-strip" style={{ background: 'linear-gradient(90deg, #ef4444, #f87171)', color: '#fff', padding: '10px 0', margin: '10px 0' }}>
          <span style={{ fontSize: 14 }}>Up to 50% Off - Limited Time Offer</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {deals.map((d) => (
            <ProductCard key={d.id} product={{ ...d, price: d.sale_price, compare_at_price: d.original_price, discount: d.discount }} showRating />
          ))}
        </div>
      </div>
    </div>
  )
}