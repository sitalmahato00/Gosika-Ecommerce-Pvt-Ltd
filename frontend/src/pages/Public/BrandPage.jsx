import React, { useEffect, useState, useParams } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Tag, Box, Check, Trash, Eye, Edit } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useList } from '../../hooks/useApi'

export default function BrandPage() {
  const { brand } = useParams()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/brands', { params: { brand } }).then((res) => {
      setProducts(res.data.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}><Skeleton height={180} /><Skeleton height={180} /></div>
  }

  if (!products.length) return <EmptyState icon={Tag} title="No products" message="No products from this brand." />

  return (
    <div className="py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>{brand}</h1>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>Products from {brand}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small>Product count: {products.length}</small>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} showRating />
          ))}
        </div>
      </div>
    </div>
  )
}