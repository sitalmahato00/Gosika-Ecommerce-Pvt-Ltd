import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Store,
  Tag, Layers, RefreshCw, ExternalLink, ShieldCheck,
  AlertTriangle, Image as ImageIcon, Truck,
  Boxes, Maximize2
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/admin/ErrorState'
import { money, formatDateTime, getProductImage, getStoreImage, apiImage, humanizeEnum } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PRODUCT_STATUSES = ['draft', 'pending_review', 'published', 'out_of_stock', 'hidden', 'archived']

export default function AdminProductDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)

  const [deliveredOrders, setDeliveredOrders] = useState([])
  const [deliveredLoading, setDeliveredLoading] = useState(true)
  const [deliveredPagination, setDeliveredPagination] = useState(null)
  const [deliveredPage, setDeliveredPage] = useState(1)

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
      setActiveImage(0)
    } catch (err) {
      setError('Product listing could not be found.')
    } finally {
      setLoading(false)
    }
  }

  const loadDeliveredOrders = async () => {
    setDeliveredLoading(true)
    try {
      const res = await api.get(`/admin/products/${id}/delivered-orders`, { params: { page: deliveredPage, per_page: 12 } })
      setDeliveredOrders(api.unwrapList(res.data))
      setDeliveredPagination(res.data?.meta?.pagination || null)
    } catch (err) {
      setDeliveredOrders([])
      setDeliveredPagination(null)
    } finally {
      setDeliveredLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [id])

  useEffect(() => {
    if (id) loadDeliveredOrders()
  }, [id, deliveredPage])

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

  const [statusSaving, setStatusSaving] = useState(false)

  const handleStatusChange = async (e) => {
    const next = e.target.value
    if (!next || next === (product.status?.value || product.status)) return

    setStatusSaving(true)
    try {
      await api.patch(`/admin/products/${product.uuid || product.id}/status`, { status: next })
      toast.success(`Product status changed to "${humanizeEnum(next)}".`)
      loadProduct()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product status.')
    } finally {
      setStatusSaving(false)
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
  const isApproved = product.status === 'published' || product.status === 'approved'
  const images = Array.isArray(product.images) ? product.images : []
  const variants = Array.isArray(product.variants) ? product.variants : []
  const galleryImages = images.map(img => apiImage(img.file_path || img.url))
  const activeSrc = galleryImages[Math.min(activeImage, galleryImages.length - 1)] || getProductImage(product)

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '0 10px'
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
              <select
                className="input"
                value={product.status?.value || product.status}
                onChange={handleStatusChange}
                disabled={statusSaving}
                style={{ height: 34, fontSize: 12.5, borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'transparent', width: 150 }}
              >
                {PRODUCT_STATUSES.map(s => (
                  <option key={s} value={s}>{humanizeEnum(s)}</option>
                ))}
              </select>
            </div>

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

          {/* Suspension Remark */}
          {product.suspension_reason && (
            <div style={{ marginTop: 18, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12.5, color: '#b91c1c', marginBottom: 4 }}>
                <AlertTriangle size={14} /> Suspended by an administrator
              </div>
              <div style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {product.suspension_reason}
              </div>
              {product.suspended_at && (
                <div style={{ fontSize: 11, color: '#991b1b', marginTop: 4, opacity: 0.75 }}>
                  {formatDateTime(product.suspended_at)}
                </div>
              )}
            </div>
          )}

          {/* Product Details / Specs */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={16} color="var(--primary)" /> Product Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 16px', fontSize: 12.5 }}>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Brand</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.brand?.name || '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Category</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.category?.name || '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Weight (g)</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.weight_grams ? `${product.weight_grams}g` : '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Dimensions</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.dimensions || '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>HS Code</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.hs_code || '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Tax Rate</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.tax_rate != null ? `${product.tax_rate}%` : '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Manufacturer</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.manufacturer || '—'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Stock Status</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{humanizeEnum(product.stock_status)}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Featured</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.is_featured ? 'Yes' : 'No'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Negotiable</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.is_negotiable ? 'Yes' : 'No'}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Views</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.views_count ?? 0}</div></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Rating</span><div style={{ fontWeight: 700, color: 'var(--ink)' }}>{product.rating_count ? `${product.rating_avg} ★ (${product.rating_count})` : '—'}</div></div>
            </div>
          </div>

          {/* Attributes */}
          {Array.isArray(product.attributes) && product.attributes.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} color="var(--primary)" /> Attributes ({product.attributes.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.attributes.map((attr, i) => (
                  <span key={i} className="chip" style={{ fontSize: 11.5, background: '#fff7ed', color: '#c2410c', fontWeight: 700 }}>
                    {attr.name}: {(attr.values || []).join(', ') || '—'}
                  </span>
                ))}
              </div>
            </div>
          )}
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
              <ImageIcon size={16} color="var(--primary)" /> Product Gallery ({Math.max(images.length, 1)})
            </h4>

            <a
              href={activeSrc}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                width: '100%',
                height: 340,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                position: 'relative'
              }}
            >
              <img
                src={activeSrc}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(15,23,42,.55)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Maximize2 size={14} />
              </span>
            </a>

            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    title={`View image ${i + 1}`}
                    style={{
                      width: 64,
                      height: 64,
                      flexShrink: 0,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: activeImage === i ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: '#f8fafc',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={src} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
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

      {/* Delivered Orders */}
      <div className="card card-pad-none" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={16} color="var(--primary)" /> Delivered Orders ({product.delivered_orders_count ?? 0})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12 }}>
            <span><Boxes size={13} style={{ verticalAlign: -2 }} /> {product.delivered_units ?? 0} units</span>
            <span style={{ fontWeight: 800, color: '#16a34a' }}>{money(product.delivered_revenue ?? 0)} revenue</span>
          </div>
        </div>

        {deliveredLoading ? (
          <div style={{ padding: '24px 20px' }}>
            <Skeleton height={28} count={6} />
          </div>
        ) : deliveredOrders.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Delivered</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map((o, i) => (
                  <tr key={o.order_id || i}>
                    <td>
                      <Link
                        to={`/admin/orders/${o.order_id}`}
                        style={{ fontWeight: 800, fontSize: 12.5, textDecoration: 'none', color: 'var(--primary)' }}
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{o.customer_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{o.customer_email || ''}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.placed_at ? formatDateTime(o.placed_at) : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.delivered_at ? formatDateTime(o.delivered_at) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{o.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(o.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            No delivered orders recorded for this product yet.
          </div>
        )}

        {deliveredPagination && deliveredPagination.last_page > 1 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)' }}>
            <Pagination
              page={deliveredPagination.current_page}
              lastPage={deliveredPagination.last_page}
              total={deliveredPagination.total}
              onChange={setDeliveredPage}
            />
          </div>
        )}
      </div>

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
