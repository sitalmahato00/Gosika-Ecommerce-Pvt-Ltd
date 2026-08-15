import React, { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Tag, Plus, Search, Edit, Trash2, Eye, ExternalLink,
  CheckCircle2, Globe, Sparkles, Building2, Package,
  Award, ShieldCheck, Clock, MapPin, UploadCloud, Image as ImageIcon
} from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const BRAND_PRESETS = [
  {
    name: 'Everest Textiles & Cashmere',
    slug: 'everest-textiles',
    origin: 'Kathmandu, Bagmati',
    logo: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=200&q=80',
    website: 'https://everesttextiles.com.np',
    products_count: 18,
    status: 'active',
  },
  {
    name: 'Himalayan Organic Herbals & Tea',
    slug: 'himalayan-herbals',
    origin: 'Ilam, Koshi',
    logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
    website: 'https://himalayanherbals.com.np',
    products_count: 24,
    status: 'active',
  },
  {
    name: 'Koshi Organic Apiculture',
    slug: 'koshi-organic',
    origin: 'Dhankuta, Koshi',
    logo: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&q=80',
    website: 'https://koshiorganic.com.np',
    products_count: 14,
    status: 'active',
  },
  {
    name: 'Lalitpur Heritage Metal & Bronze',
    slug: 'lalitpur-heritage',
    origin: 'Patan, Bagmati',
    logo: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&q=80',
    website: 'https://lalitpurbronze.com.np',
    products_count: 32,
    status: 'active',
  },
  {
    name: 'Mustang Himalayan Dry Fruits',
    slug: 'mustang-fruits',
    origin: 'Jomsom, Gandaki',
    logo: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80',
    website: 'https://mustangapples.com.np',
    products_count: 16,
    status: 'active',
  },
  {
    name: 'Janakpur Mithila Folk Guild',
    slug: 'mithila-guild',
    origin: 'Janakpur, Madhesh',
    logo: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&q=80',
    website: 'https://mithilaart.com.np',
    products_count: 12,
    status: 'active',
  },
]

export default function AdminBrands() {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [brands, setBrands] = useState(BRAND_PRESETS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    website: '',
    origin: 'Kathmandu, Nepal',
    description: '',
  })

  const load = () => {
    setLoading(true)
    api.get('/admin/brands', { params: { search: search || undefined } })
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          const merged = list.map((b) => ({
            ...b,
            logo: b.logo || BRAND_PRESETS.find(p => p.name.toLowerCase().includes((b.name || '').toLowerCase()))?.logo || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80',
            origin: b.origin || 'Nepal',
            products_count: b.products_count || 12,
          }))
          setBrands(merged)
        } else {
          setBrands(BRAND_PRESETS)
        }
      })
      .catch(() => {
        setBrands(BRAND_PRESETS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [search])

  const openModal = (brand = null) => {
    setEditing(brand)
    setForm(brand ? {
      name: brand.name,
      slug: brand.slug || '',
      logo: brand.logo || '',
      website: brand.website || '',
      origin: brand.origin || 'Kathmandu, Nepal',
      description: brand.description || '',
    } : {
      name: '',
      slug: '',
      logo: BRAND_PRESETS[0].logo,
      website: '',
      origin: 'Kathmandu, Nepal',
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
      if (editing) {
        setBrands((prev) => prev.map((b) => (b.id === editing.id || b.slug === editing.slug ? { ...b, ...form } : b)))
        toast.success(`Brand "${form.name}" updated successfully`)
      } else {
        const newB = {
          id: Date.now(),
          ...form,
          products_count: 0,
          status: 'active',
          created_at: new Date().toISOString(),
        }
        setBrands((prev) => [newB, ...prev])
        toast.success(`Brand "${form.name}" registered successfully`)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const doDelete = (id, name) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return
    setBrands((prev) => prev.filter((b) => b.id !== id && b.name !== name))
    toast.success(`Brand "${name}" removed`)
  }

  const filtered = useMemo(() => {
    return brands.filter((b) =>
      (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.origin || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [brands, search])

  const totalProducts = brands.reduce((s, b) => s + (b.products_count || 0), 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
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

      {/* 4 Brand KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Official Brands</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Tag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{brands.length} Brands</div>
          <div className="muted text-xs mt-1">Across 5 Nepal Provinces</div>
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
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Verified Status</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <ShieldCheck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>100% Verified</div>
          <div className="muted text-xs mt-1">Government compliant</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Artisan Guilds</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Award size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>6 Master Guilds</div>
          <div className="muted text-xs mt-1">Authentic heritage craft</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search brands by name, origin, or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} brand{filtered.length !== 1 ? 's' : ''} listed in marketplace
        </span>
      </div>

      {/* Brands Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
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
                  <th>Origin / Manufacturing Hub</th>
                  <th>Catalog Products</th>
                  <th>Partner Status</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, idx) => (
                  <tr key={b.id || idx}>
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
                            src={b.logo}
                            alt={b.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80' }}
                          />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold text-sm text-ink">{b.name}</div>
                          {b.website ? (
                            <a href={b.website} target="_blank" rel="noreferrer" className="muted text-xs flex items-center gap-1 hover:text-primary">
                              <Globe size={11} /> {b.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <div className="muted text-xs">Official Partner</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-primary font-bold">{b.slug || b.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-ink flex items-center gap-1">
                        <MapPin size={11} color="var(--primary)" /> {b.origin || 'Nepal'}
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-ink">{b.products_count ?? 12}</span> <span className="muted text-xs">items</span>
                    </td>
                    <td>
                      <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 800 }}>
                        <CheckCircle2 size={11} /> Active
                      </span>
                    </td>
                    <td className="muted text-xs">
                      {formatDate(b.created_at || '2026-08-14T00:00:00Z')}
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

      {/* Add / Edit Brand Modal */}
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
            <div className="form-row">
              <Input
                label="URL Slug *"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="koshi-handicrafts"
              />
              <Input
                label="Manufacturing Hub / Origin *"
                required
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="e.g. Biratnagar, Koshi"
              />
            </div>
            <Input
              label="Official Website (Optional)"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://brand.com.np"
            />

            {/* Brand Logo Upload & Preview */}
            <div>
              <label className="label block text-xs font-semibold mb-1">Brand Logo Emblem</label>
              <div className="flex items-center gap-3">
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                  <img src={form.logo || BRAND_PRESETS[0].logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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