import React, { useMemo, useState } from 'react'
import { Banknote, Package, Info, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { isSameDay, isThisWeek, isThisMonth } from '../../utils/delivery'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

const PERIODS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const periodPredicate = {
  all: () => true,
  today: (iso) => isSameDay(iso),
  week: (iso) => isThisWeek(iso),
  month: (iso) => isThisMonth(iso),
}

export default function DeliveryCodLedger() {
  const [period, setPeriod] = useState('all')
  const history = useApi(async () => {
    const page1 = await api.get('/delivery-partner/history', { params: { per_page: 100 } })
    let list = page1.data?.data?.data ?? []
    const pag = page1.data?.meta?.pagination ?? {}
    for (let p = 2; p <= (pag.last_page || 1); p++) {
      const res = await api.get('/delivery-partner/history', { params: { per_page: 100, page: p } })
      list = list.concat(res.data?.data?.data ?? [])
    }
    return list
  })

  const codEntries = useMemo(
    () =>
      (history.data ?? [])
        .filter((a) => a.status === 'delivered' && Number(a.cod_amount || 0) > 0)
        .sort((a, b) => new Date(b.delivered_at || 0) - new Date(a.delivered_at || 0)),
    [history.data],
  )

  const inPeriod = useMemo(() => codEntries.filter((a) => periodPredicate[period](a.delivered_at)), [codEntries, period])
  const totalCod = codEntries.reduce((s, a) => s + Number(a.cod_amount || 0), 0)
  const periodCod = inPeriod.reduce((s, a) => s + Number(a.cod_amount || 0), 0)

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
        <div className="flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: 2 }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className="chip"
              style={{
                whiteSpace: 'nowrap',
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer',
                border: period === p.key ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: period === p.key ? 'var(--primary-50)' : '#fff',
                color: period === p.key ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>
              {period === 'all' ? 'COD Collected' : `${PERIODS.find((p) => p.key === period)?.label} COD`}
            </span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(periodCod)}</div>
          <div className="muted text-xs mt-1">{inPeriod.length} COD order{inPeriod.length === 1 ? '' : 's'}</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>All-Time COD</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{money(totalCod)}</div>
          <div className="muted text-xs mt-1">Cash to be remitted to the hub</div>
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
            {inPeriod.map((a) => (
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
