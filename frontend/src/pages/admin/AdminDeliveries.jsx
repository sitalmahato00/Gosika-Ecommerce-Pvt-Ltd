import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Clock, CheckCircle2, Search, MapPin, Eye, UserCheck,
  Download, User, Store, Phone, RefreshCw, X, Send, AlertTriangle
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import StatusBadge from '../../components/commerce/StatusBadge'
import Timeline from '../../components/admin/Timeline'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDeliveries() {
  const toast = useToast()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [partners, setPartners] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [reassignTarget, setReassignTarget] = useState(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    api.get('/admin/delivery-partners', { params: { per_page: 100 } })
      .then(res => setPartners(res.data?.data || []))
      .catch(() => {})
  }, [])

  const loadDeliveries = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }

      const res = await api.get('/admin/deliveries', { params })
      const data = res.data?.data || []
      setDeliveries(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load delivery assignments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries()
  }, [page, statusFilter])

  const handleReassignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPartnerId || !reassignTarget) return

    setReassigning(true)
    try {
      const targetId = reassignTarget.uuid || reassignTarget.id
      await api.post(`/admin/deliveries/${targetId}/reassign`, {
        delivery_partner_id: selectedPartnerId
      })
      toast.success(`Delivery dispatch reassigned successfully!`)
      setReassignTarget(null)
      setSelectedPartnerId('')
      loadDeliveries()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign delivery rider.')
    } finally {
      setReassigning(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Assignment ID', 'Vendor Order #', 'Rider Name', 'Store', 'Customer Name', 'Delivery Status', 'Assigned At'],
      ...deliveries.map(d => [
        d.id,
        d.vendor_order_number || d.vendor_order?.vendor_order_number || '',
        `"${d.delivery_partner?.name || 'Unassigned'}"`,
        `"${d.store?.name || ''}"`,
        `"${d.customer?.full_name || ''}"`,
        d.status || '',
        formatDateTime(d.assigned_at || d.created_at)
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_deliveries_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Delivery assignments exported to CSV.')
  }

  const columns = [
    {
      header: 'Vendor Package',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
            #{item.vendor_order_number || item.vendor_order?.vendor_order_number || item.id}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Store: {item.store?.name || item.vendor_order?.store?.name || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Rider',
      render: item => {
        const partner = item.delivery_partner || item.deliveryPartner
        return partner ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{partner.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{partner.phone || partner.email}</div>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Unassigned</span>
        )
      }
    },
    {
      header: 'Recipient & Dropoff',
      render: item => {
        const customer = item.customer || item.vendor_order?.order?.customer
        const addr = item.shipping_address || item.vendor_order?.order?.shipping_address_snapshot
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
              {customer?.full_name || addr?.recipient_name || 'Customer'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 180 }} className="truncate">
              {addr?.city || addr?.municipality || 'Kathmandu'}
            </div>
          </div>
        )
      }
    },
    {
      header: 'Dispatch Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Assigned Date',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.assigned_at || item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setSelectedDelivery(item)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Eye size={12} /> Inspect
          </button>

          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              style={{ color: 'var(--primary)', fontWeight: 600 }}
              onClick={() => {
                setReassignTarget(item)
                setSelectedPartnerId(item.delivery_partner_id || '')
              }}
              title="Reassign Courier / Rider"
            >
              Reassign
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Delivery Assignments & Dispatch"
        description="Monitor real-time dispatch routes, rider allocations, and pickup to doorstep delivery fulfillment."
        breadcrumbs={[
          { label: 'Fulfillment', to: '/admin/fulfillment/partners' },
          { label: 'Assignments' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadDeliveries}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'assigned', label: 'Assigned to Rider' },
          { value: 'accepted', label: 'Accepted by Rider' },
          { value: 'picked_up', label: 'Picked Up from Merchant' },
          { value: 'out_for_delivery', label: 'Out for Delivery' },
          { value: 'delivered', label: 'Delivered to Customer' },
          { value: 'failed', label: 'Failed Attempt' },
        ]}
        onReset={() => setStatusFilter('all')}
      />

      <DataTable
        columns={columns}
        data={deliveries}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No delivery assignments"
        emptyDescription="There are no active fulfillment dispatches matching your filter."
      />

      {/* Inspect Dispatch Modal */}
      {selectedDelivery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedDelivery(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 600,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  Dispatch Details #{selectedDelivery.vendor_order_number || selectedDelivery.id}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Store: <strong>{selectedDelivery.store?.name || 'Marketplace Seller'}</strong>
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedDelivery(null)}>✕</button>
            </div>

            {/* Rider & Customer Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Delivery Personnel
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  {selectedDelivery.delivery_partner?.name || 'Unassigned'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Phone: {selectedDelivery.delivery_partner?.phone || '—'}
                </div>
              </div>

              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Recipient
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  {selectedDelivery.customer?.full_name || 'Customer'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Phone: {selectedDelivery.customer?.phone || '—'}
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
                Dispatch Milestones
              </h4>
              <Timeline
                events={[
                  { title: 'Assigned', description: 'Assigned to courier', status: 'assigned', created_at: selectedDelivery.assigned_at },
                  { title: 'Picked Up', description: 'Picked up from vendor store', status: 'picked_up', created_at: selectedDelivery.picked_up_at },
                  { title: 'Out for Delivery', description: 'En route to customer doorstep', status: 'out_for_delivery', created_at: selectedDelivery.out_for_delivery_at },
                  { title: 'Delivered', description: 'Handed over to customer', status: 'delivered', created_at: selectedDelivery.delivered_at },
                ]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedDelivery(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setReassignTarget(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Reassign Delivery Courier
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setReassignTarget(null)}>✕</button>
            </div>

            <form onSubmit={handleReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Select an active delivery partner to take over dispatch #{reassignTarget.vendor_order_number || reassignTarget.id}.
              </p>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Choose Delivery Partner *</label>
                <select
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600 }}
                  value={selectedPartnerId}
                  onChange={e => setSelectedPartnerId(e.target.value)}
                  required
                >
                  <option value="">Select a partner...</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.vehicle_type || 'Rider'} · {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setReassignTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={reassigning || !selectedPartnerId}>
                  {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
