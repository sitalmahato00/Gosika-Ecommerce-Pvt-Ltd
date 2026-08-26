import React, { useEffect, useState } from 'react'
import {
  Truck, CheckCircle2, XCircle, AlertCircle, Clock, Eye,
  Phone, Mail, MapPin, Plus, ShieldCheck, Ban, UserCheck,
  RefreshCw, User
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDeliveryPartners() {
  const toast = useToast()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle_type: 'Motorcycle',
    vehicle_number: '',
    service_areas: '',
    password: '',
  })

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'suspend' | 'activate'
    partner: null,
    loading: false
  })

  const loadPartners = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/delivery-partners', { params })
      setPartners(res.data?.data || [])
    } catch (err) {
      toast.error('Failed to load delivery partners.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [statusFilter])

  const handleAction = (action, partner) => {
    setDialogState({
      isOpen: true,
      action,
      partner,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, partner } = dialogState
    if (!partner) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = partner.uuid || partner.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/delivery-partners/${targetId}/approve`)
        toast.success(`Delivery partner "${partner.name}" approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/delivery-partners/${targetId}/reject`, { reason })
        toast.success(`Delivery partner rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/delivery-partners/${targetId}/suspend`, { reason })
        toast.success(`Delivery partner suspended.`)
      } else if (action === 'activate') {
        await api.post(`/admin/delivery-partners/${targetId}/activate`)
        toast.success(`Delivery partner activated.`)
      }

      setDialogState({ isOpen: false, action: null, partner: null, loading: false })
      loadPartners()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.email) {
      toast.error('Please fill in all required fields.')
      return
    }

    setCreating(true)
    try {
      await api.post('/admin/delivery-partners', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number,
        service_areas: form.service_areas ? form.service_areas.split(',').map(s => s.trim()) : ['Kathmandu Valley'],
        password: form.password || 'password123'
      })
      toast.success('New delivery partner registered successfully!')
      setCreateOpen(false)
      setForm({ name: '', email: '', phone: '', vehicle_type: 'Motorcycle', vehicle_number: '', service_areas: '', password: '' })
      loadPartners()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register delivery partner.')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      header: 'Rider / Partner',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{item.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {item.email} · {item.phone}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Vehicle Details',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink)' }}>
            {item.vehicle_type || 'Vehicle'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
            {item.vehicle_number || 'Plate not registered'}
          </div>
        </div>
      )
    },
    {
      header: 'Service Hub',
      render: item => {
        const areas = Array.isArray(item.service_areas) ? item.service_areas.join(', ') : (item.service_areas || 'Kathmandu')
        return (
          <span style={{ fontSize: 12, color: '#334155' }} title={areas}>
            {areas}
          </span>
        )
      }
    },
    {
      header: 'Duty Status',
      render: item => (
        <span
          className="chip chip-sm"
          style={{
            background: item.is_online ? '#dcfce7' : '#f1f5f9',
            color: item.is_online ? '#16a34a' : '#64748b',
            fontWeight: 800,
            fontSize: 11
          }}
        >
          {item.is_online ? '● Online (On Duty)' : 'Offline'}
        </span>
      )
    },
    {
      header: 'Verification Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isPending = item.status === 'pending'
        const isActive = item.status === 'active' || item.status === 'approved'
        const isSuspended = item.status === 'suspended'

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve Rider"
                >
                  <CheckCircle2 size={12} style={{ marginRight: 3 }} /> Approve
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                  title="Reject Application"
                >
                  <XCircle size={12} /> Reject
                </button>
              </>
            )}

            {isActive && (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => handleAction('suspend', item)}
              >
                Suspend
              </button>
            )}

            {isSuspended && (
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => handleAction('activate', item)}
              >
                Reactivate
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Delivery Fleet & Partners"
        description="Manage registered delivery personnel, dispatch couriers, vehicle compliance, and verification."
        breadcrumbs={[
          { label: 'Fulfillment', to: '/admin/fulfillment/partners' },
          { label: 'Delivery Partners' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setCreateOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Plus size={14} /> Register Partner
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadPartners}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by rider name, phone, plate #..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'active', label: 'Active & Verified' },
          { value: 'pending', label: 'Pending Approval' },
          { value: 'suspended', label: 'Suspended' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={partners}
        loading={loading}
        emptyTitle="No delivery partners found"
        emptyDescription="There are no delivery partners matching your criteria."
      />

      {/* Register Partner Modal */}
      {createOpen && (
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
          onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
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
                Register New Delivery Partner
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setCreateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Full Name *</label>
                <input
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Rider's full legal name"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Email Address *</label>
                  <input
                    type="email"
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="rider@gosika.com.np"
                    required
                  />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Mobile Phone *</label>
                  <input
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Vehicle Type</label>
                  <select
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={form.vehicle_type}
                    onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Van / Truck">Van / Mini-Truck</option>
                  </select>
                </div>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>License Plate #</label>
                  <input
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={form.vehicle_number}
                    onChange={e => setForm({ ...form, vehicle_number: e.target.value })}
                    placeholder="BA 2 PA 1234"
                  />
                </div>
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Service Hub Areas (comma separated)</label>
                <input
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 13 }}
                  value={form.service_areas}
                  onChange={e => setForm({ ...form, service_areas: e.target.value })}
                  placeholder="Kathmandu, Lalitpur, Bhaktapur"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                  {creating ? 'Registering...' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, partner: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Partner "${dialogState.partner?.name}"?`
            : dialogState.action === 'reject'
            ? `Reject Application for "${dialogState.partner?.name}"?`
            : `Suspend Partner "${dialogState.partner?.name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will grant active dispatch access to receive delivery assignments.'
            : 'Please specify the reason for rejecting or suspending this delivery partner.'
        }
        variant={dialogState.action === 'approve' || dialogState.action === 'activate' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve Rider' : dialogState.action === 'reject' ? 'Reject' : 'Suspend'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Provide the administrative explanation..."
      />
    </div>
  )
}