import React, { useState } from 'react'
import {
  FileText, Plus, Search, Edit, Trash2,
  Download, Globe, FileCheck2, File, CheckCircle2, CircleOff
} from 'lucide-react'
import api from '../../api/client'
import { useList, useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const STATUS_TABS = [
  { value: '', label: 'All Pages' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

const TYPE_TABS = [
  { value: '', label: 'Both Types' },
  { value: 'page', label: 'Pages' },
  { value: 'policy', label: 'Policies' },
]

const statusStyle = (status) =>
  status === 'published' ? { bg: '#ecfdf5', color: '#10b981' } : { bg: '#f8fafc', color: '#64748b' }

const emptyForm = () => ({
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  type: 'policy',
  status: 'draft',
  sort_order: 0,
})

export default function AdminPages() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editPage, setEditPage] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchPages = (page, perPage) =>
    api.get('/admin/pages', { params: { status: statusFilter, type: typeFilter, search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchPages, {
    pageSize: 12,
    deps: [statusFilter, typeFilter, search],
  })

  const fetchStats = () => api.get('/admin/pages/stats')
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
    setEditPage(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (p) => {
    setEditPage(p)
    setForm({
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt || '',
      body: p.body || '',
      type: p.type || 'policy',
      status: p.status || 'draft',
      sort_order: p.sort_order ?? 0,
    })
    setCreateOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      excerpt: form.excerpt || null,
      body: form.body || null,
      type: form.type,
      status: form.status,
      sort_order: form.sort_order !== '' ? Number(form.sort_order) : 0,
    }
    const req = editPage
      ? api.put(`/admin/pages/${editPage.id}`, payload)
      : api.post('/admin/pages', payload)
    req
      .then(() => {
        toast.success(editPage ? `Page "${payload.title}" updated` : 'Page created')
        setCreateOpen(false)
        setEditPage(null)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/pages/${deleteTarget.id}`)
      .then(() => {
        toast.success(`Page "${deleteTarget.title}" deleted`)
        setDeleteTarget(null)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Title' },
        { label: 'Slug' },
        { label: 'Type' },
        { label: 'Status' },
        { label: 'Excerpt' },
        { label: 'Sort' },
        { label: 'Updated At' },
      ],
      rows: items.map((p) => [
        p.title,
        p.slug,
        p.type || '',
        p.status || '',
        p.excerpt || '',
        p.sort_order,
        p.updated_at || '',
      ]),
      title: 'Pages & Policies Report',
      subtitle: 'Information pages and legal policies published on the Gosika storefront.',
      sectionLabel: 'CMS Page Ledger',
      fileName: `gosika_cms_pages_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('CMS pages ledger exported as branded report.')
  }

  const kpis = [
    { label: 'Total Pages', value: stats?.total ?? 0, icon: FileText, bg: 'var(--primary-50)', fg: 'var(--primary)', sub: 'All CMS content' },
    { label: 'Published', value: stats?.published ?? 0, icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.12)', fg: '#10b981', sub: 'Live on storefront' },
    { label: 'Draft', value: stats?.draft ?? 0, icon: CircleOff, bg: 'rgba(100, 116, 139, 0.12)', fg: '#64748b', sub: 'Not yet live' },
    { label: 'Policies', value: stats?.policy ?? 0, icon: FileCheck2, bg: 'rgba(37, 99, 235, 0.1)', fg: '#2563eb', sub: 'Legal documents' },
    { label: 'Info Pages', value: stats?.page ?? 0, icon: File, bg: 'rgba(217, 119, 6, 0.1)', fg: '#d97706', sub: 'Content pages' },
  ]

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Pages & Policies
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Craft and manage storefront pages, legal policies and help content for customers and sellers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={openCreate}>
            <Plus size={14} /> Create Page
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
            placeholder="Search pages by title or slug…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            className="select"
            style={{ height: 36, fontSize: 13 }}
            value={typeFilter}
            onChange={(e) => {
              setPage(1)
              setTypeFilter(e.target.value)
            }}
          >
            {TYPE_TABS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="muted text-xs font-semibold">
            {meta.total} page{meta.total !== 1 ? 's' : ''} listed
          </span>
        </div>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton height={64} />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No pages found" message="Create your first page or policy to start publishing content." />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Sort</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const st = statusStyle(p.status)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: p.type === 'policy' ? 'rgba(37, 99, 235, 0.1)' : 'var(--primary-50)', color: p.type === 'policy' ? '#2563eb' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.type === 'policy' ? <FileCheck2 size={18} /> : <FileText size={18} />}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-ink">{p.title}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Globe size={11} className="muted" />
                              <span className="muted text-xs font-mono">/{p.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`chip chip-sm ${p.type === 'policy' ? 'chip-primary' : ''}`}>
                          {p.type ? humanizeEnum(p.type) : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="muted text-xs">{formatDate(p.updated_at)}</td>
                      <td className="muted text-xs">{p.sort_order ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => openEdit(p)}>
                            <Edit size={11} />
                          </button>
                          <button type="button" className="btn btn-danger-outline btn-xs" onClick={() => setDeleteTarget(p)}>
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

      {(createOpen || editPage) && (
        <Modal
          open={createOpen || !!editPage}
          onClose={() => { setCreateOpen(false); setEditPage(null); }}
          title={editPage ? `Edit Page: ${editPage.title || editPage.id}` : 'Create New Page'}
          size="lg"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="label">Title <span className="req">*</span></label>
                <input
                  className="input font-bold"
                  required
                  maxLength={180}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Privacy Policy"
                />
              </div>
              <div className="form-group">
                <label className="label">Slug</label>
                <input
                  className="input font-mono"
                  maxLength={200}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="policy">Policy</option>
                  <option value="page">Page</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
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
              <label className="label">Excerpt</label>
              <input
                className="input"
                maxLength={400}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Short summary shown in listings and previews"
              />
            </div>

            <div className="form-group">
              <label className="label">Body (HTML)</label>
              <textarea
                className="input font-mono"
                rows={10}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="<h2>Title</h2><p>Content…</p>"
              />
              <p className="muted text-xs mt-1">Basic HTML supported: headings, paragraphs, lists and links.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setCreateOpen(false); setEditPage(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {editPage ? 'Save Changes' : 'Create Page'}
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
          title={`Delete Page "${deleteTarget.title}"?`}
          message="Are you sure you want to permanently remove this page? It will be taken down from the storefront."
          confirmText="Delete Page"
        />
      )}
    </div>
  )
}