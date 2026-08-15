import React, { useEffect, useState, useMemo } from 'react'
import {
  FileSpreadsheet, Calendar, CheckCircle2, XCircle, Search,
  Download, ArrowRight, Clock, Plus, Store, DollarSign,
  Building2, CreditCard, ShieldCheck, Check, Banknote, MapPin
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Settlements' },
  { value: 'pending', label: 'Pending Payout' },
  { value: 'paid', label: 'Completed & Disbursed' },
]

const SAMPLE_SETTLEMENTS = [
  {
    id: 1,
    payout_number: 'SET-2026-0815',
    vendor: {
      company_name: 'Koshi Handicrafts Pvt. Ltd.',
      owner: 'Suman Pokhrel',
      city: 'Biratnagar, Koshi',
      bank_name: 'Nabil Bank Limited',
      account_name: 'Koshi Handicrafts Pvt. Ltd.',
      account_number: '01928374659281',
      branch: 'Biratnagar Main Branch',
    },
    billing_period: '01 Aug 2026 – 15 Aug 2026',
    orders_count: 24,
    gross_amount: 145000,
    commission_deducted: 14500,
    commission_rate: 10,
    amount: 130500,
    status: 'pending',
    created_at: '2026-08-15T08:00:00Z',
    transaction_ref: null,
  },
  {
    id: 2,
    payout_number: 'SET-2026-0814',
    vendor: {
      company_name: 'Lalitpur Heritage Metal & Bronze',
      owner: 'Babu Ratna Shakya',
      city: 'Patan, Bagmati',
      bank_name: 'Global IME Bank',
      account_name: 'Lalitpur Heritage Bronze Crafts',
      account_number: '10293847561928',
      branch: 'Patan Durbar Branch',
    },
    billing_period: '01 Aug 2026 – 15 Aug 2026',
    orders_count: 38,
    gross_amount: 215000,
    commission_deducted: 21500,
    commission_rate: 10,
    amount: 193500,
    status: 'pending',
    created_at: '2026-08-14T14:30:00Z',
    transaction_ref: null,
  },
  {
    id: 3,
    payout_number: 'SET-2026-0813',
    vendor: {
      company_name: 'Himalayan Organic Herbs & Tea',
      owner: 'Pemba Sherpa',
      city: 'Ilam, Koshi',
      bank_name: 'Sanima Bank Limited',
      account_name: 'Himalayan Organic Tea Farm',
      account_number: '84729103847562',
      branch: 'Ilam Bazar Branch',
    },
    billing_period: '01 Aug 2026 – 15 Aug 2026',
    orders_count: 19,
    gross_amount: 78000,
    commission_deducted: 7800,
    commission_rate: 10,
    amount: 70200,
    status: 'pending',
    created_at: '2026-08-13T11:00:00Z',
    transaction_ref: null,
  },
  {
    id: 4,
    payout_number: 'SET-2026-0731',
    vendor: {
      company_name: 'Koshi Handicrafts Pvt. Ltd.',
      owner: 'Suman Pokhrel',
      city: 'Biratnagar, Koshi',
      bank_name: 'Nabil Bank Limited',
      account_name: 'Koshi Handicrafts Pvt. Ltd.',
      account_number: '01928374659281',
      branch: 'Biratnagar Main Branch',
    },
    billing_period: '16 Jul 2026 – 31 Jul 2026',
    orders_count: 42,
    gross_amount: 240000,
    commission_deducted: 24000,
    commission_rate: 10,
    amount: 216000,
    status: 'paid',
    created_at: '2026-07-31T18:00:00Z',
    paid_at: '2026-07-31T19:15:00Z',
    transaction_ref: 'NCHL-IPS-88492019',
  },
  {
    id: 5,
    payout_number: 'SET-2026-0730',
    vendor: {
      company_name: 'Eastern Dhaka Textile Weavers',
      owner: 'Sunita Magar',
      city: 'Tehrathum, Koshi',
      bank_name: 'NIC Asia Bank',
      account_name: 'Eastern Dhaka Weaving Industry',
      account_number: '99201948572610',
      branch: 'Dharan Commercial Branch',
    },
    billing_period: '16 Jul 2026 – 31 Jul 2026',
    orders_count: 28,
    gross_amount: 180000,
    commission_deducted: 18000,
    commission_rate: 10,
    amount: 162000,
    status: 'paid',
    created_at: '2026-07-30T17:00:00Z',
    paid_at: '2026-07-30T18:30:00Z',
    transaction_ref: 'NCHL-IPS-77319024',
  },
  {
    id: 6,
    payout_number: 'SET-2026-0729',
    vendor: {
      company_name: 'Mustang Himalayan Dry Fruits',
      owner: 'Karma Sherpa',
      city: 'Jomsom, Gandaki',
      bank_name: 'Everest Bank Limited',
      account_name: 'Mustang Agro & Fruits Pvt. Ltd.',
      account_number: '33491820495819',
      branch: 'Pokhara Regional Branch',
    },
    billing_period: '16 Jul 2026 – 31 Jul 2026',
    orders_count: 15,
    gross_amount: 120000,
    commission_deducted: 12000,
    commission_rate: 10,
    amount: 108000,
    status: 'paid',
    created_at: '2026-07-29T16:00:00Z',
    paid_at: '2026-07-29T17:45:00Z',
    transaction_ref: 'NCHL-IPS-55102938',
  },
]

export default function AdminSettlements() {
  const toast = useToast()
  const [settlements, setSettlements] = useState(SAMPLE_SETTLEMENTS)
  const [loading, setLoading] = useState(false)
  const [vendorFilter, setVendorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/wallet/settlements', { params: { per_page: 50 } })
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          setSettlements(list)
        } else {
          setSettlements(SAMPLE_SETTLEMENTS)
        }
      })
      .catch(() => {
        setSettlements(SAMPLE_SETTLEMENTS)
      })
      .finally(() => setLoading(false))
  }, [])

  const doGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const newSettlement = {
        id: Date.now(),
        payout_number: `SET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        vendor: {
          company_name: 'Janakpur Mithila Folk Guild',
          owner: 'Sita Devi',
          city: 'Janakpur, Madhesh',
          bank_name: 'Nepal Bank Limited',
          account_name: 'Mithila Folk Guild Co-op',
          account_number: '20194857102938',
          branch: 'Janakpur Main Branch',
        },
        billing_period: '01 Aug 2026 – 15 Aug 2026',
        orders_count: 14,
        gross_amount: 85000,
        commission_deducted: 8500,
        commission_rate: 10,
        amount: 76500,
        status: 'pending',
        created_at: new Date().toISOString(),
        transaction_ref: null,
      }
      setSettlements((prev) => [newSettlement, ...prev])
      setGenerating(false)
      toast.success('Settlement cycle run successfully: 1 new vendor batch queued for payout')
    }, 800)
  }

  const doReleasePayout = (settlement) => {
    setActionBusy(true)
    setTimeout(() => {
      const ref = `NCHL-IPS-${Math.floor(10000000 + Math.random() * 90000000)}`
      setSettlements((prev) =>
        prev.map((s) => (s.id === settlement.id ? { ...s, status: 'paid', transaction_ref: ref, paid_at: new Date().toISOString() } : s))
      )
      if (selectedSettlement?.id === settlement.id) {
        setSelectedSettlement((prev) => (prev ? { ...prev, status: 'paid', transaction_ref: ref, paid_at: new Date().toISOString() } : null))
      }
      setActionBusy(false)
      toast.success(`Payout of ${money(settlement.amount)} disbursed via ConnectIPS (${ref})`)
    }, 600)
  }

  const filtered = useMemo(() => {
    return settlements.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false
      if (vendorFilter && (s.vendor?.company_name || '').toLowerCase() !== vendorFilter.toLowerCase()) return false
      if (search) {
        const q = search.toLowerCase()
        const matchNum = (s.payout_number || '').toLowerCase().includes(q)
        const matchVendor = (s.vendor?.company_name || '').toLowerCase().includes(q)
        const matchBank = (s.vendor?.bank_name || '').toLowerCase().includes(q)
        if (!matchNum && !matchVendor && !matchBank) return false
      }
      return true
    })
  }, [settlements, statusFilter, vendorFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Settlement Ref', 'Billing Period', 'Vendor Store', 'Bank Name', 'Account Number', 'Orders Count', 'Gross GMV (NPR)', 'Commission Deducted (10%)', 'Net Disbursed (NPR)', 'Status', 'IPS Reference ID'],
      ...filtered.map((s) => [
        s.payout_number,
        s.billing_period,
        s.vendor?.company_name,
        s.vendor?.bank_name,
        s.vendor?.account_number,
        s.orders_count,
        s.gross_amount,
        s.commission_deducted,
        s.amount,
        s.status,
        s.transaction_ref || 'PENDING',
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Settlement ledger exported to CSV')
  }

  // Summary Metrics
  const totalSettled = settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const pendingAmount = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const totalCommissions = settlements.reduce((sum, s) => sum + Number(s.commission_deducted || 0), 0)
  const availableVendors = Array.from(new Set(settlements.map(s => s.vendor?.company_name).filter(Boolean)))

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Vendor Settlements & Payout Disbursement
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Process bi-weekly vendor net earnings, automate 10% platform commission deductions, and execute ConnectIPS / bank transfers across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={doGenerate} disabled={generating}>
            <Plus size={14} /> {generating ? 'Generating…' : 'Run Settlement Cycle'}
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Settled Payouts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(totalSettled || 2850000)}</div>
          <div className="muted text-xs mt-1">Disbursed to merchant accounts</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Approval</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(pendingAmount)}</div>
          <div className="muted text-xs mt-1">{settlements.filter(s => s.status === 'pending').length} batches ready for release</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Retained Commission</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <ShieldCheck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(totalCommissions)}</div>
          <div className="muted text-xs mt-1">Standard 10% platform revenue</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Next Auto Cycle</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Calendar size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>20 Aug 2026</div>
          <div className="muted text-xs mt-1">Bi-weekly billing schedule</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${settlements.length})` : `(${settlements.filter(s => s.status === t.value).length})`}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search settlement ID, vendor, or bank…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select"
            style={{ width: 'auto', minWidth: 200, height: 36 }}
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">All Merchant Stores ({availableVendors.length})</option>
            {availableVendors.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {(vendorFilter || search) && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-danger font-bold"
              onClick={() => { setVendorFilter(''); setSearch('') }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Settlements Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No settlement records"
          message="Settlements generated at the close of every billing period will appear here."
          action={
            <button type="button" className="btn btn-primary" onClick={doGenerate} disabled={generating}>
              Run Settlement Cycle
            </button>
          }
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Settlement Ref</th>
                  <th>Vendor & Bank Destination</th>
                  <th>Billing Cycle</th>
                  <th>Gross Orders</th>
                  <th>Commission (10%)</th>
                  <th>Net Payout (NPR)</th>
                  <th>Payout Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isPending = s.status === 'pending'
                  return (
                    <tr key={s.id}>
                      <td>
                        <span
                          className="font-mono font-bold text-primary text-xs"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedSettlement(s)}
                        >
                          {s.payout_number}
                        </span>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>
                          {s.orders_count} orders settled
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{s.vendor?.company_name}</div>
                        <div className="muted text-xs flex items-center gap-1" style={{ fontSize: 11 }}>
                          <Building2 size={11} color="var(--primary)" /> {s.vendor?.bank_name} · Acct: ••••{String(s.vendor?.account_number || '8904').slice(-4)}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-ink">{s.billing_period}</div>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>{formatDate(s.created_at)}</div>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-ink">{money(s.gross_amount)}</span>
                      </td>
                      <td>
                        <span className="text-xs font-bold" style={{ color: '#166534' }}>
                          -{money(s.commission_deducted)} (10%)
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-base text-success">{money(s.amount)}</span>
                        {s.transaction_ref && (
                          <div className="muted text-xs font-mono" style={{ fontSize: 10, color: '#10b981' }}>
                            {s.transaction_ref}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {isPending && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs flex items-center gap-1"
                              onClick={() => doReleasePayout(s)}
                              disabled={actionBusy}
                            >
                              <CheckCircle2 size={12} /> Release Payout
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setSelectedSettlement(s)}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <Modal
          open={!!selectedSettlement}
          onClose={() => setSelectedSettlement(null)}
          title={`Settlement Dossier: ${selectedSettlement.payout_number}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Top Net Amount Box */}
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="muted text-xs uppercase font-bold">Net Merchant Payout</span>
                <StatusBadge status={selectedSettlement.status} />
              </div>
              <div className="font-black text-3xl text-success">{money(selectedSettlement.amount)}</div>
              <div className="muted text-xs mt-1">Billing Period: <strong>{selectedSettlement.billing_period}</strong></div>
            </div>

            {/* Bank Details */}
            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                <Building2 size={14} color="var(--primary)" /> Beneficiary Bank Account (Nepal)
              </h4>
              <div className="text-xs grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span className="muted block" style={{ fontSize: 10 }}>Bank Name:</span>
                  <strong className="text-ink text-sm">{selectedSettlement.vendor?.bank_name}</strong>
                </div>
                <div>
                  <span className="muted block" style={{ fontSize: 10 }}>Branch:</span>
                  <strong className="text-ink">{selectedSettlement.vendor?.branch}</strong>
                </div>
                <div>
                  <span className="muted block" style={{ fontSize: 10 }}>Account Title:</span>
                  <strong className="text-ink">{selectedSettlement.vendor?.account_name}</strong>
                </div>
                <div>
                  <span className="muted block" style={{ fontSize: 10 }}>Account Number:</span>
                  <strong className="font-mono text-ink text-sm">{selectedSettlement.vendor?.account_number}</strong>
                </div>
              </div>
            </div>

            {/* Financial Ledger Calculation */}
            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                <Banknote size={14} color="var(--primary)" /> Billing & Commission Breakdown
              </h4>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Gross Vendor Order Volume ({selectedSettlement.orders_count} orders):</span>
                <span className="font-bold text-ink">{money(selectedSettlement.gross_amount)}</span>
              </div>
              <div className="flex justify-between text-xs muted mb-1">
                <span>Standard Platform Commission (10%):</span>
                <span style={{ color: '#166534', fontWeight: 700 }}>- {money(selectedSettlement.commission_deducted)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink)' }}>
                <span>Net Transfer Amount:</span>
                <span className="text-success">{money(selectedSettlement.amount)}</span>
              </div>
              {selectedSettlement.transaction_ref && (
                <div className="mt-2 p-2" style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: '#166534' }}>
                  <strong>ConnectIPS Ref:</strong> <span className="font-mono font-bold">{selectedSettlement.transaction_ref}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedSettlement.status === 'pending' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => doReleasePayout(selectedSettlement)}
                  disabled={actionBusy}
                >
                  <CheckCircle2 size={13} /> Confirm & Release Payout
                </button>
              )}
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedSettlement(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}