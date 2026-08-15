import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tag } from 'lucide-react'
import api from '../../api/client'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useList } from '../../hooks/useApi'

export default function BrandPage() {
  const { brand } = useParams()
  const [brands, setBrands] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(true)

  useEffect(() => {
    setBrandsLoading(true)
    api
      .get('/brands')
      .then((res) => setBrands(res.data.data || []))
      .catch(() => setBrands([]))
      .finally(() => setBrandsLoading(false))
  }, [])

  const fetcher = (page, pageSize) => api.get('/products', { params: { brand, page, per_page: pageSize } })
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [brand], pageSize: 20 })

  const selectedBrand = brands.find((b) => b.slug === brand)
  const title = selectedBrand?.name || brand || 'Brand'

  if (brandsLoading || loading) {
    return (
      <div className="py-8">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <Skeleton height={180} />
            <Skeleton height={180} />
            <Skeleton height={180} />
            <Skeleton height={180} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="container">
          <ErrorState message="Could not load products for this brand." onRetry={reload} />
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="py-8">
        <div className="container">
          <h2 style={{ fontSize: 24 }}>Brand: {title}</h2>
          <EmptyState icon={Tag} title="No products" message={`No products from ${title} yet.`} />
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>{title}</h1>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>Products from {title}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small>Product count: {meta.total || 0}</small>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showRating />
          ))}
        </div>

        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      </div>
    </div>
  )
}
