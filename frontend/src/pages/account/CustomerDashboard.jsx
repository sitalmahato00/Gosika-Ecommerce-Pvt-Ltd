import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Ticket, Heart, Clock, ShoppingBag, Star, ArrowRight, PackageCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials, money } from '../../utils/format'
import KpiCard from '../../components/admin/KpiCard'
import StatusOrderTable from '../../components/admin/StatusOrderTable'

const MY_ORDERS = [
  { id: 'GS-251209', item: 'Pashmina Shawl (Lux)', date: '03 Sep 2025', amount: 2150, status: 'out for delivery' },
  { id: 'GS-251102', item: 'Organic Herbal Tea Pack', date: '28 Aug 2025', amount: 980, status: 'delivered' },
  { id: 'GS-251040', item: 'Trekking Backpack 40L', date: '14 Aug 2025', amount: 12400, status: 'delivered' },
  { id: 'GS-250981', item: 'Kurti Set (2 pcs)', date: '30 Jul 2025', amount: 3200, status: 'cancelled' },
  { id: 'GS-250900', item: 'Wireless Headphones', date: '22 Jul 2025', amount: 4850, status: 'processing' },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const name = user?.name || 'Customer'
  const collect = useMemo(() => ({
    delivered: MY_ORDERS.filter(o => String(o.status).includes('deliver')).length,
    active: MY_ORDERS.filter(o => String(o.status).includes('out') || String(o.status).includes('processing')).length,
  }), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      {/* Greeting + balance hero card */}
      <div className="card" style={{ background: 'linear-gradient(120deg,#161d2b 0%,#253046 100%)', borderRadius: 18, border: 'none', padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, color: '#fff', boxShadow: '0 8px 24px -6px rgba(15,23,42,0.35)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#ff5500', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17 }}>{initials(name)}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Welcome back, {name.split(' ')[0]}</div>
              <div style={{ fontSize: 12.5, color: '#cbd5e1', fontWeight: 500 }}>Your buyer hub · manage orders, wallet & rewards</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>WALLET BALANCE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{money(2450)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>REWARD POINTS</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#ff5500' }}>1,240</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="cust-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:1120px){.cust-kpi{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:768px){.cust-kpi{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.cust-kpi{grid-template-columns:1fr!important}}`}</style>
        <KpiCard label="Active Orders" value={collect.active} sub="In transit" subUp icon={ShoppingBag} iconBg="#fff0e6" iconColor="#ff5500" to="/account/orders/active" />
        <KpiCard label="Delivered" value={collect.delivered} sub="All time" subUp icon={PackageCheck} iconBg="#e6f7ec" iconColor="#16a34a" to="/account" />
        <KpiCard label="My Vouchers" value="3" sub="2 expiring soon" icon={Ticket} iconBg="#f3e8ff" iconColor="#9333ea" to="/account/vouchers" />
        <KpiCard label="Wishlist" value="14" sub="Saved for later" icon={Heart} iconBg="#ffebeb" iconColor="#e11d48" to="/account/wishlist" />
        <KpiCard label="Pending Reviews" value="2" sub="Earn reward coins" icon={Star} iconBg="#e6f0fa" iconColor="#2563eb" to="/account/reviews/pending" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        {[
          { label: 'Track Order', to: '/account/orders/active', icon: Clock, bg: '#fff0e6', fg: '#ff5500' },
          { label: 'Buy Again', to: '/account/buy-again', icon: ShoppingBag, bg: '#e6f7ec', fg: '#16a34a' },
          { label: 'Wallet & Coins', to: '/account/wallet', icon: Wallet, bg: '#f3e8ff', fg: '#9333ea' },
          { label: 'Saved Vouchers', to: '/account/vouchers', icon: Ticket, bg: '#e6f0fa', fg: '#2563eb' },
        ].map(a => (
          <Link key={a.label} to={a.to} className="btn-tactile" onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 14, padding: '14px 16px', textDecoration: 'none', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transition: 'all .2s ease' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: a.bg, color: a.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a.icon size={18} /></span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{a.label}</span>
            <ArrowRight size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </Link>
        ))}
      </div>

      {/* Status-tinted order history */}
      <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>My Recent Orders</div>
          <Link to="/account" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>All Orders <ArrowRight size={13} /></Link>
        </div>
        <StatusOrderTable
          columns={[
            { key: 'id', label: 'Order', render: (r) => <span style={{ color: '#ff5500', fontWeight: 700, whiteSpace: 'nowrap' }}>#{r.id}</span> },
            { key: 'item', label: 'Item' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
            { key: 'status', label: 'Status', render: (r, badge) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
          ]}
          rows={MY_ORDERS}
          getStatus={(r) => r.status}
          statusFilter={filter}
          onStatusFilter={setFilter}
          searchPlaceholder="Search orders…"
          perPage={6}
        />
      </div>
    </div>
  )
}
