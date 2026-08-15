import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet, Percent, RotateCcw, ArrowRight,
  PiggyBank, Coins, ArrowUpRight, ArrowDownLeft, Download, CheckCircle2,
  Clock, ShieldCheck, FileSpreadsheet
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const MOCK_EARNINGS_TRANSACTIONS = [
  {
    id: 1,
    transaction_type: 'Order Settlement',
    description: 'Earnings from order VO-EAB6D2B8 (Pashmina Shawl)',
    status: 'completed',
    amount: 5850,
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 2,
    transaction_type: 'Order Settlement',
    description: 'Earnings from order VO-6DF04EA8 (Ilam Tea)',
    status: 'completed',
    amount: 1530,
    created_at: '2026-08-14T20:15:00Z',
  },
  {
    id: 3,
    transaction_type: 'Order Settlement',
    description: 'Earnings from order VO-93993919 (Peacock Window)',
    status: 'completed',
    amount: 3780,
    created_at: '2026-08-14T18:00:00Z',
  },
  {
    id: 4,
    transaction_type: 'Commission Deducted',
    description: 'Platform 10% commission on order VO-EAB6D2B8',
    status: 'completed',
    amount: -650,
    created_at: '2026-08-14T10:00:00Z',
  },
  {
    id: 5,
    transaction_type: 'Refund Adjustment',
    description: 'Refund processed for claim RTN-99201',
    status: 'completed',
    amount: -1350,
    created_at: '2026-08-13T12:00:00Z',
  },
  {
    id: 6,
    transaction_type: 'Bank Payout',
    description: 'Direct Bank Settlement (Nabil Bank)',
    status: 'completed',
    amount: -5000,
    created_at: '2026-08-11T16:00:00Z',
  },
]

const MOCK_SETTLEMENTS = [
  {
    id: 1,
    payout_number: 'SET-2026-0801',
    method: 'Nabil Bank Account',
    amount: 5000,
    status: 'paid',
    requested_at: '2026-08-11T16:00:00Z',
  },
  {
    id: 2,
    payout_number: 'SET-2026-0702',
    method: 'Khalti Wallet',
    amount: 4500,
    status: 'paid',
    requested_at: '2026-07-28T14:30:00Z',
  },
]

export default function VendorEarnings() {
  const toast = useToast()
  const [wallet, setWallet] = useState({
    available_balance: 18470,
    pending_balance: 3200,
    total_withdrawn: 9500,
  })
  const [transactions, setTransactions] = useState(MOCK_EARNINGS_TRANSACTIONS)
  const [settlements, setSettlements] = useState(MOCK_SETTLEMENTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/wallet'),
      api.get('/vendor/wallet/transactions'),
      api.get('/vendor/wallet/payouts'),
    ]).then(([w, t, p]) => {
      if (w.status === 'fulfilled' && w.value.data.data) {
        setWallet(prev => ({ ...prev, ...w.value.data.data }))
      }
      if (t.status === 'fulfilled' && t.value.data.data?.length) {
        setTransactions(t.value.data.data)
      }
      if (p.status === 'fulfilled' && p.value.data.data?.length) {
        setSettlements(p.value.data.data)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Calculate high-level financial figures
  const { grossSales, commission, refunds, netEarnings } = useMemo(() => {
    let gross = 24800
    let comm = 2480
    let refundsTotal = 1350

    if (transactions.length > 0) {
      let calcGross = 0
      let calcComm = 0
      let calcRef = 0
      transactions.forEach((t) => {
        const amt = Number(t.amount || 0)
        const type = (t.transaction_type || '').toLowerCase()
        if (amt > 0) calcGross += amt
        if (amt < 0 && (type.includes('commission') || type.includes('fee'))) calcComm += Math.abs(amt)
        if (amt < 0 && type.includes('refund')) calcRef += Math.abs(amt)
      })
      if (calcGross > 0) {
        gross = calcGross
        comm = calcComm || Math.round(gross * 0.1)
        refundsTotal = calcRef
      }
    }

    return {
      grossSales: gross,
      commission: comm,
      refunds: refundsTotal,
      netEarnings: gross - comm - refundsTotal,
    }
  }, [transactions])

  const totalWithdrawn = settlements
    .filter((s) => ['approved', 'processing', 'paid', 'completed'].includes(s.status))
    .reduce((sum, s) => sum + Number(s.amount || 0), 0) || wallet.total_withdrawn || 9500

  const exportCSV = () => {
    const headers = ['Transaction Type', 'Description', 'Amount NPR', 'Status', 'Date']
    const rows = transactions.map((t) => [
      `"${t.transaction_type}"`,
      `"${t.description}"`,
      t.amount,
      t.status,
      t.created_at,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-vendor-earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Earnings statement exported')
  }

  return (
    <div style={{ paddingBottom: 40, width: '100%' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Earnings & Revenue</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track sales revenue, 10% platform commissions, settled payouts, and withdrawable wallet balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={13} /> Export Statement
          </button>
          <Link to="/vendor/wallet" className="btn btn-primary btn-sm flex items-center gap-1">
            <Wallet size={14} /> Open Wallet & Withdraw
          </Link>
        </div>
      </div>

      {/* 6 Financial Metric KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Gross Sales */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Gross Sales</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <TrendingUp size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>{money(grossSales)}</div>
          <div className="muted text-xs mt-1">Total customer orders</div>
        </div>

        {/* Platform Commission */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Commission (10%)</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Percent size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{money(commission)}</div>
          <div className="text-xs mt-1">
            <Link to="/vendor/commission" style={{ color: 'var(--primary)', fontWeight: 600 }}>Breakdown →</Link>
          </div>
        </div>

        {/* Refunds */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Refunds</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <RotateCcw size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{money(refunds)}</div>
          <div className="muted text-xs mt-1">Return adjustments</div>
        </div>

        {/* Net Earnings */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.03)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#166534' }}>Net Earnings</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <PiggyBank size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{money(netEarnings)}</div>
          <div className="muted text-xs mt-1">Sales minus commission</div>
        </div>

        {/* Available Balance */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#fff' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#bfdbfe' }}>Withdrawable</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
              <Wallet size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{money(wallet.available_balance)}</div>
          <div className="text-xs mt-1" style={{ color: '#dbeafe' }}>Pending: {money(wallet.pending_balance)}</div>
        </div>

        {/* Total Settled */}
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Withdrawn</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'var(--bg)', color: 'var(--ink)' }}>
              <Coins size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>{money(totalWithdrawn)}</div>
          <div className="muted text-xs mt-1">Settled to bank/eSewa</div>
        </div>
      </div>

      {/* Main Content Area: Responsive Tables without Horizontal Overflow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 18, alignItems: 'start' }}>
        {/* Earnings Transaction Ledger */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <TrendingUp size={16} color="var(--primary)" /> Earnings & Transaction Activity
            </h3>
            <span className="muted text-xs">{transactions.length} entries</span>
          </div>

          <div style={{ padding: '0 8px' }}>
            {transactions.map((t) => {
              const amt = Number(t.amount)
              const isCredit = amt > 0
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 10px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <span
                      className="avatar"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-sm)',
                        background: isCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: isCredit ? '#10b981' : '#ef4444',
                        flexShrink: 0,
                      }}
                    >
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div className="font-bold text-sm text-ink truncate" style={{ fontSize: 13 }}>
                        {t.transaction_type}
                      </div>
                      <div className="muted text-xs truncate" style={{ maxWidth: 300 }}>
                        {t.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 14,
                        color: isCredit ? '#10b981' : '#ef4444',
                      }}
                    >
                      {isCredit ? '+' : ''}{money(amt)}
                    </div>
                    <div className="muted text-xs mt-0.5">
                      {formatDate(t.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Settlements & Payout Activity */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <ShieldCheck size={16} color="var(--primary)" /> Payout Settlements
            </h3>
            <Link to="/vendor/settlements" className="btn btn-ghost btn-xs">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ padding: 18 }}>
            <div className="flex flex-col gap-3">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-ink">{s.payout_number}</div>
                    <div className="muted text-xs mt-0.5">{s.method || 'Bank Transfer'} · {formatDate(s.requested_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-ink">{money(s.amount)}</div>
                    <span className="chip chip-sm mt-0.5" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
                      <CheckCircle2 size={10} /> Paid
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="muted text-xs font-semibold uppercase">Total Paid Out:</span>
                <span className="font-bold text-base text-ink">{money(totalWithdrawn)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
