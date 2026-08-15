import React, { useEffect, useState } from 'react'
import {
  FolderTree, Plus, Edit, Trash2, Image, Search, Box,
  Shirt, Sparkles, Smartphone, Utensils, Home as HomeIcon, Trophy, Package
} from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PRESET_CAT_IMAGES = [
  { label: 'Clothing & Fashion', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80', iconName: 'Shirt', iconComp: Shirt },
  { label: 'Handicrafts & Art', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80', iconName: 'Sparkles', iconComp: Sparkles },
  { label: 'Electronics & Mobiles', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', iconName: 'Smartphone', iconComp: Smartphone },
  { label: 'Organic Tea & Foods', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', iconName: 'Utensils', iconComp: Utensils },
  { label: 'Shoes & Footwear', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', iconName: 'Trophy', iconComp: Trophy },
  { label: 'Home & Kitchen', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80', iconName: 'Home', iconComp: HomeIcon },
]

export default function AdminCategories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
        toast.success('Category updated')
      } else {
        await api.post('/admin/categories', form)
        toast.success('Category created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      load()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Category Management</h1>
          <p>Organize marketplace departments, navigation icons, and category banner images</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal(null)}>
          <Plus size={15} /> Add New Category
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={140} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={FolderTree} title="No categories found" message="Add your first marketplace category." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card card-pad-none" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  height: 90,
                  background: c.image ? `url(${apiImage(c.image)}) center/cover` : 'linear-gradient(135deg, var(--primary-50), var(--bg))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {!c.image && <FolderTree size={28} color="var(--primary)" />}
              </div>
              <div style={{ padding: 14 }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-ink">{c.name}</span>
                  <span className="chip chip-sm">{c.products_count || 0} products</span>
                </div>
                <div className="muted text-xs mb-3 font-mono">slug: {c.slug}</div>
                <div className="flex items-center justify-end gap-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-outline btn-xs" onClick={() => openModal(c)}>
                    <Edit size={12} /> Edit
                  </button>
                  <button className="btn btn-danger-outline btn-xs" onClick={() => doDelete(c.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={saveCategory}>
            <div className="form-group">
              <label className="label">Category Title <span className="req">*</span></label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Pashmina & Woolens"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Icon Name</label>
                <input
                  className="input"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g. Shirt, Smartphone, Package"
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
              <label className="label">Category Cover Image URL</label>
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
                      onClick={() => setForm({ ...form, image: p.url, icon: p.iconName })}
                    >
                      <Icon size={12} color="var(--primary)" /> {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>Save Category</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}