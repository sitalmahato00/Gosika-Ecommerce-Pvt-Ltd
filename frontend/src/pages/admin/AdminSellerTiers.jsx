import React, { useCallback, useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Medal, Award, Crown, Star, Zap, Target,
  Store as StoreIcon, RefreshCw, TrendingUp, Layers
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DetailTabs from '../../components/admin/DetailTabs'
import DataTable from '../../components/admin/DataTable'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const BADGE_ICONS = { Seed: 'Seed', Star: 'Star', Award: 'Award', Medal: 'Medal', Crown: 'Crown', Zap: 'Zap', Target: 'Target' }

const ICON_COMPONENTS = { Seed: Star, Star, Award, Medal, Crown, Zap, Target }

const defaultForm = {
  name: '',
  badge_level: 0,
  min_orders: 0,
  min_gmv: '',
  commission_percent: '',
  badge_color: '#94a3b8',
  badge_icon: 'Award',
  description: '',
  benefits: '',
  sort_order: 1,
  is_active: true,
}

export default function AdminSellerTiers() {
  const toast = useToast()

  const [tab, setTab] = useState('tiers')
  const [tiers, setTiers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignLoading, setAssignLoading] = useState(true)
  const [error, setError] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadTiers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/marketplace/tiers', { params: { per_page: 50 } })
      setTiers(api.unwrapList(res.data))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAssignments = useCallback(async () => {
    setAssignLoading(true)
    try {
      const res = await api.get('/admin/marketplace/tiers/assignments', { params: { per_page: 50 } })
      setAssignments(api.unwrapList(res.data))
    } catch (err) {
      toast.error('Failed to load tier assignments.')
    } finally {
      setAssignLoading(false)
    }
  }, [])

  useEffect(() => { loadTiers() }, [loadTiers])
  useEffect(() => { if (tab === 'assignments') loadAssignments() }, [tab, loadAssignments])

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setFormOpen(true)
  }

  const openEdit = (tier) => {
    setEditing(tier)
    setForm({
      name: tier.name || '',
      badge_level: tier.badge_level || 0,
      min_orders: tier.min_orders || 0,
      min_gmv: tier.min_gmv ?? '',
      commission_percent: tier.commission_percent ?? '',
      badge_color: tier.badge_color || '#94a3b8',
      badge_icon: tier.badge_icon || 'Award',
      description: tier.description || '',
      benefits: Array.isArray(tier.benefits) ? tier.benefits.join('\n') : '',
      sort_order: tier.sort_order ?? 1,
      is_active: tier.is_active !== false,
    })
    setFormOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        badge_level: Number(form.badge_level) || 0,
        min_orders: Number(form.min_orders) || 0,
        min_gmv: Number(form.min_gmv) || 0,
        commission_percent: form.commission_percent === '' ? null : Number(form.commission_percent),
        sort_order: Number(form.sort_order) || 0,
        benefits: form.benefits.split('\n').map((b) => b.trim()).filter(Boolean),
        is_active: !!form.is_active,
      }

      if (editing) {
        await api.put(`/admin/marketplace/tiers/${editing.id}`, payload)
        toast.success('Seller tier updated.')
      } else {
        await api.post('/admin/marketplace/tiers', payload)
        toast.success('Seller tier created.')
      }
      setFormOpen(false)
      loadTiers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save tier.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/marketplace/tiers/${deleteTarget.id}`)
      toast.success('Seller tier deleted.')
      setDeleteTarget(null)
      loadTiers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete tier.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAssign = async (vendor, tierId) => {
    try {
      await api.post(`/admin/marketplace/tiers/vendors/${vendor.id}/assign`, { tier_id: tierId || null })
      toast.success(`Tier updated for ${vendor.company_name}.`)
      loadAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not assign tier.')
    }
  }

  const tierColumns = [
    {
      header: 'Tier & Badge',
      render: (item) => {
        const IconComp = ICON_COMPONENTS[item.badge_icon] || Award
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: item.badge_color || '#94a3b8', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconComp size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>/{item.slug} · Level {item.badge_level}</div>
            </div>
          </div>
        )
      }
    },
    {
      header: 'Requirement',
      render: (item) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.min_orders} orders</div>
          <div style={{ color: 'var(--muted)' }}>≥ {money(item.min_gmv)} GMV</div>
        </div>
      )
    },
    {
      header: 'Commission',
      render: (item) => (
        <span style={{ fontWeight: 800, fontSize: 13 }}>
          {item.commission_percent !== null && item.commission_percent !== undefined ? `${item.commission_percent}%` : 'Platform'}
        </span>
      )
    },
    {
      header: 'Perks',
      render: (item) => (
        <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 220 }}>
          {Array.isArray(item.benefits) && item.benefits.length > 0 ? item.benefits.slice(0, 2).join(' · ') : '—'}
        </div>
      )
    },
    {
      header: 'Vendors',
      accessor: 'vendor_count',
      render: (item) => <span style={{ fontWeight: 700 }}>{item.vendor_count}</span>
    },
    {
      header: 'Status',
      render: (item) => (
        <span className={`chip ${item.is_active ? '' : 'chip-neutral'}`} style={{ fontWeight: 700, fontSize: 11 }}>
          {item.is_active ? 'Active' : 'Disabled'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline btn-xs" onClick={() => openEdit(item)}>
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => setDeleteTarget(item)}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )
    }
  ]

  const tabs = [
    { id: 'tiers', label: 'Tier Catalog', icon: <Layers size={15} />, badge: tiers.length },
    { id: 'assignments', label: 'Seller Assignments', icon: <StoreIcon size={15} /> },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Seller Tiers & Badges"
        description="Configure seller tier programs, progression rules, badge perks, and manage which tier each merchant sits in."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Seller Tiers & Badges' }
        ]}
        actions={
          tab === 'tiers' ? (
            <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={openCreate}>
              <Plus size={14} /> Add Tier
            </button>
          ) : (
            <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={loadAssignments}>
              <RefreshCw size={14} className={assignLoading ? 'spin' : ''} /> Refresh
            </button>
          )
        }
      />

      <DetailTabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === 'tiers' && (
        <>
          {error ? (
            <ErrorState
              title="Could Not Load Tiers"
              message="The seller tier definitions could not be loaded from the server."
              onRetry={loadTiers}
            />
          ) : (
            <DataTable
              columns={tierColumns}
              data={tiers}
              loading={loading}
              emptyTitle="No seller tiers"
              emptyDescription="Create your first tier to start organizing merchants into a progression program."
            />
          )}

          <div className="card" style={{ padding: 18, borderRadius: 12, background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={18} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>How progression works</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  A merchant's tier is re-evaluated from fulfilled order count and GMV. Assigned ties take precedence for display, while an admin can override any seller manually from the “Seller Assignments” tab.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'assignments' && (
        <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Seller Tier Assignments</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {assignments.length} approved merchants · select a tier to override the computed badge
            </div>
          </div>

          {assignLoading ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState title="No approved merchants" description="Approved merchant storefronts will appear here so you can manage their seller tiers." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th style={{ textAlign: 'right' }}>Fulfilled Orders</th>
                    <th style={{ textAlign: 'right' }}>GMV</th>
                    <th>Computed Tier</th>
                    <th>Managed Tier</th>
                    <th style={{ textAlign: 'right' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{v.company_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{v.business_email}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{v.order_count || 0}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(v.gmv || 0)}</td>
                      <td>
                        {v.computed_tier ? (
                          <span className="chip chip-neutral" style={{ fontWeight: 700, fontSize: 11 }}>
                            {v.computed_tier.name}
                          </span>
                        ) : (
                          <span className="chip chip-neutral" style={{ fontSize: 11 }}>Not qualified</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="select select-sm"
                          style={{ width: 'auto', maxWidth: 180 }}
                          defaultValue={v.seller_tier?.id || ''}
                          onChange={(e) => handleAssign(v, e.target.value)}
                        >
                          <option value="">— No tier —</option>
                          {tiers.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
                        {v.created_at ? formatDate(v.created_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tier form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Tier: ${editing.name}` : 'Add Seller Tier'}
        size="lg"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Tier Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Gold Seller"
              />
            </div>
            <div>
              <label className="label">Badge Icon</label>
              <select
                className="select"
                value={form.badge_icon}
                onChange={(e) => setForm({ ...form, badge_icon: e.target.value })}
              >
                {Object.entries(BADGE_ICONS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label className="label">Level</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.badge_level}
                onChange={(e) => setForm({ ...form, badge_level: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Min Orders</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.min_orders}
                onChange={(e) => setForm({ ...form, min_orders: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Min GMV (NPR)</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.min_gmv}
                onChange={(e) => setForm({ ...form, min_gmv: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Commission %</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={form.commission_percent}
                onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                placeholder="Platform"
              />
            </div>
          </div>

          <div>
            <label className="label">Badge Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={form.badge_color}
                onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                style={{ width: 44, height: 34, borderRadius: 8, padding: 2, cursor: 'pointer' }}
              />
              <code style={{ fontSize: 12 }}>{form.badge_color}</code>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short summary shown to merchants"
            />
          </div>

          <div>
            <label className="label">Benefits (one per line)</label>
            <textarea
              className="input"
              rows={3}
              value={form.benefits}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              placeholder={'Reduced commission (8%)\nStorefront spotlight rotation\nPriority vendor support'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="tier-active"
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <label htmlFor="tier-active" className="muted" style={{ fontSize: 13 }}>Tier is active and visible to merchants</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Tier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete Tier "${deleteTarget?.name}"?`}
        message="This will permanently remove the tier definition. Tiers assigned to vendors cannot be deleted until those merchants are reassigned."
        variant="danger"
        confirmText="Delete Tier"
      />
    </div>
  )
}