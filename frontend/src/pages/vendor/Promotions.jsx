import React, { useState } from 'react'
import {
  Megaphone, Plus, Pencil, Trash2, Calendar, Sparkles,
  TrendingUp, ShoppingBag, Percent, Search
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
import { formatDate, money, errorMessage, apiImage } from '../../utils/format'

const emptyForm = {
  name: '',
  tagline: '',
  type: 'percentage',
  discount_value: '',
  category: '',
  banner_image: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  status: 'active',
}

const CAMPAIGN_PRESETS = [
  { label: 'Dashain Festive Deal', name: 'Dashain Mega Sale', type: 'percentage', discount_value: 25, category: 'All Products' },
  { label: 'Free Shipping Campaign', name: 'Nationwide Free Delivery Fest', type: 'free_shipping', discount_value: 0, category: 'Food & Beverages' },
  { label: 'Flash Sale (30% Off)', name: '24-Hour Artisan Flash Sale', type: 'percentage', discount_value: 30, category: 'Handicrafts' },
  { label: 'Flat Rs. 500 Promo', name: 'Autumn Seasonal Discount', type: 'fixed', discount_value: 500, category: 'Apparel' },
]

const TABS = [
  { id: 'all', label: 'All Campaigns' },
  { id: 'active', label: 'Active' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'draft', label: 'Draft' },
  { id: 'ended', label: 'Ended' },
]

export default function VendorPromotions() {
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

  const fetchPromotions = (page, pageSize) =>
    api.get('/vendor/promotions', {
      params: { status: statusFilter === 'all' ? '' : statusFilter, search, page, per_page: pageSize },
    })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchPromotions, {
    pageSize: 8,
    deps: [statusFilter, search],
  })

  const changeStatus = (value) => {
    setPage(1)
    setStatusFilter(value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openModal = (p) => {
    setEditing(p || null)
    setForm(
      p
        ? {
            name: p.name || '',
            tagline: p.tagline || '',
            type: p.type || 'percentage',
            discount_value: p.discount_value != null ? Number(p.discount_value) : '',
            category: p.category || '',
            banner_image: p.banner_image || '',
            start_date: p.start_date ? p.start_date.slice(0, 10) : '',
            end_date: p.end_date ? p.end_date.slice(0, 10) : '',
            status: p.status || 'active',
          }
        : emptyForm
    )
    setModalOpen(true)
  }

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      type: preset.type,
      discount_value: preset.discount_value,
      category: preset.category,
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        tagline: form.tagline || null,
        type: form.type,
        discount_value: form.type === 'free_shipping' ? 0 : Number(form.discount_value || 0),
        category: form.category || null,
        banner_image: form.banner_image || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
      }
      if (editing) {
        await api.put(`/vendor/promotions/${editing.id}`, payload)
        toast.success('Promotion campaign updated')
      } else {
        await api.post('/vendor/promotions', payload)
        toast.success('Promotion campaign created')
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
      await api.delete(`/vendor/promotions/${deleteTarget.id}`)
      toast.success('Promotion deleted')
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = items.filter((p) => p.status === 'active').length
  const totalItemsParticipating = items.reduce((sum, p) => sum + (p.participating_items || 0), 0)
  const avgDiscount = items.length
    ? items.reduce((sum, p) => sum + Number(p.discount_value || 0), 0) / items.length
    : 0

  const countFor = (s) => (s === 'all' ? items.length : items.filter((p) => p.status === s).length)

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Marketing Campaigns & Promotions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Run seasonal festival sales, flash discounts, and storewide promotional campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>
            + Create New Campaign
          </Button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <Megaphone size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Active Campaigns</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{activeCount} Running</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <ShoppingBag size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Participating Products</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{totalItemsParticipating} Catalog SKUs</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Campaigns</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{meta.total}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <Percent size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Avg. Discount</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{avgDiscount ? `${avgDiscount.toFixed(1)}% Off` : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${statusFilter === t.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => changeStatus(t.id)}
              >
                {t.label} ({countFor(t.id)})
              </button>
            ))}
          </div>

          <form onSubmit={applySearch} style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search campaigns by name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={280} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : items.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {items.map((p) => {
            const value = Number(p.discount_value || 0)
            return (
              <div
                key={p.id}
                className="card card-pad-none flex flex-col justify-between"
                style={{
                  overflow: 'hidden',
                  border: p.status === 'active' ? '2px solid rgba(37, 99, 235, 0.3)' : '1px solid var(--border)',
                  background: '#fff',
                }}
              >
                <div>
                  <div style={{ height: 130, position: 'relative', overflow: 'hidden', background: 'var(--navy)' }}>
                    <img
                      src={apiImage(p.banner_image, p.name)}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.1) 60%)',
                      display: 'flex', alignItems: 'flex-end', padding: 14
                    }}>
                      <span className="chip chip-sm" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 800 }}>
                        {p.type === 'percentage' ? `Up to ${value}% OFF` : p.type === 'free_shipping' ? 'FREE SHIPPING' : p.type === 'buy_one_get_one' ? 'BUY 1 GET 1' : `Flat ${money(value)} OFF`}
                      </span>
                    </div>
                    <span style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StatusBadge status={p.status} />
                    </span>
                  </div>

                  <div style={{ padding: 18 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{p.name}</h3>
                    {p.tagline && <p className="muted text-xs mt-1 mb-3" style={{ lineHeight: 1.4 }}>{p.tagline}</p>}

                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div className="muted text-xs">Target Category:</div>
                        <div className="font-bold text-xs text-ink mt-0.5">{p.category || 'Storewide'}</div>
                      </div>
                      <div>
                        <div className="muted text-xs">Included Items:</div>
                        <div className="font-bold text-xs text-primary mt-0.5">{p.participating_items || 0} Products</div>
                      </div>
                    </div>

                    <div className="muted text-xs flex items-center gap-1.5 mt-3">
                      <Calendar size={12} color="var(--primary)" />
                      <span>{p.start_date ? `${formatDate(p.start_date)} → ${formatDate(p.end_date)}` : 'Ongoing'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1" style={{ padding: '10px 18px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => openModal(p)}
                  >
                    <Pencil size={11} /> Edit Campaign
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-xs"
                    onClick={() => setDeleteTarget(p)}
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
          icon={Megaphone}
          title="No promotions found"
          message="Create your first promotional campaign to boost marketplace visibility."
          action={
            <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>
              + Create Campaign
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? `Edit Campaign: ${editing.name}` : 'Create Marketing Campaign'}
          size="lg"
        >
          <form onSubmit={save} className="flex flex-col gap-3">
            {!editing && (
              <div className="p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span className="muted text-xs font-semibold uppercase block mb-1.5 flex items-center gap-1">
                  <Sparkles size={11} color="var(--primary)" /> Quick Fill Presets:
                </span>
                <div className="flex gap-1 wrap">
                  {CAMPAIGN_PRESETS.map((p) => (
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

            <Input
              label="Campaign Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dashain Festival Mega Sale"
            />

            <Input
              label="Marketing Tagline / Deal Description"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="e.g. Up to 30% off on all authentic handloom pashmina items"
            />

            <div className="form-row">
              <Select
                label="Promotion Deal Type"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount Discount (NPR)</option>
                <option value="free_shipping">Free Shipping on Delivery</option>
                <option value="buy_one_get_one">Buy 1 Get 1 (BOGO Offer)</option>
              </Select>

              <Input
                label={form.type === 'percentage' ? 'Max Discount (%)' : 'Discount Value'}
                type="number"
                min="0"
                disabled={form.type === 'free_shipping'}
                value={form.type === 'free_shipping' ? '0' : form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              />

              <Input
                label="Target Category Scope"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Handicrafts & Apparel"
              />
            </div>

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
              <Select
                label="Campaign Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled for Future</option>
                <option value="active">Active / Live Now</option>
                <option value="ended">Ended</option>
              </Select>
            </div>

            <Input
              label="Campaign Cover Banner URL"
              value={form.banner_image}
              onChange={(e) => setForm({ ...form, banner_image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Campaign' : 'Launch Campaign'}
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
        title="Delete promotional campaign?"
        message={`"${deleteTarget?.name}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
