import React, { useState } from 'react'
import {
  TrendingUp, ShoppingBag, Receipt, Package, Percent, Truck, RotateCcw,
  Wallet, BarChart3, Download, Layers
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, apiImage, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'year', label: 'Year' },
]

function BarChart({ data, format }) {
  const values = data.map((d) => Number(d.value) || 0)
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-3" style={{ height: 230, padding: '20px 8px 0' }}>
      {data.map((d) => {
        const val = Number(d.value) || 0
        const heightPct = Math.max((val / max) * 100, 4)
        return (
          <div key={d.label} className="flex flex-col items-center gap-2" style={{ flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end' }}>
            <span className="muted text-xs font-semibold" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
              {format ? format(val) : val}
            </span>
            <div
              title={`${d.label}: ${val}`}
              className="bar"
              style={{
                width: '65%',
                maxWidth: 48,
                height: `${heightPct}%`,
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.3s ease',
              }}
            />
            <span className="text-xs font-semibold text-ink">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function VendorAnalytics() {
  const toast = useToast()
  const [range, setRange] = useState('30d')

  const summary = useApi(() => api.get('/vendor/analytics/summary', { params: { range } }), { deps: [range] })
  const revenueTrend = useApi(() => api.get('/vendor/analytics/revenue-trend', { params: { range } }), { deps: [range] })
  const ordersByStatus = useApi(() => api.get('/vendor/analytics/orders-by-status', { params: { range } }), { deps: [range] })
  const topProductsApi = useApi(() => api.get('/vendor/analytics/top-products', { params: { range } }), { deps: [range] })
  const categoryShare = useApi(() => api.get('/vendor/analytics/category-share', { params: { range } }), { deps: [range] })

  const s = summary.data || {}
  const trend = revenueTrend.data || []
  const statusList = ordersByStatus.data || []
  const topProducts = topProductsApi.data || []
  const categories = categoryShare.data || []
  const maxStatusCount = Math.max(...statusList.map((o) => Number(o.count) || 0), 1)
  const totalCat = categories.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0)

  const kpis = [
    { label: 'Gross Revenue', icon: TrendingUp, value: money(s.revenue), sub: 'Total store sales', color: 'var(--primary)' },
    { label: 'Total Orders', icon: ShoppingBag, value: Number(s.orders_count || 0).toLocaleString(), sub: `${Number(s.order_completed || 0).toLocaleString()} completed`, color: '#10b981' },
    { label: 'Avg. Order Value', icon: Receipt, value: money(s.avg_order_value), sub: 'Average basket size', color: '#f59e0b' },
    { label: 'Products Sold', icon: Package, value: Number(s.products_sold || 0).toLocaleString(), sub: 'Units sold in range', color: '#8b5cf6' },
    { label: 'Commission Charged', icon: Percent, value: money(s.commission_total), sub: 'Platform commission', color: '#ef4444' },
    { label: 'Delivery Fees', icon: Truck, value: money(s.delivery_fees), sub: 'Delivery charges collected', color: '#0284c7' },
    { label: 'Refunds Total', icon: RotateCcw, value: money(s.refunds_total), sub: 'Refunds issued', color: '#d97706' },
    { label: 'Net Earnings', icon: Wallet, value: money(s.net_earnings), sub: 'Revenue after commission & refunds', color: '#10b981' },
  ]

  const exportReport = () => {
    const rows = [
      ['Period', 'Metric', 'Value'],
      [range, 'Gross Revenue', s.revenue],
      [range, 'Total Orders', s.orders_count],
      [range, 'Avg Order Value', s.avg_order_value],
      [range, 'Products Sold', s.products_sold],
      [range, 'Commission Total', s.commission_total],
      [range, 'Delivery Fees', s.delivery_fees],
      [range, 'Refunds Total', s.refunds_total],
      [range, 'Net Earnings', s.net_earnings],
      [range, 'Orders Completed', s.order_completed],
      [],
      ['Status', 'Count'],
      ...statusList.map((o) => [o.status, o.count]),
      [],
      ['Product', 'Category', 'Units Sold', 'Revenue'],
      ...topProducts.map((p) => [p.name, p.category, p.units_sold, p.revenue]),
      [],
      ['Category', 'Revenue'],
      ...categories.map((c) => [c.label, c.revenue]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Performance analytics exported')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Sales Analytics & Growth Performance</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor real-time revenue velocity, top converting catalog products, and regional sales distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportReport}>
            <Download size={13} /> Export Report
          </button>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`tab ${range === r.value ? 'active' : ''}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary.loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={104} />)}
        </div>
      ) : summary.error ? (
        <div style={{ marginBottom: 18 }}>
          <ErrorState message={errorMessage(summary.error)} onRetry={summary.reload} />
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
          {kpis.map((kp) => (
            <div key={kp.label} className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>{kp.label}</span>
                <span className="avatar" style={{ width: 34, height: 34, background: 'var(--bg)', color: kp.color }}>
                  <kp.icon size={17} />
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{kp.value}</div>
              <div className="muted text-xs mt-1">{kp.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '20px 24px', marginBottom: 18 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <BarChart3 size={17} color="var(--primary)" /> Revenue Growth Overview
            </h3>
            <span className="muted text-xs">Gross sales figures in Nepali Rupees (NPR) for the selected timeframe</span>
          </div>
          <span className="muted text-xs font-semibold">{trend.length} points</span>
        </div>
        {revenueTrend.loading ? (
          <Skeleton height={230} />
        ) : revenueTrend.error ? (
          <ErrorState message={errorMessage(revenueTrend.error)} onRetry={revenueTrend.reload} />
        ) : trend.length ? (
          <BarChart data={trend} format={(v) => `Rs ${Number(v).toLocaleString('en-IN')}`} />
        ) : (
          <EmptyState icon={BarChart3} title="No revenue data" message="No sales recorded in the selected timeframe." />
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Package size={16} color="var(--primary)" /> Best Performing Products
            </h3>
            <span className="muted text-xs">Top 5 by revenue</span>
          </div>

          {topProductsApi.loading ? (
            <div style={{ padding: 18 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : topProductsApi.error ? (
            <div style={{ padding: 18 }}>
              <ErrorState message={errorMessage(topProductsApi.error)} onRetry={topProductsApi.reload} />
            </div>
          ) : !topProducts.length ? (
            <div style={{ padding: 18 }}>
              <EmptyState icon={Package} title="No product sales" message="Your top selling products will appear here once orders are placed." />
            </div>
          ) : (
            <div style={{ padding: '4px 18px 12px' }}>
              {topProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <img
                    src={apiImage(p.image)}
                    alt={p.name}
                    style={{ width: 46, height: 46, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-ink truncate" style={{ fontSize: 13 }}>{p.name}</div>
                    <div className="muted text-xs mt-0.5">{p.category || '—'} · <strong>{Number(p.units_sold || 0).toLocaleString()}</strong> units sold</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-sm text-ink">{money(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
              <Layers size={16} color="var(--primary)" /> Sales by Category
            </h3>
            {categoryShare.loading ? (
              <Skeleton height={160} />
            ) : categoryShare.error ? (
              <ErrorState message={errorMessage(categoryShare.error)} onRetry={categoryShare.reload} />
            ) : !categories.length ? (
              <EmptyState icon={Layers} title="No category data" message="Category revenue will appear here once orders are placed." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categories.map((c) => {
                  const val = Number(c.revenue || 0)
                  const pct = totalCat ? Math.round((val / totalCat) * 100) : 0
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-ink">{c.label}</span>
                        <span className="muted text-xs font-semibold">{money(val)} · {pct}%</span>
                      </div>
                      <div className="progress" style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
              <ShoppingBag size={16} color="var(--primary)" /> Orders by Status
            </h3>
            {ordersByStatus.loading ? (
              <Skeleton height={160} />
            ) : ordersByStatus.error ? (
              <ErrorState message={errorMessage(ordersByStatus.error)} onRetry={ordersByStatus.reload} />
            ) : !statusList.length ? (
              <EmptyState icon={ShoppingBag} title="No orders" message="No orders recorded in the selected range." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {statusList.map((o) => (
                  <div key={o.status}>
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={o.status} />
                      <span className="muted text-xs font-semibold">{Number(o.count || 0).toLocaleString()} orders</span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((Number(o.count || 0) / maxStatusCount) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
