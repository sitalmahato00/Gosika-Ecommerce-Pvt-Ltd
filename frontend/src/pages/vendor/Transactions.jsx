import React, { useCallback, useMemo, useState } from 'react'
import { Receipt, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Select from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, errorMessage } from '../../utils/format'

const TYPE_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'credit', label: 'Income' },
  { value: 'debit', label: 'Withdrawals' },
  { value: 'credit_earnings', label: 'Earnings' },
  { value: 'credit_settlement', label: 'Settlement' },
  { value: 'credit_adjustment', label: 'Adjustment (credit)' },
  { value: 'debit_commission', label: 'Commission' },
  { value: 'debit_refund', label: 'Refund' },
  { value: 'debit_withdrawal', label: 'Withdrawal' },
  { value: 'debit_adjustment', label: 'Adjustment (debit)' },
]

const STATUS_FILTERS = ['', 'pending', 'completed', 'processing', 'failed', 'cancelled']

function typeIcon(type) {
  const t = (type || '').toLowerCase()
  if (t.startsWith('debit_')) return <ArrowUpRight size={15} color="var(--danger)" />
  if (t.startsWith('credit_')) return <ArrowDownLeft size={15} color="var(--success)" />
  return <ArrowLeftRight size={15} color="var(--primary)" />
}

function isCreditTransaction(t) {
  return String(t.transaction_type).startsWith('credit_') || Number(t.amount) > 0
}

export default function VendorTransactions() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetcher = useCallback(
    async (page, pageSize) => api.get('/vendor/wallet/transactions', {
      params: {
        page,
        per_page: pageSize,
      },
    }),
    [],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    pageSize: 20,
  })

  const filtered = useMemo(() => items.filter((t) => {
    const credit = isCreditTransaction(t)
    const typeOk =
      !typeFilter ||
      (typeFilter === 'credit' ? credit : typeFilter === 'debit' ? !credit : t.transaction_type === typeFilter)
    const statusOk = !statusFilter || t.status === statusFilter
    return typeOk && statusOk
  }), [items, typeFilter, statusFilter])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>Complete financial ledger for your account</p>
        </div>
        {items.length > 0 && <span className="muted text-sm">{items.length.toLocaleString()} records</span>}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Select label="Type" style={{ minWidth: 200 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {TYPE_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !filtered.length ? (
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
                  {filtered.map((t) => {
                    const amt = Number(t.amount || 0)
                    const isCredit = isCreditTransaction(t)
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
