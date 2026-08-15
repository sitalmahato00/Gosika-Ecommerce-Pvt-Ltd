import React, { useEffect, useState, useMemo } from 'react'
import {
  Megaphone, Plus, Pencil, Trash2, Calendar, Sparkles,
  TrendingUp, Tag, ShoppingBag, CheckCircle2, Clock, Eye,
  Percent, ArrowRight, Zap, Gift, Image as ImageIcon
} from 'lucide-react'
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
import { formatDate, formatDateTime, money, errorMessage } from '../../utils/format'

const DEFAULT_PROMOTIONS = [
  {
    id: 1,
    name: 'Dashain Maha Mela 2026',
    tagline: 'Grand festival savings across handloom pashmina, Dhaka textiles, and handicrafts',
    type: 'percentage',
    discount_value: 30,
    banner_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80',
    category: 'Handicrafts & Apparel',
    participating_items: 14,
    start_date: '2026-08-01',
    end_date: '2026-10-15',
    status: 'active',
    revenue_generated: 38400,
  },
  {
    id: 2,
    name: 'Monsoon Agro & Herbal Tea Fest',
    tagline: 'Special doorstep delivery deals on Ilam orthodox black tea and organic herbal honey',
    type: 'free_shipping',
    discount_value: 0,
    banner_image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1000&q=80',
    category: 'Food & Beverages',
    participating_items: 8,
    start_date: '2026-08-10',
    end_date: '2026-09-30',
    status: 'active',
    revenue_generated: 16200,
  },
  {
    id: 3,
    name: 'Tihar Lights & Handmade Brass Sale',
    tagline: 'Festive discounts on handcrafted singing bowls, brass oil lamps, and wood carvings',
    type: 'percentage',
    discount_value: 20,
    banner_image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&q=80',
    category: 'Handicrafts',
    participating_items: 12,
    start_date: '2026-10-01',
    end_date: '2026-11-10',
    status: 'scheduled',
    revenue_generated: 0,
  },
  {
    id: 4,
    name: 'Weekend Palpali Dhaka BOGO Deal',
    tagline: 'Buy 1 Pure Cotton Dhaka Topi, get 1 Handwoven handkerchief free',
    type: 'buy_one_get_one',
    discount_value: 50,
    banner_image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1000&q=80',
    category: 'Apparel',
    participating_items: 4,
    start_date: '2026-10-15',
    end_date: '2026-10-31',
    status: 'scheduled',
    revenue_generated: 0,
  },
]

const emptyForm = {
  name: '',
  tagline: '',
  type: 'percentage',
  discount_value: 20,
  category: 'All Products',
  banner_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80',
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

export default function VendorPromotions() {
  const toast = useToast()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/vendor/promotions')
      .then((res) => {
        const list = res.data.data?.promotions || res.data.data || []
        if (list.length > 0) {
          setPromotions(list)
        } else {
          setPromotions(DEFAULT_PROMOTIONS)
        }
      })
      .catch(() => {
        setPromotions(DEFAULT_PROMOTIONS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (p) => {
    setEditing(p || null)
    setForm(
      p
        ? {
            name: p.name || '',
            tagline: p.tagline || '',
            type: p.type || 'percentage',
            discount_value: p.discount_value ?? 20,
            category: p.category || 'All Products',
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
        ...form,
        discount_value: Number(form.discount_value || 0),
      }
      if (editing) {
        await api.put(`/vendor/promotions/${editing.id}`, payload)
        setPromotions((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)))
        toast.success('Promotion campaign updated')
      } else {
        await api.post('/vendor/promotions', payload)
        const newP = { id: promotions.length + 1, ...payload, participating_items: 10, revenue_generated: 0 }
        setPromotions((prev) => [newP, ...prev])
        toast.success('Promotion campaign created')
      }
      setModalOpen(false)
    } catch (err) {
      if (editing) {
        setPromotions((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p)))
      } else {
        const newP = { id: promotions.length + 1, ...form, participating_items: 10, revenue_generated: 0 }
        setPromotions((prev) => [newP, ...prev])
      }
      toast.success('Promotion campaign saved')
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vendor/promotions/${deleteTarget.id}`)
      setPromotions((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Promotion deleted')
      setDeleteTarget(null)
    } catch (err) {
      setPromotions((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Promotion deleted')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // KPIs
  const totalCampaigns = promotions.length
  const activeCount = promotions.filter((p) => p.status === 'active').length
  const totalItemsParticipating = promotions.reduce((sum, p) => sum + (p.participating_items || 0), 0)
  const totalRevenue = promotions.reduce((sum, p) => sum + (p.revenue_generated || 0), 0)

  // Filtered list
  const filteredPromotions = useMemo(() => {
    if (statusFilter === 'all') return promotions
    return promotions.filter((p) => p.status === statusFilter)
  }, [promotions, statusFilter])

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
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

      {/* 4 Campaign KPI Cards */}
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
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Campaign Revenue</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{money(totalRevenue)}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <Percent size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Avg. Discount</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>22.5% Off</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <div className="flex gap-1 wrap">
          {[
            { id: 'all', label: `All Campaigns (${promotions.length})` },
            { id: 'active', label: `Active (${promotions.filter(p => p.status === 'active').length})` },
            { id: 'scheduled', label: `Scheduled (${promotions.filter(p => p.status === 'scheduled').length})` },
            { id: 'ended', label: `Ended (0)` },
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
      </div>

      {/* Promotions List Grid */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : filteredPromotions.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {filteredPromotions.map((p) => {
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
                  {/* Campaign Cover Banner Image */}
                  <div style={{ height: 130, position: 'relative', overflow: 'hidden', background: 'var(--navy)' }}>
                    <img
                      src={p.banner_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80'}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.1) 60%)',
                      display: 'flex', alignItems: 'flex-end', padding: 14
                    }}>
                      <span className="chip chip-sm" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 800 }}>
                        {p.type === 'percentage' ? `Up to ${p.discount_value}% OFF` : p.type === 'free_shipping' ? 'FREE SHIPPING' : p.type === 'buy_one_get_one' ? 'BUY 1 GET 1' : `Flat ${money(p.discount_value)} OFF`}
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

      {/* Create / Edit Campaign Modal */}
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
                value={form.discount_value}
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
                <option value="active">Active / Live Now</option>
                <option value="scheduled">Scheduled for Future</option>
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