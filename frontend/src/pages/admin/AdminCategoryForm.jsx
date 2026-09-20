import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FolderTree, Image, Save, ArrowLeft, Percent
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import Input, { Field } from '../../components/ui/Input'
import ImageUpload from '../../components/ui/ImageUpload'
import { Skeleton } from '../../components/ui/Skeleton'
import { errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PRESET_CAT_IMAGES = [
  { label: 'Clothing & Apparel', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80', icon: 'Shirt' },
  { label: 'Organic Tea & Food', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80', icon: 'Utensils' },
  { label: 'Handicrafts & Art', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80', icon: 'Sparkles' },
  { label: 'Electronics & Mobiles', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', icon: 'Smartphone' },
  { label: 'Beauty & Wellness', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80', icon: 'Sparkles' },
  { label: 'Home & Kitchen', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', icon: 'Home' },
]

const TAX_PRESETS = [0, 1, 5, 13, 15, 20]

export default function AdminCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const editing = Boolean(id)

  const [form, setForm] = useState({
    parent_id: '',
    name: '',
    slug: '',
    icon: 'Package',
    image: '',
    description: '',
    tax_rate: 13,
    sort_order: 0,
    status: 'active',
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/categories')
      .then((r) => setCategories(api.unwrapList(r.data)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!editing) return
    api
      .get(`/admin/categories/${id}`)
      .then((r) => {
        const d = r.data?.data || {}
        setForm({
          parent_id: d.parent_id || '',
          name: d.name || '',
          slug: d.slug || '',
          icon: d.icon || 'Package',
          image: d.image || '',
          description: d.description || '',
          tax_rate: d.tax_rate ?? 13,
          sort_order: d.sort_order || 0,
          status: d.status || 'active',
        })
      })
      .catch((err) => toast.error(errorMessage(err, 'Failed to load category.')))
      .finally(() => setLoading(false))
  }, [id, editing, toast])

  const slugify = (v) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({
      ...f,
      name,
      slug: editing ? f.slug : slugify(name),
    }))
  }

  const parentOptions = categories.filter((c) => !editing || c.id !== id)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        parent_id: form.parent_id || undefined,
        name: form.name,
        slug: form.slug || undefined,
        icon: form.icon,
        image: form.image || undefined,
        description: form.description || undefined,
        tax_rate: Number(form.tax_rate) || 0,
        sort_order: Number(form.sort_order) || 0,
        ...(editing ? { status: form.status } : {}),
      }
      if (editing) {
        await api.put(`/admin/categories/${id}`, payload)
        toast.success(`Category "${form.name}" updated`)
      } else {
        await api.post('/admin/categories', payload)
        toast.success(`Category "${form.name}" created`)
      }
      navigate('/admin/marketplace/categories')
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save category.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <Skeleton height={30} width="40%" />
        <div className="card" style={{ padding: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={60} style={{ marginBottom: 12 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-10">
      <PageHeader
        title={editing ? `Edit Category: ${form.name || ''}` : 'Add New Category'}
        description="Manage the department, tax rate, and display settings applied across the catalog."
        breadcrumbs={[
          { label: 'Catalog & Curation' },
          { label: 'Categories & Tax', to: '/admin/marketplace/categories' },
          { label: editing ? 'Edit Category' : 'New Category' },
        ]}
      />

      <form onSubmit={save}>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderTree size={16} color="var(--primary)" /> Department Details
            </div>

            <Input
              label="Category Title"
              required
              value={form.name}
              onChange={handleName}
              placeholder="e.g. Pashmina & Woolens"
            />

            <div className="form-row">
              <div className="form-group">
                <label className="label">URL Slug</label>
                <input
                  className="input font-mono"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="pashmina-woolens"
                />
              </div>
              <div className="form-group">
                <label className="label">Parent Category</label>
                <select
                  className="input"
                  value={form.parent_id || ''}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                >
                  <option value="">— Top Level (no parent) —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Field label="Description">
              <textarea
                className="textarea"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what products belong in this department."
              />
            </Field>

            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Percent size={16} color="var(--primary)" /> Tax & Shelf Settings
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">VAT / Tax Rate (%)</label>
                <div className="flex gap-2 wrap" style={{ marginBottom: 8 }}>
                  {TAX_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn ${Number(form.tax_rate) === t ? 'btn-primary' : 'btn-ghost'} btn-xs`}
                      onClick={() => setForm({ ...form, tax_rate: t })}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                  placeholder="Custom rate, e.g. 13"
                />
                <p className="helper">New products in this department inherit this rate unless overridden by the seller.</p>
              </div>
              <div className="form-group">
                <label className="label">Sort Order</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
                <p className="helper">Lower numbers appear first in the navigation.</p>
              </div>
            </div>

            {editing && (
              <div className="form-group">
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active — visible to customers</option>
                  <option value="inactive">Inactive — hidden from navigation</option>
                </select>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image size={16} color="var(--primary)" /> Display & Icon
            </div>

            <Field label="Navigation Icon Identifier">
              <input
                className="input"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Package, Shirt, Utensils, Sparkles…"
              />
            </Field>

            <ImageUpload
              label="Department Cover Image"
              value={form.image}
              onChange={(val) => setForm({ ...form, image: val })}
              folder="categories"
              helper="Upload PNG, JPG, or WEBP cover image file"
              previewHeight={130}
            />

            <div>
              <label className="label">Quick Select Presets</label>
              <div className="flex gap-1 wrap">
                {PRESET_CAT_IMAGES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`btn btn-xs ${form.image === p.url ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setForm({ ...form, image: p.url, icon: p.icon })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => navigate('/admin/marketplace/categories')}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1" disabled={saving || !form.name.trim()}>
                <Save size={14} /> {saving ? 'Saving…' : editing ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}