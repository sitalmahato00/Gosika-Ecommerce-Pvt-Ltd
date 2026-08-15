import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Clock, Search, Download, SlidersHorizontal, DollarSign
} from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

export default function AdminWallets() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustType, setAdjustType] = useState('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [saving, setSaving] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (search) params.search = search
    return api.get('/admin/wallet/wallets', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search] })

  const openAdjust = (w) => {
    setAdjustTarget(w)
    setAdjustType('credit')
    setAdjustAmount('')
    setAdjustReason('')
    setAdjustModalOpen(true)
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    const amountVal = Number(adjustAmount)
    if (!amountVal || Number.isNaN(amountVal)) {
      toast.error('Please enter a valid amount')
      return
    }
    setSaving(true)
    try {
      const signed = adjustType === 'credit' ? Math.abs(amountVal) : -Math.abs(amountVal)
      await api.post(`/admin/wallet/vendors/${adjustTarget.vendor_id}/wallet/adjust`, {
        amount: signed,
        reason: adjustReason,
      })
      toast.success(`Wallet balance for ${adjustTarget.vendor_name} adjusted`)
      setAdjustModalOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Vendor', 'Currency', 'Available Balance (NPR)', 'Pending Balance (NPR)', 'Total Balance (NPR)'],
      ...items.map((w) => [
        w.vendor_name,
        w.currency,
        w.available_balance,
        w.pending_balance,
        w.balance,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_vendor_wallets_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Wallet ledger exported to CSV')
  }

  const totals = useMemo(() => {
    const available = items.reduce((sum, w) => sum + Number(w.available_balance || 0), 0)
    const pending = items.reduce((sum, w) => sum + Number(w.pending_balance || 0), 0)
    const balance = items.reduce((sum, w) => sum + Number(w.balance || 0), 0)
    return { available, pending, balance }
  }, [items])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return <EmptyState icon={Wallet} title="No wallets" message="No vendor wallets found." />
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Wallets & Financial Ledger</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor vendor available, pending, and total wallet balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => items[0] && openAdjust(items[0])}
          >
            <SlidersHorizontal size={14} /> Adjust Balance
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Available Payouts</span>
            <Wallet size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-success">{money(totals.available)}</div>
          <span className="muted text-xs mt-1 block">Ready for settlement release</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Pending</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-warning">{money(totals.pending)}</div>
          <span className="muted text-xs mt-1 block">Awaiting settlement</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Wallet Balance</span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-ink">{money(totals.balance)}</div>
          <span className="muted text-xs mt-1 block">Across {meta.total} wallets</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search vendor store…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted text-sm">{meta.total} vendor wallet{meta.total !== 1 ? 's' : ''}</span>
      </div>

      <div className="table-wrap mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor Store</th>
              <th>Vendor ID</th>
              <th>Available Balance</th>
              <th>Pending Balance</th>
              <th>Total Balance</th>
              <th>Currency</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id}>
                <td>
                  <div className="font-bold text-sm text-ink">{w.vendor_name}</div>
                </td>
                <td>
                  {w.vendor_id ? (
                    <Link to={`/admin/vendors/${w.vendor_id}`} className="font-mono text-xs text-primary">
                      {w.vendor_id.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="muted text-xs">—</span>
                  )}
                </td>
                <td>
                  <span className="font-bold text-success text-sm">{money(w.available_balance)}</span>
                </td>
                <td>
                  <span className="font-medium text-warning text-sm">{money(w.pending_balance)}</span>
                </td>
                <td>
                  <span className="font-bold text-ink text-sm">{money(w.balance)}</span>
                </td>
                <td className="muted text-xs">{w.currency || 'NPR'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline btn-xs" onClick={() => openAdjust(w)}>
                    <SlidersHorizontal size={12} /> Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {adjustModalOpen && adjustTarget && (
        <Modal open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title={`Manual Balance Adjustment: ${adjustTarget.vendor_name}`}>
          <form onSubmit={handleAdjust} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Select Vendor Store</label>
              <select
                className="select"
                value={adjustTarget.id}
                disabled
              >
                <option value={adjustTarget.id}>{adjustTarget.vendor_name}</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Adjustment Type</label>
                <select
                  className="select"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                >
                  <option value="credit">Credit Balance (+ Add Funds)</option>
                  <option value="debit">Debit Balance (- Deduct Funds)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Amount (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  className="input"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Reason / Justification <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={2}
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Bonus incentive for top sales, fee correction, or refund reconciliation."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdjustModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Adjusting…' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
