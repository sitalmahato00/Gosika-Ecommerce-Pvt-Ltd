import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store, Eye, Check, X, ShieldAlert, CheckCircle2,
  RefreshCw, Download, Store as StoreIcon, ShieldCheck
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminVendors() {
  const toast = useToast()
  const navigate = useNavigate()

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'suspend' | 'activate'
    vendor: null,
    loading: false
  })

  const loadVendors = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/vendors', { params })
      const data = api.unwrapList(res.data)
      setVendors(data)
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
      toast.error('Failed to load vendors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [page, statusFilter])

  const handleAction = (action, vendor) => {
    setDialogState({
      isOpen: true,
      action,
      vendor,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, vendor } = dialogState
    if (!vendor) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = vendor.uuid || vendor.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/vendors/${targetId}/approve`)
        toast.success(`Vendor "${vendor.company_name}" approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/vendors/${targetId}/reject`, { reason })
        toast.success(`Vendor "${vendor.company_name}" application rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/vendors/${targetId}/suspend`, { reason })
        toast.success(`Vendor "${vendor.company_name}" suspended.`)
      } else if (action === 'activate') {
        await api.post(`/admin/vendors/${targetId}/activate`)
        toast.success(`Vendor "${vendor.company_name}" activated.`)
      }

      setDialogState({ isOpen: false, action: null, vendor: null, loading: false })
      loadVendors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Vendor ID', 'Company Name', 'Email', 'Phone', 'PAN/VAT', 'Commission Rate (%)', 'Status', 'Registered At'],
      ...vendors.map((v) => [
        v.id,
        `"${v.company_name || ''}"`,
        v.business_email || '',
        v.business_phone || '',
        v.pan_vat || '',
        v.commission_rate ?? '',
        v.status || '',
        formatDate(v.created_at),
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_vendors_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Vendors exported to CSV.')
  }

  const columns = [
    {
      header: 'Vendor & Store',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#eff6ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <Link
              to={`/admin/marketplace/vendors/${item.uuid || item.id}`}
              style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              className="hover:text-primary"
            >
              {item.company_name}
            </Link>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {item.business_email} {item.business_phone ? `· ${item.business_phone}` : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'PAN / VAT',
      render: item => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
          {item.pan_vat || '—'}
        </span>
      )
    },
    {
      header: 'KYC Status',
      render: item => {
        const kycStatus = item.kyc?.status || 'draft'
        return <StatusBadge status={kycStatus} />
      }
    },
    {
      header: 'Storefronts',
      render: item => {
        const count = item.stores?.length || 0
        return (
          <span className="chip chip-sm" style={{ fontSize: 11, fontWeight: 700, background: '#f8fafc' }}>
            {count} {count === 1 ? 'store' : 'stores'}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Commission',
      render: item => (
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
          {item.commission_rate !== null && item.commission_rate !== undefined ? `${item.commission_rate}%` : 'Default'}
        </span>
      )
    },
    {
      header: 'Joined',
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
        const isPending = item.status === 'pending' || item.status === 'under_review'
        const isActive = item.status === 'approved' || item.status === 'active'
        const isSuspended = item.status === 'suspended'

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Link
              to={`/admin/marketplace/vendors/${item.uuid || item.id}`}
              className="btn btn-outline btn-xs"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={12} /> Detail
            </Link>

            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                >
                  <X size={12} /> Reject
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
        title="Vendor Management"
        description="Monitor merchant applications, verify KYC, regulate commission agreements, and control selling status."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Vendors' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadVendors}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by vendor name, email, phone..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'approved', label: 'Approved & Active' },
          { value: 'pending', label: 'Pending Review' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={item => navigate(`/admin/marketplace/vendors/${item.uuid || item.id}`)}
        emptyTitle="No vendors found"
        emptyDescription="No registered merchant accounts match your selected filter criteria."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, vendor: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Merchant "${dialogState.vendor?.company_name}"?`
            : dialogState.action === 'reject'
            ? `Reject Application for "${dialogState.vendor?.company_name}"?`
            : dialogState.action === 'suspend'
            ? `Suspend Vendor "${dialogState.vendor?.company_name}"?`
            : `Reactivate Vendor "${dialogState.vendor?.company_name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will grant this merchant active selling status and create their default store.'
            : dialogState.action === 'reject'
            ? 'Rejecting will decline this application. Please specify the reason.'
            : dialogState.action === 'suspend'
            ? 'Suspending will disable all stores and products associated with this vendor immediately.'
            : 'Reactivating will restore the vendor and their active storefronts.'
        }
        variant={dialogState.action === 'approve' || dialogState.action === 'activate' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve Vendor' : dialogState.action === 'reject' ? 'Reject Application' : dialogState.action === 'suspend' ? 'Suspend Vendor' : 'Reactivate Vendor'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Provide the administrative reason for this action..."
      />
    </div>
  )
}
