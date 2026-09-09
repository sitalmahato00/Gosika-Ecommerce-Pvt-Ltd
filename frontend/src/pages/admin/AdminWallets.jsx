import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Clock, Search, Download, SlidersHorizontal,
  DollarSign, RefreshCw, Plus, Minus, Store
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import KpiCard from '../../components/admin/KpiCard'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

export default function AdminWallets() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustType, setAdjustType] = useState('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [saving, setSaving] = useState(false)

  const loadWallets = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/wallet/wallets', { params })
      const data = api.unwrapList(res.data)
      setWallets(data)
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
      toast.error('Failed to load vendor wallets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallets()
  }, [page])

  const handleAdjust = async (e) => {
    e.preventDefault()
    const amountVal = Number(adjustAmount)
    if (!amountVal || Number.isNaN(amountVal)) {
      toast.error('Please enter a valid amount.')
      return
    }

    setSaving(true)
    try {
      const signed = adjustType === 'credit' ? Math.abs(amountVal) : -Math.abs(amountVal)
      await api.post(`/admin/wallet/vendors/${adjustTarget.vendor_id || adjustTarget.id}/wallet/adjust`, {
        amount: signed,
        reason: adjustReason || 'Administrative ledger adjustment'
      })
      toast.success(`Wallet balance for ${adjustTarget.vendor_name || 'vendor'} adjusted.`)
      setAdjustModalOpen(false)
      setAdjustAmount('')
      setAdjustReason('')
      loadWallets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed.')
    } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Vendor' },
        { label: 'Total Balance (NPR)', align: 'right' },
        { label: 'Available Balance', align: 'right' },
        { label: 'Pending Balance', align: 'right' },
        { label: 'Currency' },
      ],
      rows: wallets.map(w => [
        w.vendor_name || '',
        w.balance || 0,
        w.available_balance || 0,
        w.pending_balance || 0,
        w.currency || 'NPR'
      ]),
      title: 'Vendor Wallet Balances Report',
      subtitle: 'Vendor wallet account balances across total, available and pending funds.',
      sectionLabel: 'Vendor Wallets',
      fileName: `gosika_vendor_wallets_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Wallets exported as branded report.')
  }

  const columns = [
    {
      header: 'Vendor Entity',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Store size={18} />
          </div>
          <div>
            <Link
              to={`/admin/marketplace/vendors/${item.vendor_id || item.id}`}
              style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              className="hover:text-primary"
            >
              {item.vendor_name || 'Vendor'}
            </Link>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Wallet ID: #{item.id}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Total Balance',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: 'var(--ink)', fontSize: 13.5 }}>
          {money(item.balance || 0)}
        </span>
      )
    },
    {
      header: 'Available for Payout',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 13.5 }}>
          {money(item.available_balance || 0)}
        </span>
      )
    },
    {
      header: 'Pending Settlement',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 800, color: '#d97706', fontSize: 13 }}>
          {money(item.pending_balance || 0)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={() => {
            setAdjustTarget(item)
            setAdjustType('credit')
            setAdjustAmount('')
            setAdjustReason('')
            setAdjustModalOpen(true)
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <SlidersHorizontal size={12} /> Adjust Balance
        </button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Vendor Wallets & Balances"
        description="Monitor multi-vendor wallet accounts, escrowed payouts, settlement hold balances, and ledger adjustments."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Vendor Wallets' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadWallets}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vendor by name..."
        onReset={() => { setSearch(''); loadWallets() }}
      />

      <DataTable
        columns={columns}
        data={wallets}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No vendor wallets found"
        emptyDescription="No vendor wallet ledger accounts match your search."
      />

      {/* Adjust Modal */}
      {adjustModalOpen && adjustTarget && (
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
          onClick={e => { if (e.target === e.currentTarget) setAdjustModalOpen(false) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
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
                Adjust Wallet Ledger
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setAdjustModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Manually credit or debit the wallet of <strong>{adjustTarget.vendor_name}</strong>.
              </p>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Adjustment Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${adjustType === 'credit' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setAdjustType('credit')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Plus size={14} style={{ marginRight: 4 }} /> Credit (Add Funds)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${adjustType === 'debit' ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setAdjustType('debit')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Minus size={14} style={{ marginRight: 4 }} /> Debit (Deduct Funds)
                  </button>
                </div>
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Amount (NPR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 14, fontWeight: 700 }}
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Audit Reason *</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual correction for return dispute resolution."
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Processing...' : 'Apply Ledger Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
