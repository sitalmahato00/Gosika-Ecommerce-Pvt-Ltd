import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Store,
  Tag, Layers, RefreshCw, ExternalLink, ShieldCheck,
  AlertTriangle, Image as ImageIcon
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/admin/ErrorState'
import { money, formatDateTime, getProductImage, getStoreImage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminProductDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null,
    loading: false
  })

  const loadProduct = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/admin/products/${id}`).catch(() => api.get(`/products/${id}`))
      setProduct(res.data?.data || null)
    } catch (err) {
      setError('Product listing could not be found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [id])

  const handleConfirmAction = async (reason) => {
    const { action } = dialogState
    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = product.uuid || product.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/products/${targetId}/approve`)
        toast.success(`"${product.name}" approved and published!`)
      } else if (action === 'reject') {
        await api.post(`/admin/products/${targetId}/reject`, { reason })
        toast.success(`"${product.name}" rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/products/${targetId}/suspend`, { reason })
        toast.success(`"${product.name}" suspended.`)
      }

      setDialogState({ isOpen: false, action: null, loading: false })
      loadProduct()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={40} width={220} />
        <Skeleton height={280} style={{ borderRadius: 14 }} />
        <Skeleton height={200} style={{ borderRadius: 14 }} />
      </div>
    )
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product Not Found"
        message={error || 'The requested product could not be retrieved from the catalog.'}
        onRetry={loadProduct}
      />
    )
  }

  const isPending = product.status === 'pending_review' || product.status === 'pending'
  const isApproved = product.status === 'approved'
  const images = Array.isArray(product.images) ? product.images : []
  const variants = Array.isArray(product.variants) ? product.variants : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku || 'N/A'} · Added ${formatDateTime(product.created_at)}`}
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Products', to: '/admin/marketplace/products' },
          { label: product.name }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700 }}
                  onClick={() => setDialogState({ isOpen: true, action: 'approve', loading: false })}
                >
                  <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Approve & Publish
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => setDialogState({ isOpen: true, action: 'reject', loading: false })}
                >
                  <XCircle size={14} style={{ marginRight: 4 }} /> Reject Listing
                </button>
              </>
            )}

            {isApproved && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => setDialogState({ isOpen: true, action: 'suspend', loading: false })}
              >
                Suspend Listing
              </button>
            )}
          </div>
        }
      />

      {/* Main Grid: Gallery & Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 20 }} id="admin-prod-grid">
        <style>{`@media(max-width:860px){#admin-prod-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Product Details Card */}
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                flexShrink: 0
              }}
            >
              <img
                src={getProductImage(product)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <StatusBadge status={product.status} />
                <span className="chip chip-sm" style={{ background: '#f1f5f9', fontWeight: 600, fontSize: 11 }}>
                  {product.category?.name || 'General'}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>
                {product.name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>
                SKU: {product.sku} {product.barcode ? `· Barcode: ${product.barcode}` : ''}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Market Price</span>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>{money(product.price)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Regular Price</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginTop: 2 }}>
                {product.compare_at_price ? money(product.compare_at_price) : '—'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Stock Quantity</span>
              <div style={{ fontSize: 18, fontWeight: 900, color: product.quantity > 0 ? 'var(--ink)' : '#dc2626', marginTop: 2 }}>
                {product.quantity} units
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
              Product Description
            </h4>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {product.description || 'No description provided.'}
            </div>
            {product.short_description && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5, color: '#64748b' }}>
                <strong>Summary:</strong> {product.short_description}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Vendor & Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Fulfilling Vendor & Store */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Store size={16} color="var(--primary)" /> Fulfilling Merchant
            </h4>

            {product.store || product.vendor ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={getStoreImage(product.store || product.vendor)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    {product.store?.name || product.vendor?.company_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {product.vendor?.business_email || ''}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>No vendor linked.</div>
            )}
          </div>

          {/* Product Gallery Images */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={16} color="var(--primary)" /> Gallery Media ({images.length})
            </h4>

            {images.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                No extra gallery images uploaded.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 10 }}>
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      background: '#f8fafc'
                    }}
                  >
                    <img
                      src={apiImage(img.file_path || img.url)}
                      alt={`Gallery ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variants Table if any */}
      {variants.length > 0 && (
        <div className="card card-pad-none" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Product Variants ({variants.length})</h3>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Variant Name</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Stock Qty</th>
                  <th>Options</th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id || v.uuid}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{v.name || 'Default Variant'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.sku || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(v.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{v.quantity}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {v.options ? JSON.stringify(v.options) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Product "${product.name}"?`
            : dialogState.action === 'reject'
            ? `Reject Product "${product.name}"?`
            : `Suspend Product "${product.name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will immediately publish this product on the marketplace.'
            : 'Please provide the administrative reason for this rejection or suspension.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve & Publish' : dialogState.action === 'reject' ? 'Reject' : 'Suspend'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Specify reason (e.g. Prohibited SKU, misleading title, invalid pricing)..."
      />
    </div>
  )
}
