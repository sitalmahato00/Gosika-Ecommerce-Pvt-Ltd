import React, { useState } from 'react'
import { Tag, Percent, Megaphone, Plus, Sparkles } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { formatDate, money, errorMessage } from '../../utils/format'

const emptyForm = {
  name: '',
  tagline: '',
  type: 'percentage',
  discount_value: '',
  category: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
}

export default function VendorDiscounts() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchPromotions = (page, pageSize) =>
    api.get('/vendor/promotions', { params: { status: 'active', page, per_page: pageSize } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchPromotions, {
    pageSize: 10,
  })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vendor/promotions', {
        name: form.name,
        tagline: form.tagline || null,
        type: form.type,
        discount_value: Number(form.discount_value || 0),
        category: form.category || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: 'active',
      })
      toast.success('Discount created successfully')
      setModalOpen(false)
      setForm(emptyForm)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const activeCount = items.filter((p) => p.status === 'active').length
  const highestDiscount = items.length
    ? Math.max(...items.map((p) => Number(p.discount_value || 0)))
    : 0

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Discounts & Promotions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Launch simple percentage or flat-amount price discounts across your catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            + Create Discount
          </Button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <Tag size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Promotions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{meta.total}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <Megaphone size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Active Now</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{activeCount} Live</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Percent size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Highest Discount</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{highestDiscount ? `${highestDiscount}%` : '—'}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Validity</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}><Skeleton height={24} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : items.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Validity</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold text-sm text-ink">{p.name}</div>
                      {p.tagline && <div className="muted text-xs">{p.tagline}</div>}
                    </td>
                    <td>
                      <span className="chip chip-sm">{p.type === 'percentage' ? 'Percentage' : p.type === 'fixed' ? 'Flat Amount' : p.type}</span>
                    </td>
                    <td className="font-bold text-sm text-ink">
                      {p.type === 'percentage' ? `${Number(p.discount_value || 0)}%` : money(p.discount_value)}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="muted text-xs">
                      {p.start_date ? `${formatDate(p.start_date)} → ${formatDate(p.end_date)}` : 'Ongoing'}
                    </td>
                    <td className="muted text-xs">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Tag}
          title="No discounts found"
          message="Create a percentage or flat-amount discount to promote your products."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
              + Create Discount
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Discount" size="lg">
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span className="muted text-xs font-semibold uppercase block flex items-center gap-1">
              <Sparkles size={11} color="var(--primary)" /> Discounts are launched as active promotions and appear on the Promotions page.
            </span>
          </div>

          <Input
            label="Discount Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Summer Sale 20% Off"
          />

          <Input
            label="Tagline / Description (Optional)"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="e.g. 20% off on all handloom and pashmina items"
          />

          <div className="form-row">
            <Select
              label="Discount Type"
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="fixed">Flat Amount Off (NPR)</option>
            </Select>

            <Input
              label={form.type === 'percentage' ? 'Discount Value (%)' : 'Discount Amount (NPR)'}
              type="number"
              min="0"
              required
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
            />
          </div>

          <Input
            label="Target Category (Optional)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Handicrafts & Apparel"
          />

          <div className="form-row">
            <Input
              label="Start Date"
              type="date"
              required
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

          <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Creating…' : 'Create Discount'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
