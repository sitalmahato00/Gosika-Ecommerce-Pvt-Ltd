import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderTree, Plus, Edit, Trash2, Search, Box, Package,
  LayoutGrid, List, Eye, Percent
} from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'

const CATEGORY_IMAGE_MAP = {
  'food-beverages': { image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80' },
  'apparel': { image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80' },
  'home-living': { image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80' },
  'beauty-care': { image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80' },
  'electronics': { image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
  'handicrafts': { image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80' },
  'sports-outdoors': { image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' },
}

export default function AdminCategories() {
  const toast = useToast()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    api.get('/admin/categories')
      .then((r) => {
        setCategories(api.unwrapList(r.data))
      })
      .catch(() => toast.error('Failed to load categories.'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [toast])

  const getCategoryImage = (cat) => {
    if (cat.image) return cat.image
    const slug = (cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ''
    if (CATEGORY_IMAGE_MAP[slug]?.image) return CATEGORY_IMAGE_MAP[slug].image
    for (const key of Object.keys(CATEGORY_IMAGE_MAP)) {
      if (slug.includes(key) || key.includes(slug)) return CATEGORY_IMAGE_MAP[key].image
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80'
  }

  const doDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products stay in the catalog but lose this department link.`)) return
    setDeleting(cat.id)
    try {
      await api.delete(`/admin/categories/${cat.id}`)
      toast.success('Category deleted')
      load()
    } catch (e) {
      toast.error('Failed to delete category. It may still have products linked.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const totalProducts = categories.reduce((s, c) => s + (Number(c.products_count) || 0), 0)
  const taxed = categories.filter((c) => Number(c.tax_rate) > 0).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Categories & Tax</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage marketplace departments, VAT rates, navigation icons, and cover images.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="date-filter-group" style={{ marginRight: 8 }}>
            <button
              className={`date-filter-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={13} style={{ display: 'inline', marginRight: 4 }} /> Table
            </button>
            <button
              className={`date-filter-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={13} style={{ display: 'inline', marginRight: 4 }} /> Grid
            </button>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/marketplace/categories/new')}>
            <Plus size={14} /> Add New Category
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Departments</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{categories.length}</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog Items</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalProducts}</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Taxed Departments</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb' }}>{taxed}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search categories by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted text-sm">{filtered.length} department{filtered.length !== 1 ? 's' : ''} listed</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={FolderTree}
          title={search ? `No categories matching "${search}"` : 'No categories found'}
          message={search ? 'Try searching for another category.' : 'Add marketplace departments to organize vendor products.'}
          action={
            <button className="btn btn-primary" onClick={() => navigate('/admin/marketplace/categories/new')}>
              <Plus size={14} /> Add New Category
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug / Identifier</th>
                  <th>VAT Rate</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/marketplace/categories/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="thumb" style={{ width: 52, height: 52, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                          <img src={getCategoryImage(c)} alt={c.name} className="thumb-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold text-sm text-ink">{c.name}</div>
                          <div className="muted text-xs">{c.parent_id ? 'Sub-category' : 'Top Level Department'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs muted">{c.slug}</span>
                    </td>
                    <td>
                      <span className={`chip chip-sm ${Number(c.tax_rate) > 0 ? '' : 'chip-muted'}`}>
                        <Percent size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                        {Number(c.tax_rate) || 0}%
                      </span>
                    </td>
                    <td><span className="font-bold text-ink">{c.products_count ?? 0}</span></td>
                    <td>
                      <span className="chip chip-sm" style={{ background: c.status === 'active' ? 'var(--success-bg)' : '#f1f5f9', color: c.status === 'active' ? 'var(--success)' : '#64748b' }}>
                        {c.status === 'active' ? 'Live' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/marketplace/categories/${c.id}`) }} title="View category">
                          <Eye size={12} /> View
                        </button>
                        <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/marketplace/categories/${c.id}/edit`) }} title="Edit category">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="btn btn-danger-outline btn-xs" disabled={deleting === c.id} onClick={(e) => { e.stopPropagation(); doDelete(c) }} title="Delete category">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card card-pad-none card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate(`/admin/marketplace/categories/${c.id}`)}>
              <div style={{ height: 130, position: 'relative', overflow: 'hidden' }}>
                <img src={getCategoryImage(c)} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%)' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{c.name}</div>
                </div>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono muted">slug: {c.slug}</span>
                  <span className="chip chip-sm">VAT {Number(c.tax_rate) || 0}%</span>
                </div>
                <div className="muted text-xs mb-3">{c.products_count ?? 0} products · {c.status}</div>
                <div className="flex items-center justify-end gap-1 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/marketplace/categories/${c.id}`) }}>
                    <Eye size={12} /> View
                  </button>
                  <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/marketplace/categories/${c.id}/edit`) }}>
                    <Edit size={12} /> Edit
                  </button>
                  <button className="btn btn-danger-outline btn-xs" disabled={deleting === c.id} onClick={(e) => { e.stopPropagation(); doDelete(c) }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}