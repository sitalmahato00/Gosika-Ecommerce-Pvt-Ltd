import React, { useState } from 'react'
import {
  Megaphone, Plus, Search, Edit, Trash2,
  Download, LayoutGrid, List, ExternalLink, Rocket, CalendarClock, Timer, CircleOff
} from 'lucide-react'
import api from '../../api/client'
import { useList, useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import ImageUpload from '../../components/ui/ImageUpload'
import { formatDate, apiImage, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const STATUS_TABS = [
  { value: '', label: 'All Campaigns' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
]

const STATUS_OPTIONS = ['draft', 'scheduled', 'active', 'paused', 'ended']

const TYPE_OPTIONS = [
  { value: 'promo', label: 'Promo' },
  { value: 'flash_sale', label: 'Flash Sale' },
  { value: 'discount', label: 'Discount' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'special', label: 'Special' },
]

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'store', label: 'Stores' },
  { value: 'category', label: 'Categories' },
  { value: 'product', label: 'Products' },
]

const statusStyle = (status) => {
  switch (status) {
    case 'active': return { bg: '#ecfdf5', color: '#10b981' }
    case 'scheduled': return { bg: '#eff6ff', color: '#2563eb' }
    case 'draft': return { bg: '#f8fafc', color: '#64748b' }
    case 'paused': return { bg: '#fffbeb', color: '#d97706' }
    case 'ended': return { bg: '#fef2f2', color: '#dc2626' }
    default: return { bg: '#f8fafc', color: '#64748b' }
  }
}

const emptyForm = () => ({
  title: '',
  tagline: '',
  description: '',
  image: '',
  type: 'promo',
  target_type: 'all',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  status: 'draft',
  sort_order: 0,
  start_date: '',
  end_date: '',
})

const toLocal = (iso) => (iso ? iso.slice(0, 16) : '')
const toIso = (local) => (local ? new Date(local).toISOString() : null)

export default function AdminCampaigns() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchCampaigns = (page, perPage) =>
    api.get('/admin/campaigns', { params: { status: statusFilter, search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchCampaigns, {
    pageSize: 10,
    deps: [statusFilter, search],
  })

  const fetchStats = () => api.get('/admin/campaigns/stats')
  const { data: stats, load: reloadStats } = useApi(fetchStats, { immediate: true })

  const refresh = () => {
    reload()
    reloadStats()
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openCreate = () => {
    setEditCampaign(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (c) => {
    setEditCampaign(c)
    setForm({
      title: c.title || '',
      tagline: c.tagline || '',
      description: c.description || '',
      image: c.image || '',
      type: c.type || 'promo',
      target_type: c.target_type || 'all',
      discount_type: c.discount_type || 'percentage',
      discount_value: c.discount_value ?? '',
      min_order_amount: c.min_order_amount ?? '',
      status: c.status || 'draft',
      sort_order: c.sort_order ?? 0,
      start_date: toLocal(c.start_date),
      end_date: toLocal(c.end_date),
    })
    setCreateOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      tagline: form.tagline || null,
      description: form.description || null,
      image: form.image.trim() || null,
      type: form.type,
      target_type: form.target_type,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value !== '' && form.discount_value !== null ? Number(form.discount_value) : null,
      min_order_amount: form.min_order_amount !== '' && form.min_order_amount !== null ? Number(form.min_order_amount) : null,
      status: form.status,
      sort_order: form.sort_order !== '' && form.sort_order !== null ? Number(form.sort_order) : 0,
      start_date: toIso(form.start_date),
      end_date: toIso(form.end_date),
    }
    const req = editCampaign
      ? api.put(`/admin/campaigns/${editCampaign.id}`, payload)
      : api.post('/admin/campaigns', payload)
    req
      .then(() => {
        toast.success(editCampaign ? `Campaign "${payload.title}" updated` : 'Campaign created')
        setCreateOpen(false)
        setEditCampaign(null)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSaving(false))
  }

  const handleStatusChange = (c, status) => {
    api.put(`/admin/campaigns/${c.id}/status`, { status })
      .then(() => {
        toast.success(`Campaign "${c.title}" → ${humanizeEnum(status)}`)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/campaigns/${deleteTarget.id}`)
      .then(() => {
        toast.success(`Campaign "${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Title' },
        { label: 'Type' },
        { label: 'Status' },
        { label: 'Discount' },
        { label: 'Target' },
        { label: 'Starts At' },
        { label: 'Ends At' },
        { label: 'Sort' },
      ],
      rows: items.map((c) => [
        c.title,
        c.type || '',
        c.status || '',
        c.discount_value ? `${c.discount_type === 'percentage' ? '' : 'NPR '}${c.discount_value}${c.discount_type === 'percentage' ? '%' : ''}` : '',
        c.target_type || '',
        c.start_date || '',
        c.end_date || '',
        c.sort_order,
      ]),
      title: 'Marketing Campaigns Report',
      subtitle: 'Platform-run campaigns, festive sales and special promotions across Gosika.',
      sectionLabel: 'Campaign Ledger',
      fileName: `gosika_campaigns_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Campaigns ledger exported as branded report.')
  }

  const kpis = [
    { label: 'Total Campaigns', value: stats?.total ?? 0, icon: Megaphone, bg: 'var(--primary-50)', fg: 'var(--primary)', sub: 'Ever created' },
    { label: 'Active Now', value: stats?.active ?? 0, icon: Rocket, bg: 'rgba(16, 185, 129, 0.12)', fg: '#10b981', sub: 'Serving storefront' },
    { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: CalendarClock, bg: 'rgba(37, 99, 235, 0.1)', fg: '#2563eb', sub: 'Coming soon' },
    { label: 'Draft', value: stats?.draft ?? 0, icon: Timer, bg: 'rgba(100, 116, 139, 0.12)', fg: '#64748b', sub: 'Not launched' },
    { label: 'Ended', value: stats?.ended ?? 0, icon: CircleOff, bg: 'rgba(220, 38, 38, 0.1)', fg: '#dc2626', sub: 'Completed runs' },
  ]

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Marketing Campaigns
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Design festival sales, flash deals and platform-wide promotions that surface on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={openCreate}>
            <Plus size={14} /> Create Campaign
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>{k.label}</span>
              <span className="avatar" style={{ width: 34, height: 34, background: k.bg, color: k.fg }}>
                <k.icon size={18} />
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{k.value}</div>
            <div className="muted text-xs mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => {
              setPage(1)
              setStatusFilter(t.value)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={applySearch} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search campaigns by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="muted text-xs font-semibold">
            {meta.total} campaign{meta.total !== 1 ? 's' : ''} listed
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

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          <Skeleton height={280} />
          <Skeleton height={280} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns found" message="Create your first campaign to start driving festival sales." />
      ) : viewMode === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          {items.map((c) => {
            const st = statusStyle(c.status)
            return (
              <div key={c.id} className="card flex flex-col justify-between" style={{ padding: 0, margin: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', width: '100%', height: 140, background: '#1e293b' }}>
                  {c.image ? (
                    <img src={apiImage(c.image)} alt={c.title || 'Campaign'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
                      <Megaphone size={34} style={{ color: '#64748b' }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                      {c.type ? humanizeEnum(c.type) : 'Promo'}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 800, fontSize: 11, textTransform: 'capitalize', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 18px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                      {c.title || 'Untitled campaign'}
                    </div>
                    {c.tagline && (
                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                        {c.tagline}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs muted pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span>
                        {c.discount_value ? `-${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' NPR'}` : 'No discount'} · {c.target_type ? humanizeEnum(c.target_type) : 'All'}
                      </span>
                      <span>Run: <strong>{formatDate(c.start_date)} → {formatDate(c.end_date)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <select
                      className="select"
                      style={{ height: 26, fontSize: 11, padding: '0 6px' }}
                      value={c.status}
                      onChange={(e) => handleStatusChange(c, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{humanizeEnum(s)}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" style={{ fontSize: 11 }} onClick={() => openEdit(c)}>
                      <Edit size={11} /> Edit
                    </button>
                    <button type="button" className="btn btn-danger-outline btn-xs" style={{ padding: '4px 7px' }} title="Delete campaign" onClick={() => setDeleteTarget(c)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Target</th>
                  <th>Run Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const st = statusStyle(c.status)
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {c.image ? (
                            <img src={apiImage(c.image)} alt={c.title || 'Campaign'} style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover', background: '#e2e8f0' }} />
                          ) : (
                            <div style={{ width: 44, height: 32, borderRadius: 4, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <Megaphone size={16} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-ink">{c.title || 'Untitled campaign'}</div>
                            {c.tagline && <div className="muted text-xs line-clamp-1">{c.tagline}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-sm">{c.type ? humanizeEnum(c.type) : '—'}</span>
                      </td>
                      <td className="muted text-xs">
                        {c.discount_value ? `${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' NPR'}` : '—'}
                      </td>
                      <td className="muted text-xs">{c.target_type ? humanizeEnum(c.target_type) : '—'}</td>
                      <td className="muted text-xs">
                        {formatDate(c.start_date)} → {formatDate(c.end_date)}
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ height: 26, fontSize: 11, padding: '0 6px', color: st.color, background: st.bg, borderColor: 'transparent', fontWeight: 700, borderRadius: 999 }}
                          value={c.status}
                          onChange={(e) => handleStatusChange(c, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{humanizeEnum(s)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => openEdit(c)}>
                            <Edit size={11} />
                          </button>
                          <button type="button" className="btn btn-danger-outline btn-xs" onClick={() => setDeleteTarget(c)}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {(createOpen || editCampaign) && (
        <Modal
          open={createOpen || !!editCampaign}
          onClose={() => { setCreateOpen(false); setEditCampaign(null); }}
          title={editCampaign ? `Edit Campaign: ${editCampaign.title || editCampaign.id}` : 'Create New Campaign'}
          size="lg"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Campaign Title <span className="req">*</span></label>
              <input
                className="input font-bold"
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Dashain Dhamaka Sale 2026"
              />
            </div>

            <div className="form-group">
              <label className="label">Tagline</label>
              <input
                className="input"
                maxLength={300}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. Up to 30% off on festival essentials"
              />
            </div>

            <div className="form-group">
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What makes this campaign special?"
              />
            </div>

            <ImageUpload
              label="Campaign Banner Image"
              value={form.image}
              onChange={(val) => setForm({ ...form, image: val })}
              folder="campaigns"
              helper="Upload PNG, JPG, or WEBP campaign banner image"
              previewHeight={130}
            />

            <div className="form-row">
              <div className="form-group">
                <label className="label">Campaign Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Target Audience</label>
                <select className="select" value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                  {TARGET_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Discount Type</label>
                <select className="select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (NPR)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Min Order (NPR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{humanizeEnum(s)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Starts At</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Ends At</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setCreateOpen(false); setEditCampaign(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {editCampaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete Campaign "${deleteTarget.title}"?`}
          message="Are you sure you want to permanently remove this campaign? It will stop appearing on the storefront."
          confirmText="Delete Campaign"
        />
      )}
    </div>
  )
}