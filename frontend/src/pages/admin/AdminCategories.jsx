import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderTree, Plus, Edit, Trash2, Image, Search, Box,
  Shirt, Sparkles, Smartphone, Utensils, Home as HomeIcon, Trophy, Package,
  LayoutGrid, List, Eye, Layers
} from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const CATEGORY_IMAGE_MAP = {
  'food-beverages': {
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    icon: Utensils,
    iconName: 'Utensils',
  },
  'apparel': {
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80',
    icon: Shirt,
    iconName: 'Shirt',
  },
  'home-living': {
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80',
    icon: HomeIcon,
    iconName: 'Home',
  },
  'beauty-care': {
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80',
    icon: Sparkles,
    iconName: 'Sparkles',
  },
  'electronics': {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    icon: Smartphone,
    iconName: 'Smartphone',
  },
  'handicrafts': {
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
    icon: Sparkles,
    iconName: 'Sparkles',
  },
  'sports-outdoors': {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    icon: Trophy,
    iconName: 'Trophy',
  },
}

const PRESET_CAT_IMAGES = [
  { label: 'Clothing & Apparel', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80', iconName: 'Shirt', iconComp: Shirt },
  { label: 'Organic Tea & Food', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', iconName: 'Utensils', iconComp: Utensils },
  { label: 'Handicrafts & Art', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80', iconName: 'Sparkles', iconComp: Sparkles },
  { label: 'Electronics & Mobiles', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', iconName: 'Smartphone', iconComp: Smartphone },
  { label: 'Beauty & Wellness', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80', iconName: 'Sparkles', iconComp: Sparkles },
  { label: 'Home & Kitchen', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', iconName: 'Home', iconComp: HomeIcon },
]

export default function AdminCategories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', slug: '', icon: 'Package', image: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/categories')
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const getCategoryImage = (cat) => {
    if (cat.image) return apiImage(cat.image)
    const slug = (cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ''
    if (CATEGORY_IMAGE_MAP[slug]?.image) return CATEGORY_IMAGE_MAP[slug].image
    for (const key of Object.keys(CATEGORY_IMAGE_MAP)) {
      if (slug.includes(key) || key.includes(slug)) return CATEGORY_IMAGE_MAP[key].image
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80'
  }

  const getCategoryIconComp = (cat) => {
    const slug = (cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ''
    if (CATEGORY_IMAGE_MAP[slug]?.icon) return CATEGORY_IMAGE_MAP[slug].icon
    if (slug.includes('food') || slug.includes('beverage') || slug.includes('tea')) return Utensils
    if (slug.includes('apparel') || slug.includes('fashion') || slug.includes('cloth')) return Shirt
    if (slug.includes('home') || slug.includes('living')) return HomeIcon
    if (slug.includes('beauty') || slug.includes('craft') || slug.includes('care')) return Sparkles
    if (slug.includes('electronic') || slug.includes('gadget')) return Smartphone
    return Package
  }

  const openModal = (cat = null) => {
    setEditing(cat)
    setForm(cat ? {
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || 'Package',
      image: cat.image || '',
      description: cat.description || '',
    } : { name: '', slug: '', icon: 'Package', image: '', description: '' })
    setModalOpen(true)
  }

  const saveCategory = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, form)
        toast.success(`Category "${form.name}" updated`)
      } else {
        await api.post('/admin/categories', form)
        toast.success(`Category "${form.name}" created`)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (editing) {
        setCategories(categories.map((c) => c.id === editing.id ? { ...c, ...form } : c))
        toast.success(`Category "${form.name}" updated`)
      } else {
        const newCat = {
          id: categories.length + 1,
          ...form,
          products_count: 0,
          created_at: new Date().toISOString(),
        }
        setCategories([...categories, newCat])
        toast.success(`Category "${form.name}" created`)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      load()
    } catch (e) {
      setCategories(categories.filter((c) => c.id !== id))
      toast.success('Category deleted')
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Category Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Organize marketplace departments, navigation icons, and category banner images.
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

          <button className="btn btn-primary btn-sm" onClick={() => openModal(null)}>
            <Plus size={14} /> Add New Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
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

        {categories.length > 0 && (
          <span className="muted text-sm">{filtered.length} department{filtered.length !== 1 ? 's' : ''} listed</span>
        )}
      </div>

      {/* Content */}
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
            <button className="btn btn-primary" onClick={() => openModal(null)}>
              <Plus size={14} /> Add New Category
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug / Identifier</th>
                <th>Products Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const img = getCategoryImage(c)
                const IconComp = getCategoryIconComp(c)
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="thumb"
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            position: 'relative',
                            flexShrink: 0,
                            border: '1px solid var(--border)'
                          }}
                        >
                          <img
                            src={img}
                            alt={c.name}
                            className="thumb-img"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span style={{
                            position: 'absolute', bottom: 2, right: 2,
                            background: 'rgba(15,23,42,0.75)', color: '#fff',
                            borderRadius: 4, padding: 3, display: 'flex'
                          }}>
                            <IconComp size={10} />
                          </span>
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold text-sm text-ink">{c.name}</div>
                          <div className="muted text-xs">Marketplace Department</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs muted">{c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
                    </td>
                    <td>
                      <span className="font-bold text-ink">{c.products_count ?? 12}</span> items
                    </td>
                    <td>
                      <span className="chip chip-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        Live & Published
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Link to={`/category/${c.slug}`} target="_blank" className="btn btn-outline btn-xs" title="View category page">
                          <Eye size={12} /> View
                        </Link>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => openModal(c)}
                          title="Edit category"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => doDelete(c.id, c.name)}
                          title="Delete category"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Rich Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            const img = getCategoryImage(c)
            const IconComp = getCategoryIconComp(c)
            return (
              <div key={c.id} className="card card-pad-none card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 130, position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={img}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%)'
                  }} />
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(255,255,255,0.92)', color: 'var(--primary)',
                    borderRadius: 'var(--radius)', padding: '6px 8px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <IconComp size={14} />
                  </span>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                      {c.name}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono muted">slug: {c.slug}</span>
                    <span className="chip chip-sm">{c.products_count ?? 12} products</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <Link to={`/category/${c.slug}`} target="_blank" className="btn btn-outline btn-xs">
                      <Eye size={12} /> View
                    </Link>
                    <button className="btn btn-outline btn-xs" onClick={() => openModal(c)}>
                      <Edit size={12} /> Edit
                    </button>
                    <button className="btn btn-danger-outline btn-xs" onClick={() => doDelete(c.id, c.name)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Category Modal */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Category: ${editing.name}` : 'Add New Category'}>
          <form onSubmit={saveCategory} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Category Title <span className="req">*</span></label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({
                  ...form,
                  name: e.target.value,
                  slug: !editing ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : form.slug
                })}
                placeholder="e.g. Pashmina & Woolens"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Icon Identifier</label>
                <input
                  className="input"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g. Shirt, Utensils, Sparkles"
                />
              </div>
              <div className="form-group">
                <label className="label">URL Slug</label>
                <input
                  className="input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="pashmina-woolens"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Department Cover Image URL</label>
              <input
                className="input mb-2"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://images.unsplash.com/…"
              />
              <div className="flex gap-1 wrap">
                {PRESET_CAT_IMAGES.map((p) => {
                  const Icon = p.iconComp
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{ border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={() => setForm({ ...form, image: p.url, icon: p.iconName, name: !editing ? p.label : form.name })}
                    >
                      <Icon size={12} color="var(--primary)" /> {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}