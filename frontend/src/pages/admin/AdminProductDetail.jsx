import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Package, ArrowLeft, CheckCircle, XCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton, EmptyState } from '../../components/ui/Skeleton'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function AdminProductDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/vendor/products/${id}`).then((r) => setProduct(r.data.data)).catch((e) => setError(e)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading product…</div>
  if (error || !product) return <ErrorState message={errorMessage(error, 'Product not found.')} onRetry={() => { useEffect(() => {}, []) }} />

  const statusLabels = { pending_review: 'Pending review', published: 'Published', rejected: 'Rejected' }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1 muted text-sm" aria-label="Breadcrumb">
        <Link to="/admin/products" style={{ color: 'var(--primary)' }}>← Products</Link>
        <span>{product.name}</span>
      </nav>

      <div className="card">
        <div className="flex items-center gap-3">
          <span className="thumb"><Package size={24} /></span>
          <div>
            <h2 style={{ fontSize: 20 }}>{product.name}</h2>
            <div className="muted text-sm">SKU: {product.sku}</div>
            <StatusBadge status={product.status} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div><div className="font-medium">Price</div><div className="kpi-value text-success">{money(product.price)}</div></div>
          <div><div className="font-medium">Compare-at</div><div className="kpi-value">{money(product.compare_at_price || '—')}</div></div>
          <div><div className="font-medium">Stock</div><div className="kpi-value">{product.quantity} (threshold: {product.low_stock_threshold})</div></div>
          <div><div className="font-medium">Category</div><div className="muted">{product.category?.name || '—'}</div></div>
          <div><div className="font-medium">Brand</div><div className="muted">{product.brand?.name || '—'}</div></div>
        </div>

        <div>
          <div className="font-medium">Description</div>
          <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{product.description || '—'}</div>
          {product.short_description && <div className="mt-2 muted text-sm">{product.short_description}</div>}
        </div>

        <div className="mt-4">
          <button className="btn btn-success">Approve product</button>
          <button className="btn btn-danger">Reject product</button>
        </div>
      </div>
    </div>
  )
}