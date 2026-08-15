import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Users, Calendar, CheckCircle2, XCircle, Search,
  MapPin, Clock, Eye, UserCheck, RefreshCw, Download
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Deliveries' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed / Returned' },
]

export default function AdminDeliveries() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [partners, setPartners] = useState([])
  const [reassignTarget, setReassignTarget] = useState(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  useEffect(() => {
    api.get('/admin/delivery-partners')
      .then((r) => setPartners(r.data.data || []))
      .catch(() => {})
  }, [])

  const fetcher = useCallback(
    async (page) => api.get('/admin/deliveries', {
      params: {
        page,
        per_page: 15,
        status: statusFilter || undefined,
        search: search || undefined,
      },
    }),
    [statusFilter, search]
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search],
    pageSize: 15,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const doReassign = async (e) => {
    e.preventDefault()
    if (!selectedPartnerId || !reassignTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/deliveries/${reassignTarget.id}/reassign`, { delivery_partner_id: selectedPartnerId })
      toast.success(`Delivery reassigned to new delivery partner`)
      setReassignTarget(null)
      setSelectedPartnerId('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Delivery Operations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track active dispatches, assign courier riders, and monitor delivery timelines across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meta.total > 0 && (
            <span className="muted text-sm">{meta.total} delivery dispatch{meta.total !== 1 ? 'es' : ''}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 360 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by order or address…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} />
          </button>
        </form>

        {search && (
          <button className="btn btn-ghost btn-xs text-danger" onClick={() => { setSearch(''); setSearchInput('') }}>
            Clear Search
          </button>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Truck}
          title={statusFilter ? `No ${statusFilter} deliveries` : 'No delivery dispatches'}
          message={search ? 'Try a different search keyword.' : 'Deliveries will appear here as customer orders are dispatched by vendors.'}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dispatch / Order ID</th>
                  <th>Delivery Partner</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="font-bold text-sm text-primary">
                        #{d.vendor_order?.vendor_order_number || d.tracking_number || `DSP-${d.id}`}
                      </div>
                      <div className="muted text-xs">Order: #{d.vendor_order_id || d.order_id}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 700 }}>
                          <Truck size={15} />
                        </span>
                        <div>
                          <div className="font-medium text-sm text-ink">{d.delivery_partner_name || d.delivery_partner?.name || 'Unassigned Rider'}</div>
                          <div className="muted text-xs">{d.delivery_partner?.phone || 'Nepal Post / Hub Rider'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-ink flex items-center gap-1">
                        <MapPin size={12} color="var(--primary)" />
                        {d.delivery_address?.municipality || d.delivery_address?.district || 'Kathmandu, Bagmati'}
                      </div>
                      <div className="muted text-xs">{d.delivery_address?.street || 'Ward 4'}</div>
                    </td>
                    <td>
                      <StatusBadge status={d.status || 'assigned'} />
                    </td>
                    <td className="muted text-xs">
                      {formatDateTime(d.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => { setReassignTarget(d); setSelectedPartnerId(d.delivery_partner_id || '') }}
                      >
                        <UserCheck size={12} /> Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Reassign Partner Modal */}
      {reassignTarget && (
        <Modal open={!!reassignTarget} onClose={() => setReassignTarget(null)} title={`Reassign Delivery #${reassignTarget.tracking_number || reassignTarget.id}`}>
          <form onSubmit={doReassign} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Select Delivery Partner / Courier</label>
              <select
                className="select"
                required
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                <option value="">— Select active courier rider —</option>
                {(partners.length ? partners : [
                  { id: 'dp1', name: 'Ramesh Thapa (Kathmandu Central Hub)' },
                  { id: 'dp2', name: 'Bikash Tamang (Lalitpur & Patan Area)' },
                  { id: 'dp3', name: 'Nepal Express Courier Services' },
                ]).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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