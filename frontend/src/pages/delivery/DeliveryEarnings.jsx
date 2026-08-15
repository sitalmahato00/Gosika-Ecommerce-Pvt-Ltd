import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Banknote, DollarSign, Package, ChevronRight, Receipt, Info } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { isSameDay, isThisWeek, isThisMonth } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
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

export default function DeliveryEarnings() {
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

  const all = history.data ?? []
  const delivered = useMemo(
    () =>
      all
        .filter((a) => a.status === 'delivered')
        .sort((a, b) => new Date(b.delivered_at || 0) - new Date(a.delivered_at || 0)),
    [all],
  )

  const inPeriod = useMemo(() => delivered.filter((a) => periodPredicate[period](a.delivered_at)), [delivered, period])
  const totalEarned = delivered.reduce((s, a) => s + Number(a.delivery_fee || 0), 0)
  const periodEarned = inPeriod.reduce((s, a) => s + Number(a.delivery_fee || 0), 0)
  const totalCod = delivered.reduce((s, a) => s + Number(a.cod_amount || 0), 0)
  const periodCod = inPeriod.reduce((s, a) => s + Number(a.cod_amount || 0), 0)

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
              {period === 'all' ? 'Total Earnings' : `${PERIODS.find((p) => p.key === period)?.label} Earnings`}
            </span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(periodEarned)}</div>
          <div className="muted text-xs mt-1">{inPeriod.length} deliveries in this period</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>All-Time Earnings</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{money(totalEarned)}</div>
          <div className="muted text-xs mt-1">{delivered.length} deliveries confirmed</div>
        </div>

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
          <div className="muted text-xs mt-1">Total COD collected {money(totalCod)}</div>
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
            {inPeriod.map((a) => (
              <Link
                key={a.id}
                to={`/delivery/deliveries/${a.id}`}
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
              >
                <span className="avatar" style={{ width: 34, height: 34, background: '#ecfdf5', color: '#10b981', flexShrink: 0 }}>
                  <DollarSign size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink truncate">{a.vendor_order_number || a.id}</div>
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
