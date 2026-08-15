import React, { useState } from 'react'
import { Percent, Edit, Search, DollarSign, Store, Tag } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList, useApi } from '../../hooks/useApi'

export default function AdminCommissions() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [newRate, setNewRate] = useState('')
  const [saving, setSaving] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (search) params.search = search
    return api.get('/admin/commissions', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search] })

  const defaultsApi = useApi(() => api.get('/admin/commissions', { params: { page: 1, per_page: 1 } }))
  const defaults = defaultsApi.data?.meta?.defaults || {}

  const handleUpdateRate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/admin/commissions/vendors/${editTarget.id}`, { commission_rate: Number(newRate) })
      toast.success(`Commission rate for ${editTarget.company_name} updated to ${newRate}%`)
      setEditTarget(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const totalEarned = items.reduce((s, v) => s + Number(v.earned_commission || 0), 0)
  const defaultRate = Number(defaults.default_rate) || 0

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return <EmptyState icon={Percent} title="No commissions" message="No vendor commission records found." />
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Commission Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure platform commission rules and vendor overrides.
          </p>
        </div>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Search vendors…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Platform Earnings</span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{money(totalEarned)}</div>
          <span className="muted text-xs mt-1 block">From marketplace commissions</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Vendors</span>
            <Store size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{meta.total}</div>
          <span className="muted text-xs mt-1 block">Registered merchants</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Default Platform Rate</span>
            <Percent size={16} color="var(--warning)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-warning">{defaultRate}%</div>
          <span className="muted text-xs mt-1 block">Applied when no override exists</span>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 15, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={16} color="var(--primary)" /> Commission Defaults
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="card" style={{ background: 'var(--bg)', padding: 12 }}>
            <div className="muted text-xs font-semibold">Product Rate</div>
            <div className="font-extrabold text-lg mt-1 text-primary">{defaults.product_rate != null ? `${defaults.product_rate}%` : '—'}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg)', padding: 12 }}>
            <div className="muted text-xs font-semibold">Category Rate</div>
            <div className="font-extrabold text-lg mt-1 text-primary">{defaults.category_rate != null ? `${defaults.category_rate}%` : '—'}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg)', padding: 12 }}>
            <div className="muted text-xs font-semibold">Default Rate</div>
            <div className="font-extrabold text-lg mt-1 text-primary">{defaults.default_rate != null ? `${defaults.default_rate}%` : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>Vendor Commission Overrides & Performance</h3>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vendor / Store</th>
                <th>Business Email</th>
                <th>Commission Rate</th>
                <th>Orders</th>
                <th>Earned Commission</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="font-semibold text-sm text-ink">{v.company_name}</div>
                  </td>
                  <td className="muted text-sm">{v.business_email || '—'}</td>
                  <td>
                    <span className="badge badge-primary font-bold">{v.commission_rate != null ? `${v.commission_rate}%` : '—'}</span>
                  </td>
                  <td>
                    <span className="font-semibold">{v.orders_count != null ? v.orders_count : '—'}</span>
                  </td>
                  <td>
                    <span className="font-bold text-success">+{money(v.earned_commission)}</span>
                  </td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => { setEditTarget(v); setNewRate(v.commission_rate != null ? String(v.commission_rate) : '') }}
                    >
                      <Edit size={12} /> Edit Rate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {editTarget && (
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit Commission: ${editTarget.company_name}`}>
          <form onSubmit={handleUpdateRate} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Custom Commission Percentage (%) <span className="req">*</span></label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input"
                required
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
              <span className="muted text-xs mt-1 block">Current platform default is {defaultRate}%.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Commission Rate'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
