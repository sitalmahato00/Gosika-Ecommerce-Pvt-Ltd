import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitBranch, ShoppingBag, PackageCheck, Navigation, AlertTriangle,
  Banknote, Download, RefreshCw, Store, Eye,
} from 'lucide-react'
import api from '../../api/client'
import PortalHeader from '../../components/admin/PortalHeader'
import KpiCard from '../../components/admin/KpiCard'
import StatusOrderTable from '../../components/admin/StatusOrderTable'
import { money, timeAgo } from '../../utils/format'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const KPI_STYLE = {
  total: { bg: '#fff0e6', fg: '#ff5500' },
  active: { bg: '#e6f0fa', fg: '#2563eb' },
  transit: { bg: '#f3e8ff', fg: '#9333ea' },
  attention: { bg: '#ffebeb', fg: '#e11d48' },
  gmv: { bg: '#e6f7ec', fg: '#16a34a' },
}

export default function AdminOrderSplit() {
  const toast = useToast()
  const { user } = useAuth()
  const branding = useBranding()
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [lastSync, setLastSync] = useState(null)

  const loadSplit = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/admin/orders/split', { params: { per_page: 50 } })
      setOrders(api.unwrapList(res.data))
      setSummary(res.data?.meta?.summary || null)
      setTotal(res.data?.meta?.pagination?.total ?? api.unwrapList(res.data).length)
      setLastSync(new Date())
      return api.unwrapList(res.data)
    } catch (err) {
      toast.error('Failed to load vendor split orders.')
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSplit()
  }, [loadSplit])

  const exportCSV = () => {
    const columns = [
      { label: 'Order #' },
      { label: 'Customer' },
      { label: 'Customer Phone' },
      { label: 'Stores / Packages' },
      { label: 'Payment Method' },
      { label: 'Payment Status' },
      { label: 'Fulfillment Status' },
      { label: 'Grand Total', align: 'right' },
      { label: 'Placed At' },
    ]
    const rows = orders.map((o) => {
      const customer = customerName(o)
      const stores = (o.vendor_orders || []).map((v) => v.store_name || v.vendor_name).filter(Boolean).join(' / ')
      return [
        o.order_number || o.id,
        customer,
        o.customer?.phone || '',
        stores,
        o.payment_method || 'COD',
        o.payment_status || 'pending',
        o.status || 'pending',
        money(o.grand_total),
        timeAgo(o.placed_at || o.created_at),
      ]
    })
    exportReportFromRows({
      columns,
      rows,
      title: 'Vendor Split Orders Report',
      subtitle: 'Single checkouts fulfilled by two or more stores — per-store packages, payment and fulfilment status.',
      sectionLabel: 'Multi-Vendor Orders',
      fileName: `gosika_split_orders_${new Date().toISOString().slice(0, 10)}`,
      rangeLabel: 'All time',
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Split orders exported as branded report.')
  }

  const customerName = (o) =>
    o.customer?.full_name ||
    [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(' ') ||
    o.customer?.name ||
    o.user?.name ||
    'Customer'

  const columns = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (r) => (
        <Link
          to={`/admin/orders/${r.id}`}
          style={{ color: '#ff5500', fontWeight: 800, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          #{r.order_number || r.id}
        </Link>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{customerName(r)}</div>
          {r.customer?.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.customer.phone}</div>}
        </div>
      ),
    },
    {
      key: 'stores',
      label: 'Stores / Packages',
      render: (r) => {
        const packages = r.vendor_orders || []
        if (!packages.length) {
          return <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{packages.length === 0 ? '—' : `${packages.length} store`}</span>
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {packages.slice(0, 2).map((v) => (
              <span key={v.id || v.store_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                <Store size={11} color="#ff5500" /> {v.store_name || v.vendor_name || 'Store'}
              </span>
            ))}
            {packages.length > 2 && (
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                +{packages.length - 2} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>
            {(r.payment_method || 'COD').toUpperCase()}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: r.payment_status === 'paid' ? '#16a34a' : '#64748b' }}>
            {(r.payment_status || 'pending').replace(/[_-]+/g, ' ').toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Fulfillment',
      render: (r, badge) => (
        <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-block', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
          {String(r.status).replace(/[_-]+/g, ' ')}
        </span>
      ),
    },
    {
      key: 'grand_total',
      label: 'Grand Total',
      render: (r) => <span style={{ fontWeight: 900, color: '#0f172a', fontSize: 13.5, whiteSpace: 'nowrap' }}>{money(r.grand_total)}</span>,
    },
    {
      key: 'placed',
      label: 'Placed',
      render: (r) => <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{timeAgo(r.placed_at || r.created_at)}</span>,
    },
    {
      key: 'action',
      label: '',
      render: (r) => (
        <Link
          to={`/admin/orders/${r.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', background: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          <Eye size={12} color="#ff5500" /> View
        </Link>
      ),
    },
  ]

  const searchKeys = [
    (r) => r.order_number || '',
    (r) => customerName(r),
    (r) => (r.vendor_orders || []).map((v) => v.store_name || v.vendor_name || '').join(' '),
    (r) => r.payment_method || '',
    (r) => r.payment_status || '',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <PortalHeader
        icon={GitBranch}
        title="Vendor Split Orders"
        subtitle="Single checkouts fulfilled by two or more stores — monitor multi-package orders, per-store risk, and fulfilment progress."
        pill={<span style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>Super Admin</span>}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <Download size={14} color="#ff5500" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => { loadSplit(true); toast.success('Split orders refreshed.') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <RefreshCw size={14} color="#ff5500" /> Refresh
            </button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="sp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:1120px){.sp-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:768px){.sp-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.sp-grid{grid-template-columns:1fr!important}}`}</style>

        <KpiCard label="Total Split Orders" value={summary ? String(summary.total).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—'} sub={summary ? `${summary.avg_packages} packages/order avg` : 'Loading…'} Icon={ShoppingBag} iconBg={KPI_STYLE.total.bg} iconColor={KPI_STYLE.total.fg} />
        <KpiCard label="Awaiting Fulfillment" value={summary ? String(summary.active).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—'} sub={summary?.total ? `${total && summary.total ? Math.round((summary.active / summary.total) * 100) : 0}% of split volume` : undefined} Icon={PackageCheck} iconBg={KPI_STYLE.active.bg} iconColor={KPI_STYLE.active.fg} />
        <KpiCard label="In Transit" value={summary ? String(summary.transit).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—'} sub={summary?.total ? `${Math.round((summary.transit / summary.total) * 100)}% of split volume` : undefined} Icon={Navigation} iconBg={KPI_STYLE.transit.bg} iconColor={KPI_STYLE.transit.fg} />
        <KpiCard label="Needs Attention" value={summary ? String(summary.needs_attention).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '—'} subUp={false} sub={summary?.needs_attention ? `${summary.needs_attention} payment/cancel flags` : 'All clear'} Icon={AlertTriangle} iconBg={KPI_STYLE.attention.bg} iconColor={KPI_STYLE.attention.fg} />
        <KpiCard label="Split GMV" value={summary ? money(summary.gmv) : '—'} sub={summary?.total ? `across ${summary.total} split orders` : undefined} Icon={Banknote} iconBg={KPI_STYLE.gmv.bg} iconColor={KPI_STYLE.gmv.fg} />
      </div>

      {/* Records table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '16px 18px 2px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Multi-Vendor Orders</div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600 }}>
            {loading ? 'Loading latest split orders…' : lastSync ? `Live · refreshed ${timeAgo(lastSync.toISOString())}` : ''} · {total > 50 ? `showing latest ${orders.length} of ${total}` : `${orders.length} records`}
          </div>
        </div>
        <StatusOrderTable
          columns={columns}
          rows={orders}
          getStatus={(r) => r.status || 'pending'}
          statusFilter={filter}
          onStatusFilter={setFilter}
          searchPlaceholder="Search order #, customer, store, payment…"
          searchKeys={searchKeys}
          perPage={8}
          rowKey={(r) => r.id}
          emptyText="No split orders match your filters. Orders with 2+ stores appear here."
        />
      </div>
    </div>
  )
}