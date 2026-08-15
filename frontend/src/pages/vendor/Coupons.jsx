import React, { useEffect, useState } from 'react'
import { Ticket, Plus, Pencil, Trash2, Copy, Check } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDate, errorMessage } from '../../utils/format'

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_order: '',
  max_discount: '',
  usage_limit: '',
  start_date: '',
  end_date: '',
  status: 'active',
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount (Rs.)' },
  { value: 'free_shipping', label: 'Free shipping' },
]

export default function VendorCoupons() {
  const toast = useToast()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/vendor/coupons').then((r) => {
      setCoupons(r.data.data?.coupons || r.data.data || [])
    }).catch(() => setCoupons([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openModal = (c) => {
    setEditing(c || null)
    setForm(c ? {
      code: c.code || '',
      type: c.type || 'percentage',
      value: c.value ?? '',
      min_order: c.min_order ?? '',
      max_discount: c.max_discount ?? '',
      usage_limit: c.usage_limit ?? '',
      start_date: c.start_date || '',
      end_date: c.end_date || '',
      status: c.status || 'active',
    } : emptyForm)
    setModalOpen(true)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setForm({ ...form, code })
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, value: form.value === '' ? undefined : Number(form.value) }
      if (editing) {
        await api.put(`/vendor/coupons/${editing.id}`, payload)
        toast.success('Coupon updated')
      } else {
        await api.post('/vendor/coupons', payload)
        toast.success('Coupon created')
      }
      setModalOpen(false)
      load()
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
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Could not copy code')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Coupons</h1>
          <p>Create promotional codes your customers can apply at checkout</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>New Coupon</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={84} />)}
        </div>
      ) : !coupons.length ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          message="Create your first promotional code to drive more sales."
          action={<Button variant="primary" icon={Plus} onClick={() => openModal(null)}>Create Coupon</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map((c) => (
            <div key={c.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
              <span className="thumb" style={{ width: 48, height: 48, background: 'rgba(37,99,235,0.12)', borderRadius: 8 }}>
                <Ticket size={20} color="var(--primary)" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 wrap">
                  <span className="font-mono font-bold" style={{ fontSize: 15, letterSpacing: '0.04em', color: 'var(--primary)' }}>
                    {c.code}
                  </span>
                  <button className="icon-btn icon-btn-sm" style={{ border: 'none' }} onClick={() => copyCode(c.code)} aria-label="Copy code">
                    {copied === c.code ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                  <StatusBadge status={c.status} />
                </div>
                <div className="muted text-sm">
                  {c.type === 'percentage' ? `${c.value}% off` : c.type === 'fixed' ? `${c.value} off` : 'Free shipping'}
                  {c.min_order ? ` · Min order ${c.min_order}` : ''}
                  {c.max_discount ? ` · Max discount ${c.max_discount}` : ''}
                </div>
                <div className="muted text-xs">
                  {c.start_date || c.end_date ? `${formatDate(c.start_date)} → ${formatDate(c.end_date)}` : 'No expiry'}
                  {c.usage_limit ? ` · ${c.usage_limit} uses` : ' · Unlimited'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn btn-outline btn-sm" onClick={() => openModal(c)}><Pencil size={13} /> Edit</button>
                <button className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(c)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit coupon' : 'New coupon'} size="lg">
        <form onSubmit={save} className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div style={{ flex: 1 }}>
              <Input label="Coupon code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER10" />
            </div>
            <Button type="button" variant="outline" onClick={generateCode}>Generate</Button>
          </div>

          <div className="form-row">
            <Select label="Discount type" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Input
              label={form.type === 'percentage' ? 'Discount value (%)' : 'Discount value (Rs.)'}
              type="number"
              min={0}
              required
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <Input label="Minimum order (Rs., optional)" type="number" min={0} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            <Input label="Max discount (Rs., optional)" type="number" min={0} value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
            <Input label="Usage limit (optional)" type="number" min={1} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
            <Input label="Start date (optional)" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End date (optional)" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </Select>
          </div>

          <Button type="submit" block disabled={saving}>
            {saving ? <Spinner size={15} color="#fff" /> : editing ? 'Update coupon' : 'Create coupon'}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Delete coupon?"
        message={`Coupon "${deleteTarget?.code}" will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
