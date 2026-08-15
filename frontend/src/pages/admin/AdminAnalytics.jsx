import React, { useState } from 'react'
import {
  BarChart2, CreditCard, Download, DollarSign, Layers, MapPin, Percent,
  RotateCcw, ShoppingBag, Store, TrendingUp, Truck, Users
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const RANGES = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'year', label: 'Year' },
]

export default function AdminAnalytics() {
  const toast = useToast()
  const [range, setRange] = useState('30d')

  const summary = useApi(() => api.get('/admin/analytics/summary', { params: { range } }), { deps: [range] })
  const ordersByStatus = useApi(() => api.get('/admin/analytics/orders-by-status', { params: { range } }), { deps: [range] })
  const paymentMethods = useApi(() => api.get('/admin/analytics/payment-methods', { params: { range } }), { deps: [range] })
  const topStores = useApi(() => api.get('/admin/analytics/top-stores', { params: { range } }), { deps: [range] })
  const categoryShare = useApi(() => api.get('/admin/analytics/category-share', { params: { range } }), { deps: [range] })
  const provinces = useApi(() => api.get('/admin/analytics/provinces', { params: { range } }), { deps: [range] })

  const s = summary.data || {}

  const statusList = ordersByStatus.data || []
  const maxStatusCount = Math.max(...statusList.map((o) => Number(o.count) || 0), 1)

  const methods = paymentMethods.data || []
  const methodsTotal = methods.reduce((sum, pm) => sum + (Number(pm.count) || 0), 0)

  const categories = categoryShare.data || []

  const provList = provinces.data || []
  const provTotalRevenue = provList.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0)

  const stores = topStores.data || []

  const kpis = [
    { label: 'Gross Revenue', icon: DollarSign, color: 'var(--primary)', bg: 'var(--primary-50)', value: money(s.gross_revenue), sub: 'Total order value' },
    { label: 'Orders Completed', icon: ShoppingBag, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', value: (s.orders_count ?? 0).toLocaleString(), sub: 'Orders placed in range' },
    { label: 'Average Order Value', icon: TrendingUp, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', value: money(s.avg_order_value), sub: 'Per order average' },
    { label: 'Commission Total', icon: Percent, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', value: money(s.commission_total), sub: 'Platform commission earned' },
    { label: 'New Customers', icon: Users, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', value: (s.new_customers ?? 0).toLocaleString(), sub: 'New accounts registered' },
    { label: 'Active Vendors', icon: Store, color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', value: (s.active_vendors ?? 0).toLocaleString(), sub: 'Approved merchant sellers' },
    { label: 'Delivery Fees', icon: Truck, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', value: money(s.delivery_fees), sub: 'Delivery charges collected' },
    { label: 'Refunds Total', icon: RotateCcw, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', value: money(s.refunds_total), sub: 'Refunds issued' },
  ]

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Gross Revenue', s.gross_revenue],
      ['Orders Completed', s.orders_count],
      ['Average Order Value', s.avg_order_value],
      ['Commission Total', s.commission_total],
      ['New Customers', s.new_customers],
      ['Active Vendors', s.active_vendors],
      ['Delivery Fees', s.delivery_fees],
      ['Refunds Total', s.refunds_total],
      [],
      ['Order Status', 'Count'],
      ...statusList.map((o) => [o.status, o.count]),
      [],
      ['Payment Method', 'Count', 'Amount'],
      ...methods.map((pm) => [pm.method, pm.count, pm.amount]),
      [],
      ['Top Store', 'Orders', 'Revenue'],
      ...stores.map((t) => [t.store_name, t.orders_count, t.revenue]),
      [],
      ['Category', 'Amount', 'Share'],
      ...categories.map((c) => [c.category, c.amount, `${c.share}%`]),
      [],
      ['Province', 'Orders', 'Revenue'],
      ...provList.map((p) => [p.province, p.orders_count, p.revenue]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_analytics_report_${range}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Platform ${range.toUpperCase()} analytics report exported to CSV`)
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Analytics & Operational Reports
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Deep-dive analytics across sales, customer acquisition, vendor volume, and provincial performance in Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="date-filter-group" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, padding: 2 }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`date-filter-btn ${range === r.value ? 'active' : ''}`}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  background: range === r.value ? 'var(--primary)' : 'transparent',
                  color: range === r.value ? '#ffffff' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportReport}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {summary.loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={96} />)}
        </div>
      ) : summary.error ? (
        <ErrorState message={errorMessage(summary.error)} onRetry={summary.reload} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {kpis.map((k) => (
            <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }} key={k.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>{k.label}</span>
                <span className="avatar" style={{ width: 34, height: 34, background: k.bg, color: k.color }}>
                  <k.icon size={18} />
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{k.value}</div>
              <div className="muted text-xs mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <BarChart2 size={17} color="var(--primary)" /> Orders by Status ({range})
            </h3>
            <span className="muted text-xs font-semibold">{statusList.reduce((t, o) => t + (Number(o.count) || 0), 0)} orders</span>
          </div>
          {ordersByStatus.loading ? (
            <Skeleton height={140} />
          ) : ordersByStatus.error ? (
            <ErrorState message={errorMessage(ordersByStatus.error)} onRetry={ordersByStatus.reload} />
          ) : !statusList.length ? (
            <EmptyState title="No orders" message="No orders in the selected range." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
              {statusList.map((o) => (
                <div key={o.status}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink">{humanizeEnum(o.status)}</span>
                    <span className="muted font-normal">{o.count} orders</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((Number(o.count) / maxStatusCount) * 100)}%`, background: 'var(--primary)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20, margin: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <MapPin size={17} color="var(--primary)" /> Nepal Province Performance
            </h3>
            <span className="muted text-xs font-semibold">{provList.length} Provinces</span>
          </div>
          {provinces.loading ? (
            <Skeleton height={140} />
          ) : provinces.error ? (
            <ErrorState message={errorMessage(provinces.error)} onRetry={provinces.reload} />
          ) : !provList.length ? (
            <EmptyState title="No province data" message="No shipments with province info in the selected range." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 10 }}>
              {provList.map((p) => (
                <div key={p.province}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-ink">{p.province}</span>
                    <span className="muted font-normal">{p.orders_count} orders · <strong>{money(p.revenue)}</strong></span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'var(--bg)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${provTotalRevenue ? Math.round((Number(p.revenue) / provTotalRevenue) * 100) : 0}%`, background: 'var(--primary)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Layers size={17} color="var(--primary)" /> Product Category Revenue Share
          </h3>
          {categoryShare.loading ? (
            <Skeleton height={140} />
          ) : categoryShare.error ? (
            <ErrorState message={errorMessage(categoryShare.error)} onRetry={categoryShare.reload} />
          ) : !categories.length ? (
            <EmptyState title="No category data" message="No category revenue in the selected range." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {categories.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                    <span className="font-bold text-ink">{c.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-primary">{c.share}%</strong>
                    <span className="muted font-mono">{money(c.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20, margin: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <CreditCard size={17} color="var(--primary)" /> Payment Methods Distribution
          </h3>
          {paymentMethods.loading ? (
            <Skeleton height={140} />
          ) : paymentMethods.error ? (
            <ErrorState message={errorMessage(paymentMethods.error)} onRetry={paymentMethods.reload} />
          ) : !methods.length ? (
            <EmptyState title="No payment data" message="No payments in the selected range." />
          ) : (
            <div className="flex flex-col gap-2.5">
              {methods.map((pm, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                    <span className="font-bold text-ink">{humanizeEnum(pm.method)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-primary">{methodsTotal ? Math.round((Number(pm.count) / methodsTotal) * 100) : 0}%</strong>
                    <span className="muted">({pm.count} txns)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Store size={17} color="var(--primary)" /> Top Performing Merchant Stores
          </h3>
          <span className="muted text-xs font-semibold">Ranked by Revenue</span>
        </div>
        {topStores.loading ? (
          <div style={{ padding: 20 }}><Skeleton height={120} /></div>
        ) : topStores.error ? (
          <div style={{ padding: 20 }}><ErrorState message={errorMessage(topStores.error)} onRetry={topStores.reload} /></div>
        ) : !stores.length ? (
          <div style={{ padding: 20 }}><EmptyState title="No store data" message="No store sales in the selected range." /></div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Merchant Store</th>
                  <th>Orders</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((t, i) => (
                  <tr key={t.store_id || i}>
                    <td>
                      <span className="avatar" style={{ width: 26, height: 26, background: i === 0 ? '#fef3c7' : 'var(--bg)', color: i === 0 ? '#d97706' : 'var(--ink)', fontWeight: 800, fontSize: 12 }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-sm text-ink">{t.store_name || '—'}</div>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-ink">{t.orders_count}</span>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-primary">{money(t.revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
