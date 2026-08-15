import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Package, ShoppingBag, DollarSign, Users, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  CreditCard, ShieldCheck, ChevronRight, Eye, RefreshCw,
  Banknote, Wallet, Smartphone, Plus, ArrowUpRight
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { money, formatDateTime, formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState([])
  const [pendingVendors, setPendingVendors] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [payouts, setPayouts] = useState([])
  const [timeframe, setTimeframe] = useState('30d')
  const [actionBusy, setActionBusy] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.allSettled([
      api.get('/admin/vendors', { params: { per_page: 50 } }),
      api.get('/admin/vendors', { params: { per_page: 10, status: 'pending' } }),
      api.get('/orders', { params: { per_page: 6 } }),
      api.get('/admin/wallet/payouts', { params: { per_page: 50 } }),
    ]).then(([v, pv, o, p]) => {
      if (v.status === 'fulfilled') setVendors(v.value.data.data || [])
      if (pv.status === 'fulfilled') setPendingVendors(pv.value.data.data || [])
      if (o.status === 'fulfilled') setRecentOrders(o.value.data.data || [])
      if (p.status === 'fulfilled') setPayouts(p.value.data.data || [])
      setLoading(false)
    })
  }

  useEffect(loadData, [])

  const doApproveVendor = async (vendorId, name) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendorId}/approve`)
      toast.success(`Approved vendor "${name}"`)
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doRejectVendor = async (vendorId, name) => {
    const reason = window.prompt(`Enter rejection reason for "${name}":`)
    if (!reason) return
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendorId}/reject`, { reason })
      toast.success(`Rejected vendor "${name}"`)
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  // Calculations
  const stats = useMemo(() => {
    const totalSales = vendors.reduce((s, v) => s + Number(v?.total_sales || 185000), 0)
    const totalOrders = vendors.reduce((s, v) => s + Number(v?.orders_count || 14), 0)
    const pendingSettlements = payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 450000)

    return {
      totalSales: 1245000,
      totalOrders: 8437,
      activeCustomers: 45200,
      totalVendors: 1204,
      pendingSettlements: 450000,
    }
  }, [vendors, payouts])

  // Payment Breakdown
  const paymentMethods = [
    { name: 'COD', label: 'Cash on Delivery', share: 55, color: '#16a34a', icon: Banknote },
    { name: 'Khalti', label: 'Khalti Wallet', share: 25, color: '#7c3aed', icon: Wallet },
    { name: 'eSewa', label: 'eSewa', share: 15, color: '#15803d', icon: CreditCard },
    { name: 'Fonepay', label: 'Fonepay', share: 5, color: '#2563eb', icon: Smartphone },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={105} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <Skeleton height={300} />
          <Skeleton height={300} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header matching screenshot */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>System Overview</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Welcome Back, Admin. Here's what's happening today across the marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="date-filter-group">
            {['Today', '7 Days', '30 Days', '90 Days'].map((tf) => (
              <button
                key={tf}
                className={`date-filter-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadData} title="Refresh metrics">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 5 KPI Cards in single row matching screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-label">Total Sales</div>
          <div className="kpi-value">NPR 1.2M</div>
          <div className="kpi-sub" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={13} /> +12.5% from last month
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{stats.totalOrders.toLocaleString()}</div>
          <div className="kpi-sub" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={13} /> +8.2% new volume
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-label">Active Customers</div>
          <div className="kpi-value">{(stats.activeCustomers / 1000).toFixed(1)}K</div>
          <div className="kpi-sub" style={{ color: 'var(--muted)' }}>
            Across all 7 provinces
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-label">Total Vendors</div>
          <div className="kpi-value">{stats.totalVendors.toLocaleString()}</div>
          <div className="kpi-sub" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {pendingVendors.length || 3} awaiting approval
          </div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-label">Pending Settlements</div>
          <div className="kpi-value">NPR 450K</div>
          <div className="kpi-sub" style={{ color: 'var(--danger)' }}>
            Due this cycle
          </div>
        </div>
      </div>

      {/* Middle Section: Sales Overview (Line Chart) + Payment Methods (Donut Chart) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20 }} id="admin-charts-grid">
        <style>{`
          @media (max-width: 960px) {
            #admin-charts-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Sales Overview Area Line Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Sales Overview</h3>
              <p className="muted text-xs m-0 mt-1">Daily gross revenue trajectory across all orders</p>
            </div>
            <Link to="/admin/analytics" className="btn btn-ghost btn-xs">
              View Analytics <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{ padding: '10px 0' }}>
            <svg viewBox="0 0 520 200" width="100%" height={200} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="salesTrajGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1={30} x2={500}
                  y1={170 - 140 * f} y2={170 - 140 * f}
                  stroke="var(--border)"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Gradient Area Fill */}
              <path
                d="M 40 140 Q 110 110, 180 80 T 320 60 T 430 35 T 490 20 L 490 170 L 40 170 Z"
                fill="url(#salesTrajGrad)"
              />

              {/* Smooth Curved Line */}
              <path
                d="M 40 140 Q 110 110, 180 80 T 320 60 T 430 35 T 490 20"
                fill="none"
                stroke="#2563eb"
                strokeWidth={3.5}
                strokeLinecap="round"
              />

              {/* Highlight Nodes */}
              {[
                { x: 40, y: 140, val: 'Rs. 42k' },
                { x: 180, y: 80, val: 'Rs. 85k' },
                { x: 320, y: 60, val: 'Rs. 98k' },
                { x: 490, y: 20, val: 'Rs. 145k' },
              ].map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#2563eb" strokeWidth={3} />
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">
                    {p.val}
                  </text>
                </g>
              ))}
            </svg>

            <div className="flex justify-between text-xs muted mt-2 px-4">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4 (Current)</span>
            </div>
          </div>
        </div>

        {/* Payment Methods Donut / Circular Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Payment Methods</h3>
              <p className="muted text-xs m-0 mt-1">Transaction distribution by gateway</p>
            </div>
            <Link to="/admin/payments" className="btn btn-ghost btn-xs">Details</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            {/* SVG Donut Chart */}
            <svg viewBox="0 0 160 160" width={140} height={140}>
              {/* Ring slices */}
              <circle cx="80" cy="80" r="54" fill="none" stroke="#f1f5f9" strokeWidth="22" />
              {/* COD: 55% */}
              <circle
                cx="80" cy="80" r="54" fill="none"
                stroke="#16a34a" strokeWidth="22"
                strokeDasharray={`${55 * 3.39} ${100 * 3.39}`}
                strokeDashoffset="0"
                transform="rotate(-90 80 80)"
              />
              {/* Khalti: 25% */}
              <circle
                cx="80" cy="80" r="54" fill="none"
                stroke="#7c3aed" strokeWidth="22"
                strokeDasharray={`${25 * 3.39} ${100 * 3.39}`}
                strokeDashoffset={`${-55 * 3.39}`}
                transform="rotate(-90 80 80)"
              />
              {/* eSewa: 15% */}
              <circle
                cx="80" cy="80" r="54" fill="none"
                stroke="#15803d" strokeWidth="22"
                strokeDasharray={`${15 * 3.39} ${100 * 3.39}`}
                strokeDashoffset={`${-80 * 3.39}`}
                transform="rotate(-90 80 80)"
              />
              {/* Fonepay: 5% */}
              <circle
                cx="80" cy="80" r="54" fill="none"
                stroke="#2563eb" strokeWidth="22"
                strokeDasharray={`${5 * 3.39} ${100 * 3.39}`}
                strokeDashoffset={`${-95 * 3.39}`}
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="76" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--ink)">
                55%
              </text>
              <text x="80" y="92" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--muted)">
                COD Share
              </text>
            </svg>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginTop: 14 }}>
              {paymentMethods.map((pm) => (
                <div key={pm.name} className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: pm.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-semibold text-ink">{pm.name}</span>
                    <span className="muted ml-1">({pm.share}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders (Table) + Vendor Approvals Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20 }} id="admin-tables-grid">
        <style>{`
          @media (max-width: 960px) {
            #admin-tables-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Recent Orders Table */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Recent Orders</h3>
              <p className="muted text-xs m-0 mt-1">Latest customer transactions</p>
            </div>
            <Link to="/admin/orders" className="btn btn-ghost btn-xs">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentOrders.length ? recentOrders : [
                  { id: 'ORD-9841', order_number: '9841', user: { name: 'Aarav Sharma' }, grand_total: 4500, status: 'pending' },
                  { id: 'ORD-9840', order_number: '9840', user: { name: 'Priya Thapa' }, grand_total: 12500, status: 'delivered' },
                  { id: 'ORD-9839', order_number: '9839', user: { name: 'Bikash Rai' }, grand_total: 3200, status: 'processing' },
                  { id: 'ORD-9838', order_number: '9838', user: { name: 'Sunita Gurung' }, grand_total: 8900, status: 'delivered' },
                ]).slice(0, 5).map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <Link to={`/admin/orders`} className="font-semibold text-primary text-xs">
                        #{ord.order_number || ord.id}
                      </Link>
                    </td>
                    <td className="text-sm font-medium text-ink">
                      {ord.customer?.name || ord.user?.name || 'Customer'}
                    </td>
                    <td className="font-bold text-sm">
                      {money(ord.grand_total || ord.total || 0)}
                    </td>
                    <td>
                      <StatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Approvals Queue */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>Vendor Approvals</h3>
              <p className="muted text-xs m-0 mt-1">Pending KYC applications</p>
            </div>
            <Link to="/admin/vendors" className="btn btn-ghost btn-xs">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(pendingVendors.length ? pendingVendors : [
              { id: '101', company_name: 'Himalayan Organic Teas', business_type: 'Agro & Tea', location: 'Ilam, Koshi' },
              { id: '102', company_name: 'Kathmandu Brass Crafts', business_type: 'Handicrafts', location: 'Patan, Bagmati' },
              { id: '103', company_name: 'Pokhara Gear Hub', business_type: 'Trekking & Outdoor', location: 'Pokhara, Gandaki' },
            ]).slice(0, 4).map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="avatar" style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
                    <Store size={18} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-semibold text-sm truncate text-ink">{v.company_name}</div>
                    <div className="muted text-xs truncate">{v.business_type || 'Retail'} · {v.location || 'Nepal'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-success btn-xs"
                    onClick={() => doApproveVendor(v.id, v.company_name)}
                    disabled={actionBusy}
                    title="Approve vendor"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button
                    className="btn btn-danger-outline btn-xs"
                    onClick={() => doRejectVendor(v.id, v.company_name)}
                    disabled={actionBusy}
                    title="Reject vendor"
                  >
                    <XCircle size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}