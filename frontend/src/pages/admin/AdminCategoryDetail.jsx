import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Pencil, ArrowLeft, Percent, Layers, Package, FolderTree, Globe, Trash2, Calendar
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { errorMessage, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminCategoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/admin/categories/${id}`)
      .then((r) => setCategory(r.data?.data || null))
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [id])

  const doDelete = async () => {
    if (!window.confirm(`Delete category "${category?.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      navigate('/admin/marketplace/categories')
    } catch (e) {
      toast.error(errorMessage(e, 'Failed to delete category.'))
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

  if (error || !category) {
    return <ErrorState message={error ? errorMessage(error) : 'Category not found.'} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="w-full pb-10">
      <PageHeader
        title={category.name}
        description="Category profile, tax rate, and department hierarchy."
        breadcrumbs={[
          { label: 'Catalog & Curation' },
          { label: 'Categories & Tax', to: '/admin/marketplace/categories' },
          { label: category.slug },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => navigate('/admin/marketplace/categories')}>
              <ArrowLeft size={14} /> Back
            </button>
            <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => navigate(`/admin/marketplace/categories/${category.id}/edit`)}>
              <Pencil size={14} /> Edit Category
            </button>
          </>
        }
      />

      <div className="card card-pad-none" style={{ overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: 170, position: 'relative' }}>
          <img
            src={category.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80'}
            alt={category.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.7), rgba(15,23,42,0.05))' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--primary)', borderRadius: 'var(--radius)', padding: '8px 10px', display: 'flex' }}>
              <FolderTree size={20} />
            </span>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{category.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'monospace' }}>{category.slug}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>VAT / Tax Rate</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}><Percent size={17} /></span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{category.tax_rate ?? 0}%</div>
          <div className="muted text-xs mt-1">Applied to catalog price</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog Products</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}><Package size={17} /></span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{category.products_count ?? 0}</div>
          <div className="muted text-xs mt-1">Linked products</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Sub-categories</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}><Layers size={17} /></span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{category.children?.length ?? 0}</div>
          <div className="muted text-xs mt-1">Nested departments</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Status</span>
            <StatusBadge status={category.status} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', textTransform: 'capitalize' }}>{category.status}</div>
          <div className="muted text-xs mt-1">Marketplace visibility</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderTree size={16} color="var(--primary)" /> Department Metadata
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between"><span className="muted text-sm">Parent Department</span><span className="font-semibold text-sm">{category.parent?.name || 'Top Level'}</span></div>
            <div className="flex justify-between"><span className="muted text-sm">Slug</span><span className="font-mono text-sm text-primary">{category.slug}</span></div>
            <div className="flex justify-between"><span className="muted text-sm">Navigation Icon</span><span className="font-semibold text-sm">{category.icon || '—'}</span></div>
            <div className="flex justify-between"><span className="muted text-sm">Sort Order</span><span className="font-semibold text-sm">{category.sort_order ?? 0}</span></div>
            <div className="flex justify-between"><span className="muted text-sm">Created</span><span className="font-semibold text-sm flex items-center gap-1"><Calendar size={13} /> {formatDate(category.created_at)}</span></div>
          </div>
          {category.description && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div className="muted text-xs font-bold uppercase mb-1" style={{ letterSpacing: '0.04em' }}>Description</div>
              <p className="text-sm text-ink" style={{ lineHeight: 1.6, margin: 0 }}>{category.description}</p>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--primary)" /> Sub-categories
          </div>
          {!category.children?.length ? (
            <EmptyState icon={Layers} title="No sub-categories" message="This department has no nested categories yet." />
          ) : (
            category.children.map((child) => (
              <Link
                key={child.id}
                to={`/admin/marketplace/categories/${child.id}`}
                className="card card-hover flex items-center justify-between"
                style={{ padding: '12px 14px', margin: 0, textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="avatar" style={{ width: 30, height: 30 }}><FolderTree size={14} /></span>
                  <div>
                    <div className="font-bold text-sm text-ink">{child.name}</div>
                    <div className="muted text-xs font-mono">{child.slug}</div>
                  </div>
                </div>
                <span className="chip chip-sm">{child.products_count ?? 0} products</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Link to={`/category/${category.slug}`} target="_blank" className="btn btn-outline btn-sm flex items-center gap-1">
          <Globe size={14} /> View Public Page
        </Link>
        <button type="button" className="btn btn-danger-outline btn-sm flex items-center gap-1" onClick={doDelete}>
          <Trash2 size={14} /> Delete Category
        </button>
      </div>
    </div>
  )
}