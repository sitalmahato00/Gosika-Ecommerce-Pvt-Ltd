import React, { useMemo, useState } from 'react'
import { FileSpreadsheet, Wallet, TrendingUp, ArrowUpRight, Download, Info } from 'lucide-react'
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

export default function DeliveryCodSettlement() {
  const [period, setPeriod] = useState('all')

  const history = useApi(async () => {
    const page1 = await api.get('/delivery-partner/history', { params: { per_page: 100 } })
    let list = page1.data?.data ?? []
    const pag = page1.data?.meta?.pagination ?? {}
    for (let p = 2; p <= (pag.last_page || 1); p++) {
      const res = await api.get('/delivery-partner/history', { params: { per_page: 100, page: p } })
      list = list.concat(res.data?.data ?? [])
    }
    return list
  })

  const delivered = useMemo(
    () =>
      (history.data ?? [])
        .filter((a) => a.status === 'delivered')
        .sort((a, b) => new Date(b.delivered_at || 0) - new Date(a.delivered_at || 0)),
    [history.data],
  )

  const rows = useMemo(
    () =>
      delivered.map((a) => ({
        id: a.id,
        vendor_order_number: a.vendor_order_number,
        recipient_name: a.recipient_name,
        cod: Number(a.cod_amount || 0),
        fee: Number(a.delivery_fee || 0),
        at: a.delivered_at,
      })),
    [delivered],
  )

  const inPeriod = useMemo(() => rows.filter((r) => periodPredicate[period](r.at)), [rows, period])

  const totals = useMemo(() => {
    const rows = inPeriod.length ? inPeriod : []
    const cod = rows.reduce((s, r) => s + r.cod, 0)
    const fees = rows.reduce((s, r) => s + r.fee, 0)
    const count = rows.length
    return { cod, fees, net: fees, count, avg: count ? fees / count : 0 }
  }, [inPeriod])

  const exportCsv = () => {
    const head = 'Order,Recipient,Delivered At,COD Amount,Delivery Fee'
    const lines = inPeriod.map((r) =>
      [r.vendor_order_number || r.id, `"${(r.recipient_name || '').replace(/"/g, '""')}"`, r.at ? formatDateTime(r.at) : '', r.cod, r.fee].join(','),
    )
    const blob = new Blob([[head, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-delivery-settlement-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (history.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={240} height={28} />
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>COD Settlement</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Your settlement breakdown — COD remitted to the hub, delivery fees you keep.
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
          <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" onClick={exportCsv} disabled={inPeriod.length === 0}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>COD Remitted</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <Wallet size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(totals.cod)}</div>
          <div className="muted text-xs mt-1">Cash handed to the hub</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivery Fees Earned</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{money(totals.fees)}</div>
          <div className="muted text-xs mt-1">Your delivery earnings</div>
        </div>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Net Settlement</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FileSpreadsheet size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#047857' }}>{money(totals.net)}</div>
          <div className="muted text-xs mt-1">{totals.count} delivered · avg ₹{totals.avg.toFixed(2)}/delivery</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', margin: 0, background: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
        <p className="m-0 text-xs" style={{ color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <span>
            COD cash is remitted to the hub, while the delivery fee is your earning. A formal payout runs at the end of each week — your settlement statement below is for your records.
          </span>
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No settlements yet"
          message="Deliveries you complete are settled here automatically — COD goes to the hub, your fee stays with you."
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={15} color="#10b981" />
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Settlement Statement</h3>
            <span className="muted text-xs ml-auto flex items-center gap-1">
              <ArrowUpRight size={12} /> {inPeriod.length} record{inPeriod.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {inPeriod.map((r) => (
              <div key={r.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="avatar" style={{ width: 34, height: 34, background: '#ecfdf5', color: '#059669', flexShrink: 0 }}>
                  <TrendingUp size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink truncate">{r.vendor_order_number || r.id}</div>
                  <div className="muted text-xs mt-0.5 truncate">{r.at ? formatDateTime(r.at) : '—'} · {r.recipient_name || '—'}</div>
                </div>
                <div className="text-right flex flex-col items-end" style={{ gap: 2 }}>
                  <div className="muted text-xs">
                    COD <span style={{ color: '#d97706', fontWeight: 700 }}>{money(r.cod)}</span>
                  </div>
                  <div className="font-bold text-sm" style={{ color: '#059669' }}>Fee {money(r.fee)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}