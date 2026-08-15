import React, { useState, useMemo } from 'react'
import {
  Ticket, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Tag,
  Calendar, Download, Percent, DollarSign, Users, TrendingUp,
  Clock, ShieldCheck, Sparkles, AlertTriangle
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_COUPONS = [
  { id: 1, code: 'GOSIKANEW', title: 'New Customer Welcome Voucher', type: 'percentage', value: 10, minOrder: 1500, maxDiscount: 500, usageCount: 412, usageLimit: 1000, expiry: '2026-12-31', status: 'active' },
  { id: 2, code: 'DASHAIN2026', title: 'Bada Dashain Festive Mega Discount', type: 'fixed', value: 500, minOrder: 5000, maxDiscount: 500, usageCount: 180, usageLimit: 500, expiry: '2026-10-30', status: 'active' },
  { id: 3, code: 'FREEDELIVERY', title: 'Zero Shipping Fee Campaign', type: 'fixed', value: 150, minOrder: 2000, maxDiscount: 150, usageCount: 890, usageLimit: 2000, expiry: '2026-09-30', status: 'active' },
  { id: 4, code: 'TIHAR2083', title: 'Dipawali & Tihar Special Offer', type: 'percentage', value: 15, minOrder: 3500, maxDiscount: 750, usageCount: 95, usageLimit: 600, expiry: '2026-11-15', status: 'active' },
  { id: 5, code: 'HANDICRAFT10', title: 'Nepali Artisan Promotion', type: 'percentage', value: 10, minOrder: 2500, maxDiscount: 400, usageCount: 120, usageLimit: 400, expiry: '2026-12-31', status: 'active' },
  { id: 6, code: 'FLASH50', title: 'Monsoon Flash Clearance Promo', type: 'percentage', value: 50, minOrder: 3000, maxDiscount: 1000, usageCount: 50, usageLimit: 50, expiry: '2026-08-01', status: 'expired' },
]

export default function AdminCoupons() {
  const toast = useToast()
  const [coupons, setCoupons] = useState(SAMPLE_COUPONS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({
    code: '',
    title: '',
    type: 'percentage',
    value: 10,
    minOrder: 1000,
    maxDiscount: 500,
    usageLimit: 500,
    expiry: '2026-12-31',
  })

  const handleSave = (e) => {
    e.preventDefault()
    if (editCoupon) {
      setCoupons(coupons.map((c) => c.id === editCoupon.id ? {
        ...c,
        code: form.code.toUpperCase().trim(),
        title: form.title || c.title,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        usageLimit: Number(form.usageLimit),
        expiry: form.expiry,
      } : c))
      toast.success(`Coupon code ${form.code.toUpperCase()} updated`)
      setEditCoupon(null)
    } else {
      const newCoupon = {
        id: Date.now(),
        code: form.code.toUpperCase().trim(),
        title: form.title || `${form.code.toUpperCase()} Promotion`,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        usageCount: 0,
        usageLimit: Number(form.usageLimit),
        expiry: form.expiry,
        status: 'active',
      }
      setCoupons([newCoupon, ...coupons])
      toast.success(`Coupon code ${newCoupon.code} created successfully!`)
      setCreateOpen(false)
    }
    setForm({ code: '', title: '', type: 'percentage', value: 10, minOrder: 1000, maxDiscount: 500, usageLimit: 500, expiry: '2026-12-31' })
  }

  const toggleStatus = (id) => {
    setCoupons(coupons.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c))
    toast.info('Coupon status updated')
  }

  const doDeleteCoupon = () => {
    if (!deleteTarget) return
    setCoupons(coupons.filter((c) => c.id !== deleteTarget.id))
    toast.success(`Coupon code ${deleteTarget.code} deleted permanently`)
    setDeleteTarget(null)
  }

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchCode = c.code.toLowerCase().includes(q)
        const matchTitle = (c.title || '').toLowerCase().includes(q)
        if (!matchCode && !matchTitle) return false
      }
      return true
    })
  }, [coupons, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Coupon Code', 'Campaign Title', 'Discount Type', 'Discount Value', 'Min Order (NPR)', 'Max Discount Cap (NPR)', 'Redemptions', 'Total Limit', 'Expiry Date', 'Status'],
      ...filtered.map((c) => [
        c.code,
        c.title,
        c.type,
        c.value,
        c.minOrder,
        c.maxDiscount,
        c.usageCount,
        c.usageLimit,
        c.expiry,
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

  // Aggregate Metrics
  const activeCount = coupons.filter(c => c.status === 'active').length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)
  const totalSavings = coupons.reduce((sum, c) => sum + ((c.usageCount || 0) * (c.type === 'fixed' ? c.value : 350)), 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Coupon & Promotional Voucher Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Create promotional coupon codes, percentage/flat discounts, usage caps, and festive campaign rules across Nepal.
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
              setForm({ code: '', title: '', type: 'percentage', value: 10, minOrder: 1000, maxDiscount: 500, usageLimit: 500, expiry: '2026-12-31' })
              setCreateOpen(true)
            }}
          >
            <Plus size={14} /> Create Coupon
          </button>
        </div>
      </div>

      {/* 4 Coupon KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Vouchers</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Ticket size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{activeCount} Active Codes</div>
          <div className="muted text-xs mt-1">Festival & onboarding promo</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Redemptions</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{totalRedemptions} Used</div>
          <div className="muted text-xs mt-1">High checkout conversion</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Customer Savings</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(totalSavings)}</div>
          <div className="muted text-xs mt-1">Total discounts awarded</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Campaign ROI</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>6.8x GMV Boost</div>
          <div className="muted text-xs mt-1">Avg basket size +34%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Coupons (${coupons.length})` },
          { value: 'active', label: `Active (${coupons.filter(c => c.status === 'active').length})` },
          { value: 'inactive', label: `Inactive (${coupons.filter(c => c.status === 'inactive').length})` },
          { value: 'expired', label: `Expired (${coupons.filter(c => c.status === 'expired').length})` },
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

      {/* Search Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search coupon code or campaign…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} voucher{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Coupon Code & Title</th>
                <th>Discount Value</th>
                <th>Min. Order</th>
                <th>Max Discount</th>
                <th>Redemptions</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="chip chip-sm font-mono font-bold" style={{ letterSpacing: '0.05em', color: 'var(--primary)', background: 'var(--primary-50)' }}>
                        {c.code}
                      </span>
                    </div>
                    <div className="muted text-xs mt-0.5" style={{ fontSize: 10 }}>{c.title}</div>
                  </td>
                  <td>
                    <span className="font-bold text-primary text-sm">
                      {c.type === 'percentage' ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-sm text-ink">{money(c.minOrder)}</span>
                  </td>
                  <td>
                    <span className="muted text-xs font-semibold">{money(c.maxDiscount)}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-ink">{c.usageCount}</span>
                      <span className="muted text-xs">/ {c.usageLimit}</span>
                    </div>
                    <div style={{ width: 80, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
                      <div style={{ width: `${Math.min(100, Math.round(((c.usageCount || 0) / (c.usageLimit || 1)) * 100))}%`, height: '100%', background: 'var(--primary)' }} />
                    </div>
                  </td>
                  <td className="muted text-xs">
                    {c.expiry}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-active' : c.status === 'expired' ? 'badge-draft' : 'badge-danger'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className={`btn ${c.status === 'active' ? 'btn-outline' : 'btn-success'} btn-xs`}
                        onClick={() => toggleStatus(c.id)}
                      >
                        {c.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => {
                          setEditCoupon(c)
                          setForm({
                            code: c.code,
                            title: c.title || '',
                            type: c.type,
                            value: c.value,
                            minOrder: c.minOrder,
                            maxDiscount: c.maxDiscount,
                            usageLimit: c.usageLimit,
                            expiry: c.expiry,
                          })
                        }}
                      >
                        <Edit size={11} />
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
                placeholder="e.g. FESTIVE2026"
              />
            </div>

            <div className="form-group">
              <label className="label">Campaign / Promotion Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Bada Dashain 15% Festive Voucher"
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
                <label className="label">Expiration Date <span className="req">*</span></label>
                <input
                  type="date"
                  className="input"
                  required
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
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
