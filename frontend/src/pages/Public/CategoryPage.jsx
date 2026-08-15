import React, { useEffect, useState, useParams } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderTree, Folder, Check, Trash } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useList } from '../../hooks/useApi'

export default function CategoryPage() {
  const { category } = useParams()
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/categories', { params: { with_children: true } }).then((res) => {
      setProducts(res.data.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}><Skeleton height={180} /><Skeleton height={180} /></div>
  }

  if (error) return <ErrorState onRetry={() => {}} />

  // Find the selected category
  const selectedCat = products.find(c => c.name.toLowerCase() === category?.toLowerCase())

  if (loading || !selectedCat) {
    return <div className="p-8 text-center"><h2 style={{ fontSize: 24 }}>Category: {category}</h2><p style={{ color: '#6b7280', marginTop: 16 }}>Loading category…</p></div>
  }

  // Get products in this category
  const fetcher = async (page) => api.get('/products', { params: { category: selectedCat.slug || category, per_page: 20, page } })
  const { items, meta } = useList(fetcher, { pageSize: 20 })

  if (loading) return <div><Skeleton height={180} /></div>

  return (
    <div className="py-8">
      <div className="container">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>{selectedCat.name}</h1>
            <p style={{ color: '#6b7280', marginBottom: 8 }}>{selectedCat.description || 'Browse products in this category'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small>Product count: {selectedCat.products_count || 0}</small>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showRating />
          ))}
        </div>

        <Pagination page={meta.page} lastPage={meta.last_page} total={meta.total} onChange={() => {}} />
      </div>
    </div>
  )
}