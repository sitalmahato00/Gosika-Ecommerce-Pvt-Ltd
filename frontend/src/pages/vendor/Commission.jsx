import React, { useEffect, useMemo, useState } from 'react'
import { Percent, Info, Calculator } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDate } from '../../utils/format'
import { useCallback } from 'react'

const STATUS_FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
]

export default function VendorCommission() {
  const [commissionRate, setCommissionRate] = useState(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.get('/vendor/me').then((r) => {
      setCommissionRate(Number(r.data.data?.commission_rate ?? 10))
    }).catch(() => {})
  }, [])

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

  const totals = useMemo(() => {
    const gross = items.reduce((s, o) => s + Number(o.grand_total || 0), 0)
    const discounts = items.reduce((s, o) => s + Number(o.discount_total || 0), 0)
    const rate = commissionRate ?? 10
    const eligible = Math.max(gross - discounts, 0)
    const commission = (eligible * rate) / 100
    const refunds = items.reduce((s, o) => s + Number(o.refund_total || 0), 0)
    return {
      gross,
      discounts,
      eligible,
      commission,
      refunds,
      net: eligible - commission - refunds,
    }
  }, [items, commissionRate])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Commission</h1>
          <p>Exactly how GOSIKA calculates your earnings</p>
        </div>
        <span className="pill" style={{ fontSize: 13, fontWeight: 700 }}>
          <Percent size={14} /> Your rate: {commissionRate ?? '—'}%
        </span>
      </div>

      {/* How it's calculated */}
      <div className="card" style={{ background: 'var(--surface)' }}>
        <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 15 }}>
          <Calculator size={16} color="var(--primary)" /> How your earnings are calculated
        </h3>
        <div style={{ maxWidth: 460 }}>
          <table className="table table-borderless mb-0">
            <tbody>
              <tr><td className="muted">Product Sales</td><td style={{ textAlign: 'right' }} className="font-medium">{money(totals.gross)}</td></tr>
              <tr><td className="muted">Discount</td><td style={{ textAlign: 'right' }} className="text-danger">-{money(totals.discounts)}</td></tr>
              <tr><td style={{ borderTop: '1px dashed var(--border)' }} className="font-medium">Eligible Order Amount</td><td style={{ textAlign: 'right', borderTop: '1px dashed var(--border)' }} className="font-semibold">{money(totals.eligible)}</td></tr>
              <tr><td className="muted">GOSIKA Commission ({commissionRate ?? 10}%)</td><td style={{ textAlign: 'right' }} className="text-danger">-{money(totals.commission)}</td></tr>
              {totals.refunds > 0 && (
                <tr><td className="muted">Refunds / adjustments</td><td style={{ textAlign: 'right' }} className="text-danger">-{money(totals.refunds)}</td></tr>
              )}
              <tr><td style={{ borderTop: '2px solid var(--border)' }} className="font-bold">Vendor Earnings</td><td style={{ textAlign: 'right', borderTop: '2px solid var(--border)' }} className="font-bold text-success">{money(totals.net)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted text-xs mt-2 mb-0" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={13} /> Commission applies on the eligible amount (sales minus discounts) for orders on this page.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2" style={{ margin: '18px 0' }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            className={`pill ${status === s.value ? 'active' : ''}`}
            onClick={() => setStatus(s.value)}
            aria-pressed={status === s.value}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Per-order table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
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
                  const commission = (eligible * (commissionRate ?? 10)) / 100
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
