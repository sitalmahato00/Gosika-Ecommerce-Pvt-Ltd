import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Pencil, ArrowLeft, Package, ShieldCheck, Globe, Trash2, Calendar,
  Building2, FileSearch, Award
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminBrandDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/admin/brands/${id}`)
      .then((r) => {
        const d = r.data?.data || null
        setBrand(d)
        if (d?.id) {
          api.get('/admin/products', { params: { brand: d.id, per_page: 5 } })
            .then((pr) => setProducts(api.unwrapList(pr.data)))
            .catch(() => setProducts([]))
        }
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [id])

  const doDelete = async () => {
    if (!window.confirm(`Delete brand "${brand?.name}"?`)) return
    try {
      await api.delete(`/admin/brands/${id}`)
      toast.success('Brand removed')
      navigate('/admin/marketplace/brands')
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to delete brand.'))
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <Skeleton height={30} width="40%" />
        <Skeleton height={180} />
        <Skeleton height={120} />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <EmptyState
        icon={Building2}
        title="Brand not found"
        message={errorMessage(error, 'Brand not found or no longer available.')}
        action={<button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/marketplace/brands')}>Back to Brands</button>}
      />
    )
  }

  return (
    <div className="w-full pb-10">
      <PageHeader
        title={brand.name}
        description={brand.description || 'Official brand profile registered in the marketplace catalog.'}
        breadcrumbs={[
          { label: 'Catalog & Curation' },
          { label: 'Brands & Authorizations', to: '/admin/marketplace/brands' },
          { label: brand.slug },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => navigate('/admin/marketplace/brands')}>
              <ArrowLeft size={14} /> Back
            </button>
            <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => navigate(`/admin/marketplace/brands/${brand.id}/edit`)}>
              <Pencil size={14} /> Edit Brand
            </button>
          </>
        }
      />

      <div className="card" style={{ padding: 24, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
        <span
          className="thumb"
          style={{
            width: 92,
            height: 92,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: '#fff',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img src={apiImage(brand.logo, brand.name)} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>{brand.name}</div>
          <div className="font-mono text-xs text-primary" style={{ marginTop: 2 }}>/{brand.slug}</div>
          {brand.description && <p className="muted text-sm" style={{ margin: '8px 0 0' }}>{brand.description}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <StatusBadge status={brand.status} />
          <span className="chip chip-sm muted"><Calendar size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> {formatDate(brand.created_at)}</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog Products</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}><Package size={17} /></span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{brand.products_count ?? 0}</div>
          <div className="muted text-xs mt-1">Linked products</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Authorization</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}><ShieldCheck size={17} /></span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: brand.status === 'active' ? 'var(--success)' : 'var(--muted)', textTransform: 'capitalize' }}>{brand.status}</div>
          <div className="muted text-xs mt-1">Trademark authorization</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Identifier</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}><Award size={17} /></span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', fontFamily: 'monospace' }}>#{brand.id}</div>
          <div className="muted text-xs mt-1">Brand registry ID</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="var(--primary)" /> Products Under This Brand
          </div>
          {!products.length ? (
            <EmptyState icon={Package} title="No products yet" message="No catalog products are linked to this brand." />
          ) : (
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <Link
                  key={p.id}
                  to={`/admin/marketplace/products/${p.id}`}
                  className="card card-hover flex items-center justify-between"
                  style={{ padding: '12px 14px', margin: 0, textDecoration: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="thumb" style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={apiImage(p.primary_image?.url || p.image, p.product_name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </span>
                    <div>
                      <div className="font-bold text-sm text-ink">{p.product_name}</div>
                      <div className="muted text-xs">{p.status}</div>
                    </div>
                  </div>
                  <span className="muted text-xs">{p.sku}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSearch size={16} color="var(--primary)" /> Brand Authorization
          </div>
          <p className="muted text-sm" style={{ margin: 0 }}>
            Vendors may file authorization requests to sell under this brand. Review requests from the Authorizations page.
          </p>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1 align-self-start" onClick={() => navigate('/admin/marketplace/brands/requests')}>
            <FileSearch size={14} /> Review Authorization Requests
          </button>
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <Link to={`/brand/${brand.slug}`} target="_blank" className="btn btn-outline btn-sm flex items-center gap-1">
              <Globe size={14} /> Public Page
            </Link>
            <button type="button" className="btn btn-danger-outline btn-sm flex items-center gap-1" onClick={doDelete}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}