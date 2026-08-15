import React, { useState } from 'react'
import { Ticket, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Tag, Calendar } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_COUPONS = [
  { id: 1, code: 'GOSIKANEW', type: 'percentage', value: 10, minOrder: 1500, maxDiscount: 500, usageCount: 412, usageLimit: 1000, expiry: '2026-12-31', status: 'active' },
  { id: 2, code: 'DASHAIN2026', type: 'fixed', value: 500, minOrder: 5000, maxDiscount: 500, usageCount: 180, usageLimit: 500, expiry: '2026-10-30', status: 'active' },
  { id: 3, code: 'FREEDELIVERY', type: 'fixed', value: 150, minOrder: 2000, maxDiscount: 150, usageCount: 890, usageLimit: 2000, expiry: '2026-09-30', status: 'active' },
  { id: 4, code: 'FLASH50', type: 'percentage', value: 50, minOrder: 3000, maxDiscount: 1000, usageCount: 50, usageLimit: 50, expiry: '2026-08-01', status: 'expired' },
]

export default function AdminCoupons() {
  const toast = useToast()
  const [coupons, setCoupons] = useState(SAMPLE_COUPONS)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    minOrder: 1000,
    maxDiscount: 500,
    usageLimit: 500,
    expiry: '2026-12-31',
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const newCoupon = {
      id: coupons.length + 1,
      code: form.code.toUpperCase().trim(),
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
    setCreateOpen(false)
    setForm({ code: '', type: 'percentage', value: 10, minOrder: 1000, maxDiscount: 500, usageLimit: 500, expiry: '2026-12-31' })
    toast.success(`Coupon code ${newCoupon.code} created!`)
  }

  const toggleStatus = (id) => {
    setCoupons(coupons.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c))
    toast.info('Coupon status updated')
  }

  const deleteCoupon = (id) => {
    setCoupons(coupons.filter((c) => c.id !== id))
    toast.success('Coupon removed')
  }

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Coupon & Voucher Management</h1>
          <p>Create promotional coupon codes, discounts, usage limits, and campaign rules</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Create New Coupon
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 360 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search coupon code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount</th>
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
                  <span className="chip chip-sm font-bold" style={{ letterSpacing: '0.05em' }}>
                    {c.code}
                  </span>
                </td>
                <td>
                  <span className="font-bold text-primary">
                    {c.type === 'percentage' ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                  </span>
                </td>
                <td className="muted text-sm">{money(c.minOrder)}</td>
                <td className="muted text-sm">{money(c.maxDiscount)}</td>
                <td>
                  <span className="font-semibold text-sm">{c.usageCount}</span>
                  <span className="muted text-xs"> / {c.usageLimit}</span>
                </td>
                <td className="muted text-sm">{c.expiry}</td>
                <td>
                  <span className={`badge ${c.status === 'active' ? 'badge-active' : c.status === 'expired' ? 'badge-draft' : 'badge-danger'}`}>
                    {c.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className={`btn ${c.status === 'active' ? 'btn-outline' : 'btn-success'} btn-xs`}
                      onClick={() => toggleStatus(c.id)}
                    >
                      {c.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger-outline btn-xs"
                      onClick={() => deleteCoupon(c.id)}
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

      {/* Create Coupon Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Promotional Coupon">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Coupon Code (Uppercase)</label>
              <input
                className="input font-bold"
                style={{ textTransform: 'uppercase' }}
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. FESTIVE2026"
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
                <label className="label">Discount Value</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Minimum Order Requirement (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Max Discount Cap (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Total Usage Limit</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Expiration Date</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Coupon</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
