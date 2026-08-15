import React, { useEffect, useState, useMemo } from 'react'
import {
  Truck, Clock, CheckCircle2, Search, MapPin, Eye, UserCheck,
  Download, User, Store, Phone
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Deliveries' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed / Returned' },
]

const TIMELINE_FIELDS = [
  ['Assigned', 'assigned_at'],
  ['Accepted', 'accepted_at'],
  ['Picked Up', 'picked_up_at'],
  ['Out for Delivery', 'out_for_delivery_at'],
  ['Delivered', 'delivered_at'],
  ['Failed', 'failed_at'],
]

export default function AdminDeliveries() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [deliveryDetail, setDeliveryDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reassignTarget, setReassignTarget] = useState(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [partners, setPartners] = useState([])

  useEffect(() => {
    api.get('/admin/delivery-partners', { params: { per_page: 100 } })
      .then((r) => setPartners(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(() => setPartners([]))
  }, [])

  const fetcher = (page) => {
    const params = { page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    return api.get('/admin/deliveries', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter],
    pageSize: 15,
  })

  useEffect(() => {
    if (!selectedDelivery) return
    setDetailLoading(true)
    setDeliveryDetail(null)
    api.get(`/admin/deliveries/${selectedDelivery.id}`)
      .then((r) => setDeliveryDetail(r.data.data || null))
      .catch(() => setDeliveryDetail(null))
      .finally(() => setDetailLoading(false))
  }, [selectedDelivery])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const doReassign = async (e) => {
    e.preventDefault()
    if (!selectedPartnerId || !reassignTarget || actionBusy) return
    setActionBusy(true)
    try {
      await api.post(`/admin/deliveries/${reassignTarget.id}/reassign`, { delivery_partner_id: selectedPartnerId })
      toast.success(`Delivery dispatch ${reassignTarget.vendor_order_number} reassigned`)
      setReassignTarget(null)
      setSelectedPartnerId('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter((d) => {
      const matchNum = (d.vendor_order_number || '').toLowerCase().includes(q)
      const matchOrder = (d.vendor_order_id || '').toLowerCase().includes(q)
      const matchCust = (d.recipient_name || '').toLowerCase().includes(q)
      const matchPartner = (d.delivery_partner_name || '').toLowerCase().includes(q)
      const matchAddress = (d.dropoff_address || '').toLowerCase().includes(q)
      return matchNum || matchOrder || matchCust || matchPartner || matchAddress
    })
  }, [items, search])

  const exportCSV = () => {
    const rows = [
      ['Dispatch ID', 'Vendor Order Ref', 'Courier Partner', 'Recipient', 'Recipient Phone', 'Dropoff Address', 'COD (NPR)', 'Delivery Fee (NPR)', 'Status', 'Assigned At'],
      ...filtered.map((d) => [
        d.vendor_order_number,
        d.vendor_order_id,
        d.delivery_partner_name,
        d.recipient_name,
        d.recipient_phone,
        d.dropoff_address,
        d.cod_amount,
        d.delivery_fee,
        d.status,
        d.assigned_at || d.created_at,
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

  const totalDispatches = meta.total
  const inTransitCount = items.filter((d) => ['assigned', 'accepted', 'picked_up', 'out_for_delivery'].includes(d.status)).length
  const deliveredCount = items.filter((d) => d.status === 'delivered').length
  const failedCount = items.filter((d) => d.status === 'failed' || d.status === 'returned_to_vendor').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
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

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Dispatches</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalDispatches} Dispatches</div>
          <div className="muted text-xs mt-1">Across all courier partners</div>
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
          <div className="muted text-xs mt-1">On this page</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Failed / Returned</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{failedCount} Failed</div>
          <div className="muted text-xs mt-1">On this page</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${totalDispatches})` : `(${items.filter((d) => d.status === t.value).length})`}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search by dispatch ID, order, recipient, or rider…"
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !filtered.length ? (
        <EmptyState
          icon={Truck}
          title={search ? 'No dispatches match your search' : 'No deliveries found'}
          message={search ? 'Try searching with another dispatch ID, recipient, or rider.' : 'Delivery assignments will appear here once orders are dispatched to couriers.'}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Dispatch Reference</th>
                  <th>Assigned Courier</th>
                  <th>Recipient & Destination</th>
                  <th>Fees & Pickup Origin</th>
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
                        {d.vendor_order_number || d.id}
                      </span>
                      <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>
                        Ref: {d.vendor_order_id ? d.vendor_order_id.slice(0, 8) : '—'}…
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>
                          <Truck size={16} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-bold text-sm text-ink">{d.delivery_partner_name || 'Unassigned'}</div>
                          <div className="muted text-xs">COD: {money(d.cod_amount)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-ink flex items-center gap-1">
                        <MapPin size={11} color="var(--primary)" /> {d.recipient_name || '—'}
                      </div>
                      <div className="muted text-xs truncate" style={{ maxWidth: 220, fontSize: 10 }}>{d.dropoff_address}</div>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-ink">Fee: {money(d.delivery_fee)}</div>
                      <div className="muted text-xs truncate" style={{ maxWidth: 220, fontSize: 10 }}>From: {d.pickup_address}</div>
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="muted text-xs">
                      {formatDateTime(d.assigned_at || d.created_at)}
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
                          onClick={() => { setReassignTarget(d); setSelectedPartnerId('') }}
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
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}

      {selectedDelivery && (
        <Modal
          open={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery Dispatch Dossier: ${selectedDelivery.vendor_order_number}`}
          size="lg"
        >
          {detailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={56} />)}
            </div>
          ) : !deliveryDetail ? (
            <p className="muted text-sm m-0">Could not load delivery details. Please try again.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
                <div className="flex items-center justify-between wrap gap-2 mb-2">
                  <div>
                    <span className="font-bold text-sm text-ink">Dispatch: </span>
                    <span className="font-mono font-bold text-primary text-sm">{deliveryDetail.vendor_order_number}</span>
                  </div>
                  <StatusBadge status={deliveryDetail.status} />
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div>
                    <span className="muted block text-xs">Vendor Order ID:</span>
                    <strong className="text-ink font-mono text-xs">#{deliveryDetail.vendor_order_id ? deliveryDetail.vendor_order_id.slice(0, 8) : '—'}</strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">Courier Partner:</span>
                    <strong className="text-ink">{deliveryDetail.delivery_partner_name || '—'}</strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">COD Amount:</span>
                    <strong className="text-ink">{money(deliveryDetail.cod_amount)}</strong>
                  </div>
                  <div>
                    <span className="muted block text-xs">Delivery Fee:</span>
                    <strong className="text-ink">{money(deliveryDetail.delivery_fee)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: 14, margin: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                    <Store size={13} color="var(--primary)" /> Pickup Origin
                  </h4>
                  <p className="text-xs text-ink m-0">{deliveryDetail.pickup_address || '—'}</p>
                </div>

                <div className="card" style={{ padding: 14, margin: 0 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                    <User size={13} color="var(--primary)" /> Recipient & Drop-off
                  </h4>
                  <div className="text-xs">
                    <div className="font-bold text-ink text-sm">{deliveryDetail.recipient_name}</div>
                    <div className="muted mt-0.5 flex items-center gap-1">
                      <Phone size={11} /> {deliveryDetail.recipient_phone}
                    </div>
                    <div className="muted mt-1 p-1.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <MapPin size={11} color="var(--primary)" style={{ display: 'inline', marginRight: 4 }} />
                      {deliveryDetail.dropoff_address || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <Clock size={13} color="var(--primary)" /> Dispatch Timeline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {TIMELINE_FIELDS.map(([label, key]) => (
                    <div key={key} className="flex items-center justify-between text-xs" style={{ padding: '3px 0' }}>
                      <span className="muted">{label}</span>
                      <strong className="text-ink">{formatDateTime(deliveryDetail[key])}</strong>
                    </div>
                  ))}
                  {deliveryDetail.failure_reason && (
                    <div className="text-xs" style={{ padding: '3px 0', color: 'var(--danger)' }}>
                      Failure reason: {deliveryDetail.failure_reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <Truck size={13} color="var(--primary)" /> Tracking Events
                </h4>
                {(deliveryDetail.tracking || []).length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {deliveryDetail.tracking.map((t, idx) => (
                      <div key={t.id || idx} className="flex items-center justify-between text-xs" style={{ padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                        <span className="text-ink font-medium capitalize">{t.status}</span>
                        <span className="muted">{t.note} {t.tracked_at ? `· ${formatDateTime(t.tracked_at)}` : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted text-xs m-0">No tracking events recorded yet.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const target = deliveryDetail
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
          )}
        </Modal>
      )}

      {reassignTarget && (
        <Modal open={!!reassignTarget} onClose={() => setReassignTarget(null)} title={`Reassign Delivery: ${reassignTarget.vendor_order_number}`}>
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
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.phone ? ` · ${p.phone}` : ''}</option>
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
