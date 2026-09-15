import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import KpiCard from './KpiCard'
import StatusOrderTable from './StatusOrderTable'
import { money } from '../../utils/format'

/**
 * Generic, spec-aligned landing page for any dashboard section.
 *
 * It derives a set of KPIs + a status-tinted table from the section path so
 * that every new nav item renders meaningful, on-brand UI without a bespoke
 * page per route. Specific pages override this via explicit routes.
 */
export default function SectionPage({ section }) {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')

  const title = useMemo(() => {
    const segments = (section?.pathname || '').replace(/^\//, '').split('/').filter(Boolean)
    segments.pop()
    const last = (section?.pathname || '').split('/').filter(Boolean).pop() || 'Overview'
    return last.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }, [section])

  const role = useMemo(() => {
    const p = section?.pathname || ''
    if (p.startsWith('/admin')) return 'admin'
    if (p.startsWith('/vendor')) return 'vendor'
    if (p.startsWith('/delivery')) return 'delivery'
    if (p.startsWith('/account')) return 'customer'
    return 'admin'
  }, [section])

  const kpis = {
    admin: [],
    vendor: [],
    delivery: [],
    customer: [],
  }[role] || []

  const rows = useMemo(() => {
    // Return empty array - data should come from API
    return []
  }, [role])

  const tableColumns = role === 'customer'
    ? [
        { key: 'id', label: 'Reference', render: (r) => <span style={{ color: '#ff5500', fontWeight: 700 }}>#{r.id}</span> },
        { key: 'label', label: 'Item' },
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
        { key: 'status', label: 'Status', render: (r, badge) => <StatusPill badge={badge} label={r.status} /> },
      ]
    : [
        { key: 'id', label: 'Order ID', render: (r) => <a href={`/${role === 'vendor' ? 'vendor' : 'admin'}/orders/${r.id}`} style={{ color: '#ff5500', fontWeight: 700, textDecoration: 'none' }}>#{r.id}</a> },
        { key: 'customer', label: 'Customer' },
        { key: 'product', label: 'Item' },
        { key: 'amount', label: 'Amount', render: (r) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{money(r.amount)}</span> },
        { key: 'status', label: 'Status', render: (r, badge) => <StatusPill badge={badge} label={r.status} /> },
      ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{title}</h1>
            <span style={{ background: 'rgba(255,85,0,0.1)', color: '#ff5500', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              {role === 'vendor' ? 'Merchant Hub' : role === 'delivery' ? 'Logistics & Fleet' : role === 'customer' ? 'Buyer Portal' : 'Super Admin'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>
            {user ? `Signed in as ${user.name || 'you'}` : 'Signed in as user'} · Manage this section in real time.
          </p>
        </div>
        <button type="button" className="btn-tactile" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Icons.Download size={15} color="#ff5500" /> Export
        </button>
      </div>

      <div className="sc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 14 }}>
        <style>{`@media(max-width:1120px){.sc-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media(max-width:768px){.sc-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:480px){.sc-grid{grid-template-columns:1fr!important}}`}</style>
        {kpis.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} Icon={Icons[k.icon] || Icons.Circle} iconBg={k.bg} iconColor={k.fg} to={k.to} />
        ))}
      </div>

      <div className="card" style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title} · Records</div>
          <Link to={(section?.pathname || '/')} style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Open Section →</Link>
        </div>
        <StatusOrderTable columns={tableColumns} rows={rows} getStatus={(r) => r.status} statusFilter={filter} onStatusFilter={setFilter} searchPlaceholder={`Search ${title.toLowerCase()}…`} perPage={8} emptyText={`No ${title.toLowerCase()} records found.`} />
      </div>
    </div>
  )
}

function StatusPill({ badge, label }) {
  return <span style={{ color: badge.color, background: badge.bg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-block', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{String(label).replace(/[_-]+/g, ' ')}</span>
}
