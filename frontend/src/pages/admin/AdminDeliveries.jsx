import React, { useEffect, useState } from 'react'
import {
  Truck, MapPin, UserCheck, ClipboardList, Package, Navigation, AlertTriangle,
  ArrowLeftRight, Download, RefreshCw, Eye, Store, Phone, Calendar,
  Loader2, Inbox, CheckCircle2, Boxes, RotateCcw, X
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import Timeline from '../../components/admin/Timeline'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import Modal from '../../components/ui/Modal'
import Drawer from '../../components/ui/Drawer'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'
import { statusMeta, DISPATCH_TABS, FAILURE_REASONS } from '../../utils/delivery'

const PAYMENT_LABELS = {
  cod: 'COD',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'FonePay',
  cash: 'Cash',
}

function paymentLabel(method) {
  if (!method) return '—'
  const key = String(method).toLowerCase()
  return PAYMENT_LABELS[key] || method
}

const DISPATCH_CARDS = [
  { key: 'pending_assignment', status: 'pending_assignment', label: 'Pending Assignment', color: '#64748b', bg: 'rgba(100,116,139,0.10)', icon: ClipboardList },
  { key: 'assigned', status: 'assigned', label: 'Assigned', color: '#6366f1', bg: 'rgba(99,102,241,0.10)', icon: UserCheck },
  { key: 'pickup_pending', status: 'accepted', label: 'Pickup Pending', color: '#2563eb', bg: 'rgba(37,99,235,0.10)', icon: MapPin },
  { key: 'in_transit', status: 'picked_up', label: 'In Transit', color: '#d97706', bg: 'rgba(217,119,6,0.10)', icon: Package },
  { key: 'out_for_delivery', status: 'out_for_delivery', label: 'Out for Delivery', color: '#ea580c', bg: 'rgba(234,88,12,0.10)', icon: Navigation },
  { key: 'failed', status: 'failed', label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: AlertTriangle },
  { key: 'needs_reassignment', status: 'needs_reassignment', label: 'Needs Reassignment', color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)', icon: ArrowLeftRight },
]

function SummaryCard({ card, count, active, onClick }) {
  const Icon = card.icon
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '1 1 140px',
        minWidth: 150,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 14,
        background: '#fff',
        border: `1px solid ${active ? card.color : 'var(--border)'}`,
        boxShadow: active ? `0 4px 16px ${card.bg}` : 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.16s ease',
      }}
      className="btn-tactile"
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: card.bg,
          color: card.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={19} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>
          {count ?? 0}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginTop: 2 }}>{card.label}</div>
      </div>
    </button>
  )
}

function AvailabilityDot({ partner }) {
  const online = partner?.is_online && partner?.status === 'approved'
  return (
    <span
      title={online ? 'Online' : 'Offline'}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: online ? '#22c55e' : '#cbd5e1',
        marginRight: 5,
        flexShrink: 0,
      }}
    />
  )
}

function PartnerOption({ partner, selected, onSelect, subtitle }) {
  const meta = statusMeta(partner.status === 'approved' ? (partner.is_online ? 'online' : 'applied') : partner.status)
  const serves = partner.serves_order_area === undefined ? true : partner.serves_order_area
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        border: selected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
        background: selected ? 'rgba(255,85,0,0.04)' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
      className="btn-tactile"
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: partner.is_online && partner.status === 'approved' ? '#f0fdf4' : '#f1f5f9',
          color: partner.is_online ? '#16a34a' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Truck size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>{partner.name}</span>
          <AvailabilityDot partner={partner} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{partner.phone}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
          <span className="chip chip-xs" style={{ background: '#f1f5f9', color: '#475569' }}>
            {[partner.vehicle_type, partner.vehicle_number].filter(Boolean).join(' · ') || 'Rider'}
          </span>
          <span className="chip chip-xs" style={{ background: partner.is_online ? '#f0fdf4' : '#f1f5f9', color: partner.is_online ? '#16a34a' : '#64748b' }}>
            {partner.is_online && partner.status === 'approved' ? 'Online' : partner.status === 'approved' ? 'Offline' : partner.status}
          </span>
          <span className="chip chip-xs" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            Active {partner.active_deliveries ?? 0}
          </span>
          <span className="chip chip-xs" style={{ background: '#ecfdf5', color: '#059669' }}>
            Done {partner.today_completed ?? 0}/day
          </span>
          {serves ? (
            <span className="chip chip-xs" style={{ background: '#ecfeff', color: '#0891b2' }}>Serves Area</span>
          ) : (
            <span className="chip chip-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>Area Mismatch</span>
          )}
        </div>
        {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{subtitle}</div>}
      </div>

      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: selected ? '5px solid var(--primary)' : '1.5px solid #cbd5e1',
          background: selected ? '#fff' : 'transparent',
          flexShrink: 0,
          transition: 'all 0.12s ease',
        }}
      />
    </button>
  )
}

export default function AdminDeliveries() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [summary, setSummary] = useState(null)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [partners, setPartners] = useState([])
  const [stores, setStores] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])

  const [drawer, setDrawer] = useState({ open: false, data: null, loading: false, error: null, row: null })
  const [assignState, setAssignState] = useState({ open: false, targets: [], partners: [], loading: false, error: null, selected: '', notes: '', submitting: false })
  const [reassignState, setReassignState] = useState({ open: false, row: null, partners: [], loading: false, error: null, selected: '', reason: '', notes: '', submitting: false })

  useEffect(() => {
    api.get('/admin/delivery-partners', { params: { per_page: 100 } })
      .then(res => setPartners(api.unwrapList(res.data)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/admin/vendors/stores', { params: { per_page: 100 } })
      .then(res => setStores(api.unwrapList(res.data)))
      .catch(() => {})
  }, [])

  const loadDispatch = async ({ force = false } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      if (partnerId) params.partner_id = partnerId
      if (storeId) params.store_id = storeId
      if (paymentMethod) params.payment_method = paymentMethod
      if (from) params.from = from
      if (to) params.to = to

      const res = await api.get('/admin/deliveries/dispatch', { params, skipCache: force })
      const list = api.unwrapList(res.data)
      setRows(list)
      setPagination(res.data?.meta?.pagination || null)
      setSummary(res.data?.meta?.summary || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the order dispatch list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDispatch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search, partnerId, storeId, paymentMethod, from, to])

  const handleSearch = (v) => {
    setSearch(v)
    setPage(1)
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setSearch('')
    setPartnerId('')
    setStoreId('')
    setPaymentMethod('')
    setFrom('')
    setTo('')
    setPage(1)
    setSelectedKeys([])
  }

  const openDrawer = async (row) => {
    setDrawer({ open: true, data: null, loading: true, error: null, row })
    try {
      const res = await api.get(`/admin/deliveries/dispatch/${row.id}`, { skipCache: true })
      setDrawer({ open: true, data: res.data?.data || null, loading: false, error: null, row })
    } catch (err) {
      setDrawer({ open: true, data: null, loading: false, error: err.response?.data?.message || 'Failed to load order dispatch detail.', row })
    }
  }

  const loadAssignPartners = async (targets) => {
    const first = targets[0]
    if (!first) return
    setAssignState(prev => ({ ...prev, open: true, targets, selected: '', partners: [], loading: true, error: null, submitting: false }))
    try {
      const res = await api.get(`/admin/deliveries/dispatch/${first.id}/partners`, { skipCache: true })
      setAssignState(prev => ({ ...prev, loading: false, partners: res.data?.data?.eligible_partners || [] }))
    } catch (err) {
      setAssignState(prev => ({ ...prev, loading: false, error: err.response?.data?.message || 'Failed to load eligible delivery partners.' }))
    }
  }

  const loadReassignPartners = async (row) => {
    setReassignState(prev => ({ ...prev, open: true, row, selected: row.assignment?.id ? '' : '', partners: [], loading: true, error: null, submitting: false }))
    try {
      const res = await api.get(`/admin/deliveries/dispatch/${row.id}/partners`, { skipCache: true })
      setReassignState(prev => ({ ...prev, loading: false, partners: res.data?.data?.eligible_partners || [] }))
    } catch (err) {
      setReassignState(prev => ({ ...prev, loading: false, error: err.response?.data?.message || 'Failed to load eligible delivery partners.' }))
    }
  }

  const submitAssign = async () => {
    const { targets, selected, notes } = assignState
    if (!selected || targets.length === 0) return

    setAssignState(prev => ({ ...prev, submitting: true }))
    const completed = []
    try {
      for (const target of targets) {
        await api.post('/admin/deliveries', {
          vendor_order_id: target.id,
          delivery_partner_id: selected,
          notes: notes.trim() || undefined,
        })
        completed.push(target.vendor_order_number)
      }
      toast.success(`Assigned ${completed.length} order${completed.length > 1 ? 's' : ''} to the delivery partner.`)
      setAssignState(prev => ({ ...prev, open: false }))
      setSelectedKeys([])
      loadDispatch({ force: true })
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to assign ${completed.length ? `after ${completed.length} succeeded` : 'order'}.`)
    } finally {
      setAssignState(prev => ({ ...prev, submitting: false }))
    }
  }

  const submitReassign = async () => {
    const { row, selected, reason, notes } = reassignState
    const assignmentId = row?.assignment?.id
    if (!assignmentId || !selected || !reason.trim()) return

    setReassignState(prev => ({ ...prev, submitting: true }))
    try {
      await api.post(`/admin/deliveries/${assignmentId}/reassign`, {
        delivery_partner_id: selected,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      })
      toast.success('Delivery reassigned to the new partner.')
      setReassignState(prev => ({ ...prev, open: false }))
      setSelectedKeys([])
      if (drawer.open && drawer.row?.id === row.id) openDrawer(row)
      loadDispatch({ force: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign delivery partner.')
    } finally {
      setReassignState(prev => ({ ...prev, submitting: false }))
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Vendor Order #' },
        { label: 'Order #' },
        { label: 'Customer' },
        { label: 'Phone' },
        { label: 'Store' },
        { label: 'Delivery Area' },
        { label: 'Payment' },
        { label: 'Amount' },
        { label: 'COD Amount' },
        { label: 'Delivery Partner' },
        { label: 'Dispatch Status' },
        { label: 'Assigned At' },
        { label: 'Last Updated' },
      ],
      rows: rows.map(d => [
        d.vendor_order_number,
        d.order?.order_number || '',
        d.recipient?.full_name || d.customer?.full_name || '',
        d.recipient?.phone || d.customer?.phone || '',
        d.store?.name || '',
        [d.delivery_area?.municipality, d.delivery_area?.district].filter(Boolean).join(', '),
        paymentLabel(d.payment?.method),
        money(Number(d.amount) || 0),
        money(Number(d.cod_amount) || 0),
        d.delivery_partner?.name || 'Unassigned',
        statusMeta(d.dispatch_status).label,
        d.assigned_at ? formatDateTime(d.assigned_at) : '—',
        d.last_updated ? formatDateTime(d.last_updated) : '—',
      ]),
      title: 'Order Dispatch Report',
      subtitle: 'Marketplace order dispatch and delivery assignment overview.',
      sectionLabel: 'Order Dispatch',
      fileName: `gosika_order_dispatch_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Order dispatch exported as branded report.')
  }

  const pendingSelected = rows.filter(r => selectedKeys.includes(r.id) && r.can_assign)

  const columns = [
    {
      header: 'Order',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
            #{item.vendor_order_number}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Order {item.order?.order_number || '—'} · {item.package_count ?? 1} pkg
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
            {item.recipient?.full_name || item.customer?.full_name || 'Customer'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={11} /> {item.recipient?.phone || item.customer?.phone || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Seller / Store',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Store size={13} />
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', maxWidth: 150 }} className="truncate">
            {item.store?.name || 'Marketplace'}
          </div>
        </div>
      )
    },
    {
      header: 'Delivery Area',
      render: item => {
        const area = [item.delivery_area?.municipality, item.delivery_area?.district].filter(Boolean).join(', ')
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, maxWidth: 170 }}>
            <MapPin size={13} style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>{area || '—'}</span>
          </div>
        )
      }
    },
    {
      header: 'Payment',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            {paymentLabel(item.payment?.method)}
          </span>
          {item.payment?.is_cod && (
            <span className="chip chip-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>COD</span>
          )}
        </div>
      )
    },
    {
      header: 'Amount',
      align: 'right',
      render: item => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{money(Number(item.amount) || 0)}</div>
          {Number(item.cod_amount) > 0 && (
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>COD {money(Number(item.cod_amount) || 0)}</div>
          )}
        </div>
      )
    },
    {
      header: 'Delivery Partner',
      render: item => (
        item.delivery_partner ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={14} />
            </div>
            <div style={{ maxWidth: 150 }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <AvailabilityDot partner={item.delivery_partner} />
                {item.delivery_partner.name}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{item.delivery_partner.phone}</div>
            </div>
          </div>
        ) : (
          <span className="chip chip-xs" style={{ background: '#f8fafc', color: '#dc2626', fontWeight: 700 }}>Unassigned</span>
        )
      )
    },
    {
      header: 'Status',
      render: item => <DeliveryStatusBadge status={item.dispatch_status} />
    },
    {
      header: 'Assigned At',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {item.assigned_at ? timeAgo(item.assigned_at) : '—'}
        </span>
      )
    },
    {
      header: 'Last Updated',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {item.last_updated ? timeAgo(item.last_updated) : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={e => e.stopPropagation()}>
          {item.can_assign && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={() => loadAssignPartners([item])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
            >
              <UserCheck size={12} /> Assign
            </button>
          )}
          {item.can_reassign && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => loadReassignPartners(item)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 700 }}
            >
              <ArrowLeftRight size={12} /> Reassign
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => openDrawer(item)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b' }}
          >
            <Eye size={12} /> View
          </button>
        </div>
      )
    }
  ]

  const activeTab = statusFilter

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        title="Order Dispatch"
        description="Assign and manage orders for delivery."
        breadcrumbs={[
          { label: 'Fulfillment', to: '/admin/fulfillment/dashboard' },
          { label: 'Order Dispatch' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => loadDispatch({ force: true })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {DISPATCH_CARDS.map(card => (
          <SummaryCard
            key={card.key}
            card={card}
            count={summary ? summary[card.key] : null}
            active={activeTab === card.status}
            onClick={() => { setStatusFilter(activeTab === card.status ? 'all' : card.status); setPage(1) }}
          />
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search order #, customer, store, partner..."
        statusFilter={statusFilter}
        onStatusChange={v => { setStatusFilter(v); setPage(1) }}
        statusOptions={DISPATCH_TABS}
        segmented
        debounceMs={400}
        onReset={resetFilters}
        extraFilters={
          <>
            <div style={{ minWidth: 150 }}>
              <select
                className="input"
                value={partnerId}
                onChange={e => { setPartnerId(e.target.value); setPage(1) }}
                style={{ height: 36, fontSize: 12.5, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="">All Partners</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 150 }}>
              <select
                className="input"
                value={storeId}
                onChange={e => { setStoreId(e.target.value); setPage(1) }}
                style={{ height: 36, fontSize: 12.5, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="">All Stores</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 130 }}>
              <select
                className="input"
                value={paymentMethod}
                onChange={e => { setPaymentMethod(e.target.value); setPage(1) }}
                style={{ height: 36, fontSize: 12.5, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="">All Payments</option>
                <option value="cod">COD Only</option>
                <option value="prepaid">Prepaid Only</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} style={{ color: '#94a3b8' }} />
              <input
                type="date"
                className="input"
                value={from}
                onChange={e => { setFrom(e.target.value); setPage(1) }}
                style={{ height: 36, fontSize: 12.5, borderRadius: 8, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>–</span>
              <input
                type="date"
                className="input"
                value={to}
                onChange={e => { setTo(e.target.value); setPage(1) }}
                style={{ height: 36, fontSize: 12.5, borderRadius: 8, cursor: 'pointer' }}
              />
            </div>
            {(partnerId || storeId || paymentMethod || from || to) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setPartnerId(''); setStoreId(''); setPaymentMethod(''); setFrom(''); setTo(''); setPage(1) }}
                title="Clear filters"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, height: 36 }}
              >
                <RotateCcw size={13} /> Clear
              </button>
            )}
          </>
        }
      />

      {/* Selection toolbar */}
      {selectedKeys.length > 0 && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            {selectedKeys.length} order{selectedKeys.length > 1 ? 's' : ''} selected
            {pendingSelected.length > 0 && <span style={{ fontWeight: 600, color: '#64748b' }}>· {pendingSelected.length} ready to assign</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setSelectedKeys([])} style={{ fontWeight: 600 }}>Clear</button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={pendingSelected.length === 0}
              onClick={() => loadAssignPartners(pendingSelected)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: 8 }}
            >
              <UserCheck size={14} /> Assign Selected
            </button>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState
          title="Unable to load Order Dispatch"
          message={error}
          onRetry={() => loadDispatch({ force: true })}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          keyField="id"
          selectable
          selectedKeys={selectedKeys}
          onSelectKey={(key, checked) =>
            setSelectedKeys(prev => checked ? [...prev, key] : prev.filter(k => k !== key))
          }
          onSelectAll={(checked) => {
            const keys = rows.map(r => r.id)
            setSelectedKeys(checked ? Array.from(new Set([...selectedKeys, ...keys])) : selectedKeys.filter(k => !keys.includes(k)))
          }}
          onRowClick={openDrawer}
          emptyTitle={
            statusFilter === 'pending_assignment'
              ? 'All caught up'
              : statusFilter === 'needs_reassignment'
                ? 'No reassignments needed'
                : 'No dispatch orders found'
          }
          emptyDescription={
            statusFilter === 'pending_assignment'
              ? 'No orders are currently waiting to be assigned. New ready-to-pickup orders will appear here.'
              : 'No orders match the current filters. Try adjusting the search or filters above.'
          }
        />
      )}

      {/* Order Dispatch Detail Drawer */}
      <Drawer
        open={drawer.open}
        onClose={() => setDrawer(prev => ({ ...prev, open: false }))}
        title={drawer.row ? `Dispatch #${drawer.row.vendor_order_number}` : 'Order Dispatch'}
      >
        {drawer.loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            <Loader2 size={22} className="spin" />
            <div style={{ fontSize: 13, marginTop: 10 }}>Loading dispatch detail...</div>
          </div>
        ) : drawer.error ? (
          <ErrorState title="Failed to load dispatch detail" message={drawer.error} onRetry={() => openDrawer(drawer.row)} />
        ) : drawer.data ? (
          detailContent(drawer.data, {
            onAssign: () => { setDrawer(prev => ({ ...prev, open: false })); loadAssignPartners([drawer.row]) },
            onReassign: () => { setDrawer(prev => ({ ...prev, open: false })); loadReassignPartners(drawer.row) },
          })
        ) : null}
      </Drawer>

      {/* Assign Modal */}
      <Modal
        open={assignState.open}
        onClose={() => setAssignState(prev => ({ ...prev, open: false }))}
        title={`Assign Delivery Partner${assignState.targets.length > 1 ? ` (${assignState.targets.length})` : ''}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAssignState(prev => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={assignState.submitting || !assignState.selected}
              onClick={submitAssign}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              {assignState.submitting ? <><Loader2 size={14} className="spin" /> Assigning...</> : <><UserCheck size={14} /> Confirm Assignment</>}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Assigning
            </div>
            {assignState.targets.length === 1 ? (
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                #{assignState.targets[0].vendor_order_number} · {money(Number(assignState.targets[0].amount) || 0)} · {assignState.targets[0].store?.name || 'Marketplace'}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                {assignState.targets.length} orders ready to assign
              </div>
            )}
            {assignState.targets.length > 1 && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {assignState.targets.map(t => `#${t.vendor_order_number}`).join(' · ')}
              </div>
            )}
          </div>

          {assignState.loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              <Loader2 size={20} className="spin" />
              <div style={{ fontSize: 13, marginTop: 8 }}>Finding eligible delivery partners...</div>
            </div>
          ) : assignState.error ? (
            <ErrorState title="Could not load partners" message={assignState.error} onRetry={() => loadAssignPartners(assignState.targets)} />
          ) : assignState.partners.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No delivery partners available"
              description="There are no approved delivery partners to assign right now."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {assignState.partners.map(p => (
                <PartnerOption
                  key={p.id}
                  partner={p}
                  selected={assignState.selected === p.id}
                  onSelect={() => setAssignState(prev => ({ ...prev, selected: prev.selected === p.id ? '' : p.id }))}
                  subtitle={p.capacity_available === null ? null : `Capacity: ${p.capacity_available}`}
                />
              ))}
            </div>
          )}

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Assignment Note (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={assignState.notes}
              onChange={e => setAssignState(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add a note for this assignment..."
              style={{ width: '100%', fontSize: 13, borderRadius: 8, resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        open={reassignState.open}
        onClose={() => setReassignState(prev => ({ ...prev, open: false }))}
        title="Reassign Delivery"
        size="lg"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setReassignState(prev => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={reassignState.submitting || !reassignState.selected || !reassignState.reason.trim()}
              onClick={submitReassign}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              {reassignState.submitting ? <><Loader2 size={14} className="spin" /> Reassigning...</> : <><ArrowLeftRight size={14} /> Confirm Reassignment</>}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Reassigning
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
              #{reassignState.row?.vendor_order_number}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Current: <strong>{reassignState.row?.delivery_partner?.name || '—'}</strong>
              {reassignState.row?.assignment?.status ? ` · ${statusMeta(reassignState.row.assignment.status).label}` : ''}
            </div>
          </div>

          {reassignState.loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              <Loader2 size={20} className="spin" />
              <div style={{ fontSize: 13, marginTop: 8 }}>Loading eligible delivery partners...</div>
            </div>
          ) : reassignState.error ? (
            <ErrorState title="Could not load partners" message={reassignState.error} onRetry={() => loadReassignPartners(reassignState.row)} />
          ) : reassignState.partners.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No delivery partners available"
              description="There are no approved delivery partners available for reassignment right now."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
              {reassignState.partners.filter(p => reassignState.row?.delivery_partner?.id !== p.id).map(p => (
                <PartnerOption
                  key={p.id}
                  partner={p}
                  selected={reassignState.selected === p.id}
                  onSelect={() => setReassignState(prev => ({ ...prev, selected: prev.selected === p.id ? '' : p.id }))}
                />
              ))}
            </div>
          )}

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Reassignment Reason *</label>
            <select
              className="input"
              value={reassignState.reason}
              onChange={e => setReassignState(prev => ({ ...prev, reason: e.target.value }))}
              style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
            >
              <option value="">Select a reason...</option>
              {FAILURE_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Notes (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={reassignState.notes}
              onChange={e => setReassignState(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional context for this reassignment..."
              style={{ width: '100%', fontSize: 13, borderRadius: 8, resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0' }}>
      <span style={{ color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ color: strong ? 'var(--ink)' : '#334155', fontWeight: strong ? 700 : 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}

function detailContent(d, handlers) {
  const order = d.order || {}
  const customer = d.customer || {}
  const delivery = d.delivery || {}
  const current = d.current_assignment

  const timelineEvents = (d.timeline || []).map(evt => ({
    title: statusMeta(evt.status).label,
    description: evt.note || '',
    status: evt.status,
    created_at: evt.timestamp,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
              #{d.vendor_order_number}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Order {order.order_number || '—'} · Placed {order.placed_at ? formatDateTime(order.placed_at) : '—'}
            </div>
          </div>
          <DeliveryStatusBadge status={d.dispatch_status} />
        </div>
      </div>

      <DetailSection title="Order Summary">
        <div className="card" style={{ padding: '14px 16px', borderRadius: 12 }}>
          <InfoRow label="Subtotal" value={money(Number(order.subtotal) || 0)} />
          <InfoRow label="Delivery Charge" value={money(Number(order.delivery_charge) || 0)} />
          <InfoRow label="Discount" value={money(Number(order.discount) || 0)} />
          <InfoRow label="Tax" value={money(Number(order.tax) || 0)} />
          <InfoRow label="Grand Total" value={money(Number(order.grand_total) || 0)} strong />
          <InfoRow label="Payment" value={`${paymentLabel(order.payment_method)} · ${order.payment_status || '—'}`} />
          {Number(delivery.cod_amount) > 0 && <InfoRow label="COD To Collect" value={money(Number(delivery.cod_amount) || 0)} strong />}
        </div>
      </DetailSection>

      <DetailSection title="Customer & Delivery Address">
        <div className="card" style={{ padding: '14px 16px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <InfoRow label="Recipient" value={customer.recipient_name || customer.full_name || '—'} strong />
          <InfoRow label="Phone" value={customer.recipient_phone || customer.phone || '—'} />
          <InfoRow label="Account" value={customer.full_name || '—'} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
          <MapPin size={15} style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }} />
          <span>{delivery.dropoff_address || ((d.delivery_area || []) && [d.delivery_area?.municipality, d.delivery_area?.district, d.delivery_area?.province].filter(Boolean).join(', ')) || '—'}</span>
        </div>
      </DetailSection>

      <DetailSection title="Pickup Store">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid var(--border)', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Store size={17} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{d.store?.name || 'Marketplace'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{d.store?.pickup_address || '—'}</div>
          </div>
        </div>
      </DetailSection>

      <DetailSection title={`Items (${d.package_count ?? (d.items || []).length})`}>
        <div className="card" style={{ padding: '6px 14px', borderRadius: 12 }}>
          {(d.items || []).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: idx < d.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Boxes size={15} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }} className="truncate">{item.product_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Qty {item.quantity}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{money(Number(item.line_total) || 0)}</div>
            </div>
          ))}
        </div>
      </DetailSection>

      {/* Current assignment */}
      <DetailSection title="Current Assignment">
        {current?.partner ? (
          <div className="card" style={{ padding: '14px 16px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={17} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AvailabilityDot partner={current.partner} /> {current.partner.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{current.partner.phone} · {current.partner.vehicle_type || 'Rider'}</div>
              </div>
            </div>
            <InfoRow label="Assigned At" value={current.assigned_at ? formatDateTime(current.assigned_at) : '—'} />
            <InfoRow label="Accepted At" value={current.accepted_at ? formatDateTime(current.accepted_at) : '—'} />
            <InfoRow label="Picked Up" value={current.picked_up_at ? formatDateTime(current.picked_up_at) : '—'} />
            <InfoRow label="Out for Delivery" value={current.out_for_delivery_at ? formatDateTime(current.out_for_delivery_at) : '—'} />
            <InfoRow label="Delivered" value={current.delivered_at ? formatDateTime(current.delivered_at) : '—'} />
            {current.failure_reason && <InfoRow label="Failure" value={current.failure_reason} strong />}
            {(current.meta?.reassignment_reason) && <InfoRow label="Reassign Reason" value={current.meta.reassignment_reason} />}
            <InfoRow label="Delivery Fee" value={money(Number(delivery.delivery_fee) || 0)} />
          </div>
        ) : (
          <div style={{ padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12.5, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            No delivery partner assigned yet. Assign this order to start dispatch.
          </div>
        )}
      </DetailSection>

      {/* Assignment history */}
      {(d.history || []).length > 1 && (
        <DetailSection title="Assignment History">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(d.history || []).map(h => (
              <div key={h.id} className="card" style={{ padding: '12px 14px', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                    {h.partner?.name || 'Unknown partner'}
                  </div>
                  <DeliveryStatusBadge status={h.status} size="xs" />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                  Assigned {h.assigned_at ? formatDateTime(h.assigned_at) : '—'}
                  {h.reassignedAt ? ` · Reassigned ${formatDateTime(h.reassignedAt)}` : ''}
                </div>
                {h.failure_reason && <div style={{ marginTop: 5, fontSize: 11.5, color: '#b91c1c' }}>{h.failure_reason}</div>}
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Tracking Timeline">
        <div className="card card-pad" style={{ borderRadius: 12 }}>
          <Timeline events={timelineEvents} />
        </div>
      </DetailSection>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', bottom: 0, background: '#fff', padding: '12px 0 4px', borderTop: '1px solid var(--border)' }}>
        {d.actions?.can_assign && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handlers.onAssign} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, flex: 1, justifyContent: 'center', borderRadius: 8 }}>
            <UserCheck size={14} /> Assign Delivery
          </button>
        )}
        {d.actions?.can_reassign && (
          <button type="button" className="btn btn-outline btn-sm" onClick={handlers.onReassign} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, flex: 1, justifyContent: 'center', borderRadius: 8, color: 'var(--primary)' }}>
            <ArrowLeftRight size={14} /> Reassign
          </button>
        )}
      </div>
    </div>
  )
}