import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Download, RefreshCw, Building2
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const STATUS_ORDER = {
  processing: 0,
  hold: 1,
  eligible: 2,
  paid: 3,
}

const toInputDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AdminSettlements() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cycleValues, setCycleValues] = useState({})
  const [cycleSaving, setCycleSaving] = useState({})

  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState({ vendor_id: '', period_start: '', period_end: '' })
  const [generating, setGenerating] = useState(false)
  const [vendors, setVendors] = useState([])

  useEffect(() => {
    api.get('/admin/vendors', { params: { per_page: 100 } })
      .then(res => setVendors(api.unwrapList(res.data)))
      .catch(() => {})
  }, [])

  const loadSummary = async () => {
    setLoading(true)
    try {
      const params = { group_by_vendor: 1 }
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/admin/wallet/settlements', { params })
      const items = api.unwrapList(res.data).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))
      setSummary(items)
      setCycleValues(Object.fromEntries(items.map(it => [it.vendor_id, it.settlement_cycle_days ?? 14])))
    } catch (err) {
      toast.error('Failed to load settlement summaries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [search])

  const saveCycle = async (vendorId) => {
    const raw = cycleValues[vendorId]
    const days = Number(raw)
    if (!raw || !Number.isInteger(days) || days < 1 || days > 120) {
      toast.error('Settlement cycle must be a whole number between 1 and 120 days.')
      loadSummary()
      return
    }
    setCycleSaving(prev => ({ ...prev, [vendorId]: true }))
    try {
      await api.put(`/admin/wallet/vendors/${vendorId}/settlement-cycle`, { settlement_cycle_days: days })
      toast.success('Settlement cycle updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settlement cycle.')
    } finally {
      setCycleSaving(prev => ({ ...prev, [vendorId]: false }))
      loadSummary()
    }
  }

  const selectVendorForGenerate = (vendorId) => {
    const found = summary.find(x => x.vendor_id === vendorId)
    const days = found?.settlement_cycle_days ?? cycleValues[vendorId] ?? 14
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    setGenerateForm({
      vendor_id: vendorId,
      period_start: toInputDate(start),
      period_end: toInputDate(end),
    })
  }

  const handleGenerateSubmit = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/admin/wallet/settlements/generate', generateForm)
      toast.success('New settlement period batch generated successfully!')
      setGenerateOpen(false)
      setGenerateForm({ vendor_id: '', period_start: '', period_end: '' })
      loadSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate settlement statement.')
    } finally {
      setGenerating(false)
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Store / Vendor' },
        { label: 'Statement Period Start' },
        { label: 'Statement Period End' },
        { label: 'Gross Sales', align: 'right' },
        { label: 'Platform Commission', align: 'right' },
        { label: 'Net Payable', align: 'right' },
        { label: 'Status' },
      ],
      rows: summary.map(s => [
        s.vendor_name || '',
        s.period_start || '',
        s.period_end || '',
        s.gross_sales || 0,
        s.commission_total || 0,
        s.net_payable || 0,
        s.status || '',
      ]),
      title: 'Vendor Settlement Summaries',
      subtitle: 'Aggregated settlement balances per store with gross sales, platform commission and net payables.',
      sectionLabel: 'Settlement Ledger',
      fileName: `gosika_settlements_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Settlements exported as branded report.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Settlements & Vendor Wallets"
        description="One row per store showing gross sales, platform commission and net payable still open — track settlement cycles, and hold or release settlements from this page. Payouts are requested by the vendor and approved here."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Settlements' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setGenerateOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Plus size={14} /> Generate Batch
            </button>

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
              onClick={loadSummary}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          className="input"
          style={{ maxWidth: 360, height: 36, fontSize: 13 }}
          placeholder="Search by store / vendor name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          {summary.length} store{summary.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Store / Vendor
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Statement Period
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Gross Sales
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Platform Commission
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Net Payable (Left)
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  Cycle (Days)
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading settlement summaries...</td></tr>
                ))
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                    No settlement summaries found.
                  </td>
                </tr>
              ) : summary.map(s => (
                <tr
                  key={s.vendor_id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: s.status === 'processing' ? '#fffbeb' : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
                          {s.vendor_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {s.settlements_count} settlement period(s)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {formatDate(s.period_start)} → {formatDate(s.period_end)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                    {money(s.gross_sales || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
                    - {money(s.commission_total || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: '#16a34a', fontSize: 14 }}>
                    {money(s.net_payable || 0)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={s.status} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className="input"
                      value={cycleValues[s.vendor_id] ?? s.settlement_cycle_days ?? ''}
                      onChange={e => setCycleValues(prev => ({ ...prev, [s.vendor_id]: e.target.value }))}
                      onBlur={() => saveCycle(s.vendor_id)}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                      disabled={cycleSaving[s.vendor_id]}
                      title="Settlement cycle length in days (saved on blur or Enter)"
                      style={{ width: 70, height: 30, fontSize: 12, fontWeight: 700, textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {s.open_count > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                          {s.open_count} open
                        </span>
                      )}
                      <Link
                        to={`/admin/finance/settlements/vendors/${s.vendor_id}`}
                        className="btn btn-outline btn-xs"
                        style={{ textDecoration: 'none' }}
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Batch Modal */}
      {generateOpen && (
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
          onClick={e => { if (e.target === e.currentTarget) setGenerateOpen(false) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
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
                Generate Periodic Settlement Batch
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setGenerateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Select Vendor *</label>
                <select
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600 }}
                  value={generateForm.vendor_id}
                  onChange={e => selectVendorForGenerate(e.target.value)}
                  required
                >
                  <option value="">Choose a merchant...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name} (PAN: {v.pan_vat || '—'})</option>
                  ))}
                </select>
                {generateForm.vendor_id && (
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
                    Period auto-filled from the configured settlement cycle of{' '}
                    <strong>{cycleValues[generateForm.vendor_id] ?? 14} days</strong> — adjust the dates above if needed.
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Period Start *</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={generateForm.period_start}
                    onChange={e => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Period End *</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={generateForm.period_end}
                    onChange={e => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGenerateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={generating}>
                  {generating ? 'Calculating...' : 'Generate Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}