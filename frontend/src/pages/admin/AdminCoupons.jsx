import React, { useState, useMemo } from 'react'
import {
  Ticket, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Tag,
  Calendar, Download, Percent, DollarSign, Users, TrendingUp,
  Clock, ShieldCheck, Sparkles, AlertTriangle, Copy, Check,
  LayoutGrid, List
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_COUPONS = [
  {
    id: 1,
    code: 'KOSHI10',
    title: '10% Discount',
    description: '10% off on all artisan & handicraft orders',
    type: 'percentage',
    value: 10,
    minOrder: 1500,
    maxDiscount: 1000,
    usageCount: 84,
    usageLimit: 500,
    startDate: '01 Aug 2026',
    expiry: '30 Sept 2026',
    status: 'active',
  },
  {
    id: 2,
    code: 'DASHAIN20',
    title: '20% Discount',
    description: 'Dashain Festival Super Discount on Pashmina & Apparel',
    type: 'percentage',
    value: 20,
    minOrder: 3000,
    maxDiscount: 2500,
    usageCount: 142,
    usageLimit: 300,
    startDate: '10 Aug 2026',
    expiry: '15 Oct 2026',
    status: 'active',
  },
  {
    id: 3,
    code: 'TIHAR500',
    title: 'Rs. 500 Discount',
    description: 'Flat Rs. 500 off on Metal Craft & Home Decor for Tihar',
    type: 'fixed',
    value: 500,
    minOrder: 4000,
    maxDiscount: 500,
    usageCount: 0,
    usageLimit: 400,
    startDate: '25 Oct 2026',
    expiry: '15 Nov 2026',
    status: 'scheduled',
  },
  {
    id: 4,
    code: 'FREESHIP',
    title: 'Free Delivery',
    description: 'Zero shipping charge on All Organic Tea & Spices across Nepal',
    type: 'fixed',
    value: 150,
    minOrder: 1800,
    maxDiscount: 150,
    usageCount: 390,
    usageLimit: 1000,
    startDate: '01 Aug 2026',
    expiry: '31 Dec 2026',
    status: 'active',
  },
  {
    id: 5,
    code: 'MONSOON50',
    title: '50% Discount',
    description: 'Monsoon Clearance Promo on Select Wooden Crafts',
    type: 'percentage',
    value: 50,
    minOrder: 3500,
    maxDiscount: 1500,
    usageCount: 50,
    usageLimit: 50,
    startDate: '01 Jul 2026',
    expiry: '01 Aug 2026',
    status: 'expired',
  },
]

export default function AdminCoupons() {
  const toast = useToast()
  const [coupons, setCoupons] = useState(SAMPLE_COUPONS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [copiedCode, setCopiedCode] = useState(null)
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    type: 'percentage',
    value: 10,
    minOrder: 1500,
    maxDiscount: 1000,
    usageLimit: 500,
    startDate: '01 Aug 2026',
    expiry: '30 Sept 2026',
    status: 'active',
  })

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Coupon code "${code}" copied to clipboard!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (editCoupon) {
      setCoupons(coupons.map((c) => c.id === editCoupon.id ? {
        ...c,
        code: form.code.toUpperCase().trim(),
        title: form.title || (form.type === 'percentage' ? `${form.value}% Discount` : `Rs. ${form.value} Discount`),
        description: form.description || c.description,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        usageLimit: Number(form.usageLimit),
        startDate: form.startDate,
        expiry: form.expiry,
        status: form.status,
      } : c))
      toast.success(`Coupon code "${form.code.toUpperCase()}" updated successfully`)
      setEditCoupon(null)
    } else {
      const newCoupon = {
        id: Date.now(),
        code: form.code.toUpperCase().trim(),
        title: form.title || (form.type === 'percentage' ? `${form.value}% Discount` : `Rs. ${form.value} Discount`),
        description: form.description || 'Special promotional discount for GOSIKA shoppers',
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        usageCount: 0,
        usageLimit: Number(form.usageLimit),
        startDate: form.startDate || 'Today',
        expiry: form.expiry,
        status: form.status || 'active',
      }
      setCoupons([newCoupon, ...coupons])
      toast.success(`Coupon code "${newCoupon.code}" created successfully!`)
      setCreateOpen(false)
    }
    setForm({
      code: '',
      title: '',
      description: '',
      type: 'percentage',
      value: 10,
      minOrder: 1500,
      maxDiscount: 1000,
      usageLimit: 500,
      startDate: '01 Aug 2026',
      expiry: '30 Sept 2026',
      status: 'active',
    })
  }

  const doDeleteCoupon = () => {
    if (!deleteTarget) return
    setCoupons(coupons.filter((c) => c.id !== deleteTarget.id))
    toast.success(`Coupon code "${deleteTarget.code}" deleted permanently`)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchCode = c.code.toLowerCase().includes(q)
        const matchTitle = (c.title || '').toLowerCase().includes(q)
        const matchDesc = (c.description || '').toLowerCase().includes(q)
        if (!matchCode && !matchTitle && !matchDesc) return false
      }
      return true
    })
  }, [coupons, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Coupon Code', 'Headline Title', 'Campaign Description', 'Type', 'Discount Value', 'Min Order (NPR)', 'Max Cap (NPR)', 'Usage Count', 'Usage Limit', 'Validity', 'Status'],
      ...filtered.map((c) => [
        c.code,
        c.title,
        c.description,
        c.type,
        c.value,
        c.minOrder,
        c.maxDiscount,
        c.usageCount,
        c.usageLimit,
        `${c.startDate} -> ${c.expiry}`,
        c.status,
      ])
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

  // Counts
  const totalCount = coupons.length
  const activeCount = coupons.filter(c => c.status === 'active').length
  const scheduledCount = coupons.filter(c => c.status === 'scheduled').length
  const expiredCount = coupons.filter(c => c.status === 'expired').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
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
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => {
              setForm({
                code: '',
                title: '',
                description: '',
                type: 'percentage',
                value: 10,
                minOrder: 1500,
                maxDiscount: 1000,
                usageLimit: 500,
                startDate: '01 Aug 2026',
                expiry: '30 Sept 2026',
                status: 'active',
              })
              setCreateOpen(true)
            }}
          >
            <Plus size={14} /> Create New Coupon
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Coupons (${totalCount})` },
          { value: 'active', label: `Active (${activeCount})` },
          { value: 'scheduled', label: `Scheduled (${scheduledCount})` },
          { value: 'expired', label: `Expired (${expiredCount})` },
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
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="muted text-xs font-semibold">
            {filtered.length} voucher{filtered.length !== 1 ? 's' : ''} listed
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

      {/* Voucher Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filtered.map((c) => {
            const isCopied = copiedCode === c.code
            const statusBg = c.status === 'active' ? '#ecfdf5' : c.status === 'scheduled' ? '#f0f9ff' : '#fef2f2'
            const statusColor = c.status === 'active' ? '#10b981' : c.status === 'scheduled' ? '#0284c7' : '#ef4444'

            return (
              <div
                key={c.id}
                className="card flex flex-col justify-between"
                style={{
                  padding: '20px 22px',
                  margin: 0,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  {/* Top Row: Dashed Code Box + Status Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{
                          border: '1.5px dashed #3b82f6',
                          background: 'rgba(59, 130, 246, 0.04)',
                          borderRadius: 8,
                          padding: '6px 14px',
                          color: '#2563eb',
                          fontWeight: 800,
                          fontSize: 16,
                          letterSpacing: '0.04em',
                          fontFamily: 'monospace',
                        }}
                      >
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

                    <span
                      style={{
                        background: statusBg,
                        color: statusColor,
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'capitalize',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Headline & Description */}
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                    {c.title}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                    {c.description}
                  </p>

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 14px 0' }} />

                  {/* Details Breakdown */}
                  <div className="flex flex-col gap-1.5" style={{ fontSize: 12.5, color: '#475569' }}>
                    <div>
                      <span>Min Order: <strong>{money(c.minOrder)}</strong></span>
                      <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
                      <span>Max Cap: <strong>{money(c.maxDiscount)}</strong></span>
                    </div>

                    <div>
                      <span>Usage: <strong>{c.usageCount}</strong> / {c.usageLimit} limit</span>
                    </div>

                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      Validity: <span>{c.startDate} → {c.expiry}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div
                  className="flex items-center justify-end gap-2 pt-3.5 mt-4"
                  style={{ borderTop: '1px solid #f1f5f9' }}
                >
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1.5"
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, fontWeight: 600 }}
                    onClick={() => {
                      setEditCoupon(c)
                      setForm({
                        code: c.code,
                        title: c.title,
                        description: c.description,
                        type: c.type,
                        value: c.value,
                        minOrder: c.minOrder,
                        maxDiscount: c.maxDiscount,
                        usageLimit: c.usageLimit,
                        startDate: c.startDate,
                        expiry: c.expiry,
                        status: c.status,
                      })
                    }}
                  >
                    <Edit size={12} /> Edit Coupon
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{
                      border: '1px solid #fecaca',
                      color: '#ef4444',
                      background: '#fff5f5',
                      padding: '5px 8px',
                      borderRadius: 6,
                    }}
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
        /* Table View */
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount Headline</th>
                  <th>Min. Order</th>
                  <th>Max Discount</th>
                  <th>Redemptions</th>
                  <th>Validity Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono font-bold text-primary text-xs" style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '3px 8px', borderRadius: 4 }}>
                        {c.code}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-sm text-ink">{c.title}</div>
                      <div className="muted text-xs line-clamp-1">{c.description}</div>
                    </td>
                    <td>
                      <span className="font-semibold text-sm text-ink">{money(c.minOrder)}</span>
                    </td>
                    <td>
                      <span className="muted text-xs font-semibold">{money(c.maxDiscount)}</span>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-ink">{c.usageCount}</span>
                      <span className="muted text-xs"> / {c.usageLimit}</span>
                    </td>
                    <td className="muted text-xs">
                      {c.startDate} → {c.expiry}
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-active' : c.status === 'scheduled' ? 'badge-info' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs flex items-center gap-1"
                          onClick={() => {
                            setEditCoupon(c)
                            setForm({
                              code: c.code,
                              title: c.title,
                              description: c.description,
                              type: c.type,
                              value: c.value,
                              minOrder: c.minOrder,
                              maxDiscount: c.maxDiscount,
                              usageLimit: c.usageLimit,
                              startDate: c.startDate,
                              expiry: c.expiry,
                              status: c.status,
                            })
                          }}
                        >
                          <Edit size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => setDeleteTarget(c)}
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

      {/* Create / Edit Coupon Modal */}
      {(createOpen || editCoupon) && (
        <Modal
          open={createOpen || !!editCoupon}
          onClose={() => { setCreateOpen(false); setEditCoupon(null); }}
          title={editCoupon ? `Edit Coupon: ${editCoupon.code}` : 'Create New Promotional Coupon'}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Coupon Code (Uppercase) <span className="req">*</span></label>
              <input
                className="input font-mono font-bold"
                style={{ textTransform: 'uppercase' }}
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. KOSHI10"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Discount Headline Title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 10% Discount"
                />
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Campaign Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 10% off on all artisan & handicraft orders"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Discount Type</label>
                <select
                  className="select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Discount Value <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Minimum Order Requirement (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Max Discount Cap (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Total Usage Limit <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Validity Expiration Date <span className="req">*</span></label>
                <input
                  type="text"
                  className="input"
                  required
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                  placeholder="e.g. 30 Sept 2026"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setCreateOpen(false); setEditCoupon(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                {editCoupon ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Coupon Safety Confirm Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={doDeleteCoupon}
          danger
          title={`Delete Coupon Code ${deleteTarget.code}?`}
          message={`Are you sure you want to permanently delete coupon code "${deleteTarget.code}" (${deleteTarget.title})? Shoppers will no longer be able to apply this discount at checkout.`}
          confirmText="Delete Coupon"
        />
      )}
    </div>
  )
}
