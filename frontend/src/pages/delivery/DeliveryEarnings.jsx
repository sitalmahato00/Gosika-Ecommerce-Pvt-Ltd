import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Banknote, DollarSign, Package, ChevronRight, Receipt, Info, Download } from 'lucide-react'
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

export default function DeliveryEarnings() {
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

  const all = history.data ?? []
  const delivered = useMemo(
    () => [...all].sort((a, b) => new Date(b.delivered_at || 0) - new Date(a.delivered_at || 0)),
    [all],
  )

  const totalEarned = delivered.reduce((s, a) => s + Number(a.delivery_fee || 0), 0)
  const totalCod = delivered.reduce((s, a) => s + Number(a.cod_amount || 0), 0)

  const exportEarnings = () => {
    exportReportFromRows({
      columns: [
        { label: 'Order #' },
        { label: 'Recipient' },
        { label: 'Delivered At' },
        { label: 'Delivery Fee', align: 'right' },
        { label: 'COD Collected', align: 'right' },
        { label: 'Status' },
      ],
      rows: delivered.map((assignment) => [
        assignment.order_number || assignment.vendor_order_number || assignment.id,
        assignment.recipient_name || '',
        formatDateTime(assignment.delivered_at),
        money(assignment.delivery_fee),
        money(assignment.cod_amount),
        assignment.status || 'delivered',
      ]),
      title: 'Delivery Partner Earnings Report',
      subtitle: 'Delivered orders and associated delivery fees matching the selected filters.',
      sectionLabel: 'Filtered Delivery Earnings',
      fileName: `gosika_delivery_earnings_${new Date().toISOString().slice(0, 10)}`,
      rangeLabel: appliedDates.from || appliedDates.to
        ? `${appliedDates.from || 'Beginning'} – ${appliedDates.to || 'Present'}`
        : 'All time',
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success(`${delivered.length} filtered delivery earning${delivered.length === 1 ? '' : 's'} exported.`)
  }

  if (history.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={220} height={28} />
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 18, margin: 0 }}>
              <Skeleton width={100} height={12} style={{ marginBottom: 12 }} />
              <Skeleton width={80} height={22} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18, margin: 0 }}>
          <Skeleton height={140} />
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Earnings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Delivery fees earned on {delivered.length} confirmed delivery{delivered.length === 1 ? '' : 'ies'}.
          </p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <ExportScopeNote>Exports all matching delivered orders in the branded Excel report format.</ExportScopeNote>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportEarnings} disabled={!delivered.length}>
            <Download size={14} /> Export filtered report
          </button>
        </div>
      </div>
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
              Earnings in selected period
            </span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(totalEarned)}</div>
          <div className="muted text-xs mt-1">{delivered.length} deliveries in this period</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Filtered Deliveries</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{delivered.length}</div>
          <div className="muted text-xs mt-1">Deliveries matching these filters</div>
        </div>

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
          <div className="muted text-xs mt-1">COD for filtered deliveries</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', margin: 0, background: '#f8fafc', border: '1px solid var(--border)' }}>
        <p className="m-0 text-xs" style={{ color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 1 }} />
          <span>
            Earnings accrue to your account the moment a delivery is confirmed. Payouts and remittance are scheduled by the GOSIKA dispatch hub.
          </span>
        </p>
      </div>

      {delivered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No earnings yet"
          message="Once you confirm deliveries, your delivery fees and COD collections will be tracked here."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View Assigned Deliveries</Link>}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Receipt size={15} color="#4f46e5" />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Earning Details</h3>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {delivered.map((a) => (
              <Link
                key={a.id}
                to={`/delivery/deliveries/${a.id}`}
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
              >
                <span className="avatar" style={{ width: 34, height: 34, background: '#ecfdf5', color: '#10b981', flexShrink: 0 }}>
                  <DollarSign size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink truncate">#{a.order_number || a.vendor_order_number || a.id}</div>
                  <div className="muted text-xs mt-0.5 truncate">{a.delivered_at ? formatDateTime(a.delivered_at) : '—'} · {a.recipient_name || '—'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-bold text-sm" style={{ color: '#16a34a' }}>+{money(a.delivery_fee)}</div>
                    {Number(a.cod_amount || 0) > 0 && <div className="muted text-xs" style={{ color: '#d97706' }}>COD {money(a.cod_amount)}</div>}
                  </div>
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
