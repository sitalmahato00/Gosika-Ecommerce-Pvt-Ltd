import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDateTime, errorMessage, getProductImage, getStoreImage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'

export default function AdminProductDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: product, loading, error, reload, setData } = useApi(() => api.get(`/products/${id}`), { deps: [id] })

  const isPending = product?.status === 'pending_review' || product?.status === 'pending'

  const doApprove = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/admin/products/${id}/approve`)
      if (res.data?.data) setData(res.data.data)
      toast.success('Product approved and published.')
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve product.'))
    } finally {
      setBusy(false)
    }
  }

  const doReject = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/admin/products/${id}/reject`, { reason: reason || 'Rejected by marketplace administrator.' })
      if (res.data?.data) setData(res.data.data)
      toast.success('Product rejected.')
      setRejectOpen(false)
      setReason('')
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject product.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={200} />
        <Skeleton height={300} />
      </div>
    )
  }

  if (error || !product) {
    return <ErrorState message={errorMessage(error, 'Product not found.')} onRetry={reload} />
  }

  const images = Array.isArray(product.images) ? product.images : []

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-2 muted text-sm" aria-label="Breadcrumb">
        <Link to="/admin/products" style={{ color: 'var(--primary)' }}>← Products</Link>
        <span>/</span>
        <span className="font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>Product Dossier</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Inspect listing details, stock, variants, and approve or reject this product.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button type="button" className="btn btn-success btn-sm" onClick={doApprove} disabled={busy}>
                <CheckCircle2 size={14} /> Approve
              </button>
              <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setRejectOpen(true)} disabled={busy}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <span
            className="thumb"
            style={{ width: 88, height: 88, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}
          >
            <img src={getProductImage(product)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 20, margin: 0, color: 'var(--ink)' }}>{product.name}</h2>
            <div className="muted text-sm">SKU: {product.sku || '—'} · Views: {product.views_count || 0}</div>
            <div className="mt-1">
              <StatusBadge status={product.status} />
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 16 }}>
          <div><div className="font-medium">Price</div><div className="kpi-value text-success">{money(product.price)}</div></div>
          <div><div className="font-medium">Compare-at</div><div className="kpi-value">{product.compare_at_price ? money(product.compare_at_price) : '—'}</div></div>
          <div><div className="font-medium">Stock</div><div className="kpi-value">{product.quantity} units</div></div>
          <div><div className="font-medium">Category</div><div className="muted">{product.category?.name || '—'}</div></div>
          <div><div className="font-medium">Brand</div><div className="muted">{product.brand?.name || '—'}</div></div>
        </div>

        <div className="mt-4">
          <div className="font-medium">Description</div>
          <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>{product.description || '—'}</div>
          {product.short_description && <div className="mt-2 muted text-sm">{product.short_description}</div>}
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <div className="font-medium mb-2">Images</div>
            <div className="flex gap-2 wrap">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={apiImage(img.url)}
                  alt={`${product.name} ${i + 1}`}
                  style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                />
              ))}
            </div>
          </div>
        )}

        {product.variants?.length > 0 && (
          <div className="mt-4">
            <div className="font-medium mb-2">Variants ({product.variants.length})</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Compare-at</th>
                    <th>Stock</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.id}>
                      <td className="font-semibold text-sm">{v.name || '—'}</td>
                      <td className="font-mono text-xs">{v.sku || '—'}</td>
                      <td>{money(v.price)}</td>
                      <td className="muted">{v.compare_at_price ? money(v.compare_at_price) : '—'}</td>
                      <td>{v.quantity}</td>
                      <td className="muted text-xs">
                        {v.options && typeof v.options === 'object' && Object.keys(v.options).length > 0
                          ? JSON.stringify(v.options)
                          : Array.isArray(v.attributes) && v.attributes.length > 0
                            ? v.attributes.map((a) => `${a.attribute}: ${a.value}`).join(', ')
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {product.store && (
          <div className="mt-4 card" style={{ padding: 16, margin: 0, background: 'var(--bg)' }}>
            <div className="flex items-center gap-3">
              <span className="avatar" style={{ width: 44, height: 44, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, background: '#fff' }}>
                <img src={getStoreImage(product.store)} alt={product.store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </span>
              <div>
                <div className="font-bold text-sm text-ink">{product.store.name}</div>
                <div className="muted text-xs">Slug: {product.store.slug}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 muted text-xs flex items-center gap-4">
          <span>Created: {formatDateTime(product.created_at)}</span>
          {product.updated_at && <span>Updated: {formatDateTime(product.updated_at)}</span>}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={doReject}
        danger
        loading={busy}
        title="Reject Product Submission"
        message="Please state a reason why this product cannot be approved for the marketplace."
        confirmText="Confirm Rejection"
      >
        <div style={{ marginTop: 12 }}>
          <textarea
            className="textarea"
            rows={3}
            placeholder="e.g. Inappropriate images, incorrect pricing, or incomplete specifications."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
