import React, { useCallback, useState } from 'react'
import { Receipt, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime } from '../../utils/format'

const TYPE_FILTERS = ['', 'sale', 'commission', 'payout', 'refund', 'adjustment', 'settlement']

const STATUS_FILTERS = ['', 'pending', 'completed', 'processing', 'failed', 'cancelled']

function typeIcon(type) {
  const t = (type || '').toLowerCase()
  if (['payout', 'withdrawal', 'settlement'].includes(t)) return <ArrowUpRight size={15} color="var(--danger)" />
  if (['sale', 'credit', 'order', 'refund_adjustment'].includes(t)) return <ArrowDownLeft size={15} color="var(--success)" />
  return <ArrowLeftRight size={15} color="var(--primary)" />
}

export default function VendorTransactions() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetcher = useCallback(
    async (page) => api.get('/vendor/wallet/transactions', {
      params: {
        page,
        per_page: 20,
        transaction_type: typeFilter || undefined,
        status: statusFilter || undefined,
      },
    }),
    [typeFilter, statusFilter],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [typeFilter, statusFilter],
    pageSize: 20,
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>Complete financial ledger for your account</p>
        </div>
        {meta.total > 0 && <span className="muted text-sm">{meta.total.toLocaleString()} records</span>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Select label="Type" style={{ minWidth: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {TYPE_FILTERS.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>
          ))}
        </Select>
        <Select label="Status" style={{ minWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_FILTERS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.toUpperCase()}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={58} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          message={typeFilter || statusFilter ? 'Try adjusting your filters.' : 'Your complete financial history will appear here.'}
        />
      ) : (
        <>
          <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Reference</th>
                    <th style={{ textAlign: 'right' }}>Credit</th>
                    <th style={{ textAlign: 'right' }}>Debit</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const amt = Number(t.amount || 0)
                    const isCredit = amt > 0
                    return (
                      <tr key={t.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            {typeIcon(t.transaction_type)}
                            <span className="capitalize font-medium" style={{ fontSize: 13 }}>
                              {(t.transaction_type || '').replace(/_/g, ' ')}
                            </span>
                          </span>
                          {t.description && <div className="muted text-xs" style={{ marginTop: 2 }}>{t.description}</div>}
                        </td>
                        <td className="muted text-sm">{t.reference_type ? `${t.reference_type.replace(/_/g, ' ')} · ${t.reference_id || ''}` : '—'}</td>
                        <td style={{ textAlign: 'right' }} className={isCredit ? 'text-success font-semibold' : 'muted'}>
                          {isCredit ? `+${money(amt)}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }} className={!isCredit ? 'text-danger font-semibold' : 'muted'}>
                          {!isCredit ? `-${money(Math.abs(amt))}` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-medium">{money(t.balance_after)}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td className="muted text-sm">{formatDateTime(t.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
