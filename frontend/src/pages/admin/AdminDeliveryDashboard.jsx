import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, PackageSearch, Truck, MapPin, CheckCircle2, AlertTriangle,
  RotateCcw, Banknote, RefreshCw, Activity, Users, Radio, Sun, Moon,
  Ban, ArrowRight, CalendarDays, Send, ThumbsUp, Ruler,
} from 'lucide-react'
import api from '../../api/client'
import { money, timeAgo } from '../../utils/format'
import PageHeader from '../../components/admin/PageHeader'
import KpiCard from '../../components/admin/KpiCard'
import ErrorState from '../../components/admin/ErrorState'
import AnimatedNumber from '../../components/admin/charts/fx/AnimatedNumber'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Custom', value: 'custom' },
]

const PIPELINE_COLORS = {
  order_ready: '#d97706',
  assigned: '#6366f1',
  pickup_scheduled: '#2563eb',
  picked_up: '#7c3aed',
  out_for_delivery: '#ea580c',
  delivered: '#16a34a',
}

const SEVERITY_META = {
  high: { color: '#dc2626', bg: '#fee2e2' },
  medium: { color: '#ea580c', bg: '#ffedd5' },
  low: { color: '#2563eb', bg: '#dbeafe' },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AdminDeliveryDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('today')
  const [customFrom, setCustomFrom] = useState(todayISO())
  const [customTo, setCustomTo] = useState(todayISO())

  const loadDashboard = async ({ silent = false } = {}) => {
    if (silent || !data) setLoading(true)
    setError(null)
    try {
      const params = { range }
      if (range === 'custom') {
        params.from = customFrom
        params.to = customTo
      }
      const res = await api.get('/admin/deliveries/dashboard', { params, skipCache: true })
      setData(res.data?.data ?? null)
    } catch (err) {
      setError('Failed to load delivery operations data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard({ silent: Boolean(data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customFrom, customTo])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div style={{ height: 46, width: 260, background: 'white', borderRadius: 10, border: '1px solid var(--border)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} style={{ height: 96, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }} />)}
        </div>
        <div style={{ height: 240, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }} />
        <div style={{ height: 200, background: 'white', borderRadius: 14, border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (error && !data) return <ErrorState message={error} onRetry={loadDashboard} />

  const d = data || {}
  const s = d.summary || {}
  const pipeline = Array.isArray(d.pipeline) ? d.pipeline : []
  const alerts = Array.isArray(d.alerts) ? d.alerts : []
  const partners = d.partners || {}
  const activity = Array.isArray(d.recentActivity) ? d.recentActivity : []
  const snapshot = d.snapshot || {}

  const kpis = [
    { label: 'Pending Assignment', value: s.pending_assignment, Icon: ClipboardList, bg: '#fff0e6', fg: '#ff5500', to: '/admin/fulfillment/assignments', sub: 'ready, unassigned' },
    { label: 'Pickup Pending', value: s.pickup_pending, Icon: PackageSearch, bg: '#e6f0fa', fg: '#2563eb', to: '/admin/fulfillment/assignments', sub: 'accepted by partner' },
    { label: 'In Transit', value: s.in_transit, Icon: Truck, bg: '#f3e8ff', fg: '#7c3aed', to: '/admin/fulfillment/assignments', sub: 'picked up from seller' },
    { label: 'Out for Delivery', value: s.out_for_delivery, Icon: MapPin, bg: '#fff7ed', fg: '#ea580c', to: '/admin/fulfillment/assignments', sub: 'last-mile active' },
    { label: 'Delivered', value: s.delivered, Icon: CheckCircle2, bg: '#ecfdf5', fg: '#10b981', to: '/admin/fulfillment/assignments', sub: s.range_label || 'this period' },
    { label: 'Failed Deliveries', value: s.failed, Icon: AlertTriangle, bg: '#fef2f2', fg: '#dc2626', to: '/admin/fulfillment/assignments', sub: s.range_label || 'this period' },
    { label: 'Returns / RTO', value: s.returns_rto, Icon: RotateCcw, bg: '#f5f3ff', fg: '#7c3aed', to: '/admin/orders/returns', sub: s.range_label || 'this period' },
    { label: 'COD Pending', value: money(s.cod_pending || 0), Icon: Banknote, bg: '#fffbeb', fg: '#d97706', to: '/admin/finance/payments', sub: 'outstanding on active routes' },
  ]

  const partnerRows = [
    { key: 'online', label: 'Online', value: partners.online ?? 0, Icon: Sun, color: '#16a34a' },
    { key: 'busy', label: 'Busy', value: partners.busy ?? 0, Icon: Radio, color: '#ea580c' },
    { key: 'offline', label: 'Offline', value: partners.offline ?? 0, Icon: Moon, color: '#94a3b8' },
    { key: 'suspended', label: 'Suspended', value: partners.suspended ?? 0, Icon: Ban, color: '#dc2626' },
  ]

  const snapshotBlocks = [
    { label: 'Deliveries Created', value: snapshot.deliveries_created ?? 0, theme: '#2563eb' },
    { label: 'Delivered', value: snapshot.delivered ?? 0, theme: '#16a34a' },
    { label: 'COD Collected', value: money(snapshot.cod_collected || 0), theme: '#d97706' },
    { label: 'COD Pending', value: money(snapshot.cod_pending || 0), theme: '#dc2626' },
    { label: 'Active Partners', value: snapshot.active_partners ?? 0, theme: '#7c3aed' },
  ]

  const sectionCard = {
    background: '#fff',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: 16,
    boxShadow: '0 4px 20px -2px rgba(15,23,42,0.05)',
    padding: '18px 20px',
    minWidth: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: '100%' }}>
      <PageHeader
        title="Delivery Dashboard"
        description="Monitor deliveries, pickups, partners and logistics operations across the marketplace."
        breadcrumbs={[{ label: 'Logistics' }, { label: 'Delivery Dashboard' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f1f5f9', padding: 3, borderRadius: 10 }} role="group" aria-label="Date range">
              {RANGES.map(tab => {
                const active = range === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setRange(tab.value)}
                    aria-pressed={active}
                    className="btn-tactile"
                    style={{
                      border: 'none', background: active ? '#ff5500' : 'transparent',
                      color: active ? '#fff' : '#64748b', fontWeight: 700, fontSize: 11.5,
                      padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                      boxShadow: active ? '0 2px 6px rgba(255,85,0,0.3)' : 'none', transition: 'all .2s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => loadDashboard({ silent: true })}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, marginLeft: 4 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      >
        {range === 'custom' && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', margin: 0 }}>
            <div>
              <label className="label" style={{ fontSize: 11, fontWeight: 700 }} htmlFor="dd-from">From</label>
              <input id="dd-from" type="date" className="input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ fontSize: 11, fontWeight: 700 }} htmlFor="dd-to">To</label>
              <input id="dd-to" type="date" className="input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
      </PageHeader>

      {/* KPI row */}
      <div className="delivery-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
        <style>{`
          @media(max-width:1180px){.delivery-kpi-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
          @media(max-width:980px){.delivery-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
          @media(max-width:520px){.delivery-kpi-grid{grid-template-columns:1fr!important}}
        `}</style>
        {kpis.map(k => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={<AnimatedNumber value={Number(k.value) || 0} format={k.label === 'COD Pending' ? money : v => Math.round(v).toLocaleString()} duration={700} />}
            sub={k.sub}
            Icon={k.Icon}
            iconBg={k.bg}
            iconColor={k.fg}
            to={k.to}
          />
        ))}
      </div>

      {/* Pipeline + Partner availability */}
      <div className="delivery-main-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1000px){.delivery-main-row{grid-template-columns:1fr!important}}`}</style>

        <div className="card" style={{ ...sectionCard, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} color="#ff5500" />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Delivery Pipeline</div>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Current state by stage</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, overflowX: 'auto', paddingBottom: 8, flex: 1 }}>
            {pipeline.map((stage, i) => {
              const color = PIPELINE_COLORS[stage.key] || '#64748b'
              return (
                <div key={stage.key} className="flex" style={{ alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 104 }}>
                    <div
                      style={{
                        width: 42, height: 42, borderRadius: '50%', background: color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15,
                        boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                      }}
                      aria-label={`${stage.label}: ${stage.count}`}
                    >
                      {stage.count}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textAlign: 'center', marginTop: 7, lineHeight: 1.3 }}>
                      {stage.label}
                    </div>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div style={{ width: 22, height: 2, background: '#e2e8f0', marginTop: 20, flexShrink: 0 }} />
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Terminal states:</span>
            <DeliveryStatusBadge status="failed" size="xs" />
            <DeliveryStatusBadge status="returned_to_vendor" size="xs" />
          </div>
        </div>

        <div className="card" style={{ ...sectionCard, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color="#2563eb" />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Partner Availability</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {partnerRows.map(row => (
                <div key={row.key} className="flex" style={{ alignItems: 'center', gap: 10, background: '#fafbfc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '9px 11px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#334155' }}>{row.label}</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>
          <Link to="/admin/fulfillment/partners" style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
            Manage Delivery Partners <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Alerts + Recent activity */}
      <div className="delivery-secondary-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, alignItems: 'stretch' }}>
        <style>{`@media(max-width:1000px){.delivery-secondary-row{grid-template-columns:1fr!important}}`}</style>

        <div className="card" style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#dc2626" />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Needs Attention</div>
            {alerts.length > 0 && (
              <span className="chip chip-sm" style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 800 }}>{alerts.length}</span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div style={{ fontSize: 13, color: '#64748b', padding: '14px 0', lineHeight: 1.5 }}>
              No operational alerts. All delivery lanes are healthy.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {alerts.map((alert, i) => {
                const sev = SEVERITY_META[alert.severity] || SEVERITY_META.low
                return (
                  <div key={i} className="flex" style={{ gap: 12, padding: '11px 0', borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: sev.color, flexShrink: 0, marginTop: 5 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{alert.title}</span>
                        {alert.count != null && (
                          <span className="chip chip-sm" style={{ background: sev.bg, color: sev.color, fontWeight: 800 }}>{alert.count}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.45 }}>{alert.description}</div>
                      {alert.action?.to && (
                        <Link to={alert.action.to} style={{ color: '#ff5500', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          {alert.action.label} <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card" style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={16} color="#7c3aed" />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recent Delivery Activity</div>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>{s.range_label || 'Today'}</span>
          </div>
          {activity.length === 0 ? (
            <div style={{ fontSize: 13, color: '#64748b', padding: '14px 0', lineHeight: 1.5 }}>
              No delivery activity in this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {activity.map(a => (
                <div key={a.id} className="flex" style={{ gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                    <CalendarDays size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex" style={{ alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 13, color: '#0f172a' }}>{a.order_reference || a.order_number || 'Delivery'}</strong>
                      <DeliveryStatusBadge status={a.status} size="xs" />
                    </div>
                    {a.note && <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }} className="truncate">{a.note}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                      {a.partner_name ? `by ${a.partner_name}` : 'System'} · {timeAgo(a.tracked_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operational snapshot (map replacement) */}
      <div className="card" style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <ThumbsUp size={16} color="#16a34a" />
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Operational Snapshot</div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>{s.range_label || 'Today'}</span>
        </div>
        <div className="snapshot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
          <style>{`
            @media(max-width:1120px){.snapshot-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
            @media(max-width:640px){.snapshot-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
          `}</style>
          {snapshotBlocks.map(block => (
            <div key={block.label} style={{ background: '#fafbfc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.label}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: block.theme, marginTop: 4 }} className="truncate">{block.value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ruler size={12} /> Live GPS tracking is not enabled on this marketplace yet — this summary reflects operational data across your selected period.
        </div>
      </div>
    </div>
  )
}