import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Percent, RotateCcw, PiggyBank, Wallet, Coins,
  Download, ShieldCheck, ArrowRight, BarChart2,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'year', label: '12 Months' },
]

export default function VendorEarnings() {
  const toast = useToast()
  const [range, setRange] = useState('30d')

  const summaryApi = useApi(() => api.get('/vendor/analytics/summary', { params: { range } }), { deps: [range] })
  const trendApi = useApi(() => api.get('/vendor/analytics/revenue-trend', { params: { range } }), { deps: [range] })
  const walletApi = useApi(() => api.get('/vendor/wallet'))
  const payoutsApi = useApi(() => api.get('/vendor/wallet/payouts'))
  const settleApi = useApi(() => api.get('/vendor/wallet/settlements', { params: { per_page: 5 } }))

  const summary = summaryApi.data || {}
  const trend = trendApi.data || []
  const settlePayload = settleApi.data || {}
  const settlements = Array.isArray(settlePayload) ? settlePayload : (settlePayload.data || [])
  const wallet = walletApi.data || {}

  const totalWithdrawn = (payoutsApi.data || [])
    .filter((p) => ['approved', 'processing', 'paid'].includes(p.status))
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const exportCSV = () => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Revenue', summary.revenue],
      ['Orders', summary.orders_count],
      ['Avg Order Value', summary.avg_order_value],
      ['Products Sold', summary.products_sold],
      ['Commission', summary.commission_total],
      ['Delivery Fees', summary.delivery_fees],
      ['Refunds', summary.refunds_total],
      ['Net Earnings', summary.net_earnings],
    ]
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-vendor-earnings-${range}.csv`
    a.click()
    toast.success('Earnings statement exported')
  }

  if (summaryApi.loading || trendApi.loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={110} />)}
        </div>
        <Skeleton height={300} />
      </div>
    )
  }

  if (summaryApi.error || trendApi.error) {
    return <ErrorState message="Could not load earnings analytics" onRetry={summaryApi.reload} />
  }

  return (
    <div style={{ paddingBottom: 40, width: '100%' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Earnings & Revenue</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track sales revenue, platform commissions, settled payouts, and withdrawable wallet balances.
          </p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <div className="date-filter-group">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`date-filter-btn ${range === r.value ? 'active' : ''}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={13} /> Export Statement
          </button>
          <Link to="/vendor/wallet" className="btn btn-primary btn-sm flex items-center gap-1">
            <Wallet size={14} /> Open Wallet & Withdraw
          </Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Gross Sales</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <TrendingUp size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>{money(summary.revenue)}</div>
          <div className="muted text-xs mt-1">Total customer orders</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Commission</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Percent size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{money(summary.commission_total)}</div>
          <div className="muted text-xs mt-1">Platform fee on sales</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Refunds</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <RotateCcw size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{money(summary.refunds_total)}</div>
          <div className="muted text-xs mt-1">Return adjustments</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.03)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#166534' }}>Net Earnings</span>
            <span className="avatar" style={{ width: 32, height: 32, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <PiggyBank size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{money(summary.net_earnings)}</div>
          <div className="muted text-xs mt-1">Sales minus commission & refunds</div>
        </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 18, alignItems: 'start' }}>
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                <BarChart2 size={17} color="var(--primary)" /> Revenue Trend
              </h3>
              <span className="muted text-xs">Gross order volume in NPR · {range.toUpperCase()}</span>
            </div>
            <Link to="/vendor/settlements" className="btn btn-ghost btn-xs">
              View Settlements <ArrowRight size={12} />
            </Link>
          </div>

          {trend.length ? <MiniBarChart data={trend} /> : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="es-icon"><BarChart2 size={32} /></div>
              <p className="muted">No revenue data for this period yet.</p>
            </div>
          )}
        </div>

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
            {settlements.length ? (
              <div className="flex flex-col gap-3">
                {settlements.slice(0, 3).map((s) => (
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
                      <div className="font-mono font-bold text-xs text-ink">{s.settlement_number || `#${s.id}`}</div>
                      <div className="muted text-xs mt-0.5">{formatDate(s.period_end)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-ink">{money(s.net_payable)}</div>
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))}

                <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="muted text-xs font-semibold uppercase">Total Paid Out:</span>
                  <span className="font-bold text-base text-ink">{money(totalWithdrawn)}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="es-icon"><Coins size={32} /></div>
                <p className="muted">No settlements yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1)
  const w = 560
  const h = 150
  const pad = 10
  const bw = Math.min(26, (w - pad * 2) / data.length - 6)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Revenue trend" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="earnBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={w - pad}
          y1={h - (h - 30) * f - 18}
          y2={h - (h - 30) * f - 18}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}
      {data.map((d, i) => {
        const v = Number(d.value) || 0
        const spacing = (w - pad * 2) / data.length
        const x = pad + i * spacing + (spacing - bw) / 2
        const bh = ((h - 30) * v) / max
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={h - bh - 18}
              width={bw}
              height={Math.max(bh, 4)}
              rx={4}
              fill="url(#earnBarGrad)"
            >
              <title>{d.label}: {money(v)}</title>
            </rect>
            <text x={x + bw / 2} y={h - 2} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontWeight="600">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
