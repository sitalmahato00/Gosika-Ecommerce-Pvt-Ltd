import React, { useCallback, useEffect, useState } from 'react'
import {
  FileBarChart, Download, RefreshCw, ShoppingBag, DollarSign, Percent,
  Users, Store, Truck, RotateCcw, TrendingUp, Layers, MapPin, CreditCard, CalendarRange, ChevronDown,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import PortalHeader from '../../components/admin/PortalHeader'
import FluidLineChart from '../../components/admin/charts/fx/FluidLineChart'
import { money, humanizeEnum, errorMessage } from '../../utils/format'
import { exportReport, companyFromBranding, personLabel } from '../../utils/reportExport'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

const pct = (part, total) => (total ? `${((Number(part) / total) * 100).toFixed(1)}%` : '0.0%')

const fdate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
const rangeWindow = (range) => {
  const to = new Date()
  const from = new Date()
  if (range === '7d') from.setDate(to.getDate() - 6)
  else if (range === '30d') from.setDate(to.getDate() - 29)
  else if (range === '90d') from.setDate(to.getDate() - 89)
  else { from.setMonth(0); from.setDate(1) }
  return { from: fdate(from), to: fdate(to) }
}

const EXPORT_SCOPES = [
  { value: 'all', label: 'Complete Report (All Sections)' },
  { value: 'overview', label: 'Sales Summary (KPI Overview)' },
  { value: 'timeline', label: 'Sales Trend' },
  { value: 'status', label: 'Orders by Status' },
  { value: 'methods', label: 'Payment Methods' },
  { value: 'stores', label: 'Top Merchant Stores' },
  { value: 'categories', label: 'Category Revenue Share' },
  { value: 'provinces', label: 'Province Performance' },
]

export default function AdminPerformanceReports() {
  const toast = useToast()
  const { user } = useAuth()
  const branding = useBranding()
  const [range, setRange] = useState('30d')
  const [exportScope, setExportScope] = useState('all')
  const [fromDate, setFromDate] = useState(() => rangeWindow('30d').from)
  const [toDate, setToDate] = useState(() => rangeWindow('30d').to)

  useEffect(() => {
    const win = rangeWindow(range)
    setFromDate(win.from)
    setToDate(win.to)
  }, [range])

  const summary = useApi(() => api.get('/admin/analytics/summary', { params: { range } }), { deps: [range], cacheKey: `ar_summary_${range}` })
  const timeline = useApi(() => api.get('/admin/analytics/sales-timeline', { params: { range } }), { deps: [range], cacheKey: `ar_timeline_${range}` })
  const ordersByStatus = useApi(() => api.get('/admin/analytics/orders-by-status', { params: { range } }), { deps: [range], cacheKey: `ar_obs_${range}` })
  const paymentMethods = useApi(() => api.get('/admin/analytics/payment-methods', { params: { range } }), { deps: [range], cacheKey: `ar_pm_${range}` })
  const topStores = useApi(() => api.get('/admin/analytics/top-stores', { params: { range } }), { deps: [range], cacheKey: `ar_ts_${range}` })
  const categoryShare = useApi(() => api.get('/admin/analytics/category-share', { params: { range } }), { deps: [range], cacheKey: `ar_cs_${range}` })
  const provinces = useApi(() => api.get('/admin/analytics/provinces', { params: { range } }), { deps: [range], cacheKey: `ar_prov_${range}` })

  const s = summary.data || {}
  const statusList = ordersByStatus.data || []
  const methods = paymentMethods.data || []
  const stores = topStores.data || []
  const categories = categoryShare.data || []
  const provList = provinces.data || []
  const trend = timeline.data || []

  const totalOrders = statusList.reduce((t, o) => t + (Number(o.count) || 0), 0)
  const methodOrders = methods.reduce((t, m) => t + (Number(m.count) || 0), 0)
  const categoryValue = categories.reduce((t, c) => t + (Number(c.amount) || 0), 0)
  const provinceValue = provList.reduce((t, p) => t + (Number(p.revenue) || 0), 0)
  const storeValue = stores.reduce((t, st) => t + (Number(st.revenue) || 0), 0)

  const rangeLabel = (RANGES.find((r) => r.value === range) || {}).label || 'All time'
  const rangeShort = range === 'year' ? 'Year' : range.toUpperCase()

  const kpis = [
    { label: 'Gross Revenue', value: money(s.gross_revenue), Icon: DollarSign, bg: '#fff0e6', fg: '#ff5500' },
    { label: 'Orders Placed', value: (s.orders_count ?? 0).toLocaleString(), Icon: ShoppingBag, bg: '#e6f0fa', fg: '#2563eb' },
    { label: 'Avg Order Value', value: money(s.avg_order_value), Icon: TrendingUp, bg: '#e6f7ec', fg: '#16a34a' },
    { label: 'Commission Earned', value: money(s.commission_total), Icon: Percent, bg: '#fef3c7', fg: '#d97706' },
    { label: 'New Customers', value: (s.new_customers ?? 0).toLocaleString(), Icon: Users, bg: '#f3e8ff', fg: '#9333ea' },
    { label: 'Active Vendors', value: (s.active_vendors ?? 0).toLocaleString(), Icon: Store, bg: '#fce7f3', fg: '#db2777' },
    { label: 'Delivery Fees', value: money(s.delivery_fees), Icon: Truck, bg: '#e0f2fe', fg: '#0284c7' },
    { label: 'Refunds', value: money(s.refunds_total), Icon: RotateCcw, bg: '#ffe4e6', fg: '#e11d48' },
  ]

  const buildSections = useCallback(() => {
    const summaryRows = [
      ['Metric', 'Value', 'Detail'],
      ['Gross Revenue', s.gross_revenue || '0', 'Total order value'],
      ['Orders Placed', s.orders_count ?? 0, 'Orders in period'],
      ['Average Order Value', s.avg_order_value || '0', 'Per order average'],
      ['Commission Total', s.commission_total || '0', 'Platform commission'],
      ['New Customers', s.new_customers ?? 0, 'New accounts'],
      ['Active Vendors', s.active_vendors ?? 0, 'Approved merchants'],
      ['Delivery Fees', s.delivery_fees || '0', 'Charges collected'],
      ['Refunds Total', s.refunds_total || '0', 'Refunds issued'],
      ['Payouts Total', s.payouts_total || '0', 'Paid seller payouts'],
    ]

    const statusRows = statusList.map((o) => [humanizeEnum(o.status), o.count ?? 0, pct(o.count, totalOrders)])

    const methodRows = methods.map((m) => [humanizeEnum(m.method), m.count ?? 0, money(m.amount), pct(m.count, methodOrders)])

    const storeRows = stores.map((st, i) => [i + 1, st.store_name || '—', st.orders_count ?? 0, money(st.revenue), pct(st.revenue, storeValue)])

    const categoryRows = categories.map((c) => [c.category, money(c.amount), `${c.share}%`, pct(c.amount, categoryValue)])

    const provinceRows = provList.map((p) => [p.province, p.orders_count ?? 0, money(p.revenue), pct(p.revenue, provinceValue)])

    const trendRows = trend.map((t) => [t.label, money(t.value || t.revenue)])

    return {
      overview: {
        heading: 'Sales Summary (KPI Overview)',
        columns: [{ label: 'Metric' }, { label: 'Value', align: 'right' }, { label: 'Detail' }],
        rows: summaryRows,
      },
      timeline: { heading: 'Sales Trend', columns: [{ label: 'Period' }, { label: 'Revenue', align: 'right' }], rows: trendRows },
      status: { heading: 'Orders by Status', columns: [{ label: 'Status' }, { label: 'Count', align: 'right' }, { label: 'Share', align: 'right' }], rows: statusRows },
      methods: { heading: 'Payment Methods', columns: [{ label: 'Method' }, { label: 'Transactions', align: 'right' }, { label: 'Amount', align: 'right' }, { label: 'Share', align: 'right' }], rows: methodRows },
      stores: { heading: 'Top Merchant Stores', columns: [{ label: 'Rank', align: 'right' }, { label: 'Store' }, { label: 'Orders', align: 'right' }, { label: 'Revenue', align: 'right' }, { label: 'Share', align: 'right' }], rows: storeRows },
      categories: { heading: 'Category Revenue Share', columns: [{ label: 'Category' }, { label: 'Amount', align: 'right' }, { label: 'Share %', align: 'right' }, { label: 'Contribution', align: 'right' }], rows: categoryRows },
      provinces: { heading: 'Province Performance', columns: [{ label: 'Province' }, { label: 'Orders', align: 'right' }, { label: 'Revenue', align: 'right' }, { label: 'Share', align: 'right' }], rows: provinceRows },
    }
  }, [s, statusList, totalOrders, methods, methodOrders, stores, storeValue, categories, categoryValue, provList, provinceValue, trend])

  const buildExport = useCallback((scope = 'all', fromIso, toIso) => {
    const sections = buildSections()
    const fileName = scope === 'all'
      ? `gosika_performance_report_${fromIso}_${toIso}`
      : `gosika_report_${scope}_${fromIso}_${toIso}`
    return {
      title: 'Platform Performance Report',
      subtitle: `Consolidated operational report for ${branding.brand_name || 'GOSIKA'} — ${fmtDate(fromIso)} to ${fmtDate(toIso)}.`,
      rangeLabel: `${fmtDate(fromIso)} – ${fmtDate(toIso)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
      fileName,
      sections: scope === 'all' ? Object.values(sections) : [sections[scope]],
    }
  }, [buildSections, branding, user])

  const handleExport = () => {
    try {
      if (fromDate && toDate && fromDate > toDate) {
        toast.error('"From" date must be on or before "To" date.')
        return
      }
      const cfg = buildExport(exportScope, fromDate, toDate)
      exportReport(cfg)
      toast.success(
        exportScope === 'all'
          ? `Performance report exported (${fmtDate(fromDate)} – ${fmtDate(toDate)}).`
          : `${(EXPORT_SCOPES.find((s) => s.value === exportScope) || {}).label} exported (${fmtDate(fromDate)} – ${fmtDate(toDate)}).`
      )
    } catch (e) {
      toast.error('Failed to export report.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <PortalHeader
        icon={FileBarChart}
        title="Performance Reports"
        subtitle="Consolidated, board-ready performance reports across sales, fulfilment, payments, merchants and geography."
        pill={<span style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>Super Admin</span>}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontWeight: 700, fontSize: 11.5, cursor: 'pointer',
                    background: range === r.value ? '#ff5500' : 'transparent',
                    color: range === r.value ? '#fff' : '#475569', border: 'none',
                  }}
                >
                  {r.value === 'year' ? 'Year' : r.value.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <FileBarChart size={13} color="#ff5500" />
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 700, color: '#0f172a', cursor: 'pointer', appearance: 'none', paddingRight: 16 }}
                  title="Report to export"
                >
                  {EXPORT_SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} color="#94a3b8" style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
              </div>
              <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CalendarRange size={13} color="#94a3b8" />
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}
                  title="Period start"
                />
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>–</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}
                  title="Period end"
                />
              </div>
            </div>

            <button type="button" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ff5500', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12.5, fontWeight: 800, color: '#fff', cursor: 'pointer', boxShadow: '0 6px 16px -6px rgba(255,85,0,0.6)' }}>
              <Download size={14} /> Export Report
            </button>
            <button
              type="button"
              onClick={async () => { await summary.reload(); toast.success('Report data refreshed.') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              title="Refresh all report data"
            >
              <RefreshCw size={14} color="#ff5500" />
            </button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="pr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0,1fr))', gap: 12 }}>
        <style>{`@media(max-width:1200px){.pr-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}@media(max-width:700px){.pr-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}`}</style>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: k.bg, color: k.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.Icon size={15} />
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }} className="truncate">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Sales trend */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={17} color="#ff5500" /> Sales Trend — {rangeLabel}
          </div>
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600 }}>{trend.length} buckets</span>
        </div>
        <div style={{ height: 250 }}>
          {timeline.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Loading trend…</div>
          ) : trend.length ? (
            <FluidLineChart labels={trend.map((p) => p.label)} values={trend.map((p) => Number(p.value ?? p.revenue ?? 0))} formatValue={(v, short) => money(short ? Math.round(v) : v, { decimals: 0 })} height={250} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>No sales data for {rangeLabel}.</div>
          )}
        </div>
      </div>

      {/* Report sections */}
      <div className="pr-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:980px){.pr-2col{grid-template-columns:1fr!important}}`}</style>

        <ReportSection
          icon={ShoppingBag}
          title={`Orders by Status — ${rangeShort}`}
          trailing={<span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 700 }}>{totalOrders} orders</span>}
          loading={ordersByStatus.loading}
          error={ordersByStatus.error}
          reload={ordersByStatus.reload}
          columns={['Status', 'Count', 'Share']}
          rows={statusList.map((o) => [humanizeEnum(o.status), String(o.count ?? 0), pct(o.count, totalOrders)])}
          alignRight={[false, true, true]}
        />

        <ReportSection
          icon={MapPin}
          title={`Province Performance — ${rangeShort}`}
          trailing={<span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 700 }}>{provList.length} provinces</span>}
          loading={provinces.loading}
          error={provinces.error}
          reload={provinces.reload}
          columns={['Province', 'Orders', 'Revenue']}
          rows={provList.map((p) => [p.province, String(p.orders_count ?? 0), money(p.revenue)])}
          alignRight={[false, true, true]}
        />

        <ReportSection
          icon={CreditCard}
          title={`Payment Methods — ${rangeShort}`}
          trailing={<span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 700 }}>{methodOrders} txns</span>}
          loading={paymentMethods.loading}
          error={paymentMethods.error}
          reload={paymentMethods.reload}
          columns={['Method', 'Transactions', 'Amount']}
          rows={methods.map((m) => [humanizeEnum(m.method), String(m.count ?? 0), money(m.amount)])}
          alignRight={[false, true, true]}
        />

        <ReportSection
          icon={Layers}
          title={`Category Revenue Share — ${rangeShort}`}
          trailing={<span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 700 }}>Top {categories.length}</span>}
          loading={categoryShare.loading}
          error={categoryShare.error}
          reload={categoryShare.reload}
          columns={['Category', 'Amount', 'Share']}
          rows={categories.map((c) => [c.category, money(c.amount), `${c.share}%`])}
          alignRight={[false, true, true]}
        />
      </div>

      {/* Top stores */}
      <ReportSection
        icon={Store}
        title={`Top Performing Merchant Stores — ${rangeShort}`}
        trailing={<span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 700 }}>Ranked by revenue</span>}
        loading={topStores.loading}
        error={topStores.error}
        reload={topStores.reload}
        columns={['#', 'Store', 'Orders', 'Revenue', 'Share']}
        rows={stores.map((st, i) => [String(i + 1), st.store_name || '—', String(st.orders_count ?? 0), money(st.revenue), pct(st.revenue, storeValue)])}
        alignRight={[true, false, true, true, true]}
      />
    </div>
  )
}

function ReportSection({ icon: Icon, title, trailing, columns, rows, alignRight = [], loading, error, reload }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #eef2f7' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && <Icon size={16} color="#ff5500" />} {title}
        </div>
        {trailing}
      </div>
      {loading ? (
        <div style={{ padding: '26px 18px', color: '#94a3b8', fontSize: 12.5, fontWeight: 600 }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: '26px 18px', fontSize: 12.5, fontWeight: 600 }}>
          <span style={{ color: '#e11d48' }}>Failed to load.</span>{' '}
          <button type="button" onClick={() => reload()} style={{ color: '#ff5500', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }}>Retry</button>
        </div>
      ) : !rows.length ? (
        <div style={{ padding: '30px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5, fontWeight: 600 }}>No records for this period.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#fafbfc', color: '#64748b', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {columns.map((c, i) => (
                  <th key={c} style={{ padding: '9px 16px', fontWeight: 800, textAlign: alignRight[i] ? 'right' : 'left', whiteSpace: 'nowrap' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderTop: '1px solid #f1f5f9' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '10px 16px', textAlign: alignRight[ci] ? 'right' : 'left', color: '#334155', fontWeight: ci === 0 ? 600 : 500, whiteSpace: 'nowrap' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}