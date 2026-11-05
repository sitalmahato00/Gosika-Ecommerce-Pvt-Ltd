import React, { useCallback, useMemo, useState } from 'react'
import { Download, Receipt, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import FilterBar from '../../components/admin/FilterBar'
import ExportScopeNote from '../../components/admin/ExportScopeNote'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

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

const STATUS_FILTERS = ['', 'completed', 'held']

function typeIcon(type) {
  const t = (type || '').toLowerCase()
  if (t.startsWith('debit_')) return <ArrowUpRight size={15} color="var(--danger)" />
  if (t.startsWith('credit_')) return <ArrowDownLeft size={15} color="var(--success)" />
  return <ArrowLeftRight size={15} color="var(--primary)" />
}

function isCreditTransaction(t) {
  return String(t.transaction_type).startsWith('credit_')
}

export default function VendorTransactions() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })

  const fetcher = useCallback(
    async (page, pageSize) => api.get('/vendor/wallet/transactions', {
      params: {
        page,
        per_page: pageSize,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        date_from: appliedDates.from || undefined,
        date_to: appliedDates.to || undefined,
      },
    }),
    [search, typeFilter, statusFilter, appliedDates],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [search, typeFilter, statusFilter, appliedDates],
    pageSize: 20,
  })

  const exportTransactions = async () => {
    try {
      const rows = []
      let exportPage = 1
      let lastPage = 1
      do {
        const response = await api.get('/vendor/wallet/transactions', {
          params: {
            page: exportPage,
            per_page: 100,
            search: search.trim() || undefined,
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            date_from: appliedDates.from || undefined,
            date_to: appliedDates.to || undefined,
          },
        })
        rows.push(...api.unwrapList(response.data))
        lastPage = response.data?.meta?.pagination?.last_page || 1
        exportPage += 1
      } while (exportPage <= lastPage)

      exportReportFromRows({
        columns: [
          { label: 'Transaction Type' },
          { label: 'Reference' },
          { label: 'Description' },
          { label: 'Credit', align: 'right' },
          { label: 'Debit', align: 'right' },
          { label: 'Balance After', align: 'right' },
          { label: 'Status' },
          { label: 'Date' },
        ],
        rows: rows.map((transaction) => {
          const credit = isCreditTransaction(transaction)
          return [
            (transaction.transaction_type || '').replace(/_/g, ' '),
            transaction.reference_type
              ? `${transaction.reference_type.replace(/_/g, ' ')} · ${transaction.reference_id || ''}`
              : '',
            transaction.description || '',
            credit ? money(transaction.amount) : '',
            credit ? '' : money(Math.abs(Number(transaction.amount || 0))),
            money(transaction.balance_after),
            transaction.status || '',
            formatDateTime(transaction.created_at),
          ]
        }),
        title: 'Vendor Wallet Transactions',
        subtitle: 'Filtered vendor wallet credits, debits and balance history.',
        sectionLabel: 'Wallet Transaction Ledger',
        fileName: `gosika_vendor_transactions_${new Date().toISOString().slice(0, 10)}`,
        rangeLabel: appliedDates.from || appliedDates.to
          ? `${appliedDates.from || 'Beginning'} – ${appliedDates.to || 'Present'}`
          : 'All time',
        preparedBy: personLabel(user),
        company: companyFromBranding(branding),
      })
      toast.success(`${rows.length} filtered transaction${rows.length === 1 ? '' : 's'} exported.`)
    } catch (exportError) {
      toast.error(errorMessage(exportError))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>Complete financial ledger for your account</p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <ExportScopeNote>Exports all matching transactions across pages in the branded Excel report format.</ExportScopeNote>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportTransactions} disabled={!meta.total || loading}>
            <Download size={14} /> Export filtered report
          </button>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => { setPage(1); setSearch(value) }}
        debounceMs={300}
        searchPlaceholder="Search transaction, reference, or description..."
        statusFilter={statusFilter || 'all'}
        onStatusChange={(value) => { setPage(1); setStatusFilter(value === 'all' ? '' : value) }}
        statusOptions={STATUS_FILTERS.filter(Boolean).map((status) => ({ value: status, label: status.toUpperCase() }))}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={() => {
          setPage(1)
          setAppliedDates({ from: fromDate, to: toDate })
        }}
        onReset={() => {
          setSearch('')
          setTypeFilter('')
          setStatusFilter('')
          setFromDate('')
          setToDate('')
          setAppliedDates({ from: '', to: '' })
          setPage(1)
        }}
        extraFilters={
          <select
            className="input"
            aria-label="Filter by transaction type"
            value={typeFilter}
            onChange={(event) => { setPage(1); setTypeFilter(event.target.value) }}
            style={{ height: 36, minWidth: 170, fontSize: 13, borderRadius: 8, fontWeight: 600 }}
          >
            {TYPE_FILTERS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={58} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          message={typeFilter || statusFilter || search || appliedDates.from || appliedDates.to ? 'Try adjusting your filters.' : 'Your complete financial history will appear here.'}
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
