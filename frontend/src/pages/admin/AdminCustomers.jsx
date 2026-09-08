import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, Eye, CheckCircle2, Ban, Phone, Mail,
  Download, Trash2, ShieldCheck, RefreshCw, X, User
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate, formatDateTime, timeAgo, initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminCustomers() {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'suspend' | 'activate' | 'delete'
    customer: null,
    loading: false
  })

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const params = { role: 'customer', page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/users', { params })
      const data = api.unwrapList(res.data)
      setCustomers(data)
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
      toast.error('Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [page, statusFilter])

  const handleAction = (action, customer) => {
    setDialogState({
      isOpen: true,
      action,
      customer,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, customer } = dialogState
    if (!customer) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = customer.uuid || customer.id

    try {
      if (action === 'suspend') {
        await api.post(`/admin/users/${targetId}/suspend`, { reason })
        toast.success(`Customer "${customer.full_name || customer.name}" account suspended.`)
      } else if (action === 'activate') {
        await api.post(`/admin/users/${targetId}/activate`)
        toast.success(`Customer "${customer.full_name || customer.name}" activated.`)
      } else if (action === 'delete') {
        await api.delete(`/admin/users/${targetId}`)
        toast.success(`Customer account deleted permanently.`)
      }

      setDialogState({ isOpen: false, action: null, customer: null, loading: false })
      if (selectedCustomer && (selectedCustomer.id === customer.id || selectedCustomer.uuid === customer.uuid)) {
        setSelectedCustomer(null)
      }
      loadCustomers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Customer ID', 'Full Name', 'Email', 'Phone', 'Status', 'Registered At'],
      ...customers.map(c => [
        c.id,
        `"${c.full_name || c.name || ''}"`,
        c.email || '',
        c.phone || '',
        c.status || '',
        formatDate(c.created_at)
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_customers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Customers exported to CSV.')
  }

  const columns = [
    {
      header: 'Customer',
      render: item => {
        const name = item.full_name || item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Customer'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {initials(name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>User ID: #{item.id}</div>
            </div>
          </div>
        )
      }
    },
    {
      header: 'Contact Information',
      render: item => (
        <div style={{ fontSize: 12 }}>
          <div>{item.email || '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>{item.phone || 'No phone registered'}</div>
        </div>
      )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status || 'active'} />
    },
    {
      header: 'Registered',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isActive = item.status === 'active'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setSelectedCustomer(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={12} /> Inspect
            </button>

            {isActive ? (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => handleAction('suspend', item)}
                title="Suspend Customer"
              >
                <Ban size={12} /> Suspend
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => handleAction('activate', item)}
                title="Activate Customer"
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
        title="Customer Accounts & Profiles"
        description="Monitor marketplace consumer profiles, order histories, contact records, and account governance."
        breadcrumbs={[
          { label: 'Customers', to: '/admin/customers' },
          { label: 'All Customers' }
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
              onClick={loadCustomers}
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
        searchPlaceholder="Search customer by name, email, phone..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'active', label: 'Active Consumers' },
          { value: 'suspended', label: 'Suspended Accounts' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No customer accounts found"
        emptyDescription="There are no consumers matching your search criteria."
      />

      {/* Customer Profile Modal */}
      {selectedCustomer && (
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
          onClick={e => { if (e.target === e.currentTarget) setSelectedCustomer(null) }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', color: 'var(--primary)', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {initials(selectedCustomer.full_name || selectedCustomer.name || 'C')}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    {selectedCustomer.full_name || selectedCustomer.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>User ID: #{selectedCustomer.id}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Email Address:</span>
                <span style={{ fontWeight: 600 }}>{selectedCustomer.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Mobile Number:</span>
                <span style={{ fontWeight: 600 }}>{selectedCustomer.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Account Status:</span>
                <StatusBadge status={selectedCustomer.status || 'active'} />
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Registration Date:</span>
                <span>{formatDateTime(selectedCustomer.created_at)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <Link
                to={`/admin/orders?search=${encodeURIComponent(selectedCustomer.email || selectedCustomer.phone || '')}`}
                className="btn btn-outline btn-xs"
              >
                View Customer Orders →
              </Link>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, customer: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'suspend'
            ? `Suspend Customer "${dialogState.customer?.full_name || dialogState.customer?.name}"?`
            : dialogState.action === 'activate'
            ? `Reactivate Customer "${dialogState.customer?.full_name || dialogState.customer?.name}"?`
            : `Delete Customer Account?`
        }
        message={
          dialogState.action === 'suspend'
            ? 'Suspending will prevent this user from logging in and placing new orders.'
            : dialogState.action === 'activate'
            ? 'Reactivating will restore the customer account.'
            : 'Are you sure? This action cannot be undone.'
        }
        variant={dialogState.action === 'suspend' || dialogState.action === 'delete' ? 'danger' : 'success'}
        confirmText={
          dialogState.action === 'suspend' ? 'Suspend Account' : dialogState.action === 'activate' ? 'Reactivate' : 'Delete Account'
        }
        requireReason={dialogState.action === 'suspend'}
        reasonPlaceholder="Provide the administrative reason for suspension..."
      />
    </div>
  )
}
