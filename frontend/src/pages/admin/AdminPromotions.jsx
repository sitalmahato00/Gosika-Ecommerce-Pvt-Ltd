import React, { useState } from 'react'
import {
  Megaphone, Plus, Search, Edit, Trash2,
  Download, LayoutGrid, List, ExternalLink, CheckCircle2
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, apiImage, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Banners' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const POSITION_OPTIONS = [
  { value: 'homepage_hero', label: 'Homepage Hero' },
  { value: 'category_banner', label: 'Category Banner' },
  { value: 'deals_carousel', label: 'Deals Carousel' },
  { value: 'homepage_strip', label: 'Homepage Strip' },
]

const emptyForm = () => ({
  title: '',
  description: '',
  image: '',
  link: '',
  position: 'homepage_hero',
  sort_order: 0,
  is_active: true,
  starts_at: '',
  ends_at: '',
})

const toLocal = (iso) => (iso ? iso.slice(0, 16) : '')
const toIso = (local) => (local ? new Date(local).toISOString() : null)

const statusStyle = (isActive) =>
  isActive ? { bg: '#ecfdf5', color: '#10b981' } : { bg: '#f8fafc', color: '#64748b' }

export default function AdminPromotions() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editPromo, setEditPromo] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchBanners = (page, perPage) =>
    api.get('/admin/banners', { params: { status: statusFilter, search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchBanners, {
    pageSize: 10,
    deps: [statusFilter, search],
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openCreate = () => {
    setEditPromo(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (b) => {
    setEditPromo(b)
    setForm({
      title: b.title || '',
      description: b.description || '',
      image: b.image || '',
      link: b.link || '',
      position: b.position || 'homepage_hero',
      sort_order: b.sort_order ?? 0,
      is_active: !!b.is_active,
      starts_at: toLocal(b.starts_at),
      ends_at: toLocal(b.ends_at),
    })
    setCreateOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title || null,
      description: form.description || null,
      image: form.image.trim(),
      link: form.link || null,
      position: form.position || null,
      sort_order: form.sort_order !== '' && form.sort_order !== null ? Number(form.sort_order) : null,
      is_active: !!form.is_active,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    }
    const req = editPromo
      ? api.put(`/admin/banners/${editPromo.id}`, payload)
      : api.post('/admin/banners', payload)
    req
      .then(() => {
        toast.success(editPromo ? `Banner "${payload.title}" updated` : 'Banner created')
        setCreateOpen(false)
        setEditPromo(null)
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/banners/${deleteTarget.id}`)
      .then(() => {
        toast.success(`Banner "${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    const rows = [
      ['Title', 'Description', 'Position', 'Link', 'Sort Order', 'Starts At', 'Ends At', 'Status'],
      ...items.map((b) => [
        b.title,
        b.description || '',
        b.position || '',
        b.link || '',
        b.sort_order,
        b.starts_at || '',
        b.ends_at || '',
        b.is_active ? 'active' : 'inactive',
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_banners_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Banners ledger exported to CSV')
  }

  const activeCount = items.filter((b) => b.is_active).length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
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
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={openCreate}>
            <Plus size={14} /> Create New Banner
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Banners</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Megaphone size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total} Banners</div>
          <div className="muted text-xs mt-1">Across all placements</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Live (page)</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{activeCount} Active Banners</div>
          <div className="muted text-xs mt-1">Homepage hero & category strips</div>
        </div>
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
            placeholder="Search banners by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="muted text-xs font-semibold">
            {meta.total} banner{meta.total !== 1 ? 's' : ''} listed
          </span>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('grid')}
              title="Banner Cards View"
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
        <EmptyState icon={Megaphone} title="No banners found" message="Create your first campaign banner to get started." />
      ) : viewMode === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          {items.map((b) => {
            const st = statusStyle(b.is_active)
            return (
              <div key={b.id} className="card flex flex-col justify-between" style={{ padding: 0, margin: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', width: '100%', height: 140, background: '#1e293b' }}>
                  <img
                    src={apiImage(b.image)}
                    alt={b.title || 'Banner'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                      {b.position ? humanizeEnum(b.position) : 'No position'}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 800, fontSize: 11, textTransform: 'capitalize', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                      {b.is_active ? 'active' : 'inactive'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px 18px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="muted text-xs">Sort: {b.sort_order ?? '—'}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                      {b.title || 'Untitled banner'}
                    </div>
                    {b.description && (
                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                        {b.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs muted pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span>Run: <strong>{formatDate(b.starts_at)} → {formatDate(b.ends_at)}</strong></span>
                    </div>
                    {b.link && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-1" style={{ fontWeight: 700 }}>
                        <ExternalLink size={11} /> {b.link}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" style={{ fontSize: 11 }} onClick={() => openEdit(b)}>
                      <Edit size={11} /> Edit
                    </button>
                    <button type="button" className="btn btn-danger-outline btn-xs" style={{ padding: '4px 7px' }} title="Delete banner" onClick={() => setDeleteTarget(b)}>
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
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Banner</th>
                  <th>Position</th>
                  <th>Link</th>
                  <th>Run Duration</th>
                  <th>Sort</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => {
                  const st = statusStyle(b.is_active)
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <img
                            src={apiImage(b.image)}
                            alt={b.title || 'Banner'}
                            style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover', background: '#e2e8f0' }}
                          />
                          <div>
                            <div className="font-bold text-sm text-ink">{b.title || 'Untitled banner'}</div>
                            {b.description && <div className="muted text-xs line-clamp-1">{b.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-sm">{b.position ? humanizeEnum(b.position) : '—'}</span>
                      </td>
                      <td className="muted text-xs" style={{ maxWidth: 220 }}>{b.link || '—'}</td>
                      <td className="muted text-xs">
                        {formatDate(b.starts_at)} → {formatDate(b.ends_at)}
                      </td>
                      <td className="muted text-xs">{b.sort_order ?? '—'}</td>
                      <td>
                        <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
                          {b.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => openEdit(b)}>
                            <Edit size={11} />
                          </button>
                          <button type="button" className="btn btn-danger-outline btn-xs" onClick={() => setDeleteTarget(b)}>
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

      {(createOpen || editPromo) && (
        <Modal
          open={createOpen || !!editPromo}
          onClose={() => { setCreateOpen(false); setEditPromo(null); }}
          title={editPromo ? `Edit Banner: ${editPromo.title || editPromo.id}` : 'Create New Campaign Banner'}
          size="md"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Banner Title</label>
              <input
                className="input font-bold"
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Bada Dashain Mahotsav 2026"
              />
            </div>

            <div className="form-group">
              <label className="label">Description / Tagline</label>
              <input
                className="input"
                maxLength={2000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Grand Festive Celebration on Handwoven Pashmina & Dhaka"
              />
            </div>

            <div className="form-group">
              <label className="label">Banner Image URL <span className="req">*</span></label>
              <input
                className="input font-mono"
                required
                maxLength={500}
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://… or /storage/banners/…"
              />
              {form.image && (
                <div style={{ marginTop: 8, height: 110, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={apiImage(form.image)} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Placement Position</label>
                <select className="select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                  {POSITION_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
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

            <div className="form-group">
              <label className="label">Target Link URL</label>
              <input
                className="input"
                maxLength={500}
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="/category/handicrafts"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Starts At</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Ends At</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>

            <label className="checkbox-row" style={{ fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Banner is active
            </label>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setCreateOpen(false); setEditPromo(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {editPromo ? 'Save Changes' : 'Create Banner'}
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
          title={`Delete Banner "${deleteTarget.title}"?`}
          message="Are you sure you want to permanently remove this banner? It will be taken down from the storefront."
          confirmText="Delete Banner"
        />
      )}
    </div>
  )
}
