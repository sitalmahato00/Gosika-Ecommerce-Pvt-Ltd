import React, { useState } from 'react'
import {
  Ticket, Plus, Pencil, Trash2, Copy, Check, Search,
  Sparkles, Zap, Gift, TrendingUp
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { formatDate, money, errorMessage } from '../../utils/format'

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_discount: '',
  usage_limit: '',
  per_user_limit: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  status: 'active',
}

const PRESETS = [
  { label: '10% Storewide', code: 'PROMO10', type: 'percentage', value: 10, min_order: 1000, max_discount: 500 },
  { label: 'Flat Rs. 500 Off', code: 'SAVE500', type: 'fixed', value: 500, min_order: 2500, max_discount: 500 },
  { label: 'Free Delivery', code: 'FREEDELIVERY', type: 'free_shipping', value: 0, min_order: 1500, max_discount: 250 },
  { label: 'Festive 25% Off', code: 'FESTIVE25', type: 'percentage', value: 25, min_order: 4000, max_discount: 2000 },
]

export default function VendorCoupons() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(null)

  const fetchCoupons = (page, pageSize) =>
    api.get('/vendor/coupons', { params: { search, page, per_page: pageSize } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchCoupons, {
    pageSize: 9,
    deps: [search],
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openModal = (c) => {
    setEditing(c || null)
    setForm(
      c
        ? {
            code: c.code || '',
            description: c.description || '',
            discount_type: c.type || 'percentage',
            discount_value: c.value != null ? Number(c.value) : '',
            min_order_amount: c.min_order != null ? Number(c.min_order) : '',
            max_discount: c.max_discount != null ? Number(c.max_discount) : '',
            usage_limit: c.usage_limit ?? '',
            per_user_limit: '',
            start_date: c.start_date ? c.start_date.slice(0, 10) : '',
            end_date: c.end_date ? c.end_date.slice(0, 10) : '',
            status: c.status || 'active',
          }
        : emptyForm
    )
    setModalOpen(true)
  }

  const generateCode = () => {
    const prefixes = ['GOSIKA', 'KOSHI', 'FESTIVE', 'SPECIAL', 'DEAL']
    const pref = prefixes[Math.floor(Math.random() * prefixes.length)]
    const num = Math.floor(10 + Math.random() * 90)
    setForm((prev) => ({ ...prev, code: `${pref}${num}` }))
  }

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      code: preset.code,
      discount_type: preset.type,
      discount_value: preset.value,
      min_order_amount: preset.min_order,
      max_discount: preset.max_discount,
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_type === 'free_shipping' ? 0 : Number(form.discount_value || 0),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
      }
      if (editing) {
        await api.put(`/vendor/coupons/${editing.id}`, payload)
        toast.success('Coupon updated successfully')
      } else {
        await api.post('/vendor/coupons', payload)
        toast.success('Coupon created successfully')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vendor/coupons/${deleteTarget.id}`)
      toast.success('Coupon deleted')
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      toast.success(`Copied "${code}" to clipboard`)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Could not copy code')
    }
  }

  const activeCoupons = items.filter((c) => c.status === 'active').length
  const totalUsed = items.reduce((sum, c) => sum + (c.used_count || 0), 0)
  const remainingUses = items.reduce(
    (sum, c) => sum + Math.max(0, (c.usage_limit || 0) - (c.used_count || 0)),
    0
  )

  const countFor = (s) => (s === 'all' ? items.length : items.filter((c) => c.status === s).length)

  const filteredCoupons =
    statusFilter === 'all' ? items : items.filter((c) => c.status === statusFilter)

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Promotional Coupons & Vouchers</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Create custom coupon discount codes to boost order conversions and customer retention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>
            + Create New Coupon
          </Button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <Ticket size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Active Promo Codes</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{activeCoupons} Live</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <Zap size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Redemptions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{totalUsed} times</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Gift size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Coupons</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{meta.total}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Remaining Uses</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{remainingUses}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {[
              { id: 'all', label: `All Coupons (${countFor('all')})` },
              { id: 'active', label: `Active (${countFor('active')})` },
              { id: 'scheduled', label: `Scheduled (${countFor('scheduled')})` },
              { id: 'expired', label: `Expired (${countFor('expired')})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${statusFilter === t.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => setStatusFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={applySearch} style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search coupon code…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={220} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : filteredCoupons.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {filteredCoupons.map((c) => {
            const isPct = c.type === 'percentage'
            const isFree = c.type === 'free_shipping'
            const val = Number(c.value || 0)

            return (
              <div
                key={c.id}
                className="card flex flex-col justify-between"
                style={{
                  padding: 18,
                  margin: 0,
                  position: 'relative',
                  border: c.status === 'active' ? '2px solid rgba(37, 99, 235, 0.25)' : '1px solid var(--border)',
                  background: c.status === 'active' ? '#fff' : 'var(--bg)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-bold"
                        style={{
                          fontSize: 18,
                          letterSpacing: '0.06em',
                          color: 'var(--primary)',
                          background: 'var(--primary-50)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed var(--primary)',
                        }}
                      >
                        {c.code}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '4px 6px' }}
                        onClick={() => copyCode(c.code)}
                        title="Copy Code"
                      >
                        {copied === c.code ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginTop: 8 }}>
                    {isPct ? `${val}% Discount` : isFree ? 'Free Shipping on Delivery' : `Flat ${money(val)} Discount`}
                  </div>

                  {c.description && (
                    <p className="muted text-xs mt-1 mb-2" style={{ lineHeight: 1.4 }}>
                      {c.description}
                    </p>
                  )}

                  <div className="muted text-xs flex flex-col gap-1 mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      Min Order: <strong>{money(c.min_order || 0)}</strong>
                      {c.max_discount ? <> · Max Cap: <strong>{money(c.max_discount)}</strong></> : ''}
                    </div>
                    <div>
                      Usage: <strong>{c.used_count || 0}</strong> {c.usage_limit ? `/ ${c.usage_limit} limit` : '(Unlimited)'}
                    </div>
                    <div>
                      Validity: {c.start_date || c.end_date ? `${formatDate(c.start_date)} → ${formatDate(c.end_date)}` : 'No Expiry'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 mt-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => openModal(c)}
                  >
                    <Pencil size={11} /> Edit Coupon
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-xs"
                    onClick={() => setDeleteTarget(c)}
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Ticket}
          title="No coupons found"
          message="Create your first promotional code to drive more sales."
          action={
            <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>
              + Create Coupon
            </Button>
          }
        />
      )}

      {filteredCoupons.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit Coupon: ${editing.code}` : 'Create New Promotional Coupon'} size="lg">
          <form onSubmit={save} className="flex flex-col gap-3">
            {!editing && (
              <div className="p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span className="muted text-xs font-semibold uppercase block mb-1.5 flex items-center gap-1">
                  <Sparkles size={11} color="var(--primary)" /> Quick Fill Presets:
                </span>
                <div className="flex gap-1 wrap">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{ border: '1px solid var(--border)', background: '#fff', fontSize: 11 }}
                      onClick={() => applyPreset(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <div style={{ flex: 1 }}>
                <Input
                  label="Coupon Code"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="e.g. DASHAIN20"
                />
              </div>
              <Button type="button" variant="outline" onClick={generateCode}>
                <Sparkles size={13} /> Auto-Generate
              </Button>
            </div>

            <Input
              label="Promo Tagline / Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. 20% off on all handloom and pashmina items"
            />

            <div className="form-row">
              <Select
                label="Discount Type"
                required
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              >
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount Off (NPR)</option>
                <option value="free_shipping">Free Shipping on Delivery</option>
              </Select>

              <Input
                label={form.discount_type === 'percentage' ? 'Discount Value (%)' : 'Discount Amount (NPR)'}
                type="number"
                min="0"
                required={form.discount_type !== 'free_shipping'}
                disabled={form.discount_type === 'free_shipping'}
                value={form.discount_type === 'free_shipping' ? '0' : form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Minimum Order (NPR)"
                type="number"
                min="0"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                placeholder="e.g. 1500"
              />
              <Input
                label="Max Discount Cap (NPR, optional)"
                type="number"
                min="0"
                value={form.max_discount}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                placeholder="e.g. 2000"
              />
              <Input
                label="Total Usage Limit"
                type="number"
                min="1"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="e.g. 500"
              />
            </div>

            <div className="form-row">
              <Input
                label="Per User Limit"
                type="number"
                min="1"
                value={form.per_user_limit}
                onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                placeholder="e.g. 1"
              />
              <Input
                label="Start Date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active / Running</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Coupon' : 'Create & Launch Coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Delete coupon?"
        message={`"${deleteTarget?.code}" will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
