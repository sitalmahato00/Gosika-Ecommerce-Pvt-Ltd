import React, { useMemo, useState } from 'react'
import { Banknote, Package, Info, ChevronRight, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import FilterBar from '../../components/admin/FilterBar'
import ExportScopeNote from '../../components/admin/ExportScopeNote'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function DeliveryCodLedger() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })
  const history = useApi(async () => {
    const params = {
      per_page: 100,
      status: 'delivered',
      search: search.trim() || undefined,
      date_from: appliedDates.from || undefined,
      date_to: appliedDates.to || undefined,
    }
    const page1 = await api.get('/delivery-partner/history', { params })
    let list = page1.data?.data ?? []
    const pag = page1.data?.meta?.pagination ?? {}
    for (let p = 2; p <= (pag.last_page || 1); p++) {
      const res = await api.get('/delivery-partner/history', { params: { ...params, page: p } })
      list = list.concat(res.data?.data ?? [])
    }
    return list
  }, { deps: [search, appliedDates] })

  const codEntries = useMemo(
    () =>
      (history.data ?? [])
        .filter((a) => Number(a.cod_amount || 0) > 0)
        .sort((a, b) => new Date(b.delivered_at || 0) - new Date(a.delivered_at || 0)),
    [history.data],
  )

  const totalCod = codEntries.reduce((s, a) => s + Number(a.cod_amount || 0), 0)

  const exportCod = () => {
    exportReportFromRows({
      columns: [
        { label: 'Vendor Order #' },
        { label: 'Recipient' },
        { label: 'Delivered At' },
        { label: 'COD Collected', align: 'right' },
      ],
      rows: codEntries.map((assignment) => [
        assignment.vendor_order_number || assignment.id,
        assignment.recipient_name || '',
        formatDateTime(assignment.delivered_at),
        money(assignment.cod_amount),
      ]),
      title: 'Delivery COD Collection Report',
      subtitle: 'Cash collected on delivered COD orders matching the selected filters.',
      sectionLabel: 'Filtered COD Collections',
      fileName: `gosika_delivery_cod_collection_${new Date().toISOString().slice(0, 10)}`,
      rangeLabel: appliedDates.from || appliedDates.to
        ? `${appliedDates.from || 'Beginning'} – ${appliedDates.to || 'Present'}`
        : 'All time',
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success(`${codEntries.length} filtered COD order${codEntries.length === 1 ? '' : 's'} exported.`)
  }

  if (history.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={220} height={28} />
        </div>
        <div className="card" style={{ padding: 18, margin: 0 }}>
          <Skeleton height={120} />
        </div>
      </div>
    )
  }

  if (history.error) {
    return <ErrorState message={errorMessage(history.error)} onRetry={() => history.reload()} />
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>COD Collection</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Cash collected on {codEntries.length} cash-on-delivery order{codEntries.length === 1 ? '' : 's'}.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCod} disabled={!codEntries.length}>
          <Download size={14} /> Export filtered report
        </button>
      </div>
      <ExportScopeNote>Exports all matching delivered COD orders in the branded Excel report format.</ExportScopeNote>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        debounceMs={300}
        searchPlaceholder="Search order number or recipient..."
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={() => setAppliedDates({ from: fromDate, to: toDate })}
        onReset={() => {
          setSearch('')
          setFromDate('')
          setToDate('')
          setAppliedDates({ from: '', to: '' })
        }}
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>
              COD collected in selected period
            </span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(totalCod)}</div>
          <div className="muted text-xs mt-1">{codEntries.length} COD order{codEntries.length === 1 ? '' : 's'}</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Filtered COD Orders</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{codEntries.length}</div>
          <div className="muted text-xs mt-1">Orders matching these filters</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', margin: 0, background: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
        <p className="m-0 text-xs" style={{ color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <span>
            Hand over collected COD cash to the GOSIKA dispatch hub at the end of your shift. Your ledger is reconciled against the orders you deliver.
          </span>
        </p>
      </div>

      {codEntries.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No COD collected yet"
          message="Cash-on-delivery orders you deliver will be recorded here for remittance."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View Assigned Deliveries</Link>}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Banknote size={15} color="#d97706" />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>COD Entries</h3>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {codEntries.map((a) => (
              <Link
                key={a.id}
                to={`/delivery/deliveries/${a.id}`}
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
              >
                <span className="avatar" style={{ width: 34, height: 34, background: '#fffbeb', color: '#d97706', flexShrink: 0 }}>
                  <Banknote size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink truncate">{a.vendor_order_number || a.id}</div>
                  <div className="muted text-xs mt-0.5 truncate">{a.delivered_at ? formatDateTime(a.delivered_at) : '—'} · {a.recipient_name || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-sm" style={{ color: '#d97706' }}>{money(a.cod_amount)}</div>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
