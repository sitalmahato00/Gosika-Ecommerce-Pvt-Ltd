import React, { useCallback, useState } from 'react'
import { Percent, Info, Calculator, TrendingUp, ShoppingBag, Wallet, PiggyBank } from 'lucide-react'
import api from '../../api/client'
import { useApi, useList } from '../../hooks/useApi'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, errorMessage } from '../../utils/format'

const STATUS_FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
]

export default function VendorCommission() {
  const [status, setStatus] = useState('')

  const me = useApi(() => api.get('/vendor/me'))
  const summary = useApi(() => api.get('/vendor/analytics/summary', { params: { range: '30d' } }))

  const commissionRate = me.data?.commission_rate
  const vendorStatus = me.data?.status
  const s = summary.data || {}

  const fetcher = useCallback(
    async (page) => api.get('/vendor/orders', {
      params: { page, per_page: 15, status: status || undefined },
    }),
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [status],
    pageSize: 15,
  })

  const kpis = [
    { label: 'Commission Rate', icon: Percent, value: commissionRate != null ? `${Number(commissionRate)}%` : '—', sub: 'GOSIKA platform rate', color: 'var(--primary)' },
    { label: 'Gross Revenue', icon: TrendingUp, value: money(s.revenue), sub: 'Sales in current period', color: '#10b981' },
    { label: 'Commission Charged', icon: Wallet, value: money(s.commission_total), sub: 'Total platform commission', color: '#ef4444' },
    { label: 'Orders', icon: ShoppingBag, value: Number(s.orders_count || 0).toLocaleString(), sub: 'Orders in current period', color: '#f59e0b' },
    { label: 'Net Earnings', icon: PiggyBank, value: money(s.net_earnings), sub: 'Revenue after commission & refunds', color: '#10b981' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Commission</h1>
          <p>Exactly how GOSIKA calculates your earnings</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill" style={{ fontSize: 13, fontWeight: 700 }}>
            <Percent size={14} /> Your rate: {commissionRate != null ? `${Number(commissionRate)}%` : '—'}
          </span>
          {me.data && <StatusBadge status={vendorStatus} />}
        </div>
      </div>

      {summary.loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
      ) : summary.error ? (
        <div style={{ marginBottom: 18 }}>
          <ErrorState message={errorMessage(summary.error)} onRetry={summary.reload} />
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
          {kpis.map((k) => (
            <div key={k.label} className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>{k.label}</span>
                <span className="avatar" style={{ width: 34, height: 34, background: 'var(--bg)', color: k.color }}>
                  <k.icon size={17} />
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{k.value}</div>
              <div className="muted text-xs mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ background: 'var(--surface)' }}>
        <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 15 }}>
          <Calculator size={16} color="var(--primary)" /> How your earnings are calculated
        </h3>
        <div style={{ maxWidth: 460 }}>
          <table className="table table-borderless mb-0">
            <tbody>
              <tr><td className="muted">Gross Revenue</td><td style={{ textAlign: 'right' }} className="font-medium">{money(s.revenue)}</td></tr>
              <tr><td className="muted">GOSIKA Commission ({commissionRate != null ? `${Number(commissionRate)}%` : '—'})</td><td style={{ textAlign: 'right' }} className="text-danger">-{money(s.commission_total)}</td></tr>
              {Number(s.refunds_total) > 0 && (
                <tr><td className="muted">Refunds / adjustments</td><td style={{ textAlign: 'right' }} className="text-danger">-{money(s.refunds_total)}</td></tr>
              )}
              <tr><td style={{ borderTop: '2px solid var(--border)' }} className="font-bold">Vendor Net Earnings</td><td style={{ textAlign: 'right', borderTop: '2px solid var(--border)' }} className="font-bold text-success">{money(s.net_earnings)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted text-xs mt-2 mb-0" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={13} /> Commission applies on gross revenue for the current analytics period. Per-order details are shown below.
        </p>
      </div>

      <div className="flex items-center gap-2" style={{ margin: '18px 0' }}>
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            className={`pill ${status === sf.value ? 'active' : ''}`}
            onClick={() => setStatus(sf.value)}
            aria-pressed={status === sf.value}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Percent}
          title={status ? `No ${status} orders` : 'No commission data yet'}
          message="Completed orders will show a per-order commission breakdown here."
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th style={{ textAlign: 'right' }}>Gross</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }}>Eligible</th>
                  <th style={{ textAlign: 'right' }}>Commission</th>
                  <th style={{ textAlign: 'right' }}>Refund</th>
                  <th style={{ textAlign: 'right' }}>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => {
                  const gross = Number(o.grand_total || 0)
                  const discount = Number(o.discount_total || 0)
                  const eligible = Math.max(gross - discount, 0)
                  const rate = Number(commissionRate) || 0
                  const commission = (eligible * rate) / 100
                  const refund = Number(o.refund_total || 0)
                  return (
                    <tr key={o.id}>
                      <td className="font-medium" style={{ fontSize: 13 }}>{o.vendor_order_number}</td>
                      <td style={{ textAlign: 'right' }}>{money(gross)}</td>
                      <td style={{ textAlign: 'right' }} className="text-danger">-{money(discount)}</td>
                      <td style={{ textAlign: 'right' }} className="font-medium">{money(eligible)}</td>
                      <td style={{ textAlign: 'right' }} className="text-danger">-{money(commission)}</td>
                      <td style={{ textAlign: 'right' }} className="text-danger">{refund ? `-${money(refund)}` : '—'}</td>
                      <td style={{ textAlign: 'right' }} className="font-semibold text-success">{money(eligible - commission - refund)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
