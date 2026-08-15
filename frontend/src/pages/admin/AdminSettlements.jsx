import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet, Calendar, CheckCircle2, Search,
  Download, Clock, Plus, Building2, Percent
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList, useApi } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Settlements' },
  { value: 'pending', label: 'Pending Payout' },
  { value: 'paid', label: 'Completed & Disbursed' },
]

const EMPTY_FORM = { vendor_id: '', period_start: '', period_end: '' }

export default function AdminSettlements() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState(EMPTY_FORM)
  const [generating, setGenerating] = useState(false)

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    return api.get('/admin/wallet/settlements', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search, statusFilter] })

  const vendorsApi = useApi(() => api.get('/admin/vendors', { params: { per_page: 50 } }))
  const vendors = vendorsApi.data?.data || []

  const openDetails = (s) => {
    setSelectedSettlement(s)
  }

  const doGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/admin/wallet/settlements/generate', generateForm)
      toast.success('Settlement generated')
      setGenerateOpen(false)
      setGenerateForm(EMPTY_FORM)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Settlement Number', 'Vendor', 'Period Start', 'Period End', 'Gross Sales (NPR)', 'Commission (NPR)', 'Refunds (NPR)', 'Adjustments (NPR)', 'Net Payable (NPR)', 'Status', 'Generated At'],
      ...items.map((s) => [
        s.settlement_number,
        s.vendor_name,
        s.period_start,
        s.period_end,
        s.gross_sales,
        s.commission_total,
        s.refunds_total,
        s.adjustments_total,
        s.net_payable,
        s.status,
        s.generated_at,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Settlement ledger exported to CSV')
  }

  const totals = useMemo(() => {
    const settled = items.filter((s) => s.status === 'paid').reduce((sum, s) => sum + Number(s.net_payable || 0), 0)
    const pending = items.filter((s) => s.status === 'pending').reduce((sum, s) => sum + Number(s.net_payable || 0), 0)
    const commissions = items.reduce((sum, s) => sum + Number(s.commission_total || 0), 0)
    return { settled, pending, commissions }
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
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No settlement records"
        message="Settlements generated at the close of every billing period will appear here."
        action={
          <button type="button" className="btn btn-primary" onClick={() => setGenerateOpen(true)}>
            Generate Settlement
          </button>
        }
      />
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Settlements & Payout Disbursement</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Process vendor net earnings and platform commission deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setGenerateOpen(true)}>
            <Plus size={14} /> Generate Settlement
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Settled Payouts</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(totals.settled)}</div>
          <div className="muted text-xs mt-1">Disbursed to merchant accounts</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Approval</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(totals.pending)}</div>
          <div className="muted text-xs mt-1">Awaiting release</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Retained Commission</span>
            <Percent size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(totals.commissions)}</div>
          <div className="muted text-xs mt-1">Platform revenue</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Settlements</span>
            <Calendar size={16} color="var(--info)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total}</div>
          <div className="muted text-xs mt-1">Across all billing cycles</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: '0 0 16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search settlement number or vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger font-bold"
            onClick={() => setSearch('')}
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Settlement Ref</th>
                <th>Vendor</th>
                <th>Billing Cycle</th>
                <th>Gross Sales</th>
                <th>Commission</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Generated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span
                      className="font-mono font-bold text-primary text-xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => openDetails(s)}
                    >
                      {s.settlement_number}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-ink">{s.vendor_name || '—'}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-ink">{s.period_start || '—'}</div>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{s.period_end ? `to ${s.period_end}` : ''}</div>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-ink">{money(s.gross_sales)}</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold" style={{ color: '#166534' }}>
                      -{money(s.commission_total)}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-base text-success">{money(s.net_payable)}</span>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="muted text-xs">{formatDateTime(s.generated_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-outline btn-xs" onClick={() => openDetails(s)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {selectedSettlement && (
        <Modal
          open={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          title={`Settlement Dossier: ${selectedSettlement.settlement_number}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="muted text-xs uppercase font-bold">Net Merchant Payout</span>
                <StatusBadge status={selectedSettlement.status} />
              </div>
              <div className="font-black text-3xl text-success">{money(selectedSettlement.net_payable)}</div>
              <div className="muted text-xs mt-1">
                {selectedSettlement.vendor_name || 'Vendor'} · {selectedSettlement.period_start || '—'} → {selectedSettlement.period_end || '—'}
              </div>
            </div>

            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                <Building2 size={14} color="var(--primary)" /> Billing & Commission Breakdown
              </h4>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Gross Sales:</span>
                <span className="font-bold text-ink">{money(selectedSettlement.gross_sales)}</span>
              </div>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Commission Total:</span>
                <span style={{ color: '#166534', fontWeight: 700 }}>- {money(selectedSettlement.commission_total)}</span>
              </div>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Refunds Total:</span>
                <span style={{ color: '#b91c1c', fontWeight: 700 }}>- {money(selectedSettlement.refunds_total)}</span>
              </div>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Adjustments Total:</span>
                <span className="font-bold text-ink">{money(selectedSettlement.adjustments_total)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink)' }}>
                <span>Net Payable:</span>
                <span className="text-success">{money(selectedSettlement.net_payable)}</span>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span className="muted text-xs block">Generated At</span>
                <span className="font-semibold text-xs">{formatDateTime(selectedSettlement.generated_at)}</span>
              </div>
              <div>
                <span className="muted text-xs block">Paid At</span>
                <span className="font-semibold text-xs">{formatDateTime(selectedSettlement.paid_at)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedSettlement(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {generateOpen && (
        <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Settlement">
          <form onSubmit={doGenerate} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Vendor <span className="req">*</span></label>
              <select
                className="select"
                required
                value={generateForm.vendor_id}
                onChange={(e) => setGenerateForm({ ...generateForm, vendor_id: e.target.value })}
              >
                <option value="">{vendorsApi.loading ? 'Loading vendors…' : 'Select vendor…'}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.company_name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Period Start <span className="req">*</span></label>
                <input
                  type="date"
                  className="input"
                  required
                  value={generateForm.period_start}
                  onChange={(e) => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Period End <span className="req">*</span></label>
                <input
                  type="date"
                  className="input"
                  required
                  value={generateForm.period_end}
                  onChange={(e) => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setGenerateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={generating}>
                {generating ? 'Generating…' : 'Generate Settlement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
