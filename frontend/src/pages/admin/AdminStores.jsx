import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Check, X, Eye, RefreshCw, ExternalLink,
  Store as StoreIcon, ShieldAlert, CheckCircle2
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminStores() {
  const toast = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject'
    store: null,
    loading: false
  })

  const loadStores = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const res = await api.get('/admin/vendors/stores', { params })
      const data = api.unwrapList(res.data)
      setStores(data)
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
      toast.error('Failed to load marketplace stores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setPage(1)
    loadStores()
  }

  const handleAction = (action, store) => {
    setDialogState({
      isOpen: true,
      action,
      store,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, store } = dialogState
    if (!store) return

    setDialogState(prev => ({ ...prev, loading: true }))

    try {
      const storeId = store.uuid || store.id
      if (action === 'approve') {
        await api.post(`/admin/vendors/stores/${storeId}/approve`)
        toast.success(`Store "${store.name}" approved successfully!`)
      } else if (action === 'reject') {
        await api.post(`/admin/vendors/stores/${storeId}/reject`, { reason })
        toast.success(`Store "${store.name}" rejected/suspended.`)
      }

      setDialogState({ isOpen: false, action: null, store: null, loading: false })
      loadStores()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const columns = [
    {
      header: 'Storefront',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {item.logo ? (
              <img src={item.logo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <StoreIcon size={20} color="var(--primary)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              /{item.slug}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Vendor Owner',
      accessor: item => item.vendor?.company_name || '—',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
            {item.vendor?.company_name || 'Vendor'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {item.vendor?.business_email || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      render: item => (
        <div style={{ fontSize: 12 }}>
          <div>{item.contact_phone || '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>{item.contact_email || '—'}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Created',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <a
            href={`/store/${item.slug || item.id}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-xs"
            title="Preview Public Storefront"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ExternalLink size={12} /> Storefront
          </a>

          {item.status !== 'active' && item.status !== 'approved' && (
            <button
              type="button"
              className="btn btn-xs"
              style={{ background: '#16a34a', color: '#fff', border: 'none' }}
              onClick={() => handleAction('approve', item)}
            >
              <Check size={13} /> Approve
            </button>
          )}

          {item.status !== 'suspended' && item.status !== 'rejected' && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => handleAction('reject', item)}
            >
              <X size={13} /> Suspend
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Store Management"
        description="Monitor, approve, and regulate merchant storefronts on the GOSIKA marketplace."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Stores' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadStores}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search stores by name or slug..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'active', label: 'Active / Published' },
          { value: 'pending_approval', label: 'Pending Review' },
          { value: 'draft', label: 'Draft' },
          { value: 'suspended', label: 'Suspended' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={stores}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No stores found"
        emptyDescription="No vendor stores matched your current search and filter settings."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, store: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Storefront "${dialogState.store?.name}"?`
            : `Suspend Storefront "${dialogState.store?.name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will make this store publicly visible and eligible to receive customer orders.'
            : 'Suspension will hide this store from the catalog and pause its checkout ability.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={dialogState.action === 'approve' ? 'Approve Store' : 'Suspend Store'}
        requireReason={dialogState.action === 'reject'}
        reasonPlaceholder="Provide the reason for suspending this store..."
      />
    </div>
  )
}
