import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Eye, CheckCircle2, XCircle, Search, Download } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Vendors' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved / Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminVendors() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const { items, meta, page, setPage, loading, error, reload } = useList(
    (targetPage, perPage) =>
      api.get('/admin/vendors', {
        params: {
          page: targetPage,
          per_page: perPage,
          ...(statusFilter && { status: statusFilter }),
          ...(search && { search }),
        },
      }),
    { deps: [statusFilter, search], pageSize: 15 },
  )

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const doApprove = async (vendor) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendor.id}/approve`)
      toast.success(`Approved "${vendor.company_name}"`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve vendor.'))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${rejectTarget.id}/reject`, { reason: rejectReason || 'Application rejected by administration.' })
      toast.success(`Rejected "${rejectTarget.company_name}"`)
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject vendor.'))
    } finally {
      setActionBusy(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Vendor ID', 'Company Name', 'Email', 'Phone', 'Commission Rate (%)', 'Status', 'Joined Date'],
      ...items.map((v) => [
        v.id,
        v.company_name,
        v.business_email,
        v.business_phone,
        v.commission_rate,
        v.status,
        formatDate(v.created_at),
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_vendors_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Vendor list exported to CSV')
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor marketplace partners, review their applications, and manage vendor compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => { setStatusFilter(t.value); setPage(1) }}
            aria-pressed={statusFilter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search vendors or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} />
          </button>
        </form>

        {search && (
          <button
            className="btn btn-ghost btn-xs text-danger"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
          >
            Clear Search
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={75} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, 'Failed to load vendors.')} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Store}
          title={search || statusFilter ? 'No vendors match your filters' : 'No vendors in this category'}
          message={search || statusFilter ? 'Try changing the status tab or search keyword.' : 'Registered vendor partners will appear here.'}
          action={
            <button className="btn btn-outline" onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput('') }}>
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Business Type</th>
                <th>Status</th>
                <th>Commission</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => {
                const isPending = v.status === 'pending' || v.status === 'under_review'
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="avatar"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius)',
                            background: 'var(--primary-50)',
                            color: 'var(--primary)',
                            flexShrink: 0
                          }}
                        >
                          <Store size={20} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/admin/vendors/${v.id}`} className="font-bold text-sm text-ink hover:text-primary">
                            {v.company_name}
                          </Link>
                          <div className="muted text-xs">
                            {v.business_email} {v.business_phone ? `· ${v.business_phone}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip chip-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
                        {v.kyc?.business_type || '—'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <span className="font-bold text-ink">{v.commission_rate ?? '—'}%</span>
                    </td>
                    <td className="muted text-xs">
                      {formatDate(v.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Link to={`/admin/vendors/${v.id}`} className="btn btn-outline btn-xs" title="View details">
                          <Eye size={12} /> View
                        </Link>
                        {isPending && (
                          <>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => doApprove(v)}
                              disabled={actionBusy}
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button
                              className="btn btn-danger-outline btn-xs"
                              onClick={() => setRejectTarget(v)}
                              disabled={actionBusy}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}

      {rejectTarget && (
        <ConfirmDialog
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={doReject}
          danger
          loading={actionBusy}
          title={`Reject Application for "${rejectTarget.company_name}"?`}
          message="Please state a reason why this vendor application cannot be approved."
          confirmText="Confirm Rejection"
        >
          <div style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Incomplete KYC documentation or unverified business registration number."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
