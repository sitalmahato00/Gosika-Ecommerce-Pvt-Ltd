import React, { useState } from 'react'
import {
  Ticket, Plus, Search, Edit, Trash2, Tag, Download, Copy, Check,
  LayoutGrid, List
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Coupons' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const emptyForm = () => ({
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_discount: '',
  usage_limit: '',
  per_user_limit: '',
  valid_from: '',
  valid_until: '',
  is_active: true,
  applies_to: 'all',
})

const toLocal = (iso) => (iso ? iso.slice(0, 16) : '')
const toIso = (local) => (local ? new Date(local).toISOString() : null)

const deriveStatus = (c) => {
  const now = Date.now()
  const from = c.valid_from ? new Date(c.valid_from).getTime() : null
  const until = c.valid_until ? new Date(c.valid_until).getTime() : null
  if (!c.is_active) return 'inactive'
  if (from && from > now) return 'scheduled'
  if (until && until < now) return 'expired'
  return 'active'
}

const statusStyle = (status) => {
  if (status === 'active') return { bg: '#ecfdf5', color: '#10b981' }
  if (status === 'scheduled') return { bg: '#f0f9ff', color: '#0284c7' }
  if (status === 'expired') return { bg: '#fef2f2', color: '#ef4444' }
  return { bg: '#f8fafc', color: '#64748b' }
}

const discountLabel = (c) =>
  c.discount_type === 'percentage' ? `${Number(c.discount_value) || 0}%` : money(c.discount_value)

export default function AdminCoupons() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [form, setForm] = useState(emptyForm())

  const fetchCoupons = (page, perPage) =>
    api.get('/admin/coupons', { params: { status: statusFilter, search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchCoupons, {
    pageSize: 10,
    deps: [statusFilter, search],
    cacheKey: 'admin_coupons_list',
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openCreate = () => {
    setEditCoupon(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (c) => {
    setEditCoupon(c)
    setForm({
      code: c.code || '',
      name: c.name || '',
      description: c.description || '',
      discount_type: c.discount_type || 'percentage',
      discount_value: c.discount_value ?? '',
      min_order_amount: c.min_order_amount ?? '',
      max_discount: c.max_discount ?? '',
      usage_limit: c.usage_limit ?? '',
      per_user_limit: c.per_user_limit ?? '',
      valid_from: toLocal(c.valid_from),
      valid_until: toLocal(c.valid_until),
      is_active: !!c.is_active,
      applies_to: c.applies_to || 'all',
    })
    setCreateOpen(true)
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Coupon code "${code}" copied to clipboard!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name || null,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order_amount: form.min_order_amount !== '' && form.min_order_amount !== null ? Number(form.min_order_amount) : null,
      max_discount: form.max_discount !== '' && form.max_discount !== null ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit !== '' && form.usage_limit !== null ? Number(form.usage_limit) : null,
      per_user_limit: form.per_user_limit !== '' && form.per_user_limit !== null ? Number(form.per_user_limit) : null,
      valid_from: toIso(form.valid_from),
      valid_until: toIso(form.valid_until),
      is_active: !!form.is_active,
      applies_to: form.applies_to,
    }
    const req = editCoupon
      ? api.put(`/admin/coupons/${editCoupon.id}`, payload)
      : api.post('/admin/coupons', payload)
    req
      .then(() => {
        toast.success(editCoupon ? `Coupon "${payload.code}" updated` : `Coupon "${payload.code}" created`)
        setCreateOpen(false)
        setEditCoupon(null)
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/coupons/${deleteTarget.id}`)
      .then(() => {
        toast.success(`Coupon "${deleteTarget.code}" deleted`)
        setDeleteTarget(null)
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    const rows = [
      ['Coupon Code', 'Name', 'Description', 'Discount Type', 'Discount Value', 'Min Order (NPR)', 'Max Cap (NPR)', 'Usage Limit', 'Valid From', 'Valid Until', 'Status'],
      ...items.map((c) => [
        c.code,
        c.name || '',
        c.description || '',
        c.discount_type,
        c.discount_value,
        c.min_order_amount,
        c.max_discount || '',
        c.usage_limit || '',
        c.valid_from || '',
        c.valid_until || '',
        deriveStatus(c),
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_coupons_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Coupons ledger exported to CSV')
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Coupon & Voucher Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Create promotional coupon codes, discounts, usage limits, and campaign rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={openCreate}>
            <Plus size={14} /> Create New Coupon
          </button>
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
            placeholder="Search coupon code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="muted text-xs font-semibold">
            {meta.total} voucher{meta.total !== 1 ? 's' : ''} listed
          </span>
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              className={`btn btn-xs ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
              onClick={() => setViewMode('grid')}
              title="Voucher Card View"
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
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          <Skeleton height={240} />
          <Skeleton height={240} />
          <Skeleton height={240} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons found" message="Create your first coupon to start driving sales." />
      ) : viewMode === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {items.map((c) => {
            const isCopied = copiedCode === c.code
            const derived = deriveStatus(c)
            const st = statusStyle(derived)
            return (
              <div
                key={c.id}
                className="card flex flex-col justify-between"
                style={{ padding: '20px 22px', margin: 0, borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div style={{ border: '1.5px dashed #3b82f6', background: 'rgba(59, 130, 246, 0.04)', borderRadius: 8, padding: '6px 14px', color: '#2563eb', fontWeight: 800, fontSize: 16, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                        {c.code}
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        style={{ padding: 6, color: isCopied ? '#10b981' : '#94a3b8' }}
                        title="Copy coupon code"
                        onClick={() => copyToClipboard(c.code)}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
                      {derived}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-1">
                    <Tag size={13} color="var(--primary)" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
                      {c.name || discountLabel(c)}
                    </span>
                  </div>
                  {c.description && (
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                      {c.description}
                    </p>
                  )}

                  <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 14px 0' }} />

                  <div className="flex flex-col gap-1.5" style={{ fontSize: 12.5, color: '#475569' }}>
                    <div>
                      <span>Discount: <strong>{discountLabel(c)}</strong></span>
                      <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
                      <span>Min Order: <strong>{money(c.min_order_amount)}</strong></span>
                    </div>
                    {c.max_discount != null && (
                      <div>Max Cap: <strong>{money(c.max_discount)}</strong></div>
                    )}
                    <div>
                      <span>Usage: <strong>{c.used_count ?? 0}</strong> / {c.usage_limit != null ? c.usage_limit : '∞'}</span>
                      {c.applies_to && c.applies_to !== 'all' && (
                        <span> · Applies to: <strong>{humanizeEnum(c.applies_to)}</strong></span>
                      )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Validity: <span>{formatDate(c.valid_from)} → {formatDate(c.valid_until)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3.5 mt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" className="btn btn-outline btn-xs flex items-center gap-1.5" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, fontWeight: 600 }} onClick={() => openEdit(c)}>
                    <Edit size={12} /> Edit Coupon
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ border: '1px solid #fecaca', color: '#ef4444', background: '#fff5f5', padding: '5px 8px', borderRadius: 6 }}
                    title="Delete Coupon"
                    onClick={() => setDeleteTarget(c)}
                  >
                    <Trash2 size={13} />
                  </button>
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
                  <th>Coupon Code</th>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Min. Order</th>
                  <th>Redemptions</th>
                  <th>Validity Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const derived = deriveStatus(c)
                  const st = statusStyle(derived)
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="font-mono font-bold text-primary text-xs" style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '3px 8px', borderRadius: 4 }}>
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{c.name || c.code}</div>
                        {c.description && <div className="muted text-xs line-clamp-1">{c.description}</div>}
                      </td>
                      <td>
                        <span className="font-semibold text-sm text-ink">{discountLabel(c)}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-sm text-ink">{money(c.min_order_amount)}</span>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-ink">{c.used_count ?? 0}</span>
                        <span className="muted text-xs"> / {c.usage_limit != null ? c.usage_limit : '∞'}</span>
                      </td>
                      <td className="muted text-xs">
                        {formatDate(c.valid_from)} → {formatDate(c.valid_until)}
                      </td>
                      <td>
                        <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 16, fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>
                          {derived}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" onClick={() => openEdit(c)}>
                            <Edit size={11} /> Edit
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

      {(createOpen || editCoupon) && (
        <Modal
          open={createOpen || !!editCoupon}
          onClose={() => { setCreateOpen(false); setEditCoupon(null); }}
          title={editCoupon ? `Edit Coupon: ${editCoupon.code}` : 'Create New Promotional Coupon'}
          size="lg"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Coupon Code (Uppercase) <span className="req">*</span></label>
              <input
                className="input font-mono font-bold"
                style={{ textTransform: 'uppercase' }}
                required
                maxLength={60}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. KOSHI10"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Name / Headline</label>
                <input
                  className="input"
                  maxLength={180}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 10% Discount"
                />
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Campaign Description</label>
              <input
                className="input"
                maxLength={2000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 10% off on all artisan & handicraft orders"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Discount Type</label>
                <select className="select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Discount Value <span className="req">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  required
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Minimum Order Amount (NPR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Max Discount Cap (NPR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Total Usage Limit</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Per-User Limit</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={form.per_user_limit}
                  onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Valid From</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Valid Until</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Applies To</label>
              <select className="select" value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}>
                <option value="all">All Orders</option>
                <option value="store">Specific Stores</option>
                <option value="product">Specific Products</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setCreateOpen(false); setEditCoupon(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {editCoupon ? 'Save Changes' : 'Create Coupon'}
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
          title={`Delete Coupon Code ${deleteTarget.code}?`}
          message={`Are you sure you want to permanently delete coupon code "${deleteTarget.code}"? Shoppers will no longer be able to apply this discount at checkout.`}
          confirmText="Delete Coupon"
        />
      )}
    </div>
  )
}
