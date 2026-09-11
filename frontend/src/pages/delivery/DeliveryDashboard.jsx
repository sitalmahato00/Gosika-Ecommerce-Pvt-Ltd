import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Inbox, Truck, Navigation, Banknote, Users, AlertTriangle, Warehouse, Calendar, ArrowRight, Radio } from 'lucide-react'
import { money } from '../../utils/format'
import { getNepaliDate } from '../../utils/nepalDate'
import KpiCard from '../../components/admin/KpiCard'
import StatusOrderTable from '../../components/admin/StatusOrderTable'
import AnimatedNumber from '../../components/admin/charts/fx/AnimatedNumber'

const PARCELS = [
  { id: 'DP-88412', customer: 'Sita Thapa', area: 'Patan · Lalitpur', weight: '0.8 kg', cod: 3200, status: 'unassigned' },
  { id: 'DP-88411', customer: 'Ram Sharma', area: 'New Road · KTM', weight: '1.2 kg', cod: 4850, status: 'out for delivery' },
  { id: 'DP-88410', customer: 'Hari KC', area: 'Ranjana · KTM', weight: '3.4 kg', cod: 12800, status: 'picked_up' },
  { id: 'DP-88409', customer: 'Anju Gurung', area: 'Lakeside · Pokhara', weight: '0.5 kg', cod: 980, status: 'delivered' },
  { id: 'DP-88408', customer: 'Roshan KC', area: 'Biratnagar', weight: '2.1 kg', cod: 6500, status: 'failed' },
  { id: 'DP-88407', customer: 'Mina Shrestha', area: 'Jhamsikhel · Lalitpur', weight: '0.9 kg', cod: 2750, status: 'ready' },
]

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      {/* Dispatcher header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Dashboard</h1>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#10b981', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              <Radio size={12} /> LIVE
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>Logistics & Fleet Dispatcher · last-mile control center.</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <Calendar size={15} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{getNepaliDate()}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="dlv-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:1120px){.dlv-kpi{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:768px){.dlv-kpi{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.dlv-kpi{grid-template-columns:1fr!important}}`}</style>
        <KpiCard label="Unassigned Parcels" value="19" sub="Awaiting rider" icon={Inbox} iconBg="#fff0e6" iconColor="#ff5500" to="/delivery/unassigned" />
        <KpiCard label="Out for Delivery" value="45" sub="On the road now" icon={Navigation} iconBg="#e6f0fa" iconColor="#2563eb" to="/delivery/out" />
        <KpiCard label="Warehouse Pickups" value="32" sub="Queued today" icon={Warehouse} iconBg="#e6f7ec" iconColor="#16a34a" to="/delivery/pickups" />
        <KpiCard label="Cash Turn-In Due" value="12" sub="Riders to settle" icon={Banknote} iconBg="#f3e8ff" iconColor="#9333ea" to="/delivery/cod/cash-turn-in" />
        <KpiCard label="Failed Logs" value="7" sub="Needs re-attempt" icon={AlertTriangle} iconBg="#ffebeb" iconColor="#e11d48" to="/delivery/failures" />
      </div>

      {/* Fleet + COD reconciliation strip */}
      <div id="dlv-mid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1080px){#dlv-mid{grid-template-columns:1fr!important}}`}</style>
        <div className="card" style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Fleet in the Field</div>
            <Link to="/delivery/riders" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Manage Riders <ArrowRight size={13} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            {[
              { label: 'Active Riders', value: '86', sub: '6 en route home', icon: Users, bg: '#e6f0fa', fg: '#2563eb' },
              { label: 'On Assignment', value: '61', sub: '45 delivering', icon: Truck, bg: '#fff0e6', fg: '#ff5500' },
              { label: 'Off Duty', value: '19', sub: 'Shift 2 coming', icon: Warehouse, bg: '#f3e8ff', fg: '#9333ea' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fafbfc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: k.bg, color: k.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><k.icon size={15} /></span>
                  <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>{k.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{k.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Banknote size={17} color="#ff5500" />
            <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>COD collected today <strong style={{ color: '#0f172a' }}>{money(184250)}</strong> · escrow remittance scheduled 7 PM</span>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg,#161d2b 0%,#253046 100%)', borderRadius: 16, padding: 18, border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#94a3b8' }}>ESCROW REMITTANCE</div>
          <div style={{ margin: '10px 0' }}>
            <div style={{ fontSize: 30, fontWeight: 900 }}><AnimatedNumber value={184250} format={money} duration={800} /></div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Transferred to vendor wallets after delivery window</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/delivery/cod/escrow" style={{ flex: 1, textAlign: 'center', background: '#ff5500', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>Reconcile Now</Link>
            <Link to="/delivery/cod/vault" style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>Hub Vault</Link>
          </div>
        </div>
      </div>

      {/* Parcel board */}
      <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Live Parcel Board</div>
          <Link to="/delivery/deliveries" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>All Shipments <ArrowRight size={13} /></Link>
        </div>
        <StatusOrderTable
          columns={[
            { key: 'id', label: 'Parcel', render: (r) => <a href={`/delivery/deliveries/${r.id}`} style={{ color: '#ff5500', fontWeight: 700, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate(`/delivery/deliveries/${r.id}`) }}>#{r.id}</a> },
            { key: 'customer', label: 'Customer', render: (r) => <><div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.customer}</div><div style={{ fontSize: 10.5, color: '#94a3b8' }}>{r.area}</div></> },
            { key: 'weight', label: 'Weight' },
            { key: 'cod', label: 'COD', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.cod)}</span> },
            { key: 'status', label: 'Status', render: (r, badge) => <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{String(r.status).replace(/[_-]+/g, ' ')}</span> },
          ]}
          rows={PARCELS}
          getStatus={(r) => r.status}
          statusFilter={filter}
          onStatusFilter={setFilter}
          searchPlaceholder="Search parcels, customers, areas…"
          perPage={6}
        />
      </div>
    </div>
  )
}