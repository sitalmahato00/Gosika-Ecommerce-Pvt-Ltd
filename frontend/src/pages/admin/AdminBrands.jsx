import React, { useState, useRef } from 'react'
import {
  Tag, Plus, Search, Edit, Trash2, UploadCloud, Package,
  ShieldCheck, Award
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'

export default function AdminBrands() {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', logo: '', description: '' })

  const { data: brands, loading, error, reload } = useApi(() => api.get('/admin/brands'))

  const list = Array.isArray(brands) ? brands : []

  const openModal = (brand = null) => {
    setEditing(brand)
    setForm(brand ? {
      name: brand.name || '',
      slug: brand.slug || '',
      logo: brand.logo || '',
      description: brand.description || '',
    } : {
      name: '',
      slug: '',
      logo: '',
      description: '',
    })
    setModalOpen(true)
  }

  const handleFileUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setForm((prev) => ({ ...prev, logo: e.target.result }))
      toast.success('Uploaded custom brand logo')
    }
    reader.readAsDataURL(file)
  }

  const saveBrand = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { name: form.name, slug: form.slug, description: form.description, ...(form.logo && { logo: form.logo }) }
      if (editing) {
        await api.put(`/admin/brands/${editing.id}`, payload)
        toast.success(`Brand "${form.name}" updated successfully`)
      } else {
        await api.post('/admin/brands', payload)
        toast.success(`Brand "${form.name}" registered successfully`)
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save brand.'))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id, name) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return
    try {
      await api.delete(`/admin/brands/${id}`)
      toast.success(`Brand "${name}" removed`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete brand.'))
    }
  }

  const filtered = list.filter((b) =>
    !search ||
    (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.slug || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalProducts = list.reduce((s, b) => s + (b.products_count || 0), 0)
  const activeCount = list.filter((b) => b.status === 'active').length
  const inactiveCount = list.filter((b) => b.status === 'inactive').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Brand & Manufacturer Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage official marketplace brands, trademark logos, artisan guilds, and manufacturing partners across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => openModal(null)}>
            <Plus size={14} /> Add New Brand
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Official Brands</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Tag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{list.length} Brands</div>
          <div className="muted text-xs mt-1">Registered in marketplace</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Catalog Coverage</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Package size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalProducts} Items</div>
          <div className="muted text-xs mt-1">Tagged to verified brands</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Brands</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ShieldCheck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{activeCount} Active</div>
          <div className="muted text-xs mt-1">Currently live</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Inactive Brands</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Award size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{inactiveCount} Inactive</div>
          <div className="muted text-xs mt-1">Not published to catalog</div>
        </div>
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search brands by name, slug, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} brand{filtered.length !== 1 ? 's' : ''} listed in marketplace
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, 'Failed to load brands.')} onRetry={reload} />
      ) : !filtered.length ? (
        <EmptyState
          icon={Tag}
          title={search ? `No brands matching "${search}"` : 'No brands registered'}
          message={search ? 'Try searching for a different brand name.' : 'Register official brands to organize catalog products.'}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Brand & Logo Emblem</th>
                  <th>Slug / URL Identifier</th>
                  <th>Description</th>
                  <th>Catalog Products</th>
                  <th>Partner Status</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="thumb"
                          style={{
                            width: 48,
                            height: 48,
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
                          <img
                            src={apiImage(b.logo, b.name)}
                            alt={b.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold text-sm text-ink">{b.name}</div>
                          <div className="muted text-xs">Official Partner</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-primary font-bold">{b.slug || '—'}</span>
                    </td>
                    <td>
                      <div className="muted text-xs" style={{ maxWidth: 260 }}>{b.description || '—'}</div>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-ink">{b.products_count ?? 0}</span> <span className="muted text-xs">items</span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="muted text-xs">
                      {formatDate(b.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openModal(b)}
                          title="Edit brand profile"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => doDelete(b.id, b.name)}
                          title="Delete brand"
                        >
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
      )}

      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Brand: ${editing.name}` : 'Register New Brand Profile'}>
          <form onSubmit={saveBrand} className="flex flex-col gap-3">
            <Input
              label="Brand / Manufacturer Name *"
              required
              value={form.name}
              onChange={(e) => setForm({
                ...form,
                name: e.target.value,
                slug: !editing ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : form.slug
              })}
              placeholder="e.g. Koshi Handicrafts"
            />
            <Input
              label="URL Slug *"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="koshi-handicrafts"
            />
            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of the brand, artisan guild, or manufacturer."
              />
            </div>

            <div>
              <label className="label block text-xs font-semibold mb-1">Brand Logo Emblem</label>
              <div className="flex items-center gap-3">
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <img src={apiImage(form.logo, form.name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />
                  <button type="button" className="btn btn-outline btn-xs" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud size={12} /> Upload Custom Logo
                  </button>
                  <div className="muted text-xs mt-1" style={{ fontSize: 11 }}>Recommended size: 200x200 PNG or JPEG</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Brand' : 'Create Brand'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
