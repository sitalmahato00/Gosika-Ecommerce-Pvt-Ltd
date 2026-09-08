import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Percent, Edit, Search, DollarSign, Store, Tag,
  RefreshCw, CheckCircle2, Building2
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminCommissions() {
  const toast = useToast()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [newRate, setNewRate] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCommissions = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/commissions', { params })
      const data = api.unwrapList(res.data)
      setVendors(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load commission configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommissions()
  }, [page])

  const handleUpdateRate = async (e) => {
    e.preventDefault()
    if (!editTarget || newRate === '') return

    setSaving(true)
    try {
      const targetId = editTarget.uuid || editTarget.id
      await api.put(`/admin/commissions/vendors/${targetId}`, {
        commission_rate: Number(newRate)
      })
      toast.success(`Commission rate for "${editTarget.company_name}" updated to ${newRate}%`)
      setEditTarget(null)
      setNewRate('')
      loadCommissions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission rate.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      header: 'Vendor / Entity',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Store size={18} />
          </div>
          <div>
            <Link
              to={`/admin/marketplace/vendors/${item.uuid || item.id}`}
              style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              className="hover:text-primary"
            >
              {item.company_name}
            </Link>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              PAN: {item.pan_vat || '—'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Commission Agreement',
      render: item => {
        const hasOverride = item.commission_rate !== null && item.commission_rate !== undefined
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
              {hasOverride ? `${item.commission_rate}%` : '10.0% (Default)'}
            </span>
            {hasOverride && (
              <span className="chip chip-sm" style={{ background: '#fef3c7', color: '#d97706', fontSize: 10.5, fontWeight: 700 }}>
                Custom Override
              </span>
            )}
          </div>
        )
      }
    },
    {
      header: 'Gross Volume Generated',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          {money(item.total_sales || item.gross_sales || 0)}
        </span>
      )
    },
    {
      header: 'Net Commission Earned',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, fontSize: 13.5, color: '#16a34a' }}>
          {money(item.earned_commission || item.total_commission || 0)}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={() => {
            setEditTarget(item)
            setNewRate(item.commission_rate !== null && item.commission_rate !== undefined ? String(item.commission_rate) : '10')
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Edit size={12} /> Edit Rate
        </button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Commission Governance & Rules"
        description="Regulate marketplace take-rate agreements, customized seller contracts, and fee schedules."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Commissions' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadCommissions}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vendor name, PAN..."
        onReset={() => { setSearch(''); loadCommissions() }}
      />

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No commission records"
        emptyDescription="No vendor commission records found."
      />

      {/* Edit Rate Modal */}
      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setEditTarget(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Edit Commission Rate
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateRate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Adjust platform commission percentage for <strong>{editTarget.company_name}</strong>.
              </p>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Commission Rate (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 14, fontWeight: 700 }}
                  value={newRate}
                  onChange={e => setNewRate(e.target.value)}
                  placeholder="e.g. 8.5"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Commission Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
