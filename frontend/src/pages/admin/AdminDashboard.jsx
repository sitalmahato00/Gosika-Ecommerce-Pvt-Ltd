import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, ClipboardList, Users, Store, Wallet,
  RefreshCw, Download, ChevronRight, Package,
  ShieldCheck, AlertTriangle, Clock, Truck, ArrowRight,
  TrendingUp, CheckCircle2, RotateCcw
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import PageHeader from '../../components/admin/PageHeader'
import KpiCard from '../../components/admin/KpiCard'
import SalesLineChart from '../../components/admin/charts/SalesLineChart'
import OrderStatusDonut from '../../components/admin/charts/OrderStatusDonut'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'

export default function AdminDashboard() {
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState('30d')

  const [data, setData] = useState({
    summary: null,
    salesTimeline: [],
    ordersByStatus: [],
    recentOrders: [],
    topProducts: [],
    pendingKycCount: 0,
    pendingProductsCount: 0,
    pendingPayoutsCount: 0,
    pendingReturnsCount: 0
  })

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [
        ordersRes,
        summaryRes,
        ordersByStatusRes,
        salesTimelineRes,
        productsRes,
        kycRes,
        payoutsRes,
        returnsRes
      ] = await Promise.allSettled([
        api.get('/admin/orders', { params: { per_page: 6 } }),
        api.get('/admin/analytics/summary', { params: { range: timeframe } }),
        api.get('/admin/analytics/orders-by-status', { params: { range: timeframe } }),
        api.get('/admin/analytics/sales-timeline', { params: { range: timeframe } }),
        api.get('/admin/products', { params: { per_page: 5 } }),
        api.get('/admin/vendors/kyc', { params: { status: 'submitted', per_page: 1 } }),
        api.get('/admin/wallet/payouts', { params: { status: 'pending', per_page: 1 } }),
        api.get('/admin/orders/returns', { params: { status: 'requested', per_page: 1 } })
      ])

      const recentOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.data || []) : []
      const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.data || null) : null
      const ordersByStatus = ordersByStatusRes.status === 'fulfilled' ? (ordersByStatusRes.value.data?.data || []) : []
      const salesTimeline = salesTimelineRes.status === 'fulfilled' ? (salesTimelineRes.value.data?.data || []) : []
      const topProducts = productsRes.status === 'fulfilled' ? (productsRes.value.data?.data || []) : []

      const pendingKycCount = kycRes.status === 'fulfilled'
        ? (kycRes.value.data?.meta?.pagination?.total ?? kycRes.value.data?.data?.length ?? 0)
        : 0

      const pendingPayoutsCount = payoutsRes.status === 'fulfilled'
        ? (payoutsRes.value.data?.meta?.pagination?.total ?? payoutsRes.value.data?.data?.length ?? 0)
        : 0

      const pendingReturnsCount = returnsRes.status === 'fulfilled'
        ? (returnsRes.value.data?.meta?.pagination?.total ?? returnsRes.value.data?.data?.length ?? 0)
        : 0

      setData({
        summary,
        salesTimeline,
        ordersByStatus,
        recentOrders,
        topProducts,
        pendingKycCount,
        pendingProductsCount: summary?.pending_products_count || 0,
        pendingPayoutsCount,
        pendingReturnsCount
      })
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError('Failed to load real-time marketplace analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [timeframe])

  const s = data.summary || {}
  const grossRevenue = Number(s.gross_revenue || s.total_sales || 0)
  const ordersCount = Number(s.orders_count || 0)
  const newCustomers = Number(s.new_customers || 0)
  const activeVendors = Number(s.active_vendors || 0)
  const commissionEarned = Number(s.commission_earned || s.net_revenue || (grossRevenue * 0.1) || 0)

  // Donut chart status mapping
  const statusSegments = useMemo(() => {
    if (!data.ordersByStatus || data.ordersByStatus.length === 0) {
      return []
    }
    return data.ordersByStatus.map(item => ({
      label: item.label || item.status || 'Other',
      status: item.status,
      count: Number(item.count || item.total || 0),
      color: item.color
    }))
  }, [data.ordersByStatus])

  if (error && !data.summary) {
    return (
      <div style={{ padding: 20 }}>
        <ErrorState message={error} onRetry={loadDashboardData} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <PageHeader
        title="Marketplace Overview"
        description="Real-time administrative operations, finance, fulfillment, and moderation."
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="input"
              style={{
                height: 36,
                fontSize: 13,
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: 8,
                background: '#fff',
                borderColor: 'var(--border)',
                cursor: 'pointer'
              }}
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">This Month (30d)</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>

            <button
              className="btn btn-outline btn-sm"
              onClick={loadDashboardData}
              title="Refresh Dashboard"
              style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Top 5 Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KpiCard
          label="Gross Merchandise (GMV)"
          value={money(grossRevenue)}
          sub={timeframe === '30d' ? 'Platform total volume' : `Range: ${timeframe}`}
          Icon={ShoppingBag}
          iconBg="#fee2e2"
          iconColor="#e11d48"
          to="/admin/orders"
        />
        <KpiCard
          label="Total Orders"
          value={ordersCount.toLocaleString()}
          sub="Customer orders placed"
          Icon={ClipboardList}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          to="/admin/orders"
        />
        <KpiCard
          label="Active Vendors"
          value={activeVendors.toLocaleString()}
          sub="Approved storefronts"
          Icon={Store}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          to="/admin/marketplace/vendors"
        />
        <KpiCard
          label="New Customers"
          value={newCustomers.toLocaleString()}
          sub="Registered accounts"
          Icon={Users}
          iconBg="#ffedd5"
          iconColor="#ea580c"
          to="/admin/customers"
        />
        <KpiCard
          label="Commission / Revenue"
          value={money(commissionEarned)}
          sub="Marketplace take rate"
          Icon={Wallet}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
          to="/admin/finance/commissions"
        />
      </div>

      {/* Actionable Operations / Moderation Queues */}
      <div className="card" style={{ padding: '18px 20px', borderRadius: 14, background: '#f8fafc', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
          Action Required & Operations Queue
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {/* Pending KYC */}
          <Link
            to="/admin/marketplace/kyc"
            style={{
              textDecoration: 'none',
              background: '#fff',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Pending KYC</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{data.pendingKycCount}</div>
              </div>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </Link>

          {/* Pending Products */}
          <Link
            to="/admin/marketplace/products"
            style={{
              textDecoration: 'none',
              background: '#fff',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Product Moderation</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{data.pendingProductsCount}</div>
              </div>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </Link>

          {/* Pending Payouts */}
          <Link
            to="/admin/finance/payouts"
            style={{
              textDecoration: 'none',
              background: '#fff',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Pending Payouts</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{data.pendingPayoutsCount}</div>
              </div>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </Link>

          {/* Return Requests */}
          <Link
            to="/admin/orders/returns"
            style={{
              textDecoration: 'none',
              background: '#fff',
              padding: '14px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={18} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Return Requests</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>{data.pendingReturnsCount}</div>
              </div>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </Link>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)', gap: 20 }} id="admin-charts-row">
        <style>{`@media(max-width:980px){#admin-charts-row,#admin-tables-row{grid-template-columns:1fr!important}}`}</style>

        {/* Sales Trend Chart */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: 14 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Gross Revenue Trend</h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '3px 0 0' }}>Aggregated volume for selected timeframe</p>
            </div>
            <Link to="/admin/analytics" className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Full Analytics
            </Link>
          </div>

          <SalesLineChart data={data.salesTimeline} />
        </div>

        {/* Order Status Breakdown */}
        <div className="card" style={{ padding: '22px 24px', borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Orders Distribution</h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '3px 0 0' }}>Current breakdown by lifecycle stage</p>
            </div>
            <Link to="/admin/orders" className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              All Orders
            </Link>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <OrderStatusDonut segments={statusSegments} total={ordersCount} />
          </div>
        </div>
      </div>

      {/* Tables Section: Recent Orders + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20 }} id="admin-tables-row">
        {/* Recent Orders */}
        <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Recent Marketplace Orders</h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '2px 0 0' }}>Latest customer transactions across all vendors</p>
            </div>
            <Link to="/admin/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                      No recent orders recorded.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map(ord => {
                    const customerName = ord.user?.name || ord.user?.first_name ? `${ord.user?.first_name || ''} ${ord.user?.last_name || ''}`.trim() : (ord.customer?.full_name || 'Customer')
                    return (
                      <tr key={ord.id || ord.uuid}>
                        <td>
                          <Link to={`/admin/orders/${ord.uuid || ord.id}`} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
                            #{ord.order_number || ord.id}
                          </Link>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {customerName}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: 13 }}>
                          {money(ord.grand_total || ord.total || 0)}
                        </td>
                        <td>
                          <StatusBadge status={ord.status} />
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {timeAgo(ord.created_at || ord.placed_at)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/admin/orders/${ord.uuid || ord.id}`} className="btn btn-ghost btn-xs">
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link to="/admin/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Manage all marketplace orders <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Top Products */}
        <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Marketplace Products</h3>
              <p style={{ color: 'var(--muted)', fontSize: 12, margin: '2px 0 0' }}>Latest catalog additions & moderation</p>
            </div>
            <Link to="/admin/marketplace/products" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                      No products found in catalog.
                    </td>
                  </tr>
                ) : (
                  data.topProducts.slice(0, 5).map((prod, i) => (
                    <tr key={prod.id || prod.uuid || i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: '#f8fafc',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Package size={16} color="var(--primary)" />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', maxWidth: 160 }} className="truncate" title={prod.name}>
                            {prod.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                        {prod.vendor?.company_name || prod.store?.name || '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13 }}>
                        {money(prod.price || prod.base_price || 0)}
                      </td>
                      <td>
                        <StatusBadge status={prod.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link to="/admin/marketplace/products" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Moderate all products <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
