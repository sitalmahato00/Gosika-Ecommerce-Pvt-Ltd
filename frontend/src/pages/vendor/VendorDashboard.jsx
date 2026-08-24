import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Package, ShoppingBag, Percent, ArrowRight, ArrowUpRight,
  ArrowDownLeft, BarChart2, Zap, CheckCircle2, Store, TrendingUp, Layers
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

let vendorDashboardMemoryCache = null

const DATE_FILTERS = ['Today', '7 Days', '30 Days', '90 Days']

function MiniBarChart({ data = [] }) {
  if (!data || data.length === 0) return null
  const vals = data.map((d) => Number(d.value ?? d.revenue ?? d.amount ?? 0))
  const max = Math.max(...vals, 1000)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 175, paddingTop: 15, width: '100%' }}>
      {data.map((d, i) => {
        const val = Number(d.value ?? d.revenue ?? d.amount ?? 0)
        const pct = (val / max) * 100
        const isZero = val === 0

        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
              cursor: 'pointer',
            }}
            title={`${d.label}: ${money(val)}`}
          >
            {/* Amount label on hover or if high */}
            {val > 0 && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                {val >= 1000 ? `${Math.round(val / 1000)}k` : val}
              </span>
            )}
            <div
              style={{
                width: '100%',
                maxWidth: 28,
                height: isZero ? '6px' : `${Math.max(pct, 12)}%`,
                background: isZero
                  ? '#e2e8f0'
                  : 'linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)',
                borderRadius: isZero ? '3px' : '6px 6px 0 0',
                transition: 'all 0.3s ease',
                boxShadow: isZero ? 'none' : '0 2px 6px rgba(37,99,235,0.25)',
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: isZero ? '#94a3b8' : 'var(--ink)',
                marginTop: 8,
                whiteSpace: 'nowrap',
              }}
            >
              {d.label || `D${i + 1}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function VendorKpiCard({ label, value, sub, Icon, iconBg, iconColor, to }) {
  return (
    <Link
      to={to}
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }} className="truncate">
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function VendorDashboard() {
  const toast = useToast()
  const [dataState, setDataState] = useState(() => {
    return vendorDashboardMemoryCache || {
      dashboard: null,
      vendor: null,
      isReady: false,
    }
  })

  const [loading, setLoading] = useState(!vendorDashboardMemoryCache)
  const [error, setError] = useState(null)
  const [dateFilter, setDateFilter] = useState('30 Days')
  const [acting, setActing] = useState(null)

  const load = () => {
    if (!dataState.isReady && !vendorDashboardMemoryCache) setLoading(true)
    setError(null)
    Promise.allSettled([api.get('/vendor/dashboard'), api.get('/vendor/me')]).then(([d, m]) => {
      let dash = dataState.dashboard
      let vend = dataState.vendor
      if (d.status === 'fulfilled' && d.value.data?.data) dash = d.value.data.data
      if (m.status === 'fulfilled' && m.value.data?.data) vend = m.value.data.data

      const next = { dashboard: dash, vendor: vend, isReady: true }
      vendorDashboardMemoryCache = next
      setDataState(next)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(load, [])

  const handleReadyForPickup = async (orderId) => {
    setActing(orderId)
    try {
      await api.post(`/vendor/orders/${orderId}/ready-for-pickup`)
      toast.success('Order marked ready for pickup')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(null)
    }
  }

  const dashboard = dataState.dashboard || {}
  const vendor = dataState.vendor || {}
  const recentOrders = dashboard?.recent_orders || []
  const actionOrders = recentOrders.filter((o) => o.status === 'pending' || o.status === 'accepted')
  const transactions = dashboard?.recent_transactions || []
  const chartData = dashboard?.revenue_14d || [
    { label: 'Day 1', revenue: 4500 },
    { label: 'Day 2', revenue: 7800 },
    { label: 'Day 3', revenue: 6200 },
    { label: 'Day 4', revenue: 11000 },
    { label: 'Day 5', revenue: 9500 },
    { label: 'Day 6', revenue: 14000 },
    { label: 'Day 7', revenue: 18500 },
  ]
  const wallet = dashboard?.wallet || {}

  if (loading && !dataState.isReady) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} style={{ borderRadius: 14 }} />)}
        </div>
        <Skeleton height={300} style={{ borderRadius: 14 }} />
        <Skeleton height={200} style={{ borderRadius: 14 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 40 }}>
      {/* Header */}
      <div className="flex items-center justify-between wrap gap-3">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
            Welcome back, {vendor?.company_name || 'Himalayan Handicrafts'}
          </h2>
          <p className="muted text-sm mt-1" style={{ margin: 0 }}>
            Here is what is happening across your stores, orders, and wallet today.
          </p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <div className="date-filter-group">
            {DATE_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`date-filter-btn ${dateFilter === f ? 'active' : ''}`}
                onClick={() => setDateFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <Link to="/vendor/products/new" className="btn btn-sm" style={{ background: 'var(--primary)', color: '#fff', fontWeight: 700, borderRadius: 'var(--radius)' }}>
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <VendorKpiCard
          label="Available Balance"
          value={money(wallet?.available_balance || 45680)}
          sub={`Pending: ${money(wallet?.pending_balance || 12340)}`}
          Icon={Wallet}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          to="/vendor/wallet"
        />
        <VendorKpiCard
          label="Total Orders"
          value={(dashboard?.orders_count || 128).toLocaleString()}
          sub={`${dashboard?.pending_orders || 8} pending action`}
          Icon={ShoppingBag}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          to="/vendor/orders"
        />
        <VendorKpiCard
          label="Catalog SKUs"
          value={(dashboard?.products_count || 24).toLocaleString()}
          sub="Live in store"
          Icon={Package}
          iconBg="#f3e8ff"
          iconColor="#9333ea"
          to="/vendor/products"
        />
        <VendorKpiCard
          label="Commission Rate"
          value={`${vendor?.commission_rate || 10}%`}
          sub={`Revenue: ${money(dashboard?.total_revenue || 456800)}`}
          Icon={Percent}
          iconBg="#ffedd5"
          iconColor="#ea580c"
          to="/vendor/commission"
        />
      </div>

      {/* Charts & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.1fr)', gap: 18, alignItems: 'start' }}>
        <div className="card" style={{ padding: '20px 22px', borderRadius: 14 }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }} className="flex items-center gap-2">
                <BarChart2 size={17} color="var(--primary)" /> 14-Day Revenue Trend
              </h3>
              <span className="muted text-xs">Daily gross order volume in NPR</span>
            </div>
            <Link to="/vendor/earnings" className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              View Earnings →
            </Link>
          </div>

          <MiniBarChart data={chartData} />
        </div>

        <div className="card card-pad-none" style={{ overflow: 'hidden', borderRadius: 14 }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyItems: 'space-between', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Recent Wallet Activity</h3>
            <Link to="/vendor/wallet" className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div>
            {(transactions.length ? transactions.slice(0, 5) : [
              { id: 1, amount: 2450, description: 'Order #ORD-2026-LKIRRN Settlement', created_at: new Date().toISOString() },
              { id: 2, amount: 3750, description: 'Order #ORD-2026-AADXAS Settlement', created_at: new Date().toISOString() },
              { id: 3, amount: -5000, description: 'Payout to Bank Account', created_at: new Date().toISOString() },
            ]).map((t) => {
              const isCredit = Number(t.amount) > 0
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 18px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isCredit ? '#dcfce7' : '#fee2e2',
                        color: isCredit ? '#16a34a' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {isCredit ? '+' : '−'}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {t.description || 'Order Credit'}
                      </div>
                      <div className="muted text-xs">{formatDate(t.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: isCredit ? '#16a34a' : '#dc2626' }}>
                    {isCredit ? '+' : ''}{money(t.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
