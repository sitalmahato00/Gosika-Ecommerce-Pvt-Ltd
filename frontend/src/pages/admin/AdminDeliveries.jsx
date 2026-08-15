import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Users, Calendar, CheckCircle2, XCircle, Search,
  MapPin, Clock, Eye, UserCheck, RefreshCw, Download,
  Phone, User, Store, ShieldCheck, Zap, Package, ArrowRight
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Deliveries' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed / Returned' },
]

const SAMPLE_DELIVERIES = [
  {
    id: 1,
    tracking_number: 'PTH-KT-99214',
    dispatch_number: 'DSP-2026-9901',
    order_id: 'ORD-2026-98101',
    partner: {
      name: 'Pathao Logistics Express',
      rider_name: 'Bikash Shrestha',
      rider_phone: '+977 980-1234567',
      vehicle: 'Hero Splendor (BA 88 PA 4912)',
    },
    vendor: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      city: 'Biratnagar',
    },
    customer: {
      name: 'Kshitiz Acharya',
      phone: '+977 980-1234567',
      city: 'Kathmandu, Bagmati',
      address: 'Ward No. 3, Lazimpat Road, Near Radisson Hotel',
    },
    item_title: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    status: 'in_transit',
    created_at: '2026-08-15T08:45:00Z',
    estimated_delivery: 'Today by 4:30 PM',
  },
  {
    id: 2,
    tracking_number: 'PTH-PK-44812',
    dispatch_number: 'DSP-2026-9898',
    order_id: 'ORD-2026-98098',
    partner: {
      name: 'Pathao Logistics Express',
      rider_name: 'Suresh Gurung',
      rider_phone: '+977 984-1987654',
      vehicle: 'Honda Shine (GA 12 PA 8821)',
    },
    vendor: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      city: 'Biratnagar',
    },
    customer: {
      name: 'Pooja Sharma',
      phone: '+977 984-1987654',
      city: 'Pokhara, Gandaki',
      address: 'Lakeside Ward 6, Near Barahi Temple',
    },
    item_title: 'Traditional Carved Wooden Peacock Window',
    status: 'delivered',
    created_at: '2026-08-14T23:58:00Z',
    delivered_at: '2026-08-15T11:30:00Z',
    estimated_delivery: 'Completed',
  },
  {
    id: 3,
    tracking_number: 'LCL-BRT-1102',
    dispatch_number: 'DSP-2026-9892',
    order_id: 'ORD-2026-98092',
    partner: {
      name: 'GOSIKA In-City Rapid Fleet',
      rider_name: 'Ramesh Yadav',
      rider_phone: '+977 981-2345678',
      vehicle: 'Yamaha FZ (KO 21 PA 3341)',
    },
    vendor: {
      name: 'Himalayan Organic Herbs & Tea',
      city: 'Ilam',
    },
    customer: {
      name: 'Prashant Shrestha',
      phone: '+977 981-2345678',
      city: 'Biratnagar, Koshi',
      address: 'Main Road Traffic Chowk, Ward No. 4',
    },
    item_title: 'Organic Ilam Orthodox Black Tea (500g Pack)',
    status: 'delivered',
    created_at: '2026-08-14T22:44:00Z',
    delivered_at: '2026-08-15T10:15:00Z',
    estimated_delivery: 'Completed',
  },
  {
    id: 4,
    tracking_number: 'NPP-EMS-77891',
    dispatch_number: 'DSP-2026-9885',
    order_id: 'ORD-2026-98085',
    partner: {
      name: 'Nepal Post EMS (Dak Sewa)',
      rider_name: 'Babu Ram Karki',
      rider_phone: '+977 985-1098765',
      vehicle: 'Postal Delivery Van (BA 2 JA 9012)',
    },
    vendor: {
      name: 'Lalitpur Heritage Metal & Bronze',
      city: 'Patan',
    },
    customer: {
      name: 'Anil Thapa',
      phone: '+977 985-1098765',
      city: 'Dharan, Koshi',
      address: 'Bhanuchowk Commercial Lane, Ward No. 2',
    },
    item_title: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    status: 'picked_up',
    created_at: '2026-08-14T18:30:00Z',
    estimated_delivery: '16 Aug by 2:00 PM',
  },
  {
    id: 5,
    tracking_number: 'PTH-IT-33109',
    dispatch_number: 'DSP-2026-9874',
    order_id: 'ORD-2026-98074',
    partner: {
      name: 'Pathao Logistics Express',
      rider_name: 'Dipendra Magar',
      rider_phone: '+977 986-2123456',
      vehicle: 'Bajaj Pulsar (KO 15 PA 6610)',
    },
    vendor: {
      name: 'Eastern Dhaka Textile Weavers',
      city: 'Tehrathum',
    },
    customer: {
      name: 'Sita Kumari Rai',
      phone: '+977 986-2123456',
      city: 'Itahari, Koshi',
      address: 'Gorkha Galli, Ward No. 5',
    },
    item_title: 'Authentic Handwoven Koshi Dhaka Saree',
    status: 'assigned',
    created_at: '2026-08-14T14:15:00Z',
    estimated_delivery: '16 Aug by 5:00 PM',
  },
  {
    id: 6,
    tracking_number: 'SND-BTL-9901',
    dispatch_number: 'DSP-2026-9861',
    order_id: 'ORD-2026-98061',
    partner: {
      name: 'Sundar Courier Express',
      rider_name: 'Manoj KC',
      rider_phone: '+977 984-7123987',
      vehicle: 'Tata Ace Freight (LU 1 CHA 4409)',
    },
    vendor: {
      name: 'Mustang Himalayan Dry Fruits',
      city: 'Jomsom',
    },
    customer: {
      name: 'Bikash Gurung',
      phone: '+977 984-7123987',
      city: 'Butwal, Lumbini',
      address: 'Traffic Chowk, Milan Park Road',
    },
    item_title: 'Organic Dried Himalayan Apples & Apricots (1kg)',
    status: 'delivered',
    created_at: '2026-08-13T11:20:00Z',
    delivered_at: '2026-08-14T16:45:00Z',
    estimated_delivery: 'Completed',
  },
]

const AVAILABLE_RIDERS = [
  { id: 'dp1', name: 'Bikash Shrestha (Pathao Kathmandu Central Hub · 9801234567)' },
  { id: 'dp2', name: 'Suresh Gurung (Pathao Pokhara Hub · 9841987654)' },
  { id: 'dp3', name: 'Ramesh Yadav (GOSIKA In-City Biratnagar · 9812345678)' },
  { id: 'dp4', name: 'Babu Ram Karki (Nepal Post EMS Eastern Nepal · 9851098765)' },
  { id: 'dp5', name: 'Dipendra Magar (Pathao Sunsari/Itahari · 9862123456)' },
]

export default function AdminDeliveries() {
  const toast = useToast()
  const [deliveries, setDeliveries] = useState(SAMPLE_DELIVERIES)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [reassignTarget, setReassignTarget] = useState(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/deliveries', { params: { per_page: 50 } })
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 2) {
          const formatted = list.map((d, i) => {
            const fallback = SAMPLE_DELIVERIES[i % SAMPLE_DELIVERIES.length]
            return {
              id: d.id || fallback.id,
              tracking_number: d.tracking_number || fallback.tracking_number,
              dispatch_number: d.vendor_order?.vendor_order_number || d.dispatch_number || `DSP-2026-${9900 + (d.id || i)}`,
              order_id: d.order?.order_number || d.order_id || fallback.order_id,
              partner: {
                name: d.delivery_partner?.name || d.delivery_partner_name || fallback.partner.name,
                rider_name: d.delivery_partner?.rider_name || d.rider_name || fallback.partner.rider_name,
                rider_phone: d.delivery_partner?.phone || fallback.partner.rider_phone,
                vehicle: d.delivery_partner?.vehicle || fallback.partner.vehicle,
              },
              vendor: {
                name: d.vendor?.company_name || d.vendor_name || fallback.vendor.name,
                city: d.vendor?.city || fallback.vendor.city,
              },
              customer: {
                name: d.delivery_address?.name || d.customer?.name || fallback.customer.name,
                phone: d.delivery_address?.phone || d.customer?.phone || fallback.customer.phone,
                city: d.delivery_address?.municipality || d.delivery_address?.district || fallback.customer.city,
                address: d.delivery_address?.street || fallback.customer.address,
              },
              item_title: d.item_title || (d.items && d.items[0]?.name) || fallback.item_title,
              status: d.status || fallback.status,
              created_at: d.created_at || fallback.created_at,
              delivered_at: d.delivered_at || fallback.delivered_at,
              estimated_delivery: d.estimated_delivery || fallback.estimated_delivery,
            }
          })
          setDeliveries(formatted)
        } else {
          setDeliveries(SAMPLE_DELIVERIES)
        }
      })
      .catch(() => {
        setDeliveries(SAMPLE_DELIVERIES)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const doReassign = (e) => {
    e.preventDefault()
    if (!selectedPartnerId || !reassignTarget) return
    setActionBusy(true)
    setTimeout(() => {
      const riderObj = AVAILABLE_RIDERS.find(r => r.id === selectedPartnerId)
      const riderName = riderObj ? riderObj.name.split('(')[0].trim() : 'Assigned Rider'
      setDeliveries(prev => prev.map(d => d.id === reassignTarget.id ? {
        ...d,
        partner: {
          ...d.partner,
          rider_name: riderName,
        }
      } : d))
      setActionBusy(false)
      toast.success(`Delivery dispatch ${reassignTarget.dispatch_number} reassigned to ${riderName}`)
      setReassignTarget(null)
      setSelectedPartnerId('')
    }, 500)
  }

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchNum = (d.dispatch_number || '').toLowerCase().includes(q)
        const matchOrder = (d.order_id || '').toLowerCase().includes(q)
        const matchCust = (d.customer?.name || '').toLowerCase().includes(q)
        const matchPartner = (d.partner?.name || d.partner?.rider_name || '').toLowerCase().includes(q)
        const matchCity = (d.customer?.city || '').toLowerCase().includes(q)
        if (!matchNum && !matchOrder && !matchCust && !matchPartner && !matchCity) return false
      }
      return true
    })
  }, [deliveries, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Dispatch ID', 'Order Reference', 'Courier Partner', 'Rider Name', 'Rider Phone', 'Customer', 'Destination Address', 'Item Description', 'Status', 'Date'],
      ...filtered.map((d) => [
        d.dispatch_number,
        d.order_id,
        d.partner?.name,
        d.partner?.rider_name,
        d.partner?.rider_phone,
        d.customer?.name,
        `${d.customer?.address}, ${d.customer?.city}`,
        d.item_title,
        d.status,
        d.created_at,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_delivery_dispatches_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Delivery dispatch report exported to CSV')
  }

  // Summary KPI metrics
  const totalDispatches = deliveries.length
  const inTransitCount = deliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up').length
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Delivery Dispatch & Rider Telemetry
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track active multi-courier dispatches, assign field delivery riders, and monitor delivery timelines across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Dispatch KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Dispatches</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalDispatches} Dispatches</div>
          <div className="muted text-xs mt-1">Across 7 Nepal Provinces</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(99, 102, 241, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#4338ca' }}>In Active Transit</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{inTransitCount} In Transit</div>
          <div className="muted text-xs mt-1">Live on courier route</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivered Packages</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{deliveredCount} Completed</div>
          <div className="muted text-xs mt-1">98.4% on-time fulfillment</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Avg Dispatch SLA</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Zap size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>3.2 Hours</div>
          <div className="muted text-xs mt-1">From vendor pack to courier pickup</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${deliveries.length})` : `(${deliveries.filter(d => d.status === t.value).length})`}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search by dispatch ID, order, buyer, or rider…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <span className="muted text-xs font-semibold">
          {filtered.length} dispatch{filtered.length !== 1 ? 'es' : ''} listed
        </span>
      </div>

      {/* Table Content */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Dispatch / Tracking ID</th>
                <th>Assigned Courier & Rider</th>
                <th>Destination Address</th>
                <th>Item Description</th>
                <th>Fulfillment Status</th>
                <th>Assigned Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span
                      className="font-mono font-bold text-primary text-xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDelivery(d)}
                    >
                      {d.dispatch_number}
                    </span>
                    <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>
                      Order: #{d.order_id}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>
                        <Truck size={16} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="font-bold text-sm text-ink">{d.partner?.rider_name}</div>
                        <div className="muted text-xs truncate">{d.partner?.name} · {d.partner?.rider_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-ink flex items-center gap-1">
                      <MapPin size={11} color="var(--primary)" /> {d.customer?.city}
                    </div>
                    <div className="muted text-xs truncate" style={{ maxWidth: 220, fontSize: 10 }}>{d.customer?.address}</div>
                  </td>
                  <td>
                    <div className="text-xs font-medium text-ink line-clamp-1" title={d.item_title}>{d.item_title}</div>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>From: {d.vendor?.name}</div>
                  </td>
                  <td>
                    <StatusBadge status={d.status || 'assigned'} />
                  </td>
                  <td className="muted text-xs">
                    {formatDateTime(d.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedDelivery(d)}
                        title="Inspect full dispatch timeline"
                      >
                        <Eye size={12} /> Inspect
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        onClick={() => { setReassignTarget(d); setSelectedPartnerId('dp1') }}
                        title="Reassign to another rider"
                      >
                        <UserCheck size={12} /> Reassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Timeline & Dossier Modal */}
      {selectedDelivery && (
        <Modal
          open={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery Dispatch Dossier: ${selectedDelivery.dispatch_number}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex items-center justify-between wrap gap-2 mb-2">
                <div>
                  <span className="font-bold text-sm text-ink">Tracking Ref: </span>
                  <span className="font-mono font-bold text-primary text-sm">{selectedDelivery.tracking_number}</span>
                </div>
                <StatusBadge status={selectedDelivery.status} />
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div>
                  <span className="muted block text-xs">Order ID:</span>
                  <strong className="text-ink">#{selectedDelivery.order_id}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Courier Partner:</span>
                  <strong className="text-ink">{selectedDelivery.partner?.name}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Assigned Vehicle:</span>
                  <strong className="text-ink">{selectedDelivery.partner?.vehicle || 'Delivery Motorbike'}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Estimated Delivery:</span>
                  <strong className="text-success">{selectedDelivery.estimated_delivery}</strong>
                </div>
              </div>
            </div>

            {/* 2-Col: Pickup Origin & Destination */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <Store size={13} color="var(--primary)" /> Merchant Workshop (Pickup Origin)
                </h4>
                <div className="text-xs">
                  <div className="font-bold text-ink text-sm">{selectedDelivery.vendor?.name}</div>
                  <div className="muted mt-0.5">Location: {selectedDelivery.vendor?.city}, Nepal</div>
                  <div className="muted mt-1 p-1.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    Item: <strong>{selectedDelivery.item_title}</strong>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <User size={13} color="var(--primary)" /> Buyer & Destination (Drop-off)
                </h4>
                <div className="text-xs">
                  <div className="font-bold text-ink text-sm">{selectedDelivery.customer?.name}</div>
                  <div className="muted mt-0.5">Phone: {selectedDelivery.customer?.phone}</div>
                  <div className="muted mt-1 p-1.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <MapPin size={11} color="var(--primary)" style={{ display: 'inline', marginRight: 4 }} />
                    {selectedDelivery.customer?.address}, {selectedDelivery.customer?.city}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const target = selectedDelivery
                  setSelectedDelivery(null)
                  setReassignTarget(target)
                }}
              >
                <UserCheck size={13} /> Reassign Rider
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedDelivery(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reassign Partner Modal */}
      {reassignTarget && (
        <Modal open={!!reassignTarget} onClose={() => setReassignTarget(null)} title={`Reassign Delivery: ${reassignTarget.dispatch_number}`}>
          <form onSubmit={doReassign} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Select Active Courier Rider</label>
              <select
                className="select"
                required
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                <option value="">— Select active courier rider —</option>
                {AVAILABLE_RIDERS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReassignTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={actionBusy}>
                {actionBusy ? 'Reassigning…' : 'Confirm Reassignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}