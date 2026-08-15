import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, Percent, RotateCcw, ArrowRight, PiggyBank, Coins } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDate } from '../../utils/format'

export default function VendorEarnings() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/wallet'),
      api.get('/vendor/wallet/transactions'),
      api.get('/vendor/wallet/payouts'),
    ]).then(([w, t, p]) => {
      if (w.status === 'fulfilled') setWallet(w.value.data.data)
      if (t.status === 'fulfilled') setTransactions(t.value.data.data || [])
      if (p.status === 'fulfilled') setSettlements(p.value.data.data || [])
      setLoading(false)
    })
  }, [])

  const { grossSales, commission, refunds, netEarnings } = useMemo(() => {
    let gross = 0
    let comm = 0
    let refundsTotal = 0
    transactions.forEach((t) => {
      const amt = Number(t.amount || 0)
      const type = (t.transaction_type || '').toLowerCase()
      if (['sale', 'credit', 'order'].includes(type) && amt > 0) gross += amt
      if (['commission', 'platform_fee'].includes(type)) comm += Math.abs(amt)
      if (['refund', 'refund_adjustment'].includes(type)) refundsTotal += Math.abs(amt)
    })
    return {
      grossSales: gross,
      commission: comm,
      refunds: refundsTotal,
      netEarnings: gross - comm - refundsTotal,
    }
  }, [transactions])

  const totalWithdrawn = settlements
    .filter((s) => ['approved', 'processing', 'paid', 'completed'].includes(s.status))
    .reduce((sum, s) => sum + Number(s.amount || 0), 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} />)}
        </div>
        <Skeleton height={280} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Earnings</h1>
          <p>Your financial overview across all stores</p>
        </div>
        <Link to="/vendor/wallet" className="btn btn-primary">Open Wallet</Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(37,99,235,0.12)' }}><TrendingUp size={18} color="var(--primary)" /></div>
          <div className="kpi-label">Gross Sales</div>
          <div className="kpi-value">{money(grossSales)}</div>
          <div className="muted text-xs">Before fees & discounts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(37,99,235,0.12)' }}><Coins size={18} color="var(--primary)" /></div>
          <div className="kpi-label">Gross Earnings</div>
          <div className="kpi-value">{money(grossSales)}</div>
          <div className="muted text-xs">Product sales + delivery fees</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(220,38,38,0.12)' }}><Percent size={18} color="var(--danger)" /></div>
          <div className="kpi-label">GOSIKA Commission</div>
          <div className="kpi-value">{money(commission)}</div>
          <div className="muted text-xs">
            <Link to="/vendor/commission" style={{ color: 'var(--primary)', fontWeight: 600 }}>View breakdown →</Link>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(220,38,38,0.12)' }}><RotateCcw size={18} color="var(--danger)" /></div>
          <div className="kpi-label">Refunds</div>
          <div className="kpi-value">{money(refunds)}</div>
          <div className="muted text-xs">Returns & adjustments</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><PiggyBank size={18} /></div>
          <div className="kpi-label">Net Earnings</div>
          <div className="kpi-value">{money(netEarnings)}</div>
          <div className="muted text-xs">After commission & refunds</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Wallet size={18} /></div>
          <div className="kpi-label">Available Balance</div>
          <div className="kpi-value">{money(wallet?.available_balance)}</div>
          <div className="muted text-xs">Pending: {money(wallet?.pending_balance)}</div>
        </div>
      </div>

      {/* Earnings & wallet row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start', marginTop: 20 }}>
        {/* Earnings summary */}
        <div className="card">
          <h3 style={{ fontSize: 16 }} className="mb-3">Earnings Summary</h3>
          {transactions.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Transaction</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((t) => {
                    const amt = Number(t.amount)
                    const isCredit = amt > 0
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="font-medium capitalize" style={{ fontSize: 13 }}>{t.transaction_type.replace(/_/g, ' ')}</div>
                          <div className="muted text-xs">{t.description}</div>
                        </td>
                        <td><StatusBadge status={t.status} /></td>
                        <td className="muted text-sm">{formatDate(t.created_at)}</td>
                        <td style={{ textAlign: 'right' }} className={isCredit ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                          {isCredit ? '+' : '-'}{money(Math.abs(amt))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title="No earnings yet" message="Your earnings will appear here as orders are completed." />
          )}
        </div>

        {/* Settlements */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16, margin: 0 }}>Settlements</h3>
            <Link to="/vendor/settlements" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
          </div>
          {settlements.length ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {settlements.slice(0, 5).map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-medium text-sm">{s.payout_number}</div>
                    <div className="muted text-xs">{formatDate(s.requested_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ fontSize: 14 }}>{money(s.amount)}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 12 }}>
                <div className="flex items-center justify-between">
                  <span className="muted text-sm">Total withdrawn</span>
                  <span className="font-bold">{money(totalWithdrawn)}</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Wallet} title="No settlements yet" message="Settled payouts will appear here once you withdraw your balance." />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="alert alert-info mt-3" style={{ marginBottom: 0 }}>
        <TrendingDown size={18} />
        <span>
          Earnings are calculated after the GOSIKA platform commission and any refunds. See the
          <Link to="/vendor/commission" style={{ margin: '0 4px', fontWeight: 600 }}> Commission</Link>
          page for a full per-order breakdown.
        </span>
      </div>
    </div>
  )
}
