import React, { useState } from 'react'
import {
  Gift, Search, Trash2, Download, Store,
  Package, CalendarClock, Timer, CircleOff, Rocket
} from 'lucide-react'
import api from '../../api/client'
import { useList, useApi } from '../../hooks/useApi'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, apiImage, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const STATUS_TABS = [
  { value: '', label: 'All Promotions' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
]

const STATUS_OPTIONS = ['draft', 'scheduled', 'active', 'paused', 'ended']

const TYPE_OPTIONS = ['all', 'percentage', 'fixed', 'free_shipping', 'buy_one_get_one']

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

const discountLabel = (p) => {
  if (!p.discount_value) return '—'
  switch (p.type) {
    case 'percentage': return `${p.discount_value}%`
    case 'buy_one_get_one': return 'BOGO'
    case 'free_shipping': return 'Free shipping'
    default: return `NPR ${p.discount_value}`
  }
}

export default function AdminNominations() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchPromotions = (page, perPage) =>
    api.get('/admin/promotions', { params: { status: statusFilter, type: typeFilter === 'all' ? undefined : typeFilter, search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchPromotions, {
    pageSize: 12,
    deps: [statusFilter, typeFilter, search],
  })

  const fetchStats = () => api.get('/admin/promotions/stats')
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

  const handleStatusChange = (p, status) => {
    api.put(`/admin/promotions/${p.id}/status`, { status })
      .then(() => {
        toast.success(`"${p.name}" → ${humanizeEnum(status)}`)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/promotions/${deleteTarget.id}`)
      .then(() => {
        toast.success(`Promotion "${deleteTarget.name}" deleted`)
        setDeleteTarget(null)
        refresh()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Promotion' },
        { label: 'Vendor' },
        { label: 'Type' },
        { label: 'Discount' },
        { label: 'Category' },
        { label: 'Participating Items' },
        { label: 'Starts On' },
        { label: 'Ends On' },
        { label: 'Status' },
      ],
      rows: items.map((p) => [
        p.name,
        p.vendor?.company_name || '',
        p.type || '',
        p.discount_value || '',
        p.category || '',
        p.participating_items ?? 0,
        p.start_date || '',
        p.end_date || '',
        p.status || '',
      ]),
      title: 'Vendor Product Promotions Report',
      subtitle: 'Store-level product promotions and offers submitted by vendors across the marketplace.',
      sectionLabel: 'Product Promotion Ledger',
      fileName: `gosika_product_promotions_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Product promotions ledger exported as branded report.')
  }

  const kpis = [
    { label: 'Total Promotions', value: stats?.total ?? 0, icon: Gift, bg: 'var(--primary-50)', fg: 'var(--primary)', sub: 'Across all vendors' },
    { label: 'Active Now', value: stats?.active ?? 0, icon: Rocket, bg: 'rgba(16, 185, 129, 0.12)', fg: '#10b981', sub: 'Live on storefronts' },
    { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: CalendarClock, bg: 'rgba(37, 99, 235, 0.1)', fg: '#2563eb', sub: 'Upcoming' },
    { label: 'Draft', value: stats?.draft ?? 0, icon: Timer, bg: 'rgba(100, 116, 139, 0.12)', fg: '#64748b', sub: 'Not yet live' },
    { label: 'Ended', value: stats?.ended ?? 0, icon: CircleOff, bg: 'rgba(220, 38, 38, 0.1)', fg: '#dc2626', sub: 'Completed runs' },
  ]

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Product Promotions
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Platform-wide oversight of store promotions — review, pause or end vendor offers from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
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
            placeholder="Search by promotion or vendor…"
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
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : humanizeEnum(t)}</option>
            ))}
          </select>
          <span className="muted text-xs font-semibold">
            {meta.total} promotion{meta.total !== 1 ? 's' : ''} listed
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
        <EmptyState icon={Gift} title="No product promotions found" message="Vendor promotions will appear here as stores roll out offers." />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Vendor Store</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Run Window</th>
                  <th>Status</th>
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
                          {p.banner_image ? (
                            <img src={apiImage(p.banner_image)} alt={p.name || 'Promotion'} style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover', background: '#e2e8f0' }} />
                          ) : (
                            <div style={{ width: 44, height: 32, borderRadius: 4, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                              <Gift size={16} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-ink">{p.name || 'Untitled promotion'}</div>
                            {p.tagline && <div className="muted text-xs line-clamp-1">{p.tagline}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Store size={12} className="muted" />
                          <span className="text-sm font-semibold">{p.vendor?.company_name || 'Unknown store'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-sm">{p.type ? humanizeEnum(p.type) : '—'}</span>
                      </td>
                      <td className="text-sm font-bold" style={{ color: '#dc2626' }}>{discountLabel(p)}</td>
                      <td className="muted text-xs">{p.category ? humanizeEnum(p.category) : '—'}</td>
                      <td>
                        <span className="chip chip-sm flex items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                          <Package size={11} /> {p.participating_items ?? 0}
                        </span>
                      </td>
                      <td className="muted text-xs">
                        {formatDate(p.start_date)} → {formatDate(p.end_date)}
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ height: 26, fontSize: 11, padding: '0 6px', color: st.color, background: st.bg, borderColor: 'transparent', fontWeight: 700, borderRadius: 999 }}
                          value={p.status}
                          onChange={(e) => handleStatusChange(p, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{humanizeEnum(s)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-danger-outline btn-xs" onClick={() => setDeleteTarget(p)}>
                          <Trash2 size={11} />
                        </button>
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

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete Promotion "${deleteTarget.name}"?`}
          message="Are you sure you want to permanently remove this promotion? It will be taken down from the vendor store."
          confirmText="Delete Promotion"
        />
      )}
    </div>
  )
}