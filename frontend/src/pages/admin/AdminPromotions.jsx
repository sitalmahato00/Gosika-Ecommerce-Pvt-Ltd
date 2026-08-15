import React, { useState, useMemo } from 'react'
import {
  Megaphone, Plus, Search, Edit, Trash2, Image as ImageIcon, Calendar, Tag,
  Download, Eye, EyeOff, LayoutGrid, List, Sparkles, TrendingUp,
  Percent, Clock, ExternalLink, Upload, CheckCircle2, AlertTriangle
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_PROMOTIONS = [
  {
    id: 1,
    title: 'Bada Dashain Mahotsav 2026',
    subtitle: 'Grand Festive Celebration on Handwoven Pashmina & Traditional Attire',
    type: 'Seasonal Festival Campaign',
    placement: 'Homepage Hero Banner',
    discount: 'Up to 50% Off',
    link: '/category/handicrafts',
    banner_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80',
    startDate: '15 Sept 2026',
    endDate: '30 Oct 2026',
    impressions: '148,200',
    clicks: '8,410',
    status: 'scheduled',
  },
  {
    id: 2,
    title: 'Dipawali & Tihar Lighting Fair',
    subtitle: 'Handcrafted Brass Oil Lamps, Diyo Sets & Auspicious Decor',
    type: 'Category Flash Promo',
    placement: 'Category Header Banner',
    discount: 'Flat 20% Off Brass Crafts',
    link: '/category/metal-crafts',
    banner_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1000&auto=format&fit=crop&q=80',
    startDate: '25 Oct 2026',
    endDate: '15 Nov 2026',
    impressions: '92,100',
    clicks: '4,650',
    status: 'scheduled',
  },
  {
    id: 3,
    title: 'Monsoon Artisan Craft Expo',
    subtitle: 'Handloom Dhaka Sarees, Wooden Sculptures & Herbal Wellness',
    type: 'Flash Deals Carousel',
    placement: 'Deals Carousel',
    discount: 'Free Shipping + 15% Off',
    link: '/deals',
    banner_url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1000&auto=format&fit=crop&q=80',
    startDate: '01 Aug 2026',
    endDate: '31 Aug 2026',
    impressions: '184,300',
    clicks: '9,820',
    status: 'active',
  },
  {
    id: 4,
    title: 'Ilam Organic Orthodox Tea Harvest',
    subtitle: 'Single-estate loose leaf orthodox green and black teas fresh from Ilam',
    type: 'Product Spotlight Strip',
    placement: 'Homepage Spotlight Strip',
    discount: 'Buy 2 Get 10% Off',
    link: '/category/tea-coffee',
    banner_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1000&auto=format&fit=crop&q=80',
    startDate: '05 Aug 2026',
    endDate: '25 Aug 2026',
    impressions: '64,000',
    clicks: '3,110',
    status: 'active',
  },
]

export default function AdminPromotions() {
  const toast = useToast()
  const [promotions, setPromotions] = useState(SAMPLE_PROMOTIONS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPromo, setEditPromo] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    type: 'Seasonal Festival Campaign',
    placement: 'Homepage Hero Banner',
    discount: '',
    link: '/deals',
    banner_url: '',
    startDate: '15 Sept 2026',
    endDate: '30 Oct 2026',
    status: 'active',
  })

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setForm((prev) => ({ ...prev, banner_url: url }))
      toast.success('Campaign banner image selected!')
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (editPromo) {
      setPromotions(promotions.map((p) => p.id === editPromo.id ? {
        ...p,
        title: form.title,
        subtitle: form.subtitle || p.subtitle,
        type: form.type,
        placement: form.placement,
        discount: form.discount,
        link: form.link || p.link,
        banner_url: form.banner_url || p.banner_url,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      } : p))
      toast.success(`Promotion "${form.title}" updated successfully`)
      setEditPromo(null)
    } else {
      const newPromo = {
        id: Date.now(),
        title: form.title,
        subtitle: form.subtitle || 'Special featured marketplace campaign',
        type: form.type,
        placement: form.placement,
        discount: form.discount,
        link: form.link || '/deals',
        banner_url: form.banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80',
        startDate: form.startDate,
        endDate: form.endDate,
        impressions: '0',
        clicks: '0',
        status: form.status || 'active',
      }
      setPromotions([newPromo, ...promotions])
      toast.success(`Campaign banner "${newPromo.title}" created successfully!`)
      setCreateOpen(false)
    }
    setForm({
      title: '',
      subtitle: '',
      type: 'Seasonal Festival Campaign',
      placement: 'Homepage Hero Banner',
      discount: '',
      link: '/deals',
      banner_url: '',
      startDate: '15 Sept 2026',
      endDate: '30 Oct 2026',
      status: 'active',
    })
  }

  const toggleStatus = (id) => {
    setPromotions(promotions.map((p) => p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p))
    toast.info('Promotion status updated')
  }

  const doDeletePromo = () => {
    if (!deleteTarget) return
    setPromotions(promotions.filter((p) => p.id !== deleteTarget.id))
    toast.success(`Promotion "${deleteTarget.title}" deleted permanently`)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchTitle = (p.title || '').toLowerCase().includes(q)
        const matchType = (p.type || '').toLowerCase().includes(q)
        const matchPlace = (p.placement || '').toLowerCase().includes(q)
        const matchDisc = (p.discount || '').toLowerCase().includes(q)
        if (!matchTitle && !matchType && !matchPlace && !matchDisc) return false
      }
      return true
    })
  }, [promotions, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Campaign Title', 'Subtitle', 'Type', 'Placement Slot', 'Discount Hook', 'Run Duration', 'Impressions', 'Clicks', 'Status'],
      ...filtered.map((p) => [
        p.title,
        p.subtitle,
        p.type,
        p.placement,
        p.discount,
        `${p.startDate} to ${p.endDate}`,
        p.impressions,
        p.clicks,
        p.status,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_campaigns_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Campaigns ledger exported to CSV')
  }

  // Counts
  const totalCount = promotions.length
  const activeCount = promotions.filter(p => p.status === 'active').length
  const scheduledCount = promotions.filter(p => p.status === 'scheduled').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Promotions & Campaign Banners
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage marketplace featured marketing banners, seasonal festival promotions, and deal slots across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => {
              setForm({
                title: '',
                subtitle: '',
                type: 'Seasonal Festival Campaign',
                placement: 'Homepage Hero Banner',
                discount: '',
                link: '/deals',
                banner_url: '',
                startDate: '15 Sept 2026',
                endDate: '30 Oct 2026',
                status: 'active',
              })
              setCreateOpen(true)
            }}
          >
            <Plus size={14} /> Create New Campaign
          </button>
        </div>
      </div>

      {/* 4 Campaign Marketing KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Live Campaigns</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Megaphone size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{activeCount} Active Banners</div>
          <div className="muted text-xs mt-1">Homepage hero & category strips</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Impressions</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Eye size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>488.6K Views</div>
          <div className="muted text-xs mt-1">Marketplace wide visibility</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Click-Through Rate</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>4.82% CTR</div>
          <div className="muted text-xs mt-1">26,000+ promo clicks</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Attributed GMV</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Sparkles size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Rs. 1.48M</div>
          <div className="muted text-xs mt-1">Festive promotional sales</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Campaigns (${totalCount})` },
          { value: 'active', label: `Active (${activeCount})` },
          { value: 'scheduled', label: `Scheduled (${scheduledCount})` },
          { value: 'paused', label: `Paused (${promotions.filter(p => p.status === 'paused').length})` },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & View Mode Switcher */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search campaigns, placements, or discounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="muted text-xs font-semibold">
            {filtered.length} campaign{filtered.length !== 1 ? 's' : ''} listed
          </span>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('grid')}
              title="Campaign Cards View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          {filtered.map((p) => {
            const isActive = p.status === 'active'
            const statusBg = isActive ? '#ecfdf5' : p.status === 'scheduled' ? '#f0f9ff' : '#f8fafc'
            const statusColor = isActive ? '#10b981' : p.status === 'scheduled' ? '#0284c7' : '#64748b'

            return (
              <div
                key={p.id}
                className="card flex flex-col justify-between"
                style={{
                  padding: 0,
                  margin: 0,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Visual Banner Preview */}
                <div style={{ position: 'relative', width: '100%', height: 140, background: '#1e293b' }}>
                  <img
                    src={p.banner_url}
                    alt={p.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'
                    }}
                  />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {p.placement}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span
                      style={{
                        background: statusBg,
                        color: statusColor,
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontWeight: 800,
                        fontSize: 11,
                        textTransform: 'capitalize',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px 18px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-primary">{p.discount}</span>
                      <span className="muted text-xs">{p.type}</span>
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                      {p.title}
                    </div>

                    <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {p.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-xs muted pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span>Run: <strong>{p.startDate} → {p.endDate}</strong></span>
                      <span><strong>{p.impressions}</strong> views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${isActive ? 'btn-outline' : 'btn-success'}`}
                      style={{ fontSize: 11 }}
                      onClick={() => toggleStatus(p.id)}
                    >
                      {isActive ? 'Pause Banner' : 'Activate Banner'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="btn btn-outline btn-xs flex items-center gap-1"
                        style={{ fontSize: 11 }}
                        onClick={() => {
                          setEditPromo(p)
                          setForm({
                            title: p.title,
                            subtitle: p.subtitle || '',
                            type: p.type,
                            placement: p.placement,
                            discount: p.discount,
                            link: p.link || '',
                            banner_url: p.banner_url || '',
                            startDate: p.startDate,
                            endDate: p.endDate,
                            status: p.status,
                          })
                        }}
                      >
                        <Edit size={11} /> Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger-outline btn-xs"
                        style={{ padding: '4px 7px' }}
                        title="Delete campaign"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Campaign Title & Banner</th>
                  <th>Campaign Type</th>
                  <th>Placement Area</th>
                  <th>Discount Hook</th>
                  <th>Run Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.banner_url}
                          alt={p.title}
                          style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover', background: '#e2e8f0' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'
                          }}
                        />
                        <div>
                          <div className="font-bold text-sm text-ink">{p.title}</div>
                          <div className="muted text-xs line-clamp-1">{p.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted text-xs">{p.type}</td>
                    <td>
                      <span className="chip chip-sm">{p.placement}</span>
                    </td>
                    <td>
                      <span className="font-bold text-primary text-sm">{p.discount}</span>
                    </td>
                    <td className="muted text-xs">
                      {p.startDate} to {p.endDate}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-active' : p.status === 'scheduled' ? 'badge-info' : 'badge-draft'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`btn ${p.status === 'active' ? 'btn-outline' : 'btn-success'} btn-xs`}
                          onClick={() => toggleStatus(p.id)}
                        >
                          {p.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            setEditPromo(p)
                            setForm({
                              title: p.title,
                              subtitle: p.subtitle || '',
                              type: p.type,
                              placement: p.placement,
                              discount: p.discount,
                              link: p.link || '',
                              banner_url: p.banner_url || '',
                              startDate: p.startDate,
                              endDate: p.endDate,
                              status: p.status,
                            })
                          }}
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 size={11} />
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

      {/* Create / Edit Campaign Modal */}
      {(createOpen || editPromo) && (
        <Modal
          open={createOpen || !!editPromo}
          onClose={() => { setCreateOpen(false); setEditPromo(null); }}
          title={editPromo ? `Edit Campaign: ${editPromo.title}` : 'Create New Campaign Banner'}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Campaign Title <span className="req">*</span></label>
              <input
                className="input font-bold"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Bada Dashain Mahotsav 2026"
              />
            </div>

            <div className="form-group">
              <label className="label">Campaign Subtitle / Tagline</label>
              <input
                className="input"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. Grand Festive Celebration on Handwoven Pashmina & Dhaka"
              />
            </div>

            {/* Banner Image Preview & Uploader */}
            <div className="form-group">
              <label className="label">Banner Artwork Image</label>
              {form.banner_url && (
                <div style={{ marginBottom: 8, height: 110, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={form.banner_url} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="input"
                  style={{ fontSize: 12, padding: 5 }}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Campaign Category Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="Seasonal Festival Campaign">Seasonal Festival Campaign</option>
                  <option value="Category Flash Promo">Category Flash Promo</option>
                  <option value="Flash Deals Carousel">24-Hour Flash Deal</option>
                  <option value="Product Spotlight Strip">Product Spotlight Strip</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Placement Slot</label>
                <select className="select" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                  <option value="Homepage Hero Banner">Homepage Hero Banner</option>
                  <option value="Category Header Banner">Category Header Banner</option>
                  <option value="Deals Carousel">Flash Deals Carousel</option>
                  <option value="Homepage Spotlight Strip">Homepage Spotlight Strip</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Discount Hook Headline <span className="req">*</span></label>
                <input
                  className="input"
                  required
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder="e.g. Up to 50% Off"
                />
              </div>
              <div className="form-group">
                <label className="label">Target Link URL</label>
                <input
                  className="input"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/category/handicrafts"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Start Date <span className="req">*</span></label>
                <input
                  type="text"
                  className="input"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  placeholder="e.g. 15 Sept 2026"
                />
              </div>
              <div className="form-group">
                <label className="label">End Date <span className="req">*</span></label>
                <input
                  type="text"
                  className="input"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder="e.g. 30 Oct 2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setCreateOpen(false); setEditPromo(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                {editPromo ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Promo Safety Confirm Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={doDeletePromo}
          danger
          title={`Delete Campaign "${deleteTarget.title}"?`}
          message={`Are you sure you want to permanently remove this marketing campaign? The banner will be taken down from ${deleteTarget.placement}.`}
          confirmText="Delete Campaign"
        />
      )}
    </div>
  )
}
